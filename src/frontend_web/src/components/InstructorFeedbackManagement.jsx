import React, { useState, useEffect, useCallback } from 'react';
import {
    MessageSquare, Plus, Trash2, Edit3, Send, Search, Filter,
    ThumbsUp, AlertTriangle, Lightbulb, Users, User, X, Check,
    ChevronLeft, ChevronRight, CheckSquare, Square, RefreshCw,
    Calendar, BookOpen, Eye, EyeOff
} from 'lucide-react';
import InstructorLayout from './InstructorLayout';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

const API = 'http://localhost:5000/api/instructor/feedback';

const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

// ── Modal: Create / Edit Feedback ───────────────────────────────────────────
const FeedbackModal = ({ mode, initial, students, onClose, onSaved }) => {
    const { t } = useLanguage();
    const [form, setForm] = useState(
        initial || { type: 'encouragement', title: '', content: '', studentIds: [], relatedAssignment: '' }
    );
    const [saving, setSaving] = useState(false);
    const [searchStu, setSearchStu] = useState('');

    const TYPE_CFG = {
        encouragement: { label: t('instructor.feedback.encouragement'), icon: ThumbsUp,      color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
        correction:    { label: t('instructor.feedback.correction'),    icon: AlertTriangle, color: 'bg-red-100 text-red-700 border-red-200',             dot: 'bg-red-500'     },
        suggestion:    { label: t('instructor.feedback.suggestion'),    icon: Lightbulb,     color: 'bg-blue-100 text-blue-700 border-blue-200',          dot: 'bg-blue-500'    },
    };

    const filtered = students.filter(s =>
        s.fullName.toLowerCase().includes(searchStu.toLowerCase()) ||
        s.email.toLowerCase().includes(searchStu.toLowerCase())
    );

    const toggleStudent = (id) => {
        setForm(p => ({
            ...p,
            studentIds: p.studentIds.includes(id)
                ? p.studentIds.filter(x => x !== id)
                : [...p.studentIds, id]
        }));
    };

    const selectAll = () => setForm(p => ({ ...p, studentIds: filtered.map(s => s._id) }));
    const clearAll  = () => setForm(p => ({ ...p, studentIds: [] }));

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.content.trim()) { toast.error(t('instructor.feedback.errorFillFields')); return; }
        if (!form.studentIds.length) { toast.error(t('instructor.feedback.errorSelectStudent')); return; }
        setSaving(true);
        try {
            const url    = mode === 'edit' ? `${API}/${initial._id}` : API;
            const method = mode === 'edit' ? 'PUT' : 'POST';
            const body   = mode === 'edit'
                ? { type: form.type, title: form.title, content: form.content }
                : { studentIds: form.studentIds, type: form.type, title: form.title, content: form.content };
            const res  = await fetch(url, { method, headers: headers(), body: JSON.stringify(body) });
            const data = await res.json();
            if (!res.ok) { toast.error(data.message); return; }
            toast.success(data.message);
            onSaved();
            onClose();
        } catch { toast.error(t('instructor.feedback.errorServer')); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <h2 className="font-bold text-slate-900 flex items-center gap-2">
                        <MessageSquare size={18} className="text-blue-600" />
                        {mode === 'edit' ? t('instructor.feedback.modalEditTitle') : t('instructor.feedback.modalCreateTitle')}
                    </h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><X size={18} /></button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-5">
                    {/* Type */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">{t('instructor.feedback.typeLabel')}</label>
                        <div className="flex gap-2">
                            {Object.entries(TYPE_CFG).map(([key, cfg]) => {
                                const Icon = cfg.icon;
                                return (
                                    <button key={key} onClick={() => setForm(p => ({ ...p, type: key }))}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-sm font-semibold transition-all ${
                                            form.type === key ? cfg.color + ' shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                        }`}>
                                        <Icon size={14} />{cfg.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            {t('instructor.feedback.titleLabel')} <span className="text-red-500">{t('instructor.feedback.required') || '*'}</span>
                        </label>
                        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder={t('instructor.feedback.titlePlaceholder')} />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            {t('instructor.feedback.contentLabel')} <span className="text-red-500">{t('instructor.feedback.required') || '*'}</span>
                        </label>
                        <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                            rows={4} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                            placeholder={t('instructor.feedback.contentPlaceholder')} />
                    </div>

                    {/* Student picker — only for create */}
                    {mode === 'create' && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold text-slate-600">
                                    {t('instructor.feedback.sendTo')} <span className="text-red-500">*</span>
                                    {form.studentIds.length > 0 && (
                                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[11px] font-bold">
                                            {t('instructor.feedback.selected', { count: form.studentIds.length })}
                                        </span>
                                    )}
                                </label>
                                <div className="flex gap-2">
                                    <button onClick={selectAll} className="text-[11px] text-blue-600 hover:underline font-semibold">{t('instructor.feedback.selectAll')}</button>
                                    <span className="text-slate-300">|</span>
                                    <button onClick={clearAll} className="text-[11px] text-slate-500 hover:underline font-semibold">{t('instructor.feedback.deselectAll')}</button>
                                </div>
                            </div>
                            <div className="relative mb-2">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={searchStu} onChange={e => setSearchStu(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    placeholder={t('instructor.feedback.searchStudent')} />
                            </div>
                            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                                {filtered.length === 0 ? (
                                    <p className="text-center text-slate-400 text-sm py-6">{t('instructor.feedback.noStudents')}</p>
                                ) : filtered.map(s => {
                                    const selected = form.studentIds.includes(s._id);
                                    return (
                                        <button key={s._id} onClick={() => toggleStudent(s._id)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-slate-50 last:border-0 ${selected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                                {selected && <Check size={12} className="text-white" />}
                                            </div>
                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                {s.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-800 truncate">{s.fullName}</p>
                                                <p className="text-xs text-slate-400 truncate">{s.email}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors font-semibold">
                        {t('instructor.feedback.cancel')}
                    </button>
                    <button onClick={handleSubmit} disabled={saving}
                        className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                        {saving ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                        {mode === 'edit'
                            ? (saving ? t('instructor.feedback.saving') : t('instructor.feedback.save'))
                            : (saving ? t('instructor.feedback.sending') : (
                                form.studentIds.length > 1
                                    ? t('instructor.feedback.sendWithCount', { count: form.studentIds.length })
                                    : t('instructor.feedback.send')
                            ))
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main Page ───────────────────────────────────────────────────────────────
const InstructorFeedbackManagement = () => {
    const { lang, t } = useLanguage();
    const [feedback, setFeedback]     = useState([]);
    const [students, setStudents]     = useState([]);
    const [loading, setLoading]       = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [filter, setFilter]         = useState('all');
    const [search, setSearch]         = useState('');
    const [selected, setSelected]     = useState([]);
    const [modal, setModal]           = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const TYPE_CFG = {
        encouragement: { label: t('instructor.feedback.encouragement'), icon: ThumbsUp,      color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
        correction:    { label: t('instructor.feedback.correction'),    icon: AlertTriangle, color: 'bg-red-100 text-red-700 border-red-200',             dot: 'bg-red-500'     },
        suggestion:    { label: t('instructor.feedback.suggestion'),    icon: Lightbulb,     color: 'bg-blue-100 text-blue-700 border-blue-200',          dot: 'bg-blue-500'    },
    };

    const fetchFeedback = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ type: filter, search, page, limit: 15 });
            const res  = await fetch(`${API}?${params}`, { headers: headers() });
            const data = await res.json();
            if (res.ok) {
                setFeedback(data.feedback || []);
                setPagination(data.pagination || {});
                setSelected([]);
            } else {
                toast.error(data.message || t('instructor.feedback.errorLoad'));
            }
        } catch (err) {
            console.error('fetchFeedback error:', err);
            toast.error(t('instructor.feedback.errorServer'));
        }
        finally { setLoading(false); }
    }, [filter, search]);

    const fetchStudents = useCallback(async () => {
        try {
            const res  = await fetch(`${API}/students`, { headers: headers() });
            const data = await res.json();
            if (res.ok) setStudents(data.students || []);
            else console.error('fetchStudents error:', data.message);
        } catch (err) {
            console.error('fetchStudents error:', err);
        }
    }, []);

    useEffect(() => { fetchStudents(); }, []);
    useEffect(() => { fetchFeedback(1); }, [filter]);

    const isFirstSearch = React.useRef(true);
    useEffect(() => {
        if (isFirstSearch.current) { isFirstSearch.current = false; return; }
        const timer = setTimeout(() => fetchFeedback(1), 400);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = async (ids) => {
        try {
            const res  = await fetch(API, { method: 'DELETE', headers: headers(), body: JSON.stringify({ ids }) });
            const data = await res.json();
            if (res.ok) { toast.success(data.message); fetchFeedback(pagination.page); }
            else toast.error(data.message);
        } catch { toast.error(t('instructor.feedback.errorDelete')); }
        finally { setDeleteConfirm(null); }
    };

    const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    const toggleAll    = () => setSelected(selected.length === feedback.length ? [] : feedback.map(f => f._id));

    const formatDate = (d) => new Date(d).toLocaleDateString(
        lang === 'vi' ? 'vi-VN' : 'en-US',
        { day: '2-digit', month: '2-digit', year: 'numeric' }
    );

    const stats = {
        total:         feedback.length,
        encouragement: feedback.filter(f => f.type === 'encouragement').length,
        correction:    feedback.filter(f => f.type === 'correction').length,
        suggestion:    feedback.filter(f => f.type === 'suggestion').length,
    };

    return (
        <InstructorLayout>
            <div className="max-w-7xl mx-auto space-y-5 pb-8">

                {/* ── Hero Header ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-5 shadow-xl">
                    <div className="absolute inset-0 particle-grid opacity-20 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/20 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-emerald-300/15 rounded-full blur-[50px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    <MessageSquare size={16} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight">{t('instructor.feedback.manageFeedback')}</h1>
                            </div>
                            <p className="text-emerald-100 text-sm">{t('instructor.feedback.manageSubtitle')}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {[
                                    { label: t('instructor.feedback.totalFeedback'), val: pagination.total },
                                    { label: t('instructor.feedback.encouragement'), val: stats.encouragement },
                                    { label: t('instructor.feedback.correction'),    val: stats.correction },
                                    { label: t('instructor.feedback.suggestion'),    val: stats.suggestion },
                                ].map((p, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs text-white font-medium">
                                        <span>{p.label}:</span><span className="font-bold">{p.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => setModal({ mode: 'create' })}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-700 text-sm font-bold rounded-xl hover:bg-emerald-50 transition-all shadow-lg flex-shrink-0">
                            <Plus size={16} /> {t('instructor.feedback.createNew')}
                        </button>
                    </div>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: t('instructor.feedback.totalFeedback'), value: pagination.total,    icon: MessageSquare, color: 'bg-slate-500'   },
                        { label: t('instructor.feedback.encouragement'), value: stats.encouragement, icon: ThumbsUp,      color: 'bg-emerald-500' },
                        { label: t('instructor.feedback.correction'),    value: stats.correction,    icon: AlertTriangle, color: 'bg-red-500'     },
                        { label: t('instructor.feedback.suggestion'),    value: stats.suggestion,    icon: Lightbulb,     color: 'bg-blue-500'    },
                    ].map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color} flex-shrink-0`}>
                                    <Icon size={16} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-800">{s.value}</p>
                                    <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Toolbar ── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="relative flex-1 w-full">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder={t('instructor.feedback.searchPlaceholder')} />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                        {[
                            ['all',           t('instructor.feedback.all')],
                            ['encouragement', t('instructor.feedback.encouragement')],
                            ['correction',    t('instructor.feedback.correction')],
                            ['suggestion',    t('instructor.feedback.suggestion')],
                        ].map(([key, label]) => (
                            <button key={key} onClick={() => setFilter(key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                    {selected.length > 0 && (
                        <button onClick={() => setDeleteConfirm('bulk')}
                            className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors flex-shrink-0">
                            <Trash2 size={14} /> {t('instructor.feedback.deleteSelected', { count: selected.length })}
                        </button>
                    )}
                </div>

                {/* ── Table ── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-[32px_1fr_140px_100px_120px_88px] gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide">
                        <button onClick={toggleAll} className="flex items-center justify-center">
                            {selected.length === feedback.length && feedback.length > 0
                                ? <CheckSquare size={15} className="text-blue-600" />
                                : <Square size={15} className="text-slate-400" />}
                        </button>
                        <span>{t('instructor.feedback.feedbackCol')}</span>
                        <span>{t('instructor.feedback.studentCol')}</span>
                        <span>{t('instructor.feedback.typeCol')}</span>
                        <span>{t('instructor.feedback.dateCol')}</span>
                        <span className="text-right">{t('instructor.feedback.actionsCol')}</span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <RefreshCw size={24} className="animate-spin text-blue-400" />
                        </div>
                    ) : feedback.length === 0 ? (
                        <div className="text-center py-16">
                            <MessageSquare size={36} className="text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">{t('instructor.feedback.noFeedback')}</p>
                            <p className="text-slate-400 text-sm mt-1">{t('instructor.feedback.noFeedbackHint')}</p>
                        </div>
                    ) : feedback.map((item) => {
                        const cfg  = TYPE_CFG[item.type] || TYPE_CFG.suggestion;
                        const Icon = cfg.icon;
                        const isSelected = selected.includes(item._id);
                        return (
                            <div key={item._id}
                                className={`grid grid-cols-[32px_1fr_140px_100px_120px_88px] gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0 items-center transition-colors ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/60'}`}>
                                <button onClick={() => toggleSelect(item._id)} className="flex items-center justify-center">
                                    {isSelected
                                        ? <CheckSquare size={15} className="text-blue-600" />
                                        : <Square size={15} className="text-slate-300 hover:text-slate-500" />}
                                </button>
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 text-sm truncate">{item.title}</p>
                                    <p className="text-xs text-slate-400 truncate mt-0.5">{item.content}</p>
                                    {item.relatedAssignment && (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mt-1">
                                            <BookOpen size={9} />{item.relatedAssignment.title}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                        {(item.studentId?.fullName || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-xs text-slate-700 font-medium truncate">{item.studentId?.fullName || '—'}</span>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold ${cfg.color}`}>
                                    <Icon size={11} />{cfg.label}
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Calendar size={11} />{formatDate(item.createdAt)}
                                </span>
                                <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => setModal({ mode: 'edit', data: { ...item, studentIds: [item.studentId?._id] } })}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit3 size={14} />
                                    </button>
                                    <button onClick={() => setDeleteConfirm(`single:${item._id}`)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Pagination ── */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
                        <p className="text-sm text-slate-500">
                            {t('instructor.feedback.page', { page: pagination.page, pages: pagination.pages, total: pagination.total })}
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => fetchFeedback(pagination.page - 1)} disabled={pagination.page === 1}
                                className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={() => fetchFeedback(pagination.page + 1)} disabled={pagination.page === pagination.pages}
                                className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Create / Edit Modal ── */}
            {modal && (
                <FeedbackModal
                    mode={modal.mode}
                    initial={modal.data}
                    students={students}
                    onClose={() => setModal(null)}
                    onSaved={() => fetchFeedback(pagination.page)}
                />
            )}

            {/* ── Delete Confirm ── */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={22} className="text-red-600" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-center mb-2">{t('instructor.feedback.confirmDelete')}</h3>
                        <p className="text-slate-500 text-sm text-center mb-6">
                            {deleteConfirm === 'bulk'
                                ? t('instructor.feedback.confirmDeleteBulk', { count: selected.length })
                                : t('instructor.feedback.confirmDeleteSingle')}
                            <br /><span className="text-red-500 font-medium">{t('instructor.feedback.cannotUndo')}</span>
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                                {t('instructor.feedback.cancel')}
                            </button>
                            <button onClick={() => {
                                if (deleteConfirm === 'bulk') handleDelete(selected);
                                else handleDelete([deleteConfirm.replace('single:', '')]);
                            }}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
                                {t('instructor.feedback.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </InstructorLayout>
    );
};

export default InstructorFeedbackManagement;
