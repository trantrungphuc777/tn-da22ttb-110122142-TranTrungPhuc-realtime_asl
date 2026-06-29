import express from 'express';
import mongoose from 'mongoose';
import Badge from '../../models/Badge.js';
import { authMiddleware, requireAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(requireAdmin);

// CF15 — Quản lý huy hiệu và thành tích
// QUAN TRỌNG: 30 huy hiệu hệ thống (isSystem: true) KHÔNG được xóa, chỉ xem

// CF15.3 — Danh sách tất cả huy hiệu
router.get('/', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ badges: [], _warning: 'Database offline' });
    }
    try {
        const { page = 1, limit = 50, rarity = '', isActive = '', isSystem = '' } = req.query;
        const query = {};
        if (rarity) query.rarity = rarity;
        if (isActive !== '') query.isActive = isActive === 'true';
        if (isSystem !== '') query.isSystem = isSystem === 'true';

        const [badges, total] = await Promise.all([
            Badge.find(query)
                .populate('createdBy', 'fullName')
                .sort({ sortOrder: 1, createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Badge.countDocuments(query)
        ]);

        res.status(200).json({ badges, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF15.4 — Theo dõi thành tích
router.get('/achievements', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ _warning: 'Database offline' });
    }
    try {
        const StudentBadge = mongoose.model('StudentBadge');
        const User = mongoose.model('User');

        // Học viên đạt nhiều huy hiệu nhất
        const topStudents = await StudentBadge.aggregate([
            { $group: { _id: '$studentId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'student' } },
            { $unwind: '$student' },
            { $project: { count: 1, 'student.fullName': 1, 'student.email': 1 } }
        ]);

        // Huy hiệu phổ biến nhất
        const popularBadges = await StudentBadge.aggregate([
            { $group: { _id: '$badgeId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'badges', localField: '_id', foreignField: '_id', as: 'badge' } },
            { $unwind: '$badge' },
            { $project: { count: 1, 'badge.name': 1, 'badge.emoji': 1, 'badge.rarity': 1 } }
        ]);

        // Tổng số huy hiệu đã trao
        const totalAwarded = await StudentBadge.countDocuments({});

        res.status(200).json({ topStudents, popularBadges, totalAwarded });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF15.1 — Tạo huy hiệu mới (chỉ tạo thêm, không đụng 30 huy hiệu hệ thống)
router.post('/', async (req, res) => {
    try {
        const { nameVi, nameEn, descVi, descEn, icon, emoji, conditionType, conditionValue, rarity, color, bgColor, borderColor } = req.body;
        if (!nameVi || !nameEn || !conditionType) {
            return res.status(400).json({ message: 'Tên (vi/en) và loại điều kiện là bắt buộc!' });
        }

        const badge = new Badge({
            name: { vi: nameVi, en: nameEn },
            description: { vi: descVi || '', en: descEn || '' },
            icon: icon || 'Award',
            emoji: emoji || '🏆',
            conditionType,
            conditionValue: conditionValue || 0,
            rarity: rarity || 'common',
            color: color || '#3B82F6',
            bgColor: bgColor || 'bg-blue-100',
            borderColor: borderColor || 'border-blue-300',
            isSystem: false, // Huy hiệu do admin tạo thêm, không phải system
            createdBy: req.user.id,
            sortOrder: 100 + Date.now() % 1000
        });
        await badge.save();
        res.status(201).json({ message: 'Đã tạo huy hiệu mới!', badge });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF15.3 — Sửa huy hiệu (chỉ sửa huy hiệu do admin tạo, không sửa system badges)
router.put('/:id', async (req, res) => {
    try {
        const badge = await Badge.findById(req.params.id);
        if (!badge) return res.status(404).json({ message: 'Không tìm thấy huy hiệu!' });
        if (badge.isSystem) {
            return res.status(403).json({ message: 'Không thể chỉnh sửa huy hiệu hệ thống!' });
        }

        const { nameVi, nameEn, descVi, descEn, icon, emoji, conditionType, conditionValue, rarity, color, bgColor, borderColor } = req.body;
        const updated = await Badge.findByIdAndUpdate(
            req.params.id,
            {
                'name.vi': nameVi, 'name.en': nameEn,
                'description.vi': descVi, 'description.en': descEn,
                icon, emoji, conditionType, conditionValue, rarity, color, bgColor, borderColor
            },
            { new: true }
        );
        res.status(200).json({ message: 'Đã cập nhật huy hiệu!', badge: updated });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF15.3 — Kích hoạt / Vô hiệu hóa huy hiệu
router.put('/:id/toggle', async (req, res) => {
    try {
        const badge = await Badge.findById(req.params.id);
        if (!badge) return res.status(404).json({ message: 'Không tìm thấy huy hiệu!' });

        const updated = await Badge.findByIdAndUpdate(
            req.params.id,
            { isActive: !badge.isActive },
            { new: true }
        );
        res.status(200).json({
            message: updated.isActive ? 'Đã kích hoạt huy hiệu!' : 'Đã vô hiệu hóa huy hiệu!',
            badge: updated
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF15.3 — Xóa huy hiệu (chỉ xóa huy hiệu do admin tạo, KHÔNG xóa system badges)
router.delete('/:id', async (req, res) => {
    try {
        const badge = await Badge.findById(req.params.id);
        if (!badge) return res.status(404).json({ message: 'Không tìm thấy huy hiệu!' });
        if (badge.isSystem) {
            return res.status(403).json({ message: 'Không thể xóa huy hiệu hệ thống! (30 huy hiệu gốc được bảo vệ)' });
        }
        await Badge.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Đã xóa huy hiệu!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
