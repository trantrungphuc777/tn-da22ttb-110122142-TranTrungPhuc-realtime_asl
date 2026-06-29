import mongoose from 'mongoose';

const ticketMessageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderRole: { type: String },
    message: { type: String, required: true },
    sentAt: { type: Date, default: Date.now }
});

const supportTicketSchema = new mongoose.Schema({
    ticketCode: { type: String, unique: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    errorType: { type: String, enum: ['login', 'camera', 'exam', 'recognition', 'other'], default: 'other' },
    imageUrl: { type: String, default: '' },
    status: { type: String, enum: ['new', 'processing', 'completed', 'closed'], default: 'new' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    messages: [ticketMessageSchema],
    closedAt: { type: Date, default: null },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

// Tự động tạo mã ticket
supportTicketSchema.pre('save', async function (next) {
    if (!this.ticketCode) {
        const count = await mongoose.model('SupportTicket').countDocuments({});
        this.ticketCode = `TKT-${Date.now()}-${String(count + 1).padStart(3, '0')}`;
    }
    next();
});

const SupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);

export default SupportTicket;
