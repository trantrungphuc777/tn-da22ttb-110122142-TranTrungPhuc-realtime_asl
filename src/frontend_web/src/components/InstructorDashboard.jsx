import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, BookOpen, ClipboardList, TrendingUp, Award, Clock,
    CheckCircle, AlertCircle, Bell, BarChart3, ChevronRight,
    RefreshCw, GraduationCap, FileText, Eye, Target, Activity,
    Star, Zap, Calendar, ArrowUpRight, ArrowDownRight, Minus,
    BookMarked, PieChart, UserCheck, AlertTriangle, Trophy,
    MessageSquare, Settings, ChevronUp, Flame, Shield
} from 'lucide-react';
import InstructorLayout from './InstructorLayout';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

const InstructorDashboard = () => {
    const { t, lang } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState({
        stats: {},
        studentsWithStats: [],
        recentActivity: [],
        lowPerformers: [],
        topPerformers: [],
        classStats: []
    });
    const [notifications, setNotifications] = useState([]);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const hasFetched = useRef(false);

    useEffect(() => {
        if (!localStorage.getItem('token')) { navigate('/login'); return; }
        if (user.role !== 'instructor' && user.role !== 'admin') { navigate('/dashboard'); return; }
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true); else setLoading(true);
            const token = localStorage.getItem('token');
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const [dashRes, notiRes] = await Promise.all([
                fetch('http://localhost:5000/api/instructor', {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal
                }),
                fetch('http://localhost:5000/api/instructor/notifications?limit=3', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            clearTimeout(timeout);

            const result = await dashRes.json();
            console.log('[Dashboard] API response status:', dashRes.status);
            console.log('[Dashboard] API result:', JSON.stringify(result).substring(0, 300));
            if (dashRes.ok) { setData(result); }
            else { console.warn('[Dashboard] API error:', dashRes.status, result); }

            if (notiRes.ok) {
                const notiResult = await notiRes.json();
                setNotifications(notiResult.notifications || []);
            }
        } catch (error) {
            // Server chưa chạy hoặc timeout — im lặng, giữ dữ liệu mặc định
        } finally {
            setLoading(false); setRefreshing(false);
        }
    };

    const s = data.stats || {};
    const completionRate = s.completionRate || 0;
    const avgScore = s.averageScore ? parseFloat(s.averageScore).toFixed(1) : '0.0';
    const avgAccuracy = s.averageAccuracy ? parseFloat(s.averageAccuracy).toFixed(1) : '0.0';

    const statsCards = [
        {
            title: t('instructor.dashboard.totalStudents'),
            value: s.totalStudents || 0,
            icon: Users,
            gradient: 'from-blue-500 to-indigo-600',
            lightBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            trend: s.activeStudents != null ? `${s.activeStudents} ${t('instructor.dashboard.active')}` : null,
            trendUp: null,
            sub: `${s.activeStudents || 0} ${t('instructor.dashboard.active')}`
        },
        {
            title: t('instructor.dashboard.completionRate'),
            value: `${completionRate}%`,
            icon: CheckCircle,
            gradient: 'from-emerald-500 to-teal-600',
            lightBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            trend: `${s.completedSubmissions || 0} ${t('instructor.dashboard.submitted')}`,
            trendUp: null,
            sub: `${s.completedSubmissions || 0} ${t('instructor.dashboard.submitted')}`
        },
        {
            title: t('instructor.dashboard.assignedAssignments'),
            value: s.totalAssignments || 0,
            icon: FileText,
            gradient: 'from-violet-500 to-purple-600',
            lightBg: 'bg-violet-50',
            iconColor: 'text-violet-600',
            trend: `${s.pendingSubmissions || 0} ${t('instructor.dashboard.pending')}`,
            trendUp: null,
            sub: `${s.pendingSubmissions || 0} ${t('instructor.dashboard.pendingGrading')}`
        },
        {
            title: t('instructor.dashboard.averageScore'),
            value: avgScore,
            icon: Target,
            gradient: 'from-amber-500 to-orange-600',
            lightBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
            trend: null, trendUp: null,
            sub: `${t('instructor.dashboard.accuracy')}: ${avgAccuracy}%`
        },
        {
            title: t('instructor.dashboard.exams'),
            value: s.totalExams || 0,
            icon: BookOpen,
            gradient: 'from-rose-500 to-pink-600',
            lightBg: 'bg-rose-50',
            iconColor: 'text-rose-600',
            trend: `${s.activeExams || 0} ${t('instructor.dashboard.active')}`,
            trendUp: null,
            sub: `${s.activeExams || 0} ${t('instructor.dashboard.ongoing')}`
        },
        {
            title: t('instructor.dashboard.classes'),
            value: s.totalClasses || 0,
            icon: GraduationCap,
            gradient: 'from-cyan-500 to-sky-600',
            lightBg: 'bg-cyan-50',
            iconColor: 'text-cyan-600',
            trend: null, trendUp: null,
            sub: t('instructor.dashboard.underManagement')
        }
    ];

    const quickActions = [
        { titleKey: 'instructor.dashboard.manageStudents', descKey: 'instructor.dashboard.manageStudentsDesc', icon: Users, path: '/instructor/students', gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/30' },
        { titleKey: 'instructor.dashboard.assignHomework', descKey: 'instructor.dashboard.assignHomeworkDesc', icon: ClipboardList, path: '/instructor/assignments', gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/30' },
        { titleKey: 'instructor.dashboard.createExam', descKey: 'instructor.dashboard.createExamDesc', icon: BookOpen, path: '/instructor/exams', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/30' },
        { titleKey: 'instructor.dashboard.viewReports', descKey: 'instructor.dashboard.viewReportsDesc', icon: BarChart3, path: '/instructor/reports', gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/30' },
        { titleKey: 'instructor.notifications.title', descKey: 'instructor.dashboard.sendNotifications', icon: Bell, path: '/instructor/notifications', gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/30' },
        { titleKey: 'instructor.dashboard.studentProfiles', descKey: 'instructor.dashboard.studentProfilesDesc', icon: UserCheck, path: '/instructor/students', gradient: 'from-cyan-500 to-sky-600', shadow: 'shadow-cyan-500/30' },
    ];

    if (loading) {
        return (
            <InstructorLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="text-center space-y-4">
                        <div className="relative w-16 h-16 mx-auto">
                            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-2 w-12 h-12 border-4 border-indigo-100 border-b-indigo-500 rounded-full animate-spin" style={{animationDirection:'reverse',animationDuration:'0.8s'}}></div>
                        </div>
                        <p className="text-slate-600 font-medium">{t('common.loading')}</p>
                    </div>
                </div>
            </InstructorLayout>
        );
    }

    const now = new Date();
    const hour = now.getHours();
    const getGreeting = () => {
        if (hour < 12) return t('dashboard.goodMorning');
        if (hour < 18) return t('dashboard.goodAfternoon');
        return t('dashboard.goodEvening');
    };
    const greeting = getGreeting();

    return (
        <InstructorLayout>
            <div className="space-y-5">
                {/* ── Header Banner ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-5 shadow-xl">
                    <div className="absolute inset-0 particle-grid opacity-20" />
                    <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/20 rounded-full blur-[80px]" />
                    <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-indigo-500/15 rounded-full blur-[60px]" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <p className="text-blue-300 text-sm font-medium mb-0.5">{greeting},</p>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                {user?.fullName || user?.username || t('instructor.layout.instructor')}
                                <span className="ml-2 text-2xl">👋</span>
                            </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            {t('instructor.dashboard.subtitle')}
                        </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 text-white text-sm">
                                <Calendar size={15} className="text-blue-300" />
                                <span>{now.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {weekday:'short', day:'numeric', month:'short'})}</span>
                            </div>
                            <button
                                onClick={() => fetchDashboardData(true)}
                                disabled={refreshing}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm font-medium transition-all shadow-lg shadow-blue-600/30 disabled:opacity-60"
                            >
                                <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                                {t('instructor.dashboard.refresh')}
                            </button>
                        </div>
                    </div>
                    {/* Mini stat pills */}
                    <div className="relative z-10 flex flex-wrap gap-2 mt-4">
                        {[
                            { labelKey: 'instructor.dashboard.totalStudents', val: s.totalStudents || 0, icon: Users, color: 'text-blue-300' },
                            { labelKey: 'instructor.dashboard.completionRate', val: `${completionRate}%`, icon: CheckCircle, color: 'text-emerald-300' },
                            { labelKey: 'instructor.dashboard.averageScore', val: avgScore, icon: Target, color: 'text-amber-300' },
                            { labelKey: 'instructor.dashboard.pendingGrading', val: s.pendingSubmissions || 0, icon: Clock, color: 'text-rose-300' },
                        ].map((p, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/8 backdrop-blur-sm rounded-lg border border-white/10 text-xs">
                                <p.icon size={13} className={p.color} />
                                <span className="text-slate-300">{t(p.labelKey)}:</span>
                                <span className="text-white font-bold">{p.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Stats Grid 6 cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    {statsCards.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div key={i} className="group bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden">
                                <div className={`absolute -right-3 -top-3 w-16 h-16 rounded-full bg-gradient-to-br ${stat.gradient} opacity-8 group-hover:opacity-15 transition-opacity`} />
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-9 h-9 rounded-xl ${stat.lightBg} flex items-center justify-center`}>
                                        <Icon size={18} className={stat.iconColor} />
                                    </div>
                                    {stat.trend && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.trendUp === true ? 'bg-emerald-100 text-emerald-700' : stat.trendUp === false ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {stat.trendUp === true && <span>↑ </span>}
                                            {stat.trend}
                                        </span>
                                    )}
                                </div>
                                <div className="text-2xl font-black text-slate-900 leading-none">{stat.value}</div>
                                <div className="text-xs font-semibold text-slate-600 mt-1 leading-tight">{stat.title}</div>
                                {stat.sub && <div className="text-[10px] text-slate-400 mt-0.5 truncate">{stat.sub}</div>}
                            </div>
                        );
                    })}
                </div>

                {/* ── Main 2-col layout ── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    {/* Left: 2/3 */}
                    <div className="xl:col-span-2 space-y-5">

                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <Zap size={17} className="text-amber-500" />
                                    {t('instructor.dashboard.quickActions')}
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {quickActions.map((action, i) => {
                                    const Icon = action.icon;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => navigate(action.path)}
                                            className={`group relative p-4 rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-md ${action.shadow} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-left overflow-hidden`}
                                        >
                                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors rounded-xl" />
                                            <div className="relative">
                                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-2">
                                                    <Icon size={16} />
                                                </div>
                                                <p className="font-bold text-sm leading-tight">{t(action.titleKey)}</p>
                                                <p className="text-[11px] text-white/75 mt-0.5 leading-tight">{t(action.descKey)}</p>
                                            </div>
                                            <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Top Performers */}
                        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-[60px]" />
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-400/15 rounded-full blur-[50px]" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                                        <Trophy size={17} className="text-amber-400" />
                                        {t('instructor.dashboard.topPerformers')}
                                    </h2>
                                    <button onClick={() => navigate('/instructor/students')} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                                        {t('instructor.dashboard.viewAll')} <ChevronRight size={13} />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {data.topPerformers?.slice(0, 5).map((student, i) => (
                                        <div key={student._id} onClick={() => navigate(`/instructor/students/${student._id}`)}
                                            className="flex items-center gap-3 p-3 bg-white/8 hover:bg-white/12 rounded-xl border border-white/8 cursor-pointer transition-all">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-emerald-700'}`}>
                                                {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-white text-sm truncate">{student.fullName}</p>
                                                <p className="text-[11px] text-emerald-300/60 truncate">{student.email}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="font-bold text-amber-400 text-sm">{student.studentStats?.averageScore?.toFixed(1) || '0.0'}</p>
                                                <p className="text-[10px] text-emerald-300/50">{t('instructor.dashboard.avgScoreLabel')}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!data.topPerformers || data.topPerformers.length === 0) && (
                                        <div className="text-center py-6">
                                            <Trophy size={28} className="text-emerald-700 mx-auto mb-2" />
                                            <p className="text-emerald-400/60 text-sm">{t('instructor.dashboard.noStudentData')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <Activity size={17} className="text-blue-500" />
                                    {t('instructor.dashboard.recentActivity')}
                                </h2>
                                <button onClick={() => navigate('/instructor/assignments')} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
                                    {t('instructor.dashboard.viewAll')} <ChevronRight size={13} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {data.recentActivity?.slice(0, 6).map((activity, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-100 transition-all">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                                            <CheckCircle size={15} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 text-sm truncate">
                                                {activity.studentId?.fullName || t('dashboard.student')}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {t('instructor.dashboard.submitted')}: {activity.assignmentId?.title || t('instructor.assignments.assignment')}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className={`font-bold text-sm ${activity.score >= 8 ? 'text-emerald-600' : activity.score >= 5 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                {activity.score != null ? activity.score : '—'}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {activity.updatedAt ? new Date(activity.updatedAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US') : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {(!data.recentActivity || data.recentActivity.length === 0) && (
                                    <div className="text-center py-8">
                                        <Activity size={28} className="text-slate-300 mx-auto mb-2" />
                                        <p className="text-slate-400 text-sm">{t('instructor.dashboard.noActivity')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right sidebar: 1/3 */}
                    <div className="space-y-4">

                        {/* Performance Overview */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <PieChart size={16} className="text-violet-500" />
                                {t('instructor.dashboard.performanceOverview')}
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { labelKey: 'instructor.dashboard.completionRate', val: completionRate, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
                                    { labelKey: 'instructor.dashboard.averageScore', val: Math.min(parseFloat(avgScore), 100), color: 'bg-blue-500', textColor: 'text-blue-700', display: avgScore + '/100' },
                                    { labelKey: 'instructor.dashboard.accuracy', val: parseFloat(avgAccuracy), color: 'bg-amber-500', textColor: 'text-amber-700', display: avgAccuracy + '%' },
                                ].map((item, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-600 font-medium">{t(item.labelKey)}</span>
                                            <span className={`font-bold ${item.textColor}`}>{item.display || item.val + '%'}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{width: `${Math.min(item.val, 100)}%`}} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Need Attention */}
                        <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <AlertTriangle size={16} className="text-amber-500" />
                                {t('instructor.dashboard.needAttention')}
                            </h3>
                            <div className="space-y-2">
                                {data.lowPerformers?.slice(0, 4).map((student) => (
                                    <div key={student._id} onClick={() => navigate(`/instructor/students/${student._id}`)}
                                        className="flex items-center gap-3 p-2.5 bg-amber-50 hover:bg-amber-100/70 rounded-xl border border-amber-100 cursor-pointer transition-all">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                            {(student.fullName || 'H').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 text-xs truncate">{student.fullName}</p>
                                            <p className="text-[10px] text-amber-600">{t('instructor.dashboard.score')}: {student.studentStats?.averageScore?.toFixed(1) || '0.0'}</p>
                                        </div>
                                        <ChevronRight size={13} className="text-amber-400 flex-shrink-0" />
                                    </div>
                                ))}
                                {(!data.lowPerformers || data.lowPerformers.length === 0) && (
                                    <div className="text-center py-4">
                                        <Shield size={24} className="text-emerald-400 mx-auto mb-1" />
                                        <p className="text-emerald-600 text-xs font-medium">{t('instructor.dashboard.allGood')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/15 rounded-full blur-[40px]" />
                            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4 relative z-10">
                                <TrendingUp size={16} className="text-cyan-400" />
                                {t('instructor.dashboard.quickStats')}
                            </h4>
                            <div className="space-y-2 relative z-10">
                                {[
                                    { labelKey: 'instructor.dashboard.activeStudents', valKey: 'instructor.dashboard.activeStudents', val: s.activeStudents || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/20' },
                                    { labelKey: 'instructor.dashboard.pendingGrading', valKey: 'instructor.dashboard.pendingGrading', val: s.pendingSubmissions || 0, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' },
                                    { labelKey: 'instructor.dashboard.classes', valKey: 'instructor.dashboard.classes', val: s.totalClasses || 0, icon: GraduationCap, color: 'text-violet-400', bg: 'bg-violet-500/20' },
                                    { labelKey: 'instructor.dashboard.avgAccuracy', valKey: 'instructor.dashboard.avgAccuracy', val: `${avgAccuracy}%`, icon: Eye, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
                                    { labelKey: 'instructor.dashboard.exams', valKey: 'instructor.dashboard.exams', val: s.totalExams || 0, icon: BookOpen, color: 'text-rose-400', bg: 'bg-rose-500/20' },
                                ].map((item, i) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={i} className="flex items-center justify-between p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center`}>
                                                    <Icon size={14} className={item.color} />
                                                </div>
                                                <span className="text-xs text-slate-300 font-medium">{t(item.labelKey)}</span>
                                            </div>
                                            <span className={`font-bold text-sm ${item.color}`}>{item.val}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Notifications Preview */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Bell size={16} className="text-blue-500" />
                                    {t('instructor.notifications.title')}
                                </h3>
                                <button onClick={() => navigate('/instructor/notifications')} className="text-xs text-blue-500 hover:text-blue-700">
                                    {t('instructor.dashboard.viewAll')}
                                </button>
                            </div>
                            <div className="space-y-2">
                                {notifications.length > 0 ? notifications.map((noti, i) => {
                                    const typeConfig = {
                                        announcement: { bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-500', Icon: FileText, textColor: 'text-blue-900', timeColor: 'text-blue-500' },
                                        reminder:     { bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-500', Icon: AlertCircle, textColor: 'text-amber-900', timeColor: 'text-amber-500' },
                                        achievement:  { bg: 'bg-emerald-50', border: 'border-emerald-100', iconBg: 'bg-emerald-500', Icon: Star, textColor: 'text-emerald-900', timeColor: 'text-emerald-500' },
                                    };
                                    const cfg = typeConfig[noti.type] || typeConfig.announcement;
                                    const Icon = cfg.Icon;
                                    const timeAgo = noti.createdAt ? new Date(noti.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US') : '';
                                    return (
                                        <div key={noti._id || i} className={`flex items-start gap-3 p-3 ${cfg.bg} rounded-xl border ${cfg.border}`}>
                                            <div className={`w-7 h-7 rounded-lg ${cfg.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                                <Icon size={13} className="text-white" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-xs font-semibold ${cfg.textColor} truncate`}>{noti.title}</p>
                                                <p className={`text-[10px] ${cfg.timeColor} mt-0.5`}>{timeAgo}</p>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-6">
                                        <Bell size={24} className="text-slate-300 mx-auto mb-2" />
                                        <p className="text-slate-400 text-xs">{t('instructor.dashboard.noActivity')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </InstructorLayout>
    );
};

export default InstructorDashboard;
