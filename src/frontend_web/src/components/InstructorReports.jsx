import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Download, Users, BookOpen, TrendingUp, BarChart2,
    RefreshCw, Calendar, Target, Award, Activity, ChevronRight,
    CheckCircle, Clock, AlertCircle, Star, Eye, ArrowUpRight,
    Filter, Search, Zap, GraduationCap, Trophy,
    ChevronDown, ChevronUp, MoreHorizontal
} from 'lucide-react';
import InstructorLayout from './InstructorLayout';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

/* ── helpers ── */
const scoreColor = (v) => v >= 80 ? 'text-emerald-600' : v >= 60 ? 'text-amber-600' : 'text-red-500';
const scoreBg   = (v) => v >= 80 ? 'bg-emerald-500' : v >= 60 ? 'bg-amber-400' : 'bg-red-400';

/* ── mini bar chart (pure CSS/SVG) ── */
const MiniBarChart = ({ data = [], height = 80 }) => {
    if (!data.length) return null;
    const max = Math.max(...data.map(d => d.value || 0), 1);
    return (
        <div className="flex items-end gap-0.5" style={{ height }}>
            {data.map((d, i) => {
                const h = Math.max(4, Math.round(((d.value || 0) / max) * (height - 20)));
                const color = (d.value || 0) >= 80 ? '#10b981' : (d.value || 0) >= 60 ? '#f59e0b' : '#6366f1';
                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            {d.label}: {(d.value || 0).toFixed(1)}
                        </div>
                        <div className="w-full rounded-t transition-all group-hover:opacity-80" style={{ height: h, backgroundColor: color }} />
                        {data.length <= 10 && <span className="text-[8px] text-slate-400 truncate w-full text-center">{d.label}</span>}
                    </div>
                );
            })}
        </div>
    );
};

