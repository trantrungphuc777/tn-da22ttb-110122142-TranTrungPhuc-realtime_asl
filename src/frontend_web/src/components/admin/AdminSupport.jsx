import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import {
    Headphones, Send, X, ChevronLeft, ChevronRight, ChevronDown,
    MessageCircle, Pencil, Save, CheckCircle2, Clock,
    AlertCircle, XCircle, RefreshCw, Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PaginationBar from './PaginationBar';

const API = 'http://localhost:5000/api/admin/support';

const getStatusConfig = (t) => ({
    new:        { label: t('admin.auto.k_8da71d79', 'Mới tạo'),       color: 'bg-blue-100 text-blue-700',   badge: 'bg-blue-500',   icon: Clock },
    processing: { label: t('admin.auto.k_0f0c3d2a', 'Đang xử lý'),    color: 'bg-amber-100 text-amber-700', badge: 'bg-amber-500',  icon: AlertCircle },
    completed:  { label: t('admin.auto.k_9be8a044', 'Đã hoàn thành'), color: 'bg-green-100 text-green-700', badge: 'bg-green-500',  icon: CheckCircle2 },
    closed:     { label: t('admin.auto.k_d7bccb9e', 'Đã đóng'),       color: 'bg-slate-100 text-slate-600', badge: 'bg-slate-400',  icon: XCircle },
});

const getErrorTypeLabel = (t) => ({
    login: t('admin.auto.k_9a192725', 'Đăng nhập'), camera: 'Camera', exam: t('admin.auto.k_c9fe5481', 'Bài kiểm tra'),
    recognition: t('admin.auto.k_f71233d2', 'Nhận diện ASL'), other: t('admin.auto.k_06c1f85a', 'Khác')
});

const getErrorTypeOptions = (t) => [
    { value: 'login', label: t('admin.auto.k_9a192725', 'Đăng nhập') },
    { value: 'camera', label: 'Camera' },
    { value: 'exam', label: t('admin.auto.k_c9fe5481', 'Bài kiểm tra') },
    { value: 'recognition', label: t('admin.auto.k_f71233d2', 'Nhận diện ASL') },
    { value: 'other', label: t('admin.auto.k_06c1f85a', 'Khác') },
];

// CF14 — Quản lý hỗ trợ kỹ thuật (Support Center)
const AdminSupport = () => {
    const { t } = useLanguage();
    const [tickets, setTickets]         = useState([]);
    const [pagination, setPagination]   = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [loading, setLoading]         = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType]   = useState('');
    const [ticketDetail, setTicketDetail] = useState(null);
    const [message, setMessage]         = useState('');
    const [sending, setSending]         = useState(false);

    // Edit mode state
    const [editMode, setEditMode]       = useState(false);
    const [editForm, setEditForm]       = useState({ title: '', content: '', errorType: 'other' });
    const [saving, setSaving]           = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchTickets = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const res = await axios.get(API, {
                headers,
                params: { page, limit: 20, status: filterStatus, errorType: filterType }
            });
            setTickets(res.data.tickets || []);
            setPagination(res.data.pagination || {});
        } catch {
            toast.error(t('admin.auto.k_848ebf61', 'Không thể tải danh sách ticket!'));
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterType]);

    const fetchDetail = useCallback(async (id) => {
        try {
            const res = await axios.get(`${API}/${id}`, { headers });
            setTicketDetail(res.data.ticket);
        } catch {
            toast.error(t('admin.auto.k_200fbcc2', 'Không thể tải chi tiết ticket!'));
        }
    }, []);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    // Mở modal chi tiết ticket
    const openDetail = (ticket) => {
        setEditMode(false);
        setMessage('');
        fetchDetail(ticket._id);
    };

    // Đóng modal
    const closeDetail = () => {
        setTicketDetail(null);
        setEditMode(false);
        setMessage('');
        setShowStatusMenu(false);
    };

    // Bật edit mode, copy dữ liệu hiện tại vào form
    const startEdit = () => {
        setEditForm({
            title:     ticketDetail.title,
            content:   ticketDetail.content,
            errorType: ticketDetail.errorType || 'other',
        });
        setEditMode(true);
    };

    // Lưu chỉnh sửa thông tin ticket
    const handleSaveEdit = async () => {
        if (!editForm.title.trim() || !editForm.content.trim()) {
            toast.error(t('admin.auto.k_967c5f02', 'Tiêu đề và nội dung không được để trống!'));
            return;
        }
        setSaving(true);
        try {
            const res = await axios.put(`${API}/${ticketDetail._id}/info`, editForm, { headers });
            // Cập nhật trực tiếp state thay vì fetch lại để tránh nháy
            setTicketDetail(prev => ({ ...prev, ...res.data.ticket }));
            // Cập nhật trong danh sách luôn
            setTickets(prev => prev.map(t =>
                t._id === ticketDetail._id ? { ...t, ...res.data.ticket } : t
            ));
            setEditMode(false);
            toast.success(t('admin.auto.k_c0d60fc5', 'Đã lưu thay đổi!'));
        } catch (err) {
            toast.error(err.response?.data?.message || t('admin.auto.k_23f5a434', 'Lưu thất bại!'));
        } finally {
            setSaving(false);
        }
    };

    // CF14.3 — Cập nhật trạng thái — FIX: cập nhật state ngay lập tức
    const handleStatus = async (id, status) => {
        try {
            const res = await axios.put(`${API}/${id}/status`, { status }, { headers });
            const updated = res.data.ticket;
            toast.success(t('admin.auto.k_df44e92f', 'Đã cập nhật trạng thái!'));
            // Cập nhật trực tiếp cả modal lẫn danh sách
            setTicketDetail(prev => prev?._id === id ? { ...prev, ...updated } : prev);
            setTickets(prev => prev.map(t => t._id === id ? { ...t, status: updated.status } : t));
        } catch {
            toast.error(t('admin.auto.k_33a5e01f', 'Thao tác thất bại!'));
        }
    };

    // CF14.4 — Gửi messages trao đổi
    const handleSendMessage = async () => {
        if (!message.trim()) { toast.error(t('admin.auto.k_054b6920', 'Vui lòng nhập nội dung!')); return; }
        setSending(true);
        try {
            const res = await axios.post(`${API}/${ticketDetail._id}/messages`, { message }, { headers });
            setMessage('');
            // Cập nhật messages trực tiếp từ response
            setTicketDetail(prev => ({ ...prev, ...res.data.ticket }));
            setTickets(prev => prev.map(t =>
                t._id === ticketDetail._id ? { ...t, status: res.data.ticket.status } : t
            ));
        } catch {
            toast.error(t('admin.auto.k_578084c1', 'Gửi thất bại!'));
        } finally {
            setSending(false);
        }
    };

    // Xóa ticket (có thể gọi từ bảng hoặc từ modal)
    const handleDelete = async (id) => {
        if (!window.confirm(t('admin.auto.k_c7363f7b', 'Bạn có chắc muốn xóa ticket này không? Hành động này không thể hoàn tác.'))) return;
        try {
            await axios.delete(`${API}/${id}`, { headers });
            toast.success(t('admin.auto.k_6afa0159', 'Đã xóa ticket!'));
            if (ticketDetail?._id === id) closeDetail();
            fetchTickets(pagination.page);
        } catch {
            toast.error(t('admin.auto.k_9d47668e', 'Xóa thất bại!'));
        }
    };

    // Mở modal ở chế độ chỉnh sửa ngay
    const openDetailEdit = async (ticket) => {
        setMessage('');
        await fetchDetail(ticket._id);
        setEditForm({
            title:     ticket.title,
            content:   ticket.content,
            errorType: ticket.errorType || 'other',
        });
        setEditMode(true);
    };


    return (
        <AdminLayout>
            <div className="space-y-5">
                {/* ── Hero Banner ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 p-5 shadow-xl">
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-300/20 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-blue-300/15 rounded-full blur-[50px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    <Headphones size={16} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight"> {t('admin.auto.k_da242a1a', t('admin.auto.k_da242a1a', 'Hỗ trợ kỹ thuật'))} </h1>
                            </div>
                            <p className="text-blue-100 text-sm"> {t('admin.auto.k_40b63083', 'Tiếp nhận và xử lý các yêu cầu hỗ trợ kỹ thuật từ người dùng')} </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {[
                                    { label: t('admin.auto.k_69f28a87', 'Tổng ticket'), val: pagination.total },
                                    { label: t('admin.auto.k_0f0c3d2a', 'Đang xử lý'), val: tickets.filter(t => t.status === 'processing').length },
                                    { label: t('admin.auto.k_8da71d79', 'Mới tạo'), val: tickets.filter(t => t.status === 'new').length },
                                ].map((p, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs text-white font-medium">
                                        <span>{p.label}:</span><span className="font-bold">{p.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => fetchTickets(pagination.page)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg flex-shrink-0">
                            <RefreshCw size={14} /> {t('admin.auto.k_4d20363e', t('admin.auto.k_4d20363e', 'Làm mới'))} </button>
                    </div>
                </div>

                {/* Bộ lọc */}
                <div className="flex flex-wrap gap-3">
                    <select className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                        value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value=""> {t('admin.auto.k_fd1c3a01', t('admin.auto.k_fd1c3a01', 'Tất cả trạng thái'))} </option>
                        <option value="new"> {t('admin.auto.k_8da71d79', t('admin.auto.k_8da71d79', 'Mới tạo'))} </option>
                        <option value="processing"> {t('admin.auto.k_0f0c3d2a', t('admin.auto.k_0f0c3d2a', 'Đang xử lý'))} </option>
                        <option value="completed"> {t('admin.auto.k_9be8a044', t('admin.auto.k_9be8a044', 'Đã hoàn thành'))} </option>
                        <option value="closed"> {t('admin.auto.k_d7bccb9e', t('admin.auto.k_d7bccb9e', 'Đã đóng'))} </option>
                    </select>
                    <select className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                        value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value=""> {t('admin.auto.k_a30f85e5', 'Tất cả loại lỗi')} </option>
                        {getErrorTypeOptions(t).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>

                {/* Danh sách ticket */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    {/* Pagination đầu trang */}
                    <PaginationBar
                        page={pagination.page} pages={pagination.pages}
                        total={pagination.total} label={t('admin.auto.k_sup_ticket_label', 'tickets')}
                        onPage={(p) => fetchTickets(p)} position="top"
                    />
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_4a391235', t('admin.auto.k_4a391235', 'Mã Ticket'))} </th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_0c86fe9c', t('admin.auto.k_0c86fe9c', 'Người gửi'))} </th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_ae4b89f8', t('admin.auto.k_ae4b89f8', 'Tiêu đề'))} </th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_e1950a43', t('admin.auto.k_e1950a43', 'Loại lỗi'))} </th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_68afa926', t('admin.auto.k_68afa926', 'Ngày tạo'))} </th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_0fbc27f5', t('admin.auto.k_0fbc27f5', 'Trạng thái'))} </th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_71d52075', t('admin.auto.k_71d52075', 'Thao tác'))} </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-12 text-slate-400"> {t('admin.auto.k_d5fe42f6', 'Đang tải...')} </td></tr>
                                ) : tickets.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-12 text-slate-400"> {t('admin.auto.k_6fd3dab6', 'Chưa có ticket nào')} </td></tr>
                                ) : tickets.map(t2 => {
                                    const statusConfig = getStatusConfig(t);
                                    const errorTypeLabel = getErrorTypeLabel(t);
                                    const sc = statusConfig[t2.status] || statusConfig.new;
                                    const SIcon = sc.icon;
                                    return (
                                        <tr key={t2._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs font-bold text-violet-600">{t2.ticketCode}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-800">{t2.senderId?.fullName || '—'}</td>
                                            <td className="px-4 py-3 text-slate-700 max-w-[180px] truncate">{t2.title}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">{errorTypeLabel[t2.errorType] || t('admin.auto.k_06c1f85a', 'Khác')}</span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 text-xs">{new Date(t2.createdAt).toLocaleDateString('vi-VN')}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${sc.color}`}>
                                                    <SIcon size={10} />{sc.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <button onClick={() => openDetail(t2)}
                                                        className="flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-600 rounded-lg text-xs font-semibold hover:bg-violet-100 transition-colors">
                                                        <MessageCircle size={12} />{t('admin.auto.k_xem', 'Xem')}
                                                    </button>
                                                    <button onClick={() => openDetailEdit(t2)}
                                                        title={t('admin.auto.k_e1504e01', 'Chỉnh sửa')}
                                                        className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                                                        <Pencil size={12} /> {t('admin.auto.k_9026a724', 'Sửa')} </button>
                                                    <button onClick={() => handleDelete(t2._id)}
                                                        title={t('admin.auto.k_67a04ee2', 'Xóa ticket')}
                                                        className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                                                        <Trash2 size={12} /> {t('admin.auto.k_4ed187a8', 'Xóa')} </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <PaginationBar
                        page={pagination.page} pages={pagination.pages}
                        total={pagination.total} label={t('admin.auto.k_sup_ticket_label', 'tickets')}
                        onPage={(p) => fetchTickets(p)} position="bottom"
                    />
                </div>
            </div>

            {/* ── Modal chi tiết ticket — layout 2 cột ── */}
            {ticketDetail && (() => {
                const statusConfig = getStatusConfig(t);
                const sc = statusConfig[ticketDetail.status] || statusConfig.new;
                const StatusIcon = sc.icon;
                return (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={closeDetail}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl min-h-[75vh] max-h-[90vh] flex flex-col"
                            onClick={e => e.stopPropagation()}>

                            {/* ── Top bar: mã ticket + trạng thái + actions ── */}
                            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                                {/* Trái: mã ticket */}
                                <span className="font-mono text-sm font-bold text-violet-600 shrink-0">
                                    {ticketDetail.ticketCode}
                                </span>

                                {/* Giữa: dropdown đổi trạng thái */}
                                <div className="relative mx-4" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => setShowStatusMenu(v => !v)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:brightness-95 ${sc.color}`}
                                    >
                                        <StatusIcon size={13} />
                                        {sc.label}
                                        <ChevronDown size={13} className={`transition-transform duration-200 ${showStatusMenu ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showStatusMenu && (
                                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-48 bg-white rounded-xl border border-slate-200 shadow-xl z-10 overflow-hidden">
                                            <div className="px-3 py-2 border-b border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide"> {t('admin.auto.k_8bf17547', 'Chuyển trạng thái')} </p>
                                            </div>
                                            {Object.entries(getStatusConfig(t)).map(([key, cfg]) => {
                                                const Icon = cfg.icon;
                                                const isCurrent = ticketDetail.status === key;
                                                return (
                                                    <button
                                                        key={key}
                                                        disabled={isCurrent}
                                                        onClick={() => { handleStatus(ticketDetail._id, key); setShowStatusMenu(false); }}
                                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold transition-colors ${
                                                            isCurrent
                                                                ? 'bg-slate-50 text-slate-400 cursor-default'
                                                                : 'hover:bg-slate-50 text-slate-700 cursor-pointer'
                                                        }`}
                                                    >
                                                        <span className={`w-2 h-2 rounded-full ${cfg.badge} shrink-0`} />
                                                        <Icon size={13} className="shrink-0 text-slate-400" />
                                                        {cfg.label}
                                                        {isCurrent && (
                                                            <span className="ml-auto text-[10px] text-slate-400 font-normal"> {t('admin.auto.k_d6af47ba', 'Hiện tại')} </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Phải: icon actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                    {!editMode && ticketDetail.status !== 'closed' && (
                                        <button onClick={startEdit} title={t('admin.auto.k_b4ba481c', t('admin.auto.k_b4ba481c', 'Chỉnh sửa nội dung'))}
                                            className="p-1.5 rounded-lg hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors">
                                            <Pencil size={15} />
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(ticketDetail._id)} title={t('admin.auto.k_67a04ee2', t('admin.auto.k_67a04ee2', 'Xóa ticket'))}
                                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={15} />
                                    </button>
                                    <button onClick={closeDetail}
                                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors ml-0.5">
                                        <X size={17} />
                                    </button>
                                </div>
                            </div>

                            {/* ── Body: 2 cột ── */}
                            <div className="flex flex-1 min-h-0">

                                {/* Cột trái — thông tin ticket */}
                                <div className="w-80 shrink-0 border-r border-slate-300 flex flex-col overflow-y-auto">
                                    <div className="p-5 space-y-4">

                                        {/* Tiêu đề */}
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1"> {t('admin.auto.k_ae4b89f8', t('admin.auto.k_ae4b89f8', 'Tiêu đề'))} </p>
                                            {editMode ? (
                                                <input
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                                    value={editForm.title}
                                                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                                                    maxLength={200}
                                                />
                                            ) : (
                                                <p className="text-sm font-semibold text-slate-800">{ticketDetail.title}</p>
                                            )}
                                        </div>

                                        {/* Người gửi */}
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1"> {t('admin.auto.k_0c86fe9c', t('admin.auto.k_0c86fe9c', 'Người gửi'))} </p>
                                            <p className="text-sm font-semibold text-slate-800">{ticketDetail.senderId?.fullName || '—'}</p>
                                            {ticketDetail.senderId?.email && (
                                                <p className="text-xs text-slate-400 mt-0.5">{ticketDetail.senderId.email}</p>
                                            )}
                                        </div>

                                        {/* Loại lỗi */}
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1"> {t('admin.auto.k_e1950a43', t('admin.auto.k_e1950a43', 'Loại lỗi'))} </p>
                                            {editMode ? (
                                                <select
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 bg-white"
                                                    value={editForm.errorType}
                                                    onChange={e => setEditForm(f => ({ ...f, errorType: e.target.value }))}>
                                                    {getErrorTypeOptions(t).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                </select>
                                            ) : (
                                                <span className="inline-block text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold">
                                                    {getErrorTypeLabel(t)[ticketDetail.errorType] || t('admin.auto.k_06c1f85a', 'Khác')}
                                                </span>
                                            )}
                                        </div>

                                        {/* Ngày tạo */}
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1"> {t('admin.auto.k_68afa926', t('admin.auto.k_68afa926', 'Ngày tạo'))} </p>
                                            <p className="text-sm text-slate-600">{new Date(ticketDetail.createdAt).toLocaleString()}</p>
                                        </div>

                                        {/* Nội dung mô tả */}
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1"> {t('admin.auto.k_ee7ca513', t('admin.auto.k_ee7ca513', 'Nội dung'))} </p>
                                            {editMode ? (
                                                <textarea
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
                                                    rows={5}
                                                    value={editForm.content}
                                                    onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                                                />
                                            ) : (
                                                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                    {ticketDetail.content}
                                                </p>
                                            )}
                                        </div>

                                        {/* Nút lưu / hủy edit */}
                                        {editMode && (
                                            <div className="flex gap-2 pt-1">
                                                <button onClick={() => setEditMode(false)}
                                                    className="flex-1 px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"> {t('admin.auto.k_1e405035', t('admin.auto.k_1e405035', 'Hủy'))} </button>
                                                <button onClick={handleSaveEdit} disabled={saving}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors">
                                                    <Save size={12} />{saving ? t('admin.auto.k_4d30b6f8', 'Đang lưu...') : t('admin.auto.k_49fac1fe', 'Lưu')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Cột phải — chat */}
                                <div className="flex-1 flex flex-col min-w-0">
                                    {/* Header chat */}
                                    <div className="px-5 py-3 border-b border-slate-100">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                            {t('admin.auto.k_lich_su_messages', 'Lịch sử tin nhắn')} ({(ticketDetail.messages || []).length} {t('admin.auto.k_tin_nhan', 'tin nhắn')})
                                        </p>
                                    </div>

                                    {/* Danh sách messages */}
                                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                                        {(ticketDetail.messages || []).length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center py-10">
                                                <MessageCircle size={32} className="text-slate-200 mb-2" />
                                                <p className="text-sm text-slate-400"> {t('admin.auto.k_ed9d96d7', 'Chưa có tin nhắn nào')} </p>
                                                <p className="text-xs text-slate-300 mt-0.5"> {t('admin.auto.k_f87f91b1', 'Hãy gửi tin nhắn đầu tiên bên dưới')} </p>
                                            </div>
                                        ) : (ticketDetail.messages || []).map((msg, i) => {
                                            const isAdmin = msg.senderRole === 'admin';
                                            return (
                                                <div key={i} className={`flex gap-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                    {!isAdmin && (
                                                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-0.5">
                                                            {(msg.senderId?.fullName || 'U')[0].toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className={`max-w-[75%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                                                        <p className="text-[10px] font-semibold text-slate-400 px-1">
                                                            {isAdmin ? t('admin.auto.k_08cd66cb', 'Quản trị viên') : (msg.senderId?.fullName || t('admin.auto.k_3bf88695', 'Người dùng'))}
                                                        </p>
                                                        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isAdmin ? 'bg-violet-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'}`}>
                                                            {msg.message}
                                                        </div>
                                                        <p className="text-[10px] text-slate-300 px-1">
                                                            {new Date(msg.sentAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    {isAdmin && (
                                                        <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600 shrink-0 mt-0.5">
                                                            A
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Input gửi messages */}
                                    {ticketDetail.status !== 'closed' ? (
                                        <div className="px-5 py-4 border-t border-slate-100 flex gap-2 items-center">
                                            <input
                                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:bg-white transition-colors"
                                                placeholder={t('admin.auto.k_40724349', 'Nhập tin nhắn trả lời...')}                                                value={message}
                                                onChange={e => setMessage(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                            />
                                            <button onClick={handleSendMessage} disabled={sending}
                                                className="w-10 h-10 flex items-center justify-center bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors shrink-0">
                                                <Send size={15} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="px-5 py-4 border-t border-slate-100 text-center text-xs text-slate-400"> {t('admin.auto.k_1de573af', 'Ticket đã đóng — không thể gửi thêm tin nhắn')} </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </AdminLayout>
    );
};

export default AdminSupport;
