import express from 'express';
import mongoose from 'mongoose';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import SupportTicket from '../../models/SupportTicket.js';

const router = express.Router();
router.use(authMiddleware);

// Giảng viên tạo ticket hỗ trợ kỹ thuật
router.post('/', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database đang offline, vui lòng thử lại sau!' });
    }
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

// Giảng viên xem danh sách ticket của mình
router.get('/', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ tickets: [], _warning: 'Database offline' });
    }
    try {
        const { page = 1, limit = 10 } = req.query;
        const [tickets, total] = await Promise.all([
            SupportTicket.find({ senderId: req.user.id })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            SupportTicket.countDocuments({ senderId: req.user.id })
        ]);
        res.status(200).json({ tickets, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Giảng viên xem chi tiết ticket
router.get('/:id', async (req, res) => {
    try {
        const ticket = await SupportTicket.findOne({ _id: req.params.id, senderId: req.user.id })
            .populate('messages.senderId', 'fullName role');
        if (!ticket) return res.status(404).json({ message: 'Không tìm thấy ticket!' });
        res.status(200).json({ ticket });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Giảng viên gửi tin nhắn trong ticket
router.post('/:id/messages', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ message: 'Nội dung tin nhắn là bắt buộc!' });
        const ticket = await SupportTicket.findOne({ _id: req.params.id, senderId: req.user.id });
        if (!ticket) return res.status(404).json({ message: 'Không tìm thấy ticket!' });
        if (ticket.status === 'closed') return res.status(400).json({ message: 'Ticket đã đóng, không thể gửi tin nhắn!' });
        const updatedTicket = await SupportTicket.findByIdAndUpdate(
            req.params.id,
            { $push: { messages: { senderId: req.user.id, senderRole: req.user.role, message: message.trim(), sentAt: new Date() } } },
            { new: true }
        ).populate('messages.senderId', 'fullName role');
        res.status(200).json({ message: 'Đã gửi tin nhắn!', ticket: updatedTicket });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Giảng viên xác nhận đóng ticket
router.patch('/:id/close', async (req, res) => {
    try {
        const ticket = await SupportTicket.findOne({ _id: req.params.id, senderId: req.user.id });
        if (!ticket) return res.status(404).json({ message: 'Không tìm thấy ticket!' });
        if (ticket.status !== 'completed') return res.status(400).json({ message: 'Chỉ có thể đóng ticket đã hoàn thành!' });
        const updated = await SupportTicket.findByIdAndUpdate(
            req.params.id,
            { status: 'closed', closedAt: new Date(), closedBy: req.user.id },
            { new: true }
        );
        res.status(200).json({ message: 'Ticket đã được đóng!', ticket: updated });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
