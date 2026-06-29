import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    User, Mail, Lock, Eye, EyeOff, Save, Calendar, Award,
    BookOpen, Trophy, TrendingUp, Clock, CheckCircle, LogOut,
    Edit3, Shield, Bell, Star, ChevronRight, GraduationCap,
    FileText, ClipboardList, Camera, Phone, Info, Key,
    Activity, Zap, Target, BarChart2, MessageSquare, X, Check
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import Layout from './Layout';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { logout } from '../utils/authUtils';

const API_URL = 'http://localhost:5000/api/auth';

/* ── Password strength helper ── */
const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { score, label: 'passwordStrengthWeak', color: 'bg-red-500' };
    if (score <= 2) return { score, label: 'passwordStrengthFair', color: 'bg-amber-500' };
    if (score <= 3) return { score, label: 'passwordStrengthGood', color: 'bg-yellow-400' };
    if (score <= 4) return { score, label: 'passwordStrengthStrong', color: 'bg-emerald-500' };
    return { score, label: 'passwordStrengthVeryStrong', color: 'bg-emerald-600' };
};

const ProfilePage = () => {
    const navigate = useNavigate();
    const { t, lang } = useLanguage();
    const [user, setUser] = useState(null);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [bio, setBio] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const [isEditing, setIsEditing] = useState(false);
    const [avatarColor, setAvatarColor] = useState(0);
    const [instructor, setInstructor] = useState(null);
    const [stats, setStats] = useState({
        practiceCount: 0, quizScore: 0, totalTime: '0h',
        streak: 0, assignmentsCompleted: 0, examsTaken: 0
    });

    const avatarGradients = [
        'from-blue-500 to-cyan-400',
        'from-violet-500 to-purple-400',
        'from-rose-500 to-pink-400',
        'from-emerald-500 to-teal-400',
        'from-amber-500 to-orange-400',
        'from-indigo-500 to-blue-400',
    ];

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const p = JSON.parse(userData);
            setUser(p);
            setFullName(p.fullName || '');
            setEmail(p.email || '');
            setPhone(p.phone || '');
            setBio(p.bio || '');
            // Pick a consistent color from username
            const idx = (p.username || '').charCodeAt(0) % avatarGradients.length;
            setAvatarColor(isNaN(idx) ? 0 : idx);
        }
        fetchUserStats();
        fetchInstructor();
    }, []);

    const fetchUserStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/profile/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) setStats(res.data);
        } catch {
            setStats({
                practiceCount: 0, quizScore: 0, totalTime: '0h',
                streak: 0, assignmentsCompleted: 0, examsTaken: 0
            });
        }
    };

    const fetchInstructor = async () => {
        try {
            const token = localStorage.getItem('token');
            // Lấy danh sách lớp học → lấy instructor từ lớp đầu tiên
            const res = await fetch('http://localhost:5000/api/student/classes?page=1&limit=1', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const firstClass = data.classes?.[0];
                if (firstClass?.instructorId) {
                    setInstructor(firstClass.instructorId);
                }
            }
        } catch { /* silent */ }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!fullName || !email) { toast.error(t('profilePage.fillAllFields')); return; }
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_URL}/profile`, { fullName, email, phone, bio }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setUser(res.data.user);
            setIsEditing(false);
            toast.success(t('profilePage.updateSuccess'));
        } catch (error) {
            toast.error(error.response?.data?.message || t('profilePage.updateFailed'));
        } finally { setIsLoading(false); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error(t('profilePage.fillAllFields')); return;
        }
        if (newPassword.length < 6) { toast.error(t('profilePage.newPasswordMinLength')); return; }
        if (newPassword !== confirmPassword) { toast.error(t('profilePage.passwordMismatch')); return; }
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/profile/password`, { currentPassword, newPassword }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(t('profilePage.passwordChangeSuccess'));
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            setActiveTab('info');
        } catch (error) {
            toast.error(error.response?.data?.message || t('profilePage.passwordChangeFailed'));
        } finally { setIsLoading(false); }
    };

    const handleLogout = () => {
        logout(navigate);
    };

    const pwStrength = getPasswordStrength(newPassword, lang);

    if (!user) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
    );

    const statItems = [
        { icon: BookOpen,    value: stats.practiceCount,        label: t('profilePage.statPractice'),      color: 'text-blue-600',    bg: 'bg-blue-50',    ring: 'ring-blue-200' },
        { icon: Trophy,      value: `${stats.quizScore}%`,      label: t('profilePage.statQuizScore'),     color: 'text-amber-600',   bg: 'bg-amber-50',   ring: 'ring-amber-200' },
        { icon: Clock,       value: stats.totalTime,            label: t('profilePage.statTotalTime'),     color: 'text-cyan-600',    bg: 'bg-cyan-50',    ring: 'ring-cyan-200' },
        { icon: Zap,         value: stats.streak,               label: t('profilePage.statStreak'),        color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
        { icon: CheckCircle, value: stats.assignmentsCompleted, label: t('profilePage.statAssignments'),   color: 'text-violet-600',  bg: 'bg-violet-50',  ring: 'ring-violet-200' },
        { icon: Award,       value: stats.examsTaken,           label: t('profilePage.statExams'),         color: 'text-rose-600',    bg: 'bg-rose-50',    ring: 'ring-rose-200' },
    ];

    const tabs = [
        { id: 'info',     icon: User,    label: t('profilePage.tabInfo') },
        { id: 'security', icon: Shield,  label: t('profilePage.tabSecurity') },
        { id: 'links',    icon: Zap,     label: t('profilePage.tabLinks') },
    ];

    const quickLinks = [
        { icon: BookOpen,     label: t('profilePage.linkClasses'),       path: '/my-classes',      color: 'text-violet-600', bg: 'bg-violet-50 hover:bg-violet-100', dot: 'bg-violet-500' },
        { icon: FileText,     label: t('profilePage.linkAssignments'),   path: '/my-assignments',  color: 'text-blue-600',   bg: 'bg-blue-50 hover:bg-blue-100',     dot: 'bg-blue-500' },
        { icon: ClipboardList,label: t('profilePage.linkExams'),         path: '/my-exams',        color: 'text-emerald-600',bg: 'bg-emerald-50 hover:bg-emerald-100',dot: 'bg-emerald-500' },
        { icon: Bell,         label: t('profilePage.linkNotifications'), path: '/notifications',   color: 'text-amber-600',  bg: 'bg-amber-50 hover:bg-amber-100',   dot: 'bg-amber-500' },
        { icon: MessageSquare,label: t('profilePage.linkFeedback'),      path: '/feedback',        color: 'text-rose-600',   bg: 'bg-rose-50 hover:bg-rose-100',     dot: 'bg-rose-500' },
    ];

    return (
        <Layout>
            <div className="relative">
                <main className="pb-16 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-5xl mx-auto space-y-6">

                    {/* ── Hero Banner ── */}
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/20">
                        {/* Banner bg */}
                        <div className="h-44 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 relative">
                            <div className="absolute inset-0" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.07) 1px,transparent 1px)',backgroundSize:'28px 28px'}} />
                            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-10 left-1/4 w-48 h-48 bg-cyan-300/20 rounded-full blur-2xl" />
                            {/* Floating dots */}
                            {[{t:'top-6 left-8',s:'w-3 h-3'},{t:'top-12 right-24',s:'w-2 h-2'},{t:'bottom-8 right-12',s:'w-4 h-4'},{t:'bottom-4 left-1/3',s:'w-2 h-2'}].map((d,i)=>(
                                <div key={i} className={`absolute ${d.t} ${d.s} bg-white/25 rounded-full animate-pulse`} style={{animationDelay:`${i*0.4}s`}} />
                            ))}
                        </div>

                        {/* Profile card overlapping banner */}
                        <div className="bg-white/95 backdrop-blur-xl px-6 sm:px-8 pt-0 pb-6">
                            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-14">
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <div className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${avatarGradients[avatarColor]} flex items-center justify-center text-5xl font-extrabold text-white shadow-2xl shadow-blue-500/30 ring-4 ring-white`}>
                                        {(user.fullName || user.username || 'U')[0].toUpperCase()}
                                    </div>
                                    <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-emerald-500 rounded-full border-[3px] border-white flex items-center justify-center shadow-md">
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                    </div>
                                </div>

                                {/* Name + meta */}
                                <div className="flex-1 text-center sm:text-left pb-1">
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                                        <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                                            {user.fullName || user.username}
                                        </h1>
                                        <span className={`px-3 py-0.5 text-xs font-bold rounded-full ${user.role==='instructor'?'bg-violet-100 text-violet-700':'bg-blue-100 text-blue-700'}`}>
                                            {user.role==='instructor' ? t('profilePage.roleInstructor') : t('profilePage.roleStudent')}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-slate-500">
                                        <span className="flex items-center gap-1.5"><Mail size={13}/>{user.email}</span>
                                        <span className="flex items-center gap-1.5"><Calendar size={13}/>{t('profilePage.joined')}: {new Date(user.createdAt||Date.now()).toLocaleDateString(lang==='vi'?'vi-VN':'en-US')}</span>
                                        {user.username && <span className="flex items-center gap-1.5"><User size={13}/>@{user.username}</span>}
                                    </div>
                                </div>

                                {/* Edit button */}
                                <button onClick={()=>{setIsEditing(!isEditing);setActiveTab('info');}}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${isEditing?'bg-red-50 text-red-600 hover:bg-red-100':'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60'}`}>
                                    {isEditing?<><X size={15}/>{t('common.cancel')}</>:<><Edit3 size={15}/>{t('profilePage.editProfile')}</>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Stats Row ── */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {statItems.map((s, i) => (
                            <div key={i} className={`bg-white/85 backdrop-blur-lg rounded-2xl p-3 sm:p-4 shadow-md border border-white/60 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ring-1 ${s.ring}`}>
                                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                                    <s.icon size={17} className={s.color} />
                                </div>
                                <div className="text-xl font-extrabold text-slate-800 leading-tight">{s.value}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── Tab Navigation ── */}
                    <div className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-md border border-white/60 overflow-hidden">
                        <div className="flex border-b border-slate-100">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all border-b-2 flex-1 justify-center ${activeTab===tab.id?'border-blue-500 text-blue-700 bg-blue-50/60':'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                                    <tab.icon size={15}/>{tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-6">

                            {/* ── TAB: THÔNG TIN ── */}
                            {activeTab === 'info' && (
                                <form onSubmit={handleUpdateProfile} className="space-y-5">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><User size={16} className="text-blue-500"/>{t('profilePage.personalInfo')}</h3>
                                        {!isEditing && (
                                            <button type="button" onClick={()=>setIsEditing(true)}
                                                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all">
                                                <Edit3 size={12}/>{t('profilePage.edit')}
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Họ tên */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('profilePage.fullName')} <span className="text-red-400">*</span></label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                                                <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} disabled={!isEditing}
                                                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all outline-none ${isEditing?'border-blue-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100':'border-slate-100 bg-slate-50 text-slate-600 cursor-default'}`}
                                                    placeholder={t('profilePage.enterFullName')} />
                                            </div>
                                        </div>
                                        {/* Email */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Email <span className="text-red-400">*</span></label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                                                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} disabled={!isEditing}
                                                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all outline-none ${isEditing?'border-blue-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100':'border-slate-100 bg-slate-50 text-slate-600 cursor-default'}`}
                                                    placeholder={t('profilePage.email')} />
                                            </div>
                                        </div>
                                        {/* Điện thoại */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('profilePage.phone')}</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                                                <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} disabled={!isEditing}
                                                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all outline-none ${isEditing?'border-blue-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100':'border-slate-100 bg-slate-50 text-slate-600 cursor-default'}`}
                                                    placeholder={t('profilePage.phonePlaceholder')} />
                                            </div>
                                        </div>
                                        {/* Username (readonly) */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('profilePage.username')}</label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                <input type="text" value={user.username} disabled
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 text-sm cursor-not-allowed" />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{t('profilePage.fixed')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('profilePage.bio')}</label>
                                        <textarea value={bio} onChange={e=>setBio(e.target.value)} disabled={!isEditing} rows={3}
                                            className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none resize-none ${isEditing?'border-blue-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100':'border-slate-100 bg-slate-50 text-slate-600 cursor-default'}`}
                                            placeholder={t('profilePage.bioPlaceholder')} />
                                        {isEditing && <p className="text-right text-[10px] text-slate-400">{bio.length}/300</p>}
                                    </div>

                                    {/* Giảng viên quản lý */}
                                    {user.role !== 'instructor' && (
                                        <div className="pt-1">
                                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">{t('profilePage.assignedInstructor')}</label>
                                            {instructor ? (
                                                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/60">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                                                        {(instructor.fullName || 'T')[0].toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-slate-800 text-sm">
                                                            {t('profilePage.instructorPrefix')}{instructor.fullName}
                                                        </p>
                                                        {instructor.email && (
                                                            <p className="text-xs text-slate-500 truncate">{instructor.email}</p>
                                                        )}
                                                    </div>
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full flex-shrink-0">
                                                        {t('profilePage.roleInstructor')}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                                    <GraduationCap size={18} className="text-slate-300 flex-shrink-0"/>
                                                    <p className="text-sm text-slate-400 italic">{t('profilePage.noInstructor')}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {isEditing && (
                                        <div className="flex gap-3 pt-1">
                                            <button type="submit" disabled={isLoading}
                                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50">
                                                {isLoading?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>{t('profilePage.saving')}</>:<><Save size={15}/>{t('profilePage.saveChanges')}</>}
                                            </button>
                                            <button type="button" onClick={()=>setIsEditing(false)}
                                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-all">
                                                {t('common.cancel')}
                                            </button>
                                        </div>
                                    )}
                                </form>
                            )}

                            {/* ── TAB: BẢO MẬT ── */}
                            {activeTab === 'security' && (
                                <div className="space-y-6">
                                    {/* Account type info */}
                                    <div className={`flex items-center gap-4 p-4 rounded-2xl border ${user.role==='instructor'?'bg-violet-50 border-violet-200':'bg-blue-50 border-blue-200'}`}>
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${user.role==='instructor'?'bg-violet-100':'bg-blue-100'}`}>
                                            {user.role==='instructor'?<GraduationCap size={24} className="text-violet-600"/>:<Star size={24} className="text-blue-600"/>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{user.role==='instructor' ? t('profilePage.roleInstructor') : t('profilePage.roleStudent')}</p>
                                            <p className="text-sm text-slate-500">{user.role==='instructor' ? t('profilePage.roleInstructorDesc') : t('profilePage.roleStudentDesc')}</p>
                                        </div>
                                        <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${user.role==='instructor'?'bg-violet-200 text-violet-700':'bg-blue-200 text-blue-700'}`}>
                                            {t('profilePage.active')}
                                        </div>
                                    </div>

                                    {/* Change password form */}
                                    <div>
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Shield size={16} className="text-amber-500"/>{t('profilePage.changePassword')}</h3>
                                        <form onSubmit={handleChangePassword} className="space-y-4">
                                            {/* Current password */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('profilePage.currentPassword')}</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input type={showCurrent?'text':'password'} value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)}
                                                        className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 text-sm outline-none transition-all"
                                                        placeholder={t('profilePage.enterCurrentPassword')} />
                                                    <button type="button" onClick={()=>setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                        {showCurrent?<EyeOff size={16}/>:<Eye size={16}/>}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* New password */}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('profilePage.newPassword')}</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <input type={showNew?'text':'password'} value={newPassword} onChange={e=>setNewPassword(e.target.value)}
                                                            className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 text-sm outline-none transition-all"
                                                            placeholder={t('profilePage.enterNewPassword')} />
                                                        <button type="button" onClick={()=>setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                            {showNew?<EyeOff size={16}/>:<Eye size={16}/>}
                                                        </button>
                                                    </div>
                                                    {/* Strength bar */}
                                                    {newPassword && (
                                                        <div className="space-y-1">
                                                            <div className="flex gap-1">
                                                                {[1,2,3,4,5].map(i=>(
                                                                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i<=pwStrength.score?pwStrength.color:'bg-slate-200'}`}/>
                                                                ))}
                                                            </div>
                                                            <p className={`text-[10px] font-semibold ${pwStrength.score<=1?'text-red-500':pwStrength.score<=2?'text-amber-500':pwStrength.score<=3?'text-yellow-500':'text-emerald-600'}`}>{t(`profilePage.${pwStrength.label}`)}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Confirm password */}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('profilePage.confirmNewPassword')}</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <input type={showConfirm?'text':'password'} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}
                                                            className={`w-full pl-10 pr-11 py-2.5 rounded-xl border text-sm outline-none transition-all bg-slate-50 focus:ring-2 ${confirmPassword&&newPassword===confirmPassword?'border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100':confirmPassword?'border-red-300 focus:border-red-400 focus:ring-red-100':'border-slate-200 focus:border-amber-400 focus:ring-amber-100'}`}
                                                            placeholder={t('profilePage.confirmNewPassword')} />
                                                        <button type="button" onClick={()=>setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                            {showConfirm?<EyeOff size={16}/>:<Eye size={16}/>}
                                                        </button>
                                                        {confirmPassword && (
                                                            <div className={`absolute right-9 top-1/2 -translate-y-1/2 ${newPassword===confirmPassword?'text-emerald-500':'text-red-400'}`}>
                                                                {newPassword===confirmPassword?<Check size={14}/>:<X size={14}/>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <button type="submit" disabled={isLoading}
                                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50">
                                                {isLoading?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>{t('profilePage.processing')}</>:<><Shield size={15}/>{t('profilePage.changePassword')}</>}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* ── TAB: TRUY CẬP NHANH ── */}
                            {activeTab === 'links' && (
                                <div className="space-y-3">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Zap size={16} className="text-amber-500"/>{t('profilePage.quickAccess')}</h3>
                                    {quickLinks.map((item, idx) => (
                                        <button key={idx} onClick={()=>navigate(item.path)}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl ${item.bg} transition-all duration-200 group border border-transparent hover:border-slate-200/60 hover:shadow-sm`}>
                                            <div className={`w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center ${item.color} flex-shrink-0`}>
                                                <item.icon size={20}/>
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="font-semibold text-slate-800 text-sm">{item.label}</p>
                                            </div>
                                            <div className={`w-2 h-2 rounded-full ${item.dot} opacity-60 group-hover:opacity-100 transition-opacity`}/>
                                            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform"/>
                                        </button>
                                    ))}

                                    {/* Logout */}
                                    <div className="pt-2 border-t border-slate-100">
                                        <button onClick={handleLogout}
                                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 hover:bg-red-100 transition-all duration-200 group border border-transparent hover:border-red-200/60">
                                            <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-red-500 flex-shrink-0">
                                                <LogOut size={20}/>
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="font-semibold text-red-600 text-sm">{t('profilePage.logoutConfirm')}</p>
                                                <p className="text-xs text-red-400">{t('profilePage.logoutConfirmDesc')}</p>
                                            </div>
                                            <ChevronRight size={16} className="text-red-300 group-hover:translate-x-1 transition-transform"/>
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>{/* end tab content */}
                    </div>{/* end tab card */}

                </div>{/* end max-w */}
                </main>
            </div>
        </Layout>
    );
};

export default ProfilePage;
