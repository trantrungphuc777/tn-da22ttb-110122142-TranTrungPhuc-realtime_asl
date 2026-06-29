import express from 'express';
import mongoose from 'mongoose';
import Class from '../../models/Class.js';
import User from '../../models/User.js';
import Submission from '../../models/Submission.js';
import { authMiddleware, requireAdmin } from '../../middleware/authMiddleware.js';
import { logAudit } from './logs.js';
import { calcClassStats, recalcAllClassStats } from '../../utils/recalcClassStats.js';

const router = express.Router();
router.use(authMiddleware);
router.use(requireAdmin);

// ── ADMIN: Sync classStats cho TẤT CẢ lớp học ────────────────────────────────
// ⚠️ Phải đặt TRƯỚC /:id
router.post('/sync-stats', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database offline!' });
    }
    try {
        const result = await recalcAllClassStats();
        await logAudit({
            userId: req.user.id, userRole: 'admin',
            action: 'sync_class_stats',
            detail: `Sync classStats cho ${result.updated}/${result.total} lớp (${result.failed} lỗi)`,
            ip: req.ip
        });
        res.status(200).json({ message: `Đã sync ${result.updated}/${result.total} lớp`, ...result });
    } catch (error) {
        console.error('sync class stats error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF4 — Danh sách lớp học (classStats tính realtime từ Submission)
router.get('/', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ classes: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 }, _warning: 'Database offline' });
    }
    try {
        const { page = 1, limit = 20, search = '', status = 'active', level = '' } = req.query;
        const query = {};
        if (status) query.status = status;
        if (search) query.name = { $regex: search, $options: 'i' };
        if (level) query.level = level;

        const [rawClasses, total] = await Promise.all([
            Class.find(query)
                .populate('instructorId', 'fullName email')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Class.countDocuments(query)
        ]);

        // Tính classStats realtime cho từng lớp song song
        const classes = await Promise.all(rawClasses.map(async (cls) => {
            const stats = await calcClassStats(cls.studentIds);
            const obj = cls.toObject();
            obj.classStats = stats;
            return obj;
        }));

        res.status(200).json({
            classes,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF4.1 — Tạo lớp học
router.post('/', async (req, res) => {
    try {
        const { name, description, instructorId, level } = req.body;
        if (!name || !instructorId) {
            return res.status(400).json({ message: 'Tên lớp và giảng viên phụ trách là bắt buộc!' });
        }
        const instructor = await User.findOne({ _id: instructorId, role: 'instructor' });
        if (!instructor) return res.status(404).json({ message: 'Không tìm thấy giảng viên!' });

        const cls = new Class({
            name: name.trim(),
            description: description || '',
            instructorId,
            level: level || 'beginner',
            createdBy: req.user.id
        });
        await cls.save();
        await logAudit({ userId: req.user.id, userRole: 'admin', action: 'create_class', detail: `Tạo lớp học: ${cls.name}`, ip: req.ip });
        res.status(201).json({ message: 'Đã tạo lớp học thành công!', class: cls });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF4.4 — Chi tiết lớp học + theo dõi (tính realtime từ Submission)
router.get('/:id', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ class: null, students: [], _warning: 'Database offline' });
    }
    try {
        const cls = await Class.findById(req.params.id)
            .populate('instructorId', 'fullName email')
            .populate('studentIds', 'fullName email studentStats isActive');
        if (!cls) return res.status(404).json({ message: 'Không tìm thấy lớp học!' });

        // Tính stats realtime từ Submission thực tế
        const stats = await calcClassStats(cls.studentIds);

        res.status(200).json({
            class: cls,
            stats
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Cập nhật lớp học
router.put('/:id', async (req, res) => {
    try {
        const { name, description, level, status, instructorId } = req.body;

        if (instructorId) {
            const instructor = await User.findOne({ _id: instructorId, role: 'instructor' });
            if (!instructor) return res.status(404).json({ message: 'Không tìm thấy giảng viên!' });
        }

        const updateData = { name, description, level, status };
        if (instructorId) updateData.instructorId = instructorId;

        const cls = await Class.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('instructorId', 'fullName email');
        if (!cls) return res.status(404).json({ message: 'Không tìm thấy lớp học!' });
        await logAudit({ userId: req.user.id, userRole: 'admin', action: 'update_class', detail: `Cập nhật lớp học: ${cls.name}`, ip: req.ip });
        res.status(200).json({ message: 'Đã cập nhật lớp học!', class: cls });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF4.2 — Thêm học viên vào lớp
router.post('/:id/students', async (req, res) => {
    try {
        const { studentId } = req.body;
        const student = await User.findOne({ _id: studentId, role: 'user' });
        if (!student) return res.status(404).json({ message: 'Không tìm thấy học viên!' });

        const cls = await Class.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { studentIds: studentId } },
            { new: true }
        );
        if (!cls) return res.status(404).json({ message: 'Không tìm thấy lớp học!' });

        await User.findByIdAndUpdate(studentId, { $addToSet: { classIds: req.params.id } });
        await logAudit({ userId: req.user.id, userRole: 'admin', action: 'add_student_to_class', detail: `Thêm ${student.fullName} vào lớp ${cls.name}`, ip: req.ip });
        res.status(200).json({ message: 'Đã thêm học viên vào lớp!', class: cls });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF4.2 — Xóa học viên khỏi lớp
router.delete('/:id/students/:studentId', async (req, res) => {
    try {
        const [cls, student] = await Promise.all([
            Class.findByIdAndUpdate(req.params.id, { $pull: { studentIds: req.params.studentId } }, { new: true }),
            User.findByIdAndUpdate(req.params.studentId, { $pull: { classIds: req.params.id } }, { new: true })
        ]);
        if (!cls) return res.status(404).json({ message: 'Không tìm thấy lớp học!' });
        await logAudit({ userId: req.user.id, userRole: 'admin', action: 'remove_student_from_class', detail: `Xóa ${student?.fullName || req.params.studentId} khỏi lớp ${cls.name}`, ip: req.ip });
        res.status(200).json({ message: 'Đã xóa học viên khỏi lớp!', class: cls });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF4.2 — Chuyển học viên sang lớp khác
router.put('/:id/students/:studentId/transfer', async (req, res) => {
    try {
        const { targetClassId } = req.body;
        if (!targetClassId) return res.status(400).json({ message: 'Vui lòng chọn lớp đích!' });

        const [srcClass, targetClass, student] = await Promise.all([
            Class.findByIdAndUpdate(req.params.id, { $pull: { studentIds: req.params.studentId } }),
            Class.findByIdAndUpdate(targetClassId, { $addToSet: { studentIds: req.params.studentId } }, { new: true }),
            User.findByIdAndUpdate(req.params.studentId, { $pull: { classIds: req.params.id }, $addToSet: { classIds: targetClassId } }, { new: true })
        ]);
        await logAudit({ userId: req.user.id, userRole: 'admin', action: 'transfer_student', detail: `Chuyển ${student?.fullName || req.params.studentId} từ ${srcClass?.name} sang ${targetClass?.name}`, ip: req.ip });
        res.status(200).json({ message: 'Đã chuyển học viên sang lớp mới!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF4.3 — Thay đổi giảng viên phụ trách
router.put('/:id/instructor', async (req, res) => {
    try {
        const { instructorId } = req.body;
        const instructor = await User.findOne({ _id: instructorId, role: 'instructor' });
        if (!instructor) return res.status(404).json({ message: 'Không tìm thấy giảng viên!' });

        const cls = await Class.findByIdAndUpdate(
            req.params.id,
            { instructorId },
            { new: true }
        ).populate('instructorId', 'fullName email');
        if (!cls) return res.status(404).json({ message: 'Không tìm thấy lớp học!' });
        await logAudit({ userId: req.user.id, userRole: 'admin', action: 'change_instructor', detail: `Đổi GV lớp ${cls.name} → ${instructor.fullName}`, ip: req.ip });
        res.status(200).json({ message: 'Đã thay đổi giảng viên phụ trách!', class: cls });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Xóa lớp học (archive)
router.delete('/:id', async (req, res) => {
    try {
        const cls = await Class.findByIdAndUpdate(
            req.params.id,
            { status: 'deleted' },
            { new: true }
        );
        if (!cls) return res.status(404).json({ message: 'Không tìm thấy lớp học!' });
        await logAudit({ userId: req.user.id, userRole: 'admin', action: 'delete_class', detail: `Xóa lớp học: ${cls.name}`, ip: req.ip });
        res.status(200).json({ message: 'Đã xóa lớp học!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
