/**
 * recalcStudentStats.js
 *
 * Tính lại toàn bộ studentStats cho một học viên dựa 100% vào dữ liệu
 * thực tế trong collection Submission.  Không bao giờ dùng số mock/seed.
 *
 * Gọi hàm này sau mỗi lần:
 *  - Học viên nộp bài (assignment hoặc exam)
 *  - Giảng viên chấm điểm bài nộp
 */

import mongoose from 'mongoose';
import Submission from '../models/Submission.js';
import User from '../models/User.js';

/**
 * Tính lại studentStats và cập nhật vào User document.
 *
 * @param {string|ObjectId} studentId
 * @returns {Promise<object>} stats mới đã lưu
 */
export async function recalcStudentStats(studentId) {
    const sid = typeof studentId === 'string'
        ? new mongoose.Types.ObjectId(studentId)
        : studentId;

    // Lấy tất cả submissions của học viên
    const submissions = await Submission.find({ studentId: sid }).lean();

    const totalSubmissions = submissions.length;

    // ── Điểm trung bình (chỉ tính bài có điểm) ────────────────────────
    const scoredSubs = submissions.filter(s => s.score !== null && s.score !== undefined);
    const averageScore = scoredSubs.length > 0
        ? scoredSubs.reduce((acc, s) => acc + s.score, 0) / scoredSubs.length
        : 0;

    // ── Độ chính xác trung bình ────────────────────────────────────────
    const accuracySubs = submissions.filter(s => s.accuracy !== null && s.accuracy !== undefined && s.accuracy > 0);
    const averageAccuracy = accuracySubs.length > 0
        ? accuracySubs.reduce((acc, s) => acc + s.accuracy, 0) / accuracySubs.length
        : 0;

    // ── Tổng thời gian luyện tập (phút) ───────────────────────────────
    const totalPracticeTime = Math.round(
        submissions.reduce((acc, s) => acc + (s.timeSpent || 0), 0) / 60
    );

    // ── Số bài assignment đã hoàn thành (unique assignment, status completed/graded) ──
    const completedAssignmentIds = new Set(
        submissions
            .filter(s => s.assignmentId && ['completed', 'graded'].includes(s.status))
            .map(s => s.assignmentId.toString())
    );
    // ── Số bài exam đã hoàn thành (unique exam) ──
    const completedExamIds = new Set(
        submissions
            .filter(s => s.examId && ['completed', 'graded'].includes(s.status))
            .map(s => s.examId.toString())
    );
    const totalAssignmentsCompleted = completedAssignmentIds.size + completedExamIds.size;

    // ── Tổng bài riêng biệt (unique assignment + unique exam) ──
    const uniqueAssignmentIds = new Set(
        submissions.filter(s => s.assignmentId).map(s => s.assignmentId.toString())
    );
    const uniqueExamIds = new Set(
        submissions.filter(s => s.examId).map(s => s.examId.toString())
    );
    const totalUniqueTasks = uniqueAssignmentIds.size + uniqueExamIds.size;

    // ── Ngày luyện tập gần nhất ────────────────────────────────────────
    const lastPracticeDate = submissions.length > 0
        ? submissions.reduce((latest, s) => {
            const d = s.submittedAt || s.createdAt;
            return d > latest ? d : latest;
        }, new Date(0))
        : null;

    // ── Tính streak (liên tiếp ngày có làm bài) ────────────────────────
    const uniqueDays = [
        ...new Set(
            submissions.map(s => {
                const d = s.submittedAt || s.createdAt;
                return new Date(d).toISOString().slice(0, 10);
            })
        )
    ].sort().reverse(); // mới nhất trước

    let currentStreak = 0;
    let longestStreak = uniqueDays.length > 0 ? 1 : 0;

    if (uniqueDays.length > 0) {
        const todayStr     = new Date().toISOString().slice(0, 10);
        const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

        // currentStreak: bắt đầu từ hôm nay hoặc hôm qua
        if (uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr) {
            currentStreak = 1;
            for (let i = 1; i < uniqueDays.length; i++) {
                const diff = Math.round(
                    (new Date(uniqueDays[i - 1]) - new Date(uniqueDays[i])) / 86400000
                );
                if (diff === 1) { currentStreak++; } else break;
            }
        }

        // longestStreak
        let tempStreak = 1;
        for (let i = 1; i < uniqueDays.length; i++) {
            const diff = Math.round(
                (new Date(uniqueDays[i - 1]) - new Date(uniqueDays[i])) / 86400000
            );
            if (diff === 1) {
                tempStreak++;
                if (tempStreak > longestStreak) longestStreak = tempStreak;
            } else {
                tempStreak = 1;
            }
        }
    }

    const newStats = {
        totalPracticeCount:          totalUniqueTasks,        // số BÀI riêng biệt
        totalAssignmentsCompleted,                            // số BÀI đã hoàn thành
        averageScore:                Math.round(averageScore * 10) / 10,
        averageAccuracy:             Math.round(averageAccuracy * 10) / 10,
        totalPracticeTime,
        lastPracticeDate,
        currentStreak,
        longestStreak
    };

    await User.findByIdAndUpdate(sid, { $set: { studentStats: newStats } });

    return newStats;
}

/**
 * Sync lại stats cho TẤT CẢ học viên (role: 'user').
 * Dùng cho endpoint admin /sync-stats.
 *
 * @returns {Promise<{updated: number, failed: number}>}
 */
export async function recalcAllStudentsStats() {
    const User_ = (await import('../models/User.js')).default;
    const students = await User_.find({ role: 'user' }).select('_id').lean();

    let updated = 0;
    let failed  = 0;

    for (const student of students) {
        try {
            await recalcStudentStats(student._id);
            updated++;
        } catch (err) {
            console.error(`recalcStudentStats failed for ${student._id}:`, err.message);
            failed++;
        }
    }

    return { updated, failed, total: students.length };
}
