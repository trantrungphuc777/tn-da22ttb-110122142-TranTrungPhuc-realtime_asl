import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
    // Một trong hai phải có
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        default: null
    },
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        default: null
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed', 'graded', 'overdue', 'incomplete'],
        default: 'not_started'
    },
    score: {
        type: Number,
        default: null
    },
    maxScore: {
        type: Number,
        default: 100
    },
    accuracy: {
        type: Number,
        default: null
    },
    timeSpent: {
        type: Number,
        default: 0
    },
    attempts: {
        type: Number,
        default: 1
    },
    answers: [{
        questionIndex: Number,
        studentAnswer: mongoose.Schema.Types.Mixed,
        isCorrect: Boolean,
        timeSpent: Number
    }],
    errors: [{
        content: String,
        type: String,
        timestamp: { type: Date, default: Date.now }
    }],
    feedback: {
        type: String,
        default: ''
    },
    gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    gradedAt: {
        type: Date
    },
    submittedAt: {
        type: Date
    }
}, { timestamps: true });

SubmissionSchema.index({ studentId: 1, assignmentId: 1 });
SubmissionSchema.index({ studentId: 1, examId: 1 });
SubmissionSchema.index({ instructorId: 1, status: 1 });

export default mongoose.model('Submission', SubmissionSchema);
