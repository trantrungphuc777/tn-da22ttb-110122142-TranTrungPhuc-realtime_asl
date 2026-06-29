import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Home, Users, BookOpen, ClipboardList, BarChart3, Bell,
    LogOut, Menu, X, ChevronLeft, ChevronRight,
    GraduationCap, FileText, Globe, Sparkles, Award, MessageSquare, Headphones, MessageCircle, UserCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { logout } from '../utils/authUtils';

const menuItems = () => [
    { path: '/instructor/dashboard',     icon: Home,          labelKey: 'instructor.layout.dashboard',    color: 'from-blue-500 to-cyan-500'   },
    { path: '/instructor/students',      icon: Users,         labelKey: 'instructor.students.title',      color: 'from-cyan-500 to-sky-500'    },
    { path: '/instructor/assignments',   icon: FileText,      labelKey: 'instructor.assignments.title',  color: 'from-sky-500 to-blue-500'    },
    { path: '/instructor/exams',         icon: ClipboardList, labelKey: 'instructor.exams.title',        color: 'from-indigo-500 to-blue-500' },
    { path: '/instructor/reports',       icon: BarChart3,     labelKey: 'instructor.reports.title',      color: 'from-blue-500 to-indigo-500' },
    { path: '/instructor/badges',        icon: Award,         labelKey: 'instructor.badges.title',        color: 'from-orange-500 to-yellow-500' },
    { path: '/instructor/feedback',      icon: MessageSquare, labelKey: 'instructor.feedback.title',      color: 'from-emerald-500 to-teal-500'  },
    { path: '/instructor/messages',      icon: MessageCircle, labelKey: 'instructor.messages.title',      color: 'from-blue-500 to-cyan-500'     },
    { path: '/instructor/notifications', icon: Bell,          labelKey: 'instructor.notifications.title', color: 'from-cyan-500 to-blue-500'     },
    { path: '/instructor/support',       icon: Headphones,    labelKey: 'instructor.support.title',       color: 'from-blue-500 to-indigo-500'   },
    { path: '/instructor/profile',       icon: UserCircle,    labelKey: 'instructor.layout.myAccount',    color: 'from-slate-500 to-slate-600'   },
];

