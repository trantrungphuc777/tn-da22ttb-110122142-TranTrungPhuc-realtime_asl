import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import { Plus, Send, Edit2, Trash2, RefreshCw, Bell, X, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PaginationBar from './PaginationBar';

const API       = 'http://localhost:5000/api/admin/notifications';
const CLASS_API = 'http://localhost:5000/api/admin/classes';

// CF9 — Quản lý thông báo toàn hệ thống
const AdminNotifications = () => {
    const { t } = useLanguage();
    const [notifications, setNotifications] = useState([]);
    const [pagination, setPagination]       = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [loading, setLoading]             = useState(true);
    const [showAdd, setShowAdd]             = useState(false);
    const [editing, setEditing]             = useState(null);
    const [classes, setClasses]             = useState([]);
    const [form, setForm] = useState({
        title: '', content: '', targetType: 'all',
        targetClassId: '', targetGroup: ''
    });

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchNotifications = async (page = 1) => {
        setLoading(true);
        try {
            const res = await axios.get(API, { headers, params: { page, limit: 20 } });
            setNotifications(res.data.notifications || []);
            setPagination(res.data.pagination || {});
        } catch { toast.error(t('admin.auto.k_8b4841f1', 'Không thể tải thông báo!')); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchNotifications();
        // Load danh sách lớp để gửi theo lớp
        axios.get(CLASS_API, { headers, params: { limit: 100 } })
            .then(res => setClasses(res.data.classes || []))
            .catch(() => {});
    }, []);

    const resetForm = () => setForm({ title: '', content: '', targetType: 'all', targetClassId: '', targetGroup: '' });

    // CF9.1 — Tạo thông báo
    const handleSave = async () => {
        if (!form.title || !form.content) { toast.error(t('admin.auto.k_2b013c5a', 'Tiêu đề và nội dung là bắt buộc!')); return; }
        try {
            if (editing) {
                await axios.put(`${API}/${editing._id}`, form, { headers });
                toast.success(t('admin.auto.k_76ed9624', 'Đã cập nhật thông báo!'));
            } else {
                await axios.post(API, form, { headers });
                toast.success(t('admin.auto.k_cd470bc1', 'Đã tạo thông báo!'));
            }
            setShowAdd(false); setEditing(null); resetForm();
            fetchNotifications();
        } catch (err) { toast.error(err.response?.data?.message || t('admin.auto.k_33a5e01f', 'Thao tác thất bại!')); }
    };

    // CF9.3 — Gửi / gửi lại
    const handleSend = async (id) => {
        try {
            const res = await axios.post(`${API}/${id}/send`, {}, { headers });
            toast.success(res.data.message);
            fetchNotifications();
        } catch { toast.error(t('admin.auto.k_578084c1', 'Gửi thất bại!')); }
    };

    // CF9.3 — Xóa
    const handleDelete = async (id) => {
        if (!window.confirm(t('admin.auto.k_b79585f7', 'Xóa thông báo này?'))) return;
        try {
            await axios.delete(`${API}/${id}`, { headers });
            toast.success(t('admin.auto.k_3d3d633d', 'Đã xóa thông báo!'));
            fetchNotifications();
        } catch { toast.error(t('admin.auto.k_33a5e01f', 'Thao tác thất bại!')); }
    };

    const targetLabel = { all: t('admin.auto.k_3c924c34', 'Toàn hệ thống'), students: t('admin.auto.k_78d82c4a', 'Tất cả học viên'), instructors: t('admin.auto.k_367a7230', 'Tất cả giảng viên'), class: t('admin.auto.k_aa527ebe', 'Theo lớp'), group: t('admin.auto.k_699e047b', 'Theo nhóm') };
    const groupLabel  = { weak_students: t('admin.auto.k_3e46a493', 'Học viên yếu'), new_students: t('admin.auto.k_bd55c271', 'Học viên mới') };
    const getTargetDisplay = (n) => {
        if (n.targetType === 'class') {
            const cls = classes.find(c => c._id === n.targetClassId);
            return `${t('admin.auto.k_class_label', 'Class')}: ${cls?.name || n.targetClassId || '—'}`;
        }
        if (n.targetType === 'group') return `${t('admin.auto.k_group_label', 'Group')}: ${groupLabel[n.targetGroup] || n.targetGroup}`;
        return targetLabel[n.targetType] || n.targetType;
    };

    return (
        <AdminLayout>
            <div className="space-y-5">
                {/* ── Hero Banner ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-500 p-5 shadow-xl">
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-300/20 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-cyan-300/15 rounded-full blur-[50px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    <Bell size={16} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight"> {t('admin.auto.k_5fa60fcb', t('admin.auto.k_5fa60fcb', 'Quản lý thông báo'))} </h1>
                            </div>
                            <p className="text-cyan-100 text-sm"> {t('admin.auto.k_2c5d0902', t('admin.auto.k_2c5d0902', 'Gửi thông báo và thông tin quan trọng tới users dùng theo đối tượng'))} </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {[
                                    { label: t('admin.auto.k_a692dd70', 'Tổng thông báo'), val: pagination.total },
                                ].map((p, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs text-white font-medium">
                                        <span>{p.label}:</span><span className="font-bold">{p.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => fetchNotifications()}
                                className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all">
                                <RefreshCw size={16} />
                            </button>
                            <button onClick={() => { setEditing(null); resetForm(); setShowAdd(true); }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white text-cyan-700 text-sm font-bold rounded-xl hover:bg-cyan-50 transition-all shadow-lg">
                                <Plus size={15} /> {t('admin.auto.k_0e8e3d86', t('admin.auto.k_0e8e3d86', 'Tạo thông báo'))} </button>
                        </div>
                    </div>
                </div>

                {/* CF9.4 — Lịch sử thông báo */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2"><Bell size={15} className="text-blue-500" /> {t('admin.auto.k_85aa22ba', t('admin.auto.k_85aa22ba', 'Lịch sử thông báo'))} </h3>
                    </div>
                    {/* Pagination đầu trang */}
                    <PaginationBar
                        page={pagination.page} pages={pagination.pages}
                        total={pagination.total} label={t('admin.auto.k_3508c830', t('admin.auto.k_3508c830', 'thông báo'))}
                        onPage={(p) => fetchNotifications(p)} position="top"
                    />
                    <div className="divide-y divide-slate-100">
                        {loading ? (
                            <div className="text-center py-12 text-slate-400"> {t('admin.auto.k_d5fe42f6', t('admin.auto.k_d5fe42f6', 'Đang tải...'))} </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-12 text-slate-400"> {t('admin.auto.k_9f418ec5', t('admin.auto.k_9f418ec5', 'Chưa có thông báo nào'))} </div>
                        ) : notifications.map(n => (
                            <div key={n._id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-slate-800 truncate">{n.title}</h4>
                                            <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${n.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {n.status === 'sent' ? t('admin.auto.k_deeccba3', 'Đã gửi') : t('admin.auto.k_867cf3b9', 'Nháp')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 line-clamp-2">{n.content}</p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                            {/* CF9.4 — ngày gửi, users gửi, đối tượng nhận */}
                                            <span> {t('admin.auto.k_f516f342', t('admin.auto.k_f516f342', 'Đối tượng:'))} <span className="font-semibold text-slate-600">{getTargetDisplay(n)}</span></span>
                                            {n.sentAt && <span>{t('admin.auto.k_sent_at', 'Sent at')}: {new Date(n.sentAt).toLocaleString()}</span>}
                                            {n.sentBy && <span>{t('admin.auto.k_from_label', 'From')}: {n.sentBy.fullName}</span>}
                                            {n.recipientCount > 0 && <span className="text-violet-600 font-semibold">{n.recipientCount} {t('admin.auto.k_recipients', 'recipients')}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {/* CF9.3 — Gửi lại */}
                                        <button onClick={() => handleSend(n._id)} title={t('admin.auto.k_45f875c1', t('admin.auto.k_45f875c1', 'Gửi / Gửi lại'))}
                                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-600"><Send size={14} /></button>
        <button onClick={() => { setEditing(n); setForm({ title: n.title, content: n.content, targetType: n.targetType, targetClassId: n.targetClassId || '', targetGroup: n.targetGroup || '' }); setShowAdd(true); }}
                                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Edit2 size={14} /></button>
                                        <button onClick={() => handleDelete(n._id)}
                                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <PaginationBar
                        page={pagination.page} pages={pagination.pages}
                        total={pagination.total} label={t('admin.auto.k_3508c830', t('admin.auto.k_3508c830', 'thông báo'))}
                        onPage={(p) => fetchNotifications(p)} position="bottom"
                    />
                </div>
            </div>

            {/* CF9.1 — Modal tạo/sửa thông báo */}
            {showAdd && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { setShowAdd(false); setEditing(null); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-black text-slate-800 text-lg">{editing ? t('admin.auto.k_34d9e929', 'Chỉnh sửa thông báo') : t('admin.auto.k_8c56ab9e', 'Tạo thông báo mới')}</h2>
                            <button onClick={() => { setShowAdd(false); setEditing(null); }} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1"> {t('admin.auto.k_7dc6a5c8', t('admin.auto.k_7dc6a5c8', 'Tiêu đề *'))} </label>
                                <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                    placeholder={t('admin.auto.k_a92503c8', t('admin.auto.k_a92503c8', 'Nhập tiêu đề thông báo...'))} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1"> {t('admin.auto.k_6745c910', t('admin.auto.k_6745c910', 'Nội dung *'))} </label>
                                <textarea className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
                                    rows={4} placeholder={t('admin.auto.k_c070ee0f', t('admin.auto.k_c070ee0f', 'Nhập nội dung thông báo...'))} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
                            </div>
                            {/* CF9.2 — Chọn đối tượng nhận: toàn hệ thống / theo lớp / theo nhóm */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1"> {t('admin.auto.k_6d8b1e4a', t('admin.auto.k_6d8b1e4a', 'Người nhận'))} </label>
                                <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                    value={form.targetType}
                                    onChange={e => setForm({ ...form, targetType: e.target.value, targetClassId: '', targetGroup: '' })}>
                                    <option value="all"> {t('admin.auto.k_86b9a026', t('admin.auto.k_86b9a026', 'Toàn bộ hệ thống (tất cả học viên + giảng viên)'))} </option>
                                    <option value="students"> {t('admin.auto.k_78d82c4a', t('admin.auto.k_78d82c4a', 'Tất cả học viên'))} </option>
                                    <option value="instructors"> {t('admin.auto.k_367a7230', t('admin.auto.k_367a7230', 'Tất cả giảng viên'))} </option>
                                    <option value="class"> {t('admin.auto.k_aa527ebe', t('admin.auto.k_aa527ebe', 'Theo lớp'))} </option>
                                    <option value="group"> {t('admin.auto.k_699e047b', t('admin.auto.k_699e047b', 'Theo nhóm'))} </option>
                                </select>
                            </div>
                            {/* CF9.2 — Chọn lớp cụ thể */}
                            {form.targetType === 'class' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1"> {t('admin.auto.k_e1c39057', t('admin.auto.k_e1c39057', 'Chọn lớp'))} </label>
                                    <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                        value={form.targetClassId}
                                        onChange={e => setForm({ ...form, targetClassId: e.target.value })}>
                                        <option value=""> {t('admin.auto.k_07640d86', t('admin.auto.k_07640d86', '-- Chọn lớp --'))} </option>
                                        {classes.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {/* CF9.2 — Chọn nhóm */}
                            {form.targetType === 'group' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1"> {t('admin.auto.k_2c236894', t('admin.auto.k_2c236894', 'Chọn nhóm'))} </label>
                                    <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                        value={form.targetGroup}
                                        onChange={e => setForm({ ...form, targetGroup: e.target.value })}>
                                        <option value=""> {t('admin.auto.k_73892ae5', t('admin.auto.k_73892ae5', '-- Chọn nhóm --'))} </option>
                                        <option value="weak_students"> {t('admin.auto.k_6ab4fed7', t('admin.auto.k_6ab4fed7', 'Học viên yếu (điểm dưới 50)'))} </option>
                                        <option value="new_students"> {t('admin.auto.k_23eb7fe5', t('admin.auto.k_23eb7fe5', 'Học viên mới (7 ngày gần đây)'))} </option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 mt-5">
                            <button onClick={() => { setShowAdd(false); setEditing(null); }} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold"> {t('admin.auto.k_1e405035', t('admin.auto.k_1e405035', 'Hủy'))} </button>
                            <button onClick={handleSave} className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700">
                                {editing ? t('admin.auto.k_3b7db4b6', 'Cập nhật') : t('admin.auto.k_0e8e3d86', 'Tạo thông báo')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminNotifications;
