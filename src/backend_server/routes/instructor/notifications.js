import express from 'express';
import mongoose from 'mongoose';
import Notification from '../../models/Notification.js';
import User from '../../models/User.js';
import { authMiddleware, requireInstructor } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireInstructor);

router.get('/', async (req, res) => {
    // Check DB connection first
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({
            notifications: [],
            pagination: { page: 1, limit: 20, total: 0, pages: 0 },
            _warning: 'Database đang offline'
        });
    }

    try {
        const { page = 1, limit = 20 } = req.query;
        const instructorId = req.user.id;

        const [notifications, total] = await Promise.all([
            Notification.find({ sentBy: instructorId })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Notification.countDocuments({ sentBy: instructorId })
        ]);

        res.status(200).json({
            notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.post('/', async (req, res) => {
    // Check DB connection first
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database đang offline, vui lòng thử lại sau.' });
    }

    try {
        const instructorId = req.user.id;
        const { recipients, type, title, message, scheduledFor } = req.body;

        if (!title || !message) {
            return res.status(400).json({ message: 'Tiêu đề và nội dung thông báo là bắt buộc!' });
        }

        // Lấy thông tin giảng viên
        const instructor = await User.findById(instructorId).select('fullName');

        // Xác định targetIds
        let targetIds = [];
        let targetType = 'students';

        if (recipients && recipients.length > 0) {
            // Gửi cho học viên cụ thể
            targetIds = recipients;
            targetType = 'specific';
        } else {
            // Gửi tất cả học viên của giảng viên
            const students = await User.find({ instructorId, role: 'user' }).select('_id');
            targetIds = students.map(s => s._id);
            targetType = 'students';
        }

        const notification = new Notification({
            instructorId,
            title,
            content: message,
            type: type || 'announcement',
            targetType,
            targetIds,
            sentBy: instructorId,
            sentByName: instructor?.fullName || 'Giảng viên',
            totalRecipients: targetIds.length,
            scheduledAt: scheduledFor ? new Date(scheduledFor) : null
        });

        await notification.save();

        res.status(201).json({ message: 'Gửi thông báo thành công!', notification });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.post('/reminders', async (req, res) => {
    try {
        const instructorId = req.user.id;
        const { studentIds, assignmentId, message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Nội dung nhắc nhở là bắt buộc!' });
        }

        const students = studentIds
            ? await User.find({ _id: { $in: studentIds }, instructorId })
            : await User.find({ instructorId, role: 'user' });

        const notifications = await Promise.all(students.map(async (student) => {
            const notification = new Notification({
                instructorId,
                recipients: [student._id],
                type: 'reminder',
                title: 'Nhắc nhở bài tập',
                message,
                relatedId: assignmentId,
                relatedModel: 'Assignment'
            });
            await notification.save();
            return notification;
        }));

        res.status(201).json({ message: `Đã gửi nhắc nhở cho ${notifications.length} học viên!`, notifications });
    } catch (error) {
        console.error('Send reminder error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.patch('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const instructorId = req.user.id;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, instructorId },
            { $push: { isRead: { userId: instructorId, readAt: new Date() } } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo!' });
        }

        res.status(200).json({ message: 'Đã đánh dấu đã đọc!', notification });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const instructorId = req.user.id;

        const notification = await Notification.findOneAndDelete({ _id: id, sentBy: instructorId });

        if (!notification) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo!' });
        }

        res.status(200).json({ message: 'Xóa thông báo thành công!' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
