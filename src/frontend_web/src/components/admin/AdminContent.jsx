import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import { Plus, Edit2, Trash2, BookOpen, Type, MessageSquare, Search, X, RefreshCw, Filter, LibraryBig } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = 'http://localhost:5000/api/admin/content';

const TYPE_MAP = { letters: 'letter', words: 'word', sentences: 'sentence' };

// Tất cả topics khớp với VOCABULARY_BY_TOPIC + SENTENCES_BY_TOPIC
const ALL_TOPICS = [
    'Greeting','Family','Food','Colors','Animal',
    'Numbers','Time','Body','Emotion','Actions','Place','School','Job','Weather',
    'Clothes','Technology','Sport','Music','Nature','Health','Travel','Shopping',
    'DailyRoutine','Months','Directions','Communication','Money','Movie','Hobby',
    'Feelings','Feelings2','Holiday','Internet','Transportation','Opposites','Misc',
];

const AdminContent = () => {
    const { t } = useLanguage();

    const TABS = [
        { key: 'letters',   label: t('admin.auto.k_758a7a73', 'Ký hiệu chữ cái'), icon: Type,          typeLabel: t('admin.auto.k_444a3acf', 'Chữ cái') },
        { key: 'words',     label: t('admin.auto.k_655c5664', 'Từ vựng'),          icon: BookOpen,      typeLabel: t('admin.auto.k_655c5664', 'Từ vựng') },
        { key: 'sentences', label: t('admin.auto.k_ac7b9f2f', 'Câu giao tiếp'),    icon: MessageSquare, typeLabel: t('admin.auto.k_4f832593', 'Câu') }
    ];

    const [activeTab, setActiveTab]   = useState('letters');
    const [items, setItems]           = useState([]);
    const [total, setTotal]           = useState(0);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    const [filterTopic, setFilterTopic] = useState('');
    const [showAdd, setShowAdd]       = useState(false);
    const [editing, setEditing]       = useState(null);
    const [form, setForm]             = useState({ label: '', meaning: '', topic: '' });

    const token   = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await axios.get(API, {
                headers,
                params: { type: TYPE_MAP[activeTab], search, topic: filterTopic, limit: 500 }
            });
            setItems(res.data.items || []);
            setTotal(res.data.pagination?.total || 0);
        } catch {
            setItems([]); setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, [activeTab, search, filterTopic]);

    const resetForm = () => setForm({ label: '', meaning: '', topic: '' });

    const handleAdd = async () => {
        if (!form.label.trim()) { toast.error(t('admin.auto.k_054b6920', 'Vui lòng nhập nội dung!')); return; }
        try {
            await axios.post(API, {
                type: TYPE_MAP[activeTab], label: form.label.trim(),
                meaning: form.meaning, topic: form.topic
            }, { headers });
            toast.success(t('admin.auto.k_76e500b3', 'Đã thêm mới!'));
            setShowAdd(false); resetForm(); fetchItems();
        } catch (err) { toast.error(err.response?.data?.message || t('admin.auto.k_33a5e01f', 'Thao tác thất bại!')); }
    };

    const handleUpdate = async () => {
        if (!form.label.trim()) { toast.error(t('admin.auto.k_054b6920', 'Vui lòng nhập nội dung!')); return; }
        try {
            await axios.put(`${API}/${editing._id}`, {
                label: form.label.trim(), meaning: form.meaning, topic: form.topic
            }, { headers });
            toast.success(t('admin.auto.k_5e02bf47', 'Đã cập nhật!'));
            setEditing(null); resetForm(); fetchItems();
        } catch (err) { toast.error(err.response?.data?.message || t('admin.auto.k_33a5e01f', 'Thao tác thất bại!')); }
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`${t('admin.auto.k_delete_confirm', 'Delete')} "${item.label}"?`)) return;
        try {
            await axios.delete(`${API}/${item._id}`, { headers });
            toast.success(t('admin.auto.k_3cf74d5f', 'Đã xóa!')); fetchItems();
        } catch { toast.error(t('admin.auto.k_33a5e01f', 'Thao tác thất bại!')); }
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({ label: item.label, meaning: item.meaning || item.description || '', topic: item.topic || '' });
        setShowAdd(true);
    };

    // Group items by topic for words & sentences
    const groupedItems = () => {
        if (activeTab === 'letters') return null;
        const groups = {};
        for (const item of items) {
            const t = item.topic || t('admin.auto.k_06c1f85a', 'Khác');
            if (!groups[t]) groups[t] = [];
            groups[t].push(item);
        }
        return groups;
    };

    const currentTab = TABS.find(t => t.key === activeTab);
    const groups = groupedItems();

    // Topic badge colors
    const topicColor = (topic) => {
        const colors = ['bg-blue-100 text-blue-700','bg-green-100 text-green-700',
            'bg-yellow-100 text-yellow-700','bg-purple-100 text-purple-700',
            'bg-pink-100 text-pink-700','bg-orange-100 text-orange-700',
            'bg-teal-100 text-teal-700','bg-red-100 text-red-700'];
        let hash = 0;
        for (let i = 0; i < topic.length; i++) hash = topic.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <AdminLayout>
            <div className="space-y-5">
                {/* ── Hero Banner ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-500 p-5 shadow-xl">
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-300/20 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-yellow-300/15 rounded-full blur-[50px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    <LibraryBig size={16} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight"> {t('admin.auto.k_51e333ff', t('admin.auto.k_51e333ff', 'Ngân hàng câu hỏi'))} </h1>
                            </div>
                            <p className="text-yellow-100 text-sm"> {t('admin.auto.k_d481fcbb', t('admin.auto.k_d481fcbb', 'Quản lý bộ ký hiệu ASL phục vụ luyện tập, bài tập và kiểm tra'))} </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {[
                                    { label: t('admin.auto.k_4a1d94a6', 'Tổng nội dung'), val: total },
                                    { label: t('admin.auto.k_538aca65', 'Tab hiện tại'), val: currentTab?.label },
                                ].map((p, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs text-white font-medium">
                                        <span>{p.label}:</span><span className="font-bold">{p.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={fetchItems} className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all">
                                <RefreshCw size={16} />
                            </button>
                            <button onClick={() => { setEditing(null); resetForm(); setShowAdd(true); }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white text-orange-700 text-sm font-bold rounded-xl hover:bg-orange-50 transition-all shadow-lg">
                                <Plus size={15} /> {t('admin.auto.k_77f6903f', t('admin.auto.k_77f6903f', 'Thêm mới'))} </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(''); setFilterTopic(''); }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    activeTab === tab.key ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                                }`}>
                                <Icon size={14} />{tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                            placeholder={`${t('admin.auto.k_search_verb', 'Search')} ${currentTab?.label.toLowerCase()}...`}
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    {activeTab !== 'letters' && (
                        <div className="flex items-center gap-2">
                            <Filter size={14} className="text-slate-400" />
                            <select className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                value={filterTopic} onChange={e => setFilterTopic(e.target.value)}>
                                <option value=""> {t('admin.auto.k_77adad18', t('admin.auto.k_77adad18', 'Tất cả chủ đề'))} </option>
                                {ALL_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {/* Stats bar */}
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="font-semibold text-slate-700">{total}</span> {t('admin.auto.k_da595a8c', 'items')}
                    {filterTopic && <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold">#{filterTopic}</span>}
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-16 text-slate-400"> {t('admin.auto.k_08e9701e', t('admin.auto.k_08e9701e', 'Chưa có dữ liệu'))} </div>
                    ) : activeTab === 'letters' ? (
                        /* Letters: grid card */
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 p-4">
                            {items.map(item => (
                                <div key={item._id}
                                    className="group relative bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-200 rounded-xl p-3 transition-all text-center">
                                    <div className="text-3xl font-black text-slate-800 mb-1">{item.label}</div>
                                    <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">{item.meaning}</p>
                                    <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-1">
                                        <button onClick={() => openEdit(item)} className="p-1 bg-white rounded-lg shadow-sm hover:bg-blue-50 text-blue-500"><Edit2 size={10} /></button>
                                        <button onClick={() => handleDelete(item)} className="p-1 bg-white rounded-lg shadow-sm hover:bg-red-50 text-red-500"><Trash2 size={10} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filterTopic ? (
                        /* Filtered by topic: flat table */
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 w-1/3">
                                        {activeTab === 'words' ? t('admin.auto.k_0cdc2c70', 'Từ') : t('admin.auto.k_4f832593', 'Câu')}
                                    </th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600"> {t('admin.auto.k_86cf6119', t('admin.auto.k_86cf6119', 'Nghĩa tiếng Việt'))} </th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 w-24"> {t('admin.auto.k_71d52075', t('admin.auto.k_71d52075', 'Thao tác'))} </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map(item => (
                                    <tr key={item._id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2.5 font-bold text-slate-800">{item.label}</td>
                                        <td className="px-4 py-2.5 text-slate-500">{item.meaning || item.description}</td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex gap-1">
                                                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Edit2 size={13} /></button>
                                                <button onClick={() => handleDelete(item)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={13} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        /* All topics: grouped sections */
                        <div className="divide-y divide-slate-100">
                            {Object.entries(groups || {}).map(([topic, topicItems]) => (
                                <div key={topic}>
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${topicColor(topic)}`}>{topic}</span>
                                        <span className="text-xs text-slate-400">{topicItems.length} {t('admin.auto.k_da595a8c', 'items')}</span>
                                    </div>
                                    <div className="px-4 pb-3 pt-1 flex flex-wrap gap-2">
                                        {topicItems.map(item => (
                                            <div key={item._id}
                                                className="group relative flex items-center gap-2 bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50 rounded-lg px-3 py-1.5 transition-all">
                                                <span className="font-bold text-slate-800 text-sm">{item.label}</span>
                                                {(item.meaning || item.description) && (
                                                    <span className="text-xs text-slate-400">{item.meaning || item.description}</span>
                                                )}
                                                <div className="hidden group-hover:flex gap-0.5 ml-1">
                                                    <button onClick={() => openEdit(item)} className="p-1 rounded hover:bg-blue-50 text-blue-400"><Edit2 size={11} /></button>
                                                    <button onClick={() => handleDelete(item)} className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 size={11} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal thêm / sửa */}
            {showAdd && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
                    onClick={() => { setShowAdd(false); setEditing(null); resetForm(); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-black text-slate-800">
                                {editing
                                    ? `${t('admin.auto.k_edit_verb', 'Edit')} ${currentTab?.typeLabel}`
                                    : `${t('admin.auto.k_add_verb', 'Add')} ${currentTab?.typeLabel}`}
                            </h2>
                            <button onClick={() => { setShowAdd(false); setEditing(null); resetForm(); }}
                                className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{currentTab?.typeLabel} *</label>
                                <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                    placeholder={`${t('admin.auto.k_enter_verb', 'Enter')} ${currentTab?.typeLabel?.toLowerCase()}...`}
                                    value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1"> {t('admin.auto.k_86cf6119', t('admin.auto.k_86cf6119', 'Nghĩa tiếng Việt'))} </label>
                                <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                    placeholder={t('admin.auto.k_f07cb6f4', t('admin.auto.k_f07cb6f4', 'Nhập nghĩa tiếng Việt...'))}
                                    value={form.meaning} onChange={e => setForm({ ...form, meaning: e.target.value })} />
                            </div>
                            {activeTab !== 'letters' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1"> {t('admin.auto.k_85be380e', t('admin.auto.k_85be380e', 'Chủ đề (Topic)'))} </label>
                                    <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                        value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })}>
                                        <option value=""> {t('admin.auto.k_d0f85c71', t('admin.auto.k_d0f85c71', '-- Chọn chủ đề --'))} </option>
                                        {ALL_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 mt-5">
                            <button onClick={() => { setShowAdd(false); setEditing(null); resetForm(); }}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold"> {t('admin.auto.k_1e405035', t('admin.auto.k_1e405035', 'Hủy'))} </button>
                            <button onClick={editing ? handleUpdate : handleAdd}
                                className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700">
                                {editing ? t('admin.auto.k_3b7db4b6', 'Cập nhật') : t('admin.auto.k_d9cb420e', 'Thêm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminContent;
