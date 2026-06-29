import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Users,
    BookOpen,
    GraduationCap,
    ChevronLeft,
    Clock,
    CheckCircle,
    AlertCircle,
    FileText,
    User,
    Trophy,
    Calendar
} from 'lucide-react';
import Layout from './Layout';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-hot-toast';

const StudentClassDetail = () => {
    const { lang, t } = useLanguage();
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [classData, setClassData] = useState(null);

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
            return;
        }
        fetchClassDetail();
    }, [navigate, id]);

    const fetchClassDetail = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/student/classes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.ok) {
                setClassData(result.class);
            } else {
                toast.error(result.message || t('student.classes.loadError'));
                navigate('/my-classes');
            }
        } catch (error) {
            console.error('Fetch class detail error:', error);
            toast.error(t('student.classes.serverError'));
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (assignment) => {
        if (assignment.isCompleted) {
            return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: t('student.classes.completed') };
        }
        if (assignment.isOverdue) {
            return { bg: 'bg-red-100', text: 'text-red-700', label: t('student.classes.overdue') };
        }
        if (assignment.dueDate) {
            const daysLeft = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 2 && daysLeft >= 0) {
                return { bg: 'bg-amber-100', text: 'text-amber-700', label: `${daysLeft} ${t('student.classes.days')}` };
            }
        }
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: t('student.classes.pending') };
    };

    const handleStartAssignment = (assignment) => {
        navigate(`/student/assignments/${assignment._id}`);
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                        <p className="text-slate-600 mt-4">{t('student.classes.loading')}</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!classData) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-slate-600">{t('student.classes.notFound')}</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/my-classes')}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
                    >
                        <ChevronLeft size={20} />
                        {t('student.classes.backToClasses')}
                    </button>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
                                <GraduationCap size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900">{classData.name}</h1>
                                <div className="flex items-center gap-3 mt-1 text-sm text-slate-600">
                                    {classData.instructorId && (
                                        <span className="font-medium text-blue-600">{classData.instructorId.fullName}</span>
                                    )}
                                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                        {classData.studentCount || 0} {t('student.classes.students')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {classData.description && (
                        <p className="text-slate-600 mt-3">{classData.description}</p>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/40 p-4 shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Users size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{classData.studentCount || 0}</p>
                                <p className="text-xs text-slate-600/70">{t('student.classes.students')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/40 p-4 shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <BookOpen size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{classData.assignments?.length || 0}</p>
                                <p className="text-xs text-slate-600/70">{t('student.classes.assignments')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/40 p-4 shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Trophy size={20} className="text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">
                                    {classData.recentSubmissions?.filter(s => s.score >= 60).length || 0}
                                </p>
                                <p className="text-xs text-slate-600/70">{t('student.classes.passed')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/40 p-4 shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                <CheckCircle size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">
                                    {classData.assignments?.filter(a => a.isCompleted).length || 0}/{classData.assignments?.length || 0}
                                </p>
                                <p className="text-xs text-slate-600/70">{t('student.classes.completed')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assignments */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/40 shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <BookOpen size={20} className="text-emerald-500" />
                            {t('student.classes.classAssignments')}
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {classData.assignments?.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <BookOpen size={40} className="mx-auto text-gray-300 mb-2" />
                                <p>{t('student.classes.noAssignments')}</p>
                            </div>
                        ) : (
                            classData.assignments.map((assignment) => {
                                const status = getStatusBadge(assignment);
                                return (
                                    <div key={assignment._id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-900">{assignment.title}</h3>
                                                <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                                    <span className={`px-2 py-0.5 rounded-full ${status.bg} ${status.text} font-medium`}>
                                                        {status.label}
                                                    </span>
                                                    {assignment.dueDate && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {t('student.classes.due')}: {new Date(assignment.dueDate).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    {assignment.submission && (
                                                        <span className="flex items-center gap-1">
                                                            <Trophy size={12} />
                                                            {t('student.classes.score')}: {assignment.submission.score}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleStartAssignment(assignment)}
                                                className="px-4 py-2 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-all"
                                            >
                                                {assignment.isCompleted ? t('student.classes.retry') : t('student.classes.start')}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Members Preview */}
                {classData.members && classData.members.length > 0 && (
                    <div className="mt-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/40 shadow-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Users size={20} className="text-blue-500" />
                                {t('student.classes.classMembers')}
                            </h2>
                        </div>
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {classData.members.slice(0, 8).map((member) => (
                                <div key={member._id} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                                        {(member.fullName || 'H').charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 truncate">{member.fullName}</span>
                                </div>
                            ))}
                        </div>
                        {classData.studentCount > 8 && (
                            <div className="px-6 py-3 border-t border-gray-100 text-center">
                                <span className="text-sm text-slate-500">
                                    {t('student.classes.and')} {classData.studentCount - 8} {t('student.classes.otherStudents')}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default StudentClassDetail;
