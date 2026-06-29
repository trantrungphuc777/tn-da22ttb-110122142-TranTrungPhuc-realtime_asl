import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageSquare, Heart, AlertTriangle, Trophy, Lightbulb,
    ChevronLeft, ChevronRight, Eye, Check, Filter, Star,
    Clock, User, Sparkles, TrendingUp, BookOpen, CheckCircle,
    MessageCircle, Award, ThumbsUp, Zap
} from 'lucide-react';
import Layout from './Layout';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-hot-toast';

const getFeedbackTypeConfig = (t) => ({
    encouragement: {
        icon: ThumbsUp,
        grad: 'from-blue-500 to-indigo-500',
        light: 'bg-blue-50 border-blue-200',
        iconBg: 'bg-blue-100 text-blue-600',
        badge: 'bg-blue-500 text-white',
        badgeLight: 'bg-blue-100 text-blue-700',
        label: t('studentFeedback.encouragement'),
        activeBtn: 'from-blue-500 to-indigo-500',
    },
    correction: {
        icon: AlertTriangle,
        grad: 'from-indigo-500 to-blue-600',
        light: 'bg-indigo-50 border-indigo-200',
        iconBg: 'bg-indigo-100 text-indigo-600',
        badge: 'bg-indigo-500 text-white',
        badgeLight: 'bg-indigo-100 text-indigo-700',
        label: t('studentFeedback.correction'),
        activeBtn: 'from-indigo-500 to-blue-600',
    },
    suggestion: {
        icon: Lightbulb,
        grad: 'from-sky-500 to-blue-500',
        light: 'bg-sky-50 border-sky-200',
        iconBg: 'bg-sky-100 text-sky-600',
        badge: 'bg-sky-500 text-white',
        badgeLight: 'bg-sky-100 text-sky-700',
        label: t('studentFeedback.suggestion'),
        activeBtn: 'from-sky-500 to-blue-500',
    },
    achievement: {
        icon: Award,
        grad: 'from-blue-600 to-cyan-500',
        light: 'bg-cyan-50 border-cyan-200',
        iconBg: 'bg-cyan-100 text-cyan-600',
        badge: 'bg-cyan-600 text-white',
        badgeLight: 'bg-cyan-100 text-cyan-700',
        label: t('studentFeedback.achievement'),
        activeBtn: 'from-blue-600 to-cyan-500',
    },
    warning: {
        icon: AlertTriangle,
        grad: 'from-blue-700 to-indigo-600',
        light: 'bg-blue-50 border-blue-300',
        iconBg: 'bg-blue-200 text-blue-700',
        badge: 'bg-blue-700 text-white',
        badgeLight: 'bg-blue-100 text-blue-800',
        label: t('studentFeedback.warning'),
        activeBtn: 'from-blue-700 to-indigo-600',
    },
});
const getDefaultFeedbackCfg = (t) => ({
    icon: MessageSquare, grad: 'from-slate-500 to-blue-500',
    light: 'bg-slate-50 border-slate-200', iconBg: 'bg-slate-100 text-slate-600',
    badge: 'bg-slate-500 text-white', badgeLight: 'bg-slate-100 text-slate-700',
    label: t('studentFeedback.defaultLabel'), activeBtn: 'from-slate-500 to-blue-500',
});

