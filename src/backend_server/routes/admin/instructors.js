import express from 'express';
import mongoose from 'mongoose';
import User from '../../models/User.js';
import Class from '../../models/Class.js';
import Assignment from '../../models/Assignment.js';
import Exam from '../../models/Exam.js';
import { authMiddleware, requireAdmin } from '../../middleware/authMiddleware.js';
import bcrypt from 'bcryptjs';
import { logAudit } from './logs.js';

const router = express.Router();
router.use(authMiddleware);
router.use(requireAdmin);

// CF3.1 — Thêm giảng viên mới
router.post('/', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu!' });
        }
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(400).json({ message: 'Email đã tồn tại!' });

        // Tạo username từ email
        const username = email.split('@')[0] + '_' + Date.now().toString().slice(-4);

        const instructor = new User({
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            username,
            password,
            role: 'instructor',
            isActive: true
        });
        await instructor.save();

        const result = instructor.toObject();
        delete result.password;
        await logAudit({ userId: req.user.id, userRole: 'admin', action: 'create_instructor', detail: `Tạo tài khoản giảng viên: ${instructor.fullName} (${instructor.email})`, ip: req.ip });
        res.status(201).json({ message: 'Đã tạo tài khoản giảng viên thành công!', instructor: result });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF3.2 — Danh sách giảng viên
router.get('/', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ instructors: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 }, _warning: 'Database offline' });
    }
    try {
        const { page = 1, limit = 20, search = '', status = '' } = req.query;
        const query = { role: 'instructor' };
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (status === 'active') query.isActive = true;
        if (status === 'locked') query.isActive = false;

        const [instructors, total] = await Promise.all([
            User.find(query).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
            User.countDocuments(query)
        ]);

        // Thêm số lớp phụ trách
        const instructorsWithStats = await Promise.all(instructors.map(async (inst) => {
            const classCount = await Class.countDocuments({ instructorId: inst._id, status: 'active' });
            return { ...inst.toObject(), classCount };
        }));

        res.status(200).json({
            instructors: instructorsWithStats,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF3.3 + CF3.5 — Hồ sơ + theo dõi hoạt động giảng viên
router.get('/:id', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ instructor: null, classes: [], students: [], _warning: 'Database offline' });
    }
    try {
        const instructor = await User.findOne({ _id: req.params.id, role: 'instructor' }).select('-password');
        if (!instructor) return res.status(404).json({ message: 'Không tìm thấy giảng viên!' });

        const [classes, students, assignmentCount, examCount] = await Promise.all([
            Class.find({ instructorId: req.params.id, status: 'active' }),
            User.find({ instructorId: req.params.id, role: 'user' }).select('fullName email studentStats createdAt'),
            Assignment.countDocuments({ instructorId: req.params.id }),
            Exam.countDocuments({ instructorId: req.params.id })
        ]);

        res.status(200).json({
            instructor,
            classes,
            students,
            stats: {
                classCount: classes.length,
                studentCount: students.length,
                assignmentCount,
                examCount
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF3.4 — Chỉnh sửa thông tin giảng viên
router.put('/:id', async (req, res) => {
    try {
        const { fullName, email } = req.body;
        const instructor = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'instructor' },
            { fullName, email },
            { new: true }
        ).select('-password');
        if (!instructor) return res.status(404).json({ message: 'Không tìm thấy giảng viên!' });
        await logAudit({ userId: req.user.id, userRole: 'admin', action: 'update_instructor', detail: `Cập nhật thông tin GV: ${instructor.fullName} (${instructor.email})`, ip: req.ip });
        res.status(200).json({ message: 'Đã cập nhật thông tin giảng viên!', instructor });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF3.4 — Khóa tài khoản giảng viên
router.put('/:id/lock', async (req, res) => {
    try {
        const instructor = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'instructor' },
            { isActive: false },
            { new: true }
        ).select('-password');
        if (!instructor) return res.status(404).json({ message: 'Không tìm thấy giảng viên!' });
        await logAudit({ userId: req.user.id, userRole: 'admin', action: 'lock_account', detail: `Khóa TK giảng viên: ${instructor.fullName} (${instructor.email})`, ip: req.ip });
        res.status(200).json({ message: 'Đã khóa tài khoản giảng viên!', instructor });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF3.4 — Mở khóa tài khoản giảng viên
router.put('/:id/unlock', async (req, res) => {
    try {
        const instructor = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'instructor' },
            { isActive: true },
            { new: true }
        ).select('-password');
        if (!instructor) return res.status(404).json({ message: 'Không tìm thấy giảng viên!' });
        await logAudit({ userId: req.user.id, userRole: 'admin', action: 'unlock_account', detail: `Mở khóa TK giảng viên: ${instructor.fullName} (${instructor.email})`, ip: req.ip });
        res.status(200).json({ message: 'Đã mở khóa tài khoản giảng viên!', instructor });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF3.4 — Đặt lại mật khẩu giảng viên
router.put('/:id/reset-password', async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);
        const instructor = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'instructor' },
            { password: hashed },
            { new: true }
        ).select('-password');
        if (!instructor) return res.status(404).json({ message: 'Không tìm thấy giảng viên!' });
        await logAudit({ userId: req.user.id, userRole: 'admin', action: 'reset_password', detail: `Đặt lại MK giảng viên: ${instructor.fullName} (${instructor.email})`, ip: req.ip });
        res.status(200).json({ message: 'Đã đặt lại mật khẩu thành công!', instructor });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF3.6 — Gán giảng viên vào lớp
router.put('/:id/assign-class', async (req, res) => {
    try {
        const { classId } = req.body;
        const cls = await Class.findByIdAndUpdate(
            classId,
            { instructorId: req.params.id },
            { new: true }
        );
        if (!cls) return res.status(404).json({ message: 'Không tìm thấy lớp học!' });
        res.status(200).json({ message: 'Đã gán giảng viên vào lớp!', class: cls });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF3.6 — Thêm/bớt học viên phụ trách
router.put('/:id/manage-students', async (req, res) => {
    try {
        const { action, studentId } = req.body; // action: 'add' | 'remove'
        if (!['add', 'remove'].includes(action)) {
            return res.status(400).json({ message: 'Action phải là add hoặc remove!' });
        }
        const update = action === 'add'
            ? { instructorId: req.params.id, assignedBy: req.user.id, assignedAt: new Date() }
            : { instructorId: null, assignedBy: null, assignedAt: null };

        const student = await User.findOneAndUpdate(
            { _id: studentId, role: 'user' },
            update,
            { new: true }
        ).select('-password');
        if (!student) return res.status(404).json({ message: 'Không tìm thấy học viên!' });
        res.status(200).json({ message: action === 'add' ? 'Đã thêm học viên phụ trách!' : 'Đã bớt học viên phụ trách!', student });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
