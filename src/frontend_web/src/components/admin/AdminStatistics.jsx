import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import { Users, TrendingUp, TrendingDown, Activity, BarChart3, BookOpen, RefreshCw, LineChart as LineChartIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer
} from 'recharts';

const API = 'http://localhost:5000/api/admin/statistics';

const AdminStatistics = () => {
    const { t } = useLanguage();
    const [studentStats, setStudentStats] = useState(null);
    const [studentAnalysis, setStudentAnalysis] = useState(null);
    const [instructorStats, setInstructorStats] = useState(null);
    const [contentStats, setContentStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('students');

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [s, sa, i, c] = await Promise.all([
                axios.get(`${API}/students`, { headers }),
                axios.get(`${API}/students/analysis`, { headers }),
                axios.get(`${API}/instructors`, { headers }),
                axios.get(`${API}/content`, { headers })
            ]);
            setStudentStats(s.data);
            setStudentAnalysis(sa.data);
            setInstructorStats(i.data);
            setContentStats(c.data);
        } catch { toast.error(t('admin.auto.k_583ee4ec', 'Không thể tải dữ liệu thống kê!')); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const TABS = [
        { key: 'students', label: t('admin.auto.k_1b83df7a', 'Học viên'), icon: Users },
        { key: 'instructors', label: t('admin.auto.k_6e4e1637', 'Giảng viên'), icon: BarChart3 },
        { key: 'content', label: t('admin.auto.k_ee7ca513', 'Nội dung'), icon: BookOpen }
    ];

    return (
        <AdminLayout>
            <div className="space-y-5">
                {/* ── Hero Banner ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-500 p-5 shadow-xl">
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-300/20 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-pink-300/15 rounded-full blur-[50px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    <BarChart3 size={16} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight"> {t('admin.auto.k_b0fb350f', t('admin.auto.k_b0fb350f', 'Thống kê & Phân tích'))} </h1>
                            </div>
                            <p className="text-pink-100 text-sm"> {t('admin.auto.k_28b514ff', t('admin.auto.k_28b514ff', 'Phân tích dữ liệu học tập và hiệu suất toàn hệ thống'))} </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {[
                                    { label: t('admin.auto.k_1b83df7a', 'Học viên'), val: studentStats?.total ?? '—' },
                                    { label: t('admin.auto.k_6e4e1637', 'Giảng viên'), val: instructorStats?.instructors?.length ?? '—' },
                                    { label: t('admin.auto.k_9cad1fe9', 'Lượt học'), val: studentStats ? (studentStats.charts?.learningActivity?.reduce((sum, m) => sum + m.count, 0) ?? 0) : '—' },
                                ].map((p, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs text-white font-medium">
                                        <span>{p.label}:</span><span className="font-bold">{p.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={fetchAll} disabled={loading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white text-pink-700 text-sm font-bold rounded-xl hover:bg-pink-50 transition-all shadow-lg flex-shrink-0 disabled:opacity-60">
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> {t('admin.auto.k_4d20363e', 'Làm mới')} </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    activeTab === tab.key ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                                }`}>
                                <Icon size={14} />{tab.label}
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent" /></div>
                ) : (
                    <>
                        {/* CF7.1 + CF7.2 — Thống kê học viên */}
                        {activeTab === 'students' && studentStats && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {[
                                        { label: t('admin.auto.k_cc21a093', 'Tổng học viên'), value: studentStats.total, color: 'text-violet-600', bg: 'bg-violet-50' },
                                        { label: t('admin.auto.k_cfaecd87', 'Đang hoạt động'), value: studentStats.active, color: 'text-green-600', bg: 'bg-green-50' },
                                        { label: t('admin.auto.k_af84dab0', 'Không hoạt động'), value: studentStats.inactive, color: 'text-red-500', bg: 'bg-red-50' },
                                        { label: t('admin.auto.k_3a40b963', 'Tỷ lệ hoàn thành'), value: `${studentStats.completionRate}%`, color: 'text-blue-600', bg: 'bg-blue-50' },
                                        { label: t('admin.auto.k_7c3ce454', 'Điểm TB hệ thống'), value: studentStats.averageScore, color: 'text-amber-600', bg: 'bg-amber-50' }
                                    ].map((item, i) => (
                                        <div key={i} className={`rounded-2xl p-4 border border-white/60 shadow-sm ${item.bg}`}>
                                            <p className="text-xs font-semibold text-slate-500 mb-1">{item.label}</p>
                                            <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* CF7.1 — Biểu đồ đăng ký theo tháng + hoạt động học tập */}
                                {studentStats.charts && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Biểu đồ cột: học viên đăng ký theo tháng */}
                                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                                            <h3 className="font-bold text-slate-700 mb-4 text-sm flex items-center gap-2">
                                                <Users size={15} className="text-violet-500" /> {t('admin.auto.k_b6bda8a5', t('admin.auto.k_b6bda8a5', 'Học viên đăng ký theo tháng'))} </h3>
                                            <ResponsiveContainer width="100%" height={200}>
                                                <BarChart
                                                    data={(studentStats.charts.monthlyRegistrations || []).map(item => ({
                                                        label: `T${item._id?.month}/${String(item._id?.year).slice(-2)}`,
                                                        [t('admin.auto.k_be74d955', 'Đăng ký mới')]: item.count
                                                    }))}
                                                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                                                    <Bar dataKey={t('admin.auto.k_be74d955', 'Đăng ký mới')} fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={32} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Biểu đồ đường: hoạt động học tập theo tháng */}
                                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                                            <h3 className="font-bold text-slate-700 mb-4 text-sm flex items-center gap-2">
                                                <Activity size={15} className="text-blue-500" /> {t('admin.auto.k_c73d5633', t('admin.auto.k_c73d5633', 'Lượt thực hành & kiểm tra theo tháng'))} </h3>
                                            <ResponsiveContainer width="100%" height={200}>
                                                <LineChart
                                                    data={(studentStats.charts.learningActivity || []).map(item => ({
                                                        label: `T${item._id?.month}/${String(item._id?.year).slice(-2)}`,
                                                        [t('admin.auto.k_3fddb7d8', 'Lượt nộp bài')]: item.count
                                                    }))}
                                                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                                                    <Line type="monotone" dataKey={t('admin.auto.k_3fddb7d8', 'Lượt nộp bài')} stroke="#3b82f6" strokeWidth={2.5}
                                                        dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                                                        activeDot={{ r: 6 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {/* CF7.2 — Phân tích học viên */}
                                {studentAnalysis && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { title: t('admin.auto.k_7be50306', 'Tiến bộ nhất'), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', data: studentAnalysis.mostImproved, desc: t('admin.auto.k_9563255f', 'Tăng pts nhanh nhất, cải thiện độ chính xác nhiều nhất') },
                                            { title: t('admin.auto.k_a38632d3', 'Yếu nhất'), icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50', data: studentAnalysis.weakest, desc: t('admin.auto.k_3133b92d', 'Điểm thấp, ít thực hành') },
                                            { title: t('admin.auto.k_59a685b5', 'Tích cực nhất'), icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', data: studentAnalysis.mostActive, desc: t('admin.auto.k_014d6c34', 'Thời gian thực hành cao, bài hoàn to cao') }
                                        ].map((group, i) => {
                                            const Icon = group.icon;
                                            return (
                                                <div key={i} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Icon size={16} className={group.color} />
                                                        <h3 className="font-bold text-slate-700">{group.title}</h3>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mb-3">{group.desc}</p>
                                                    <div className="space-y-2">
                                                        {(group.data || []).map((s, j) => (
                                                            <div key={j} className={`flex items-center justify-between p-2.5 rounded-xl ${group.bg}`}>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-800">{s.fullName}</p>
                                                                    <p className="text-xs text-slate-500">{s.email}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className={`text-sm font-black ${group.color}`}>{(s.studentStats?.averageScore || 0).toFixed(1)}</p>
                                                                    <p className="text-[10px] text-slate-400"> {t('admin.auto.k_0ef3a153', t('admin.auto.k_0ef3a153', 'điểm TB'))} </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {(!group.data || group.data.length === 0) && <p className="text-sm text-slate-400 text-center py-2"> {t('admin.auto.k_08e9701e', t('admin.auto.k_08e9701e', 'Chưa có dữ liệu'))} </p>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CF7.3 + CF7.4 — Thống kê + phân tích giảng viên */}
                        {activeTab === 'instructors' && instructorStats && (
                        <div className="space-y-4">
                            {/* CF7.4 — Lớp hiệu quả nhất + giảng viên tích cực nhất */}
                            <div className="space-y-4">
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-100">
                                    <h3 className="font-bold text-slate-700"> {t('admin.auto.k_b3dfc433', t('admin.auto.k_b3dfc433', 'Thống kê giảng viên'))} </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_6e4e1637', t('admin.auto.k_6e4e1637', 'Giảng viên'))} </th>
                                                <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_c39be6a0', t('admin.auto.k_c39be6a0', 'Học viên phụ trách'))} </th>
                                                <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_08407bd7', t('admin.auto.k_08407bd7', 'Số lớp'))} </th>
                                                <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_533a8175', t('admin.auto.k_533a8175', 'Bài tập đã giao'))} </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(instructorStats.instructors || []).map(inst => (
                                                <tr key={inst._id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 font-semibold text-slate-800">{inst.fullName}</td>
                                                    <td className="px-4 py-3 font-bold text-violet-600">{inst.studentCount}</td>
                                                    <td className="px-4 py-3 font-bold text-blue-600">{inst.classCount}</td>
                                                    <td className="px-4 py-3 font-bold text-emerald-600">{inst.assignmentCount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* CF7.4 — Lớp hiệu quả nhất */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                                <h3 className="font-bold text-slate-700 mb-3"> {t('admin.auto.k_4ab567e4', t('admin.auto.k_4ab567e4', 'Lớp học hiệu quả nhất (tỷ lệ hoàn to cao)'))} </h3>
                                <div className="space-y-2">
                                    {(instructorStats.topClasses || []).map((cls, i) => (
                                        <div key={cls._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                            <div>
                                                <p className="font-semibold text-slate-800">{cls.name}</p>
                                                <p className="text-xs text-slate-500">{t('admin.auto.k_instructor_short', 'Instructor')}: {cls.instructorId?.fullName || '—'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-emerald-600">{cls.classStats?.completionRate || 0}%</p>
                                                <p className="text-xs text-slate-400"> {t('admin.auto.k_fd55d035', t('admin.auto.k_fd55d035', 'hoàn thành'))} </p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!instructorStats.topClasses || instructorStats.topClasses.length === 0) && <p className="text-sm text-slate-400"> {t('admin.auto.k_08e9701e', t('admin.auto.k_08e9701e', 'Chưa có dữ liệu'))} </p>}
                                </div>
                            </div>

                            {/* CF7.4 — Giảng viên tích cực nhất */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                                <h3 className="font-bold text-slate-700 mb-3"> {t('admin.auto.k_8b795c7b', t('admin.auto.k_8b795c7b', 'Giảng viên tích cực nhất (số đăng nhập + số bài giao)'))} </h3>
                                <div className="space-y-2">
                                    {(instructorStats.instructors || [])
                                        .sort((a, b) => (b.assignmentCount + b.classCount) - (a.assignmentCount + a.classCount))
                                        .slice(0, 3)
                                        .map((inst, i) => (
                                            <div key={inst._id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">{i + 1}</span>
                                                    <p className="font-semibold text-slate-800">{inst.fullName}</p>
                                                </div>
                                                <div className="text-right text-xs text-slate-500">
                                                    <p><span className="font-bold text-emerald-600">{inst.assignmentCount}</span> {t('admin.auto.k_acbe9a3c', t('admin.auto.k_acbe9a3c', 'bài giao'))} </p>
                                                    <p><span className="font-bold text-blue-600">{inst.classCount}</span> {t('admin.auto.k_6514e999', t('admin.auto.k_6514e999', 'lớp'))} </p>
                                                </div>
                                            </div>
                                        ))
                                    }
                                    {(!instructorStats.instructors || instructorStats.instructors.length === 0) && <p className="text-sm text-slate-400"> {t('admin.auto.k_08e9701e', t('admin.auto.k_08e9701e', 'Chưa có dữ liệu'))} </p>}
                                </div>
                            </div>
                        </div>
                        </div>
                        )}

                        {/* CF7.5 + CF7.6 — Thống kê nội dung */}
                        {activeTab === 'content' && contentStats && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* CF7.5 — Bài thực hành dùng nhiều nhất */}
                                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                                    <h3 className="font-bold text-slate-700 mb-3"> {t('admin.auto.k_a41f93d9', t('admin.auto.k_a41f93d9', 'Bài thực hành dùng nhiều nhất'))} </h3>
                                    <div className="space-y-2">
                                        {(contentStats.topAssignments || []).map((a, i) => (
                                            <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                                                <span className="text-sm font-medium text-slate-700">{a.title}</span>
                                                <span className="text-sm font-black text-violet-600">{a.submissionCount} {t('admin.auto.k_da595a8c', 'items')}</span>
                                            </div>
                                        ))}
                                        {(!contentStats.topAssignments || contentStats.topAssignments.length === 0) && <p className="text-sm text-slate-400"> {t('admin.auto.k_08e9701e', t('admin.auto.k_08e9701e', 'Chưa có dữ liệu'))} </p>}
                                    </div>
                                </div>
                                {/* CF7.5 — Bài kiểm tra dùng nhiều nhất */}
                                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                                    <h3 className="font-bold text-slate-700 mb-3"> {t('admin.auto.k_dc3a07b5', t('admin.auto.k_dc3a07b5', 'Bài kiểm tra dùng nhiều nhất'))} </h3>
                                    <div className="space-y-2">
                                        {(contentStats.topExams || []).map((e, i) => (
                                            <div key={i} className="flex items-center justify-between p-2.5 bg-purple-50 rounded-xl">
                                                <span className="text-sm font-medium text-slate-700">{e.title}</span>
                                                <span className="text-sm font-black text-purple-600">{e.submissionCount} {t('admin.auto.k_da595a8c', 'items')}</span>
                                            </div>
                                        ))}
                                        {(!contentStats.topExams || contentStats.topExams.length === 0) && <p className="text-sm text-slate-400"> {t('admin.auto.k_08e9701e', t('admin.auto.k_08e9701e', 'Chưa có dữ liệu'))} </p>}
                                    </div>
                                </div>
                                {/* CF7.6 — Ký hiệu khó nhất */}
                                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                                    <h3 className="font-bold text-slate-700 mb-3"> {t('admin.auto.k_534babe2', t('admin.auto.k_534babe2', 'Ký hiệu khó nhất (nhiều times sai)'))} </h3>
                                    <div className="space-y-2">
                                        {(contentStats.hardestSigns || []).map((s, i) => (
                                            <div key={i} className="flex items-center justify-between p-2.5 bg-red-50 rounded-xl">
                                                <span className="text-2xl font-black text-red-600">{s._id}</span>
                                                <span className="text-sm font-bold text-red-500">{s.count} {t('admin.auto.k_times_wrong', 'times wrong')}</span>
                                            </div>
                                        ))}
                                        {(!contentStats.hardestSigns || contentStats.hardestSigns.length === 0) && <p className="text-sm text-slate-400"> {t('admin.auto.k_08e9701e', t('admin.auto.k_08e9701e', 'Chưa có dữ liệu'))} </p>}
                                    </div>
                                </div>
                                {/* CF7.6 — Ký hiệu dễ nhầm nhất */}
                                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                                    <h3 className="font-bold text-slate-700 mb-3"> {t('admin.auto.k_b33484c7', t('admin.auto.k_b33484c7', 'Ký hiệu dễ nhầm nhất'))} </h3>
                                    <div className="space-y-2">
                                        {(contentStats.confusedPairs || []).map((pair, i) => (
                                            <div key={i} className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl">
                                                <span className="text-lg font-black text-amber-700">{pair.sign1} ↔ {pair.sign2}</span>
                                                <span className="text-sm font-bold text-amber-600">{pair.count} {t('admin.auto.k_times_unit', 'lần')}</span>
                                            </div>
                                        ))}
                                        {(!contentStats.confusedPairs || contentStats.confusedPairs.length === 0) && <p className="text-sm text-slate-400"> {t('admin.auto.k_08e9701e', 'Chưa có dữ liệu')} </p>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminStatistics;