/* ── stat card ── */
const StatCard = ({ icon: Icon, label, value, sub, color, trend }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
            <Icon size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
            <p className="text-xl font-bold text-slate-800 leading-tight">{value}</p>
            {sub && <p className="text-xs text-slate-400">{sub}</p>}
        </div>
        {trend && <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${trend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>}
    </div>
);

const InstructorReports = () => {
    const navigate = useNavigate();
    const { lang, t } = useLanguage();
    const hasFetched = useRef(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [reportData, setReportData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('score');
    const [sortDir, setSortDir] = useState('desc');
    const [filters, setFilters] = useState({ startDate: '', endDate: '' });
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    /* ── helpers ── */
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US') : t('instructor.reports.noData');

    useEffect(() => {
        if (!localStorage.getItem('token')) { navigate('/login'); return; }
        if (user.role !== 'instructor' && user.role !== 'admin') { navigate('/dashboard'); return; }
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchAllData(true);
    }, []);

    const fetchAllData = async (silent = false) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const [studRes, assRes, statsRes] = await Promise.allSettled([
                fetch('http://localhost:5000/api/instructor/reports/export/students?format=json', { headers }),
                fetch('http://localhost:5000/api/instructor/reports/export/assignments?format=json', { headers }),
                fetch('http://localhost:5000/api/instructor/reports/class-stats', { headers }),
            ]);
            const studData  = studRes.status  === 'fulfilled' && studRes.value.ok  ? await studRes.value.json()  : null;
            const assData   = assRes.status   === 'fulfilled' && assRes.value.ok   ? await assRes.value.json()   : null;
            const statsData = statsRes.status === 'fulfilled' && statsRes.value.ok ? await statsRes.value.json() : null;

            // Merge studentProgress từ /class-stats vào students data
            const mergedStudData = studData ? {
                ...studData,
                studentProgress: statsData?.studentProgress || {
                    totalStudents: studData?.totalStudents || 0,
                    avgScore: 0,
                    avgAccuracy: 0,
                    activeStudents: 0,
                }
            } : null;

            setReportData({ students: mergedStudData, assignments: assData });
        } catch (e) {
            if (!silent) toast.error(t('instructor.reports.serverError'));
        } finally { setLoading(false); }
    };

    const fetchProgressData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const p = new URLSearchParams({ format: 'json' });
            if (filters.startDate) p.append('startDate', filters.startDate);
            if (filters.endDate) p.append('endDate', filters.endDate);
            const res = await fetch(`http://localhost:5000/api/instructor/reports/export/progress?${p}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) {
                // Tính recentPerformance client-side từ submissions theo ngày
                const submissions = data.submissions || [];
                const byDay = {};
                submissions.forEach(s => {
                    const day = (s.submittedAt || s.createdAt || '').slice(0, 10);
                    if (!day) return;
                    if (!byDay[day]) byDay[day] = { _id: day, total: 0, scoreSum: 0 };
                    byDay[day].total++;
                    byDay[day].scoreSum += s.score || 0;
                });
                const recentPerformance = Object.values(byDay)
                    .map(d => ({ _id: d._id, avgScore: d.total > 0 ? Math.round(d.scoreSum / d.total * 10) / 10 : 0, count: d.total }))
                    .sort((a, b) => a._id.localeCompare(b._id));

                setReportData(prev => ({ ...prev, progress: { ...data, recentPerformance } }));
            }
            else toast.error(data.message || t('instructor.reports.errorLoadReport'));
        } catch (e) { toast.error(t('instructor.reports.serverError')); }
        finally { setLoading(false); }
    };

    const exportReport = async (type, format) => {
        try {
            const token = localStorage.getItem('token');
            const url = `http://localhost:5000/api/instructor/reports/export/${type}?format=${format}`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) { toast.error(t('instructor.reports.errorExport')); return; }
            const blob = await res.blob();
            const extMap = { excel: 'xlsx', pdf: 'pdf', csv: 'csv' };
            const nameMap = { students: 'bao-cao-hoc-vien', assignments: 'bao-cao-bai-tap' };
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${nameMap[type] || type}.${extMap[format] || format}`;
            a.click();
            URL.revokeObjectURL(a.href);
            toast.success(t('instructor.reports.exportSuccess'));
        } catch (e) { toast.error(t('instructor.reports.errorExport')); }
    };

    // keep backward compat alias
    const exportCSV = (type) => exportReport(type, 'csv');

    /* ── derived data ── */
    const students = useMemo(() => reportData?.students?.students || [], [reportData]);
    const assignments = useMemo(() => reportData?.assignments?.assignments || [], [reportData]);
    const progress = reportData?.students?.studentProgress || {};

    const filteredStudents = useMemo(() => {
        let arr = [...students];
        if (searchTerm) arr = arr.filter(s => s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || s.email?.toLowerCase().includes(searchTerm.toLowerCase()));
        arr.sort((a, b) => {
            let va, vb;
            if (sortField === 'score')    { va = a.studentStats?.averageScore||0;    vb = b.studentStats?.averageScore||0; }
            else if (sortField === 'acc') { va = a.studentStats?.averageAccuracy||0; vb = b.studentStats?.averageAccuracy||0; }
            else { va = (a.fullName||'').toLowerCase(); vb = (b.fullName||'').toLowerCase(); return sortDir==='asc'?va.localeCompare(vb):vb.localeCompare(va); }
            return sortDir === 'asc' ? va - vb : vb - va;
        });
        return arr;
    }, [students, searchTerm, sortField, sortDir]);

    const scoreDistribution = useMemo(() => {
        const buckets = [{ label: '0-59', count: 0, color: '#ef4444' }, { label: '60-79', count: 0, color: '#f59e0b' }, { label: '80-89', count: 0, color: '#3b82f6' }, { label: '90-100', count: 0, color: '#10b981' }];
        // Chỉ tính học viên đã có ít nhất 1 lần nộp bài
        students.filter(s => (s.totalSubmissions || 0) > 0).forEach(s => {
            const sc = s.studentStats?.averageScore || 0;
            if (sc < 60) buckets[0].count++;
            else if (sc < 80) buckets[1].count++;
            else if (sc < 90) buckets[2].count++;
            else buckets[3].count++;
        });
        return buckets;
    }, [students]);

    const topStudents = useMemo(() => [...students]
        .filter(s => (s.totalSubmissions || 0) > 0)
        .sort((a,b) => (b.studentStats?.averageScore||0)-(a.studentStats?.averageScore||0))
        .slice(0,5), [students]);

    const lowStudents = useMemo(() => [...students]
        .filter(s => (s.totalSubmissions || 0) > 0 && (s.studentStats?.averageScore||0) < 60)
        .slice(0,5), [students]);

    const handleSort = (field) => { if (sortField===field) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortField(field); setSortDir('desc'); } };
    const SortIcon = ({ field }) => sortField!==field ? <ChevronDown size={12} className="text-slate-300 inline ml-0.5"/> : sortDir==='asc' ? <ChevronUp size={12} className="text-indigo-500 inline ml-0.5"/> : <ChevronDown size={12} className="text-indigo-500 inline ml-0.5"/>;

    const tabs = [
        { id: 'overview',    labelKey: 'instructor.reports.tabOverview',    icon: BarChart2 },
        { id: 'students',    labelKey: 'instructor.reports.tabStudents',    icon: Users },
        { id: 'assignments', labelKey: 'instructor.reports.tabAssignments', icon: BookOpen },
        { id: 'progress',    labelKey: 'instructor.reports.tabProgress',   icon: TrendingUp },
    ];

    return (
        <InstructorLayout>
            <div className="max-w-7xl mx-auto space-y-5 pb-6">
                {/* ── Hero Header ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-5 shadow-xl">
                    <div className="absolute inset-0 particle-grid opacity-20 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-400/20 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-amber-300/15 rounded-full blur-[50px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    <BarChart2 size={16} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight">{t('instructor.reports.title')}</h1>
                            </div>
                            <p className="text-amber-100 text-sm">{t('instructor.reports.subtitle')}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {[
                                    { label: t('instructor.dashboard.totalStudents'), val: progress.totalStudents || students.length || 0 },
                                    { label: t('instructor.dashboard.activeStudents'), val: progress.activeStudents || 0 },
                                    { label: t('instructor.dashboard.averageScore'), val: (progress.avgScore || 0).toFixed(1) },
                                ].map((p, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs text-white font-medium">
                                        <span>{p.label}:</span><span className="font-bold">{p.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => fetchAllData(false)} disabled={loading} className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all disabled:opacity-50">
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>
                            {/* Export dropdown */}
                            <div className="flex gap-1.5">
                                <button onClick={() => exportReport('students', 'excel')}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg">
                                    <Download size={13} /> Excel
                                </button>
                                <button onClick={() => exportReport('students', 'pdf')}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-white text-orange-700 text-xs font-bold rounded-xl hover:bg-orange-50 transition-all shadow-lg">
                                    <Download size={13} /> PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard icon={Users}    label={t('instructor.dashboard.totalStudents')}    value={progress.totalStudents||students.length||0}  color="bg-indigo-500" />
                    <StatCard icon={Activity} label={t('instructor.dashboard.activeStudents')}  value={progress.activeStudents||0} sub={`/ ${students.length}`} color="bg-emerald-500" />
                    <StatCard icon={Star}     label={t('instructor.dashboard.averageScore')}       value={(progress.avgScore||0).toFixed(1)} sub="/100" color="bg-amber-500" />
                    <StatCard icon={Target}   label={t('instructor.dashboard.avgAccuracy')}    value={(progress.avgAccuracy||0).toFixed(1)+'%'} color="bg-blue-500" />
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex border-b border-slate-100 overflow-x-auto">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button key={tab.id} onClick={()=>{ setActiveTab(tab.id); if(tab.id==='progress') fetchProgressData(); }}
                                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${activeTab===tab.id?'border-indigo-500 text-indigo-700 bg-indigo-50/50':'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                                    <Icon size={15}/>{t(tab.labelKey)}
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-5">
                        {loading && (
                            <div className="flex flex-col items-center py-16 gap-3">
                                <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"/>
                                <p className="text-slate-400 text-sm">{t('common.loading')}</p>
                            </div>
                        )}

                        {/* ── OVERVIEW TAB ── */}
                        {!loading && activeTab==='overview' && (
                            <div className="space-y-6">
                                {/* Score distribution + Assignment completion */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    {/* Score distribution bar */}
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2"><BarChart2 size={15} className="text-indigo-500"/>{t('instructor.reports.scoreDistribution')}</h3>
                                        <div className="space-y-3">
                                            {scoreDistribution.map((b,i) => {
                                                const pct = students.length > 0 ? Math.round((b.count/students.length)*100) : 0;
                                                return (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <span className="text-xs font-medium text-slate-600 w-14 flex-shrink-0">{b.label}</span>
                                                        <div className="flex-1 h-5 bg-slate-200 rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full flex items-center justify-end pr-2 transition-all" style={{ width:`${pct}%`, backgroundColor: b.color }}>
                                                                {pct > 10 && <span className="text-white text-[10px] font-bold">{b.count}</span>}
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {students.length === 0 && <p className="text-slate-400 text-sm text-center py-4">{t('instructor.reports.noData')}</p>}
                                    </div>

                                    {/* Assignment completion */}
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2"><BookOpen size={15} className="text-blue-500"/>{t('instructor.reports.assignmentCompletion')}</h3>
                                        {assignments.length === 0 ? (
                                            <p className="text-slate-400 text-sm text-center py-8">{t('instructor.reports.noData')}</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {assignments.slice(0, 6).map((a, i) => {
                                                    const pct = a.totalSubmissions > 0 ? Math.round((a.completedSubmissions / a.totalSubmissions) * 100) : 0;
                                                    return (
                                                        <div key={i} className="flex items-center gap-3">
                                                            <span className="text-xs text-slate-600 w-32 truncate flex-shrink-0" title={a.title}>{a.title}</span>
                                                            <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full transition-all ${pct>=80?'bg-emerald-500':pct>=50?'bg-amber-400':'bg-slate-400'}`} style={{width:`${pct}%`}}/>
                                                            </div>
                                                            <span className={`text-xs font-bold w-10 text-right ${pct>=80?'text-emerald-600':pct>=50?'text-amber-600':'text-slate-500'}`}>{pct}%</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Top & Low performers */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    <div className="bg-gradient-to-br from-emerald-950 to-teal-950 rounded-xl p-4">
                                        <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2"><Trophy size={15} className="text-amber-400"/>{t('instructor.reports.top5Performers')}</h3>
                                        <div className="space-y-2">
                                            {topStudents.map((s,i) => (
                                                <div key={s._id} onClick={()=>navigate(`/instructor/students/${s._id}`)} className="flex items-center gap-3 p-2.5 bg-white/8 hover:bg-white/15 rounded-lg cursor-pointer transition-all">
                                                    <span className="text-base w-6 text-center flex-shrink-0">{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white text-xs font-semibold truncate">{s.fullName}</p>
                                                        <p className="text-emerald-300/60 text-[10px] truncate">{s.email}</p>
                                                    </div>
                                                    <span className="text-amber-400 font-bold text-sm flex-shrink-0">{(s.studentStats?.averageScore||0).toFixed(1)}</span>
                                                </div>
                                            ))}
                                            {topStudents.length===0 && <p className="text-emerald-400/50 text-xs text-center py-3">{t('instructor.reports.noData')}</p>}
                                        </div>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                        <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2"><AlertCircle size={15} className="text-amber-500"/>{t('instructor.reports.needSupport')}</h3>
                                        <div className="space-y-2">
                                            {lowStudents.map(s => (
                                                <div key={s._id} onClick={()=>navigate(`/instructor/students/${s._id}`)} className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-amber-100 cursor-pointer hover:shadow-sm transition-all">
                                                    <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{(s.fullName||'H').charAt(0)}</div>
                                                    <div className="flex-1 min-w-0"><p className="text-slate-800 text-xs font-semibold truncate">{s.fullName}</p></div>
                                                    <span className="text-red-500 font-bold text-sm flex-shrink-0">{(s.studentStats?.averageScore||0).toFixed(1)}</span>
                                                </div>
                                            ))}
                                            {lowStudents.length===0 && <div className="flex flex-col items-center py-4 gap-1"><CheckCircle size={24} className="text-emerald-400"/><p className="text-emerald-600 text-xs font-medium">{t('instructor.dashboard.allGood')}</p></div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── STUDENTS TAB ── */}
                        {!loading && activeTab==='students' && (
                            <div className="space-y-4">
                                {/* Search + export */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                                        <input type="text" placeholder={t('instructor.students.search')} value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                                    </div>
                                    <button onClick={()=>exportReport('students','excel')} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors">
                                        <Download size={14}/> Excel
                                    </button>
                                    <button onClick={()=>exportReport('students','pdf')} className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg transition-colors">
                                        <Download size={14}/> PDF
                                    </button>
                                </div>
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full text-sm">
                                        <thead><tr className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
                                            <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase w-8">#</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase cursor-pointer select-none" onClick={()=>handleSort('name')}>
                                                {t('instructor.students.name')}<SortIcon field="name"/>
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase">{t('instructor.reports.submissions')}</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase cursor-pointer select-none min-w-[130px]" onClick={()=>handleSort('score')}>
                                                {t('instructor.reports.avgScore')}<SortIcon field="score"/>
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase cursor-pointer select-none min-w-[130px]" onClick={()=>handleSort('acc')}>
                                                {t('instructor.reports.accuracy')}<SortIcon field="acc"/>
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase">{t('instructor.students.actions')}</th>
                                        </tr></thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredStudents.length===0 ? (
                                                <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400 text-sm">{t('instructor.students.noStudents')}</td></tr>
                                            ) : filteredStudents.map((s,i) => {
                                                const sc = s.studentStats?.averageScore||0;
                                                const ac = s.studentStats?.averageAccuracy||0;
                                                return (
                                                    <tr key={s._id} className="hover:bg-indigo-50/30 transition-colors">
                                                        <td className="px-4 py-3 text-slate-400 text-xs">{i+1}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{(s.fullName||'H').charAt(0)}</div>
                                                                <div className="min-w-0"><p className="font-semibold text-slate-800 truncate text-sm">{s.fullName}</p><p className="text-xs text-slate-400 truncate">{s.email}</p></div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600 text-sm">{s.totalSubmissions||0}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${scoreBg(sc)}`} style={{width:`${sc}%`}}/></div>
                                                                <span className={`text-xs font-bold w-8 text-right ${scoreColor(sc)}`}>{sc.toFixed(1)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{width:`${ac}%`}}/></div>
                                                                <span className="text-xs font-bold text-blue-600 w-10 text-right">{ac.toFixed(1)}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <button onClick={()=>navigate(`/instructor/students/${s._id}`)} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"><Eye size={14}/></button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="text-xs text-slate-400 text-center">{t('instructor.reports.showingStudents', { shown: filteredStudents.length, total: students.length })}</p>
                            </div>
                        )}

                        {/* ── ASSIGNMENTS TAB ── */}
                        {!loading && activeTab==='assignments' && (
                            <div className="space-y-4">
                                <div className="flex justify-end gap-2">
                                    <button onClick={()=>exportReport('assignments','excel')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors">
                                        <Download size={14}/> Excel
                                    </button>
                                    <button onClick={()=>exportReport('assignments','pdf')} className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg transition-colors">
                                        <Download size={14}/> PDF
                                    </button>
                                </div>
                                {assignments.length===0 ? (
                                    <div className="text-center py-12"><BookOpen size={36} className="text-slate-300 mx-auto mb-2"/><p className="text-slate-400 text-sm">{t('instructor.reports.noAssignmentData')}</p></div>
                                ) : (
                                    <div className="space-y-3">
                                        {assignments.map((a,i) => {
                                            const pct = a.totalSubmissions>0 ? Math.round((a.completedSubmissions/a.totalSubmissions)*100) : 0;
                                            return (
                                                <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:shadow-sm transition-all">
                                                    <div className="flex items-start justify-between gap-3 mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-slate-800 text-sm">{a.title}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">{a.type}</span>
                                                                <span className="text-xs text-slate-400">{a.completedSubmissions||0}/{a.totalSubmissions||0} {t('instructor.reports.submitted')}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <p className={`text-lg font-bold ${scoreColor(a.averageScore||0)}`}>{(a.averageScore||0).toFixed(1)}</p>
                                                            <p className="text-xs text-slate-400">{t('instructor.reports.avgScoreLabel')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all ${pct>=80?'bg-emerald-500':pct>=50?'bg-amber-400':'bg-slate-400'}`} style={{width:`${pct}%`}}/>
                                                        </div>
                                                        <span className={`text-xs font-bold w-10 text-right ${pct>=80?'text-emerald-600':pct>=50?'text-amber-600':'text-slate-500'}`}>{pct}%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── PROGRESS TAB ── */}
                        {!loading && activeTab==='progress' && (
                            <div className="space-y-5">
                                <div className="flex flex-wrap items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <Calendar size={15} className="text-slate-400"/>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-medium text-slate-600">{t('instructor.reports.fromDate')}:</label>
                                        <input type="date" value={filters.startDate} onChange={e=>setFilters(p=>({...p,startDate:e.target.value}))} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-medium text-slate-600">{t('instructor.reports.toDate')}:</label>
                                        <input type="date" value={filters.endDate} onChange={e=>setFilters(p=>({...p,endDate:e.target.value}))} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                                    </div>
                                    <button onClick={fetchProgressData} className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">{t('instructor.reports.apply')}</button>
                                </div>
                                {reportData?.progress?.recentPerformance?.length > 0 ? (
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2"><TrendingUp size={15} className="text-indigo-500"/>{t('instructor.reports.progressChart')}</h3>
                                        <MiniBarChart data={reportData.progress.recentPerformance.slice(-20).map(d=>({ label:(d._id||'').slice(5), value: d.avgScore||0 }))} height={120}/>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
                                        <TrendingUp size={36} className="text-slate-300 mx-auto mb-2"/>
                                        <p className="text-slate-400 text-sm">{t('instructor.reports.selectDateRange')}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </InstructorLayout>
    );
};

export default InstructorReports;
