import express from 'express';
import mongoose from 'mongoose';
import Assignment from '../../models/Assignment.js';
import Submission from '../../models/Submission.js';
import User from '../../models/User.js';
import Class from '../../models/Class.js';
import Notification from '../../models/Notification.js';
import { authMiddleware, requireInstructor } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireInstructor);

router.get('/', async (req, res) => {
    // Check DB connection first
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({
            assignments: [],
            pagination: { page: 1, limit: 10, total: 0, pages: 0 },
            _warning: 'Database đang offline'
        });
    }

    try {
        const { status, type, page = 1, limit = 10 } = req.query;
        const instructorId = req.user.id;

        const query = { instructorId };
        if (status) query.status = status;
        if (type) query.type = type;

        const [assignments, total] = await Promise.all([
            Assignment.find(query)
                .populate('assignedTo', 'fullName email')
                .populate('classIds', 'name')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Assignment.countDocuments(query)
        ]);

        const assignmentsWithStats = await Promise.all(assignments.map(async (assignment) => {
            const totalAssignedStudents = (assignment.assignedTo || []).length;
            // assignedTo đã được populate thành User objects — lấy _id của từng object
            const assignedIds = (assignment.assignedTo || []).map(u =>
                (u._id || u).toString()
            );
            const passingScore = assignment.settings?.passingScore ?? 60;

            // Học viên "hoàn thành" = có ít nhất 1 lần nộp đạt điểm >= passingScore
            const passedSubmissions = await Submission.aggregate([
                {
                    $match: {
                        assignmentId: assignment._id,
                        score: { $gte: passingScore }
                    }
                },
                { $group: { _id: '$studentId' } }
            ]);
            const completedCount = passedSubmissions
                .filter(s => assignedIds.includes(s._id.toString()))
                .length;

            const bestScorePerStudent = await Submission.aggregate([
                { $match: { assignmentId: assignment._id, score: { $ne: null } } },
                { $group: { _id: '$studentId', bestScore: { $max: '$score' } } },
                { $group: { _id: null, avgBestScore: { $avg: '$bestScore' } } }
            ]);
            const avgScore = bestScorePerStudent[0]?.avgBestScore || 0;

            return {
                ...assignment.toObject(),
                submissionStats: {
                    total: totalAssignedStudents,
                    completed: Math.min(completedCount, totalAssignedStudents),
                    avgScore: Math.round(avgScore * 10) / 10
                }
            };
        }));

        res.status(200).json({
            assignments: assignmentsWithStats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const instructorId = req.user.id;
        const { title, description, type, level, content, practiceType, settings, assignedTo, classIds, startDate, dueDate, mode, topic } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Tiêu đề bài tập là bắt buộc!' });
        }

        // Normalize and dedupe assigned student ids (handle mix of ObjectId and string)
        const targetSet = new Set((assignedTo || []).map(id => id.toString()));
        if (classIds && classIds.length > 0) {
            const classes = await Class.find({ _id: { $in: classIds }, instructorId });
            classes.forEach(cls => {
                (cls.studentIds || []).forEach(studentId => targetSet.add(studentId.toString()));
            });
        }
        const targetStudents = Array.from(targetSet);

        const assignment = new Assignment({
            title,
            description,
            instructorId,
            type,
            level,
            content,
            practiceType,
            settings,
            mode: mode || 'random',
            topic: topic || null,
            assignedTo: targetStudents,
            classIds,
            startDate: startDate ? new Date(startDate) : null,
            dueDate: dueDate ? new Date(dueDate) : null,
            
            status: 'draft'
        });

        await assignment.save();

        res.status(201).json({ message: 'Tạo bài tập thành công!', assignment });
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const instructorId = req.user.id;

        const assignment = await Assignment.findOneAndUpdate(
            { _id: id, instructorId },
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!assignment) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập!' });
        }

        res.status(200).json({ message: 'Cập nhật bài tập thành công!', assignment });
    } catch (error) {
        console.error('Update assignment error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.patch('/:id/publish', async (req, res) => {
    try {
        const { id } = req.params;
        const instructorId = req.user.id;

        const assignment = await Assignment.findOneAndUpdate(
            { _id: id, instructorId },
            { $set: { status: 'published' } },
            { new: true }
        );

        if (!assignment) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập!' });
        }

        // ── Tự động tạo thông báo cho học viên khi bài tập được xuất bản ──
        try {
            // Lấy danh sách học viên được giao (trực tiếp + qua lớp)
            const recipientSet = new Set((assignment.assignedTo || []).map(id => id.toString()));
            if (assignment.classIds?.length > 0) {
                const classes = await Class.find({ _id: { $in: assignment.classIds } });
                classes.forEach(cls => (cls.studentIds || []).forEach(sid => recipientSet.add(sid.toString())));
            }
            const recipients = Array.from(recipientSet);

            if (recipients.length > 0) {
                const dueDateStr = assignment.dueDate
                    ? ` Hạn nộp: ${new Date(assignment.dueDate).toLocaleDateString('vi-VN')}.`
                    : '';
                await Notification.create({
                    instructorId,
                    recipients,
                    type: 'assignment',
                    title: `Bài tập mới: ${assignment.title}`,
                    message: `Giảng viên vừa giao bài tập "${assignment.title}". Vui lòng hoàn thành đúng hạn.${dueDateStr}`,
                    relatedId: assignment._id,
                    relatedModel: 'Assignment'
                });
            }
        } catch (notifErr) {
            console.warn('Auto-notification warning:', notifErr.message);
        }

        res.status(200).json({ message: 'Xuất bản bài tập thành công!', assignment });
    } catch (error) {
        console.error('Publish assignment error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const instructorId = req.user.id;

        const assignment = await Assignment.findOneAndDelete({ _id: id, instructorId });

        if (!assignment) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập!' });
        }

        await Submission.deleteMany({ assignmentId: id });

        res.status(200).json({ message: 'Xóa bài tập thành công!' });
    } catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.get('/:id/submissions', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, page = 1, limit = 20 } = req.query;
        const instructorId = req.user.id;

        const query = { assignmentId: id, instructorId };
        if (status) query.status = status;

        const [submissions, total] = await Promise.all([
            Submission.find(query)
                .populate('studentId', 'fullName email studentStats')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Submission.countDocuments(query)
        ]);

        res.status(200).json({
            submissions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
