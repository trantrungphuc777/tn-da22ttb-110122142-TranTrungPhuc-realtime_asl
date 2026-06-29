import express from 'express';
import mongoose from 'mongoose';
import User from '../../models/User.js';
import Class from '../../models/Class.js';
import Assignment from '../../models/Assignment.js';
import Exam from '../../models/Exam.js';
import Submission from '../../models/Submission.js';
import { authMiddleware, requireAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(requireAdmin);

// CF7.1 — Thống kê học viên
router.get('/students', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ _warning: 'Database offline' });
    }
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [total, active, inactive] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            User.countDocuments({ role: 'user', 'studentStats.lastPracticeDate': { $gte: sevenDaysAgo } }),
            User.countDocuments({ role: 'user', $or: [{ 'studentStats.lastPracticeDate': { $lt: sevenDaysAgo } }, { 'studentStats.lastPracticeDate': null }] })
        ]);

        const avgScoreAgg = await User.aggregate([
            { $match: { role: 'user' } },
            { $group: { _id: null, avgScore: { $avg: '$studentStats.averageScore' } } }
        ]);

        const totalSubmissions = await Submission.countDocuments({});
        const completedSubmissions = await Submission.countDocuments({ status: { $in: ['completed', 'graded'] } });
        const completionRate = totalSubmissions > 0 ? Math.round((completedSubmissions / totalSubmissions) * 100) : 0;

        // Biểu đồ đăng ký theo tháng
        const now = new Date();
        const monthlyRegistrations = await User.aggregate([
            { $match: { role: 'user', createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) } } },
            { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Biểu đồ hoạt động học tập
        const learningActivity = await Submission.aggregate([
            { $match: { createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) } } },
            { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.status(200).json({
            total, active, inactive, completionRate,
            averageScore: Math.round((avgScoreAgg[0]?.avgScore || 0) * 10) / 10,
            charts: { monthlyRegistrations, learningActivity }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF7.2 — Phân tích học viên (tiến bộ nhất, yếu nhất, tích cực nhất)
router.get('/students/analysis', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ _warning: 'Database offline' });
    }
    try {
        const [mostImproved, weakest, mostActive] = await Promise.all([
            // Tiến bộ nhất: điểm trung bình cao + có thực hành
            User.find({ role: 'user', 'studentStats.totalPracticeCount': { $gt: 0 } })
                .select('fullName email studentStats')
                .sort({ 'studentStats.averageScore': -1, 'studentStats.averageAccuracy': -1 })
                .limit(5),
            // Yếu nhất: điểm thấp, ít thực hành
            User.find({ role: 'user' })
                .select('fullName email studentStats')
                .sort({ 'studentStats.averageScore': 1, 'studentStats.totalPracticeCount': 1 })
                .limit(5),
            // Tích cực nhất: thời gian thực hành cao, bài hoàn thành cao
            User.find({ role: 'user' })
                .select('fullName email studentStats')
                .sort({ 'studentStats.totalPracticeTime': -1, 'studentStats.totalAssignmentsCompleted': -1 })
                .limit(5)
        ]);

        res.status(200).json({ mostImproved, weakest, mostActive });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF7.3 + CF7.4 — Thống kê + phân tích giảng viên
router.get('/instructors', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ _warning: 'Database offline' });
    }
    try {
        const instructors = await User.find({ role: 'instructor' }).select('fullName email createdAt');

        const instructorStats = await Promise.all(instructors.map(async (inst) => {
            const [studentCount, classCount, assignmentCount] = await Promise.all([
                User.countDocuments({ instructorId: inst._id, role: 'user' }),
                Class.countDocuments({ instructorId: inst._id, status: 'active' }),
                Assignment.countDocuments({ instructorId: inst._id })
            ]);
            return { ...inst.toObject(), studentCount, classCount, assignmentCount };
        }));

        // Lớp hiệu quả nhất (tỷ lệ hoàn thành cao)
        const topClasses = await Class.find({ status: 'active' })
            .populate('instructorId', 'fullName')
            .sort({ 'classStats.completionRate': -1 })
            .limit(5);

        res.status(200).json({ instructors: instructorStats, topClasses });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF7.5 + CF7.6 — Thống kê + phân tích nội dung
router.get('/content', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ _warning: 'Database offline' });
    }
    try {
        // Bài thực hành dùng nhiều nhất
        const topAssignments = await Assignment.aggregate([
            { $lookup: { from: 'submissions', localField: '_id', foreignField: 'assignmentId', as: 'submissions' } },
            { $addFields: { submissionCount: { $size: '$submissions' } } },
            { $sort: { submissionCount: -1 } },
            { $limit: 5 },
            { $project: { title: 1, type: 1, submissionCount: 1 } }
        ]);

        // Bài kiểm tra dùng nhiều nhất
        const topExams = await Exam.aggregate([
            { $lookup: { from: 'submissions', localField: '_id', foreignField: 'examId', as: 'submissions' } },
            { $addFields: { submissionCount: { $size: '$submissions' } } },
            { $sort: { submissionCount: -1 } },
            { $limit: 5 },
            { $project: { title: 1, type: 1, submissionCount: 1 } }
        ]);

        // Ký hiệu khó nhất / dễ nhầm nhất từ commonErrors
        const errorAgg = await User.aggregate([
            { $match: { role: 'user' } },
            { $unwind: { path: '$commonErrors', preserveNullAndEmptyArrays: false } },
            { $group: { _id: '$commonErrors', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Ký hiệu dễ nhầm nhất: lấy từ submission answers có predicted != expected (nếu có field đó)
        // hoặc từ commonErrors của user — chỉ dùng dữ liệu thật, không hardcode
        const confusedPairsRaw = await Submission.aggregate([
            // Mỗi submission có thể chứa mảng answers với predicted/expected
            { $unwind: { path: '$answers', preserveNullAndEmptyArrays: false } },
            {
                $match: {
                    'answers.predicted': { $exists: true, $ne: null },
                    'answers.expected': { $exists: true, $ne: null },
                    $expr: { $ne: ['$answers.predicted', '$answers.expected'] }
                }
            },
            {
                $group: {
                    _id: {
                        sign1: { $cond: [{ $lt: ['$answers.expected', '$answers.predicted'] }, '$answers.expected', '$answers.predicted'] },
                        sign2: { $cond: [{ $lt: ['$answers.expected', '$answers.predicted'] }, '$answers.predicted', '$answers.expected'] }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $project: {
                    _id: 0,
                    sign1: '$_id.sign1',
                    sign2: '$_id.sign2',
                    count: 1
                }
            }
        ]);

        // Nếu submissions không có field answers.predicted/expected,
        // fallback sang commonErrors của user (không hardcode cặp)
        let confusedPairs = confusedPairsRaw;
        if (confusedPairs.length === 0) {
            const errorList = await User.aggregate([
                { $match: { role: 'user', 'commonErrors.0': { $exists: true } } },
                { $unwind: '$commonErrors' },
                { $group: { _id: '$commonErrors', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 20 }
            ]);
            // Ghép các ký hiệu lỗi thành cặp dựa trên alphabet gần nhau (thật từ data)
            const topSigns = errorList.map(e => ({ sign: e._id, count: e.count }));
            confusedPairs = [];
            for (let i = 0; i < topSigns.length - 1; i++) {
                for (let j = i + 1; j < topSigns.length; j++) {
                    const code1 = topSigns[i].sign?.charCodeAt(0) || 0;
                    const code2 = topSigns[j].sign?.charCodeAt(0) || 0;
                    if (Math.abs(code1 - code2) <= 3) {
                        confusedPairs.push({
                            sign1: topSigns[i].sign,
                            sign2: topSigns[j].sign,
                            count: topSigns[i].count + topSigns[j].count
                        });
                    }
                }
            }
            confusedPairs = confusedPairs.sort((a, b) => b.count - a.count).slice(0, 5);
        }

        res.status(200).json({ topAssignments, topExams, hardestSigns: errorAgg, confusedPairs });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
