import mongoose from 'mongoose';

const InstructorFeedbackSchema = new mongoose.Schema({
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['encouragement', 'correction', 'suggestion'],
        default: 'suggestion'
    },
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
    isRead: {
        type: Boolean,
        default: false
    },
    relatedSubmission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Submission',
        default: null
    },
    relatedAssignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        default: null
    }
}, {
    timestamps: true
});

InstructorFeedbackSchema.index({ instructorId: 1, studentId: 1, createdAt: -1 });
InstructorFeedbackSchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.model('InstructorFeedback', InstructorFeedbackSchema);
