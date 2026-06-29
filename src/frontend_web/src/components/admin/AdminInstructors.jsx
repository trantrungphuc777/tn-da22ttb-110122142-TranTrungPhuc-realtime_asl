import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import { Plus, Search, Eye, Lock, Unlock, Key, Edit2, UserPlus, X, ChevronLeft, ChevronRight, Users, BookOpen, ArrowRight, GraduationCap as GraduationCapIcon, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PaginationBar from './PaginationBar';

const API       = 'http://localhost:5000/api/admin/instructors';
const CLASS_API = 'http://localhost:5000/api/admin/classes';

const AdminInstructors = () => {
    const { t } = useLanguage();
    const [instructors, setInstructors] = useState([]);
    const [pagination, setPagination]   = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState('');
    const [showAdd, setShowAdd]         = useState(false);
    const [showDetail, setShowDetail]   = useState(false);
    const [detail, setDetail]           = useState(null);
    const [showReset, setShowReset]     = useState(false);
    const [showEdit, setShowEdit]       = useState(false);
    const [showAssign, setShowAssign]   = useState(false);
    const [selected, setSelected]       = useState(null);
    const [resetPwd, setResetPwd]       = useState('');
    const [allClasses, setAllClasses]   = useState([]);
    const [assignClassId, setAssignClassId] = useState('');
    const [form, setForm]               = useState({ fullName: '', email: '', password: '' });
    const [editForm, setEditForm]       = useState({ fullName: '', email: '' });

    const token   = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchInstructors = async (page = 1) => {
        setLoading(true);
        try {
            const res = await axios.get(API, { headers, params: { page, limit: 20, search } });
            setInstructors(res.data.instructors || []);
            setPagination(res.data.pagination || {});
        } catch { toast.error(t('admin.auto.k_2fcdb90a', 'Không thể tải danh sách giảng viên!')); }
        finally { setLoading(false); }
    };

    const fetchDetail = async (id) => {
        try {
            const res = await axios.get(`${API}/${id}`, { headers });
            setDetail(res.data);
            setShowDetail(true);
        } catch { toast.error(t('admin.auto.k_da6d7f23', 'Không thể tải hồ sơ!')); }
    };

    const fetchClasses = async () => {
        try {
            const res = await axios.get(CLASS_API, { headers, params: { limit: 100 } });
            setAllClasses(res.data.classes || []);
        } catch {}
    };

    useEffect(() => { fetchInstructors(); fetchClasses(); }, [search]);

    // CF3.1 — Thêm giảng viên
    const handleAdd = async () => {
        if (!form.fullName || !form.email || !form.password) { toast.error(t('admin.auto.k_72bb22ae', 'Vui lòng nhập đầy đủ!')); return; }
        try {
            await axios.post(API, form, { headers });
            toast.success(t('admin.auto.k_4f0af49d', 'Đã tạo tài khoản giảng viên! Hệ thống đã ghi nhận thông tin đăng nhập.'));
            setShowAdd(false); setForm({ fullName: '', email: '', password: '' }); fetchInstructors();
        } catch (err) { toast.error(err.response?.data?.message || t('admin.auto.k_33a5e01f', 'Thao tác thất bại!')); }
    };

    // CF3.4 — Chỉnh sửa thông tin
    const handleEdit = async () => {
        if (!editForm.fullName || !editForm.email) { toast.error(t('admin.auto.k_72bb22ae', 'Vui lòng nhập đầy đủ!')); return; }
        try {
            await axios.put(`${API}/${selected._id}`, editForm, { headers });
            toast.success(t('admin.auto.k_5c524afd', 'Đã cập nhật thông tin giảng viên!'));
            setShowEdit(false); fetchInstructors(pagination.page);
        } catch (err) { toast.error(err.response?.data?.message || t('admin.auto.k_33a5e01f', 'Thao tác thất bại!')); }
    };

    const handleLock = async (id, isActive) => {
        if (!window.confirm(isActive ? t('admin.auto.k_7d2c2163', 'Khóa tài khoản giảng viên?') : t('admin.auto.k_e2d134dd', 'Mở khóa tài khoản?'))) return;
        try {
            await axios.put(`${API}/${id}/${isActive ? 'lock' : 'unlock'}`, {}, { headers });
            toast.success(isActive ? t('admin.auto.k_7c7bdcbd', 'Đã khóa!') : t('admin.auto.k_f18d2822', 'Đã mở khóa!')); fetchInstructors(pagination.page);
        } catch { toast.error(t('admin.auto.k_33a5e01f', 'Thao tác thất bại!')); }
    };

    const handleResetPassword = async () => {
        if (!resetPwd || resetPwd.length < 6) { toast.error(t('admin.auto.k_c5685d82', 'Mật khẩu phải ít nhất 6 ký tự!')); return; }
        try {
            await axios.put(`${API}/${selected._id}/reset-password`, { newPassword: resetPwd }, { headers });
            toast.success(t('admin.auto.k_3d219133', 'Đã đặt lại mật khẩu!')); setShowReset(false); setResetPwd('');
        } catch { toast.error(t('admin.auto.k_33a5e01f', 'Thao tác thất bại!')); }
    };

    // CF3.6 — Gán giảng viên vào lớp
    const handleAssignClass = async () => {
        if (!assignClassId) { toast.error(t('admin.auto.k_92608a4f', 'Vui lòng chọn lớp!')); return; }
        try {
            await axios.put(`${API}/${selected._id}/assign-class`, { classId: assignClassId }, { headers });
            toast.success(t('admin.auto.k_be92fba1', 'Đã gán giảng viên vào lớp!')); setShowAssign(false); setAssignClassId('');
            fetchInstructors(pagination.page);
        } catch (err) { toast.error(err.response?.data?.message || t('admin.auto.k_33a5e01f', 'Thao tác thất bại!')); }
    };

    return (
        <AdminLayout>
            <div className="space-y-5">
                {/* ── Hero Banner ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-500 p-5 shadow-xl">
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-300/20 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-emerald-300/15 rounded-full blur-[50px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    <GraduationCapIcon size={16} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight"> {t('admin.auto.k_0306c929', t('admin.auto.k_0306c929', 'Quản lý giảng viên'))} </h1>
                            </div>
                            <p className="text-emerald-100 text-sm"> {t('admin.auto.k_fa428be5', t('admin.auto.k_fa428be5', 'Quản lý tài khoản giảng viên, phân công lớp học và theo dõi hoạt động'))} </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {[
                                    { label: t('admin.auto.k_9010e03d', 'Tổng giảng viên'), val: pagination.total },
                                ].map((p, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs text-white font-medium">
                                        <span>{p.label}:</span><span className="font-bold">{p.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => setShowAdd(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-700 text-sm font-bold rounded-xl hover:bg-emerald-50 transition-all shadow-lg flex-shrink-0">
                            <UserPlus size={15} /> {t('admin.auto.k_1b1887b1', t('admin.auto.k_1b1887b1', 'Thêm giảng viên'))} </button>
                    </div>
                </div>

                <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                        placeholder={t('admin.auto.k_6453a4af', t('admin.auto.k_6453a4af', 'Tìm theo tên, email...'))} value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                {/* CF3.2 — Danh sách giảng viên */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    {/* Pagination đầu trang */}
                    <PaginationBar
                        page={pagination.page} pages={pagination.pages}
                        total={pagination.total} label={t('admin.auto.k_0b9b3843', t('admin.auto.k_0b9b3843', 'giảng viên'))}
                        onPage={(p) => fetchInstructors(p)} position="top"
                    />
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_d6418c37', t('admin.auto.k_d6418c37', 'Mã GV'))} </th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_39faf8ac', t('admin.auto.k_39faf8ac', 'Họ tên'))} </th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_0fbc27f5', t('admin.auto.k_0fbc27f5', 'Trạng thái'))} </th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_08407bd7', t('admin.auto.k_08407bd7', 'Số lớp'))} </th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_71d52075', t('admin.auto.k_71d52075', 'Thao tác'))} </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-12 text-slate-400"> {t('admin.auto.k_d5fe42f6', t('admin.auto.k_d5fe42f6', 'Đang tải...'))} </td></tr>
                                ) : instructors.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-12 text-slate-400"> {t('admin.auto.k_31d563e3', t('admin.auto.k_31d563e3', 'Không có giảng viên nào'))} </td></tr>
                                ) : instructors.map(inst => (
                                    <tr key={inst._id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{inst._id.slice(-6).toUpperCase()}</td>
                                        <td className="px-4 py-3 font-semibold text-slate-800">{inst.fullName}</td>
                                        <td className="px-4 py-3 text-slate-600">{inst.email}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${inst.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                {inst.isActive ? t('admin.auto.k_cbc72ecb', '● Hoạt động') : t('admin.auto.k_aaa125e6', '● Bị khóa')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-700">{inst.classCount || 0}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => fetchDetail(inst._id)} title={t('admin.auto.k_586b324c', t('admin.auto.k_586b324c', 'View hồ sơ'))}
                                                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Eye size={15} /></button>
                                                <button onClick={() => { setSelected(inst); setEditForm({ fullName: inst.fullName, email: inst.email }); setShowEdit(true); }} title={t('admin.auto.k_e1504e01', t('admin.auto.k_e1504e01', 'Chỉnh sửa'))}
                                                    className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-500"><Edit2 size={15} /></button>
                                                <button onClick={() => handleLock(inst._id, inst.isActive)} title={inst.isActive ? t('admin.auto.k_171aa70a', 'Khóa') : t('admin.auto.k_5bfc679e', 'Mở khóa')}
                                                    className={`p-1.5 rounded-lg ${inst.isActive ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-500'}`}>
                                                    {inst.isActive ? <Lock size={15} /> : <Unlock size={15} />}
                                                </button>
                                                <button onClick={() => { setSelected(inst); setShowReset(true); }} title={t('admin.auto.k_2896d317', t('admin.auto.k_2896d317', 'Đặt lại mật khẩu'))}
                                                    className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500"><Key size={15} /></button>
                                                <button onClick={() => { setSelected(inst); setAssignClassId(''); setShowAssign(true); }} title={t('admin.auto.k_f09a2ff3', 'Phân công lớp')}
                                                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500"><ArrowRight size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <PaginationBar
                        page={pagination.page} pages={pagination.pages}
                        total={pagination.total} label={t('admin.auto.k_0b9b3843', t('admin.auto.k_0b9b3843', 'giảng viên'))}
                        onPage={(p) => fetchInstructors(p)} position="bottom"
                    />
                </div>
            </div>

            {/* CF3.1 — Modal thêm giảng viên */}
            {showAdd && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-black text-slate-800 text-lg"> {t('admin.auto.k_df3a8174', t('admin.auto.k_df3a8174', 'Thêm giảng viên mới'))} </h2>
                            <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: t('admin.auto.k_39faf8ac', 'Họ tên'), key: 'fullName', type: 'text', placeholder: t('admin.auto.k_756f9298', 'Nhập họ tên giảng viên') },
                                { label: 'Email', key: 'email', type: 'email', placeholder: t('admin.auto.k_9b3c16d5', 'Nhập email') },
                                { label: t('admin.auto.k_f64cb8ca', 'Mật khẩu khởi tạo'), key: 'password', type: 'password', placeholder: t('admin.auto.k_6ebf90b9', 'Ít nhất 6 ký tự') }
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">{f.label}</label>
                                    <input type={f.type} placeholder={f.placeholder}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                        value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-3"> {t('admin.auto.k_fd349b2c', t('admin.auto.k_fd349b2c', 'Hệ thống sẽ tạo tài khoản và gán quyền Giảng viên tự động.'))} </p>
                        <div className="flex gap-2 mt-5">
                            <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold"> {t('admin.auto.k_1e405035', t('admin.auto.k_1e405035', 'Hủy'))} </button>
                            <button onClick={handleAdd} className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700"> {t('admin.auto.k_491cc7fc', t('admin.auto.k_491cc7fc', 'Tạo tài khoản'))} </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CF3.4 — Modal chỉnh sửa thông tin */}
            {showEdit && selected && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowEdit(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-black text-slate-800 text-lg"> {t('admin.auto.k_91ebf50c', t('admin.auto.k_91ebf50c', 'Chỉnh sửa thông tin'))} </h2>
                            <button onClick={() => setShowEdit(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1"> {t('admin.auto.k_39faf8ac', t('admin.auto.k_39faf8ac', 'Họ tên'))} </label>
                                <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                    value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                                <input type="email" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                    value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-5">
                            <button onClick={() => setShowEdit(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold"> {t('admin.auto.k_1e405035', t('admin.auto.k_1e405035', 'Hủy'))} </button>
                            <button onClick={handleEdit} className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700"> {t('admin.auto.k_0dc3cc51', t('admin.auto.k_0dc3cc51', 'Lưu thay đổi'))} </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CF3.3 + CF3.5 — Modal hồ sơ + theo dõi hoạt động */}
            {showDetail && detail && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="font-black text-slate-800 text-lg">{detail.instructor?.fullName}</h2>
                            <p className="text-sm text-slate-500">{detail.instructor?.email}</p>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* CF3.3 — Thống kê */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: t('admin.auto.k_08407bd7', 'Số lớp'),          value: detail.stats?.classCount || 0,      color: 'text-violet-600' },
                                    { label: t('admin.auto.k_1b83df7a', 'Học viên'),        value: detail.stats?.studentCount || 0,    color: 'text-blue-600' },
                                    { label: t('admin.auto.k_533a8175', 'Bài tập đã giao'), value: detail.stats?.assignmentCount || 0, color: 'text-emerald-600' },
                                    { label: t('admin.auto.k_c9fe5481', 'Bài kiểm tra'),    value: detail.stats?.examCount || 0,       color: 'text-amber-600' }
                                ].map((item, i) => (
                                    <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                                        <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                            {/* CF3.3 — Danh sách lớp học */}
                            <div>
                                <h3 className="font-bold text-slate-700 mb-2 text-sm uppercase tracking-wide"> {t('admin.auto.k_9adc3be5', t('admin.auto.k_9adc3be5', 'Danh sách lớp học'))} </h3>
                                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                    {(detail.classes || []).map(cls => (
                                        <div key={cls._id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-sm">
                                            <span className="font-medium text-slate-700">{cls.name}</span>
                                            <span className="text-xs text-slate-500">{cls.level}</span>
                                        </div>
                                    ))}
                                    {(!detail.classes || detail.classes.length === 0) && <p className="text-sm text-slate-400"> {t('admin.auto.k_ed665bd2', t('admin.auto.k_ed665bd2', 'Chưa có lớp'))} </p>}
                                </div>
                            </div>
                            {/* CF3.3 — Danh sách học viên phụ trách */}
                            <div>
                                <h3 className="font-bold text-slate-700 mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
                                    <Users size={13} />{t('admin.auto.k_students_incharge', 'Students in charge')} ({detail.students?.length || 0})
                                </h3>
                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                    {(detail.students || []).map(s => (
                                        <div key={s._id} className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg text-sm">
                                            <span className="font-medium text-slate-700">{s.fullName}</span>
                                            <span className="text-xs text-slate-500">{s.email}</span>
                                        </div>
                                    ))}
                                    {(!detail.students || detail.students.length === 0) && <p className="text-sm text-slate-400"> {t('admin.auto.k_9f1d2245', t('admin.auto.k_9f1d2245', 'Chưa có học viên phụ trách'))} </p>}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setShowDetail(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold"> {t('admin.auto.k_f63d1e47', t('admin.auto.k_f63d1e47', 'Đóng'))} </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CF3.6 — Modal phân công lớp */}
            {showAssign && selected && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAssign(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-black text-slate-800"> {t('admin.auto.k_7e9c0e8a', t('admin.auto.k_7e9c0e8a', 'Phân công lớp học'))} </h2>
                            <button onClick={() => setShowAssign(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
                        </div>
                        <p className="text-sm text-slate-500 mb-4"> {t('admin.auto.k_a4e1dcdd', t('admin.auto.k_a4e1dcdd', 'Giảng viên:'))} <span className="font-semibold">{selected.fullName}</span></p>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1"> {t('admin.auto.k_d99c5b94', t('admin.auto.k_d99c5b94', 'Chọn lớp để gán'))} </label>
                            <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                value={assignClassId} onChange={e => setAssignClassId(e.target.value)}>
                                <option value=""> {t('admin.auto.k_07640d86', t('admin.auto.k_07640d86', '-- Chọn lớp --'))} </option>
                                {allClasses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2 mt-5">
                            <button onClick={() => setShowAssign(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold"> {t('admin.auto.k_1e405035', t('admin.auto.k_1e405035', 'Hủy'))} </button>
                            <button onClick={handleAssignClass} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700"> {t('admin.auto.k_10c2e61c', t('admin.auto.k_10c2e61c', 'Gán lớp'))} </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal reset password */}
            {showReset && selected && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowReset(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <h2 className="font-black text-slate-800 mb-1"> {t('admin.auto.k_2896d317', t('admin.auto.k_2896d317', 'Đặt lại mật khẩu'))} </h2>
                        <p className="text-sm text-slate-500 mb-4"> {t('admin.auto.k_a4e1dcdd', t('admin.auto.k_a4e1dcdd', 'Giảng viên:'))} <span className="font-semibold">{selected.fullName}</span></p>
                        <input type="password" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 mb-4"
                            placeholder={t('admin.auto.k_fec6d804', t('admin.auto.k_fec6d804', 'Mật khẩu mới (ít nhất 6 ký tự)'))} value={resetPwd} onChange={e => setResetPwd(e.target.value)} />
                        <div className="flex gap-2">
                            <button onClick={() => setShowReset(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold"> {t('admin.auto.k_1e405035', t('admin.auto.k_1e405035', 'Hủy'))} </button>
                            <button onClick={handleResetPassword} className="flex-1 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700"> {t('admin.auto.k_1e2eb2de', t('admin.auto.k_1e2eb2de', 'Xác nhận'))} </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminInstructors;
