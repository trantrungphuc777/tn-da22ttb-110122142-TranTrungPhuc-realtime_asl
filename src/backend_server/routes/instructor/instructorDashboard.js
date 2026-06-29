import express from 'express';
import mongoose from 'mongoose';
import User from '../../models/User.js';
import Class from '../../models/Class.js';
import Assignment from '../../models/Assignment.js';
import Submission from '../../models/Submission.js';
import Exam from '../../models/Exam.js';
import InstructorFeedback from '../../models/InstructorFeedback.js';
import { authMiddleware, requireInstructor } from '../../middleware/authMiddleware.js';
import { checkDbConnection } from '../../middleware/dbCheck.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireInstructor);

router.get('/', async (req, res) => {
    // Check DB connection first
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({
            stats: {
                totalStudents: 0,
                activeStudents: 0,
                totalClasses: 0,
                totalAssignments: 0,
                totalExams: 0,
                completedSubmissions: 0,
                pendingSubmissions: 0,
                gradedSubmissions: 0,
                averageScore: 0,
                averageAccuracy: 0,
                completionRate: 0
            },
            studentsWithStats: [],
            recentActivity: [],
            lowPerformers: [],
            topPerformers: [],
            classStats: [],
            _warning: 'Database đang offline - hiển thị dữ liệu mẫu'
        });
    }

    try {
        const instructorId = req.user.id;

        const [
            totalStudents,
            activeStudents,
            totalClasses,
            totalAssignments,
            totalExams,
            recentSubmissions,
            pendingSubmissions,
            classStats
        ] = await Promise.all([
            User.countDocuments({ instructorId, role: 'user' }),
            User.countDocuments({ instructorId, role: 'user', 'studentStats.lastPracticeDate': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
            Class.countDocuments({ instructorId, status: 'active' }),
            Assignment.countDocuments({ instructorId }),
            Exam.countDocuments({ instructorId }),
            Submission.find({ instructorId })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('studentId', 'fullName email'),
            Submission.countDocuments({ instructorId, status: { $in: ['not_started', 'in_progress'] } }),
            Class.find({ instructorId, status: 'active' })
        ]);

        const completedSubmissions = await Submission.countDocuments({ instructorId, status: 'completed' });
        const gradedSubmissions = await Submission.countDocuments({ instructorId, status: 'graded' });

        const averageScoreResult = await Submission.aggregate([
            { $match: { instructorId: instructorId, score: { $ne: null } } },
            { $group: { _id: null, avgScore: { $avg: '$score' }, avgAccuracy: { $avg: '$accuracy' } } }
        ]);

        const studentsWithStats = await User.find({ instructorId, role: 'user' })
            .select('fullName email studentStats createdAt')
            .sort({ 'studentStats.averageScore': -1 })
            .limit(5);

        const recentActivity = await Submission.find({ instructorId })
            .sort({ updatedAt: -1 })
            .limit(10)
            .populate('studentId', 'fullName')
            .populate('assignmentId', 'title');

        const lowPerformers = await User.find({ instructorId, role: 'user', 'studentStats.averageScore': { $lt: 50 } })
            .select('fullName email studentStats')
            .limit(5);

        const topPerformers = await User.find({ instructorId, role: 'user' })
            .select('fullName email studentStats')
            .sort({ 'studentStats.averageScore': -1 })
            .limit(5);

        res.status(200).json({
            stats: {
                totalStudents,
                activeStudents,
                totalClasses,
                totalAssignments,
                totalExams,
                completedSubmissions,
                pendingSubmissions,
                gradedSubmissions,
                averageScore: averageScoreResult[0]?.avgScore || 0,
                averageAccuracy: averageScoreResult[0]?.avgAccuracy || 0,
                completionRate: totalStudents > 0 ? Math.round((completedSubmissions / (totalStudents * Math.max(totalAssignments, 1))) * 100) : 0
            },
            studentsWithStats,
            recentActivity,
            lowPerformers,
            topPerformers,
            classStats
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.get('/students', async (req, res) => {
    // Check DB connection first
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({
            students: [],
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                pages: 0
            },
            _warning: 'Database đang offline'
        });
    }

    try {
        const { page = 1, limit = 10, search = '', level = '', status = '', sortBy = 'createdAt', order = 'desc' } = req.query;
        const instructorId = req.user.id;

        const query = { instructorId, role: 'user' };

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (level) {
            query['studentStats.level'] = level;
        }

        if (status === 'active') {
            query['studentStats.lastPracticeDate'] = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
        } else if (status === 'inactive') {
            query.$or = [
                { 'studentStats.lastPracticeDate': { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
                { 'studentStats.lastPracticeDate': null }
            ];
        }

        const sortOptions = {};
        sortOptions[sortBy] = order === 'asc' ? 1 : -1;

        const [students, total] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort(sortOptions)
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            User.countDocuments(query)
        ]);

        const studentsWithDetails = await Promise.all(students.map(async (student) => {
            // Dùng ObjectId để match chính xác, tránh lỗi string vs ObjectId
            const submissions = await Submission.find({
                studentId:    student._id,
                instructorId: new mongoose.Types.ObjectId(instructorId)
            }).populate('assignmentId', 'title settings').populate('examId', 'title settings passingScore').lean();

            // Fallback: nếu không có submission nào (instructorId có thể null trong data cũ),
            // lấy tất cả submissions của học viên này
            const allSubs = submissions.length > 0 ? submissions :
                await Submission.find({ studentId: student._id })
                    .populate('assignmentId', 'title settings').populate('examId', 'title settings passingScore').lean();

            // Tách assignment submissions và exam submissions
            const assignmentSubs = allSubs.filter(s => s.assignmentId && s.assignmentId._id);
            const examSubs       = allSubs.filter(s => s.examId && s.examId._id);

            // Thu thập tất cả assignmentId unique để fetch passingScore một lần
            const uniqueAssignmentIdSet = new Set(
                assignmentSubs.map(s => s.assignmentId._id.toString())
            );
            const uniqueExamIdSet = new Set(
                examSubs.map(s => s.examId._id.toString())
            );

            // Fetch passingScore trực tiếp từ Assignment/Exam — không qua populate
            const [assignmentDocs, examDocs] = await Promise.all([
                Assignment.find({ _id: { $in: [...uniqueAssignmentIdSet].map(id => new mongoose.Types.ObjectId(id)) } })
                    .select('settings').lean(),
                Exam.find({ _id: { $in: [...uniqueExamIdSet].map(id => new mongoose.Types.ObjectId(id)) } })
                    .select('settings').lean(),
            ]);
            const assignmentPassingMap = {};
            assignmentDocs.forEach(a => { assignmentPassingMap[a._id.toString()] = a.settings?.passingScore ?? 60; });
            const examPassingMap = {};
            examDocs.forEach(e => { examPassingMap[e._id.toString()] = e.settings?.passingScore ?? 70; });

            // Unique assignments đã nộp — giữ lần điểm cao nhất
            const uniqueAssignmentMap = {};
            assignmentSubs.forEach(s => {
                const id = s.assignmentId._id.toString();
                const prev = uniqueAssignmentMap[id];
                if (!prev || (s.score ?? -1) > (prev.score ?? -1)) {
                    const passingScore = assignmentPassingMap[id] ?? 60;
                    const score = s.score ?? null;
                    uniqueAssignmentMap[id] = {
                        id,
                        title:        s.assignmentId.title || 'Bài tập',
                        score,
                        passingScore,
                        isCompleted:  score !== null && score >= passingScore,
                        submittedAt:  s.submittedAt || s.createdAt,
                    };
                }
            });

            // Unique exams đã nộp — giữ lần điểm cao nhất
            const uniqueExamMap = {};
            examSubs.forEach(s => {
                const id = s.examId._id.toString();
                const prev = uniqueExamMap[id];
                if (!prev || (s.score ?? -1) > (prev.score ?? -1)) {
                    const passingScore = examPassingMap[id] ?? 70;
                    const score = s.score ?? null;
                    uniqueExamMap[id] = {
                        id,
                        title:        s.examId.title || 'Bài kiểm tra',
                        score,
                        passingScore,
                        isCompleted:  score !== null && score >= passingScore,
                        submittedAt:  s.submittedAt || s.createdAt,
                    };
                }
            });

            const assignmentSubmissions = Object.values(uniqueAssignmentMap);
            const examSubmissions       = Object.values(uniqueExamMap);

            // Tính avgScore và avgAccuracy realtime từ allSubs
            const scoredSubs   = allSubs.filter(s => s.score    !== null && s.score    !== undefined);
            const accuracySubs = allSubs.filter(s => s.accuracy !== null && s.accuracy !== undefined && s.accuracy > 0);
            const avgScore    = scoredSubs.length   > 0 ? Math.round(scoredSubs.reduce((a,s)   => a + s.score,    0) / scoredSubs.length   * 10) / 10 : 0;
            const avgAccuracy = accuracySubs.length > 0 ? Math.round(accuracySubs.reduce((a,s) => a + s.accuracy, 0) / accuracySubs.length * 10) / 10 : 0;

            return {
                ...student.toObject(),
                assignmentSubmissions,              // danh sách bài tập unique đã nộp
                examSubmissions,                    // danh sách bài kiểm tra unique đã nộp
                submissionCount:  assignmentSubmissions.length + examSubmissions.length,
                completedCount:   [...assignmentSubmissions, ...examSubmissions].filter(s => s.isCompleted).length,
                badgeCount:       student.badgeCount || 0,
                studentStats: {
                    ...(student.studentStats?.toObject?.() || student.studentStats || {}),
                    averageScore:    avgScore,
                    averageAccuracy: avgAccuracy,
                }
            };
        }));

        res.status(200).json({
            students: studentsWithDetails,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.get('/students/:id', async (req, res) => {
    // Check DB connection first
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({
            student: null,
            submissions: [],
            feedback: [],
            assignedAssignments: [],
            errorSummary: {},
            progress: {
                totalPracticeCount: 0,
                completedAssignments: 0,
                averageScore: 0,
                averageAccuracy: 0,
                practicedLetters: 0,
                practicedWords: 0,
                practicedSentences: 0
            },
            _warning: 'Database đang offline'
        });
    }

    try {
        const { id } = req.params;
        const instructorId = req.user.id;

        const student = await User.findOne({ _id: id, instructorId, role: 'user' }).select('-password');

        if (!student) {
            return res.status(404).json({ message: 'Không tìm thấy học viên!' });
        }

        const [submissions, feedback, assignments] = await Promise.all([
            Submission.find({ studentId: id, instructorId })
                .populate('assignmentId', 'title type')
                .sort({ createdAt: -1 })
                .limit(20),
            InstructorFeedback.find({ studentId: id, instructorId })
                .populate('relatedAssignment', 'title')
                .sort({ createdAt: -1 }),
            Assignment.find({ instructorId, assignedTo: id })
        ]);

        // ── Tính stats realtime từ Submission thay vì dùng studentStats cached ──
        const allSubmissions = await Submission.find({ studentId: id })
            .populate('assignmentId', 'type')
            .lean();

        const scoredSubs   = allSubmissions.filter(s => s.score    !== null && s.score    !== undefined);
        const accuracySubs = allSubmissions.filter(s => s.accuracy !== null && s.accuracy !== undefined && s.accuracy > 0);
        const realAvgScore    = scoredSubs.length   > 0 ? Math.round(scoredSubs.reduce((a,s)   => a + s.score,    0) / scoredSubs.length   * 10) / 10 : 0;
        const realAvgAccuracy = accuracySubs.length > 0 ? Math.round(accuracySubs.reduce((a,s) => a + s.accuracy, 0) / accuracySubs.length * 10) / 10 : 0;
        const sevenDaysAgo    = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const lastPracticeDate = allSubmissions.length > 0
            ? allSubmissions.reduce((latest, s) => { const d = s.submittedAt || s.createdAt; return d > latest ? d : latest; }, new Date(0))
            : null;

        // Unique assignments/exams đã làm = tổng lần luyện tập
        const uniqueTaskIds = new Set([
            ...allSubmissions.filter(s => s.assignmentId).map(s => s.assignmentId?._id?.toString() || s.assignmentId?.toString()),
            ...allSubmissions.filter(s => s.examId).map(s => s.examId.toString()),
        ].filter(Boolean));

        // ── Tính practicedContent từ answers[] trong Submission ──────────────
        // Mỗi answer có: { question: 'A', answer: 'A', isCorrect: true }
        // Dựa vào assignmentId.type (letter/word/sentence) để phân loại
        const practicedLetters   = new Set();
        const practicedWords     = new Set();
        const practicedSentences = new Set();

        allSubmissions.forEach(sub => {
            const assignType = sub.assignmentId?.type || 'letter';
            if (!sub.answers || !sub.answers.length) return;
            sub.answers.forEach(ans => {
                const content = ans.question || ans.studentAnswer || ans.answer;
                if (!content || typeof content !== 'string') return;
                if (assignType === 'word') {
                    practicedWords.add(content);
                } else if (assignType === 'sentence') {
                    practicedSentences.add(content);
                } else {
                    // letter (default)
                    practicedLetters.add(content.toUpperCase());
                }
            });
        });

        // Ghi đè studentStats và practicedContent bằng giá trị tính thực tế
        student.studentStats = {
            ...student.studentStats.toObject?.() || student.studentStats,
            averageScore:       realAvgScore,
            averageAccuracy:    realAvgAccuracy,
            totalPracticeCount: uniqueTaskIds.size,
            lastPracticeDate,
        };
        student.practicedContent = {
            letters:   [...practicedLetters],
            words:     [...practicedWords],
            sentences: [...practicedSentences],
        };

        const errorSummary = {};
        submissions.forEach(sub => {
            if (sub.errors) {
                sub.errors.forEach(err => {
                    errorSummary[err.type] = (errorSummary[err.type] || 0) + 1;
                });
            }
        });

        res.status(200).json({
            student,
            submissions,
            feedback,
            assignedAssignments: assignments,
            errorSummary,
            progress: {
                totalPracticeCount: uniqueTaskIds.size,
                completedAssignments: allSubmissions.filter(s => s.status === 'completed' || s.status === 'graded').length,
                averageScore:    realAvgScore,
                averageAccuracy: realAvgAccuracy,
                practicedLetters:   practicedLetters.size,
                practicedWords:     practicedWords.size,
                practicedSentences: practicedSentences.size,
            }
        });
    } catch (error) {
        console.error('Get student detail error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.put('/students/:id/assign', async (req, res) => {
    try {
        const { id } = req.params;
        const { classId } = req.body;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Chỉ admin mới có quyền phân công giảng viên!' });
        }

        const student = await User.findByIdAndUpdate(
            id,
            { instructorId: req.body.instructorId, assignedBy: req.user.id, assignedAt: new Date() },
            { new: true }
        ).select('-password');

        if (!student) {
            return res.status(404).json({ message: 'Không tìm thấy học viên!' });
        }

        if (classId) {
            await Class.findByIdAndUpdate(classId, { $addToSet: { studentIds: id } });
        }

        res.status(200).json({ message: 'Phân công giảng viên thành công!', student });
    } catch (error) {
        console.error('Assign student error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
