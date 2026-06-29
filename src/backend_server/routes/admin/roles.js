import express from 'express';
import mongoose from 'mongoose';
import User from '../../models/User.js';
import { authMiddleware, requireAdmin } from '../../middleware/authMiddleware.js';
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from '../../middleware/roleMiddleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(requireAdmin);

// CF12 — Phân quyền hệ thống

// CF12.1 — Danh sách vai trò + số người dùng
router.get('/', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ roles: [], _warning: 'Database offline' });
    }
    try {
        const [studentCount, instructorCount, adminCount] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            User.countDocuments({ role: 'instructor' }),
            User.countDocuments({ role: 'admin' })
        ]);

        const roles = [
            {
                key: 'user',
                name: { vi: 'Học viên', en: 'Student' },
                description: { vi: 'Người dùng học tập, thực hành và làm bài kiểm tra', en: 'Learning, practicing and taking exams' },
                userCount: studentCount,
                isActive: true,
                permissions: ROLE_PERMISSIONS?.user || []
            },
            {
                key: 'instructor',
                name: { vi: 'Giảng viên', en: 'Instructor' },
                description: { vi: 'Người quản lý lớp học, giao bài tập và đánh giá học viên', en: 'Manages classes, assigns tasks and evaluates students' },
                userCount: instructorCount,
                isActive: true,
                permissions: ROLE_PERMISSIONS?.instructor || []
            },
            {
                key: 'admin',
                name: { vi: 'Quản trị viên', en: 'Administrator' },
                description: { vi: 'Người có toàn quyền quản lý hệ thống', en: 'Has full system management rights' },
                userCount: adminCount,
                isActive: true,
                permissions: Object.values(PERMISSIONS)
            }
        ];

        res.status(200).json({ roles, allPermissions: Object.values(PERMISSIONS) });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF12.3 — Gán vai trò: Học viên ↔ Giảng viên
router.put('/assign', async (req, res) => {
    try {
        const { userId, newRole } = req.body;
        if (!['user', 'instructor'].includes(newRole)) {
            return res.status(400).json({ message: 'Chỉ có thể chuyển đổi giữa Học viên và Giảng viên!' });
        }
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Không thể thay đổi vai trò của Admin!' });
        }
        const updated = await User.findByIdAndUpdate(userId, { role: newRole }, { new: true }).select('-password');
        res.status(200).json({
            message: `Đã chuyển vai trò thành ${newRole === 'user' ? 'Học viên' : 'Giảng viên'}!`,
            user: updated
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF12.4 — Kiểm tra quyền của người dùng (giữ lại cho backward compat)
router.get('/check/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('fullName email role isActive customPermissions');
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        const basePerms = ROLE_PERMISSIONS?.[user.role] || (user.role === 'admin' ? Object.values(PERMISSIONS) : []);
        const permissions = user.customPermissions?.length ? user.customPermissions : basePerms;
        res.status(200).json({ user, permissions, hasFullAccess: user.role === 'admin' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF12.5 — Danh sách tất cả người dùng (để gán quyền)
// ⚠️ Static path "/users/all" đặt trước dynamic "/users/:userId" để tránh conflict
router.get('/users/all', async (req, res) => {
    try {
        const { search, role } = req.query;
        const filter = {};
        if (role && ['user', 'instructor', 'admin'].includes(role)) filter.role = role;
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        const users = await User.find(filter)
            .select('fullName email role isActive avatar customPermissions createdAt')
            .sort({ createdAt: -1 })
            .limit(200);

        const usersWithPerms = users.map(u => {
            const basePerms = ROLE_PERMISSIONS?.[u.role] || (u.role === 'admin' ? Object.values(PERMISSIONS) : []);
            return {
                _id: u._id,
                fullName: u.fullName,
                email: u.email,
                role: u.role,
                isActive: u.isActive,
                avatar: u.avatar,
                createdAt: u.createdAt,
                permissions: u.customPermissions?.length ? u.customPermissions : basePerms,
                hasCustomPermissions: !!(u.customPermissions?.length)
            };
        });

        res.status(200).json({ users: usersWithPerms, total: usersWithPerms.length });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF12.6 — Cập nhật quyền tùy chỉnh cho người dùng cụ thể
router.put('/users/:userId/permissions', async (req, res) => {
    try {
        const { permissions } = req.body;
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        if (user.role === 'admin') return res.status(403).json({ message: 'Không thể thay đổi quyền của Admin!' });
        const validPerms = Object.values(PERMISSIONS);
        const sanitized = (permissions || []).filter(p => validPerms.includes(p));
        await User.findByIdAndUpdate(req.params.userId, { customPermissions: sanitized });
        res.status(200).json({ message: 'Đã cập nhật quyền thành công!', permissions: sanitized });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF12.7 — Reset quyền về mặc định theo vai trò
router.delete('/users/:userId/permissions', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        await User.findByIdAndUpdate(req.params.userId, { customPermissions: [] });
        const defaultPerms = ROLE_PERMISSIONS?.[user.role] || [];
        res.status(200).json({ message: 'Đã reset quyền về mặc định!', permissions: defaultPerms });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
