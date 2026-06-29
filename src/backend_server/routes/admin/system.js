import express from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import { authMiddleware, requireAdmin } from '../../middleware/authMiddleware.js';
import UserSession from '../../models/UserSession.js';

const router = express.Router();
router.use(authMiddleware);
router.use(requireAdmin);

// ── Resolve thư mục backups/ ngang hàng với server.js ──────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.resolve(__dirname, '../../backups');

// Đảm bảo thư mục tồn tại khi module load
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// ── Danh sách collections sẽ được backup theo thứ tự phụ thuộc ──────────────
// Users trước → Classes/Badges → Assignments/Exams → Submissions → còn lại
const BACKUP_COLLECTIONS = [
    'users',
    'classes',
    'badges',
    'assignments',
    'exams',
    'submissions',
    'studentbadges',
    'notifications',
    'feedbacks',
    'instructorfeedbacks',
    'conversations',
    'messages',
    'supporttickets',
    'backuprecords',
    'securitypolicies',
];

// ── Schemas ─────────────────────────────────────────────────────────────────
const backupRecordSchema = new mongoose.Schema({
    type: { type: String, enum: ['manual', 'auto'], default: 'manual' },
    status: { type: String, enum: ['success', 'failed', 'in_progress'], default: 'in_progress' },
    // Kích thước file thực tế (vd: "3.42 MB")
    size: { type: String, default: '0 B' },
    // Số bytes thực tế để sort/hiển thị
    sizeBytes: { type: Number, default: 0 },
    filename: { type: String, default: '' },
    // Checksum MD5 để xác minh tính toàn vẹn file
    checksum: { type: String, default: '' },
    // Thống kê nội dung backup
    stats: {
        totalCollections: { type: Number, default: 0 },
        totalDocuments: { type: Number, default: 0 },
        collectionBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    schedule: { type: String, enum: ['daily', 'weekly', 'monthly', ''], default: '' },
    errorMessage: { type: String, default: '' }
}, { timestamps: true });

const securityPolicySchema = new mongoose.Schema({
    minPasswordLength: { type: Number, default: 8 },
    requireSpecialChar: { type: Boolean, default: true },
    requireUppercase: { type: Boolean, default: true },
    requireNumber: { type: Boolean, default: true },
    // 'daily' | 'weekly' | 'monthly' | 'custom' | 'once' | 'none'
    autoBackupSchedule: { type: String, default: 'weekly' },
    // Cấu hình lịch tùy chỉnh
    autoBackupConfig: {
        // Giờ chạy (0-23), phút (0-59) — dùng cho daily/weekly/monthly/custom
        hour:   { type: Number, default: 2 },
        minute: { type: Number, default: 0 },
        // Ngày trong tuần (0=CN, 1=T2..6=T7) — dùng cho weekly/custom
        weekDay: { type: Number, default: 0 },
        // Ngày trong tháng (1-28) — dùng cho monthly/custom
        monthDay: { type: Number, default: 1 },
        // ISO datetime string — dùng cho 'once' (chạy 1 lần đúng thời điểm)
        onceAt: { type: String, default: '' }
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

const BackupRecord = mongoose.models.BackupRecord || mongoose.model('BackupRecord', backupRecordSchema);
const SecurityPolicy = mongoose.models.SecurityPolicy || mongoose.model('SecurityPolicy', securityPolicySchema);

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Chuyển bytes → chuỗi dễ đọc */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/** Tính MD5 checksum của nội dung string */
function computeChecksum(content) {
    return crypto.createHash('md5').update(content, 'utf8').digest('hex');
}

/** Dump một collection về mảng documents thuần */
async function dumpCollection(db, collectionName) {
    try {
        const docs = await db.collection(collectionName).find({}).toArray();
        return docs;
    } catch {
        return [];
    }
}

/** Restore một collection: xóa toàn bộ rồi insert lại */
async function restoreCollection(db, collectionName, docs) {
    if (!Array.isArray(docs) || docs.length === 0) return 0;
    const col = db.collection(collectionName);
    await col.deleteMany({});
    // Insert theo từng batch 500 để tránh overflow
    const BATCH = 500;
    let inserted = 0;
    for (let i = 0; i < docs.length; i += BATCH) {
        const batch = docs.slice(i, i + BATCH);
        // Giữ nguyên _id gốc để không bị lệch references
        await col.insertMany(batch, { ordered: false });
        inserted += batch.length;
    }
    return inserted;
}

// ── Core backup logic — dùng chung cho cả manual và auto ────────────────────
/**
 * Thực hiện backup thực sự, ghi file ra BACKUP_DIR.
 * @param {object} options
 * @param {string} options.type       'manual' | 'auto'
 * @param {string} [options.schedule] '' | 'daily' | 'weekly' | 'monthly'
 * @param {string} [options.triggeredBy] ObjectId của admin (manual) hoặc null (auto)
 * @returns {Promise<{success: boolean, message: string, record: object}>}
 */
async function performBackup({ type = 'manual', schedule = '', triggeredBy = null } = {}) {
    if (mongoose.connection.readyState !== 1) {
        throw new Error('Database offline, không thể backup!');
    }

    const timestamp = Date.now();
    const filename = `backup_${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, filename);

    // Tạo bản ghi in_progress ngay để track
    const record = new BackupRecord({ type, status: 'in_progress', filename, triggeredBy, schedule });
    await record.save();

    try {
        const db = mongoose.connection.db;
        const collectionBreakdown = {};
        let totalDocuments = 0;

        const data = {
            _meta: {
                version: '2.0',
                createdAt: new Date().toISOString(),
                dbName: db.databaseName,
                backupType: type,
                schedule: schedule || null,
                collections: BACKUP_COLLECTIONS
            },
            collections: {}
        };

        for (const col of BACKUP_COLLECTIONS) {
            const docs = await dumpCollection(db, col);
            data.collections[col] = docs;
            collectionBreakdown[col] = docs.length;
            totalDocuments += docs.length;
        }

        const content = JSON.stringify(data, null, 2);
        const checksum = computeChecksum(content);
        fs.writeFileSync(filePath, content, 'utf8');

        const sizeBytes = fs.statSync(filePath).size;
        const size = formatBytes(sizeBytes);

        record.status = 'success';
        record.size = size;
        record.sizeBytes = sizeBytes;
        record.checksum = checksum;
        record.stats = { totalCollections: BACKUP_COLLECTIONS.length, totalDocuments, collectionBreakdown };
        await record.save();

        const msg = `[${type.toUpperCase()} BACKUP] ${filename} — ${totalDocuments.toLocaleString()} docs, ${size}`;
        console.log('✅', msg);
        return { success: true, message: msg, record };
    } catch (error) {
        record.status = 'failed';
        record.errorMessage = error.message;
        await record.save();
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        console.error('❌ Backup failed:', error.message);
        throw error;
    }
}

// ── Auto-backup cron scheduler ───────────────────────────────────────────────

// Giữ reference đến task / timer hiện tại
let _currentCronTask = null;
let _onceTimer       = null;
let _currentSchedule = null;
let _currentConfig   = {};

/**
 * Xây dựng cron expression từ schedule + config.
 * Trả về null nếu không cần cron (none / once).
 */
function buildCronExpression(schedule, cfg = {}) {
    const h  = cfg.hour     ?? 2;
    const m  = cfg.minute   ?? 0;
    const wd = cfg.weekDay  ?? 0;   // 0 = CN
    const md = cfg.monthDay ?? 1;
    switch (schedule) {
        case 'daily':   return `${m} ${h} * * *`;
        case 'weekly':  return `${m} ${h} * * ${wd}`;
        case 'monthly': return `${m} ${h} ${md} * *`;
        default:        return null;
    }
}

/** Tính thời điểm chạy kế tiếp (trả ISO string hoặc null) */
function computeNextRun(schedule, cfg = {}) {
    const now = new Date();
    const h  = cfg.hour     ?? 2;
    const m  = cfg.minute   ?? 0;
    const wd = cfg.weekDay  ?? 0;
    const md = cfg.monthDay ?? 1;

    if (schedule === 'once') {
        if (!cfg.onceAt) return null;
        let t;
        if (cfg.onceAt.endsWith('Z') || cfg.onceAt.includes('+')) {
            t = new Date(cfg.onceAt);
        } else {
            const [datePart, timePart] = cfg.onceAt.split('T');
            const [y, mo, d] = datePart.split('-').map(Number);
            const [h, m] = (timePart || '00:00').split(':').map(Number);
            t = new Date(Date.UTC(y, mo - 1, d, h - 7, m, 0));
        }
        return t && t > now ? t.toISOString() : null;
    }
    if (schedule === 'daily') {
        const next = new Date(now); next.setHours(h, m, 0, 0);
        if (next <= now) next.setDate(next.getDate() + 1);
        return next.toISOString();
    }
    if (schedule === 'weekly') {
        const next = new Date(now); next.setHours(h, m, 0, 0);
        let diff = (wd - next.getDay() + 7) % 7;
        if (diff === 0 && next <= now) diff = 7;
        next.setDate(next.getDate() + diff);
        return next.toISOString();
    }
    if (schedule === 'monthly') {
        let next = new Date(now.getFullYear(), now.getMonth(), md, h, m, 0);
        if (next <= now) next = new Date(now.getFullYear(), now.getMonth() + 1, md, h, m, 0);
        return next.toISOString();
    }
    if (schedule === 'custom') {
        // custom đã bị bỏ — fallback về none
        return null;
    }
    return null;
}

/**
 * Đăng ký (hoặc hủy) cron / setTimeout auto-backup.
 * @param {string} schedule  'daily'|'weekly'|'monthly'|'custom'|'once'|'none'
 * @param {object} cfg       { hour, minute, weekDay, monthDay, onceAt }
 */
function scheduleAutoBackup(schedule, cfg = {}) {
    // Hủy job cũ
    if (_currentCronTask) { _currentCronTask.stop(); _currentCronTask = null; }
    if (_onceTimer)        { clearTimeout(_onceTimer); _onceTimer = null; }
    _currentSchedule = schedule;
    _currentConfig   = cfg;

    if (!schedule || schedule === 'none') {
        console.log('ℹ️  Auto-backup: đã tắt');
        return;
    }

    // ── Mode chạy 1 lần ──────────────────────────────────────────────────────
    if (schedule === 'once') {
        const onceAt = cfg.onceAt;
        if (!onceAt) { console.warn('⚠️  Auto-backup "once": onceAt không hợp lệ'); return; }

        // onceAt có thể là ISO UTC string hoặc local datetime string "YYYY-MM-DDTHH:mm"
        // Nếu không có timezone suffix → coi là giờ Việt Nam (UTC+7)
        let target;
        if (onceAt.endsWith('Z') || onceAt.includes('+')) {
            target = new Date(onceAt);
        } else {
            // "2026-06-05T23:18" → parse as Asia/Ho_Chi_Minh (UTC+7)
            const [datePart, timePart] = onceAt.split('T');
            const [y, mo, d] = datePart.split('-').map(Number);
            const [h, m] = (timePart || '00:00').split(':').map(Number);
            // UTC+7: subtract 7 hours to get UTC
            target = new Date(Date.UTC(y, mo - 1, d, h - 7, m, 0));
        }

        if (!target || isNaN(target)) { console.warn('⚠️  Auto-backup "once": onceAt không hợp lệ'); return; }
        const delay = target.getTime() - Date.now();
        if (delay <= 0) { console.warn('⚠️  Auto-backup "once": thời điểm đã qua'); return; }
        _onceTimer = setTimeout(async () => {
            console.log(`⏰ Auto-backup ONE-TIME — ${new Date().toISOString()}`);
            try { await performBackup({ type: 'auto', schedule: 'once' }); } catch (e) { console.error('❌', e.message); }
            _onceTimer = null; _currentSchedule = null;
            SecurityPolicy.findOne({}).then(p => { if (p) { p.autoBackupSchedule = 'none'; p.save().catch(() => {}); } }).catch(() => {});
        }, delay);
        console.log(`✅ Auto-backup ONE-TIME: ${target.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} (${Math.round(delay / 60000)} phút nữa)`);
        return;
    }

    // ── Mode lặp lại ─────────────────────────────────────────────────────────
    const expression = buildCronExpression(schedule, cfg);
    if (!expression || !cron.validate(expression)) {
        console.error('❌ Auto-backup: cron expression không hợp lệ:', expression);
        return;
    }
    _currentCronTask = cron.schedule(expression, async () => {
        console.log(`⏰ Auto-backup triggered (${schedule}, ${expression}) — ${new Date().toISOString()}`);
        try { await performBackup({ type: 'auto', schedule }); } catch (e) { console.error('❌ Auto-backup error:', e.message); }
    }, { timezone: 'Asia/Ho_Chi_Minh' });
    console.log(`✅ Auto-backup scheduled: ${schedule} → "${expression}" (Asia/Ho_Chi_Minh)`);
}

/** Đọc setting từ DB và khởi động. Gọi sau khi MongoDB connect xong. */
async function initAutoBackupScheduler() {
    try {
        const policy = await SecurityPolicy.findOne({});
        const schedule = policy?.autoBackupSchedule || 'none';
        const cfg = policy?.autoBackupConfig || {};

        // Nếu là 'once' và thời điểm đã qua (do server restart) → backup ngay
        if (schedule === 'once' && cfg.onceAt) {
            let targetTs;
            const onceAt = cfg.onceAt;
            if (onceAt.endsWith('Z') || onceAt.includes('+')) {
                targetTs = new Date(onceAt).getTime();
            } else {
                const [dp, tp] = onceAt.split('T');
                const [y, mo, d] = dp.split('-').map(Number);
                const [h, m] = (tp || '00:00').split(':').map(Number);
                targetTs = Date.UTC(y, mo - 1, d, h - 7, m, 0);
            }
            const delay = targetTs - Date.now();
            if (delay <= 0 && delay > -10 * 60 * 1000) {
                // Lỡ trong vòng 10 phút → backup ngay
                console.log('⚡ Auto-backup: lỡ lịch do restart, chạy ngay...');
                try { await performBackup({ type: 'auto', schedule: 'once' }); } catch (e) { console.error('❌', e.message); }
                await SecurityPolicy.findOneAndUpdate({}, { autoBackupSchedule: 'none' }).catch(() => {});
                return;
            }
        }

        scheduleAutoBackup(schedule, cfg);
    } catch (e) { console.error('⚠️  Auto-backup init error:', e.message); }
}

export { initAutoBackupScheduler };

// ── CF11.1 — Danh sách phiên đăng nhập ──────────────────────────────────────
router.get('/sessions', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ sessions: [], _warning: 'Database offline' });
    }
    try {
        // Dọn dẹp session hết hạn trước
        await UserSession.deleteMany({ expiresAt: { $lt: new Date() } }).catch(() => {});

        const sessions = await UserSession.find({ isActive: true })
            .populate('userId', 'fullName email role username')
            .sort({ createdAt: -1 })
            .limit(200)
            .lean();

        const result = sessions.map(s => ({
            _id:       s._id,
            userId:    s.userId?._id,
            account:   s.userId?.fullName || s.userId?.email || 'N/A',
            email:     s.userId?.email || '',
            role:      s.userId?.role || 'user',
            loginTime: s.createdAt,
            ip:        s.ip || 'N/A',
            device:    s.device || 'N/A',
            expiresAt: s.expiresAt,
            status:    'active'
        }));

        res.status(200).json({ sessions: result });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF11.1 — Buộc đăng xuất từng tài khoản (thu hồi tất cả session của user đó)
router.post('/sessions/:userId/force-logout', async (req, res) => {
    try {
        const { userId } = req.params;
        await UserSession.updateMany(
            { userId, isActive: true },
            { isActive: false, revokedAt: new Date(), revokedBy: req.user?.id || null }
        );
        res.status(200).json({ message: 'Đã buộc đăng xuất tài khoản!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF11.1 — Kết thúc toàn bộ phiên
router.post('/sessions/force-logout-all', async (req, res) => {
    try {
        await UserSession.updateMany(
            { isActive: true },
            { isActive: false, revokedAt: new Date(), revokedBy: req.user?.id || null }
        );
        res.status(200).json({ message: 'Đã kết thúc toàn bộ phiên đăng nhập!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// ── CF11.2 — Backup thủ công ────────────────────────────────────────────────
router.post('/backup', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database offline, không thể backup!' });
    }
    try {
        const result = await performBackup({ type: 'manual', triggeredBy: req.user.id });
        await result.record.populate('triggeredBy', 'fullName');
        res.status(200).json({ message: result.message, record: result.record });
    } catch (error) {
        res.status(500).json({ message: 'Backup thất bại!', error: error.message });
    }
});

// ── CF11.2 — Danh sách backup ────────────────────────────────────────────────
router.get('/backups', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ backups: [], _warning: 'Database offline' });
    }
    try {
        const backups = await BackupRecord.find({})
            .populate('triggeredBy', 'fullName')
            .sort({ createdAt: -1 })
            .limit(50);

        // Bổ sung thông tin file tồn tại hay không
        const enriched = backups.map(b => {
            const obj = b.toObject();
            obj.fileExists = fs.existsSync(path.join(BACKUP_DIR, b.filename));
            return obj;
        });

        res.status(200).json({ backups: enriched });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// ── CF11.2 — Tải file backup về ──────────────────────────────────────────────
router.get('/backups/:id/download', async (req, res) => {
    try {
        const record = await BackupRecord.findById(req.params.id);
        if (!record) return res.status(404).json({ message: 'Không tìm thấy bản backup!' });

        const filePath = path.join(BACKUP_DIR, record.filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File backup không tồn tại trên server!' });
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${record.filename}"`);
        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// ── Xóa 1 backup ────────────────────────────────────────────────────────────
router.delete('/backups/:id', async (req, res) => {
    try {
        const record = await BackupRecord.findById(req.params.id);
        if (!record) return res.status(404).json({ message: 'Không tìm thấy bản backup!' });
        // Xóa file nếu tồn tại
        const filePath = path.join(BACKUP_DIR, record.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        await BackupRecord.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: `Đã xóa backup "${record.filename}"` });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// ── Xóa nhiều backup ─────────────────────────────────────────────────────────
router.delete('/backups', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Thiếu danh sách ids!' });
        }
        const records = await BackupRecord.find({ _id: { $in: ids } });
        let deletedCount = 0;
        for (const record of records) {
            const filePath = path.join(BACKUP_DIR, record.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            deletedCount++;
        }
        await BackupRecord.deleteMany({ _id: { $in: ids } });
        res.status(200).json({ message: `Đã xóa ${deletedCount} bản backup!`, deletedCount });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// ── CF11.3 — Khôi phục dữ liệu (THỰC SỰ) ───────────────────────────────────
router.post('/restore', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database offline, không thể khôi phục!' });
    }

    const { backupId, filename } = req.body;
    if (!backupId && !filename) {
        return res.status(400).json({ message: 'Thiếu thông tin backup!' });
    }

    try {
        // Tìm record
        const record = await BackupRecord.findById(backupId);
        if (!record) return res.status(404).json({ message: 'Không tìm thấy bản backup!' });

        const filePath = path.join(BACKUP_DIR, record.filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: `File backup "${record.filename}" không tồn tại trên server!` });
        }

        // Đọc và kiểm tra file
        const content = fs.readFileSync(filePath, 'utf8');

        // Xác minh checksum nếu có
        if (record.checksum) {
            const actualChecksum = computeChecksum(content);
            if (actualChecksum !== record.checksum) {
                return res.status(422).json({
                    message: 'File backup bị hỏng! Checksum không khớp. Không thể khôi phục.'
                });
            }
        }

        let data;
        try {
            data = JSON.parse(content);
        } catch {
            return res.status(422).json({ message: 'File backup không đúng định dạng JSON!' });
        }

        if (!data.collections) {
            return res.status(422).json({ message: 'Cấu trúc file backup không hợp lệ!' });
        }

        const db = mongoose.connection.db;
        const restoreStats = {};
        let totalRestored = 0;

        // Restore theo thứ tự: xóa + insert lại từng collection
        for (const col of BACKUP_COLLECTIONS) {
            if (data.collections[col]) {
                const count = await restoreCollection(db, col, data.collections[col]);
                restoreStats[col] = count;
                totalRestored += count;
            }
        }

        res.status(200).json({
            message: `Khôi phục thành công từ "${record.filename}"! ${totalRestored.toLocaleString()} documents đã được phục hồi.`,
            stats: restoreStats,
            totalRestored,
            restoredFrom: {
                filename: record.filename,
                createdAt: record.createdAt,
                size: record.size
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Khôi phục thất bại!', error: error.message });
    }
});

// ── CF11.4 — Lấy trạng thái auto-backup hiện tại ────────────────────────────
router.get('/backup-schedule-status', async (req, res) => {
    const policy = await SecurityPolicy.findOne({}).catch(() => null);
    const schedule = policy?.autoBackupSchedule || 'none';
    const cfg      = policy?.autoBackupConfig   || {};
    const expr     = buildCronExpression(schedule, cfg);
    const nextRun  = (_currentCronTask || _onceTimer) ? computeNextRun(schedule, cfg) : null;

    res.status(200).json({
        schedule,
        config: cfg,
        isActive: !!((_currentCronTask || _onceTimer)),
        cronExpression: expr || null,
        nextRun,
        timezone: 'Asia/Ho_Chi_Minh'
    });
});

// ── CF11.4 — Lấy chính sách bảo mật ────────────────────────────────────────
router.get('/security-policy', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ policy: { minPasswordLength: 8, requireSpecialChar: true, requireUppercase: true, requireNumber: true, autoBackupSchedule: 'weekly' } });
    }
    try {
        let policy = await SecurityPolicy.findOne({});
        if (!policy) {
            policy = await SecurityPolicy.create({ updatedBy: req.user.id });
        }
        res.status(200).json({ policy });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF11.4 — Cập nhật chính sách bảo mật
router.put('/security-policy', async (req, res) => {
    try {
        const { minPasswordLength, requireSpecialChar, requireUppercase, requireNumber,
                autoBackupSchedule, autoBackupConfig } = req.body;

        console.log(`📥 PUT /security-policy — schedule: ${autoBackupSchedule}, config:`, JSON.stringify(autoBackupConfig));

        let policy = await SecurityPolicy.findOne({});
        if (!policy) policy = new SecurityPolicy({});

        if (minPasswordLength  !== undefined) policy.minPasswordLength  = minPasswordLength;
        if (requireSpecialChar !== undefined) policy.requireSpecialChar = requireSpecialChar;
        if (requireUppercase   !== undefined) policy.requireUppercase   = requireUppercase;
        if (requireNumber      !== undefined) policy.requireNumber      = requireNumber;

        const newSchedule = autoBackupSchedule ?? policy.autoBackupSchedule;
        const newConfig   = autoBackupConfig   ?? policy.autoBackupConfig ?? {};

        // Validate 'once': phải có onceAt trong tương lai
        if (newSchedule === 'once') {
            if (!newConfig.onceAt) return res.status(400).json({ message: 'Lịch "once" cần có thời điểm cụ thể (onceAt)!' });
            const onceAtStr = newConfig.onceAt;
            let targetTs;
            if (onceAtStr.endsWith('Z') || onceAtStr.includes('+')) {
                targetTs = new Date(onceAtStr).getTime();
            } else {
                const [dp, tp] = onceAtStr.split('T');
                const [y, mo, d] = dp.split('-').map(Number);
                const [h, m] = (tp || '00:00').split(':').map(Number);
                targetTs = Date.UTC(y, mo - 1, d, h - 7, m, 0);
            }
            const delayMs = targetTs - Date.now();
            console.log(`🕐 once validation: targetTs=${new Date(targetTs).toISOString()}, delay=${Math.round(delayMs/1000)}s`);
            if (delayMs <= 0) {
                return res.status(400).json({ message: 'Thời điểm backup phải là trong tương lai! Vui lòng chọn lại.' });
            }
        }

        policy.autoBackupSchedule = newSchedule;
        policy.autoBackupConfig   = { ...newConfig };
        policy.updatedBy = req.user.id;
        await policy.save();
        console.log(`💾 Policy saved — calling scheduleAutoBackup("${newSchedule}")`);

        scheduleAutoBackup(newSchedule, newConfig);

        res.status(200).json({ message: 'Đã cập nhật chính sách bảo mật!', policy });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
