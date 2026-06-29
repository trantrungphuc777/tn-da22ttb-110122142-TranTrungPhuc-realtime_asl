/**
 * backup_daemon.mjs — Script độc lập kiểm tra lịch backup và thực hiện khi đến giờ.
 * Chạy song song với server, không bị ảnh hưởng bởi nodemon restart.
 * Chạy: node backup_daemon.mjs
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.join(__dirname, 'backups');
const MONGO_URI = process.env.MONGO_URI;
const CHECK_INTERVAL_MS = 30 * 1000;

const BACKUP_COLLECTIONS = [
    'users','classes','badges','assignments','exams','submissions',
    'studentbadges','notifications','feedbacks','instructorfeedbacks',
    'conversations','messages','supporttickets','backuprecords','securitypolicies'
];

const backupRecordSchema = new mongoose.Schema({
    type: { type: String, default: 'auto' },
    status: { type: String, default: 'in_progress' },
    size: { type: String, default: '0 B' },
    sizeBytes: { type: Number, default: 0 },
    filename: { type: String, default: '' },
    checksum: { type: String, default: '' },
    stats: { type: mongoose.Schema.Types.Mixed, default: {} },
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    schedule: { type: String, default: '' },
    errorMessage: { type: String, default: '' }
}, { timestamps: true });

const BackupRecord = mongoose.models.BackupRecord || mongoose.model('BackupRecord', backupRecordSchema);

function formatBytes(b) {
    if (!b) return '0 B';
    const k = 1024, s = ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${(b / Math.pow(k, i)).toFixed(2)} ${s[i]}`;
}

function log(msg) {
    const ts = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    console.log(`[${ts}] ${msg}`);
}

/** Parse onceAt string (local VN "YYYY-MM-DDTHH:mm" hoặc ISO) thành timestamp UTC */
function parseOnceAt(onceAt) {
    if (!onceAt) return null;
    try {
        if (onceAt.endsWith('Z') || onceAt.includes('+')) return new Date(onceAt).getTime();
        // "2026-06-06T00:43" → parse as +07:00
        return new Date(`${onceAt}:00+07:00`).getTime();
    } catch { return null; }
}

async function performBackup(scheduleType) {
    log(`⏰ Bắt đầu backup (${scheduleType})...`);
    const timestamp = Date.now();
    const filename = `backup_${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, filename);
    const record = await BackupRecord.create({ type: 'auto', status: 'in_progress', filename, schedule: scheduleType });

    try {
        const db = mongoose.connection.db;
        const data = {
            _meta: { version: '2.0', createdAt: new Date().toISOString(), dbName: db.databaseName, backupType: 'auto', schedule: scheduleType, collections: BACKUP_COLLECTIONS },
            collections: {}
        };
        let totalDocs = 0;
        const breakdown = {};
        for (const col of BACKUP_COLLECTIONS) {
            try {
                const docs = await db.collection(col).find({}).toArray();
                data.collections[col] = docs;
                breakdown[col] = docs.length;
                totalDocs += docs.length;
            } catch { data.collections[col] = []; breakdown[col] = 0; }
        }
        const content = JSON.stringify(data, null, 2);
        const checksum = crypto.createHash('md5').update(content, 'utf8').digest('hex');
        fs.writeFileSync(filePath, content, 'utf8');
        const sizeBytes = fs.statSync(filePath).size;

        record.status = 'success';
        record.size = formatBytes(sizeBytes);
        record.sizeBytes = sizeBytes;
        record.checksum = checksum;
        record.stats = { totalCollections: BACKUP_COLLECTIONS.length, totalDocuments: totalDocs, collectionBreakdown: breakdown };
        await record.save();
        log(`✅ Backup OK: ${filename} (${formatBytes(sizeBytes)}, ${totalDocs} docs)`);
    } catch (err) {
        record.status = 'failed';
        record.errorMessage = err.message;
        await record.save();
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        log(`❌ Backup thất bại: ${err.message}`);
    }
}

let lastFiredKey = '';

async function checkAndBackup() {
    try {
        const raw = await mongoose.connection.db.collection('securitypolicies').findOne({});
        if (!raw) return;

        const schedule = raw.autoBackupSchedule || 'none';
        const cfg = raw.autoBackupConfig || {};
        const now = Date.now();
        const nowVN = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));

        // ── Mode "once": kiểm tra onceAt kể cả khi schedule đã reset về 'none'
        if (cfg.onceAt) {
            const targetTs = parseOnceAt(cfg.onceAt);
            if (targetTs) {
                const diffMs = now - targetTs;
                // Trong khoảng [-30s, +10min] → chạy
                if (diffMs >= -30000 && diffMs < 10 * 60 * 1000) {
                    const key = `once-${targetTs}`;
                    if (key !== lastFiredKey) {
                        lastFiredKey = key;
                        log(`🎯 Once backup! (${diffMs > 0 ? `lỡ ${Math.round(diffMs/1000)}s` : `đúng giờ`})`);
                        await performBackup('once');
                        // Xóa onceAt sau khi đã chạy
                        await mongoose.connection.db.collection('securitypolicies').updateMany(
                            {}, { $set: { autoBackupSchedule: 'none', 'autoBackupConfig.onceAt': '' } }
                        );
                    }
                    return;
                }
            }
        }

        if (schedule === 'none' || !schedule) return;

        const h = cfg.hour ?? 2;
        const m = cfg.minute ?? 0;
        const curH = nowVN.getHours();
        const curM = nowVN.getMinutes();

        let shouldFire = false;
        if (schedule === 'daily') {
            shouldFire = curH === h && curM === m;
        } else if (schedule === 'weekly') {
            shouldFire = nowVN.getDay() === (cfg.weekDay ?? 0) && curH === h && curM === m;
        } else if (schedule === 'monthly') {
            shouldFire = nowVN.getDate() === (cfg.monthDay ?? 1) && curH === h && curM === m;
        }

        if (shouldFire) {
            const key = `${schedule}-${nowVN.getFullYear()}-${nowVN.getMonth()}-${nowVN.getDate()}-${curH}-${curM}`;
            if (key !== lastFiredKey) {
                lastFiredKey = key;
                await performBackup(schedule);
            }
        }
    } catch (err) {
        log(`⚠️ Error: ${err.message}`);
    }
}

// ── Main ─────────────────────────────────────────────────────────────────────
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

log('🚀 Backup Daemon khởi động...');
log(`📁 ${BACKUP_DIR}`);
log(`🔄 Kiểm tra mỗi ${CHECK_INTERVAL_MS / 1000}s`);

await mongoose.connect(MONGO_URI);
log('✅ Connected to MongoDB');
await checkAndBackup(); // kiểm tra ngay lập tức
setInterval(checkAndBackup, CHECK_INTERVAL_MS);
log('✅ Daemon đang chạy.\n');
