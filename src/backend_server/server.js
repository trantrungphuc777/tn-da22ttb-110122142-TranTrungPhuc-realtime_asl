import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';

// Admin routes
import adminDashboardRoutes from './routes/admin/dashboard.js';
import adminStudentsRoutes from './routes/admin/students.js';
import adminInstructorsRoutes from './routes/admin/instructors.js';
import adminClassesRoutes from './routes/admin/classes.js';
import adminStatisticsRoutes from './routes/admin/statistics.js';
import adminReportsRoutes from './routes/admin/reports.js';
import adminNotificationsRoutes from './routes/admin/notifications.js';
import adminLogsRoutes from './routes/admin/logs.js';
import { logSystemEvent } from './routes/admin/logs.js';
import adminSystemRoutes from './routes/admin/system.js';
import { initAutoBackupScheduler } from './routes/admin/system.js';
import adminRolesRoutes from './routes/admin/roles.js';

import adminSupportRoutes from './routes/admin/support.js';
import adminBadgesRoutes from './routes/admin/badges.js';
import adminContentRoutes from './routes/admin/content.js';

import instructorDashboardRoutes from './routes/instructor/instructorDashboard.js';
import instructorAssignmentRoutes from './routes/instructor/assignments.js';
import instructorExamRoutes from './routes/instructor/exams.js';
import instructorSubmissionRoutes from './routes/instructor/submissions.js';
import instructorReportRoutes from './routes/instructor/reports.js';
import instructorNotificationRoutes from './routes/instructor/notifications.js';
import instructorClassRoutes from './routes/instructor/classes.js';
import instructorBadgeRoutes from './routes/instructor/badges.js';
import instructorFeedbackRoutes from './routes/instructor/feedbackManagement.js';
import instructorSupportRoutes from './routes/instructor/support.js';
import studentRoutes from './routes/student/student.js';
import messagesRoutes from './routes/messages.js';
import Badge from './models/Badge.js';
import { setDbConnected } from './utils/dbState.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

// Admin routes
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/students', adminStudentsRoutes);
app.use('/api/admin/instructors', adminInstructorsRoutes);
app.use('/api/admin/classes', adminClassesRoutes);
app.use('/api/admin/statistics', adminStatisticsRoutes);
app.use('/api/admin/reports', adminReportsRoutes);
app.use('/api/admin/notifications', adminNotificationsRoutes);
app.use('/api/admin/logs', adminLogsRoutes);
app.use('/api/admin/system', adminSystemRoutes);
app.use('/api/admin/roles', adminRolesRoutes);
app.use('/api/admin/support', adminSupportRoutes);
app.use('/api/admin/badges', adminBadgesRoutes);
app.use('/api/admin/content', adminContentRoutes);

// Instructor routes
// Mount instructor dashboard router on the instructor base path so
// routes like `/api/instructor/students` and `/api/instructor` work
app.use('/api/instructor', instructorDashboardRoutes);
app.use('/api/instructor/assignments', instructorAssignmentRoutes);
app.use('/api/instructor/exams', instructorExamRoutes);
app.use('/api/instructor/submissions', instructorSubmissionRoutes);
app.use('/api/instructor/reports', instructorReportRoutes);
app.use('/api/instructor/notifications', instructorNotificationRoutes);
app.use('/api/instructor/classes', instructorClassRoutes);
app.use('/api/instructor/badges', instructorBadgeRoutes);
app.use('/api/instructor/feedback', instructorFeedbackRoutes);
app.use('/api/instructor/support', instructorSupportRoutes);

// Student routes
app.use('/api/student', studentRoutes);

// Messages routes (học viên + giảng viên)
app.use('/api/messages', messagesRoutes);

// Serve uploaded files (chat attachments)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.json({ message: "Node.js Backend Server is running!" });
});

app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({
        status: 'ok',
        service: 'backend_server',
        port: PORT,
        database: dbStatus,
        timestamp: new Date().toISOString(),
    });
});

// MongoDB connection - attempt to connect when a mongodb URI is provided
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/signlanguage';

const startServer = () => {
    const server = app.listen(PORT, () => {
        console.log(`✅ Node.js server running on port ${PORT}`);
    });
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} đang được dùng. Đang thử lại sau 3 giây...`);
            setTimeout(() => {
                server.close();
                app.listen(PORT, () => console.log(`✅ Node.js server running on port ${PORT}`));
            }, 3000);
        } else {
            throw err;
        }
    });
};

if (MONGO_URI && MONGO_URI.startsWith('mongodb')) {
    mongoose.connect(MONGO_URI)
        .then(async () => {
            console.log('✅ Connected to MongoDB');
            setDbConnected(true);
            // Seed default badges nếu chưa có
            try {
                await Badge.createDefaultBadges();
                console.log('✅ Default badges initialized');
            } catch (e) {
                console.error('⚠️ Badge seed error:', e.message);
            }
            // Ghi system event: server khởi động thành công
            await logSystemEvent({ eventCode: 'SYS-START', eventType: 'system', level: 'INFO', message: `Server khởi động thành công trên cổng ${PORT}`, detail: `MongoDB kết nối: ${MONGO_URI.replace(/\/\/.*@/, '//**@')}` });
            // Khởi động auto-backup scheduler (đọc lịch từ SecurityPolicy)
            await initAutoBackupScheduler();
            startServer();
        })
        .catch(async (error) => {
            console.error('⚠️ MongoDB connection failed:', error.message);
            setDbConnected(false);
            // Ghi system event: lỗi kết nối DB (ghi trực tiếp vì mongoose chưa sẵn)
            console.error('⚠️ System event: DB_CONNECT_ERROR —', error.message);
            startServer();
        });
} else {
    console.log('ℹ️ MongoDB not configured, starting server without database');
    setDbConnected(false);
    startServer();
}
