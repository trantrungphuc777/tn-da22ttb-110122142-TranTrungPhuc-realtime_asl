import mongoose from 'mongoose';

/**
 * UserSession — lưu phiên đăng nhập thật của từng user
 * Được tạo khi login thành công, xóa/hủy khi logout hoặc force-logout
 */
const UserSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // JWT token (lưu để có thể blacklist khi force-logout)
    token: {
        type: String,
        required: true
    },
    // jti — JWT ID unique cho mỗi token (dùng để blacklist nhanh)
    jti: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    ip: {
        type: String,
        default: 'N/A'
    },
    // User-agent parsed thành tên thiết bị/trình duyệt dễ đọc
    device: {
        type: String,
        default: 'N/A'
    },
    userAgent: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    // Thời điểm token hết hạn (để tự dọn dẹp)
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    // Force logout bởi admin
    revokedAt: {
        type: Date,
        default: null
    },
    revokedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

// Tự xóa session đã hết hạn sau 7 ngày
UserSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 604800 });

// Helper parse user-agent thành tên thiết bị dễ đọc
export function parseDevice(userAgent = '') {
    if (!userAgent) return 'N/A';
    const ua = userAgent.toLowerCase();

    let os = 'Unknown OS';
    if (ua.includes('windows nt')) os = 'Windows';
    else if (ua.includes('macintosh') || ua.includes('mac os x')) os = 'macOS';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
    else if (ua.includes('linux')) os = 'Linux';

    let browser = 'Unknown Browser';
    if (ua.includes('edg/')) browser = 'Edge';
    else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera';
    else if (ua.includes('chrome/')) browser = 'Chrome';
    else if (ua.includes('safari/') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('firefox/')) browser = 'Firefox';

    return `${browser} / ${os}`;
}

export default mongoose.model('UserSession', UserSessionSchema);
