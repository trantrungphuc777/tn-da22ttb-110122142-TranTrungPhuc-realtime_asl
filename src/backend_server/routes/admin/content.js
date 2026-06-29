import express from 'express';
import mongoose from 'mongoose';
import { authMiddleware, requireAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(requireAdmin);

// CF5 — Quản lý nội dung thực hành (ký hiệu ASL, từ vựng, câu giao tiếp)
// Dữ liệu ASL content được lưu trong collection 'aslcontents'

// Lấy schema động để tránh lỗi nếu model chưa được đăng ký
const getASLContent = () => {
    try {
        return mongoose.model('ASLContent');
    } catch {
        const ASLContentSchema = new mongoose.Schema({
            type:        { type: String, enum: ['letter', 'word', 'sentence'], required: true },
            label:       { type: String, required: true, trim: true },
            meaning:     { type: String, default: '' },   // nghĩa tiếng Việt
            description: { type: String, default: '' },   // mô tả bổ sung (legacy)
            topic:       { type: String, default: '' },   // topic phân loại
            imageUrl:    { type: String, default: '' },
            isActive:    { type: Boolean, default: true },
            createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
        }, { timestamps: true });
        return mongoose.model('ASLContent', ASLContentSchema);
    }
};

// CF5.1 — Lấy danh sách theo loại
router.get('/', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ items: [], _warning: 'Database offline' });
    }
    try {
        const { type = 'letter', search = '', topic = '', page = 1, limit = 200 } = req.query;
        const ASLContent = getASLContent();
        const query = { type };
        if (topic) query.topic = topic;
        if (search) query.$or = [
            { label: { $regex: search, $options: 'i' } },
            { meaning: { $regex: search, $options: 'i' } }
        ];

        const [items, total] = await Promise.all([
            ASLContent.find(query).sort({ topic: 1, label: 1 }).skip((page - 1) * limit).limit(parseInt(limit)),
            ASLContent.countDocuments(query)
        ]);
        res.status(200).json({ items, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF5.1 — Thêm mới
router.post('/', async (req, res) => {
    try {
        const { type, label, meaning, description, topic, imageUrl } = req.body;
        if (!type || !label) return res.status(400).json({ message: 'Loại và nhãn là bắt buộc!' });
        const ASLContent = getASLContent();
        const item = new ASLContent({
            type, label: label.trim(),
            meaning: meaning || description || '',
            topic: topic || '',
            imageUrl: imageUrl || '',
            createdBy: req.user.id
        });
        await item.save();
        res.status(201).json({ message: 'Đã thêm nội dung mới!', item });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF5.1 — Cập nhật
router.put('/:id', async (req, res) => {
    try {
        const { label, meaning, description, topic, imageUrl, isActive } = req.body;
        const ASLContent = getASLContent();
        const item = await ASLContent.findByIdAndUpdate(
            req.params.id,
            { label: label?.trim(), meaning: meaning || description, topic, imageUrl, isActive },
            { new: true }
        );
        if (!item) return res.status(404).json({ message: 'Không tìm thấy nội dung!' });
        res.status(200).json({ message: 'Đã cập nhật!', item });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF5.1 — Xóa
router.delete('/:id', async (req, res) => {
    try {
        const ASLContent = getASLContent();
        const item = await ASLContent.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: 'Không tìm thấy nội dung!' });
        res.status(200).json({ message: 'Đã xóa nội dung!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
