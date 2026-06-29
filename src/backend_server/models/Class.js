import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên lớp học là bắt buộc'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studentIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    status: {
        type: String,
        enum: ['active', 'archived', 'deleted'],
        default: 'active'
    },
    classStats: {
        totalStudents: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        averageAccuracy: { type: Number, default: 0 },
        completionRate: { type: Number, default: 0 },
        activeStudents: { type: Number, default: 0 }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

ClassSchema.index({ instructorId: 1, status: 1 });
ClassSchema.index({ name: 'text' });

export default mongoose.model('Class', ClassSchema);
