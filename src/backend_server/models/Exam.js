import mongoose from 'mongoose';

const ExamSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Tiêu đề bài kiểm tra là bắt buộc'],
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
    // Loại bài kiểm tra: letter | word | sentence | comprehensive
    type: {
        type: String,
        enum: ['letter', 'word', 'sentence', 'comprehensive'],
        default: 'letter'
    },
    // Hình thức: recognition | realtime | comprehensive
    practiceType: {
        type: String,
        enum: ['recognition', 'realtime', 'comprehensive'],
        default: 'recognition'
    },
    // Chế độ câu hỏi: random | topic | mixed_topic
    mode: {
        type: String,
        enum: ['random', 'topic', 'mixed_topic'],
        default: 'random'
    },
    // Chủ đề cụ thể khi mode === 'topic' hoặc 'mixed_topic'
    topic: {
        type: String,
        default: null
    },
    // Cấu hình số câu từng dạng — chỉ dùng khi practiceType = 'comprehensive'
    examConfig: {
        letterCount:    { type: Number, default: 4 },
        shortWordCount: { type: Number, default: 3 },
        longWordCount:  { type: Number, default: 3 },
        complexCount:   { type: Number, default: 3 },
        quizCount:      { type: Number, default: 4 },
        chainCount:     { type: Number, default: 3 }
    },
    settings: {
        questionCount: { type: Number, default: 10 },   // dùng khi không phải comprehensive
        maxAttempts:   { type: Number, default: 1, min: 1, max: 5 },
        passingScore:  { type: Number, default: 70 },   // điểm đạt yêu cầu (10-1000)
        duration:      { type: Number, default: 30 },   // phút
        timeLimit:     { type: Number, default: null }  // giây/câu (legacy)
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
    endDate: {
        type: Date,
        default: null
    }
}, { timestamps: true });

ExamSchema.index({ instructorId: 1, status: 1 });
ExamSchema.index({ endDate: 1 });

export default mongoose.model('Exam', ExamSchema);
