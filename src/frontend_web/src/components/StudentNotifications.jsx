import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, Mail, FileText, Brain, AlertCircle, Clock,
    CheckCircle, ChevronLeft, ChevronRight, Eye, Check,
    Filter, Zap, AlertTriangle, BookOpen, ArrowRight,
    Sparkles, Shield, TrendingUp
} from 'lucide-react';
import Layout from './Layout';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-hot-toast';

const SYSTEM_READ_KEY = 'system_alerts_read';
const getReadSystemAlerts = () => { try { return JSON.parse(localStorage.getItem(SYSTEM_READ_KEY) || '[]'); } catch { return []; } };
const saveReadSystemAlerts = (ids) => { localStorage.setItem(SYSTEM_READ_KEY, JSON.stringify(ids)); };
const dispatchSystemAlertUpdate = () => { window.dispatchEvent(new CustomEvent('systemAlertsUpdated')); };

// Trích xuất itemId gốc (bỏ prefix trạng thái) để lưu dạng bất biến
// Ví dụ: "soon-abc123" → "abc123", "exam-urgent-abc123" → "abc123"
const extractItemId = (alertId) => {
    return alertId
        .replace(/^(overdue|urgent|soon|new)-/, '')
        .replace(/^exam-(overdue|urgent|soon|new)-/, '');
};

