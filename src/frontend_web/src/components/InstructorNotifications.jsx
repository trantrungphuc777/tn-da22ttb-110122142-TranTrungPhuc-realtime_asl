import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, Send, Users, CheckCircle, Clock, AlertCircle, FileText,
    Trash2, RefreshCw, Search, Filter, Plus, MessageSquare,
    Megaphone, BookOpen, Star, ChevronLeft, ChevronRight,
    Eye, MoreVertical, X, Zap, Calendar, UserCheck
} from 'lucide-react';
import InstructorLayout from './InstructorLayout';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

/* ── type config ── */
const TYPE_CONFIG = {
    announcement: { icon: Megaphone,    bg: 'bg-blue-100',   text: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500'   },
    assignment:   { icon: BookOpen,     bg: 'bg-emerald-100',text: 'text-emerald-600',badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    reminder:     { icon: AlertCircle,  bg: 'bg-amber-100',  text: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500'  },
    result:       { icon: Star,         bg: 'bg-purple-100', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700',dot: 'bg-purple-500' },
};
const getConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.announcement;

const fmtDate = (d, t, lang) => {
    if (!d) return '';
    const now = new Date(), dt = new Date(d);
    const diff = Math.floor((now - dt) / 1000);
    if (diff < 60) return t('instructor.notifications.justNow');
    if (diff < 3600) return `${Math.floor(diff/60)} ${t('instructor.notifications.minutesAgo')}`;
    if (diff < 86400) return `${Math.floor(diff/3600)} ${t('instructor.notifications.hoursAgo')}`;
    if (diff < 604800) return `${Math.floor(diff/86400)} ${t('instructor.notifications.daysAgo')}`;
    return dt.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US');
};

/* ── quick templates ── */
const TEMPLATES = [
    { type: 'reminder',     titleKey: 'instructor.notifications.tplReminderTitle',       messageKey: 'instructor.notifications.tplReminderMsg' },
    { type: 'announcement', titleKey: 'instructor.notifications.tplAnnouncementTitle',   messageKey: 'instructor.notifications.tplAnnouncementMsg' },
    { type: 'result',       titleKey: 'instructor.notifications.tplResultTitle',          messageKey: 'instructor.notifications.tplResultMsg' },
    { type: 'assignment',   titleKey: 'instructor.notifications.tplAssignmentTitle',      messageKey: 'instructor.notifications.tplAssignmentMsg' },
];

const InstructorNotifications = () => {
    const navigate = useNavigate();
    const { lang, t } = useLanguage();
    const hasFetched = useRef(false);
    const isFirstRender = useRef(true);

    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [showCompose, setShowCompose] = useState(false);
    const [showQuickSend, setShowQuickSend] = useState(false);
    const [quickTpl, setQuickTpl] = useState(null);
    const [quickMsg, setQuickMsg] = useState('');
    const [quickRecipientMode, setQuickRecipientMode] = useState('all'); // 'all' | 'specific'
    const [quickSelectedStudents, setQuickSelectedStudents] = useState([]);
    const [quickStudentSearch, setQuickStudentSearch] = useState('');
    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [formData, setFormData] = useState({ type: 'announcement', title: '', message: '', priority: 'normal', scheduledFor: '' });
    const [showPreview, setShowPreview] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!localStorage.getItem('token')) { navigate('/login'); return; }
        if (user.role !== 'instructor' && user.role !== 'admin') { navigate('/dashboard'); return; }
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        fetchNotifications();
    }, [pagination.page]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/instructor/notifications?page=${pagination.page}&limit=20`, { headers: { Authorization: `Bearer ${token}` } });
            const result = await res.json();
            if (res.ok) { setNotifications(result.notifications || []); setPagination(result.pagination || {}); }
        } catch (e) { /* silent */ }
        finally { setLoading(false); }
    };

    const handleSend = async () => {
        if (!formData.title.trim() || !formData.message.trim()) {
            toast.error(t('instructor.notifications.fillAllFields')); return;
        }
        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const payload = { ...formData };
            if (!payload.scheduledFor) delete payload.scheduledFor;
            const res = await fetch('http://localhost:5000/api/instructor/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (res.ok) {
                toast.success(t('instructor.notifications.sendSuccess'));
                setShowCompose(false);
                setShowPreview(false);
                setFormData({ type: 'announcement', title: '', message: '', priority: 'normal', scheduledFor: '' });
                hasFetched.current = false; fetchNotifications();
            } else {
                toast.error(result.message || t('instructor.notifications.sendFailed'));
            }
        } catch (e) {
            toast.error(t('instructor.notifications.serverError'));
        }
        finally { setSending(false); }
    };

    const fetchStudents = async () => {
        if (students.length > 0) return; // đã fetch rồi
        try {
            setLoadingStudents(true);
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/instructor/students?limit=200', { headers: { Authorization: `Bearer ${token}` } });
            const result = await res.json();
            if (res.ok) setStudents(result.students || []);
        } catch (e) { /* silent */ }
        finally { setLoadingStudents(false); }
    };

    const handleQuickSend = async () => {
        if (!quickTpl) return;
        const msgToSend = quickMsg.trim() || t(quickTpl.messageKey);
        const recipients = quickRecipientMode === 'specific' ? quickSelectedStudents : [];
        if (quickRecipientMode === 'specific' && recipients.length === 0) {
            toast.error(t('instructor.notifications.fillAllFields')); return;
        }
        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/instructor/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ type: quickTpl.type, title: t(quickTpl.titleKey), message: msgToSend, recipients })
            });
            const result = await res.json();
            if (res.ok) {
                toast.success(t('instructor.notifications.sendSuccess'));
                setShowQuickSend(false);
                setQuickTpl(null);
                setQuickMsg('');
                setQuickRecipientMode('all');
                setQuickSelectedStudents([]);
                hasFetched.current = false; fetchNotifications();
            } else {
                toast.error(result.message || t('instructor.notifications.sendFailed'));
            }
        } catch (e) {
            toast.error(t('instructor.notifications.serverError'));
        }
        finally { setSending(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('instructor.notifications.confirmDelete'))) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/instructor/notifications/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { toast.success(t('instructor.notifications.deleted')); setNotifications(prev => prev.filter(n => n._id !== id)); }
        } catch (e) { toast.error(t('instructor.notifications.deleteError')); }
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return;
        if (!window.confirm(t('instructor.notifications.confirmBulkDelete', { count: selectedIds.length }))) return;
        const token = localStorage.getItem('token');
        await Promise.all(selectedIds.map(id => fetch(`http://localhost:5000/api/instructor/notifications/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })));
        toast.success(t('instructor.notifications.bulkDeleted', { count: selectedIds.length }));
        setSelectedIds([]);
        hasFetched.current = false; fetchNotifications();
    };

    const applyTemplate = (tpl) => setFormData(prev => ({ ...prev, type: tpl.type, title: t(tpl.titleKey), message: t(tpl.messageKey) }));

    /* ── derived ── */
    const filtered = useMemo(() => {
        let arr = notifications;
        if (filterType !== 'all') arr = arr.filter(n => n.type === filterType);
        if (searchTerm) arr = arr.filter(n => n.title?.toLowerCase().includes(searchTerm.toLowerCase()) || n.content?.toLowerCase().includes(searchTerm.toLowerCase()));
        return arr;
    }, [notifications, filterType, searchTerm]);

    const stats = useMemo(() => ({
        total: notifications.length,
        announcement: notifications.filter(n=>n.type==='announcement').length,
        reminder: notifications.filter(n=>n.type==='reminder').length,
        assignment: notifications.filter(n=>n.type==='assignment').length,
        result: notifications.filter(n=>n.type==='result').length,
    }), [notifications]);

    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i=>i!==id) : [...prev, id]);
    const toggleSelectAll = () => setSelectedIds(selectedIds.length===filtered.length ? [] : filtered.map(n=>n._id));

    return (
        <InstructorLayout>
            <div className="max-w-7xl mx-auto space-y-5 pb-6">

                {/* ── Hero Header ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-5 shadow-xl">
                    <div className="absolute inset-0 particle-grid opacity-20 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/20 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-blue-300/15 rounded-full blur-[50px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    <Bell size={16} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight">{t('instructor.notifications.title')}</h1>
                            </div>
                            <p className="text-blue-100 text-sm">{t('instructor.notifications.subtitle')}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {[
                                    { labelKey: 'instructor.notifications.total', val: stats.total },
                                    { labelKey: 'instructor.notifications.general', val: stats.announcement },
                                    { labelKey: 'instructor.notifications.reminder', val: stats.reminder },
                                    { labelKey: 'instructor.notifications.assignment', val: stats.assignment },
                                ].map((p,i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs text-white font-medium">
                                        <span>{t(p.labelKey)}:</span><span className="font-bold">{p.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={()=>{hasFetched.current=false;fetchNotifications();}} disabled={loading}
                                className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all disabled:opacity-50">
                                <RefreshCw size={16} className={loading?'animate-spin':''}/>
                            </button>
                            <button onClick={()=>setShowCompose(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg">
                                <Plus size={16}/>{t('instructor.notifications.compose')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick send templates */}
                <div className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 rounded-xl p-4 border border-indigo-300/70 shadow-sm">
                    <p className="text-indigo-800 font-bold text-sm mb-3 flex items-center gap-2">
                        <Zap size={15} className="text-amber-500"/>
                        {t('instructor.notifications.quickSendTemplates')}
                        <span className="text-xs font-normal text-indigo-500 ml-1">{t('instructor.notifications.clickToCompose')}</span>
                    </p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {TEMPLATES.map((tpl,i) => {
                            const cfg = getConfig(tpl.type);
                            const Icon = cfg.icon;
                            const cardColors = [
                                'bg-amber-100 border-amber-300 hover:bg-amber-200 hover:border-amber-400',
                                'bg-blue-100 border-blue-300 hover:bg-blue-200 hover:border-blue-400',
                                'bg-purple-100 border-purple-300 hover:bg-purple-200 hover:border-purple-400',
                                'bg-emerald-100 border-emerald-300 hover:bg-emerald-200 hover:border-emerald-400',
                            ];
                            return (
                                <button key={i} onClick={()=>{ setQuickTpl(tpl); setQuickMsg(t(tpl.messageKey)); setQuickRecipientMode('all'); setQuickSelectedStudents([]); setQuickStudentSearch(''); setShowQuickSend(true); fetchStudents(); }}
                                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all shadow-sm hover:shadow-md group ${cardColors[i]}`}>
                                    <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                        <Icon size={15} className={cfg.text}/>
                                    </div>
                                    <span className="text-slate-800 text-xs font-semibold leading-tight group-hover:text-slate-900 transition-colors">{t(tpl.titleKey)}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Filter + Search + Bulk ── */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-blue-100/80 p-4 shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                            <input type="text" placeholder={t('instructor.notifications.searchPlaceholder')} value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all"/>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                                { key: 'all', labelKey: 'instructor.notifications.all' },
                                { key: 'announcement', labelKey: 'instructor.notifications.general' },
                                { key: 'reminder', labelKey: 'instructor.notifications.reminder' },
                                { key: 'assignment', labelKey: 'instructor.notifications.assignment' },
                                { key: 'result', labelKey: 'instructor.notifications.result' },
                            ].map(f => (
                                <button key={f.key} onClick={()=>setFilterType(f.key)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filterType===f.key
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                                        : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200/60'}`}>
                                    {t(f.labelKey)}
                                </button>
                            ))}
                        </div>
                    </div>
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-3 px-3 py-2.5 bg-red-50 rounded-xl border border-red-200/60">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                            <span className="text-sm text-red-700 font-semibold">{selectedIds.length} {t('instructor.notifications.selected')}</span>
                            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                                <Trash2 size={12}/>{t('instructor.notifications.deleteSelected')}
                            </button>
                            <button onClick={()=>setSelectedIds([])} className="text-xs text-red-500 hover:text-red-700 font-medium">{t('instructor.notifications.deselect')}</button>
                        </div>
                    )}
                </div>

                {/* ── Notifications list ── */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-blue-100/80 shadow-sm overflow-hidden"
                    style={{ boxShadow: '0 4px 24px -8px rgba(59,130,246,0.12)' }}>
                    {filtered.length > 0 && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border-b border-blue-100/60">
                            <input type="checkbox" checked={selectedIds.length===filtered.length && filtered.length>0} onChange={toggleSelectAll} className="rounded accent-blue-600"/>
                            <span className="flex-1 text-xs font-bold text-blue-700 uppercase tracking-wider">{t('instructor.notifications.notification')}</span>
                            <span className="hidden sm:block w-24 text-xs font-bold text-blue-700 uppercase tracking-wider">{t('instructor.notifications.type')}</span>
                            <span className="hidden md:block w-24 text-xs font-bold text-blue-700 uppercase tracking-wider">{t('instructor.notifications.recipients')}</span>
                            <span className="hidden lg:block w-28 text-xs font-bold text-blue-700 uppercase tracking-wider">{t('instructor.notifications.time')}</span>
                            <span className="w-16 text-right text-xs font-bold text-blue-700 uppercase tracking-wider">{t('instructor.notifications.delete')}</span>
                        </div>
                    )}
                    {loading ? (
                        <div className="flex flex-col items-center py-16 gap-4">
                            <div className="relative w-12 h-12">
                                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                                <div className="absolute inset-2 w-8 h-8 border-4 border-indigo-100 border-b-indigo-500 rounded-full animate-spin" style={{animationDirection:'reverse',animationDuration:'0.8s'}} />
                            </div>
                            <p className="text-slate-400 text-sm font-medium">{t('common.loading')}</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center py-16 gap-4">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center">
                                    <Bell size={32} className="text-blue-300"/>
                                </div>
                                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-md">
                                    <Plus size={12} className="text-white"/>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-slate-700 font-semibold">{searchTerm||filterType!=='all'?t('instructor.notifications.noResultsFound'):t('instructor.notifications.noNotifications')}</p>
                                <p className="text-slate-400 text-sm mt-1">{t('instructor.notifications.createFirstToStart')}</p>
                            </div>
                            {!searchTerm && filterType==='all' && (
                                <button onClick={()=>setShowCompose(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/20">
                                    <Plus size={15}/>{t('instructor.notifications.createFirstNotif')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100/80">
                            {filtered.map((n) => {
                                const cfg = getConfig(n.type);
                                const Icon = cfg.icon;
                                const isSelected = selectedIds.includes(n._id);
                                return (
                                    <div key={n._id}
                                        className={`flex items-center gap-3 px-4 py-4 transition-all duration-200 group ${
                                            isSelected
                                                ? 'bg-blue-50/70 border-l-2 border-blue-500'
                                                : 'hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-indigo-50/20 border-l-2 border-transparent hover:border-blue-300'
                                        }`}>
                                        <input type="checkbox" checked={isSelected} onChange={()=>toggleSelect(n._id)} className="rounded accent-blue-600 flex-shrink-0"/>
                                        <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} shadow-sm`}>
                                            <Icon size={17} className={cfg.text}/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="font-bold text-slate-800 text-sm truncate">{lang === 'en' && n.titleEn ? n.titleEn : n.title}</p>
                                                <span className={`hidden sm:inline px-2 py-0.5 text-[10px] font-bold rounded-full flex-shrink-0 ${cfg.badge}`}>
                                                    {n.type==='announcement'?t('instructor.notifications.typeGeneral'):n.type==='reminder'?t('instructor.notifications.typeReminder'):n.type==='assignment'?t('instructor.notifications.typeAssignment'):t('instructor.notifications.typeResult')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-1">{n.content}</p>
                                            <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                                                <span className="flex items-center gap-1"><Users size={10}/>{n.totalRecipients||0} {t('instructor.notifications.recipients')}</span>
                                                <span className="flex items-center gap-1 sm:hidden"><Clock size={10}/>{fmtDate(n.createdAt, t, lang)}</span>
                                            </div>
                                        </div>
                                        <span className="hidden md:flex items-center gap-1 text-xs text-slate-500 w-24 flex-shrink-0"><Users size={11} className="text-slate-400"/>{n.totalRecipients||0}</span>
                                        <span className="hidden lg:block text-xs text-slate-400 w-28 flex-shrink-0">{fmtDate(n.createdAt, t, lang)}</span>
                                        <div className="flex items-center gap-1 w-16 justify-end flex-shrink-0">
                                            <button onClick={()=>handleDelete(n._id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110">
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {pagination.pages > 1 && (
                        <div className="px-4 py-3 border-t border-blue-100/60 bg-gradient-to-r from-blue-50/40 to-indigo-50/30 flex items-center justify-between">
                            <p className="text-xs text-slate-500 font-medium">{t('instructor.notifications.page')} {pagination.page}/{pagination.pages} · {pagination.total} {t('instructor.notifications.notifications')}</p>
                            <div className="flex items-center gap-1.5">
                                <button onClick={()=>setPagination(p=>({...p,page:p.page-1}))} disabled={pagination.page===1} className="p-1.5 rounded-lg border border-blue-200/60 disabled:opacity-40 hover:bg-blue-50 text-blue-600 transition-colors"><ChevronLeft size={15}/></button>
                                <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-bold shadow-sm">{pagination.page}</span>
                                <button onClick={()=>setPagination(p=>({...p,page:p.page+1}))} disabled={pagination.page===pagination.pages} className="p-1.5 rounded-lg border border-blue-200/60 disabled:opacity-40 hover:bg-blue-50 text-blue-600 transition-colors"><ChevronRight size={15}/></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Quick Send Modal ── */}
            {showQuickSend && quickTpl && (() => {
                const cfg = getConfig(quickTpl.type);
                const Icon = cfg.icon;
                return (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden"
                            style={{ boxShadow: '0 32px 64px -12px rgba(15,23,42,0.25)' }}>
                            <div className={`relative px-6 pt-6 pb-5 overflow-hidden bg-gradient-to-br ${
                                quickTpl.type==='reminder' ? 'from-amber-500 to-orange-500' :
                                quickTpl.type==='result'   ? 'from-purple-600 to-pink-500' :
                                quickTpl.type==='assignment'? 'from-emerald-500 to-teal-500' :
                                'from-blue-600 to-indigo-600'
                            }`}>
                                <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize:'20px 20px'}}/>
                                <div className="relative flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 flex-shrink-0">
                                            <Icon size={18} className="text-white"/>
                                        </div>
                                        <div>
                                            <p className="text-white/70 text-xs font-medium">{t('instructor.notifications.quickSendTemplates')}</p>
                                            <h2 className="font-bold text-white text-base leading-tight">{t(quickTpl.titleKey)}</h2>
                                        </div>
                                    </div>
                                    <button onClick={()=>{setShowQuickSend(false);setQuickTpl(null);setQuickMsg('');setQuickRecipientMode('all');setQuickSelectedStudents([]);setQuickStudentSearch('');}}
                                        className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all flex-shrink-0">
                                        <X size={16}/>
                                    </button>
                                </div>
                            </div>
                            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                                {/* Editable message */}
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">{t('instructor.notifications.contentLabel')} <span className="text-red-400">*</span></p>
                                    <textarea
                                        value={quickMsg}
                                        onChange={e => setQuickMsg(e.target.value.slice(0, 500))}
                                        rows="4"
                                        className="w-full px-4 py-3 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 focus:bg-white transition-all resize-none"
                                    />
                                    <p className="text-right text-[10px] text-slate-300 mt-1">{quickMsg.length}/500</p>
                                </div>

                                {/* Recipient mode */}
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">{t('instructor.notifications.recipientsLabel')}</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => setQuickRecipientMode('all')}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${quickRecipientMode === 'all' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'}`}>
                                            <Users size={14} className="inline mr-1.5"/>{t('instructor.notifications.willSendToAll') ? (lang === 'en' ? 'All Students' : 'Tất cả học viên') : 'Tất cả học viên'}
                                        </button>
                                        <button onClick={() => { setQuickRecipientMode('specific'); }}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${quickRecipientMode === 'specific' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'}`}>
                                            <CheckCircle size={14} className="inline mr-1.5"/>{lang === 'en' ? 'Select specific' : 'Chọn từng người'}
                                        </button>
                                    </div>
                                </div>

                                {/* Student list when specific mode */}
                                {quickRecipientMode === 'specific' && (
                                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                        {/* Header: tiêu đề + đã chọn */}
                                        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                            <span className="text-xs font-semibold text-slate-500">{t('instructor.students.title')}</span>
                                            {quickSelectedStudents.length > 0 && (
                                                <span className="text-xs font-bold text-blue-600">{t('instructor.notifications.selected')}: {quickSelectedStudents.length}</span>
                                            )}
                                        </div>
                                        {/* Thanh tìm kiếm */}
                                        <div className="px-3 py-2 border-b border-slate-100 bg-white">
                                            <div className="relative">
                                                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                                                <input
                                                    type="text"
                                                    placeholder={t('instructor.students.search')}
                                                    value={quickStudentSearch}
                                                    onChange={e => setQuickStudentSearch(e.target.value)}
                                                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-300 transition-all"
                                                />
                                                {quickStudentSearch && (
                                                    <button onClick={() => setQuickStudentSearch('')}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                                                        <X size={12}/>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {loadingStudents ? (
                                            <div className="flex items-center justify-center py-6">
                                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
                                            </div>
                                        ) : (() => {
                                            const filtered = students.filter(s =>
                                                !quickStudentSearch ||
                                                s.fullName?.toLowerCase().includes(quickStudentSearch.toLowerCase()) ||
                                                s.username?.toLowerCase().includes(quickStudentSearch.toLowerCase())
                                            );
                                            const allFilteredSelected = filtered.length > 0 && filtered.every(s => quickSelectedStudents.includes(s._id));
                                            return filtered.length === 0 ? (
                                                <p className="text-center text-sm text-slate-400 py-5">{t('instructor.students.noStudents')}</p>
                                            ) : (
                                                <>
                                                    {/* Chọn tất cả kết quả lọc */}
                                                    <label className="flex items-center gap-3 px-4 py-2 bg-blue-50/60 border-b border-slate-100 cursor-pointer">
                                                        <input type="checkbox" checked={allFilteredSelected}
                                                            onChange={() => {
                                                                if (allFilteredSelected) {
                                                                    setQuickSelectedStudents(prev => prev.filter(id => !filtered.find(s => s._id === id)));
                                                                } else {
                                                                    const newIds = filtered.map(s => s._id).filter(id => !quickSelectedStudents.includes(id));
                                                                    setQuickSelectedStudents(prev => [...prev, ...newIds]);
                                                                }
                                                            }}
                                                            className="rounded accent-blue-600 flex-shrink-0"/>
                                                        <span className="text-xs font-semibold text-blue-700">
                                                            {allFilteredSelected ? (lang === 'en' ? 'Deselect all' : 'Bỏ chọn tất cả') : `${t('instructor.feedback.selectAll')} (${filtered.length})`}
                                                        </span>
                                                    </label>
                                                    <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
                                                        {filtered.map(s => {
                                                            const checked = quickSelectedStudents.includes(s._id);
                                                            return (
                                                                <label key={s._id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${checked ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                                                                    <input type="checkbox" checked={checked}
                                                                        onChange={() => setQuickSelectedStudents(prev => checked ? prev.filter(id => id !== s._id) : [...prev, s._id])}
                                                                        className="rounded accent-blue-600 flex-shrink-0"/>
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-medium text-slate-800 truncate">{s.fullName}</p>
                                                                        <p className="text-xs text-slate-400 truncate">{s.username}</p>
                                                                    </div>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}

                                {quickRecipientMode === 'all' && (
                                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                        <Users size={14} className="text-blue-500 flex-shrink-0"/>
                                        <p className="text-xs text-blue-700 font-medium">{t('instructor.notifications.willSendToAll')}</p>
                                    </div>
                                )}
                            </div>
                            <div className="px-6 pb-6 flex gap-3">
                                <button onClick={()=>{setShowQuickSend(false);setQuickTpl(null);setQuickMsg('');setQuickRecipientMode('all');setQuickSelectedStudents([]);setQuickStudentSearch('');}}
                                    className="flex-1 py-3 rounded-2xl text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all">
                                    {t('common.cancel')}
                                </button>
                                <button onClick={handleQuickSend} disabled={sending}
                                    className={`flex-1 py-3 text-white text-sm font-bold rounded-2xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg ${
                                        quickTpl.type==='reminder' ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/25' :
                                        quickTpl.type==='result'   ? 'bg-gradient-to-r from-purple-600 to-pink-500 shadow-purple-500/25' :
                                        quickTpl.type==='assignment'? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/25' :
                                        'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/25'
                                    }`}>
                                    {sending
                                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>{t('instructor.notifications.sending')}</>
                                        : <><Send size={14}/>{t('instructor.notifications.sendNotif')}</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── Compose Modal (Full) ── */}
            {showCompose && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden"
                        style={{ boxShadow: '0 32px 64px -12px rgba(15,23,42,0.25)' }}>

                        {/* Header */}
                        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 overflow-hidden">
                            <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize:'24px 24px'}}/>
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                        <Send size={16} className="text-white"/>
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-white text-base leading-tight">{t('instructor.notifications.composeNotifTitle')}</h2>
                                        <p className="text-blue-100 text-xs mt-0.5">{t('instructor.notifications.willSendToAll')}</p>
                                    </div>
                                </div>
                                <button onClick={()=>{setShowCompose(false);setShowPreview(false);}}
                                    className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all">
                                    <X size={16}/>
                                </button>
                            </div>
                        </div>

                        {!showPreview ? (
                            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
                                {/* Notification Type */}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                                        {t('instructor.notifications.notifType')}
                                    </label>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
                                            const Icon = cfg.icon;
                                            const isChosen = formData.type === type;
                                            return (
                                                <button key={type} onClick={()=>setFormData(p=>({...p,type}))}
                                                    className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-2xl border-2 transition-all ${
                                                        isChosen ? `border-blue-500 ${cfg.bg}` : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                                                    }`}>
                                                    <div className={`w-7 h-7 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                                                        <Icon size={13} className={cfg.text}/>
                                                    </div>
                                                    <span className={`text-[10px] font-semibold text-center leading-tight ${isChosen ? 'text-slate-800' : 'text-slate-500'}`}>
                                                        {type==='announcement'?t('instructor.notifications.typeAnnouncement'):type==='assignment'?t('instructor.notifications.assignment'):type==='reminder'?t('instructor.notifications.typeReminderOption'):t('instructor.notifications.typeResultOption')}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                                        {t('instructor.notifications.titleLabel')} <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e=>setFormData(p=>({...p,title:e.target.value.slice(0,100)}))}
                                        className="w-full px-4 py-3 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-300"
                                        placeholder={t('instructor.notifications.titlePlaceholder')}
                                    />
                                    <p className="text-right text-[10px] text-slate-300">{formData.title.length}/100</p>
                                </div>

                                {/* Message */}
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                                        {t('instructor.notifications.contentLabel')} <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        value={formData.message}
                                        onChange={e=>setFormData(p=>({...p,message:e.target.value.slice(0,500)}))}
                                        rows="4"
                                        className="w-full px-4 py-3 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 focus:bg-white transition-all resize-none placeholder:text-slate-300"
                                        placeholder={t('instructor.notifications.contentPlaceholder')}
                                    />
                                    <p className="text-right text-[10px] text-slate-300">{formData.message.length}/500</p>
                                </div>

                                {/* Schedule */}
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Calendar size={11}/>{t('instructor.notifications.scheduleLabel')}
                                        <span className="text-slate-300 font-normal normal-case tracking-normal">({t('instructor.notifications.scheduleOptional')})</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.scheduledFor}
                                        onChange={e=>setFormData(p=>({...p,scheduledFor:e.target.value}))}
                                        min={new Date().toISOString().slice(0,16)}
                                        className="w-full px-4 py-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                        ) : (
                            /* Preview */
                            <div className="px-6 py-5 space-y-4">
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{t('instructor.notifications.preview')}</p>
                                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                    <div className={`px-4 py-3 flex items-center gap-3 ${getConfig(formData.type).bg}`}>
                                        {(() => { const Icon = getConfig(formData.type).icon; return <Icon size={16} className={getConfig(formData.type).text}/>; })()}
                                        <span className={`text-sm font-bold ${getConfig(formData.type).text}`}>{formData.title || t('instructor.notifications.titlePlaceholder')}</span>
                                    </div>
                                    <div className="px-4 py-3 bg-white">
                                        <p className="text-sm text-slate-600 leading-relaxed">{formData.message || t('instructor.notifications.contentPlaceholder')}</p>
                                        {formData.scheduledFor && (
                                            <div className="flex items-center gap-1.5 mt-3 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl w-fit border border-amber-100">
                                                <Calendar size={11}/>{t('instructor.notifications.scheduledFor')}: {new Date(formData.scheduledFor).toLocaleString(lang==='vi'?'vi-VN':'en-US')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                                        <Users size={12} className="text-slate-400"/>
                                        <span className="text-xs text-slate-500">{t('instructor.notifications.willSendToAll')}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="px-6 pb-6 flex gap-3 border-t border-slate-100 pt-4">
                            {showPreview ? (
                                <>
                                    <button onClick={()=>setShowPreview(false)}
                                        className="flex-1 py-3 rounded-2xl text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all">
                                        ← {t('instructor.notifications.backToEdit')}
                                    </button>
                                    <button onClick={handleSend} disabled={sending}
                                        className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25">
                                        {sending
                                            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>{t('instructor.notifications.sending')}</>
                                            : <><Send size={14}/>{t('instructor.notifications.sendNotif')}</>
                                        }
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={()=>{setShowCompose(false);setShowPreview(false);}}
                                        className="flex-1 py-3 rounded-2xl text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all">
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={()=>setShowPreview(true)}
                                        disabled={!formData.title||!formData.message}
                                        className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25">
                                        <Eye size={14}/>{t('instructor.notifications.previewBtn')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </InstructorLayout>
    );
};

export default InstructorNotifications;
