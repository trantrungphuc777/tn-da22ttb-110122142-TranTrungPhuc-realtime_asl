import express from 'express';
import mongoose from 'mongoose';
import InstructorFeedback from '../../models/InstructorFeedback.js';
import User from '../../models/User.js';
import { authMiddleware, requireInstructor } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(requireInstructor);

// GET list of students for the instructor (for recipient picker)
// Must be defined BEFORE any /:param routes to avoid conflicts
router.get('/students', async (req, res) => {
    try {
        const instructorId = req.user.id;
        const students = await User.find({ instructorId, role: 'user' })
            .select('fullName email studentStats')
            .sort({ fullName: 1 });
        res.status(200).json({ students });
    } catch (error) {
        console.error('Get students for feedback error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// GET all feedback sent by this instructor (with filters, pagination)
router.get('/', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ feedback: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 }, _warning: 'Database đang offline' });
    }
    try {
        const instructorId = req.user.id;
        const { type = 'all', studentId, search = '', page = 1, limit = 20 } = req.query;

        const query = { instructorId };
        if (type !== 'all') query.type = type;
        if (studentId) query.studentId = studentId;

        const [feedbackList, total] = await Promise.all([
            InstructorFeedback.find(query)
                .populate('studentId', 'fullName email')
                .populate('relatedAssignment', 'title')
                .sort({ createdAt: -1 })
                .skip((parseInt(page) - 1) * parseInt(limit))
                .limit(parseInt(limit)),
            InstructorFeedback.countDocuments(query)
        ]);

        // client-side search filter on populated name
        const filtered = search
            ? feedbackList.filter(f =>
                f.title?.toLowerCase().includes(search.toLowerCase()) ||
                f.content?.toLowerCase().includes(search.toLowerCase()) ||
                f.studentId?.fullName?.toLowerCase().includes(search.toLowerCase())
              )
            : feedbackList;

        res.status(200).json({
            feedback: filtered,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        console.error('Get feedback management error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// POST create feedback (single student OR broadcast to multiple)
router.post('/', async (req, res) => {
    try {
        const instructorId = req.user.id;
        const { studentIds, type, title, content, relatedAssignment } = req.body;

        if (!studentIds || !studentIds.length) {
            return res.status(400).json({ message: 'Vui lòng chọn ít nhất một học viên!' });
        }
        if (!title?.trim() || !content?.trim()) {
            return res.status(400).json({ message: 'Tiêu đề và nội dung không được để trống!' });
        }

        // Verify all students belong to this instructor
        const students = await User.find({ _id: { $in: studentIds }, instructorId, role: 'user' });
        if (!students.length) {
            return res.status(404).json({ message: 'Không tìm thấy học viên hợp lệ!' });
        }

        const docs = students.map(s => ({
            instructorId,
            studentId: s._id,
            type: type || 'suggestion',
            title: title.trim(),
            content: content.trim(),
            relatedAssignment: relatedAssignment || null
        }));

        const created = await InstructorFeedback.insertMany(docs);

        res.status(201).json({
            message: `Đã gửi nhận xét tới ${created.length} học viên!`,
            count: created.length,
            feedback: created
        });
    } catch (error) {
        console.error('Create feedback error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// PUT update a feedback item
router.put('/:id', async (req, res) => {
    try {
        const instructorId = req.user.id;
        const { id } = req.params;
        const { type, title, content } = req.body;

        const feedback = await InstructorFeedback.findOneAndUpdate(
            { _id: id, instructorId },
            { $set: { type, title: title?.trim(), content: content?.trim() } },
            { new: true }
        ).populate('studentId', 'fullName email');

        if (!feedback) return res.status(404).json({ message: 'Không tìm thấy nhận xét!' });

        res.status(200).json({ message: 'Cập nhật thành công!', feedback });
    } catch (error) {
        console.error('Update feedback error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// DELETE a single feedback item
router.delete('/:id', async (req, res) => {
    try {
        const instructorId = req.user.id;
        const { id } = req.params;

        const feedback = await InstructorFeedback.findOneAndDelete({ _id: id, instructorId });
        if (!feedback) return res.status(404).json({ message: 'Không tìm thấy nhận xét!' });

        res.status(200).json({ message: 'Đã xóa nhận xét!' });
    } catch (error) {
        console.error('Delete feedback error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// DELETE multiple feedback items
router.delete('/', async (req, res) => {
    try {
        const instructorId = req.user.id;
        const { ids } = req.body;

        if (!ids || !ids.length) return res.status(400).json({ message: 'Không có nhận xét nào được chọn!' });

        const result = await InstructorFeedback.deleteMany({ _id: { $in: ids }, instructorId });

        res.status(200).json({ message: `Đã xóa ${result.deletedCount} nhận xét!`, deletedCount: result.deletedCount });
    } catch (error) {
        console.error('Bulk delete feedback error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
