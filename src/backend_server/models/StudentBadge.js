import mongoose from 'mongoose';

const StudentBadgeSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    badgeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Badge',
        required: true
    },
    earnedAt: {
        type: Date,
        default: Date.now
    },
    awardedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    note: {
        type: String,
        default: ''
    },
    source: {
        type: String,
        enum: ['auto', 'manual', 'exam', 'assignment'],
        default: 'auto'
    },
    relatedSubmissionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Submission',
        default: null
    },
    // Huy hiệu danh dự: giảng viên trao khi học viên chưa đủ điều kiện nhưng có tiến bộ đáng ghi nhận.
    // Huy hiệu này KHÔNG tính vào kết quả đạt huy hiệu chính thức (earned), chỉ hiển thị ở tab riêng.
    isHonorary: {
        type: Boolean,
        default: false
    },
    honoraryNote: {
        type: String,
        default: ''
    }
}, { timestamps: true });

StudentBadgeSchema.index({ studentId: 1, badgeId: 1 }, { unique: true });
StudentBadgeSchema.index({ studentId: 1, earnedAt: -1 });
StudentBadgeSchema.index({ badgeId: 1 });

StudentBadgeSchema.virtual('badge', {
    ref: 'Badge',
    localField: 'badgeId',
    foreignField: '_id',
    justOne: true
});

// ─── Award a single badge ────────────────────────────────────────────────────
StudentBadgeSchema.statics.awardBadge = async function(studentId, badgeId, options = {}) {
    try {
        const existing = await this.findOne({ studentId, badgeId });
        if (existing) return { success: false, message: 'Badge already earned', existing };

        const studentBadge = await this.create({
            studentId,
            badgeId,
            awardedBy: options.awardedBy || null,
            note: options.note || '',
            source: options.source || 'auto',
            relatedSubmissionId: options.relatedSubmissionId || null,
            isHonorary: options.isHonorary || false,
            honoraryNote: options.honoraryNote || ''
        });
        return { success: true, studentBadge };
    } catch (error) {
        if (error.code === 11000) return { success: false, message: 'Badge already earned' };
        throw error;
    }
};

