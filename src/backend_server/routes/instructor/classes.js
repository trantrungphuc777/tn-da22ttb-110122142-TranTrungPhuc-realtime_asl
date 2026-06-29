import express from 'express';
import mongoose from 'mongoose';
import Class from '../../models/Class.js';
import User from '../../models/User.js';
import { authMiddleware, requireInstructor } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireInstructor);

router.get('/', async (req, res) => {
    // Check DB connection first
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({
            classes: [],
            pagination: { page: 1, limit: 10, total: 0, pages: 0 },
            _warning: 'Database đang offline'
        });
    }

    try {
        const { status = 'active', page = 1, limit = 10 } = req.query;
        const instructorId = req.user.id;

        const query = { instructorId };
        if (status !== 'all') query.status = status;

        const [classes, total] = await Promise.all([
            Class.find(query)
                .populate('studentIds', 'fullName email studentStats')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Class.countDocuments(query)
        ]);

        const classesWithStats = classes.map(cls => ({
            ...cls.toObject(),
            studentCount: cls.studentIds.length,
            activeStudentCount: cls.studentIds.filter(s =>
                s.studentStats?.lastPracticeDate &&
                new Date(s.studentStats.lastPracticeDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ).length
        }));

        res.status(200).json({
            classes: classesWithStats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get classes error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const instructorId = req.user.id;
        const { name, description, level, studentIds } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Tên lớp học là bắt buộc!' });
        }

        const classData = new Class({
            name,
            description,
            instructorId,
            level,
            studentIds: studentIds || [],
            createdBy: instructorId
        });

        await classData.save();

        if (studentIds && studentIds.length > 0) {
            await User.updateMany(
                { _id: { $in: studentIds } },
                { $push: { classIds: classData._id } }
            );
        }

        res.status(201).json({ message: 'Tạo lớp học thành công!', class: classData });
    } catch (error) {
        console.error('Create class error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const instructorId = req.user.id;

        const classData = await Class.findOneAndUpdate(
            { _id: id, instructorId },
            { $set: req.body },
            { new: true }
        );

        if (!classData) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học!' });
        }

        res.status(200).json({ message: 'Cập nhật lớp học thành công!', class: classData });
    } catch (error) {
        console.error('Update class error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.post('/:id/students', async (req, res) => {
    try {
        const { id } = req.params;
        const { studentIds } = req.body;
        const instructorId = req.user.id;

        const classData = await Class.findOne({ _id: id, instructorId });
        if (!classData) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học!' });
        }

        await User.updateMany(
            { _id: { $in: studentIds } },
            { $addToSet: { classIds: id } }
        );

        classData.studentIds = [...new Set([...classData.studentIds.map(s => s.toString()), ...studentIds])];
        await classData.save();

        res.status(200).json({ message: 'Thêm học viên vào lớp thành công!', class: classData });
    } catch (error) {
        console.error('Add students error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.delete('/:id/students/:studentId', async (req, res) => {
    try {
        const { id, studentId } = req.params;
        const instructorId = req.user.id;

        const classData = await Class.findOne({ _id: id, instructorId });
        if (!classData) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học!' });
        }

        classData.studentIds = classData.studentIds.filter(s => s.toString() !== studentId);
        await classData.save();

        await User.findByIdAndUpdate(studentId, { $pull: { classIds: id } });

        res.status(200).json({ message: 'Xóa học viên khỏi lớp thành công!', class: classData });
    } catch (error) {
        console.error('Remove student error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.delete('/classes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const instructorId = req.user.id;

        const classData = await Class.findOneAndUpdate(
            { _id: id, instructorId },
            { $set: { status: 'deleted' } },
            { new: true }
        );

        if (!classData) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học!' });
        }

        res.status(200).json({ message: 'Xóa lớp học thành công!' });
    } catch (error) {
        console.error('Delete class error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
