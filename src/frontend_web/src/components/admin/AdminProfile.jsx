import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import {
    User, Mail, Lock, Camera, Save, Eye, EyeOff,
    Shield, CheckCircle, AlertCircle, RefreshCw, Trash2,
    Users, GraduationCap, Activity, UserCheck, Calendar, AtSign,
    TrendingUp, Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const API       = 'http://localhost:5000/api/auth';
const ADMIN_API = 'http://localhost:5000/api/admin';

const AdminProfile = () => {
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

    const [sysStats, setSysStats] = useState(null);
    const fileRef = useRef();

    const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/me`, getHeaders());
            const u = res.data.user;
            setProfile(u); setFullName(u.fullName || ''); setAvatarPreview(u.avatar || '');
            localStorage.setItem('user', JSON.stringify(u));
        } catch { toast.error('Không thể tải thông tin tài khoản!'); }
        finally { setLoading(false); }
    };

    const fetchSysStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${ADMIN_API}/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data) setSysStats(res.data.userStats || {});
        } catch { /* silent */ }
    };

    useEffect(() => { fetchProfile(); fetchSysStats(); }, []);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh không được vượt quá 5MB!'); return; }
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            const MAX = 400; let { width, height } = img;
            if (width > MAX || height > MAX) {
                if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
                else { width = Math.round(width * MAX / height); height = MAX; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            const b64 = canvas.toDataURL('image/jpeg', 0.8);
            setAvatarBase64(b64); setAvatarPreview(b64); URL.revokeObjectURL(objectUrl);
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
            setProfile(res.data.user); localStorage.setItem('user', JSON.stringify(res.data.user));
            setAvatarBase64(''); window.dispatchEvent(new Event('admin-profile-updated'));
            toast.success('Cập nhật thông tin thành công!');
        } catch (err) { toast.error(err.response?.data?.message || 'Cập nhật thất bại!'); }
        finally { setSaving(false); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!currentPwd || !newPwd || !confirmPwd) { toast.error('Vui lòng điền đầy đủ thông tin!'); return; }
        if (newPwd.length < 6) { toast.error('Mật khẩu mới phải có ít nhất 6 ký tự!'); return; }
        if (newPwd !== confirmPwd) { toast.error('Xác nhận mật khẩu không khớp!'); return; }
        setSaving(true);
        try {
            await axios.put(`${API}/profile/password`,
                { currentPassword: currentPwd, newPassword: newPwd, confirmPassword: confirmPwd }, getHeaders());
            toast.success('Đổi mật khẩu thành công!');
            setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); setActiveTab('info');
        } catch (err) { toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại!'); }
        finally { setSaving(false); }
    };

    const initials = (name) => (name || 'A').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const roleLabel = { user: 'Học viên', instructor: 'Giảng viên', admin: 'Quản trị viên', superadmin: 'Super Admin' };

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="relative w-14 h-14">
                    <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                    <div className="absolute inset-2 border-4 border-sky-100 border-b-sky-500 rounded-full animate-spin"
                        style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                </div>
            </div>
        </AdminLayout>
    );

    const ss = sysStats || {};
    const statCards = [
        { icon: Users,        value: ss.totalStudents    ?? '—', label: 'Học viên',      gradient: 'from-blue-500 to-blue-700',    shadow: 'shadow-blue-500/30'    },
        { icon: GraduationCap,value: ss.totalInstructors ?? '—', label: 'Giảng viên',    gradient: 'from-sky-500 to-cyan-600',     shadow: 'shadow-sky-500/30'     },
        { icon: UserCheck,    value: ss.activeAccounts   ?? '—', label: 'Hoạt động',     gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/30' },
        { icon: AlertCircle,  value: ss.lockedAccounts   ?? '—', label: 'Bị khóa',       gradient: 'from-rose-500 to-red-600',     shadow: 'shadow-rose-500/30'    },
        { icon: Activity,     value: ss.newThisMonth     ?? '—', label: 'Mới tháng này', gradient: 'from-indigo-500 to-blue-600',  shadow: 'shadow-indigo-500/30'  },
        { icon: TrendingUp,   value: ss.totalAccounts    ?? '—', label: 'Tổng tài khoản',gradient: 'from-slate-600 to-slate-800',  shadow: 'shadow-slate-500/30'   },
    ];

    return (
        <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-100 via-sky-50 to-cyan-100 -m-3 lg:-m-4 p-3 lg:p-6">
        <div className="max-w-6xl mx-auto space-y-5">

            {/* ══ HERO BANNER — avatar + info TRONG banner ══ */}
            <div className="rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-sky-950 relative">
                    {/* Background effects */}
                    <div className="absolute inset-0"
                        style={{ backgroundImage: 'radial-gradient(circle at 8% 60%, rgba(37,99,235,0.45) 0%, transparent 55%), radial-gradient(circle at 92% 10%, rgba(14,165,233,0.3) 0%, transparent 48%), radial-gradient(circle at 55% 95%, rgba(99,102,241,0.15) 0%, transparent 40%)' }} />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
                    <div className="absolute -bottom-10 left-0 w-72 h-72 bg-sky-500/10 rounded-full blur-[80px]" />
                    {/* Grid */}
                    <div className="absolute inset-0 opacity-[0.07]"
                        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
                    {/* Dots */}
                    {[['6 left-24','1.5 h-1.5'],['10 right-36','2 h-2'],['16 right-14','1.5 h-1.5'],['4 right-56','1 h-1']].map(([pos, size], i) => (
                        <div key={i} className={`absolute top-${pos} w-${size} bg-white/20 rounded-full animate-pulse`}
                            style={{ animationDelay: `${i * 0.3}s` }} />
                    ))}

                    {/* ── Content ── */}
                    <div className="relative z-10 px-6 pt-6 pb-5">
                        {/* Top row: avatar + info + refresh */}
                        <div className="flex items-start gap-5">
                            {/* Avatar with glow */}
                            <div className="relative group flex-shrink-0">
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 to-sky-300 blur-[12px] opacity-50" />
                                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/25 shadow-2xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center">
                                    {avatarPreview
                                        ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                        : <span className="text-white font-black text-2xl">{initials(profile?.fullName)}</span>}
                                </div>
                                <button onClick={() => fileRef.current?.click()}
                                    className="absolute inset-0 rounded-2xl bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Camera size={18} className="text-white" />
                                </button>
                                {/* Online ping */}
                                <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50"></span>
                                    <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-slate-900"></span>
                                </span>
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 pt-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
                                        {profile?.fullName || profile?.username}
                                    </h1>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/25 text-blue-200 border border-blue-400/35">
                                        <Shield size={9} /> {roleLabel[profile?.role] || profile?.role}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${profile?.isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/35' : 'bg-red-500/20 text-red-300 border-red-400/35'}`}>
                                        {profile?.isActive ? <><CheckCircle size={9} /> Hoạt động</> : <><AlertCircle size={9} /> Bị khóa</>}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                    <span className="flex items-center gap-1.5 text-[13px] text-blue-200/75"><Mail size={11} />{profile?.email}</span>
                                    <span className="flex items-center gap-1.5 text-[13px] text-blue-200/75"><AtSign size={11} />@{profile?.username}</span>
                                    <span className="flex items-center gap-1.5 text-[13px] text-blue-200/75"><Calendar size={11} />{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : '—'}</span>
                                </div>
                            </div>

                            {/* Refresh */}
                            <button onClick={() => { fetchProfile(); fetchSysStats(); }}
                                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/15 transition-all hover:-translate-y-0.5 backdrop-blur-sm">
                                <RefreshCw size={12} /> Làm mới
                            </button>
                        </div>

                        {/* Bottom strip — meta pills */}
                        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-white/10">
                            {[
                                { label: 'Username', value: profile?.username },
                                { label: 'Ngày tạo', value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : '—' },
                                { label: 'Cập nhật', value: profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString('vi-VN') : '—' },
                                { label: 'Quyền hạn', value: 'Toàn quyền hệ thống' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.07] backdrop-blur-sm">
                                    <span className="text-[10px] text-blue-300/60 font-medium">{item.label}:</span>
                                    <span className="text-[11px] text-white font-semibold">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ SYSTEM STATS ══ */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {statCards.map((sc, i) => (
                    <div key={i} className={`relative bg-gradient-to-br ${sc.gradient} rounded-2xl p-4 shadow-lg ${sc.shadow} hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden cursor-default`}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent rounded-2xl" />
                        <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-white/10" />
                        <div className="absolute right-2 top-2 w-6 h-6 rounded-full bg-white/10" />
                        <div className="relative">
                            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                                <sc.icon size={15} className="text-white" />
                            </div>
                            <div className="text-2xl font-black text-white leading-none">{sc.value}</div>
                            <div className="text-[10px] text-white/75 mt-1 font-semibold tracking-wide uppercase">{sc.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ══ TABS ══ */}
            <div className="flex gap-1.5 bg-white/70 backdrop-blur-sm p-1 rounded-xl w-fit border border-blue-100/80 shadow-sm">
                {[
                    { id: 'info',     icon: User,   label: 'Thông tin cá nhân' },
                    { id: 'password', icon: Shield, label: 'Đổi mật khẩu'      },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            activeTab === tab.id
                                ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/30 scale-[1.02]'
                                : 'text-slate-500 hover:text-blue-700 hover:bg-white/80'
                        }`}>
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* ══ TAB: THÔNG TIN ══ */}
            {activeTab === 'info' && (
                <form onSubmit={handleSaveProfile} className="bg-white/85 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-md overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-400" />
                    <div className="p-6 space-y-5">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center shadow-sm shadow-blue-500/30">
                                <User size={15} className="text-white" />
                            </div>
                            Chỉnh sửa thông tin
                        </h3>

                        {/* Avatar upload */}
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-sky-50/80 rounded-xl border border-blue-100">
                            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-300 bg-gradient-to-br from-blue-600 to-sky-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                                {avatarPreview
                                    ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                    : <span className="text-white font-black text-xl">{initials(fullName || profile?.fullName)}</span>}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-700 mb-2">Ảnh đại diện</p>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => fileRef.current?.click()}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-lg text-xs font-semibold hover:shadow-md hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all">
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

                        {/* Email & Username readonly */}
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

                        <div className="flex justify-end pt-2 border-t border-slate-100">
                            <button type="submit" disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0">
                                {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
                                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* ══ TAB: ĐỔI MẬT KHẨU ══ */}
            {activeTab === 'password' && (
                <form onSubmit={handleChangePassword} className="bg-white/85 backdrop-blur-sm rounded-2xl border border-amber-100 shadow-md overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500" />
                    <div className="p-6 space-y-5">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-sm shadow-amber-500/30">
                                <Shield size={15} className="text-white" />
                            </div>
                            Thay đổi mật khẩu
                        </h3>

                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-medium flex items-start gap-2">
                            <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-amber-500" />
                            Mật khẩu mới phải có ít nhất 6 ký tự. Sau khi đổi, bạn sẽ cần đăng nhập lại ở các thiết bị khác.
                        </div>

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
                                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${newPwd.length >= (i+1)*3 ? i<1?'bg-red-400':i<2?'bg-amber-400':i<3?'bg-emerald-400':'bg-emerald-500' : 'bg-slate-200'}`} />
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
                                        className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 bg-slate-50 focus:bg-white transition-all ${confirmPwd && newPwd !== confirmPwd ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-400'}`} />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {confirmPwd && newPwd !== confirmPwd && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={11} /> Mật khẩu không khớp</p>}
                                {confirmPwd && newPwd === confirmPwd && <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><CheckCircle size={11} /> Mật khẩu khớp</p>}
                            </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-100">
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
        </AdminLayout>
    );
};

export default AdminProfile;
