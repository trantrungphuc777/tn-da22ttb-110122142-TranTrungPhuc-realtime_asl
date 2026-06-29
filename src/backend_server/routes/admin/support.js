import express from 'express';
import mongoose from 'mongoose';
import { authMiddleware, requireAdmin } from '../../middleware/authMiddleware.js';
import SupportTicket from '../../models/SupportTicket.js';

const router = express.Router();
router.use(authMiddleware);
router.use(requireAdmin);

// CF14 — Quản lý hỗ trợ kỹ thuật (Support Center)

// CF14.2 — Danh sách ticket
router.get('/', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ tickets: [], _warning: 'Database offline' });
    }
    try {
        const { page = 1, limit = 20, status = '', errorType = '' } = req.query;
        const query = {};
        if (status) query.status = status;
        if (errorType) query.errorType = errorType;

        const [tickets, total] = await Promise.all([
            SupportTicket.find(query)
                .populate('senderId', 'fullName email role')
                .populate('assignedTo', 'fullName')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            SupportTicket.countDocuments(query)
        ]);

        res.status(200).json({ tickets, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF14.1 — Tạo ticket (người dùng gửi)
router.post('/submit', async (req, res) => {
    try {
        const { title, content, errorType, imageUrl } = req.body;
        if (!title || !content) return res.status(400).json({ message: 'Tiêu đề và nội dung là bắt buộc!' });

        const ticket = new SupportTicket({
            senderId: req.user.id,
            title: title.trim(),
            content: content.trim(),
            errorType: errorType || 'other',
            imageUrl: imageUrl || ''
        });
        await ticket.save();
        res.status(201).json({ message: 'Đã gửi yêu cầu hỗ trợ!', ticket });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF14.4 — Chi tiết ticket + lịch sử trao đổi
router.get('/:id', async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id)
            .populate('senderId', 'fullName email role')
            .populate('assignedTo', 'fullName')
            .populate('messages.senderId', 'fullName role');
        if (!ticket) return res.status(404).json({ message: 'Không tìm thấy ticket!' });
        res.status(200).json({ ticket });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF14.3 — Cập nhật trạng thái ticket
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['new', 'processing', 'completed', 'closed'].includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ!' });
        }
        const update = { status };
        // Trạng thái "closed" do người dùng xác nhận
        if (status === 'closed') {
            update.closedAt = new Date();
            update.closedBy = req.user.id;
        }
        const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!ticket) return res.status(404).json({ message: 'Không tìm thấy ticket!' });
        res.status(200).json({ message: 'Đã cập nhật trạng thái ticket!', ticket });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF14.5 — Chỉnh sửa thông tin ticket (title, content, errorType)
router.put('/:id/info', async (req, res) => {
    try {
        const { title, content, errorType } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: 'Tiêu đề và nội dung không được để trống!' });
        }
        const validTypes = ['login', 'camera', 'exam', 'recognition', 'other'];
        const update = {
            title: title.trim(),
            content: content.trim(),
            ...(errorType && validTypes.includes(errorType) ? { errorType } : {})
        };
        const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, update, { new: true })
            .populate('senderId', 'fullName email role')
            .populate('messages.senderId', 'fullName role');
        if (!ticket) return res.status(404).json({ message: 'Không tìm thấy ticket!' });
        res.status(200).json({ message: 'Đã cập nhật thông tin ticket!', ticket });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF14.6 — Xóa ticket
router.delete('/:id', async (req, res) => {
    try {
        const ticket = await SupportTicket.findByIdAndDelete(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Không tìm thấy ticket!' });
        res.status(200).json({ message: 'Đã xóa ticket!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF14.4 — Gửi tin nhắn trao đổi trong ticket
router.post('/:id/messages', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ message: 'Nội dung tin nhắn là bắt buộc!' });

        const ticket = await SupportTicket.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    messages: {
                        senderId: req.user.id,
                        senderRole: req.user.role,
                        message: message.trim(),
                        sentAt: new Date()
                    }
                },
                // Admin trả lời → chuyển sang processing nếu đang new
                $set: { status: 'processing' }
            },
            { new: true }
        ).populate('messages.senderId', 'fullName role');

        if (!ticket) return res.status(404).json({ message: 'Không tìm thấy ticket!' });
        res.status(200).json({ message: 'Đã gửi tin nhắn!', ticket });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
