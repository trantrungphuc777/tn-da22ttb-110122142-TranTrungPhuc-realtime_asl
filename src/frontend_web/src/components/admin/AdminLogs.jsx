import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import { ScrollText, AlertTriangle, Info, XCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PaginationBar from './PaginationBar';

const API = 'http://localhost:5000/api/admin/logs';

// CF10 — Nhật ký hệ thống (2 tab)
const AdminLogs = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('audit');
    const [logs, setLogs] = useState([]);
    const [events, setEvents] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState('');
    const [filterLevel, setFilterLevel] = useState('');

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchAudit = async (page = 1) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/audit`, { headers, params: { page, limit: 50, role: filterRole } });
            setLogs(res.data.logs || []);
            setPagination(res.data.pagination || {});
        } catch { toast.error(t('admin.auto.k_5426b128', 'Không thể tải nhật ký!')); }
        finally { setLoading(false); }
    };

    const fetchSystem = async (page = 1) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/system`, { headers, params: { page, limit: 50, level: filterLevel } });
            setEvents(res.data.events || []);
            setPagination(res.data.pagination || {});
        } catch { toast.error(t('admin.auto.k_c005acd6', 'Không thể tải nhật ký hệ thống!')); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (activeTab === 'audit') fetchAudit();
        else fetchSystem();
    }, [activeTab, filterRole, filterLevel]);

    const levelIcon = { INFO: <Info size={14} className="text-blue-500" />, WARNING: <AlertTriangle size={14} className="text-amber-500" />, ERROR: <XCircle size={14} className="text-red-500" /> };
    const levelColor = { INFO: 'bg-blue-50 text-blue-700', WARNING: 'bg-amber-50 text-amber-700', ERROR: 'bg-red-50 text-red-600' };
    const roleColor = {
        user: 'bg-blue-100 text-blue-700',
        instructor: 'bg-emerald-100 text-emerald-700',
        admin: 'bg-violet-100 text-violet-700',
        superadmin: 'bg-red-100 text-red-700',
    };
    const roleLabel = {
        user: t('admin.auto.k_1b83df7a', 'Student'),
        instructor: t('admin.auto.k_6e4e1637', 'Instructor'),
        admin: t('admin.auto.k_08cd66cb', 'Administrator'),
        superadmin: 'Super Admin',
    };
    const actionLabel = {
        login:             t('admin.auto.k_9a192725', 'Login'),
        login_failed:      t('admin.auto.k_c24bd9a2', 'Login failed'),
        logout:            t('admin.auto.k_0b3c823d', 'Logout'),
        register:          t('admin.auto.k_0bb0951d', 'Register'),
        submit_assignment: t('admin.auto.k_30ef260d', 'Submit'),
        update_profile:    t('admin.auto.k_8383c67a', 'Update profile'),
        change_password:   t('admin.auto.k_ff6fe7b1', 'Change password'),
    };
    const actionColor = {
        login: 'text-emerald-600 font-semibold',
        login_failed: 'text-red-500 font-semibold',
        logout: 'text-slate-500',
        register: 'text-blue-600 font-semibold',
        submit_assignment: 'text-violet-600',
    };

    return (
        <AdminLayout>
            <div className="space-y-5">
                {/* ── Hero Banner ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-700 via-gray-700 to-slate-600 p-5 shadow-xl">
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-400/15 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-gray-400/10 rounded-full blur-[50px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    <ScrollText size={16} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight"> {t('admin.auto.k_0b41920e', t('admin.auto.k_0b41920e', 'Nhật ký hệ thống'))} </h1>
                            </div>
                            <p className="text-slate-300 text-sm"> {t('admin.auto.k_74c6872a', 'Track all user activities and system events')} </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {[
                                    { label: 'Audit Log', val: t('admin.auto.k_402baad9', 'User actions') },
                                    { label: 'System Events', val: t('admin.auto.k_44696ed5', 'System events') },
                                ].map((p, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/15 text-xs text-white font-medium">
                                        <span>{p.label}:</span><span className="font-bold">{p.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => activeTab === 'audit' ? fetchAudit() : fetchSystem()}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all shadow-lg flex-shrink-0">
                            <RefreshCw size={15} /> {t('admin.auto.k_4d20363e', 'Refresh')} </button>
                    </div>
                </div>

                {/* 2 Tab */}
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                    <button onClick={() => setActiveTab('audit')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'audit' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
                        <ScrollText size={14} /> {t('admin.auto.k_ade06b6b', 'Tab 1: User Audit Log')} </button>
                    <button onClick={() => setActiveTab('system')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'system' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
                        <AlertTriangle size={14} /> {t('admin.auto.k_8b6258cc', 'Tab 2: System Events')} </button>
                </div>

                {/* Bộ lọc */}
                {activeTab === 'audit' && (
                    <select className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                        value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                        <option value=""> {t('admin.auto.k_a9d35538', 'All roles')} </option>
                        <option value="user"> {t('admin.auto.k_1b83df7a', 'Student')} </option>
                        <option value="instructor"> {t('admin.auto.k_6e4e1637', 'Instructor')} </option>
                        <option value="admin">Admin</option>
                    </select>
                )}
                {activeTab === 'system' && (
                    <select className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                        value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
                        <option value=""> {t('admin.auto.k_d2303275', 'All levels')} </option>
                        <option value="INFO">INFO</option>
                        <option value="WARNING">WARNING</option>
                        <option value="ERROR">ERROR</option>
                    </select>
                )}

                {/* CF10 Tab 1 — Audit Log */}
                {activeTab === 'audit' && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        {/* Pagination đầu trang */}
                        <PaginationBar
                            page={pagination.page} pages={pagination.pages}
                            total={pagination.total} label={t('admin.auto.k_7ef74f36', t('admin.auto.k_7ef74f36', 'records'))}
                            onPage={(p) => fetchAudit(p)} position="top"
                        />
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">ID Log</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_3bf88695', 'User')} </th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_66ab1dca', 'Role')} </th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_1737d210', 'Action')} </th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_0475320c', 'Details')} </th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_84864ffd', 'Time')} </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan={6} className="text-center py-12 text-slate-400"> {t('admin.auto.k_d5fe42f6', t('admin.auto.k_d5fe42f6', 'Đang tải...'))} </td></tr>
                                    ) : logs.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-12 text-slate-400"> {t('admin.auto.k_69712819', t('admin.auto.k_69712819', 'Chưa có nhật ký nào'))} </td></tr>
                                    ) : logs.map(log => (
                                        <tr key={log._id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{log._id.slice(-8).toUpperCase()}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-800">{log.userId?.fullName || '—'}</td>
                                            <td className="px-4 py-3">
                                                {log.userRole ? (
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${roleColor[log.userRole] || 'bg-slate-100 text-slate-600'}`}>
                                                        {roleLabel[log.userRole] || log.userRole}
                                                    </span>
                                                ) : <span className="text-slate-300 text-xs">—</span>}
                                            </td>
                                            <td className={`px-4 py-3 text-sm ${actionColor[log.action] || 'text-slate-700'}`}>
                                                {actionLabel[log.action] || log.action}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{log.detail || '—'}</td>
                                            <td className="px-4 py-3 text-slate-500 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <PaginationBar
                            page={pagination.page} pages={pagination.pages}
                            total={pagination.total} label={t('admin.auto.k_7ef74f36', t('admin.auto.k_7ef74f36', 'records'))}
                            onPage={(p) => fetchAudit(p)} position="bottom"
                        />
                    </div>
                )}

                {/* CF10 Tab 2 — System Events */}
                {activeTab === 'system' && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        {/* Pagination đầu trang */}
                        <PaginationBar
                            page={pagination.page} pages={pagination.pages}
                            total={pagination.total} label={t('admin.auto.k_5223928f', t('admin.auto.k_5223928f', 'sự kiện'))}
                            onPage={(p) => fetchSystem(p)} position="top"
                        />
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_62df3e9a', t('admin.auto.k_62df3e9a', 'Mã sự kiện'))} </th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_054f092e', t('admin.auto.k_054f092e', 'Loại sự kiện'))} </th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_7426e870', t('admin.auto.k_7426e870', 'Mức độ'))} </th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_d9be5953', t('admin.auto.k_d9be5953', 'Thông điệp'))} </th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_548a1a70', t('admin.auto.k_548a1a70', 'Thời gian phát sinh'))} </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan={5} className="text-center py-12 text-slate-400"> {t('admin.auto.k_d5fe42f6', t('admin.auto.k_d5fe42f6', 'Đang tải...'))} </td></tr>
                                    ) : events.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-12 text-slate-400"> {t('admin.auto.k_369352f5', t('admin.auto.k_369352f5', 'Chưa có sự kiện nào'))} </td></tr>
                                    ) : events.map(ev => (
                                        <tr key={ev._id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{ev.eventCode}</td>
                                            <td className="px-4 py-3 text-slate-600 capitalize">{ev.eventType}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${levelColor[ev.level]}`}>
                                                    {levelIcon[ev.level]}{ev.level}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">{ev.message}</td>
                                            <td className="px-4 py-3 text-slate-500 text-xs">{new Date(ev.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <PaginationBar
                            page={pagination.page} pages={pagination.pages}
                            total={pagination.total} label={t('admin.auto.k_5223928f', t('admin.auto.k_5223928f', 'sự kiện'))}
                            onPage={(p) => fetchSystem(p)} position="bottom"
                        />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminLogs;
