import express from 'express';
import mongoose from 'mongoose';
import User from '../../models/User.js';
import Class from '../../models/Class.js';
import Assignment from '../../models/Assignment.js';
import Exam from '../../models/Exam.js';
import Submission from '../../models/Submission.js';
import Badge from '../../models/Badge.js';
import StudentBadge from '../../models/StudentBadge.js';
import { authMiddleware, requireAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(requireAdmin);

// CF1 — Dashboard tổng thể
router.get('/', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({
            userStats: { totalStudents: 0, totalInstructors: 0, totalAccounts: 0, activeAccounts: 0, lockedAccounts: 0, newToday: 0, newThisMonth: 0 },
            learningStats: { totalAssignments: 0, totalExams: 0, totalPracticeCount: 0, totalRecognitions: 0, completedToday: 0, completedThisMonth: 0 },
            systemStats: { status: 'online', dbSize: '0 MB', onlineUsers: null, newAccountsToday: 0, uptime: '0h' },
            charts: { userGrowth: [], learningActivity: [], completionRate: 0, recognitionRate: { correct: 0, incorrect: 0 } },
            _warning: 'Database đang offline'
        });
    }

    try {
        const now = new Date();
        // Dùng UTC để tránh lệch timezone giữa server và MongoDB
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const yearAgo      = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), 1));
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // ── User stats ────────────────────────────────────────────────────────
        const [
            totalStudents,
            totalInstructors,
            totalAccounts,
            activeAccounts,
            lockedAccounts,
            newToday,
            newThisMonth
        ] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            User.countDocuments({ role: 'instructor' }),
            User.countDocuments({}),
            User.countDocuments({ isActive: true }),
            User.countDocuments({ isActive: false }),
            User.countDocuments({ createdAt: { $gte: startOfDay } }),
            User.countDocuments({ createdAt: { $gte: startOfMonth } })
        ]);

        // ── Assignment / Exam counts ──────────────────────────────────────────
        const [totalAssignments, totalExams] = await Promise.all([
            Assignment.countDocuments({}),
            Exam.countDocuments({})
        ]);

        // ── Lượt nộp bài thực tế ─────────────────────────────────────────────
        // totalSubmissions: tổng tất cả submissions (bao gồm cả not_started/in_progress)
        // totalSubmittedCount: chỉ những bài đã thực sự nộp (completed/graded/overdue/incomplete)
        const [totalPracticeCount, totalSubmittedCount] = await Promise.all([
            Submission.countDocuments({}),
            Submission.countDocuments({ status: { $in: ['completed', 'graded', 'overdue', 'incomplete'] } })
        ]);

        // ── Tách assignment submissions vs exam submissions ────────────────────
        // Dùng $exists + $ne null để tránh miss document có field absent (undefined) vs null
        const [totalAssignmentSubmissions, totalExamSubmissions] = await Promise.all([
            Submission.countDocuments({ assignmentId: { $exists: true, $ne: null } }),
            Submission.countDocuments({ examId: { $exists: true, $ne: null } })
        ]);

        // ── Submissions hoàn thành hôm nay / tháng này ───────────────────────
        // Chỉ dùng submittedAt (thời điểm học viên thực sự nộp bài)
        // Nếu submittedAt không có thì fallback createdAt (submission được tạo khi nộp)
        const [completedToday, completedThisMonth] = await Promise.all([
            Submission.countDocuments({
                status: { $in: ['completed', 'graded'] },
                $or: [
                    { submittedAt: { $gte: startOfDay } },
                    { submittedAt: { $exists: false }, createdAt: { $gte: startOfDay } },
                    { submittedAt: null, createdAt: { $gte: startOfDay } }
                ]
            }),
            Submission.countDocuments({
                status: { $in: ['completed', 'graded'] },
                $or: [
                    { submittedAt: { $gte: startOfMonth } },
                    { submittedAt: { $exists: false }, createdAt: { $gte: startOfMonth } },
                    { submittedAt: null, createdAt: { $gte: startOfMonth } }
                ]
            })
        ]);

        // ── Huy hiệu ──────────────────────────────────────────────────────────
        const [totalBadges, totalBadgesAwarded] = await Promise.all([
            Badge.countDocuments({ isActive: true }),
            StudentBadge.countDocuments({})
        ]);

        // ── DB size thực tế ───────────────────────────────────────────────────
        let dbSizeStr = 'N/A';
        try {
            const dbStats = await mongoose.connection.db.command({ dbStats: 1 });
            const sizeBytes = dbStats.dataSize + (dbStats.indexSize || 0);
            dbSizeStr = sizeBytes < 1024 * 1024
                ? `${Math.round(sizeBytes / 1024)} KB`
                : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
        } catch {}

        // ── Tỷ lệ hoàn thành ─────────────────────────────────────────────────
        // completedSubmissions / totalSubmittedCount (chỉ tính bài đã thực sự nộp)
        // Không dùng totalPracticeCount vì nó gồm cả not_started/in_progress
        const completedSubmissions = await Submission.countDocuments({ status: { $in: ['completed', 'graded'] } });
        const completionDenominator = totalSubmittedCount > 0 ? totalSubmittedCount : (totalPracticeCount > 0 ? totalPracticeCount : 1);
        const completionRate = Math.round((completedSubmissions / completionDenominator) * 100);

        // ── Tỷ lệ nhận diện đúng/sai từ accuracy thực tế ─────────────────────
        const accuracyAgg = await Submission.aggregate([
            { $match: { accuracy: { $ne: null, $gt: 0 } } },
            { $group: { _id: null, avgAccuracy: { $avg: '$accuracy' }, count: { $sum: 1 } } }
        ]);
        const avgAccuracy = accuracyAgg[0]?.avgAccuracy || 0;

        // ── Điểm trung bình toàn hệ thống ─────────────────────────────────────
        const avgScoreAgg = await Submission.aggregate([
            { $match: { score: { $ne: null, $gt: 0 } } },
            { $group: { _id: null, avg: { $avg: '$score' } } }
        ]);
        const avgScore = Math.round(avgScoreAgg[0]?.avg || 0);

        // ── Tăng trưởng người dùng theo tháng (12 tháng gần nhất) ─────────────
        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: yearAgo } } },
            { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // ── Tăng trưởng người dùng theo ngày (30 ngày gần nhất) ──────────────
        const userGrowthDaily = await User.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // ── Hoạt động học tập theo tháng — TÁCH assignment vs exam ────────────
        // Submissions có assignmentId → Thực hành
        // Submissions có examId       → Kiểm tra
        // Dùng $exists + $ne null để bắt đúng cả field absent lẫn field null
        const [assignmentActivity, examActivity] = await Promise.all([
            Submission.aggregate([
                { $match: { createdAt: { $gte: yearAgo }, assignmentId: { $exists: true, $ne: null } } },
                { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            Submission.aggregate([
                { $match: { createdAt: { $gte: yearAgo }, examId: { $exists: true, $ne: null } } },
                { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ])
        ]);

        // Merge hai mảng theo cùng tháng
        const activityMap = {};
        for (const item of assignmentActivity) {
            const key = `${item._id.year}-${item._id.month}`;
            if (!activityMap[key]) activityMap[key] = { _id: item._id, count: 0, examCount: 0 };
            activityMap[key].count = item.count;
        }
        for (const item of examActivity) {
            const key = `${item._id.year}-${item._id.month}`;
            if (!activityMap[key]) activityMap[key] = { _id: item._id, count: 0, examCount: 0 };
            activityMap[key].examCount = item.count;
        }
        const learningActivity = Object.values(activityMap).sort(
            (a, b) => a._id.year !== b._id.year ? a._id.year - b._id.year : a._id.month - b._id.month
        );

        // ── Uptime ────────────────────────────────────────────────────────────
        const uptimeSeconds = process.uptime();
        const uptimeStr = uptimeSeconds < 3600
            ? `${Math.floor(uptimeSeconds / 60)}m`
            : `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`;

        res.status(200).json({
            userStats: {
                totalStudents,
                totalInstructors,
                totalAccounts,
                activeAccounts,
                lockedAccounts,
                newToday,
                newThisMonth
            },
            learningStats: {
                totalAssignments,
                totalExams,
                totalPracticeCount,              // Tổng tất cả submissions (kể cả not_started)
                totalSubmittedCount,             // Tổng submissions đã thực sự nộp (completed/graded/overdue/incomplete)
                totalAssignmentSubmissions,      // Submissions từ bài tập
                totalExamSubmissions,            // Submissions từ bài kiểm tra
                completedToday,
                completedThisMonth,
                avgScore
            },
            systemStats: {
                status: 'online',
                dbSize: dbSizeStr,
                // onlineUsers: null vì không có WebSocket/Redis session store để track real-time
                onlineUsers: null,
                // newAccountsToday: số tài khoản tạo mới hôm nay (không phải login)
                newAccountsToday: newToday,
                uptime: uptimeStr,
                totalBadges,
                totalBadgesAwarded
            },
            charts: {
                userGrowth,
                userGrowthDaily,
                learningActivity,          // Đã có examCount riêng
                completionRate,
                recognitionRate: {
                    correct:   Math.round(avgAccuracy),
                    incorrect: Math.round(100 - avgAccuracy)
                },
                avgScore
            }
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
