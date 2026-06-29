import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import {
    Shield, Database, RefreshCw, LogOut, Save, HardDrive,
    RotateCcw, Lock, AlertTriangle, Download, FileJson,
    CheckCircle, XCircle, Clock, Info, Layers,
    Trash2, Search, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = 'http://localhost:5000/api/admin/system';

// ── Modal xác nhận restore ────────────────────────────────────────────────────
const RestoreConfirmModal = ({ backup, onConfirm, onCancel, t }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={20} className="text-amber-600" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-base">{t('admin.auto.k_confirm_restore', 'Confirm data restore')}</h3>
                    <p className="text-xs text-slate-500">{t('admin.auto.k_undoable', 'This action cannot be undone')}</p>
                </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 space-y-1">
                <p className="text-sm font-semibold text-amber-800">{t('admin.auto.k_important_warn', '⚠️ Important warning')}</p>
                <p className="text-xs text-amber-700">{t('admin.auto.k_overwrite_warn', 'All current data will be')} <strong>{t('admin.auto.k_overwrite_warn2', 'overwritten')}</strong> {t('admin.auto.k_overwrite_warn3', 'with data from this backup. This action cannot be undone.')}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 mb-5 space-y-1.5 text-xs">
                <p className="font-semibold text-slate-600">{t('admin.auto.k_backup_info', 'Backup information:')}</p>
                <p className="text-slate-700"><span className="text-slate-500">File:</span> {backup.filename}</p>
                <p className="text-slate-700"><span className="text-slate-500">{t('admin.auto.k_time_label', 'Time:')}</span> {new Date(backup.createdAt).toLocaleString()}</p>
                <p className="text-slate-700"><span className="text-slate-500">{t('admin.auto.k_size_label', 'Size:')}</span> {backup.size}</p>
                {backup.stats?.totalDocuments > 0 && (
                    <p className="text-slate-700"><span className="text-slate-500">Documents:</span> {backup.stats.totalDocuments.toLocaleString()}</p>
                )}
            </div>
            <div className="flex gap-3">
                <button onClick={onCancel}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
                    {t('admin.auto.k_cancel_btn', 'Cancel')}
                </button>
                <button onClick={onConfirm}
                    className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2">
                    <RotateCcw size={14} /> {t('admin.auto.k_restore_now', 'Restore now')}
                </button>
            </div>
        </div>
    </div>
);

// ── Modal xác nhận xóa ────────────────────────────────────────────────────────
const DeleteConfirmModal = ({ target, count, filename, onConfirm, onCancel, t }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Trash2 size={20} className="text-red-600" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-base">{t('admin.auto.k_confirm_delete', 'Confirm delete')}</h3>
                    <p className="text-xs text-slate-500">{t('admin.auto.k_undoable', 'This action cannot be undone')}</p>
                </div>
            </div>
            <p className="text-sm text-slate-600 mb-5">
                {target === 'bulk'
                    ? `${t('admin.auto.k_delete_n', 'Delete')} ${count} ${t('admin.auto.k_delete_bulk', 'selected backups? Physical files on the server will also be deleted.')}`
                    : `${t('admin.auto.k_delete_n', 'Delete')} "${filename}"? ${t('admin.auto.k_delete_single', 'The physical file on the server will also be deleted.')}`
                }
            </p>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200">{t('admin.auto.k_cancel_btn', 'Cancel')}</button>
                <button onClick={onConfirm} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 flex items-center justify-center gap-2">
                    <Trash2 size={14} /> {t('admin.auto.k_delete_btn', 'Delete')}
                </button>
            </div>
        </div>
    </div>
);

// CF11 — Quản lý hệ thống và bảo mật
const AdminSystem = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('sessions');
    const [sessions, setSessions] = useState([]);
    const [backups, setBackups] = useState([]);
    const [policy, setPolicy] = useState({
        minPasswordLength: 8, requireSpecialChar: true, requireUppercase: true, requireNumber: true,
        autoBackupSchedule: 'weekly',
        autoBackupConfig: { hour: 2, minute: 0, weekDay: 0, monthDay: 1, onceAt: '' }
    });
    const [loading, setLoading] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [restoreTarget, setRestoreTarget] = useState(null);
    const [expandedBackup, setExpandedBackup] = useState(null);
    const [scheduleStatus, setScheduleStatus] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all' | 'manual' | 'auto'
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'success' | 'failed'
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null); // null | 'single' | 'bulk'
    const [deleteId, setDeleteId] = useState(null);
    const ITEMS_PER_PAGE = 8;

    // Session search/filter/pagination state
    const [sessionSearch, setSessionSearch] = useState('');
    const [sessionFilterRole, setSessionFilterRole] = useState('all');
    const [sessionPage, setSessionPage] = useState(1);
    const SESSION_PER_PAGE = 10;

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchSessions = async () => {
        try {
            const res = await axios.get(`${API}/sessions`, { headers });
            setSessions(res.data.sessions || []);
        } catch {}
    };

    const fetchBackups = async () => {
        try {
            const res = await axios.get(`${API}/backups`, { headers });
            setBackups(res.data.backups || []);
        } catch {}
    };

    const fetchScheduleStatus = async () => {
        try {
            const res = await axios.get(`${API}/backup-schedule-status`, { headers });
            setScheduleStatus(res.data);
        } catch {}
    };

    const fetchPolicy = async () => {
        try {
            const res = await axios.get(`${API}/security-policy`, { headers });
            const p = res.data.policy;
            if (p) setPolicy(prev => ({
                ...prev, ...p,
                autoBackupConfig: {
                    hour: 2, minute: 0, weekDay: 0, monthDay: 1, onceAt: '',
                    ...(p.autoBackupConfig || {})
                }
            }));
        } catch {}
    };

    useEffect(() => {
        fetchSessions(); fetchBackups(); fetchPolicy(); fetchScheduleStatus();
    }, []);

    // CF11.1 — Force logout single account
    const handleForceLogout = async (userId) => {
        if (!window.confirm(t('admin.auto.k_9b6f33be', 'Force logout this account?'))) return;
        try {
            await axios.post(`${API}/sessions/${userId}/force-logout`, {}, { headers });
            toast.success(t('admin.auto.k_1536cc5f', 'Force logout successful!'));
            fetchSessions();
        } catch { toast.error(t('admin.auto.k_33a5e01f', 'Operation failed!')); }
    };

    // CF11.1 — Force logout all sessions
    const handleForceLogoutAll = async () => {
        if (!window.confirm(t('admin.auto.k_eb4863a7', 'Force logout all user sessions? This will log out everyone!'))) return;
        try {
            await axios.post(`${API}/sessions/force-logout-all`, {}, { headers });
            toast.success(t('admin.auto.k_6ba8f978', 'All sessions terminated!'));
            fetchSessions();
        } catch { toast.error(t('admin.auto.k_33a5e01f', 'Operation failed!')); }
    };

    // CF11.2 — Manual backup
    const handleBackup = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${API}/backup`, {}, { headers });
            toast.success(res.data.message);
            fetchBackups();
            fetchScheduleStatus();
        } catch (err) {
            const msg = err?.response?.data?.message || t('admin.auto.k_09cc901f', 'Backup failed!');
            toast.error(msg);
        } finally { setLoading(false); }
    };

    // CF11.2 — Tải file backup về máy
    const handleDownload = (backup) => {
        if (!backup.fileExists) {
            toast.error(t('admin.auto.k_09cc901f', 'Backup file no longer exists on server!'));
            return;
        }
        const url = `${API}/backups/${backup._id}/download`;
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute('Authorization', `Bearer ${token}`);
        // Dùng fetch để gửi auth header
        fetch(url, { headers })
            .then(res => {
                if (!res.ok) throw new Error('Download failed');
                return res.blob();
            })
            .then(blob => {
                const objectUrl = URL.createObjectURL(blob);
                a.href = objectUrl;
                a.download = backup.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(objectUrl);
            })
            .catch(() => toast.error(t('admin.auto.k_ccd0dace', 'Unable to download backup file!')));
    };

    // CF11.3 — Mở modal xác nhận restore
    const handleRestoreClick = (backup) => {
        if (!backup.fileExists) {
            toast.error(t('admin.auto.k_ccd0dace', 'Backup file no longer exists on server, cannot restore!'));
            return;
        }
        setRestoreTarget(backup);
    };

    // CF11.3 — Thực hiện restore sau khi xác nhận
    const handleRestoreConfirm = async () => {
        const backup = restoreTarget;
        setRestoreTarget(null);
        setRestoring(true);
        const toastId = toast.loading(`Restoring from "${backup.filename}"...`);
        try {
            const res = await axios.post(`${API}/restore`, { backupId: backup._id, filename: backup.filename }, { headers });
            toast.dismiss(toastId);
            toast.success(res.data.message, { duration: 5000 });
        } catch (err) {
            toast.dismiss(toastId);
            const msg = err?.response?.data?.message || t('admin.auto.k_ccd0dace', 'Restore failed!');
            toast.error(msg, { duration: 6000 });
        } finally { setRestoring(false); }
    };

    // ── Xóa backup ──────────────────────────────────────────────────────────
    const handleDeleteSingle = async () => {
        const id = deleteId;
        setDeleteTarget(null); setDeleteId(null);
        try {
            await axios.delete(`${API}/backups/${id}`, { headers });
            toast.success('Backup deleted successfully!');
            fetchBackups(); setSelectedIds([]);
        } catch (err) {
            toast.error(err?.response?.data?.message || t('admin.auto.k_b88430ce', 'Delete failed!'));
        }
    };

    const handleDeleteBulk = async () => {
        const ids = [...selectedIds];
        setDeleteTarget(null); setSelectedIds([]);
        try {
            await axios.delete(`${API}/backups`, { headers, data: { ids } });
            toast.success(`Deleted ${ids.length} backup(s) successfully!`);
            fetchBackups();
        } catch (err) {
            toast.error(err?.response?.data?.message || t('admin.auto.k_b88430ce', 'Delete failed!'));
        }
    };

    // CF11.4 — Save security policy
    const handleSavePolicy = async () => {
        try {
            await axios.put(`${API}/security-policy`, policy, { headers });
            toast.success('Auto backup schedule updated!');
            fetchScheduleStatus();
        } catch (err) {
            const msg = err?.response?.data?.message || t('admin.auto.k_b88430ce', 'Update failed!');
            toast.error(msg);
        }
    };

    const filteredBackups = backups.filter(b => {
        const matchSearch = !searchTerm || b.filename.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = filterType === 'all' || b.type === filterType;
        const matchStatus = filterStatus === 'all' || b.status === filterStatus;
        return matchSearch && matchType && matchStatus;
    });
    const totalPages = Math.ceil(filteredBackups.length / ITEMS_PER_PAGE);
    const pagedBackups = filteredBackups.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Session filter + pagination
    const filteredSessions = sessions.filter(s => {
        const q = sessionSearch.toLowerCase();
        const matchSearch = !q || s.account?.toLowerCase().includes(q) || s.ip?.toLowerCase().includes(q) || s.device?.toLowerCase().includes(q);
        const matchRole = sessionFilterRole === 'all' || s.role === sessionFilterRole;
        return matchSearch && matchRole;
    });
    const sessionTotalPages = Math.max(1, Math.ceil(filteredSessions.length / SESSION_PER_PAGE));
    const pagedSessions = filteredSessions.slice((sessionPage - 1) * SESSION_PER_PAGE, sessionPage * SESSION_PER_PAGE);

    const TABS = [
        { key: 'sessions', label: t('admin.auto.k_d906a2c4', 'Phiên đăng nhập'), icon: LogOut },
        { key: 'backup', label: t('admin.auto.k_b9c3a4f9', 'Sao lưu & Khôi phục'), icon: Database },
        { key: 'security', label: t('admin.auto.k_98b31963', 'Chính sách bảo mật'), icon: Lock }
    ];

    const successBackups = backups.filter(b => b.status === 'success').length;

    return (
        <AdminLayout>
            {/* Modal xác nhận restore */}
            {restoreTarget && (
                <RestoreConfirmModal
                    backup={restoreTarget}
                    onConfirm={handleRestoreConfirm}
                    onCancel={() => setRestoreTarget(null)}
                    t={t}
                />
            )}

            {/* Modal xác nhận xóa */}
            {deleteTarget && (
                <DeleteConfirmModal
                    target={deleteTarget}
                    count={selectedIds.length}
                    filename={backups.find(b => b._id === deleteId)?.filename}
                    onConfirm={deleteTarget === 'bulk' ? handleDeleteBulk : handleDeleteSingle}
                    onCancel={() => { setDeleteTarget(null); setDeleteId(null); }}
                    t={t}
                />
            )}

            <div className="space-y-5">
                {/* ── Hero Banner ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 p-5 shadow-xl">
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-300/20 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-red-300/15 rounded-full blur-[50px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    <Shield size={16} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                                    {t('admin.auto.k_fbf4058b', 'Hệ thống & Bảo mật')}
                                </h1>
                            </div>
                            <p className="text-rose-100 text-sm">
                                {t('admin.auto.k_6f091813', 'Quản lý phiên đăng nhập, sao lưu dữ liệu và chính sách bảo mật')}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {[
                                    { label: t('admin.auto.k_d906a2c4', 'Phiên đăng nhập'), val: sessions.length },
                                    { label: 'Backup', val: `${successBackups}/${backups.length}` },
                                ].map((p, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs text-white font-medium">
                                        <span>{p.label}:</span><span className="font-bold">{p.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => { fetchSessions(); fetchBackups(); fetchPolicy(); fetchScheduleStatus(); }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white text-rose-700 text-sm font-bold rounded-xl hover:bg-rose-50 transition-all shadow-lg flex-shrink-0">
                            <RefreshCw size={15} /> {t('admin.auto.k_4d20363e', 'Làm mới')}
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
                                <Icon size={14} />{tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* CF11.1 — Phiên đăng nhập */}
                {activeTab === 'sessions' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-700">{t('admin.auto.k_f4f24d53', 'Danh sách phiên hoạt động')}</h3>
                            <div className="flex gap-2">
                                <button onClick={fetchSessions} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200">
                                    <RefreshCw size={12} /> {t('admin.auto.k_4d20363e', 'Làm mới')}
                                </button>
                                <button onClick={handleForceLogoutAll}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700">
                                    <AlertTriangle size={12} /> {t('admin.auto.k_ad7b590c', 'Kết thúc toàn bộ phiên')}
                                </button>
                            </div>
                        </div>

                        {/* ── Thanh tìm kiếm & bộ lọc ── */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Filter size={13} className="text-blue-500" />
                                <span className="text-xs font-bold text-slate-600">{t('admin.auto.k_tim_kiem_loc', 'Tìm kiếm & Lọc')}</span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <div className="relative flex-1 min-w-[220px]">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={sessionSearch}
                                        onChange={e => { setSessionSearch(e.target.value); setSessionPage(1); }}
                                        placeholder={t('admin.auto.k_search_session', 'Tìm theo tên tài khoản, IP, thiết bị...')}
                                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                                    />
                                </div>
                                <select
                                    value={sessionFilterRole}
                                    onChange={e => { setSessionFilterRole(e.target.value); setSessionPage(1); }}
                                    className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                                    <option value="all">{t('admin.auto.k_a9d35538', 'Tất cả vai trò')}</option>
                                    <option value="admin">{t('admin.auto.k_08cd66cb', 'Quản trị viên')}</option>
                                    <option value="instructor">{t('admin.auto.k_6e4e1637', 'Giảng viên')}</option>
                                    <option value="user">{t('admin.auto.k_1b83df7a', 'Học viên')}</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                            {/* Pagination trên */}
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-blue-100 bg-gradient-to-r from-blue-50/70 to-sky-50/50">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-3 py-1.5 rounded-full shadow-sm shadow-blue-300/50">
                                        {t('admin.auto.k_trang', 'Trang')} {sessionPage}/{sessionTotalPages}
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium">
                                        — <span className="font-bold text-blue-700">{filteredSessions.length}</span> {t('admin.auto.k_phien', 'phiên')}
                                    </span>
                                </div>
                                {sessionTotalPages > 1 && (
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setSessionPage(1)} disabled={sessionPage === 1}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-blue-600 hover:text-white disabled:opacity-30 transition-all text-xs">«</button>
                                        <button onClick={() => setSessionPage(p => Math.max(1, p - 1))} disabled={sessionPage === 1}
                                            className="flex items-center gap-1 px-3 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-blue-600 hover:text-white disabled:opacity-30 transition-all">
                                            <ChevronLeft size={13} /> {t('admin.auto.k_8b31948d', 'Trước')}
                                        </button>
                                        {Array.from({ length: Math.min(5, sessionTotalPages) }, (_, i) => {
                                            const half = 2;
                                            let p = Math.min(Math.max(sessionPage - half + i, i + 1), sessionTotalPages - Math.min(5, sessionTotalPages) + i + 1);
                                            if (sessionTotalPages <= 5) p = i + 1;
                                            else if (sessionPage <= 3) p = i + 1;
                                            else if (sessionPage >= sessionTotalPages - 2) p = sessionTotalPages - 4 + i;
                                            else p = sessionPage - 2 + i;
                                            return (
                                                <button key={p} onClick={() => setSessionPage(p)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${sessionPage === p ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105 ring-2 ring-blue-300' : 'border-slate-200 bg-white text-slate-600 hover:bg-blue-50'}`}>
                                                    {p}
                                                </button>
                                            );
                                        })}
                                        <button onClick={() => setSessionPage(p => Math.min(sessionTotalPages, p + 1))} disabled={sessionPage === sessionTotalPages}
                                            className="flex items-center gap-1 px-3 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-blue-600 hover:text-white disabled:opacity-30 transition-all">
                                            {t('admin.auto.k_sau', 'Sau')} <ChevronRight size={13} />
                                        </button>
                                        <button onClick={() => setSessionPage(sessionTotalPages)} disabled={sessionPage === sessionTotalPages}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-blue-600 hover:text-white disabled:opacity-30 transition-all text-xs">»</button>
                                    </div>
                                )}
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('admin.auto.k_7bd53616', 'Tài khoản')}</th>
                                            <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('admin.auto.k_66ab1dca', 'Vai trò')}</th>
                                            <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('admin.auto.k_2c2f23c6', 'Thời gian đăng nhập')}</th>
                                            <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('admin.auto.k_a320f6de', 'Địa chỉ IP')}</th>
                                            <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('admin.auto.k_bcf3a9df', 'Thiết bị')}</th>
                                            <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('admin.auto.k_0fbc27f5', 'Trạng thái')}</th>
                                            <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('admin.auto.k_71d52075', 'Thao tác')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {pagedSessions.length === 0 ? (
                                            <tr><td colSpan={7} className="text-center py-12 text-slate-400">{t('admin.auto.k_e1a9a30e', 'Không có phiên hoạt động')}</td></tr>
                                        ) : pagedSessions.map((s, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-semibold text-slate-800">{s.account}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.role === 'admin' ? 'bg-red-100 text-red-700' : s.role === 'instructor' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {s.role === 'admin' ? t('admin.auto.k_08cd66cb', 'Quản trị viên') : s.role === 'instructor' ? t('admin.auto.k_6e4e1637', 'Giảng viên') : t('admin.auto.k_1b83df7a', 'Học viên')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(s.loginTime).toLocaleString('vi-VN')}</td>
                                                <td className="px-4 py-3 text-slate-500">
                                                    {s.ip === '127.0.0.1' || s.ip === '::1'
                                                        ? <span className="text-xs px-1.5 py-0.5 bg-slate-100 rounded font-mono">localhost</span>
                                                        : (s.ip || 'N/A')}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">{s.device || 'N/A'}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{t('admin.auto.k_cbc72ecb', '● Hoạt động')}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button onClick={() => handleForceLogout(s.userId)}
                                                        className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100">
                                                        <LogOut size={12} /> {t('admin.auto.k_426b4dd0', 'Buộc đăng xuất')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination dưới */}
                            <div className="flex items-center justify-between px-4 py-2.5 border-t border-blue-100 bg-gradient-to-r from-blue-50/70 to-sky-50/50">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-3 py-1.5 rounded-full shadow-sm shadow-blue-300/50">
                                        {t('admin.auto.k_trang', 'Trang')} {sessionPage}/{sessionTotalPages}
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium">
                                        — <span className="font-bold text-blue-700">{filteredSessions.length}</span> {t('admin.auto.k_phien', 'phiên')}
                                    </span>
                                </div>
                                {sessionTotalPages > 1 && (
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setSessionPage(1)} disabled={sessionPage === 1}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-blue-600 hover:text-white disabled:opacity-30 transition-all text-xs">«</button>
                                        <button onClick={() => setSessionPage(p => Math.max(1, p - 1))} disabled={sessionPage === 1}
                                            className="flex items-center gap-1 px-3 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-blue-600 hover:text-white disabled:opacity-30 transition-all">
                                            <ChevronLeft size={13} /> {t('admin.auto.k_8b31948d', 'Trước')}
                                        </button>
                                        {Array.from({ length: Math.min(5, sessionTotalPages) }, (_, i) => {
                                            let p;
                                            if (sessionTotalPages <= 5) p = i + 1;
                                            else if (sessionPage <= 3) p = i + 1;
                                            else if (sessionPage >= sessionTotalPages - 2) p = sessionTotalPages - 4 + i;
                                            else p = sessionPage - 2 + i;
                                            return (
                                                <button key={p} onClick={() => setSessionPage(p)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${sessionPage === p ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105 ring-2 ring-blue-300' : 'border-slate-200 bg-white text-slate-600 hover:bg-blue-50'}`}>
                                                    {p}
                                                </button>
                                            );
                                        })}
                                        <button onClick={() => setSessionPage(p => Math.min(sessionTotalPages, p + 1))} disabled={sessionPage === sessionTotalPages}
                                            className="flex items-center gap-1 px-3 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-blue-600 hover:text-white disabled:opacity-30 transition-all">
                                            {t('admin.auto.k_sau', 'Sau')} <ChevronRight size={13} />
                                        </button>
                                        <button onClick={() => setSessionPage(sessionTotalPages)} disabled={sessionPage === sessionTotalPages}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-blue-600 hover:text-white disabled:opacity-30 transition-all text-xs">»</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* CF11.2 + CF11.3 — Backup & Restore */}
                {activeTab === 'backup' && (
                    <div className="space-y-4">
                        {/* Khu vực tạo backup */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                            <h3 className="font-bold text-slate-700 mb-1 flex items-center gap-2">
                                <HardDrive size={16} className="text-blue-500" />
                                {t('admin.auto.k_a764e4b3', 'Sao lưu dữ liệu')}
                            </h3>
                            <p className="text-xs text-slate-400 mb-4">
                                {t('admin.auto.k_7f69d35a', 'Sao lưu toàn bộ cơ sở dữ liệu ra file JSON lưu trên server. File có thể tải về hoặc khôi phục lại bất kỳ lúc nào.')}
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <button onClick={handleBackup} disabled={loading || restoring}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-sm shadow-blue-500/30 transition-all">
                                    {loading
                                        ? <><RefreshCw size={15} className="animate-spin" /> {t('admin.auto.k_backing_up', 'Backing up...')}</>
                                        : <><Database size={15} /> {t('admin.auto.k_backup_now', 'Back up now')}</>
                                    }
                                </button>
                                {restoring && (
                                    <span className="flex items-center gap-1.5 text-amber-600 text-sm font-semibold">
                                        <RefreshCw size={14} className="animate-spin" /> {t('admin.auto.k_restoring', 'Restoring...')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* ── Cấu hình lịch backup tự động ── */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                    <Clock size={15} className="text-blue-500" />
                                    {t('admin.auto.k_auto_sched', 'Automatic backup schedule')}
                                </h3>
                                {policy.autoBackupSchedule !== 'none' && (
                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium border border-blue-100">
                                        {t('admin.auto.k_enabled', 'Enabled')}
                                    </span>
                                )}
                            </div>

                            {/* Segmented control */}
                            <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5 mb-4">
                                {[
                                    { val: 'none',    label: t('admin.auto.k_sched_off', 'Off')     },
                                    { val: 'daily',   label: t('admin.auto.k_sched_daily', 'Daily')  },
                                    { val: 'weekly',  label: t('admin.auto.k_sched_weekly', 'Weekly') },
                                    { val: 'monthly', label: t('admin.auto.k_sched_monthly', 'Monthly') },
                                    { val: 'once',    label: t('admin.auto.k_sched_once', 'Once')   },
                                ].map(opt => (
                                    <button key={opt.val}
                                        onClick={() => setPolicy({ ...policy, autoBackupSchedule: opt.val })}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            policy.autoBackupSchedule === opt.val
                                                ? 'bg-white text-blue-700 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Config chi tiết theo từng mode */}
                            {policy.autoBackupSchedule !== 'none' && (
                                <div className="space-y-3 mb-4">

                                    {/* daily */}
                                    {policy.autoBackupSchedule === 'daily' && (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs text-slate-400 w-16">{t('admin.auto.k_run_at', 'Run at')}</span>
                                            <select className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                value={policy.autoBackupConfig?.hour ?? 2}
                                                onChange={e => setPolicy({ ...policy, autoBackupConfig: { ...policy.autoBackupConfig, hour: parseInt(e.target.value) } })}>
                                                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2,'0')}:00</option>)}
                                            </select>
                                            <select className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                value={policy.autoBackupConfig?.minute ?? 0}
                                                onChange={e => setPolicy({ ...policy, autoBackupConfig: { ...policy.autoBackupConfig, minute: parseInt(e.target.value) } })}>
                                                {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2,'0')} {t('admin.auto.k_min_label','min')}</option>)}
                                            </select>
                                            <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200">
                                                {String(policy.autoBackupConfig?.hour ?? 2).padStart(2,'0')}:{String(policy.autoBackupConfig?.minute ?? 0).padStart(2,'0')} {t('admin.auto.k_every_day','every day')}
                                            </span>
                                        </div>
                                    )}

                                    {/* weekly */}
                                    {policy.autoBackupSchedule === 'weekly' && (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs text-slate-400 w-16">{t('admin.auto.k_run_on', 'Run on')}</span>
                                            <select className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                value={policy.autoBackupConfig?.weekDay ?? 0}
                                                onChange={e => setPolicy({ ...policy, autoBackupConfig: { ...policy.autoBackupConfig, weekDay: parseInt(e.target.value) } })}>
                                                {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d,i) => <option key={i} value={i}>{t(`admin.auto.k_day${i}`, d)}</option>)}
                                            </select>
                                            <select className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                value={policy.autoBackupConfig?.hour ?? 2}
                                                onChange={e => setPolicy({ ...policy, autoBackupConfig: { ...policy.autoBackupConfig, hour: parseInt(e.target.value) } })}>
                                                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2,'0')}:00</option>)}
                                            </select>
                                            <select className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                value={policy.autoBackupConfig?.minute ?? 0}
                                                onChange={e => setPolicy({ ...policy, autoBackupConfig: { ...policy.autoBackupConfig, minute: parseInt(e.target.value) } })}>
                                                {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2,'0')} {t('admin.auto.k_min_label','min')}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {/* monthly */}
                                    {policy.autoBackupSchedule === 'monthly' && (() => {
                                        const now = new Date();
                                        const md = policy.autoBackupConfig?.monthDay ?? 1;
                                        const h  = policy.autoBackupConfig?.hour ?? 2;
                                        const m  = policy.autoBackupConfig?.minute ?? 0;
                                        const refDate = new Date(now.getFullYear(), now.getMonth(), md, h, m);
                                        const dtValue = refDate.toISOString().slice(0, 16);
                                        return (
                                            <div className="space-y-1.5">
                                                <span className="text-xs text-slate-400 block">{t('admin.auto.k_select_day_month','Select day and time of month')}</span>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <input type="datetime-local"
                                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                        value={dtValue}
                                                        onChange={e => {
                                                            if (!e.target.value) return;
                                                            const d = new Date(e.target.value);
                                                            setPolicy({ ...policy, autoBackupConfig: { ...policy.autoBackupConfig, monthDay: d.getDate(), hour: d.getHours(), minute: d.getMinutes() }});
                                                        }}
                                                    />
                                                    <span className="text-xs text-slate-400">→ {t('admin.auto.k_sched_daily','Day')} <strong className="text-slate-600">{md}</strong> {t('admin.auto.k_day_of_month','of every month at')} <strong className="text-slate-600">{String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}</strong></span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* once */}
                                    {policy.autoBackupSchedule === 'once' && (
                                        <div className="space-y-1.5">
                                            <span className="text-xs text-slate-400 block">{t('admin.auto.k_specific_time','Specific backup time')}</span>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <input type="datetime-local"
                                                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    min={(() => { const d = new Date(Date.now() + 60000); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; })()}
                                                    value={policy.autoBackupConfig?.onceAt || ''}
                                                    onChange={e => setPolicy({ ...policy, autoBackupConfig: { ...policy.autoBackupConfig, onceAt: e.target.value } })}
                                                />
                                                {policy.autoBackupConfig?.onceAt && (
                                                    <span className="text-xs text-blue-600">
                                                        {(() => { const [dp,tp] = (policy.autoBackupConfig.onceAt||'').split('T'); if(!dp||!tp) return ''; const [y,mo,d]=dp.split('-'); return `${tp} · ${d}/${mo}/${y}`; })()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Cron preview */}
                                    {['daily','weekly','monthly'].includes(policy.autoBackupSchedule) && (() => {
                                        const cfg = policy.autoBackupConfig || {};
                                        const h = cfg.hour ?? 2, m = cfg.minute ?? 0, wd = cfg.weekDay ?? 0, md = cfg.monthDay ?? 1;
                                        const expr = { daily: `${m} ${h} * * *`, weekly: `${m} ${h} * * ${wd}`, monthly: `${m} ${h} ${md} * *` }[policy.autoBackupSchedule];
                                        return (
                                            <div className="flex items-center gap-1.5 pt-0.5">
                                                <span className="text-xs text-slate-400">cron:</span>
                                                <code className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{expr}</code>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* Save schedule button */}
                            <button onClick={handleSavePolicy}
                                className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/30">
                                <Save size={14} /> {t('admin.auto.k_save_sched','Save backup schedule')}
                            </button>
                        </div>

                        {/* Lịch sử backup */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 space-y-3">
                                {/* Header row */}
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                        <Clock size={15} className="text-slate-400" />
                                        {t('admin.auto.k_0133ef86', 'Backup history')}
                                        {backups.length > 0 && <span className="text-xs font-normal text-slate-400">({filteredBackups.length}/{backups.length})</span>}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        {selectedIds.length > 0 && (
                                            <button onClick={() => setDeleteTarget('bulk')}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 border border-red-200">
                                                <Trash2 size={12} /> {t('admin.auto.k_delete_n','Delete')} {selectedIds.length} {t('admin.auto.k_items_label','item(s)')}
                                            </button>
                                        )}
                                        <button onClick={fetchBackups} className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1">
                                            <RefreshCw size={11} /> {t('admin.auto.k_refresh','Refresh')}
                                        </button>
                                    </div>
                                </div>
                                {/* Search + Filter row */}
                                <div className="flex flex-wrap gap-2">
                                    <div className="relative flex-1 min-w-[200px]">
                                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder={t('admin.auto.k_search_filename','Search by filename...')}
                                            value={searchTerm}
                                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                                        />
                                    </div>
                                    <select value={filterType} onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                                        <option value="all">{t('admin.auto.k_all_types','All types')}</option>
                                        <option value="manual">{t('admin.auto.k_manual','Manual')}</option>
                                        <option value="auto">{t('admin.auto.k_automatic','Automatic')}</option>
                                    </select>
                                    <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                                        <option value="all">{t('admin.auto.k_all_statuses','All statuses')}</option>
                                        <option value="success">{t('admin.auto.k_success','Success')}</option>
                                        <option value="failed">{t('admin.auto.k_failed','Failed')}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Pagination — trên đầu danh sách */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
                                    <span className="text-xs text-slate-500">
                                        {t('admin.auto.k_page_of','Page')} {currentPage}/{totalPages} — {filteredBackups.length} {t('admin.auto.k_backups_count','backup(s)')}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
                                            className="px-2 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white">«</button>
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}
                                            className="px-2 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white flex items-center gap-0.5">
                                            <ChevronLeft size={12} /> {t('admin.auto.k_prev','Prev')}
                                        </button>
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let page;
                                            if (totalPages <= 5) page = i + 1;
                                            else if (currentPage <= 3) page = i + 1;
                                            else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                                            else page = currentPage - 2 + i;
                                            return (
                                                <button key={page} onClick={() => setCurrentPage(page)}
                                                    className={`w-7 h-7 text-xs rounded-lg border font-medium transition-all ${currentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 hover:bg-white text-slate-600'}`}>
                                                    {page}
                                                </button>
                                            );
                                        })}
                                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}
                                            className="px-2 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white flex items-center gap-0.5">
                                            {t('admin.auto.k_next_page','Next')} <ChevronRight size={12} />
                                        </button>
                                        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
                                            className="px-2 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white">»</button>
                                    </div>
                                </div>
                            )}

                            {backups.length === 0 ? (
                                <div className="text-center py-12">
                                    <FileJson size={32} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-sm text-slate-400">{t('admin.auto.k_0ecf9437', 'No backups yet')}</p>
                                    <p className="text-xs text-slate-300 mt-1">{t('admin.auto.k_no_backup_hint','Click "Back up now" to create the first backup')}</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {pagedBackups.map(b => (
                                        <div key={b._id}>
                                            {/* Hàng chính */}
                                            <div className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {/* Checkbox */}
                                                    <input type="checkbox"
                                                        checked={selectedIds.includes(b._id)}
                                                        onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, b._id] : prev.filter(id => id !== b._id))}
                                                        className="w-3.5 h-3.5 rounded border-slate-300 accent-blue-600 flex-shrink-0"
                                                    />
                                                    {/* Icon trạng thái */}
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                        b.status === 'success' ? 'bg-green-100' :
                                                        b.status === 'failed' ? 'bg-red-100' : 'bg-amber-100'
                                                    }`}>
                                                        {b.status === 'success'
                                                            ? <CheckCircle size={16} className="text-green-600" />
                                                            : b.status === 'failed'
                                                            ? <XCircle size={16} className="text-red-500" />
                                                            : <Clock size={16} className="text-amber-600" />
                                                        }
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="text-sm font-semibold text-slate-700 truncate">{b.filename}</p>
                                                            {!b.fileExists && b.status === 'success' && (
                                                                <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-500 rounded-md font-medium">{t('admin.auto.k_file_deleted','File deleted')}</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {new Date(b.createdAt).toLocaleString('en-US')}
                                                            {' · '}
                                                            {b.type === 'manual' ? t('admin.auto.k_a794b260', 'Manual') : t('admin.auto.k_0d5a9071', 'Automatic')}
                                                            {' · '}
                                                            <span className="font-medium text-slate-500">{b.size}</span>
                                                            {b.stats?.totalDocuments > 0 && (
                                                                <> · {b.stats.totalDocuments.toLocaleString()} documents</>
                                                            )}
                                                            {b.triggeredBy?.fullName && (
                                                                <> · {t('admin.auto.k_by_label','by')} {b.triggeredBy.fullName}</>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                                    {/* Chi tiết */}
                                                    {b.stats?.collectionBreakdown && Object.keys(b.stats.collectionBreakdown).length > 0 && (
                                                        <button
                                                            onClick={() => setExpandedBackup(expandedBackup === b._id ? null : b._id)}
                                                            className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-slate-600 rounded-lg text-xs hover:bg-slate-100 transition-colors">
                                                            <Layers size={12} />
                                                            {expandedBackup === b._id ? t('admin.auto.k_hide','Hide') : t('admin.auto.k_details','Details')}
                                                        </button>
                                                    )}

                                                    {/* Tải về */}
                                                    {b.status === 'success' && b.fileExists && (
                                                        <button onClick={() => handleDownload(b)}
                                                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors">
                                                            <Download size={11} /> {t('admin.auto.k_download','Download')}
                                                        </button>
                                                    )}

                                                    {/* Khôi phục */}
                                                    {b.status === 'success' && (
                                                        <button
                                                            onClick={() => handleRestoreClick(b)}
                                                            disabled={restoring || loading}
                                                            className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-100 disabled:opacity-40 transition-colors">
                                                            <RotateCcw size={11} /> {t('admin.auto.k_682697e7', 'Khôi phục')}
                                                        </button>
                                                    )}

                                                    {/* Xóa */}
                                                    <button onClick={() => { setDeleteId(b._id); setDeleteTarget('single'); }}
                                                        className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                                                        <Trash2 size={11} />
                                                    </button>

                                                    {b.status === 'failed' && b.errorMessage && (
                                                        <span className="text-xs text-red-500 max-w-[160px] truncate" title={b.errorMessage}>
                                                            ⚠ {b.errorMessage}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Panel chi tiết collections */}
                                            {expandedBackup === b._id && b.stats?.collectionBreakdown && (
                                                <div className="px-5 pb-4 bg-slate-50 border-t border-slate-100">
                                                    <div className="pt-3">
                                                        <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                                                            <Info size={11} /> {t('admin.auto.k_backup_contents','Backup contents')} ({b.stats.totalCollections} collections, {b.stats.totalDocuments?.toLocaleString()} documents)
                                                        </p>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                                                            {Object.entries(b.stats.collectionBreakdown).map(([col, count]) => (
                                                                <div key={col} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5 border border-slate-200 text-xs">
                                                                    <span className="text-slate-600 font-medium truncate mr-2">{col}</span>
                                                                    <span className="text-blue-600 font-bold flex-shrink-0">{count.toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {b.checksum && (
                                                            <p className="text-xs text-slate-400 mt-2 font-mono">MD5: {b.checksum}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                                    <span className="text-xs text-slate-500">
                                        {t('admin.auto.k_page_of','Page')} {currentPage}/{totalPages} — {filteredBackups.length} {t('admin.auto.k_backups_count','backup(s)')}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
                                            className="px-2 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">«</button>
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}
                                            className="px-2 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-0.5">
                                            <ChevronLeft size={12} /> {t('admin.auto.k_prev','Prev')}
                                        </button>
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let page;
                                            if (totalPages <= 5) page = i + 1;
                                            else if (currentPage <= 3) page = i + 1;
                                            else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                                            else page = currentPage - 2 + i;
                                            return (
                                                <button key={page} onClick={() => setCurrentPage(page)}
                                                    className={`w-7 h-7 text-xs rounded-lg border font-medium transition-all ${currentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                                                    {page}
                                                </button>
                                            );
                                        })}
                                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}
                                            className="px-2 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-0.5">
                                            {t('admin.auto.k_next_page','Next')} <ChevronRight size={12} />
                                        </button>
                                        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
                                            className="px-2 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">»</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Ghi chú vị trí lưu file */}
                        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700">
                                {t('admin.auto.k_backup_note','Backup files are stored in the')} <code className="bg-blue-100 px-1 rounded font-mono">backend_server/backups/</code> {t('admin.auto.k_backup_note2','folder on the server. Each file is a full JSON snapshot of the database at the time of backup.')}
                            </p>
                        </div>
                    </div>
                )}

                {/* CF11.4 — Chính sách bảo mật */}
                {activeTab === 'security' && (
                    <div className="space-y-4">

                        {/* Header full width */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-5 text-white shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Shield size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{t('admin.auto.k_001d64e0', 'Security policy')}</h3>
                                    <p className="text-blue-100 text-xs mt-0.5">{t('admin.auto.k_config_pwd','Configure password requirements for the entire system')}</p>
                                </div>
                            </div>
                        </div>

                        {/* 2 cột ngang */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                            {/* Cột trái: Độ dài mật khẩu */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <Lock size={15} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">{t('admin.auto.k_pwd_length','Password length')}</p>
                                        <p className="text-xs text-slate-400">{t('admin.auto.k_min_chars','Minimum required characters')}</p>
                                    </div>
                                </div>

                                {/* Stepper */}
                                <div className="flex items-center justify-center gap-4 py-4">
                                    <button onClick={() => setPolicy({ ...policy, minPasswordLength: Math.max(6, (policy.minPasswordLength || 8) - 1) })}
                                        className="w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xl font-bold transition-colors flex items-center justify-center">−</button>
                                    <div className="text-center">
                                        <span className="text-4xl font-extrabold text-blue-600">{policy.minPasswordLength || 8}</span>
                                        <p className="text-xs text-slate-400 mt-1">{t('admin.auto.k_characters','characters')}</p>
                                    </div>
                                    <button onClick={() => setPolicy({ ...policy, minPasswordLength: Math.min(32, (policy.minPasswordLength || 8) + 1) })}
                                        className="w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xl font-bold transition-colors flex items-center justify-center">+</button>
                                </div>

                                {/* Slider */}
                                <div className="px-2 mt-2">
                                    <input type="range" min={6} max={32}
                                        className="w-full accent-blue-600"
                                        value={policy.minPasswordLength || 8}
                                        onChange={e => setPolicy({ ...policy, minPasswordLength: parseInt(e.target.value) })} />
                                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                                        <span>6</span><span>12</span><span>20</span><span>32</span>
                                    </div>
                                </div>

                                {/* Badge mức độ */}
                                <div className="mt-4 flex justify-center">
                                    <span className={`text-sm font-semibold px-4 py-1.5 rounded-full ${
                                        (policy.minPasswordLength || 8) >= 12 ? 'bg-green-100 text-green-700 border border-green-200' :
                                        (policy.minPasswordLength || 8) >= 8  ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                                                 'bg-red-100 text-red-600 border border-red-200'
                                    }`}>
                                        {(policy.minPasswordLength || 8) >= 12 ? t('admin.auto.k_strong','🔒 Strong') : (policy.minPasswordLength || 8) >= 8 ? t('admin.auto.k_medium','⚠️ Medium') : t('admin.auto.k_weak','❌ Weak')}
                                    </span>
                                </div>

                                {/* Gợi ý */}
                                <p className="text-xs text-slate-400 text-center mt-3">{t('admin.auto.k_pwd_hint','Minimum 8 characters recommended, ideally ≥ 12')}</p>
                            </div>

                            {/* Cột phải: Yêu cầu ký tự + Tóm tắt + Lưu */}
                            <div className="flex flex-col gap-4">

                                {/* Yêu cầu ký tự */}
                                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex-1">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                            <Shield size={15} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">{t('admin.auto.k_char_req','Character requirements')}</p>
                                            <p className="text-xs text-slate-400">{t('admin.auto.k_toggle_rules','Enable/disable mandatory rules')}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {[
                                            { key: 'requireSpecialChar', label: t('admin.auto.k_special_chars','Special characters'), desc: '!@#$%^&*...', icon: '✦' },
                                            { key: 'requireUppercase',   label: t('admin.auto.k_uppercase','Uppercase'),              desc: t('admin.auto.k_at_least_upper','At least 1 uppercase letter'), icon: 'A' },
                                            { key: 'requireNumber',      label: t('admin.auto.k_numbers','Numbers'),                  desc: t('admin.auto.k_at_least_num','At least 1 number'), icon: '1' }
                                        ].map(item => (
                                            <div key={item.key}
                                                onClick={() => setPolicy({ ...policy, [item.key]: !policy[item.key] })}
                                                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                                                    policy[item.key] ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                                }`}>
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                                                        policy[item.key] ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border border-slate-200'
                                                    }`}>{item.icon}</div>
                                                    <div>
                                                        <p className={`text-sm font-semibold leading-tight ${policy[item.key] ? 'text-blue-800' : 'text-slate-600'}`}>{item.label}</p>
                                                        <p className="text-xs text-slate-400">{item.desc}</p>
                                                    </div>
                                                </div>
                                                <div className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${policy[item.key] ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${policy[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tóm tắt & Lưu */}
                                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                                    <p className="text-xs font-semibold text-slate-500 mb-2.5 uppercase tracking-wide">{t('admin.auto.k_current_policy','Current policy')}</p>
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 font-medium">
                                            ≥ {policy.minPasswordLength || 8} {t('admin.auto.k_chars_label','characters')}
                                        </span>
                                        {policy.requireSpecialChar && <span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 font-medium">{t('admin.auto.k_special_check','Special chars ✓')}</span>}
                                        {policy.requireUppercase   && <span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 font-medium">{t('admin.auto.k_upper_check','Uppercase ✓')}</span>}
                                        {policy.requireNumber      && <span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 font-medium">{t('admin.auto.k_num_check','Numbers ✓')}</span>}
                                    </div>
                                    <button onClick={handleSavePolicy}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/30">
                                        <Save size={15} /> {t('admin.auto.k_76d501c1', 'Save policy')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminSystem;




