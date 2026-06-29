import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import {
    Users, GraduationCap, BookOpen, BarChart3, Activity,
    TrendingUp, Shield, Database, Wifi, Clock, Award,
    CheckCircle, AlertCircle, RefreshCw, Zap, Star,
    ArrowUpRight, ArrowDownRight, Eye, Brain, Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    LineChart, Line, BarChart, Bar, AreaChart, Area,
    PieChart, Pie, Cell, RadialBarChart, RadialBar,
    ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer
} from 'recharts';

const API = 'http://localhost:5000/api/admin';

const COLORS = {
    blue:    '#3b82f6', cyan:    '#06b6d4', emerald: '#10b981',
    violet:  '#8b5cf6', amber:   '#f59e0b', red:     '#ef4444',
    pink:    '#ec4899', indigo:  '#6366f1', teal:    '#14b8a6',
    sky:     '#0ea5e9', slate:   '#64748b',
};

/* ── Animated Counter ─────────────────────────────────────────────────── */
const AnimatedNumber = ({ value, duration = 1200 }) => {
    const [display, setDisplay] = useState(0);
    const frameRef = useRef();
    useEffect(() => {
        if (value === null || value === undefined || isNaN(Number(value))) return;
        const target = Number(value);
        const start = performance.now();
        const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 4);
            setDisplay(Math.round(ease * target));
            if (p < 1) frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameRef.current);
    }, [value, duration]);
    return <>{display.toLocaleString()}</>;
};

/* ── KPI Card ─────────────────────────────────────────────────────────── */
const KpiCard = ({ icon: Icon, label, value, sub, gradient, iconBg, trend, trendUp }) => (
    <div className={`relative overflow-hidden rounded-2xl px-3 py-3.5 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-default ${gradient}`}>
        {/* Glow orbs */}
        <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="relative z-10">
            {/* Icon + label row */}
            <div className="flex items-center justify-between gap-1 mb-2">
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-wide leading-none truncate flex-1">{label}</p>
                <div className={`flex-shrink-0 p-1.5 rounded-lg ${iconBg} shadow-inner`}>
                    <Icon size={14} className="text-white" />
                </div>
            </div>
            {/* Value */}
            <p className="text-2xl font-black text-white leading-none">
                {typeof value === 'string' ? value : <AnimatedNumber value={value} />}
            </p>
            {sub && <p className="text-[10px] text-white/60 mt-1 truncate">{sub}</p>}
            {trend !== undefined && (
                <div className={`inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${trendUp ? 'bg-white/20 text-white' : 'bg-red-900/30 text-red-200'}`}>
                    {trendUp ? <ArrowUpRight size={9}/> : <ArrowDownRight size={9}/>}
                    {trend}
                </div>
            )}
        </div>
    </div>
);

/* ── Tooltip ──────────────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl p-3 text-xs">
            <p className="font-bold text-slate-300 mb-2">{label}</p>
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                    <span className="text-slate-400">{entry.name}:</span>
                    <span className="font-bold text-white">{entry.value?.toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
};

/* ── Section Header ───────────────────────────────────────────────────── */
const SectionHeader = ({ icon: Icon, iconColor, title, subtitle, badge }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-xl ${iconColor} shadow-sm`}>
            <Icon size={16} className="text-white" />
        </div>
        <div className="flex-1">
            <h2 className="text-base font-black text-slate-800">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        {badge && (
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200">
                {badge}
            </span>
        )}
    </div>
);

/* ── Chart Card ───────────────────────────────────────────────────────── */
const ChartCard = ({ title, icon: Icon, iconColor = 'text-slate-500', extra, children, className = '' }) => (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${className}`}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100/80">
            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <Icon size={15} className={iconColor} />{title}
            </h3>
            {extra}
        </div>
        <div className="p-5">{children}</div>
    </div>
);

/* ── Stat Row Item (mini stat bên dưới) ───────────────────────────────── */
const MiniStat = ({ label, value, color = 'text-slate-700' }) => (
    <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
        <span className={`text-xl font-black ${color}`}>
            {typeof value === 'string' ? value : (value != null ? <AnimatedNumber value={value} /> : 'N/A')}
        </span>
        <span className="text-[11px] text-slate-500 mt-0.5 text-center leading-tight">{label}</span>
    </div>
);

