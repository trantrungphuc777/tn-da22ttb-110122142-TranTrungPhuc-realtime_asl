import express from 'express';
import mongoose from 'mongoose';
import Submission from '../../models/Submission.js';
import User from '../../models/User.js';
import Assignment from '../../models/Assignment.js';
import Exam from '../../models/Exam.js';
import InstructorFeedback from '../../models/InstructorFeedback.js';
import { authMiddleware, requireInstructor } from '../../middleware/authMiddleware.js';
import { recalcStudentStats } from '../../utils/recalcStudentStats.js';
import { recalcClassStats } from '../../utils/recalcClassStats.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireInstructor);

router.get('/', async (req, res) => {
    // Check DB connection first
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({
            submissions: [],
            pagination: { page: 1, limit: 20, total: 0, pages: 0 },
            _warning: 'Database đang offline'
        });
    }

    try {
        const { status, studentId, assignmentId, page = 1, limit = 20 } = req.query;
        const instructorId = req.user.id;

        const query = { instructorId };
        if (status) query.status = status;
        if (studentId) query.studentId = studentId;
        if (assignmentId) query.assignmentId = assignmentId;

        const [submissions, total] = await Promise.all([
            Submission.find(query)
                .populate('studentId', 'fullName email studentStats')
                .populate('assignmentId', 'title type')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Submission.countDocuments(query)
        ]);

        res.status(200).json({
            submissions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const instructorId = req.user.id;

        const submission = await Submission.findOne({ _id: id, instructorId })
            .populate('studentId', 'fullName email studentStats practicedContent commonErrors')
            .populate('assignmentId', 'title type content settings')
            .populate('examId', 'title questions settings')
            .populate('gradedBy', 'fullName');

        if (!submission) {
            return res.status(404).json({ message: 'Không tìm thấy bài nộp!' });
        }

        res.status(200).json({ submission });
    } catch (error) {
        console.error('Get submission detail error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.put('/:id/grade', async (req, res) => {
    try {
        const { id } = req.params;
        const { score, feedback, accuracy, errors } = req.body;
        const instructorId = req.user.id;

        const submission = await Submission.findOneAndUpdate(
            { _id: id, instructorId },
            {
                $set: {
                    score,
                    feedback,
                    accuracy,
                    status: 'graded',
                    gradedBy: instructorId,
                    gradedAt: new Date(),
                    submittedAt: new Date()
                },
                $push: {
                    errors: { $each: errors || [] }
                }
            },
            { new: true }
        ).populate('studentId', 'fullName email');

        if (!submission) {
            return res.status(404).json({ message: 'Không tìm thấy bài nộp!' });
        }

        // ── Cập nhật studentStats realtime từ Submission thực tế ──────
        try { await recalcStudentStats(submission.studentId._id); } catch (e) {
            console.error('recalcStudentStats (grade) error:', e.message);
        }

        // ── Cập nhật classStats cho các lớp của học viên ──────────────
        try {
            const studentDoc = await User.findById(submission.studentId._id).select('classIds');
            if (studentDoc?.classIds?.length) {
                await Promise.all(studentDoc.classIds.map(cid => recalcClassStats(cid)));
            }
        } catch (e) {
            console.error('recalcClassStats (grade) error:', e.message);
        }

        if (feedback) {
            await new InstructorFeedback({
                instructorId,
                studentId: submission.studentId._id,
                type: 'correction',
                title: 'Nhận xét bài tập',
                content: feedback,
                relatedSubmission: id,
                relatedAssignment: submission.assignmentId
            }).save();
        }

        res.status(200).json({ message: 'Chấm điểm thành công!', submission });
    } catch (error) {
        console.error('Grade submission error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.post('/students/:studentId/feedback', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { type, title, content, relatedAssignment } = req.body;
        const instructorId = req.user.id;

        const student = await User.findOne({ _id: studentId, instructorId, role: 'user' });
        if (!student) {
            return res.status(404).json({ message: 'Không tìm thấy học viên!' });
        }

        const feedback = new InstructorFeedback({
            instructorId,
            studentId,
            type: type || 'suggestion',
            title,
            content,
            relatedAssignment
        });

        await feedback.save();

        res.status(201).json({ message: 'Gửi nhận xét thành công!', feedback });
    } catch (error) {
        console.error('Send feedback error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.get('/students/:studentId/feedback', async (req, res) => {
    try {
        const { studentId } = req.params;
        const instructorId = req.user.id;

        const feedback = await InstructorFeedback.find({ instructorId, studentId })
            .populate('relatedAssignment', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json({ feedback });
    } catch (error) {
        console.error('Get feedback error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.get('/evaluation/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const instructorId = req.user.id;

        const student = await User.findOne({ _id: studentId, instructorId, role: 'user' }).select('-password');
        if (!student) {
            return res.status(404).json({ message: 'Không tìm thấy học viên!' });
        }

        const submissions = await Submission.find({ studentId, instructorId })
            .populate('assignmentId', 'type')
            .lean();

        // Tính accuracy thực tế từ submissions thay vì dùng studentStats cached
        const accuracySubs = submissions.filter(s => s.accuracy !== null && s.accuracy !== undefined && s.accuracy > 0);
        const realAccuracy = accuracySubs.length > 0
            ? Math.round(accuracySubs.reduce((a, s) => a + s.accuracy, 0) / accuracySubs.length * 10) / 10
            : 0;

        // Tính practicedContent từ answers[] để dùng cho memoryScore
        const practicedLetters = new Set();
        const practicedWords   = new Set();
        const practicedSentences = new Set();
        submissions.forEach(sub => {
            const assignType = sub.assignmentId?.type || 'letter';
            (sub.answers || []).forEach(ans => {
                const content = ans.question || ans.studentAnswer || ans.answer;
                if (!content || typeof content !== 'string') return;
                if (assignType === 'word') practicedWords.add(content);
                else if (assignType === 'sentence') practicedSentences.add(content);
                else practicedLetters.add(content.toUpperCase());
            });
        });
        const realPracticedContent = {
            letters:   [...practicedLetters],
            words:     [...practicedWords],
            sentences: [...practicedSentences],
        };

        // Nếu chưa có bài nào → toàn bộ metric = 0
        if (submissions.length === 0) {
            return res.status(200).json({
                evaluation: {
                    accuracy: 0, speed: 0, frequency: 0,
                    improvement: 0, memory: 0, overallScore: 0,
                    strengths: [], weaknesses: [], suggestions: []
                },
                student
            });
        }

        const evaluation = {
            accuracy:    realAccuracy,
            speed:       calculateSpeedScore(submissions),
            frequency:   calculateFrequencyScore(student.studentStats.totalPracticeCount),
            improvement: calculateImprovementScore(submissions),
            memory:      calculateMemoryScore(realPracticedContent),
            overallScore: 0,
            strengths: [],
            weaknesses: [],
            suggestions: []
        };

        // overallScore: các giá trị đã là 0-100, chỉ lấy weighted average rồi round
        evaluation.overallScore = Math.min(100, Math.round(
            evaluation.accuracy    * 0.30 +
            evaluation.speed       * 0.20 +
            evaluation.frequency   * 0.15 +
            evaluation.improvement * 0.20 +
            evaluation.memory      * 0.15
        ));

        if (evaluation.accuracy > 80) evaluation.strengths.push('Độ chính xác thủ ngữ tốt');
        if (evaluation.speed > 70) evaluation.strengths.push('Tốc độ phản xạ nhanh');
        if (evaluation.frequency > 70) evaluation.strengths.push('Tần suất luyện tập cao');

        if (evaluation.accuracy < 60) {
            evaluation.weaknesses.push('Cần cải thiện độ chính xác');
            evaluation.suggestions.push('Luyện tập thêm các ký hiệu cơ bản');
        }
        if (evaluation.speed < 50) {
            evaluation.weaknesses.push('Tốc độ phản xạ chậm');
            evaluation.suggestions.push('Tập trung vào các ký hiệu thường gặp');
        }

        res.status(200).json({ evaluation, student });
    } catch (error) {
        console.error('Evaluation error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

function calculateSpeedScore(submissions) {
    // Lọc bài có timeSpent > 0 thực sự
    const validSubs = submissions.filter(s => s.timeSpent && s.timeSpent > 0);
    if (!validSubs.length) return 0;
    const avgTime = validSubs.reduce((sum, s) => sum + s.timeSpent, 0) / validSubs.length;
    // avgTime tính bằng giây; < 30s = nhanh (100đ), > 300s = chậm (0đ)
    return Math.max(0, Math.min(100, Math.round(100 - ((avgTime - 30) / 270) * 100)));
}

function calculateFrequencyScore(practiceCount) {
    if (!practiceCount || practiceCount === 0) return 0;
    return Math.min(100, Math.round(practiceCount * 5));
}

function calculateImprovementScore(submissions) {
    // Chưa làm bài → 0, không phải 50
    if (!submissions.length) return 0;
    // Chỉ 1 bài → không có dữ liệu so sánh → trả về score bài đó (chuẩn hóa 0-100)
    if (submissions.length < 2) {
        return Math.min(100, submissions[0].score || 0);
    }
    const half = Math.ceil(submissions.length / 2);
    const recent = submissions.slice(0, half);
    const older  = submissions.slice(half);
    const recentAvg = recent.reduce((sum, s) => sum + (s.score || 0), 0) / recent.length;
    const olderAvg  = older.reduce((sum,  s) => sum + (s.score || 0), 0) / older.length;
    // Base 50 chỉ khi đã có dữ liệu so sánh
    return recentAvg > olderAvg
        ? Math.min(100, Math.round(50 + (recentAvg - olderAvg) * 2))
        : Math.max(0,   Math.round(50 - (olderAvg - recentAvg) * 2));
}

function calculateMemoryScore(practicedContent) {
    if (!practicedContent) return 0;
    const total = (practicedContent.letters?.length   || 0) +
                  (practicedContent.words?.length     || 0) +
                  (practicedContent.sentences?.length || 0);
    if (total === 0) return 0;
    return Math.min(100, Math.round(total * 2));
}

export default router;
