import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
    // Luôn có đúng 2 participants (direct message)
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        content: { type: String, default: '' },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        type: { type: String, enum: ['text', 'image', 'file', 'emoji'], default: 'text' },
        sentAt: { type: Date, default: null }
    },
    // unreadCount per user: Map userId → count
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    },
    // Danh sách userId đã xóa conversation (soft delete phía client)
    deletedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Ghim: { userId: Boolean }
    pinnedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

// Index để tìm conversation giữa 2 user nhanh
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

// Static: tìm hoặc tạo conversation giữa 2 user
ConversationSchema.statics.findOrCreate = async function(userA, userB) {
    const existing = await this.findOne({
        participants: { $all: [userA, userB], $size: 2 }
    }).populate('participants', 'fullName avatar role username');
    if (existing) return { conversation: existing, created: false };

    const conv = new this({ participants: [userA, userB] });
    await conv.save();
    await conv.populate('participants', 'fullName avatar role username');
    return { conversation: conv, created: true };
};

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
export default Conversation;
