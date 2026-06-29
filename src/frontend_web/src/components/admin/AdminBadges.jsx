import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import {
    Award, Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
    Shield, Trophy, Star, Users, AlertCircle, CheckCircle,
    RefreshCw, X, Search, LayoutGrid, List, Hash,
    Sparkles, Gift, Check, MoreHorizontal, Filter,
    TrendingUp, ChevronRight, Layers, Clock, Target,
    Flame, BookOpen, ClipboardList, Zap, Crown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = 'http://localhost:5000/api/admin/badges';

/* ─────────────────── constants ─────────────────── */
const getRarity = (t) => ({
    common:    { label:t('admin.auto.k_c10b85d1', 'Common'),      emoji:'🔴', solidColor:'#ef4444', solidBg:'#fee2e2', border:'rgba(239,68,68,0.35)',   glow:'rgba(239,68,68,0.2)',  gradient:'from-red-400 to-rose-500',     stars:1 },
    uncommon:  { label:t('admin.auto.k_6b83a47e', 'Uncommon'),    emoji:'🟢', solidColor:'#22c55e', solidBg:'#dcfce7', border:'rgba(34,197,94,0.35)',   glow:'rgba(34,197,94,0.2)',  gradient:'from-green-400 to-emerald-500',stars:2 },
    rare:      { label:t('admin.auto.k_c843c11c', 'Rare'),         emoji:'🔵', solidColor:'#3b82f6', solidBg:'#dbeafe', border:'rgba(59,130,246,0.35)',  glow:'rgba(59,130,246,0.2)', gradient:'from-blue-400 to-indigo-500',  stars:3 },
    epic:      { label:t('admin.auto.k_2cba0182', 'Epic'),         emoji:'🟠', solidColor:'#f97316', solidBg:'#ffedd5', border:'rgba(249,115,22,0.4)',   glow:'rgba(249,115,22,0.2)', gradient:'from-orange-400 to-orange-500',stars:4 },
    legendary: { label:t('admin.auto.k_b861598f', 'Legendary'),   emoji:'🟡', solidColor:'#eab308', solidBg:'#fef9c3', border:'rgba(234,179,8,0.45)',   glow:'rgba(234,179,8,0.25)', gradient:'from-yellow-400 to-amber-400', stars:5 },
});
const RARITY_ORDER = ['common','uncommon','rare','epic','legendary'];

/* ─── Condition types — khớp với enum trong Badge model ─────────────────── */
const getConditionTypes = (t) => [
    { value:'first_submission',      label:t('admin.auto.k_dcff3b37', 'First submission'),          icon:'📝' },
    { value:'score_100',             label:t('admin.auto.k_88497d57', 'Score 100 points'),           icon:'💯' },
    { value:'streak_3',              label:t('admin.auto.k_87fe92c6', '3-day streak'),               icon:'🔥' },
    { value:'streak_7',              label:t('admin.auto.k_a47a01ef', '7-day streak'),               icon:'🔥' },
    { value:'streak_14',             label:t('admin.auto.k_52f02ef0', '14-day streak'),              icon:'🔥' },
    { value:'streak_30',             label:t('admin.auto.k_31f56bf3', '30-day streak'),              icon:'🔥' },
    { value:'streak_60',             label:t('admin.auto.k_fcd1af1a', '60-day streak'),              icon:'🔥' },
    { value:'practice_count',        label:t('admin.auto.k_bfe8aa58', 'Practice count'),             icon:'💪' },
    { value:'accuracy_95',           label:t('admin.auto.k_7d6b41c6', 'Accuracy ≥ 95%'),             icon:'🎯' },
    { value:'accuracy_100_once',     label:t('admin.auto.k_77fa6a85', '100% accuracy'),              icon:'🎯' },
    { value:'average_score_70',      label:t('admin.auto.k_c58fc85e', 'Avg score ≥ 70'),             icon:'📈' },
    { value:'average_score_80',      label:t('admin.auto.k_85f0eb41', 'Avg score ≥ 80'),             icon:'📈' },
    { value:'average_score_90',      label:t('admin.auto.k_6ad92e3d', 'Avg score ≥ 90'),             icon:'📈' },
    { value:'average_score_95',      label:t('admin.auto.k_0af1b375', 'Avg score ≥ 95'),             icon:'📈' },
    { value:'assignments_completed', label:t('admin.auto.k_d600e988', 'Assignments completed'),      icon:'✅' },
    { value:'exams_taken',           label:t('admin.auto.k_657bf155', 'Exams taken'),                icon:'📋' },
    { value:'perfect_streak_5',      label:t('admin.auto.k_14d3eace', '5 consecutive 100'),          icon:'🏆' },
    { value:'perfect_streak_10',     label:t('admin.auto.k_37d333d3', '10 consecutive 100'),         icon:'🏆' },
    { value:'time_bonus',            label:t('admin.auto.k_b5ad724b', 'Quick completion'),           icon:'⚡' },
    { value:'custom',                label:t('admin.auto.k_ebba3144', 'Custom'),                     icon:'⚙️' },
];

/* Hàm lấy label từ conditionType + conditionValue */
const getConditionLabel = (t, conditionType, conditionValue, lang = 'vi') => {
    const CONDITION_TYPES = getConditionTypes(t);
    const found = CONDITION_TYPES.find(c => c.value === conditionType);
    if (!found) return conditionType || '—';
    // Enrich với value cho các type có ý nghĩa với số
    if (conditionType === 'practice_count')
        return lang === 'vi' ? `${conditionValue} buổi luyện tập` : `${conditionValue} practice sessions`;
    if (conditionType === 'assignments_completed')
        return lang === 'vi' ? `${conditionValue} bài tập` : `${conditionValue} assignments`;
    if (conditionType === 'exams_taken')
        return lang === 'vi' ? `${conditionValue} bài kiểm tra` : `${conditionValue} exams`;
    return found.label;
};
const getConditionIcon = (t, conditionType) =>
    getConditionTypes(t).find(c => c.value === conditionType)?.icon || '⚙️';

const EMOJI_QUICK = ['🏆','🥇','🌟','⭐','🔥','💎','👑','🎯','⚡','🚀','💡','📚','🎓','🏅','💪','🎖','🌈','✨','💫','🔮'];

/* StarRow removed — stars were misread as difficulty indicator */

/* ─────────────────── RarityBadge chip ─────────────────── */
const RarityChip = ({ rarity }) => {
    const { t } = useLanguage();
    const RARITY = getRarity(t);
    const r = RARITY[rarity] || RARITY.common;
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full"
            style={{ background:r.solidBg, color:r.solidColor, border:`1px solid ${r.border}` }}>
            <span>{r.emoji}</span>{r.label}
        </span>
    );
};

