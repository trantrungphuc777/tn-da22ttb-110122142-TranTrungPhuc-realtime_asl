/**
 * /api/messages — Chat routes (học viên + giảng viên đều dùng)
 * Auth: authMiddleware (mọi role đều truy cập được)
 */
import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/authMiddleware.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

const router = express.Router();
router.use(authMiddleware);

// ── Cấu hình multer upload (lưu file vào uploads/chat/) ──
const uploadDir = path.resolve('uploads/chat');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (_req, file, cb) => {
        // Cho phép ảnh, video, pdf, doc, excel, txt, zip
        const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|pdf|doc|docx|xls|xlsx|txt|zip|rar/;
        const ext = path.extname(file.originalname).toLowerCase().slice(1);
        if (allowed.test(ext)) return cb(null, true);
        cb(new Error('Định dạng file không được hỗ trợ!'));
    }
});

// ── Helper: format conversation cho client ──
const formatConversation = (conv, myId) => {
    const other = conv.participants?.find(p => p._id?.toString() !== myId?.toString());
    const unread = conv.unreadCount?.get?.(myId?.toString()) || 0;
    return {
        _id: conv._id,
        other: other || {},
        lastMessage: conv.lastMessage,
        unreadCount: unread,
        isPinned: conv.pinnedBy?.some(id => id?.toString() === myId?.toString()) || false,
        updatedAt: conv.updatedAt
    };
};

