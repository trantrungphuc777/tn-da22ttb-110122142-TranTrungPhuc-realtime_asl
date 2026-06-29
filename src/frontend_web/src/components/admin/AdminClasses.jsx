import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import {
    Plus, Search, Eye, Trash2, Users, X,
    UserPlus, UserMinus, ArrowRight, GraduationCap,
    Pencil, BookOpen as BookOpenIcon, RefreshCw, Filter,
    Copy, CheckCheck, BarChart2, Mail, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PaginationBar from './PaginationBar';

const API      = 'http://localhost:5000/api/admin/classes';
const INST_API = 'http://localhost:5000/api/admin/instructors';
const STU_API  = 'http://localhost:5000/api/admin/students';

const AdminClasses = () => {
    const { t } = useLanguage();

    // ── State ──────────────────────────────────────────────────────────────
    const [classes, setClasses]         = useState([]);
    const [pagination, setPagination]   = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState('');
    const [filterLevel, setFilterLevel] = useState('');

    const [showAdd, setShowAdd]         = useState(false);
    const [showDetail, setShowDetail]   = useState(false);
    const [detail, setDetail]           = useState(null);
    const [showEdit, setShowEdit]       = useState(false);
    const [editTarget, setEditTarget]   = useState(null);
    const [editForm, setEditForm]       = useState({ name: '', description: '', instructorId: '', level: 'beginner' });

    const [instructors, setInstructors] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [allClasses, setAllClasses]   = useState([]);
    const [form, setForm]               = useState({ name: '', description: '', instructorId: '', level: 'beginner' });

    const [addStudentId, setAddStudentId]           = useState('');
    const [transferStudentId, setTransferStudentId] = useState('');
    const [transferTargetClass, setTransferTargetClass] = useState('');
    const [newInstructorId, setNewInstructorId]     = useState('');
    const [showTransfer, setShowTransfer]           = useState(false);
    const [showChangeInst, setShowChangeInst]       = useState(false);
    const [transferStudent, setTransferStudent]     = useState(null);

    // State cho modal chi tiết nâng cao
    const [studentSearch, setStudentSearch]         = useState('');
    const [addStudentSearch, setAddStudentSearch]   = useState('');
    const [selectedStudents, setSelectedStudents]   = useState([]);
    const [sortStudentBy, setSortStudentBy]         = useState('name'); // name | score
    const [sortDir, setSortDir]                     = useState('asc');

    const token   = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    // ── Helpers ────────────────────────────────────────────────────────────
    const levelLabel = {
        beginner:     t('admin.auto.k_5d36b694', 'Cơ bản'),
        intermediate: t('admin.auto.k_5038ce12', 'Trung cấp'),
        advanced:     t('admin.auto.k_c7166341', 'Nâng cao'),
    };
    const levelColor = {
        beginner:     'bg-green-100 text-green-700',
        intermediate: 'bg-blue-100 text-blue-700',
        advanced:     'bg-purple-100 text-purple-700',
    };
    const hasFilter = search || filterLevel;

    // ── Data fetching ──────────────────────────────────────────────────────
    const fetchClasses = async (page = 1, levelOverride) => {
        setLoading(true);
        const levelParam = levelOverride !== undefined ? levelOverride : filterLevel;
        try {
            const res = await axios.get(API, {
                headers,
                params: { page, limit: 20, search, level: levelParam || undefined }
            });
            setClasses(res.data.classes || []);
            setPagination(res.data.pagination || {});
        } catch {
            toast.error(t('admin.auto.k_52f835c6', 'Không thể tải danh sách lớp!'));
        } finally {
            setLoading(false);
        }
    };

    const fetchInstructors = async () => {
        try {
            const res = await axios.get(INST_API, { headers, params: { limit: 100 } });
            setInstructors(res.data.instructors || []);
        } catch {}
    };

    const fetchAllStudents = async () => {
        try {
            const res = await axios.get(STU_API, { headers, params: { limit: 200 } });
            setAllStudents(res.data.students || []);
        } catch {}
    };

    const fetchDetail = async (id) => {
        try {
            const res = await axios.get(`${API}/${id}`, { headers });
            setDetail(res.data);
            setShowDetail(true);
            const r2 = await axios.get(API, { headers, params: { limit: 100 } });
            setAllClasses((r2.data.classes || []).filter(c => c._id !== id));
        } catch {
            toast.error(t('admin.auto.k_49384686', 'Không thể tải chi tiết lớp!'));
        }
    };

    useEffect(() => { fetchClasses(1, filterLevel); fetchInstructors(); fetchAllStudents(); }, [search, filterLevel]);

    const clearFilters = () => {
        setSearch('');
        setFilterLevel('');
        fetchClasses(1, '');
    };

    // Computed: filter classes ở frontend để chắc chắn hoạt động
    const displayedClasses = useMemo(() => {
        return classes.filter(cls => {
            if (filterLevel && cls.level !== filterLevel) return false;
            if (search && !cls.name?.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [classes, filterLevel, search]);

    // Computed: danh sách học viên trong lớp sau khi lọc + sort
    const filteredClassStudents = useMemo(() => {
        const list = detail?.class?.studentIds || [];
        const q = studentSearch.toLowerCase();
        const filtered = q
            ? list.filter(s => s.fullName?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q))
            : list;
        return [...filtered].sort((a, b) => {
            if (sortStudentBy === 'score') {
                const sa = a.studentStats?.averageScore || 0;
                const sb = b.studentStats?.averageScore || 0;
                return sortDir === 'asc' ? sa - sb : sb - sa;
            }
            const na = a.fullName || '';
            const nb = b.fullName || '';
            return sortDir === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na);
        });
    }, [detail, studentSearch, sortStudentBy, sortDir]);

    // Computed: học viên chưa trong lớp, lọc theo addStudentSearch
    const availableStudents = useMemo(() => {
        const inClass = new Set((detail?.class?.studentIds || []).map(s => s._id || s));
        const q = addStudentSearch.toLowerCase();
        return allStudents.filter(s => {
            if (inClass.has(s._id)) return false;
            if (!q) return true;
            return s.fullName?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
        });
    }, [allStudents, detail, addStudentSearch]);

    // ── Handlers ───────────────────────────────────────────────────────────
    const handleAdd = async () => {
        if (!form.name || !form.instructorId) {
            toast.error(t('admin.auto.k_5372b835', 'Tên lớp và giảng viên là bắt buộc!')); return;
        }
        try {
            await axios.post(API, form, { headers });
            toast.success(t('admin.auto.k_fa695c29', 'Đã tạo lớp học!'));
            setShowAdd(false);
            setForm({ name: '', description: '', instructorId: '', level: 'beginner' });
            fetchClasses();
        } catch (err) {
            toast.error(err.response?.data?.message || t('admin.auto.k_33a5e01f', 'Thao tác thất bại!'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('admin.auto.k_3a1f4a56', 'Xóa lớp học này?'))) return;
        try {
            await axios.delete(`${API}/${id}`, { headers });
            toast.success(t('admin.auto.k_553025a7', 'Đã xóa lớp học!'));
            fetchClasses(pagination.page);
        } catch {
            toast.error(t('admin.auto.k_33a5e01f', 'Thao tác thất bại!'));
        }
    };

    const openEdit = (cls) => {
        setEditTarget(cls);
        setEditForm({
            name:         cls.name         || '',
            description:  cls.description  || '',
            instructorId: cls.instructorId?._id || cls.instructorId || '',
            level:        cls.level        || 'beginner',
        });
        setShowEdit(true);
    };

    const handleEdit = async () => {
        if (!editForm.name || !editForm.instructorId) {
            toast.error(t('admin.auto.k_5372b835', 'Tên lớp và giảng viên là bắt buộc!')); return;
        }
        try {
            await axios.put(`${API}/${editTarget._id}`, editForm, { headers });
            toast.success(t('admin.auto.k_3df6aaf1', 'Đã cập nhật lớp học!'));
            setShowEdit(false); setEditTarget(null);
            fetchClasses(pagination.page);
        } catch (err) {
            toast.error(err.response?.data?.message || t('admin.auto.k_33a5e01f', 'Thao tác thất bại!'));
        }
    };

    const handleAddStudent = async () => {
        if (!addStudentId) { toast.error(t('admin.auto.k_da1d1cf7', 'Vui lòng chọn học viên!')); return; }
        try {
            await axios.post(`${API}/${detail.class._id}/students`, { studentId: addStudentId }, { headers });
            toast.success(t('admin.auto.k_7d65f13f', 'Đã thêm học viên!'));
            setAddStudentId('');
            fetchDetail(detail.class._id);
        } catch (err) {
            toast.error(err.response?.data?.message || t('admin.auto.k_33a5e01f', 'Thao tác thất bại!'));
        }
    };

    const handleRemoveStudent = async (studentId) => {
        if (!window.confirm(t('admin.auto.k_6256d4c6', 'Xóa học viên khỏi lớp này?'))) return;
        try {
            await axios.delete(`${API}/${detail.class._id}/students/${studentId}`, { headers });
            toast.success(t('admin.auto.k_4c7c6e44', 'Đã xóa học viên khỏi lớp!'));
            fetchDetail(detail.class._id);
        } catch {
            toast.error(t('admin.auto.k_33a5e01f', 'Thao tác thất bại!'));
        }
    };

    const handleTransfer = async () => {
        if (!transferTargetClass) { toast.error(t('admin.auto.k_1d0da01f', 'Vui lòng chọn lớp đích!')); return; }
        try {
            await axios.put(
                `${API}/${detail.class._id}/students/${transferStudent._id}/transfer`,
                { targetClassId: transferTargetClass },
                { headers }
            );
            toast.success(t('admin.auto.k_2efa80ca', 'Đã chuyển học viên sang lớp mới!'));
            setShowTransfer(false); setTransferStudent(null); setTransferTargetClass('');
            fetchDetail(detail.class._id);
        } catch {
            toast.error(t('admin.auto.k_33a5e01f', 'Thao tác thất bại!'));
        }
    };

    const handleChangeInstructor = async () => {
        if (!newInstructorId) { toast.error(t('admin.auto.k_2ec4080c', 'Vui lòng chọn giảng viên!')); return; }
        try {
            await axios.put(`${API}/${detail.class._id}/instructor`, { instructorId: newInstructorId }, { headers });
            toast.success(t('admin.auto.k_b3baea66', 'Đã thay đổi giảng viên phụ trách!'));
            setShowChangeInst(false); setNewInstructorId('');
            fetchDetail(detail.class._id);
        } catch {
            toast.error(t('admin.auto.k_33a5e01f', 'Thao tác thất bại!'));
        }
    };

    // Xóa nhiều học viên khỏi lớp cùng lúc
    const handleBulkRemove = async () => {
        if (selectedStudents.length === 0) return;
        if (!window.confirm(t('admin.auto.k_cls_bulk_confirm', 'Remove {n} selected students from class?').replace('{n}', selectedStudents.length))) return;
        try {
            await Promise.all(
                selectedStudents.map(id =>
                    axios.delete(`${API}/${detail.class._id}/students/${id}`, { headers })
                )
            );
            toast.success(t('admin.auto.k_cls_bulk_success', 'Removed {n} students from class!').replace('{n}', selectedStudents.length));
            setSelectedStudents([]);
            fetchDetail(detail.class._id);
        } catch {
            toast.error(t('admin.auto.k_33a5e01f', 'Thao tác thất bại!'));
        }
    };

    // Copy danh sách email học viên trong lớp
    const handleCopyEmails = () => {
        const emails = (detail?.class?.studentIds || []).map(s => s.email).filter(Boolean).join(', ');
        if (!emails) { toast.error(t('admin.auto.k_cls_no_email', 'No emails available!')); return; }
        navigator.clipboard.writeText(emails);
        toast.success(t('admin.auto.k_cls_copy_success', 'Email list copied!'));
    };

    const toggleSort = (field) => {
        if (sortStudentBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortStudentBy(field); setSortDir('asc'); }
    };

    const toggleSelectStudent = (id) => {
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const ids = filteredClassStudents.map(s => s._id);
        setSelectedStudents(prev =>
            prev.length === ids.length ? [] : ids
        );
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <AdminLayout>
            <div className="space-y-5">

                {/* ── Hero Banner ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-blue-500 to-cyan-500 p-5 shadow-xl">
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-300/20 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-sky-300/15 rounded-full blur-[50px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    <BookOpenIcon size={16} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                                    {t('admin.auto.k_5a69be1b', 'Quản lý lớp học')}
                                </h1>
                            </div>
                            <p className="text-sky-100 text-sm">
                                {t('admin.auto.k_98d372cd', 'Tổ chức và quản lý các lớp học, phân công giảng viên và học viên')}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs text-white font-medium">
                                    <span>{t('admin.auto.k_757a8312', 'Tổng lớp học')}:</span>
                                    <span className="font-bold">{pagination.total}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => fetchClasses(pagination.page)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 border border-white/30 text-white text-sm font-bold rounded-xl hover:bg-white/30 transition-all shadow-lg">
                                <RefreshCw size={15} /> {t('admin.auto.k_4d20363e', 'Làm mới')}
                            </button>
                            <button onClick={() => setShowAdd(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white text-sky-700 text-sm font-bold rounded-xl hover:bg-sky-50 transition-all shadow-lg">
                                <Plus size={15} /> {t('admin.auto.k_38bd5b31', 'Tạo lớp học')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Tìm kiếm & Lọc ── */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                        <Filter size={14} className="text-violet-500" />
                        {t('admin.auto.k_cls_search_filter', 'Search & Filter')}
                        {hasFilter && (
                            <button onClick={clearFilters}
                                className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
                                <X size={12} /> {t('admin.auto.k_a12048e0', 'Xóa bộ lọc')}
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {/* Tìm kiếm */}
                        <div className="relative flex-1 min-w-[220px]">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                                placeholder={t('admin.auto.k_266e8c05', 'Tìm theo tên lớp...')}
                                value={search}
                                onChange={e => setSearch(e.target.value)} />
                        </div>
                        {/* Lọc theo cấp độ */}
                        <select
                            className="w-44 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                            value={filterLevel}
                            onChange={e => setFilterLevel(e.target.value)}>
                            <option value="">{t('admin.auto.k_cls_all_levels', 'All levels')}</option>
                            <option value="beginner">{t('admin.auto.k_5d36b694', 'Cơ bản')}</option>
                            <option value="intermediate">{t('admin.auto.k_5038ce12', 'Trung cấp')}</option>
                            <option value="advanced">{t('admin.auto.k_c7166341', 'Nâng cao')}</option>
                        </select>
                    </div>
                </div>

                {/* ── Bảng danh sách ── */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    {/* Pagination top */}
                    <PaginationBar
                        page={pagination.page}
                        pages={pagination.pages}
                        total={pagination.total}
                        label={t('admin.auto.k_cls_label', 'classes')}
                        onPage={(p) => fetchClasses(p)}
                        position="top"
                    />

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">{t('admin.auto.k_cls_col_name', 'Class name')}</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">{t('admin.auto.k_cls_col_instructor', 'Instructor')}</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">{t('admin.auto.k_cls_col_level', 'Level')}</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">{t('admin.auto.k_cc21a093', 'Học viên')}</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">{t('admin.auto.k_74dd5d08', 'Điểm TB')}</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">{t('admin.auto.k_eb889c21', 'Hoàn thành')}</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">{t('admin.auto.k_cls_col_actions', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {displayedClasses.map(cls => (
                                        <tr key={cls._id} className="hover:bg-slate-50 transition-colors">
                                            {/* Tên lớp */}
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-slate-800">{cls.name}</p>
                                            </td>
                                            {/* Giảng viên */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <GraduationCap size={13} className="text-slate-400 flex-shrink-0" />
                                                    <span className="text-slate-700">{cls.instructorId?.fullName || '—'}</span>
                                                </div>
                                            </td>
                                            {/* Cấp độ */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${levelColor[cls.level] || 'bg-slate-100 text-slate-600'}`}>
                                                    {levelLabel[cls.level] || cls.level}
                                                </span>
                                            </td>
                                            {/* Số học viên */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Users size={13} className="text-violet-400" />
                                                    <span className="font-bold text-violet-600">{cls.studentIds?.length || 0}</span>
                                                </div>
                                            </td>
                                            {/* Điểm TB */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="font-bold text-blue-600">
                                                    {cls.classStats?.averageScore?.toFixed(1) || '0.0'}
                                                </span>
                                            </td>
                                            {/* Hoàn thành */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="font-bold text-emerald-600">
                                                    {cls.classStats?.completionRate || 0}%
                                                </span>
                                            </td>
                                            {/* Thao tác */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => fetchDetail(cls._id)}
                                                        title={t('admin.auto.k_0475320c', 'Chi tiết')}
                                                        className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-500 transition-colors">
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEdit(cls)}
                                                        title={t('admin.auto.k_1a5f1503', 'Chỉnh sửa lớp')}
                                                        className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition-colors">
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(cls._id)}
                                                        title={t('admin.auto.k_4ed187a8', 'Xóa')}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {displayedClasses.length === 0 && (
                                <div className="text-center py-16 text-slate-400">
                                    <BookOpenIcon size={36} className="mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">{t('admin.auto.k_efcc7364', 'Không có lớp học nào')}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pagination bottom */}
                    <PaginationBar
                        page={pagination.page}
                        pages={pagination.pages}
                        total={pagination.total}
                        label={t('admin.auto.k_cls_label', 'classes')}
                        onPage={(p) => fetchClasses(p)}
                        position="bottom"
                    />
                </div>
            </div>

            {/* ── Modal tạo lớp ── */}
            {showAdd && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-black text-slate-800 text-lg">{t('admin.auto.k_9b9a3e9f', 'Tạo lớp học mới')}</h2>
                            <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('admin.auto.k_859043d7', 'Tên lớp *')}</label>
                                <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                    placeholder="VD: Beginner 01"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('admin.auto.k_e9c02d54', 'Mô tả')}</label>
                                <textarea className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
                                    rows={2}
                                    placeholder={t('admin.auto.k_af90a079', 'Mô tả lớp học...')}
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('admin.auto.k_ed5af140', 'Giảng viên phụ trách *')}</label>
                                <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                    value={form.instructorId}
                                    onChange={e => setForm({ ...form, instructorId: e.target.value })}>
                                    <option value="">{t('admin.auto.k_92c3b6d7', '-- Chọn giảng viên --')}</option>
                                    {instructors.map(inst => <option key={inst._id} value={inst._id}>{inst.fullName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('admin.auto.k_e7a8d487', 'Cấp độ')}</label>
                                <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                    value={form.level}
                                    onChange={e => setForm({ ...form, level: e.target.value })}>
                                    <option value="beginner">{t('admin.auto.k_5d36b694', 'Cơ bản')}</option>
                                    <option value="intermediate">{t('admin.auto.k_5038ce12', 'Trung cấp')}</option>
                                    <option value="advanced">{t('admin.auto.k_c7166341', 'Nâng cao')}</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-5">
                            <button onClick={() => setShowAdd(false)}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200">
                                {t('admin.auto.k_1e405035', 'Hủy')}
                            </button>
                            <button onClick={handleAdd}
                                className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700">
                                {t('admin.auto.k_03ef2eee', 'Tạo lớp')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal chỉnh sửa lớp ── */}
            {showEdit && editTarget && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowEdit(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="font-black text-slate-800 text-lg">{t('admin.auto.k_7e7f1adf', 'Chỉnh sửa lớp học')}</h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {t('admin.auto.k_d9fbd63b', 'Cập nhật thông tin lớp:')} <span className="font-semibold text-slate-600">{editTarget.name}</span>
                                </p>
                            </div>
                            <button onClick={() => setShowEdit(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('admin.auto.k_859043d7', 'Tên lớp *')}</label>
                                <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
                                    placeholder="VD: Beginner 01"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('admin.auto.k_e9c02d54', 'Mô tả')}</label>
                                <textarea className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 resize-none"
                                    rows={2}
                                    placeholder={t('admin.auto.k_af90a079', 'Mô tả lớp học...')}
                                    value={editForm.description}
                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('admin.auto.k_e7a8d487', 'Cấp độ')}</label>
                                <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
                                    value={editForm.level}
                                    onChange={e => setEditForm({ ...editForm, level: e.target.value })}>
                                    <option value="beginner">{t('admin.auto.k_5d36b694', 'Cơ bản')}</option>
                                    <option value="intermediate">{t('admin.auto.k_5038ce12', 'Trung cấp')}</option>
                                    <option value="advanced">{t('admin.auto.k_c7166341', 'Nâng cao')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('admin.auto.k_ed5af140', 'Giảng viên phụ trách *')}</label>
                                <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
                                    value={editForm.instructorId}
                                    onChange={e => setEditForm({ ...editForm, instructorId: e.target.value })}>
                                    <option value="">{t('admin.auto.k_92c3b6d7', '-- Chọn giảng viên --')}</option>
                                    {instructors.map(inst => <option key={inst._id} value={inst._id}>{inst.fullName}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-5">
                            <button onClick={() => setShowEdit(false)}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200">
                                {t('admin.auto.k_1e405035', 'Hủy')}
                            </button>
                            <button onClick={handleEdit}
                                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600">
                                {t('admin.auto.k_0dc3cc51', 'Lưu thay đổi')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal chi tiết lớp (CF4.2 + CF4.3 + CF4.4) ── */}
            {showDetail && detail && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowDetail(false); setStudentSearch(''); setAddStudentSearch(''); setSelectedStudents([]); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md">
                                    <BookOpenIcon size={20} className="text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-black text-slate-800 text-xl">{detail.class?.name}</h2>
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${levelColor[detail.class?.level] || 'bg-slate-100 text-slate-600'}`}>
                                            {levelLabel[detail.class?.level] || detail.class?.level}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                        <GraduationCap size={13} /> {detail.class?.instructorId?.fullName || '—'}
                                        {detail.class?.description && <span className="mx-1">·</span>}
                                        {detail.class?.description && <span className="italic truncate max-w-[200px]">{detail.class.description}</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Copy emails */}
                                <button onClick={handleCopyEmails}
                                    title={t('admin.auto.k_cls_copy_email_title', 'Copy student email list')}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                                    <Copy size={13} /> {t('admin.auto.k_cls_copy_email_btn', 'Copy emails')}
                                </button>
                                {/* Thay đổi GV */}
                                <button onClick={() => { setNewInstructorId(''); setShowChangeInst(true); }}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors">
                                    <GraduationCap size={13} /> {t('admin.auto.k_cls_change_inst_btn', 'Change instructor')}
                                </button>
                                <button onClick={() => { setShowDetail(false); setStudentSearch(''); setAddStudentSearch(''); setSelectedStudents([]); }}
                                    className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Body — 2 cột */}
                        <div className="flex-1 overflow-hidden flex gap-0">

                            {/* Cột trái: Stats + Thêm học viên */}
                            <div className="w-[420px] flex-shrink-0 border-r border-slate-100 flex flex-col">
                                {/* Thêm học viên */}
                                <div className="p-4 flex-1 flex flex-col gap-3 overflow-hidden">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                                        <UserPlus size={13} className="text-violet-500" /> {t('admin.auto.k_cls_add_student_title', 'Add student to class')}
                                    </p>

                                    {/* Search học viên chưa vào lớp */}
                                    <div className="relative">
                                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                                            placeholder={t('admin.auto.k_cls_search_add', 'Search student to add...')}
                                            value={addStudentSearch}
                                            onChange={e => { setAddStudentSearch(e.target.value); setAddStudentId(''); }} />
                                    </div>

                                    {/* Dropdown chọn học viên — to hơn */}
                                    <select
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                                        size={Math.min(Math.max(availableStudents.length, 4), 12)}
                                        value={addStudentId}
                                        onChange={e => setAddStudentId(e.target.value)}>
                                        <option value="">{t('admin.auto.k_cls_select_student', '-- Select student --')}</option>
                                        {availableStudents.map(s => (
                                            <option key={s._id} value={s._id}>{s.fullName} · {s.email}</option>
                                        ))}
                                    </select>

                                    {availableStudents.length === 0 && (
                                        <p className="text-xs text-slate-400 text-center py-1">{t('admin.auto.k_cls_all_in_class', 'All students are already in class')}</p>
                                    )}

                                    <button onClick={handleAddStudent} disabled={!addStudentId}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                        <UserPlus size={14} /> {t('admin.auto.k_cls_add_btn', 'Add to class')}
                                    </button>
                                </div>
                            </div>

                            {/* Cột phải: Danh sách học viên */}
                            <div className="flex-1 flex flex-col overflow-hidden">

                                {/* Toolbar danh sách */}
                                <div className="p-4 border-b border-slate-100 space-y-2 flex-shrink-0">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                                            <Users size={13} className="text-blue-500" />
                                            {t('admin.auto.k_cls_list_header', 'List')} ({filteredClassStudents.length}/{detail.class?.studentIds?.length || 0})
                                        </p>
                                        {selectedStudents.length > 0 && (
                                            <button onClick={handleBulkRemove}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-200 transition-colors">
                                                <UserMinus size={12} /> {t('admin.auto.k_cls_bulk_remove_btn', 'Remove {n} selected').replace('{n}', selectedStudents.length)}
                                            </button>
                                        )}
                                    </div>

                                    {/* Thanh tìm kiếm */}
                                    <div className="relative">
                                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                            placeholder={t('admin.auto.k_cls_search_in_class', 'Search student in class...')}
                                            value={studentSearch}
                                            onChange={e => setStudentSearch(e.target.value)} />
                                        {studentSearch && (
                                            <button onClick={() => setStudentSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                <X size={13} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Header sort */}
                                    <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
                                        <input type="checkbox"
                                            checked={selectedStudents.length === filteredClassStudents.length && filteredClassStudents.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded w-3.5 h-3.5 cursor-pointer" />
                                        <button onClick={() => toggleSort('name')}
                                            className="flex items-center gap-1 font-semibold hover:text-slate-800 transition-colors">
                                            {t('admin.auto.k_cls_col_fullname', 'Full name')}
                                            {sortStudentBy === 'name' ? (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />) : null}
                                        </button>
                                    </div>
                                </div>

                                {/* Danh sách scroll */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                                    {filteredClassStudents.map(s => {
                                        const score = s.studentStats?.averageScore || 0;
                                        const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-500';
                                        const isSelected = selectedStudents.includes(s._id);
                                        return (
                                            <div key={s._id}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-transparent hover:border-slate-200 hover:bg-white'}`}
                                                onClick={() => toggleSelectStudent(s._id)}>

                                                <input type="checkbox" checked={isSelected} readOnly
                                                    className="rounded w-3.5 h-3.5 flex-shrink-0 cursor-pointer" />

                                                {/* Avatar */}
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                                                    {s.fullName?.[0]?.toUpperCase() || '?'}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800 truncate">{s.fullName}</p>
                                                    <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                                                        <Mail size={10} /> {s.email}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => { setTransferStudent(s); setTransferTargetClass(''); setShowTransfer(true); }}
                                                        title={t('admin.auto.k_cls_transfer_title', 'Transfer class')}
                                                        className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-500 transition-colors">
                                                        <ArrowRight size={13} />
                                                    </button>
                                                    <button onClick={() => handleRemoveStudent(s._id)}
                                                        title={t('admin.auto.k_cls_remove_title', 'Remove from class')}
                                                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors">
                                                        <UserMinus size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {filteredClassStudents.length === 0 && (
                                        <div className="text-center py-10 text-slate-400">
                                            <Users size={32} className="mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">
                                                {studentSearch ? t('admin.auto.k_cls_not_found', 'No students found') : t('admin.auto.k_69533fbd', 'No students yet')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal chuyển học viên ── */}
            {showTransfer && transferStudent && (
                <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={() => setShowTransfer(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <h2 className="font-black text-slate-800 mb-1">{t('admin.auto.k_6668686d', 'Chuyển học viên')}</h2>
                        <p className="text-sm text-slate-500 mb-4">
                            {t('admin.auto.k_7e880e0e', 'Học viên:')} <span className="font-semibold">{transferStudent.fullName}</span>
                        </p>
                        <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 mb-4"
                            value={transferTargetClass}
                            onChange={e => setTransferTargetClass(e.target.value)}>
                            <option value="">{t('admin.auto.k_a46b8673', '-- Chọn lớp đích --')}</option>
                            {allClasses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <div className="flex gap-2">
                            <button onClick={() => setShowTransfer(false)}
                                className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold">
                                {t('admin.auto.k_1e405035', 'Hủy')}
                            </button>
                            <button onClick={handleTransfer}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
                                {t('admin.auto.k_5468509b', 'Chuyển lớp')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal thay đổi giảng viên ── */}
            {showChangeInst && detail && (
                <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={() => setShowChangeInst(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <h2 className="font-black text-slate-800 mb-1">{t('admin.auto.k_7ccf3428', 'Thay đổi giảng viên')}</h2>
                        <p className="text-sm text-slate-500 mb-4">
                            {t('admin.auto.k_221333d9', 'Lớp:')} <span className="font-semibold">{detail.class?.name}</span>
                        </p>
                        <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 mb-4"
                            value={newInstructorId}
                            onChange={e => setNewInstructorId(e.target.value)}>
                            <option value="">{t('admin.auto.k_d76e7397', '-- Chọn giảng viên mới --')}</option>
                            {instructors.map(inst => <option key={inst._id} value={inst._id}>{inst.fullName}</option>)}
                        </select>
                        <div className="flex gap-2">
                            <button onClick={() => setShowChangeInst(false)}
                                className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold">
                                {t('admin.auto.k_1e405035', 'Hủy')}
                            </button>
                            <button onClick={handleChangeInstructor}
                                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700">
                                {t('admin.auto.k_1e2eb2de', 'Xác nhận')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminClasses;
