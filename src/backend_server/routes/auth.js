import express from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import User from '../models/User.js';
import UserSession, { parseDevice } from '../models/UserSession.js';
import { logAudit } from './admin/logs.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'signlanguage_secret_key_123';

// Validation helpers
const validateEmail = (email) => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    return password && password.length >= 6;
};

// Đăng ký
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, username, password, confirmPassword, guardian } = req.body;

        // Kiểm tra dữ liệu bắt buộc
        if (!fullName || !email || !username || !password || !confirmPassword) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin!' });
        }

        // Kiểm tra họ tên
        if (fullName.trim().length < 2) {
            return res.status(400).json({ message: 'Họ tên phải có ít nhất 2 ký tự!' });
        }

        // Kiểm tra email hợp lệ
        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Email không hợp lệ!' });
        }

        // Kiểm tra tài khoản
        if (username.length < 3) {
            return res.status(400).json({ message: 'Tài khoản phải có ít nhất 3 ký tự!' });
        }

        // Kiểm tra mật khẩu
        if (!validatePassword(password)) {
            return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự!' });
        }

        // Kiểm tra xác nhận mật khẩu
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp!' });
        }

        // Validate thông tin người giám hộ nếu có
        if (guardian) {
            if (guardian.phone && !/^[0-9]{9,11}$/.test(guardian.phone.replace(/\s/g, ''))) {
                return res.status(400).json({ message: 'Số điện thoại người giám hộ không hợp lệ!' });
            }
            if (guardian.email && !validateEmail(guardian.email)) {
                return res.status(400).json({ message: 'Email người giám hộ không hợp lệ!' });
            }
        }

        // Kiểm tra email đã tồn tại
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email đã được sử dụng!' });
        }

        // Kiểm tra username đã tồn tại
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Tài khoản đã tồn tại!' });
        }

        // Tạo tài khoản mới
        const newUser = new User({ 
            fullName: fullName.trim(), 
            email: email.toLowerCase().trim(), 
            username: username.trim(), 
            password,
            ...(guardian && {
                guardian: {
                    fullName: guardian.fullName?.trim() || '',
                    relationship: guardian.relationship?.trim() || '',
                    phone: guardian.phone?.trim() || '',
                    email: guardian.email?.toLowerCase().trim() || '',
                    address: guardian.address?.trim() || ''
                }
            })
        });
        await newUser.save();

        // Ghi audit log đăng ký
        await logAudit({ userId: newUser._id, userRole: newUser.role, action: 'register', detail: `Tài khoản mới: ${email}`, ip: req.ip });

        res.status(201).json({ message: 'Đăng ký thành công! Vui lòng đăng nhập.' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email hoặc tài khoản đã tồn tại!' });
        }
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Kiểm tra dữ liệu bắt buộc
        if (!username || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập tài khoản và mật khẩu!' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            // Ghi log đăng nhập thất bại (tài khoản không tồn tại)
            await logAudit({ userId: null, userRole: '', action: 'login_failed', detail: `Tài khoản không tồn tại: ${username}`, ip: req.ip, userAgent: req.headers['user-agent'] || '' });
            return res.status(400).json({ message: 'Tài khoản không tồn tại!' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            // Ghi log đăng nhập thất bại (sai mật khẩu)
            await logAudit({ userId: user._id, userRole: user.role, action: 'login_failed', detail: `Sai mật khẩu — ${user.email}`, ip: req.ip, userAgent: req.headers['user-agent'] || '' });
            return res.status(400).json({ message: 'Sai mật khẩu!' });
        }

        const jti = randomUUID();
        const token = jwt.sign({ id: user._id, role: user.role, jti }, JWT_SECRET, { expiresIn: '1d' });

        // Ghi audit log đăng nhập
        console.log(`[AUTH] Login attempt - user: ${user.username}, role: ${user.role}, id: ${user._id}`);
        try {
            await logAudit({ userId: user._id, userRole: user.role, action: 'login', detail: `Đăng nhập thành công — ${user.email}`, ip: req.ip, userAgent: req.headers['user-agent'] || '' });
            console.log(`[AUTH] logAudit OK for ${user.username}`);
        } catch (auditErr) {
            console.error(`[AUTH] logAudit FAILED for ${user.username}:`, auditErr.message);
        }

        // Lưu session thật vào DB
        try {
            let ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'N/A';
            // Chuẩn hóa IPv6 loopback ::1 → 127.0.0.1
            if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
            // Bỏ prefix ::ffff: của IPv4-mapped IPv6
            if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
            const userAgent = req.headers['user-agent'] || '';
            const expiresAt = new Date(Date.now() + 86400000); // 1 ngày
            await UserSession.create({
                userId: user._id,
                token,
                jti,
                ip,
                device: parseDevice(userAgent),
                userAgent,
                isActive: true,
                expiresAt
            });
        } catch (sessionErr) {
            // Không chặn login nếu lưu session thất bại
            console.error('[AUTH] Save session failed:', sessionErr.message);
        }

        res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 86400000 });
        res.status(200).json({ 
            message: 'Đăng nhập thành công!', 
            token, 
            user: { 
                username: user.username, 
                fullName: user.fullName,
                email: user.email,
                role: user.role 
            } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Đăng xuất — thu hồi session
router.post('/logout', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                if (decoded.jti) {
                    await UserSession.updateOne(
                        { jti: decoded.jti },
                        { isActive: false, revokedAt: new Date() }
                    );
                }
            } catch {
                // Token hết hạn hoặc không hợp lệ — vẫn trả về success
            }
        }
        res.clearCookie('token');
        res.status(200).json({ message: 'Đăng xuất thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Lấy thông tin user hiện tại
router.get('/me', async (req, res) => {    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Không có token!' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        }

        res.status(200).json({ user });
    } catch (error) {
        res.status(401).json({ message: 'Token không hợp lệ!' });
    }
});

// Middleware xác thực token
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Không có token!' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        console.log(`[authMiddleware] userId=${decoded.id}, role=${decoded.role}`);
        next();
    } catch (error) {
        console.error('[authMiddleware] error:', error.message);
        res.status(401).json({ message: 'Token không hợp lệ!' });
    }
};

// Cập nhật thông tin cá nhân
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { fullName, avatar } = req.body;
        
        const updateData = {};
        
        if (fullName) {
            if (fullName.trim().length < 2) {
                return res.status(400).json({ message: 'Họ tên phải có ít nhất 2 ký tự!' });
            }
            updateData.fullName = fullName.trim();
        }
        
        if (avatar !== undefined) {
            updateData.avatar = avatar;
        }
        
        const user = await User.findByIdAndUpdate(
            req.userId,
            updateData,
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        }

        // Ghi audit log cập nhật thông tin
        await logAudit({ userId: user._id, userRole: user.role, action: 'update_profile', detail: `Cập nhật thông tin cá nhân — ${user.email}`, ip: req.ip, userAgent: req.headers['user-agent'] || '' });

        res.status(200).json({ 
            message: 'Cập nhật thông tin thành công!',
            user 
        });
    } catch (error) {
        console.error('[PUT /profile] error:', error.message, error.stack?.split('\n')[1]);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Thay đổi mật khẩu
router.put('/profile/password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin!' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp!' });
        }
        
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        }
        
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng!' });
        }
        
        user.password = newPassword;
        await user.save();

        // Ghi audit log đổi mật khẩu
        await logAudit({ userId: user._id, userRole: user.role, action: 'change_password', detail: `Đổi mật khẩu thành công — ${user.email}`, ip: req.ip, userAgent: req.headers['user-agent'] || '' });

        res.status(200).json({ message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Lấy thống kê học tập của student cho trang hồ sơ
router.get('/profile/stats', authMiddleware, async (req, res) => {
    try {
        const Submission = (await import('../models/Submission.js')).default;
        const studentId = req.userId;

        // Lấy tất cả submissions của student
        const submissions = await Submission.find({ studentId }).lean();

        // Tách assignment và exam submissions
        const assignmentSubs = submissions.filter(s => s.assignmentId);
        const examSubs = submissions.filter(s => s.examId);

        // Số lần luyện tập (tổng số lần submit assignment)
        const practiceCount = assignmentSubs.length;

        // Điểm quiz trung bình (từ tất cả submissions có score)
        const scoredSubs = submissions.filter(s => s.score !== null && s.score !== undefined);
        const quizScore = scoredSubs.length > 0
            ? Math.round(scoredSubs.reduce((sum, s) => sum + (s.score || 0), 0) / scoredSubs.length)
            : 0;

        // Tổng thời gian học (tính bằng giây → chuyển sang giờ)
        const totalSeconds = submissions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
        const totalHours = Math.floor(totalSeconds / 3600);
        const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
        const totalTime = totalHours > 0 ? `${totalHours}h${totalMinutes > 0 ? totalMinutes + 'm' : ''}` : `${totalMinutes}m`;

        // Streak: số ngày liên tiếp có submission (tính từ hôm nay về trước)
        const submissionDates = submissions
            .filter(s => s.submittedAt || s.updatedAt)
            .map(s => {
                const d = new Date(s.submittedAt || s.updatedAt);
                return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            });
        const uniqueDates = [...new Set(submissionDates)].sort().reverse();
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < uniqueDates.length; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const checkStr = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
            if (uniqueDates.includes(checkStr)) {
                streak++;
            } else {
                break;
            }
        }

        // Số bài tập đã nộp
        const assignmentsCompleted = assignmentSubs.filter(s =>
            ['completed', 'graded'].includes(s.status)
        ).length;

        // Số bài kiểm tra đã làm
        const examsTaken = examSubs.length;

        res.status(200).json({
            practiceCount,
            quizScore,
            totalTime: totalSeconds === 0 ? '0h' : totalTime,
            streak,
            assignmentsCompleted,
            examsTaken
        });
    } catch (error) {
        console.error('Profile stats error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