const StudentNotifications = () => {
    const { lang, t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [filter, setFilter] = useState('all');
    const [unreadCount, setUnreadCount] = useState(0);
    const [systemAlerts, setSystemAlerts] = useState([]);
    const [readSystemIds, setReadSystemIds] = useState(getReadSystemAlerts);
    // Per-tab counts: { assignment, exam, reminder, announcement }
    const [tabCounts, setTabCounts] = useState({});
    const [tabUnreadCounts, setTabUnreadCounts] = useState({});

    useEffect(() => {
        if (!localStorage.getItem('token')) { navigate('/login'); return; }
        fetchSystemAlerts();
        fetchAllTabCounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, filter]);

    // Fetch counts for all non-system tabs to show badges
    const fetchAllTabCounts = async () => {
        try {
            const token = localStorage.getItem('token');
            const types = ['assignment', 'exam', 'reminder', 'announcement'];
            const results = await Promise.allSettled(
                types.map(type =>
                    fetch(`http://localhost:5000/api/student/notifications?page=1&limit=1&type=${type}&unreadOnly=false`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).then(r => r.json())
                )
            );
            const newTabCounts = {};
            const newTabUnreadCounts = {};
            types.forEach((type, i) => {
                if (results[i].status === 'fulfilled') {
                    newTabCounts[type] = results[i].value.pagination?.total ?? 0;
                    newTabUnreadCounts[type] = results[i].value.unreadCount ?? 0;
                }
            });
            setTabCounts(newTabCounts);
            setTabUnreadCounts(newTabUnreadCounts);
        } catch (e) { console.error('fetchAllTabCounts error:', e); }
    };

    const fetchSystemAlerts = async () => {
        try {
            const token = localStorage.getItem('token');
            const [assignRes, examRes] = await Promise.allSettled([
                fetch('http://localhost:5000/api/student/assignments?limit=50&status=all', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('http://localhost:5000/api/student/exams?limit=50', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            const now = new Date();
            const alerts = [];
            const fmtDate = (d) => d ? new Date(d).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US') : '';

            if (assignRes.status === 'fulfilled' && assignRes.value.ok) {
                const data = await assignRes.value.json();
                (data.assignments || []).forEach(a => {
                    const due = a.dueDate ? new Date(a.dueDate) : null;
                    const daysLeft = due ? Math.ceil((due - now) / (1000 * 60 * 60 * 24)) : null;
                    const dateStr = due ? fmtDate(due) : '';
                    if (a.isOverdue && !a.isCompleted) {
                        alerts.push({ id: `overdue-${a._id}`, itemId: a._id, itemType: 'assignment', level: 'danger', icon: AlertTriangle,
                            title: t('studentNotifications.overdueAssignment', { title: a.title }),
                            message: t('studentNotifications.overdueAssignmentMsg', { title: a.title, date: due ? t('studentNotifications.overdueOn', { date: dateStr }) : '' }),
                            daysLeft: null, dueDate: due });
                    } else if (due && daysLeft <= 1 && daysLeft >= 0 && !a.isCompleted) {
                        alerts.push({ id: `urgent-${a._id}`, itemId: a._id, itemType: 'assignment', level: 'urgent', icon: AlertCircle,
                            title: t('studentNotifications.urgentAssignment', { title: a.title }),
                            message: t('studentNotifications.urgentAssignmentMsg', { title: a.title, date: dateStr }),
                            daysLeft: 0, dueDate: due });
                    } else if (due && daysLeft <= 3 && daysLeft > 1 && !a.isCompleted) {
                        alerts.push({ id: `soon-${a._id}`, itemId: a._id, itemType: 'assignment', level: 'warning', icon: Clock,
                            title: t('studentNotifications.soonAssignment', { title: a.title }),
                            message: t('studentNotifications.soonAssignmentMsg', { title: a.title, days: daysLeft, date: dateStr }),
                            daysLeft, dueDate: due });
                    } else if (!a.isCompleted && !a.isOverdue) {
                        alerts.push({ id: `new-${a._id}`, itemId: a._id, itemType: 'assignment', level: 'info', icon: BookOpen,
                            title: t('studentNotifications.pendingAssignment', { title: a.title }),
                            message: t('studentNotifications.pendingAssignmentMsg', { title: a.title, date: due ? t('studentNotifications.pendingDue', { date: dateStr }) : '' }),
                            daysLeft, dueDate: due });
                    }
                });
            }

            if (examRes.status === 'fulfilled' && examRes.value.ok) {
                const data = await examRes.value.json();
                (data.exams || data.data || []).forEach(e => {
                    const end = e.endDate ? new Date(e.endDate) : null;
                    const daysLeft = end ? Math.ceil((end - now) / (1000 * 60 * 60 * 24)) : null;
                    const isCompleted = e.isCompleted || e.status === 'completed';
                    const isOverdue = end && end < now;
                    const dateStr = end ? fmtDate(end) : '';
                    if (isOverdue && !isCompleted) {
                        alerts.push({ id: `exam-overdue-${e._id}`, itemId: e._id, itemType: 'exam', level: 'danger', icon: AlertTriangle,
                            title: t('studentNotifications.overdueExam', { title: e.title }),
                            message: t('studentNotifications.overdueExamMsg', { title: e.title, date: end ? t('studentNotifications.overdueOn', { date: dateStr }) : '' }),
                            daysLeft: null, dueDate: end });
                    } else if (end && daysLeft <= 1 && daysLeft >= 0 && !isCompleted) {
                        alerts.push({ id: `exam-urgent-${e._id}`, itemId: e._id, itemType: 'exam', level: 'urgent', icon: AlertCircle,
                            title: t('studentNotifications.urgentExam', { title: e.title }),
                            message: t('studentNotifications.urgentExamMsg', { title: e.title, date: dateStr }),
                            daysLeft: 0, dueDate: end });
                    } else if (end && daysLeft <= 3 && daysLeft > 1 && !isCompleted) {
                        alerts.push({ id: `exam-soon-${e._id}`, itemId: e._id, itemType: 'exam', level: 'warning', icon: Clock,
                            title: t('studentNotifications.soonExam', { title: e.title }),
                            message: t('studentNotifications.soonExamMsg', { title: e.title, days: daysLeft, date: dateStr }),
                            daysLeft, dueDate: end });
                    } else if (!isCompleted && !isOverdue) {
                        alerts.push({ id: `exam-new-${e._id}`, itemId: e._id, itemType: 'exam', level: 'info', icon: Brain,
                            title: t('studentNotifications.pendingExam', { title: e.title }),
                            message: t('studentNotifications.pendingExamMsg', { title: e.title, date: end ? t('studentNotifications.pendingDue', { date: dateStr }) : '' }),
                            daysLeft, dueDate: end });
                    }
                });
            }

            alerts.sort((a, b) => ({ danger: 0, urgent: 1, warning: 2, info: 3 }[a.level] ?? 9) - ({ danger: 0, urgent: 1, warning: 2, info: 3 }[b.level] ?? 9));
            setSystemAlerts(alerts);
        } catch (e) { console.error('fetchSystemAlerts error:', e); }
    };

    const unreadSystemCount = systemAlerts.filter(a => {
        const itemId = extractItemId(a.id);
        return !readSystemIds.includes(a.id) && !readSystemIds.includes(itemId);
    }).length;

    const handleMarkSystemRead = useCallback((alertId, e) => {
        if (e) e.stopPropagation();
        // Lưu cả alertId gốc lẫn itemId bất biến để chống đổi prefix theo thời gian
        const itemId = extractItemId(alertId);
        const newIds = [...new Set([...readSystemIds, alertId, itemId])];
        setReadSystemIds(newIds); saveReadSystemAlerts(newIds); dispatchSystemAlertUpdate();
        toast.success(t('studentNotifications.markedRead'));
    }, [readSystemIds, lang]);

    const handleMarkAllSystemRead = useCallback(() => {
        const allIds = systemAlerts.flatMap(a => [a.id, extractItemId(a.id)]);
        const newIds = [...new Set([...readSystemIds, ...allIds])];
        setReadSystemIds(newIds); saveReadSystemAlerts(newIds); dispatchSystemAlertUpdate();
        toast.success(t('studentNotifications.allMarkedRead'));
    }, [systemAlerts, readSystemIds, lang]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({ page: pagination.page, limit: 15, type: filter, unreadOnly: 'false' });
            const response = await fetch(`http://localhost:5000/api/student/notifications?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            const result = await response.json();
            if (response.ok) { setNotifications(result.notifications || []); setPagination(result.pagination || {}); setUnreadCount(result.unreadCount || 0); }
            else toast.error(result.message || t('studentNotifications.failedLoad'));
        } catch { toast.error(t('studentNotifications.serverError')); }
        finally { setLoading(false); }
    };

    const handleMarkAsRead = async (id) => {
        // Optimistic update — cập nhật UI ngay lập tức không chờ API
        const notif = notifications.find(n => n._id === id);
        if (!notif || notif.isRead) return;

        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        if (notif.type) {
            setTabUnreadCounts(prev => ({ ...prev, [notif.type]: Math.max(0, (prev[notif.type] ?? 1) - 1) }));
        }

        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5000/api/student/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            // Không rollback dù API lỗi — UI giữ trạng thái đã đọc
        } catch (e) {
            console.error('Mark as read error:', e);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/student/notifications/read-all', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
                // Reset all tab unread counts
                setTabUnreadCounts({});
                toast.success(t('studentNotifications.allMarkedRead'));
            }
        } catch { console.error('Mark all as read error'); }
    };

    const getNotifIcon = (type) => { const M = { assignment: FileText, exam: Brain, reminder: AlertCircle, announcement: Mail, result: CheckCircle }; const I = M[type] || Bell; return <I size={20} />; };
    const getNotifColor = (type) => ({ assignment: 'bg-blue-100 text-blue-600', exam: 'bg-purple-100 text-purple-600', reminder: 'bg-amber-100 text-amber-600', announcement: 'bg-emerald-100 text-emerald-600', result: 'bg-teal-100 text-teal-600' }[type] || 'bg-gray-100 text-gray-600');
    const getNotifLabel = (type) => ({
        assignment: t('studentNotifications.notifAssignment'),
        exam: t('studentNotifications.notifExam'),
        reminder: t('studentNotifications.notifReminder'),
        announcement: t('studentNotifications.notifAnnouncement'),
        result: t('studentNotifications.notifResult'),
    }[type] || type);

    const formatTimeAgo = (d) => {
        const diff = Date.now() - new Date(d);
        const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), day = Math.floor(diff / 86400000);
        if (m < 1) return t('studentNotifications.justNow');
        if (m < 60) return t('studentNotifications.minutesAgo', { m });
        if (h < 24) return t('studentNotifications.hoursAgo', { h });
        if (day < 7) return t('studentNotifications.daysAgo', { d: day });
        return new Date(d).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US');
    };

    const handleNotifClick = (n) => {
        if (n.relatedId && n.relatedModel) {
            if (!n.isRead) handleMarkAsRead(n._id);
            if (n.relatedModel === 'Assignment') navigate(`/student/assignments/${n.relatedId}`);
            else if (n.relatedModel === 'Exam') navigate(`/student/exams/${n.relatedId}`);
        }
    };

    // Navigate đến đúng trang danh sách
    const navigateToItem = (alert) => {
        if (alert.itemType === 'exam') navigate('/my-exams');
        else navigate('/my-assignments');
    };

    const totalUnread = unreadCount + unreadSystemCount;

    // Stats hiển thị theo tab đang chọn
    const displayTotal = filter === 'all'
        ? pagination.total + systemAlerts.length
        : filter === 'system'
            ? systemAlerts.length
            : (tabCounts[filter] ?? pagination.total);

    const displayUnread = filter === 'all'
        ? totalUnread
        : filter === 'system'
            ? unreadSystemCount
            : (tabUnreadCounts[filter] ?? unreadCount);

    const STYLE = {
        danger:  { grad: 'from-red-500 to-rose-600',    light: 'bg-red-50 border-red-200',    icon: 'bg-red-100 text-red-600',      badge: 'bg-red-500 text-white',        label: t('studentNotifications.labelOverdue'),  pulse: 'animate-pulse' },
        urgent:  { grad: 'from-orange-500 to-red-500',  light: 'bg-orange-50 border-orange-200', icon: 'bg-orange-100 text-orange-600', badge: 'bg-orange-500 text-white',     label: t('studentNotifications.labelUrgent'),   pulse: 'animate-pulse' },
        warning: { grad: 'from-amber-400 to-orange-500',light: 'bg-amber-50 border-amber-200', icon: 'bg-amber-100 text-amber-600',   badge: 'bg-amber-500 text-white',      label: t('studentNotifications.labelWarning'),  pulse: '' },
        info:    { grad: 'from-blue-500 to-cyan-500',   light: 'bg-blue-50 border-blue-200',   icon: 'bg-blue-100 text-blue-600',     badge: 'bg-blue-500 text-white',       label: t('studentNotifications.labelInfo'),     pulse: '' },
    };

    // Component card system alert dùng chung
    const SystemAlertCard = ({ alert, compact = false }) => {
        const s = STYLE[alert.level] || STYLE.info;
        const Icon = alert.icon;
        const isRead = readSystemIds.includes(alert.id);
        return (
            <div className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                isRead
                    ? `${s.light} hover:shadow-xl hover:-translate-y-0.5`
                    : `${s.light} hover:shadow-xl hover:-translate-y-0.5`
            } ${compact ? 'p-3.5' : 'p-5'}`}>
                {/* Gradient accent bar trái — xanh lá khi đã đọc */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
                    isRead ? 'bg-gradient-to-b from-emerald-400 to-teal-400' : `bg-gradient-to-b ${s.grad}`
                }`}/>
                {/* Glow effect khi chưa đọc */}
                {!isRead && <div className={`absolute inset-0 bg-gradient-to-r ${s.grad} opacity-[0.03] rounded-2xl pointer-events-none`}/>}

                <div className="flex items-start gap-3 pl-2">
                    {/* Icon */}
                    <div className={`relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${s.icon} shadow-sm`}>
                        <Icon size={18}/>
                        {!isRead && <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white ${s.pulse}`}/>}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isRead ? 'bg-emerald-100 text-emerald-700' : s.badge}`}>{isRead ? (t('studentNotifications.read') || 'Đã đọc') : s.label}</span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/80 border text-slate-600`}>
                                {alert.itemType === 'exam' ? t('studentNotifications.typeExam') : t('studentNotifications.typeAssignment')}
                            </span>
                            {alert.daysLeft !== null && alert.daysLeft !== undefined && alert.daysLeft > 0 && (
                                <span className="text-[10px] font-semibold text-slate-500">{t('studentNotifications.daysLeft', { days: alert.daysLeft })}</span>
                            )}
                        </div>
                        <p className={`font-semibold text-slate-800 ${compact ? 'text-sm' : 'text-base'} leading-snug`}>{alert.title}</p>
                        {!compact && <p className="text-sm text-slate-500 mt-1 leading-relaxed">{alert.message}</p>}
                        {alert.dueDate && (
                            <div className="flex items-center gap-1 mt-1.5">
                                <Clock size={11} className="text-slate-400"/>
                                <span className="text-[11px] text-slate-400">{t('studentNotifications.deadline')} {new Date(alert.dueDate).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                            onClick={() => navigateToItem(alert)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r ${isRead ? 'from-emerald-400 to-teal-400' : s.grad} text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200`}
                            title={alert.itemType === 'exam' ? t('studentNotifications.typeExam') : t('studentNotifications.typeAssignment')}
                        >
                            <ArrowRight size={12}/> {t('studentNotifications.view')}
                        </button>
                        {!isRead ? (
                            <button
                                onClick={(e) => handleMarkSystemRead(alert.id, e)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-emerald-50 border border-gray-200 text-slate-500 hover:text-emerald-600 text-xs font-semibold transition-all duration-200 hover:scale-105 whitespace-nowrap"
                                title={t('studentNotifications.markRead')}
                            >
                                <Eye size={14}/> {t('studentNotifications.markRead')}
                            </button>
                        ) : (
                            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
                                <CheckCircle size={14}/>
                                <span className="text-xs font-semibold whitespace-nowrap">{t('studentNotifications.read')}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto pb-8">

                {/* ── HEADER ── */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-6 mb-6 shadow-2xl shadow-blue-500/30">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"/>
                        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-cyan-300/20 rounded-full blur-xl"/>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="absolute w-1 h-1 bg-white/40 rounded-full animate-pulse"
                                style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%`, animationDelay: `${i * 0.4}s` }}/>
                        ))}
                    </div>
                    <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <Bell size={16} className="text-white"/>
                                </div>
                                <h1 className="text-2xl font-black text-white tracking-tight">
                                    {t('studentNotifications.title')}
                                </h1>
                                {totalUnread > 0 && (
                                    <span className="px-2.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                                        {totalUnread}
                                    </span>
                                )}
                            </div>
                            <p className="text-blue-100 text-sm">
                                {t('studentNotifications.subtitle')}
                            </p>
                        </div>
                        {totalUnread > 0 && (
                            <button
                                onClick={() => { handleMarkAllAsRead(); handleMarkAllSystemRead(); }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-semibold text-sm border border-white/30 transition-all duration-200 hover:scale-105 shadow-lg"
                            >
                                <Check size={16}/>
                                {t('studentNotifications.markAllRead')}
                            </button>
                        )}
                    </div>
                </div>

                {/* ── STATS ── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                    {[
                        { label: t('studentNotifications.totalNotifications'), value: displayTotal, icon: Bell, grad: 'from-blue-500 to-cyan-400', bg: 'bg-blue-50', text: 'text-blue-600' },
                        { label: t('studentNotifications.unread'), value: displayUnread, icon: AlertCircle, grad: 'from-red-500 to-rose-400', bg: 'bg-red-50', text: 'text-red-600' },
                        {
                            label: t('studentNotifications.statSystemLabel'),
                            value: unreadSystemCount,
                            icon: Zap,
                            grad: 'from-amber-500 to-orange-400',
                            bg: 'bg-amber-50',
                            text: 'text-amber-600',
                            hint: t('studentNotifications.statSystemHint'),
                        },
                    ].map((s, i) => (
                        <div key={i}
                            className="relative overflow-hidden bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-100 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                            title={s.hint}
                        >
                            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${s.grad} opacity-5 rounded-full -translate-y-4 translate-x-4`}/>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center shadow-sm`}>
                                    <s.icon size={22} className={s.text}/>
                                </div>
                                <div>
                                    <p className="text-3xl font-black text-slate-900">{s.value}</p>
                                    <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                                    {s.hint && (
                                        <p className="text-[10px] text-amber-500 font-semibold mt-0.5">→ {s.hint}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── FILTER TABS ── */}
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-100 p-3 mb-6 shadow-lg">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'all',          label: t('studentNotifications.filterAll'),          icon: Filter },
                            { key: 'assignment',   label: t('studentNotifications.filterAssignment'),   icon: FileText },
                            { key: 'exam',         label: t('studentNotifications.filterExam'),         icon: Brain },
                            { key: 'reminder',     label: t('studentNotifications.filterReminder'),     icon: Bell },
                            { key: 'announcement', label: t('studentNotifications.filterAnnouncement'), icon: Mail },
                            { key: 'system',       label: t('studentNotifications.filterSystem'),       icon: Zap },
                        ].map(tab => {
                            const Icon = tab.icon;
                            const isActive = filter === tab.key;
                            const isSystem = tab.key === 'system';
                            const isAll = tab.key === 'all';

                            // Số hiển thị trên badge của từng tab
                            const tabBadgeCount = isAll
                                ? (pagination.total + systemAlerts.length)
                                : isSystem
                                    ? systemAlerts.length
                                    : (tabCounts[tab.key] ?? 0);

                            // Số chưa đọc của từng tab (dùng cho dot đỏ)
                            const tabUnread = isAll
                                ? totalUnread
                                : isSystem
                                    ? unreadSystemCount
                                    : (tabUnreadCounts[tab.key] ?? 0);

                            return (
                                <button key={tab.key}
                                    onClick={() => { setFilter(tab.key); setPagination(prev => ({ ...prev, page: 1 })); }}
                                    className={`relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-1.5 ${
                                        isActive
                                            ? isSystem
                                                ? 'bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-lg shadow-amber-500/30 scale-105'
                                                : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:scale-105'
                                    }`}
                                >
                                    <Icon size={13}/>
                                    {tab.label}
                                    {tabBadgeCount > 0 && (
                                        <span className={`ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                                            isActive
                                                ? 'bg-white/30 text-white'
                                                : isSystem
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {tabBadgeCount}
                                        </span>
                                    )}
                                    {tabUnread > 0 && !isActive && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse"/>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── TAB HỆ THỐNG ── */}
                {filter === 'system' && (
                    <div className="space-y-3">
                        {systemAlerts.length > 0 && unreadSystemCount > 0 && (
                            <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-5 py-3 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={15} className="text-amber-500"/>
                                    <span className="text-sm text-amber-700 font-semibold">
                                        {t('studentNotifications.unreadSystemAlerts', { count: unreadSystemCount })}
                                    </span>
                                </div>
                                <button onClick={handleMarkAllSystemRead}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all duration-200 hover:scale-105 shadow-md">
                                    <Check size={12}/> {t('studentNotifications.markAllSystemRead')}
                                </button>
                            </div>
                        )}
                        {systemAlerts.length === 0 ? (
                            <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-100 p-16 shadow-lg text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                                    <Shield size={36} className="text-emerald-500"/>
                                </div>
                                <p className="text-xl font-bold text-slate-800 mb-2">{t('studentNotifications.allGood')}</p>
                                <p className="text-slate-500 text-sm">{t('studentNotifications.allGoodDesc')}</p>
                            </div>
                        ) : (
                            systemAlerts.map(alert => <SystemAlertCard key={alert.id} alert={alert}/>)
                        )}
                    </div>
                )}

                {/* ── DANH SÁCH THÔNG BÁO (tất cả tab trừ system) ── */}
                {filter !== 'system' && (
                <div className="space-y-3">
                    {loading ? (
                        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-100 p-16 shadow-lg text-center">
                            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"/>
                            <p className="text-slate-500 text-sm">{t('studentNotifications.loading')}</p>
                        </div>
                    ) : notifications.length === 0 && systemAlerts.length === 0 ? (
                        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-100 p-16 shadow-lg text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <Bell size={36} className="text-blue-400"/>
                            </div>
                            <p className="text-xl font-bold text-slate-800 mb-2">{t('studentNotifications.noNotifications')}</p>
                            <p className="text-slate-500 text-sm">{t('studentNotifications.noNotificationsDesc')}</p>
                        </div>
                    ) : (
                        <>
                        {/* System alerts ở đầu tab Tất cả - luôn hiện, đã đọc thì mờ */}
                        {filter === 'all' && systemAlerts.length > 0 && (
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-400 rounded-full shadow-sm">
                                        <Zap size={11} className="text-white"/>
                                        <span className="text-[11px] font-bold text-white uppercase tracking-wide">{t('studentNotifications.systemReminders')}</span>
                                    </div>
                                    <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent"/>
                                </div>
                                {systemAlerts.map(alert => (
                                    <SystemAlertCard key={alert.id} alert={alert} compact={true}/>
                                ))}
                                <div className="flex items-center gap-2 px-1 pt-1">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-sm">
                                        <Bell size={11} className="text-white"/>
                                        <span className="text-[11px] font-bold text-white uppercase tracking-wide">{t('studentNotifications.instructorNotifications')}</span>
                                    </div>
                                    <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"/>
                                </div>
                            </div>
                        )}

                        {/* Thông báo từ giảng viên */}
                        {notifications.map((n) => (
                            <div key={n._id}
                                className={`group relative overflow-hidden bg-white/90 backdrop-blur-xl rounded-2xl border p-5 shadow-md hover:shadow-xl transition-all duration-300 ${
                                    n.isRead ? 'border-emerald-100 bg-white' : 'border-blue-200 bg-blue-50/30'
                                }`}
                            >
                                {/* Accent bar — xanh dương khi chưa đọc, xanh lá khi đã đọc */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
                                    n.isRead
                                        ? 'bg-gradient-to-b from-emerald-400 to-teal-400'
                                        : 'bg-gradient-to-b from-blue-500 to-cyan-400'
                                }`}/>

                                <div className="flex items-start gap-4 pl-1">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${getNotifColor(n.type)}`}>
                                        {getNotifIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {!n.isRead
                                                        ? <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 animate-pulse"/>
                                                        : <CheckCircle size={14} className="text-emerald-500 flex-shrink-0"/>
                                                    }
                                                    <h3 className="font-bold text-slate-900">{n.title}</h3>
                                                </div>
                                                <p className="text-sm text-slate-500 leading-relaxed">{n.message}</p>
                                                <div className="flex items-center gap-3 mt-3 flex-wrap">
                                                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${getNotifColor(n.type)}`}>
                                                        {getNotifLabel(n.type)}
                                                    </span>
                                                    {n.instructorId?.fullName && (
                                                        <span className="text-xs text-slate-400 font-medium">{n.instructorId.fullName}</span>
                                                    )}
                                                    <span className="flex items-center gap-1 text-xs text-slate-400">
                                                        <Clock size={11}/> {formatTimeAgo(n.createdAt)}
                                                    </span>
                                                    {/* Badge đã đọc inline */}
                                                    {n.isRead && (
                                                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                            <CheckCircle size={11}/> {t('studentNotifications.read') || 'Đã đọc'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Nút bên phải: "Đánh dấu đã đọc" khi chưa đọc, tick + "Đã đọc" khi đã đọc */}
                                            {n.isRead ? (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex-shrink-0">
                                                    <CheckCircle size={15}/>
                                                    <span className="text-xs font-semibold whitespace-nowrap">{t('studentNotifications.read')}</span>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n._id); }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 hover:scale-105 flex-shrink-0 font-semibold text-xs whitespace-nowrap"
                                                    title={t('studentNotifications.markAsRead')}
                                                >
                                                    <Eye size={14}/>
                                                    {t('studentNotifications.markAsRead')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        </>
                    )}
                </div>
                )}

                {/* ── PAGINATION ── */}
                {filter !== 'system' && pagination.pages > 1 && (
                    <div className="mt-6 bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-100 p-4 shadow-lg flex items-center justify-between">
                        <p className="text-sm text-slate-600 font-medium">{t('studentNotifications.page')} {pagination.page} / {pagination.pages}</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 hover:scale-105 transition-all duration-200">
                                <ChevronLeft size={18}/>
                            </button>
                            <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl font-bold text-sm shadow-md">
                                {pagination.page}
                            </span>
                            <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.pages}
                                className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 hover:scale-105 transition-all duration-200">
                                <ChevronRight size={18}/>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default StudentNotifications;
