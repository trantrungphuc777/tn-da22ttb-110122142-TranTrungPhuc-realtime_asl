import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { Camera, LogOut, Type, User, Settings, Mail, Lock, UserCircle, Eye, EyeOff, Brain, MessageSquare } from 'lucide-react';
import ASLQuiz from './components/ASLQuiz';
import PracticeFeedback, { FeedbackToast, FeedbackProgressTracker } from './components/PracticeFeedback';
import { useLanguage } from './contexts/LanguageContext';
import { logout } from './utils/authUtils';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            localStorage.removeItem('user');
            navigate('/login', { replace: true });
            return;
        }

        // Verify token with backend
        axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
            const user = res.data.user;
            localStorage.setItem('user', JSON.stringify(user));

            if (requiredRole) {
                if (user.role !== requiredRole) {
                    toast.error(t('common.accessDenied'));
                    navigate('/login', { replace: true });
                    return;
                }
            }
            setIsLoading(false);
        }).catch(() => {
            // Token invalid or expired
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            toast.error(t('common.sessionExpired'));
            navigate('/login', { replace: true });
        });
    }, [navigate, requiredRole]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    return children;
};

// Public Route - redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                if (user.role === 'instructor') {
                    navigate('/instructor/dashboard', { replace: true });
                } else if (user.role === 'admin') {
                    navigate('/admin/dashboard', { replace: true });
                } else {
                    navigate('/dashboard', { replace: true });
                }
            } else {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [navigate]);

    return children;
};
import PracticeFeedbackPage from './components/PracticeFeedbackPage';
import ComprehensiveTestPage from './components/ComprehensiveTestPage';
import HomePage from './components/HomePage';
import FreeRecognition from './components/FreeRecognition';
import Header from './components/Header';
import Footer from './components/Footer';
import Layout from './components/Layout';
import DashboardPage from './components/DashboardPage';
import ProfilePage from './components/ProfilePage';
import StudentMyAssignments from './components/StudentMyAssignments';
import PracticePage from './components/PracticePage';
import StudentMyExams from './components/StudentMyExams';
import StudentExamDetail from './components/StudentExamDetail';
import StudentNotifications from './components/StudentNotifications';
import StudentFeedbackList from './components/StudentFeedbackList';
import StudentClasses from './components/StudentClasses';
import StudentClassDetail from './components/StudentClassDetail';
import StudentAssignmentDetail from './components/StudentAssignmentDetail';
import StudentBadgesPage from './components/StudentBadgesPage';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';
import { AssignmentProvider, useAssignment } from './contexts/AssignmentContext';

// Instructor Components
import InstructorLayout from './components/InstructorLayout';
import InstructorDashboard from './components/InstructorDashboard';
import InstructorStudentList from './components/InstructorStudentList';
import InstructorStudentDetail from './components/InstructorStudentDetail';
import InstructorAssignmentManagement from './components/InstructorAssignmentManagement';
import InstructorExamManagement from './components/InstructorExamManagement';
import InstructorReports from './components/InstructorReports';
import InstructorNotifications from './components/InstructorNotifications';
import InstructorBadgeManagement from './components/InstructorBadgeManagement';
import InstructorFeedbackManagement from './components/InstructorFeedbackManagement';
import InstructorSupportPage from './components/InstructorSupportPage';
import StudentSupportPage from './components/StudentSupportPage';
import StudentMessagesPage from './components/StudentMessagesPage';
import InstructorMessagesPage from './components/InstructorMessagesPage';
import InstructorProfile from './components/InstructorProfile';

// Admin Components
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminStudents from './components/admin/AdminStudents';
import AdminInstructors from './components/admin/AdminInstructors';
import AdminClasses from './components/admin/AdminClasses';
import AdminContent from './components/admin/AdminContent';
import AdminStatistics from './components/admin/AdminStatistics';
import AdminReports from './components/admin/AdminReports';
import AdminNotifications from './components/admin/AdminNotifications';
import AdminLogs from './components/admin/AdminLogs';
import AdminSystem from './components/admin/AdminSystem';
import AdminRoles from './components/admin/AdminRoles';
import AdminSupport from './components/admin/AdminSupport';
import AdminBadges from './components/admin/AdminBadges';
import AdminProfile from './components/admin/AdminProfile';

const API_URL = 'http://localhost:5000/api/auth';
const WS_URL = 'ws://127.0.0.1:8000/ws/predict';

