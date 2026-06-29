/**
 * sync_all_stats.mjs
 * Chạy 1 lần để sync toàn bộ studentStats + classStats từ Submission thực tế.
 * Dùng: node backend_server/sync_all_stats.mjs
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

await mongoose.connect(process.env.MONGO_URI);
console.log('✅ Connected to MongoDB');

// ─── Models ────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({}, { strict: false });
const submissionSchema = new mongoose.Schema({}, { strict: false });
const classSchema = new mongoose.Schema({}, { strict: false });

const User       = mongoose.model('User',       userSchema,       'users');
const Submission = mongoose.model('Submission', submissionSchema, 'submissions');
const Class      = mongoose.model('Class',      classSchema,      'classes');

// ─── 1. Sync studentStats ──────────────────────────────────────────────────
console.log('\n📊 Syncing studentStats...');
const students = await User.find({ role: 'user' }).select('_id').lean();
let sUpdated = 0, sFailed = 0;

for (const student of students) {
    try {
        const sid = student._id;
        const submissions = await Submission.find({ studentId: sid }).lean();

        const scoredSubs = submissions.filter(s => s.score !== null && s.score !== undefined);
        const averageScore = scoredSubs.length > 0
            ? Math.round(scoredSubs.reduce((a, s) => a + s.score, 0) / scoredSubs.length * 10) / 10
            : 0;

        const accSubs = submissions.filter(s => s.accuracy > 0);
        const averageAccuracy = accSubs.length > 0
            ? Math.round(accSubs.reduce((a, s) => a + s.accuracy, 0) / accSubs.length * 10) / 10
            : 0;

        const totalPracticeTime = Math.round(
            submissions.reduce((a, s) => a + (s.timeSpent || 0), 0) / 60
        );

        // ── Unique bài (assignment + exam) đã hoàn thành ──
        const completedAssignmentIds = new Set(
            submissions
                .filter(s => s.assignmentId && ['completed','graded'].includes(s.status))
                .map(s => s.assignmentId.toString())
        );
        const completedExamIds = new Set(
            submissions
                .filter(s => s.examId && ['completed','graded'].includes(s.status))
                .map(s => s.examId.toString())
        );
        const totalAssignmentsCompleted = completedAssignmentIds.size + completedExamIds.size;

        // ── Tổng bài riêng biệt (không tính lượt) ──
        const uniqueAssignmentIds = new Set(
            submissions.filter(s => s.assignmentId).map(s => s.assignmentId.toString())
        );
        const uniqueExamIds = new Set(
            submissions.filter(s => s.examId).map(s => s.examId.toString())
        );
        const totalPracticeCount = uniqueAssignmentIds.size + uniqueExamIds.size;

        const lastPracticeDate = submissions.length > 0
            ? submissions.reduce((latest, s) => {
                const d = s.submittedAt || s.createdAt;
                return d > latest ? d : latest;
            }, new Date(0))
            : null;

        // streak
        const uniqueDays = [...new Set(
            submissions.map(s => new Date(s.submittedAt || s.createdAt).toISOString().slice(0, 10))
        )].sort().reverse();

        let currentStreak = 0, longestStreak = uniqueDays.length > 0 ? 1 : 0, tempS = 1;
        const todayStr     = new Date().toISOString().slice(0, 10);
        const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (uniqueDays.length > 0 && (uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr)) {
            currentStreak = 1;
            for (let i = 1; i < uniqueDays.length; i++) {
                const diff = Math.round((new Date(uniqueDays[i-1]) - new Date(uniqueDays[i])) / 86400000);
                if (diff === 1) currentStreak++; else break;
            }
        }
        for (let i = 1; i < uniqueDays.length; i++) {
            const diff = Math.round((new Date(uniqueDays[i-1]) - new Date(uniqueDays[i])) / 86400000);
            if (diff === 1) { tempS++; if (tempS > longestStreak) longestStreak = tempS; } else tempS = 1;
        }

        await User.findByIdAndUpdate(sid, {
            $set: {
                studentStats: {
                    totalPracticeCount,                        // số BÀI riêng biệt
                    totalAssignmentsCompleted,                 // số BÀI hoàn thành
                    averageScore,
                    averageAccuracy,
                    totalPracticeTime,
                    lastPracticeDate,
                    currentStreak,
                    longestStreak
                }
            }
        });
        sUpdated++;
    } catch (err) {
        console.error(`  ❌ studentStats failed for ${student._id}: ${err.message}`);
        sFailed++;
    }
}
console.log(`  ✅ studentStats: ${sUpdated} updated, ${sFailed} failed`);

// ─── 2. Sync classStats ────────────────────────────────────────────────────
console.log('\n🏫 Syncing classStats...');
const classes = await Class.find({ status: { $ne: 'deleted' } }).select('_id studentIds').lean();
let cUpdated = 0, cFailed = 0;

for (const cls of classes) {
    try {
        const sids = (cls.studentIds || []).map(id =>
            typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id
        );
        const totalStudents = sids.length;

        const submissions = sids.length > 0
            ? await Submission.find({ studentId: { $in: sids } }).lean()
            : [];

        const scoredSubs = submissions.filter(s => s.score !== null && s.score !== undefined);
        const averageScore = scoredSubs.length > 0
            ? Math.round(scoredSubs.reduce((a, s) => a + s.score, 0) / scoredSubs.length * 10) / 10
            : 0;

        const accSubs = submissions.filter(s => s.accuracy > 0);
        const averageAccuracy = accSubs.length > 0
            ? Math.round(accSubs.reduce((a, s) => a + s.accuracy, 0) / accSubs.length * 10) / 10
            : 0;

        const completedStudentIds = new Set(
            submissions
                .filter(s => ['completed','graded'].includes(s.status))
                .map(s => s.studentId.toString())
        );
        const completionRate = totalStudents > 0
            ? Math.round((completedStudentIds.size / totalStudents) * 100)
            : 0;

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const activeStudentIds = new Set(
            submissions
                .filter(s => new Date(s.submittedAt || s.createdAt) >= sevenDaysAgo)
                .map(s => s.studentId.toString())
        );
        const activeStudents = activeStudentIds.size;

        await Class.findByIdAndUpdate(cls._id, {
            $set: {
                classStats: { totalStudents, averageScore, averageAccuracy, completionRate, activeStudents }
            }
        });

        cUpdated++;
        console.log(`  [${cls._id}] completionRate=${completionRate}%, avgScore=${averageScore}, activeStudents=${activeStudents}`);
    } catch (err) {
        console.error(`  ❌ classStats failed for ${cls._id}: ${err.message}`);
        cFailed++;
    }
}
console.log(`  ✅ classStats: ${cUpdated} updated, ${cFailed} failed`);

await mongoose.disconnect();
console.log('\n✅ All done. Restart server để áp dụng code mới.');
