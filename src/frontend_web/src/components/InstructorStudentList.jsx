import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Filter, ChevronLeft, ChevronRight, Eye, Mail,
    Award, TrendingUp, Calendar, Users, LayoutGrid, List,
    Download, RefreshCw, ChevronUp, ChevronDown, ChevronsUpDown,
    Activity, Target, Star, Clock, BookOpen, FileText, X, CheckCircle
} from 'lucide-react';
import InstructorLayout from './InstructorLayout';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

const isActiveStudent = (s) => {
    const last = s.studentStats?.lastPracticeDate;
    return last && new Date(last) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
};
const scoreColor = (v) => {
    if (v >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-600' };
    if (v >= 60) return { bar: 'bg-amber-400', text: 'text-amber-600' };
    return { bar: 'bg-red-500', text: 'text-red-600' };
};
const accuracyColor = (v) => v >= 80 ? 'bg-blue-500' : v >= 60 ? 'bg-indigo-400' : 'bg-violet-400';
const rankMedal = (i, sortBy, sortDir) => {
    const isTopRank = (sortBy === 'score' || sortBy === 'accuracy') && sortDir === 'desc';
    if (isTopRank && i === 0) return '🥇';
    if (isTopRank && i === 1) return '🥈';
    if (isTopRank && i === 2) return '🥉';
    return <span className="text-slate-400 text-xs font-bold">{i + 1}</span>;
};
const fmtDate = (d, lang) => d ? new Date(d).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const avatarGradient = (name = '') => {
    const colors = ['from-blue-500 to-indigo-500','from-indigo-500 to-purple-500','from-violet-500 to-blue-500','from-sky-500 to-cyan-500','from-blue-600 to-cyan-400'];
    return colors[(name.charCodeAt(0) || 0) % colors.length];
};

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon size={18} className="text-white" />
        </div>
        <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
            <p className="text-xl font-bold text-slate-800 leading-tight">{value}</p>
            {sub && <p className="text-xs text-slate-400">{sub}</p>}
        </div>
    </div>
);

