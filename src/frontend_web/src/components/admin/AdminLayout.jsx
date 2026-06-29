import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, GraduationCap, BookOpen,
    BarChart3, FileText, Bell, ScrollText, Shield, Key,
    Headphones, Award, LogOut, Menu, X,
    ChevronLeft, ChevronRight, Globe, Sparkles, Settings, UserCircle, LibraryBig
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';

const AdminLayout = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const { lang, setLang, t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleProfileUpdate = () => {
            setUser(JSON.parse(localStorage.getItem('user') || '{}'));
        };
        window.addEventListener('admin-profile-updated', handleProfileUpdate);
        return () => window.removeEventListener('admin-profile-updated', handleProfileUpdate);
    }, []);

    const handleLogout = async () => {
        if (window.confirm(t('admin.auto.k_logout_conf', t('admin.auto.k_2478ac90', 'Bạn có chắc muốn đăng xuất?')))) {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    await fetch('http://localhost:5000/api/auth/logout', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` }
                    }).catch(() => {});
                }
            } finally {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
        }
    };

    const toggleLanguage = () => {
        const newLang = lang === 'vi' ? 'en' : 'vi';
        setLang(newLang);
        toast.success(newLang === 'vi' ? t('admin.auto.k_c2b79a77', 'Đã chuyển sang Tiếng Việt') : 'Switched to English', { duration: 2000 });
    };

    const isActive = (path) => location.pathname === path;

    const getMenuItems = () => [
        { path: '/admin/dashboard',     icon: LayoutDashboard, label: t('admin.auto.k_menu_dashboard',    'Dashboard'),                color: 'from-violet-500 to-purple-500' },
        { path: '/admin/students',      icon: Users,           label: t('admin.auto.k_6241294a',          t('admin.auto.k_6241294a', 'Quản lý học viên')),         color: 'from-blue-500 to-cyan-500' },
        { path: '/admin/instructors',   icon: GraduationCap,   label: t('admin.auto.k_0306c929',          t('admin.auto.k_0306c929', 'Quản lý giảng viên')),       color: 'from-emerald-500 to-teal-500' },
        { path: '/admin/classes',       icon: BookOpen,        label: t('admin.auto.k_5a69be1b',          t('admin.auto.k_5a69be1b', 'Quản lý lớp học')),          color: 'from-sky-500 to-blue-500' },
        { path: '/admin/content',       icon: LibraryBig,      label: t('admin.auto.k_51e333ff',          t('admin.auto.k_51e333ff', 'Ngân hàng câu hỏi')),        color: 'from-yellow-500 to-orange-500' },
        { path: '/admin/statistics',    icon: BarChart3,       label: t('admin.auto.k_b0fb350f',          t('admin.auto.k_b0fb350f', 'Thống kê & Phân tích')),     color: 'from-pink-500 to-rose-500' },
        { path: '/admin/reports',       icon: FileText,        label: t('admin.auto.k_menu_reports',      t('admin.auto.k_2e9037c2', 'Báo cáo')),                  color: 'from-indigo-500 to-violet-500' },
        { path: '/admin/notifications', icon: Bell,            label: t('admin.auto.k_5fa60fcb',          t('admin.auto.k_5fa60fcb', 'Quản lý thông báo')),        color: 'from-cyan-500 to-sky-500' },
        { path: '/admin/logs',          icon: ScrollText,      label: t('admin.auto.k_0b41920e',          t('admin.auto.k_0b41920e', 'Nhật ký hệ thống')),         color: 'from-slate-500 to-gray-500' },
        { path: '/admin/system',        icon: Shield,          label: t('admin.auto.k_fbf4058b',          t('admin.auto.k_fbf4058b', 'Hệ thống & Bảo mật')),       color: 'from-red-500 to-rose-500' },
        { path: '/admin/roles',         icon: Key,             label: t('admin.auto.k_5eacfa8b',          t('admin.auto.k_55b2405c', 'Phân quyền')),               color: 'from-purple-500 to-violet-500' },
        { path: '/admin/support',       icon: Headphones,      label: t('admin.auto.k_da242a1a',          t('admin.auto.k_da242a1a', 'Hỗ trợ kỹ thuật')),          color: 'from-blue-500 to-indigo-500' },
        { path: '/admin/badges',        icon: Award,           label: t('admin.auto.k_81c70f72',          t('admin.auto.k_040e72d2', 'Huy hiệu & Thành tích')),    color: 'from-amber-500 to-yellow-500' },
    ];

    const SidebarContent = ({ mobile = false }) => (
        <div className="flex flex-col h-full relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59,130,246,0.3) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-400/20 rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute top-1/3 -right-8 w-36 h-36 bg-cyan-400/15 rounded-full blur-[50px] pointer-events-none" />
            <div className="absolute bottom-1/4 -left-6 w-32 h-32 bg-sky-400/10 rounded-full blur-[40px] pointer-events-none" />

            {/* Logo */}
            <div className="relative px-4 pt-6 pb-4 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl blur-[8px] opacity-60" />
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/40 border border-white/30">
                                <img src="/logo.jpg" alt="ASL Admin" className="w-full h-full object-cover" />
                            </div>
                        </div>
                        {(!isCollapsed || mobile) && (
                            <div className="overflow-hidden">
                                <h1 className="font-extrabold text-sm bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent leading-tight">
                                    ASL Admin
                                </h1>
                                <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                                    {t('admin.auto.k_admin_sys', t('admin.auto.k_2751cac1', 'Quản trị hệ thống'))}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {(!isCollapsed || mobile) && (
                            <button onClick={toggleLanguage}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200/70 transition-all text-[11px] font-bold text-blue-700 hover:shadow-sm active:scale-95">
                                <Globe size={11} />{lang === 'vi' ? 'VN' : 'EN'}
                            </button>
                        )}
                        {mobile && (
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 ml-1">
                                <X size={17} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="relative mx-4 z-10">
                <div className="h-px bg-gradient-to-r from-transparent via-blue-300/80 to-transparent" />
                <div className="h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent mt-px" />
            </div>

            {/* Menu */}
            <div className="relative flex-1 px-3 pt-3 pb-1 overflow-y-auto no-scrollbar z-10">
                {(!isCollapsed || mobile) && (
                    <div className="flex items-center gap-2 px-3 mb-3">
                        <div className="h-px flex-1 bg-gradient-to-r from-blue-300/60 to-transparent" />
                        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-[0.18em] whitespace-nowrap">
                            {t('admin.auto.k_admin_menu', t('admin.auto.k_499e542a', 'MENU QUẢN TRỊ'))}
                        </p>
                        <div className="h-px flex-1 bg-gradient-to-l from-blue-300/60 to-transparent" />
                    </div>
                )}
                <nav className="space-y-0.5">
                    {getMenuItems().map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link key={item.path} to={item.path}
                                onClick={() => mobile && setIsMobileMenuOpen(false)}
                                title={isCollapsed && !mobile ? item.label : ''}
                                className={`relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group ${
                                    active ? 'text-white shadow-lg' : 'text-slate-700 hover:text-blue-700'
                                } ${isCollapsed && !mobile ? 'justify-center' : ''}`}>

                                {active && (
                                    <>
                                        <div className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-xl`} />
                                        <div className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-xl blur-[10px] opacity-40 -z-10 scale-105`} />
                                    </>
                                )}
                                {!active && (
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-blue-50 to-cyan-50/80 rounded-xl border border-blue-100/60" />
                                )}

                                <div className={`relative flex-shrink-0 transition-all duration-300 ${
                                    active ? 'text-white' : 'text-slate-500 group-hover:text-blue-600 group-hover:scale-110'
                                }`}>
                                    <Icon size={17} />
                                </div>

                                {(!isCollapsed || mobile) && (
                                    <span className={`relative font-semibold text-[13px] leading-tight transition-all duration-200 ${
                                        active ? 'text-white' : 'text-slate-700 group-hover:text-blue-700'
                                    }`}>
                                        {item.label}
                                    </span>
                                )}

                                {active && (!isCollapsed || mobile) && (
                                    <div className="relative ml-auto flex-shrink-0">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Divider */}
            <div className="relative mx-4 z-10">
                <div className="h-px bg-gradient-to-r from-transparent via-blue-300/80 to-transparent" />
                <div className="h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent mt-px" />
            </div>

            {/* Bottom */}
            <div className="relative p-3 space-y-1.5 z-10">
                {/* User card */}
                <Link to="/admin/profile"
                    onClick={() => mobile && setIsMobileMenuOpen(false)}
                    title={isCollapsed && !mobile ? `${user.fullName || user.username} — ${t('admin.auto.k_586b324c', 'View profile')}` : ''}
                    className={`relative flex items-center gap-3 p-3 rounded-xl overflow-hidden transition-all duration-200 group hover:shadow-sm ${
                        isActive('/admin/profile') ? 'ring-2 ring-blue-400/60' : ''
                    } ${isCollapsed && !mobile ? 'justify-center' : ''}`}>
                    <div className={`absolute inset-0 rounded-xl border transition-colors duration-200 ${
                        isActive('/admin/profile')
                            ? 'bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-300/80'
                            : 'bg-gradient-to-br from-blue-50/90 to-cyan-50/80 border-blue-200/60 group-hover:border-blue-300/80 group-hover:from-blue-100/80 group-hover:to-cyan-100/60'
                    }`} />
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg blur-[5px] opacity-50" />
                        {user.avatar ? (
                            <img src={user.avatar} alt="avatar"
                                className="relative w-8 h-8 rounded-lg object-cover shadow-md shadow-blue-500/30 border border-white/30" />
                        ) : (
                            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/30 border border-white/30">
                                {(user.fullName || user.username || 'A').charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    {(!isCollapsed || mobile) && (
                        <div className="relative flex-1 min-w-0">
                            <p className="font-bold text-xs text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                                {user.fullName || user.username}
                            </p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded-full mt-0.5 border border-blue-200/60">
                                <Sparkles size={8} />{t('admin.auto.k_08cd66cb', t('admin.auto.k_08cd66cb', 'Quản trị viên'))}
                            </span>
                        </div>
                    )}
                    {(!isCollapsed || mobile) && (
                        <UserCircle size={14} className="relative flex-shrink-0 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    )}
                </Link>

                {/* Logout */}
                <button onClick={handleLogout}
                    title={isCollapsed && !mobile ? t('admin.auto.k_logout', t('admin.auto.k_0b3c823d', 'Đăng xuất')) : ''}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200/60 transition-all duration-200 group font-semibold ${isCollapsed && !mobile ? 'justify-center' : ''}`}>
                    <LogOut size={16} className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                    {(!isCollapsed || mobile) && <span className="text-sm font-semibold">{t('admin.auto.k_logout', t('admin.auto.k_0b3c823d', 'Đăng xuất'))}</span>}
                </button>

                {/* Collapse toggle */}
                {!mobile && (
                    <button onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 border border-transparent hover:border-blue-100/60 transition-all duration-200 group">
                        <div className="transition-transform duration-300 group-hover:scale-110">
                            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        </div>
                        {!isCollapsed && <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">{t('admin.auto.k_collapse', t('admin.auto.k_5d71765c', 'Thu gọn'))}</span>}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 flex">
            {/* Desktop Sidebar */}
            <aside className={`hidden lg:flex flex-col bg-white/92 backdrop-blur-xl border-r border-blue-200/70 fixed h-full z-40 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[68px]' : 'w-64'}`}
                style={{ boxShadow: '4px 0 24px -4px rgba(59,130,246,0.15), 1px 0 0 rgba(147,197,253,0.4)' }}>
                <div className="absolute top-0 left-0 right-0 h-[3px] z-50 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-sky-500" style={{ backgroundSize: '200% 100%' }} />
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
                    <div className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-sky-500" />
                </div>
                <SidebarContent mobile />
            </aside>

            {/* Main Content */}
            <main className={`flex-1 min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:ml-[68px]' : 'lg:ml-64'}`}>
                {/* Mobile top bar */}
                <header className="lg:hidden bg-white/85 backdrop-blur-xl border-b border-blue-100/70 px-4 py-3 sticky top-0 z-30"
                    style={{ boxShadow: '0 2px 16px -4px rgba(59,130,246,0.1)' }}>
                    <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-sky-500" />
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
                                    {(user.fullName || user.username || 'A').charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                <div className="p-4 lg:p-6">{children}</div>
            </main>
        </div>
    );
};

export default AdminLayout;
