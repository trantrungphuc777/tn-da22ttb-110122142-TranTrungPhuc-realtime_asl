import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Họ tên là bắt buộc'],
        trim: true,
        minlength: [2, 'Họ tên phải có ít nhất 2 ký tự'],
        maxlength: [100, 'Họ tên không được quá 100 ký tự']
    },
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: [3, 'Tài khoản phải có ít nhất 3 ký tự'],
        maxlength: [30, 'Tài khoản không được quá 30 ký tự']
    },
    password: {
        type: String,
        required: true,
        minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
    },
    avatar: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        default: 'user'
    },
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    classIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    }],
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    assignedAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    studentStats: {
        totalPracticeCount: { type: Number, default: 0 },
        totalAssignmentsCompleted: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        averageAccuracy: { type: Number, default: 0 },
        totalPracticeTime: { type: Number, default: 0 },
        lastPracticeDate: { type: Date, default: null },
        currentStreak: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 }
    },
    commonErrors: [{
        type: String,
        timestamp: { type: Date, default: Date.now }
    }],
    practicedContent: {
        letters: [{ type: String }],
        words: [{ type: String }],
        sentences: [{ type: String }]
    },
    // CF12.6 — Quyền tùy chỉnh (override quyền mặc định của vai trò)
    customPermissions: {
        type: [String],
        default: []
    },
    // Thông tin người giám hộ
    guardian: {
        fullName: { type: String, trim: true, default: '' },
        relationship: { type: String, trim: true, default: '' }, // cha/mẹ/anh/chị/ông/bà/khác
        phone: { type: String, trim: true, default: '' },
        email: { type: String, trim: true, lowercase: true, default: '' },
        address: { type: String, trim: true, default: '' }
    }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', UserSchema);