const ProgressBar = ({ value, colorClass }) => (
    <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${Math.min(100, value || 0)}%` }} />
        </div>
        <span className="text-xs font-semibold text-slate-600 w-8 text-right">{(value || 0).toFixed(0)}</span>
    </div>
);

const SortIcon = ({ field, sortBy, sortDir }) => {
    if (sortBy !== field) return <ChevronsUpDown size={13} className="text-slate-300 ml-1 inline" />;
    return sortDir === 'asc' ? <ChevronUp size={13} className="text-indigo-500 ml-1 inline" /> : <ChevronDown size={13} className="text-indigo-500 ml-1 inline" />;
};

/* ── Popup: submission list ── */
const SubmissionPopup = ({ items, title, icon: Icon, iconColor, onClose, lang, t }) => {
    if (!items) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
                            <Icon size={15} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
                            <p className="text-xs text-slate-400">{items.length} {t('instructor.students.submissionPopupTitle')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><X size={16} /></button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {items.length === 0 ? (
                        <div className="py-10 text-center text-slate-400 text-sm">{t('instructor.students.noSubmissionsYet')}</div>
                    ) : items.map((item, i) => {
                        const score = item.score ?? null;
                        const passing = item.passingScore ?? 60;
                        const isCompleted = score !== null && score >= passing;
                        const scoreColor = score === null
                            ? 'text-slate-400'
                            : isCompleted
                                ? 'text-emerald-600'
                                : 'text-red-500';
                        return (
                            <div key={item.id || i} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                                    {isCompleted
                                        ? <CheckCircle size={13} className="text-emerald-600" />
                                        : <Clock size={13} className="text-amber-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                                    <p className="text-xs text-slate-400">
                                        {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US') : '—'}
                                        <span className="ml-2 font-medium" style={{color: isCompleted ? '#10b981' : '#f59e0b'}}>
                                            {t('instructor.students.passingRequired')}: {item.passingScore ?? 60}
                                        </span>
                                    </p>
                                </div>
                                <span className={`text-sm font-bold flex-shrink-0 ${scoreColor}`}>
                                    {score !== null ? score.toFixed(1) : '—'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const StudentList = () => {
    const navigate = useNavigate();
    const { lang, t } = useLanguage();
    const hasFetched = useRef(false);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [filters, setFilters] = useState({ search: '', status: '', level: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('table');
    const [sortBy, setSortBy] = useState('score');
    const [sortDir, setSortDir] = useState('desc');
    const [popup, setPopup] = useState(null); // { items, title, icon, iconColor }
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!localStorage.getItem('token')) { navigate('/login'); return; }
        if (user.role !== 'instructor' && user.role !== 'admin') { navigate('/dashboard'); return; }
    }, []);

    const fetchStudents = useCallback(async (silent = false) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({ page: pagination.page, limit: 50, ...filters });
            const res = await fetch(`http://localhost:5000/api/instructor/students?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) { setStudents(data.students || []); setPagination(data.pagination || { page: 1, pages: 1, total: 0 }); }
            else if (!silent) toast.error(data.message || t('instructor.students.errorLoad'));
        } catch (err) {
            if (!silent) toast.error(t('instructor.reports.serverError'));
        } finally { setLoading(false); }
    }, [pagination.page, filters]);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchStudents(true);
    }, []);

    useEffect(() => {
        if (!hasFetched.current) return;
        fetchStudents(false);
    }, [pagination.page, filters]);

    const totalStudents = students.length;
    const activeStudents = students.filter(isActiveStudent).length;
    const avgScore = totalStudents ? (students.reduce((s, st) => s + (st.studentStats?.averageScore || 0), 0) / totalStudents).toFixed(1) : '—';
    const avgAccuracy = totalStudents ? (students.reduce((s, st) => s + (st.studentStats?.averageAccuracy || 0), 0) / totalStudents).toFixed(1) : '—';

    const handleSort = (field) => {
        if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(field); setSortDir('desc'); }
    };

    const sorted = [...students].sort((a, b) => {
        if (sortBy === 'score') { const va = a.studentStats?.averageScore || 0, vb = b.studentStats?.averageScore || 0; return sortDir === 'asc' ? va - vb : vb - va; }
        if (sortBy === 'accuracy') { const va = a.studentStats?.averageAccuracy || 0, vb = b.studentStats?.averageAccuracy || 0; return sortDir === 'asc' ? va - vb : vb - va; }
        const va = (a.fullName || '').toLowerCase(), vb = (b.fullName || '').toLowerCase();
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    const exportCSV = () => {
        const header = [t('instructor.students.rank'), t('instructor.students.name'), t('instructor.students.email'), t('instructor.students.avgScoreCSV'), t('instructor.students.accuracyCSV'), t('instructor.students.submissionsCSV'), t('instructor.students.lastActive')];
        const rows = sorted.map((s, i) => [i+1, s.fullName||'', s.email||'', (s.studentStats?.averageScore||0).toFixed(1), (s.studentStats?.averageAccuracy||0).toFixed(1), `${s.completedCount||0}/${s.submissionCount||0}`, fmtDate(s.studentStats?.lastPracticeDate, lang)]);
        const csv = [header,...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'students.csv'; a.click();
        URL.revokeObjectURL(url);
        toast.success(t('instructor.reports.exportSuccess'));
    };

    return (
        <InstructorLayout>
            <div className="max-w-7xl mx-auto space-y-4 pb-6">
            {popup && <SubmissionPopup items={popup.items} title={popup.title} icon={popup.icon} iconColor={popup.iconColor} onClose={() => setPopup(null)} lang={lang} t={t} />}
                {/* ── Hero Header ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 p-5 shadow-xl">
                    <div className="absolute inset-0 particle-grid opacity-20 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-sky-400/20 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-indigo-300/15 rounded-full blur-[50px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    <Users size={16} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight">{t('instructor.students.title')}</h1>
                            </div>
                            <p className="text-blue-100 text-sm">{t('instructor.students.subtitle')}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {[
                                    { label: t('instructor.dashboard.totalStudents'), val: totalStudents },
                                    { label: t('instructor.students.active7days'), val: activeStudents },
                                    { label: t('instructor.dashboard.averageScore'), val: avgScore },
                                ].map((p, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs text-white font-medium">
                                        <span>{p.label}:</span><span className="font-bold">{p.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => fetchStudents(false)} disabled={loading} className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all disabled:opacity-50">
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>
                            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-lg">
                                <Download size={15} />{t('instructor.reports.exportCSV')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard icon={Users}    label={t('instructor.dashboard.totalStudents')}   value={totalStudents}  color="bg-indigo-500" />
                    <StatCard icon={Activity} label={t('instructor.students.active7days')}     value={activeStudents} sub={`/ ${totalStudents}`} color="bg-emerald-500" />
                    <StatCard icon={Star}     label={t('instructor.dashboard.averageScore')}    value={avgScore}       sub="/ 100"            color="bg-amber-500" />
                    <StatCard icon={Target}   label={t('instructor.dashboard.avgAccuracy')}    value={avgAccuracy !== '—' ? avgAccuracy + '%' : '—'} color="bg-blue-500" />
                </div>

                {/* Search/Filter/View */}
                <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" placeholder={t('instructor.students.search')} value={filters.search}
                                onChange={(e) => { setFilters(p => ({ ...p, search: e.target.value })); setPagination(p => ({ ...p, page: 1 })); }}
                                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>
                        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            <Filter size={14} />{t('instructor.students.filter')}
                        </button>
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} title={t('instructor.students.tableView')}><List size={16} /></button>
                            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} title={t('instructor.students.cardView')}><LayoutGrid size={16} /></button>
                        </div>
                    </div>
                    {showFilters && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-3">
                            <select value={filters.status} onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))} className="px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                <option value="">{t('instructor.students.allStatuses')}</option>
                                <option value="active">{t('instructor.students.active')}</option>
                                <option value="inactive">{t('instructor.students.inactive')}</option>
                            </select>
                            <select value={filters.level} onChange={(e) => setFilters(p => ({ ...p, level: e.target.value }))} className="px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                <option value="">{t('instructor.students.allLevels')}</option>
                                <option value="beginner">{t('instructor.students.beginner')}</option>
                                <option value="intermediate">{t('instructor.students.intermediate')}</option>
                                <option value="advanced">{t('instructor.students.advanced')}</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Loading */}
                {loading && <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center gap-3 shadow-sm"><div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /><p className="text-sm text-slate-500">{t('common.loading')}</p></div>}

                {/* Empty */}
                {!loading && sorted.length === 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center gap-3 shadow-sm">
                        <Users size={40} className="text-slate-300" />
                        <p className="text-slate-500 font-medium">{t('instructor.students.noStudents')}</p>
                    </div>
                )}

                {/* TABLE VIEW */}
                {!loading && sorted.length > 0 && viewMode === 'table' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase w-10">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase cursor-pointer select-none hover:text-indigo-900" onClick={() => handleSort('name')}>
                                            {t('instructor.students.name')} <SortIcon field="name" sortBy={sortBy} sortDir={sortDir} />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase">{t('instructor.students.status')}</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase cursor-pointer select-none hover:text-indigo-900 min-w-[140px]" onClick={() => handleSort('score')}>
                                            {t('instructor.dashboard.averageScore')} <SortIcon field="score" sortBy={sortBy} sortDir={sortDir} />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase min-w-[120px]">{t('instructor.students.assignmentsCol')}</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase min-w-[130px]">{t('instructor.students.examsCol')}</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase">{t('instructor.students.lastActive')}</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase">{t('instructor.students.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sorted.map((student, i) => {
                                        const score = student.studentStats?.averageScore || 0;
                                        const accuracy = student.studentStats?.averageAccuracy || 0;
                                        const sc = scoreColor(score);
                                        const active = isActiveStudent(student);
                                        return (
                                            <tr key={student._id} className="hover:bg-indigo-50/40 transition-colors">
                                                <td className="px-4 py-3 text-center"><span className="text-base leading-none">{rankMedal(i, sortBy, sortDir)}</span></td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(student.fullName)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                                                            {(student.fullName || 'H').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-slate-800 truncate">{student.fullName}</p>
                                                            <p className="text-xs text-slate-400 truncate">{student.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {active
                                                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />{t('instructor.students.active')}</span>
                                                        : <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />{t('instructor.students.inactive')}</span>
                                                    }
                                                </td>
                                                <td className="px-4 py-3"><ProgressBar value={score} colorClass={sc.bar} /></td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => setPopup({ items: student.assignmentSubmissions || [], title: `${t('instructor.assignments.title')} — ${student.fullName}`, icon: BookOpen, iconColor: 'bg-blue-500' })}
                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors group">
                                                        <BookOpen size={13} className="text-blue-500" />
                                                        <span className="text-sm font-bold text-blue-700">{(student.assignmentSubmissions || []).length}</span>
                                                        <span className="text-xs text-blue-400 group-hover:text-blue-600">{t('instructor.students.taskUnit')}</span>
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => setPopup({ items: student.examSubmissions || [], title: `${t('instructor.exams.title')} — ${student.fullName}`, icon: FileText, iconColor: 'bg-violet-500' })}
                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-100 transition-colors group">
                                                        <FileText size={13} className="text-violet-500" />
                                                        <span className="text-sm font-bold text-violet-700">{(student.examSubmissions || []).length}</span>
                                                        <span className="text-xs text-violet-400 group-hover:text-violet-600">{t('instructor.students.taskUnit')}</span>
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(student.studentStats?.lastPracticeDate, lang)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => navigate(`/instructor/students/${student._id}`)} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" title={t('instructor.students.viewDetail')}><Eye size={15} /></button>
                                                        <button onClick={() => navigate(`/instructor/students/${student._id}?tab=feedback`)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title={t('instructor.students.sendFeedback')}><Mail size={15} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {pagination.pages > 1 && (
                            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                                <p className="text-xs text-slate-500">{t('instructor.students.pageInfo', { page: pagination.page, pages: pagination.pages, total: pagination.total })}</p>
                                <div className="flex items-center gap-1.5">
                                    <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronLeft size={15} /></button>
                                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold">{pagination.page}</span>
                                    <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.pages} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronRight size={15} /></button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* GRID VIEW */}
                {!loading && sorted.length > 0 && viewMode === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {sorted.map((student, i) => {
                            const score = student.studentStats?.averageScore || 0;
                            const accuracy = student.studentStats?.averageAccuracy || 0;
                            const sc = scoreColor(score);
                            const active = isActiveStudent(student);
                            const circumference = 2 * Math.PI * 22;
                            const offset = circumference - (score / 100) * circumference;
                            return (
                                <div key={student._id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarGradient(student.fullName)} flex items-center justify-center text-white font-bold text-base flex-shrink-0`}>
                                                {(student.fullName || 'H').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-800 text-sm truncate max-w-[120px]">{student.fullName}</p>
                                                <p className="text-xs text-slate-400 truncate max-w-[120px]">{student.email}</p>
                                            </div>
                                        </div>
                                        <span className="text-lg leading-none flex-shrink-0">{rankMedal(i, sortBy, sortDir)}</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-6 py-1">
                                        <div className="relative w-14 h-14">
                                            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 50 50">
                                                <circle cx="25" cy="25" r="22" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                                                <circle cx="25" cy="25" r="22" fill="none" stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center"><span className={`text-sm font-bold ${sc.text}`}>{score.toFixed(0)}</span></div>
                                        </div>
                                        <div className="flex flex-col gap-1 text-xs text-slate-600">
                                            <div className="flex items-center gap-1.5"><Target size={11} className="text-blue-500" /><span>{accuracy.toFixed(1)}% {t('instructor.dashboard.accuracy')}</span></div>
                                            <div className="flex items-center gap-1.5"><Award size={11} className="text-indigo-500" /><span>{student.completedCount || 0}/{student.submissionCount || 0} {t('instructor.students.tasks')}</span></div>
                                            <div className="flex items-center gap-1.5"><Clock size={11} className="text-slate-400" /><span>{fmtDate(student.studentStats?.lastPracticeDate, lang)}</span></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                        {active
                                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />{t('instructor.students.active')}</span>
                                            : <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />{t('instructor.students.inactive')}</span>
                                        }
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => navigate(`/instructor/students/${student._id}`)} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"><Eye size={14} /></button>
                                            <button onClick={() => navigate(`/instructor/students/${student._id}?tab=feedback`)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Mail size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </InstructorLayout>
    );
};

export default StudentList;
