import express from 'express';
import mongoose from 'mongoose';
import { authMiddleware, requireAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(requireAdmin);

// CF10 — Nhật ký hệ thống

// Schema Audit Log (Tab 1)
const auditLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userRole: { type: String, default: '' },
    action: { type: String, required: true },
    detail: { type: String, default: '' },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' }
}, { timestamps: true });

// Schema System Events (Tab 2)
const systemEventSchema = new mongoose.Schema({
    eventCode: { type: String, required: true },
    eventType: { type: String, enum: ['system', 'database', 'cnn', 'server', 'api'], default: 'system' },
    level: { type: String, enum: ['INFO', 'WARNING', 'ERROR'], default: 'INFO' },
    message: { type: String, required: true },
    detail: { type: String, default: '' }
}, { timestamps: true });

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export const SystemEvent = mongoose.models.SystemEvent || mongoose.model('SystemEvent', systemEventSchema);

// CF10 Tab 1 — Nhật ký người dùng (Audit Log)
router.get('/audit', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ logs: [], _warning: 'Database offline' });
    }
    try {
        const { page = 1, limit = 50, role = '', action = '' } = req.query;
        const query = {};
        if (role) query.userRole = role;
        if (action) query.action = { $regex: action, $options: 'i' };

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .populate('userId', 'fullName email')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            AuditLog.countDocuments(query)
        ]);

        res.status(200).json({ logs, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// CF10 Tab 2 — Nhật ký hệ thống (System Events)
router.get('/system', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({ events: [], _warning: 'Database offline' });
    }
    try {
        const { page = 1, limit = 50, level = '', eventType = '' } = req.query;
        const query = {};
        if (level) query.level = level;
        if (eventType) query.eventType = eventType;

        const [events, total] = await Promise.all([
            SystemEvent.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            SystemEvent.countDocuments(query)
        ]);

        res.status(200).json({ events, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Helper: ghi system event (dùng nội bộ)
export const logSystemEvent = async ({ eventCode, eventType, level, message, detail = '' }) => {
    try {
        if (mongoose.connection.readyState !== 1) return;
        await SystemEvent.create({ eventCode, eventType, level, message, detail });
    } catch (e) {
        console.error('logSystemEvent error:', e.message);
    }
};

// Helper: ghi audit log (dùng nội bộ)
export const logAudit = async ({ userId, userRole, action, detail = '', ip = '', userAgent = '' }) => {
    console.log(`[logAudit] called: action=${action}, userId=${userId}, role=${userRole}, dbState=${mongoose.connection.readyState}`);
    // Retry tối đa 3 lần nếu DB chưa sẵn sàng
    for (let attempt = 1; attempt <= 3; attempt++) {
        if (mongoose.connection.readyState === 1) break;
        if (attempt === 3) {
            console.warn(`[logAudit] DB not ready after retries, skipping log: action=${action}`);
            return;
        }
        console.log(`[logAudit] DB not ready (state=${mongoose.connection.readyState}), retry ${attempt}/3...`);
        await new Promise(r => setTimeout(r, 500 * attempt));
    }
    try {
        const doc = await AuditLog.create({ userId, userRole, action, detail, ip, userAgent });
        console.log(`[logAudit] SUCCESS: _id=${doc._id}, action=${action}`);
    } catch (e) {
        console.error('[logAudit] error:', e.message, { action, userId, userRole });
    }
};

export default router;
