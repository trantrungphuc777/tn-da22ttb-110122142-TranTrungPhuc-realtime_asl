import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Loại tin nhắn
    type: {
        type: String,
        enum: ['text', 'image', 'file', 'emoji'],
        default: 'text'
    },
    content: {
        type: String,
        default: ''
    },
    // Dành cho file/image
    fileUrl: {
        type: String,
        default: ''
    },
    fileName: {
        type: String,
        default: ''
    },
    fileSize: {
        type: Number,
        default: 0
    },
    fileMimeType: {
        type: String,
        default: ''
    },
    // Ai đã đọc tin này
    readBy: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now }
    }],
    // Tin nhắn đã bị xóa (soft delete phía người gửi)
    deletedBySender: {
        type: Boolean,
        default: false
    },
    // Reply to (trích dẫn tin nhắn khác)
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    }
}, { timestamps: true });

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });

const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
export default Message;
