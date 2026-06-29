import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Home,
    Camera,
    Brain,
    MessageSquare,
    User,
    Menu,
    X,
    Sparkles,
    HandMetal,
    BookOpen,
    MessageCircle,
    Globe,
    LogOut,
    Trophy,
    FileText,
    ClipboardList,
    Bell,
    GraduationCap,
    Star,
    Award,
    Headphones,
    MessagesSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { logout } from '../utils/authUtils';

const Header = ({ hideNav = false }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showBellMenu, setShowBellMenu] = useState(false);
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const [unreadNotifs, setUnreadNotifs] = useState(0);
    const [unreadFeedback, setUnreadFeedback] = useState(0);
    const [unreadSystemAlerts, setUnreadSystemAlerts] = useState(0);
    const [unreadSupport, setUnreadSupport] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const { lang, setLang, t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role;

    // Đếm system alerts chưa đọc từ localStorage
    // Dùng itemId (không có prefix trạng thái) để check đã đọc,
    // vì prefix thay đổi theo thời gian (new → soon → urgent → overdue)
    // mà không reset trạng thái đã đọc của người dùng.
    const calcUnreadSystemAlerts = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const readIds = JSON.parse(localStorage.getItem('system_alerts_read') || '[]');

            // isRead(itemId): đúng nếu itemId hoặc BẤT KỲ variant prefix nào đã được lưu
            const isItemRead = (itemId, prefix) => {
                if (readIds.includes(itemId)) return true;
                const variants = [`${prefix}${itemId}`, `overdue-${itemId}`, `urgent-${itemId}`, `soon-${itemId}`, `new-${itemId}`,
                    `exam-overdue-${itemId}`, `exam-urgent-${itemId}`, `exam-soon-${itemId}`, `exam-new-${itemId}`];
                return variants.some(v => readIds.includes(v));
            };

            const [assignRes, examRes] = await Promise.allSettled([
                fetch('http://localhost:5000/api/student/assignments?limit=50&status=all', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/student/exams?limit=50', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const now = new Date();
            let count = 0;

            if (assignRes.status === 'fulfilled' && assignRes.value.ok) {
                const data = await assignRes.value.json();
                (data.assignments || []).forEach(a => {
                    const due = a.dueDate ? new Date(a.dueDate) : null;
                    const daysLeft = due ? Math.ceil((due - now) / (1000 * 60 * 60 * 24)) : null;
                    const hasAlert = (a.isOverdue && !a.isCompleted)
                        || (due && daysLeft <= 1 && daysLeft >= 0 && !a.isCompleted)
                        || (due && daysLeft <= 3 && daysLeft > 1 && !a.isCompleted)
                        || (!a.isCompleted && !a.isOverdue);
                    if (hasAlert && !isItemRead(a._id, '')) count++;
                });
            }

            if (examRes.status === 'fulfilled' && examRes.value.ok) {
                const data = await examRes.value.json();
                (data.exams || data.data || []).forEach(e => {
                    const end = e.endDate ? new Date(e.endDate) : null;
                    const daysLeft = end ? Math.ceil((end - now) / (1000 * 60 * 60 * 24)) : null;
                    const isCompleted = e.isCompleted || e.status === 'completed';
                    const isOverdue = end && end < now;
                    const hasAlert = (isOverdue && !isCompleted)
                        || (end && daysLeft <= 1 && daysLeft >= 0 && !isCompleted)
                        || (end && daysLeft <= 3 && daysLeft > 1 && !isCompleted)
                        || (!isCompleted && !isOverdue);
                    if (hasAlert && !isItemRead(e._id, 'exam-')) count++;
                });
            }

            setUnreadSystemAlerts(count);
        } catch (_) {}
    };

    // Fetch unread counts for student
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || userRole === 'instructor' || userRole === 'admin') return;

        const fetchUnreadCounts = async () => {
            try {
                const headers = { Authorization: `Bearer ${token}` };
                const [notifRes, feedbackRes, supportRes] = await Promise.allSettled([
                    fetch('http://localhost:5000/api/student/notifications?page=1&limit=1&unreadOnly=true', { headers }),
                    fetch('http://localhost:5000/api/student/feedback?page=1&limit=1&unreadOnly=true', { headers }),
                    fetch('http://localhost:5000/api/student/support?page=1&limit=20', { headers }),
                ]);
                if (notifRes.status === 'fulfilled' && notifRes.value.ok) {
                    const data = await notifRes.value.json();
                    setUnreadNotifs(data.unreadCount ?? data.pagination?.total ?? 0);
                }
                if (feedbackRes.status === 'fulfilled' && feedbackRes.value.ok) {
                    const data = await feedbackRes.value.json();
                    setUnreadFeedback(data.unreadCount ?? 0);
                }
                if (supportRes.status === 'fulfilled' && supportRes.value.ok) {
                    const data = await supportRes.value.json();
                    const openCount = (data.tickets || []).filter(t => t.status === 'new' || t.status === 'processing').length;
                    setUnreadSupport(data.openCount ?? openCount);
                }
                // Tin nhắn chưa đọc
                try {
                    const msgRes = await fetch('http://localhost:5000/api/messages/unread-count', { headers });
                    if (msgRes.ok) {
                        const data = await msgRes.json();
                        setUnreadMessages(data.count ?? 0);
                    }
                } catch (_) {}
            } catch (_) {}
        };

        fetchUnreadCounts();
        calcUnreadSystemAlerts();

        // Poll every 60 seconds
        const interval = setInterval(() => {
            fetchUnreadCounts();
            calcUnreadSystemAlerts();
        }, 60000);

        // Lắng nghe event khi user đánh dấu đã đọc system alerts
        const handleSystemUpdate = () => calcUnreadSystemAlerts();
        window.addEventListener('systemAlertsUpdated', handleSystemUpdate);

        return () => {
            clearInterval(interval);
            window.removeEventListener('systemAlertsUpdated', handleSystemUpdate);
        };
    }, [userRole]);

    // Badge chuông chỉ tính thông báo thuộc trang /notifications (notifs + system alerts)
    // Feedback và support có badge riêng trong dropdown, không cộng vào chuông để tránh lệch số
    const totalUnread = unreadNotifs + unreadSystemAlerts + unreadFeedback + unreadSupport;

    const handleLogout = () => {
        if (window.confirm(t('logout.confirm'))) {
            logout(navigate);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        const handleClickOutside = (e) => {
            if (showLangMenu && !e.target.closest('.lang-menu')) {
                setShowLangMenu(false);
            }
            if (showBellMenu && !e.target.closest('.bell-menu')) {
                setShowBellMenu(false);
            }
            if (showAccountMenu && !e.target.closest('.account-menu')) {
                setShowAccountMenu(false);
            }
        };

        handleResize();
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);
        document.addEventListener('click', handleClickOutside);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showLangMenu, showBellMenu, showAccountMenu]);

    const handleLangChange = (newLang) => {
        if (newLang === lang) {
            setShowLangMenu(false);
            return;
        }
        setLang(newLang);
        setShowLangMenu(false);
        const msg = newLang === 'en' ? 'Switched to English 🇺🇸' : 'Đã chuyển sang Tiếng Việt 🇻🇳';
        toast.success(msg, { duration: 2000 });
    };

    const langOptions = [
        { code: 'vi', label: 'Tiếng Việt', shortLabel: 'VN', flag: '🇻🇳' },
        { code: 'en', label: 'English', shortLabel: 'US', flag: '🇺🇸' },
    ];

    const currentLang = langOptions.find(l => l.code === lang) || langOptions[0];

    const studentNavItems = [
        { path: '/dashboard', icon: Home, labelKey: 'nav.home' },
        { path: '/my-assignments', icon: FileText, labelKey: 'header.assignments' },
        { path: '/student/exams', icon: ClipboardList, labelKey: 'header.exams' },
        { path: '/free-recognition', icon: Camera, labelKey: 'header.freeRecognition' },
        { path: '/practice-feedback', icon: MessageCircle, labelKey: 'nav.practiceFeedback' },
        { path: '/practice', icon: HandMetal, labelKey: 'nav.practice' },
        { path: '/quiz', icon: Trophy, labelKey: 'nav.quiz' },
        { path: '/comprehensive-test', icon: Brain, labelKey: 'nav.comprehensiveTest' },
    ];

    const instructorNavItems = [
        { path: '/instructor/dashboard', icon: Home, labelKey: 'nav.home' },
        { path: '/instructor/students', icon: User, labelKey: 'nav.students' },
        { path: '/instructor/assignments', icon: BookOpen, labelKey: 'nav.assignments' },
        { path: '/instructor/exams', icon: Brain, labelKey: 'nav.exams' },
    ];

    const navItems = userRole === 'instructor' ? instructorNavItems : studentNavItems;

    const isActive = (path) => location.pathname === path;

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled
                ? 'bg-white/40 backdrop-blur-xl shadow-lg shadow-blue-500/8 border-b border-blue-100/30'
                : 'bg-white/20 backdrop-blur-md shadow-sm shadow-blue-500/3 border-b border-blue-100/20'
        }`}>
            {/* Aurora Glow Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 blur-[80px] rounded-full animate-pulse-glow"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-400/10 blur-[80px] rounded-full animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
                    <div className="flex items-center justify-between h-14 sm:h-16">
                        {/* Logo */}
                        <Link to="/dashboard" className="flex items-center gap-2 group shrink-0">
                            <div className="w-9 h-9 rounded-lg overflow-hidden shadow-md shadow-blue-500/20 border border-blue-100/50 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300">
                                <img src="/logo.jpg" alt="ASL Translator Logo" className="w-full h-full object-cover" />
                            </div>
                            <div className="hidden md:block shrink-0">
                                <h1 className="font-bold text-sm bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent whitespace-nowrap">
                                    ASL Translator
                                </h1>
                                <p className="text-[9px] text-blue-500/70 font-medium whitespace-nowrap">{t('header.subtitle')}</p>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        {!hideNav && (
                            <nav className="hidden xl:flex items-center">
                                <div className="flex items-center bg-gradient-to-r from-blue-50/90 to-cyan-50/90 backdrop-blur-lg border border-blue-200/60 px-2 py-1 rounded-2xl shadow-lg shadow-blue-500/5">
                                    {navItems.map((item) => {
                                        const Icon = item.icon;
                                        const active = isActive(item.path);
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${
                                                    active
                                                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow shadow-blue-500/30'
                                                        : 'text-blue-700 hover:text-blue-900 hover:bg-white/90 border border-transparent hover:border-blue-300/60 nav-slide-item'
                                                }`}
                                            >
                                                <Icon size={13} className="shrink-0" />
                                                <span>{item.label ? item.label : t(item.labelKey)}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </nav>
                        )}

                        {/* User Menu */}
                        <div className="flex items-center gap-2">
                            {!hideNav && (
                                <>
                                    {/* Bell Dropdown - Thông báo & Phản hồi */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowBellMenu(!showBellMenu);
                                            }}
                                            className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50/80 text-blue-700 hover:bg-blue-100 border border-blue-200/50 transition-all duration-300 relative"
                                            title={t('header.notificationsFeedback')}
                                        >
                                            <Bell size={16} />
                                            {totalUnread > 0 && (
                                                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md shadow-red-500/40 animate-pulse">
                                                    {totalUnread > 99 ? '99+' : totalUnread}
                                                </span>
                                            )}
                                        </button>
                                        {showBellMenu && (
                                            <div className="bell-menu absolute right-0 mt-2 w-56 rounded-xl shadow-xl shadow-blue-500/10 overflow-hidden z-50 bg-white/95 backdrop-blur-xl border border-blue-100">
                                                {/* Header của dropdown */}
                                                <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                                                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                                                        {t('header.notificationsFeedback')}
                                                    </p>
                                                </div>
                                                <Link
                                                    to={userRole === 'instructor' ? '/instructor/reports' : '/feedback'}
                                                    onClick={() => setShowBellMenu(false)}
                                                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 transition-all duration-200"
                                                >
                                                    <MessageSquare size={16} className="text-blue-500 flex-shrink-0" />
                                                    <span className="flex-1">{t('header.feedback')}</span>
                                                    {unreadFeedback > 0 && (
                                                        <span className="min-w-[20px] h-5 px-1.5 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                            {unreadFeedback > 99 ? '99+' : unreadFeedback}
                                                        </span>
                                                    )}
                                                </Link>
                                                <Link
                                                    to={userRole === 'instructor' ? '/instructor/notifications' : '/notifications'}
                                                    onClick={() => setShowBellMenu(false)}
                                                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 transition-all duration-200"
                                                >
                                                    <Bell size={16} className="text-cyan-500 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="leading-tight">{t('header.notifications')}</div>
                                                        {/* Sub-label chỉ rõ 2 loại thông báo trong trang này */}
                                                        {(unreadNotifs > 0 || unreadSystemAlerts > 0) && (
                                                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                                {unreadNotifs > 0 && (
                                                                    <span className="text-[9px] font-semibold text-cyan-600 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                                                        {unreadNotifs} giảng viên
                                                                    </span>
                                                                )}
                                                                {unreadSystemAlerts > 0 && (
                                                                    <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                                                        {unreadSystemAlerts} hệ thống
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {(unreadNotifs + unreadSystemAlerts) > 0 && (
                                                        <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                                            {(unreadNotifs + unreadSystemAlerts) > 99 ? '99+' : (unreadNotifs + unreadSystemAlerts)}
                                                        </span>
                                                    )}
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    {/* Language Switcher */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowLangMenu(!showLangMenu);
                                            }}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-blue-50/80 text-blue-700 hover:bg-blue-100 border border-blue-200/50 transition-all duration-300"
                                            title={t('lang.switchLang')}
                                        >
                                            <Globe size={14} />
                                            <span className="hidden sm:inline">{currentLang.shortLabel}</span>
                                        </button>
                                        {showLangMenu && (
                                            <div className="lang-menu absolute right-0 mt-2 w-40 rounded-xl shadow-xl shadow-blue-500/10 overflow-hidden z-50 bg-white/95 backdrop-blur-xl border border-blue-100">
                                                {langOptions.map((opt) => (
                                                    <button
                                                        key={opt.code}
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleLangChange(opt.code);
                                                        }}
                                                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-all duration-200 hover:bg-blue-50 ${
                                                            lang === opt.code
                                                                ? 'text-blue-700 bg-blue-50'
                                                                : 'text-gray-700 hover:text-blue-700'
                                                        }`}
                                                    >
                                                        <span>{opt.flag}</span>
                                                        <span>{opt.label}</span>
                                                        {lang === opt.code && (
                                                            <span className="ml-auto text-blue-500">✓</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Account Dropdown */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowAccountMenu(!showAccountMenu);
                                            }}
                                            className="hidden lg:flex items-center gap-2 px-2 py-1.5 bg-white/80 rounded-xl shadow-sm border border-blue-100/60 hover:shadow-md hover:border-blue-200 transition-all duration-300"
                                        >
                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs shadow-md">
                                                {(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px]">{user.fullName || user.username}</span>
                                        </button>
                                        {showAccountMenu && (
                                            <div className="account-menu absolute right-0 mt-2 w-52 rounded-xl shadow-xl shadow-blue-500/10 overflow-hidden z-50 bg-white/95 backdrop-blur-xl border border-blue-100">
                                                <Link
                                                    to="/profile"
                                                    onClick={() => setShowAccountMenu(false)}
                                                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 transition-all duration-200"
                                                >
                                                    <User size={16} className="text-blue-500" />
                                                    <span>{t('header.profile')}</span>
                                                </Link>
                                                {userRole !== 'instructor' && (
                                                    <Link
                                                        to="/my-classes"
                                                        onClick={() => setShowAccountMenu(false)}
                                                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 transition-all duration-200"
                                                    >
                                                        <GraduationCap size={16} className="text-purple-500" />
                                                        <span>{t('header.myClasses')}</span>
                                                    </Link>
                                                )}
                                                {userRole !== 'instructor' && (
                                                    <Link
                                                        to="/my-badges"
                                                        onClick={() => setShowAccountMenu(false)}
                                                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-orange-50 transition-all duration-200"
                                                    >
                                                        <Award size={16} className="text-orange-500" />
                                                        <span>{t('header.myBadges')}</span>
                                                    </Link>
                                                )}
                                                <div className="border-t border-gray-100"></div>
                                                {/* Tin nhắn */}
                                                <Link
                                                    to={userRole === 'instructor' ? '/instructor/messages' : '/messages'}
                                                    onClick={() => setShowAccountMenu(false)}
                                                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 transition-all duration-200"
                                                >
                                                    <MessageCircle size={16} className="text-blue-500 flex-shrink-0" />
                                                    <span className="flex-1">{t('header.messages')}</span>
                                                    {unreadMessages > 0 && (
                                                        <span className="min-w-[20px] h-5 px-1.5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                            {unreadMessages > 99 ? '99+' : unreadMessages}
                                                        </span>
                                                    )}
                                                </Link>
                                                <div className="border-t border-gray-100"></div>
                                                <Link
                                                    to={userRole === 'instructor' ? '/instructor/support' : '/support'}
                                                    onClick={() => setShowAccountMenu(false)}
                                                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-violet-50 transition-all duration-200"
                                                >
                                                    <Headphones size={16} className="text-violet-500 flex-shrink-0" />
                                                    <span className="flex-1">{t('header.support')}</span>
                                                    {unreadSupport > 0 && (
                                                        <span className="min-w-[20px] h-5 px-1.5 bg-violet-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                            {unreadSupport > 99 ? '99+' : unreadSupport}
                                                        </span>
                                                    )}
                                                </Link>
                                                <div className="border-t border-gray-100"></div>
                                                <button
                                                    onClick={() => { handleLogout(); setShowAccountMenu(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-200"
                                                >
                                                    <LogOut size={16} />
                                                    <span>{t('header.logout')}</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Mobile Logout Button */}
                                    <button
                                        onClick={handleLogout}
                                        className="hidden sm:flex xl:hidden items-center justify-center w-9 h-9 bg-red-50 rounded-xl shadow-sm border border-red-200 hover:bg-red-100 text-red-500 transition-all duration-300"
                                        title={t('header.logout')}
                                    >
                                        <LogOut size={16} />
                                    </button>
                                </>
                            )}

                            {/* Mobile Menu Button */}
                            {!hideNav && (
                                <button
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="xl:hidden p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all duration-300"
                                >
                                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {!hideNav && (
                    <div className={`xl:hidden transition-all duration-300 overflow-hidden ${
                        isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                        <div className="px-4 pb-4 space-y-1.5 bg-white/95 backdrop-blur-xl border-t border-blue-100/50">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                                            active
                                                ? 'text-white bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg'
                                                : 'text-blue-700 hover:bg-blue-50'
                                        }`}
                                    >
                                        <Icon size={18} />
                                        {item.label ? item.label : t(item.labelKey)}
                                    </Link>
                                );
                            })}

                            {/* Mobile User Info & Logout */}
                            <div className="pt-3 mt-2 border-t border-blue-100/50 flex flex-col gap-1.5">
                                {/* Mobile Language Switcher */}
                                <div className="flex items-center gap-2 px-4 py-2">
                                    <Globe size={16} className="text-blue-500 shrink-0" />
                                    <span className="text-xs font-semibold text-blue-700 flex-1">{t('lang.switchLang')}</span>
                                    <div className="flex gap-1">
                                        {langOptions.map((opt) => (
                                            <button
                                                key={opt.code}
                                                type="button"
                                                onClick={() => handleLangChange(opt.code)}
                                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 ${
                                                    lang === opt.code
                                                        ? 'bg-blue-500 text-white shadow-sm'
                                                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60'
                                                }`}
                                            >
                                                <span>{opt.flag}</span>
                                                <span>{opt.shortLabel}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full text-blue-700 hover:bg-blue-50"
                                >
                                    <User size={18} />
                                    <span>{user.fullName || user.username || t('student')}</span>
                                </button>
                                <button
                                    onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold w-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all"
                                >
                                    <LogOut size={18} />
                                    <span>{t('header.logout')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