/* ── Progress Bar ─────────────────────────────────────────────────────── */
const ProgressBar = ({ label, value, max, color }) => {
    const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-medium">{label}</span>
                <span className="font-bold text-slate-700">{value?.toLocaleString()} <span className="text-slate-400 font-normal">/ {max?.toLocaleString()}</span></span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className={`h-2 rounded-full transition-all duration-1000 ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

/* ── Legend Dot ───────────────────────────────────────────────────────── */
const LegendDot = ({ color, label }) => (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
        {label}
    </div>
);

/* ── Main Component ───────────────────────────────────────────────────── */
const AdminDashboard = () => {
    const { t } = useLanguage();
    const [data, setData]           = useState(null);
    const [loading, setLoading]     = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [growthTab, setGrowthTab] = useState('month');

    const fetchDashboard = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
            setData(res.data);
            if (silent) toast.success(t('admin.auto.k_data_updated',t('admin.auto.k_d28b076b', 'Đã cập nhật dữ liệu!')), { duration: 1500 });
        } catch { toast.error(t('admin.auto.k_data_error',t('admin.auto.k_4a041eab', 'Không thể tải dữ liệu dashboard!'))); }
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { fetchDashboard(); }, []);

    if (loading) return (
        <AdminLayout>
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                    <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                </div>
                <p className="text-sm text-slate-500 font-medium"> {t('admin.auto.k_54033c7f', t('admin.auto.k_54033c7f', 'Đang tải dữ liệu...'))} </p>
            </div>
        </AdminLayout>
    );

    const u = data?.userStats    || {};
    const l = data?.learningStats || {};
    const s = data?.systemStats  || {};
    const c = data?.charts       || {};

    /* Chart data */
    const growthByMonth = (c.userGrowth || []).slice(-8).map(i => ({ label:`T${i._id?.month}/${String(i._id?.year).slice(-2)}`, count: i.count ?? 0 }));
    const growthByYear  = (() => { const m = {}; (c.userGrowth||[]).forEach(i=>{const y=i._id?.year; m[y]=(m[y]||0)+(i.count??0);}); return Object.entries(m).map(([y,c])=>({label:y,count:c})); })();
    const growthByDay   = (c.userGrowthDaily||[]).slice(-12).map(i=>({label:`${i._id?.day}/${i._id?.month}`,count:i.count??0}));
    const growthData    = growthTab==='month' ? growthByMonth : growthTab==='year' ? growthByYear : growthByDay;
    const safeGrowth    = growthData.length ? growthData : [{label:'—',count:0}];

    const practiceKey = t('admin.auto.k_practice',t('admin.auto.k_1666ec53', 'Thực hành')); const examKey = t('admin.auto.k_exam',t('admin.auto.k_01e84d32', 'Kiểm tra'));
    const learningData  = (c.learningActivity||[]).slice(-8).map(i=>({ label:`T${i._id?.month}/${String(i._id?.year).slice(-2)}`, [practiceKey]:i.count??0, [examKey]:i.examCount??0 }));
    const safeLearning  = learningData.length ? learningData : [{label:'—',[practiceKey]:0,[examKey]:0}];

    const completionRate   = c.completionRate ?? 0;
    const recCorrect       = c.recognitionRate?.correct   ?? 0;
    const recIncorrect     = c.recognitionRate?.incorrect ?? 0;
    const pieProgressData  = [{name:t('admin.auto.k_eb889c21',t('admin.auto.k_eb889c21', 'Hoàn thành')),value:completionRate,fill:COLORS.emerald},{name:t('admin.auto.k_remaining',t('admin.auto.k_b95a3ecb', 'Còn lại')),value:100-completionRate,fill:'#e2e8f0'}];
    const pieRecognData    = [{name:t('admin.auto.k_correct',t('admin.auto.k_f24a67c1', 'Đúng')),value:recCorrect,fill:COLORS.blue},{name:t('admin.auto.k_incorrect','Sai'),value:recIncorrect,fill:COLORS.red}];
    const radialData       = [
        {name:t('admin.auto.k_eb889c21',t('admin.auto.k_eb889c21', 'Hoàn thành')), value:completionRate, fill:COLORS.emerald},
        {name:t('admin.auto.k_recognition',t('admin.auto.k_0e15f2d6', 'Nhận diện')),  value:recCorrect,     fill:COLORS.blue},
        {name:'Online',     value:Math.min(s.onlineUsers??0,100), fill:COLORS.violet},
    ];

    const isOnline = s.status === 'online';

    return (
        <AdminLayout>
            <div className="space-y-8 pb-6">

                {/* ══ HERO HEADER ══════════════════════════════════════════════════════ */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 shadow-2xl shadow-blue-500/30">
                    {/* Background decorations */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -right-20 -top-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
                        <div className="absolute right-40 bottom-0 w-48 h-48 bg-cyan-400/10 rounded-full blur-2xl" />
                        <div className="absolute left-1/3 top-0 w-32 h-32 bg-blue-300/10 rounded-full blur-xl" />
                        {/* Grid pattern */}
                        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
                            <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <span className="text-blue-200 text-xs font-semibold uppercase tracking-widest">{t('admin.auto.k_live_dash','Live Dashboard')}</span>
                            </div>
                            <h1 className="text-3xl font-black text-white mb-1"> {t('admin.auto.k_bf59c6e3', t('admin.auto.k_bf59c6e3', 'Dashboard Quản trị'))} </h1>
                            <p className="text-blue-200 text-sm"> {t('admin.auto.k_25dead07', t('admin.auto.k_25dead07', 'Tổng quan hệ thống ASL — cập nhật thời gian thực'))} </p>
                            {/* Quick stats inline */}
                            <div className="flex items-center gap-5 mt-4">
                                <div className="text-center"><p className="text-2xl font-black text-white"><AnimatedNumber value={u.totalAccounts} /></p><p className="text-blue-300 text-xs"> {t('admin.auto.k_7bd53616', t('admin.auto.k_7bd53616', 'Tài khoản'))} </p></div>
                                <div className="w-px h-10 bg-white/20" />
                                <div className="text-center"><p className="text-2xl font-black text-white">{isOnline ? 'Online' : 'Offline'}</p><p className="text-blue-300 text-xs"> {t('admin.auto.k_0fbc27f5', t('admin.auto.k_0fbc27f5', 'Trạng thái'))} </p></div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                            {data?._warning && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-400/30 rounded-xl text-amber-200 text-xs">
                                    <AlertCircle size={14} />{data._warning}
                                </div>
                            )}
                            <button onClick={() => fetchDashboard(true)} disabled={refreshing}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-50 active:scale-95 transition-all shadow-lg shadow-black/20 disabled:opacity-60">
                                <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                                {refreshing ? t('admin.auto.k_d5fe42f6',t('admin.auto.k_d5fe42f6', 'Đang tải...')) : t('admin.auto.k_4d20363e',t('admin.auto.k_4d20363e', 'Làm mới'))}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ══ KPI CARDS — NGƯỜI DÙNG ══════════════════════════════════════════ */}
                <section>
                    <SectionHeader icon={Users} iconColor="bg-blue-600" title={t('admin.auto.k_3bf88695', t('admin.auto.k_3bf88695', 'Người dùng'))} subtitle={t('admin.auto.k_cf994208', t('admin.auto.k_cf994208', 'Thống kê tài khoản thời gian thực'))} badge={`${u.totalAccounts ?? 0} ${t('admin.auto.k_total',t('admin.auto.k_c6c4a5cf', 'tổng'))}`} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                        <KpiCard icon={Users}         label={t('admin.auto.k_1b83df7a', t('admin.auto.k_1b83df7a', 'Học viên'))}      value={u.totalStudents}    gradient="bg-gradient-to-br from-blue-500 to-blue-700"     iconBg="bg-white/20" />
                        <KpiCard icon={GraduationCap} label={t('admin.auto.k_6e4e1637', t('admin.auto.k_6e4e1637', 'Giảng viên'))}    value={u.totalInstructors} gradient="bg-gradient-to-br from-emerald-500 to-teal-700"   iconBg="bg-white/20" />
                        <KpiCard icon={CheckCircle}   label={t('admin.auto.k_2c21bcd9', t('admin.auto.k_2c21bcd9', 'Hoạt động'))}     value={u.activeAccounts}   gradient="bg-gradient-to-br from-green-500 to-emerald-700"  iconBg="bg-white/20" />
                        <KpiCard icon={AlertCircle}   label={t('admin.auto.k_fce0d83b', t('admin.auto.k_fce0d83b', 'Bị khóa'))}       value={u.lockedAccounts}   gradient="bg-gradient-to-br from-red-500 to-rose-700"        iconBg="bg-white/20" />
                        <KpiCard icon={TrendingUp}    label={t('admin.auto.k_88122aab', t('admin.auto.k_88122aab', 'Mới hôm nay'))}   value={u.newToday}         gradient="bg-gradient-to-br from-sky-500 to-cyan-700"        iconBg="bg-white/20" />
                        <KpiCard icon={TrendingUp}    label={t('admin.auto.k_378b11da', t('admin.auto.k_378b11da', 'Mới tháng này'))} value={u.newThisMonth}     gradient="bg-gradient-to-br from-indigo-500 to-violet-700"   iconBg="bg-white/20" />
                        <KpiCard icon={Users}         label={t('admin.auto.k_9874c926', t('admin.auto.k_9874c926', 'Tổng tài khoản'))} value={u.totalAccounts}   gradient="bg-gradient-to-br from-slate-600 to-slate-800"     iconBg="bg-white/20" />
                    </div>
                </section>

                {/* ══ KPI CARDS — HỌC TẬP ════════════════════════════════════════════ */}
                <section>
                    <SectionHeader icon={BookOpen} iconColor="bg-cyan-600" title={t('admin.auto.k_f1965145', t('admin.auto.k_f1965145', 'Học tập'))} subtitle={t('admin.auto.k_cf9a17ea', t('admin.auto.k_cf9a17ea', 'Thống kê hoạt động học tập'))} />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        <KpiCard icon={BookOpen}    label={t('admin.auto.k_a43298cb', t('admin.auto.k_a43298cb', 'Bài tập đã tạo'))}      value={l.totalAssignments}           gradient="bg-gradient-to-br from-blue-500 to-indigo-600"   iconBg="bg-white/20" sub={t('admin.auto.k_64d724ce', t('admin.auto.k_64d724ce', 'Tổng assignment'))} />
                        <KpiCard icon={Brain}       label={t('admin.auto.k_c1bfe49f', t('admin.auto.k_c1bfe49f', 'Bài kiểm tra đã tạo'))}  value={l.totalExams}                 gradient="bg-gradient-to-br from-violet-500 to-purple-700"  iconBg="bg-white/20" sub={t('admin.auto.k_36e1f805', t('admin.auto.k_36e1f805', 'Tổng exam'))} />
                        <KpiCard icon={Zap}         label={t('admin.auto.k_2ed4b69a', t('admin.auto.k_2ed4b69a', 'Hoàn to hôm nay'))}   value={l.completedToday}             gradient="bg-gradient-to-br from-amber-500 to-orange-600"   iconBg="bg-white/20" sub={t('admin.auto.k_completed_graded', 'completed/graded')} />
                        <KpiCard icon={Target}      label={t('admin.auto.k_f218a6e9', t('admin.auto.k_f218a6e9', 'Hoàn to tháng này'))} value={l.completedThisMonth}         gradient="bg-gradient-to-br from-emerald-500 to-green-700"  iconBg="bg-white/20" sub={`${t('admin.auto.k_avg_score_label', 'Avg Score')}: ${l.avgScore ?? 0}`} />
                    </div>
                </section>

                {/* ══ SYSTEM STATUS STRIP ═════════════════════════════════════════════ */}
                <section>
                    <SectionHeader icon={Shield} iconColor="bg-slate-700" title={t('admin.auto.k_09cbc7cd', t('admin.auto.k_09cbc7cd', 'Hệ thống'))} subtitle={t('admin.auto.k_45024ca7', t('admin.auto.k_45024ca7', 'Trạng thái máy chủ & tài nguyên'))} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Status panel */}
                        <div className={`relative overflow-hidden rounded-2xl p-5 border-2 shadow-sm ${isOnline ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-2xl ${isOnline ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                    <div className="relative">
                                        <Wifi size={28} className={isOnline ? 'text-emerald-600' : 'text-red-500'} />
                                        {isOnline && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75" />}
                                        {isOnline && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide"> {t('admin.auto.k_caf17eaa', t('admin.auto.k_caf17eaa', 'Trạng thái hệ thống'))} </p>
                                    <p className={`text-3xl font-black ${isOnline ? 'text-emerald-600' : 'text-red-600'}`}>{isOnline ? 'Online' : 'Offline'}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{t('admin.auto.k_uptime_label', 'Uptime')}: <span className="font-bold text-slate-700">{s.uptime || 'N/A'}</span></p>
                                </div>
                            </div>
                        </div>
                        {/* System mini stats */}
                        <div className="grid grid-cols-4 gap-3">
                            <MiniStat label={t('admin.auto.k_db_size', t('admin.auto.k_db_size_label', 'DB Size'))}             value={s.dbSize || 'N/A'}                      color="text-slate-700" />
                            <MiniStat label={t('admin.auto.k_8a2349a5', t('admin.auto.k_8a2349a5', 'Đang online'))}         value={s.onlineUsers != null ? s.onlineUsers : 'N/A'}  color="text-violet-600" />
                            <MiniStat label={t('admin.auto.k_eca845d5', t('admin.auto.k_eca845d5', 'TK mới hôm nay'))}      value={s.newAccountsToday ?? 0}                color="text-blue-600" />
                            <MiniStat label={t('admin.auto.k_f0f576d7', t('admin.auto.k_f0f576d7', 'Huy hiệu đã trao'))}    value={s.totalBadgesAwarded ?? 0}              color="text-amber-600" />
                        </div>
                    </div>
                    {/* Progress bars */}

                </section>

                {/* ══ CHARTS ROW 1 ════════════════════════════════════════════════════ */}
                <section>
                    <SectionHeader icon={BarChart3} iconColor="bg-indigo-600" title={t('admin.auto.k_bb05b8b9', t('admin.auto.k_bb05b8b9', 'Biểu đồ phân tích'))} subtitle={t('admin.auto.k_de28e2a2', t('admin.auto.k_de28e2a2', 'Xu hướng & hoạt động theo thời gian'))} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                        {/* Line: Tăng trưởng users dùng */}
                        <ChartCard title={t('admin.auto.k_9785a83a', t('admin.auto.k_9785a83a', 'Tăng trưởng users dùng'))} icon={TrendingUp} iconColor="text-blue-500"
                            extra={
                                <div className="flex gap-0.5 bg-slate-100 p-0.5 rounded-lg">
                                    {[{k:'day',l:t('admin.auto.k_day',t('admin.auto.k_b9474a12', 'Ngày'))},{k:'month',l:t('admin.auto.k_month',t('admin.auto.k_5703304d', 'Tháng'))},{k:'year',l:t('admin.auto.k_year',t('admin.auto.k_d1301c95', 'Năm'))}].map(t => (
                                        <button key={t.k} onClick={() => setGrowthTab(t.k)}
                                            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${growthTab===t.k?'bg-blue-600 text-white shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
                                            {t.l}
                                        </button>
                                    ))}
                                </div>
                            }>
                            <ResponsiveContainer width="100%" height={230}>
                                <AreaChart data={safeGrowth} margin={{top:5,right:10,left:-15,bottom:0}}>
                                    <defs>
                                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor={COLORS.blue} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="label" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                                    <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                                    <Tooltip content={<CustomTooltip />}/>
                                    <Area type="monotone" dataKey="count" name={t('admin.auto.k_new_users_chart',t('admin.auto.k_425b344e', 'Người dùng mới'))}
                                        stroke={COLORS.blue} strokeWidth={2.5} fill="url(#g1)"
                                        dot={{r:4,fill:COLORS.blue,strokeWidth:2,stroke:'#fff'}}
                                        activeDot={{r:6,fill:COLORS.blue,stroke:'#fff',strokeWidth:2}}/>
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Bar grouped: Hoạt động học tập */}
                        <ChartCard title={t('admin.auto.k_8a27945c', t('admin.auto.k_8a27945c', 'Hoạt động học tập theo tháng'))} icon={Activity} iconColor="text-violet-500">
                            <ResponsiveContainer width="100%" height={230}>
                                <BarChart data={safeLearning} margin={{top:5,right:10,left:-15,bottom:0}} barGap={4}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                                    <XAxis dataKey="label" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                                    <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                                    <Tooltip content={<CustomTooltip />}/>
                                    <Legend wrapperStyle={{fontSize:12,paddingTop:'8px'}}/>
                                    <Bar dataKey={practiceKey} fill={COLORS.blue}   radius={[6,6,0,0]} maxBarSize={24}/>
                                    <Bar dataKey={examKey}  fill={COLORS.violet} radius={[6,6,0,0]} maxBarSize={24}/>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>
                </section>

                {/* ══ CHARTS ROW 2 ════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Donut: tỷ lệ hoàn to */}
                    <ChartCard title={t('admin.auto.k_3a40b963', t('admin.auto.k_3a40b963', 'Tỷ lệ hoàn thành'))} icon={CheckCircle} iconColor="text-emerald-500">
                        <div className="relative">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={pieProgressData} dataKey="value" cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={85} paddingAngle={4}
                                        startAngle={90} endAngle={-270}>
                                        {pieProgressData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
                                    </Pie>
                                    <Tooltip formatter={v => `${v}%`}/>
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black text-emerald-600">{completionRate}%</span>
                                <span className="text-xs text-slate-500"> {t('admin.auto.k_fd55d035', t('admin.auto.k_fd55d035', 'hoàn thành'))} </span>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 mt-1">
                            <LegendDot color={COLORS.emerald} label={`${t('admin.auto.k_done', t('admin.auto.k_bb4bde28', 'Done'))} ${completionRate}%`}/>
                            <LegendDot color="#e2e8f0" label={`${t('admin.auto.k_remaining', t('admin.auto.k_b95a3ecb', 'Remaining'))} ${100-completionRate}%`}/>
                        </div>
                    </ChartCard>

                    {/* Pie: nhận diện ASL */}
                    <ChartCard title={t('admin.auto.k_f71233d2', t('admin.auto.k_f71233d2', 'Nhận diện ASL'))} icon={Wifi} iconColor="text-cyan-500">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={pieRecognData} dataKey="value" cx="50%" cy="50%"
                                    outerRadius={80} paddingAngle={4}
                                    startAngle={90} endAngle={-270}>
                                    {pieRecognData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
                                </Pie>
                                <Tooltip formatter={v => `${v}%`}/>
                                <Legend wrapperStyle={{fontSize:12,paddingTop:'8px'}}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Radial: chỉ số tổng hợp */}
                    <ChartCard title={t('admin.auto.k_afcca091', t('admin.auto.k_afcca091', 'Chỉ số tổng hợp'))} icon={Star} iconColor="text-amber-500">
                        <ResponsiveContainer width="100%" height={200}>
                            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="88%"
                                data={radialData} startAngle={90} endAngle={-270}>
                                <RadialBar background dataKey="value" cornerRadius={8} label={false}/>
                                <Tooltip formatter={v => `${v}%`}/>
                                <Legend iconSize={10} wrapperStyle={{fontSize:11,paddingTop:'8px'}}
                                    formatter={v => <span className="text-slate-600">{v}</span>}/>
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                {/* ══ COMBINED CHART ══════════════════════════════════════════════════ */}
                <ChartCard title={t('admin.auto.k_bcdd8099', t('admin.auto.k_bcdd8099', 'So sánh thực hành & kiểm tra'))} icon={BarChart3} iconColor="text-indigo-500" className="w-full">
                    <ResponsiveContainer width="100%" height={240}>
                        <ComposedChart data={safeLearning} margin={{top:5,right:16,left:-10,bottom:0}}>
                            <defs>
                                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%"   stopColor={COLORS.emerald} stopOpacity={0.9}/>
                                    <stop offset="100%" stopColor={COLORS.teal}    stopOpacity={0.7}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                            <XAxis dataKey="label" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                            <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                            <Tooltip content={<CustomTooltip />}/>
                            <Legend wrapperStyle={{fontSize:12,paddingTop:'8px'}}/>
                            <Bar dataKey={practiceKey} fill="url(#barGrad)" radius={[6,6,0,0]} maxBarSize={32}/>
                            <Line type="monotone" dataKey={examKey} stroke={COLORS.amber} strokeWidth={2.5}
                                dot={{r:4,fill:COLORS.amber,strokeWidth:2,stroke:'#fff'}}/>
                        </ComposedChart>
                    </ResponsiveContainer>
                </ChartCard>

            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
