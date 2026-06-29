import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Send, ChevronLeft, ChevronRight, Users, Brain, Search } from 'lucide-react';
import InstructorLayout from './InstructorLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-hot-toast';
import { VOCABULARY_BY_TOPIC, SENTENCES_BY_TOPIC, QUIZ_TOPICS } from '../data/aslQuizData';

const DEFAULT_EXAM_CONFIG = { letterCount: 4, shortWordCount: 3, longWordCount: 3, complexCount: 3, quizCount: 4, chainCount: 3 };

const InstructorExamManagement = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ status: '', type: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [publishNow, setPublishNow] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [formData, setFormData] = useState({
    title: '', description: '',
    type: 'letter', practiceType: 'recognition',
    mode: 'random', topic: '',
    examConfig: { ...DEFAULT_EXAM_CONFIG },
    settings: { questionCount: 10, maxAttempts: 1, passingScore: 70, duration: 30 },
    startDate: '', endDate: '',
    assignedTo: []
  });

  const totalConfigQuestions = Object.values(formData.examConfig).reduce((s, v) => s + (parseInt(v) || 0), 0);
  const isComprehensive = formData.practiceType === 'comprehensive';

  // Chế độ câu hỏi: letter không có chủ đề, comprehensive chỉ có random + mixed_topic
  const showQuestionMode = formData.type !== 'letter';
  const availableModes = isComprehensive
    ? [
        { value: 'random', labelKey: 'instructor.exams.modeRandom' },
        { value: 'mixed_topic', labelKey: 'instructor.exams.modeMixedTopic' }
      ]
    : [
        { value: 'random', labelKey: 'instructor.exams.modeRandom' },
        { value: 'topic', labelKey: 'instructor.exams.modeTopic' }
      ];
  const showTopicSelect = (formData.mode === 'topic' || formData.mode === 'mixed_topic') && showQuestionMode;

  // Lấy danh sách topic theo loại bài — luôn dùng QUIZ_TOPICS làm nguồn để có đủ icon/tên
  const getAvailableTopics = () => {
    // Lọc ra các topic có data thực tế (vocab hoặc sentence tùy loại bài)
    if (formData.type === 'sentence') {
      return QUIZ_TOPICS.filter(topic => {
        const k = topic.key;
        return SENTENCES_BY_TOPIC[k] || SENTENCES_BY_TOPIC[k + 's'] ||
               (k.endsWith('s') && SENTENCES_BY_TOPIC[k.slice(0, -1)]);
      });
    }
    if (formData.type === 'comprehensive') {
      return QUIZ_TOPICS; // comprehensive dùng tất cả
    }
    // word / letter → dùng vocab topics
    return QUIZ_TOPICS.filter(topic => {
      const k = topic.key;
      return VOCABULARY_BY_TOPIC[k] || VOCABULARY_BY_TOPIC[k + 's'] ||
             (k.endsWith('s') && VOCABULARY_BY_TOPIC[k.slice(0, -1)]);
    });
  };

  const hasFetched = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    if (user.role !== 'instructor' && user.role !== 'admin') { navigate('/dashboard'); return; }
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchExams(true);
    fetchStudents();
  }, []);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    fetchExams(false);
  }, [pagination.page, filters]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/instructor/students?limit=100', { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (res.ok) setStudents(result.students || []);
    } catch (e) { console.error('Fetch students error:', e); }
  };

  const fetchExams = async (silent = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: pagination.page, limit: 10, ...filters });
      const res = await fetch(`http://localhost:5000/api/instructor/exams?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (res.ok) { setExams(result.exams || []); setPagination(result.pagination || {}); }
      else if (!silent) toast.error(result.message || t('instructor.exams.failedToLoad'));
    } catch (e) {
      if (!silent) toast.error(t('instructor.exams.serverError'));
    } finally { setLoading(false); }
  };

  const resetForm = () => {
    setFormData({
      title: '', description: '',
      type: 'letter', practiceType: 'recognition',
      mode: 'random', topic: '',
      examConfig: { ...DEFAULT_EXAM_CONFIG },
      settings: { questionCount: 10, maxAttempts: 1, passingScore: 70, duration: 30 },
      startDate: '', endDate: '', assignedTo: []
    });
    setEditingExam(null);
    setPublishNow(false);
  };

  const openEditModal = (exam) => {
    resetForm();
    setEditingExam(exam);
    const assignedIds = (exam.assignedTo || []).map(a => typeof a === 'object' ? (a._id || a).toString() : a.toString());
    setFormData({
      title: exam.title || '',
      description: exam.description || '',
      type: exam.type || 'letter',
      practiceType: exam.practiceType || 'recognition',
      mode: exam.mode || 'random',
      topic: exam.topic || '',
      examConfig: exam.examConfig ? { ...DEFAULT_EXAM_CONFIG, ...exam.examConfig } : { ...DEFAULT_EXAM_CONFIG },
      settings: {
        questionCount: exam.settings?.questionCount || 10,
        maxAttempts: exam.settings?.maxAttempts || 1,
        passingScore: exam.settings?.passingScore || 70,
        duration: exam.settings?.duration || 30
      },
      startDate: exam.startDate ? new Date(exam.startDate).toISOString().split('T')[0] : '',
      endDate: exam.endDate ? new Date(exam.endDate).toISOString().split('T')[0] : '',
      assignedTo: assignedIds
    });
    setShowModal(true);
  };

  const handleTypeChange = (newType) => {
    const newPracticeType = newType === 'comprehensive' ? 'comprehensive' : (formData.practiceType === 'comprehensive' ? 'recognition' : formData.practiceType);
    // Reset mode: nếu đổi sang comprehensive thì chỉ cho random/mixed_topic; nếu đổi sang letter thì reset về random
    const currentMode = formData.mode;
    let newMode = currentMode;
    if (newType === 'letter') {
      newMode = 'random';
    } else if (newType === 'comprehensive') {
      // mixed_topic ok, topic không hợp lệ cho comprehensive → reset về random
      if (currentMode === 'topic') newMode = 'random';
    } else {
      // word/sentence: mixed_topic không hợp lệ → reset về random
      if (currentMode === 'mixed_topic') newMode = 'random';
    }
    setFormData(prev => ({ ...prev, type: newType, practiceType: newPracticeType, mode: newMode, topic: '' }));
  };

  const handleStudentToggle = (sid) => {
    setFormData(prev => {
      const ids = (prev.assignedTo || []).map(id => id.toString());
      const s = sid.toString();
      return { ...prev, assignedTo: ids.includes(s) ? ids.filter(id => id !== s) : [...ids, s] };
    });
  };

  const handleSelectAll = () => {
    setFormData(prev => {
      const allIds = students.map(s => s._id.toString());
      const allSelected = allIds.every(id => (prev.assignedTo || []).map(a => a.toString()).includes(id));
      return { ...prev, assignedTo: allSelected ? [] : allIds };
    });
  };

  const hasStudent = (sid) => (formData.assignedTo || []).map(id => id.toString()).includes(sid.toString());

  const handleSave = async () => {
    if (!formData.title.trim()) { toast.error(t('instructor.exams.enterTitle')); return; }
    if (isComprehensive && (totalConfigQuestions < 5 || totalConfigQuestions > 50)) {
      toast.error(t('instructor.exams.totalQuestionsRange')); return;
    }
    if (showTopicSelect && !formData.topic) {
      toast.error(t('instructor.exams.selectTopicToContinue')); return;
    }
    try {
      const token = localStorage.getItem('token');
      const url = editingExam
        ? `http://localhost:5000/api/instructor/exams/${editingExam._id}`
        : 'http://localhost:5000/api/instructor/exams';
      const res = await fetch(url, {
        method: editingExam ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, startDate: formData.startDate || null, endDate: formData.endDate || null })
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(editingExam ? t('instructor.exams.updateSuccess') : t('instructor.exams.createSuccess'));
        if (publishNow && result.exam?._id) await handlePublish(result.exam._id, true);
        setShowModal(false); resetForm(); fetchExams();
      } else { toast.error(result.message); }
    } catch (e) { toast.error(t('instructor.exams.saveError')); }
  };

  const handlePublish = async (id, silent = false) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/instructor/exams/${id}/publish`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (res.ok) { if (!silent) { toast.success(t('instructor.exams.publishSuccess')); fetchExams(); } }
      else toast.error(result.message);
    } catch (e) { toast.error(t('instructor.exams.publishError')); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('instructor.exams.deleteConfirm'))) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/instructor/exams/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (res.ok) { toast.success(t('instructor.exams.deleteSuccess')); fetchExams(); }
      else toast.error(result.message);
    } catch (e) { toast.error(t('instructor.exams.deleteError')); }
  };

  const getStatusBadge = (status) => {
    const map = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: t('instructor.exams.draft') },
      published: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: t('instructor.exams.published') },
      closed: { bg: 'bg-red-100', text: 'text-red-700', label: t('instructor.exams.closed') }
    };
    const b = map[status] || map.draft;
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${b.bg} ${b.text}`}>{b.label}</span>;
  };

  const getTypeLabel = (type) => ({ letter: t('instructor.exams.letter'), word: t('instructor.exams.word'), sentence: t('instructor.exams.sentence'), comprehensive: t('instructor.exams.comprehensive') }[type] || type);
  const getPracticeLabel = (pt) => ({ recognition: t('instructor.exams.recognition'), realtime: t('instructor.exams.realtime'), comprehensive: t('instructor.exams.multiSkill') }[pt] || pt);

  return (
    <InstructorLayout>
      <div className="max-w-7xl mx-auto space-y-4 pb-6">
        {/* ── Hero Header ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 p-5 shadow-xl">
          <div className="absolute inset-0 particle-grid opacity-20 pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-400/20 rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-violet-300/15 rounded-full blur-[50px] pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <Brain size={16} className="text-white" />
                </div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">{t('instructor.exams.title')}</h1>
              </div>
              <p className="text-purple-100 text-sm">{t('instructor.exams.subtitle')}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { label: t('instructor.exams.totalExams'), val: exams.length },
                  { label: t('instructor.exams.published'), val: exams.filter(e => e.status === 'published').length },
                  { label: t('instructor.exams.draft'), val: exams.filter(e => e.status === 'draft').length },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs text-white font-medium">
                    <span>{p.label}:</span><span className="font-bold">{p.val}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-white text-purple-700 text-sm font-bold rounded-xl hover:bg-purple-50 transition-all shadow-lg flex-shrink-0">
              <Plus size={16} />{t('instructor.exams.createNew')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: t('instructor.exams.totalExams'), value: exams.length, icon: Brain, color: 'bg-purple-500' },
            { label: t('instructor.exams.published'), value: exams.filter(e => e.status === 'published').length, icon: Send, color: 'bg-blue-500' },
            { label: t('instructor.exams.draft'), value: exams.filter(e => e.status === 'draft').length, icon: Edit, color: 'bg-amber-500' },
            { label: t('instructor.exams.closed'), value: exams.filter(e => e.status === 'closed').length, icon: Users, color: 'bg-slate-500' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}><Icon size={16} className="text-white" /></div>
                <div><p className="text-xs text-slate-500 font-medium">{s.label}</p><p className="text-xl font-bold text-slate-800">{s.value}</p></div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder={t('instructor.exams.searchExams')} value={filters.search || ''}
                onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
            <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))} className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400">
              <option value="">{t('instructor.exams.allStatusesOption')}</option>
              <option value="draft">{t('instructor.exams.draft')}</option>
              <option value="published">{t('instructor.exams.published')}</option>
              <option value="closed">{t('instructor.exams.closed')}</option>
            </select>
            <select value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value }))} className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400">
              <option value="">{t('instructor.exams.allTypesOption')}</option>
              <option value="letter">{t('instructor.exams.letter')}</option>
              <option value="word">{t('instructor.exams.word')}</option>
              <option value="sentence">{t('instructor.exams.sentence')}</option>
              <option value="comprehensive">{t('instructor.exams.comprehensive')}</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                  {[t('instructor.exams.exam'), t('instructor.exams.typeMode'), t('instructor.exams.status'), t('instructor.exams.progress'), t('instructor.exams.period'), t('instructor.exams.actions')].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-purple-800 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="6" className="px-4 py-8 text-center"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" /></td></tr>
                ) : exams.length === 0 ? (
                  <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400">{t('instructor.exams.noExam')}</td></tr>
                ) : exams.map(exam => {
                  const done = exam.submissionStats?.completed || 0;
                  const total = exam.submissionStats?.total || 0;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  const endDays = exam.endDate ? Math.ceil((new Date(exam.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                  return (
                    <tr key={exam._id} className="hover:bg-purple-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{exam.title}</p>
                        <p className="text-xs text-slate-400 line-clamp-1">{exam.description || t('instructor.exams.noDescription')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 block w-fit mb-1">{getTypeLabel(exam.type)}</span>
                        <span className="text-xs text-slate-500">{getPracticeLabel(exam.practiceType)}</span>
                        {exam.topic && (
                          <span className="mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-violet-100 text-violet-700 block w-fit">
                            {exam.topic}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(exam.status)}</td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-600 font-medium">{done}/{total}</span>
                          <span className={`font-bold ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-slate-400'}`}>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-purple-300'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {exam.startDate && <div className="text-slate-500">{t('instructor.exams.start')} {new Date(exam.startDate).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}</div>}
                        {exam.endDate && (
                          <div>
                            <span className="text-slate-500">{t('instructor.exams.end')} {new Date(exam.endDate).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}</span>
                            {endDays !== null && (
                              <p className={`font-semibold mt-0.5 ${endDays < 0 ? 'text-red-500' : endDays <= 3 ? 'text-amber-500' : 'text-emerald-600'}`}>
                                {endDays < 0 ? t('instructor.exams.ended') : endDays === 0 ? t('instructor.exams.today') : t('instructor.exams.daysLeft', { n: endDays })}
                              </p>
                            )}
                          </div>
                        )}
                        {!exam.startDate && !exam.endDate && <span className="text-slate-400">{t('instructor.exams.noLimit')}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {exam.status === 'draft' && (
                            <button onClick={() => handlePublish(exam._id)} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" title={t('instructor.exams.publish')}><Send size={15} /></button>
                          )}
                          <button onClick={() => openEditModal(exam)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title={t('instructor.exams.edit')}><Edit size={15} /></button>
                          <button onClick={() => handleDelete(exam._id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title={t('instructor.exams.delete')}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pagination.pages > 1 && (
            <div className="px-4 py-3 border-t border-purple-100 flex items-center justify-between">
              <p className="text-sm text-purple-700">{t('instructor.exams.page')} {pagination.page} / {pagination.pages}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1} className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"><ChevronLeft size={18} /></button>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg font-medium">{pagination.page}</span>
                <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.pages} className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"><ChevronRight size={18} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal tạo/sửa */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-purple-900">{editingExam ? t('instructor.exams.editExam') : t('instructor.exams.createTitle')}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg text-2xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              {/* Tiêu đề */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.exams.titleLabel')} *</label>
                <input type="text" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder={t('instructor.exams.titlePlaceholder')} />
              </div>
              {/* Mô tả */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.exams.description')}</label>
                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  rows="2" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  placeholder={t('instructor.exams.descriptionPlaceholder')} />
              </div>
              {/* Loại + Hình thức */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.exams.examType')}</label>
                  <select value={formData.type} onChange={e => handleTypeChange(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400">
                    <option value="letter">{t('instructor.exams.letter')}</option>
                    <option value="word">{t('instructor.exams.word')}</option>
                    <option value="sentence">{t('instructor.exams.sentence')}</option>
                    <option value="comprehensive">{t('instructor.exams.comprehensive')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.exams.practiceType')}</label>
                  {isComprehensive ? (
                    <div className="w-full px-4 py-2 border border-purple-300 bg-purple-50 rounded-xl text-sm font-medium text-purple-700 flex items-center gap-2">
                      <Brain size={16} className="shrink-0" />
                      {t('instructor.exams.multiSkill')}
                    </div>
                  ) : (
                    <select value={formData.practiceType} onChange={e => setFormData(p => ({ ...p, practiceType: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400">
                      <option value="recognition">{t('instructor.exams.recognition')}</option>
                      <option value="realtime">{t('instructor.exams.realtime')}</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Chế độ câu hỏi — ẩn khi type = letter */}
              {showQuestionMode && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('instructor.exams.questionMode')}
                    </label>
                    <select
                      value={formData.mode}
                      onChange={e => setFormData(p => ({ ...p, mode: e.target.value, topic: '' }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      {availableModes.map(m => (
                        <option key={m.value} value={m.value}>{t(m.labelKey)}</option>
                      ))}
                    </select>
                    {isComprehensive && formData.mode === 'mixed_topic' && (
                      <p className="text-[11px] text-purple-600 mt-1">
                        💡 {t('instructor.exams.modeMixedTopicTip')}
                      </p>
                    )}
                  </div>
                  {showTopicSelect && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('instructor.exams.topic')}
                      </label>
                      <select
                        value={formData.topic}
                        onChange={e => setFormData(p => ({ ...p, topic: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        <option value="">{t('instructor.exams.selectTopic')}</option>
                        {getAvailableTopics().map(topic => (
                          <option key={topic.key} value={topic.key}>
                            {topic.icon} {lang === 'vi' ? topic.viName : topic.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
              {showTopicSelect && !formData.topic && (
                <p className="text-xs text-amber-600">⚠️ {t('instructor.exams.selectTopicWarning')}</p>
              )}

              {/* Cấu hình 6 dạng câu — chỉ hiện khi comprehensive */}
              {isComprehensive && (
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-purple-800">{t('instructor.exams.questionsPerType')}</label>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${totalConfigQuestions >= 5 && totalConfigQuestions <= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {t('instructor.exams.total')} {totalConfigQuestions} {t('instructor.exams.questions')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'letterCount', labelKey: 'instructor.exams.letters', color: 'blue' },
                      { key: 'shortWordCount', labelKey: 'instructor.exams.shortWords', color: 'emerald' },
                      { key: 'longWordCount', labelKey: 'instructor.exams.longWords', color: 'amber' },
                      { key: 'complexCount', labelKey: 'instructor.exams.complexSentences', color: 'purple' },
                      { key: 'quizCount', labelKey: 'instructor.exams.quiz', color: 'rose' },
                      { key: 'chainCount', labelKey: 'instructor.exams.signChain', color: 'cyan' }
                    ].map(({ key, labelKey, color }) => (
                      <div key={key} className={`bg-${color}-50 rounded-lg p-2 border border-${color}-100`}>
                        <label className={`text-xs font-medium text-${color}-700 block mb-1`}>{t(labelKey)}</label>
                        <input type="number" min="0" max="20"
                          value={formData.examConfig[key] || 0}
                          onChange={e => setFormData(p => ({ ...p, examConfig: { ...p.examConfig, [key]: Math.max(0, parseInt(e.target.value) || 0) } }))}
                          className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-400" />
                      </div>
                    ))}
                  </div>
                  {(totalConfigQuestions < 5 || totalConfigQuestions > 50) && (
                    <p className="text-xs text-red-600 mt-2">⚠️ {t('instructor.exams.totalMustBe')}</p>
                  )}
                </div>
              )}

              {/* Số câu hỏi — ẩn khi comprehensive */}
              {!isComprehensive && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.exams.numberOfQuestions')}</label>
                  <select value={formData.settings.questionCount} onChange={e => setFormData(p => ({ ...p, settings: { ...p.settings, questionCount: parseInt(e.target.value) } }))} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400">
                    {[5,10,15,20,25,30,35,40,45,50].map(n => <option key={n} value={n}>{n} {t('instructor.exams.questionsWord')}</option>)}
                  </select>
                </div>
              )}

              {/* Số lần làm + Điểm đạt + Thời gian */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.exams.maxAttempts')}</label>
                  <select value={formData.settings.maxAttempts} onChange={e => setFormData(p => ({ ...p, settings: { ...p.settings, maxAttempts: parseInt(e.target.value) } }))} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400">
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {t('instructor.exams.times')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.exams.passingScore')}</label>
                  <input type="number" min="10" max="1000" value={formData.settings.passingScore}
                    onChange={e => setFormData(p => ({ ...p, settings: { ...p.settings, passingScore: parseInt(e.target.value) || 70 } }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.exams.durationMin')}</label>
                  <input type="number" min="1" max="180" value={formData.settings.duration}
                    onChange={e => setFormData(p => ({ ...p, settings: { ...p.settings, duration: parseInt(e.target.value) || 30 } }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
              </div>

              {/* Ngày bắt đầu + kết thúc */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.exams.startDate')}</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.exams.endDate')}</label>
                  <input type="date" value={formData.endDate} onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
              </div>

              {/* Giao cho học viên */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    {t('instructor.exams.assignToStudents')}
                  </label>
                  {formData.assignedTo.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      {formData.assignedTo.length} {t('instructor.exams.students')}
                    </span>
                  )}
                </div>

                {students.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <p className="text-sm text-gray-400">{t('instructor.exams.noStudentsAvailable')}</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    {/* Search bar */}
                    <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={studentSearch}
                          onChange={e => setStudentSearch(e.target.value)}
                          placeholder={t('instructor.students.search')}
                          className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder-gray-400"
                        />
                        {studentSearch && (
                          <button onClick={() => setStudentSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Select all row */}
                    <div
                      onClick={handleSelectAll}
                      className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 cursor-pointer hover:bg-purple-50 transition-colors group"
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        students.length > 0 && students.every(s => hasStudent(s._id))
                          ? 'bg-purple-500 border-purple-500'
                          : 'border-gray-300 group-hover:border-purple-400'
                      }`}>
                        {students.length > 0 && students.every(s => hasStudent(s._id)) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        )}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Users size={13} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-800">{t('instructor.exams.selectAll')}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{students.length}</span>
                    </div>

                    {/* Student list */}
                    <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                      {students
                        .filter(s => {
                          const q = studentSearch.toLowerCase();
                          return !q || (s.fullName || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
                        })
                        .map(s => {
                          const isSelected = hasStudent(s._id);
                          const initials = (s.fullName || 'H').split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
                          const colors = ['from-blue-400 to-indigo-500', 'from-violet-400 to-purple-500', 'from-rose-400 to-pink-500', 'from-amber-400 to-orange-500', 'from-teal-400 to-cyan-500'];
                          const colorIdx = (s.fullName || '').charCodeAt(0) % colors.length;
                          return (
                            <div
                              key={s._id}
                              onClick={() => handleStudentToggle(s._id)}
                              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all group ${isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
                            >
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-300 group-hover:border-purple-400'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                )}
                              </div>
                              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm`}>
                                {initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isSelected ? 'text-purple-800' : 'text-gray-700'}`}>{s.fullName}</p>
                                <p className="text-xs text-gray-400 truncate">{s.email}</p>
                              </div>
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0"></span>
                              )}
                            </div>
                          );
                        })
                      }
                      {students.filter(s => {
                        const q = studentSearch.toLowerCase();
                        return !q || (s.fullName || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
                      }).length === 0 && (
                        <div className="py-6 text-center text-sm text-gray-400">
                          {t('instructor.students.noStudents')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 pb-2">
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" className="w-4 h-4 text-purple-600 rounded" checked={publishNow} onChange={e => setPublishNow(e.target.checked)} />
                <span className="text-gray-700">{t('instructor.exams.publishNow')}</span>
              </label>
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
                {editingExam ? t('instructor.exams.update') : t('instructor.exams.createExam')}
              </button>
            </div>
          </div>
        </div>
      )}
    </InstructorLayout>
  );
};

export default InstructorExamManagement;
