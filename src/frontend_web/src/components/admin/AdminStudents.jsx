import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import { Search, Eye, Lock, Unlock, Key, Trash2, ChevronLeft, ChevronRight, AlertCircle, Filter, X, Users, RefreshCw, DatabaseZap, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PaginationBar from './PaginationBar';

const API      = 'http://localhost:5000/api/admin/students';
const CLASS_API = 'http://localhost:5000/api/admin/classes';

const StatusBadge = ({ isActive }) => {
    const { t } = useLanguage();
    return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
        {isActive ? t('admin.auto.k_cbc72ecb', '● Hoạt động') : t('admin.auto.k_aaa125e6', '● Bị khóa')}
    </span>
    )
};

const AdminStudents = () => {
    const { t } = useLanguage();
    const [students, setStudents]     = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    // CF2.2 — lọc theo lớp, trạng thái, thời gian đăng ký
    const [filterStatus, setFilterStatus]     = useState('');
    const [filterClassId, setFilterClassId]   = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate]   = useState('');
    const [classes, setClasses]       = useState([]);
    const [showDetail, setShowDetail] = useState(false);
    const [detail, setDetail]         = useState(null);
    const [selected, setSelected]     = useState(null);
    const [resetPwd, setResetPwd]     = useState('');
    const [showResetModal, setShowResetModal] = useState(false);
    const [syncing, setSyncing]       = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ fullName: '', email: '', password: '', classId: '' });
    const [creating, setCreating]     = useState(false);

    const token   = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    // Lấy danh sách lớp để dropdown lọc
    const fetchClasses = async () => {
        try {
            const res = await axios.get(CLASS_API, { headers, params: { limit: 100 } });
            setClasses(res.data.classes || []);
        } catch {}
    };

    const fetchStudents = async (page = 1) => {
        setLoading(true);
        try {
            const res = await axios.get(API, {
                headers,
                params: {
                    page, limit: 20, search,
                    status:    filterStatus,
                    classId:   filterClassId,
                    startDate: filterStartDate,
                    endDate:   filterEndDate
                }
            });
            setStudents(res.data.students || []);
            setPagination(res.data.pagination || {});
        } catch {
            toast.error(t('admin.auto.k_c1893186', 'Không thể tải danh sách học viên!'));
        } finally {
            setLoading(false);
        }
    };

    const fetchDetail = async (id) => {
        try {
            const res = await axios.get(`${API}/${id}`, { headers });
            setDetail(res.data);
            setShowDetail(true);
        } catch {
            toast.error(t('admin.auto.k_252b4d45', 'Không thể tải hồ sơ học viên!'));
        }
    };

    useEffect(() => { fetchClasses(); }, []);
    useEffect(() => { fetchStudents(); }, [search, filterStatus, filterClassId, filterStartDate, filterEndDate]);

    const handleLock = async (id, isActive) => {
        if (!window.confirm(isActive ? t('admin.auto.k_651e6b36', 'Khóa tài khoản này?') : t('admin.auto.k_4c0ab686', 'Mở khóa tài khoản này?'))) return;
        try {
            await axios.put(`${API}/${id}/${isActive ? 'lock' : 'unlock'}`, {}, { headers });
            toast.success(isActive ? t('admin.auto.k_016211d0', 'Đã khóa tài khoản!') : t('admin.auto.k_24732440', 'Đã mở khóa tài khoản!'));
            fetchStudents(pagination.page);
        } catch {
            toast.error(t('admin.auto.k_33a5e01f', 'Thao tác thất bại!'));
        }
    };

    const handleResetPassword = async () => {
        if (!resetPwd || resetPwd.length < 6) { toast.error(t('admin.auto.k_c5685d82', 'Mật khẩu phải ít nhất 6 ký tự!')); return; }
        try {
            await axios.put(`${API}/${selected._id}/reset-password`, { newPassword: resetPwd }, { headers });
            toast.success(t('admin.auto.k_3d219133', 'Đã đặt lại mật khẩu!'));
            setShowResetModal(false); setResetPwd('');
        } catch {
            toast.error(t('admin.auto.k_33a5e01f', 'Thao tác thất bại!'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('admin.auto.k_2f916d77', 'Xóa vĩnh viễn tài khoản này? Hành động không thể hoàn tác!'))) return;
        try {
            await axios.delete(`${API}/${id}`, { headers });
            toast.success(t('admin.auto.k_bac600e7', 'Đã xóa tài khoản!'));
            fetchStudents(pagination.page);
        } catch {
            toast.error(t('admin.auto.k_33a5e01f', 'Thao tác thất bại!'));
        }
    };

    const clearFilters = () => {
        setSearch(''); setFilterStatus(''); setFilterClassId('');
        setFilterStartDate(''); setFilterEndDate('');
    };

    const handleSyncAllStats = async () => {
        if (!window.confirm(`Sync real stats from submission data for ALL ${pagination.total} students?\n\nThis will remove seed data and replace with real data.`)) return;
        setSyncing(true);
        try {
            const res = await axios.post(`${API}/sync-stats`, {}, { headers });
            toast.success(`✅ Synced ${res.data.updated}/${res.data.total} students successfully!`);
            fetchStudents(pagination.page);
        } catch {
            toast.error(t('admin.auto.k_1a2f4480', 'Sync thất bại, vui lòng thử lại!'));
        } finally {
            setSyncing(false);
        }
    };

    const handleCreate = async () => {
        if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.password.trim()) {
            toast.error(t('admin.auto.k_c5685d82', 'Vui lòng điền đầy đủ thông tin!'));
            return;
        }
        if (createForm.password.length < 6) {
            toast.error(t('admin.auto.k_c5685d82', 'Mật khẩu phải ít nhất 6 ký tự!'));
            return;
        }
        setCreating(true);
        try {
            // Bước 1: Tạo học viên
            const res = await axios.post(API, {
                fullName: createForm.fullName,
                email: createForm.email,
                password: createForm.password
            }, { headers });

            // Bước 2: Nếu chọn lớp thì phân vào lớp luôn
            if (createForm.classId && res.data.student?._id) {
                await axios.post(
                    `${CLASS_API}/${createForm.classId}/students`,
                    { studentId: res.data.student._id },
                    { headers }
                );
                toast.success('Đã tạo học viên và phân vào lớp thành công!');
            } else {
                toast.success(t('admin.auto.k_a035a2b3', 'Đã tạo học viên mới!'));
            }

            setShowCreateModal(false);
            setCreateForm({ fullName: '', email: '', password: '', classId: '' });
            fetchStudents(1);
        } catch (err) {
            toast.error(err.response?.data?.message || t('admin.auto.k_33a5e01f', 'Thao tác thất bại!'));
        } finally {
            setCreating(false);
        }
    };

    const hasFilter = search || filterStatus || filterClassId || filterStartDate || filterEndDate;

    return (
        <AdminLayout>
            <div className="space-y-5">
                {/* ── Hero Banner ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-500 p-5 shadow-xl">
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-sky-300/20 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-blue-300/15 rounded-full blur-[50px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    <Users size={16} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight"> {t('admin.auto.k_6241294a', t('admin.auto.k_6241294a', 'Quản lý học viên'))} </h1>
                            </div>
                            <p className="text-blue-100 text-sm"> {t('admin.auto.k_9dac1ddb', t('admin.auto.k_9dac1ddb', 'Quản lý tài khoản, theo dõi tiến độ và phân lớp học viên'))} </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {[
                                    { label: t('admin.auto.k_cc21a093', 'Tổng học viên'), val: pagination.total },
                                ].map((p, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs text-white font-medium">
                                        <span>{p.label}:</span><span className="font-bold">{p.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg">
                                <UserPlus size={15} /> {t('admin.auto.k_create_student', '') || 'Tạo học viên'}
                            </button>
                            <button onClick={() => fetchStudents()}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 border border-white/30 text-white text-sm font-bold rounded-xl hover:bg-white/30 transition-all shadow-lg">
                                <RefreshCw size={15} /> {t('admin.auto.k_4d20363e', 'Làm mới')}
                            </button>
                            <button onClick={handleSyncAllStats} disabled={syncing}
                                className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 text-amber-900 text-sm font-bold rounded-xl hover:bg-amber-300 transition-all shadow-lg disabled:opacity-60">
                                <DatabaseZap size={15} />{syncing ? t('admin.auto.k_c7872beb', 'Đang sync...') : 'Sync Stats'}
                            </button>
                        </div>                    </div>
                </div>

                {/* CF2.2 — Tìm kiếm và lọc */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                        <Filter size={14} className="text-violet-500" />{t('admin.auto.k_search_filter', 'Search & Filter')}
                        {hasFilter && (
                            <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
                                <X size={12} /> {t('admin.auto.k_a12048e0', t('admin.auto.k_a12048e0', 'Xóa bộ lọc'))} </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {/* Tìm kiếm theo tên/email/mã */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                                placeholder={t('admin.auto.k_3f5b4bc0', t('admin.auto.k_3f5b4bc0', 'Tìm theo tên, email, mã học viên...'))}
                                value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        {/* Lọc theo lớp */}
                        <select className="w-44 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                            value={filterClassId} onChange={e => setFilterClassId(e.target.value)}>
                            <option value=""> {t('admin.auto.k_addc984b', t('admin.auto.k_addc984b', 'Tất cả lớp học'))} </option>
                            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        {/* Lọc theo trạng thái */}
                        <select className="w-44 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value=""> {t('admin.auto.k_fd1c3a01', t('admin.auto.k_fd1c3a01', 'Tất cả trạng thái'))} </option>
                            <option value="active"> {t('admin.auto.k_cfaecd87', t('admin.auto.k_cfaecd87', 'Đang hoạt động'))} </option>
                            <option value="locked"> {t('admin.auto.k_fce0d83b', t('admin.auto.k_fce0d83b', 'Bị khóa'))} </option>
                        </select>
                        {/* Lọc theo thời gian đăng ký */}
                        <input type="date" title={t('admin.auto.k_47ab27a2', t('admin.auto.k_47ab27a2', 'Từ ngày'))}
                            className="w-40 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                            value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
                        <input type="date" title={t('admin.auto.k_89efbae6', t('admin.auto.k_89efbae6', 'Đến ngày'))}
                            className="w-40 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                            value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
                    </div>
                </div>

                {/* CF2.1 — Bảng danh sách 8 cột */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    {/* Pagination đầu trang */}
                    <PaginationBar
                        page={pagination.page} pages={pagination.pages}
                        total={pagination.total} label={t('admin.auto.k_16c14076', t('admin.auto.k_16c14076', 'học viên'))}
                        onPage={(p) => fetchStudents(p)} position="top"
                    />
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap"> {t('admin.auto.k_3493e420', t('admin.auto.k_3493e420', 'Mã HV'))} </th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap"> {t('admin.auto.k_39faf8ac', t('admin.auto.k_39faf8ac', 'Họ tên'))} </th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Email</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap"> {t('admin.auto.k_ee0a050e', t('admin.auto.k_ee0a050e', 'Lớp học'))} </th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap"> {t('admin.auto.k_a469290c', t('admin.auto.k_a469290c', 'Ngày đăng ký'))} </th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap"> {t('admin.auto.k_0fbc27f5', t('admin.auto.k_0fbc27f5', 'Trạng thái'))} </th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap"> {t('admin.auto.k_9afc4a82', t('admin.auto.k_9afc4a82', 'Tiến độ'))} </th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap"> {t('admin.auto.k_74dd5d08', t('admin.auto.k_74dd5d08', 'Điểm TB'))} </th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap"> {t('admin.auto.k_71d52075', t('admin.auto.k_71d52075', 'Thao tác'))} </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={9} className="text-center py-12 text-slate-400"> {t('admin.auto.k_d5fe42f6', t('admin.auto.k_d5fe42f6', 'Đang tải...'))} </td></tr>
                                ) : students.length === 0 ? (
                                    <tr><td colSpan={9} className="text-center py-12 text-slate-400"> {t('admin.auto.k_43a54a3d', t('admin.auto.k_43a54a3d', 'Không có học viên nào'))} </td></tr>
                                ) : students.map(s => (
                                    <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{s._id.slice(-6).toUpperCase()}</td>
                                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{s.fullName}</td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{s.email}</td>
                                        <td className="px-4 py-3 text-slate-500 max-w-[140px] truncate">{s.classIds?.map(c => c.name).join(', ') || '—'}</td>
                                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString('vi-VN')}</td>
                                        <td className="px-4 py-3 whitespace-nowrap"><StatusBadge isActive={s.isActive} /></td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-slate-100 rounded-full h-1.5">
                                                    <div className="bg-violet-500 h-1.5 rounded-full"
                                                        style={{ width: `${Math.min((s.studentStats?.totalAssignmentsCompleted || 0) * 5, 100)}%` }} />
                                                </div>
                                                <span className="text-xs text-slate-500">{s.studentStats?.totalAssignmentsCompleted || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">{(s.studentStats?.averageScore || 0).toFixed(1)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => fetchDetail(s._id)} title={t('admin.auto.k_586b324c', t('admin.auto.k_586b324c', 'View hồ sơ'))}
                                                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"><Eye size={15} /></button>
                                                <button onClick={() => handleLock(s._id, s.isActive)} title={s.isActive ? t('admin.auto.k_171aa70a', 'Khóa') : t('admin.auto.k_5bfc679e', 'Mở khóa')}
                                                    className={`p-1.5 rounded-lg transition-colors ${s.isActive ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-500'}`}>
                                                    {s.isActive ? <Lock size={15} /> : <Unlock size={15} />}
                                                </button>
                                                <button onClick={() => { setSelected(s); setShowResetModal(true); }} title={t('admin.auto.k_2896d317', t('admin.auto.k_2896d317', 'Đặt lại mật khẩu'))}
                                                    className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition-colors"><Key size={15} /></button>
                                                <button onClick={() => handleDelete(s._id)} title={t('admin.auto.k_7d4ff009', t('admin.auto.k_7d4ff009', 'Xóa tài khoản'))}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <PaginationBar
                        page={pagination.page} pages={pagination.pages}
                        total={pagination.total} label={t('admin.auto.k_16c14076', t('admin.auto.k_16c14076', 'học viên'))}
                        onPage={(p) => fetchStudents(p)} position="bottom"
                    />
                </div>
            </div>

            {/* CF2.3 + CF2.4 — Modal hồ sơ học viên */}
            {showDetail && detail && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center text-white font-black text-lg">
                                    {(detail.student?.fullName || 'U').charAt(0)}
                                </div>
                                <div>
                                    <h2 className="font-black text-slate-800 text-lg">{detail.student?.fullName}</h2>
                                    <p className="text-sm text-slate-500">{detail.student?.email}</p>
                                    <p className="text-xs text-slate-400">{t('admin.auto.k_account_created', 'Account created')}: {new Date(detail.student?.createdAt).toLocaleDateString('vi-VN')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* CF2.3 — Thông tin học tập */}
                            <div>
                                <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide"> {t('admin.auto.k_7be37bcf', t('admin.auto.k_7be37bcf', 'Thông tin học tập'))} </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[
                                        { label: t('admin.auto.k_26c51fad', 'Tổng bài đã làm'),    value: detail.submissions?.length || 0 },
                                        { label: t('admin.auto.k_d0845351', 'Bài hoàn thành'),     value: detail.submissions?.filter(s => ['completed','graded'].includes(s.status)).length || 0 },
                                        { label: t('admin.auto.k_4bf3eb4c', 'Điểm trung bình'),    value: (detail.student?.studentStats?.averageScore || 0).toFixed(1) },
                                        { label: t('admin.auto.k_88d49de8', 'Tỷ lệ chính xác'),   value: `${(detail.student?.studentStats?.averageAccuracy || 0).toFixed(1)}%` },
                                        { label: t('admin.auto.k_11d37617', 'Thời gian thực hành'), value: `${detail.student?.studentStats?.totalPracticeTime || 0} min` },
                                        { label: t('admin.auto.k_39b11a0d', 'Ngày tạo TK'),        value: new Date(detail.student?.createdAt).toLocaleDateString('vi-VN') }
                                    ].map((item, i) => (
                                        <div key={i} className="bg-slate-50 rounded-xl p-3">
                                            <p className="text-xs text-slate-500">{item.label}</p>
                                            <p className="font-bold text-slate-800 mt-0.5">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CF2.4 — Lịch sử học tập */}
                            <div>
                                <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide"> {t('admin.auto.k_6e485adb', t('admin.auto.k_6e485adb', 'Lịch sử học tập'))} </h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {detail.submissions?.slice(0, 15).map((sub, i) => (
                                        <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-sm">
                                            <span className="text-slate-700 font-medium truncate max-w-[200px]">
                                                {sub.assignmentId?.title || sub.examId?.title || t('admin.auto.k_169fa56a', 'Bài thực hành')}
                                            </span>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="font-bold text-violet-600">{sub.score ?? '—'} {t('admin.auto.k_pts_unit', 'pts')}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${sub.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {sub.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!detail.submissions || detail.submissions.length === 0) && (
                                        <p className="text-sm text-slate-400 text-center py-4"> {t('admin.auto.k_03d58f64', t('admin.auto.k_03d58f64', 'Chưa có lịch sử'))} </p>
                                    )}
                                </div>
                            </div>

                            {/* CF2.4 — Lịch sử đăng nhập */}
                            <div>
                                <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide"> {t('admin.auto.k_cbf58baa', t('admin.auto.k_cbf58baa', 'Lịch sử đăng nhập'))} </h3>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {(detail.loginHistory || []).length > 0
                                        ? detail.loginHistory.map((log, i) => (
                                            <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs">
                                                <span className="text-slate-600">{new Date(log.loginAt).toLocaleString()}</span>
                                                <span className="text-slate-400">{log.ip || 'N/A'}</span>
                                            </div>
                                        ))
                                        : <p className="text-sm text-slate-400 text-center py-3 bg-slate-50 rounded-xl"> {t('admin.auto.k_b83413e7', t('admin.auto.k_b83413e7', 'Chưa có dữ liệu lịch sử đăng nhập'))} </p>
                                    }
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setShowDetail(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200"> {t('admin.auto.k_f63d1e47', t('admin.auto.k_f63d1e47', 'Đóng'))} </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal tạo học viên mới */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                <UserPlus size={18} className="text-blue-600" />
                            </div>
                            <div>
                                <h2 className="font-black text-slate-800 text-lg">Tạo học viên mới</h2>
                                <p className="text-xs text-slate-400">Thêm tài khoản học viên vào hệ thống</p>
                            </div>
                        </div>
                        <div className="space-y-3 mb-5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('admin.auto.k_623825de', 'Họ và tên')} <span className="text-red-500">*</span></label>
                                <input
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                    placeholder="Nguyễn Văn A"
                                    value={createForm.fullName}
                                    onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Email <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                    placeholder="hocvien@example.com"
                                    value={createForm.email}
                                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Mật khẩu <span className="text-red-500">*</span></label>
                                <input
                                    type="password"
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                    placeholder={t('admin.auto.k_c5685d82', 'Ít nhất 6 ký tự')}
                                    value={createForm.password}
                                    onChange={e => setCreateForm({ ...createForm, password: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Lớp học <span className="text-slate-400 font-normal">(Không bắt buộc)</span></label>
                                <select
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                    value={createForm.classId}
                                    onChange={e => setCreateForm({ ...createForm, classId: e.target.value })}>
                                    <option value="">-- Chưa phân lớp --</option>
                                    {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                                <p className="text-xs text-slate-400 mt-1">Có thể phân lớp sau trong quản lý lớp học</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { setShowCreateModal(false); setCreateForm({ fullName: '', email: '', password: '', classId: '' }); }}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
                                {t('admin.auto.k_1e405035', 'Hủy')}
                            </button>
                            <button onClick={handleCreate} disabled={creating}
                                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                                {creating ? <><RefreshCw size={14} className="animate-spin" /> Đang lưu...</> : <><UserPlus size={14} /> Tạo học viên</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CF2.5 — Modal đặt lại mật khẩu */}
            {showResetModal && selected && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowResetModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <h2 className="font-black text-slate-800 mb-1"> {t('admin.auto.k_2896d317', t('admin.auto.k_2896d317', 'Đặt lại mật khẩu'))} </h2>
                        <p className="text-sm text-slate-500 mb-4"> {t('admin.auto.k_7e880e0e', t('admin.auto.k_7e880e0e', 'Học viên:'))} <span className="font-semibold">{selected.fullName}</span></p>
                        <input type="password"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 mb-4"
                            placeholder={t('admin.auto.k_fec6d804', t('admin.auto.k_fec6d804', 'Mật khẩu mới (ít nhất 6 ký tự)'))}
                            value={resetPwd} onChange={e => setResetPwd(e.target.value)} />
                        <div className="flex gap-2">
                            <button onClick={() => setShowResetModal(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold"> {t('admin.auto.k_1e405035', t('admin.auto.k_1e405035', 'Hủy'))} </button>
                            <button onClick={handleResetPassword} className="flex-1 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700"> {t('admin.auto.k_1e2eb2de', t('admin.auto.k_1e2eb2de', 'Xác nhận'))} </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminStudents;
