import express from 'express';
import mongoose from 'mongoose';
import User from '../../models/User.js';
import Class from '../../models/Class.js';
import Submission from '../../models/Submission.js';
import { authMiddleware, requireAdmin } from '../../middleware/authMiddleware.js';
import bcrypt from 'bcryptjs';
import { logAudit } from './logs.js';
import { recalcStudentStats, recalcAllStudentsStats } from '../../utils/recalcStudentStats.js';

const router = express.Router();
router.use(authMiddleware);
router.use(requireAdmin);

// ── ADMIN: Sync lại stats cho TẤT CẢ học viên ────────────────────────────────
// POST /api/admin/students/sync-stats
// ⚠️ Phải đặt TRƯỚC route /:id để tránh Express match "sync-stats" như một :id
router.post('/sync-stats', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database offline!' });
    }
    try {
        const result = await recalcAllStudentsStats();
        await logAudit({
            userId: req.user.id,
            userRole: 'admin',
            action: 'sync_student_stats',
            detail: `Sync stats cho ${result.updated}/${result.total} học viên (${result.failed} lỗi)`,
            ip: req.ip
        });
        res.status(200).json({ message: `Đã sync ${result.updated}/${result.total} học viên`, ...result });
    } catch (error) {
        console.error('sync-stats error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF2.0 — Tạo học viên mới
router.post('/', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database offline!' });
    }
    try {
        const { fullName, email, password, username } = req.body;
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'Họ tên, email và mật khẩu là bắt buộc!' });
        }
        // Tự tạo username từ email nếu không truyền
        const uname = (username || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '');
        const existing = await User.findOne({ $or: [{ email }, { username: uname }] });
        if (existing) {
            return res.status(400).json({ message: 'Email hoặc tên đăng nhập đã tồn tại!' });
        }
        const student = new User({ fullName, email, username: uname, password, role: 'user', isActive: true });
        await student.save();
        await logAudit({
            userId: req.user.id,
            userRole: 'admin',
            action: 'create_student',
            detail: `Tạo học viên mới: ${fullName} (${email})`,
            ip: req.ip
        });
        res.status(201).json({ message: 'Tạo học viên thành công!', student: { _id: student._id, fullName: student.fullName, email: student.email, username: student.username } });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF2.1 + CF2.2 — Danh sách học viên + tìm kiếm/lọc
router.get('/', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ students: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 }, _warning: 'Database offline' });
    }    try {
        const { page = 1, limit = 20, search = '', classId = '', status = '', startDate = '', endDate = '' } = req.query;
        const query = { role: 'user' };

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }
        if (classId) query.classIds = new mongoose.Types.ObjectId(classId);
        if (status === 'active') query.isActive = true;
        if (status === 'locked') query.isActive = false;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const [students, total] = await Promise.all([
            User.find(query)
                .select('-password')
                .populate('classIds', 'name')
                .populate('instructorId', 'fullName')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            User.countDocuments(query)
        ]);

        res.status(200).json({
            students,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF2.3 + CF2.4 — Hồ sơ + lịch sử học tập học viên
router.get('/:id', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ student: null, submissions: [], loginHistory: [], _warning: 'Database offline' });
    }
    try {
        const student = await User.findOne({ _id: req.params.id, role: 'user' })
            .select('-password')
            .populate('classIds', 'name')
            .populate('instructorId', 'fullName email');

        if (!student) return res.status(404).json({ message: 'Không tìm thấy học viên!' });

        const submissions = await Submission.find({ studentId: req.params.id })
            .populate('assignmentId', 'title type')
            .populate('examId', 'title')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({ student, submissions, loginHistory: [] });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF2.5 — Khóa tài khoản
router.put('/:id/lock', async (req, res) => {
    try {
        const student = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'user' },
            { isActive: false },
            { new: true }
        ).select('-password');
        if (!student) return res.status(404).json({ message: 'Không tìm thấy học viên!' });
        await logAudit({ userId: req.user.id, userRole: 'admin', action: 'lock_account', detail: `Khóa tài khoản học viên: ${student.fullName} (${student.email})`, ip: req.ip });
        res.status(200).json({ message: 'Đã khóa tài khoản học viên!', student });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF2.5 — Mở khóa tài khoản
router.put('/:id/unlock', async (req, res) => {
    try {
        const student = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'user' },
            { isActive: true },
            { new: true }
        ).select('-password');
        if (!student) return res.status(404).json({ message: 'Không tìm thấy học viên!' });
        await logAudit({ userId: req.user.id, userRole: 'admin', action: 'unlock_account', detail: `Mở khóa tài khoản học viên: ${student.fullName} (${student.email})`, ip: req.ip });
        res.status(200).json({ message: 'Đã mở khóa tài khoản học viên!', student });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF2.5 — Đặt lại mật khẩu
router.put('/:id/reset-password', async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);
        const student = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'user' },
            { password: hashed },
            { new: true }
        ).select('-password');
        if (!student) return res.status(404).json({ message: 'Không tìm thấy học viên!' });
        await logAudit({ userId: req.user.id, userRole: 'admin', action: 'reset_password', detail: `Đặt lại mật khẩu học viên: ${student.fullName} (${student.email})`, ip: req.ip });
        res.status(200).json({ message: 'Đã đặt lại mật khẩu thành công!', student });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF2.5 — Xóa tài khoản
router.delete('/:id', async (req, res) => {
    try {
        const student = await User.findOneAndDelete({ _id: req.params.id, role: 'user' });
        if (!student) return res.status(404).json({ message: 'Không tìm thấy học viên!' });
        await Class.updateMany({ studentIds: req.params.id }, { $pull: { studentIds: req.params.id } });
        await logAudit({ userId: req.user.id, userRole: 'admin', action: 'delete_account', detail: `Xóa tài khoản học viên: ${student.fullName} (${student.email})`, ip: req.ip });
        res.status(200).json({ message: 'Đã xóa tài khoản học viên!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// ── ADMIN: Sync stats cho 1 học viên cụ thể ──────────────────────────────────
// POST /api/admin/students/:id/sync-stats
router.post('/:id/sync-stats', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database offline!' });
    }
    try {
        const stats = await recalcStudentStats(req.params.id);
        res.status(200).json({ message: 'Đã sync stats học viên', stats });
    } catch (error) {
        console.error('sync-stats/:id error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
