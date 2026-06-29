import express from 'express';
import mongoose from 'mongoose';
import Assignment from '../../models/Assignment.js';
import Exam from '../../models/Exam.js';
import Submission from '../../models/Submission.js';
import User from '../../models/User.js';
import Class from '../../models/Class.js';
import Notification from '../../models/Notification.js';
import Feedback from '../../models/Feedback.js';
import InstructorFeedback from '../../models/InstructorFeedback.js';
import SupportTicket from '../../models/SupportTicket.js';
import StudentBadge from '../../models/StudentBadge.js';
import Badge from '../../models/Badge.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { recalcStudentStats } from '../../utils/recalcStudentStats.js';
import { recalcClassStats } from '../../utils/recalcClassStats.js';

const router = express.Router();

router.use(authMiddleware);

// Helper function to check if student is assigned to an assignment/exam
const isStudentAssigned = async (item, studentId) => {
    if (item.assignedTo && item.assignedTo.some(id => id.toString() === studentId.toString())) {
        return true;
    }
    
    if (item.classIds && item.classIds.length > 0) {
        const student = await User.findById(studentId).select('classIds');
        if (student && student.classIds) {
            return item.classIds.some(classId => 
                student.classIds.some(sClassId => sClassId.toString() === classId.toString())
            );
        }
    }
    
    return false;
};