// ─── Helper: tính streak liên tiếp từ Submission thực tế ─────────────────────
async function computeStreakFromSubmissions(studentId, Submission) {
    // Lấy tất cả ngày có submission, sắp xếp giảm dần
    const subs = await Submission.find({ studentId })
        .select('submittedAt createdAt')
        .sort({ createdAt: -1 })
        .lean();

    if (subs.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Lấy danh sách ngày duy nhất (theo UTC date string)
    const days = [...new Set(subs.map(s => {
        const d = s.submittedAt || s.createdAt;
        return new Date(d).toISOString().slice(0, 10);
    }))].sort().reverse(); // mới nhất trước

    if (days.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // currentStreak: chỉ tính nếu ngày gần nhất là hôm nay hoặc hôm qua
    let currentStreak = 0;
    if (days[0] === today || days[0] === yesterday) {
        currentStreak = 1;
        for (let i = 1; i < days.length; i++) {
            const prev = new Date(days[i - 1]);
            const curr = new Date(days[i]);
            const diff = Math.round((prev - curr) / 86400000);
            if (diff === 1) currentStreak++;
            else break;
        }
    }

    // longestStreak: tính toàn bộ lịch sử
    let longestStreak = 1;
    let tempStreak = 1;
    for (let i = 1; i < days.length; i++) {
        const prev = new Date(days[i - 1]);
        const curr = new Date(days[i]);
        const diff = Math.round((prev - curr) / 86400000);
        if (diff === 1) {
            tempStreak++;
            if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
            tempStreak = 1;
        }
    }

    return { currentStreak, longestStreak };
}

// ─── Helper: tính averageScore từ Submission thực tế ─────────────────────────
async function computeAverageScoreFromSubmissions(studentId, Submission) {
    const result = await Submission.aggregate([
        { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
        { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } }
    ]);
    if (!result.length || result[0].count === 0) return 0;
    return Math.round(result[0].avg);
}

// ─── Helper: evaluate one badge condition ────────────────────────────────────
// submission = null khi gọi từ checkAndAwardFromStats (retroactive)
// TẤT CẢ điều kiện đều tính từ Submission thực tế, KHÔNG dùng studentStats seed
async function evaluateCondition(badge, studentId, student, submission, Submission) {
    switch (badge.conditionType) {

        // ── Submission milestones ────────────────────────────────────────────
        case 'first_submission': {
            if (submission) {
                const first = await Submission.findOne({ studentId }).sort({ createdAt: 1 });
                return first && first._id.toString() === submission._id.toString();
            }
            const count = await Submission.countDocuments({ studentId });
            return count >= 1;
        }

        case 'score_100': {
            if (submission) return submission.score === 100;
            const perfect = await Submission.findOne({ studentId, score: 100 });
            return !!perfect;
        }

        case 'accuracy_95': {
            if (submission) return (submission.accuracy || 0) >= 95;
            const highAcc = await Submission.findOne({ studentId, accuracy: { $gte: 95 } });
            return !!highAcc;
        }

        case 'accuracy_100_once': {
            if (submission) return (submission.accuracy || 0) >= 100;
            const perfectAcc = await Submission.findOne({ studentId, accuracy: { $gte: 100 } });
            return !!perfectAcc;
        }

        // ── Streak milestones — tính từ lịch sử Submission thực tế ──────────
        case 'streak_3':
        case 'streak_7':
        case 'streak_14':
        case 'streak_30':
        case 'streak_60': {
            const required = parseInt(badge.conditionType.split('_')[1]);
            if (submission) {
                // Khi vừa nộp bài: tính streak tính đến hôm nay
                const { currentStreak, longestStreak } = await computeStreakFromSubmissions(studentId, Submission);
                return currentStreak >= required || longestStreak >= required;
            }
            const { currentStreak, longestStreak } = await computeStreakFromSubmissions(studentId, Submission);
            return currentStreak >= required || longestStreak >= required;
        }

        // ── Practice count — đếm từ Submission thực tế ──────────────────────
        case 'practice_count': {
            const practiceCount = await Submission.countDocuments({ studentId });
            return practiceCount >= badge.conditionValue;
        }

        // ── Average score — tính từ Submission thực tế, yêu cầu số lượng tối thiểu ──
        case 'average_score_70':
        case 'average_score_80':
        case 'average_score_90':
        case 'average_score_95': {
            const required = parseInt(badge.conditionType.split('_').pop());
            // Minimum submission counts per tier to prevent instant unlock
            const minSubmissions = { 70: 5, 80: 10, 90: 20, 95: 30 };
            const minCount = minSubmissions[required] || 5;

            const result = await Submission.aggregate([
                { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
                { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } }
            ]);
            if (!result.length || result[0].count < minCount) return false;
            return Math.round(result[0].avg) >= required;
        }

        // ── Assignments completed — đếm số bài tập KHÁC NHAU đã nộp ──────────
        case 'assignments_completed': {
            const result = await Submission.aggregate([
                { $match: { studentId: new mongoose.Types.ObjectId(studentId), assignmentId: { $ne: null } } },
                { $group: { _id: '$assignmentId' } },
                { $count: 'uniqueCount' }
            ]);
            const uniqueCount = result.length > 0 ? result[0].uniqueCount : 0;
            return uniqueCount >= badge.conditionValue;
        }

        // ── Exams taken — đếm số bài kiểm tra KHÁC NHAU đã hoàn thành ───────
        case 'exams_taken': {
            const result = await Submission.aggregate([
                { $match: { studentId: new mongoose.Types.ObjectId(studentId), examId: { $ne: null } } },
                { $group: { _id: '$examId' } },
                { $count: 'uniqueCount' }
            ]);
            const uniqueCount = result.length > 0 ? result[0].uniqueCount : 0;
            return uniqueCount >= badge.conditionValue;
        }

        // ── Perfect streaks ──────────────────────────────────────────────────
        case 'perfect_streak_5': {
            const last5 = await Submission.find({ studentId }).sort({ createdAt: -1 }).limit(5);
            return last5.length >= 5 && last5.every(s => s.score === 100);
        }

        case 'perfect_streak_10': {
            const last10 = await Submission.find({ studentId }).sort({ createdAt: -1 }).limit(10);
            return last10.length >= 10 && last10.every(s => s.score === 100);
        }

        // ── Time bonus ───────────────────────────────────────────────────────
        case 'time_bonus': {
            if (submission && submission.examId) {
                const exam = await mongoose.model('Exam').findById(submission.examId);
                if (exam && submission.timeSpent) {
                    const allowed = (exam.settings?.duration || 30) * 60;
                    return submission.timeSpent < allowed * 0.5;
                }
                return false;
            }
            const examSubs = await Submission.find({
                studentId,
                examId: { $ne: null },
                timeSpent: { $gt: 0 }
            }).populate('examId', 'settings');
            for (const sub of examSubs) {
                const allowed = ((sub.examId?.settings?.duration || 30) * 60);
                if (sub.timeSpent < allowed * 0.5) return true;
            }
            return false;
        }

        case 'custom':
        default:
            return false;
    }
}

// ─── Check & award after a new submission ────────────────────────────────────
StudentBadgeSchema.statics.checkAndAwardBadges = async function(studentId, submission, options = {}) {
    const Badge = mongoose.model('Badge');
    const User = mongoose.model('User');
    const Submission = mongoose.model('Submission');

    const awardedBadges = [];
    const student = await User.findById(studentId);
    if (!student) return awardedBadges;

    // Lấy cả badgeId lẫn isHonorary để loại cả badge danh dự (không trao chính thức đè lên)
    const existingBadges = await this.find({ studentId }).select('badgeId isHonorary');
    const earnedBadgeIds = existingBadges.map(sb => sb.badgeId.toString());
    // Badge đã có (dù chính thức hay danh dự) đều không trao thêm
    const allExistingIds = earnedBadgeIds;

    const eligibleBadges = await Badge.find({ isActive: true, _id: { $nin: allExistingIds } });

    for (const badge of eligibleBadges) {
        try {
            const shouldAward = await evaluateCondition(badge, studentId, student, submission, Submission);
            if (shouldAward) {
                const result = await this.awardBadge(studentId, badge._id, {
                    ...options,
                    source: options.source || 'auto',
                    relatedSubmissionId: submission._id
                });
                if (result.success) awardedBadges.push(badge);
            }
        } catch (e) {
            console.error(`Badge check error [${badge.name?.vi}]:`, e.message);
        }
    }

    return awardedBadges;
};

// ─── Retroactive check based on existing stats (no submission needed) ─────────
StudentBadgeSchema.statics.checkAndAwardFromStats = async function(studentId) {
    const Badge = mongoose.model('Badge');
    const User = mongoose.model('User');
    const Submission = mongoose.model('Submission');

    const awardedBadges = [];
    const student = await User.findById(studentId);
    if (!student) return awardedBadges;

    // Lấy cả badgeId lẫn isHonorary — badge danh dự cũng bị loại khỏi danh sách eligible
    const existingBadges = await this.find({ studentId }).select('badgeId isHonorary');
    const allExistingIds = existingBadges.map(sb => sb.badgeId.toString());

    const eligibleBadges = await Badge.find({ isActive: true, _id: { $nin: allExistingIds } });

    for (const badge of eligibleBadges) {
        try {
            // submission = null → retroactive mode
            const shouldAward = await evaluateCondition(badge, studentId, student, null, Submission);
            if (shouldAward) {
                const result = await this.awardBadge(studentId, badge._id, { source: 'auto' });
                if (result.success) awardedBadges.push(badge);
            }
        } catch (e) {
            console.error(`Badge retroactive check error [${badge.name?.vi}]:`, e.message);
        }
    }

    return awardedBadges;
};

export default mongoose.model('StudentBadge', StudentBadgeSchema);
