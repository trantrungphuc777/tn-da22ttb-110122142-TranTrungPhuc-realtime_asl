import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Play,
    BookOpen,
    Users,
    Calendar,
    RotateCcw,
    Infinity,
    Target
} from 'lucide-react';
import Layout from './Layout';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-hot-toast';
import { QUIZ_TOPICS } from '../data/aslQuizData';

const StudentMyAssignments = () => {
    const { lang, t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [filter, setFilter] = useState('all');
    // Stable refs to avoid stale closures in event listeners
    const paginationRef = useRef({ page: 1, pages: 1, total: 0 });
    const filterRef = useRef('all');

    useEffect(() => { paginationRef.current = pagination; }, [pagination]);
    useEffect(() => { filterRef.current = filter; }, [filter]);

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
            return;
        }
        fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate, pagination.page, filter, location.key]);

    // Listen for global updates (e.g. after submitting an assignment)
    // Use a stable ref so the handler always calls the latest fetchAssignments
    const fetchAssignmentsRef = useRef(null);
    useEffect(() => {
        fetchAssignmentsRef.current = fetchAssignments;
    });
    useEffect(() => {
        const handler = () => {
            if (fetchAssignmentsRef.current) fetchAssignmentsRef.current();
        };
        window.addEventListener('assignmentsUpdated', handler);
        return () => window.removeEventListener('assignmentsUpdated', handler);
    }, []);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const currentPage = paginationRef.current?.page || 1;
            const currentFilter = filterRef.current || 'all';
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                status: currentFilter
            });
            const response = await fetch(`http://localhost:5000/api/student/assignments?${params}`, {
                method: 'GET',
                cache: 'no-store',
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.ok) {
                setAssignments(result.assignments || []);
                // Preserve current page — only update total/pages from server
                setPagination(prev => ({
                    page: prev.page,
                    total: result.pagination?.total ?? prev.total,
                    pages: result.pagination?.pages ?? prev.pages,
                }));
            } else {
                toast.error(result.message || t('studentAssignments.loadError'));
            }
        } catch (error) {
            console.error('Fetch assignments error:', error);
            toast.error(t('studentAssignments.serverError'));
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (assignment) => {
        if (assignment.isCompleted) {
            return {
                bg: 'bg-emerald-100',
                text: 'text-emerald-700',
                label: t('studentAssignments.completed'),
                icon: CheckCircle
            };
        }
        // Đã làm nhưng không lần nào đủ điểm (hết lượt hoặc hết hạn)
        if (assignment.isFailed) {
            return {
                bg: 'bg-orange-100',
                text: 'text-orange-700',
                label: t('studentAssignments.failed') || 'Chưa đạt',
                icon: AlertCircle
            };
        }
        if (assignment.isOverdue) {
            return {
                bg: 'bg-red-100',
                text: 'text-red-700',
                label: t('studentAssignments.overdue'),
                icon: AlertCircle
            };
        }
        if (assignment.dueDate) {
            const daysLeft = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 2 && daysLeft >= 0) {
                return {
                    bg: 'bg-amber-100',
                    text: 'text-amber-700',
                    label: t('studentAssignments.daysLeft', { days: daysLeft }),
                    icon: Clock
                };
            }
        }
        return {
            bg: 'bg-blue-100',
            text: 'text-blue-700',
            label: t('studentAssignments.pending'),
            icon: FileText
        };
    };

    const getTypeBadge = (type) => {
        const types = {
            letter: { label: t('practicePage.letterMode'), color: 'text-blue-600' },
            word: { label: t('practicePage.wordMode'), color: 'text-emerald-600' },
            sentence: { label: t('practicePage.sentenceMode'), color: 'text-purple-600' },
            comprehensive: { label: t('practicePage.letterMode'), color: 'text-amber-600' }
        };
        return types[type] || types.letter;
    };

    const getPracticeTypeBadge = (practiceType) => {
        if (practiceType === 'realtime') {
            return { label: lang === 'vi' ? 'Nhận diện realtime' : 'Realtime', color: 'text-rose-500' };
        }
        return { label: lang === 'vi' ? 'Trắc nghiệm' : 'Quiz', color: 'text-indigo-500' };
    };

    const getTopicLabel = (topic) => {
        if (!topic) return null;
        const found = QUIZ_TOPICS.find(t => t.key === topic);
        if (!found) return topic;
        return `${found.icon} ${lang === 'vi' ? found.viName : found.enName}`;
    };

    const handleStartAssignment = (assignment) => {
        navigate(`/student/assignments/${assignment._id}`);
    };

    const pendingCount = assignments.filter(a => !a.isCompleted && !a.isOverdue && !a.isFailed).length;
    const completedCount = assignments.filter(a => a.isCompleted).length;

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6 pt-2">
                    <h1 className="text-3xl font-extrabold text-blue-900">
                        {t('studentAssignments.title')}
                    </h1>
                    <p className="text-blue-600/70 mt-1">
                        {t('studentAssignments.subtitle')}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-200/40 p-4 shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                <FileText size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-blue-900">{pagination.total}</p>
                                <p className="text-xs text-blue-600/70">{t('studentAssignments.total')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-200/40 p-4 shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Clock size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-amber-900">{pendingCount}</p>
                                <p className="text-xs text-amber-600/70">{t('studentAssignments.pending')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-200/40 p-4 shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <CheckCircle size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-emerald-900">{completedCount}</p>
                                <p className="text-xs text-emerald-600/70">{t('studentAssignments.completed')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-200/40 p-4 shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                <AlertCircle size={20} className="text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-900">
                                    {assignments.filter(a => a.isOverdue).length}
                                </p>
                                <p className="text-xs text-red-600/70">{t('studentAssignments.overdue')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-200/40 p-4 mb-6 shadow-md">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => { setFilter('all'); setPagination(prev => ({ ...prev, page: 1 })); }}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${
                                filter === 'all'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {t('studentAssignments.all')}
                        </button>
                        <button
                            onClick={() => { setFilter('pending'); setPagination(prev => ({ ...prev, page: 1 })); }}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${
                                filter === 'pending'
                                    ? 'bg-amber-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {t('studentAssignments.pending')}
                        </button>
                        <button
                            onClick={() => { setFilter('completed'); setPagination(prev => ({ ...prev, page: 1 })); }}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${
                                filter === 'completed'
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {t('studentAssignments.completed')}
                        </button>
                    </div>
                </div>

                {/* Assignments List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-200/40 p-12 shadow-md text-center">
                            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                            <p className="text-blue-600/70 mt-4">{t('studentAssignments.loading')}</p>
                        </div>
                    ) : assignments.length === 0 ? (
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-200/40 p-12 shadow-md text-center">
                            <FileText size={48} className="mx-auto text-blue-300 mb-4" />
                            <p className="text-xl font-semibold text-blue-900">
                                {t('studentAssignments.noAssignments')}
                            </p>
                            <p className="text-blue-600/70 mt-2">
                                {t('studentAssignments.noAssignmentsDesc')}
                            </p>
                        </div>
                    ) : (
                        assignments.map((assignment) => {
                            const status = getStatusBadge(assignment);
                            const StatusIcon = status.icon;
                            const typeBadge = getTypeBadge(assignment.type);
                            const practiceTypeBadge = getPracticeTypeBadge(assignment.practiceType);
                            const topicLabel = getTopicLabel(assignment.topic);

                            return (
                                <div
                                    key={assignment._id}
                                    className={`bg-white rounded-2xl border-l-4 shadow-sm hover:shadow-md transition-all overflow-hidden ${
                                        assignment.isCompleted
                                            ? 'border-l-emerald-400 border border-emerald-100'
                                            : assignment.isFailed
                                                ? 'border-l-orange-400 border border-orange-100'
                                                : assignment.isOverdue
                                                    ? 'border-l-red-400 border border-red-100'
                                                    : 'border-l-blue-400 border border-blue-100'
                                    }`}
                                >
                                    <div className="flex items-stretch">
                                        {/* Main content */}
                                        <div className="flex-1 p-5">
                                            {/* Top section: title + type badges */}
                                            <div className={`flex items-center gap-2 flex-wrap pb-3 mb-3 border-b ${
                                                assignment.isCompleted ? 'border-emerald-200' :
                                                assignment.isFailed   ? 'border-orange-200' :
                                                assignment.isOverdue  ? 'border-red-200'    :
                                                'border-blue-200'
                                            }`}>
                                                <h3 className="text-sm font-bold text-slate-800">{assignment.title}</h3>
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 ${typeBadge.color}`}>
                                                    {typeBadge.label}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                                                    assignment.practiceType === 'realtime'
                                                        ? 'bg-rose-50 text-rose-600'
                                                        : 'bg-indigo-50 text-indigo-600'
                                                }`}>
                                                    {practiceTypeBadge.label}
                                                </span>
                                                {topicLabel && (
                                                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-violet-50 text-violet-600">
                                                        {topicLabel}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Bottom section: meta + stats */}
                                            <div className="flex items-center gap-3 text-xs text-slate-400 mb-3 flex-wrap">
                                                {assignment.instructorId?.fullName && (
                                                    <span className="flex items-center gap-1">
                                                        <Users size={11} />
                                                        {assignment.instructorId.fullName}
                                                    </span>
                                                )}
                                                {assignment.dueDate && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={11} />
                                                        {t('studentAssignments.due')} {new Date(assignment.dueDate).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Stats row: 3 info boxes */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {/* Điểm đạt */}
                                                {assignment.settings?.passingScore != null && (
                                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                                        assignment.isCompleted
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                        <Target size={11} />
                                                        <span>{lang === 'vi' ? 'Điểm đạt' : 'Pass'}</span>
                                                        <span className="font-bold">{assignment.settings.passingScore}%</span>
                                                    </div>
                                                )}

                                                {/* Điểm cao nhất */}
                                                {assignment.bestScore !== null && assignment.bestScore !== undefined ? (
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">
                                                        <CheckCircle size={11} />
                                                        <span>{t('studentAssignments.bestScore')}</span>
                                                        <span className="font-bold">{assignment.bestScore}%</span>
                                                    </div>
                                                ) : assignment.submission ? (
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-500">
                                                        <CheckCircle size={11} />
                                                        <span>{t('studentAssignments.score')}</span>
                                                        <span className="font-bold">{assignment.submission.score || 0}%</span>
                                                    </div>
                                                ) : null}

                                                {/* Số lượt */}
                                                {assignment.maxAttempts !== null && assignment.maxAttempts !== undefined ? (
                                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                                        assignment.remainingAttempts === 0
                                                            ? 'bg-red-50 text-red-600'
                                                            : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                        <RotateCcw size={11} />
                                                        {assignment.remainingAttempts === 0
                                                            ? <span>{t('studentAssignments.noAttemptsLeft')}</span>
                                                            : <span>{assignment.attemptCount}/{assignment.maxAttempts} {t('studentAssignments.attemptsLeft')}</span>
                                                        }
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-50 text-cyan-700">
                                                        <Infinity size={11} />
                                                        <span>{t('studentAssignments.unlimited')}</span>
                                                        {assignment.attemptCount > 0 && (
                                                            <span className="text-cyan-500 font-normal">({assignment.attemptCount} {t('studentAssignments.times')})</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right panel: status + action */}
                                        <div className={`flex flex-col items-center justify-center gap-2 px-4 min-w-[120px] border-l ${
                                            assignment.isCompleted ? 'border-emerald-100 bg-emerald-50/40' :
                                            assignment.isFailed ? 'border-orange-100 bg-orange-50/40' :
                                            assignment.isOverdue ? 'border-red-100 bg-red-50/40' :
                                            'border-blue-100 bg-blue-50/20'
                                        }`}>
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${status.bg} ${status.text}`}>
                                                <StatusIcon size={11} />
                                                {status.label}
                                            </span>
                                            {assignment.canSubmit && (
                                                <button
                                                    onClick={() => handleStartAssignment(assignment)}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all hover:shadow-md ${
                                                        assignment.isCompleted
                                                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                                    }`}
                                                >
                                                    <Play size={12} />
                                                    {assignment.isCompleted
                                                        ? t('studentAssignments.retry')
                                                        : t('studentAssignments.start')
                                                    }
                                                </button>
                                            )}
                                            {!assignment.canSubmit && assignment.remainingAttempts === 0 && !assignment.isOverdue && (
                                                <span className="px-3 py-1.5 text-xs bg-gray-100 text-gray-400 font-medium rounded-lg flex items-center gap-1.5">
                                                    <AlertCircle size={12} />
                                                    {t('studentAssignments.noAttemptsLeft')}
                                                </span>
                                            )}
                                            {assignment.isOverdue && !assignment.canSubmit && (
                                                <span className="px-3 py-1.5 text-xs bg-red-50 text-red-400 font-medium rounded-lg flex items-center gap-1.5">
                                                    <AlertCircle size={12} />
                                                    {t('studentAssignments.overdue')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="mt-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-200/40 p-4 shadow-md flex items-center justify-between">
                        <p className="text-sm text-blue-700">
                            {t('common.page')} {pagination.page} / {pagination.pages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">
                                {pagination.page}
                            </span>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.pages}
                                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default StudentMyAssignments;
