import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['system', 'announcement', 'reminder', 'warning', 'success'],
        default: 'system'
    },
    targetType: {
        type: String,
        enum: ['all', 'students', 'instructors', 'class', 'group', 'specific'],
        required: true
    },
    targetIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        default: null
    },
    groupFilter: {
        type: String,
        enum: ['new_students', 'low_performers', 'high_performers', 'inactive'],
        default: null
    },
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sentByName: {
        type: String,
        required: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    readCount: {
        type: Number,
        default: 0
    },
    totalRecipients: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    scheduledAt: {
        type: Date,
        default: null
    },
    expiresAt: {
        type: Date,
        default: null
    },
    isRead: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

NotificationSchema.index({ targetType: 1, createdAt: -1 });
NotificationSchema.index({ sentBy: 1, createdAt: -1 });
NotificationSchema.index({ sentAt: -1 });

export default mongoose.model('Notification', NotificationSchema);
