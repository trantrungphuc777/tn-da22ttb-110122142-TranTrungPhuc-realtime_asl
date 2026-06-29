import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Brain, Clock, CheckCircle, AlertCircle,
  ChevronLeft, ChevronRight, Play,
  Users, Calendar, RotateCcw, Infinity, Lock, Target, ClipboardList
} from 'lucide-react';
import Layout from './Layout';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-hot-toast';
import { QUIZ_TOPICS } from '../data/aslQuizData';

const StudentMyExams = () => {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filter, setFilter] = useState('all');

  const paginationRef = useRef({ page: 1, pages: 1, total: 0 });
  const filterRef = useRef('all');
  useEffect(() => { paginationRef.current = pagination; }, [pagination]);
  useEffect(() => { filterRef.current = filter; }, [filter]);

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    fetchExams();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, pagination.page, filter, location.key]);

  const fetchExamsRef = useRef(null);
  useEffect(() => { fetchExamsRef.current = fetchExams; });
  useEffect(() => {
    const handler = () => { if (fetchExamsRef.current) fetchExamsRef.current(); };
    window.addEventListener('examsUpdated', handler);
    return () => window.removeEventListener('examsUpdated', handler);
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: paginationRef.current?.page || 1,
        limit: 10,
        status: filterRef.current || 'all'
      });
      const res = await fetch(`http://localhost:5000/api/student/exams?${params}`, {
        method: 'GET', cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) {
        setExams(result.exams || []);
        setPagination(prev => ({
          page: prev.page,
          total: result.pagination?.total ?? prev.total,
          pages: result.pagination?.pages ?? prev.pages
        }));
      } else {
        toast.error(result.message || t('student.exams.errorLoad'));
      }
    } catch (err) {
      console.error('Fetch exams error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (exam) => {
    if (exam.notStarted)  return {
      bg: 'bg-slate-100', text: 'text-slate-600',
      borderL: 'border-l-slate-400', divider: 'border-slate-200',
      panel: 'border-slate-200 bg-slate-50/60',
      labelKey: 'student.exams.notStarted', icon: Clock
    };
    if (exam.isOverdue)   return {
      bg: 'bg-red-100', text: 'text-red-700',
      borderL: 'border-l-red-400', divider: 'border-red-200',
      panel: 'border-red-200 bg-red-50/60',
      labelKey: 'student.exams.ended', icon: Lock
    };
    if (exam.isCompleted) return {
      bg: 'bg-emerald-100', text: 'text-emerald-700',
      borderL: 'border-l-emerald-400', divider: 'border-emerald-200',
      panel: 'border-emerald-200 bg-emerald-50/60',
      labelKey: 'student.exams.completed', icon: CheckCircle
    };
    if (exam.endDate) {
      const daysLeft = Math.ceil((new Date(exam.endDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 2 && daysLeft >= 0)
        return {
          bg: 'bg-amber-100', text: 'text-amber-700',
          borderL: 'border-l-amber-400', divider: 'border-amber-200',
          panel: 'border-amber-200 bg-amber-50/60',
          labelKey: 'student.exams.daysLeft', daysLeft, icon: Clock
        };
    }
    return {
      bg: 'bg-blue-100', text: 'text-blue-700',
      borderL: 'border-l-blue-500', divider: 'border-blue-200',
      panel: 'border-blue-200 bg-blue-50/40',
      labelKey: 'student.exams.available', icon: Brain
    };
  };

  const getTypeBadge = (type) => {
    const map = {
      letter:        { labelKey: 'student.exams.letter',        color: 'text-sky-700',    bg: 'bg-sky-50 border border-sky-200' },
      word:          { labelKey: 'student.exams.word',          color: 'text-teal-700',   bg: 'bg-teal-50 border border-teal-200' },
      sentence:      { labelKey: 'student.exams.sentence',      color: 'text-indigo-700', bg: 'bg-indigo-50 border border-indigo-200' },
      comprehensive: { labelKey: 'student.exams.comprehensive', color: 'text-slate-700',  bg: 'bg-slate-100 border border-slate-200' }
    };
    return map[type] || map.letter;
  };

  const getPracticeTypeBadge = (pt) => {
    if (pt === 'realtime')      return { label: lang === 'vi' ? 'Nhận diện realtime' : 'Realtime',      bg: 'bg-orange-50 border border-orange-200',  color: 'text-orange-700' };
    if (pt === 'comprehensive') return { label: lang === 'vi' ? 'Tổng hợp đa kỹ năng' : 'Multi-skill', bg: 'bg-cyan-50 border border-cyan-200',       color: 'text-cyan-700' };
    return { label: lang === 'vi' ? 'Trắc nghiệm' : 'Quiz', bg: 'bg-slate-100 border border-slate-200', color: 'text-slate-600' };
  };

  const getTopicLabel = (topic) => {
    if (!topic) return null;
    const found = QUIZ_TOPICS.find(t => t.key === topic);
    if (!found) return topic;
    return `${found.icon} ${lang === 'vi' ? found.viName : found.enName}`;
  };

  const pendingCount   = exams.filter(e => !e.isCompleted && !e.isOverdue && !e.notStarted).length;
  const completedCount = exams.filter(e => e.isCompleted).length;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6 pt-2 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <ClipboardList size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-blue-900">{t('student.exams.title')}</h1>
            <p className="text-blue-600/70 text-sm mt-0.5">{t('student.exams.subtitle')}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { icon: ClipboardList, bg: 'bg-blue-100',    iconColor: 'text-blue-600',    val: pagination.total,                          labelKey: 'student.exams.totalExams', textColor: 'text-blue-900',    subColor: 'text-blue-600/70' },
            { icon: Clock,         bg: 'bg-amber-100',   iconColor: 'text-amber-600',   val: pendingCount,                              labelKey: 'student.exams.pending',    textColor: 'text-amber-900',   subColor: 'text-amber-600/70' },
            { icon: CheckCircle,   bg: 'bg-emerald-100', iconColor: 'text-emerald-600', val: completedCount,                            labelKey: 'student.exams.completed',  textColor: 'text-emerald-900', subColor: 'text-emerald-600/70' },
            { icon: AlertCircle,   bg: 'bg-red-100',     iconColor: 'text-red-500',     val: exams.filter(e => e.isOverdue).length,     labelKey: 'student.exams.ended',      textColor: 'text-red-900',     subColor: 'text-red-600/70' }
          ].map(({ icon: Icon, bg, iconColor, val, labelKey, textColor, subColor }) => (
            <div key={labelKey} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-200/40 p-4 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon size={20} className={iconColor} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${textColor}`}>{val}</p>
                  <p className={`text-xs ${subColor}`}>{t(labelKey)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-200/40 p-4 mb-6 shadow-md">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all',       labelKey: 'student.exams.filterAll', active: 'bg-blue-500' },
              { key: 'pending',   labelKey: 'student.exams.notDone',   active: 'bg-amber-500' },
              { key: 'completed', labelKey: 'student.exams.completed', active: 'bg-emerald-500' }
            ].map(({ key, labelKey, active }) => (
              <button key={key}
                onClick={() => { setFilter(key); setPagination(prev => ({ ...prev, page: 1 })); }}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filter === key ? `${active} text-white shadow-md` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Exam list */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-200/40 p-12 shadow-md text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
              <p className="text-blue-600/70 mt-4 text-sm">{t('common.loading')}</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-blue-200/40 p-12 shadow-md text-center">
              <ClipboardList size={48} className="mx-auto text-blue-300 mb-4" />
              <p className="text-xl font-semibold text-blue-900">{t('student.exams.noExams')}</p>
              <p className="text-blue-600/70 mt-2 text-sm">{t('student.exams.noExamsSubtitle')}</p>
            </div>
          ) : (
            exams.map((exam) => {
              const status     = getStatusInfo(exam);
              const StatusIcon = status.icon;
              const typeBadge  = getTypeBadge(exam.type);
              const ptBadge    = getPracticeTypeBadge(exam.practiceType);
              const topicLabel = getTopicLabel(exam.topic);

              return (
                <div key={exam._id}
                  className={`bg-white rounded-2xl border-l-4 shadow-sm hover:shadow-lg transition-all overflow-hidden ${status.borderL} ${
                    exam.isCompleted ? 'border border-emerald-100' :
                    exam.isOverdue   ? 'border border-red-100'     :
                    exam.notStarted  ? 'border border-slate-200'   :
                    'border border-blue-100'
                  }`}>
                  <div className="flex items-stretch">

                    {/* Main content */}
                    <div className="flex-1 p-5">
                      {/* Title + badges */}
                      <div className={`flex items-center gap-2 flex-wrap pb-3 mb-3 border-b ${status.divider}`}>
                        <h3 className="text-sm font-bold text-slate-800">{exam.title}</h3>
                        {exam.practiceType !== 'comprehensive' && (
                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${typeBadge.bg} ${typeBadge.color}`}>
                            {t(typeBadge.labelKey)}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${ptBadge.bg} ${ptBadge.color}`}>
                          {ptBadge.label}
                        </span>
                        {topicLabel && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-teal-50 border border-teal-200 text-teal-700">
                            {topicLabel}
                          </span>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-slate-400 mb-3 flex-wrap">
                        {exam.instructorId?.fullName && (
                          <span className="flex items-center gap-1"><Users size={11} />{exam.instructorId.fullName}</span>
                        )}
                        {exam.settings?.duration && (
                          <span className="flex items-center gap-1"><Clock size={11} />{exam.settings.duration} {t('student.exams.minutes')}</span>
                        )}
                        {exam.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />{t('student.exams.startDate')} {new Date(exam.startDate).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                          </span>
                        )}
                        {exam.endDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />{t('student.exams.endDate')} {new Date(exam.endDate).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                          </span>
                        )}
                      </div>

                      {/* Stat chips */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {exam.settings?.passingScore != null && (
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            exam.isCompleted ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            <Target size={11} />
                            <span>{lang === 'vi' ? 'Điểm đạt' : 'Pass'}</span>
                            <span className="font-bold">{exam.settings.passingScore}%</span>
                          </div>
                        )}
                        {exam.bestScore !== null && exam.bestScore !== undefined && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">
                            <CheckCircle size={11} />
                            <span>{t('student.exams.bestScore')}</span>
                            <span className="font-bold">{exam.bestScore}%</span>
                          </div>
                        )}
                        {exam.maxAttempts !== null && exam.maxAttempts !== undefined ? (
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            exam.remainingAttempts === 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            <RotateCcw size={11} />
                            {exam.remainingAttempts === 0
                              ? <span>{t('student.exams.noAttemptsLeft')}</span>
                              : <span>{exam.attemptCount}/{exam.maxAttempts} {t('student.exams.attemptsLeft')}</span>
                            }
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-50 text-cyan-700">
                            <Infinity size={11} />
                            <span>{lang === 'vi' ? 'Không giới hạn lượt' : 'Unlimited'}</span>
                            {exam.attemptCount > 0 && (
                              <span className="text-cyan-500 font-normal">({exam.attemptCount} {t('student.exams.times')})</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right panel */}
                    <div className={`flex flex-col items-center justify-center gap-2 px-4 min-w-[130px] border-l ${status.panel}`}>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${status.bg} ${status.text}`}>
                        <StatusIcon size={11} />
                        {status.daysLeft !== undefined
                          ? t('student.exams.daysLeft', { days: status.daysLeft })
                          : t(status.labelKey)
                        }
                      </span>

                      {exam.canSubmit && (
                        <button onClick={() => navigate(`/student/exams/${exam._id}`)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all hover:shadow-md ${
                            exam.isCompleted
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}>
                          <Play size={12} />
                          {exam.isCompleted ? t('student.exams.retry') : t('student.exams.start')}
                        </button>
                      )}
                      {!exam.canSubmit && exam.remainingAttempts === 0 && !exam.isOverdue && !exam.notStarted && (
                        <span className="px-3 py-1.5 text-xs bg-gray-100 text-gray-400 font-medium rounded-lg flex items-center gap-1.5">
                          <AlertCircle size={12} />{t('student.exams.noAttemptsLeft')}
                        </span>
                      )}
                      {exam.isOverdue && (
                        <span className="px-3 py-1.5 text-xs bg-red-50 text-red-400 font-medium rounded-lg flex items-center gap-1.5">
                          <Lock size={12} />{t('student.exams.ended')}
                        </span>
                      )}
                      {exam.notStarted && !exam.isOverdue && (
                        <span className="px-3 py-1.5 text-xs bg-slate-100 text-slate-500 font-medium rounded-lg flex items-center gap-1.5">
                          <Clock size={12} />{t('student.exams.notStarted')}
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
            <p className="text-sm text-blue-700">{t('common.page')} {pagination.page} / {pagination.pages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50">
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium text-sm">{pagination.page}</span>
              <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default StudentMyExams;
