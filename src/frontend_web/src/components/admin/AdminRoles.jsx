import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import PaginationBar from './PaginationBar';
import {
    Key, Users, Shield, CheckCircle, XCircle,
    ToggleLeft, ToggleRight, RefreshCw, Search, UserCheck,
    RotateCcw, Save, Filter, Crown, GraduationCap,
    AlertCircle, Pencil, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = 'http://localhost:5000/api/admin/roles';

const getPermissionLabel = (t) => ({
    view_dashboard:     t('admin.auto.k_menu_dashboard', 'View Dashboard'),
    manage_students:    t('admin.auto.k_6241294a',       'Student management'),
    view_students:      t('admin.auto.k_05200024',       'View students'),
    create_assignment:  t('admin.auto.k_b089fc81',       'Create assignments'),
    view_assignments:   t('admin.auto.k_f0bd9b64',       'View assignments'),
    grade_assignments:  t('admin.auto.k_cbcdf6a3',       'Grade'),
    create_exam:        t('admin.auto.k_6d76ae83',       'Create exams'),
    view_reports:       t('admin.auto.k_7eb398ce',       'View reports'),
    export_reports:     t('admin.auto.k_a9ea9ac2',       'Export reports'),
    send_notifications: t('admin.auto.k_a9c813f4',       'Send notifications'),
    manage_users:       t('admin.auto.k_7a37fc86',       'User management'),
    manage_system:      t('admin.auto.k_02a453d9',       'System management')
});

const getRoleConfig = (t) => ({
    user:       { label: t('admin.auto.k_1b83df7a'),  desc: t('admin.auto.k_roleStudentDesc'),  color: 'blue',    bg: 'bg-blue-50',    text: 'text-blue-700',    badge: 'bg-blue-100 text-blue-700',    icon: GraduationCap },
    instructor: { label: t('admin.auto.k_6e4e1637'),  desc: t('admin.auto.k_roleInstructorDesc'), color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', icon: UserCheck },
    admin:      { label: t('admin.auto.k_08cd66cb'),  desc: t('admin.auto.k_roleAdminDesc'),    color: 'violet',  bg: 'bg-violet-50',  text: 'text-violet-700',  badge: 'bg-violet-100 text-violet-700',  icon: Crown }
});

const ROLE_GRADIENT = {
    user:       'from-blue-500 to-cyan-500',
    instructor: 'from-emerald-500 to-teal-500',
    admin:      'from-violet-500 to-purple-500'
};

// ─────────────────────────────────────────────
// Sub-component: Avatar placeholder
// ─────────────────────────────────────────────
const UserAvatar = ({ user, size = 'md' }) => {
    const { t } = useLanguage();
    const sizeClass = size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-xs';
    const ROLE_CONFIG = getRoleConfig(t);
    const cfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.user;
    const initials = user.fullName?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || '?';
    if (user.avatar) return <img src={user.avatar} alt={user.fullName} className={`${sizeClass} rounded-full object-cover flex-shrink-0`} />;
    return (
        <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
            {initials}
        </div>
    );
};

// ─────────────────────────────────────────────
// Modal: Sửa quyền users dùng
// ─────────────────────────────────────────────
const EditPermModal = ({ user, allPermissions, onClose, onSaved, headers }) => {
    const { t } = useLanguage();
    const ROLE_CONFIG = getRoleConfig(t);
    const PERMISSION_LABEL = getPermissionLabel(t);
    const [editPerms, setEditPerms] = useState([...user.permissions]);
    const [editRole, setEditRole] = useState(user.role);
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const toggle = (perm) => {
        setEditPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
        setIsDirty(true);
    };

    const handleChangeRole = async (newRole) => {
        if (newRole === editRole) return;
        if (!window.confirm(`${t('admin.auto.k_change_role_confirm', 'Change role')} ${user.fullName} → ${ROLE_CONFIG[newRole]?.label}?`)) return;
        try {
            const res = await axios.put(`${API}/assign`, { userId: user._id, newRole }, { headers });
            toast.success(res.data.message);
            setEditRole(newRole);
            onSaved({ ...user, role: newRole, permissions: editPerms });
        } catch (err) { toast.error(err.response?.data?.message || t('admin.auto.k_33a5e01f', 'Thao tác thất bại!')); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await axios.put(`${API}/users/${user._id}/permissions`, { permissions: editPerms }, { headers });
            toast.success(res.data.message);
            onSaved({ ...user, role: editRole, permissions: res.data.permissions, hasCustomPermissions: true });
            setIsDirty(false);
        } catch (err) { toast.error(err.response?.data?.message || t('admin.auto.k_23f5a434', 'Lưu thất bại!')); }
        finally { setSaving(false); }
    };

    const handleReset = async () => {
        if (!window.confirm(t('admin.auto.k_e2fa933c', 'Reset quyền về mặc định của vai trò?'))) return;
        setSaving(true);
        try {
            const res = await axios.delete(`${API}/users/${user._id}/permissions`, { headers });
            toast.success(res.data.message);
            setEditPerms([...res.data.permissions]);
            onSaved({ ...user, role: editRole, permissions: res.data.permissions, hasCustomPermissions: false });
            setIsDirty(false);
        } catch (err) { toast.error(err.response?.data?.message || t('admin.auto.k_7a104fa6', 'Reset thất bại!')); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className={`p-5 bg-gradient-to-r ${ROLE_GRADIENT[editRole]} text-white flex-shrink-0`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 bg-white/20 border border-white/30 overflow-hidden">
                                {user.avatar
                                    ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                    : user.fullName?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()
                                }
                            </div>
                            <div>
                                <h3 className="font-black text-lg leading-tight">{user.fullName}</h3>
                                <p className="text-white/75 text-xs">{user.email}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="p-5 overflow-y-auto space-y-5">
                    {/* Vai trò */}
                    {user.role !== 'admin' ? (
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"> {t('admin.auto.k_66ab1dca', t('admin.auto.k_66ab1dca', 'Vai trò'))} </p>
                            <div className="flex gap-2">
                                {['user', 'instructor'].map(r => {
                                    const rc = ROLE_CONFIG[r];
                                    const isActive = editRole === r;
                                    return (
                                        <button key={r} onClick={() => handleChangeRole(r)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${isActive ? `${rc.bg} ${rc.text} border-current shadow-sm` : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                                            <rc.icon size={14} />{rc.label}
                                            {isActive && <CheckCircle size={12} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 bg-violet-50 rounded-xl text-sm font-semibold text-violet-700 flex items-center gap-2">
                            <Crown size={14} /> {t('admin.auto.k_6952ddaa', t('admin.auto.k_6952ddaa', 'Admin có toàn bộ quyền — không thể thay đổi'))} </div>
                    )}

                    {/* Quyền */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {t('admin.auto.k_permissions_count', 'Permissions')} — {editPerms.length}/{allPermissions.length} {t('admin.auto.k_enabled_label', 'enabled')}
                            </p>
                            {user.role !== 'admin' && (
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditPerms([...allPermissions]); setIsDirty(true); }}
                                        className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-semibold transition-all"> {t('admin.auto.k_2969f7d5', t('admin.auto.k_2969f7d5', 'Chọn tất cả'))} </button>
                                    <button onClick={() => { setEditPerms([]); setIsDirty(true); }}
                                        className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-semibold transition-all"> {t('admin.auto.k_17376a91', t('admin.auto.k_17376a91', 'Bỏ tất cả'))} </button>
                                </div>
                            )}
                        </div>
                        {isDirty && (
                            <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center gap-2">
                                <AlertCircle size={12} /> {t('admin.auto.k_b9a727a6', t('admin.auto.k_b9a727a6', 'Có thay đổi chưa lưu'))} </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            {allPermissions.map(perm => {
                                const has = user.role === 'admin' || editPerms.includes(perm);
                                return (
                                    <button key={perm} disabled={user.role === 'admin'} onClick={() => toggle(perm)}
                                        className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium text-left transition-all border ${has ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'} ${user.role === 'admin' ? 'cursor-default' : 'cursor-pointer'}`}>
                                        {has ? <CheckCircle size={13} className="text-green-500 flex-shrink-0" /> : <XCircle size={13} className="text-slate-300 flex-shrink-0" />}
                                        <span>{PERMISSION_LABEL[perm] || perm}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                {user.role !== 'admin' && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0 bg-slate-50/60">
                        <button onClick={handleReset} disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-all disabled:opacity-50">
                            <RotateCcw size={13} /> {t('admin.auto.k_975ff021', t('admin.auto.k_975ff021', 'Reset mặc định'))} </button>
                        <div className="flex gap-2">
                            <button onClick={onClose} className="px-4 py-2 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-all"> {t('admin.auto.k_f63d1e47', t('admin.auto.k_f63d1e47', 'Đóng'))} </button>
                            <button onClick={handleSave} disabled={saving || !isDirty}
                                className="flex items-center gap-1.5 px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-all disabled:opacity-50 shadow-sm">
                                <Save size={13} />{saving ? t('admin.auto.k_4d30b6f8', 'Đang lưu...') : t('admin.auto.k_ecf0a713', 'Lưu quyền')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const AdminRoles = () => {
    const { t, lang } = useLanguage();
    const [roles, setRoles] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('roles');

    // Manage Users tab state
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [searchQ, setSearchQ] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [modalUser, setModalUser] = useState(null);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    // Roles tab state
    const [roleActiveState, setRoleActiveState] = useState({});
    const [permOverrides, setPermOverrides] = useState({});

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    // ── Fetch roles overview ──
    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await axios.get(API, { headers });
            const rolesData = res.data.roles || [];
            setRoles(rolesData);
            setAllPermissions(res.data.allPermissions || []);
            const activeInit = {};
            rolesData.forEach(r => { activeInit[r.key] = r.isActive !== false; });
            setRoleActiveState(activeInit);
        } catch { toast.error(t('admin.auto.k_c3650b4d', 'Không thể tải dữ liệu phân quyền!')); }
        finally { setLoading(false); }
    };

    // ── Fetch users list ──
    const fetchUsers = useCallback(async () => {
        setUsersLoading(true);
        try {
            const params = {};
            if (searchQ.trim()) params.search = searchQ.trim();
            if (filterRole) params.role = filterRole;
            const res = await axios.get(`${API}/users/all`, { headers, params });
            setUsers(res.data.users || []);
        } catch { toast.error(t('admin.auto.k_87b36ab4', 'Không thể tải danh sách users dùng!')); }
        finally { setUsersLoading(false); }
    }, [searchQ, filterRole]);

    useEffect(() => { fetchRoles(); }, []);
    useEffect(() => { if (activeTab === 'manage') { setPage(1); fetchUsers(); } }, [activeTab, fetchUsers]);

    // ── Callback khi modal lưu xong ──
    const handleModalSaved = (updatedUser) => {
        setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
        setModalUser(updatedUser); // cập nhật modal với data mới
        fetchRoles(); // refresh count
    };

    // ── Roles tab toggles ──
    const handleToggleRole = (roleKey) => {
        if (roleKey === 'admin') { toast.error(t('admin.auto.k_693890db', 'Không thể vô hiệu hóa vai trò Admin!')); return; }
        setRoleActiveState(prev => ({ ...prev, [roleKey]: !prev[roleKey] }));
        toast.success(roleActiveState[roleKey]
            ? t('admin.auto.k_roleDeactivated')
            : t('admin.auto.k_roleActivated'));
    };

    const getPermState = (roleKey, perm) => {
        const key = `${roleKey}:${perm}`;
        if (key in permOverrides) return permOverrides[key];
        return roles.find(r => r.key === roleKey)?.permissions?.includes(perm) || false;
    };

    const handleToggleRolePerm = (roleKey, perm) => {
        if (roleKey === 'admin') { toast.error(t('admin.auto.k_7d87c836', 'Không thể thay đổi quyền của Admin!')); return; }
        const key = `${roleKey}:${perm}`;
        setPermOverrides(prev => ({ ...prev, [key]: !getPermState(roleKey, perm) }));
    };

    return (
        <AdminLayout>
            <div className="space-y-5">
                {/* ── Hero Banner ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-purple-500 p-5 shadow-xl">
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-300/20 rounded-full blur-[60px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    <Key size={16} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight"> {t('admin.auto.k_5eacfa8b', t('admin.auto.k_5eacfa8b', 'Phân quyền hệ thống'))} </h1>
                            </div>
                        <p className="text-purple-100 text-sm"> {t('admin.auto.k_5470a976', 'Control and assign access rights for each user group')} </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {roles.map((role, i) => {
                                    const ROLE_CONFIG = getRoleConfig(t);
                                    const roleLabel = ROLE_CONFIG[role.key]?.label || role.name;
                                    return (
                                        <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs text-white font-medium">
                                            <span>{roleLabel}:</span><span className="font-bold">{role.userCount} users</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <button onClick={() => { fetchRoles(); if (activeTab === 'manage') fetchUsers(); }} disabled={loading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white text-purple-700 text-sm font-bold rounded-xl hover:bg-purple-50 transition-all shadow-lg flex-shrink-0 disabled:opacity-60">
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> {t('admin.auto.k_4d20363e', 'Refresh')} </button>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                    {[
        { key: 'roles',  label: t('admin.auto.k_382c4970', 'Manage roles & permissions') },
                        { key: 'manage', label: t('admin.auto.k_f48c96de', 'Assign & check permissions') }
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ══════════════════════════════════════
                    TAB 1 — Quản lý vai trò & quyền
                ══════════════════════════════════════ */}
                {activeTab === 'roles' && (
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent" /></div>
                        ) : roles.map(role => (
                            <div key={role.key} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                                <div className={`p-5 bg-gradient-to-r ${ROLE_GRADIENT[role.key]} text-white`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-black text-lg">{getRoleConfig(t)[role.key]?.label || role.name}</h3>
                                            <p className="text-sm text-white/80 mt-0.5">{getRoleConfig(t)[role.key]?.desc || role.description}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-3xl font-black">{role.userCount}</p>
                                                <p className="text-xs text-white/70"> {t('admin.auto.k_1e918890', 'users')} </p>
                                            </div>
                                            {role.key !== 'admin' && (
                                                <button onClick={() => handleToggleRole(role.key)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-all border border-white/30">
                                                    {roleActiveState[role.key] ? <><ToggleRight size={14} /> {t('admin.auto.k_cfaecd87', 'Active')} </> : <><ToggleLeft size={14} /> {t('admin.auto.k_86086677', 'Deactivate')} </>}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-bold text-slate-600"> {t('admin.auto.k_77eaba1d', 'Permissions')} </h4>
                                        {role.key !== 'admin' && <p className="text-xs text-slate-400 italic"> {t('admin.auto.k_4bcb871e', 'Click a permission to toggle')} </p>}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                        {allPermissions.map(perm => {
                                            const hasIt = role.key === 'admin' ? true : getPermState(role.key, perm);
                                            const PERMISSION_LABEL = getPermissionLabel(t);
                                            return (
                                                <button key={perm} onClick={() => handleToggleRolePerm(role.key, perm)} disabled={role.key === 'admin'}
                                                    className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-left transition-all ${hasIt ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'} ${role.key === 'admin' ? 'cursor-default' : 'cursor-pointer'}`}>
                                                    {hasIt ? <CheckCircle size={12} className="text-green-500 flex-shrink-0" /> : <XCircle size={12} className="text-slate-300 flex-shrink-0" />}
                                                    <span className="truncate">{PERMISSION_LABEL[perm] || perm}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {role.key === 'admin' && (
                                        <div className="mt-3 p-3 bg-violet-50 rounded-xl text-sm font-semibold text-violet-700 flex items-center gap-2">
                                            <Shield size={14} /> {t('admin.auto.k_0c614051', 'Admin is granted full permissions in the system')} </div>
                                    )}
                                    {!roleActiveState[role.key] && role.key !== 'admin' && (
                                        <div className="mt-3 p-3 bg-red-50 rounded-xl text-sm font-semibold text-red-600 flex items-center gap-2">
                                            <XCircle size={14} /> {t('admin.auto.k_b8865e89', 'This role is currently deactivated')} </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ══════════════════════════════════════
                    TAB 2 — Gán & Kiểm tra quyền
                    Layout: full-width list, modal khi click
                ══════════════════════════════════════ */}
                {activeTab === 'manage' && (() => {
                    const totalPages = Math.ceil(users.length / PAGE_SIZE) || 1;
                    const pagedUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

                    return (
                    <div className="space-y-4">
                        {/* Search & filter bar */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
                            <div className="flex gap-3 flex-wrap">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                        placeholder={t('admin.auto.k_f0bd4dbe', t('admin.auto.k_f0bd4dbe', 'Tìm tên hoặc email...'))}
                                        value={searchQ}
                                        onChange={e => setSearchQ(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { setPage(1); fetchUsers(); } }}
                                    />
                                </div>
                                <div className="relative">
                                    <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}
                                        className="pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 bg-white appearance-none cursor-pointer">
                                        <option value=""> {t('admin.auto.k_a9d35538', t('admin.auto.k_a9d35538', 'Tất cả vai trò'))} </option>
                                        <option value="user"> {t('admin.auto.k_1b83df7a', t('admin.auto.k_1b83df7a', 'Học viên'))} </option>
                                        <option value="instructor"> {t('admin.auto.k_6e4e1637', t('admin.auto.k_6e4e1637', 'Giảng viên'))} </option>
                                        <option value="admin"> {t('admin.auto.k_08cd66cb', t('admin.auto.k_08cd66cb', 'Quản trị viên'))} </option>
                                    </select>
                                </div>
                                <button onClick={() => { setPage(1); fetchUsers(); }}
                                    className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-all flex items-center gap-2">
                                    <Search size={14} /> {t('admin.auto.k_92849db7', t('admin.auto.k_92849db7', 'Tìm'))} </button>
                            </div>
                        </div>

                        {/* User table */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

                            {/* ── Pagination TOP ── */}
                            <PaginationBar
                                page={page} pages={totalPages}
                                total={users.length} label={t('admin.auto.k_1e918890', t('admin.auto.k_1e918890', 'people dùng'))}
                                onPage={p => setPage(p)} position="top"
                            />

                            {/* Table header */}
                            <div className="grid grid-cols-[1.8fr_2fr_1.4fr_3fr_auto] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider items-center">
                                <span> {t('admin.auto.k_3bf88695', t('admin.auto.k_3bf88695', 'Người dùng'))} </span>
                                <span>Email</span>
                                <span> {t('admin.auto.k_66ab1dca', t('admin.auto.k_66ab1dca', 'Vai trò'))} </span>
                                <span> {t('admin.auto.k_77eaba1d', t('admin.auto.k_77eaba1d', 'Quyền hạn'))} </span>
                                <span></span>
                            </div>

                            {usersLoading ? (
                                <div className="flex justify-center py-16">
                                    <div className="animate-spin rounded-full h-9 w-9 border-4 border-violet-500 border-t-transparent" />
                                </div>
                            ) : users.length === 0 ? (
                                <div className="text-center py-16 text-slate-400">
                                    <Users size={36} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-sm"> {t('admin.auto.k_aee19d0b', t('admin.auto.k_aee19d0b', 'Không tìm thấy users dùng'))} </p>
                                </div>
                            ) : pagedUsers.map(user => {
                                const ROLE_CONFIG = getRoleConfig(t);
                                const cfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.user;
                                const initials = user.fullName?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || '?';
                                return (
                                    <div key={user._id}
                                        className="grid grid-cols-[1.8fr_2fr_1.4fr_3fr_auto] gap-4 px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors items-center">

                                        {/* Avatar + Tên */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden ${cfg.bg} ${cfg.text}`}>
                                                {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : initials}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm text-slate-800 truncate">{user.fullName}</p>
                                                {user.hasCustomPermissions && (
                                                    <span className="text-xs text-amber-600 font-medium"> {t('admin.auto.k_dddc3342', t('admin.auto.k_dddc3342', '● Quyền tùy chỉnh'))} </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <p className="text-sm text-slate-500 truncate">{user.email}</p>

                                        {/* Vai trò badge */}
                                        <div className="flex justify-start">
                                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.badge}`}>
                                                <cfg.icon size={11} />{cfg.label}
                                            </span>
                                        </div>

                                        {/* Quyền dạng badge nhỏ */}
                                        <div className="flex flex-wrap gap-1">
                                            {user.role === 'admin' ? (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-semibold flex items-center gap-1">
                                                    <Crown size={10} /> {t('admin.auto.k_c765fcaa', t('admin.auto.k_c765fcaa', 'Toàn quyền'))} </span>
                                            ) : user.permissions.length === 0 ? (
                                                <span className="text-xs text-slate-300 italic"> {t('admin.auto.k_800722a6', t('admin.auto.k_800722a6', 'Không có quyền'))} </span>
                                            ) : user.permissions.map(perm => {
                                                const PERMISSION_LABEL = getPermissionLabel(t);
                                                return (
                                                <span key={perm} className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
                                                    {PERMISSION_LABEL[perm] || perm}
                                                </span>
                                            )})}
                                        </div>

                                        {/* Nút sửa */}
                                        <button onClick={() => setModalUser(user)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 transition-all flex-shrink-0">
                                            <Pencil size={12} /> {t('admin.auto.k_19495bc0', t('admin.auto.k_19495bc0', 'Sửa quyền'))} </button>
                                    </div>
                                );
                            })}

                            {/* ── Pagination BOTTOM ── */}
                            <PaginationBar
                                page={page} pages={totalPages}
                                total={users.length} label={t('admin.auto.k_1e918890', t('admin.auto.k_1e918890', 'people dùng'))}
                                onPage={p => setPage(p)} position="bottom"
                            />
                        </div>
                    </div>
                    );
                })()}

                {/* ── Modal sửa quyền ── */}
                {modalUser && (
                    <EditPermModal
                        user={modalUser}
                        allPermissions={allPermissions}
                        headers={headers}
                        onClose={() => setModalUser(null)}
                        onSaved={handleModalSaved}
                    />
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminRoles;

