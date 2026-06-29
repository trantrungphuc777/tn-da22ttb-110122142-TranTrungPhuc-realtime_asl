import express from 'express';
import mongoose from 'mongoose';
import User from '../../models/User.js';
import { authMiddleware, requireAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(requireAdmin);

// Schema thông báo admin
const adminNotificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    targetType: { type: String, enum: ['all', 'students', 'instructors', 'class', 'group'], default: 'all' },
    targetClassId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
    targetGroup: { type: String, enum: ['weak_students', 'new_students', ''], default: '' },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: null },
    status: { type: String, enum: ['draft', 'sent'], default: 'draft' },
    recipientCount: { type: Number, default: 0 }
}, { timestamps: true });

const AdminNotification = mongoose.models.AdminNotification || mongoose.model('AdminNotification', adminNotificationSchema);

// CF9.4 — Lịch sử thông báo
router.get('/', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ notifications: [], _warning: 'Database offline' });
    }
    try {
        const { page = 1, limit = 20 } = req.query;
        const [notifications, total] = await Promise.all([
            AdminNotification.find({})
                .populate('sentBy', 'fullName')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            AdminNotification.countDocuments({})
        ]);
        res.status(200).json({ notifications, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF9.1 — Tạo thông báo
router.post('/', async (req, res) => {
    try {
        const { title, content, targetType, targetClassId, targetGroup } = req.body;
        if (!title || !content) return res.status(400).json({ message: 'Tiêu đề và nội dung là bắt buộc!' });

        const notification = new AdminNotification({
            title, content, targetType: targetType || 'all',
            targetClassId: targetClassId || null,
            targetGroup: targetGroup || '',
            sentBy: req.user.id,
            status: 'draft'
        });
        await notification.save();
        res.status(201).json({ message: 'Đã tạo thông báo!', notification });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF9.3 — Sửa thông báo
router.put('/:id', async (req, res) => {
    try {
        const { title, content, targetType, targetClassId, targetGroup } = req.body;
        const notification = await AdminNotification.findByIdAndUpdate(
            req.params.id,
            { title, content, targetType, targetClassId, targetGroup },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: 'Không tìm thấy thông báo!' });
        res.status(200).json({ message: 'Đã cập nhật thông báo!', notification });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF9.2 — Gửi thông báo (gửi lần đầu hoặc gửi lại)
router.post('/:id/send', async (req, res) => {
    try {
        const notification = await AdminNotification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: 'Không tìm thấy thông báo!' });

        // Đếm số người nhận
        let recipientCount = 0;
        if (notification.targetType === 'all') {
            recipientCount = await User.countDocuments({ role: { $in: ['user', 'instructor'] } });
        } else if (notification.targetType === 'students') {
            recipientCount = await User.countDocuments({ role: 'user' });
        } else if (notification.targetType === 'instructors') {
            recipientCount = await User.countDocuments({ role: 'instructor' });
        } else if (notification.targetType === 'class' && notification.targetClassId) {
            const Class = mongoose.model('Class');
            const cls = await Class.findById(notification.targetClassId);
            recipientCount = cls?.studentIds?.length || 0;
        } else if (notification.targetType === 'group') {
            if (notification.targetGroup === 'weak_students') {
                recipientCount = await User.countDocuments({ role: 'user', 'studentStats.averageScore': { $lt: 50 } });
            } else if (notification.targetGroup === 'new_students') {
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                recipientCount = await User.countDocuments({ role: 'user', createdAt: { $gte: sevenDaysAgo } });
            }
        }

        await AdminNotification.findByIdAndUpdate(req.params.id, {
            status: 'sent',
            sentAt: new Date(),
            recipientCount
        });

        res.status(200).json({ message: `Đã gửi thông báo tới ${recipientCount} người dùng!`, recipientCount });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF9.3 — Xóa thông báo
router.delete('/:id', async (req, res) => {
    try {
        const notification = await AdminNotification.findByIdAndDelete(req.params.id);
        if (!notification) return res.status(404).json({ message: 'Không tìm thấy thông báo!' });
        res.status(200).json({ message: 'Đã xóa thông báo!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
