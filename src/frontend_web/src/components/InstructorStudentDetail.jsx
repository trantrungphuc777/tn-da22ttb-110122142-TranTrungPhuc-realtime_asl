import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Mail, Award, TrendingUp, Clock, Target, BookOpen,
    MessageSquare, AlertTriangle, CheckCircle, BarChart2, Send,
    Activity, Star, Zap, Eye, Calendar, User, Lightbulb, Heart,
    ThumbsUp, Sparkles, FileText, X, ChevronDown, Info
} from 'lucide-react';
import InstructorLayout from './InstructorLayout';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

const getRarityLabel = (rarity, lang) => {
    const labels = {
        vi: { common: 'Cơ Bản', uncommon: 'Trung Cấp', rare: 'Nâng Cao', epic: 'Chuyên Sâu', legendary: 'Tinh Hoa' },
        en: { common: 'Basic',  uncommon: 'Intermediate', rare: 'Advanced', epic: 'Expert',   legendary: 'Elite' },
    };
    return (labels[lang] || labels.vi)[rarity] || rarity;
};

const ScoreRing = ({ value, size = 56 }) => {
    const r = 20, c = 2 * Math.PI * r;
    const offset = c - (Math.min(value, 100) / 100) * c;
    const color = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444';
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox="0 0 50 50" className="-rotate-90">
                <circle cx="25" cy="25" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
                <circle cx="25" cy="25" r={r} fill="none" stroke={color} strokeWidth="4"
                    strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold" style={{ color }}>{Math.round(value)}</span>
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}><Icon size={16} className="text-white" /></div>
        <div><p className="text-xs text-slate-500">{label}</p><p className="text-lg font-bold text-slate-800">{value}</p></div>
    </div>
);

const StudentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { lang, t } = useLanguage();
    const hasFetched = useRef(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [student, setStudent] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [newFeedback, setNewFeedback] = useState({ type: 'suggestion', title: '', content: '', priority: 'normal' });
    const [feedbackTab, setFeedbackTab] = useState('compose'); // 'compose' | 'preview'
    const [evaluation, setEvaluation] = useState(null);
    const [studentBadges, setStudentBadges] = useState({ earned: [], total: 0 });
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!localStorage.getItem('token')) { navigate('/login'); return; }
        if (user.role !== 'instructor' && user.role !== 'admin') { navigate('/dashboard'); return; }
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchStudentData();
    }, [id]);

    const fetchStudentData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/instructor/students/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            const result = await res.json();
            if (res.ok) {
                setStudent(result.student);
                setSubmissions(result.submissions || []);
                setFeedback(result.feedback || []);
                fetchEvaluation(result.student._id);
                fetchStudentBadges(result.student._id);
            } else {
                toast.error(result.message || t('instructor.studentDetail.studentNotFound'));
                navigate('/instructor/students');
            }
        } catch (e) {
            // silent fail on load
        } finally { setLoading(false); }
    };

    const fetchEvaluation = async (studentId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/instructor/submissions/evaluation/${studentId}`, { headers: { Authorization: `Bearer ${token}` } });
            const result = await res.json();
            if (res.ok) setEvaluation(result.evaluation);
        } catch (e) {}
    };

    const fetchStudentBadges = async (studentId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/instructor/badges/students/${studentId}/badges`, { headers: { Authorization: `Bearer ${token}` } });
            const result = await res.json();
            if (res.ok) {
                setStudentBadges({
                    earned: result.allBadges?.filter(b => b.earned) || [],
                    total: result.totalBadges || 0
                });
            }
        } catch (e) {}
    };

    const handleSendFeedback = async () => {
        if (!newFeedback.title || !newFeedback.content) { toast.error(t('instructor.studentDetail.fillAllFields')); return; }
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/instructor/submissions/students/${id}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(newFeedback)
            });
            const result = await res.json();
            if (res.ok) {
                toast.success(t('instructor.studentDetail.feedbackSent'));
                setShowFeedbackModal(false);
                setNewFeedback({ type: 'suggestion', title: '', content: '', priority: 'normal' });
                setFeedbackTab('compose');
                hasFetched.current = false;
                fetchStudentData();
            } else toast.error(result.message);
        } catch (e) { toast.error(t('instructor.studentDetail.errorSendingFeedback')); }
    };

    if (loading) return (
        <InstructorLayout>
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
                    <p className="text-slate-500 text-sm">{t('common.loading')}</p>
                </div>
            </div>
        </InstructorLayout>
    );
    if (!student) return null;

    const score = student.studentStats?.averageScore || 0;
    const accuracy = student.studentStats?.averageAccuracy || 0;
    const tabs = [
        { id: 'overview',    labelKey: 'instructor.studentDetail.overview',    icon: BarChart2 },
        { id: 'submissions', labelKey: 'instructor.studentDetail.submissions', icon: BookOpen },
        { id: 'feedback',    labelKey: 'instructor.studentDetail.feedback',    icon: MessageSquare },
        { id: 'badges',     labelKey: 'homePage.badges.studentBadges',         icon: Award },
    ];

    return (
        <InstructorLayout>
            <div className="max-w-7xl mx-auto space-y-4 pb-6 px-2">
                {/* Back */}
                <button onClick={() => navigate('/instructor/students')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
                    <ArrowLeft size={16} />{t('instructor.studentDetail.backToList')}
                </button>

                {/* Hero card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-5 shadow-xl">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/15 rounded-full blur-[60px]" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0">
                            {(student.fullName || 'H').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-bold text-white">{student.fullName}</h1>
                            <p className="text-blue-300 text-sm">{student.email}</p>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <span className="flex items-center gap-1 text-xs text-slate-400"><Calendar size={11} />{t('instructor.studentDetail.joined')}: {new Date(student.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}</span>
                                {student.studentStats?.lastPracticeDate && (
                                    <span className="flex items-center gap-1 text-xs text-slate-400"><Clock size={11} />{t('instructor.studentDetail.active')}: {new Date(student.studentStats.lastPracticeDate).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-center">
                                <ScoreRing value={score} size={52} />
                                <p className="text-xs text-slate-400 mt-1">{t('instructor.dashboard.averageScore')}</p>
                            </div>
                            <div className="text-center">
                                <ScoreRing value={accuracy} size={52} />
                                <p className="text-xs text-slate-400 mt-1">{t('instructor.dashboard.accuracy')}</p>
                            </div>
                            <button onClick={() => setShowFeedbackModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors border border-white/20">
                                <Send size={14} />{t('instructor.studentDetail.feedback')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard icon={Award}    label={t('instructor.dashboard.averageScore')}    value={score.toFixed(1)}                                    color="bg-emerald-500" />
                    <StatCard icon={Target}   label={t('instructor.dashboard.avgAccuracy')}    value={accuracy.toFixed(1) + '%'}                           color="bg-blue-500" />
                    <StatCard icon={Activity} label={t('instructor.studentDetail.practiceCount')} value={student.studentStats?.totalPracticeCount || 0}    color="bg-violet-500" />
                    <StatCard icon={Star}     label={t('instructor.studentDetail.evalScore')}   value={evaluation?.overallScore || '—'}                     color="bg-amber-500" />
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex border-b border-slate-100">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-slate-500 hover:bg-slate-50'}`}>
                                    <Icon size={15} />{t(tab.labelKey)}
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-5">
                        {/* OVERVIEW */}
                        {activeTab === 'overview' && (
                            <div className="space-y-5">
                                {/* Evaluation */}
                                {evaluation && (
                                    <div className="space-y-3">
                                        <h3 className="font-bold text-slate-800 text-sm">{t('instructor.studentDetail.detailedEvaluation')}</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                            {[
                                                { labelKey: 'instructor.dashboard.accuracy',    value: evaluation.accuracy },
                                                { labelKey: 'instructor.studentDetail.speed',      value: evaluation.speed },
                                                { labelKey: 'instructor.studentDetail.frequency', value: evaluation.frequency },
                                                { labelKey: 'instructor.studentDetail.improvement', value: evaluation.improvement },
                                                { labelKey: 'instructor.studentDetail.memory',   value: evaluation.memory },
                                            ].map((item, i) => (
                                                <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                                                    <div className="text-lg font-bold text-blue-600">{Math.round(item.value || 0)}%</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">{t(item.labelKey)}</div>
                                                    <div className="mt-1.5 h-1 bg-slate-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, item.value || 0)}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {evaluation.strengths?.length > 0 && (
                                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                                    <h4 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2 text-sm"><CheckCircle size={15} className="text-emerald-500" />{t('instructor.studentDetail.strengths')}</h4>
                                                    <ul className="space-y-1">{evaluation.strengths.map((s, i) => <li key={i} className="text-xs text-emerald-700 flex items-start gap-1.5"><span className="text-emerald-400 mt-0.5">•</span>{s}</li>)}</ul>
                                                </div>
                                            )}
                                            {evaluation.weaknesses?.length > 0 && (
                                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                                    <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2 text-sm"><AlertTriangle size={15} className="text-amber-500" />{t('instructor.studentDetail.needsImprovement')}</h4>
                                                    <ul className="space-y-1">{evaluation.weaknesses.map((w, i) => <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5"><span className="text-amber-400 mt-0.5">•</span>{w}</li>)}</ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {!evaluation && <p className="text-slate-400 text-sm text-center py-4">{t('instructor.studentDetail.noEvaluationData')}</p>}
                            </div>
                        )}

                        {/* SUBMISSIONS */}
                        {activeTab === 'submissions' && (
                            <div className="space-y-2">
                                {submissions.length === 0 ? (
                                    <div className="text-center py-10"><BookOpen size={32} className="text-slate-300 mx-auto mb-2" /><p className="text-slate-400 text-sm">{t('instructor.studentDetail.noSubmissions')}</p></div>
                                ) : submissions.map((sub, i) => (
                                    <div key={sub._id || i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-blue-50/40 transition-colors">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${sub.status === 'completed' || sub.status === 'graded' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                                            {sub.status === 'completed' || sub.status === 'graded' ? <CheckCircle size={15} className="text-emerald-600" /> : <Clock size={15} className="text-amber-600" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-800 text-sm truncate">{sub.assignmentId?.title || t('instructor.assignments.assignment')}</p>
                                            <p className="text-xs text-slate-400">{new Date(sub.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}</p>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0 text-sm">
                                            <span className={`font-bold ${(sub.score || 0) >= 80 ? 'text-emerald-600' : (sub.score || 0) >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{sub.score ?? '—'}</span>
                                            <span className="text-blue-600 font-medium">{sub.accuracy?.toFixed(1) ?? '—'}%</span>
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${sub.status === 'completed' || sub.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {sub.status === 'graded' ? t('instructor.studentDetail.graded') : sub.status === 'completed' ? t('instructor.studentDetail.done') : t('instructor.studentDetail.inProgress')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* FEEDBACK */}
                        {activeTab === 'feedback' && (
                            <div className="space-y-3">
                                <button onClick={() => setShowFeedbackModal(true)} className="w-full py-2.5 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                                    <Send size={14} />{t('instructor.studentDetail.sendNewFeedback')}
                                </button>
                                {feedback.length === 0 ? (
                                    <div className="text-center py-8"><MessageSquare size={32} className="text-slate-300 mx-auto mb-2" /><p className="text-slate-400 text-sm">{t('instructor.studentDetail.noFeedback')}</p></div>
                                ) : feedback.map((fb, i) => (
                                    <div key={fb._id || i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-slate-800 text-sm">{fb.title}</h4>
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${fb.type === 'encouragement' ? 'bg-emerald-100 text-emerald-700' : fb.type === 'correction' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {fb.type === 'encouragement' ? t('instructor.studentDetail.encouragement') : fb.type === 'correction' ? t('instructor.studentDetail.correction') : t('instructor.studentDetail.suggestion')}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 text-sm">{fb.content}</p>
                                        <p className="text-xs text-slate-400 mt-2">{new Date(fb.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* BADGES */}
                        {activeTab === 'badges' && (
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <p className="text-sm text-slate-500">
                                        {studentBadges.earned.length} / {studentBadges.total} {lang === 'en' ? 'badges earned' : 'huy hiệu đã đạt'}
                                    </p>
                                </div>
                                {studentBadges.earned.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Award size={32} className="text-slate-300 mx-auto mb-2" />
                                        <p className="text-slate-400 text-sm">{lang === 'en' ? 'No badges yet' : 'Chưa có huy hiệu nào'}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {studentBadges.earned.map((sb) => (
                                            <div key={sb.badge?._id} className="flex flex-col items-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                                                <span className="text-4xl mb-2">{sb.badge?.emoji}</span>
                                                <p className="text-sm font-medium text-center text-orange-800">
                                                    {sb.badge?.name?.[lang] || sb.badge?.name?.vi}
                                                </p>
                                                <p className="text-xs text-orange-500 mt-1">
                                                    {getRarityLabel(sb.badge?.rarity, lang) || sb.badge?.rarity}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Feedback Modal ── */}
            {showFeedbackModal && (() => {
                const TYPES = [
                    { value: 'encouragement', label: t('instructor.studentDetail.encouragement'), icon: Heart,    color: 'text-rose-500',   bg: 'bg-rose-50',   border: 'border-rose-200',   activeBg: 'bg-rose-500',   gradient: 'from-rose-500 to-pink-500' },
                    { value: 'suggestion',    label: t('instructor.studentDetail.suggestion'),    icon: Lightbulb, color: 'text-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-200',  activeBg: 'bg-amber-500',  gradient: 'from-amber-500 to-orange-500' },
                    { value: 'correction',    label: t('instructor.studentDetail.correction'),    icon: AlertTriangle, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', activeBg: 'bg-blue-500', gradient: 'from-blue-500 to-indigo-500' },
                ];
                const PRIORITIES = [
                    { value: 'low',    label: t('instructor.studentDetail.priorityLow'),    dot: 'bg-slate-400' },
                    { value: 'normal', label: t('instructor.studentDetail.priorityNormal'), dot: 'bg-blue-500' },
                    { value: 'high',   label: t('instructor.studentDetail.priorityHigh'),   dot: 'bg-orange-500' },
                    { value: 'urgent', label: t('instructor.studentDetail.priorityUrgent'), dot: 'bg-red-500' },
                ];
                const activeType = TYPES.find(t => t.value === newFeedback.type) || TYPES[0];
                const charLimit = 1000;
                const charCount = newFeedback.content.length;
                const charPct = Math.min((charCount / charLimit) * 100, 100);
                const charColor = charCount > charLimit * 0.9 ? 'text-red-500' : charCount > charLimit * 0.7 ? 'text-amber-500' : 'text-slate-400';

                return (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(8px)' }}
                        onClick={e => { if (e.target === e.currentTarget) { setShowFeedbackModal(false); setFeedbackTab('compose'); } }}
                    >
                        <div className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl bg-white"
                            style={{ border: '1px solid #e2e8f0' }}>

                            {/* Accent top bar */}
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${activeType.gradient}`} />

                            {/* Header */}
                            <div className="px-6 pt-6 pb-4 flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${activeType.gradient} flex items-center justify-center shadow-md`}>
                                        <activeType.icon size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-slate-800 font-bold text-base leading-tight">
                                            {t('instructor.studentDetail.sendFeedback')}
                                        </h2>
                                        <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                                            <User size={10} />
                                            {student?.fullName || student?.username || '—'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setShowFeedbackModal(false); setFeedbackTab('compose'); }}
                                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            {/* Tab bar: Compose / Preview */}
                            <div className="px-6 flex gap-1 mb-4">
                                {[
                                    { key: 'compose', icon: FileText, label: t('instructor.studentDetail.compose') },
                                    { key: 'preview', icon: Eye,      label: t('instructor.studentDetail.preview') },
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setFeedbackTab(tab.key)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            feedbackTab === tab.key
                                                ? 'bg-slate-100 text-slate-800'
                                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <tab.icon size={12} />{tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Body */}
                            <div className="px-6 pb-2">
                                {feedbackTab === 'compose' ? (
                                    <div className="space-y-4">
                                        {/* Type selector — card style */}
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                                                {t('instructor.studentDetail.type')}
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {TYPES.map(tp => (
                                                    <button
                                                        key={tp.value}
                                                        onClick={() => setNewFeedback(p => ({ ...p, type: tp.value }))}
                                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                                                            newFeedback.type === tp.value
                                                                ? `border-transparent bg-gradient-to-br ${tp.gradient} shadow-md scale-[1.03]`
                                                                : `${tp.border} ${tp.bg} hover:scale-[1.01]`
                                                        }`}
                                                    >
                                                        <tp.icon size={18} className={newFeedback.type === tp.value ? 'text-white' : tp.color} />
                                                        <span className={`text-xs font-semibold ${newFeedback.type === tp.value ? 'text-white' : 'text-slate-600'}`}>
                                                            {tp.label}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Priority + Title row */}
                                        <div className="grid grid-cols-5 gap-3">
                                            <div className="col-span-2">
                                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                                    {t('instructor.studentDetail.priority')}
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={newFeedback.priority}
                                                        onChange={e => setNewFeedback(p => ({ ...p, priority: e.target.value }))}
                                                        className="w-full appearance-none px-3 py-2.5 text-sm rounded-xl text-slate-700 bg-slate-50 border border-slate-200 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                                                    >
                                                        {PRIORITIES.map(p => (
                                                            <option key={p.value} value={p.value}>{p.label}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>
                                            <div className="col-span-3">
                                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                                    {t('instructor.studentDetail.titleRequired')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newFeedback.title}
                                                    onChange={e => setNewFeedback(p => ({ ...p, title: e.target.value }))}
                                                    placeholder={t('instructor.studentDetail.enterTitle')}
                                                    maxLength={120}
                                                    className="w-full px-3 py-2.5 text-sm rounded-xl text-slate-800 bg-slate-50 border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    {t('instructor.studentDetail.contentRequired')}
                                                </label>
                                                <span className={`text-xs font-mono ${charColor}`}>{charCount}/{charLimit}</span>
                                            </div>
                                            <textarea
                                                value={newFeedback.content}
                                                onChange={e => setNewFeedback(p => ({ ...p, content: e.target.value.slice(0, charLimit) }))}
                                                rows={5}
                                                placeholder={t('instructor.studentDetail.enterFeedback')}
                                                className="w-full px-4 py-3 text-sm rounded-2xl text-slate-800 bg-slate-50 border border-slate-200 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all leading-relaxed"
                                            />
                                            {/* char progress bar */}
                                            <div className="mt-1.5 h-1 rounded-full bg-slate-100 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all bg-gradient-to-r ${activeType.gradient}`}
                                                    style={{ width: `${charPct}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Preview tab */
                                    <div className="rounded-2xl overflow-hidden border border-slate-200">
                                        {/* Preview header */}
                                        <div className={`bg-gradient-to-r ${activeType.gradient} px-4 py-3 flex items-center gap-2`}>
                                            <activeType.icon size={14} className="text-white" />
                                            <span className="text-white text-xs font-bold uppercase tracking-wider">{activeType.label}</span>
                                            {newFeedback.priority !== 'normal' && (
                                                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/25 text-white">
                                                    {PRIORITIES.find(p => p.value === newFeedback.priority)?.label}
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-4 space-y-2 bg-white">
                                            <p className="text-slate-800 font-semibold text-sm">
                                                {newFeedback.title || <span className="text-slate-400 italic">{t('instructor.studentDetail.enterTitle')}</span>}
                                            </p>
                                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                                                {newFeedback.content || <span className="italic text-slate-400">{t('instructor.studentDetail.enterFeedback')}</span>}
                                            </p>
                                            <div className="pt-2 flex items-center gap-2 border-t border-slate-100 text-xs text-slate-400">
                                                <User size={11} />
                                                <span>{student?.fullName}</span>
                                                <span>•</span>
                                                <span>{new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 mt-3 flex items-center gap-3 border-t border-slate-100">
                                {/* Validation hint */}
                                <div className="flex-1 flex items-center gap-1.5">
                                    {(!newFeedback.title || !newFeedback.content) && (
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Info size={11} />
                                            {t('instructor.studentDetail.fillAllFields')}
                                        </span>
                                    )}
                                    {newFeedback.title && newFeedback.content && (
                                        <span className="text-xs text-emerald-500 flex items-center gap-1 font-medium">
                                            <CheckCircle size={11} />
                                            {t('instructor.studentDetail.readyToSend')}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => { setShowFeedbackModal(false); setFeedbackTab('compose'); }}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={handleSendFeedback}
                                    disabled={!newFeedback.title || !newFeedback.content}
                                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-md ${
                                        newFeedback.title && newFeedback.content
                                            ? `bg-gradient-to-r ${activeType.gradient} hover:scale-[1.02] hover:shadow-lg`
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    <Send size={13} />
                                    {t('instructor.studentDetail.send')}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </InstructorLayout>
    );
};

export default StudentDetail;
