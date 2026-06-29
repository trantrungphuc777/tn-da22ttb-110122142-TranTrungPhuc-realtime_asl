import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    BookOpen,
    GraduationCap,
    ChevronLeft,
    ChevronRight,
    Trophy,
    ChevronRight as ArrowRight
} from 'lucide-react';
import Layout from './Layout';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-hot-toast';

const StudentClasses = () => {
    const { lang, t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [myAssignmentCount, setMyAssignmentCount] = useState(0);

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
            return;
        }
        fetchClasses();
        fetchMyAssignmentCount();
    }, [navigate, pagination.page]);

    const fetchMyAssignmentCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/student/assignments?limit=100&status=all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMyAssignmentCount(data.pagination?.total || data.assignments?.length || 0);
            }
        } catch { /* silent */ }
    };

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
            return;
        }
        fetchClasses();
    }, [navigate, pagination.page]);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page: pagination.page,
                limit: 10
            });
            const response = await fetch(`http://localhost:5000/api/student/classes?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.ok) {
                setClasses(result.classes || []);
                setPagination(result.pagination || {});
            } else {
                toast.error(result.message || t('studentClasses.loadError'));
            }
        } catch (error) {
            console.error('Fetch classes error:', error);
            toast.error(t('studentClasses.serverError'));
        } finally {
            setLoading(false);
        }
    };

    const getLevelBadge = (level) => {
        const badges = {
            beginner: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: t('studentClasses.levelBeginner') },
            intermediate: { bg: 'bg-amber-100', text: 'text-amber-700', label: t('studentClasses.levelIntermediate') },
            advanced: { bg: 'bg-red-100', text: 'text-red-700', label: t('studentClasses.levelAdvanced') }
        };
        const badge = badges[level] || badges.beginner;
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        const badges = {
            active: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: t('studentClasses.statusActive') },
            archived: { bg: 'bg-gray-100', text: 'text-gray-600', label: t('studentClasses.statusArchived') }
        };
        const badge = badges[status] || badges.active;
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    /* Tạo tiêu đề lớp lịch sự: "Lớp của Giảng viên X" */
    const getInstructorLabel = (classItem) => classItem.instructorId?.fullName || '';

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-extrabold text-slate-900">
                        {t('studentClasses.title')}
                    </h1>
                    <p className="text-slate-600 mt-1">
                        {t('studentClasses.subtitle')}
                    </p>
                </div>

                {/* Stats — dữ liệu thực tế từ API */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {/* Tổng lớp — từ pagination.total */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/40 p-4 shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                <GraduationCap size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{pagination.total}</p>
                                <p className="text-xs text-slate-600/70">{t('studentClasses.totalClasses')}</p>
                            </div>
                        </div>
                    </div>
                    {/* Học viên — lấy từ lớp đầu tiên (lớp của học viên này) */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/40 p-4 shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <Users size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">
                                    {classes.length > 0 ? (classes[0].studentCount || 0) : 0}
                                </p>
                                <p className="text-xs text-slate-600/70">{t('studentClasses.classmates')}</p>
                            </div>
                        </div>
                    </div>
                    {/* Bài tập — số bài tập thực tế được giao cho học viên */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/40 p-4 shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                <BookOpen size={20} className="text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{myAssignmentCount}</p>
                                <p className="text-xs text-slate-600/70">{t('studentClasses.assignments')}</p>
                            </div>
                        </div>
                    </div>
                    {/* Điểm TB — trung bình điểm của tất cả lớp */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/40 p-4 shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Trophy size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">
                                    {classes.length > 0
                                        ? (classes.reduce((sum, c) => sum + parseFloat(c.classAverageScore || 0), 0) / classes.length).toFixed(1)
                                        : '0'
                                    }%
                                </p>
                                <p className="text-xs text-slate-600/70">{t('studentClasses.classAvgScore')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Classes List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/40 p-12 shadow-md text-center">
                            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                            <p className="text-slate-600/70 mt-4">{t('studentClasses.loading')}</p>
                        </div>
                    ) : classes.length === 0 ? (
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/40 p-12 shadow-md text-center">
                            <GraduationCap size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-xl font-semibold text-slate-900">
                                {t('studentClasses.noClasses')}
                            </p>
                            <p className="text-slate-600/70 mt-2">
                                {t('studentClasses.noClassesDesc')}
                            </p>
                        </div>
                    ) : (
                        classes.map((classItem) => (
                            <div
                                key={classItem._id}
                                onClick={() => navigate(`/student/classes/${classItem._id}`)}
                                className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/40 p-6 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-md flex-shrink-0">
                                            <GraduationCap size={28} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {/* Tiêu đề chính: Lớp của Giảng viên X */}
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                                                    {classItem.instructorId
                                                        ? t('studentClasses.classBy') + ' ' + classItem.instructorId.fullName
                                                        : classItem.name}
                                                </h3>
                                                {getLevelBadge(classItem.level)}
                                                {getStatusBadge(classItem.status)}
                                            </div>
                                            {/* Ẩn description vì thường trùng với tên giảng viên */}
                                            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <Users size={13} />
                                                    {classItem.studentCount || 0} {t('studentClasses.students')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <BookOpen size={13} />
                                                    {classItem.assignmentCount || 0} {t('studentClasses.assignmentsCount')}
                                                </span>
                                                {classItem.classAverageScore && (
                                                    <span className="flex items-center gap-1">
                                                        <Trophy size={13} />
                                                        {t('studentClasses.avg')} {classItem.classAverageScore}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Nút Bài tập + Mũi tên — đều vào /my-assignments */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate('/my-assignments'); }}
                                            className="px-4 py-2 bg-white border border-gray-200 text-slate-700 font-medium rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all flex items-center gap-2 text-sm"
                                        >
                                            <BookOpen size={15} />
                                            {t('studentClasses.viewAssignments')}
                                        </button>
                                        <div
                                            onClick={(e) => { e.stopPropagation(); navigate('/my-assignments'); }}
                                            className="w-9 h-9 rounded-xl bg-blue-50 group-hover:bg-blue-500 flex items-center justify-center transition-all cursor-pointer"
                                        >
                                            <ArrowRight size={16} className="text-blue-500 group-hover:text-white transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="mt-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/40 p-4 shadow-md flex items-center justify-between">
                        <p className="text-sm text-slate-700">
                            {t('studentClasses.page')} {pagination.page} / {pagination.pages}
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

export default StudentClasses;
