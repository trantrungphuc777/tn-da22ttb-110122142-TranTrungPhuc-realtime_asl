import express from 'express';
import mongoose from 'mongoose';
import Exam from '../../models/Exam.js';
import Submission from '../../models/Submission.js';
import User from '../../models/User.js';
import Class from '../../models/Class.js';
import Notification from '../../models/Notification.js';
import { authMiddleware, requireInstructor } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireInstructor);

// GET /api/instructor/exams — danh sách bài kiểm tra
router.get('/', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({
            exams: [],
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

        const [exams, total] = await Promise.all([
            Exam.find(query)
                .populate('assignedTo', 'fullName email')
                .populate('classIds', 'name')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Exam.countDocuments(query)
        ]);

        const examsWithStats = await Promise.all(exams.map(async (exam) => {
            const totalAssignedStudents = (exam.assignedTo || []).length;

            // Đếm số học viên unique đã nộp ít nhất 1 lần (không filter assignedIds để tránh miss)
            const uniqueStudentsDone = await Submission.distinct('studentId', {
                examId: exam._id,
                status: { $in: ['completed', 'graded'] }
            });
            const completedCount = uniqueStudentsDone.length;

            // Điểm trung bình (lấy bestScore mỗi học viên)
            const bestScorePerStudent = await Submission.aggregate([
                { $match: { examId: exam._id, score: { $ne: null } } },
                { $group: { _id: '$studentId', bestScore: { $max: '$score' } } },
                { $group: { _id: null, avgBestScore: { $avg: '$bestScore' } } }
            ]);
            const avgScore = bestScorePerStudent[0]?.avgBestScore || 0;

            return {
                ...exam.toObject(),
                submissionStats: {
                    total: totalAssignedStudents,
                    completed: completedCount,
                    avgScore: Math.round(avgScore * 10) / 10
                }
            };
        }));

        res.status(200).json({
            exams: examsWithStats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get exams error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// POST /api/instructor/exams — tạo bài kiểm tra mới
router.post('/', async (req, res) => {
    try {
        const instructorId = req.user.id;
        const {
            title, description, type, practiceType,
            mode, topic,
            examConfig, settings,
            assignedTo, classIds,
            startDate, endDate
        } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Tiêu đề bài kiểm tra là bắt buộc!' });
        }

        // Validate examConfig khi practiceType = comprehensive
        if (practiceType === 'comprehensive' && examConfig) {
            const total = (examConfig.letterCount || 0) + (examConfig.shortWordCount || 0) +
                (examConfig.longWordCount || 0) + (examConfig.complexCount || 0) +
                (examConfig.quizCount || 0) + (examConfig.chainCount || 0);
            if (total < 5 || total > 50) {
                return res.status(400).json({ message: 'Tổng số câu hỏi phải từ 5 đến 50!' });
            }
        }

        // Gộp assignedTo từ danh sách học viên + lớp học
        const targetSet = new Set((assignedTo || []).map(id => id.toString()));
        if (classIds && classIds.length > 0) {
            const classes = await Class.find({ _id: { $in: classIds }, instructorId });
            classes.forEach(cls => {
                (cls.studentIds || []).forEach(sid => targetSet.add(sid.toString()));
            });
        }

        const exam = new Exam({
            title,
            description,
            instructorId,
            type: type || 'letter',
            practiceType: practiceType || 'recognition',
            mode: mode || 'random',
            topic: topic || null,
            examConfig: examConfig || {},
            settings: {
                questionCount: settings?.questionCount || 10,
                maxAttempts: Math.min(Math.max(parseInt(settings?.maxAttempts) || 1, 1), 5),
                passingScore: settings?.passingScore || 70,
                duration: settings?.duration || 30,
                timeLimit: settings?.timeLimit || null
            },
            assignedTo: Array.from(targetSet),
            classIds: classIds || [],
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            status: 'draft'
        });

        await exam.save();
        res.status(201).json({ message: 'Tạo bài kiểm tra thành công!', exam });
    } catch (error) {
        console.error('Create exam error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// PUT /api/instructor/exams/:id — cập nhật bài kiểm tra
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const instructorId = req.user.id;
        const {
            title, description, type, practiceType,
            mode, topic,
            examConfig, settings,
            assignedTo, classIds,
            startDate, endDate
        } = req.body;

        // Validate examConfig khi practiceType = comprehensive
        if (practiceType === 'comprehensive' && examConfig) {
            const total = (examConfig.letterCount || 0) + (examConfig.shortWordCount || 0) +
                (examConfig.longWordCount || 0) + (examConfig.complexCount || 0) +
                (examConfig.quizCount || 0) + (examConfig.chainCount || 0);
            if (total < 5 || total > 50) {
                return res.status(400).json({ message: 'Tổng số câu hỏi phải từ 5 đến 50!' });
            }
        }

        // Gộp assignedTo
        const targetSet = new Set((assignedTo || []).map(id => id.toString()));
        if (classIds && classIds.length > 0) {
            const classes = await Class.find({ _id: { $in: classIds }, instructorId });
            classes.forEach(cls => {
                (cls.studentIds || []).forEach(sid => targetSet.add(sid.toString()));
            });
        }

        const updateData = {
            title, description,
            type: type || 'letter',
            practiceType: practiceType || 'recognition',
            mode: mode || 'random',
            topic: topic || null,
            examConfig: examConfig || {},
            settings: {
                questionCount: settings?.questionCount || 10,
                maxAttempts: Math.min(Math.max(parseInt(settings?.maxAttempts) || 1, 1), 5),
                passingScore: settings?.passingScore || 70,
                duration: settings?.duration || 30,
                timeLimit: settings?.timeLimit || null
            },
            assignedTo: Array.from(targetSet),
            classIds: classIds || [],
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null
        };

        const exam = await Exam.findOneAndUpdate(
            { _id: id, instructorId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!exam) {
            return res.status(404).json({ message: 'Không tìm thấy bài kiểm tra!' });
        }

        res.status(200).json({ message: 'Cập nhật bài kiểm tra thành công!', exam });
    } catch (error) {
        console.error('Update exam error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// PATCH /api/instructor/exams/:id/publish — xuất bản
router.patch('/:id/publish', async (req, res) => {
    try {
        const { id } = req.params;
        const instructorId = req.user.id;

        const exam = await Exam.findOneAndUpdate(
            { _id: id, instructorId },
            { $set: { status: 'published' } },
            { new: true }
        );

        if (!exam) {
            return res.status(404).json({ message: 'Không tìm thấy bài kiểm tra!' });
        }

        // ── Tự động tạo thông báo cho học viên khi bài kiểm tra được xuất bản ──
        try {
            const recipientSet = new Set((exam.assignedTo || []).map(id => id.toString()));
            if (exam.classIds?.length > 0) {
                const classes = await Class.find({ _id: { $in: exam.classIds } });
                classes.forEach(cls => (cls.studentIds || []).forEach(sid => recipientSet.add(sid.toString())));
            }
            const recipients = Array.from(recipientSet);

            if (recipients.length > 0) {
                const endDateStr = exam.endDate
                    ? ` Thời gian kết thúc: ${new Date(exam.endDate).toLocaleDateString('vi-VN')}.`
                    : '';
                await Notification.create({
                    instructorId,
                    recipients,
                    type: 'exam',
                    title: `Bài kiểm tra mới: ${exam.title}`,
                    message: `Giảng viên vừa mở bài kiểm tra "${exam.title}". Vui lòng hoàn thành đúng thời hạn.${endDateStr}`,
                    relatedId: exam._id,
                    relatedModel: 'Exam'
                });
            }
        } catch (notifErr) {
            console.warn('Auto-notification warning:', notifErr.message);
        }

        res.status(200).json({ message: 'Xuất bản bài kiểm tra thành công!', exam });
    } catch (error) {
        console.error('Publish exam error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// DELETE /api/instructor/exams/:id — xóa
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const instructorId = req.user.id;

        const exam = await Exam.findOneAndDelete({ _id: id, instructorId });

        if (!exam) {
            return res.status(404).json({ message: 'Không tìm thấy bài kiểm tra!' });
        }

        await Submission.deleteMany({ examId: id });

        res.status(200).json({ message: 'Xóa bài kiểm tra thành công!' });
    } catch (error) {
        console.error('Delete exam error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// GET /api/instructor/exams/:id/submissions — xem kết quả học viên
router.get('/:id/submissions', async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const instructorId = req.user.id;

        const exam = await Exam.findOne({ _id: id, instructorId });
        if (!exam) {
            return res.status(404).json({ message: 'Không tìm thấy bài kiểm tra!' });
        }

        const [submissions, total] = await Promise.all([
            Submission.find({ examId: id })
                .populate('studentId', 'fullName email')
                .sort({ score: -1, createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Submission.countDocuments({ examId: id })
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
        console.error('Get exam submissions error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
