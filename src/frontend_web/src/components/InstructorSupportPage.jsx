import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import InstructorLayout from './InstructorLayout';
import {
    Headphones, Plus, X, Send, ChevronLeft, ChevronRight,
    MessageCircle, CheckCircle2, Clock, AlertCircle, XCircle,
    RefreshCw, ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

const API = 'http://localhost:5000/api/student/support';

const InstructorSupportPage = () => {
    const { t, lang } = useLanguage();

    const errorTypeLabel = {
        login:       t('instructor.support.errorLogin'),
        camera:      t('instructor.support.errorCamera'),
        exam:        t('instructor.support.errorExam'),
        recognition: t('instructor.support.errorRecognition'),
        other:       t('instructor.support.errorOther'),
    };

    const statusConfig = {
        new:        { label: t('instructor.support.statusNew'),        color: 'bg-blue-100 text-blue-700',   icon: Clock        },
        processing: { label: t('instructor.support.statusProcessing'), color: 'bg-amber-100 text-amber-700', icon: AlertCircle  },
        completed:  { label: t('instructor.support.statusCompleted'),  color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
        closed:     { label: t('instructor.support.statusClosed'),     color: 'bg-slate-100 text-slate-500', icon: XCircle      },
    };

    const statusGradients = {
        new:        'from-blue-500 to-cyan-500',
        processing: 'from-amber-500 to-orange-500',
        completed:  'from-emerald-500 to-teal-500',
        closed:     'from-slate-400 to-slate-500',
    };

    const [tickets, setTickets]           = useState([]);
    const [pagination, setPagination]     = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [loading, setLoading]           = useState(true);
    const [showForm, setShowForm]         = useState(false);
    const [activeTicket, setActiveTicket] = useState(null);
    const [message, setMessage]           = useState('');
    const [sending, setSending]           = useState(false);
    const [form, setForm]                 = useState({ title: '', content: '', errorType: 'other' });
    const [submitting, setSubmitting]     = useState(false);
    const chatEndRef = useRef(null);
    const hasFetched = useRef(false);

    const token   = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    const me      = userRaw ? JSON.parse(userRaw) : {};
    const headers = { Authorization: `Bearer ${token}` };

    const fetchTickets = async (page = 1) => {
        setLoading(true);
        try {
            const res = await axios.get(API, { headers, params: { page, limit: 10 } });
            setTickets(res.data.tickets || []);
            setPagination(res.data.pagination || {});
        } catch (err) {
            if (err.response?.status !== 503) toast.error(t('instructor.support.errorLoadList'));
            setTickets([]);
        } finally { setLoading(false); }
    };

    const fetchDetail = async (id) => {
        try {
            const res = await axios.get(`${API}/${id}`, { headers });
            setActiveTicket(res.data.ticket);
        } catch { toast.error(t('instructor.support.errorLoadDetail')); }
    };

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchTickets();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeTicket?.messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.content.trim()) {
            toast.error(t('instructor.support.enterTitle')); return;
        }
        setSubmitting(true);
        try {
            await axios.post(API, form, { headers });
            toast.success(t('instructor.support.successSend'));
            setShowForm(false);
            setForm({ title: '', content: '', errorType: 'other' });
            fetchTickets();
        } catch (err) {
            toast.error(err.response?.data?.message || t('instructor.support.errorSubmit'));
        } finally { setSubmitting(false); }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) { toast.error(t('instructor.support.enterMessage')); return; }
        setSending(true);
        try {
            await axios.post(`${API}/${activeTicket._id}/messages`, { message }, { headers });
            setMessage('');
            fetchDetail(activeTicket._id);
            fetchTickets(pagination.page);
        } catch { toast.error(t('instructor.support.errorSend'));
        } finally { setSending(false); }
    };

    const handleClose = async (id) => {
        if (!window.confirm(t('instructor.support.confirmCloseMsg'))) return;
        try {
            await axios.patch(`${API}/${id}/close`, {}, { headers });
            toast.success(t('instructor.support.successClose'));
            fetchDetail(id);
            fetchTickets(pagination.page);
        } catch (err) { toast.error(err.response?.data?.message || t('instructor.support.errorAction')); }
    };

    return (
        <InstructorLayout>
            <div className="space-y-5">

                {/* ── Hero banner ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 p-5 shadow-xl">
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-300/20 rounded-full blur-[60px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    <Headphones size={16} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight">{t('instructor.support.title')}</h1>
                            </div>
                            <p className="text-blue-100 text-sm">{t('instructor.support.subtitle')}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {[
                                    { label: t('instructor.support.totalTickets'), val: pagination.total },
                                    { label: t('instructor.support.processing'),   val: tickets.filter(tk => tk.status === 'processing').length },
                                    { label: t('instructor.support.newTickets'),   val: tickets.filter(tk => tk.status === 'new').length },
                                ].map((p, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs text-white font-medium">
                                        <span>{p.label}:</span><span className="font-bold">{p.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => fetchTickets(pagination.page)}
                                className="flex items-center gap-2 px-3 py-2.5 bg-white/15 text-white text-sm font-semibold rounded-xl hover:bg-white/25 transition-all border border-white/20">
                                <RefreshCw size={14} /> {t('instructor.support.refresh')}
                            </button>
                            <button onClick={() => setShowForm(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg">
                                <Plus size={16} /> {t('instructor.support.createNew')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Ticket list ── */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="py-16 text-center text-slate-400">{t('instructor.support.loading')}</div>
                    ) : tickets.length === 0 ? (
                        <div className="py-16 text-center">
                            <Headphones size={40} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-500 font-medium">{t('instructor.support.noTickets')}</p>
                            <p className="text-slate-400 text-sm mt-1">{t('instructor.support.noTicketsHint')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('instructor.support.ticketCode')}</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('instructor.support.titleCol')}</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('instructor.support.errorTypeCol')}</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('instructor.support.createdAt')}</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('instructor.support.statusCol')}</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('instructor.support.actionsCol')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {tickets.map(tk => {
                                        const sc = statusConfig[tk.status] || statusConfig.new;
                                        const StatusIcon = sc.icon;
                                        return (
                                            <tr key={tk._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600">{tk.ticketCode}</td>
                                                <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate font-medium">{tk.title}</td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                                                        {errorTypeLabel[tk.errorType] || t('instructor.support.errorOther')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 text-xs">
                                                    {new Date(tk.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${sc.color}`}>
                                                        <StatusIcon size={10} />{sc.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button onClick={() => fetchDetail(tk._id)}
                                                        className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                                                        <MessageCircle size={12} /> {t('instructor.support.view')}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {pagination.pages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                            <p className="text-xs text-slate-500">
                                {t('instructor.support.page', { page: pagination.page, pages: pagination.pages, total: pagination.total })}
                            </p>
                            <div className="flex gap-2">
                                <button disabled={pagination.page <= 1} onClick={() => fetchTickets(pagination.page - 1)}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40">
                                    <ChevronLeft size={15} />
                                </button>
                                <button disabled={pagination.page >= pagination.pages} onClick={() => fetchTickets(pagination.page + 1)}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40">
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Create ticket modal ── */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowForm(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                                    <Plus size={15} className="text-white" />
                                </div>
                                <h2 className="font-bold text-white text-base">{t('instructor.support.modalCreateTitle')}</h2>
                            </div>
                            <button onClick={() => setShowForm(false)}
                                className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all">
                                <X size={15} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    {t('instructor.support.titleLabel')} <span className="text-red-500 normal-case">*</span>
                                </label>
                                <input
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                                    placeholder={t('instructor.support.titlePlaceholder')}
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    maxLength={200} required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    {t('instructor.support.errorTypeLabel')}
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all pr-8"
                                        value={form.errorType}
                                        onChange={e => setForm(f => ({ ...f, errorType: e.target.value }))}>
                                        {Object.entries(errorTypeLabel).map(([v, l]) => (
                                            <option key={v} value={v}>{l}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    {t('instructor.support.contentLabel')} <span className="text-red-500 normal-case">*</span>
                                </label>
                                <textarea
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none transition-all"
                                    placeholder={t('instructor.support.contentPlaceholder')}
                                    rows={5} value={form.content}
                                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                                    {t('instructor.support.cancel')}
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:brightness-110 disabled:opacity-50 shadow-md shadow-blue-200 transition-all">
                                    <Send size={14} />
                                    {submitting ? t('instructor.support.submitting') : t('instructor.support.submit')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Ticket detail modal — 2 columns ── */}
            {activeTicket && (() => {
                const sc   = statusConfig[activeTicket.status] || statusConfig.new;
                const StatusIcon = sc.icon;
                const grad = statusGradients[activeTicket.status] || statusGradients.new;
                const isClosed = activeTicket.status === 'closed';

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3"
                        style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }}
                        onClick={() => setActiveTicket(null)}>

                        <div className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                            style={{ height: 'min(88vh, 640px)', background: '#fff' }}
                            onClick={e => e.stopPropagation()}>

                            {/* Gradient header */}
                            <div className={`bg-gradient-to-r ${grad} px-5 py-3 flex items-center justify-between shrink-0`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                        <Headphones size={15} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="font-mono text-xs font-bold text-white/80">{activeTicket.ticketCode}</p>
                                        <p className="text-white font-bold text-sm leading-tight truncate max-w-[320px]">{activeTicket.title}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold bg-white/20 backdrop-blur-sm border border-white/25 text-white">
                                        <StatusIcon size={12} />{sc.label}
                                    </span>
                                    <button onClick={() => setActiveTicket(null)}
                                        className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-all">
                                        <X size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* Body 2 columns */}
                            <div className="flex flex-1 min-h-0">

                                {/* Left column */}
                                <div className="w-[280px] shrink-0 flex flex-col overflow-y-auto"
                                    style={{ background: 'linear-gradient(160deg,#f8faff 0%,#f1f5ff 100%)', borderRight: '1px solid #e2e8f0' }}>
                                    <div className="px-4 py-3 border-b border-slate-200/70">
                                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.15em]">{t('instructor.support.requestInfo')}</p>
                                    </div>
                                    <div className="p-4 space-y-4 flex-1">
                                        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t('instructor.support.errorTypeInfo')}</p>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${grad} shrink-0`} />
                                                <span className="text-sm font-bold text-slate-700">
                                                    {errorTypeLabel[activeTicket.errorType] || t('instructor.support.errorOther')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t('instructor.support.createdAtInfo')}</p>
                                            <p className="text-sm font-semibold text-slate-700">
                                                {new Date(activeTicket.createdAt).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                                            </p>
                                        </div>
                                        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t('instructor.support.requestContent')}</p>
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{activeTicket.content}</p>
                                        </div>
                                        {activeTicket.status === 'completed' && (
                                            <button onClick={() => handleClose(activeTicket._id)}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:brightness-110"
                                                style={{ background: 'linear-gradient(135deg,#10b981,#0d9488)' }}>
                                                <CheckCircle2 size={13} /> {t('instructor.support.confirmClose')}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Right column — chat */}
                                <div className="flex-1 flex flex-col min-w-0 bg-white">
                                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0"
                                        style={{ background: 'linear-gradient(90deg,#f0f7ff,#f0f4ff)' }}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm`}>
                                                <MessageCircle size={13} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">{t('instructor.support.detailTitle')}</p>
                                                <p className="text-[10px] text-slate-400">
                                                    {(activeTicket.messages || []).length} {t('instructor.support.messages')}
                                                </p>
                                            </div>
                                        </div>
                                        {isClosed && (
                                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
                                                {t('instructor.support.ticketClosed')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
                                        style={{ background: 'linear-gradient(180deg,#fafbff 0%,#f5f7ff 100%)' }}>
                                        {(activeTicket.messages || []).length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center py-10">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-3 shadow-inner">
                                                    <MessageCircle size={26} className="text-blue-400" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-500">{t('instructor.support.noMessages')}</p>
                                                <p className="text-xs text-slate-400 mt-1">{t('instructor.support.noMessagesHint')}</p>
                                            </div>
                                        ) : (activeTicket.messages || []).map((msg, i) => {
                                            const isAdmin = msg.senderRole === 'admin';
                                            const senderName = isAdmin
                                                ? (msg.senderId?.fullName || 'Admin')
                                                : (msg.senderId?.fullName || me?.fullName || t('instructor.support.you'));
                                            return (
                                                <div key={i} className={`flex gap-2.5 ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                                                    {isAdmin && (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm mt-0.5">
                                                            {senderName.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className={`max-w-[72%] flex flex-col gap-1 ${isAdmin ? 'items-start' : 'items-end'}`}>
                                                        <p className="text-[10px] font-semibold text-slate-400 px-1">
                                                            {isAdmin
                                                                ? `${senderName} · ${t('instructor.support.supportAgent')}`
                                                                : t('instructor.support.you')}
                                                        </p>
                                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                                            isAdmin
                                                                ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                                                                : `bg-gradient-to-br ${grad} text-white rounded-tr-none shadow-md`
                                                        }`}>
                                                            {msg.message}
                                                        </div>
                                                        <p className="text-[10px] text-slate-300 px-1">
                                                            {new Date(msg.sentAt).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                                                        </p>
                                                    </div>
                                                    {!isAdmin && (
                                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm mt-0.5`}>
                                                            {(me?.fullName || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        <div ref={chatEndRef} />
                                    </div>

                                    {!isClosed ? (
                                        <div className="px-4 py-3 shrink-0"
                                            style={{ borderTop: '1px solid #e8ecf6', background: '#fff' }}>
                                            <div className="flex gap-2 items-center p-1 rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-400/20 transition-all">
                                                <input
                                                    className="flex-1 px-3 py-2 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                                                    placeholder={t('instructor.support.messagePlaceholder')}
                                                    value={message}
                                                    onChange={e => setMessage(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                                />
                                                <button onClick={handleSendMessage} disabled={sending || !message.trim()}
                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all shrink-0 ${
                                                        message.trim()
                                                            ? `bg-gradient-to-br ${grad} shadow-md hover:brightness-110`
                                                            : 'bg-slate-200 cursor-not-allowed'
                                                    }`}>
                                                    <Send size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="px-5 py-3 shrink-0 flex items-center justify-center gap-2 border-t border-slate-100 bg-slate-50">
                                            <XCircle size={14} className="text-slate-400" />
                                            <p className="text-xs text-slate-400 font-medium">{t('instructor.support.ticketClosedMsg')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </InstructorLayout>
    );
};

export default InstructorSupportPage;