const StudentFeedbackList = () => {
    const { lang, t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [filter, setFilter] = useState('all');
    const [unreadCount, setUnreadCount] = useState(0);
    const [typeCounts, setTypeCounts] = useState({});

    useEffect(() => {
        if (!localStorage.getItem('token')) { navigate('/login'); return; }
        fetchFeedback();
    }, [navigate, pagination.page, filter]);

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({ page: pagination.page, limit: 15, type: filter, unreadOnly: 'false' });
            const response = await fetch(`http://localhost:5000/api/student/feedback?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.ok) {
                setFeedback(result.feedback || []);
                setPagination(result.pagination || {});
                setUnreadCount(result.unreadCount || 0);
                setTypeCounts(result.typeCounts || {});
            } else {
                toast.error(result.message || t('studentFeedback.loadError'));
            }
        } catch { toast.error(t('studentFeedback.serverError')); }
        finally { setLoading(false); }
    };

    const handleMarkAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/student/feedback/${id}/read`, {
                method: 'PATCH', headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                setFeedback(prev => prev.map(f => f._id === id ? { ...f, isRead: true } : f));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch { console.error('Mark as read error'); }
    };

    const handleMarkAllAsRead = async () => {
        const unread = feedback.filter(f => !f.isRead);
        await Promise.all(unread.map(f => handleMarkAsRead(f._id)));
        toast.success(t('studentFeedback.allMarkedRead'));
    };

    const formatTimeAgo = (d) => {
        const diff = Date.now() - new Date(d);
        const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), day = Math.floor(diff / 86400000);
        if (m < 1) return t('studentFeedback.justNow');
        if (m < 60) return t('studentFeedback.minutesAgo', { m });
        if (h < 24) return t('studentFeedback.hoursAgo', { h });
        if (day < 7) return t('studentFeedback.daysAgo', { d: day });
        return new Date(d).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US');
    };

    const encourageCount = feedback.filter(f => f.type === 'encouragement').length;
    const achieveCount = feedback.filter(f => f.type === 'achievement').length;

    const TABS = [
        { key: 'all',          label: t('studentFeedback.all'),          icon: Filter,        count: pagination.total },
        { key: 'encouragement',label: t('studentFeedback.encouragement'), icon: ThumbsUp,      count: typeCounts['encouragement'] || 0 },
        { key: 'correction',   label: t('studentFeedback.correction'),   icon: AlertTriangle, count: typeCounts['correction'] || 0 },
        { key: 'suggestion',   label: t('studentFeedback.suggestion'),    icon: Lightbulb,     count: typeCounts['suggestion'] || 0 },
    ];

    return (
        <Layout>
            <div className="max-w-4xl mx-auto pb-8">

                {/* ── HEADER — khác thông báo: dạng card trung tâm với icon lớn, gradient chéo indigo→blue ── */}
                <div className="relative overflow-hidden rounded-3xl mb-6 shadow-2xl shadow-indigo-500/25">
                    {/* Gradient chéo — khác với thông báo dùng gradient ngang */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500"/>
                    {/* Pattern dots */}
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}/>
                    {/* Orbs */}
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl"/>
                    <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-indigo-300/20 rounded-full blur-2xl"/>

                    <div className="relative p-6">
                        {/* Icon trung tâm — điểm khác biệt so với thông báo */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-xl">
                                    <MessageCircle size={30} className="text-white"/>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-2xl font-black text-white tracking-tight">
                                        {t('studentFeedback.title')}
                                    </h1>
                                    {unreadCount > 0 && (
                                        <span className="px-2.5 py-0.5 bg-white/25 text-white text-xs font-bold rounded-full border border-white/30 animate-pulse">
                                            {unreadCount} {t('studentFeedback.new')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-blue-100 text-sm">{t('studentFeedback.subtitle')}</p>
                                {/* Mini stats trong header */}
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1.5 border border-white/20">
                                        <MessageSquare size={13} className="text-white/80"/>
                                        <span className="text-white text-xs font-semibold">{t('studentFeedback.totalFeedbackItems', { count: pagination.total })}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1.5 border border-white/20">
                                        <ThumbsUp size={13} className="text-white/80"/>
                                        <span className="text-white text-xs font-semibold">{t('studentFeedback.encouragementItems', { count: encourageCount })}</span>
                                    </div>
                                </div>
                            </div>
                            {pagination.total > 0 && (
                                <button onClick={handleMarkAllAsRead}
                                    disabled={unreadCount === 0}
                                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 backdrop-blur-sm text-white rounded-xl font-semibold text-sm border transition-all duration-200 shadow-lg ${
                                        unreadCount > 0
                                            ? 'bg-white/20 hover:bg-white/30 border-white/30 hover:scale-105'
                                            : 'bg-white/10 border-white/20 opacity-60 cursor-default'
                                    }`}>
                                    <Check size={15}/>
                                    {unreadCount > 0 ? t('studentFeedback.markAllRead') : t('studentFeedback.allRead')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── STATS CARDS — 2 ô căn giữa ── */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                        { label: t('studentFeedback.totalFeedback'), value: pagination.total, icon: MessageSquare, grad: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50', text: 'text-indigo-600' },
                        { label: t('studentFeedback.unread'),         value: unreadCount,      icon: Zap,           grad: 'from-blue-600 to-indigo-500', bg: 'bg-blue-50',   text: 'text-blue-700' },
                    ].map((s, i) => (
                        <div key={i} className="relative overflow-hidden bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-100 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 group">
                            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${s.grad} opacity-5 rounded-full -translate-y-4 translate-x-4`}/>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center shadow-sm`}>
                                    <s.icon size={22} className={s.text}/>
                                </div>
                                <div>
                                    <p className="text-3xl font-black text-slate-900">{s.value}</p>
                                    <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── FILTER TABS ── */}
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-100 p-3 mb-6 shadow-lg">
                    <div className="flex flex-wrap gap-2">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = filter === tab.key;
                            const cfg = tab.key !== 'all' ? getFeedbackTypeConfig(t)[tab.key] : null;
                            return (
                                <button key={tab.key}
                                    onClick={() => { setFilter(tab.key); setPagination(prev => ({ ...prev, page: 1 })); }}
                                    className={`relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-1.5 ${
                                        isActive
                                            ? cfg
                                                ? `bg-gradient-to-r ${cfg.activeBtn} text-white shadow-lg scale-105`
                                                : 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg shadow-indigo-500/30 scale-105'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:scale-105'
                                    }`}
                                >
                                    <Icon size={13}/>
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${
                                            isActive
                                                ? 'bg-white/30 text-white'
                                                : 'bg-indigo-100 text-indigo-600'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── FEEDBACK LIST ── */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-100 p-16 shadow-lg text-center">
                            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"/>
                            <p className="text-slate-500 text-sm">{t('studentFeedback.loading')}</p>
                        </div>
                    ) : feedback.length === 0 ? (
                        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-100 p-16 shadow-lg text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <MessageCircle size={36} className="text-indigo-400"/>
                            </div>
                            <p className="text-xl font-bold text-slate-800 mb-2">{t('studentFeedback.noFeedback')}</p>
                            <p className="text-slate-500 text-sm">{t('studentFeedback.noFeedbackDesc')}</p>
                        </div>
                    ) : (
                        feedback.map((item) => {
                            const cfg = getFeedbackTypeConfig(t)[item.type] || getDefaultFeedbackCfg(t);
                            const Icon = cfg.icon;
                            return (
                                <div key={item._id}
                                    onClick={() => !item.isRead && handleMarkAsRead(item._id)}
                                    className={`group relative overflow-hidden bg-white/90 backdrop-blur-xl rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 ${
                                        item.isRead ? 'border-gray-100' : `${cfg.light}`
                                    }`}
                                >
                                    {/* Accent bar trái — gradient chéo khác thông báo */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${cfg.grad} rounded-l-2xl`}/>
                                    {/* Glow khi chưa đọc */}
                                    {!item.isRead && (
                                        <div className={`absolute inset-0 bg-gradient-to-r ${cfg.grad} opacity-[0.04] rounded-2xl pointer-events-none`}/>
                                    )}

                                    <div className="flex items-start gap-4 p-5 pl-6">
                                        {/* Icon với shape khác — diamond-ish bằng rotate */}
                                        <div className="relative flex-shrink-0">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${cfg.iconBg}`}
                                                style={{ borderRadius: '14px 6px 14px 6px' }}>
                                                <Icon size={20}/>
                                            </div>
                                            {!item.isRead && (
                                                <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gradient-to-br ${cfg.grad} border-2 border-white animate-pulse shadow-sm`}/>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    {/* Title row */}
                                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
                                                            {cfg.label}
                                                        </span>
                                                        {!item.isRead && (
                                                            <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                                                                {t('studentFeedback.new')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className={`font-bold text-base leading-snug ${item.isRead ? 'text-slate-600' : 'text-slate-900'}`}>
                                                        {item.title}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 mt-1.5 leading-relaxed line-clamp-3">
                                                        {item.content}
                                                    </p>

                                                    {/* Meta row */}
                                                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                                                        {item.instructorId?.fullName && (
                                                            <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1 border border-gray-100">
                                                                <User size={11} className="text-slate-400"/>
                                                                <span className="text-xs text-slate-600 font-medium">{item.instructorId.fullName}</span>
                                                            </div>
                                                        )}
                                                        {item.relatedAssignment && (
                                                            <div className="flex items-center gap-1.5 bg-indigo-50 rounded-lg px-2.5 py-1 border border-indigo-100">
                                                                <BookOpen size={11} className="text-indigo-400"/>
                                                                <span className="text-xs text-indigo-600 font-medium">{item.relatedAssignment.title}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1 text-xs text-slate-400">
                                                            <Clock size={11}/>
                                                            {formatTimeAgo(item.createdAt)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Mark read button */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleMarkAsRead(item._id); }}
                                                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                                        item.isRead
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                                                            : 'bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 hover:scale-105'
                                                    }`}
                                                    disabled={item.isRead}
                                                >
                                                    {item.isRead
                                                        ? <><CheckCircle size={13}/> {t('studentFeedback.alreadyRead')}</>
                                                        : <><Eye size={13}/> {t('studentFeedback.markRead')}</>
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ── PAGINATION ── */}
                {pagination.pages > 1 && (
                    <div className="mt-6 bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-100 p-4 shadow-lg flex items-center justify-between">
                        <p className="text-sm text-slate-600 font-medium">{t('studentFeedback.page')} {pagination.page} / {pagination.pages}</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 hover:scale-105 transition-all duration-200">
                                <ChevronLeft size={18}/>
                            </button>
                            <span className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-bold text-sm shadow-md">
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

export default StudentFeedbackList;
