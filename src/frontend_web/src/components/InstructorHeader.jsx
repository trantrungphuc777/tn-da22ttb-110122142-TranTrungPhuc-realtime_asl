import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Home,
    Users,
    ClipboardList,
    BookOpen,
    BarChart3,
    Bell,
    GraduationCap,
    Menu,
    X,
    Globe,
    LogOut,
    ChevronDown,
    BookMarked,
    MessageSquare,
    FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { logout } from '../utils/authUtils';

const InstructorHeader = ({ hideNav = false }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { lang, setLang, t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

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
            if (showUserMenu && !e.target.closest('.user-menu')) {
                setShowUserMenu(false);
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
    }, [showLangMenu, showUserMenu]);

    const handleLangChange = (newLang) => {
        if (newLang === lang) {
            setShowLangMenu(false);
            return;
        }
        setLang(newLang);
        setShowLangMenu(false);
        toast.success(newLang === 'vi' ? t('common.switchedToVietnamese') : t('common.switchedToEnglish'), { duration: 2000 });
    };

    const langOptions = [
        { code: 'vi', labelKey: 'common.vietnamese', shortLabel: 'VN', flag: '🇻🇳' },
        { code: 'en', labelKey: 'common.english', shortLabel: 'US', flag: '🇺🇸' },
    ];

    const currentLang = langOptions.find(l => l.code === lang) || langOptions[0];

    const navItems = [
        { path: '/instructor/dashboard', icon: Home, labelKey: 'nav.home' },
        { path: '/instructor/students', icon: Users, labelKey: 'nav.students' },
        { path: '/instructor/assignments', icon: ClipboardList, labelKey: 'nav.assignments' },
        { path: '/instructor/exams', icon: BookOpen, labelKey: 'nav.exams' },
        { path: '/instructor/reports', icon: BarChart3, labelKey: 'nav.reports' },
        { path: '/instructor/notifications', icon: Bell, labelKey: 'nav.notifications' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            isScrolled
                ? 'bg-white/80 backdrop-blur-2xl border-b border-emerald-200/50 shadow-lg shadow-emerald-500/10'
                : 'bg-white/60 backdrop-blur-xl border-b border-emerald-100/40 shadow-md shadow-emerald-500/5'
        }`}>
            {/* Aurora Background Glow */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-400/20 blur-[80px] rounded-full animate-pulse-glow"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-400/20 blur-[80px] rounded-full animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-12 xl:px-20">
                    <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
                        {/* Logo */}
                        <Link to="/instructor/dashboard" className="flex items-center gap-2 sm:gap-3 group">
                            <div className={`transition-all duration-300 group-hover:scale-110 rounded-2xl overflow-hidden w-10 h-10 sm:w-12 sm:h-12 border border-emerald-200/50 ${
                                isScrolled
                                    ? 'shadow-lg shadow-emerald-500/30'
                                    : 'shadow-md shadow-emerald-500/10'
                            }`}>
                                <img src="/logo.jpg" alt="ASL Translator Logo" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h1 className={`font-bold text-lg sm:text-xl tracking-tight transition-colors ${
                                    isScrolled ? 'text-shimmer' : 'bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent'
                                }`}>
                                    ASL Instructor
                                </h1>
                                <p className={`text-[10px] sm:text-xs transition-colors ${isScrolled ? 'text-emerald-500' : 'text-emerald-600/70'}`}>
                                    {t('instructor.subtitle')}
                                </p>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        {!hideNav && (
                            <nav className="hidden xl:flex items-center gap-1 bg-white/50 backdrop-blur-md border border-emerald-200/70 p-1 rounded-2xl shadow-sm shadow-emerald-200/20">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.path);
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`relative px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-300 whitespace-nowrap truncate max-w-[160px] lg:max-w-[200px] ${
                                                active
                                                    ? 'text-emerald-700 bg-white shadow-md shadow-emerald-200/40 border border-emerald-100 scale-[1.02]'
                                                    : 'text-emerald-800/70 hover:text-emerald-800 hover:bg-white/70 border border-transparent hover:border-emerald-100/50 hover:shadow-sm'
                                            }`}
                                        >
                                            <span className="flex items-center gap-1.5 lg:gap-2">
                                                <Icon size={16} className={`shrink-0 ${active ? "text-emerald-500 drop-shadow-sm" : ""}`} />
                                                <span className="truncate">{t(item.labelKey) || item.path.split('/').pop()}</span>
                                            </span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        )}

                        {/* User Menu */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {!hideNav && (
                                <>
                                    {/* Language Switcher */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowLangMenu(!showLangMenu);
                                            }}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-300 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50"
                                            title={t('lang.switchLang')}
                                        >
                                            <Globe size={16} />
                                            <span className="hidden sm:inline">{currentLang.label}</span>
                                            <span className="sm:hidden">{currentLang.flag}</span>
                                        </button>
                                        {showLangMenu && (
                                            <div className="lang-menu absolute right-0 mt-2 w-44 rounded-xl shadow-xl shadow-emerald-500/10 overflow-hidden z-50 bg-white/95 backdrop-blur-xl border border-emerald-100">
                                                {langOptions.map((opt) => (
                                                    <button
                                                        key={opt.code}
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleLangChange(opt.code);
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-emerald-50 ${
                                                            lang === opt.code
                                                                ? 'text-emerald-700 bg-emerald-50'
                                                                : 'text-gray-700 hover:text-emerald-700'
                                                        }`}
                                                    >
                                                        <span>{opt.flag}</span>
                                                        <span>{t(opt.labelKey)}</span>
                                                        {lang === opt.code && (
                                                            <span className="ml-auto text-emerald-500">✓</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Instructor Badge */}
                                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-md shadow-emerald-500/30">
                                        <GraduationCap size={18} />
                                        <span className="text-sm font-semibold">{t('instructor.layout.instructor')}</span>
                                    </div>

                                    {/* Account Button */}
                                    <div className="relative user-menu">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowUserMenu(!showUserMenu);
                                            }}
                                            className="hidden sm:flex items-center gap-3 px-3 py-2 bg-white/90 rounded-2xl shadow-sm shadow-emerald-200/30 border border-emerald-100/60 transition-all duration-300 hover:shadow-md hover:shadow-emerald-200/40 hover:border-emerald-200 text-left group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-transform duration-300">
                                                {(user.fullName || user.username || 'I').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <span className="text-sm font-semibold text-emerald-900 leading-tight">{user.fullName || user.username || t('instructor.layout.instructor')}</span>
                                                <span className="text-[11px] font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-lg mt-0.5 w-max inline-block">
                                                    {t('instructor.layout.instructor')}
                                                </span>
                                            </div>
                                            <ChevronDown size={16} className={`text-emerald-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                                        </button>
                                        {showUserMenu && (
                                            <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl shadow-emerald-500/10 overflow-hidden z-50 bg-white/95 backdrop-blur-xl border border-emerald-100">
                                                <div className="px-4 py-3 border-b border-emerald-100">
                                                    <p className="font-semibold text-emerald-900">{user.fullName || user.username}</p>
                                                    <p className="text-xs text-emerald-600">{user.email}</p>
                                                </div>
                                                <Link
                                                    to="/instructor/profile"
                                                    onClick={() => setShowUserMenu(false)}
                                                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-emerald-50 transition-colors"
                                                >
                                                    <FileText size={18} className="text-emerald-600" />
                                                    {t('profilePage.profileHeader')}
                                                </Link>
                                                <button
                                                    onClick={() => { setShowUserMenu(false); handleLogout(); }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <LogOut size={18} />
                                                    {t('header.logout')}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Logout Button (Mobile) */}
                                    <button
                                        onClick={handleLogout}
                                        className="hidden sm:flex items-center justify-center w-10 h-10 bg-red-50 rounded-2xl shadow-sm shadow-red-200/30 border border-red-200 transition-all duration-300 hover:shadow-md hover:shadow-red-300/40 hover:bg-red-100 text-red-600 group"
                                        title={t('header.logout')}
                                    >
                                        <LogOut size={18} className="group-hover:scale-110 transition-transform duration-300" />
                                    </button>
                                </>
                            )}

                            {/* Mobile Menu Button */}
                            {!hideNav && (
                                <button
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="xl:hidden p-2 rounded-xl transition-all duration-300 hover:bg-emerald-50 text-emerald-700"
                                >
                                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
                        <div className="px-4 pb-4 space-y-1 bg-white/95 backdrop-blur-xl border-t border-emerald-100/50">
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
                                                ? 'text-emerald-700 bg-emerald-50'
                                                : 'text-emerald-800/70 hover:bg-emerald-50/50'
                                        }`}
                                    >
                                        <Icon size={20} />
                                        {t(item.labelKey) || item.path.split('/').pop()}
                                    </Link>
                                );
                            })}

                            {/* Mobile User Info & Logout */}
                            <div className="pt-3 mt-3 border-t border-emerald-100/50 flex flex-col gap-1">
                                {/* Mobile Language Switcher */}
                                <div className="flex items-center gap-2 px-4 py-2">
                                    <Globe size={16} className="text-emerald-500 shrink-0" />
                                    <span className="text-xs font-semibold text-emerald-700 flex-1">{t('lang.switchLang')}</span>
                                    <div className="flex gap-1">
                                        {langOptions.map((opt) => (
                                            <button
                                                key={opt.code}
                                                type="button"
                                                onClick={() => handleLangChange(opt.code)}
                                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 ${
                                                    lang === opt.code
                                                        ? 'bg-emerald-500 text-white shadow-sm'
                                                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                                                }`}
                                            >
                                                <span>{opt.flag}</span>
                                                <span>{opt.shortLabel}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-xl">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold">
                                        {(user.fullName || user.username || 'I').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col text-left leading-tight">
                                        <span className="text-sm font-semibold text-emerald-900">{user.fullName || user.username}</span>
                                        <span className="text-[11px] px-2 py-0.5 rounded-lg mt-1 w-max bg-emerald-200 text-emerald-800">{t('instructor.layout.instructor')}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold w-full bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors"
                                >
                                    <LogOut size={20} />
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

export default InstructorHeader;
