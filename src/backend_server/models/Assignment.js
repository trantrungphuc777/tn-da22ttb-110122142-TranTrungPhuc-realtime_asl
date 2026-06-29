import mongoose from 'mongoose';

const AssignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Tiêu đề bài tập là bắt buộc'],
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
    classIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    }],
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    type: {
        type: String,
        enum: ['letter', 'word', 'sentence'],
        default: 'letter'
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    content: {
        letters: [{ type: String }],
        words: [{ type: String }],
        sentences: [{ type: String }]
    },
    practiceType: {
        type: String,
        enum: ['recognition', 'realtime'],
        default: 'recognition'
    },
    // question selection mode for realtime assignments: 'random' or 'topic'
    mode: {
        type: String,
        enum: ['random', 'topic'],
        default: 'random'
    },
    // topic key when mode === 'topic'
    topic: {
        type: String,
        default: null
    },
    settings: {
        timeLimit: { type: Number, default: null },
        questionCount: { type: Number, default: 10 },
        maxAttempts: { type: Number, default: null }, // null = unlimited
        passingScore: { type: Number, default: 60 }
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'closed'],
        default: 'draft'
    },
    startDate: {
        type: Date,
        default: null
    },
    dueDate: {
        type: Date,
        default: null
    },
    // Note: priority field removed per new instructor assignment requirements
}, { timestamps: true });

AssignmentSchema.index({ instructorId: 1, status: 1 });
AssignmentSchema.index({ dueDate: 1 });

export default mongoose.model('Assignment', AssignmentSchema);
