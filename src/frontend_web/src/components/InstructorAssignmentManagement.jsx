import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Edit,
    Trash2,
    Send,
    ChevronLeft,
    ChevronRight,
    Users,
    BookOpen,
    Search
} from 'lucide-react';
import InstructorLayout from './InstructorLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-hot-toast';
import { VOCABULARY_BY_TOPIC, SENTENCES_BY_TOPIC, QUIZ_TOPICS } from '../data/aslQuizData';

const AssignmentManagement = () => {
    const { lang, t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [filters, setFilters] = useState({ status: '', type: '' });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [students, setStudents] = useState([]);
    const [studentSearch, setStudentSearch] = useState('');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'letter',
        level: 'beginner',
        practiceType: 'recognition',
        mode: 'random',
        topic: '',
        content: { letters: [], words: [], sentences: [] },
        settings: { timeLimit: null, questionCount: 10, maxAttempts: null, passingScore: 60 },
        dueDate: '',
        assignedTo: []
    });
    const [publishNow, setPublishNow] = useState(false);

    // Lấy topics theo loại bài tập — luôn dùng QUIZ_TOPICS làm nguồn để có đủ icon/tên
    const getAvailableTopics = () => {
        if (formData.type === 'sentence') {
            return QUIZ_TOPICS.filter(t => {
                const k = t.key;
                return SENTENCES_BY_TOPIC[k] || SENTENCES_BY_TOPIC[k + 's'] ||
                       (k.endsWith('s') && SENTENCES_BY_TOPIC[k.slice(0, -1)]);
            });
        } else if (formData.type === 'word') {
            return QUIZ_TOPICS.filter(t => {
                const k = t.key;
                return VOCABULARY_BY_TOPIC[k] || VOCABULARY_BY_TOPIC[k + 's'] ||
                       (k.endsWith('s') && VOCABULARY_BY_TOPIC[k.slice(0, -1)]);
            });
        }
        return [];
    };

    // Khi đổi loại bài tập, reset topic về rỗng
    const handleTypeChange = (newType) => {
        setFormData(prev => ({ ...prev, type: newType, topic: '' }));
    };

    const hasFetched = useRef(false);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (!localStorage.getItem('token')) { navigate('/login'); return; }
        if (user.role !== 'instructor' && user.role !== 'admin') { navigate('/dashboard'); return; }
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchAssignments(true);
        fetchStudents();
    }, []);

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        fetchAssignments(false);
    }, [pagination.page, filters]);

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/instructor/students?limit=100', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.ok) {
                setStudents(result.students || []);
            }
        } catch (error) {
            console.error('Fetch students error:', error);
        }
    };

    const fetchAssignments = async (silent = false) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({ page: pagination.page, limit: 10, ...filters });
            const response = await fetch(`http://localhost:5000/api/instructor/assignments?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            const result = await response.json();
            if (response.ok) { setAssignments(result.assignments || []); setPagination(result.pagination || {}); }
            else if (!silent) toast.error(result.message || t('instructor.assignments.errorLoad'));
        } catch (error) {
            if (!silent) toast.error(t('instructor.reports.serverError'));
        } finally { setLoading(false); }
    };

    const handleCreateOrUpdate = async () => {
        if (!formData.title) {
            toast.error(t('instructor.assignments.enterTitle'));
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const url = editingAssignment
                ? `http://localhost:5000/api/instructor/assignments/${editingAssignment._id}`
                : 'http://localhost:5000/api/instructor/assignments';

            const response = await fetch(url, {
                method: editingAssignment ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    dueDate: formData.dueDate || null
                })
            });

            const result = await response.json();
            if (response.ok) {
                toast.success(editingAssignment 
                    ? t('instructor.assignments.updateSuccess')
                    : t('instructor.assignments.createSuccess'));
                // If user requested publish now, call publish endpoint after create/update
                if (publishNow && result.assignment && result.assignment._id) {
                    await handlePublish(result.assignment._id);
                }
                setShowCreateModal(false);
                resetForm();
                fetchAssignments();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error(t('instructor.assignments.errorSaving'));
        }
    };

    const handleStudentToggle = (studentId) => {
        setFormData(prev => {
            const prevIds = (prev.assignedTo || []).map(id => id.toString());
            const sid = studentId.toString();
            const assignedTo = prevIds.includes(sid)
                ? prevIds.filter(id => id !== sid)
                : [...prevIds, sid];
            return { ...prev, assignedTo };
        });
    };

    const handleSelectAllStudents = () => {
        setFormData(prev => {
            const allStudentIds = students.map(s => s._id.toString());
            const allSelected = allStudentIds.every(id => (prev.assignedTo || []).map(a => a.toString()).includes(id));
            if (allSelected) {
                return { ...prev, assignedTo: [] };
            } else {
                return { ...prev, assignedTo: allStudentIds };
            }
        });
    };

    const getAssignedStudentCount = () => {
        return (formData.assignedTo || []).length;
    };

    const hasAssignedStudent = (studentId) => {
        const ids = (formData.assignedTo || []).map(id => id.toString());
        return ids.includes(studentId.toString());
    };

    const handlePublish = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/instructor/assignments/${id}/publish`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.ok) {
                toast.success(t('instructor.assignments.publishSuccess'));
                fetchAssignments();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error(t('instructor.assignments.errorPublishing'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('instructor.assignments.confirmDelete'))) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/instructor/assignments/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.ok) {
                toast.success(t('instructor.assignments.deleteSuccess'));
                fetchAssignments();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error(t('instructor.assignments.errorDeleting'));
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            type: 'letter',
            level: 'beginner',
            practiceType: 'recognition',
            mode: 'random',
            topic: '',
            content: { letters: [], words: [], sentences: [] },
            settings: { timeLimit: null, questionCount: 10, maxAttempts: null, passingScore: 60 },
            dueDate: '',
            assignedTo: []
        });
        setEditingAssignment(null);
        setPublishNow(false);
    };

    const openEditModal = (assignment) => {
        resetForm();
        setEditingAssignment(assignment);

        // assignedTo can be an array of ObjectIds or array of objects (populated)
        const assignedIds = (assignment.assignedTo || []).map(a =>
            typeof a === 'object' ? (a._id || a).toString() : a.toString()
        );

        setFormData({
            title: assignment.title,
            description: assignment.description || '',
            type: assignment.type,
            level: assignment.level,
            practiceType: assignment.practiceType,
            mode: assignment.mode || 'random',
            topic: assignment.topic || '',
            content: assignment.content || { letters: [], words: [], sentences: [] },
            settings: assignment.settings || { timeLimit: null, questionCount: 10, maxAttempts: null, passingScore: 60 },
            dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '',
            assignedTo: assignedIds
        });
        setShowCreateModal(true);
    };

    const getStatusBadge = (status) => {
        const badges = {
            draft: { bg: 'bg-gray-100', text: 'text-gray-700', labelKey: 'instructor.assignments.draft' },
            published: { bg: 'bg-emerald-100', text: 'text-emerald-700', labelKey: 'instructor.assignments.published' },
            closed: { bg: 'bg-red-100', text: 'text-red-700', labelKey: 'instructor.assignments.closed' }
        };
        const badge = badges[status] || badges.draft;
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>{t(badge.labelKey)}</span>;
    };

    const getTypeBadge = (type) => {
        const typeKeys = {
            letter: 'instructor.assignments.letter',
            word: 'instructor.assignments.word',
            sentence: 'instructor.assignments.sentence',
        };
        return typeKeys[type] ? t(typeKeys[type]) : type;
    };

    return (
        <InstructorLayout>
            <div className="max-w-7xl mx-auto">
                {/* ── Hero Header ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-5 shadow-xl mb-5">
                    <div className="absolute inset-0 particle-grid opacity-20 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-300/20 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-emerald-300/15 rounded-full blur-[50px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    <BookOpen size={16} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight">{t('instructor.assignments.title')}</h1>
                            </div>
                            <p className="text-emerald-100 text-sm">{t('instructor.assignments.subtitle')}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {[
                                    { label: t('instructor.assignments.totalAssignments'), val: assignments.length },
                                    { label: t('instructor.assignments.published'), val: assignments.filter(a => a.status === 'published').length },
                                    { label: t('instructor.assignments.draft'), val: assignments.filter(a => a.status === 'draft').length },
                                ].map((p, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs text-white font-medium">
                                        <span>{p.label}:</span><span className="font-bold">{p.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => { resetForm(); setShowCreateModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-700 text-sm font-bold rounded-xl hover:bg-emerald-50 transition-all shadow-lg flex-shrink-0">
                            <Plus size={16} />{t('instructor.assignments.createNew')}
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                    {[
                        { labelKey: 'instructor.assignments.totalAssignments', value: assignments.length, icon: BookOpen, color: 'bg-emerald-500' },
                        { labelKey: 'instructor.assignments.published', value: assignments.filter(a => a.status === 'published').length, icon: Send, color: 'bg-blue-500' },
                        { labelKey: 'instructor.assignments.draft', value: assignments.filter(a => a.status === 'draft').length, icon: Edit, color: 'bg-amber-500' },
                        { labelKey: 'instructor.assignments.closed', value: assignments.filter(a => a.status === 'closed').length, icon: Users, color: 'bg-slate-500' },
                    ].map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}><Icon size={16} className="text-white" /></div>
                                <div><p className="text-xs text-slate-500 font-medium">{t(s.labelKey)}</p><p className="text-xl font-bold text-slate-800">{s.value}</p></div>
                            </div>
                        );
                    })}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-slate-200 p-3 mb-5 shadow-sm">
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" placeholder={t('instructor.assignments.searchPlaceholder')} value={filters.search || ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                        </div>
                        <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400">
                            <option value="">{t('instructor.assignments.allStatuses')}</option>
                            <option value="draft">{t('instructor.assignments.draft')}</option>
                            <option value="published">{t('instructor.assignments.published')}</option>
                            <option value="closed">{t('instructor.assignments.closed')}</option>
                        </select>
                        <select value={filters.type} onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))} className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400">
                            <option value="">{t('instructor.assignments.allTypes')}</option>
                            <option value="letter">{t('instructor.assignments.letter')}</option>
                            <option value="word">{t('instructor.assignments.word')}</option>
                            <option value="sentence">{t('instructor.assignments.sentence')}</option>
                        </select>
                    </div>
                </div>

                {/* Assignments List */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                                    <th className="px-4 py-3 text-left text-xs font-bold text-emerald-800 uppercase">{t('instructor.assignments.assignment')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-emerald-800 uppercase">{t('instructor.assignments.type')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-emerald-800 uppercase">{t('instructor.assignments.status')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-emerald-800 uppercase min-w-[160px]">{t('instructor.assignments.completion')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-emerald-800 uppercase">{t('instructor.assignments.dueDate')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-emerald-800 uppercase">{t('instructor.assignments.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center">
                                            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : assignments.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                            {t('instructor.assignments.noAssignments')}
                                        </td>
                                    </tr>
                                ) : (
                                    assignments.map((assignment) => (
                                        <tr key={assignment._id} className="hover:bg-emerald-50/40 transition-colors">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-semibold text-slate-800">{assignment.title}</p>
                                                    <p className="text-xs text-slate-400 line-clamp-1">{assignment.description || t('instructor.assignments.noDescription')}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">{getTypeBadge(assignment.type)}</span>
                                            </td>
                                            <td className="px-4 py-3">{getStatusBadge(assignment.status)}</td>
                                            <td className="px-4 py-3">
                                                {(() => {
                                                    const done = assignment.submissionStats?.completed || 0;
                                                    const total = assignment.submissionStats?.total || 0;
                                                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                                                    return (
                                                        <div>
                                                            <div className="flex items-center justify-between text-xs mb-1">
                                                                <span className="text-slate-600 font-medium">{done}/{total}</span>
                                                                <span className={`font-bold ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-slate-400'}`}>{pct}%</span>
                                                            </div>
                                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-slate-300'}`} style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-4 py-3">
                                                {assignment.dueDate ? (() => {
                                                    const days = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                                                    return (
                                                        <div>
                                                            <p className="text-xs text-slate-600">{new Date(assignment.dueDate).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}</p>
                                                            <p className={`text-xs font-semibold ${days < 0 ? 'text-red-500' : days <= 3 ? 'text-amber-500' : 'text-emerald-600'}`}>
                                                                {days < 0 ? t('instructor.assignments.overdue') : days === 0 ? t('instructor.assignments.today') : `${days} ${t('instructor.assignments.daysLeft')}`}
                                                            </p>
                                                        </div>
                                                    );
                                                })() : <span className="text-xs text-slate-400">{t('instructor.assignments.noLimit')}</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    {assignment.status === 'draft' && (
                                                        <button onClick={() => handlePublish(assignment._id)} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" title={t('instructor.assignments.publish')}><Send size={15} /></button>
                                                    )}
                                                    <button onClick={() => openEditModal(assignment)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title={t('instructor.assignments.edit')}><Edit size={15} /></button>
                                                    <button onClick={() => handleDelete(assignment._id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title={t('instructor.assignments.delete')}><Trash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="px-4 py-3 border-t border-emerald-100 flex items-center justify-between">
                            <p className="text-sm text-emerald-700">
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
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-medium">
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
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-emerald-900">
                                {editingAssignment ? t('instructor.assignments.editAssignment') : t('instructor.assignments.createNew')}
                            </h2>
                            <button
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className="p-2 hover:bg-gray-100 rounded-lg text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.assignments.labelTitle')} *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                    placeholder={t('instructor.assignments.placeholderTitle')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.assignments.labelDescription')}</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                                    placeholder={t('instructor.assignments.placeholderDescription')}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.assignments.labelAssignmentType')}</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => handleTypeChange(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                    >
                                        <option value="letter">{t('instructor.assignments.letter')}</option>
                                        <option value="word">{t('instructor.assignments.word')}</option>
                                        <option value="sentence">{t('instructor.assignments.sentence')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.assignments.labelLevel')}</label>
                                    <select
                                        value={formData.level}
                                        onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                        disabled={formData.type === 'letter'}
                                    >
                                        {formData.type === 'letter' ? (
                                            <option value="beginner">{t('instructor.students.beginner')}</option>
                                        ) : (
                                            <>
                                                <option value="beginner">{t('instructor.students.beginner')}</option>
                                                <option value="intermediate">{t('instructor.students.intermediate')}</option>
                                                <option value="advanced">{t('instructor.students.advanced')}</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.assignments.labelPracticeType')}</label>
                                    <select
                                        value={formData.practiceType}
                                        onChange={(e) => setFormData(prev => ({ ...prev, practiceType: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                    >
                                        <option value="recognition">{t('instructor.assignments.recognitionQuiz')}</option>
                                        <option value="realtime">{t('instructor.assignments.realtimeRecognition')}</option>
                                    </select>
                                </div>
                            </div>
                            {/* Chế độ câu hỏi và Chủ đề chỉ hiện khi type = 'word' hoặc 'sentence' */}
                            {formData.type !== 'letter' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.assignments.questionMode')}</label>
                                        <select
                                            value={formData.mode}
                                            onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                        >
                                            <option value="random">{t('instructor.assignments.randomMode')}</option>
                                            <option value="topic">{t('instructor.assignments.byTopic')}</option>
                                        </select>
                                    </div>
                                    {formData.mode === 'topic' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.assignments.topic')}</label>
                                            <select
                                                value={formData.topic}
                                                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                            >
                                                <option value="">{t('instructor.assignments.selectTopic')}</option>
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
                            {formData.type !== 'letter' && formData.mode === 'topic' && !formData.topic && (
                                <div className="mt-2 text-sm text-amber-600">
                                    {t('instructor.assignments.selectTopicWarning')}
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.assignments.numberOfQuestions')}</label>
                                    <input
                                        type="number"
                                        value={formData.settings.questionCount}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            settings: { ...prev.settings, questionCount: parseInt(e.target.value) || 10 }
                                        }))}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.assignments.maxAttempts')}</label>
                                    <select
                                        value={formData.settings.maxAttempts ?? 'unlimited'}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            settings: {
                                                ...prev.settings,
                                                maxAttempts: e.target.value === 'unlimited' ? null : parseInt(e.target.value) || null
                                            }
                                        }))}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                    >
                                        <option value="unlimited">{t('instructor.assignments.unlimited')}</option>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="5">5</option>
                                        <option value="10">10</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.assignments.passingScore')}</label>
                                    <input
                                        type="number"
                                        value={formData.settings.passingScore}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            settings: { ...prev.settings, passingScore: parseInt(e.target.value) || 60 }
                                        }))}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('instructor.assignments.dueDate')}</label>
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                />
                            </div>

                            {/* Assign to Students */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        {t('instructor.assignments.assignToStudents')}
                                    </label>
                                    {getAssignedStudentCount() > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                            {getAssignedStudentCount()} {t('instructor.assignments.studentsWillReceive')}
                                        </span>
                                    )}
                                </div>

                                {students.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                                        <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <p className="text-sm text-gray-400">{t('instructor.assignments.noStudentsAvailable')}</p>
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
                                                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder-gray-400"
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
                                            onClick={handleSelectAllStudents}
                                            className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 cursor-pointer hover:bg-emerald-50 transition-colors group"
                                        >
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                students.length > 0 && students.every(s => (formData.assignedTo || []).map(id => id.toString()).includes(s._id.toString()))
                                                    ? 'bg-emerald-500 border-emerald-500'
                                                    : 'border-gray-300 group-hover:border-emerald-400'
                                            }`}>
                                                {students.length > 0 && students.every(s => (formData.assignedTo || []).map(id => id.toString()).includes(s._id.toString())) && (
                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                )}
                                            </div>
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                                                <Users size={13} className="text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-semibold text-gray-800">{t('instructor.assignments.selectAllStudents')}</span>
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
                                                .map(student => {
                                                    const isSelected = hasAssignedStudent(student._id);
                                                    const initials = (student.fullName || 'H').split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
                                                    const colors = ['from-blue-400 to-indigo-500', 'from-violet-400 to-purple-500', 'from-rose-400 to-pink-500', 'from-amber-400 to-orange-500', 'from-teal-400 to-cyan-500'];
                                                    const colorIdx = (student.fullName || '').charCodeAt(0) % colors.length;
                                                    return (
                                                        <div
                                                            key={student._id}
                                                            onClick={() => handleStudentToggle(student._id)}
                                                            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all group ${isSelected ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
                                                        >
                                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                                isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 group-hover:border-emerald-400'
                                                            }`}>
                                                                {isSelected && (
                                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                                )}
                                                            </div>
                                                            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm`}>
                                                                {initials}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm font-medium truncate ${isSelected ? 'text-emerald-800' : 'text-gray-700'}`}>{student.fullName}</p>
                                                                <p className="text-xs text-gray-400 truncate">{student.email}</p>
                                                            </div>
                                                            {isSelected && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
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
                        <div className="px-6 pb-4">
                                <label className="flex items-center gap-3 text-sm">
                                    <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
                                    <span className="text-sm text-gray-700">{t('instructor.assignments.publishNow')}</span>
                                </label>
                            </div>
                        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleCreateOrUpdate}
                                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                            >
                                {editingAssignment ? t('instructor.assignments.update') : t('instructor.assignments.create')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </InstructorLayout>
    );
};

export default AssignmentManagement;