/* ─────────────────── Badge Card ─────────────────── */
const BadgeCard = ({ badge, onEdit, onDelete, onToggle }) => {
    const { t, lang } = useLanguage();
    const RARITY = getRarity(t);
    const r = RARITY[badge.rarity] || RARITY.common;
    const [menu, setMenu] = useState(false);
    const menuRef = useRef(null);
    useEffect(()=>{
        const h = (e) => { if(menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
        document.addEventListener('mousedown', h);
        return ()=>document.removeEventListener('mousedown', h);
    },[]);

    const inactive = badge.isActive === false;
    return (
        <div className="group relative bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-300
            hover:shadow-xl hover:-translate-y-1.5"
            style={{
                borderTop: `3px solid ${inactive ? '#94a3b8' : r.solidColor}`,
                border: `1px solid ${inactive ? '#e2e8f0' : r.border}`,
                borderTopWidth: '3px',
                opacity: inactive ? 0.65 : 1,
                boxShadow: inactive ? 'none' : `0 2px 8px ${r.glow}`
            }}>

            {/* System chip */}
            {badge.isSystem && (
                <div className="absolute top-3 left-3 z-10">
                    <span className="flex items-center gap-1 text-[9px] font-bold bg-slate-800/80 text-white px-1.5 py-0.5 rounded-full">
                        <Shield className="w-2 h-2" />HT
                    </span>
                </div>
            )}

            {/* Inactive chip */}
            {inactive && (
                <div className="absolute top-3 left-3 z-10">
                    <span className="flex items-center gap-1 text-[9px] font-bold bg-slate-400/90 text-white px-1.5 py-0.5 rounded-full">
                        <AlertCircle className="w-2 h-2" /> {t('admin.auto.k_258f00b2', t('admin.auto.k_258f00b2', 'Tắt'))} </span>
                </div>
            )}

            {/* 3-dot menu */}
            <div ref={menuRef} className="absolute top-3 right-3 z-10">
                <button onClick={()=>setMenu(v=>!v)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/90
                        border border-slate-200 opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-slate-100">
                    <MoreHorizontal className="w-4 h-4 text-slate-500" />
                </button>
                {menu && (
                    <div className="absolute right-0 top-9 w-44 bg-white rounded-xl border border-slate-100 shadow-xl z-20 overflow-hidden text-sm">
                        <button onClick={()=>{onToggle(badge);setMenu(false);}}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 font-medium transition-colors
                                ${inactive ? 'hover:bg-emerald-50 text-emerald-700' : 'hover:bg-amber-50 text-amber-700'}`}>
                            {inactive ? <><ToggleLeft className="w-3.5 h-3.5"/> {t('admin.auto.k_a9151d10', t('admin.auto.k_a9151d10', 'Kích hoạt'))} </> : <><ToggleRight className="w-3.5 h-3.5"/> {t('admin.auto.k_86086677', t('admin.auto.k_86086677', 'Vô hiệu hóa'))} </>}
                        </button>
                        {!badge.isSystem && (
                            <>
                                <div className="h-px bg-slate-100 mx-3"/>
                                <button onClick={()=>{onEdit(badge);setMenu(false);}}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-blue-50 text-blue-700 font-medium">
                                    <Edit2 className="w-3.5 h-3.5"/> {t('admin.auto.k_e1504e01', t('admin.auto.k_e1504e01', 'Chỉnh sửa'))} </button>
                                <div className="h-px bg-slate-100 mx-3"/>
                                <button onClick={()=>{onDelete(badge);setMenu(false);}}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-red-50 text-red-600 font-medium">
                                    <Trash2 className="w-3.5 h-3.5"/> {t('admin.auto.k_4ed187a8', t('admin.auto.k_4ed187a8', 'Xóa'))} </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Visual area */}
            <div className="flex flex-col items-center px-4 pt-8 pb-3"
                style={{ background:`linear-gradient(160deg, ${r.solidBg} 0%, #fff 65%)` }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2.5 shadow-md"
                    style={{
                        background:`linear-gradient(135deg, white, ${r.solidBg})`,
                        border:`2px solid ${r.border}`,
                        boxShadow:`0 6px 20px ${r.glow}`
                    }}>
                    <span className="text-3xl leading-none select-none">{badge.emoji || '🏆'}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-center text-[12px] leading-tight mt-2 mb-1.5 line-clamp-2 w-full px-1"
                    title={badge.name?.vi}>
                    {(lang === 'en' ? badge.name?.en : badge.name?.vi) || badge.name?.vi || badge.name}
                </h3>
                <RarityChip rarity={badge.rarity} />
            </div>

            {/* Description */}
            <div className="px-3 py-2 border-t border-slate-50 flex-1">
                <p className="text-[10px] text-slate-400 text-center line-clamp-2 leading-relaxed min-h-[2rem]">
                    {(lang === 'en' ? badge.description?.en : badge.description?.vi) 
                        || badge.description?.vi 
                        || badge.description 
                        || <span className="italic text-slate-300"> {t('admin.auto.k_fa50c1ca', t('admin.auto.k_fa50c1ca', 'Chưa có mô tả'))} </span>}
                </p>
            </div>

            {/* Condition tag — hiển thị label đẹp thay vì raw conditionType */}
            {badge.conditionType && badge.conditionType !== 'custom' && (
                <div className="px-3 pb-2">
                    <div className="flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[11px]">{getConditionIcon(t, badge.conditionType)}</span>
                        <span className="text-[10px] font-semibold text-slate-500 truncate">
                            {getConditionLabel(t, badge.conditionType, badge.conditionValue, lang)}
                        </span>
                    </div>
                </div>
            )}

            {/* Status + toggle */}
            <div className="px-3 pb-3 flex items-center justify-between gap-2">
                <span className={`flex items-center gap-1 text-[10px] font-semibold
                    ${inactive ? 'text-slate-400' : 'text-emerald-600'}`}>
                    {inactive
                        ? <><AlertCircle className="w-3 h-3"/> {t('admin.auto.k_094177bf', t('admin.auto.k_094177bf', 'Vô hiệu'))} </>
                        : <><CheckCircle className="w-3 h-3"/> {t('admin.auto.k_2c21bcd9', t('admin.auto.k_2c21bcd9', 'Hoạt động'))} </>}
                </span>
                <button onClick={()=>onToggle(badge)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors
                        ${inactive
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'}`}>
                    {inactive ? <><ToggleLeft className="w-3 h-3"/> {t('admin.auto.k_9eae5130', t('admin.auto.k_9eae5130', 'Bật'))} </> : <><ToggleRight className="w-3 h-3"/> {t('admin.auto.k_258f00b2', t('admin.auto.k_258f00b2', 'Tắt'))} </>}
                </button>
            </div>
        </div>
    );
};

/* ─────────────────── Create/Edit Modal ─────────────────── */
const BadgeModal = ({ open, onClose, editBadge, onSave }) => {
    const { t, lang } = useLanguage();
    const EMPTY = { nameVi:'', nameEn:'', descVi:'', descEn:'', emoji:'🏆',
        conditionType:'assignments_completed', conditionValue:1,
        rarity:'common', color:'#3B82F6', bgColor:'bg-blue-100', borderColor:'border-blue-300' };
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);

    useEffect(()=>{
        if(editBadge){
            setForm({
                nameVi: editBadge.name?.vi||'', nameEn: editBadge.name?.en||'',
                descVi: editBadge.description?.vi||'', descEn: editBadge.description?.en||'',
                emoji: editBadge.emoji||'🏆',
                conditionType: editBadge.conditionType||'assignments_completed',
                conditionValue: editBadge.conditionValue||1,
                rarity: editBadge.rarity||'common',
                color: editBadge.color||'#3B82F6',
                bgColor: editBadge.bgColor||'bg-blue-100',
                borderColor: editBadge.borderColor||'border-blue-300'
            });
        } else { setForm(EMPTY); }
    },[editBadge, open]);

    const handleSave = async () => {
        if(!form.nameVi||!form.nameEn){ toast.error(t('admin.auto.k_d8becd48', 'Tên tiếng Việt và tiếng Anh là bắt buộc!')); return; }
        setSaving(true);
        await onSave(form);
        setSaving(false);
    };

    if(!open) return null;
    const RARITY = getRarity(t);
    const r = RARITY[form.rarity] || RARITY.common;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
                onClick={e=>e.stopPropagation()}>

                {/* Header */}
                <div className="sticky top-0 bg-white z-10 px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: editBadge ? '#dbeafe' : 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                            {editBadge ? <Edit2 className="w-4 h-4 text-blue-600"/> : <Plus className="w-4 h-4 text-white"/>}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">{editBadge ? t('admin.auto.k_fb6bf48d', 'Chỉnh sửa huy hiệu') : t('admin.auto.k_c8f08a2a', 'Tạo huy hiệu mới')}</h2>
                            <p className="text-xs text-slate-400">{editBadge ? t('admin.auto.k_e22e9fb7', 'Cập nhật thông tin') : t('admin.auto.k_c12138cb', 'Điền thông tin bên dưới')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Live preview */}
                    <div className="flex justify-center">
                        <div className="w-32 rounded-2xl overflow-hidden border-2 shadow-lg transition-all"
                            style={{ background:`linear-gradient(160deg, ${r.solidBg} 0%, #fff 60%)`,
                                borderColor: r.solidColor, boxShadow:`0 6px 24px ${r.glow}` }}>
                            <div className={`h-1 w-full bg-gradient-to-r ${r.gradient}`}/>
                            <div className="flex flex-col items-center px-3 pt-4 pb-3">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
                                    style={{ background:`linear-gradient(135deg, white, ${r.solidBg})`, border:`2px solid ${r.border}` }}>
                                    <span className="text-2xl">{form.emoji||'🏆'}</span>
                                </div>
                                <p className="text-[11px] font-bold text-center mt-2.5 text-slate-800 line-clamp-2 leading-tight">
                                    {(lang === 'en' ? form.nameEn : form.nameVi) || form.nameVi || t('admin.auto.k_95cf03a8', 'Tên huy hiệu')}
                                </p>
                                <div className="mt-1"><RarityChip rarity={form.rarity}/></div>
                            </div>
                        </div>
                    </div>

                    {/* Emoji quick-pick */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest"> {t('admin.auto.k_1be6e103', t('admin.auto.k_1be6e103', 'Biểu tượng'))} </label>
                        <div className="flex gap-1 flex-wrap mb-2">
                            {EMOJI_QUICK.map(em=>(
                                <button key={em} onClick={()=>setForm(f=>({...f,emoji:em}))}
                                    className={`text-xl p-1.5 rounded-lg transition-all hover:bg-slate-100 hover:scale-110 ${form.emoji===em?'bg-violet-50 ring-2 ring-violet-300 scale-110':''}`}>
                                    {em}
                                </button>
                            ))}
                        </div>
                        <input value={form.emoji} onChange={e=>setForm(f=>({...f,emoji:e.target.value}))}
                            className="w-20 px-3 py-2 border-2 border-slate-200 rounded-xl text-xl text-center
                                focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"/>
                    </div>

                    {/* Rarity */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest"> {t('admin.auto.k_c0aa703d', t('admin.auto.k_c0aa703d', 'Độ hiếm'))} </label>
                        <div className="grid grid-cols-5 gap-2">
                            {RARITY_ORDER.map(rv=>{
                                const RARITY = getRarity(t);
                                const rc = RARITY[rv];
                                const active = form.rarity===rv;
                                return(
                                    <button key={rv} onClick={()=>setForm(f=>({...f,rarity:rv}))}
                                        className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl border-2 transition-all text-xs font-bold"
                                        style={active
                                            ? {background:rc.solidBg, borderColor:rc.solidColor, color:rc.solidColor, boxShadow:`0 2px 8px ${rc.glow}`}
                                            : {background:'#f8fafc', borderColor:'#e2e8f0', color:'#64748b'}}>
                                        <span className="text-base">{rc.emoji}</span>
                                        <span className="text-[9px]">{rc.label}</span>
                                        {active && <Check className="w-3 h-3"/>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Name fields */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest"> {t('admin.auto.k_7e92e369', t('admin.auto.k_7e92e369', 'Tên (Việt) *'))} </label>
                            <input value={form.nameVi} onChange={e=>setForm(f=>({...f,nameVi:e.target.value}))}
                                placeholder={t('admin.auto.k_86eded13', t('admin.auto.k_86eded13', 'VD: Học Viên Chăm Chỉ'))}
                                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm
                                    focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"/>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest"> {t('admin.auto.k_3ebc86b7', t('admin.auto.k_3ebc86b7', 'Tên (English) *'))} </label>
                            <input value={form.nameEn} onChange={e=>setForm(f=>({...f,nameEn:e.target.value}))}
                                placeholder="VD: Diligent Student"
                                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm
                                    focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"/>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest"> {t('admin.auto.k_294e8d44', t('admin.auto.k_294e8d44', 'Mô tả (Việt)'))} </label>
                            <textarea value={form.descVi} onChange={e=>setForm(f=>({...f,descVi:e.target.value}))}
                                placeholder={t('admin.auto.k_6e89f3d7', t('admin.auto.k_6e89f3d7', 'Mô tả điều kiện...'))}
                                className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm resize-none
                                    focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none" rows={2}/>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest"> {t('admin.auto.k_5c13acbf', t('admin.auto.k_5c13acbf', 'Mô tả (English)'))} </label>
                            <textarea value={form.descEn} onChange={e=>setForm(f=>({...f,descEn:e.target.value}))}
                                placeholder="Describe the condition..."
                                className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm resize-none
                                    focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none" rows={2}/>
                        </div>
                    </div>

                    {/* Condition */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                        <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest"> {t('admin.auto.k_bb74291f', 'Điều kiện đạt huy hiệu')} </h3>
                        <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5"> {t('admin.auto.k_1320d1de', t('admin.auto.k_1320d1de', 'Loại điều kiện'))} </label>
                            <select value={form.conditionType} onChange={e=>setForm(f=>({...f,conditionType:e.target.value}))}
                                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm bg-white
                                    focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none">
                                {getConditionTypes(t).map(c=>(
                                    <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5"> {t('admin.auto.k_491e1622', t('admin.auto.k_491e1622', 'Giá trị ngưỡng'))} </label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                                <input type="number" min="0" value={form.conditionValue}
                                    onChange={e=>setForm(f=>({...f,conditionValue:parseInt(e.target.value)||0}))}
                                    className="w-full pl-9 pr-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm
                                        focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none bg-white"/>
                            </div>
                        </div>
                        {/* Preview condition label */}
                        {form.conditionType && form.conditionType !== 'custom' && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200">
                                <span className="text-base">{getConditionIcon(t, form.conditionType)}</span>
                                <span className="text-xs font-semibold text-slate-600">
                                    {getConditionLabel(t, form.conditionType, form.conditionValue, lang)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3 rounded-b-2xl">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors border border-slate-200"> {t('admin.auto.k_1e405035', t('admin.auto.k_1e405035', 'Hủy'))} </button>
                    <button onClick={handleSave} disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold
                            bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl
                            hover:from-violet-700 hover:to-purple-700 transition-all shadow-md shadow-violet-500/25
                            disabled:opacity-60 disabled:cursor-not-allowed">
                        {saving
                            ? <><RefreshCw className="w-4 h-4 animate-spin"/> {t('admin.auto.k_4d30b6f8', t('admin.auto.k_4d30b6f8', 'Đang lưu...'))} </>
                            : <><Check className="w-4 h-4"/>{editBadge?t('admin.auto.k_0dc3cc51', 'Lưu thay đổi'):t('admin.auto.k_77245774', 'Tạo huy hiệu')}</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────── Main Page ─────────────────── */
const AdminBadges = () => {
    const { t, lang } = useLanguage();
    const [badges, setBadges]           = useState([]);
    const [achievements, setAchievements] = useState(null);
    const [loading, setLoading]         = useState(true);
    const [activeTab, setActiveTab]     = useState('all');
    const [filterRarity, setFilterRarity] = useState('');
    const [searchTerm, setSearchTerm]   = useState('');
    const [showModal, setShowModal]     = useState(false);
    const [editBadge, setEditBadge]     = useState(null);

    const token = localStorage.getItem('token');
    const headers = { Authorization:`Bearer ${token}` };

    const fetchBadges = async () => {
        setLoading(true);
        try {
            const params = { limit:100 };
            if(filterRarity) params.rarity = filterRarity;
            if(activeTab==='system') params.isSystem = 'true';
            if(activeTab==='custom') params.isSystem = 'false';
            const [badgesRes, achRes] = await Promise.all([
                axios.get(API, { headers, params }),
                axios.get(`${API}/achievements`, { headers })
            ]);
            setBadges(badgesRes.data.badges||[]);
            setAchievements(achRes.data);
        } catch { toast.error(t('admin.auto.k_df9a0146', 'Không thể tải dữ liệu huy hiệu!')); }
        finally { setLoading(false); }
    };

    useEffect(()=>{ fetchBadges(); },[activeTab, filterRarity]);

    const openCreate = () => { setEditBadge(null); setShowModal(true); };
    const openEdit   = (badge) => { setEditBadge(badge); setShowModal(true); };

    const handleSave = async (form) => {
        try {
            if(editBadge){
                await axios.put(`${API}/${editBadge._id}`, form, { headers });
                toast.success(t('admin.auto.k_ca6c8523', 'Đã cập nhật huy hiệu!'));
            } else {
                await axios.post(API, form, { headers });
                toast.success(t('admin.auto.k_a035a2b3', 'Đã tạo huy hiệu mới!'));
            }
            setShowModal(false);
            fetchBadges();
        } catch(err){ toast.error(err.response?.data?.message||t('admin.auto.k_33a5e01f', 'Thao tác thất bại!')); }
    };

    const handleToggle = async (badge) => {
        try {
            const res = await axios.put(`${API}/${badge._id}/toggle`, {}, { headers });
            toast.success(res.data.message);
            fetchBadges();
        } catch { toast.error(t('admin.auto.k_33a5e01f', 'Thao tác thất bại!')); }
    };

    const handleDelete = async (badge) => {
        const badgeDisplayName = lang === 'en'
            ? (badge.name?.en || badge.name?.vi || badge.name)
            : (badge.name?.vi || badge.name?.en || badge.name);
        const confirmMsg = t('admin.auto.k_confirm_delete_badge',
            lang === 'en'
                ? `Delete badge "${badgeDisplayName}"? This action cannot be undone!`
                : `Xóa huy hiệu "${badgeDisplayName}"? Hành động này không thể hoàn tác!`
        ).replace('{name}', badgeDisplayName);
        if(!window.confirm(confirmMsg)) return;
        try {
            await axios.delete(`${API}/${badge._id}`, { headers });
            toast.success(t('admin.auto.k_138e9e48', 'Đã xóa huy hiệu!'));
            fetchBadges();
        } catch(err){ toast.error(err.response?.data?.message||t('admin.auto.k_33a5e01f', 'Thao tác thất bại!')); }
    };

    /* Client-side search filter */
    const displayed = badges.filter(b=>{
        if(!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return b.name?.vi?.toLowerCase().includes(q) ||
            b.name?.en?.toLowerCase().includes(q) ||
            b.emoji?.includes(searchTerm);
    });

    const systemCount = badges.filter(b=>b.isSystem).length;
    const customCount = badges.filter(b=>!b.isSystem).length;
    const activeCount = badges.filter(b=>b.isActive!==false).length;

    return (
        <AdminLayout>
            <div className="space-y-6">

                {/* ── Hero Banner ── */}
                <div className="relative overflow-hidden rounded-2xl p-6"
                    style={{ background:'linear-gradient(135deg, #78350f 0%, #b45309 40%, #d97706 75%, #f59e0b 100%)',
                        boxShadow:'0 12px 40px rgba(180,83,9,0.35)' }}>
                    <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
                        style={{ backgroundImage:'radial-gradient(circle at 1px 1px,white 1px,transparent 0)', backgroundSize:'22px 22px' }}/>
                    <div className="absolute -top-16 -right-16 w-64 h-64 bg-yellow-300/20 rounded-full blur-3xl pointer-events-none"/>
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-amber-200/15 rounded-full blur-3xl pointer-events-none"/>
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-lg">
                                    <Award className="w-5 h-5 text-white"/>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-extrabold text-white tracking-tight leading-none"> {t('admin.auto.k_81c70f72', t('admin.auto.k_81c70f72', 'Huy Hiệu & Thành Tích'))} </h1>
                                    <p className="text-amber-200 text-xs mt-0.5"> {t('admin.auto.k_b3816f12', 'Quản lý hệ thống huy hiệu, thành tích và phần thưởng cho học viên')} </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {[
                                    { label:t('admin.auto.k_195075fe', 'Tổng'),       val:badges.length  },
                                    { label:t('admin.auto.k_09cbc7cd', 'Hệ thống'),   val:systemCount    },
                                    { label:t('admin.auto.k_ebba3144', 'Tùy chỉnh'),  val:customCount    },
                                    { label:t('admin.auto.k_f045a7e9', 'Đang bật'),   val:activeCount    },
                                    { label:t('admin.auto.k_3f83887b', 'Đã trao'),    val:achievements?.totalAwarded??0 },
                                ].map((p,i)=>(
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs text-white">
                                        <span className="text-amber-200">{p.label}:</span>
                                        <span className="font-bold">{p.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50"/>
                                <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                                    placeholder={t('admin.auto.k_822c6e76', 'Tìm huy hiệu...')}                                    className="pl-9 pr-4 py-2.5 bg-white/15 border border-white/25 rounded-xl text-white
                                        placeholder-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 w-44 transition-all"/>
                            </div>
                            <button onClick={fetchBadges}
                                className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all">
                                <RefreshCw className="w-4 h-4"/>
                            </button>
                            <button onClick={openCreate}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white text-amber-700 text-sm font-bold rounded-xl hover:bg-amber-50 transition-all shadow-lg shadow-black/20">
                                <Plus className="w-4 h-4"/> {t('admin.auto.k_77245774', 'Tạo huy hiệu')} </button>
                        </div>
                    </div>
                </div>

                {/* ── Achievement stats ── */}
                {achievements && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-200/60 p-4 flex items-center gap-3">
                            <div className="p-2.5 bg-amber-100 rounded-xl flex-shrink-0"><Trophy className="w-5 h-5 text-amber-600"/></div>
                            <div>
                                <p className="text-xs font-semibold text-amber-700"> {t('admin.auto.k_a0528943', 'Tổng huy hiệu đã trao')} </p>
                                <p className="text-2xl font-black text-amber-600">{achievements.totalAwarded??0}</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200/60 p-4 flex items-center gap-3">
                            <div className="p-2.5 bg-violet-100 rounded-xl flex-shrink-0"><Users className="w-5 h-5 text-violet-600"/></div>
                            <div>
                                <p className="text-xs font-semibold text-violet-700"> {t('admin.auto.k_8ae7e35c', 'Học viên đạt nhiều nhất')} </p>
                                <p className="text-sm font-bold text-violet-700 mt-0.5">
                                    {achievements.topStudents?.[0]?.student?.fullName||'—'}
                                    {achievements.topStudents?.[0] && (
                                        <span className="text-xs font-normal text-violet-500 ml-1">
                                            ({achievements.topStudents[0].count} {t('admin.auto.k_3f83887b', 'huy hiệu')})
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/60 p-4 flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-100 rounded-xl flex-shrink-0"><Star className="w-5 h-5 text-emerald-600"/></div>
                            <div>
                                <p className="text-xs font-semibold text-emerald-700"> {t('admin.auto.k_43bfc28a', 'Huy hiệu phổ biến nhất')} </p>
                                <p className="text-sm font-bold text-emerald-700 mt-0.5">
                                    {achievements.popularBadges?.[0]?.badge?.emoji}{' '}
                                    {lang === 'en'
                                        ? (achievements.popularBadges?.[0]?.badge?.name?.en || achievements.popularBadges?.[0]?.badge?.name?.vi || '—')
                                        : (achievements.popularBadges?.[0]?.badge?.name?.vi || achievements.popularBadges?.[0]?.badge?.name?.en || '—')}
                                    {achievements.popularBadges?.[0] && (
                                        <span className="text-xs font-normal text-emerald-500 ml-1">
                                            ({achievements.popularBadges[0].count} {t('admin.auto.k_lần', 'lần')})
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Tabs + Rarity filter ── */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                        {[
                            { key:'all',    label:`${t('admin.auto.k_195075fe', 'Tất cả')} (${badges.length})` },
                            { key:'system', label:`${t('admin.auto.k_09cbc7cd', 'Hệ thống')} (${systemCount})` },
                            { key:'custom', label:`${t('admin.auto.k_ebba3144', 'Tùy chỉnh')} (${customCount})` }
                        ].map(tab=>(
                            <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all
                                    ${activeTab===tab.key?'bg-white text-violet-700 shadow-sm':'text-slate-600 hover:text-slate-800'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <select value={filterRarity} onChange={e=>setFilterRarity(e.target.value)}
                        className="px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-semibold
                            focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400">
                        <option value=""> {t('admin.auto.k_d6b9e1a3', 'Tất cả độ hiếm')} </option>
                        {RARITY_ORDER.map(rv=>{
                            const RARITY = getRarity(t);
                            return (
                            <option key={rv} value={rv}>{RARITY[rv].emoji} {RARITY[rv].label}</option>
                        )})}
                    </select>
                    <span className="text-xs text-slate-400 ml-auto"> {t('admin.auto.k_7ef14c96', 'Hiển thị')} <span className="font-semibold text-slate-600">{displayed.length}</span> / {badges.length} {t('admin.auto.k_huy_hieu', 'huy hiệu')}
                    </span>
                </div>

                {/* ── Badge grid ── */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="relative w-12 h-12">
                            <div className="w-12 h-12 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin"/>
                            <div className="absolute inset-2 border-4 border-yellow-100 border-b-yellow-500 rounded-full animate-spin"
                                style={{animationDirection:'reverse',animationDuration:'0.8s'}}/>
                        </div>
                        <p className="text-sm text-slate-500"> {t('admin.auto.k_0f362210', 'Đang tải huy hiệu...')} </p>
                    </div>
                ) : displayed.length===0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Award className="w-8 h-8 text-slate-300"/>
                        </div>
                        <p className="text-slate-500 font-semibold"> {t('admin.auto.k_612ee375', 'Không có huy hiệu nào')} </p>
                        <p className="text-slate-400 text-sm mt-1"> {t('admin.auto.k_81a40520', 'Thử thay đổi bộ lọc hoặc tạo huy hiệu mới')} </p>
                        <button onClick={openCreate}
                            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm">
                            <Plus className="w-4 h-4"/> {t('admin.auto.k_fae2f8fc', 'Tạo huy hiệu đầu tiên')} </button>
                    </div>
                ) : (
                    /* Group by rarity */
                    <div className="space-y-8">
                        {RARITY_ORDER.map(rv=>{
                            const tier = displayed.filter(b=>b.rarity===rv);
                            if(tier.length===0) return null;
                            const RARITY = getRarity(t);
                            const rc = RARITY[rv];
                            return (
                                <div key={rv}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl border-2 font-semibold text-sm shadow-sm"
                                            style={{background:rc.solidBg, borderColor:rc.solidColor, color:rc.solidColor}}>
                                            <span>{rc.emoji}</span>{rc.label}
                                            <span className="ml-1 text-xs opacity-60">({tier.length})</span>
                                        </div>
                                        <div className="flex-1 h-px" style={{background:`linear-gradient(90deg,${rc.solidColor}44,transparent)`}}/>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                        {tier.map(badge=>(
                                            <BadgeCard key={badge._id} badge={badge}
                                                onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle}/>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <BadgeModal
                open={showModal}
                onClose={()=>setShowModal(false)}
                editBadge={editBadge}
                onSave={handleSave}
            />
        </AdminLayout>
    );
};

export default AdminBadges;