// ══════════════════════════════════════════════════════════════
// GET /api/messages/conversations — Danh sách hội thoại của tôi
// ══════════════════════════════════════════════════════════════
router.get('/conversations', async (req, res) => {
    if (mongoose.connection.readyState !== 1)
        return res.status(200).json({ conversations: [] });
    try {
        const myId = req.user.id;
        const myObjId = new mongoose.Types.ObjectId(myId);
        const conversations = await Conversation.find({
            participants: myObjId,
            deletedBy: { $ne: myObjId }
        })
            .populate('participants', 'fullName avatar role username instructorId')
            .sort({ updatedAt: -1 })
            .lean({ virtuals: false });

        // Lấy thông tin giảng viên của user (nếu là học viên)
        let myInstructorId = null;
        if (req.user.role === 'user') {
            const me = await User.findById(myId).select('instructorId').lean();
            myInstructorId = me?.instructorId?.toString();
        }

        const formatted = conversations.map(conv => {
            const other = conv.participants?.find(p => p._id?.toString() !== myId?.toString());
            const unread = conv.unreadCount instanceof Map
                ? conv.unreadCount.get(myId?.toString()) || 0
                : (conv.unreadCount?.[myId?.toString()] || 0);
            const isPinned = conv.pinnedBy?.some(id => id?.toString() === myId?.toString()) || false;
            // Ghim giảng viên chủ nhiệm của học viên
            const isMyInstructor = myInstructorId && other?._id?.toString() === myInstructorId;

            return {
                _id: conv._id,
                other: other || {},
                lastMessage: conv.lastMessage,
                unreadCount: unread,
                isPinned: isPinned || isMyInstructor,
                isMyInstructor: !!isMyInstructor,
                updatedAt: conv.updatedAt
            };
        });

        // Sort: ghim lên trên, rồi theo updatedAt
        formatted.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        res.json({ conversations: formatted });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// ══════════════════════════════════════════════════════════════
// GET /api/messages/unread-count — Tổng tin chưa đọc
// ══════════════════════════════════════════════════════════════
router.get('/unread-count', async (req, res) => {
    if (mongoose.connection.readyState !== 1)
        return res.status(200).json({ count: 0 });
    try {
        const myId = req.user.id;
        const conversations = await Conversation.find({ participants: myId }).lean();
        let total = 0;
        conversations.forEach(conv => {
            const unread = conv.unreadCount instanceof Map
                ? conv.unreadCount.get(myId.toString()) || 0
                : (conv.unreadCount?.[myId.toString()] || 0);
            total += unread;
        });
        res.json({ count: total });
    } catch (err) {
        res.status(500).json({ count: 0 });
    }
});

// ══════════════════════════════════════════════════════════════
// GET /api/messages/users/search?q= — Tìm user để chat
// ══════════════════════════════════════════════════════════════
router.get('/users/search', async (req, res) => {
    if (mongoose.connection.readyState !== 1)
        return res.status(200).json({ users: [] });
    try {
        const { q = '' } = req.query;
        const myId = req.user.id;
        if (!q.trim()) return res.json({ users: [] });

        const regex = new RegExp(q.trim(), 'i');
        const users = await User.find({
            _id: { $ne: myId },
            isActive: { $ne: false },   // bao gồm cả user chưa set field isActive
            $or: [
                { fullName: regex },
                { username: regex },
                { email: regex }
            ]
        })
            .select('fullName username avatar role')
            .limit(20)
            .lean();

        res.json({ users });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// ══════════════════════════════════════════════════════════════
// POST /api/messages/conversations/open/:userId — Xem thông tin user để chat
// KHÔNG tạo conversation ngay — chỉ tạo khi gửi tin nhắn đầu tiên
// ══════════════════════════════════════════════════════════════
router.post('/conversations/open/:userId', async (req, res) => {
    if (mongoose.connection.readyState !== 1)
        return res.status(503).json({ message: 'Database offline!' });
    try {
        const myId = req.user.id;
        const otherId = req.params.userId;

        if (myId === otherId)
            return res.status(400).json({ message: 'Không thể nhắn tin với chính mình!' });

        const other = await User.findById(otherId).select('fullName avatar role username').lean();
        if (!other) return res.status(404).json({ message: 'Người dùng không tồn tại!' });

        // Kiểm tra đã có conversation chưa
        const existing = await Conversation.findOne({
            participants: { $all: [myId, otherId], $size: 2 },
            deletedBy: { $ne: myId }
        }).lean();

        const myInstructor = req.user.role === 'user'
            ? (await User.findById(myId).select('instructorId').lean())?.instructorId?.toString()
            : null;

        const formatted = {
            _id: existing?._id || null,   // null = chưa có conversation
            other,
            lastMessage: existing?.lastMessage || null,
            unreadCount: 0,
            isPinned: !!(myInstructor && myInstructor === otherId?.toString()),
            isMyInstructor: !!(myInstructor && myInstructor === otherId?.toString()),
            updatedAt: existing?.updatedAt || new Date(),
            isNew: !existing   // flag: conversation chưa tồn tại
        };

        res.json({ conversation: formatted });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// ══════════════════════════════════════════════════════════════
// DELETE /api/messages/conversations/:id — Xóa (ẩn) conversation phía mình
// ══════════════════════════════════════════════════════════════
router.delete('/conversations/:id', async (req, res) => {
    if (mongoose.connection.readyState !== 1)
        return res.status(503).json({ message: 'Database offline!' });
    try {
        const myId = req.user.id;
        const myObjId = new mongoose.Types.ObjectId(myId);
        const conv = await Conversation.findOne({
            _id: req.params.id,
            participants: myObjId
        });
        if (!conv) return res.json({ ok: true });

        if (!conv.deletedBy.some(id => id.toString() === myId.toString())) {
            conv.deletedBy.push(myObjId);
            await conv.save();
        }
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// ══════════════════════════════════════════════════════════════
// GET /api/messages/conversations/:id — Lấy tin nhắn trong conversation
// ══════════════════════════════════════════════════════════════
router.get('/conversations/:id', async (req, res) => {
    if (mongoose.connection.readyState !== 1)
        return res.status(200).json({ messages: [], conversation: null });
    try {
        const myId = req.user.id;
        const { page = 1, limit = 50 } = req.query;

        const conv = await Conversation.findOne({
            _id: req.params.id,
            participants: myId
        }).populate('participants', 'fullName avatar role username');

        if (!conv) return res.status(404).json({ message: 'Không tìm thấy hội thoại!' });

        const total = await Message.countDocuments({ conversationId: conv._id });
        const messages = await Message.find({ conversationId: conv._id })
            .populate('senderId', 'fullName avatar role username')
            .populate('replyTo', 'content senderId type fileUrl fileName')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        // Trả về thứ tự cũ → mới
        messages.reverse();

        // Đánh dấu đã đọc
        const unreadMsgs = messages.filter(m =>
            m.senderId?._id?.toString() !== myId &&
            !m.readBy?.some(r => r.userId?.toString() === myId)
        );
        if (unreadMsgs.length > 0) {
            await Message.updateMany(
                {
                    _id: { $in: unreadMsgs.map(m => m._id) },
                    'readBy.userId': { $ne: myId }
                },
                { $push: { readBy: { userId: myId, readAt: new Date() } } }
            );
            // Reset unread count
            await Conversation.updateOne(
                { _id: conv._id },
                { $set: { [`unreadCount.${myId}`]: 0 } }
            );
        }

        res.json({
            messages,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// ══════════════════════════════════════════════════════════════
// POST /api/messages/conversations/:id/send — Gửi tin nhắn text/emoji
// :id có thể là conversationId thật HOẶC "new_<userId>" (lazy create)
// ══════════════════════════════════════════════════════════════
router.post('/conversations/:id/send', async (req, res) => {
    if (mongoose.connection.readyState !== 1)
        return res.status(503).json({ message: 'Database offline!' });
    try {
        const myId = req.user.id;
        const { content, type = 'text', replyTo } = req.body;

        if (!content?.trim())
            return res.status(400).json({ message: 'Nội dung tin nhắn không được để trống!' });

        let conv;
        // Lazy create: nếu id bắt đầu bằng "new_" thì tạo conversation mới
        if (req.params.id.startsWith('new_')) {
            const otherId = req.params.id.replace('new_', '');
            const result = await Conversation.findOrCreate(myId, otherId);
            conv = result.conversation;
            // Xóa khỏi deletedBy nếu đã từng bị ẩn
            if (conv.deletedBy?.some(id => id.toString() === myId)) {
                conv.deletedBy = conv.deletedBy.filter(id => id.toString() !== myId);
                await conv.save();
            }
        } else {
            conv = await Conversation.findOne({ _id: req.params.id, participants: myId });
            if (!conv) return res.status(404).json({ message: 'Không tìm thấy hội thoại!' });
            // Nếu đã ẩn thì hiện lại
            if (conv.deletedBy?.some(id => id.toString() === myId)) {
                conv.deletedBy = conv.deletedBy.filter(id => id.toString() !== myId);
                await conv.save();
            }
        }

        const otherId = conv.participants.find(p => p.toString() !== myId);

        const msg = await Message.create({
            conversationId: conv._id,
            senderId: myId,
            type: type || 'text',
            content: content.trim(),
            replyTo: replyTo || null,
            readBy: [{ userId: myId, readAt: new Date() }]
        });

        // Cập nhật lastMessage và unreadCount cho người nhận
        const currentUnread = conv.unreadCount?.get?.(otherId.toString()) || 0;
        await Conversation.updateOne(
            { _id: conv._id },
            {
                lastMessage: {
                    content: content.trim(),
                    senderId: myId,
                    type: type || 'text',
                    sentAt: new Date()
                },
                [`unreadCount.${otherId}`]: currentUnread + 1,
                updatedAt: new Date()
            }
        );

        await msg.populate('senderId', 'fullName avatar role username');
        if (replyTo) await msg.populate('replyTo', 'content senderId type fileUrl fileName');

        res.status(201).json({ message: msg, conversationId: conv._id });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// ══════════════════════════════════════════════════════════════
// POST /api/messages/conversations/:id/upload — Upload file/ảnh
// ══════════════════════════════════════════════════════════════
router.post('/conversations/:id/upload', upload.single('file'), async (req, res) => {
    if (mongoose.connection.readyState !== 1)
        return res.status(503).json({ message: 'Database offline!' });
    try {
        const myId = req.user.id;
        if (!req.file) return res.status(400).json({ message: 'Không có file được tải lên!' });

        const conv = await Conversation.findOne({ _id: req.params.id, participants: myId });
        if (!conv) return res.status(404).json({ message: 'Không tìm thấy hội thoại!' });

        const otherId = conv.participants.find(p => p.toString() !== myId);
        const isImage = /jpeg|jpg|png|gif|webp/.test(req.file.mimetype);
        const fileUrl = `/uploads/chat/${req.file.filename}`;

        const { replyTo } = req.body;
        const msg = await Message.create({
            conversationId: conv._id,
            senderId: myId,
            type: isImage ? 'image' : 'file',
            content: isImage ? '' : req.file.originalname,
            fileUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileMimeType: req.file.mimetype,
            replyTo: replyTo || null,
            readBy: [{ userId: myId, readAt: new Date() }]
        });

        const currentUnread = conv.unreadCount?.get?.(otherId.toString()) || 0;
        await Conversation.updateOne(
            { _id: conv._id },
            {
                lastMessage: {
                    content: isImage ? '📷 Hình ảnh' : `📎 ${req.file.originalname}`,
                    senderId: myId,
                    type: isImage ? 'image' : 'file',
                    sentAt: new Date()
                },
                [`unreadCount.${otherId}`]: currentUnread + 1,
                updatedAt: new Date()
            }
        );

        await msg.populate('senderId', 'fullName avatar role username');
        res.status(201).json({ message: msg });
    } catch (err) {
        if (req.file) fs.unlink(req.file.path, () => {});
        res.status(500).json({ message: err.message || 'Lỗi upload file!' });
    }
});

// ══════════════════════════════════════════════════════════════
// PATCH /api/messages/conversations/:id/read — Đánh dấu đã đọc
// ══════════════════════════════════════════════════════════════
router.patch('/conversations/:id/read', async (req, res) => {
    if (mongoose.connection.readyState !== 1)
        return res.status(200).json({ ok: true });
    try {
        const myId = req.user.id;
        await Conversation.updateOne(
            { _id: req.params.id, participants: myId },
            { $set: { [`unreadCount.${myId}`]: 0 } }
        );
        await Message.updateMany(
            {
                conversationId: req.params.id,
                senderId: { $ne: myId },
                'readBy.userId': { $ne: myId }
            },
            { $push: { readBy: { userId: myId, readAt: new Date() } } }
        );
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// ══════════════════════════════════════════════════════════════
// DELETE /api/messages/conversations/:id/messages/:msgId — Xóa tin nhắn (chỉ của mình)
// ══════════════════════════════════════════════════════════════
router.delete('/conversations/:id/messages/:msgId', async (req, res) => {
    if (mongoose.connection.readyState !== 1)
        return res.status(503).json({ message: 'Database offline!' });
    try {
        const myId = req.user.id;
        const msg = await Message.findOne({
            _id: req.params.msgId,
            conversationId: req.params.id,
            senderId: myId
        });
        if (!msg) return res.status(404).json({ message: 'Không tìm thấy tin nhắn!' });

        msg.deletedBySender = true;
        msg.content = 'Tin nhắn đã được thu hồi';
        msg.fileUrl = '';
        msg.type = 'text';
        await msg.save();

        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// ══════════════════════════════════════════════════════════════
// PATCH /api/messages/conversations/:id/pin — Ghim/bỏ ghim conversation
// ══════════════════════════════════════════════════════════════
router.patch('/conversations/:id/pin', async (req, res) => {
    if (mongoose.connection.readyState !== 1)
        return res.status(503).json({ message: 'Database offline!' });
    try {
        const myId = req.user.id;
        const conv = await Conversation.findOne({ _id: req.params.id, participants: myId });
        if (!conv) return res.status(404).json({ message: 'Không tìm thấy hội thoại!' });

        const isPinned = conv.pinnedBy?.some(id => id?.toString() === myId);
        if (isPinned) {
            conv.pinnedBy = conv.pinnedBy.filter(id => id?.toString() !== myId);
        } else {
            conv.pinnedBy.push(myId);
        }
        await conv.save();
        res.json({ isPinned: !isPinned });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// ══════════════════════════════════════════════════════════════
// GET /api/messages/instructor-of-student — Lấy giảng viên chủ nhiệm (học viên dùng khi init)
// ══════════════════════════════════════════════════════════════
router.get('/instructor-of-student', async (req, res) => {
    if (mongoose.connection.readyState !== 1)
        return res.status(200).json({ instructor: null });
    try {
        const me = await User.findById(req.user.id).select('instructorId').lean();
        if (!me?.instructorId) return res.json({ instructor: null });

        const instructor = await User.findById(me.instructorId)
            .select('fullName avatar role username')
            .lean();
        res.json({ instructor });
    } catch (err) {
        res.status(500).json({ instructor: null });
    }
});

export default router;
