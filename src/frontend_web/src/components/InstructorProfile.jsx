import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import InstructorLayout from './InstructorLayout';
import {
    User, Mail, Lock, Camera, Save, Eye, EyeOff,
    GraduationCap, CheckCircle, AlertCircle, RefreshCw, Trash2,
    Users, FileText, BookOpen, ClipboardList, Target, Shield,
    Calendar, AtSign
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = 'http://localhost:5000/api/auth';
const INSTRUCTOR_API = 'http://localhost:5000/api/instructor';

const InstructorProfile = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('info');
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);

    const [profile, setProfile]             = useState(null);
    const [fullName, setFullName]           = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');
    const [avatarBase64, setAvatarBase64]   = useState('');

    const [currentPwd, setCurrentPwd]   = useState('');
    const [newPwd, setNewPwd]           = useState('');
    const [confirmPwd, setConfirmPwd]   = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew]         = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [stats, setStats] = useState(null);
    const fileRef = useRef();

    const getHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/me`, getHeaders());
            const u = res.data.user;
            setProfile(u);
            setFullName(u.fullName || '');
            setAvatarPreview(u.avatar || '');
            localStorage.setItem('user', JSON.stringify(u));
        } catch {
            toast.error('Không thể tải thông tin tài khoản!');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(INSTRUCTOR_API, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats || {});
            }
        } catch { /* silent */ }
    };

    useEffect(() => { fetchProfile(); fetchStats(); }, []);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh không được vượt quá 5MB!'); return; }
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            const MAX = 400;
            let { width, height } = img;
            if (width > MAX || height > MAX) {
                if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
                else { width = Math.round(width * MAX / height); height = MAX; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            setAvatarBase64(canvas.toDataURL('image/jpeg', 0.8));
            setAvatarPreview(canvas.toDataURL('image/jpeg', 0.8));
            URL.revokeObjectURL(objectUrl);
        };
        img.src = objectUrl;
    };

    const handleRemoveAvatar = () => { setAvatarBase64('remove'); setAvatarPreview(''); };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!fullName.trim() || fullName.trim().length < 2) { toast.error('Họ tên phải có ít nhất 2 ký tự!'); return; }
        setSaving(true);
        try {
            const payload = { fullName: fullName.trim() };
            if (avatarBase64 === 'remove') payload.avatar = '';
            else if (avatarBase64) payload.avatar = avatarBase64;
            const res = await axios.put(`${API}/profile`, payload, getHeaders());
            setProfile(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setAvatarBase64('');
            window.dispatchEvent(new Event('instructor-profile-updated'));
            toast.success('Cập nhật thông tin thành công!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Cập nhật thất bại!');
        } finally { setSaving(false); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!currentPwd || !newPwd || !confirmPwd) { toast.error('Vui lòng điền đầy đủ thông tin!'); return; }
        if (newPwd.length < 6) { toast.error('Mật khẩu mới phải có ít nhất 6 ký tự!'); return; }
        if (newPwd !== confirmPwd) { toast.error('Xác nhận mật khẩu không khớp!'); return; }
        setSaving(true);
        try {
            await axios.put(`${API}/profile/password`,
                { currentPassword: currentPwd, newPassword: newPwd, confirmPassword: confirmPwd },
                getHeaders()
            );
            toast.success('Đổi mật khẩu thành công!');
            setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
            setActiveTab('info');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại!');
        } finally { setSaving(false); }
    };

    const initials = (name) => (name || 'I').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    if (loading) return (
        <InstructorLayout>
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="relative w-14 h-14">
                    <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                    <div className="absolute inset-2 border-4 border-cyan-100 border-b-cyan-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                </div>
            </div>
        </InstructorLayout>
    );

    const s = stats || {};
    const statCards = [
        { icon: Users,        value: s.totalStudents   || 0,  label: 'Học viên',      gradient: 'from-blue-500 to-indigo-600',   light: 'bg-blue-50',    iconC: 'text-blue-600',    shadow: 'shadow-blue-500/20'   },
        { icon: GraduationCap,value: s.totalClasses    || 0,  label: 'Lớp học',       gradient: 'from-cyan-500 to-sky-600',      light: 'bg-cyan-50',    iconC: 'text-cyan-600',    shadow: 'shadow-cyan-500/20'   },
        { icon: FileText,     value: s.totalAssignments|| 0,  label: 'Bài tập',       gradient: 'from-violet-500 to-purple-600', light: 'bg-violet-50',  iconC: 'text-violet-600',  shadow: 'shadow-violet-500/20' },
        { icon: BookOpen,     value: s.totalExams      || 0,  label: 'Kiểm tra',      gradient: 'from-emerald-500 to-teal-600',  light: 'bg-emerald-50', iconC: 'text-emerald-600', shadow: 'shadow-emerald-500/20'},
        { icon: ClipboardList,value: s.completedSubmissions||0,label: 'Đã nộp',       gradient: 'from-rose-500 to-pink-600',     light: 'bg-rose-50',    iconC: 'text-rose-600',    shadow: 'shadow-rose-500/20'   },
        { icon: Target,       value: s.averageScore ? parseFloat(s.averageScore).toFixed(1) : '—', label: 'Điểm TB', gradient: 'from-amber-500 to-orange-600', light: 'bg-amber-50', iconC: 'text-amber-600', shadow: 'shadow-amber-500/20' },
    ];

    return (
        <InstructorLayout>
            <div className="min-h-screen bg-gradient-to-br from-blue-100 via-sky-50 to-cyan-100 -m-3 lg:-m-4 p-3 lg:p-6">
            <div className="max-w-6xl mx-auto space-y-5">

                {/* ══ HERO BANNER ══ */}
                <div className="relative rounded-2xl overflow-hidden shadow-xl">
                    {/* Dark gradient banner */}
                    <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 px-6 pt-6 pb-16 relative">
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59,130,246,0.25) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.2) 0%, transparent 40%)' }} />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]" />
                        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-cyan-400/15 rounded-full blur-[50px]" />
                        {[['top-4 left-10','w-2 h-2'],['top-8 right-24','w-1.5 h-1.5'],['bottom-6 right-12','w-3 h-3']].map(([pos, size], i) => (
                            <div key={i} className={`absolute ${pos} ${size} bg-white/20 rounded-full animate-pulse`} style={{ animationDelay: `${i * 0.4}s` }} />
                        ))}
                        {/* Refresh */}
                        <button onClick={() => { fetchProfile(); fetchStats(); }}
                            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg text-xs font-semibold border border-white/20 transition-all">
                            <RefreshCw size={13} /> Làm mới
                        </button>
                    </div>

                    {/* White card: avatar overlaps the banner */}
                    <div className="bg-white px-6 pt-0 pb-6">
                        {/* Avatar row — pulled up into the banner */}
                        <div className="flex items-end gap-4 -mt-10 mb-4">
                            <div className="relative group flex-shrink-0">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center"
                                    style={{ boxShadow: '0 8px 24px rgba(59,130,246,0.4)' }}>
                                    {avatarPreview
                                        ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                        : <span className="text-white font-black text-2xl">{initials(profile?.fullName)}</span>}
                                </div>
                                <button onClick={() => fileRef.current?.click()}
                                    className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Camera size={18} className="text-white" />
                                </button>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow" />
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            </div>
                            {/* Badges float to the right of avatar, vertically centered to card bottom */}
                            <div className="flex items-center gap-2 pb-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                    <GraduationCap size={11} /> Giảng viên
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${profile?.isActive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-600 border border-red-200'}`}>
                                    {profile?.isActive ? <><CheckCircle size={10} /> Hoạt động</> : <><AlertCircle size={10} /> Bị khóa</>}
                                </span>
                            </div>
                        </div>

                        {/* Name + meta below */}
                        <h1 className="text-xl font-extrabold text-slate-800 mb-1">{profile?.fullName || profile?.username}</h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5"><Mail size={13} />{profile?.email}</span>
                            <span className="flex items-center gap-1.5"><AtSign size={13} />@{profile?.username}</span>
                            <span className="flex items-center gap-1.5"><Calendar size={13} />Tham gia: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : '—'}</span>
                        </div>
                    </div>
                </div>

                {/* ══ STATS GRID ══ */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {statCards.map((sc, i) => (
                        <div key={i} className={`group relative bg-gradient-to-br ${sc.gradient} rounded-2xl p-4 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden`}>
                            {/* shine overlay */}
                            <div className="absolute inset-0 bg-white/10 rounded-2xl" />
                            <div className="absolute -right-2 -bottom-2 w-14 h-14 rounded-full bg-white/10" />
                            <div className="relative">
                                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                                    <sc.icon size={17} className="text-white" />
                                </div>
                                <div className="text-2xl font-black text-white leading-none">{sc.value}</div>
                                <div className="text-[11px] text-white/80 mt-1 font-medium">{sc.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ══ TABS ══ */}
                <div className="flex gap-1.5 bg-slate-100/80 p-1 rounded-xl w-fit">
                    {[
                        { id: 'info',     icon: User,   label: 'Thông tin cá nhân' },
                        { id: 'password', icon: Shield, label: 'Đổi mật khẩu'      },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                activeTab === tab.id
                                    ? 'bg-white text-blue-700 shadow-sm border border-blue-100/60'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}>
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* ══ TAB: THÔNG TIN ══ */}
                {activeTab === 'info' && (
                    <form onSubmit={handleSaveProfile} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
                        {/* Form header stripe */}
                        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-500" />
                        <div className="p-6 space-y-5">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <User size={14} className="text-blue-600" />
                                </div>
                                Chỉnh sửa thông tin
                            </h3>

                            {/* Avatar section */}
                            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-300 bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
                                    {avatarPreview
                                        ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                        : <span className="text-white font-black text-xl">{initials(fullName || profile?.fullName)}</span>}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-700 mb-2">Ảnh đại diện</p>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => fileRef.current?.click()}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/30">
                                            <Camera size={12} /> Chọn ảnh
                                        </button>
                                        {avatarPreview && (
                                            <button type="button" onClick={handleRemoveAvatar}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 border border-red-200 transition-all">
                                                <Trash2 size={12} /> Xóa ảnh
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1.5">JPG, PNG — tối đa 5MB</p>
                                </div>
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            </div>

                            {/* Họ tên */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                                        placeholder="Nhập họ và tên..." maxLength={100}
                                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-slate-50 focus:bg-white transition-all" />
                                </div>
                            </div>

                            {/* Email & Username (readonly) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input type="text" value={profile?.email || ''} readOnly
                                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-500 cursor-not-allowed" />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Không thể thay đổi email</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên đăng nhập</label>
                                    <div className="relative">
                                        <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input type="text" value={profile?.username || ''} readOnly
                                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-500 cursor-not-allowed" />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Không thể thay đổi username</p>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end pt-1 border-t border-slate-100">
                                <button type="submit" disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0">
                                    {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
                                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* ══ TAB: ĐỔI MẬT KHẨU ══ */}
                {activeTab === 'password' && (
                    <form onSubmit={handleChangePassword} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500" />
                        <div className="p-6 space-y-5">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <Shield size={14} className="text-amber-600" />
                                </div>
                                Thay đổi mật khẩu
                            </h3>

                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-medium flex items-start gap-2">
                                <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-amber-500" />
                                Mật khẩu mới phải có ít nhất 6 ký tự. Sau khi đổi, bạn sẽ cần đăng nhập lại ở các thiết bị khác.
                            </div>

                            {/* Current password */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu hiện tại <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type={showCurrent ? 'text' : 'password'} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
                                        placeholder="Nhập mật khẩu hiện tại..."
                                        className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-slate-50 focus:bg-white transition-all" />
                                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* New + Confirm grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu mới <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type={showNew ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)}
                                            placeholder="Ít nhất 6 ký tự..."
                                            className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-slate-50 focus:bg-white transition-all" />
                                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {newPwd && (
                                        <div className="mt-2 flex gap-1">
                                            {[...Array(4)].map((_, i) => (
                                                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
                                                    newPwd.length >= (i + 1) * 3
                                                        ? i < 1 ? 'bg-red-400' : i < 2 ? 'bg-amber-400' : i < 3 ? 'bg-emerald-400' : 'bg-emerald-500'
                                                        : 'bg-slate-200'
                                                }`} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type={showConfirm ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                                            placeholder="Nhập lại mật khẩu mới..."
                                            className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 bg-slate-50 focus:bg-white transition-all ${
                                                confirmPwd && newPwd !== confirmPwd ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-400'
                                            }`} />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {confirmPwd && newPwd !== confirmPwd && (
                                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={11} /> Mật khẩu không khớp</p>
                                    )}
                                    {confirmPwd && newPwd === confirmPwd && (
                                        <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><CheckCircle size={11} /> Mật khẩu khớp</p>
                                    )}
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end pt-1 border-t border-slate-100">
                                <button type="submit" disabled={saving || Boolean(confirmPwd && newPwd !== confirmPwd)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0">
                                    {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Shield size={15} />}
                                    {saving ? 'Đang lưu...' : 'Đổi mật khẩu'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}

            </div>
            </div>
        </InstructorLayout>
    );
};

export default InstructorProfile;
