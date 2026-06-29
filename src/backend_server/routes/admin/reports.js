import express from 'express';
import mongoose from 'mongoose';
import User from '../../models/User.js';
import Class from '../../models/Class.js';
import Assignment from '../../models/Assignment.js';
import Submission from '../../models/Submission.js';
import { authMiddleware, requireAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(requireAdmin);

// CF8.1 — Báo cáo học viên
router.get('/students', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ data: [], _warning: 'Database offline' });
    }
    try {
        const { classId, startDate, endDate, studentId } = req.query;
        const query = { role: 'user' };
        if (studentId) query._id = new mongoose.Types.ObjectId(studentId);
        if (classId) query.classIds = new mongoose.Types.ObjectId(classId);
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const students = await User.find(query)
            .select('-password')
            .populate('classIds', 'name')
            .populate('instructorId', 'fullName');

        const data = await Promise.all(students.map(async (s) => {
            const submissions = await Submission.find({ studentId: s._id })
                .populate('assignmentId', 'title')
                .sort({ createdAt: -1 });

            // ── Đếm bài RIÊNG BIỆT (unique assignment + unique exam), không đếm lượt ──
            const uniqueAssignmentIds = new Set(
                submissions
                    .filter(sub => sub.assignmentId)
                    .map(sub => (sub.assignmentId?._id || sub.assignmentId).toString())
            );
            const uniqueExamIds = new Set(
                submissions
                    .filter(sub => sub.examId)
                    .map(sub => sub.examId.toString())
            );
            const totalUniqueTasks = uniqueAssignmentIds.size + uniqueExamIds.size;

            // ── Bài hoàn thành: unique bài có ít nhất 1 lượt completed/graded ──
            const completedAssignmentIds = new Set(
                submissions
                    .filter(sub => sub.assignmentId && ['completed', 'graded'].includes(sub.status))
                    .map(sub => (sub.assignmentId?._id || sub.assignmentId).toString())
            );
            const completedExamIds = new Set(
                submissions
                    .filter(sub => sub.examId && ['completed', 'graded'].includes(sub.status))
                    .map(sub => sub.examId.toString())
            );
            const totalCompleted = completedAssignmentIds.size + completedExamIds.size;

            return {
                student: s,
                submissions,
                summary: {
                    totalSubmissions: totalUniqueTasks,   // số BÀI riêng biệt
                    completed:        totalCompleted,      // số BÀI đã hoàn thành
                    averageScore:     s.studentStats.averageScore,
                    averageAccuracy:  s.studentStats.averageAccuracy,
                    totalPracticeTime: s.studentStats.totalPracticeTime
                }
            };
        }));

        res.status(200).json({ data, generatedAt: new Date() });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF8.2 — Báo cáo giảng viên
router.get('/instructors', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ data: [], _warning: 'Database offline' });
    }
    try {
        const instructors = await User.find({ role: 'instructor' }).select('-password');

        const data = await Promise.all(instructors.map(async (inst) => {
            const [classCount, studentCount, assignmentCount] = await Promise.all([
                Class.countDocuments({ instructorId: inst._id, status: 'active' }),
                User.countDocuments({ instructorId: inst._id, role: 'user' }),
                Assignment.countDocuments({ instructorId: inst._id })
            ]);
            return { instructor: inst, classCount, studentCount, assignmentCount };
        }));

        res.status(200).json({ data, generatedAt: new Date() });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF8.3 — Báo cáo hệ thống
router.get('/system', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ _warning: 'Database offline' });
    }
    try {
        const [totalAccounts, totalSubmissions, totalRecognitions] = await Promise.all([
            User.countDocuments({}),
            Submission.countDocuments({}),
            User.aggregate([{ $group: { _id: null, total: { $sum: '$studentStats.totalPracticeCount' } } }])
        ]);

        res.status(200).json({
            totalAccounts,
            totalSubmissions,
            totalRecognitions: totalRecognitions[0]?.total || 0,
            generatedAt: new Date()
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