const InstructorLayout = ({ children, noPadding = false }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { lang, setLang, t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const items = menuItems();

    const handleLogout = () => {
        if (window.confirm(t('instructor.layout.confirmLogout'))) {
            logout(navigate);
        }
    };

    const toggleLanguage = () => {
        const newLang = lang === 'vi' ? 'en' : 'vi';
        setLang(newLang);
        toast.success(newLang === 'vi' ? t('common.switchedToVietnamese') : t('common.switchedToEnglish'), { duration: 2000 });
    };

    const isActive = (path) => location.pathname === path;

    const SidebarContent = ({ mobile = false }) => (
        <div className="flex flex-col h-full relative overflow-hidden">
            {/* Subtle dot grid + soft aurora background */}
            <div className="absolute inset-0 particle-grid opacity-30 pointer-events-none" />
            <div className="absolute inset-0 data-stream pointer-events-none opacity-40" />

            {/* Aurora orbs */}
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-400/20 rounded-full blur-[60px] pointer-events-none animate-pulse-glow" />
            <div className="absolute top-1/3 -right-8 w-36 h-36 bg-cyan-400/15 rounded-full blur-[50px] pointer-events-none animate-float-slow" />
            <div className="absolute bottom-1/4 -left-6 w-32 h-32 bg-sky-400/10 rounded-full blur-[40px] pointer-events-none animate-float" />

            {/* Logo section */}
            <div className="relative px-4 pt-6 pb-4 z-10">
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl blur-[8px] opacity-60 animate-pulse-glow" />
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/40 border border-white/30">
                                <img src="/logo.jpg" alt="ASL Translator Logo" className="w-full h-full object-cover" />
                            </div>
                        </div>
                        {(!isCollapsed || mobile) && (
                            <div className="overflow-hidden">
                                <h1 className="font-extrabold text-sm text-shimmer leading-tight">
                                    ASL Translator
                                </h1>
                                <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                                    {t('instructor.layout.trainingManagement')}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {(!isCollapsed || mobile) && (
                            <button onClick={toggleLanguage}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200/70 transition-all text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:shadow-sm active:scale-95">
                                <Globe size={11} />{lang === 'vi' ? 'VN' : 'EN'}
                            </button>
                        )}
                        {mobile && (
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 ml-1 transition-colors">
                                <X size={17} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Double gradient divider */}
            <div className="relative mx-4 z-10">
                <div className="h-px bg-gradient-to-r from-transparent via-blue-300/80 to-transparent" />
                <div className="h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent mt-px" />
            </div>

            {/* Menu section */}
            <div className="relative flex-1 px-3 pt-3 pb-1 overflow-y-auto no-scrollbar z-10">
                {(!isCollapsed || mobile) && (
                    <div className="flex items-center gap-2 px-3 mb-3">
                        <div className="h-px flex-1 bg-gradient-to-r from-blue-300/60 to-transparent" />
                        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-[0.18em] whitespace-nowrap">
                            {t('instructor.layout.mainMenu')}
                        </p>
                        <div className="h-px flex-1 bg-gradient-to-l from-blue-300/60 to-transparent" />
                    </div>
                )}
                <nav className="space-y-1">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link key={item.path} to={item.path}
                                onClick={() => mobile && setIsMobileMenuOpen(false)}
                                title={isCollapsed && !mobile ? t(item.labelKey) : ''}
                                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${
                                    active ? 'text-white shadow-lg' : 'text-slate-700 hover:text-blue-700'
                                } ${isCollapsed && !mobile ? 'justify-center' : ''}`}>

                                {/* Active gradient bg + glow + shimmer */}
                                {active && (
                                    <>
                                        <div className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-xl`} />
                                        <div className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-xl blur-[10px] opacity-40 -z-10 scale-105`} />
                                        <div className="absolute inset-0 overflow-hidden rounded-xl">
                                            <div className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                        </div>
                                    </>
                                )}

                                {/* Hover bg */}
                                {!active && (
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-blue-50 to-cyan-50/80 rounded-xl border border-blue-100/60" />
                                )}

                                {/* Icon */}
                                <div className={`relative flex-shrink-0 transition-all duration-300 ${
                                    active ? 'text-white' : 'text-slate-500 group-hover:text-blue-600 group-hover:scale-110'
                                }`}>
                                    <Icon size={18} />
                                </div>

                                {/* Label */}
                                {(!isCollapsed || mobile) && (
                                    <span className={`relative font-semibold text-sm leading-tight transition-all duration-200 ${
                                        active ? 'text-white' : 'text-slate-700 group-hover:text-blue-700'
                                    }`}>
                                        {t(item.labelKey)}
                                    </span>
                                )}

                                {/* Active pulse dot */}
                                {active && (!isCollapsed || mobile) && (
                                    <div className="relative ml-auto flex-shrink-0">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                        <div className="absolute inset-0 w-1.5 h-1.5 bg-white/50 rounded-full animate-ping" />
                                    </div>
                                )}

                                {/* Hover right bar */}
                                {!active && (!isCollapsed || mobile) && (
                                    <div className="relative ml-auto w-0.5 h-4 rounded-full bg-blue-300/0 group-hover:bg-blue-400/70 transition-all duration-300 flex-shrink-0" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Double gradient divider */}
            <div className="relative mx-4 z-10">
                <div className="h-px bg-gradient-to-r from-transparent via-blue-300/80 to-transparent" />
                <div className="h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent mt-px" />
            </div>

            {/* Bottom section */}
            <div className="relative p-3 space-y-1.5 z-10">
                {/* User card */}
                <Link to="/instructor/profile" className={`relative flex items-center gap-3 p-3 rounded-xl overflow-hidden hover:ring-1 hover:ring-blue-300/60 transition-all ${isCollapsed && !mobile ? 'justify-center' : ''}`}
                    title={isCollapsed && !mobile ? (user.fullName || user.username) : ''}>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-50/90 to-cyan-50/80 border border-blue-200/60 backdrop-blur-sm" />
                    <div className="absolute inset-0 rounded-xl aurora-bg opacity-30" />
                    <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg blur-[5px] opacity-50 animate-pulse-glow" />
                        <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/30 border border-white/30">
                            {(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
                        </div>
                    </div>
                    {(!isCollapsed || mobile) && (
                        <div className="relative flex-1 min-w-0">
                            <p className="font-bold text-xs text-slate-800 truncate">{user.fullName || user.username}</p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded-full mt-0.5 border border-blue-200/60">
                                <Sparkles size={8} />{t('instructor.layout.instructor')}
                            </span>
                        </div>
                    )}
                </Link>

                {/* Logout */}
                <button onClick={handleLogout}
                    title={isCollapsed && !mobile ? t('instructor.layout.logout') : ''}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200/60 transition-all duration-200 group font-semibold ${isCollapsed && !mobile ? 'justify-center' : ''}`}>
                    <LogOut size={16} className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                    {(!isCollapsed || mobile) && <span className="text-sm font-semibold">{t('instructor.layout.logout')}</span>}
                </button>

                {/* Collapse toggle */}
                {!mobile && (
                    <button onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 border border-transparent hover:border-blue-100/60 transition-all duration-200 group">
                        <div className="transition-transform duration-300 group-hover:scale-110">
                            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        </div>
                        {!isCollapsed && <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">{t('instructor.layout.collapse')}</span>}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-cyan-50/30 flex">
            {/* Desktop Sidebar */}
            <aside className={`hidden lg:flex flex-col bg-white/92 backdrop-blur-xl border-r border-blue-200/70 fixed h-full z-40 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[68px]' : 'w-64'}`}
                style={{ boxShadow: '4px 0 24px -4px rgba(59,130,246,0.15), 1px 0 0 rgba(147,197,253,0.4)' }}>
                {/* Animated top strip */}
                <div className="absolute top-0 left-0 right-0 h-[3px] z-50 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-sky-500 animate-gradient-xy" style={{ backgroundSize: '200% 100%' }} />
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                    </div>
                </div>
                <SidebarContent />
            </aside>

            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 bg-blue-950/30 z-50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {/* Mobile Sidebar */}
            <aside className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl border-r border-blue-200/70 flex flex-col transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{ boxShadow: '4px 0 32px -4px rgba(59,130,246,0.2)' }}>
                <div className="absolute top-0 left-0 right-0 h-[3px] z-50 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-sky-500 animate-gradient-xy" style={{ backgroundSize: '200% 100%' }} />
                </div>
                <SidebarContent mobile />
            </aside>

            {/* Main Content */}
            <main className={`flex-1 min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:ml-[68px]' : 'lg:ml-64'} ${noPadding ? 'flex flex-col overflow-hidden' : ''}`}
                style={noPadding ? { height: '100vh' } : {}}>
                {/* Mobile top bar */}
                <header className="lg:hidden bg-white/85 backdrop-blur-xl border-b border-blue-100/70 px-4 py-3 sticky top-0 z-30"
                    style={{ boxShadow: '0 2px 16px -4px rgba(59,130,246,0.1)' }}>
                    <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-sky-500 animate-gradient-xy" style={{ backgroundSize: '200% 100%' }} />
                    </div>
                    <div className="flex items-center justify-between">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-xl hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100/60">
                            <Menu size={21} />
                        </button>
                        <div className="flex items-center gap-2">
                            <button onClick={toggleLanguage} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200/70 text-[11px] font-bold text-blue-700 transition-all">
                                <Globe size={12} />{lang === 'vi' ? 'VN' : 'EN'}
                            </button>
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg blur-[5px] opacity-50" />
                                <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/30 border border-white/30">
                                    {(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                <div className={noPadding ? 'flex-1 overflow-hidden' : 'p-3 lg:p-4'}>{children}</div>
            </main>
        </div>
    );
};

export default InstructorLayout;