// Get assignments assigned to current student
router.get('/assignments', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({
            assignments: [],
            pagination: { page: 1, limit: 10, total: 0, pages: 0 },
            _warning: 'Database đang offline'
        });
    }

    try {
        const studentId = req.user.id;
        const { status = 'all', page = 1, limit = 10 } = req.query;

        const student = await User.findById(studentId).select('classIds');
        const studentClassIds = student?.classIds || [];

        const query = {
            status: 'published',
            $or: [
                { assignedTo: studentId }
            ]
        };

        if (studentClassIds.length > 0) {
            query.$or.push({ classIds: { $in: studentClassIds } });
        }

        const [assignments, total] = await Promise.all([
            Assignment.find(query)
                .populate('instructorId', 'fullName email')
                .sort({ dueDate: 1, createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Assignment.countDocuments(query)
        ]);

        const assignmentsWithSubmission = await Promise.all(assignments.map(async (assignment) => {
            const submission = await Submission.findOne({
                assignmentId: assignment._id,
                studentId: studentId
            }).sort({ createdAt: -1 });

            const attemptCount = await Submission.countDocuments({
                assignmentId: assignment._id,
                studentId: studentId
            });

            // Điểm cao nhất trong tất cả các lần nộp
            const bestSubmission = await Submission.findOne({
                assignmentId: assignment._id,
                studentId: studentId,
                score: { $ne: null }
            }).sort({ score: -1 });
            const bestScore = bestSubmission ? bestSubmission.score : null;

            const maxAttempts = assignment.settings?.maxAttempts ?? null;
            const remainingAttempts = maxAttempts === null ? null : Math.max(0, maxAttempts - attemptCount);
            const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
            const passingScore = assignment.settings?.passingScore ?? 60;

            // isCompleted = true khi học viên có ít nhất 1 lần đạt điểm >= passingScore
            const isCompleted = bestScore !== null && bestScore >= passingScore;

            // isFailed = đã làm hết lượt (hoặc hết hạn) nhưng chưa lần nào đủ điểm
            // (chỉ dùng để phân biệt "chưa đạt" vs "chưa hoàn thành")
            const noAttemptsLeft = maxAttempts !== null && remainingAttempts === 0;
            const isFailed = !isCompleted && attemptCount > 0 && (noAttemptsLeft || isOverdue);

            // canSubmit: còn lượt và chưa hết hạn
            const canSubmit = !isOverdue && (maxAttempts === null || remainingAttempts > 0);

            return {
                ...assignment.toObject(),
                submission,
                attemptCount,
                bestScore,
                maxAttempts,
                remainingAttempts,
                isCompleted,
                isFailed,
                isOverdue,
                canSubmit
            };
        }));

        let filteredAssignments = assignmentsWithSubmission;
        if (status === 'pending') {
            filteredAssignments = assignmentsWithSubmission.filter(a => !a.isCompleted);
        } else if (status === 'completed') {
            filteredAssignments = assignmentsWithSubmission.filter(a => a.isCompleted);
        }

        res.status(200).json({
            assignments: filteredAssignments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: filteredAssignments.length,
                pages: Math.ceil(filteredAssignments.length / limit)
            }
        });
    } catch (error) {
        console.error('Get student assignments error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Get single assignment with questions
router.get('/assignments/:id', async (req, res) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;

        const assignment = await Assignment.findById(id)
            .populate('instructorId', 'fullName email');

        if (!assignment) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập!' });
        }

        if (assignment.status !== 'published') {
            return res.status(403).json({ message: 'Bài tập chưa được xuất bản!' });
        }

        const assigned = await isStudentAssigned(assignment, studentId);
        if (!assigned) {
            return res.status(403).json({ message: 'Bạn không được giao bài tập này!' });
        }

        const submission = await Submission.findOne({
            assignmentId: id,
            studentId: studentId
        }).sort({ createdAt: -1 });

        const attemptCount = await Submission.countDocuments({
            assignmentId: id,
            studentId: studentId
        });

        // Điểm cao nhất trong tất cả các lần nộp
        const bestSubmissionSingle = await Submission.findOne({
            assignmentId: id,
            studentId: studentId,
            score: { $ne: null }
        }).sort({ score: -1 });
        const bestScore = bestSubmissionSingle ? bestSubmissionSingle.score : null;

        const maxAttempts = assignment.settings?.maxAttempts ?? null;
        const remainingAttempts = maxAttempts === null ? null : Math.max(0, maxAttempts - attemptCount);
        const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
        const passingScore = assignment.settings?.passingScore ?? 60;

        // isCompleted = true khi có ít nhất 1 lần đạt điểm >= passingScore
        const isCompleted = bestScore !== null && bestScore >= passingScore;

        // isFailed = đã làm hết lượt (hoặc hết hạn) nhưng chưa lần nào đủ điểm
        const noAttemptsLeft = maxAttempts !== null && remainingAttempts === 0;
        const isFailed = !isCompleted && attemptCount > 0 && (noAttemptsLeft || isOverdue);

        // canSubmit: chưa hết hạn VÀ còn lượt (null = vô hạn)
        const canSubmit = !isOverdue && (maxAttempts === null || remainingAttempts > 0);

        res.status(200).json({
            assignment,
            submission,
            attemptCount,
            bestScore,
            maxAttempts,
            remainingAttempts,
            isOverdue,
            canSubmit,
            isCompleted,
            isFailed
        });
    } catch (error) {
        console.error('Get assignment error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Submit assignment
router.post('/assignments/:id/submit', async (req, res) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;
        const { answers, score, accuracy, timeSpent } = req.body;

        const assignment = await Assignment.findById(id);

        if (!assignment) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập!' });
        }

        if (assignment.status !== 'published') {
            return res.status(403).json({ message: 'Bài tập chưa được xuất bản!' });
        }

        if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) {
            return res.status(400).json({ message: 'Bài tập đã hết hạn nộp!' });
        }

        const attemptCount = await Submission.countDocuments({
            assignmentId: id,
            studentId: studentId
        });

        const maxAttemptsVal = assignment.settings?.maxAttempts ?? null;

        // null = vô hạn lượt, không bao giờ chặn
        if (maxAttemptsVal !== null && attemptCount >= maxAttemptsVal) {
            return res.status(400).json({ message: 'Bạn đã hết số lần nộp bài!' });
        }

        // Mọi lần nộp đều tính là completed (dù điểm cao hay thấp)
        const status = 'completed';

        // If instructorId is missing, log a warning but continue to save submission
        let instructorId = assignment.instructorId || null;
        if (!instructorId) {
            console.warn('Submit assignment warning: assignment has no instructorId', { assignmentId: id });
        }

        const submission = new Submission({
            studentId,
            instructorId,
            assignmentId: id,
            answers: answers || [],
            score: score !== undefined && score !== null ? score : 0,
            accuracy: accuracy !== undefined && accuracy !== null ? accuracy : 0,
            timeSpent: timeSpent || 0,
            status,
            submittedAt: new Date()
        });

        await submission.save();

        // ── Cập nhật studentStats realtime từ Submission thực tế ──────
        try { await recalcStudentStats(studentId); } catch (e) {
            console.error('recalcStudentStats (assignment submit) error:', e.message);
        }

        // ── Cập nhật classStats cho các lớp của học viên ──────────────
        try {
            const studentDoc = await User.findById(studentId).select('classIds');
            if (studentDoc?.classIds?.length) {
                await Promise.all(studentDoc.classIds.map(cid => recalcClassStats(cid)));
            }
        } catch (e) {
            console.error('recalcClassStats (assignment submit) error:', e.message);
        }

        // create a notification for the instructor so they know a student submitted
        try {
            const notifInstructorId = assignment.instructorId;
            if (notifInstructorId) {
                const student = await User.findById(studentId).select('fullName');
                const notif = new Notification({
                    instructorId: notifInstructorId,
                    recipients: [notifInstructorId],
                    type: 'result',
                    title: `Đã nộp bài: ${assignment.title}`,
                    message: `${student?.fullName || 'Học viên'} đã nộp bài "${assignment.title}" (điểm: ${submission.score || 0})`,
                    titleEn: `Submission: ${assignment.title}`,
                    messageEn: `${student?.fullName || 'A student'} submitted "${assignment.title}" (score: ${submission.score || 0})`,
                    relatedId: submission._id,
                    relatedModel: 'Submission'
                });
                await notif.save();
            }
        } catch (nErr) {
            console.error('Error creating notification for submission:', nErr);
        }

        // Auto-award badges
        try {
            const StudentBadge = mongoose.model('StudentBadge');
            const awardedBadges = await StudentBadge.checkAndAwardBadges(studentId, submission, {
                source: 'assignment'
            });
            if (awardedBadges.length > 0) {
                console.log(`Awarded ${awardedBadges.length} badge(s) to student ${studentId}`);
            }
        } catch (badgeErr) {
            console.error('Error awarding badges:', badgeErr);
        }

        // recompute attemptCount, remainingAttempts and bestScore to return to client
        const updatedAttemptCount = await Submission.countDocuments({
            assignmentId: id,
            studentId: studentId
        });

        const updatedRemaining = maxAttemptsVal === null ? null : Math.max(0, maxAttemptsVal - updatedAttemptCount);

        // Lấy điểm cao nhất trong tất cả các lần nộp
        const bestSub = await Submission.findOne({
            assignmentId: id,
            studentId: studentId,
            score: { $ne: null }
        }).sort({ score: -1 });
        const bestScoreUpdated = bestSub ? bestSub.score : null;

        // isCompleted: có ít nhất 1 lần đạt điểm >= passingScore
        const passingScoreVal = assignment.settings?.passingScore ?? 60;
        const studentViewCompleted = bestScoreUpdated !== null && bestScoreUpdated >= passingScoreVal;

        // isFailed: đã làm hết lượt nhưng chưa lần nào đủ điểm
        const noAttemptsLeftAfter = maxAttemptsVal !== null && updatedRemaining === 0;
        const studentViewFailed = !studentViewCompleted && updatedAttemptCount > 0 && noAttemptsLeftAfter;

        // canSubmit sau khi nộp:
        // - Vô hạn (null): luôn true (trừ hết hạn, đã check bên trên)
        // - Có giới hạn: còn lượt thì true
        const canSubmitAfter = maxAttemptsVal === null ? true : updatedRemaining > 0;

        res.status(201).json({
            message: 'Nộp bài thành công!',
            submission,
            attemptCount: updatedAttemptCount,
            remainingAttempts: updatedRemaining,
            bestScore: bestScoreUpdated,
            isCompleted: studentViewCompleted,
            isFailed: studentViewFailed,
            canSubmit: canSubmitAfter
        });
    } catch (error) {
        console.error('Submit assignment error:', error);
        if (error && error.stack) console.error(error.stack);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Get exams assigned to current student
router.get('/exams', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({
            exams: [],
            pagination: { page: 1, limit: 10, total: 0, pages: 0 },
            _warning: 'Database đang offline'
        });
    }

    try {
        const studentId = req.user.id;
        const { status = 'all', page = 1, limit = 10 } = req.query;

        const student = await User.findById(studentId).select('classIds');
        const studentClassIds = student?.classIds || [];

        const query = {
            status: 'published',
            $or: [{ assignedTo: studentId }]
        };
        if (studentClassIds.length > 0) {
            query.$or.push({ classIds: { $in: studentClassIds } });
        }

        const [exams, total] = await Promise.all([
            Exam.find(query)
                .populate('instructorId', 'fullName email')
                .sort({ endDate: 1, createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Exam.countDocuments(query)
        ]);

        const examsWithData = await Promise.all(exams.map(async (exam) => {
            const attemptCount = await Submission.countDocuments({
                examId: exam._id,
                studentId
            });

            // Điểm cao nhất trong tất cả lần nộp
            const bestSub = await Submission.findOne({
                examId: exam._id,
                studentId,
                score: { $ne: null }
            }).sort({ score: -1 });
            const bestScore = bestSub ? bestSub.score : null;

            const maxAttempts = exam.settings?.maxAttempts ?? 1;
            const remainingAttempts = Math.max(0, maxAttempts - attemptCount);

            const now = new Date();
            const isOverdue = exam.endDate && new Date(exam.endDate) < now;
            const notStarted = exam.startDate && new Date(exam.startDate) > now;

            const passingScore = exam.settings?.passingScore ?? 70;

            // isCompleted = đã có ít nhất 1 lần đạt điểm >= passingScore
            const isCompleted = bestScore !== null && bestScore >= passingScore;

            // canSubmit: chưa hết hạn, đã đến ngày bắt đầu, còn lượt
            const canSubmit = !isOverdue && !notStarted && remainingAttempts > 0;

            return {
                ...exam.toObject(),
                attemptCount,
                bestScore,
                maxAttempts,
                remainingAttempts,
                isCompleted,
                isOverdue,
                notStarted,
                canSubmit
            };
        }));

        let filteredExams = examsWithData;
        if (status === 'pending') {
            filteredExams = examsWithData.filter(e => !e.isCompleted && !e.isOverdue && !e.notStarted);
        } else if (status === 'completed') {
            filteredExams = examsWithData.filter(e => e.isCompleted);
        }

        res.status(200).json({
            exams: filteredExams,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: filteredExams.length,
                pages: Math.ceil(filteredExams.length / limit)
            }
        });
    } catch (error) {
        console.error('Get student exams error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Get single exam
router.get('/exams/:id', async (req, res) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;

        const exam = await Exam.findById(id).populate('instructorId', 'fullName email');

        if (!exam) {
            return res.status(404).json({ message: 'Không tìm thấy bài kiểm tra!' });
        }
        if (exam.status !== 'published') {
            return res.status(403).json({ message: 'Bài kiểm tra chưa được xuất bản!' });
        }

        const assigned = await isStudentAssigned(exam, studentId);
        if (!assigned) {
            return res.status(403).json({ message: 'Bạn không được giao bài kiểm tra này!' });
        }

        const now = new Date();
        const notStarted = exam.startDate && new Date(exam.startDate) > now;
        const isOverdue = exam.endDate && new Date(exam.endDate) < now;

        const attemptCount = await Submission.countDocuments({ examId: id, studentId });

        const bestSub = await Submission.findOne({
            examId: id, studentId, score: { $ne: null }
        }).sort({ score: -1 });
        const bestScore = bestSub ? bestSub.score : null;

        const maxAttempts = exam.settings?.maxAttempts ?? 1;
        const remainingAttempts = Math.max(0, maxAttempts - attemptCount);

        // isCompleted = đã làm ít nhất 1 lần
        const isCompleted = attemptCount >= 1;

        // canSubmit: chưa hết hạn, đã đến ngày bắt đầu, còn lượt
        const canSubmit = !isOverdue && !notStarted && remainingAttempts > 0;

        res.status(200).json({
            exam,
            attemptCount,
            bestScore,
            maxAttempts,
            remainingAttempts,
            isCompleted,
            isOverdue,
            notStarted,
            canSubmit
        });
    } catch (error) {
        console.error('Get exam error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Submit exam
router.post('/exams/:id/submit', async (req, res) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;
        const { answers, score, accuracy, timeSpent, total, correctCount } = req.body;

        const exam = await Exam.findById(id);
        if (!exam) {
            return res.status(404).json({ message: 'Không tìm thấy bài kiểm tra!' });
        }
        if (exam.status !== 'published') {
            return res.status(403).json({ message: 'Bài kiểm tra chưa được xuất bản!' });
        }

        const now = new Date();
        if (exam.endDate && new Date(exam.endDate) < now) {
            return res.status(400).json({ message: 'Bài kiểm tra đã hết hạn!' });
        }

        const attemptCount = await Submission.countDocuments({ examId: id, studentId });
        const maxAttempts = exam.settings?.maxAttempts ?? 1;

        if (attemptCount >= maxAttempts) {
            return res.status(400).json({ message: 'Bạn đã hết số lần làm bài kiểm tra!' });
        }

        const submission = new Submission({
            studentId,
            instructorId: exam.instructorId || null,
            examId: id,
            answers: answers || [],
            score: score !== undefined && score !== null ? score : 0,
            accuracy: accuracy !== undefined && accuracy !== null ? accuracy : 0,
            timeSpent: timeSpent || 0,
            status: 'completed',
            submittedAt: new Date()
        });

        await submission.save();

        // ── Cập nhật studentStats realtime từ Submission thực tế ──────
        try { await recalcStudentStats(studentId); } catch (e) {
            console.error('recalcStudentStats (exam submit) error:', e.message);
        }

        // ── Cập nhật classStats cho các lớp của học viên ──────────────
        try {
            const studentDoc = await User.findById(studentId).select('classIds');
            if (studentDoc?.classIds?.length) {
                await Promise.all(studentDoc.classIds.map(cid => recalcClassStats(cid)));
            }
        } catch (e) {
            console.error('recalcClassStats (exam submit) error:', e.message);
        }

        // Gửi notification cho giảng viên
        try {
            if (exam.instructorId) {
                const student = await User.findById(studentId).select('fullName');
                const notif = new Notification({
                    instructorId: exam.instructorId,
                    recipients: [exam.instructorId],
                    type: 'result',
                    title: `Đã nộp bài: ${exam.title}`,
                    message: `${student?.fullName || 'Học viên'} đã nộp bài "${exam.title}" (điểm: ${submission.score || 0})`,
                    titleEn: `Submission: ${exam.title}`,
                    messageEn: `${student?.fullName || 'A student'} submitted "${exam.title}" (score: ${submission.score || 0})`,
                    relatedId: submission._id,
                    relatedModel: 'Submission'
                });
                await notif.save();
            }
        } catch (nErr) {
            console.error('Error creating exam notification:', nErr);
        }

        // Auto-award badges
        try {
            const StudentBadge = mongoose.model('StudentBadge');
            const awardedBadges = await StudentBadge.checkAndAwardBadges(studentId, submission, {
                source: 'exam'
            });
            if (awardedBadges.length > 0) {
                console.log(`Awarded ${awardedBadges.length} badge(s) to student ${studentId}`);
            }
        } catch (badgeErr) {
            console.error('Error awarding badges:', badgeErr);
        }

        // Tính lại sau khi nộp
        const updatedAttemptCount = await Submission.countDocuments({ examId: id, studentId });
        const updatedRemaining = Math.max(0, maxAttempts - updatedAttemptCount);

        // Điểm cao nhất
        const bestSubUpdated = await Submission.findOne({
            examId: id, studentId, score: { $ne: null }
        }).sort({ score: -1 });
        const bestScore = bestSubUpdated ? bestSubUpdated.score : null;

        // isCompleted = đã làm ít nhất 1 lần
        const isCompleted = updatedAttemptCount >= 1;
        const canSubmit = updatedRemaining > 0;

        res.status(201).json({
            message: 'Nộp bài kiểm tra thành công!',
            submission,
            attemptCount: updatedAttemptCount,
            remainingAttempts: updatedRemaining,
            bestScore,
            isCompleted,
            canSubmit
        });
    } catch (error) {
        console.error('Submit exam error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Get submission history
router.get('/submissions', async (req, res) => {
    try {
        const studentId = req.user.id;
        const { type = 'all', page = 1, limit = 20 } = req.query;

        const query = { studentId };
        if (type === 'assignment') {
            query.assignmentId = { $ne: null };
            query.examId = null;
        } else if (type === 'exam') {
            query.examId = { $ne: null };
        }

        const [submissions, total] = await Promise.all([
            Submission.find(query)
                .populate('assignmentId', 'title type')
                .populate('examId', 'title')
                .populate('instructorId', 'fullName')
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
        console.error('Get student submissions error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// ===================== NOTIFICATIONS ENDPOINTS =====================

// Get notifications for current student
router.get('/notifications', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({
            notifications: [],
            pagination: { page: 1, limit: 20, total: 0, pages: 0 },
            _warning: 'Database đang offline'
        });
    }

    try {
        const studentId = req.user.id;
        const { type = 'all', page = 1, limit = 20, unreadOnly = 'false' } = req.query;

        // Lấy thông tin student để biết instructorId
        const student = await User.findById(studentId).select('instructorId');

        // Query: thông báo gửi cho học viên cụ thể (targetIds) HOẶC gửi tất cả học viên của giảng viên (targetType=students, sentBy=instructorId)
        const query = {
            $or: [
                { targetIds: studentId },
                ...(student?.instructorId ? [{ sentBy: student.instructorId, targetType: 'students' }] : [])
            ]
        };

        if (type !== 'all') {
            query.type = type;
        }

        const notifications = await Notification.find(query)
            .populate('sentBy', 'fullName email')
            .sort({ createdAt: -1 });

        // Gắn isRead flag (dùng readCount tạm thời vì model mới không có isRead per-user)
        const notificationsWithReadStatus = notifications.map(notification => {
            const isRead = notification.isRead?.some?.(
                read => read.userId?.toString() === studentId.toString()
            ) || false;
            return {
                ...notification.toObject(),
                isRead,
                // Map content -> message cho frontend tương thích
                message: notification.content,
            };
        });

        let filteredNotifications = notificationsWithReadStatus;
        if (unreadOnly === 'true') {
            filteredNotifications = notificationsWithReadStatus.filter(n => !n.isRead);
        }

        const total = filteredNotifications.length;
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + parseInt(limit));

        res.status(200).json({
            notifications: paginatedNotifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            unreadCount: notificationsWithReadStatus.filter(n => !n.isRead).length
        });
    } catch (error) {
        console.error('Get student notifications error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Mark notification as read
router.patch('/notifications/:id/read', async (req, res) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;

        const notification = await Notification.findById(id);

        if (!notification) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo!' });
        }

        // Add to isRead array if not already read
        if (!notification.isRead) notification.isRead = [];

        const alreadyRead = notification.isRead.some(
            read => read.userId?.toString() === studentId.toString()
        );

        if (!alreadyRead) {
            notification.isRead.push({
                userId: studentId,
                readAt: new Date()
            });
            await notification.save();
        }

        res.status(200).json({ message: 'Đã đánh dấu đã đọc!', notification });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Mark all notifications as read
router.patch('/notifications/read-all', async (req, res) => {
    try {
        const studentId = req.user.id;

        const student = await User.findById(studentId).select('instructorId');
        const notifications = await Notification.find({
            $or: [
                { targetIds: studentId },
                ...(student?.instructorId ? [{ sentBy: student.instructorId, targetType: 'students' }] : [])
            ]
        });

        let updatedCount = 0;

        for (const notification of notifications) {
            if (!notification.isRead) notification.isRead = [];

            const alreadyRead = notification.isRead.some(
                read => read.userId?.toString() === studentId.toString()
            );

            if (!alreadyRead) {
                notification.isRead.push({
                    userId: studentId,
                    readAt: new Date()
                });
                await notification.save();
                updatedCount++;
            }
        }

        res.status(200).json({ message: `Đã đánh dấu ${updatedCount} thông báo là đã đọc!`, updatedCount });
    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// ===================== FEEDBACK ENDPOINTS =====================

// Get feedback for current student
router.get('/feedback', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({
            feedback: [],
            pagination: { page: 1, limit: 20, total: 0, pages: 0 },
            _warning: 'Database đang offline'
        });
    }

    try {
        const studentId = req.user.id;
        const { type = 'all', page = 1, limit = 20, unreadOnly = 'false' } = req.query;

        const query = { studentId };

        if (type !== 'all') {
            query.type = type;
        }

        const [feedbackList, total] = await Promise.all([
            InstructorFeedback.find(query)
                .populate('instructorId', 'fullName email')
                .populate('relatedAssignment', 'title type')
                .sort({ createdAt: -1 })
                .skip((parseInt(page) - 1) * parseInt(limit))
                .limit(parseInt(limit)),
            InstructorFeedback.countDocuments(query)
        ]);

        let filteredFeedback = feedbackList;
        if (unreadOnly === 'true') {
            filteredFeedback = feedbackList.filter(f => !f.isRead);
        }

        const unreadCount = await InstructorFeedback.countDocuments({ studentId, isRead: false });

        // Count by type (always based on full dataset, ignoring current type filter)
        const [encCount, corrCount, suggCount] = await Promise.all([
            InstructorFeedback.countDocuments({ studentId, type: 'encouragement' }),
            InstructorFeedback.countDocuments({ studentId, type: 'correction' }),
            InstructorFeedback.countDocuments({ studentId, type: 'suggestion' }),
        ]);
        const typeCounts = {
            encouragement: encCount,
            correction: corrCount,
            suggestion: suggCount,
        };

        res.status(200).json({
            feedback: filteredFeedback,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            unreadCount,
            typeCounts
        });
    } catch (error) {
        console.error('Get student feedback error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Get single feedback detail
router.get('/feedback/:id', async (req, res) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;

        const feedback = await InstructorFeedback.findOne({ _id: id, studentId })
            .populate('instructorId', 'fullName email avatar')
            .populate('relatedAssignment', 'title type')
            .populate('relatedSubmission');

        if (!feedback) {
            return res.status(404).json({ message: 'Không tìm thấy phản hồi!' });
        }

        // Mark as read when viewed
        if (!feedback.isRead) {
            feedback.isRead = true;
            await feedback.save();
        }

        res.status(200).json({ feedback });
    } catch (error) {
        console.error('Get feedback detail error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Mark feedback as read
router.patch('/feedback/:id/read', async (req, res) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;

        const feedback = await InstructorFeedback.findOneAndUpdate(
            { _id: id, studentId },
            { $set: { isRead: true } },
            { new: true }
        );

        if (!feedback) {
            return res.status(404).json({ message: 'Không tìm thấy phản hồi!' });
        }

        res.status(200).json({ message: 'Đã đánh dấu đã đọc!', feedback });
    } catch (error) {
        console.error('Mark feedback read error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// ===================== CLASSES ENDPOINTS =====================

// Get classes for current student
router.get('/classes', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({
            classes: [],
            pagination: { page: 1, limit: 10, total: 0, pages: 0 },
            _warning: 'Database đang offline'
        });
    }

    try {
        const studentId = req.user.id;
        const { status = 'active', page = 1, limit = 10 } = req.query;

        // Find classes where student is a member
        const query = {
            studentIds: studentId,
            status: status !== 'all' ? status : { $in: ['active', 'archived'] }
        };

        const [classes, total] = await Promise.all([
            Class.find(query)
                .populate('instructorId', 'fullName email avatar')
                .sort({ createdAt: -1 })
                .skip((parseInt(page) - 1) * parseInt(limit))
                .limit(parseInt(limit)),
            Class.countDocuments(query)
        ]);

        // Get class details for each class
        const classesWithDetails = await Promise.all(classes.map(async (cls) => {
            // Get student count in class
            const studentCount = cls.studentIds.length;

            // Get instructor stats
            const instructorAssignments = await Assignment.countDocuments({
                classIds: cls._id,
                status: 'published'
            });

            // Get class performance
            const submissions = await Submission.find({
                studentId: { $in: cls.studentIds }
            });

            const avgScore = submissions.length > 0
                ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
                : 0;

            return {
                ...cls.toObject(),
                studentCount,
                assignmentCount: instructorAssignments,
                classAverageScore: avgScore.toFixed(1)
            };
        }));

        res.status(200).json({
            classes: classesWithDetails,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get student classes error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Get single class detail
router.get('/classes/:id', async (req, res) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;

        const classData = await Class.findOne({
            _id: id,
            studentIds: studentId
        }).populate('instructorId', 'fullName email avatar');

        if (!classData) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học!' });
        }

        // Get class assignments
        const assignments = await Assignment.find({
            classIds: id,
            status: 'published'
        })
            .populate('instructorId', 'fullName')
            .sort({ dueDate: 1 })
            .limit(10);

        // Get student submissions for this class
        const submissions = await Submission.find({
            studentId,
            assignmentId: { $in: assignments.map(a => a._id) }
        }).populate('assignmentId', 'title');

        // Get class members
        const members = await User.find({ _id: { $in: classData.studentIds } })
            .select('fullName email avatar studentStats');

        res.status(200).json({
            class: {
                ...classData.toObject(),
                studentCount: classData.studentIds.length,
                assignments,
                recentSubmissions: submissions.slice(0, 5),
                members: members.slice(0, 20) // Limit for performance
            }
        });
    } catch (error) {
        console.error('Get class detail error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Get class assignments for student
router.get('/classes/:id/assignments', async (req, res) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Verify student is in class
        const classData = await Class.findOne({
            _id: id,
            studentIds: studentId
        });

        if (!classData) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học!' });
        }

        const query = {
            classIds: id,
            status: 'published'
        };

        const [assignments, total] = await Promise.all([
            Assignment.find(query)
                .populate('instructorId', 'fullName')
                .sort({ dueDate: 1, createdAt: -1 })
                .skip((parseInt(page) - 1) * parseInt(limit))
                .limit(parseInt(limit)),
            Assignment.countDocuments(query)
        ]);

        // Get submission status for each assignment
        const assignmentsWithStatus = await Promise.all(assignments.map(async (assignment) => {
            const submission = await Submission.findOne({
                assignmentId: assignment._id,
                studentId
            }).sort({ createdAt: -1 });

            const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
            const isCompleted = submission && ['completed', 'graded'].includes(submission.status);

            return {
                ...assignment.toObject(),
                submission,
                isCompleted,
                isOverdue
            };
        }));

        res.status(200).json({
            assignments: assignmentsWithStatus,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get class assignments error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Get class members (students in the same class)
router.get('/classes/:id/members', async (req, res) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;

        // Verify student is in class
        const classData = await Class.findOne({
            _id: id,
            studentIds: studentId
        });

        if (!classData) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học!' });
        }

        const [members, total] = await Promise.all([
            User.find({ _id: { $in: classData.studentIds } })
                .select('fullName email avatar studentStats')
                .skip((parseInt(page) - 1) * parseInt(limit))
                .limit(parseInt(limit)),
            User.countDocuments({ _id: { $in: classData.studentIds } })
        ]);

        res.status(200).json({
            members,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get class members error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// ===================== BADGES ENDPOINTS =====================

// Get badges for current student
router.get('/badges', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({
            badges: [],
            earnedBadges: [],
            totalEarned: 0,
            totalBadges: 0,
            _warning: 'Database đang offline'
        });
    }

    try {
        const studentId = req.user.id;

        // Retroactively award any badges the student already qualifies for
        // Chỉ chạy nếu học viên chưa có badge nào (lần đầu) để tránh trao lại badge đã bị thu hồi
        try {
            const existingCount = await StudentBadge.countDocuments({ studentId });
            if (existingCount === 0) {
                await StudentBadge.checkAndAwardFromStats(studentId);
            }
        } catch (e) {
            console.error('checkAndAwardFromStats error:', e.message);
        }

        const studentBadgesRaw = await StudentBadge.find({ studentId })
            .populate('badgeId')
            .sort({ earnedAt: -1 });

        // Không dùng lean() để giữ Mongoose document methods (.toObject() dùng bên dưới)
        const allBadges = await Badge.find().sort({ sortOrder: 1 });
        // Chỉ tính badges CHÍNH THỨC (isHonorary không phải true) là earned
        const officialBadges = studentBadgesRaw.filter(sb => sb.isHonorary !== true);
        const honoraryBadges = studentBadgesRaw.filter(sb => sb.isHonorary === true);
        const earnedBadgeIds = officialBadges.map(sb => sb.badgeId?._id?.toString() || '');

        // Calculate progress for unearned badges — tất cả từ Submission thực tế
        // Đếm số bài kiểm tra / bài tập KHÁC NHAU (unique) đã nộp
        const examUniqueResult = await Submission.aggregate([
            { $match: { studentId: new mongoose.Types.ObjectId(studentId), examId: { $ne: null } } },
            { $group: { _id: '$examId' } },
            { $count: 'uniqueCount' }
        ]);
        const submissionCountByExam = examUniqueResult.length > 0 ? examUniqueResult[0].uniqueCount : 0;

        const assignUniqueResult = await Submission.aggregate([
            { $match: { studentId: new mongoose.Types.ObjectId(studentId), assignmentId: { $ne: null } } },
            { $group: { _id: '$assignmentId' } },
            { $count: 'uniqueCount' }
        ]);
        const submissionCountByAssignment = assignUniqueResult.length > 0 ? assignUniqueResult[0].uniqueCount : 0;

        const submissionTotal = await Submission.countDocuments({ studentId });
        const bestAccuracy = await Submission.findOne({ studentId, accuracy: { $gt: 0 } }).sort({ accuracy: -1 }).select('accuracy');

        // Tính averageScore từ Submission thực tế
        const avgResult = await Submission.aggregate([
            { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
            { $group: { _id: null, avg: { $avg: '$score' } } }
        ]);
        const realAverageScore = avgResult.length ? Math.round(avgResult[0].avg) : 0;

        // Tính streak từ Submission thực tế
        const allSubDates = await Submission.find({ studentId })
            .select('submittedAt createdAt').sort({ createdAt: -1 }).lean();
        const uniqueDays = [...new Set(allSubDates.map(s => {
            const d = s.submittedAt || s.createdAt;
            return new Date(d).toISOString().slice(0, 10);
        }))].sort().reverse();
        let realCurrentStreak = 0, realLongestStreak = uniqueDays.length > 0 ? 1 : 0, tempS = 1;
        const todayStr = new Date().toISOString().slice(0, 10);
        const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (uniqueDays.length > 0 && (uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr)) {
            realCurrentStreak = 1;
            for (let i = 1; i < uniqueDays.length; i++) {
                const diff = Math.round((new Date(uniqueDays[i-1]) - new Date(uniqueDays[i])) / 86400000);
                if (diff === 1) { realCurrentStreak++; } else break;
            }
        }
        for (let i = 1; i < uniqueDays.length; i++) {
            const diff = Math.round((new Date(uniqueDays[i-1]) - new Date(uniqueDays[i])) / 86400000);
            if (diff === 1) { tempS++; if (tempS > realLongestStreak) realLongestStreak = tempS; } else tempS = 1;
        }
        const maxStreak = Math.max(realCurrentStreak, realLongestStreak);

        const badgesWithProgress = await Promise.all(allBadges.map(async (badge) => {
            let progress = 0;
            let current = 0;

            switch (badge.conditionType) {
                // ── Submission ──────────────────────────────────
                case 'first_submission':
                    current = submissionTotal;
                    progress = current >= 1 ? 100 : 0;
                    break;
                case 'score_100': {
                    const hasPerfect = await Submission.findOne({ studentId, score: 100 });
                    current = hasPerfect ? 1 : 0;
                    progress = current >= 1 ? 100 : 0;
                    break;
                }
                case 'perfect_streak_5': {
                    const last5 = await Submission.find({ studentId }).sort({ createdAt: -1 }).limit(5);
                    current = last5.filter(s => s.score === 100).length;
                    progress = Math.min(100, (current / 5) * 100);
                    break;
                }
                case 'perfect_streak_10': {
                    const last10 = await Submission.find({ studentId }).sort({ createdAt: -1 }).limit(10);
                    current = last10.filter(s => s.score === 100).length;
                    progress = Math.min(100, (current / 10) * 100);
                    break;
                }

                // ── Streak ──────────────────────────────────────
                case 'streak_3':
                    current = maxStreak;
                    progress = Math.min(100, (current / 3) * 100);
                    break;
                case 'streak_7':
                    current = maxStreak;
                    progress = Math.min(100, (current / 7) * 100);
                    break;
                case 'streak_14':
                    current = maxStreak;
                    progress = Math.min(100, (current / 14) * 100);
                    break;
                case 'streak_30':
                    current = maxStreak;
                    progress = Math.min(100, (current / 30) * 100);
                    break;
                case 'streak_60':
                    current = maxStreak;
                    progress = Math.min(100, (current / 60) * 100);
                    break;

                // ── Practice count ───────────────────────────────
                case 'practice_count':
                    current = submissionTotal;
                    progress = Math.min(100, (current / badge.conditionValue) * 100);
                    break;

                // ── Accuracy ────────────────────────────────────
                case 'accuracy_95':
                    current = Math.round(bestAccuracy?.accuracy || 0);
                    progress = Math.min(100, (current / 95) * 100);
                    break;
                case 'accuracy_100_once':
                    current = Math.round(bestAccuracy?.accuracy || 0);
                    progress = Math.min(100, (current / 100) * 100);
                    break;

                // ── Average score ────────────────────────────────
                case 'average_score_70': {
                    // Requires avg >= 70 AND count >= 5
                    const minCount70 = 5;
                    const scoreProgress70 = submissionTotal < minCount70
                        ? Math.min(99, Math.round((submissionTotal / minCount70) * 50)) // cap at 99% until min met
                        : Math.min(100, Math.round((realAverageScore / 70) * 100));
                    current = realAverageScore;
                    progress = submissionTotal < minCount70 ? scoreProgress70 : Math.min(100, Math.round((realAverageScore / 70) * 100));
                    break;
                }
                case 'average_score_80': {
                    // Requires avg >= 80 AND count >= 10
                    const minCount80 = 10;
                    current = realAverageScore;
                    progress = submissionTotal < minCount80
                        ? Math.min(99, Math.round((submissionTotal / minCount80) * 50))
                        : Math.min(100, Math.round((realAverageScore / 80) * 100));
                    break;
                }
                case 'average_score_90': {
                    // Requires avg >= 90 AND count >= 20
                    const minCount90 = 20;
                    current = realAverageScore;
                    progress = submissionTotal < minCount90
                        ? Math.min(99, Math.round((submissionTotal / minCount90) * 50))
                        : Math.min(100, Math.round((realAverageScore / 90) * 100));
                    break;
                }
                case 'average_score_95': {
                    // Requires avg >= 95 AND count >= 30
                    const minCount95 = 30;
                    current = realAverageScore;
                    progress = submissionTotal < minCount95
                        ? Math.min(99, Math.round((submissionTotal / minCount95) * 50))
                        : Math.min(100, Math.round((realAverageScore / 95) * 100));
                    break;
                }

                // ── Assignments ──────────────────────────────────
                case 'assignments_completed':
                    current = submissionCountByAssignment;
                    progress = Math.min(100, (current / badge.conditionValue) * 100);
                    break;

                // ── Exams ────────────────────────────────────────
                case 'exams_taken':
                    current = submissionCountByExam;
                    progress = Math.min(100, (current / badge.conditionValue) * 100);
                    break;

                // ── Time bonus ───────────────────────────────────
                case 'time_bonus': {
                    const examSubs = await Submission.find({
                        studentId, examId: { $ne: null }, timeSpent: { $gt: 0 }
                    }).populate('examId', 'settings');
                    let bestRatio = 0;
                    for (const sub of examSubs) {
                        const allowed = ((sub.examId?.settings?.duration || 30) * 60);
                        const ratio = 1 - (sub.timeSpent / allowed);
                        if (ratio > bestRatio) bestRatio = ratio;
                    }
                    current = Math.round(bestRatio * 100);
                    progress = current >= 50 ? 100 : Math.round(bestRatio * 200); // 50% time saved = 100%
                    break;
                }

                default:
                    progress = earnedBadgeIds.includes(badge._id.toString()) ? 100 : 0;
            }

            return {
                ...badge.toObject(),
                earned: earnedBadgeIds.includes(badge._id.toString()),
                isHonorary: !earnedBadgeIds.includes(badge._id.toString()) && honoraryBadges.some(sb => sb.badgeId?._id?.toString() === badge._id.toString()),
                earnedAt: officialBadges.find(sb => sb.badgeId?._id?.toString() === badge._id.toString())?.earnedAt
                    || honoraryBadges.find(sb => sb.badgeId?._id?.toString() === badge._id.toString())?.earnedAt,
                honoraryNote: honoraryBadges.find(sb => sb.badgeId?._id?.toString() === badge._id.toString())?.note || '',
                progress: Math.round(Math.min(100, Math.max(0, progress))),
                current
            };
        }));

        res.status(200).json({
            badges: badgesWithProgress,
            earnedBadges: officialBadges.filter(sb => sb.badgeId).map(sb => ({
                ...sb.toObject(),
                badge: sb.badgeId
            })),
            honoraryBadges: honoraryBadges.filter(sb => sb.badgeId).map(sb => ({
                ...sb.toObject(),
                badge: sb.badgeId
            })),
            totalEarned: earnedBadgeIds.length,
            totalHonorary: honoraryBadges.length,
            totalBadges: allBadges.length
        });
    } catch (error) {
        console.error('Get student badges error:', error.stack || error);
        res.status(500).json({ message: 'Lỗi server', error: error.message, stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined });
    }
});

// Get single badge detail
router.get('/badges/:id', async (req, res) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;

        const Badge = mongoose.model('Badge');
        const StudentBadge = mongoose.model('StudentBadge');

        const badge = await Badge.findById(id);
        if (!badge) {
            return res.status(404).json({ message: 'Không tìm thấy huy hiệu!' });
        }

        const studentBadge = await StudentBadge.findOne({ studentId, badgeId: id })
            .populate('awardedBy', 'fullName');

        res.status(200).json({
            badge,
            earned: !!studentBadge,
            earnedAt: studentBadge?.earnedAt,
            awardedBy: studentBadge?.awardedBy
        });
    } catch (error) {
        console.error('Get badge detail error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// ===================== SUPPORT TICKET ENDPOINTS =====================

// ===================== SUPPORT TICKET ENDPOINTS =====================

// CF14.1 — Học viên tạo ticket hỗ trợ kỹ thuật
router.post('/support', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database đang offline, vui lòng thử lại sau!' });
    }
    try {
        const { title, content, errorType, imageUrl } = req.body;
        if (!title || !content) return res.status(400).json({ message: 'Tiêu đề và nội dung là bắt buộc!' });
        const ticket = new SupportTicket({
            senderId: req.user.id,
            title: title.trim(),
            content: content.trim(),
            errorType: errorType || 'other',
            imageUrl: imageUrl || ''
        });
        await ticket.save();
        res.status(201).json({ message: 'Đã gửi yêu cầu hỗ trợ!', ticket });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF14 — Học viên xem danh sách ticket của mình
router.get('/support', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ tickets: [], _warning: 'Database offline' });
    }
    try {
        const { page = 1, limit = 10 } = req.query;
        const [tickets, total] = await Promise.all([
            SupportTicket.find({ senderId: req.user.id })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            SupportTicket.countDocuments({ senderId: req.user.id })
        ]);
        res.status(200).json({ tickets, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF14 — Học viên xem chi tiết ticket của mình
router.get('/support/:id', async (req, res) => {
    try {
        const ticket = await SupportTicket.findOne({ _id: req.params.id, senderId: req.user.id })
            .populate('messages.senderId', 'fullName role');
        if (!ticket) return res.status(404).json({ message: 'Không tìm thấy ticket!' });
        res.status(200).json({ ticket });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF14 — Học viên gửi tin nhắn trong ticket
router.post('/support/:id/messages', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ message: 'Nội dung tin nhắn là bắt buộc!' });
        const ticket = await SupportTicket.findOne({ _id: req.params.id, senderId: req.user.id });
        if (!ticket) return res.status(404).json({ message: 'Không tìm thấy ticket!' });
        if (ticket.status === 'closed') return res.status(400).json({ message: 'Ticket đã đóng, không thể gửi tin nhắn!' });
        const updatedTicket = await SupportTicket.findByIdAndUpdate(
            req.params.id,
            { $push: { messages: { senderId: req.user.id, senderRole: req.user.role, message: message.trim(), sentAt: new Date() } } },
            { new: true }
        ).populate('messages.senderId', 'fullName role');
        res.status(200).json({ message: 'Đã gửi tin nhắn!', ticket: updatedTicket });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF14 — Học viên xác nhận đóng ticket (sau khi hoàn thành)
router.patch('/support/:id/close', async (req, res) => {
    try {
        const ticket = await SupportTicket.findOne({ _id: req.params.id, senderId: req.user.id });
        if (!ticket) return res.status(404).json({ message: 'Không tìm thấy ticket!' });
        if (ticket.status !== 'completed') return res.status(400).json({ message: 'Chỉ có thể đóng ticket đã hoàn thành!' });
        const updated = await SupportTicket.findByIdAndUpdate(
            req.params.id,
            { status: 'closed', closedAt: new Date(), closedBy: req.user.id },
            { new: true }
        );
        res.status(200).json({ message: 'Ticket đã được đóng!', ticket: updated });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
