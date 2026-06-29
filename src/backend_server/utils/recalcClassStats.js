/**
 * recalcClassStats.js
 *
 * Tính lại classStats cho một lớp học dựa 100% vào dữ liệu thực tế:
 *  - averageScore     : trung bình điểm tất cả submissions của học viên trong lớp
 *  - completionRate   : % học viên có ít nhất 1 submission hoàn thành
 *  - activeStudents   : số học viên có luyện tập trong 7 ngày gần nhất
 *  - totalStudents    : số học viên trong lớp
 *
 * Không dùng studentStats (có thể còn dữ liệu seed cũ).
 * Tính thẳng từ collection Submission.
 */

import mongoose from 'mongoose';
import Submission from '../models/Submission.js';
import Class from '../models/Class.js';

/**
 * Tính classStats realtime cho 1 lớp, KHÔNG lưu vào DB.
 * Trả về object stats để gắn vào response.
 *
 * @param {string[]|ObjectId[]} studentIds   - mảng _id học viên trong lớp
 * @returns {Promise<object>}
 */
export async function calcClassStats(studentIds) {
    if (!studentIds || studentIds.length === 0) {
        return { totalStudents: 0, averageScore: 0, completionRate: 0, activeStudents: 0, averageAccuracy: 0 };
    }

    const sids = studentIds.map(id =>
        typeof id === 'string' ? new mongoose.Types.ObjectId(id) : (id._id ? id._id : id)
    );

    const totalStudents = sids.length;

    // Tất cả submissions của học viên trong lớp
    const submissions = await Submission.find({ studentId: { $in: sids } }).lean();

    // averageScore từ tất cả bài có điểm
    const scoredSubs = submissions.filter(s => s.score !== null && s.score !== undefined);
    const averageScore = scoredSubs.length > 0
        ? Math.round(scoredSubs.reduce((acc, s) => acc + s.score, 0) / scoredSubs.length * 10) / 10
        : 0;

    // averageAccuracy
    const accSubs = submissions.filter(s => s.accuracy !== null && s.accuracy !== undefined && s.accuracy > 0);
    const averageAccuracy = accSubs.length > 0
        ? Math.round(accSubs.reduce((acc, s) => acc + s.accuracy, 0) / accSubs.length * 10) / 10
        : 0;

    // completionRate: % học viên có ít nhất 1 submission với status completed/graded
    const completedStudentIds = new Set(
        submissions
            .filter(s => ['completed', 'graded'].includes(s.status))
            .map(s => s.studentId.toString())
    );
    const completionRate = totalStudents > 0
        ? Math.round((completedStudentIds.size / totalStudents) * 100)
        : 0;

    // activeStudents: có submission trong 7 ngày gần nhất
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeStudentIds = new Set(
        submissions
            .filter(s => new Date(s.submittedAt || s.createdAt) >= sevenDaysAgo)
            .map(s => s.studentId.toString())
    );
    const activeStudents = activeStudentIds.size;

    return { totalStudents, averageScore, averageAccuracy, completionRate, activeStudents };
}

/**
 * Tính và LƯU classStats vào DB cho một lớp.
 * Gọi khi học viên nộp bài hoặc admin sync.
 *
 * @param {string|ObjectId} classId
 */
export async function recalcClassStats(classId) {
    const cls = await Class.findById(classId).select('studentIds').lean();
    if (!cls) return;
    const stats = await calcClassStats(cls.studentIds);
    await Class.findByIdAndUpdate(classId, { $set: { classStats: stats } });
    return stats;
}

/**
 * Sync classStats cho TẤT CẢ lớp học (dùng cho admin endpoint).
 */
export async function recalcAllClassStats() {
    const classes = await Class.find({ status: { $ne: 'deleted' } }).select('_id studentIds').lean();
    let updated = 0, failed = 0;
    for (const cls of classes) {
        try {
            const stats = await calcClassStats(cls.studentIds);
            await Class.findByIdAndUpdate(cls._id, { $set: { classStats: stats } });
            updated++;
        } catch (err) {
            console.error(`recalcClassStats failed for ${cls._id}:`, err.message);
            failed++;
        }
    }
    return { updated, failed, total: classes.length };
}