const Login = () => {
    const { t, lang, setLang } = useLanguage();
    const [activeTab, setActiveTab] = useState('login');
    const [registerStep, setRegisterStep] = useState(1); // 1: tài khoản, 2: người giám hộ
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // Người giám hộ
    const [guardianFullName, setGuardianFullName] = useState('');
    const [guardianRelationship, setGuardianRelationship] = useState('');
    const [guardianPhone, setGuardianPhone] = useState('');
    const [guardianEmail, setGuardianEmail] = useState('');
    const [guardianAddress, setGuardianAddress] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            toast.error(t('common.enterUsernamePassword'));
            return;
        }
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_URL}/login`, { username, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            toast.success(t('common.loginSuccess'));
            
            // Redirect based on role
            const userRole = res.data.user?.role;
            if (userRole === 'instructor') {
                navigate('/instructor/dashboard');
            } else if (userRole === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t('common.loginFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    // Bước 1: validate thông tin tài khoản rồi chuyển bước 2
    const handleNextStep = (e) => {
        e.preventDefault();
        if (!fullName || !email || !username || !password || !confirmPassword) {
            toast.error(t('common.fillAllFields'));
            return;
        }

        // Họ tên: ít nhất 2 ký tự, chỉ chữ cái + khoảng trắng + dấu (không cho số, ký tự đặc biệt)
        const fullNameTrimmed = fullName.trim();
        if (fullNameTrimmed.length < 2) { toast.error(t('common.nameMin2')); return; }
        if (!/^[\p{L}\s'-]+$/u.test(fullNameTrimmed)) {
            toast.error(lang === 'vi' ? 'Họ tên chỉ được chứa chữ cái, không có số hay ký tự đặc biệt!' : 'Full name must contain only letters!');
            return;
        }
        if (fullNameTrimmed.length > 100) {
            toast.error(lang === 'vi' ? 'Họ tên không được quá 100 ký tự!' : 'Full name must be under 100 characters!');
            return;
        }

        // Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(email.trim())) { toast.error(t('common.invalidEmail')); return; }

        // Username: chỉ chữ cái, số, dấu gạch dưới; không khoảng trắng
        if (username.length < 3) { toast.error(t('common.usernameMin3')); return; }
        if (username.length > 30) {
            toast.error(lang === 'vi' ? 'Tài khoản không được quá 30 ký tự!' : 'Username must be under 30 characters!');
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            toast.error(lang === 'vi' ? 'Tài khoản chỉ được chứa chữ cái, số và dấu gạch dưới (_), không có khoảng trắng!' : 'Username can only contain letters, numbers and underscores!');
            return;
        }

        // Mật khẩu: tối thiểu 6 ký tự, phải có ít nhất 1 chữ + 1 số
        if (password.length < 6) { toast.error(t('common.passwordMin6')); return; }
        if (password.length > 100) {
            toast.error(lang === 'vi' ? 'Mật khẩu không được quá 100 ký tự!' : 'Password must be under 100 characters!');
            return;
        }
        if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
            toast.error(lang === 'vi' ? 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số!' : 'Password must contain at least 1 letter and 1 number!');
            return;
        }

        // Xác nhận mật khẩu
        if (password !== confirmPassword) { toast.error(t('common.passwordMismatch')); return; }

        setRegisterStep(2);
    };

    // Bước 2: submit toàn bộ
    const handleRegister = async (e) => {
        e.preventDefault();

        // Họ tên người giám hộ nếu có nhập
        if (guardianFullName.trim()) {
            if (!/^[\p{L}\s'-]+$/u.test(guardianFullName.trim())) {
                toast.error(lang === 'vi' ? 'Họ tên người giám hộ chỉ được chứa chữ cái!' : 'Guardian name must contain only letters!');
                return;
            }
            if (guardianFullName.trim().length < 2) {
                toast.error(lang === 'vi' ? 'Họ tên người giám hộ phải có ít nhất 2 ký tự!' : 'Guardian name must be at least 2 characters!');
                return;
            }
        }

        // SĐT: đầu số VN hợp lệ (03x, 05x, 07x, 08x, 09x)
        if (guardianPhone.trim()) {
            const phone = guardianPhone.replace(/\s/g, '');
            if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(phone)) {
                toast.error(lang === 'vi' ? 'Số điện thoại không hợp lệ! Vui lòng nhập số VN (VD: 0912345678)' : 'Invalid phone number! Please enter a Vietnamese number (e.g. 0912345678)');
                return;
            }
        }

        // Email người giám hộ
        if (guardianEmail.trim()) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(guardianEmail.trim())) {
                toast.error(lang === 'vi' ? 'Email người giám hộ không hợp lệ!' : 'Guardian email is invalid!');
                return;
            }
        }

        // Địa chỉ: không cho nhập HTML/script
        if (guardianAddress.trim()) {
            if (/<[^>]*>/.test(guardianAddress)) {
                toast.error(lang === 'vi' ? 'Địa chỉ không hợp lệ!' : 'Address is invalid!');
                return;
            }
            if (guardianAddress.trim().length > 200) {
                toast.error(lang === 'vi' ? 'Địa chỉ không được quá 200 ký tự!' : 'Address must be under 200 characters!');
                return;
            }
        }

        const guardian = (guardianFullName || guardianRelationship || guardianPhone || guardianEmail || guardianAddress)
            ? { fullName: guardianFullName.trim(), relationship: guardianRelationship, phone: guardianPhone.replace(/\s/g, ''), email: guardianEmail.trim(), address: guardianAddress.trim() }
            : undefined;

        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/register`, { 
                fullName: fullName.trim(), 
                email: email.trim(), 
                username: username.trim(), 
                password, 
                confirmPassword,
                guardian
            });
            toast.success(t('common.registerSuccess'));
            setActiveTab('login');
            resetForm();
        } catch (error) {
            toast.error(error.response?.data?.message || t('common.registerFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
        setEmail('');
        setRegisterStep(1);
        setGuardianFullName('');
        setGuardianRelationship('');
        setGuardianPhone('');
        setGuardianEmail('');
        setGuardianAddress('');
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-sky-100 to-cyan-50 overflow-hidden">
            {/* Language Toggle Button */}
            <div className="absolute top-5 right-5 z-20 flex items-center bg-white/80 backdrop-blur-md border-2 border-blue-200 rounded-full shadow-md p-1 gap-1">
                <button
                    onClick={() => setLang('vi')}
                    className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${
                        lang === 'vi'
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'text-blue-400 hover:text-blue-600'
                    }`}
                >
                    🇻🇳 VI
                </button>
                <button
                    onClick={() => setLang('en')}
                    className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${
                        lang === 'en'
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'text-blue-400 hover:text-blue-600'
                    }`}
                >
                    🇺🇸 EN
                </button>
            </div>

            {/* Dynamic Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400/30 rounded-full blur-[100px] animate-blob"></div>
                <div className="absolute top-1/4 -right-20 w-80 h-80 bg-cyan-400/30 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-40 left-1/3 w-[30rem] h-[30rem] bg-sky-400/30 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
                <div className="absolute inset-0 particle-grid opacity-40"></div>
                {/* Floating rings */}
                <div className="absolute top-20 right-20 w-40 h-40 border border-blue-400/40 rounded-full animate-float"></div>
                <div className="absolute bottom-32 left-16 w-24 h-24 border border-cyan-400/40 rounded-full animate-float" style={{animationDelay:'2s'}}></div>
            </div>

            <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-3xl p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(59,130,246,0.3)] border-[4px] border-white/90 hover:border-white hover:shadow-[0_30px_60px_-15px_rgba(59,130,246,0.5)] transition-all duration-500 transform hover:-translate-y-2">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-5 shadow-lg shadow-blue-500/20 border-2 border-white bg-white/50 group">
                        <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <h2 className="text-3xl font-black bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">{t('app.aslSystem')}</h2>
                    <p className="text-blue-500 text-sm font-semibold">{t('app.aiSignRecognition')}</p>
                </div>

                {/* Tab buttons */}
                <div className="flex p-1.5 mb-8 bg-blue-50 rounded-2xl border border-blue-200 shadow-inner">
                    <button
                        type="button"
                        onClick={() => { setActiveTab('login'); resetForm(); }}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                            activeTab === 'login' 
                                ? 'bg-white text-blue-600 shadow-md shadow-blue-500/10 scale-[1.02]' 
                                : 'text-blue-800/60 hover:text-blue-700 hover:bg-white/50'
                        }`}
                    >
                        {t('common.login')}
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('register'); resetForm(); }}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                            activeTab === 'register' 
                                ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-md shadow-emerald-500/20 scale-[1.02]' 
                                : 'text-blue-800/60 hover:text-green-700 hover:bg-white/50'
                        }`}
                    >
                        {t('common.register')}
                    </button>
                </div>

                {activeTab === 'login' ? (
                    <form onSubmit={handleLogin} className="space-y-5 animate-fade-in-up">
                        <div>
                            <label className="block text-blue-900 font-bold mb-2 text-sm ml-1">{t('common.username')}</label>
                            <div className="relative group">
                                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                <input 
                                    className="w-full pl-11 pr-4 py-3.5 bg-blue-50/80 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all focus:bg-white text-blue-900 font-medium placeholder-blue-400/70"
                                    placeholder={t('common.enterUsername')}
                                    value={username} 
                                    onChange={e => setUsername(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-blue-900 font-bold mb-2 text-sm ml-1">{t('common.password')}</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                <input 
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full pl-11 pr-12 py-3.5 bg-blue-50/80 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all focus:bg-white text-blue-900 font-medium placeholder-blue-400/70"
                                    placeholder={t('common.enterPassword')}
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    required 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full mt-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black text-lg py-4 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? t('common.registering') : t('common.login')}
                        </button>
                    </form>
                ) : (
                    /* ── REGISTER: 2 bước ── */
                    <div className="animate-fade-in-up">
                        {/* Step indicator */}
                        <div className="flex items-center gap-2 mb-5">
                            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-black transition-all ${registerStep === 1 ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'}`}>1</div>
                            <div className="flex-1 h-1 rounded-full bg-blue-100 overflow-hidden">
                                <div className={`h-full bg-emerald-400 transition-all duration-500 ${registerStep === 2 ? 'w-full' : 'w-0'}`}></div>
                            </div>
                            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-black transition-all ${registerStep === 2 ? 'bg-emerald-500 text-white' : 'bg-blue-100 text-blue-400'}`}>2</div>
                        </div>
                        <p className="text-xs text-center text-blue-400 font-medium mb-4">
                            {registerStep === 1
                                ? (lang === 'vi' ? 'Bước 1: Thông tin tài khoản' : 'Step 1: Account Information')
                                : (lang === 'vi' ? 'Bước 2: Thông tin người giám hộ' : 'Step 2: Guardian Information')}
                        </p>

                        {/* Bước 1: Thông tin tài khoản */}
                        {registerStep === 1 && (
                            <form onSubmit={handleNextStep} className="space-y-4">
                                <div>
                                    <label className="block text-blue-900 font-bold mb-2 text-sm ml-1">{t('common.fullName')}</label>
                                    <div className="relative group">
                                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                        <input className="w-full pl-11 pr-4 py-3.5 bg-blue-50/80 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all focus:bg-white text-blue-900 font-medium placeholder-blue-400/70"
                                            placeholder={t('common.enterFullName')} value={fullName} onChange={e => setFullName(e.target.value)} maxLength={100} required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-blue-900 font-bold mb-2 text-sm ml-1">{t('common.email')}</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                        <input type="email" className="w-full pl-11 pr-4 py-3.5 bg-blue-50/80 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all focus:bg-white text-blue-900 font-medium placeholder-blue-400/70"
                                            placeholder={t('common.enterEmail')} value={email} onChange={e => setEmail(e.target.value)} required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-blue-900 font-bold mb-2 text-sm ml-1">{t('common.username')}</label>
                                    <div className="relative group">
                                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                        <input className="w-full pl-11 pr-4 py-3.5 bg-blue-50/80 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all focus:bg-white text-blue-900 font-medium placeholder-blue-400/70"
                                            placeholder={t('common.enterUsernameMin3')} value={username} onChange={e => setUsername(e.target.value)} maxLength={30} required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-blue-900 font-bold mb-2 text-sm ml-1">{t('common.password')}</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                        <input type={showPassword ? 'text' : 'password'} className="w-full pl-11 pr-12 py-3.5 bg-blue-50/80 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all focus:bg-white text-blue-900 font-medium placeholder-blue-400/70"
                                            placeholder={t('common.enterPasswordMin6')} value={password} onChange={e => setPassword(e.target.value)} required />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-emerald-600 transition-colors">
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-blue-900 font-bold mb-2 text-sm ml-1">{t('common.confirmPasswordLabel')}</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                        <input type={showConfirmPassword ? 'text' : 'password'} className="w-full pl-11 pr-12 py-3.5 bg-blue-50/80 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all focus:bg-white text-blue-900 font-medium placeholder-blue-400/70"
                                            placeholder={t('common.confirmPassword')} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-emerald-600 transition-colors">
                                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" className="w-full mt-2 bg-gradient-to-r from-emerald-400 to-green-500 text-white font-black text-lg py-4 rounded-xl hover:from-emerald-500 hover:to-green-600 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5">
                                    {lang === 'vi' ? 'Tiếp theo →' : 'Next →'}
                                </button>
                            </form>
                        )}

                        {/* Bước 2: Người giám hộ */}
                        {registerStep === 2 && (
                            <form onSubmit={handleRegister} className="space-y-4">
                                {/* Họ tên người giám hộ */}
                                <div>
                                    <label className="block text-blue-900 font-bold mb-2 text-sm ml-1">
                                        {lang === 'vi' ? 'Họ tên người giám hộ' : 'Guardian Full Name'}
                                        <span className="text-blue-400 font-normal ml-1">({lang === 'vi' ? 'tùy chọn' : 'optional'})</span>
                                    </label>
                                    <div className="relative group">
                                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                        <input className="w-full pl-11 pr-4 py-3.5 bg-blue-50/80 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all focus:bg-white text-blue-900 font-medium placeholder-blue-400/70"
                                            placeholder={lang === 'vi' ? 'Nhập họ tên người giám hộ' : 'Enter guardian full name'}
                                            value={guardianFullName} onChange={e => setGuardianFullName(e.target.value)} maxLength={100} />
                                    </div>
                                </div>
                                {/* Mối quan hệ */}
                                <div>
                                    <label className="block text-blue-900 font-bold mb-2 text-sm ml-1">
                                        {lang === 'vi' ? 'Mối quan hệ' : 'Relationship'}
                                        <span className="text-blue-400 font-normal ml-1">({lang === 'vi' ? 'tùy chọn' : 'optional'})</span>
                                    </label>
                                    <select
                                        className="w-full px-4 py-3.5 bg-blue-50/80 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all focus:bg-white text-blue-900 font-medium"
                                        value={guardianRelationship} onChange={e => setGuardianRelationship(e.target.value)}
                                    >
                                        <option value="">{lang === 'vi' ? '-- Chọn mối quan hệ --' : '-- Select relationship --'}</option>
                                        <option value="cha">{lang === 'vi' ? 'Cha' : 'Father'}</option>
                                        <option value="mẹ">{lang === 'vi' ? 'Mẹ' : 'Mother'}</option>
                                        <option value="anh">{lang === 'vi' ? 'Anh' : 'Older Brother'}</option>
                                        <option value="chị">{lang === 'vi' ? 'Chị' : 'Older Sister'}</option>
                                        <option value="ông">{lang === 'vi' ? 'Ông' : 'Grandfather'}</option>
                                        <option value="bà">{lang === 'vi' ? 'Bà' : 'Grandmother'}</option>
                                        <option value="khác">{lang === 'vi' ? 'Khác' : 'Other'}</option>
                                    </select>
                                </div>
                                {/* SĐT */}
                                <div>
                                    <label className="block text-blue-900 font-bold mb-2 text-sm ml-1">
                                        {lang === 'vi' ? 'Số điện thoại' : 'Phone Number'}
                                        <span className="text-blue-400 font-normal ml-1">({lang === 'vi' ? 'tùy chọn' : 'optional'})</span>
                                    </label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-emerald-500 transition-colors text-base">📞</span>
                                        <input className="w-full pl-11 pr-4 py-3.5 bg-blue-50/80 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all focus:bg-white text-blue-900 font-medium placeholder-blue-400/70"
                                            placeholder={lang === 'vi' ? 'Nhập số điện thoại' : 'Enter phone number'}
                                            value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} maxLength={15} inputMode="tel" />
                                    </div>
                                </div>
                                {/* Email người giám hộ */}
                                <div>
                                    <label className="block text-blue-900 font-bold mb-2 text-sm ml-1">
                                        {lang === 'vi' ? 'Email liên hệ' : 'Contact Email'}
                                        <span className="text-blue-400 font-normal ml-1">({lang === 'vi' ? 'tùy chọn' : 'optional'})</span>
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                        <input type="email" className="w-full pl-11 pr-4 py-3.5 bg-blue-50/80 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all focus:bg-white text-blue-900 font-medium placeholder-blue-400/70"
                                            placeholder={lang === 'vi' ? 'Nhập email người giám hộ' : 'Enter guardian email'}
                                            value={guardianEmail} onChange={e => setGuardianEmail(e.target.value)} />
                                    </div>
                                </div>
                                {/* Địa chỉ */}
                                <div>
                                    <label className="block text-blue-900 font-bold mb-2 text-sm ml-1">
                                        {lang === 'vi' ? 'Địa chỉ' : 'Address'}
                                        <span className="text-blue-400 font-normal ml-1">({lang === 'vi' ? 'tùy chọn' : 'optional'})</span>
                                    </label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-emerald-500 transition-colors text-base">🏠</span>
                                        <input className="w-full pl-11 pr-4 py-3.5 bg-blue-50/80 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all focus:bg-white text-blue-900 font-medium placeholder-blue-400/70"
                                            placeholder={lang === 'vi' ? 'Nhập địa chỉ' : 'Enter address'}
                                            value={guardianAddress} onChange={e => setGuardianAddress(e.target.value)} maxLength={200} />
                                    </div>
                                </div>
                                {/* Buttons */}
                                <div className="flex gap-3 mt-2">
                                    <button type="button" onClick={() => setRegisterStep(1)}
                                        className="flex-1 py-3.5 rounded-xl font-bold text-blue-600 bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 transition-all">
                                        ← {lang === 'vi' ? 'Quay lại' : 'Back'}
                                    </button>
                                    <button type="submit" disabled={isLoading}
                                        className="flex-[2] bg-gradient-to-r from-emerald-400 to-green-500 text-white font-black text-base py-3.5 rounded-xl hover:from-emerald-500 hover:to-green-600 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isLoading ? t('common.registering') : (lang === 'vi' ? '✓ Tạo tài khoản' : '✓ Create Account')}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                <p className="text-center text-blue-800/60 font-medium text-sm mt-8">
                    {activeTab === 'login' ? t('common.noAccount') : t('common.haveAccount')}
                    <button 
                        onClick={() => { setActiveTab(activeTab === 'login' ? 'register' : 'login'); resetForm(); }}
                        className={`font-bold transition-colors ${activeTab === 'login' ? 'text-emerald-500 hover:text-emerald-600 hover:underline' : 'text-blue-600 hover:text-blue-700 hover:underline'}`}
                    >
                        {activeTab === 'login' ? t('common.registerNow') : t('common.loginNow')}
                    </button>
                </p>
            </div>
        </div>
    );
};

const Profile = () => {
    const { t } = useLanguage();
    const [currentUser, setCurrentUser] = useState(null);
    const [fullName, setFullName] = useState('');
    const [avatar, setAvatar] = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    
    const navigate = useNavigate();

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
            return;
        }
        
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            setCurrentUser(user);
            setFullName(user.fullName || '');
            setAvatarPreview(user.avatar || '');
        }
        
        fetchUserProfile();
    }, [navigate]);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const user = res.data.user;
            setCurrentUser(user);
            setFullName(user.fullName || '');
            setAvatarPreview(user.avatar || '');
            localStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(t('common.avatarTooLarge'));
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result);
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        
        if (!fullName || fullName.trim().length < 2) {
            toast.error(t('common.nameMin2'));
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_URL}/profile`, 
                { fullName: fullName.trim(), avatar },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            toast.success(res.data.message);
            setCurrentUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setAvatar('');
        } catch (error) {
            toast.error(error.response?.data?.message || t('common.updateFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error(t('common.fillAllFields'));
            return;
        }
        
        if (newPassword.length < 6) {
            toast.error(t('common.newPasswordMin6'));
            return;
        }
        
        if (newPassword !== confirmPassword) {
            toast.error(t('common.passwordMismatch'));
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_URL}/profile/password`,
                { currentPassword, newPassword, confirmPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            toast.success(res.data.message);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setActiveTab('info');
        } catch (error) {
            toast.error(error.response?.data?.message || t('common.passwordChangeFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        logout(navigate);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
            <div className="max-w-4xl mx-auto">
                <header className="bg-white rounded-xl shadow-sm p-4 mb-6 flex justify-between items-center">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="text-blue-600 font-medium flex items-center gap-2 hover:bg-blue-50 px-3 py-2 rounded-lg transition"
                    >
                        <Camera size={20} /> {t('common.backToDashboard')}
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="text-red-500 font-medium flex items-center gap-2 hover:bg-red-50 px-3 py-2 rounded-lg transition"
                    >
                        <LogOut size={18} /> {t('common.logout')}
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Sidebar */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="text-center">
                            <div className="relative inline-block">
                                {avatarPreview ? (
                                    <img 
                                        src={avatarPreview} 
                                        alt="Avatar" 
                                        className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-blue-100"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center mx-auto border-4 border-blue-100">
                                        <User className="text-blue-600" size={48} />
                                    </div>
                                )}
                                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-lg">
                                    <Settings size={16} />
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mt-4">{currentUser?.fullName || 'User'}</h3>
                            <p className="text-gray-500 text-sm">{currentUser?.email}</p>
                            <p className="text-gray-400 text-xs mt-1">@{currentUser?.username}</p>
                        </div>
                        
                        <nav className="mt-6 space-y-2">
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition flex items-center gap-3 ${
                                    activeTab === 'info' 
                                        ? 'bg-blue-50 text-blue-600' 
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <User size={18} /> {t('common.personalInfo')}
                            </button>
                            <button
                                onClick={() => setActiveTab('password')}
                                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition flex items-center gap-3 ${
                                    activeTab === 'password' 
                                        ? 'bg-blue-50 text-blue-600' 
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <Lock size={18} /> {t('common.changePassword')}
                            </button>
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-2">
                        {activeTab === 'info' && (
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <User className="text-blue-600" /> {t('common.personalInfo')}
                                </h2>
                                
                                <form onSubmit={handleUpdateProfile} className="space-y-5">
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">{t('common.fullName')}</label>
                                        <div className="relative">
                                            <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                            <input 
                                                type="text"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                placeholder={t('profilePage.enterFullName')}
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                maxLength={100}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">{t('common.email')}</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                            <input 
                                                type="email"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-100"
                                                value={currentUser?.email || ''}
                                                disabled
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{t('profilePage.emailUnchangeable')}</p>
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">{t('profilePage.username')}</label>
                                        <div className="relative">
                                            <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                            <input 
                                                type="text"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-100"
                                                value={currentUser?.username || ''}
                                                disabled
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{t('profilePage.usernameUnchangeableLabel')}</p>
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">{t('profilePage.avatarPreview')}</label>
                                        <div className="flex items-center gap-4">
                                            {avatarPreview ? (
                                                <img 
                                                    src={avatarPreview} 
                                                    alt="Avatar Preview" 
                                                    className="w-20 h-20 rounded-full object-cover border-2 border-blue-200"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <User className="text-gray-400" size={32} />
                                                </div>
                                            )}
                                            <div>
                                                <label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition inline-block">
                                                    {t('profilePage.selectImage')}
                                                    <input 
                                                        type="file" 
                                                        accept="image/*"
                                                        onChange={handleAvatarChange}
                                                        className="hidden"
                                                    />
                                                </label>
                                                <p className="text-xs text-gray-500 mt-1">{t('profilePage.imageRequirements')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                                    >
                                        {isLoading ? t('profilePage.updating') : t('profilePage.updateProfile')}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'password' && (
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Lock className="text-blue-600" /> {t('common.changePassword')}
                                </h2>
                                
                                <form onSubmit={handleChangePassword} className="space-y-5">
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">{t('profilePage.currentPassword')}</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                            <input 
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                placeholder={t('profilePage.enterCurrentPassword')}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">{t('profilePage.newPassword')}</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                            <input 
                                                type={showNewPassword ? 'text' : 'password'}
                                                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                placeholder={t('profilePage.enterNewPassword')}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">{t('profilePage.confirmNewPassword')}</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                            <input 
                                                type={showNewPassword ? 'text' : 'password'}
                                                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                placeholder={t('profilePage.confirmNewPassword')}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                                    >
                                        {isLoading ? t('profilePage.changingPassword') : t('common.changePassword')}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Practice = () => {
    const { t } = useLanguage();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const wsRef = useRef(null);
    const intervalRef = useRef(null);
    const streamRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const manualStopRef = useRef(false);
    const actionCooldownUntilRef = useRef(0);
    const letterStabilityRef = useRef({ letter: '', count: 0, lastChange: 0 });
    const displayLetterRef = useRef({ letter: '', stableSince: 0 });
    const letterEvaluatedRef = useRef(false);
    const currentTargetRef = useRef('');
    const isWaitingRef = useRef(false);
    const feedbackCooldownRef = useRef(false);
    const lastFeedbackTimeRef = useRef(0);
    const practiceEvaluationCooldownRef = useRef(0);
    const wordEvaluatedRef = useRef(false);
    const sentenceEvaluatedRef = useRef(false);
    const wordTargetRef = useRef('');
    const sentenceTargetRef = useRef('');
    const wordSpellIndexRef = useRef(0);
    const sentenceIndexRef = useRef(0);
    const spelledLettersRef = useRef([]);
    const performedLettersRef = useRef([]);
    const wordStabilityRef = useRef({ letter: '', count: 0, lastChange: 0, stableSince: 0 });
    const sentenceStabilityRef = useRef({ letter: '', count: 0, lastChange: 0, stableSince: 0 });
    const navigate = useNavigate();
    const location = useLocation();

    // Track if current round has been counted
    const letterRoundCountedRef = useRef(false);
    const wordRoundCountedRef = useRef(false);
    const sentenceRoundCountedRef = useRef(false);
    // Practice mode state
    const [practiceMode, setPracticeMode] = useState('normal'); // 'normal' | 'topic'
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [topicTab, setTopicTab] = useState('word');

    // Helper: get translated topic name by key
    const TOPIC_KEY_MAP = {
        'Food':           'practice.topicFood',
        'Sport':          'practice.topicSport',
        'Animal':         'practice.topicAnimals',
        'Family':         'practice.topicFamily',
        'Weather':        'practice.topicWeather',
        'Greeting':       'practice.topicGreeting',
        'Greetings':      'practice.topicGreetings',
        'Colors':         'practice.topicColors',
        'Numbers':        'practice.topicNumbers',
        'Emotion':        'practice.topicEmotion',
        'Travel':         'practice.topicTravel',
        'Time':           'practice.topicTime',
        'Clothes':        'practice.topicClothes',
        'Body':           'practice.topicBody',
        'Health':         'practice.topicHealth',
        'School':         'practice.topicSchool',
        'Job':            'practice.topicJob',
        'Place':          'practice.topicPlace',
        'Shopping':       'practice.topicShopping',
        'Nature':         'practice.topicNature',
        'Technology':     'practice.topicTechnology',
        'Communication':  'practice.topicCommunication',
        'Money':          'practice.topicMoney',
        'Music':          'practice.topicMusic',
        'Movie':          'practice.topicMovie',
        'Hobby':          'practice.topicHobby',
        'DailyRoutine':   'practice.topicDailyRoutine',
        'Feelings':       'practice.topicFeelings',
        'Feelings2':      'practice.topicFeelings2',
        'Holiday':        'practice.topicHoliday',
        'Internet':       'practice.topicInternet',
        'Transportation': 'practice.topicTransportation',
        'Actions':        'practice.topicActions',
        'Months':         'practice.topicMonths',
        'Opposites':      'practice.topicOpposites',
        'Misc':           'practice.topicMisc',
        'Directions':     'practice.topicDirections',
    };
    const getTopicName = (key) => key ? (t(TOPIC_KEY_MAP[key]) || TOPICS[key]?.name || key) : '';
    
    const [activeTab, setActiveTab] = useState('letter');
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentLetter, setCurrentLetter] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    
    // Session state - 10 rounds per session
    const [letterSessionRound, setLetterSessionRound] = useState(0);
    const [wordSessionRound, setWordSessionRound] = useState(0);
    const [sentenceSessionRound, setSentenceSessionRound] = useState(0);
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [resultsData, setResultsData] = useState({ type: '', correct: 0, wrong: 0, accuracy: 0 });
    const resultsDataRef = useRef({ type: '', correct: 0, wrong: 0, accuracy: 0 });
    
    // Track used items in current session
    const [usedLetterItems, setUsedLetterItems] = useState([]);
    const [usedWordItems, setUsedWordItems] = useState([]);
    const [usedSentenceItems, setUsedSentenceItems] = useState([]);
    
    // Letter Practice State
    const [targetLetter, setTargetLetter] = useState('');
    const [letterResult, setLetterResult] = useState(null);
    const [letterAccuracy, setLetterAccuracy] = useState(0);
    const [letterAttempts, setLetterAttempts] = useState(0);
    const [letterCorrect, setLetterCorrect] = useState(0);
    const [letterWrong, setLetterWrong] = useState(0);
    const [isLetterCorrect, setIsLetterCorrect] = useState(null);
    const [isLetterRetry, setIsLetterRetry] = useState(false);
    
    // Word Practice State
    const [targetWord, setTargetWord] = useState('');
    const [spelledLetters, setSpelledLetters] = useState([]);
    const [currentSpellIndex, setCurrentSpellIndex] = useState(0);
    const [wordResult, setWordResult] = useState(null);
    const [wordAttempts, setWordAttempts] = useState(0);
    const [wordCorrect, setWordCorrect] = useState(0);
    const [wordWrong, setWordWrong] = useState(0);
    const [spellingFeedback, setSpellingFeedback] = useState(null);
    
    // Sentence Practice State
    const [targetSentence, setTargetSentence] = useState('');
    const [performedLetters, setPerformedLetters] = useState([]);
    const [sentenceResult, setSentenceResult] = useState(null);
    const [sentenceAttempts, setSentenceAttempts] = useState(0);
    const [sentenceCorrect, setSentenceCorrect] = useState(0);
    const [sentenceWrong, setSentenceWrong] = useState(0);
    const [missingLetters, setMissingLetters] = useState([]);
    const [wrongLetters, setWrongLetters] = useState([]);

    // Feedback State
    const [showFeedback, setShowFeedback] = useState(false);
    const [currentFeedback, setCurrentFeedback] = useState(null);
    const [feedbackHistory, setFeedbackHistory] = useState([]);
    const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);

    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    const [skeletonImage, setSkeletonImage] = useState(null);
    const [isHandPresent, setIsHandPresent] = useState(false);

    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const COMMON_WORDS = [
        // Greetings & Politeness
        'HELLO', 'HI', 'HEY', 'GOODBYE', 'BYE', 'WELCOME', 'GREETING', 'PLEASE', 'THANK', 'SORRY',
        'YES', 'NO', 'OKAY', 'ALRIGHT', 'WELCOME', 'CHEERS', 'APOLOGIZE', 'EXCUSE',

        // Personal & Pronouns
        'NAME', 'YOU', 'YOUR', 'ME', 'MY', 'I', 'MINE', 'YOURS', 'OURS', 'THEIRS',
        'WHO', 'WHAT', 'WHERE', 'WHEN', 'WHY', 'HOW', 'WHICH', 'WHOSE',

        // Family & People
        'MOTHER', 'FATHER', 'PARENT', 'BROTHER', 'SISTER', 'SIBLING', 'SON', 'DAUGHTER', 'FAMILY',
        'MAN', 'WOMAN', 'CHILD', 'CHILDREN', 'BOY', 'GIRL', 'BABY', 'KID', 'FRIEND',
        'TEACHER', 'STUDENT', 'DOCTOR', 'NURSE', 'POLICE', 'DRIVER', 'WORKER', 'BOSS',

        // Emotions & Feelings
        'HAPPY', 'SAD', 'ANGRY', 'CALM', 'EXCITED', 'SCARED', 'PROUD', 'SHY', 'BRAVE',
        'AFRAID', 'WORRIED', 'ANXIOUS', 'GRATEFUL', 'HOPEFUL', 'LONELY', 'TIRED', 'ENERGETIC',
        'LOVE', 'HATE', 'LIKE', 'DISLIKE', 'ENJOY', 'FEAR', 'BELIEVE', 'TRUST',

        // Health & Body
        'HEALTH', 'SICK', 'HEALTHY', 'WELL', 'PAIN', 'HURT', 'ACHE', 'FEVER', 'COLD',
        'HEAD', 'HAND', 'EYE', 'EAR', 'NOSE', 'MOUTH', 'HEART', 'BRAIN', 'STOMACH', 'BACK',
        'DOCTOR', 'MEDICINE', 'HOSPITAL', 'CLINIC', 'TREATMENT', 'EMERGENCY', 'INJURY',

        // Food & Drinks
        'FOOD', 'WATER', 'RICE', 'BREAD', 'NOODLE', 'MEAT', 'FISH', 'VEGETABLE', 'FRUIT',
        'MILK', 'JUICE', 'COFFEE', 'TEA', 'SODA', 'SOUP', 'SALAD', 'SALT', 'SUGAR',
        'HUNGRY', 'THIRSTY', 'DELICIOUS', 'TASTY', 'SWEET', 'SOUR', 'SPICY', 'SALTY',

        // Time & Date
        'TIME', 'TODAY', 'TOMORROW', 'YESTERDAY', 'NOW', 'THEN', 'LATER', 'SOON', 'EARLY', 'LATE',
        'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'MIDNIGHT', 'NOON', 'DAWN', 'DUSK',
        'DAY', 'WEEK', 'MONTH', 'YEAR', 'HOUR', 'MINUTE', 'SECOND', 'DATE', 'CALENDAR',

        // Places & Locations
        'HOME', 'HOUSE', 'SCHOOL', 'HOSPITAL', 'OFFICE', 'STORE', 'MARKET', 'RESTAURANT', 'CAFE',
        'ROOM', 'BATHROOM', 'KITCHEN', 'GARDEN', 'PARK', 'LIBRARY', 'CLASSROOM', 'BUILDING',
        'CITY', 'TOWN', 'VILLAGE', 'STREET', 'ROAD', 'STATION', 'AIRPORT', 'PLANE', 'CAR', 'BUS',

        // Actions - Basic
        'GO', 'COME', 'WALK', 'RUN', 'STOP', 'WAIT', 'STAY', 'LEAVE', 'ENTER', 'EXIT',
        'EAT', 'DRINK', 'SLEEP', 'WAKE', 'REST', 'WORK', 'STUDY', 'LEARN', 'TEACH', 'READ',
        'WRITE', 'SPEAK', 'TALK', 'SAY', 'TELL', 'ASK', 'ANSWER', 'LISTEN', 'HEAR', 'SEE', 'LOOK',

        // Actions - Communication
        'HELP', 'CALL', 'TEXT', 'WRITE', 'SEND', 'RECEIVE', 'SHARE', 'EXPLAIN', 'DESCRIBE', 'DISCUSS',
        'COMMUNICATE', 'TRANSLATE', 'INTERPRET', 'EXPRESS', 'CONVEY', 'INFORM', 'ANNOUNCE', 'DECLARE',

        // Descriptions - Quality
        'GOOD', 'BAD', 'BEST', 'WORST', 'BETTER', 'GREAT', 'NICE', 'WONDERFUL', 'AMAZING', 'AWESOME',
        'BEAUTIFUL', 'UGLY', 'PRETTY', 'NEW', 'OLD', 'YOUNG', 'STRONG', 'WEAK', 'FAST', 'SLOW',

        // Descriptions - Size & Shape
        'BIG', 'SMALL', 'LARGE', 'TINY', 'HUGE', 'LONG', 'SHORT', 'TALL', 'HIGH', 'LOW',
        'WIDE', 'NARROW', 'THICK', 'THIN', 'HEAVY', 'LIGHT', 'DEEP', 'SHALLOW',

        // Nature & Environment
        'NATURE', 'TREE', 'FLOWER', 'PLANT', 'GRASS', 'ANIMAL', 'BIRD', 'FISH', 'DOG', 'CAT',
        'SUN', 'MOON', 'STAR', 'SKY', 'CLOUD', 'RAIN', 'SNOW', 'WIND', 'STORM', 'WEATHER',
        'FOREST', 'MOUNTAIN', 'RIVER', 'OCEAN', 'BEACH', 'DESERT', 'LAKE', 'ISLAND',

        // Colors
        'RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'PINK', 'BROWN', 'BLACK', 'WHITE', 'GRAY',

        // Technology & Communication
        'PHONE', 'COMPUTER', 'LAPTOP', 'TABLET', 'CAMERA', 'INTERNET', 'WIFI', 'MESSAGE', 'EMAIL',
        'VIDEO', 'PHOTO', 'SCREEN', 'KEYBOARD', 'APP', 'SOFTWARE', 'DATA', 'FILE', 'FOLDER',

        // Education & Learning
        'BOOK', 'PAPER', 'PEN', 'PENCIL', 'NOTEBOOK', 'DESK', 'CHAIR', 'BOARD', 'LESSON', 'CLASS',
        'TEST', 'EXAM', 'HOMEWORK', 'GRADE', 'SCORE', 'SUBJECT', 'TOPIC', 'CHAPTER', 'UNIT',
        'SKILL', 'KNOWLEDGE', 'EXPERIENCE', 'ABILITY', 'PRACTICE', 'EFFORT', 'PROGRESS', 'SUCCESS',

        // Transportation & Travel
        'TRAVEL', 'TRIP', 'JOURNEY', 'TOUR', 'TICKET', 'PASSPORT', 'VISA', 'LUGGAGE', 'BAGGAGE',
        'DESTINATION', 'DEPARTURE', 'ARRIVAL', 'SCHEDULE', 'DELAY', 'BOARDING', 'SEAT', 'ROUTE',

        // Money & Shopping
        'MONEY', 'CASH', 'CARD', 'CREDIT', 'PRICE', 'COST', 'BUY', 'SELL', 'PAY', 'SHOP',
        'CHEAP', 'EXPENSIVE', 'DISCOUNT', 'SALE', 'DEAL', 'BUDGET', 'BILL', 'RECEIPT', 'CHANGE',

        // Numbers & Quantities
        'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN',
        'FIRST', 'SECOND', 'THIRD', 'LAST', 'NEXT', 'MANY', 'FEW', 'SOME', 'ALL', 'EACH',
        'HALF', 'DOUBLE', 'COUPLE', 'NUMBER', 'COUNT', 'TOTAL', 'MUCH', 'MORE', 'LESS', 'ENOUGH',

        // Abstract Concepts
        'IDEA', 'THOUGHT', 'OPINION', 'VIEW', 'BELIEF', 'VALUE', 'FREEDOM', 'PEACE', 'JUSTICE',
        'PROBLEM', 'SOLUTION', 'ISSUE', 'CHALLENGE', 'GOAL', 'PLAN', 'STRATEGY', 'DECISION',
        'FAILURE', 'ACHIEVEMENT', 'GROWTH', 'CHANGE', 'DEVELOPMENT', 'IMPROVEMENT',

        // Weather & Climate
        'HOT', 'COLD', 'WARM', 'COOL', 'WET', 'DRY', 'HUMID', 'SUNNY', 'CLOUDY', 'RAINY', 'WINDY',
        'SPRING', 'SUMMER', 'AUTUMN', 'FALL', 'WINTER', 'SEASON', 'CLIMATE', 'TEMPERATURE',

        // Safety & Emergency
        'SAFE', 'DANGER', 'DANGEROUS', 'SECURE', 'PROTECT', 'DEFEND', 'PREVENT', 'AVOID',
        'ACCIDENT', 'WARNING', 'ALERT', 'ALARM', 'RISK', 'RESCUE', 'SUPPORT', 'AID', 'SAFETY',

        // Daily activities
        'MORNING', 'ROUTINE', 'BREAKFAST', 'LUNCH', 'DINNER', 'SHOWER', 'BRUSH', 'CLEAN',
        'LAUNDRY', 'COOK', 'WASH', 'WEAR', 'DRESS', 'CHANGE', 'BIKE', 'DRIVE', 'RIDE',

        // Sign language specific
        'SIGN', 'GESTURE', 'FINGERSPELL', 'ALPHABET', 'SYMBOL', 'COMMUNICATE', 'DEAF', 'MUTE',
        'HEARING', 'SPEECH', 'LANGUAGE', 'VOCABULARY', 'SENTENCE', 'PHRASE', 'WORD'
    ];
    const COMMON_SENTENCES = [
        // Greetings (Chào hỏi)
        'HOW ARE YOU TODAY', 'I AM FINE THANK YOU', 'GOOD MORNING TO YOU', 'GOOD AFTERNOON EVERYONE',
        'GOOD EVENING MY FRIEND', 'NICE TO SEE YOU', 'WELCOME TO OUR CLASS', 'HAPPY TO MEET YOU',
        'HAVE A NICE DAY', 'SEE YOU LATER', 'SEE YOU TOMORROW', 'TAKE CARE OF YOURSELF',
        'SLEEP WELL TONIGHT', 'DREAM SWEET DREAMS', 'GOOD NIGHT AND GOODBYE',

        // Gratitude & Apologies (Cảm ơn & Xin lỗi)
        'THANK YOU VERY MUCH', 'THANK YOU FOR EVERYTHING', 'I APPRECIATE YOUR HELP', 'I AM GRATEFUL TO YOU',
        'I AM SORRY ABOUT THAT', 'EXCUSE ME PLEASE', 'PARDON ME FOR INTERRUPTING', 'NO WORRIES AT ALL',
        'IT IS OKAY DO NOT WORRY', 'I DID NOT MEAN TO',

        // Basic Communication (Giao tiếp cơ bản)
        'WHAT IS YOUR NAME', 'MY NAME IS STUDENT', 'WHERE ARE YOU FROM', 'I AM FROM VIETNAM',
        'HOW OLD ARE YOU', 'WHAT DO YOU DO', 'I AM A STUDENT', 'I STUDY AT SCHOOL',
        'CAN YOU HELP ME PLEASE', 'I NEED YOUR ASSISTANCE', 'DO YOU UNDERSTAND ME',
        'I DO NOT UNDERSTAND', 'CAN YOU REPEAT THAT', 'SPEAK MORE SLOWLY PLEASE',

        // Health & Emergency (Sức khỏe & Khẩn cấp)
        'I NEED HELP URGENTLY', 'PLEASE CALL A DOCTOR', 'I AM NOT FEELING WELL', 'I HAVE A HEADACHE',
        'MY STOMACH HURTS', 'I FEEL DIZZY', 'I AM VERY THIRSTY', 'I NEED SOME WATER',
        'WHERE IS THE BATHROOM', 'I NEED MEDICINE PLEASE', 'I AM ALLERGIC TO THIS',
        'PLEASE CALL MY FAMILY', 'IT IS AN EMERGENCY',

        // Food & Drinks (Đồ ăn & Nước uống)
        'I AM VERY HUNGRY', 'I WOULD LIKE SOME FOOD', 'WHAT TIME IS LUNCH', 'I AM EATING NOW',
        'THIS FOOD IS DELICIOUS', 'I LIKE RICE AND VEGETABLES', 'DO YOU WANT TO EAT',
        'LET US GO GET FOOD', 'I PREFER SWEET DRINKS', 'I NEED A GLASS OF WATER',

        // Time & Schedule (Thời gian & Lịch trình)
        'WHAT TIME IS IT NOW', 'WHEN DOES CLASS START', 'WHEN IS THE BREAK TIME', 'CLASS IS OVER NOW',
        'WE HAVE HOMEWORK TODAY', 'THE TEST IS TOMORROW', 'STUDY HARD FOR EXAM', 'I WILL TRY MY BEST',

        // Emotions & Feelings (Cảm xúc & Cảm giác)
        'I AM HAPPY TODAY', 'I FEEL VERY SAD', 'I AM EXCITED ABOUT THIS', 'I AM WORRIED ABOUT THAT',
        'DO NOT BE AFRAID', 'EVERYTHING WILL BE OKAY', 'STAY POSITIVE AND BRAVE', 'I BELIEVE IN YOU',
        'KEEP YOUR SPIRIT UP', 'YOU ARE DOING GREAT',

        // Encouragement & Support (Động viên & Hỗ trợ)
        'CONGRATULATIONS TO YOU', 'WELL DONE MY FRIEND', 'KEEP UP THE GOOD WORK', 'NEVER GIVE UP',
        'BELIEVE IN YOURSELF', 'YOU CAN DO IT', 'STUDY HARD AND PRACTICE', 'EFFORT BRINGS SUCCESS',
        'PRACTICE MAKES PERFECT', 'IMPROVE YOUR SKILLS DAILY',

        // Questions & Requests (Hỏi & Yêu cầu)
        'CAN I ASK A QUESTION', 'MAY I HAVE YOUR ATTENTION', 'CAN WE START NOW',
        'PLEASE WAIT A MOMENT', 'JUST A MINUTE PLEASE', 'LET US CONTINUE LESSON',
        'CAN YOU EXPLAIN AGAIN', 'I HAVE A QUESTION HERE', 'MAY I GO TO BATHROOM',
        'CAN I LEAVE EARLY TODAY',

        // Agreement & Disagreement (Đồng ý & Không đồng ý)
        'I AGREE WITH YOU', 'I DO NOT AGREE WITH THAT', 'THAT IS A GOOD IDEA', 'LET US DO IT TOGETHER',
        'YOU ARE RIGHT ABOUT THIS', 'I THINK OTHERWISE', 'THAT IS NOT CORRECT', 'OKAY LET US TRY',
        'DEPENDS ON SITUATION', 'I AM NOT SURE ABOUT THAT',

        // Directions & Places (Chỉ đường & Địa điểm)
        'WHERE IS THE LIBRARY', 'HOW DO I GET THERE', 'GO STRAIGHT THEN TURN LEFT', 'TURN RIGHT AT CORNER',
        'IT IS NOT FAR FROM HERE', 'WALK FOR ABOUT TEN MINUTES', 'THE OFFICE IS UPSTAIRS',
        'FOLLOW THE SIGNS PLEASE',

        // Family & Friends (Gia đình & Bạn bè)
        'I LOVE MY FAMILY', 'MY MOTHER AND FATHER', 'I HAVE TWO SIBLINGS', 'MY BEST FRIEND IS HERE',
        'FAMILY IS VERY IMPORTANT', 'SPEND TIME WITH LOVED ONES', 'WE ARE ALL CONNECTED',
        'FRIENDSHIP IS PRECIOUS',

        // Learning & Education (Học tập & Giáo dục)
        'I AM LEARNING SIGN LANGUAGE', 'SIGN LANGUAGE IS BEAUTIFUL', 'PRACTICE MAKES PROGRESS',
        'LEARNING NEVER STOPS', 'KNOWLEDGE IS POWER', 'EDUCATION CHANGES LIVES',
        'TEACHERS ARE HEROES', 'STUDENTS ARE FUTURES',

        // Weather & Environment (Thời tiết & Môi trường)
        'THE WEATHER IS NICE TODAY', 'IT IS VERY HOT TODAY', 'IT IS RAINING OUTSIDE',
        'BRING AN UMBRELLA TODAY', 'THE SKY IS CLEAR', 'NATURE IS WONDERFUL',
        'PROTECT OUR ENVIRONMENT', 'SAVE WATER AND ENERGY'
    ];

    // ========== DỮ LIỆU THEO CHỦ ĐỀ ==========
    const TOPICS = {
        'Food': {
            name: t('practice.topicFood'),
            icon: '🍔',
            words: [
                'APPLE', 'BANANA', 'ORANGE', 'RICE', 'BREAD', 'WATER', 'MILK', 'COFFEE', 'TEA',
                'MEAT', 'FISH', 'EGG', 'CHEESE', 'SOUP', 'SALAD', 'PIZZA', 'BURGER', 'NOODLE',
                'VEGETABLE', 'FRUIT', 'JUICE', 'CAKE', 'COOKIE', 'CHICKEN', 'GRAPE', 'LEMON',
                'MANGO', 'PINEAPPLE', 'STRAWBERRY', 'WATERMELON', 'TOMATO', 'ONION', 'GARLIC',
                'POTATO', 'CARROT', 'CABBAGE', 'MUSHROOM', 'CORN', 'BEAN', 'FLOUR', 'SUGAR',
                'BUTTER', 'YOGURT', 'CREAM', 'HONEY', 'SALT', 'PEPPER', 'SPICE', 'OLIVE',
                'RICE', 'PASTA', 'WAFFLE', 'PANCAKE', 'CEREAL', 'OATMEAL', 'BACON', 'SAUSAGE',
                'STEAK', 'HAM', 'TURKEY', 'DUCK', 'LOBSTER', 'SHRIMP', 'CRAB', 'CLAM',
                'MUSSEL', 'OYSTER', 'TUNA', 'SALMON', 'SARDINE', 'ANCHOVY', 'FROG', 'SNAIL',
                'BROCCOLI', 'SPINACH', 'LETTUCE', 'CUCUMBER', 'PEPPER', 'CELERY', 'ASPARAGUS',
                'ARTICHOKE', 'BEET', 'RADISH', 'TURNIP', 'PARSNIP', 'LEEK', 'SCALLION',
                'CHILI', 'GINGER', 'TURMERIC', 'CINNAMON', 'VANILLA', 'CHOCOLATE', 'CARAMEL',
                'JAM', 'JELLY', 'MARMALADE', 'SYRUP', 'POPCORN', 'CHIPS', 'NUTS', 'ALMOND',
                'WALNUT', 'CASHEW', 'PEANUT', 'PISTACHIO', 'SEASONING', 'VINEGAR', 'SAUCE',
                'KETCHUP', 'MUSTARD', 'MAYO', 'RELISH', 'PICKLE', 'OLIVE', 'AVOCADO'
            ],
            sentences: [
                'I AM VERY HUNGRY', 'I WOULD LIKE SOME FOOD', 'THIS FOOD IS DELICIOUS',
                'I LIKE RICE AND VEGETABLES', 'DO YOU WANT TO EAT', 'LET US GO GET FOOD',
                'I NEED A GLASS OF WATER', 'BREAKFAST IS IMPORTANT', 'LUNCH TIME IS AT NOON',
                'DINNER IS AT SIX PM', 'COOK YOUR OWN FOOD', 'FRESH FRUIT IS HEALTHY',
                'I AM A VEGETARIAN', 'I DO NOT EAT MEAT', 'THIS DISH IS VERY SPICY',
                'CAN I HAVE THE RECIPE', 'THE FOOD IS TOO SALTY', 'I PREFER SWEET FOOD',
                'I AM ALLERGIC TO SEAFOOD', 'EAT VEGETABLES EVERYDAY', 'DRINK ENOUGH WATER',
                'HEALTHY FOOD IS IMPORTANT', 'I LOVE EATING PIZZA', 'MY FAVORITE FRUIT IS MANGO',
                'DO YOU LIKE COOKING', 'I AM LEARNING TO COOK', 'THIS CAKE IS VERY SWEET',
                'I USUALLY EAT BREAKFAST AT SEVEN', 'LET US ORDER SOME FOOD', 'I WANT TO TRY SUSHI',
                'THE RESTAURANT HAS GOOD FOOD', 'CAN YOU PASS THE SALT', 'I AM FULL NOW',
                'I USUALLY HAVE COFFEE IN THE MORNING', 'DO YOU PREFER TEA OR COFFEE',
                'I NEED MORE VEGETABLES', 'THE SOUP IS DELICIOUS TODAY', 'I AM MAKING A CAKE',
                'FRESH INGREDIENTS ARE BEST', 'I BUY FOOD AT THE MARKET', 'GROCERIES ARE EXPENSIVE',
                'I AM ON A DIET NOW', 'HOW DO YOU PRONOUNCE THIS FOOD', 'LEARN TO MAKE BREAD',
                'CHINESE FOOD IS VERY POPULAR', 'I ENJOY VIETNAMESE CUISINE', 'I LIKE FRENCH FOOD',
                'ITALIAN PASTA IS MY FAVORITE', 'DO YOU KNOW HOW TO MAKE RICE', 'I LOVE ICE CREAM'
            ]
        },
        'Sport': {
            name: 'Thể thao',
            icon: '⚽',
            words: [
                'RUN', 'SWIM', 'BIKE', 'FOOTBALL', 'BASKETBALL', 'TENNIS', 'BADMINTON', 'GOLF',
                'SOCCER', 'BASEBALL', 'VOLLEYBALL', 'YOGA', 'GYM', 'FIT', 'HEALTHY', 'SPORT',
                'WIN', 'LOSE', 'TEAM', 'PLAY', 'GAME', 'MATCH', 'SCORE', 'GOAL', 'BALL',
                'RACE', 'JUMP', 'DRIBBLE', 'KICK', 'CATCH', 'THROW', 'SERVE', 'DIVE', 'SKATE',
                'SURF', 'CLIMB', 'BOXING', 'WRESTLING', 'KARATE', 'JUDO', 'TAEKWONDO', 'FENCING',
                'ARCHERY', 'SHOOTING', 'HOCKEY', 'RUGBY', 'CRICKET', 'BOWLING', 'POOL', 'DARTS',
                'SKIING', 'SNOWBOARD', 'HIKING', 'CAMPING', 'FISHING', 'HUNTING', 'RIDING',
                'JOGGING', 'WALKING', 'STRETCHING', 'MEDITATION', 'TRAINING', 'COACH', 'PLAYER',
                'FAN', 'STADIUM', 'ARENA', 'OLYMPIC', 'CHAMPION', 'MEDAL', 'TROPHY', 'AWARD',
                'TRAIN', 'EXERCISE', 'MUSCLE', 'STRENGTH', 'SPEED', 'ENDURANCE', 'FLEXIBILITY'
            ],
            sentences: [
                'I LIKE TO PLAY FOOTBALL', 'DO YOU EXERCISE EVERYDAY', 'RUNNING IS GOOD FOR HEALTH',
                'LET US PLAY BASKETBALL', 'MY TEAM WON THE MATCH', 'I GO TO GYM EVERY MORNING',
                'SWIMMING IS GREAT EXERCISE', 'DO YOU LIKE SPORTS', 'PRACTICE MAKES PERFECT',
                'LET US GO TO THE GYM', 'WHO IS YOUR FAVORITE PLAYER', 'I AM A SOCCER FAN',
                'I HAVE A GYM MEMBERSHIP', 'DOING YOGA IS VERY RELAXING', 'I LEARNED TO SWIM LAST YEAR',
                'THE GAME WAS VERY EXCITING', 'OUR TEAM PLAYED VERY WELL', 'CONGRATULATIONS ON YOUR WIN',
                'I WATCHED THE OLYMPIC GAMES', 'DO YOU PLAY TENNIS', 'I PREFER INDIVIDUAL SPORTS',
                'TEAM SPORTS TEACH COOPERATION', 'I HURT MY ANKLE YESTERDAY', 'NEVER GIVE UP',
                'BELIEVE IN YOURSELF', 'STUDY HARD AND PRACTICE', 'EFFORT BRINGS SUCCESS',
                'I AM TRAINING FOR A MARATHON', 'HOW LONG HAVE YOU BEEN RUNNING', 'SPORTS ARE FUN',
                'I ENJOY WATCHING BASKETBALL', 'DO YOU KNOW THE RULES OF SOCCER', 'THE SCORE WAS TIED',
                'I AM A PROFESSIONAL ATHLETE', 'TRAINING IS VERY HARD', 'DO YOU HAVE A PERSONAL COACH',
                'I GOT A NEW SPORTS CAR', 'MY FAVORITE SPORT IS SWIMMING', 'I PREFER WATCHING TO PLAYING',
                'THE ATHLETES ARE VERY TALENTED', 'SPORTS UNITE PEOPLE', 'HEALTH IS MORE IMPORTANT THAN WINNING',
                'I WANT TO LEARN KARATE', 'MARTIAL ARTS BUILD DISCIPLINE', 'I AM A CHAMPION NOW',
                'THE TROPHY IS VERY BEAUTIFUL', 'I TRAIN SIX DAYS A WEEK', 'MY COACH IS VERY STRICT',
                'DO YOU LIKE WATCHING SPORTS', 'I PLAY BADMINTON EVERY WEEKEND', 'BADMINTON IS POPULAR IN ASIA'
            ]
        },
        'Animal': {
            name: 'Động vật',
            icon: '🐕',
            words: [
                'DOG', 'CAT', 'BIRD', 'FISH', 'HORSE', 'COW', 'PIG', 'SHEEP', 'GOAT', 'CHICKEN',
                'DUCK', 'RABBIT', 'MOUSE', 'SNAKE', 'LION', 'TIGER', 'ELEPHANT', 'MONKEY', 'BEAR',
                'ZEBRA', 'GIRAFFE', 'DEER', 'FOX', 'WOLF', 'EAGLE', 'PARROT', 'TURTLE', 'FROG',
                'BUTTERFLY', 'BEE', 'SPIDER', 'ANT', 'SHARK', 'WHALE', 'DOLPHIN', 'CRAB', 'OCTOPUS',
                'JELLYFISH', 'PENGUIN', 'KANGAROO', 'KOALA', 'PANDA', 'LEOPARD', 'CHEETAH', 'HIPPO',
                'RHINO', 'GORILLA', 'CROCODILE', 'ALLIGATOR', 'OSTRICH', 'PEACOCK', 'HAWK', 'OWL',
                'BAT', 'SQUIRREL', 'BEAVER', 'OTTER', 'SKUNK', 'RACCOON', 'MOOSE', 'BUFFALO',
                'CAMEL', 'LLAMA', 'DONKEY', 'MULE', 'GOOSE', 'TURKEY', 'PIGEON', 'CROW', 'SPARROW',
                'PELICAN', 'FLAMINGO', 'SEAGULL', 'SWAN', 'DOVE', 'HAMSTER', 'GUINEA_PIG', 'FERRET'
            ],
            sentences: [
                'I HAVE A PET DOG', 'CATS ARE CUTE', 'DO YOU LIKE ANIMALS', 'BIRDS CAN FLY',
                'FISH LIVE IN WATER', 'HORSES ARE BEAUTIFUL', 'WILDLIFE IS IMPORTANT',
                'PROTECT ENDANGERED ANIMALS', 'ZOO HAS MANY ANIMALS', 'MY CAT LOVES TO SLEEP',
                'DOGS ARE LOYAL FRIENDS', 'I FEED MY PET EVERYDAY', 'ANIMALS NEED OUR CARE',
                'I SAW A LION AT THE ZOO', 'WHALES ARE MAMMALS TOO', 'BUTTERFLIES ARE COLORFUL',
                'THE EAGLE FLIES VERY HIGH', 'I LOVE WATCHING DOLPHINS', 'SNAKES CAN BE DANGEROUS',
                'TURTLES LIVE VERY LONG', 'I FOUND A BIRD OUTSIDE', 'DO YOU HAVE A PET AT HOME',
                'I WANT TO BE A VETERINARIAN', 'ANIMALS CAN COMMUNICATE', 'MY DOG IS VERY PLAYFUL',
                'CATS LIKE TO HUNT MICE', 'THE ELEPHANT IS THE LARGEST LAND ANIMAL', 'GIRAFFES HAVE LONG NECKS',
                'PANDAS EAT BAMBOO', 'KANGAROOS LIVE IN AUSTRALIA', 'PENGUINS CANNOT FLY',
                'FROGS LIVE NEAR WATER', 'BATS ARE NOCTURNAL ANIMALS', 'SEAHORSES ARE UNIQUE CREATURES',
                'I AM ALLERGIC TO CATS', 'I DO NOT LIKE SPIDERS', 'BUTTERFLIES START AS CATERPILLARS',
                'WILD ANIMALS ARE DANGEROUS', 'WE SHOULD PROTECT WILDLIFE', 'ANIMAL TESTING IS WRONG',
                'I VOLUNTEER AT ANIMAL SHELTER', 'ADOPT A PET FROM SHELTER', 'MY RABBIT IS VERY SOFT',
                'GOLDFISH ARE EASY TO CARE FOR', 'I VISITED THE AQUARIUM TODAY', 'MARINE LIFE IS AMAZING',
                'I LEARNED ABOUT ENDANGERED SPECIES', 'DEFORESTATION AFFECTS ANIMALS', 'CONSERVATION IS IMPORTANT'
            ]
        },
        'Weather': {
            name: 'Thời tiết',
            icon: '☀️',
            words: [
                'SUN', 'MOON', 'STAR', 'SKY', 'CLOUD', 'RAIN', 'SNOW', 'WIND', 'STORM', 'HOT',
                'COLD', 'WARM', 'COOL', 'SUNNY', 'CLOUDY', 'RAINY', 'WINDY', 'SNOWY', 'FOGGY',
                'RAINBOW', 'THUNDER', 'LIGHTNING', 'TEMPERATURE', 'DEGREE', 'SEASON', 'SPRING',
                'SUMMER', 'AUTUMN', 'WINTER', 'HUMID', 'DRY', 'WEATHER', 'FORECAST', 'UMBRELLA',
                'MIST', 'HAIL', 'SLEET', 'DRIZZLE', 'DOWNPOUR', 'TORNADO', 'HURRICANE', 'CYCLONE',
                'MONSOON', 'BLIZZARD', 'AVALANCHE', 'FLOOD', 'DROUGHT', 'HEATWAVE', 'COLDWAVE',
                'SUNRISE', 'SUNSET', 'SUNSHINE', 'MOONLIGHT', 'DAWN', 'DUSK', 'MIDNIGHT', 'NOON',
                'BREEZE', 'GUST', 'GALE', 'TYPHOON', 'PRESSURE', 'HUMIDITY', 'PRECIPITATION'
            ],
            sentences: [
                'THE WEATHER IS NICE TODAY', 'IT IS VERY HOT TODAY', 'IT IS RAINING OUTSIDE',
                'BRING AN UMBRELLA TODAY', 'THE SKY IS CLEAR', 'NATURE IS WONDERFUL',
                'TODAY IS A SUNNY DAY', 'WINTER IS VERY COLD', 'SUMMER IS VERY HOT',
                'DO YOU LIKE RAINY WEATHER', 'WHAT IS THE TEMPERATURE', 'THE WIND IS STRONG TODAY',
                'I HOPE IT WILL BE SUNNY TOMORROW', 'THE WEATHER FORECAST SAYS RAIN', 'SNOW IS FALLING HEAVILY',
                'WE HAD A STORM LAST NIGHT', 'THE RAINBOW IS VERY BEAUTIFUL', 'I LOVE WATCHING SUNSET',
                'IT IS HUMID TODAY', 'THE AIR IS FRESH AFTER RAIN', 'WHAT SEASON DO YOU LIKE BEST',
                'SPRING IS THE SEASON OF NEW BEGINNINGS', 'AUTUMN LEAVES ARE COLORFUL', 'IT IS FREEZING COLD',
                'THE WEATHER CHANGES FREQUENTLY', 'DO YOU LIKE HOT WEATHER', 'I PREFER MILD CLIMATE',
                'WE HAD A HEATWAVE LAST WEEK', 'THE THUNDER WAS VERY LOUD', 'I SAW LIGHTNING IN THE SKY',
                'FOG MAKES DRIVING DIFFICULT', 'WINTER IS COMING SOON', 'SUMMER VACATION IS APPROACHING',
                'THE WEATHER IS UNPREDICTABLE', 'I LIKE BREEZY DAYS', 'THE SKY IS FULL OF STARS TONIGHT',
                'WHEN DOES MONSOON SEASON START', 'WE NEED RAIN FOR THE CROPS', 'EXTREME WEATHER IS DANGEROUS',
                'CLIMATE CHANGE AFFECTS WEATHER', 'I ENJOY ALL FOUR SEASONS', 'THE TEMPERATURE DROPPED SUDDENLY'
            ]
        },
        'Family': {
            name: 'Gia đình',
            icon: '👨‍👩‍👧‍👦',
            words: [
                'MOTHER', 'FATHER', 'PARENT', 'BROTHER', 'SISTER', 'SIBLING', 'SON', 'DAUGHTER',
                'FAMILY', 'MAN', 'WOMAN', 'CHILD', 'CHILDREN', 'BOY', 'GIRL', 'BABY', 'KID',
                'GRANDMOTHER', 'GRANDFATHER', 'UNCLE', 'AUNT', 'MOM', 'DAD', 'COUSIN', 'NIECE',
                'NEPHEW', 'MARRIED', 'MARRIAGE', 'WEDDING', 'DIVORCE', 'TWIN', 'TRIPLET', 'STEP',
                'HALF', 'ADOPT', 'FOSTER', 'ORPHAN', 'WIDOW', 'WIDOWER', 'SINGLE', 'ENGAGED',
                'HUSBAND', 'WIFE', 'SPOUSE', 'PARTNER', 'BRIDE', 'GROOM', 'BEST_MAN', 'BRIDESMAID',
                'IN_LAW', 'SON_IN_LAW', 'DAUGHTER_IN_LAW', 'BROTHER_IN_LAW', 'SISTER_IN_LAW',
                'GRANDCHILD', 'GREAT_GRANDMOTHER', 'GREAT_GRANDFATHER', 'ANCESTOR', 'DESCENDANT'
            ],
            sentences: [
                'I LOVE MY FAMILY', 'MY MOTHER AND FATHER', 'I HAVE TWO SIBLINGS', 'MY BEST FRIEND IS HERE',
                'FAMILY IS VERY IMPORTANT', 'SPEND TIME WITH LOVED ONES', 'WE ARE ALL CONNECTED',
                'FRIENDSHIP IS PRECIOUS', 'MY MOM IS A TEACHER', 'MY DAD WORKS IN AN OFFICE',
                'DO YOU HAVE BROTHERS OR SISTERS', 'I LIVE WITH MY FAMILY', 'GRANDPARENTS ARE SPECIAL',
                'I AM THE OLDEST CHILD', 'I HAVE A YOUNGER SISTER', 'MY COUSIN IS MY AGE',
                'MY UNCLE LIVES IN THE CITY', 'AUNT SARAH IS COMING TO VISIT', 'I MISS MY FAMILY VERY MUCH',
                'MY PARENTS ARE VERY SUPPORTIVE', 'I CALL MY MOM EVERYDAY', 'MY DAD TAUGHT ME TO DRIVE',
                'WE HAVE A BIG FAMILY GATHERING', 'MY GRANDMOTHER COOKS DELICIOUS FOOD', 'MY GRANDFATHER TELLS GREAT STORIES',
                'MY SISTER IS GETTING MARRIED', 'THE WEDDING IS NEXT MONTH', 'I AM THE BRIDESMAID',
                'DO YOU BELIEVE IN LOVE AT FIRST SIGHT', 'MY HUSBAND IS VERY CARING', 'MY WIFE IS BEAUTIFUL',
                'I AM LOOKING FORWARD TO BEING A FATHER', 'CHILDREN BRING JOY TO FAMILY', 'PARENTING IS CHALLENGING',
                'I RESPECT MY ELDERS', 'FAMILY VALUES ARE IMPORTANT', 'MY AUNT IS A DOCTOR',
                'I HAVE A LARGE EXTENDED FAMILY', 'FAMILY REUNIONS ARE FUN', 'WE CELEBRATE HOLIDAYS TOGETHER',
                'MY SIBLINGS ARE MY BEST FRIENDS', 'I AM GRATEFUL FOR MY FAMILY', 'PROTECT YOUR LOVED ONES'
            ]
        },
        'Colors': {
            name: 'Màu sắc',
            icon: '🎨',
            words: [
                'RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'PINK', 'BROWN', 'BLACK', 'WHITE',
                'GRAY', 'GREY', 'GOLD', 'SILVER', 'COLOR', 'RAINBOW', 'DARK', 'LIGHT', 'BRIGHT',
                'PALE', 'DEEP', 'SOFT', 'VIVID', 'DULL', 'NEON', 'PASTEL', 'VIOLET', 'INDIGO',
                'TURQUOISE', 'TEAL', 'MAROON', 'NAVY', 'BEIGE', 'CREAM', 'CORAL', 'SALMON',
                'LILAC', 'MAUVE', 'BURGUNDY', 'CHARCOAL', 'IVORY', 'OLIVE', 'AMBER', 'BRONZE',
                'COPPER', 'CRIMSON', 'PLUM', 'CERULEAN', 'SIENNA', 'SEPIA', 'TAN', 'SANGUINE',
                'AQUA', 'AZURE', 'CARMINE', 'CERISE', 'CHARTREUSE', 'EAU_DE_NIL', 'FUCHSIA', 'GAINSBORO'
            ],
            sentences: [
                'MY FAVORITE COLOR IS BLUE', 'RED IS THE COLOR OF LOVE', 'THE SKY IS BLUE',
                'I WEAR BLACK CLOTHES', 'YELLOW IS A HAPPY COLOR', 'I SEE A RAINBOW',
                'GREEN IS THE COLOR OF NATURE', 'ORANGE JUICE IS DELICIOUS', 'THE FLOWER IS PINK',
                'I LIKE ALL COLORS', 'WHAT IS YOUR FAVORITE COLOR', 'THE APPLE IS RED',
                'PAINT THE WALL WHITE', 'I PREFER DARK COLORS', 'BRIGHT COLORS MAKE ME HAPPY',
                'THE ROOM IS LIGHT BLUE', 'SHE WORE A PURPLE DRESS', 'HIS EYES ARE GREEN',
                'I BOUGHT A NEW CAR YESTERDAY', 'THE SUN IS ORANGE AT SUNSET', 'I LIKE PASTEL COLORS',
                'NEON COLORS ARE TRENDY', 'I AM WEARING A RED SHIRT', 'THE PAINTING HAS MANY COLORS',
                'DO YOU LIKE BRIGHT COLORS', 'I PREFER NEUTRAL TONES', 'THE FLAGS HAVE DIFFERENT COLORS',
                'COLOR BLINDNESS IS COMMON', 'I AM LEARNING ABOUT COLOR THEORY', 'WARM COLORS AND COOL COLORS',
                'THE RAINBOW HAS SEVEN COLORS', 'I LIKE THE COLOR OF YOUR EYES', 'MY ROOM IS DECORATED WITH BLUE',
                'I WEAR COLORED LENSES SOMETIMES', 'BLACK AND WHITE IS A CLASSIC COMBINATION', 'WHAT DOES THE COLOR RED MEAN TO YOU',
                'I AM GOOD AT COLORING', 'COLOR COORDINATION IS IMPORTANT IN FASHION', 'I LOVE THE FALL COLORS OF LEAVES'
            ]
        },
        'Numbers': {
            name: 'Số đếm',
            icon: '🔢',
            words: [
                'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN',
                'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN',
                'NINETEEN', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY',
                'HUNDRED', 'THOUSAND', 'MILLION', 'BILLION', 'TRILLION', 'ZERO', 'FIRST', 'SECOND',
                'THIRD', 'FOURTH', 'FIFTH', 'SIXTH', 'SEVENTH', 'EIGHTH', 'NINTH', 'TENTH', 'ELEVENTH',
                'LAST', 'NEXT', 'MANY', 'FEW', 'SOME', 'ALL', 'NUMBER', 'COUNT', 'TOTAL', 'SUM',
                'DOUBLE', 'TRIPLE', 'HALF', 'QUARTER', 'THIRD', 'PAIR', 'COUPLE', 'DOZEN', 'SCORE',
                'ODD', 'EVEN', 'PRIME', 'INTEGER', 'DECIMAL', 'FRACTION', 'PERCENT', 'PERCENTAGE'
            ],
            sentences: [
                'I HAVE TWO BROTHERS', 'THERE ARE FIVE APPLES', 'COUNT FROM ONE TO TEN',
                'WHAT IS YOUR PHONE NUMBER', 'HOW MANY PEOPLE ARE HERE', 'I AM THE FIRST CHILD',
                'THERE ARE TWENTY STUDENTS', 'ZERO IS NOT A POSITIVE NUMBER', 'MY BIRTHDAY IS ON THE FIFTEENTH',
                'I NEED FIVE DOLLARS', 'TEN IS A ROUND NUMBER', 'HOW MUCH IS THIS',
                'I HAVE BEEN HERE FOR THREE YEARS', 'THERE ARE HUNDRED BOOKS IN THE LIBRARY', 'A THOUSAND GRAINS OF RICE',
                'THE POPULATION IS MILLIONS', 'I AM NUMBER ONE', 'THAT IS THE LAST CHANCE',
                'WHAT IS TWELVE TIMES TWELVE', 'THE PERCENTAGE IS VERY HIGH', 'HALF OF THE PIE IS GONE',
                'DOUBLE THE RECIPE PLEASE', 'I ATE A COUPLE OF COOKIES', 'I BOUGHT A DOZEN EGGS',
                'THE EVEN NUMBERS ARE DIVISIBLE BY TWO', 'THREE IS MY LUCKY NUMBER', 'I COUNTED TO A HUNDRED',
                'WHAT NUMBER ARE YOU THINKING OF', 'THE TOTAL IS MORE THAN EXPECTED', 'THERE IS NO NUMBER BIGGER THAN LOVE',
                'I WILL BE THERE IN FIVE MINUTES', 'THE FIRST STEP IS THE HARDEST', 'YOU ARE MY NUMBER ONE PRIORITY',
                'THAT IS THE THIRD TIME TODAY', 'I HAVE ONLY A FEW LEFT', 'MANY PEOPLE AGREE WITH THIS',
                'ALL STUDENTS MUST ATTEND', 'HOW MANY MORE DO YOU NEED', 'ALMOST ALL OF THEM CAME'
            ]
        },
        'Emotion': {
            name: 'Cảm xúc',
            icon: '😊',
            words: [
                'HAPPY', 'SAD', 'ANGRY', 'CALM', 'EXCITED', 'SCARED', 'PROUD', 'SHY', 'BRAVE',
                'AFRAID', 'WORRIED', 'ANXIOUS', 'GRATEFUL', 'HOPEFUL', 'LONELY', 'TIRED',
                'ENERGETIC', 'LOVE', 'HATE', 'LIKE', 'DISLIKE', 'ENJOY', 'FEAR', 'BELIEVE',
                'TRUST', 'JEALOUS', 'SURPRISED', 'CONFUSED', 'FRUSTRATED', 'RELAXED', 'EMOTION',
                'FEELING', 'MOOD', 'SMILE', 'CRY', 'LAUGH', 'FROWN', 'GROAN', 'SIGH', 'YAWN',
                'EXPRESS', 'MOOD', 'PASSION', 'DESIRE', 'DREAM', 'HOPE', 'DESPERATE', 'MISERABLE',
                'PLEASED', 'DELIGHTED', 'ECSTATIC', 'CHEERFUL', 'MELANCHOLY', 'HEARTBROKEN', 'OVERJOYED',
                'NERVOUS', 'STRESSED', 'OVERWHELMED', 'BITTERSWEET', 'RESTLESS', 'PEACEFUL', 'SERENE'
            ],
            sentences: [
                'I AM HAPPY TODAY', 'I FEEL VERY SAD', 'DO NOT BE AFRAID', 'EVERYTHING WILL BE OKAY',
                'STAY POSITIVE AND BRAVE', 'I BELIEVE IN YOU', 'KEEP YOUR SPIRIT UP', 'YOU ARE DOING GREAT',
                'I AM EXCITED ABOUT THIS', 'I AM WORRIED ABOUT THAT', 'I AM SO GRATEFUL FOR YOUR HELP',
                'DO NOT GIVE UP', 'STAY STRONG AND CALM', 'I ENJOY SPENDING TIME WITH YOU',
                'I AM SO PROUD OF YOU', 'WHY ARE YOU ANGRY', 'I UNDERSTAND HOW YOU FEEL',
                'IT IS OKAY TO CRY SOMETIMES', 'SMILE MORE OFTEN', 'LAUGHTER IS THE BEST MEDICINE',
                'I AM FEELING A LITTLE STRESSED', 'I FEEL SO RELAXED TODAY', 'THIS MAKES ME VERY HAPPY',
                'I AM SO GRATEFUL FOR EVERYTHING', 'I AM EXCITED FOR THE TRIP', 'I WAS SURPRISED BY THE NEWS',
                'I FEEL A LITTLE ANXIOUS', 'DO NOT BE SHY', 'SPEAK UP AND BE BRAVE',
                'I AM NERVOUS ABOUT THE INTERVIEW', 'THE RESULT MADE ME VERY SAD', 'I AM OVERWHELMED WITH WORK',
                'I AM HOPEFUL ABOUT THE FUTURE', 'I AM SO PROUD OF MY ACHIEVEMENT', 'THIS IS MY DREAM COME TRUE',
                'I FEEL SO BLESSED RIGHT NOW', 'I MISS YOU SO MUCH', 'I AM SO EXCITED TO SEE YOU',
                'THE MOVIE MADE ME CRY', 'I COULD NOT STOP LAUGHING', 'I AM FEELING A BIT STRESSED TODAY'
            ]
        },
        'Greeting': {
            name: 'Chào hỏi',
            icon: '👋',
            words: [
                'HELLO', 'HI', 'HEY', 'GOODBYE', 'BYE', 'WELCOME', 'GREETING', 'PLEASE', 'THANK',
                'SORRY', 'YES', 'NO', 'OKAY', 'ALRIGHT', 'CHEERS', 'APOLOGIZE', 'EXCUSE', 'MORNING',
                'AFTERNOON', 'EVENING', 'NIGHT', 'LEAVE', 'MEET', 'SEE', 'AGAIN', 'GREET', 'SALUTE',
                'HANDSAKE', 'WAVE', 'HUG', 'KISS', 'BOW', 'NOD', 'WAVE', 'NICE', 'PLEASURE',
                'TOAST', 'CHEERS', 'CONGRATULATIONS', 'WELCOME_BACK', 'GOOD_LUCK', 'TAKE_CARE',
                'SEE_YOU_SOON', 'SEE_YOU_LATER', 'UNTIL_NEXT_TIME', 'FAREWELL', 'BONJOUR', 'CIAO',
                'ADIOS', 'ALOHA', 'NAMASTE', 'SAWUBONA', 'MERHABA', 'OLAH', 'BONSOIR', 'BUENAS_DIAS'
            ],
            sentences: [
                'GOOD MORNING TO YOU', 'HOW ARE YOU TODAY', 'I AM FINE THANK YOU',
                'NICE TO SEE YOU', 'WELCOME TO OUR CLASS', 'HAPPY TO MEET YOU',
                'HAVE A NICE DAY', 'SEE YOU LATER', 'SEE YOU TOMORROW', 'TAKE CARE OF YOURSELF',
                'SLEEP WELL TONIGHT', 'GOOD NIGHT AND GOODBYE', 'THANK YOU VERY MUCH',
                'HOW HAVE YOU BEEN', 'I HAVE NOT SEEN YOU IN A LONG TIME', 'WELCOME HOME',
                'CONGRATULATIONS ON YOUR SUCCESS', 'GOOD LUCK WITH YOUR EXAM', 'BEST WISHES FOR YOU',
                'HOW DO YOU DO', 'PLEASED TO MEET YOU', 'IT IS NICE TO MEET YOU',
                'HOPE TO SEE YOU AGAIN SOON', 'TAKE CARE AND STAY SAFE', 'UNTIL NEXT TIME',
                'I AM GLAD TO SEE YOU HERE', 'WHAT A NICE SURPRISE', 'I MISSED YOU SO MUCH',
                'WELCOME TO OUR HOME', 'MAKING YOUR ACQUAINTANCE', 'PLEASE MAKE YOURSELF COMFORTABLE',
                'CHEERS TO YOUR HEALTH', 'HERE IS TO YOUR SUCCESS', 'HOPE YOU ARE FEELING BETTER NOW',
                'WELCOME BACK MISSED YOU', 'HAVE A WONDERFUL DAY', 'WISHING YOU ALL THE BEST'
            ]
        },
        'Health': {
            name: 'Sức khỏe',
            icon: '🏥',
            words: [
                'HEALTH', 'SICK', 'HEALTHY', 'WELL', 'PAIN', 'HURT', 'ACHE', 'FEVER', 'COLD', 'FLU',
                'DOCTOR', 'NURSE', 'HOSPITAL', 'MEDICINE', 'VACCINE', 'TREATMENT', 'SURGERY', 'PATIENT',
                'SYMPTOM', 'DIAGNOSIS', 'PRESCRIPTION', 'PHARMACY', 'APPOINTMENT', 'CLINIC', 'EMERGENCY',
                'HEADACHE', 'STOMACHACHE', 'BACKACHE', 'TOOTHACHE', 'EARACHE', 'COUGH', 'SNEEZE', 'SNEEZING',
                'VOMIT', 'DIARRHEA', 'CONSTIPATION', 'ALLERGY', 'INFECTION', 'VIRUS', 'BACTERIA', 'DISEASE',
                'DIABETES', 'CANCER', 'ASTHMA', 'HEART', 'BLOOD', 'PRESSURE', 'CHOLESTEROL', 'IMMUNE',
                'VITAMIN', 'MINERAL', 'PROTEIN', 'FIBER', 'SUPPLEMENT', 'EXERCISE', 'DIET', 'SLEEP',
                'REST', 'RECOVERY', 'HEALING', 'THERAPY', 'COUNSELING', 'THERAPIST', 'PSYCHOLOGIST'
            ],
            sentences: [
                'I AM NOT FEELING WELL TODAY', 'I HAVE A BAD HEADACHE', 'I NEED TO SEE A DOCTOR',
                'TAKE YOUR MEDICINE ON TIME', 'DRINK LOTS OF WATER', 'GET ENOUGH SLEEP EVERY NIGHT',
                'EATING HEALTHY IS IMPORTANT', 'EXERCISE REGULARLY TO STAY FIT', 'I HAVE A MEDICAL APPOINTMENT TOMORROW',
                'DO YOU HAVE ANY ALLERGIES', 'I AM ALLERGIC TO PENICILLIN', 'THE DOCTOR PRESCRIBED SOME MEDICINE',
                'I AM RECOVERING FROM ILLNESS', 'PREVENTION IS BETTER THAN CURE', 'MENTAL HEALTH IS JUST AS IMPORTANT',
                'I AM FEELING MUCH BETTER NOW', 'HOW CAN I IMPROVE MY HEALTH', 'I HAVE BEEN EXERCISING EVERYDAY',
                'A BALANCED DIET IS KEY', 'VITAMINS ARE GOOD FOR YOU', 'I HATE GOING TO THE HOSPITAL',
                'THE NURSE IS VERY CARING', 'I GOT MY FLU SHOT TODAY', 'DO NOT OVERWORK YOURSELF',
                'I HAD A HEALTH CHECKUP YESTERDAY', 'MY BLOOD PRESSURE IS NORMAL', 'I NEED TO REDUCE STRESS',
                'SMOKING IS BAD FOR YOUR HEALTH', 'ALCOHOL IS HARMFUL IN EXCESS', 'TAKE CARE OF YOUR BODY',
                'I AM ON A SPECIAL DIET NOW', 'FRUITS AND VEGETABLES ARE ESSENTIAL', 'SUGAR IS BAD FOR YOUR TEETH',
                'I HAVE BEEN SLEEPING WELL LATELY', 'YOGA HELPS ME RELAX', 'I VISITED THE PHARMACY FOR MEDICINE',
                'IS THIS MEDICINE SAFE FOR CHILDREN', 'HOW OFTEN SHOULD I TAKE THIS', 'I HAVE A FEVER OF THIRTY_NINE DEGREES',
                'I FEEL DIZZY SOMETIMES', 'MY STOMACH HURTS', 'I CANNOT SLEEP WELL RECENTLY'
            ]
        },
        'School': {
            name: 'Trường học',
            icon: '🏫',
            words: [
                'SCHOOL', 'STUDENT', 'TEACHER', 'CLASS', 'LESSON', 'SUBJECT', 'COURSE', 'GRADE', 'SCORE',
                'EXAM', 'TEST', 'HOMEWORK', 'ASSIGNMENT', 'PROJECT', 'PRESENTATION', 'LECTURE', 'SEMINAR',
                'BOOK', 'NOTEBOOK', 'PEN', 'PENCIL', 'ERASER', 'RULER', 'PROTRACTOR', 'COMPASS', 'CALCULATOR',
                'DESK', 'CHAIR', 'BOARD', 'CHALK', 'MARKER', 'PROJECTOR', 'SCREEN', 'LIBRARY', 'LABORATORY',
                'UNIFORM', 'BAG', 'BACKPACK', 'SCHOOL_BUS', 'PRINCIPAL', 'PRINCIPAL', 'TEACHER', 'CLASSMATE',
                'SCHOOLYEAR', 'SEMESTER', 'TERM', 'WEEKLY', 'DAILY', 'SCHEDULE', 'TIMETABLE', 'CALENDAR',
                'UNIVERSITY', 'COLLEGE', 'DEGREE', 'BACHELOR', 'MASTER', 'DOCTORATE', 'SCHOLARSHIP', 'GRANT',
                'ATTENDANCE', 'ABSENT', 'PRESENT', 'TARDY', 'EXCUSE', 'PERMISSION', 'SCHOOL_RULES'
            ],
            sentences: [
                'I GO TO SCHOOL EVERYDAY', 'MY TEACHER IS VERY KIND', 'I HAVE A MATH TEST TOMORROW',
                'I FINISHED MY HOMEWORK ALREADY', 'THE EXAM WAS VERY DIFFICULT', 'I GOT A GOOD GRADE ON MY PROJECT',
                'I AM STUDYING FOR THE FINAL EXAM', 'CAN YOU HELP ME WITH MY HOMEWORK', 'WHAT SUBJECT DO YOU LIKE BEST',
                'I HAVE A PRESENTATION NEXT WEEK', 'THE LIBRARY IS VERY QUIET', 'I BORROWED SOME BOOKS FROM THE LIBRARY',
                'I SIT NEXT TO MY BEST FRIEND IN CLASS', 'THE SCHOOL YEAR ENDS IN JUNE', 'I AM LOOKING FORWARD TO GRADUATION',
                'I WANT TO GO TO UNIVERSITY', 'MY MAJOR IS COMPUTER SCIENCE', 'I AM PREPARING FOR THE SCHOLARSHIP EXAM',
                'ATTENDANCE IS MANDATORY', 'I WAS ABSENT FROM SCHOOL YESTERDAY', 'PLEASE EXCUSE MY LATENESS',
                'THE TEACHER EXPLAINED THE LESSON VERY WELL', 'I DO NOT UNDERSTAND THIS TOPIC', 'CAN YOU REPEAT PLEASE',
                'I LOVE LEARNING NEW THINGS', 'EDUCATION IS THE KEY TO SUCCESS', 'I AM A HONOR STUDENT',
                'THE SCHOOL PRINCIPAL GAVE A SPEECH', 'I JOINED THE DEBATE CLUB', 'EXTRA_CURRICULAR ACTIVITIES ARE IMPORTANT',
                'I AM WRITING MY THESIS NOW', 'THE DEADLINE IS NEXT FRIDAY', 'I NEED MORE TIME TO COMPLETE THIS',
                'SCHOOL UNIFORM IS REQUIRED', 'I TAKE THE SCHOOL BUS TO SCHOOL', 'MY BACKPACK IS VERY HEAVY',
                'DO YOU LIKE YOUR SCHOOL', 'I AM IN THE TOP TEN OF MY CLASS', 'I AM A NEW STUDENT HERE',
                'WELCOME TO OUR SCHOOL', 'WHERE IS THE PRINCIPAL OFFICE', 'I FORGOT MY TEXTBOOK AT HOME'
            ]
        },
        'Job': {
            name: 'Công việc',
            icon: '💼',
            words: [
                'JOB', 'WORK', 'CAREER', 'PROFESSION', 'OCCUPATION', 'EMPLOYEE', 'EMPLOYER', 'BOSS', 'MANAGER',
                'DIRECTOR', 'COORDINATOR', 'SPECIALIST', 'ANALYST', 'CONSULTANT', 'ENGINEER', 'DEVELOPER',
                'DESIGNER', 'ACCOUNTANT', 'LAWYER', 'DOCTOR', 'NURSE', 'TEACHER', 'REPORTER', 'JOURNALIST',
                'ARTIST', 'WRITER', 'SINGER', 'ACTOR', 'PHOTOGRAPHER', 'ARCHITECT', 'SCIENTIST', 'RESEARCHER',
                'SECRETARY', 'RECEPTIONIST', 'SALESMAN', 'CLERK', 'DRIVER', 'PILOT', 'BAKER', 'CHEF',
                'SALARY', 'INCOME', 'BONUS', 'RAISE', 'PROMOTION', 'RESIGN', 'RETIRE', 'FIRED', 'HIRE',
                'INTERVIEW', 'RESUME', 'CV', 'SKILL', 'EXPERIENCE', 'QUALIFICATION', 'CERTIFICATE', 'TRAINING',
                'OFFICE', 'MEETING', 'DEADLINE', 'PROJECT', 'REPORT', 'PRESENTATION', 'BUSINESS', 'CLIENT'
            ],
            sentences: [
                'I AM LOOKING FOR A NEW JOB', 'I WORK AT A BIG COMPANY', 'MY BOSS IS VERY DEMANDING',
                'I GOT A PROMOTION LAST MONTH', 'I AM SATISFIED WITH MY SALARY', 'I NEED A RAISE',
                'I HANDED IN MY RESIGNATION', 'I WAS LET GO FROM MY JOB', 'THEY HIRED A NEW EMPLOYEE',
                'I HAVE AN INTERVIEW TOMORROW', 'I PREPARED MY RESUME CAREFULLY', 'WHAT ARE YOUR STRENGTHS',
                'I HAVE FIVE YEARS OF EXPERIENCE', 'COMMUNICATION SKILLS ARE IMPORTANT', 'I AM A HARD WORKER',
                'I WORK FROM NINE TO FIVE', 'I HAD A MEETING WITH MY CLIENT', 'THE DEADLINE IS NEXT WEEK',
                'I AM WORKING ON A NEW PROJECT', 'I FINISHED MY WORK EARLY TODAY', 'I NEED TO WORK OVERTIME',
                'MY WORK IS VERY CHALLENGING BUT REWARDING', 'I LOVE WHAT I DO', 'I AM CONSIDERING A CAREER CHANGE',
                'I AM A FREELANCE WRITER', 'I WORK AS A TRANSLATOR', 'I DREAM OF BECOMING A DOCTOR',
                'THE INTERVIEW WENT VERY WELL', 'I AM NERVOUS ABOUT MY FIRST DAY', 'I JUST STARTED THIS JOB',
                'I HAVE BEEN WORKING HERE FOR TWO YEARS', 'I AM RESPONSIBLE FOR THIS PROJECT', 'I REPORT TO MY MANAGER',
                'TEAMWORK IS ESSENTIAL IN MY JOB', 'I ATTENDED A TRAINING SESSION TODAY', 'I EARNED A NEW CERTIFICATE',
                'THE JOB MARKET IS COMPETITIVE', 'I AM NETWORKING WITH PROFESSIONALS', 'I VALUE WORK_LIFE BALANCE'
            ]
        },
        'Time': {
            name: 'Thời gian',
            icon: '⏰',
            words: [
                'TIME', 'TODAY', 'TOMORROW', 'YESTERDAY', 'NOW', 'THEN', 'LATER', 'SOON', 'EARLY', 'LATE',
                'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'MIDNIGHT', 'NOON', 'DAWN', 'DUSK', 'SUNRISE', 'SUNSET',
                'DAY', 'WEEK', 'MONTH', 'YEAR', 'HOUR', 'MINUTE', 'SECOND', 'MOMENT', 'INSTANT', 'FOREVER',
                'TEMPORARY', 'PERMANENT', 'SCHEDULE', 'APPOINTMENT', 'CALENDAR', 'CLOCK', 'WATCH', 'TIMER',
                'ALARM', 'DEADLINE', 'DUE', 'PAST', 'PRESENT', 'FUTURE', 'HISTORY', 'GENERATION', 'CENTURY',
                'MILLENNIUM', 'DECADE', 'ANNIVERSARY', 'BIRTHDAY', 'HOLIDAY', 'VACATION', 'WEEKEND', 'WEEKDAY',
                'DAYTIME', 'NIGHTTIME', 'RUSH_HOUR', 'PRIME_TIME', 'LIFETIME', 'CHILDHOOD', 'ADULTHOOD', 'SENIOR'
            ],
            sentences: [
                'WHAT TIME IS IT NOW', 'I WILL SEE YOU TOMORROW', 'YESTERDAY WAS A BUSY DAY',
                'WE HAVE NO TIME TO WASTE', 'TIME FLIES VERY FAST', 'I AM RUNNING OUT OF TIME',
                'PLEASE BE ON TIME FOR THE MEETING', 'I HAVE BEEN WAITING FOR AN HOUR', 'THIS TAKES A LONG TIME',
                'I WILL FINISH IT IN FIVE MINUTES', 'SEE YOU NEXT WEEK', 'I HAVE AN APPOINTMENT AT THREE PM',
                'WHAT DAY IS IT TODAY', 'THE NEW YEAR STARTS IN JANUARY', 'MY BIRTHDAY IS COMING SOON',
                'I CELEBRATE MY ANNIVERSARY IN JUNE', 'TIME IS MONEY', 'BETTER LATE THAN NEVER',
                'I HAVE BEEN HERE SINCE MORNING', 'WE WILL MEET AGAIN SOON', 'THIS MOMENT IS PRECIOUS',
                'I REMEMBER THE GOOD OLD TIMES', 'LOOKING FORWARD TO THE FUTURE', 'HISTORY REPEATS ITSELF',
                'THIS IS MY TIME TO SHINE', 'I DO NOT HAVE TIME RIGHT NOW', 'CAN WE RESCHEDULE FOR LATER',
                'I WORK LONG HOURS EVERYDAY', 'I NEED MORE TIME TO THINK', 'TIME HEALS ALL WOUNDS',
                'I AM MAKING UP FOR LOST TIME', 'EVERY MOMENT COUNTS', 'TIME WAITS FOR NO ONE',
                'DO YOU HAVE TIME TO TALK', 'I SPENT THREE HOURS ON THIS', 'IT WILL BE WORTH THE WAIT'
            ]
        },
        'Place': {
            name: 'Địa điểm',
            icon: '🏠',
            words: [
                'HOME', 'HOUSE', 'APARTMENT', 'ROOM', 'KITCHEN', 'BEDROOM', 'BATHROOM', 'LIVING_ROOM',
                'GARDEN', 'BALCONY', 'ROOF', 'FLOOR', 'WALL', 'DOOR', 'WINDOW', 'STAIR', 'ELEVATOR',
                'CITY', 'TOWN', 'VILLAGE', 'COUNTRY', 'CAPITAL', 'SUBURB', 'DOWNTOWN', 'UPTOWN',
                'STREET', 'ROAD', 'AVENUE', 'BOULEVARD', 'LANE', 'ALLEY', 'SQUARE', 'PLAZA', 'PARK',
                'BUILDING', 'OFFICE', 'STORE', 'MARKET', 'MALL', 'SUPERMARKET', 'RESTAURANT', 'CAFE',
                'HOSPITAL', 'SCHOOL', 'UNIVERSITY', 'LIBRARY', 'MUSEUM', 'THEATER', 'CINEMA', 'STADIUM',
                'CHURCH', 'TEMPLE', 'MOSQUE', 'SYNAGOGUE', 'BANK', 'POST_OFFICE', 'AIRPORT', 'STATION',
                'BEACH', 'MOUNTAIN', 'RIVER', 'LAKE', 'FOREST', 'DESERT', 'ISLAND', 'OCEAN', 'SEA'
            ],
            sentences: [
                'I LIVE IN A SMALL HOUSE', 'MY HOUSE HAS THREE BEDROOMS', 'I RENT AN APARTMENT IN THE CITY',
                'THE GARDEN IS VERY BEAUTIFUL', 'I WENT TO THE MARKET TODAY', 'LET US GO TO THE PARK',
                'I AM FROM A SMALL VILLAGE', 'THE CITY IS VERY CROWDED', 'I LOVE LIVING HERE',
                'THE LIBRARY IS OPEN UNTIL NINE PM', 'I VISITED THE MUSEUM YESTERDAY', 'THE RESTAURANT HAS GREAT FOOD',
                'I AM WAITING AT THE BUS STATION', 'THE AIRPORT IS VERY FAR FROM HERE', 'I WORK IN THE DOWNTOWN AREA',
                'THE POST OFFICE IS CLOSED TODAY', 'I AM GOING TO THE BEACH THIS WEEKEND', 'MOUNTAINS ARE SO BEAUTIFUL',
                'I CROSSED THE RIVER BY BOAT', 'THE OCEAN IS VERY VAST', 'LET US MEET AT THE CAFE',
                'I DROVE THROUGH THE COUNTRYSIDE', 'THE SUBURBS ARE QUIETER THAN THE CITY', 'I BOUGHT THIS AT THE MALL',
                'DO YOU KNOW THIS STREET', 'THE HISTORICAL SQUARE IS FAMOUS', 'WHERE IS THE NEAREST HOSPITAL',
                'I TRAVELED TO MANY COUNTRIES', 'I PREFER THE BEACH TO THE MOUNTAINS', 'THIS PLACE IS VERY PEACEFUL',
                'I HAVE NEVER BEEN TO THIS CITY BEFORE', 'THE VILLAGE HAS A CHARM OF ITS OWN', 'I WANT TO VISIT PARIS SOMEDAY',
                'IS THIS ADDRESS CORRECT', 'HOW DO I GET TO YOUR HOUSE', 'I AM MOVING TO A NEW PLACE NEXT MONTH'
            ]
        },
        'Travel': {
            name: 'Du lịch',
            icon: '✈️',
            words: [
                'TRAVEL', 'TRIP', 'JOURNEY', 'TOUR', 'VOYAGE', 'ADVENTURE', 'EXPLORE', 'DISCOVER', 'VISIT',
                'TICKET', 'PASSPORT', 'VISA', 'LUGGAGE', 'BAGGAGE', 'SUITCASE', 'BACKPACK', 'PACKING',
                'DESTINATION', 'DEPARTURE', 'ARRIVAL', 'BOARDING', 'FLIGHT', 'PLANE', 'TRAIN', 'BUS', 'CAR',
                'TAXI', 'UBER', 'SUBWAY', 'METRO', 'FERRY', 'BOAT', 'CRUISE', 'SHIP', 'HELICOPTER',
                'HOTEL', 'MOTEL', 'HOSTEL', 'RESORT', 'INN', 'BED_AND_BREAKFAST', 'RESERVATION', 'BOOKING',
                'CHECK_IN', 'CHECK_OUT', 'TOURIST', 'GUIDE', 'MAP', 'COMPASS', 'GPS', 'DIRECTION', 'ROUTE',
                'SOUVENIR', 'SOUVENIR', 'PHOTO', 'CAMERA', 'PASSPORT_PHOTO', 'IMMIGRATION', 'CUSTOMS',
                'AIRLINE', 'AIRPORT', 'TERMINAL', 'GATE', 'SEAT', 'WINDOW_SEAT', 'AISLE_SEAT', 'BOARDING_PASS'
            ],
            sentences: [
                'I LOVE TRAVELING TO NEW PLACES', 'I AM PLANNING A TRIP TO JAPAN', 'WHERE IS YOUR NEXT DESTINATION',
                'I BOOKED A FLIGHT TO PARIS', 'MY PASSPORT EXPIRES NEXT YEAR', 'I NEED TO RENEW MY VISA',
                'PACK YOUR LUGGAGE CAREFULLY', 'I ALWAYS OVERPACK FOR TRIPS', 'TRAVELING EXPANDS THE MIND',
                'THE DEPARTURE IS AT NINE AM', 'WE ARRIVED SAFELY YESTERDAY', 'BOARDING TIME IS NOW',
                'I PREFER WINDOW SEATS ON PLANES', 'THE HOTEL HAS A NICE VIEW', 'I MADE A RESERVATION ONLINE',
                'CHECK IN TIME IS AT TWO PM', 'CAN I HAVE A LATE CHECKOUT PLEASE', 'THE TOUR GUIDE WAS VERY HELPFUL',
                'I BOUGHT A SOUVENIR FOR MY FRIEND', 'TAKE LOTS OF PHOTOS', 'DO YOU HAVE TRAVEL INSURANCE',
                'I GOT A CHEAP FLIGHT TICKET', 'THE JOURNEY TOOK TWELVE HOURS', 'I AM A FREQUENT FLYER',
                'I AM TRAVELING LIGHT THIS TIME', 'I LOST MY LUGGAGE AT THE AIRPORT', 'CUSTOM DECLARATION IS REQUIRED',
                'THE CRUISE HAS MANY AMENITIES', 'I EXPLORED THE CITY ON FOOT', 'THE LOCAL FOOD WAS AMAZING',
                'I LEARNED ABOUT THE LOCAL CULTURE', 'DO YOU LIKE ADVENTURE TRAVEL', 'I PREFER BEACH VACATIONS',
                'MOUNTAIN TREKKING IS CHALLENGING BUT FUN', 'I AM PLANNING A ROAD TRIP', 'LET US TRAVEL TOGETHER SOMEDAY'
            ]
        },
        'Shopping': {
            name: 'Mua sắm',
            icon: '🛒',
            words: [
                'SHOP', 'STORE', 'MARKET', 'MALL', 'BOUTIQUE', 'SUPERMARKET', 'CONVENIENCE', 'OUTLET',
                'BUY', 'SELL', 'PURCHASE', 'PAY', 'COST', 'PRICE', 'PRICY', 'CHEAP', 'EXPENSIVE', 'DISCOUNT',
                'SALE', 'DEAL', 'OFFER', 'PROMOTION', 'COUPON', 'VOUCHER', 'RECEIPT', 'INVOICE', 'BILL',
                'CASH', 'CARD', 'CREDIT', 'DEBIT', 'WALLET', 'MONEY', 'COIN', 'BANKNOTE', 'CHANGE',
                'SIZE', 'SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE', 'COLOR', 'STYLE', 'DESIGN', 'BRAND',
                'FASHION', 'TREND', 'TRENDY', 'CLASSIC', 'VINTAGE', 'NEW', 'USED', 'SECOND_HAND',
                'ONLINE', 'WEBSITE', 'DELIVERY', 'SHIPPING', 'RETURN', 'EXCHANGE', 'REFUND', 'WARRANTY',
                'CART', 'BASKET', 'BAG', 'WRAPPER', 'RECEIPT', 'CUSTOMER', 'SELLER', 'SHOPPER', 'SALESMAN'
            ],
            sentences: [
                'I AM GOING SHOPPING TODAY', 'CAN I PAY BY CREDIT CARD', 'HOW MUCH DOES THIS COST',
                'IS THIS ON SALE TODAY', 'CAN I HAVE A DISCOUNT PLEASE', 'THE PRICE IS TOO HIGH',
                'I GOT A REALLY GOOD DEAL', 'I AM LOOKING FOR SOMETHING CHEAPER', 'DO YOU HAVE THIS IN ANOTHER SIZE',
                'CAN I TRY THIS ON', 'THE FIT IS NOT RIGHT', 'I AM LOOKING FOR THE BEST QUALITY',
                'I PREFER SHOPPING ONLINE NOW', 'FREE SHIPPING FOR ORDERS OVER FIFTY DOLLARS', 'I AM WAITING FOR DELIVERY',
                'I NEED TO RETURN THIS ITEM', 'CAN I GET A REFUND', 'WHERE IS THE CUSTOMER SERVICE',
                'I BOUGHT THIS YESTERDAY', 'DO YOU HAVE A RECEIPT', 'THE RECEIPT IS IN THE BAG',
                'I AM A REGULAR CUSTOMER HERE', 'THE SALESMAN WAS VERY HELPFUL', 'I AM A SHOPAHOLIC',
                'I ENJOY BROWSING IN STORES', 'DO YOU LIKE WINDOW SHOPPING', 'I AM BUYING GIFTS FOR EVERYONE',
                'I FOUND THE PERFECT DRESS', 'THIS BRAND IS VERY POPULAR', 'I AM ON A BUDGET',
                'DO YOU ACCEPT RETURNS', 'HOW LONG IS THE WARRANTY', 'I AM COMPARING PRICES ONLINE',
                'GROCERY SHOPPING TAKES ONE HOUR', 'I ALWAYS MAKE A SHOPPING LIST', 'I SPENT TOO MUCH MONEY THIS MONTH'
            ]
        },
        'Nature': {
            name: 'Thiên nhiên',
            icon: '🌿',
            words: [
                'NATURE', 'TREE', 'FLOWER', 'PLANT', 'GRASS', 'LEAF', 'ROOTS', 'SEED', 'SOIL', 'EARTH',
                'SUN', 'MOON', 'STAR', 'SKY', 'CLOUD', 'RAIN', 'RAINBOW', 'WIND', 'STORM', 'THUNDER',
                'LIGHTNING', 'WATER', 'OCEAN', 'SEA', 'RIVER', 'LAKE', 'STREAM', 'POND', 'WATERFALL',
                'MOUNTAIN', 'HILL', 'VALLEY', 'CANYON', 'CLIFF', 'CAVE', 'BEACH', 'ISLAND', 'FOREST',
                'JUNGLE', 'DESERT', 'SAVANNA', 'TUNDRA', 'ARCTIC', 'ANTARCTIC', 'SWAMP', 'MARSH',
                'ANIMAL', 'BIRD', 'FISH', 'INSECT', 'BUTTERFLY', 'BEE', 'EAGLE', 'DOLPHIN', 'WHALE',
                'FOREST', 'TROPICAL', 'RAINFOREST', 'MEADOW', 'FIELD', 'FARM', 'GARDEN', 'PARK',
                'ENVIRONMENT', 'ECOSYSTEM', 'CLIMATE', 'POLLUTION', 'CONSERVATION', 'ENDANGERED', 'EXTINCT'
            ],
            sentences: [
                'NATURE IS BEAUTIFUL AND DIVERSE', 'THE SUN RISES IN THE EAST', 'THE MOON SHINES AT NIGHT',
                'I LOVE WATCHING STARS', 'THE SKY IS SO BLUE TODAY', 'CLOUDS LOOK LIKE COTTON',
                'RAIN BRINGS NEW LIFE TO NATURE', 'THE OCEAN IS VERY DEEP', 'RIVERS FLOW TO THE SEA',
                'MOUNTAINS ARE COVERED WITH SNOW', 'I HIKED UP THE HILL TODAY', 'THE FOREST IS SO PEACEFUL',
                'THE WATERFALL IS BREATHTAKING', 'I SAW A RAINBOW AFTER THE STORM', 'THE BEACH HAS WHITE SAND',
                'I ENJOY CAMPING IN NATURE', 'PLANTS NEED SUNLIGHT TO GROW', 'TREES PRODUCE OXYGEN',
                'ANIMALS ARE PART OF NATURE', 'THE BIRD SINGS BEAUTIFULLY', 'I LEARNED ABOUT THE ECOSYSTEM',
                'POLLUTION IS BAD FOR THE ENVIRONMENT', 'WE SHOULD PROTECT WILDLIFE', 'CLIMATE CHANGE IS A REAL ISSUE',
                'REUSING AND RECYCLING HELPS NATURE', 'I PLANTED A TREE TODAY', 'THE GARDEN IS FULL OF FLOWERS',
                'THE DESERT IS VERY DRY', 'JUNGLE HAS DENSE VEGETATION', 'POLAR BEARS LIVE IN THE ARCTIC',
                'I LOVE THE SOUND OF RAIN', 'NATURE HEALS THE SOUL', 'WE MUST PRESERVE NATURE FOR FUTURE GENERATIONS'
            ]
        },
        'Technology': {
            name: 'Công nghệ',
            icon: '💻',
            words: [
                'COMPUTER', 'LAPTOP', 'DESKTOP', 'TABLET', 'PHONE', 'SMARTPHONE', 'IPHONE', 'ANDROID',
                'SOFTWARE', 'HARDWARE', 'APP', 'APPLICATION', 'PROGRAM', 'SYSTEM', 'OPERATING_SYSTEM',
                'INTERNET', 'WIFI', 'BROWSER', 'WEBSITE', 'EMAIL', 'SOCIAL_MEDIA', 'FACEBOOK', 'INSTAGRAM',
                'TWITTER', 'YOUTUBE', 'TIKTOK', 'WHATSAPP', 'ZALO', 'MESSENGER', 'CHAT', 'VIDEO_CALL',
                'CAMERA', 'PHOTO', 'VIDEO', 'MUSIC', 'GAME', 'STREAMING', 'PODCAST', 'BLOG', 'WEBSITE',
                'DATA', 'CLOUD', 'STORAGE', 'MEMORY', 'PROCESSOR', 'SCREEN', 'KEYBOARD', 'MOUSE', 'CHARGER',
                'BATTERY', 'USB', 'BLUETOOTH', 'WIRELESS', 'NETWORK', 'SERVER', 'DATABASE', 'SECURITY',
                'HACKER', 'VIRUS', 'PASSWORD', 'LOGIN', 'ACCOUNT', 'PROFILE', 'DOWNLOAD', 'UPLOAD'
            ],
            sentences: [
                'I USE MY PHONE FOR EVERYTHING', 'THE COMPUTER IS VERY SLOW', 'CAN YOU FIX MY LAPTOP',
                'I AM LEARNING TO CODE', 'THE APP IS NOT WORKING PROPERLY', 'I UPDATED MY PHONE YESTERDAY',
                'MY WIFI CONNECTION IS UNSTABLE', 'DO YOU HAVE INTERNET ACCESS', 'I SENT AN EMAIL YESTERDAY',
                'I AM ACTIVE ON SOCIAL MEDIA', 'HOW MANY FOLLOWERS DO YOU HAVE', 'LET US VIDEO CALL TONIGHT',
                'I AM STREAMING A MOVIE ONLINE', 'THE BATTERY IS LOW', 'I NEED TO CHARGE MY PHONE',
                'I PLAY GAMES ON MY TABLET', 'THE NEW FEATURE IS AMAZING', 'I AM ADDICTED TO MY PHONE',
                'TECHNOLOGY MAKES LIFE EASIER', 'ARTIFICIAL INTELLIGENCE IS THE FUTURE', 'CYBERSECURITY IS IMPORTANT',
                'I AM WORRIED ABOUT DATA PRIVACY', 'DO NOT SHARE YOUR PASSWORD', 'I FORGOT MY LOGIN CREDENTIALS',
                'CLOUD STORAGE IS VERY CONVENIENT', 'I BACKED UP MY FILES TO THE CLOUD', 'THE WEBSITE LOADED SLOWLY',
                'I AM LEARNING ABOUT MACHINE LEARNING', 'I BUILT MY OWN COMPUTER', 'THE SCREEN IS CRACKED',
                'I PREFER LAPTOPS TO DESKTOPS', 'I USE BLUETOOTH HEADPHONES', 'THE USB PORTS ARE NOT WORKING',
                'I RECORDED A VIDEO TODAY', 'I EDIT PHOTOS ON MY PHONE', 'I LISTEN TO MUSIC ON SPOTIFY'
            ]
        },
        'Communication': {
            name: 'Giao tiếp',
            icon: '💬',
            words: [
                'SPEAK', 'TALK', 'SAY', 'TELL', 'ASK', 'ANSWER', 'DISCUSS', 'EXPLAIN', 'DESCRIBE', 'REPORT',
                'COMMUNICATE', 'EXPRESS', 'CONVEY', 'INFORM', 'ANNOUNCE', 'DECLARE', 'PRONOUNCE', 'VOCABULARY',
                'SENTENCE', 'PHRASE', 'WORD', 'LANGUAGE', 'SPEECH', 'VOICE', 'TONE', 'VOLUME', 'PITCH',
                'LISTEN', 'HEAR', 'UNDERSTAND', 'COMPREHEND', 'TRANSLATE', 'INTERPRET', 'SIGN', 'GESTURE',
                'BODY_LANGUAGE', 'FACIAL_EXPRESSION', 'EYE_CONTACT', 'GESTURE', 'POSTURE', 'SILENCE',
                'CALL', 'PHONE', 'TEXT', 'MESSAGE', 'MAIL', 'LETTER', 'NOTE', 'MEMO', 'ANNOUNCEMENT',
                'CONVERSATION', 'DIALOGUE', 'INTERVIEW', 'MEETING', 'DISCUSSION', 'DEBATE', 'ARGUMENT',
                'AGREEMENT', 'DISAGREEMENT', 'OPINION', 'SUGGESTION', 'ADVICE', 'REQUEST', 'QUESTION'
            ],
            sentences: [
                'CAN I SPEAK TO THE MANAGER', 'I NEED TO TELL YOU SOMETHING', 'DO YOU UNDERSTAND WHAT I MEAN',
                'PLEASE EXPLAIN IT MORE CLEARLY', 'I AM NOT GOOD AT EXPRESSING MY FEELINGS', 'HOW DO YOU SAY THIS IN ENGLISH',
                'CAN YOU REPEAT THAT PLEASE', 'SPEAK MORE SLOWLY PLEASE', 'I AM NOT SURE I UNDERSTAND',
                'I AGREE WITH YOUR OPINION', 'I DISAGREE WITH THIS IDEA', 'CAN I ASK YOU A QUESTION',
                'PLEASE LISTEN CAREFULLY', 'I HEARD WHAT YOU SAID', 'THIS IS INTERESTING TO TALK ABOUT',
                'LET US HAVE A CONVERSATION', 'THE MEETING WILL START SOON', 'WE NEED TO DISCUSS THIS MATTER',
                'I HAVE A SUGGESTION FOR YOU', 'MAY I GIVE YOU SOME ADVICE', 'I NEED YOUR HELP',
                'I WILL TRANSLATE THIS FOR YOU', 'THE INTERPRETER IS HELPING US', 'BODY LANGUAGE IS IMPORTANT IN COMMUNICATION',
                'MAINTAIN EYE CONTACT WHEN SPEAKING', 'DO NOT GESTURE TOO MUCH', 'SILENCE CAN SPEAK VOLUMES',
                'I AM SENDING YOU A MESSAGE', 'I RECEIVED YOUR TEXT YESTERDAY', 'PLEASE LEAVE A NOTE ON MY DESK',
                'I MADE A PHONE CALL EARLIER', 'THE VOICEMAIL IS FULL', 'CAN YOU HEAR ME NOW',
                'COMMUNICATION SKILLS ARE ESSENTIAL', 'I AM IMPROVING MY ENGLISH', 'I WRITE EMAILS EVERYDAY'
            ]
        },
        'Money': {
            name: 'Tiền bạc',
            icon: '💰',
            words: [
                'MONEY', 'CASH', 'COIN', 'BILL', 'BANKNOTE', 'DOLLAR', 'EURO', 'POUND', 'YEN', 'YUAN',
                'CURRENCY', 'EXCHANGE', 'RATE', 'BANK', 'ATM', 'CARD', 'CREDIT', 'DEBIT', 'ACCOUNT',
                'SAVINGS', 'INVESTMENT', 'STOCK', 'BOND', 'SHARE', 'DIVIDEND', 'PROFIT', 'LOSS', 'INTEREST',
                'LOAN', 'DEBT', 'BORROW', 'LEND', 'OWE', 'REPAY', 'INSTALLMENT', 'MORTGAGE', 'RENT',
                'INCOME', 'SALARY', 'WAGE', 'BONUS', 'COMMISSION', 'PENSION', 'RETIREMENT', 'ALLOWANCE',
                'PRICE', 'COST', 'VALUE', 'WORTH', 'EXPENSE', 'SPENDING', 'BUDGET', 'SAVING', 'WEALTHY',
                'POOR', 'RICH', 'AFFORD', 'BUY', 'SELL', 'PAY', 'CHARGE', 'DISCOUNT', 'TAX', 'TIP'
            ],
            sentences: [
                'I NEED MORE MONEY', 'CAN I BORROW SOME MONEY FROM YOU', 'I WILL PAY YOU BACK NEXT WEEK',
                'HOW MUCH MONEY DO YOU EARN', 'I DEPOSITED MONEY IN THE BANK', 'I WITHDREW CASH FROM ATM',
                'THE EXCHANGE RATE IS FAVORABLE TODAY', 'I AM SAVING MONEY FOR A TRIP', 'INVESTMENTS CAN BE RISKY',
                'I LOST MONEY ON THAT DEAL', 'THE INTEREST RATE IS VERY HIGH', 'I NEED TO PAY OFF MY DEBT',
                'CAN I GET A LOAN FROM THE BANK', 'I CANNOT AFFORD THIS RIGHT NOW', 'THIS IS VERY EXPENSIVE',
                'IS THIS PRICE NEGOTIABLE', 'I AM ON A TIGHT BUDGET', 'HOW DO I OPEN A BANK ACCOUNT',
                'I LOST MY CREDIT CARD', 'SOMEONE STOLE MY WALLET', 'THE ATM DID NOT GIVE ME MONEY',
                'I AM MAKING GOOD MONEY NOW', 'MONEY CANNOT BUY HAPPINESS', 'A PENNY SAVED IS A PENNY EARNED',
                'I AM LEARNING ABOUT INVESTING', 'STOCK MARKET IS VOLATILE', 'I BOUGHT SOME STOCKS YESTERDAY',
                'I AM WORKING HARD TO MAKE ENDS MEET', 'I NEED TO REDUCE MY EXPENSES', 'THE SALARY IS COMPETITIVE',
                'I GOT A RAISE AT WORK', 'TAX SEASON IS APPROACHING', 'REMEMBER TO TIP THE WAITER',
                'I AM PLANNING MY RETIREMENT', 'I HAVE A PENSION PLAN', 'IS THIS A GOOD INVESTMENT OPPORTUNITY'
            ]
        },
        'Clothes': {
            name: 'Quần áo',
            icon: '👕',
            words: [
                'SHIRT', 'BLOUSE', 'T_SHIRT', 'PANTS', 'JEANS', 'TROUSERS', 'SHORTS', 'SKIRT', 'DRESS',
                'JACKET', 'COAT', 'HOODIE', 'SWEATER', 'CARDIGAN', 'VEST', 'BLAZER', 'SUIT', 'TIE',
                'SOCKS', 'UNDERWEAR', 'BRA', 'PANTIES', 'BOXERS', 'SWIMWEAR', 'SWIMSUIT', 'BIKINI',
                'HAT', 'CAP', 'BEANIE', 'SCARF', 'GLOVES', 'MITTENS', 'BELT', 'SUSPENDERS', 'TIE',
                'BOW_TIE', 'CRAVAT', 'UMBRELLA', 'BOOTS', 'SHOES', 'SNEAKERS', 'SANDALS', 'HEELS',
                'FLATS', 'LOAFERS', 'SLIPPERS', 'WATCH', 'BRACELET', 'RING', 'NECKLACE', 'EARRINGS',
                'GLASSES', 'SUNGLASSES', 'BAG', 'PURSE', 'WALLET', 'BACKPACK', 'HANDBAG', 'CLUTCH',
                'FABRIC', 'COTTON', 'SILK', 'WOOL', 'LINEN', 'DENIM', 'LEATHER', 'SIZE', 'COLOR'
            ],
            sentences: [
                'I AM WEARING A BLUE SHIRT TODAY', 'I BOUGHT NEW JEANS YESTERDAY', 'THIS DRESS IS VERY BEAUTIFUL',
                'I NEED TO IRON MY CLOTHES', 'THE COAT IS TOO EXPENSIVE', 'DO YOU LIKE MY NEW SHOES',
                'I PREFER COMFORTABLE CLOTHES', 'THIS FABRIC IS VERY SOFT', 'I AM LOOKING FOR A FORMAL SUIT',
                'CAN I TRY THIS ON', 'WHAT SIZE DO YOU WEAR', 'THE FIT IS PERFECT',
                'I AM WEARING A HAT TO PROTECT FROM THE SUN', 'I LOST MY FAVORITE SCARF', 'THESE GLOVES ARE VERY WARM',
                'I BOUGHT THIS BAG ON SALE', 'I WEAR SUNGLASSES WHEN IT IS SUNNY', 'I AM ALLERGIC TO CERTAIN FABRICS',
                'DO YOU HAVE THIS IN ANOTHER COLOR', 'I NEED NEW SHOES FOR RUNNING', 'I LIKE VINTAGE CLOTHES',
                'FASHION CHANGES WITH SEASONS', 'I AM WEARING MY BEST OUTFIT TODAY', 'THESE PANTS ARE TOO TIGHT',
                'I NEED TO DO LAUNDRY', 'I hang my clothes to dry', 'ironing is tedious but necessary',
                'I dress according to the weather', 'formal attire is required for the event', 'I am a fashion enthusiast',
                'I have too many clothes in my closet', 'I donate old clothes to charity', 'I prefer natural fabrics like cotton'
            ]
        },
        'Body': {
            name: 'Cơ thể',
            icon: '🧍',
            words: [
                'HEAD', 'HAIR', 'FACE', 'EYE', 'EYES', 'EAR', 'EARS', 'NOSE', 'MOUTH', 'LIP', 'LIPS',
                'TEETH', 'TOOTH', 'TONGUE', 'CHIN', 'CHEEK', 'CHEEKS', 'FOREHEAD', 'EYEBROW', 'EYELASH',
                'NECK', 'SHOULDER', 'SHOULDERS', 'ARM', 'ARMS', 'ELBOW', 'WRIST', 'HAND', 'HANDS',
                'FINGER', 'FINGERS', 'THUMB', 'NAIL', 'NAILS', 'PALM', 'CHEST', 'BREAST', 'HEART',
                'LUNG', 'LUNGS', 'STOMACH', 'LIVER', 'KIDNEY', 'INTESTINE', 'BONE', 'BONES', 'SPINE',
                'BACK', 'WAIST', 'HIP', 'HIPS', 'LEG', 'LEGS', 'KNEE', 'KNEES', 'CALF', 'SHIN',
                'ANKLE', 'ANKLES', 'FOOT', 'FEET', 'TOE', 'TOES', 'HEEL', 'HEELS', 'SKIN', 'MUSCLE'
            ],
            sentences: [
                'I HAVE A HEADACHE TODAY', 'MY STOMACH HURTS', 'I BROKE MY ARM LAST YEAR',
                'I NEED TO EXERCISE MORE', 'THE HEART PUMPS BLOOD', 'I HAVE STRONG LEGS FROM RUNNING',
                'I WASH MY HANDS BEFORE EATING', 'BRUSH YOUR TEETH TWICE A DAY', 'I CUT MY FINGER BY ACCIDENT',
                'THE WOUND IS HEALING NICELY', 'I HAVE BEAUTIFUL EYES', 'MY HAIR IS GETTING LONG',
                'I AM WORKING OUT TO BUILD MUSCLES', 'I HAVE A STOMACHACHE', 'MY BACK HURTS FROM SITTING TOO LONG',
                'I GOT A TATTOO ON MY ARM', 'DO YOU HAVE ANY ALLERGIES', 'I AM SENSITIVE TO CERTAIN FOODS',
                'I NEED GLASSES FOR MY EYES', 'MY EARS ARE RINGING', 'I HAVE A RUNNY NOSE TODAY',
                'I BITE MY NAILS WHEN I AM NERVOUS', 'I WAVE MY HAND TO SAY GOODBYE', 'I POINT WITH MY FINGER',
                'I STAND ON ONE FOOT', 'I BALANCE ON MY HANDS', 'I TOUCH MY FACE OFTEN',
                'I HAVE A FEVER', 'MY THROAT IS SORE', 'I COUGH A LOT', 'I SNEEZE WHEN I AM ALLERGIC'
            ]
        },
        'Music': {
            name: 'Âm nhạc',
            icon: '🎵',
            words: [
                'MUSIC', 'SONG', 'SING', 'SINGER', 'VOICE', 'MELODY', 'RHYTHM', 'BEAT', 'TUNE', 'HARMONY',
                'INSTRUMENT', 'GUITAR', 'PIANO', 'VIOLIN', 'DRUMS', 'FLUTE', 'TRUMPET', 'SAXOPHONE',
                'CLARINET', 'CELLO', 'HARP', 'ORGAN', 'ACCORDION', 'BANJO', 'UKULELE', 'MANDOLIN',
                'CONDUCTOR', 'ORCHESTRA', 'BAND', 'CHORUS', 'ENSEMBLE', 'SOLO', 'DUET', 'TRIO',
                'ROCK', 'POP', 'JAZZ', 'CLASSICAL', 'BLUES', 'COUNTRY', 'RAP', 'HIPHOP', 'R_AND_B',
                'ELECTRONIC', 'METAL', 'FOLK', 'REGGAE', 'LATIN', 'PUNK', 'INDIE', 'ALTERNATIVE',
                'ALBUM', 'SINGLE', 'TRACK', 'PLAYLIST', 'CONCERT', 'FESTIVAL', 'STAGE', 'MICROPHONE',
                'NOTES', 'SCALE', 'CHORD', 'TEMPO', 'PITCH', 'LIRICS', 'VERSE', 'CHORUS', 'BRIDGE'
            ],
            sentences: [
                'I LOVE LISTENING TO MUSIC', 'DO YOU PLAY ANY MUSICAL INSTRUMENTS', 'I HAVE BEEN SINGING SINCE I WAS YOUNG',
                'THE SINGER HAS AN AMAZING VOICE', 'I AM LEARNING TO PLAY THE GUITAR', 'THE PIANO IS A BEAUTIFUL INSTRUMENT',
                'I ENJOY ROCK MUSIC THE MOST', 'JAZZ IS SOPHISTICATED MUSIC', 'I WENT TO A CONCERT LAST NIGHT',
                'THE BAND PERFORMED AMAZINGLY', 'I CREATE PLAYLISTS FOR DIFFERENT MOODS', 'THIS SONG REMINDS ME OF YOU',
                'THE MELODY IS VERY CATCHY', 'I CANNOT GET THIS TUNE OUT OF MY HEAD', 'DO YOU HAVE MUSICAL TALENT',
                'I AM A FAN OF CLASSICAL MUSIC', 'OPERA SINGERS ARE VERY TALENTED', 'I LEARNED TO READ MUSIC NOTES',
                'THE DRUMMER KEEPS THE BEAT', 'I LOVE SINGING IN THE SHOWER', 'CAN YOU HEAR THE RHYTHM',
                'I AM GOING TO A MUSIC FESTIVAL NEXT MONTH', 'I PLAY MUSIC WHILE WORKING', 'THIS ALBUM IS MY FAVORITE',
                'I SING ALONG TO MY FAVORITE SONGS', 'THE LYRICS ARE VERY MEANINGFUL', 'I WRITE MY OWN MUSIC',
                'MUSIC HEALS THE SOUL', 'I AM LEARNING TO PLAY THE VIOLIN', 'I PERFORMED A SOLO AT THE CONCERT',
                'THE CHOIR SINGS BEAUTIFULLY TOGETHER', 'I COMPOSED A NEW SONG TODAY', 'MUSIC IS MY PASSION'
            ]
        },
        'Movie': {
            name: 'Phim ảnh',
            icon: '🎬',
            words: [
                'MOVIE', 'FILM', 'CINEMA', 'THEATER', 'SCREEN', 'ACTOR', 'ACTRESS', 'DIRECTOR', 'PRODUCER',
                'CAST', 'CREW', 'SCREENPLAY', 'SCRIPT', 'SCENE', 'SHOT', 'TAKE', 'CUT', 'EDIT',
                'HORROR', 'COMEDY', 'DRAMA', 'ACTION', 'THRILLER', 'ROMANCE', 'SCI_FI', 'FANTASY',
                'ANIMATION', 'DOCUMENTARY', 'WESTERN', 'MUSICAL', 'MYSTERY', 'WAR', 'ADVENTURE', 'CRIME',
                'PREMIERE', 'RELEASE', 'BOX_OFFICE', 'REVIEW', 'RATING', 'GENRE', 'SEQUEL', 'REMAKE',
                'STUNT', 'SPECIAL_EFFECTS', 'CGI', 'SOUNDTRACK', 'POSTER', 'TRAILER', 'TEASER',
                'HOLLYWOOD', 'BOLLYWOOD', 'AWARD', 'OSCAR', 'GOLDEN_GLOBE', 'BAFTA', 'CANNES',
                'HERO', 'VILLAIN', 'PROTAGONIST', 'SUPPORTING', 'EXTRA', 'DOUBLE', 'VOICE_OVER'
            ],
            sentences: [
                'I LOVE WATCHING MOVIES', 'WHAT IS YOUR FAVORITE GENRE', 'I WATCHED A GREAT FILM YESTERDAY',
                'THE ACTOR PLAYED BRILLIANTLY', 'THE DIRECTOR IS A GENIUS', 'I CRIES DURING THE MOVIE',
                'THIS COMEDY MADE ME LAUGH OUT LOUD', 'HORROR MOVIES SCARE ME', 'I AM A FAN OF ACTION MOVIES',
                'THE PLOT IS VERY INTRIGUING', 'I DID NOT EXPECT THAT TWIST', 'THE ENDING WAS DISAPPOINTING',
                'I AM WAITING FOR THE SEQUEL', 'THE SPECIAL EFFECTS ARE AMAZING', 'I LOVE 3D MOVIES',
                'I WENT TO THE CINEMA WITH FRIENDS', 'THE THEATER WAS FULL', 'IS THE MOVIE WORTH WATCHING',
                'I GIVE THIS FILM FIVE STARS', 'I READ A NEGATIVE REVIEW', 'THE BOX OFFICE EARNED MILLIONS',
                'I AM BINGE_WATCHING A TV SERIES', 'I PREFER MOVIES TO TV SHOWS', 'THIS IS AN OSCAR_WORTHY FILM',
                'THE ACTRESS LOOKS STUNNING', 'I AM A HUGE FAN OF THIS ACTOR', 'WHO IS YOUR CELEBRITY CRUSH',
                'THE SOUNDTRACK IS BEAUTIFUL', 'I WATCHED THE TRAILER AND IT LOOKS GOOD', 'MOVIES INSPIRE ME',
                'I AM LEARNING ABOUT FILMMAKING', 'THE CINEMATOGRAPHY IS STUNNING', 'I RECOMMEND THIS MOVIE TO EVERYONE'
            ]
        },
        'Hobby': {
            name: 'Sở thích',
            icon: '🎯',
            words: [
                'HOBBY', 'INTEREST', 'PASSION', 'ENJOY', 'LIKE', 'LOVE', 'FAVORITE', 'FUN', 'EXCITING',
                'PAINTING', 'DRAWING', 'SKETCHING', 'PHOTOGRAPHY', 'COOKING', 'BAKING', 'GARDENING',
                'READING', 'WRITING', 'BLOGGING', 'CRAFTING', 'KNITTING', 'SEWING', 'POTTERY', 'WOODWORK',
                'COLLECTING', 'STAMP', 'COIN', 'CARD', 'FIGURE', 'ANTIQUE', 'HOBBY', 'FISHING', 'HUNTING',
                'CAMPING', 'HIKING', 'CLIMBING', 'DIVING', 'SURFING', 'SKIING', 'SKATING', 'CYCLING',
                'TRAVELING', 'EXPLORING', 'GAMING', 'VIDEOGAME', 'BOARD_GAME', 'CHESS', 'PUZZLE',
                'MUSIC', 'SINGING', 'DANCING', 'THEATER', 'VOLUNTEERING', 'MEDITATION', 'YOGA', 'EXERCISE',
                'BIRD_WATCHING', 'ASTRONOMY', 'STAR_GAZING', 'GEOCACHING', 'AQUARIUM', 'TERRARIUM'
            ],
            sentences: [
                'WHAT IS YOUR HOBBY', 'I ENJOY PAINTING IN MY FREE TIME', 'I AM PASSIONATE ABOUT PHOTOGRAPHY',
                'COOKING IS MY FAVORITE HOBBY', 'I LIKE READING BOOKS', 'I SPEND TIME GARDENING ON WEEKENDS',
                'DO YOU HAVE ANY INTERESTING HOBBIES', 'I COLLECT STAMPS FROM DIFFERENT COUNTRIES', 'HOBBIES MAKE LIFE MORE MEANINGFUL',
                'I LEARNED TO KNIT LAST YEAR', 'I ENJOY DOING PUZZLES', 'GAMING IS MY FAVORITE PASTIME',
                'I GO HIKING EVERY MONTH', 'I LOVE EXPLORING NEW PLACES', 'DO YOU LIKE BOARD GAMES',
                'I HAVE MANY HOBBIES', 'PAINTING HELPS ME RELAX', 'I STARTED A NEW HOURNEY',
                'I BLOG ABOUT MY TRAVELS', 'MY HOBBY IS ALSO MY SIDE HUSTLE', 'I AM LEARNING A NEW SKILL',
                'DOING HOBBIES REDUCES STRESS', 'I JOINED A HOBBY GROUP', 'HOBBIES CONNECT PEOPLE',
                'I CANNOT LIVE WITHOUT MY HOBBIES', 'EVERYONE SHOULD HAVE A HOBBY', 'I SPEND WEEKENDS ON MY HOBBIES',
                'MY FRIEND SHARES THE SAME HOBBY', 'I FOUND A NEW PASSION', 'HOBBIES ENRICH OUR LIVES',
                'I TAUGHT MYSELF A NEW HOBBY', 'I WANT TO PICK UP A NEW HOBBY', 'SHARING HOBBIES WITH FAMILY IS GREAT'
            ]
        },
        'DailyRoutine': {
            name: 'Sinh hoạt',
            icon: '📅',
            words: [
                'WAKE_UP', 'ALARM', 'MORNING', 'BREAKFAST', 'LUNCH', 'DINNER', 'SUPPER', 'SNACK',
                'BRUSH', 'TEETH', 'SHOWER', 'BATH', 'WASH', 'CLEAN', 'DRESS', 'CLOTHE', 'OUTFIT',
                'COMB', 'HAIR', 'MIRROR', 'MAKEUP', 'MOISTURIZER', 'SHAMPOO', 'CONDITIONER', 'SOAP',
                'BED', 'SLEEP', 'REST', 'NAP', 'DREAM', 'MIDNIGHT', 'MORNING', 'NOON', 'AFTERNOON', 'EVENING',
                'ROUTINE', 'SCHEDULE', 'PLAN', 'ORGANIZE', 'CLEAN', 'TIDY', 'MOP', 'VACUUM', 'DUST',
                'LAUNDRY', 'WASHING', 'IRONING', 'COOK', 'PREPARE', 'GROCERY', 'MARKET', 'SHOP',
                'COMMUTE', 'DRIVE', 'BUS', 'TRAIN', 'SUBWAY', 'WALK', 'BIKE', 'WORK', 'SCHOOL', 'CLASS',
                'BREAK', 'LUNCH_BREAK', 'FREE_TIME', 'LEISURE', 'RELAX', 'ENTERTAIN', 'HOBBY'
            ],
            sentences: [
                'I WAKE UP AT SIX EVERY MORNING', 'I BRUSH MY TEETH AFTER BREAKFAST', 'I TAKE A SHOWER EVERYDAY',
                'I DRESS UP BEFORE GOING OUT', 'I HAVE BREAKFAST AT SEVEN', 'I PACK MY LUNCH FOR WORK',
                'I DINNER WITH MY FAMILY EVERYDAY', 'I GO TO BED AT TEN PM', 'I READ BEFORE SLEEPING',
                'I CLEAN MY ROOM EVERY WEEKEND', 'I DO LAUNDRY ON SUNDAYS', 'I COOK MY OWN MEALS',
                'MY DAILY ROUTINE IS VERY BUSY', 'I PLAN MY DAY BEFOREHAND', 'I ORGANIZE MY SCHEDULE CAREFULLY',
                'I COMB MY HAIR EVERY MORNING', 'I PUT ON MAKEUP FOR SPECIAL OCCASIONS', 'I USE MOISTURIZER AFTER WASHING MY FACE',
                'I COMMUTE TO WORK BY BUS', 'I DRIVE MY CAR TO SCHOOL', 'I WALK TO THE STATION EVERYDAY',
                'I HAVE A LUNCH BREAK AT NOON', 'I USE MY FREE TIME FOR HOBBIES', 'I RELAX BY WATCHING TV',
                'I FOLLOW A HEALTHY ROUTINE', 'MY ROUTINE CHANGES ON WEEKENDS', 'I TRY TO KEEP A CONSISTENT SCHEDULE',
                'MORNING ROUTINE SETS THE TONE FOR THE DAY', 'I ENJOY MY EVENING ROUTINE', 'SUNDAY IS MY REST DAY',
                'I WATER THE PLANTS EVERY MORNING', 'I CHECK MY EMAILS EVERYDAY', 'I WRITE IN MY JOURNAL BEFORE BED'
            ]
        },
        'Feelings': {
            name: 'Cảm giác',
            icon: '❤️',
            words: [
                'LOVE', 'LIKE', 'HATE', 'DISLIKE', 'HURT', 'PAIN', 'PLEASURE', 'COMFORT', 'DISCOMFORT',
                'HAPPY', 'SAD', 'EXCITED', 'BORED', 'ANXIOUS', 'CALM', 'RELAXED', 'STRESSED', 'TENSE',
                'CONFIDENT', 'INSECURE', 'PROUD', 'ASHAMED', 'GRATEFUL', 'BITTER', 'SWEET', 'SOUR',
                'BITTERSWEET', 'LONELY', 'CONNECTED', 'ISOLATED', 'INCLUDED', 'EXCLUDED', 'ACCEPTED',
                'REJECTED', 'CHERISHED', 'VALUED', 'APPRECIATED', 'IGNORED', 'OVERLOOKED', 'NOTICED',
                'CRAVING', 'DESIRE', 'LUST', 'ATTRACTION', 'AFFECTION', 'ROMANCE', 'PASSION', 'DEVOTION',
                'EMPATHY', 'SYMPATHY', 'COMPASSION', 'SORROW', 'GRIEF', 'MOURNING', 'JOY', 'BLISS',
                'ECSTASY', 'SERENITY', 'PEACE', 'TURMOIL', 'ANGUISH', 'DESPAIR', 'HOPE', 'DESPAIR'
            ],
            sentences: [
                'I LOVE YOU WITH ALL MY HEART', 'I FEEL SO HAPPY RIGHT NOW', 'THIS MAKES ME VERY SAD',
                'I AM EXCITED ABOUT THE FUTURE', 'I FEEL SO LONELY SOMETIMES', 'I AM GRATEFUL FOR YOUR KINDNESS',
                'THIS PAIN IS UNBEARABLE', 'I AM FEELING VERY ANXIOUS', 'I AM AT PEACE WITH MYSELF',
                'I AM CONFIDENT ABOUT MY DECISION', 'I FEEL SO PROUD OF YOU', 'I AM ASHAMED OF MY BEHAVIOR',
                'DO YOU FEEL THE SAME WAY', 'MY HEART IS FULL OF LOVE', 'I AM EXPERIENCING MIXED FEELINGS',
                'THIS BRINGS ME GREAT JOY', 'I AM GOING THROUGH A DIFFICULT TIME', 'I FEEL APPRECIATED',
                'NO ONE NOTICES MY EFFORTS', 'I FEEL SO COMFORTABLE AROUND YOU', 'THIS FEELS SO RIGHT',
                'I CANNOT DESCRIBE THIS FEELING', 'MY HEART ACHES', 'I AM FILLED WITH HOPE',
                'I AM GRIEVING THE LOSS', 'THIS MOMENT IS BLISSFUL', 'I FEEL SO BLESSED',
                'MY EMOTIONS ARE ALL OVER THE PLACE', 'I AM LEARNING TO CONTROL MY FEELINGS', 'FEELINGS ARE VALID',
                'IT IS OKAY TO FEEL SAD SOMETIMES', 'I NEED TO EXPRESS MY FEELINGS', 'DO NOT BOTTLE UP YOUR EMOTIONS'
            ]
        },
        'Holiday': {
            name: 'Ngày lễ',
            icon: '🎉',
            words: [
                'HOLIDAY', 'FESTIVAL', 'CELEBRATION', 'PARTY', 'EVENT', 'OCCASION', 'VACATION', 'BREAK',
                'CHRISTMAS', 'NEW_YEAR', 'EASTER', 'THANKSGIVING', 'HALLOWEEN', 'VALENTINE', 'MOTHER_DAY',
                'FATHER_DAY', 'WOMEN_DAY', 'CHILDREN_DAY', 'TEACHER_DAY', 'ANNIVERSARY', 'BIRTHDAY',
                'WEDDING', 'GRADUATION', 'PROMOTION', 'ACHIEVEMENT', 'CONGRATULATIONS', 'TOAST',
                'GIFT', 'PRESENT', 'CAKE', 'CANDLE', 'BALLOON', 'DECORATION', 'ORNAMENT', 'WREATH',
                'TREE', 'LIGHT', 'SNOWFALL', 'FIREWORKS', 'PARADE', 'FEAST', 'FAMILY_REUNION',
                'TRADITION', 'CUSTOM', 'RITUAL', 'CEREMONY', 'CONCERT', 'FESTIVAL', 'FAIR', 'CARNIVAL',
                'BONUS', 'VACATION', 'TRAVEL', 'BEACH', 'RESORT', 'CRUISE', 'ADVENTURE', 'TRIP'
            ],
            sentences: [
                'MERRY CHRISTMAS AND HAPPY NEW YEAR', 'I WISH YOU A VERY HAPPY BIRTHDAY', 'CONGRATULATIONS ON YOUR ACHIEVEMENT',
                'THIS IS OUR ANNIVERSARY', 'WE CELEBRATE WITH FAMILY EVERY YEAR', 'THE HOLIDAYS ARE COMING SOON',
                'I AM PLANNING A PARTY FOR MY FRIEND', 'DO YOU CELEBRATE THIS FESTIVAL', 'EVERYONE IS IN FESTIVE SPIRITS',
                'I BOUGHT GIFTS FOR EVERYONE', 'LET US MAKE A TOAST TO YOUR SUCCESS', 'THE CAKE HAS FIVE CANDLES',
                'I HUNG DECORATIONS ALL OVER THE HOUSE', 'THE FIREWORKS DISPLAY WAS AMAZING', 'WE HAD A FAMILY REUNION DURING THE HOLIDAYS',
                'TRADITIONS ARE IMPORTANT TO US', 'I AM GOING ON VACATION NEXT MONTH', 'I MISS BEING WITH FAMILY DURING THE HOLIDAYS',
                'THIS IS THE MOST BEAUTIFUL TIME OF THE YEAR', 'I AM LOOKING FORWARD TO THE LONG BREAK', 'THANK YOU FOR THE WONDERFUL CELEBRATION',
                'THE WEDDING CEREMONY WAS BEAUTIFUL', 'I AM PREPARING FOR THE BIG DAY', 'EVERYONE IS DRESSED UP FOR THE OCCASION',
                'I AM GRATEFUL FOR THIS BLESSING', 'CHEERS TO A NEW BEGINNING', 'LET US ENJOY THIS MOMENT TOGETHER',
                'I CELEBRATE MY ACHIEVEMENTS', 'I AM EXCITED FOR THE UPCOMING HOLIDAYS', 'DO YOU HAVE HOLIDAY PLANS',
                'THE FESTIVAL BRINGS PEOPLE TOGETHER', 'I AM TAKING A VACATION FROM WORK', 'I AM SAVING UP FOR A TRIP ABROAD'
            ]
        },
        'Internet': {
            name: 'Internet',
            icon: '🌐',
            words: [
                'INTERNET', 'WEB', 'WEBSITE', 'BROWSER', 'GOOGLE', 'SEARCH', 'ENGINE', 'LINK', 'URL',
                'CLICK', 'SCROLL', 'SWIPE', 'TAP', 'TOUCH', 'KEYBOARD', 'MOUSE', 'SCREEN', 'MONITOR',
                'WIFI', 'CONNECT', 'CONNECTION', 'SIGNAL', 'BROADBAND', 'FIBER', 'MODEM', 'ROUTER',
                'PASSWORD', 'USERNAME', 'LOGIN', 'LOGOUT', 'SIGN_UP', 'REGISTER', 'ACCOUNT', 'PROFILE',
                'EMAIL', 'INBOX', 'SENT', 'DRAFT', 'SPAM', 'ATTACHMENT', 'FORWARD', 'REPLY', 'DELETE',
                'SOCIAL_MEDIA', 'FOLLOWER', 'FOLLOWING', 'LIKE', 'COMMENT', 'SHARE', 'POST', 'STATUS',
                'BLOG', 'VLOG', 'PODCAST', 'STREAM', 'DOWNLOAD', 'UPLOAD', 'FILE', 'FOLDER', 'CLOUD',
                'SERVER', 'DATABASE', 'DATA', 'BACKUP', 'UPDATE', 'UPGRADE', 'DOWNLOAD', 'INSTALL'
            ],
            sentences: [
                'I AM ADDICTED TO THE INTERNET', 'DO YOU HAVE WIFI HERE', 'THE INTERNET CONNECTION IS SLOW',
                'I USE GOOGLE TO SEARCH FOR INFORMATION', 'I CREATED A NEW EMAIL ACCOUNT', 'CHECK YOUR INBOX',
                'I RECEIVED AN EMAIL FROM MY BOSS', 'DO NOT OPEN SPAM EMAILS', 'I ATTACHED THE FILE TO THE EMAIL',
                'I AM ACTIVE ON SOCIAL MEDIA', 'HOW MANY FOLLOWERS DO YOU HAVE', 'I POSTED A NEW STATUS',
                'I LIKED YOUR PHOTO ON INSTAGRAM', 'CAN I HAVE YOUR SOCIAL MEDIA HANDLE', 'I COMMENTED ON YOUR POST',
                'I SHARE MY CONTENT ONLINE', 'I WATCH YOUTUBE VIDEOS EVERYDAY', 'I AM STREAMING A LIVE VIDEO NOW',
                'THE WEBSITE IS NOT LOADING', 'I CANNOT LOGIN TO MY ACCOUNT', 'I FORGOT MY PASSWORD',
                'IS THIS WIFI SECURE', 'I NEED TO UPDATE MY BROWSER', 'THE APP NEEDS AN UPGRADE',
                'I DOWNLOADED A NEW GAME', 'I UPLOADED PHOTOS TO THE CLOUD', 'BACK UP YOUR DATA REGULARLY',
                'I AM LEARNING ABOUT CYBERSECURITY', 'BE CAREFUL WITH WHAT YOU SHARE ONLINE', 'YOUR ONLINE REPUTATION MATTERS',
                'I AM A CONTENT CREATOR', 'SOCIAL MEDIA INFLUENCES SOCIETY', 'I MANAGE MULTIPLE ACCOUNTS'
            ]
        },
        'Transportation': {
            name: 'Giao thông',
            icon: '🚗',
            words: [
                'CAR', 'BUS', 'TRUCK', 'VAN', 'MOTORCYCLE', 'BICYCLE', 'SCOOTER', 'SKATEBOARD',
                'TRAIN', 'SUBWAY', 'METRO', 'TRAM', 'TAXI', 'UBER', 'LYFT', 'RIDESHARE',
                'AIRPLANE', 'HELICOPTER', 'BOAT', 'FERRY', 'SHIP', 'CRUISE', 'SUBMARINE',
                'ROAD', 'HIGHWAY', 'FREEWAY', 'EXPRESSWAY', 'STREET', 'AVENUE', 'BOULEVARD',
                'LANE', 'SIDEWALK', 'CROSSWALK', 'INTERSECTION', 'TRAFFIC', 'SIGNAL', 'LIGHT',
                'LICENSE', 'PLATE', 'REGISTRATION', 'INSURANCE', 'DRIVING', 'LICENSE', 'PERMIT',
                'DRIVER', 'PASSENGER', 'PEDESTRIAN', 'COMMUTER', 'TRAVELER', 'TOURIST', 'CONDUCTOR',
                'STATION', 'STOP', 'DEPOT', 'TERMINAL', 'AIRPORT', 'HARBOR', 'PORT', 'DOCK',
                'TICKET', 'FARE', 'ROUTE', 'SCHEDULE', 'DELAY', 'CANCEL', 'TRANSFER', 'CONNECTION'
            ],
            sentences: [
                'I DRIVE TO WORK EVERYDAY', 'THE BUS IS ALWAYS LATE', 'I PREFER TAKING THE TRAIN',
                'I AM LEARNING TO DRIVE', 'THE TRAFFIC IS VERY BAD TODAY', 'THIS ROAD IS UNDER CONSTRUCTION',
                'I GOT A TRAFFIC TICKET YESTERDAY', 'THE LICENSE PLATE IS EASY TO READ', 'I HAVE CAR INSURANCE',
                'THE SUBWAY IS THE FASTEST WAY TO TRAVEL', 'I WAITED AT THE BUS STOP FOR AN HOUR', 'IS THE FLIGHT ON TIME',
                'I BOOKED A FLIGHT TO NEW YORK', 'THE SHIP WILL ARRIVE TOMORROW', 'I LIKE RIDING MY BICYCLE',
                'SIDEWALKS ARE FOR PEDESTRIANS', 'THE TRAFFIC LIGHT IS RED', 'PLEASE FOLLOW TRAFFIC RULES',
                'I MISSED MY BUS', 'THE TRAIN IS DELAYED', 'I NEED TO TRANSFER TO ANOTHER LINE',
                'I PREFER RIDESHARE SERVICES', 'THE FARE IS TOO EXPENSIVE', 'THIS ROUTE IS MORE CONVENIENT',
                'I USE GPS FOR DIRECTIONS', 'I GOT LOST ON THE HIGHWAY', 'THE BRIDGE IS CLOSED TODAY',
                'I CARPOOL WITH MY COLLEAGUES', 'PUBLIC TRANSPORT IS AFFORDABLE', 'I AM A SAFE DRIVER',
                'DO YOU HAVE A DRIVING LICENSE', 'I AM LOOKING FOR A PARKING SPACE', 'THE PARKING LOT IS FULL'
            ]
        },
        'Feelings2': {
            name: 'Tình cảm',
            icon: '💕',
            words: [
                'LOVE', 'HEART', 'SOUL', 'FEELING', 'EMOTION', 'PASSION', 'DESIRE', 'ATTRACTION',
                'CRUSH', 'INFATUATION', 'ROMANCE', 'RELATIONSHIP', 'DATING', 'COURTSHIP', 'PROPOSAL',
                'MARRIAGE', 'WEDDING', 'DIVORCE', 'BREAKUP', 'HEARTBREAK', 'LONELINESS', 'MISSING',
                'KISS', 'HUG', 'EMBRACE', 'TOUCH', 'CARESS', 'AFFECTION', 'TENDERNESS', 'DEVOTION',
                'FIDELITY', 'LOYALTY', 'TRUST', 'HONESTY', 'RESPECT', 'SUPPORT', 'COMFORT', 'CARE',
                'JEALOUSY', 'POSSESSIVENESS', 'INSECURITY', 'DOUBT', 'TRUST', 'FORGIVENESS', 'REGRET',
                'ADMIRATION', 'ADORATION', 'CHERISH', 'CHERISHED', 'PRECIOUS', 'TREASURE', 'VALUE',
                'FOREVER', 'ALWAYS', 'NEVER', 'ETERNAL', 'UNCONDITIONAL', 'TRUE_LOVE', 'SOULMATE',
                'PARTNER', 'COUPLE', 'BOYFRIEND', 'GIRLFRIEND', 'HUSBAND', 'WIFE', 'FIANCE', 'FIANCEE',
                'BEST_FRIEND', 'CLOSE_FRIEND', 'ACQUAINTANCE', 'STRANGER', 'NEIGHBOR', 'COLLEAGUE'
            ],
            sentences: [
                'I LOVE YOU MORE THAN WORDS CAN SAY', 'MY HEART BELONGS TO YOU', 'I AM FALLING IN LOVE WITH YOU',
                'WILL YOU MARRY ME', 'I HAVE A CRUSH ON SOMEONE', 'I MISS YOU SO MUCH', 'YOU ARE MY SOULMATE',
                'I CHERISH OUR RELATIONSHIP', 'I TRUST YOU COMPLETELY', 'HONESTY IS IMPORTANT IN LOVE',
                'I AM HEARTBROKEN AFTER THE BREAKUP', 'TIME HEALS ALL WOUNDS', 'I AM LOOKING FOR LOVE',
                'DO YOU BELIEVE IN LOVE AT FIRST SIGHT', 'LOVE IS A BEAUTIFUL FEELING', 'MY HEART IS FULL OF JOY',
                'I CANNOT LIVE WITHOUT YOU', 'YOU ARE THE LOVE OF MY LIFE', 'OUR LOVE IS UNCONDITIONAL',
                'I PROMISED TO LOVE YOU FOREVER', 'I FEEL SO BLESSED TO HAVE YOU', 'THANK YOU FOR LOVING ME',
                'I AM GRATEFUL FOR YOUR SUPPORT', 'YOU MAKE ME A BETTER PERSON', 'I APPRECIATE YOUR KINDNESS',
                'I AM FEELING JEALOUS', 'FORGIVE ME PLEASE', 'I REGRET WHAT I DID',
                'I ADMIRE YOUR STRENGTH', 'YOU ARE MY BEST FRIEND', 'I CHERISH EVERY MOMENT WITH YOU',
                'TRUE LOVE STANDS THE TEST OF TIME', 'I CANNOT WAIT TO SEE YOU', 'MY HEART ACHES FOR YOU'
            ]
        },
        'Actions': {
            name: 'Hành động',
            icon: '👣',
            words: [
                'HELP', 'PLAY', 'STUDY', 'WORK', 'EAT', 'DRINK', 'SLEEP', 'WAKE', 'RUN', 'WALK',
                'SIT', 'STAND', 'SWIM', 'JUMP', 'SPEAK', 'LISTEN', 'SEE', 'THINK', 'KNOW', 'FORGET',
                'WRITE', 'READ', 'DRAW', 'SING', 'DANCE', 'COOK', 'BUY', 'COME', 'GO', 'STOP',
                'START', 'WIN', 'LOSE', 'DREAM', 'HELP', 'CALL', 'SEND', 'TAKE', 'GIVE', 'OPEN',
                'CLOSE', 'PUSH', 'PULL', 'CUT', 'BUILD', 'FIX', 'WASH', 'CLEAN', 'DRY', 'FOLD'
            ],
            sentences: [
                'I AM GOING TO SCHOOL', 'HE IS PLAYING GAMES', 'SHE IS READING A BOOK',
                'THEY ARE EATING BREAKFAST', 'WE ARE WORKING HARD', 'I AM SLEEPING NOW',
                'CAN YOU HELP ME', 'I AM WRITING A LETTER', 'HE IS SPEAKING ENGLISH',
                'SHE IS LISTENING TO MUSIC', 'I AM THINKING ABOUT YOU', 'DO YOU REMEMBER ME',
                'I WILL CALL YOU TOMORROW', 'PLEASE OPEN THE DOOR', 'CLOSE THE WINDOW'
            ]
        },
        'Months': {
            name: 'Tháng',
            icon: '📆',
            words: [
                'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
                'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
            ],
            sentences: [
                'JANUARY IS THE FIRST MONTH', 'FEBRUARY HAS TWENTY EIGHT DAYS', 'MARCH IS THE SPRING MONTH',
                'APRIL IS THE RAINY SEASON', 'MAY IS THE WEDDING MONTH', 'JUNE IS THE SUMMER MONTH',
                'JULY IS VERY HOT', 'AUGUST IS THE VACATION MONTH', 'SEPTEMBER IS THE SCHOOL MONTH',
                'OCTOBER IS THE AUTUMN MONTH', 'NOVEMBER IS THE COOL MONTH', 'DECEMBER IS THE CHRISTMAS MONTH'
            ]
        },
        'Opposites': {
            name: 'Từ trái nghĩa',
            icon: '↔️',
            words: [
                'BIG', 'SMALL', 'TALL', 'SHORT', 'LONG', 'THIN', 'FAT', 'YOUNG', 'OLD',
                'RICH', 'POOR', 'STRONG', 'WEAK', 'FAST', 'SLOW', 'HEAVY', 'LIGHT',
                'HARD', 'SOFT', 'BRIGHT', 'DARK', 'LOUD', 'QUIET', 'CLEAN', 'DIRTY',
                'BEAUTIFUL', 'UGLY', 'GOOD', 'BAD', 'EASY', 'DIFFICULT', 'SAFE', 'DANGEROUS',
                'OPEN', 'CLOSE', 'INSIDE', 'OUTSIDE', 'UP', 'DOWN', 'LEFT', 'RIGHT'
            ],
            sentences: [
                'THE ELEPHANT IS BIG BUT THE MOUSE IS SMALL', 'THE GIRAFFE IS TALL BUT THE TURTLE IS SHORT',
                'THE RIVER IS LONG BUT THE POND IS SMALL', 'THE ADULT IS OLD BUT THE BABY IS YOUNG',
                'THE KING IS RICH BUT THE PEASANT IS POOR', 'THE HERO IS STRONG BUT THE VICTIM IS WEAK',
                'THE CHEETAH IS FAST BUT THE SNAIL IS SLOW', 'THE MOUNTAIN IS HEAVY BUT THE FEATHER IS LIGHT'
            ]
        },
        'Misc': {
            name: 'Tổng hợp',
            icon: '📌',
            words: [
                'QUESTION', 'ANSWER', 'IDEA', 'PLAN', 'GOAL', 'SUCCESS', 'FAILURE', 'EFFORT',
                'PROBLEM', 'SOLUTION', 'CHANGE', 'IMPROVE', 'BUILD', 'FIX', 'CREATE', 'DELETE',
                'SAVE', 'CONFIRM', 'ACCEPT', 'AGREE', 'SUPPORT', 'PROTECT', 'EXPLAIN', 'DESCRIBE',
                'DISCUSS', 'DECIDE', 'CHOOSE', 'COMPARE', 'CONTRAST', 'ANALYZE', 'SOLVE', 'LEARN'
            ],
            sentences: [
                'I HAVE A QUESTION FOR YOU', 'CAN YOU ANSWER MY QUESTION', 'I HAVE A GOOD IDEA',
                'LET US MAKE A PLAN TOGETHER', 'MY GOAL IS TO LEARN ASL', 'SUCCESS REQUIRES EFFORT',
                'EVERY PROBLEM HAS A SOLUTION', 'WE NEED TO MAKE A CHANGE', 'I WANT TO IMPROVE MY SKILLS',
                'LET US BUILD SOMETHING TOGETHER', 'CAN YOU FIX THIS PROBLEM', 'I WILL CREATE A NEW PLAN'
            ]
        },
        'Directions': {
            name: 'Chỉ đường',
            icon: '🧭',
            words: [
                'LEFT', 'RIGHT', 'STRAIGHT', 'UP', 'DOWN', 'NORTH', 'SOUTH', 'EAST', 'WEST',
                'NEAR', 'FAR', 'FRONT', 'BACK', 'INSIDE', 'OUTSIDE', 'HERE', 'THERE',
                'AROUND', 'THROUGH', 'ACROSS', 'ALONG', 'BESIDE', 'BETWEEN', 'UNDER', 'OVER'
            ],
            sentences: [
                'TURN LEFT AT THE CORNER', 'GO STRAIGHT THEN TURN RIGHT', 'THE SCHOOL IS NEAR HERE',
                'THE HOSPITAL IS FAR FROM HERE', 'GO NORTH THEN TURN EAST', 'THE PARK IS IN FRONT OF THE BANK',
                'THE LIBRARY IS BEHIND THE SCHOOL', 'THE MUSEUM IS INSIDE THE CITY', 'THE BEACH IS OUTSIDE THE CITY'
            ]
        }
    };

    // Assignment-driven initialization
    // Assignment tracking (used when entering via /practice?assignmentId=...)
    const [assignmentId, setAssignmentId] = useState(null);
    const assignmentSubmittedRef = useRef(false);
    const [startTime, setStartTime] = useState(null);
    const [assignmentLoading, setAssignmentLoading] = useState(false);
    const assignmentCtx = useAssignment && useAssignment();

    // examId — khi vào từ luồng Bài kiểm tra (/practice?examId=...)
    const [examId, setExamId] = useState(null);

    // ID chung để kiểm tra "đang trong luồng bài tập/kiểm tra"
    const activeSessionId = assignmentId || examId;
    const activeSessionIdRef = useRef(activeSessionId);
    useEffect(() => { activeSessionIdRef.current = activeSessionId; }, [activeSessionId]);

    // ── COUNTDOWN TIMER — chỉ hoạt động khi có activeSessionId (bài kiểm tra/bài tập) ──
    const practiceTimerRef = useRef(null);
    const practiceTimerAdvancingRef = useRef(false);
    const [practiceTimeLeft, setPracticeTimeLeft] = useState(0);
    const [practiceTimeExpired, setPracticeTimeExpired] = useState(false);
    // Ref lưu kết quả khi hết giờ để startXxxPractice đọc được đúng
    const timerExpiredResultRef = useRef(null); // 'incorrect' | null
    // Guard chống double-call startXxxPractice(true)
    const practiceAdvancingRef = useRef(false);

    // Thời gian per loại: letter=60s, word=90s, sentence=240s
    const PRACTICE_TIME_LIMITS = { letter: 60, word: 90, sentence: 240 };

    const getPracticeTimerColor = (tl) => {
        if (tl <= 3) return 'text-red-500 animate-pulse';
        if (tl <= 10) return 'text-orange-500';
        return 'text-blue-600';
    };
    const getPracticeTimerBg = (tl) => {
        if (tl <= 3) return 'bg-red-50 border-red-300';
        if (tl <= 10) return 'bg-orange-50 border-orange-300';
        return 'bg-blue-50 border-blue-200';
    };

    const stopPracticeTimer = () => {
        if (practiceTimerRef.current) {
            clearInterval(practiceTimerRef.current);
            practiceTimerRef.current = null;
        }
    };

    // Gọi khi hết giờ — tự ghi nhận sai và chuyển câu
    const handlePracticeTimeUp = (tab) => {
        setPracticeTimeExpired(true);
        timerExpiredResultRef.current = 'incorrect';
        if (tab === 'letter') {
            setLetterResult(prev => prev === null ? 'incorrect' : prev);
            setIsLetterCorrect(prev => prev === null ? false : prev);
            setTimeout(() => {
                setPracticeTimeExpired(false);
                timerExpiredResultRef.current = null;
                startLetterPractice(true);
            }, 1000);
        } else if (tab === 'word') {
            setWordResult(prev => prev === null ? 'incorrect' : prev);
            setTimeout(() => {
                setPracticeTimeExpired(false);
                timerExpiredResultRef.current = null;
                startWordPractice(true);
            }, 1000);
        } else if (tab === 'sentence') {
            setSentenceResult(prev => prev === null ? 'incorrect' : prev);
            setTimeout(() => {
                setPracticeTimeExpired(false);
                timerExpiredResultRef.current = null;
                startSentencePractice(true);
            }, 1000);
        }
    };

    const startPracticeTimer = (tab) => {
        if (!activeSessionIdRef.current) return; // chỉ chạy khi bài kiểm tra
        stopPracticeTimer();
        practiceTimerAdvancingRef.current = false;
        setPracticeTimeExpired(false);
        const duration = PRACTICE_TIME_LIMITS[tab] ?? 60;
        setPracticeTimeLeft(duration);
        practiceTimerRef.current = setInterval(() => {
            setPracticeTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(practiceTimerRef.current);
                    practiceTimerRef.current = null;
                    if (!practiceTimerAdvancingRef.current) {
                        practiceTimerAdvancingRef.current = true;
                        handlePracticeTimeUp(tab);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Cleanup timer khi unmount
    useEffect(() => { return () => stopPracticeTimer(); }, []);

    // Exit modal state (chỉ dùng khi đang trong luồng bài tập/kiểm tra)
    const [showExitModal, setShowExitModal] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const q = new URLSearchParams(location.search);
        const aid = q.get('assignmentId');
        if (!aid) return;
        // If we already have the same assignment loaded, skip
        if (assignmentId === aid) return;

        const fetchAssignment = async () => {
            setAssignmentLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`http://localhost:5000/api/student/assignments/${aid}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (!res.ok) {
                    toast.error(data.message || 'Assignment not found');
                    return;
                }
                const assignment = data.assignment || data;

                const mode = assignment.mode || 'normal';
                const type = assignment.type || 'letter';
                setPracticeMode(mode === 'topic' ? 'topic' : 'normal');
                if (mode === 'topic' && assignment.topic) {
                    const key = Object.keys(TOPICS).find(k => k.toLowerCase() === (assignment.topic || '').toLowerCase());
                    if (key) setSelectedTopic(key);
                }

                setAssignmentId(aid);
                assignmentSubmittedRef.current = false; // Reset for each new attempt
                try { if (assignmentCtx && assignmentCtx.lock) assignmentCtx.lock(aid); } catch(e){}
                setStartTime(Date.now());

                // Build a question pool and initialize first target
                let pool = [];
                if (type === 'letter') {
                    pool = ALPHABET.split('');
                } else if (type === 'word') {
                    pool = COMMON_WORDS.slice();
                    if (mode === 'topic' && assignment.topic) {
                        const key = Object.keys(TOPICS).find(k => k.toLowerCase() === (assignment.topic || '').toLowerCase());
                        if (key) pool = TOPICS[key].words.slice();
                    }
                } else if (type === 'sentence') {
                    pool = COMMON_SENTENCES.slice();
                    if (mode === 'topic' && assignment.topic) {
                        const key = Object.keys(TOPICS).find(k => k.toLowerCase() === (assignment.topic || '').toLowerCase());
                        if (key) pool = TOPICS[key].sentences.slice();
                    }
                }

                pool = pool.sort(() => Math.random() - 0.5);
                if (type === 'letter' && pool.length > 0) {
                    const first = pool[0];
                    letterEvaluatedRef.current = false;
                    setUsedLetterItems([]);
                    setLetterSessionRound(1);
                    setTargetLetter(first);
                    currentTargetRef.current = first;
                    setLetterResult(null);
                    setLetterAccuracy(0);
                } else if (type === 'word' && pool.length > 0) {
                    const first = pool[0];
                    wordEvaluatedRef.current = false;
                    setUsedWordItems([]);
                    setWordSessionRound(1);
                    setTargetWord(first.replace(/_/g, ' '));
                    wordTargetRef.current = first.replace(/_/g, '');
                    setSpelledLetters([]);
                } else if (type === 'sentence' && pool.length > 0) {
                    const first = pool[0];
                    sentenceEvaluatedRef.current = false;
                    setUsedSentenceItems([]);
                    setSentenceSessionRound(1);
                    setTargetSentence(first.replace(/_/g, ' '));
                    sentenceTargetRef.current = first.replace(/_/g, ' ');
                    setPerformedLetters([]);
                }

                if (type === 'letter') setActiveTab('letter');
                else if (type === 'word') setActiveTab('word');
                else if (type === 'sentence') setActiveTab('sentence');

                // Khởi động timer cho câu đầu tiên (assignment)
                activeSessionIdRef.current = aid;
                setTimeout(() => {
                    if (type === 'letter') startPracticeTimer('letter');
                    else if (type === 'word') startPracticeTimer('word');
                    else if (type === 'sentence') startPracticeTimer('sentence');
                }, 300);

                toast.success(t('common.assignmentReady'));
            } catch (err) {
                console.error('Assignment fetch error:', err);
                toast.error(t('common.assignmentLoadFailed'));
            }
            finally {
                setAssignmentLoading(false);
                try { if (assignmentCtx && assignmentCtx.markReady) assignmentCtx.markReady(); } catch(e){}
            }
        };

        fetchAssignment();
    }, [location.search, assignmentId]);

    // Đọc examId từ URL (/practice?examId=...) và fetch exam data
    useEffect(() => {
        const q = new URLSearchParams(location.search);
        const eid = q.get('examId');
        if (!eid) return;
        if (examId === eid) return;

        const fetchExam = async () => {
            setAssignmentLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`http://localhost:5000/api/student/exams/${eid}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (!res.ok) {
                    toast.error(data.message || 'Exam not found');
                    return;
                }
                const exam = data.exam || data;
                const mode = exam.mode || 'normal';
                const type = exam.type || 'letter';

                setPracticeMode(mode === 'topic' ? 'topic' : 'normal');
                if (mode === 'topic' && exam.topic) {
                    const key = Object.keys(TOPICS).find(k => k.toLowerCase() === (exam.topic || '').toLowerCase());
                    if (key) setSelectedTopic(key);
                }

                setExamId(eid);
                assignmentSubmittedRef.current = false;
                try { if (assignmentCtx && assignmentCtx.lock) assignmentCtx.lock(eid); } catch(e){}
                setStartTime(Date.now());

                // Build question pool giống assignment
                let pool = [];
                if (type === 'letter') {
                    pool = ALPHABET.split('');
                } else if (type === 'word') {
                    pool = COMMON_WORDS.slice();
                    if (mode === 'topic' && exam.topic) {
                        const key = Object.keys(TOPICS).find(k => k.toLowerCase() === (exam.topic || '').toLowerCase());
                        if (key) pool = TOPICS[key].words.slice();
                    }
                } else if (type === 'sentence') {
                    pool = COMMON_SENTENCES.slice();
                    if (mode === 'topic' && exam.topic) {
                        const key = Object.keys(TOPICS).find(k => k.toLowerCase() === (exam.topic || '').toLowerCase());
                        if (key) pool = TOPICS[key].sentences.slice();
                    }
                }

                pool = pool.sort(() => Math.random() - 0.5);
                if (type === 'letter' && pool.length > 0) {
                    const first = pool[0];
                    letterEvaluatedRef.current = false;
                    setUsedLetterItems([]);
                    setLetterSessionRound(1);
                    setTargetLetter(first);
                    currentTargetRef.current = first;
                    setLetterResult(null);
                    setLetterAccuracy(0);
                } else if (type === 'word' && pool.length > 0) {
                    const first = pool[0];
                    wordEvaluatedRef.current = false;
                    setUsedWordItems([]);
                    setWordSessionRound(1);
                    setTargetWord(first.replace(/_/g, ' '));
                    wordTargetRef.current = first.replace(/_/g, '');
                    setSpelledLetters([]);
                } else if (type === 'sentence' && pool.length > 0) {
                    const first = pool[0];
                    sentenceEvaluatedRef.current = false;
                    setUsedSentenceItems([]);
                    setSentenceSessionRound(1);
                    setTargetSentence(first.replace(/_/g, ' '));
                    sentenceTargetRef.current = first.replace(/_/g, ' ');
                    setPerformedLetters([]);
                }

                if (type === 'letter') setActiveTab('letter');
                else if (type === 'word') setActiveTab('word');
                else if (type === 'sentence') setActiveTab('sentence');

                // Khởi động timer cho câu đầu tiên (exam)
                activeSessionIdRef.current = eid;
                setTimeout(() => {
                    if (type === 'letter') startPracticeTimer('letter');
                    else if (type === 'word') startPracticeTimer('word');
                    else if (type === 'sentence') startPracticeTimer('sentence');
                }, 300);

                toast.success(t('common.assignmentReady'));
            } catch (err) {
                console.error('Exam fetch error:', err);
                toast.error(t('common.assignmentLoadFailed'));
            } finally {
                setAssignmentLoading(false);
                try { if (assignmentCtx && assignmentCtx.markReady) assignmentCtx.markReady(); } catch(e){}
            }
        };

        fetchExam();
    }, [location.search, examId]);

    // Try to submit results if user navigates away without explicitly submitting
    useEffect(() => {
        return () => {
            if (assignmentId && !assignmentSubmittedRef.current) {
                // fire-and-forget
                submitAssignmentResults();
            }
        };
    }, [assignmentId]);

    // Prevent accidental unload when assignment is locked
    useEffect(() => {
        if (!assignmentCtx) return;
        const onBeforeUnload = (e) => {
            if (assignmentCtx.isLocked) {
                e.preventDefault();
                e.returnValue = 'Bạn đang làm bài tập. Rời trang sẽ tự động nộp kết quả.';
                return e.returnValue;
            }
        };
        if (assignmentCtx.isLocked) window.addEventListener('beforeunload', onBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
        };
    }, [assignmentCtx && assignmentCtx.isLocked]);

    // Chặn Back button / navigate trong app khi đang làm bài tập/kiểm tra
    // Dùng popstate thay vì useBlocker để tránh crash với React Router v7
    useEffect(() => {
        if (!activeSessionId || assignmentSubmittedRef.current) return;

        // Push một entry để có thể forward() về khi user bấm Hủy
        window.history.pushState(null, '', window.location.href);

        const handlePopState = () => {
            // Push lại để giữ nguyên trang (nút Back bị vô hiệu hóa)
            window.history.pushState(null, '', window.location.href);
            // Hiện modal xác nhận
            setShowExitModal(true);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [activeSessionId]);
    
    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
            return;
        }
        
        const userData = localStorage.getItem('user');
        if (userData) {
            setCurrentUser(JSON.parse(userData));
        }

        const getCameras = async () => {
            try {
                // Check permission status to avoid automatic prompt on load
                if (navigator.permissions && navigator.permissions.query) {
                    try {
                        const status = await navigator.permissions.query({ name: 'camera' });
                        if (status.state === 'denied') {
                            console.warn('Camera permission denied');
                            return;
                        }
                    } catch (permErr) {
                        console.debug('Permission api not supported for camera:', permErr);
                    }
                }

                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                setCameras(videoDevices);
                if (videoDevices.length > 0) {
                    setSelectedCamera(videoDevices[0].deviceId);
                }
            } catch (err) {
                console.error("Camera access denied:", err);
            }
        };
        getCameras();

        return () => {
            manualStopRef.current = true;
            cleanupCamera();
        };
    }, [navigate]);

    useEffect(() => {
        const attachStream = async () => {
            if (!isStreaming || !videoRef.current || !streamRef.current) return;
            if (videoRef.current.srcObject !== streamRef.current) {
                videoRef.current.srcObject = streamRef.current;
            }
            try {
                await videoRef.current.play();
            } catch (err) {
                console.error('Video play error:', err);
            }
        };
        attachStream();
    }, [isStreaming]);

    const cleanupCamera = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        const stream = streamRef.current || videoRef.current?.srcObject;
        const tracks = stream?.getTracks() || [];
        tracks.forEach(track => track.stop());
        streamRef.current = null;
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const startCamera = async () => {
        if (isStreaming) return;
        try {
            manualStopRef.current = false;
            const constraints = {
                video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            setIsStreaming(true);

            // Auto start practice when camera is on - bắt đầu lượt 1
            if (activeTab === 'letter' && !targetLetter) {
                setTimeout(() => {
                    setLetterSessionRound(1);
                    startLetterPractice(false);
                }, 500);
            } else if (activeTab === 'word' && !targetWord) {
                setTimeout(() => {
                    setWordSessionRound(1);
                    startWordPractice(false);
                }, 500);
            } else if (activeTab === 'sentence' && !targetSentence) {
                setTimeout(() => {
                    setSentenceSessionRound(1);
                    startSentencePractice(false);
                }, 500);
            }

            const connectWebSocket = () => {
                if (manualStopRef.current) return;
                console.log('Đang kết nối WebSocket...');
                const ws = new WebSocket(WS_URL);
                wsRef.current = ws;
                
                ws.onopen = () => {
                    console.log('WebSocket connected!');
                    isWaitingRef.current = false; // Reset cờ chờ frame để đảm bảo không bị kẹt từ phiên trước
                    toast.success(t('common.aiServerConnected'));
                };
                ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    toast.error(t('common.aiServerConnectFailed'));
                };
                ws.onmessage = (event) => {
                    isWaitingRef.current = false;
                    const data = JSON.parse(event.data);
                    // console.log('Received from AI:', data);
                    handleWebSocketMessage(data);
                };
                ws.onclose = () => {
                    if (manualStopRef.current) return;
                    console.log('WebSocket disconnected, retrying...');
                    reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
                };
            };
            connectWebSocket();
            
            intervalRef.current = setInterval(() => {
                if (videoRef.current && canvasRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
                    if (Date.now() < actionCooldownUntilRef.current) return;
                    if (isWaitingRef.current) return;
                    
                    const context = canvasRef.current.getContext('2d');
                    context.drawImage(videoRef.current, 0, 0, 640, 480);
                    const base64 = canvasRef.current.toDataURL('image/jpeg', 0.7);
                    
                    isWaitingRef.current = true;
                    wsRef.current.send(JSON.stringify({ image: base64 }));
                }
            }, 100);
        } catch (err) {
            toast.error(`Lỗi khi mở camera: ${err?.name || 'UnknownError'}`);
        }
    };

    const stopCamera = () => {
        manualStopRef.current = true;
        setIsStreaming(false);
        setIsHandPresent(false);
        setCurrentLetter('-');
        cleanupCamera();
    };

    const handleWebSocketMessage = (data) => {
        const detectedLetter = data.current_letter || '';
        const hasHand = data.is_hand_present === true;
        
        // Reset display khi khong co tay
        if (!hasHand) {
            setCurrentLetter('');
            setIsHandPresent(false);
            setSkeletonImage(null);
            displayLetterRef.current = { letter: '', stableSince: 0 };
            letterStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
            wordStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
            sentenceStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
            return;
        }
        
        setIsHandPresent(true);
        setSkeletonImage(data.skeleton_image || null);
        
        // Khong xu ly neu AI khong nhan ra chu
        if (!detectedLetter) {
            return;
        }
        
        // === STABILITY CHO DISPLAY ===
        const now = Date.now();
        const display = displayLetterRef.current;
        
        if (display.letter !== detectedLetter) {
            // Chu moi - bat dau dem lai
            displayLetterRef.current = { letter: detectedLetter, stableSince: now };
        } else if (now - display.stableSince >= 800) {
            // Cung chu va da on dinh 800ms - cap nhat UI
            setCurrentLetter(detectedLetter);
        }

        // === STABILITY CHO PRACTICE ===
        if (activeTab === 'letter') {
            handleLetterPractice(detectedLetter);
        } else if (activeTab === 'word') {
            handleWordPractice(detectedLetter);
        } else if (activeTab === 'sentence') {
            handleSentencePractice(detectedLetter);
        }
    };

    const handleLetterPractice = (detectedLetter) => {
        const target = currentTargetRef.current;
        
        // Chỉ xử lý khi có target từ letter practice
        // Chỉ dùng ref để tránh race condition với React state
        if (!target || letterEvaluatedRef.current) {
            console.log('[LetterPractice] Skipped - target:', target, 'evaluated:', letterEvaluatedRef.current, 'state targetLetter:', targetLetter);
            return;
        }
        
        const now = Date.now();
        const stability = letterStabilityRef.current;

        // Chu moi - reset stability
        if (stability.letter !== detectedLetter) {
            letterStabilityRef.current = { 
                letter: detectedLetter, 
                count: 1, 
                lastChange: now,
                stableSince: now
            };
            return;
        }

        // Cung chu - tang count
        letterStabilityRef.current.count++;

        // Chi danh gia khi du 1.5s VA it nhat 2 lan
        if (now - stability.stableSince >= 1500 && stability.count >= 2) {
            // DANH GIA XONG - ngăn chặn mọi lần gọi tiếp theo
            letterEvaluatedRef.current = true;
            feedbackCooldownRef.current = true;
            
            const isCorrect = detectedLetter.toUpperCase() === target.toUpperCase();
            const accuracy = calculateAccuracy(detectedLetter, target);
            
            // Reset stability de chan goi lai
            letterStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
            
            setIsLetterCorrect(isCorrect);
            setLetterAccuracy(accuracy);
            setLetterResult(isCorrect ? 'correct' : 'incorrect');
            stopPracticeTimer(); // dừng timer khi đã nhận diện xong

            // Hiển thị feedback nâng cao
            setCurrentFeedback({
                targetLetter: target,
                detectedLetter: detectedLetter,
                accuracy: accuracy,
                isCorrect: isCorrect,
                type: 'letter'
            });
            setShowFeedback(true);

            // Hiển thị feedback nhưng CHƯA tính đúng/sai
            // Đúng/Sai chỉ được tính khi bấm "Chữ cái mới"
            if (isCorrect) {
                toast.success(`Chính xác! Độ chính xác: ${accuracy}%`);
            } else {
                toast.error(`Chưa đúng! Bạn thực hiện "${detectedLetter}", yêu cầu "${target}"`);
            }
        }
    };

    // Word Practice - nhận diện từng ký tự, cho phép sai rồi tiếp tục
    // CHỈ TÍNH ĐÚNG/SAI KHI HOÀN THÀNH CẢ TỪ
    const handleWordPractice = (detectedLetter) => {
        const target = wordTargetRef.current;
        // Chỉ xử lý khi có target từ word practice (không phải letter practice)
        // Sử dụng wordTargetRef.current thay vì targetWord để tránh stale state
        if (!target || wordEvaluatedRef.current) {
            return;
        }

        const now = Date.now();
        if (now < practiceEvaluationCooldownRef.current) return; // Đang trong thời gian chờ chuyển chữ

        const currentIdx = wordSpellIndexRef.current;
        if (currentIdx >= target.length) return;

        const expectedLetter = target[currentIdx]?.toUpperCase();
        if (!expectedLetter) return;

        const stability = wordStabilityRef.current;

        // Chữ mới - reset stability
        if (stability.letter !== detectedLetter) {
            wordStabilityRef.current = { 
                letter: detectedLetter, 
                count: 1, 
                lastChange: now,
                stableSince: now
            };
            return;
        }

        // Cùng chữ - tăng count
        stability.count += 1;
        wordStabilityRef.current = stability;
        console.log('[WordPractice] Letter detected:', detectedLetter, 'Count:', stability.count, 'Time since stable:', now - stability.stableSince);

        // Chờ đủ 1s stability (đủ nhanh để phản hồi kịp thời)
        if (now - stability.stableSince >= 1000 && stability.count >= 2) {
            const isCorrect = detectedLetter.toUpperCase() === expectedLetter;
            
            // Reset stability ngay lập tức
            wordStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
            
            // Lưu vào ref
            spelledLettersRef.current[currentIdx] = { letter: detectedLetter, correct: isCorrect };
            
            if (isCorrect) {
                // Đúng - tự động chuyển sang ký tự tiếp
                wordSpellIndexRef.current = currentIdx + 1;
                setCurrentSpellIndex(currentIdx + 1);
                setSpelledLetters([...spelledLettersRef.current]);
                toast.success(`Đúng chữ ${expectedLetter}!`);
                
                // Trắc nghiệm hoàn thành từ
                if (spelledLettersRef.current.length === target.length && !spelledLettersRef.current.includes(undefined)) {
                    const allCorrect = spelledLettersRef.current.every(l => l && l.correct);
                    wordEvaluatedRef.current = true;
                    setWordResult(allCorrect ? 'correct' : 'incorrect');
                    stopPracticeTimer(); // dừng timer khi hoàn thành từ
                    if (allCorrect) toast.success(`Hoàn thành từ "${target}"!`);
                } else {
                    practiceEvaluationCooldownRef.current = now + 2000; // Nghỉ 2s để người dùng đổi tay
                }
            } else {
                // Sai - vẫn cho tiếp tục
                setSpelledLetters([...spelledLettersRef.current]);
                wordSpellIndexRef.current = currentIdx + 1;
                setCurrentSpellIndex(currentIdx + 1);
                toast.error(`Sai chữ ${expectedLetter}. Chuyển sang ký tự tiếp theo!`);
                
                // Trắc nghiệm hoàn thành từ
                if (spelledLettersRef.current.length === target.length && !spelledLettersRef.current.includes(undefined)) {
                    wordEvaluatedRef.current = true;
                    setWordResult('incorrect');
                    stopPracticeTimer(); // dừng timer khi hoàn thành từ (sai)
                    toast.error(`Từ "${target}" chưa chính xác!`);
                } else {
                    practiceEvaluationCooldownRef.current = now + 2000; // Nghỉ 2s để người dùng đổi tay
                }
            }
        }
    };

    // Sentence Practice - nhận diện từng ký tự, cho phép sai rồi tiếp tục
    // CHỈ TÍNH ĐÚNG/SAI KHI HOÀN THÀNH CẢ CÂU
    const handleSentencePractice = (detectedLetter) => {
        const target = sentenceTargetRef.current;
        // Chỉ xử lý khi có target từ sentence practice
        // Sử dụng sentenceTargetRef.current thay vì targetSentence để tránh stale state
        if (!target || sentenceEvaluatedRef.current) return;

        const now = Date.now();
        if (now < practiceEvaluationCooldownRef.current) return; // Đang trong thời gian chờ chuyển chữ

        const targetLetters = target.replace(/\s/g, '').toUpperCase().split('');
        const currentIdx = sentenceIndexRef.current;
        const expectedLetter = targetLetters[currentIdx];
        
        if (!expectedLetter) return;
        if (currentIdx >= targetLetters.length) return;

        const stability = sentenceStabilityRef.current;

        // Chữ mới - reset stability
        if (stability.letter !== detectedLetter) {
            sentenceStabilityRef.current = { 
                letter: detectedLetter, 
                count: 1, 
                lastChange: now,
                stableSince: now
            };
            return;
        }

        // Cùng chữ - tăng count
        stability.count += 1;
        sentenceStabilityRef.current = stability;

        // Chờ đủ 1s stability (đủ nhanh để phản hồi kịp thời)
        if (now - stability.stableSince >= 1000 && stability.count >= 2) {
            const isCorrect = detectedLetter.toUpperCase() === expectedLetter;
            
            // Reset stability ngay
            sentenceStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
            
            // Lưu vào ref
            performedLettersRef.current[currentIdx] = { letter: detectedLetter, correct: isCorrect };
            
            if (isCorrect) {
                sentenceIndexRef.current = currentIdx + 1;
                setPerformedLetters([...performedLettersRef.current]);
                toast.success(`Đúng chữ ${expectedLetter}!`);
                
                // Trắc nghiệm hoàn thành câu
                if (performedLettersRef.current.length === targetLetters.length && !performedLettersRef.current.includes(undefined)) {
                    const allCorrect = performedLettersRef.current.every(l => l && l.correct);
                    sentenceEvaluatedRef.current = true;
                    setSentenceResult(allCorrect ? 'correct' : 'incorrect');
                    stopPracticeTimer(); // dừng timer khi hoàn thành câu
                    if (allCorrect) toast.success(`${t('practice.perfectSentence', { sentence: target })}`);
                } else {
                    practiceEvaluationCooldownRef.current = now + 2000;
                }
            } else {
                // Tự động chuyển sang ký tự tiếp
                sentenceIndexRef.current = currentIdx + 1;
                setPerformedLetters([...performedLettersRef.current]);
                toast.error(`Sai chữ ${expectedLetter}. Chuyển sang ký tự tiếp theo!`);
                
                // Trắc nghiệm hoàn thành câu
                if (performedLettersRef.current.length === targetLetters.length && !performedLettersRef.current.includes(undefined)) {
                    sentenceEvaluatedRef.current = true;
                    setSentenceResult('incorrect');
                    stopPracticeTimer(); // dừng timer khi hoàn thành câu (sai)
                    toast.error(`Câu "${target}" bị sai!`);
                } else {
                    practiceEvaluationCooldownRef.current = now + 2000;
                }
            }
        }
    };

    const calculateAccuracy = (detected, target) => {
        if (detected.toUpperCase() === target.toUpperCase()) return 100;
        const similarity = detected.toUpperCase() === target.toUpperCase() ? 1 : 0;
        return Math.round(similarity * 100);
    };

    const submitAssignmentResults = async () => {
        if (!assignmentId && !examId) return false;
        if (assignmentSubmittedRef.current) return true;
        try {
            const token = localStorage.getItem('token');
            // Dùng ref để đảm bảo luôn đọc giá trị mới nhất, tránh stale closure
            const rd = resultsDataRef.current;
            const accuracy = rd?.accuracy ?? 0;
            const correct = rd?.correct ?? 0;
            const total = (rd && (rd.correct + rd.wrong)) || 0;
            const timeSpent = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
            const payload = {
                answers: [],
                score: accuracy,
                accuracy,
                timeSpent,
                total,
                correctCount: correct
            };

            // Dùng đúng endpoint tùy theo loại (bài tập hay bài kiểm tra)
            const endpoint = examId
                ? `http://localhost:5000/api/student/exams/${examId}/submit`
                : `http://localhost:5000/api/student/assignments/${assignmentId}/submit`;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            // Try to parse JSON safely (server may return non-JSON on error)
            let data = {};
            try {
                data = await res.json();
            } catch (e) {
                try {
                    const text = await res.text();
                    data = { message: text };
                } catch (e2) {
                    data = { message: 'No response body' };
                }
            }

            if (res.ok) {
                assignmentSubmittedRef.current = true;
                try { if (assignmentCtx && assignmentCtx.release) assignmentCtx.release(); } catch(e){}
                toast.success(t('common.assignmentResultSaved'));
                return true;
            } else {
                console.error('Submit assignment failed', { status: res.status, body: data });
                toast.error(data.message || 'Lưu kết quả thất bại');
                return false;
            }
        } catch (err) {
            console.error('Submit assignment error:', err);
            toast.error(t('common.assignmentResultError'));
            return false;
        }
    };

    // Helper function to get random item without repetition
    const getNextItem = (items, usedItems) => {
        const available = items.filter(item => !usedItems.includes(item));
        if (available.length === 0) return null; // All items used
        return available[Math.floor(Math.random() * available.length)];
    };

    const startLetterPractice = (fromUserClick = false) => {
        // Lấy chữ cái ngẫu nhiên không trùng lặp
        const newLetter = getNextItem(ALPHABET.split(''), usedLetterItems);
        if (!newLetter) {
            toast.error(t('common.noMoreLetters'));
            return;
        }
        
        // Khi bấm nút chuyển lượt (từ lượt 1 đến lượt 10)
        if (fromUserClick) {
            // Guard chống double-call (timer + nút bấm cùng lúc)
            if (practiceAdvancingRef.current) return;
            practiceAdvancingRef.current = true;
            setTimeout(() => { practiceAdvancingRef.current = false; }, 1500);

            // Đọc kết quả: ưu tiên timerExpiredResultRef (khi hết giờ) để tránh stale state
            const effectiveResult = timerExpiredResultRef.current ?? letterResult;
            const isCorrect = effectiveResult === 'correct';
            const currentRound = letterSessionRound;
            
            // Guard: nếu đã hiển thị kết quả rồi thì không làm gì
            if (currentRound > 10) {
                return;
            }
            
            // Nếu đã hoàn thành 10 lượt (round = 10): tính kết quả round 10 + hiện modal
            if (currentRound === 10) {
                // Tính kết quả round 10 (kết quả round 1-9 đã được tính trước đó)
                const finalCorrect = isCorrect ? letterCorrect + 1 : letterCorrect;
                const finalWrong = isCorrect ? letterWrong : letterWrong + 1;
                const letterResult10 = {
                    type: 'letter',
                    correct: finalCorrect,
                    wrong: finalWrong,
                    accuracy: 10 > 0 ? Math.round((finalCorrect / 10) * 100) : 0
                };
                resultsDataRef.current = letterResult10;
                setResultsData(letterResult10);
                setShowResultsModal(true);
                return;
            }
            
            // Lượt 1-9: Tính kết quả lượt vừa xong + chuyển lượt mới
            if (isCorrect) {
                setLetterCorrect(prev => prev + 1);
            } else {
                setLetterWrong(prev => prev + 1);
            }
            setLetterSessionRound(currentRound + 1);
            
            // Reset state cho lượt mới
            letterEvaluatedRef.current = false;
            setTargetLetter(newLetter);
            currentTargetRef.current = newLetter;
            setLetterResult(null);
            setLetterAccuracy(0);
            setIsLetterCorrect(null);
            setIsLetterRetry(false);
            letterStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
            displayLetterRef.current = { letter: '', stableSince: 0 };
            feedbackCooldownRef.current = false;
            setUsedLetterItems(prev => [...prev, newLetter]);
            
            const displayRound = letterSessionRound + 1;
            toast(`${t('practice.roundLetter', { current: displayRound, total: 10, letter: newLetter })}`, { icon: '📝' });
            startPracticeTimer('letter'); // ── timer cho bài kiểm tra
            return;
        }
        
        // Reset state cho lượt mới (khi bật camera lần đầu, không phải từ nút bấm)
        letterEvaluatedRef.current = false;
        setTargetLetter(newLetter);
        currentTargetRef.current = newLetter;
        setLetterResult(null);
        setLetterAccuracy(0);
        setIsLetterCorrect(null);
        setIsLetterRetry(false);
        letterStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
        displayLetterRef.current = { letter: '', stableSince: 0 };
        feedbackCooldownRef.current = false;
        setUsedLetterItems(prev => [...prev, newLetter]);
        
        const displayRound = letterSessionRound + 1;
        toast(`${t('practice.roundLetter', { current: displayRound, total: 10, letter: newLetter })}`, { icon: '📝' });
        startPracticeTimer('letter'); // ── timer cho bài kiểm tra
    };

    const resetLetterPractice = () => {
        // Reset để nhận diện lại trong cùng lượt
        // KHÔNG trừ kết quả vì chưa tính gì khi nhận diện
        setLetterResult(null);
        setLetterAccuracy(0);
        setIsLetterCorrect(null);
        
        // Reset để cho phép đánh giá lại trong lượt này
        letterEvaluatedRef.current = false;
        feedbackCooldownRef.current = false;
        letterStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
        displayLetterRef.current = { letter: '', stableSince: 0 };
        
        toast.success(`${t('practice.retryLetter', { letter: currentTargetRef.current })}`);
    };

    const startWordPractice = (fromUserClick = false) => {
        // Lấy từ ngẫu nhiên không trùng lặp
        // Nếu đang ở chế độ chủ đề, lấy từ chủ đề đó
        let wordPool = COMMON_WORDS;
        if (practiceMode === 'topic' && selectedTopic && TOPICS[selectedTopic]) {
            wordPool = TOPICS[selectedTopic].words;
        }
        const newWord = getNextItem(wordPool, usedWordItems);
        if (!newWord) {
            toast.error(t('common.noMoreWords'));
            return;
        }
        
        // Khi bấm nút chuyển lượt (từ lượt 1 đến lượt 10)
        if (fromUserClick) {
            // Guard chống double-call (timer + nút bấm cùng lúc)
            if (practiceAdvancingRef.current) return;
            practiceAdvancingRef.current = true;
            setTimeout(() => { practiceAdvancingRef.current = false; }, 1500);

            // Đọc kết quả: nếu hết giờ dùng timerExpiredResultRef, ngược lại dùng spelledLetters
            let allCorrect;
            if (timerExpiredResultRef.current === 'incorrect') {
                allCorrect = false;
            } else {
                const isFullTarget = spelledLettersRef.current.length === wordTargetRef.current.length && !spelledLettersRef.current.includes(undefined);
                allCorrect = isFullTarget && spelledLettersRef.current.every(l => l && l.correct);
            }
            const currentRound = wordSessionRound;
            
            // Guard: nếu đã hiển thị kết quả rồi thì không làm gì
            if (currentRound > 10) {
                return;
            }
            
            // Nếu đã hoàn thành 10 lượt (round = 10): tính kết quả round 10 + hiện modal
            if (currentRound === 10) {
                // Tính kết quả round 10 (kết quả round 1-9 đã được tính trước đó)
                const finalCorrect = allCorrect ? wordCorrect + 1 : wordCorrect;
                const finalWrong = allCorrect ? wordWrong : wordWrong + 1;
                const wordResult10 = {
                    type: 'word',
                    correct: finalCorrect,
                    wrong: finalWrong,
                    accuracy: 10 > 0 ? Math.round((finalCorrect / 10) * 100) : 0
                };
                resultsDataRef.current = wordResult10;
                setResultsData(wordResult10);
                setShowResultsModal(true);
                return;
            }
            
            // Lượt 1-9: Tính kết quả lượt vừa xong + chuyển lượt mới
            if (allCorrect) {
                setWordCorrect(prev => prev + 1);
            } else {
                setWordWrong(prev => prev + 1);
            }
            setWordSessionRound(currentRound + 1);
            
            // Reset state cho lượt mới
            setTargetWord(newWord.replace(/_/g, ' '));
            wordTargetRef.current = newWord.replace(/_/g, '');
            setSpelledLetters([]);
            spelledLettersRef.current = [];
            setCurrentSpellIndex(0);
            wordSpellIndexRef.current = 0;
            setWordResult(null);
            setSpellingFeedback(null);
            wordEvaluatedRef.current = false;
            wordStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
            setUsedWordItems(prev => [...prev, newWord]);
            
            const wordDisplayRound = wordSessionRound + 1;
            toast(`${t('practice.roundWord', { current: wordDisplayRound, total: 10, word: newWord })}`, { icon: '📚' });
            practiceEvaluationCooldownRef.current = Date.now() + 1000;
            startPracticeTimer('word'); // ── timer cho bài kiểm tra
            return;
        }
        
        // Reset state cho lượt mới (khi bật camera lần đầu, không phải từ nút bấm)
        setTargetWord(newWord.replace(/_/g, ' '));
        wordTargetRef.current = newWord.replace(/_/g, '');
        setSpelledLetters([]);
        spelledLettersRef.current = [];
        setCurrentSpellIndex(0);
        wordSpellIndexRef.current = 0;
        setWordResult(null);
        setSpellingFeedback(null);
        wordEvaluatedRef.current = false;
        wordStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
        setUsedWordItems(prev => [...prev, newWord]);
        
        const wordDisplayRound = wordSessionRound + 1;
        toast(`${t('practice.roundWord', { current: wordDisplayRound, total: 10, word: newWord })}`, { icon: '📚' });
        practiceEvaluationCooldownRef.current = Date.now() + 1000;
        startPracticeTimer('word'); // ── timer cho bài kiểm tra
    };

    const resetWordPractice = () => {
        // Reset state để nhận diện lại từ này
        // KHÔNG tăng attempts - vẫn là lượt cũ
        setSpelledLetters([]);
        spelledLettersRef.current = [];
        setCurrentSpellIndex(0);
        wordSpellIndexRef.current = 0;
        setWordResult(null);
        setSpellingFeedback(null);
        wordEvaluatedRef.current = false;
        wordStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };

        toast.success(`${t('practice.retryWord', { word: wordTargetRef.current })}`);
    };

    // ========== RESET KHI CHUYỂN CHỦ ĐỀ ==========
    const resetTopicPractice = () => {
        // Reset Letter Practice
        setTargetLetter('');
        currentTargetRef.current = '';
        setLetterResult(null);
        setLetterAccuracy(0);
        setLetterAttempts(0);
        setLetterCorrect(0);
        setLetterWrong(0);
        setIsLetterCorrect(null);
        setIsLetterRetry(false);
        setShowFeedback(false);
        setCurrentFeedback(null);
        setFeedbackHistory([]);
        letterEvaluatedRef.current = false;
        letterStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
        displayLetterRef.current = { letter: '', stableSince: 0 };
        setUsedLetterItems([]);
        setLetterSessionRound(0);

        // Reset Word Practice
        setTargetWord('');
        wordTargetRef.current = '';
        setSpelledLetters([]);
        spelledLettersRef.current = [];
        setCurrentSpellIndex(0);
        wordSpellIndexRef.current = 0;
        setWordResult(null);
        setWordAttempts(0);
        setWordCorrect(0);
        setWordWrong(0);
        setSpellingFeedback(null);
        wordEvaluatedRef.current = false;
        wordStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
        setUsedWordItems([]);

        // Reset Sentence Practice
        setTargetSentence('');
        sentenceTargetRef.current = '';
        setPerformedLetters([]);
        performedLettersRef.current = [];
        sentenceIndexRef.current = 0;
        setSentenceResult(null);
        setSentenceAttempts(0);
        setSentenceCorrect(0);
        setSentenceWrong(0);
        setMissingLetters([]);
        setWrongLetters([]);
        sentenceEvaluatedRef.current = false;
        sentenceStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
        setUsedSentenceItems([]);

        // Reset session rounds
        setLetterSessionRound(0);
        setWordSessionRound(0);
        setSentenceSessionRound(0);

        toast.success(t('practice.resetTopicSuccess'));
    };

    const startSentencePractice = (fromUserClick = false) => {
        // Lấy câu ngẫu nhiên không trùng lặp
        // Nếu đang ở chế độ chủ đề, lấy câu từ chủ đề đó
        let sentencePool = COMMON_SENTENCES;
        if (practiceMode === 'topic' && selectedTopic && TOPICS[selectedTopic]) {
            sentencePool = TOPICS[selectedTopic].sentences;
        }
        const newSentence = getNextItem(sentencePool, usedSentenceItems);
        if (!newSentence) {
            toast.error(t('common.noMoreSentences'));
            return;
        }
        
        // Khi bấm nút chuyển lượt (từ lượt 1 đến lượt 10)
        if (fromUserClick) {
            // Guard chống double-call (timer + nút bấm cùng lúc)
            if (practiceAdvancingRef.current) return;
            practiceAdvancingRef.current = true;
            setTimeout(() => { practiceAdvancingRef.current = false; }, 1500);

            // Đọc kết quả: nếu hết giờ dùng timerExpiredResultRef, ngược lại dùng performedLetters
            let allCorrect;
            if (timerExpiredResultRef.current === 'incorrect') {
                allCorrect = false;
            } else {
                const targetLength = sentenceTargetRef.current.replace(/\s/g, '').length;
                const isFullTarget = performedLettersRef.current.length === targetLength && !performedLettersRef.current.includes(undefined);
                allCorrect = isFullTarget && performedLettersRef.current.every(l => l && l.correct);
            }
            const currentRound = sentenceSessionRound;
            
            // Guard: nếu đã hiển thị kết quả rồi thì không làm gì
            if (currentRound > 10) {
                return;
            }
            
            // Nếu đã hoàn thành 10 lượt (round = 10): tính kết quả round 10 + hiện modal
            if (currentRound === 10) {
                // Tính kết quả round 10 (kết quả round 1-9 đã được tính trước đó)
                const finalCorrect = allCorrect ? sentenceCorrect + 1 : sentenceCorrect;
                const finalWrong = allCorrect ? sentenceWrong : sentenceWrong + 1;
                const sentenceResult10 = {
                    type: 'sentence',
                    correct: finalCorrect,
                    wrong: finalWrong,
                    accuracy: 10 > 0 ? Math.round((finalCorrect / 10) * 100) : 0
                };
                resultsDataRef.current = sentenceResult10;
                setResultsData(sentenceResult10);
                setShowResultsModal(true);
                return;
            }
            
            // Lượt 1-9: Tính kết quả lượt vừa xong + chuyển lượt mới
            if (allCorrect) {
                setSentenceCorrect(prev => prev + 1);
            } else {
                setSentenceWrong(prev => prev + 1);
            }
            setSentenceSessionRound(currentRound + 1);
            
            // Reset state cho lượt mới
            setTargetSentence(newSentence.replace(/_/g, ' '));
            sentenceTargetRef.current = newSentence.replace(/_/g, ' ');
            setPerformedLetters([]);
            performedLettersRef.current = [];
            sentenceIndexRef.current = 0;
            setSentenceResult(null);
            setMissingLetters([]);
            setWrongLetters([]);
            sentenceEvaluatedRef.current = false;
            sentenceStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
            setUsedSentenceItems(prev => [...prev, newSentence]);
            
            const sentenceDisplayRound = sentenceSessionRound + 1;
            toast(`${t('practice.roundSentence', { current: sentenceDisplayRound, total: 10, sentence: newSentence })}`, { icon: '💬' });
            practiceEvaluationCooldownRef.current = Date.now() + 1000;
            startPracticeTimer('sentence'); // ── timer cho bài kiểm tra
            return;
        }
        
        // Reset state cho lượt mới (khi bật camera lần đầu, không phải từ nút bấm)
        setTargetSentence(newSentence.replace(/_/g, ' '));
        sentenceTargetRef.current = newSentence.replace(/_/g, ' ');
        setPerformedLetters([]);
        performedLettersRef.current = [];
        sentenceIndexRef.current = 0;
        setSentenceResult(null);
        setMissingLetters([]);
        setWrongLetters([]);
        sentenceEvaluatedRef.current = false;
        sentenceStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
        setUsedSentenceItems(prev => [...prev, newSentence]);
        
        const sentenceDisplayRound = sentenceSessionRound + 1;
        toast(`${t('practice.roundSentence', { current: sentenceDisplayRound, total: 10, sentence: newSentence })}`, { icon: '💬' });
        practiceEvaluationCooldownRef.current = Date.now() + 1000;
        startPracticeTimer('sentence'); // ── timer cho bài kiểm tra
    };

    const resetSentencePractice = () => {
        setPerformedLetters([]);
        performedLettersRef.current = [];
        sentenceIndexRef.current = 0;
        setSentenceResult(null);
        setMissingLetters([]);
        setWrongLetters([]);
        sentenceEvaluatedRef.current = false;
        sentenceStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
    };

    const getLetterStats = () => {
        if (letterAttempts === 0) return { accuracy: 0, rate: 0 };
        const avgAccuracy = letterAccuracy;
        const correctRate = Math.round((letterCorrect / letterAttempts) * 100);
        return { accuracy: avgAccuracy, rate: correctRate };
    };

    const getWordStats = () => {
        if (wordAttempts === 0) return { rate: 0 };
        const correctRate = Math.round((wordCorrect / wordAttempts) * 100);
        return { rate: correctRate };
    };

    const getSentenceStats = () => {
        if (sentenceAttempts === 0) return { rate: 0 };
        const correctRate = Math.round((sentenceCorrect / sentenceAttempts) * 100);
        return { rate: correctRate };
    };

    const isAssignmentLocked = Boolean(activeSessionId);

    const handleForceExit = async () => {
        if (isExiting) return;
        setIsExiting(true);
        try {
            // Submit kết quả hiện tại (dù 0 câu hay đang giữa chừng)
            if (activeSessionId && !assignmentSubmittedRef.current) {
                await submitAssignmentResults();
            }
        } catch (e) {
            console.error('Force exit submit error:', e);
        } finally {
            setIsExiting(false);
            setShowExitModal(false);
            // Tắt camera
            try {
                manualStopRef.current = true;
                setIsStreaming(false);
                cleanupCamera();
            } catch (e) {}
            // Release lock
            try { if (assignmentCtx && assignmentCtx.release) assignmentCtx.release(); } catch (e) {}
            // Navigate về đúng trang
            if (examId) {
                navigate('/student/exams');
            } else {
                navigate('/my-assignments');
            }
        }
    };
    const handleTabChange = (tabName) => {
        if (isAssignmentLocked) {
            toast(t('common.assignmentInProgress'));
            return;
        }
        // Nếu đang bật camera → tắt camera trước khi chuyển tab
        if (isStreaming) {
            manualStopRef.current = true;
            setIsStreaming(false);
            setIsHandPresent(false);
            setCurrentLetter('');
            cleanupCamera();
        }
        // Chuyển tab và reset toàn bộ state practice
        setActiveTab(tabName);
        resetPracticeState();
    };


    return (
        <Layout hideNav={!!activeSessionId} hideFooter={!!activeSessionId}>
            <div className="bg-transparent p-2">
                <div className="max-w-7xl mx-auto">
                    {/* Nút Thoát - chỉ hiện khi đang trong luồng bài tập/kiểm tra, độc lập với practiceTitle */}
                    {activeSessionId && (
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <button
                                onClick={() => setShowExitModal(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-300/50 transition-all shrink-0"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                {examId ? 'Thoát bài kiểm tra' : 'Thoát bài tập'}
                            </button>
                            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                <span>Phiên {examId ? 'kiểm tra' : 'bài tập'} đang bị khóa — bạn không thể thoát ra ngoài. Hoàn thành bài hoặc bấm <strong>Thoát</strong> để kết thúc (sẽ mất 1 lượt làm).</span>
                            </div>
                        </div>
                    )}
                {/* Practice Tabs */}
                <div className="bg-white rounded-xl shadow-sm p-1.5 mb-3">
                    {/* Practice mode */}
                    <div className="mb-2 p-2 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-cyan-700 text-xs">{t('practice.practiceMode')}</span>
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => {
                                        if (isAssignmentLocked) { toast(t('common.assignmentInProgress')); return; }
                                        setPracticeMode('normal'); setSelectedTopic(null);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg font-medium transition text-xs ${practiceMode === 'normal' ? 'bg-cyan-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-cyan-100'}`}
                                >📚 {t('practice.normalMode')}</button>
                                <button
                                    onClick={() => {
                                        if (isAssignmentLocked) { toast(t('common.assignmentInProgress')); return; }
                                        setPracticeMode('topic'); handleTabChange('word');
                                    }}
                                    className={`px-3 py-1.5 rounded-lg font-medium transition text-xs ${practiceMode === 'topic' ? 'bg-cyan-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-cyan-100'}`}
                                >🏷️ {t('practice.topicMode')}</button>
                            </div>
                        </div>
                        
                        {/* Topic selection */}
                        {practiceMode === 'topic' && (
                            <div className="mt-2">
                                <p className="text-[10px] text-gray-500 mb-1.5">{selectedTopic ? <span className="text-green-600 font-medium">✓ {t('practice.topicSelected')} {TOPICS[selectedTopic]?.icon} {getTopicName(selectedTopic)}</span> : t('practice.selectTopic')}</p>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-1">
                                    {Object.entries(TOPICS).map(([key, topic]) => (
                                        <button
                                            key={key}
                                            onClick={() => {
                                                if (isAssignmentLocked) {
                                                    toast(t('common.assignmentInProgress'));
                                                    return;
                                                }
                                                if (selectedTopic !== key) {
                                                    // Reset Letter Practice
                                                    setTargetLetter('');
                                                    currentTargetRef.current = '';
                                                    setLetterResult(null);
                                                    setLetterAccuracy(0);
                                                    setLetterCorrect(0);
                                                    setLetterWrong(0);
                                                    setIsLetterCorrect(null);
                                                    letterEvaluatedRef.current = false;
                                                    letterStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
                                                    setUsedLetterItems([]);
                                                    setLetterSessionRound(0);

                                                    // Reset Word Practice
                                                    setTargetWord('');
                                                    wordTargetRef.current = '';
                                                    setSpelledLetters([]);
                                                    spelledLettersRef.current = [];
                                                    setCurrentSpellIndex(0);
                                                    wordSpellIndexRef.current = 0;
                                                    setWordResult(null);
                                                    setWordCorrect(0);
                                                    setWordWrong(0);
                                                    setSpellingFeedback(null);
                                                    wordEvaluatedRef.current = false;
                                                    setUsedWordItems([]);
                                                    setWordSessionRound(0);

                                                    // Reset Sentence Practice
                                                    setTargetSentence('');
                                                    sentenceTargetRef.current = '';
                                                    setPerformedLetters([]);
                                                    performedLettersRef.current = [];
                                                    sentenceIndexRef.current = 0;
                                                    setSentenceResult(null);
                                                    setSentenceCorrect(0);
                                                    setSentenceWrong(0);
                                                    setMissingLetters([]);
                                                    setWrongLetters([]);
                                                    sentenceEvaluatedRef.current = false;
                                                    setUsedSentenceItems([]);
                                                    setSentenceSessionRound(0);

                                                    toast.success(t('practice.resetSuccess'));
                                                }
                                                setSelectedTopic(key);
                                            }}
                                            className={`px-2 py-1.5 rounded-lg font-medium transition text-xs flex items-center justify-center gap-1 ${
                                                selectedTopic === key
                                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                                                    : 'bg-white text-gray-700 hover:bg-blue-100 border border-gray-200'
                                            }`}
                                        >
                                            <span className="text-sm">{topic.icon}</span>
                                            <span className="truncate">{getTopicName(key)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-1.5">
                        {practiceMode === 'normal' && (
                            <button
                                onClick={() => handleTabChange('letter')}
                                className={`flex-1 py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 text-xs ${activeTab === 'letter' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-green-50'}`}
                            >
                                <Type size={16} /> {t('practice.letterTab')}
                            </button>
                        )}
                        <button
                            onClick={() => handleTabChange('word')}
                            className={`flex-1 py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 text-xs ${activeTab === 'word' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-green-50'}`}
                        >
                            <User size={16} /> {t('practice.wordTab')}
                        </button>
                        <button
                            onClick={() => handleTabChange('sentence')}
                            className={`flex-1 py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 text-xs ${activeTab === 'sentence' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-green-50'}`}
                        >
                            <Mail size={16} /> {t('practice.sentenceTab')}
                        </button>
                    </div>
                </div>

                {/* Camera Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Camera Section */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-3">
                        {/* Camera Controls */}
                        <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg mb-3">
                            <Settings size={16} className="text-gray-500" />
                            <select
                                className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 outline-none font-medium text-xs"
                                value={selectedCamera}
                                onChange={(e) => { setSelectedCamera(e.target.value); if (isStreaming) { stopCamera(); setTimeout(startCamera, 500); } }}
                            >
                            {cameras.length === 0 && <option value="">{t('practice.searchingCamera')}</option>}
                                {cameras.map((cam, index) => (
                                    <option key={cam.deviceId} value={cam.deviceId}>
                                        {cam.label || `${t('practice.camera')} ${index + 1}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Camera Display */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                                {isStreaming ? (
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                                ) : (
                                    <div className="text-gray-500 font-medium flex flex-col items-center gap-2">
                                        <Camera size={32} className="opacity-50"/>
                                        <p className="text-sm">{t('practiceFeedback.enableCameraStart')}</p>
                                    </div>
                                )}
                                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold text-white shadow ${isHandPresent ? 'bg-green-500' : 'bg-gray-500'}`}>
                                    {isHandPresent ? t('practiceFeedback.handDetected') : t('practiceFeedback.noHand')}
                                </div>
                            </div>
                            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-emerald-200">
                                {skeletonImage ? (
                                    <img src={skeletonImage} alt="Hand skeleton" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="text-gray-400 flex flex-col items-center gap-2">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-30"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
                                        <span className="text-xs font-medium">{t('dashboard.skeletonTitle')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Current Detected Letter */}
                        <div className="bg-gray-50 rounded-lg p-4 text-center mb-4">
                            <p className="text-gray-500 text-sm mb-2">{t('practiceFeedback.detectingSign')}</p>
                            <div className="text-6xl font-black text-green-600">{currentLetter}</div>
                        </div>

                        <canvas ref={canvasRef} width="640" height="480" className="hidden" />

                        <button 
                            onClick={isStreaming ? stopCamera : startCamera}
                            className={`w-full py-3 rounded-lg font-bold transition flex justify-center items-center gap-2 ${
                                isStreaming 
                                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                        >
                            <Camera size={20} /> {isStreaming ? t('practice.stopCameraBtn') : t('practice.startCameraBtn')}
                        </button>
                    </div>

                    {/* Practice Content */}
                    <div className="space-y-3">
                        {/* Letter Practice Tab */}
                        {activeTab === 'letter' && (
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Type className="text-green-600" /> {t('practice.letterPracticeTitle')}
                                    {practiceMode === 'topic' && selectedTopic && (
                                        <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                            {TOPICS[selectedTopic]?.icon} {getTopicName(selectedTopic)}
                                        </span>
                                    )}
                                </h2>

                                {/* Countdown Timer — chỉ hiện khi bài kiểm tra */}
                                {activeSessionId && targetLetter && (
                                    <div className={`flex items-center justify-between px-3 py-2 rounded-xl border mb-3 ${getPracticeTimerBg(practiceTimeLeft)}`}>
                                        <div className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${getPracticeTimerColor(practiceTimeLeft)}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                            <span className={`font-bold text-sm ${getPracticeTimerColor(practiceTimeLeft)}`}>{practiceTimeLeft}s</span>
                                        </div>
                                        <div className="flex-1 mx-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${practiceTimeLeft <= 3 ? 'bg-red-500' : practiceTimeLeft <= 10 ? 'bg-orange-400' : 'bg-blue-400'}`}
                                                style={{ width: `${(practiceTimeLeft / PRACTICE_TIME_LIMITS.letter) * 100}%` }} />
                                        </div>
                                        {practiceTimeExpired && <span className="text-red-600 font-black text-xs animate-pulse">Hết giờ!</span>}
                                    </div>
                                )}

                                {!isStreaming ? (
                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                        <Camera size={32} className="text-gray-300 mb-2" />
                                        <p className="text-gray-500 font-medium text-sm">{t('practice.enableCameraStart')}</p>
                                        <p className="text-gray-400 text-xs mt-0.5">{t('practice.pressCameraBtn')}</p>
                                    </div>
                                ) : (
                                <>
                                {/* Session Progress */}
                                <div className="mb-3 bg-blue-50 rounded-lg p-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-blue-700">{t('practice.sessionProgress')}</span>
                                        <span className="text-sm font-bold text-blue-700">{letterSessionRound}/10 {t('practice.rounds')}</span>
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(letterSessionRound / 10) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                
                                {targetLetter && (
                                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center mb-3">
                                        <p className="text-gray-600 text-xs mb-2">{t('practice.performSign')}</p>
                                        <div className="text-5xl font-black text-green-600">{targetLetter}</div>
                                        {letterResult !== null && (
                                            <div className={`mt-4 p-3 rounded-lg ${isLetterCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                <p className="font-bold">{isLetterCorrect ? `✓ ${t('practice.correct')}` : `✗ ${t('practice.incorrect')}`}</p>
                                                <p className="text-sm mt-1">{t('practice.accuracy')} {letterAccuracy}%</p>
                                                <button
                                                    onClick={resetLetterPractice}
                                                    className={`mt-3 px-4 py-2 rounded-lg font-semibold text-white transition ${
                                                        isLetterCorrect ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'
                                                    }`}
                                                >
                                                    {t('practice.retry')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Advanced Feedback Panel */}
                                {showFeedback && currentFeedback && (
                                    <div className="mb-4">
                                        <button
                                            onClick={() => setShowFeedbackPanel(!showFeedbackPanel)}
                                            className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-200 hover:border-cyan-300 transition"
                                        >
                                            <span className="font-semibold text-cyan-700 flex items-center gap-2">
                                                <span className="text-lg">💡</span>
                                                {t('practice.detailedFeedback')}
                                            </span>
                                            <span className="text-cyan-500">
                                                {showFeedbackPanel ? `▲ ${t('practice.hide')}` : `▼ ${t('practice.show')}`}
                                            </span>
                                        </button>
                                        {showFeedbackPanel && (
                                            <div className="mt-2">
                                                <PracticeFeedback
                                                    targetLetter={currentFeedback.targetLetter}
                                                    detectedLetter={currentFeedback.detectedLetter}
                                                    accuracy={currentFeedback.accuracy}
                                                    isVisible={true}
                                                    compact={false}
                                                    onClose={() => setShowFeedback(false)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {targetLetter && (
                                    <button
                                        onClick={() => { stopPracticeTimer(); startLetterPractice(true); }}
                                        className="w-full bg-green-600 text-white font-bold py-2 rounded-xl hover:bg-green-700 transition mb-3"
                                    >
                                        {letterSessionRound >= 10 ? t('practice.viewResults') : t('practice.nextLetter')}
                                    </button>
                                )}

                                <div className="bg-gray-50 rounded-lg p-3">
                                    <h3 className="font-semibold text-gray-700 mb-2 text-xs">Thống kê</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-gray-700">{letterSessionRound}</div>
                                            <div className="text-xs text-gray-500">{t('practice.totalRounds')}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-green-600">{letterCorrect}</div>
                                            <div className="text-xs text-gray-500">Đúng</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-red-500">{letterWrong}</div>
                                            <div className="text-xs text-gray-500">Sai</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div className="bg-green-100 rounded-lg p-2 text-center">
                                            <div className="text-lg font-bold text-green-600">
                                                ✓ {letterSessionRound > 0 ? Math.round((letterCorrect / letterSessionRound) * 100) : 0}%
                                            </div>
                                            <div className="text-xs text-green-600">Đúng</div>
                                        </div>
                                        <div className="bg-red-100 rounded-lg p-2 text-center">
                                            <div className="text-lg font-bold text-red-500">
                                                ✗ {letterSessionRound > 0 ? Math.round((letterWrong / letterSessionRound) * 100) : 0}%
                                            </div>
                                            <div className="text-xs text-red-500">Sai</div>
                                        </div>
                                    </div>
                                </div>
                                </>
                                )}
                            </div>
                        )}

                        {/* Word Practice Tab */}
                        {activeTab === 'word' && (
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <User className="text-green-600" /> {t('practice.wordPracticeTitle')}
                                    {practiceMode === 'topic' && selectedTopic && (
                                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                            {TOPICS[selectedTopic]?.icon} {getTopicName(selectedTopic)}
                                        </span>
                                    )}
                                </h2>

                                {/* Countdown Timer — chỉ hiện khi bài kiểm tra */}
                                {activeSessionId && targetWord && (
                                    <div className={`flex items-center justify-between px-3 py-2 rounded-xl border mb-3 ${getPracticeTimerBg(practiceTimeLeft)}`}>
                                        <div className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${getPracticeTimerColor(practiceTimeLeft)}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                            <span className={`font-bold text-sm ${getPracticeTimerColor(practiceTimeLeft)}`}>{practiceTimeLeft}s</span>
                                        </div>
                                        <div className="flex-1 mx-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${practiceTimeLeft <= 3 ? 'bg-red-500' : practiceTimeLeft <= 10 ? 'bg-orange-400' : 'bg-blue-400'}`}
                                                style={{ width: `${(practiceTimeLeft / PRACTICE_TIME_LIMITS.word) * 100}%` }} />
                                        </div>
                                        {practiceTimeExpired && <span className="text-red-600 font-black text-xs animate-pulse">Hết giờ!</span>}
                                    </div>
                                )}

                                {!isStreaming ? (
                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                        <Camera size={32} className="text-gray-300 mb-2" />
                                        <p className="text-gray-500 font-medium text-sm">{t('practice.enableCameraStart')}</p>
                                        <p className="text-gray-400 text-xs mt-0.5">{t('practice.pressCameraBtn')}</p>
                                    </div>
                                ) : (
                                <>
                                {/* Session Progress */}
                                <div className="mb-3 bg-blue-50 rounded-lg p-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-blue-700">{t('practice.sessionProgress')}</span>
                                        <span className="text-sm font-bold text-blue-700">{wordSessionRound}/10 {t('practice.rounds')}</span>
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(wordSessionRound / 10) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                
                                {targetWord && (
                                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-3">
                                        <p className="text-gray-600 text-sm mb-2">Hãy đánh vần từ:</p>
                                        <div className="text-3xl font-black text-green-600 text-center mb-2">{targetWord}</div>
                                        <div className="text-center text-sm text-gray-500 mb-4">
                                            Chữ đang nhận diện: <span className="font-bold text-base text-blue-600">{currentLetter || '-'}</span>
                                        </div>
                                        <div className="flex justify-center items-center gap-2 flex-wrap">
                                            {targetWord.replace(/\s/g, '').split('').map((char, idx) => (
                                                <div 
                                                    key={idx}
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg transition relative group cursor-pointer ${
                                                        spelledLetters[idx] 
                                                            ? (spelledLetters[idx].correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white')
                                                            : idx === currentSpellIndex 
                                                                ? 'bg-yellow-400 text-white animate-pulse' 
                                                                : 'bg-gray-200 text-gray-600'
                                                    }`}
                                                    onClick={() => {
                                                        // Nhận diện lại ký tự này
                                                        wordSpellIndexRef.current = idx;
                                                        setCurrentSpellIndex(idx);
                                                        spelledLettersRef.current[idx] = undefined;
                                                        setSpelledLetters([...spelledLettersRef.current]);
                                                        // Reset evaluation state để cho phép nhận diện lại
                                                        wordEvaluatedRef.current = false;
                                                        setWordResult(null);
                                                        // Reset stability tracking cho word practice
                                                        wordStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
                                                        // Hiển thị thông báo nhắc nhở
                                                        toast.success(`Nhấn lại ký tự thứ ${idx + 1} (${char})`);
                                                    }}
                                                >
                                                    {spelledLetters[idx]?.letter || '?'}
                                                    {spelledLetters[idx] && (
                                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white rounded-full text-xs flex items-center justify-center opacity-80">↻</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Retry whole word button */}
                                        <div className="flex justify-center mt-4">
                                            <button
                                                onClick={resetWordPractice}
                                                className="px-6 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition"
                                            >
                                                {t('practice.retryWordThis')}
                                            </button>
                                        </div>
                                        
                                        <div className="text-center text-sm text-gray-500 mt-3">
                                            {t('practice.clickToRetry')}
                                        </div>
                                        {wordResult === 'correct' && (
                                            <div className="mt-4 p-3 rounded-lg bg-green-100 text-green-700 text-center">
                                                <p className="font-bold">✓ {t('practice.completed')}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {targetWord && (
                                    <button
                                        onClick={() => { stopPracticeTimer(); startWordPractice(true); }}
                                        className="w-full bg-green-600 text-white font-bold py-2 rounded-xl hover:bg-green-700 transition mb-3"
                                    >
                                        {wordSessionRound >= 10 ? 'Xem kết quả' : 'Từ mới'}
                                    </button>
                                )}

                                <div className="bg-gray-50 rounded-lg p-3">
                                    <h3 className="font-semibold text-gray-700 mb-2 text-xs">Thống kê</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-gray-700">{wordSessionRound}</div>
                                            <div className="text-xs text-gray-500">{t('practice.totalRounds')}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-green-600">{wordCorrect}</div>
                                            <div className="text-xs text-gray-500">Đúng</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-red-500">{wordWrong}</div>
                                            <div className="text-xs text-gray-500">Sai</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div className="bg-green-100 rounded-lg p-2 text-center">
                                            <div className="text-lg font-bold text-green-600">
                                                ✓ {wordSessionRound > 0 ? Math.round((wordCorrect / wordSessionRound) * 100) : 0}%
                                            </div>
                                            <div className="text-xs text-green-600">Đúng</div>
                                        </div>
                                        <div className="bg-red-100 rounded-lg p-2 text-center">
                                            <div className="text-lg font-bold text-red-500">
                                                ✗ {wordSessionRound > 0 ? Math.round((wordWrong / wordSessionRound) * 100) : 0}%
                                            </div>
                                            <div className="text-xs text-red-500">Sai</div>
                                        </div>
                                    </div>
                                </div>
                                </>
                                )}
                            </div>
                        )}

                        {/* Sentence Practice Tab */}
                        {activeTab === 'sentence' && (
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Mail className="text-green-600" /> {t('practice.sentencePracticeTitle')}
                                    {practiceMode === 'topic' && selectedTopic && (
                                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                            {TOPICS[selectedTopic]?.icon} {getTopicName(selectedTopic)}
                                        </span>
                                    )}
                                </h2>

                                {/* Countdown Timer — chỉ hiện khi bài kiểm tra */}
                                {activeSessionId && targetSentence && (
                                    <div className={`flex items-center justify-between px-3 py-2 rounded-xl border mb-3 ${getPracticeTimerBg(practiceTimeLeft)}`}>
                                        <div className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${getPracticeTimerColor(practiceTimeLeft)}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                            <span className={`font-bold text-sm ${getPracticeTimerColor(practiceTimeLeft)}`}>{practiceTimeLeft}s</span>
                                        </div>
                                        <div className="flex-1 mx-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${practiceTimeLeft <= 3 ? 'bg-red-500' : practiceTimeLeft <= 10 ? 'bg-orange-400' : 'bg-blue-400'}`}
                                                style={{ width: `${(practiceTimeLeft / PRACTICE_TIME_LIMITS.sentence) * 100}%` }} />
                                        </div>
                                        {practiceTimeExpired && <span className="text-red-600 font-black text-xs animate-pulse">Hết giờ!</span>}
                                    </div>
                                )}

                                {!isStreaming ? (
                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                        <Camera size={32} className="text-gray-300 mb-2" />
                                        <p className="text-gray-500 font-medium text-sm">{t('practice.enableCameraStart')}</p>
                                        <p className="text-gray-400 text-xs mt-0.5">{t('practice.pressCameraBtn')}</p>
                                    </div>
                                ) : (
                                <>
                                {/* Session Progress */}
                                <div className="mb-3 bg-orange-50 rounded-lg p-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-orange-700">{t('practice.sessionProgress')}</span>
                                        <span className="text-sm font-bold text-orange-700">{sentenceSessionRound}/10 {t('practice.rounds')}</span>
                                    </div>
                                    <div className="w-full bg-orange-200 rounded-full h-2">
                                        <div 
                                            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(sentenceSessionRound / 10) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                
                                {targetSentence && (
                                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-3">
                                        <p className="text-gray-600 text-sm mb-2">{t('practice.performSentence')}</p>
                                        <div className="text-xl font-bold text-green-600 text-center mb-2">{targetSentence}</div>
                                        <div className="text-center text-sm text-gray-500 mb-4">
                                            Chữ đang nhận diện: <span className="font-bold text-base text-blue-600">{currentLetter || '-'}</span>
                                        </div>
                                        <div className="flex justify-center items-center gap-1 flex-wrap">
                                            {targetSentence.replace(/\s/g, '').split('').map((char, idx) => (
                                                <div 
                                                    key={idx}
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg transition relative group cursor-pointer ${
                                                        performedLetters[idx] 
                                                            ? (performedLetters[idx].correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white')
                                                            : idx === sentenceIndexRef.current 
                                                                ? 'bg-yellow-400 text-white animate-pulse' 
                                                                : 'bg-gray-200 text-gray-600'
                                                    }`}
                                                    onClick={() => {
                                                        // Nhận diện lại ký tự này
                                                        sentenceIndexRef.current = idx;
                                                        performedLettersRef.current[idx] = undefined;
                                                        setPerformedLetters([...performedLettersRef.current]);
                                                        // Reset evaluation state
                                                        sentenceEvaluatedRef.current = false;
                                                        setSentenceResult(null);
                                                        // Reset stability tracking
                                                        sentenceStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
                                                        toast.success(`Nhấn lại ký tự thứ ${idx + 1} (${char})`);
                                                    }}
                                                >
                                                    {performedLetters[idx]?.letter || '?'}
                                                    {performedLetters[idx] && (
                                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white rounded-full text-xs flex items-center justify-center opacity-80">↻</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-center mt-4">
                                            <button
                                                onClick={resetSentencePractice}
                                                className="px-6 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition"
                                            >
                                                Nhận diện lại câu này
                                            </button>
                                        </div>
                                        <div className="text-center text-sm text-gray-500 mt-3">
                                            Click vào ký tự để nhận diện lại
                                        </div>
                                        {sentenceResult === 'correct' && (
                                            <div className="mt-4 p-3 rounded-lg bg-green-100 text-green-700 text-center">
                                                <p className="font-bold">✓ HOÀN THÀNH!</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {targetSentence && (
                                    <button
                                        onClick={() => { stopPracticeTimer(); startSentencePractice(true); }}
                                        className="w-full bg-green-600 text-white font-bold py-2 rounded-xl hover:bg-green-700 transition mb-3"
                                    >
                                        {sentenceSessionRound >= 10 ? 'Xem kết quả' : 'Câu mới'}
                                    </button>
                                )}

                                <div className="bg-gray-50 rounded-lg p-3">
                                    <h3 className="font-semibold text-gray-700 mb-2 text-xs">Thống kê</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-gray-700">{sentenceSessionRound}</div>
                                            <div className="text-xs text-gray-500">{t('practice.totalRounds')}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-green-600">{sentenceCorrect}</div>
                                            <div className="text-xs text-gray-500">Đúng</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-red-500">{sentenceWrong}</div>
                                            <div className="text-xs text-gray-500">Sai</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div className="bg-green-100 rounded-lg p-2 text-center">
                                            <div className="text-lg font-bold text-green-600">
                                                ✓ {sentenceSessionRound > 0 ? Math.round((sentenceCorrect / sentenceSessionRound) * 100) : 0}%
                                            </div>
                                            <div className="text-xs text-green-600">Đúng</div>
                                        </div>
                                        <div className="bg-red-100 rounded-lg p-2 text-center">
                                            <div className="text-lg font-bold text-red-500">
                                                ✗ {sentenceSessionRound > 0 ? Math.round((sentenceWrong / sentenceSessionRound) * 100) : 0}%
                                            </div>
                                            <div className="text-xs text-red-500">Sai</div>
                                        </div>
                                    </div>
                                </div>
                                </>
                                )}
                            </div>
                        )}
                    </div>
                {/* Results Modal - Graduation Ceremony Style */}
                {showResultsModal && (
                    <div className="fixed inset-0 bg-gradient-to-br from-cyan-900 via-blue-900 to-teal-900 flex items-center justify-center z-50 overflow-hidden">
                        {/* Animated Stars Background - More Stars for Ceremonial Feel */}
                        <div className="absolute inset-0 overflow-hidden">
                            {[...Array(150)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute animate-twinkle"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        animationDelay: `${Math.random() * 3}s`,
                                        animationDuration: `${1 + Math.random() * 2}s`,
                                    }}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill={['#FFD700', '#FFA500', '#FF69B4', '#00FFFF', '#ADFF2F', '#FF1493'][Math.floor(Math.random() * 6)]}>
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                </div>
                            ))}
                        </div>

                        {/* Massive Confetti Rain */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {[...Array(150)].map((_, i) => (
                                <div
                                    key={`confetti-${i}`}
                                    className="absolute animate-confetti-rain"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `-${20 + Math.random() * 80}px`,
                                        animationDelay: `${Math.random() * 2}s`,
                                        animationDuration: `${2.5 + Math.random() * 2}s`,
                                        backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF69B4', '#FF4500', '#00FF7F', '#FF1493', '#00FFFF'][Math.floor(Math.random() * 10)],
                                        width: `${8 + Math.random() * 12}px`,
                                        height: `${8 + Math.random() * 12}px`,
                                        borderRadius: Math.random() > 0.3 ? '50%' : '0',
                                    }}
                                />
                            ))}
                        </div>

                        {/* Firework Bursts for high scores */}
                        {resultsData.correct >= 8 && (
                            <>
                                <div className="absolute top-10 left-20 animate-firework" style={{animationDelay: '0s'}}>
                                    <div className="w-4 h-4 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50"></div>
                                </div>
                                <div className="absolute top-20 right-32 animate-firework" style={{animationDelay: '0.5s'}}>
                                    <div className="w-3 h-3 bg-teal-400 rounded-full shadow-lg shadow-teal-400/50"></div>
                                </div>
                                <div className="absolute bottom-40 left-40 animate-firework" style={{animationDelay: '1s'}}>
                                    <div className="w-5 h-5 bg-orange-400 rounded-full shadow-lg shadow-orange-400/50"></div>
                                </div>
                                <div className="absolute top-32 right-20 animate-firework" style={{animationDelay: '1.5s'}}>
                                    <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"></div>
                                </div>
                            </>
                        )}

                        {/* Main Results Card - Professional & Spacious */}
                        <div className="bg-gradient-to-br from-white via-teal-50 to-sky-100 rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 relative z-10 border border-white backdrop-blur-xl shadow-teal-200/50">
                            
                            {/* Top Banner */}
                            <div className="text-center mb-6">
                                <div className="inline-block bg-gradient-to-r from-sky-500 via-blue-500 to-teal-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-xl">
                                    {examId ? '🏆 KẾT QUẢ KIỂM TRA 🏆' : '✨ PHIÊN LUYỆN TẬP HOÀN THÀNH ✨'}
                                </div>
                            </div>

                            {/* Trophy & Title */}
                            <div className="flex flex-col items-center mb-6">
                                <div className={`text-7xl mb-2 ${resultsData.correct >= 8 ? 'animate-bounce' : ''}`}>
                                    {resultsData.correct >= 8 ? '🏆' : resultsData.correct >= 6 ? '🥈' : resultsData.correct >= 4 ? '🥉' : '🎯'}
                                </div>
                                <h2 className={`text-3xl font-black ${
                                    resultsData.correct >= 8 
                                        ? 'text-amber-600'
                                        : resultsData.correct >= 6
                                        ? 'text-blue-600'
                                        : 'text-gray-600'
                                }`}>
                                    {resultsData.correct >= 8 ? 'XUẤT SẮC!' : resultsData.correct >= 6 ? 'TỐT LẮM!' : resultsData.correct >= 4 ? 'CỐ GẮNG!' : 'KHÔNG NẢN LÒNG!'}
                                </h2>
                                <div className="text-sm text-gray-500 mt-1">
                                    {examId
                                        ? (resultsData.type === 'letter' ? '📝 Kiểm tra chữ cái' : resultsData.type === 'word' ? '📚 Kiểm tra từ vựng' : '💬 Kiểm tra câu giao tiếp')
                                        : (resultsData.type === 'letter' ? '📝 Luyện tập chữ cái' : resultsData.type === 'word' ? '📚 Luyện tập từ vựng' : '💬 Luyện tập câu giao tiếp')
                                    }
                                </div>
                            </div>

                            {/* Score Row */}
                            <div className="flex items-center justify-center gap-8 mb-6 bg-slate-800 rounded-2xl p-5 shadow-inner">
                                {/* Accuracy */}
                                <div className="text-center">
                                    <div className="text-5xl font-black text-amber-400">{resultsData.accuracy}%</div>
                                    <div className="text-xs text-gray-400 mt-1">ĐỘ CHÍNH XÁC</div>
                                </div>
                                
                                {/* Divider */}
                                <div className="w-px h-16 bg-white/30"></div>
                                
                                {/* Correct */}
                                <div className="text-center">
                                    <div className="text-5xl font-black text-emerald-400">{resultsData.correct}</div>
                                    <div className="text-xs text-gray-400 mt-1">ĐÚNG</div>
                                </div>
                                
                                {/* Divider */}
                                <div className="w-px h-16 bg-white/30"></div>
                                
                                {/* Wrong */}
                                <div className="text-center">
                                    <div className="text-5xl font-black text-red-400">{resultsData.wrong}</div>
                                    <div className="text-xs text-gray-400 mt-1">SAI</div>
                                </div>
                            </div>

                            {/* Encouragement */}
                            <div className={`text-center p-4 rounded-2xl mb-6 ${
                                resultsData.correct >= 8
                                    ? 'bg-amber-100 border-2 border-amber-300'
                                    : resultsData.correct >= 6
                                    ? 'bg-blue-100 border-2 border-blue-300'
                                    : resultsData.correct >= 4
                                    ? 'bg-emerald-100 border-2 border-emerald-300'
                                    : 'bg-gray-100 border-2 border-gray-300'
                            }`}>
                                <p className={`text-xl font-bold ${
                                    resultsData.correct >= 8 ? 'text-amber-700' : resultsData.correct >= 6 ? 'text-blue-700' : resultsData.correct >= 4 ? 'text-emerald-700' : 'text-gray-700'
                                }`}>
                                    {resultsData.correct >= 8 ? '🎉 Chúc mừng bạn! Kết quả tuyệt vời!' :
                                     resultsData.correct >= 6 ? '👍 Tốt lắm! Bạn đang tiến bộ!' :
                                     resultsData.correct >= 4 ? '🌱 Khá ổn đó! Hãy tiếp tục cố gắng!' :
                                     '🌟 Đừng nản lòng! Mỗi người đều có quá trình riêng!'}
                                </p>
                            </div>

                            {/* Practice Insights */}
                            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-5 mb-6 border border-cyan-100">
                                <h4 className="font-bold text-cyan-700 mb-3 flex items-center gap-2">
                                    <span className="text-lg">💡</span>
                                    Phân tích & Khuyến nghị
                                </h4>
                                <div className="space-y-2 text-sm">
                                    {resultsData.accuracy >= 80 ? (
                                        <div className="flex items-start gap-2 text-emerald-700">
                                            <span>✅</span>
                                            <span>Bạn đã thể hiện xuất sắc! Hãy thử thách bản thân với tốc độ nhanh hơn hoặc chuyển sang luyện tập câu giao tiếp.</span>
                                        </div>
                                    ) : resultsData.accuracy >= 60 ? (
                                        <div className="flex items-start gap-2 text-blue-700">
                                            <span>🎯</span>
                                            <span>Kết quả khả quan! Hãy tập trung vào các chữ cái bạn hay nhầm lẫn và ôn luyện kỹ hơn.</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-2 text-amber-700">
                                            <span>📚</span>
                                            <span>Đây là cơ hội tuyệt vời để học hỏi! Hãy xem lại hướng dẫn từng chữ cái và luyện tập chậm rãi từng bước.</span>
                                        </div>
                                    )}
                                    <div className="flex items-start gap-2 text-gray-600 mt-3 pt-3 border-t border-cyan-200/50">
                                        <span>💪</span>
                                        <span>Mẹo: Tập trung vào độ chính xác trước, tốc độ sẽ đến theo thời gian. Hãy giữ ký hiệu ổn định trong 2-3 giây.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Action Buttons */}
                            <div className="flex gap-4">
                                {/* Ẩn nút "Tiếp tục luyện tập" khi vào từ chức năng Bài tập hoặc Kiểm tra */}
                                {!assignmentId && !examId && (
                                    <button
                                        onClick={() => {
                                            setShowResultsModal(false);
                                            if (resultsData.type === 'letter') {
                                                setLetterSessionRound(0);
                                                setLetterCorrect(0);
                                                setLetterWrong(0);
                                                setUsedLetterItems([]);
                                                setTargetLetter(null);
                                                setLetterResult(null);
                                            } else if (resultsData.type === 'word') {
                                                setWordSessionRound(0);
                                                setWordCorrect(0);
                                                setWordWrong(0);
                                                setUsedWordItems([]);
                                                setTargetWord(null);
                                                setWordResult(null);
                                                setSpelledLetters([]);
                                            } else {
                                                setSentenceSessionRound(0);
                                                setSentenceCorrect(0);
                                                setSentenceWrong(0);
                                                setUsedSentenceItems([]);
                                                setTargetSentence(null);
                                                setSentenceResult(null);
                                                setPerformedLetters([]);
                                            }
                                        }}
                                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-4 px-6 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg text-base"
                                    >
                                        🔄 Tiếp tục luyện tập
                                    </button>
                                )}
                                <button
                                    onClick={async () => {
                                        // Submit kết quả cho cả assignment lẫn exam
                                        if ((assignmentId || examId) && !assignmentSubmittedRef.current) {
                                            const submitted = await submitAssignmentResults();
                                            if (!submitted) {
                                                const retried = await submitAssignmentResults();
                                                if (!retried) {
                                                    try { if (assignmentCtx && assignmentCtx.release) assignmentCtx.release(); } catch(e){}
                                                    toast.error(t('common.resultSaveFailed'));
                                                }
                                            }
                                        }

                                        setShowResultsModal(false);
                                        resetPracticeState();
                                        setLetterSessionRound(0);
                                        setLetterCorrect(0);
                                        setLetterWrong(0);
                                        setUsedLetterItems([]);
                                        setLetterResult(null);
                                        setTargetLetter(null);
                                        setWordSessionRound(0);
                                        setWordCorrect(0);
                                        setWordWrong(0);
                                        setUsedWordItems([]);
                                        setWordResult(null);
                                        setTargetWord(null);
                                        setSpelledLetters([]);
                                        setSentenceSessionRound(0);
                                        setSentenceCorrect(0);
                                        setSentenceWrong(0);
                                        setUsedSentenceItems([]);
                                        setSentenceResult(null);
                                        setTargetSentence(null);
                                        setPerformedLetters([]);
                                        try { if (assignmentCtx && assignmentCtx.release) assignmentCtx.release(); } catch(e){}
                                        navigate(examId ? '/student/exams' : '/my-assignments', { replace: true });
                                    }}
                                    className="flex-1 bg-gradient-to-r from-sky-500 to-blue-500 text-white font-bold py-4 px-6 rounded-xl hover:from-sky-600 hover:to-blue-600 transition-all shadow-lg text-base"
                                >
                                    {examId ? '📋 Về trang Kiểm tra' : '📋 Về trang Bài tập'}
                                </button>
                                <button
                                    onClick={async () => {
                                        // Submit kết quả cho cả assignment lẫn exam
                                        if ((assignmentId || examId) && !assignmentSubmittedRef.current) {
                                            const submitted = await submitAssignmentResults();
                                            if (!submitted) {
                                                const retried = await submitAssignmentResults();
                                                if (!retried) {
                                                    try { if (assignmentCtx && assignmentCtx.release) assignmentCtx.release(); } catch(e){}
                                                    toast.error(t('common.resultSaveFailed'));
                                                }
                                            }
                                        }

                                        setShowResultsModal(false);
                                        resetPracticeState();
                                        setLetterSessionRound(0);
                                        setLetterCorrect(0);
                                        setLetterWrong(0);
                                        setUsedLetterItems([]);
                                        setLetterResult(null);
                                        setTargetLetter(null);
                                        setWordSessionRound(0);
                                        setWordCorrect(0);
                                        setWordWrong(0);
                                        setUsedWordItems([]);
                                        setWordResult(null);
                                        setTargetWord(null);
                                        setSpelledLetters([]);
                                        setSentenceSessionRound(0);
                                        setSentenceCorrect(0);
                                        setSentenceWrong(0);
                                        setUsedSentenceItems([]);
                                        setSentenceResult(null);
                                        setTargetSentence(null);
                                        setPerformedLetters([]);
                                        try { if (assignmentCtx && assignmentCtx.release) assignmentCtx.release(); } catch(e){}
                                        navigate('/dashboard', { replace: true });
                                    }}
                                    className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg text-base"
                                >
                                    🏠 Về trang chủ
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            </div>
            </div>

            {/* Exit Assignment Modal - chỉ hiện khi đang trong luồng bài tập/kiểm tra */}
            {showExitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">
                                {examId ? 'Xác nhận thoát bài kiểm tra' : 'Xác nhận thoát bài tập'}
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-5">
                            Bạn có chắc muốn thoát? Kết quả hiện tại sẽ được lưu và bạn sẽ mất 1 lượt làm bài.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowExitModal(false)}
                                disabled={isExiting}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleForceExit}
                                disabled={isExiting}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {isExiting && (
                                    <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                    </svg>
                                )}
                                {t('common.exitAndSave') !== 'common.exitAndSave' ? t('common.exitAndSave') : 'Thoát & Lưu kết quả'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );

    function resetPracticeState() {
        // Reset vòng chơi và điểm số
        setLetterSessionRound(0);
        setLetterCorrect(0);
        setLetterWrong(0);
        
        setWordSessionRound(0);
        setWordCorrect(0);
        setWordWrong(0);
        
        setSentenceSessionRound(0);
        setSentenceCorrect(0);
        setSentenceWrong(0);

        // Reset trạng thái hiển thị
        setTargetLetter('');
        setLetterResult(null);
        setLetterAccuracy(0);
        setIsLetterCorrect(null);
        
        setTargetWord('');
        setSpelledLetters([]);
        setCurrentSpellIndex(0);
        setWordResult(null);
        setSpellingFeedback(null);
        
        setTargetSentence('');
        setPerformedLetters([]);
        setSentenceResult(null);
        setMissingLetters([]);
        setWrongLetters([]);
        
        letterStabilityRef.current = { letter: '', count: 0, lastChange: 0, stableSince: 0 };
        feedbackCooldownRef.current = false;
        letterEvaluatedRef.current = false;
        wordEvaluatedRef.current = false;
        sentenceEvaluatedRef.current = false;
    }
};

const Dashboard = () => {
    const { t } = useLanguage();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const wsRef = useRef(null);
    const intervalRef = useRef(null);
    const streamRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const manualStopRef = useRef(false);
    const actionCooldownUntilRef = useRef(0);
    const cursorLockUntilRef = useRef(0);
    const sentenceRef = useRef(null);
    const navigate = useNavigate();
    
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentLetter, setCurrentLetter] = useState('');
    const [sentence, setSentence] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const [isSentenceFocused, setIsSentenceFocused] = useState(false);
    const [isHandPresent, setIsHandPresent] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [skeletonImage, setSkeletonImage] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
        }
        
        const userData = localStorage.getItem('user');
        if (userData) {
            setCurrentUser(JSON.parse(userData));
        }

        const getCameras = async () => {
            try {
                const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                setCameras(videoDevices);
                if (videoDevices.length > 0) {
                    setSelectedCamera(videoDevices[0].deviceId);
                }
                tempStream.getTracks().forEach(track => track.stop());
            } catch (err) {
                console.error("Camera access denied:", err);
            }
        };
        getCameras();
        return () => {
            manualStopRef.current = true;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            const stream = videoRef.current?.srcObject;
            const tracks = stream?.getTracks() || [];
            tracks.forEach(track => track.stop());
        };
    }, [navigate]);

    useEffect(() => {
        const attachStream = async () => {
            if (!isStreaming || !videoRef.current || !streamRef.current) return;
            if (videoRef.current.srcObject !== streamRef.current) {
                videoRef.current.srcObject = streamRef.current;
            }
            try {
                await videoRef.current.play();
            } catch (err) {
                console.error('Video play error:', err);
            }
        };
        attachStream();
    }, [isStreaming]);

    const startCamera = async () => {
        if (isStreaming) return;
        try {
            manualStopRef.current = false;
            const constraints = {
                video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            setIsStreaming(true);

            const connectWebSocket = () => {
                if (manualStopRef.current) return;
                console.log('Đang kết nối WebSocket...');
                const ws = new WebSocket(WS_URL);
                wsRef.current = ws;
                ws.onopen = () => {
                    console.log('WebSocket connected!');
                    toast.success(t('common.aiServerConnected'));
                };
                ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    toast.error(t('common.aiServerConnectFailedShort'));
                };
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    setCurrentLetter(data.current_letter || '-');
                    const incomingSentence = data.sentence || '';
                    setSentence(incomingSentence);
                    if (Date.now() >= cursorLockUntilRef.current) {
                        setCursorPosition(Math.max(0, data.cursor_position ?? incomingSentence.length));
                    }
                    setIsHandPresent(data.is_hand_present);
                    setSuggestions((data.suggestions || []).filter((item) => item && item.trim()));
                    setSkeletonImage(data.skeleton_image || null);
                };
                ws.onclose = () => {
                    if (manualStopRef.current) return;
                    console.log('WebSocket disconnected, retrying...');
                    reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
                };
            };
            connectWebSocket();
            
            intervalRef.current = setInterval(() => {
                if (videoRef.current && canvasRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
                    if (Date.now() < actionCooldownUntilRef.current) {
                        return;
                    }
                    const context = canvasRef.current.getContext('2d');
                    context.drawImage(videoRef.current, 0, 0, 640, 480);
                    const base64 = canvasRef.current.toDataURL('image/jpeg', 0.7);
                    wsRef.current.send(JSON.stringify({ image: base64 }));
                }
            }, 100); 

        } catch (err) {
            toast.error(`Lỗi khi mở camera: ${err?.name || 'UnknownError'}`);
        }
    };

    const stopCamera = () => {
        manualStopRef.current = true;
        setIsStreaming(false);
        setIsHandPresent(false);
        setCurrentLetter('-');
        setSuggestions([]);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        const stream = streamRef.current || videoRef.current?.srcObject;
        const tracks = stream?.getTracks() || [];
        tracks.forEach(track => track.stop());
        streamRef.current = null;
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    };

    const handleLogout = () => {
        stopCamera();
        logout(navigate);
    };

    const sendWsAction = (payload, options = {}) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
            toast.error(t('common.aiServerNotReady'));
            return false;
        }
        // Briefly pause frame spam so control actions are processed immediately.
        if (!options.skipCooldown) {
            actionCooldownUntilRef.current = Date.now() + 700;
        }
        wsRef.current.send(JSON.stringify(payload));
        return true;
    };

    const updateCursorOnServer = (position) => {
        const clamped = Math.max(0, Math.min(position, sentence.length));
        cursorLockUntilRef.current = Date.now() + 100;
        setCursorPosition(clamped);
        sendWsAction({ action: 'set_cursor', position: clamped }, { skipCooldown: true });
    };

    const applySuggestion = (suggestedWord) => {
        if (!suggestedWord?.trim()) return;
        cursorLockUntilRef.current = Date.now() + 100;
        sendWsAction({ action: 'apply_suggestion', word: suggestedWord });
    };

    const handleSpeak = () => {
        cursorLockUntilRef.current = Date.now() + 100;
        sendWsAction({ action: 'speak' });
    };

    const handleClear = () => {
        cursorLockUntilRef.current = Date.now() + 100;
        sendWsAction({ action: 'clear' });
    };

    const handleDeleteChar = () => {
        cursorLockUntilRef.current = Date.now() + 100;
        sendWsAction({ action: 'delete_char' });
    };

    const handleDeleteWord = () => {
        cursorLockUntilRef.current = Date.now() + 100;
        sendWsAction({ action: 'delete_word' });
    };

    const handleAddSpace = () => {
        cursorLockUntilRef.current = Date.now() + 100;
        sendWsAction({ action: 'add_space' });
    };

    const syncCursorFromInput = () => {
        const input = sentenceRef.current;
        if (!input) return;
        const apply = () => {
            input.focus({ preventScroll: true });
            const pos = input.selectionStart ?? sentence.length;
            updateCursorOnServer(pos);
        };
        // Đọc selection sau khi trình duyệt cập nhật vị trí nhấp (tránh lệch con trỏ).
        requestAnimationFrame(() => requestAnimationFrame(apply));
    };

    const handleEditorKeyDown = (e) => {
        const blockedKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Backspace', 'Delete', ' '];
        if (!blockedKeys.includes(e.key) && e.key !== 'Tab') {
            e.preventDefault();
            return;
        }

        if (e.key === 'Tab') return;
        e.preventDefault();

        if (e.key === 'ArrowLeft') {
            updateCursorOnServer(cursorPosition - 1);
            return;
        }
        if (e.key === 'ArrowRight') {
            updateCursorOnServer(cursorPosition + 1);
            return;
        }
        if (e.key === 'Home' || e.key === 'ArrowUp') {
            updateCursorOnServer(0);
            return;
        }
        if (e.key === 'End' || e.key === 'ArrowDown') {
            updateCursorOnServer(sentence.length);
            return;
        }
        if (e.key === 'Backspace') {
            cursorLockUntilRef.current = Date.now() + 100;
            sendWsAction({ action: 'delete_char' });
            return;
        }
        if (e.key === 'Delete') {
            cursorLockUntilRef.current = Date.now() + 100;
            sendWsAction({ action: 'delete_forward_char' });
            return;
        }
        if (e.key === ' ') {
            cursorLockUntilRef.current = Date.now() + 100;
            sendWsAction({ action: 'add_space' });
        }
    };

    const beforeCaret = sentence.slice(0, cursorPosition);
    const afterCaret = sentence.slice(cursorPosition);

    useEffect(() => {
        const input = sentenceRef.current;
        if (!input) return;
        const clamped = Math.max(0, Math.min(cursorPosition, sentence.length));
        if (input.selectionStart !== clamped || input.selectionEnd !== clamped) {
            input.setSelectionRange(clamped, clamped);
        }
    }, [cursorPosition, sentence]);

    return (
        <div className="min-h-screen bg-gray-50 p-4 w-full text-black">
            <header className="bg-white shadow-sm p-4 rounded-xl flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold border-b-4 border-blue-600 pb-1 flex items-center gap-2"><Camera className="text-blue-600"/> Hệ thống Nhận Diện</h1>
                    {currentUser && (
                        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                            <User className="text-blue-600" size={20} />
                            <span className="font-medium text-blue-700">Xin chào, {currentUser.fullName}</span>
                        </div>
                    )}
                </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate('/quiz')}
                                className="text-blue-600 font-medium flex items-center gap-2 hover:bg-blue-50 px-3 py-2 rounded-lg transition"
                            >
                                <Brain size={18} /> Trắc nghiệm
                            </button>
                            <button
                                onClick={() => navigate('/practice-feedback')}
                                className="text-amber-600 font-medium flex items-center gap-2 hover:bg-amber-50 px-3 py-2 rounded-lg transition border border-amber-200"
                            >
                                <MessageSquare size={18} /> Phản hồi
                            </button>
                            <button
                                onClick={() => navigate('/practice')}
                                className="text-green-600 font-medium flex items-center gap-2 hover:bg-green-50 px-3 py-2 rounded-lg transition"
                            >
                                <Type size={18} /> Luyện tập
                            </button>
                            <button 
                                onClick={() => navigate('/profile')}
                                className="text-blue-600 font-medium flex items-center gap-2 hover:bg-blue-50 px-3 py-2 rounded-lg transition"
                            >
                                <Settings size={18} /> {t('common.profile')}
                            </button>
                            <button onClick={handleLogout} className="text-red-500 font-medium flex items-center gap-2 hover:bg-red-50 px-3 py-2 rounded-lg transition"><LogOut size={18}/> {t('common.logout')}</button>
                        </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-4 border relative overflow-hidden flex flex-col items-center">
                    
                    <div className="w-full mb-4 flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
                        <Settings size={20} className="text-gray-500" />
                        <select 
                            className="flex-1 bg-white border border-gray-300 rounded px-3 py-1 outline-none font-medium"
                            value={selectedCamera}
                            onChange={(e) => {
                                setSelectedCamera(e.target.value);
                                if (isStreaming) {
                                    stopCamera();
                                    setTimeout(startCamera, 500); 
                                }
                            }}
                        >
                            {cameras.length === 0 && <option value="">{t('app.searchingCamera')}</option>}
                            {cameras.map((cam, index) => (
                                <option key={cam.deviceId} value={cam.deviceId}>
                                    {cam.label || `Camera ${index + 1}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Camera + Skeleton side by side */}
                    <div className="w-full flex gap-4 items-stretch">
                        {/* Camera - larger */}
                        <div className="flex-[3] min-w-0">
                            <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center relative">
                                {isStreaming ? (
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                                ) : (
                                    <div className="text-gray-500 font-medium flex flex-col items-center gap-2">
                                        <Camera size={48} className="opacity-50"/>
                                        <p>Camera đang tắt</p>
                                    </div>
                                )}
                                <div
                                    className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold text-white shadow ${
                                        isHandPresent ? 'bg-green-500' : 'bg-gray-500'
                                    }`}
                                >
                                    {isHandPresent ? t('practiceFeedback.detecting') : t('practiceFeedback.noHand')}
                                </div>
                            </div>
                        </div>

                        {/* Hand Skeleton - smaller, beside camera */}
                        <div className="flex-[2] min-w-0 flex flex-col">
                            <div className="text-gray-700 font-semibold mb-2 flex items-center gap-2 text-xs">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-100 text-emerald-600">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
                                </span>
                                Khung xương tay
                            </div>
                            <div className="relative flex-1 bg-white rounded-xl border-2 border-emerald-200 overflow-hidden shadow-inner flex items-center justify-center" style={{minHeight: '180px'}}>
                                {skeletonImage ? (
                                    <img 
                                        src={skeletonImage} 
                                        alt="Hand skeleton" 
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-30"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
                                        <span className="text-[11px] font-medium">{t('practiceFeedback.noHandDetected')}</span>
                                    </div>
                                )}
                                {/* Live indicator */}
                                <div className={`absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow ${skeletonImage ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${skeletonImage ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
                                {skeletonImage ? t('practiceFeedback.liveIndicator') : t('practiceFeedback.idleIndicator')}
                                </div>
                            </div>
                            <p className="text-center text-[10px] text-gray-400 mt-1">{t('practiceFeedback.skeletonDesc')}</p>
                        </div>
                    </div>
                    
                    <canvas ref={canvasRef} width="640" height="480" className="hidden" />

                    <div className="mt-6 flex gap-4 w-full px-4">
                        {!isStreaming ? (
                            <button onClick={startCamera} className="w-full bg-blue-600 font-bold text-white py-3 rounded-lg hover:bg-blue-700 transition flex justify-center items-center gap-2">
                                <Camera size={18} /> {t('practiceFeedback.enableCameraRecognition')}
                            </button>
                        ) : (
                            <button onClick={stopCamera} className="w-full bg-red-600 font-bold text-white py-3 rounded-lg hover:bg-red-700 transition flex justify-center items-center gap-2">
                                {t('practiceFeedback.disableCamera')}
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col gap-6">
                    <div>
                        <h3 className="text-gray-700 font-semibold mb-1 flex items-center gap-2 text-sm">
                            <Type size={16} className="text-blue-600 shrink-0" /> {t('practiceFeedback.signRecognizing')}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">
                            {t('practiceFeedback.onlyShowSign')}
                        </p>
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl h-48 flex items-center justify-center text-8xl font-black text-blue-600">
                            {currentLetter}
                        </div>
                        <p className="text-center text-sm text-gray-400 mt-2">{t('practiceFeedback.holdHandFixed')}</p>
                    </div>


                    
                    <div className="flex-1">
                        <h3 className="text-gray-700 font-semibold mb-1">{t('practiceFeedback.sentenceInputPlaceholder')}</h3>
                        <p className="text-xs text-gray-500 mb-2">
                            {t('practiceFeedback.sentenceInputDesc')}
                        </p>
                        <textarea
                            ref={sentenceRef}
                            value={sentence}
                            readOnly
                            onPointerUp={syncCursorFromInput}
                            onMouseUp={syncCursorFromInput}
                            onClick={syncCursorFromInput}
                            onSelect={syncCursorFromInput}
                            onFocus={() => setIsSentenceFocused(true)}
                            onBlur={() => setIsSentenceFocused(false)}
                            onKeyDown={handleEditorKeyDown}
                            className="w-full bg-blue-50 border border-blue-100 rounded-xl p-4 min-h-36 shadow-inner text-xl font-medium text-gray-800 resize-none outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300"
                            style={{ caretColor: '#1e3a8a' }}
                            rows={5}
                            placeholder={t('app.sentenceCursorPlaceholder')}
                            spellCheck={false}
                            aria-label={t('practiceFeedback.sentenceInputAria')}
                        />
                        <div className="mt-2">
                            <p className="text-xs font-medium text-gray-600 mb-1">
                                Trong câu — vị trí con trỏ (thanh dọc nhấp nháy)
                            </p>
                            <div
                                className="rounded-xl border-2 border-blue-200 bg-white px-3 py-3 text-xl font-medium text-gray-900 whitespace-pre-wrap break-words shadow-inner leading-relaxed select-none"
                                aria-hidden
                            >
                                {beforeCaret}
                                <span
                                    className="inline-block align-middle w-[3px] min-h-[1.15em] shrink-0 rounded-sm bg-blue-700 shadow-[0_0_6px_rgba(29,78,216,0.85)] animate-pulse mx-[3px]"
                                    title={t('app.currentCursorPosition')}
                                />
                                {afterCaret}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1">
                                Ô xanh phía trên dùng để nhấp/chọn con trỏ; khung này chỉ để nhìn rõ thanh con trỏ trong nội dung.
                            </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Vui lòng nhập bằng nhận diện ký hiệu hoặc chọn từ gợi ý. Nhấp trong ô soạn câu để đặt con trỏ; dùng phím mũi tên để di chuyển; Backspace/Delete để xóa; phím cách để chèn khoảng trắng.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm font-medium"
                            >
                                Xóa tất cả
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteChar}
                                className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium"
                            >
                                Xóa 1 ký tự
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteWord}
                                className="px-3 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium"
                            >
                                Xóa 1 từ
                            </button>
                            <button
                                type="button"
                                onClick={handleAddSpace}
                                className="px-3 py-1 rounded bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium"
                            >
                                Thêm khoảng trắng
                            </button>
                            <button
                                type="button"
                                onClick={handleSpeak}
                                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                            >
                                Phát âm
                            </button>
                        </div>
                        <div className="mt-3">
                            <h4 className="text-sm text-red-500 font-semibold mb-2">Gợi ý từ:</h4>
                            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                                {suggestions.slice(0, 40).map((word) => (
                                    <button
                                        key={word}
                                        type="button"
                                        onClick={() => applySuggestion(word)}
                                        className="border border-gray-300 rounded px-2 py-1 text-sm bg-white hover:bg-gray-50 transition"
                                    >
                                        {word}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

function App() {
    return (
        <>
            <Toaster position="top-right" />
            <BrowserRouter>
                <LanguageProvider>
                {/* Assignment lock context ensures the app can hide nav and block navigation during assigned tasks */}
                <AssignmentProvider>
                <Routes>
                    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path="/home" element={<ProtectedRoute><ErrorBoundary><Layout><HomePage /></Layout></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
                        <Route path="/practice-assignment" element={<ProtectedRoute><PracticePage /></ProtectedRoute>} />
                    <Route path="/practice-feedback" element={<ProtectedRoute><PracticeFeedbackPage /></ProtectedRoute>} />
                    <Route path="/quiz" element={<ProtectedRoute><Layout><ASLQuiz /></Layout></ProtectedRoute>} />
                    <Route path="/comprehensive-test" element={<ProtectedRoute><ComprehensiveTestPage /></ProtectedRoute>} />
                    <Route path="/free-recognition" element={<ProtectedRoute><FreeRecognition /></ProtectedRoute>} />

                    {/* Student Routes - Assignments & Exams */}
                    <Route path="/my-assignments" element={<ProtectedRoute><StudentMyAssignments /></ProtectedRoute>} />
                    {/* /my-exams redirect → /student/exams để tương thích backward */}
                    <Route path="/my-exams" element={<ProtectedRoute><StudentMyExams /></ProtectedRoute>} />
                    <Route path="/student/exams" element={<ProtectedRoute><StudentMyExams /></ProtectedRoute>} />
                    <Route path="/student/exams/:id" element={<ProtectedRoute><StudentExamDetail /></ProtectedRoute>} />
                    <Route path="/student/assignments/:id" element={<ProtectedRoute><StudentAssignmentDetail /></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><StudentNotifications /></ProtectedRoute>} />
                    <Route path="/feedback" element={<ProtectedRoute><StudentFeedbackList /></ProtectedRoute>} />
                    <Route path="/support" element={<ProtectedRoute><StudentSupportPage /></ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute><StudentMessagesPage /></ProtectedRoute>} />
                    <Route path="/my-classes" element={<ProtectedRoute><StudentClasses /></ProtectedRoute>} />
                    <Route path="/my-classes/:id" element={<ProtectedRoute><StudentClassDetail /></ProtectedRoute>} />
                    <Route path="/my-badges" element={<ProtectedRoute><StudentBadgesPage /></ProtectedRoute>} />

                    {/* Instructor Routes */}
                    <Route path="/instructor" element={<Navigate to="/instructor/dashboard" replace />} />
                    <Route path="/instructor/dashboard" element={<ProtectedRoute requiredRole="instructor"><InstructorDashboard /></ProtectedRoute>} />
                    <Route path="/instructor/students" element={<ProtectedRoute requiredRole="instructor"><InstructorStudentList /></ProtectedRoute>} />
                    <Route path="/instructor/students/:id" element={<ProtectedRoute requiredRole="instructor"><InstructorStudentDetail /></ProtectedRoute>} />
                    <Route path="/instructor/assignments" element={<ProtectedRoute requiredRole="instructor"><InstructorAssignmentManagement /></ProtectedRoute>} />
                    <Route path="/instructor/exams" element={<ProtectedRoute requiredRole="instructor"><InstructorExamManagement /></ProtectedRoute>} />
                    <Route path="/instructor/reports" element={<ProtectedRoute requiredRole="instructor"><InstructorReports /></ProtectedRoute>} />
                    <Route path="/instructor/notifications" element={<ProtectedRoute requiredRole="instructor"><InstructorNotifications /></ProtectedRoute>} />
                    <Route path="/instructor/badges" element={<ProtectedRoute requiredRole="instructor"><InstructorBadgeManagement /></ProtectedRoute>} />
                    <Route path="/instructor/feedback" element={<ProtectedRoute requiredRole="instructor"><InstructorFeedbackManagement /></ProtectedRoute>} />
                    <Route path="/instructor/support" element={<ProtectedRoute requiredRole="instructor"><InstructorSupportPage /></ProtectedRoute>} />
                    <Route path="/instructor/messages" element={<ProtectedRoute requiredRole="instructor"><InstructorMessagesPage /></ProtectedRoute>} />
                    <Route path="/instructor/profile" element={<ProtectedRoute requiredRole="instructor"><InstructorProfile /></ProtectedRoute>} />

                    {/* Admin Routes */}
                    <Route path="/admin/dashboard"     element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/profile"       element={<ProtectedRoute requiredRole="admin"><AdminProfile /></ProtectedRoute>} />
                    <Route path="/admin/students"      element={<ProtectedRoute requiredRole="admin"><AdminStudents /></ProtectedRoute>} />
                    <Route path="/admin/instructors"   element={<ProtectedRoute requiredRole="admin"><AdminInstructors /></ProtectedRoute>} />
                    <Route path="/admin/classes"       element={<ProtectedRoute requiredRole="admin"><AdminClasses /></ProtectedRoute>} />
                    <Route path="/admin/content"       element={<ProtectedRoute requiredRole="admin"><AdminContent /></ProtectedRoute>} />
                    <Route path="/admin/statistics"    element={<ProtectedRoute requiredRole="admin"><AdminStatistics /></ProtectedRoute>} />
                    <Route path="/admin/reports"       element={<ProtectedRoute requiredRole="admin"><AdminReports /></ProtectedRoute>} />
                    <Route path="/admin/notifications" element={<ProtectedRoute requiredRole="admin"><AdminNotifications /></ProtectedRoute>} />
                    <Route path="/admin/logs"          element={<ProtectedRoute requiredRole="admin"><AdminLogs /></ProtectedRoute>} />
                    <Route path="/admin/system"        element={<ProtectedRoute requiredRole="admin"><AdminSystem /></ProtectedRoute>} />
                    <Route path="/admin/roles"         element={<ProtectedRoute requiredRole="admin"><AdminRoles /></ProtectedRoute>} />
                    <Route path="/admin/support"       element={<ProtectedRoute requiredRole="admin"><AdminSupport /></ProtectedRoute>} />
                    <Route path="/admin/badges"        element={<ProtectedRoute requiredRole="admin"><AdminBadges /></ProtectedRoute>} />
                    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                </Routes>
                </AssignmentProvider>
                </LanguageProvider>
            </BrowserRouter>
        </>
    );
}

export default App;
