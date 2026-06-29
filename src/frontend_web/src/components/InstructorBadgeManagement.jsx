import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Award, Edit3, Trash2, Users, Search, X, Star,
    Trophy, Flame, Target, Zap, Crown, BookOpen,
    GraduationCap, Sparkles, Shield, Gift, Plus,
    ChevronRight, Check, AlertCircle, Medal, LayoutGrid,
    List, Filter, RefreshCw, TrendingUp, Eye, Lock,
    CheckCircle2, XCircle, MoreHorizontal, ArrowUpRight,
    Layers, Hash, Calendar, Info, Rocket, Clock,
    Inbox, SlidersHorizontal, ChevronDown
} from 'lucide-react';
import InstructorLayout from './InstructorLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-hot-toast';

/* ─────────────────── constants ─────────────────── */
const RARITY_BASE = {
    common:    { emoji: '🔴', solidColor: '#ef4444', solidBg: '#fee2e2', ring: '#f87171', border: 'rgba(239,68,68,0.4)',   glow: 'rgba(239,68,68,0.25)',  gradient: 'from-red-400 to-rose-500',      stars: 1 },
    uncommon:  { emoji: '🟢', solidColor: '#22c55e', solidBg: '#dcfce7', ring: '#4ade80', border: 'rgba(34,197,94,0.4)',   glow: 'rgba(34,197,94,0.3)',   gradient: 'from-green-400 to-emerald-500', stars: 2 },
    rare:      { emoji: '🔵', solidColor: '#3b82f6', solidBg: '#dbeafe', ring: '#60a5fa', border: 'rgba(59,130,246,0.4)',  glow: 'rgba(59,130,246,0.3)',  gradient: 'from-blue-400 to-indigo-500',   stars: 3 },
    epic:      { emoji: '🟠', solidColor: '#f97316', solidBg: '#ffedd5', ring: '#fb923c', border: 'rgba(249,115,22,0.45)', glow: 'rgba(249,115,22,0.35)', gradient: 'from-orange-400 to-orange-500', stars: 4 },
    legendary: { emoji: '🟡', solidColor: '#eab308', solidBg: '#fef9c3', ring: '#facc15', border: 'rgba(234,179,8,0.5)',   glow: 'rgba(234,179,8,0.4)',   gradient: 'from-yellow-400 to-amber-400',  stars: 5 },
};
const RARITY_LABELS = {
    vi: { common: 'Cơ Bản', uncommon: 'Trung Cấp', rare: 'Nâng Cao', epic: 'Chuyên Sâu', legendary: 'Tinh Hoa' },
    en: { common: 'Basic',  uncommon: 'Intermediate', rare: 'Advanced', epic: 'Expert',   legendary: 'Elite'    },
};
const getRarity = (lang) => {
    const labels = RARITY_LABELS[lang] || RARITY_LABELS.vi;
    const result = {};
    Object.entries(RARITY_BASE).forEach(([k, v]) => { result[k] = { ...v, label: labels[k] }; });
    return result;
};
const RARITY_ORDER = ['common','uncommon','rare','epic','legendary'];

const CONDITION_LABELS = {
    vi: {
        first_submission: 'Nộp bài đầu tiên', score_100: 'Đạt 100 điểm', streak_7: 'Streak 7 ngày',
        streak_30: 'Streak 30 ngày', practice_count: 'Số lần luyện tập', accuracy_95: 'Độ chính xác ≥ 95%',
        average_score_90: 'Điểm TB ≥ 90%', assignments_completed: 'Số bài tập hoàn thành',
        exams_taken: 'Số bài kiểm tra đã làm', perfect_streak_5: '5 bài liên tiếp 100%',
        time_bonus: 'Hoàn thành nhanh', custom: 'Tùy chỉnh',
    },
    en: {
        first_submission: 'First Submission', score_100: 'Score 100', streak_7: '7-day Streak',
        streak_30: '30-day Streak', practice_count: 'Practice Count', accuracy_95: 'Accuracy ≥ 95%',
        average_score_90: 'Avg Score ≥ 90%', assignments_completed: 'Assignments Completed',
        exams_taken: 'Exams Taken', perfect_streak_5: '5 Perfect Streak',
        time_bonus: 'Fast Completion', custom: 'Custom',
    },
};
const getConditionTypes = (lang) => {
    const lbl = CONDITION_LABELS[lang] || CONDITION_LABELS.vi;
    return [
        { value:'first_submission',     label: lbl.first_submission,     icon:'📝' },
        { value:'score_100',            label: lbl.score_100,            icon:'💯' },
        { value:'streak_7',             label: lbl.streak_7,             icon:'🔥' },
        { value:'streak_30',            label: lbl.streak_30,            icon:'🌟' },
        { value:'practice_count',       label: lbl.practice_count,       icon:'💪' },
        { value:'accuracy_95',          label: lbl.accuracy_95,          icon:'🎯' },
        { value:'average_score_90',     label: lbl.average_score_90,     icon:'📈' },
        { value:'assignments_completed',label: lbl.assignments_completed, icon:'✅' },
        { value:'exams_taken',          label: lbl.exams_taken,          icon:'📋' },
        { value:'perfect_streak_5',     label: lbl.perfect_streak_5,     icon:'🏆' },
        { value:'time_bonus',           label: lbl.time_bonus,           icon:'⚡' },
        { value:'custom',               label: lbl.custom,               icon:'⚙️' },
    ];
};

const EMOJI_SUGGESTIONS = ['🏆','🥇','🌟','⭐','🔥','💎','👑','🎯','⚡','🚀','💡','📚','🎓','🏅','🎖','🌈','🦋','🌺','💫','✨','🎪','🎨','🎵','🎺','🎸','🛡','⚔️','🏹','🔮','💠'];

/* ─── Condition label helper ─────────────────────────────────────────────── */
const CONDITION_LABEL_MAP_VI = {
    first_submission:    (v) => 'Nộp bài lần đầu',
    score_100:           (v) => 'Đạt 100 điểm',
    streak_3:            (v) => 'Streak 3 ngày',
    streak_7:            (v) => 'Streak 7 ngày',
    streak_14:           (v) => 'Streak 14 ngày',
    streak_30:           (v) => 'Streak 30 ngày',
    streak_60:           (v) => 'Streak 60 ngày',
    practice_count:      (v) => `${v} phiên luyện tập`,
    accuracy_95:         (v) => 'Độ chính xác ≥ 95%',
    accuracy_100_once:   (v) => 'Độ chính xác 100%',
    average_score_70:    (v) => 'Điểm TB ≥ 70',
    average_score_80:    (v) => 'Điểm TB ≥ 80',
    average_score_90:    (v) => 'Điểm TB ≥ 90',
    average_score_95:    (v) => 'Điểm TB ≥ 95',
    assignments_completed:(v) => `Hoàn thành ${v} bài tập`,
    exams_taken:         (v) => `${v} bài kiểm tra`,
    perfect_streak_5:    (v) => '5 bài liên tiếp 100đ',
    perfect_streak_10:   (v) => '10 bài liên tiếp 100đ',
    time_bonus:          (v) => 'Hoàn thành nhanh',
    custom:              (v) => 'Điều kiện tùy chỉnh',
};
const CONDITION_LABEL_MAP_EN = {
    first_submission:    (v) => 'First submission',
    score_100:           (v) => 'Score 100',
    streak_3:            (v) => '3-day streak',
    streak_7:            (v) => '7-day streak',
    streak_14:           (v) => '14-day streak',
    streak_30:           (v) => '30-day streak',
    streak_60:           (v) => '60-day streak',
    practice_count:      (v) => `${v} practice sessions`,
    accuracy_95:         (v) => 'Accuracy ≥ 95%',
    accuracy_100_once:   (v) => 'Accuracy 100%',
    average_score_70:    (v) => 'Avg score ≥ 70',
    average_score_80:    (v) => 'Avg score ≥ 80',
    average_score_90:    (v) => 'Avg score ≥ 90',
    average_score_95:    (v) => 'Avg score ≥ 95',
    assignments_completed:(v) => `Complete ${v} assignments`,
    exams_taken:         (v) => `${v} exams taken`,
    perfect_streak_5:    (v) => '5 perfect streak',
    perfect_streak_10:   (v) => '10 perfect streak',
    time_bonus:          (v) => 'Fast completion',
    custom:              (v) => 'Custom condition',
};
const getConditionLabel = (conditionType, conditionValue, lang = 'vi') => {
    const map = lang === 'en' ? CONDITION_LABEL_MAP_EN : CONDITION_LABEL_MAP_VI;
    const fn = map[conditionType];
    return fn ? fn(conditionValue) : conditionType;
};
const CONDITION_ICON_MAP = {
    first_submission:'📝', score_100:'💯', streak_3:'🔥', streak_7:'🔥', streak_14:'🔥',
    streak_30:'🔥', streak_60:'🔥', practice_count:'💪', accuracy_95:'🎯',
    accuracy_100_once:'🎯', average_score_70:'📈', average_score_80:'📈',
    average_score_90:'📈', average_score_95:'📈', assignments_completed:'✅',
    exams_taken:'📋', perfect_streak_5:'🏆', perfect_streak_10:'🏆',
    time_bonus:'⚡', custom:'⚙️',
};
const getConditionIcon = (conditionType) => CONDITION_ICON_MAP[conditionType] || '⚙️';

/* ─────────────────── mini components ─────────────────── */
const RarityBadge = ({ rarity, lang = 'vi', size = 'sm' }) => {
    const RARITY = getRarity(lang);
    const r = RARITY[rarity] || RARITY.common;
    const pad = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';
    return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full ${pad}`}
            style={{ background: r.solidBg, color: r.solidColor, border: `1px solid ${r.border}` }}>
            <span className="text-[10px]">{r.emoji}</span>{r.label}
        </span>
    );
};

/* StarRow removed — stars were misread as difficulty, not completion level */

/* Animated stat number — re-animates whenever value changes */
const StatNum = ({ value }) => {
    const [n, setN] = useState(0);
    useEffect(()=>{
        if(value === 0){ setN(0); return; }
        let current = 0;
        const step = Math.max(value / 30, 1);
        const t = setInterval(()=>{
            current += step;
            if(current >= value){ setN(value); clearInterval(t); }
            else setN(Math.floor(current));
        }, 20);
        return () => clearInterval(t);
    },[value]);
    return <span>{n}</span>;
};

/* Top rarity strip */
const RarityStrip = ({ rarity, lang = 'vi' }) => {
    const RARITY = getRarity(lang);
    const r = RARITY[rarity] || RARITY.common;
    return <div className={`h-1 w-full bg-gradient-to-r ${r.gradient} rounded-t-2xl`} />;
};

/* ─────────────────── Badge Card ─────────────────── */
const BadgeCard = ({ badge, lang, onAward }) => {
    const RARITY = getRarity(lang);
    const r = RARITY[badge.rarity] || RARITY.common;
    const inactive = badge.isActive === false;
    const awardLabel = lang === 'en' ? 'Award Honor' : 'Trao danh dự';
    const systemLabel = lang === 'en' ? 'System' : 'Hệ thống';
    const offLabel = lang === 'en' ? 'Off' : 'Tắt';
    const noDescLabel = lang === 'en' ? 'No description' : 'Chưa có mô tả';

    return (
        <div className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100
            hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
            style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.06)', borderTop:`3px solid ${inactive ? '#94a3b8' : r.solidColor}`,
                opacity: inactive ? 0.7 : 1 }}>

            {/* System chip */}
            {badge.isSystem && (
                <div className="absolute top-3 left-3 z-10">
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-800/80 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                        <Shield className="w-2.5 h-2.5" />{systemLabel}
                    </span>
                </div>
            )}

            {/* isActive chip */}
            {inactive && (
                <div className="absolute top-3 right-3 z-10">
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-400/90 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                        <XCircle className="w-2.5 h-2.5" />{offLabel}
                    </span>
                </div>
            )}

            {/* Badge visual */}
            <div className="flex flex-col items-center px-5 pt-8 pb-4"
                style={{ background:`linear-gradient(160deg, ${r.solidBg} 0%, #fff 65%)` }}>
                <div className="w-[68px] h-[68px] rounded-2xl flex items-center justify-center mb-3 shadow-lg"
                    style={{ background:`linear-gradient(135deg, white, ${r.solidBg})`,
                        border:`2px solid ${r.border}`,
                        boxShadow:`0 8px 24px ${r.glow}, 0 0 0 4px ${r.solidBg}` }}>
                    <span className="text-4xl leading-none select-none">{badge.emoji}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-center text-[13px] leading-tight mt-3 mb-2 line-clamp-2 w-full px-1"
                    title={badge.name?.[lang] || badge.name?.vi}>
                    {badge.name?.[lang] || badge.name?.vi}
                </h3>
                <RarityBadge rarity={badge.rarity} lang={lang} />
            </div>

            {/* Description */}
            <div className="flex-1 px-4 py-2 border-t border-slate-50">
                <p className="text-[11px] text-slate-400 text-center line-clamp-2 leading-relaxed min-h-[2rem]">
                    {badge.description?.[lang] || badge.description?.vi
                        || <span className="italic text-slate-300">{noDescLabel}</span>}
                </p>
            </div>

            {/* Condition tag */}
            {badge.conditionType && badge.conditionType !== 'custom' && (
                <div className="px-4 pb-2">
                    <div className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[11px]">{getConditionIcon(badge.conditionType)}</span>
                        <span className="text-[10px] font-semibold text-slate-500 truncate">
                            {getConditionLabel(badge.conditionType, badge.conditionValue, lang)}
                        </span>
                    </div>
                </div>
            )}

            {/* Action footer — chỉ Trao huy hiệu danh dự */}
            <div className="px-4 pb-4">
                <button onClick={()=>onAward(badge)} disabled={inactive}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold
                        bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 border border-amber-100 transition-colors
                        disabled:opacity-40 disabled:cursor-not-allowed">
                    <span className="text-sm leading-none">🎖️</span>{awardLabel}
                </button>
            </div>
        </div>
    );
};

/* ─────────────────── Award Modal ─────────────────── */
/* FIX: prefillBadge & awardStudentPrefill now correctly pre-select badge/student */
const AwardModal = ({ open, onClose, students, badges, lang, prefillBadge, awardStudentPrefill, onAward }) => {
    const [form, setForm] = useState({ studentId:'', badgeId:'', note:'', forceHonorary: true });
    const [saving, setSaving] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [badgeSearch, setBadgeSearch] = useState('');

    /* FIX: correctly apply both prefills on open */
    useEffect(()=>{
        if(open){
            setForm({
                studentId: awardStudentPrefill?._id || '',
                badgeId:   prefillBadge?._id || '',
                note:      '',
                forceHonorary: true
            });
        }
        setStudentSearch('');
        setBadgeSearch('');
    },[open, prefillBadge, awardStudentPrefill]);

    const filteredStudents = students.filter(s=>
        s.fullName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email?.toLowerCase().includes(studentSearch.toLowerCase())
    );

    /* FIX: badgeSearch is now properly controlled */
    const filteredBadges = badges.filter(b=>
        !badgeSearch ||
        b.name?.vi?.toLowerCase().includes(badgeSearch.toLowerCase()) ||
        b.name?.en?.toLowerCase().includes(badgeSearch.toLowerCase())
    );

    const selectedBadgeObj   = badges.find(b=>b._id===form.badgeId);
    const selectedStudentObj = students.find(s=>s._id===form.studentId);

    const handleSubmit = async () => {
        if(!form.studentId||!form.badgeId){ toast.error(lang === 'en' ? 'Please select a student and badge' : 'Vui lòng chọn học viên và huy hiệu'); return; }
        setSaving(true);
        await onAward(form);
        setSaving(false);
    };

    const UI = {
        title:        lang === 'en' ? 'Award Honorary Badge'  : 'Trao huy hiệu danh dự',
        subtitle:     lang === 'en' ? 'Recognize remarkable student progress' : 'Ghi nhận tiến bộ đáng khen ngợi của học viên',
        studentLabel: lang === 'en' ? 'Student *'             : 'Học viên *',
        searchStu:    lang === 'en' ? 'Search name or email...' : 'Tìm tên hoặc email...',
        badgeLabel:   lang === 'en' ? 'Badge *'               : 'Huy hiệu *',
        searchBadge:  lang === 'en' ? 'Search badge...'       : 'Tìm huy hiệu...',
        notFound:     lang === 'en' ? 'Not found'             : 'Không tìm thấy',
        awardingTo:   lang === 'en' ? 'AWARDING TO'           : 'TRAO DANH DỰ CHO',
        noteLabel:    lang === 'en' ? 'Note'                  : 'Ghi chú',
        noteOpt:      lang === 'en' ? '(optional)'            : '(tuỳ chọn)',
        notePlaceh:   lang === 'en' ? 'E.g: Outstanding in mid-term exam...' : 'VD: Xuất sắc trong bài kiểm tra giữa kỳ...',
        honorTitle:   lang === 'en' ? 'Honorary Badge'        : 'Huy hiệu danh dự',
        honorDesc:    lang === 'en' ? 'For students who have not met the criteria but show remarkable progress. Honorary badges do not count toward official achievements but appear in a separate tab.' : 'Dành cho học viên chưa đủ điều kiện nhưng có tiến bộ đáng ghi nhận. Huy hiệu danh dự không tính vào thành tích chính thức, nhưng sẽ xuất hiện ở tab riêng.',
        honorNote:    lang === 'en' ? 'does not count'        : 'không tính',
        cancel:       lang === 'en' ? 'Cancel'                : 'Hủy',
        awarding:     lang === 'en' ? 'Awarding...'           : 'Đang trao...',
        award:        lang === 'en' ? 'Award Honor'           : 'Trao danh dự',
    };

    if(!open) return null;
    const RARITY = getRarity(lang);
    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl" onClick={e=>e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                            <span className="text-lg leading-none">🎖️</span>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">{UI.title}</h2>
                            <p className="text-xs text-slate-400">{UI.subtitle}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Student picker */}
                        <div className="flex flex-col">
                            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">{UI.studentLabel}</label>
                            <div className="relative mb-1.5">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    value={studentSearch}
                                    onChange={e=>setStudentSearch(e.target.value)}
                                    placeholder={UI.searchStu}
                                    className="w-full pl-8 pr-3 py-1.5 border-2 border-slate-200 rounded-lg text-xs
                                        focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all" />
                            </div>
                            <div className="overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-50 shadow-sm" style={{maxHeight:'196px'}}>
                                {filteredStudents.length===0 && (
                                    <div className="flex flex-col items-center py-6 text-xs text-slate-400 gap-1">
                                        <Inbox className="w-5 h-5 text-slate-300" />{UI.notFound}
                                    </div>
                                )}
                                {filteredStudents.map((s,i)=>{
                                    const colors=['bg-blue-500','bg-emerald-500','bg-violet-500','bg-amber-500','bg-rose-500','bg-cyan-500'];
                                    const sel = form.studentId===s._id;
                                    return(
                                        <button key={s._id} onClick={()=>setForm(f=>({...f,studentId:s._id}))}
                                            className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${sel?'bg-amber-50':'hover:bg-slate-50'}`}>
                                            <div className={`w-7 h-7 rounded-lg ${colors[i%colors.length]} flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0 shadow-sm`}>
                                                {s.fullName?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-slate-800 truncate">{s.fullName}</p>
                                                <p className="text-[10px] text-slate-400 truncate">{s.email}</p>
                                            </div>
                                            {sel && <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Badge picker */}
                        <div className="flex flex-col">
                            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">{UI.badgeLabel}</label>
                            <div className="relative mb-1.5">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    value={badgeSearch}
                                    onChange={e=>setBadgeSearch(e.target.value)}
                                    placeholder={UI.searchBadge}
                                    className="w-full pl-8 pr-3 py-1.5 border-2 border-slate-200 rounded-lg text-xs
                                        focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all" />
                            </div>
                            <div className="overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-50 shadow-sm" style={{maxHeight:'196px'}}>
                                {filteredBadges.length===0 && (
                                    <div className="flex flex-col items-center py-6 text-xs text-slate-400 gap-1">
                                        <Inbox className="w-5 h-5 text-slate-300" />{UI.notFound}
                                    </div>
                                )}
                                {filteredBadges.map(b=>{
                                    const rc = RARITY[b.rarity]||RARITY.common;
                                    const sel = form.badgeId===b._id;
                                    return(
                                        <button key={b._id} onClick={()=>setForm(f=>({...f,badgeId:b._id}))}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                                            style={sel ? {background:rc.solidBg} : {}}>
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                                                style={{background:`white`, border:`1.5px solid ${rc.border}`}}>
                                                <span className="text-base leading-none">{b.emoji}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-slate-800 truncate">{b.name?.[lang]||b.name?.vi}</p>
                                                <p className="text-[10px] font-medium" style={{color:rc.solidColor}}>{rc.label}</p>
                                            </div>
                                            {sel && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{color:rc.solidColor}} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    {(selectedStudentObj||selectedBadgeObj) && (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-200 mb-4">
                            <span className="text-base leading-none flex-shrink-0">🎖️</span>
                            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wide shrink-0">{UI.awardingTo}</span>
                            <span className="text-xs font-semibold text-slate-700 truncate">{selectedStudentObj?.fullName||'—'}</span>
                            <ChevronRight className="w-3 h-3 text-purple-400 flex-shrink-0" />
                            <span className="text-sm flex-shrink-0">{selectedBadgeObj?.emoji||'—'}</span>
                            <span className="text-xs font-semibold text-slate-700 truncate">{selectedBadgeObj?.name?.[lang]||selectedBadgeObj?.name?.vi||'—'}</span>
                        </div>
                    )}

                    {/* Note */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-widest">
                            {UI.noteLabel} <span className="font-normal text-slate-400 normal-case">{UI.noteOpt}</span>
                        </label>
                        <textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}
                            placeholder={UI.notePlaceh}
                            className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs
                                focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all resize-none"
                            rows={2} />
                    </div>

                    {/* Honorary info banner */}
                    <div className="mt-3 px-4 py-3 rounded-xl border-2 bg-blue-50 border-blue-200">
                        <div className="flex items-start gap-3">
                            <span className="text-xl leading-none flex-shrink-0 mt-0.5">🎖️</span>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-blue-800">{UI.honorTitle}</p>
                                <p className="text-[10px] mt-0.5 leading-relaxed text-slate-500">{UI.honorDesc}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 pb-6 flex gap-3 justify-end">
                    <button onClick={onClose}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200">
                        {UI.cancel}
                    </button>
                    <button onClick={handleSubmit} disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold
                            text-white rounded-xl transition-all shadow-lg
                            bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-orange-300/30
                            disabled:opacity-60 disabled:cursor-not-allowed">
                        {saving
                            ? <><RefreshCw className="w-4 h-4 animate-spin" />{UI.awarding}</>
                            : <><span className="text-base leading-none">🎖️</span>{UI.award}</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────── Student Detail Modal ─────────────────── */
const StudentDetailModal = ({ student, studentBadges, lang, onClose, onRevoke, onAward }) => {
    const [tab, setTab] = useState('earned');
    if(!student) return null;
    const RARITY = getRarity(lang);
    const earned   = studentBadges.filter(sb=>sb.earned && !sb.isHonorary);
    const honorary = studentBadges.filter(sb=>sb.isHonorary);
    const unearned = studentBadges.filter(sb=>!sb.earned && !sb.isHonorary);
    const awardLabel   = lang === 'en' ? 'Award Honor'    : 'Trao danh dự';
    const earnedLabel  = lang === 'en' ? 'Earned'         : 'Đã đạt';
    const honorLabel   = lang === 'en' ? 'Honorary'       : 'Danh dự';
    const unearnLabel  = lang === 'en' ? 'Not Earned'     : 'Chưa đạt';
    const noBadgeLabel = lang === 'en' ? 'No badges yet'  : 'Chưa có huy hiệu nào';
    const awardFirstLabel = lang === 'en' ? 'Award the first badge to this student' : 'Trao huy hiệu đầu tiên cho học viên này';

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={e=>e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 bg-white z-10 px-6 pt-5 pb-4 border-b border-slate-100 rounded-t-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600
                                flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-200">
                                {student.fullName?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900">{student.fullName}</h2>
                                <p className="text-xs text-slate-400">{student.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={()=>onAward(student)}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold
                                    bg-gradient-to-r from-amber-500 to-orange-500 text-white
                                    rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm shadow-orange-200">
                                <span className="text-sm leading-none">🎖️</span>{awardLabel}
                            </button>
                            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    {/* Tabs */}
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                        {[
                            { key:'earned',   label:`${earnedLabel} (${earned.length})`,   icon:Trophy },
                            { key:'honorary', label:`${honorLabel} (${honorary.length})`,  icon:Medal  },
                            { key:'unearned', label:`${unearnLabel} (${unearned.length})`, icon:Lock },
                        ].map(({key,label,icon:Icon})=>(
                            <button key={key} onClick={()=>setTab(key)}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all
                                    ${tab===key
                                        ? key==='honorary'
                                            ? 'bg-white shadow text-purple-700'
                                            : 'bg-white shadow text-blue-700'
                                        : 'text-slate-500 hover:text-slate-700'}`}>
                                <Icon className="w-3.5 h-3.5" />{label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6">
                    {tab==='earned' ? (
                        earned.length===0 ? (
                            <div className="text-center py-14">
                                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                    <Trophy className="w-7 h-7 text-slate-300" />
                                </div>
                                <p className="text-slate-500 text-sm font-semibold">{noBadgeLabel}</p>
                                <p className="text-slate-400 text-xs mt-1">{awardFirstLabel}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {earned.map(sb=>{
                                    const b=sb.badge;
                                    if(!b) return null;
                                    const rc=RARITY[b.rarity]||RARITY.common;
                                    return(
                                        <div key={b._id} className="group relative rounded-2xl border-2 p-4 text-center transition-all hover:shadow-md"
                                            style={{background:rc.solidBg, borderColor:rc.border}}>
                                            <span className="text-3xl block mb-1">{b.emoji}</span>
                                            <p className="text-xs font-bold mt-1 text-slate-800 line-clamp-2 leading-tight">{b.name?.[lang]||b.name?.vi}</p>
                                            <div className="flex justify-center mt-1.5"><RarityBadge rarity={b.rarity} lang={lang} /></div>
                                            {sb.awardedAt && (
                                                <p className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(sb.awardedAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                                                </p>
                                            )}
                                            <button onClick={()=>onRevoke(student._id, b._id)}
                                                className="mt-2 text-[10px] font-semibold text-red-500 hover:text-red-700
                                                    opacity-0 group-hover:opacity-100 transition-all hover:underline flex items-center gap-1 mx-auto">
                                                <Trash2 className="w-3 h-3" />{lang === 'en' ? 'Revoke' : 'Thu hồi'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : tab==='honorary' ? (
                        honorary.length===0 ? (
                            <div className="text-center py-14">
                                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                    <Medal className="w-7 h-7 text-purple-300" />
                                </div>
                                <p className="text-slate-500 text-sm font-semibold">{lang === 'en' ? 'No honorary badges yet' : 'Chưa có huy hiệu danh dự'}</p>
                                <p className="text-slate-400 text-xs mt-1">{lang === 'en' ? 'For students with progress but not meeting official criteria' : 'Dành cho học viên có tiến bộ nhưng chưa đủ điều kiện chính thức'}</p>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 border border-purple-200 mb-4">
                                    <Medal className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                    <p className="text-[11px] text-purple-700 font-medium">
                                        {lang === 'en'
                                            ? 'Honorary badges do not count toward official results. Students receive a notification and can view them in a separate tab.'
                                            : 'Huy hiệu danh dự không tính vào kết quả chính thức. Học viên nhận được thông báo và xem ở tab riêng trên trang huy hiệu của mình.'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {honorary.map(sb=>{
                                        const b=sb.badge;
                                        if(!b) return null;
                                        const rc=RARITY[b.rarity]||RARITY.common;
                                        return(
                                            <div key={b._id} className="group relative rounded-2xl border-2 p-4 text-center transition-all hover:shadow-md"
                                                style={{background:'#faf5ff', borderColor:'#c084fc'}}>
                                                <div className="absolute top-2 left-2">
                                                    <span className="text-[9px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded-full">
                                                        {lang === 'en' ? 'HONORARY' : 'DANH DỰ'}
                                                    </span>
                                                </div>
                                                <span className="text-3xl block mb-1 mt-2">{b.emoji}</span>
                                                <p className="text-xs font-bold mt-1 text-slate-800 line-clamp-2 leading-tight">{b.name?.[lang]||b.name?.vi}</p>
                                                <div className="flex justify-center mt-1.5"><RarityBadge rarity={b.rarity} lang={lang} /></div>
                                                {sb.awardedAt && (
                                                    <p className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(sb.awardedAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                                                    </p>
                                                )}
                                                {sb.honoraryNote && (
                                                    <p className="text-[10px] text-purple-500 mt-1 italic line-clamp-2">"{sb.honoraryNote}"</p>
                                                )}
                                                <button onClick={()=>onRevoke(student._id, b._id)}
                                                    className="mt-2 text-[10px] font-semibold text-red-500 hover:text-red-700
                                                        opacity-0 group-hover:opacity-100 transition-all hover:underline flex items-center gap-1 mx-auto">
                                                    <Trash2 className="w-3 h-3" />{lang === 'en' ? 'Revoke' : 'Thu hồi'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    ) : (
                        unearned.length===0 ? (
                            <div className="text-center py-14">
                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                                </div>
                                <p className="text-slate-500 text-sm font-semibold">{lang === 'en' ? 'All badges completed!' : 'Đã hoàn thành tất cả huy hiệu'}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {unearned.map(sb=>{
                                    const b=sb.badge;
                                    if(!b) return null;
                                    return(
                                        <div key={b._id} className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center opacity-60">
                                            <span className="text-3xl block mb-1 grayscale">{b.emoji}</span>
                                            <p className="text-xs font-medium mt-1 text-slate-500 line-clamp-2 leading-tight">{b.name?.[lang]||b.name?.vi}</p>
                                            {sb.progress!=null && (
                                                <div className="mt-2.5">
                                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                                        <span>{UI_MAIN.progress}</span><span>{sb.progress}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full bg-slate-400 transition-all"
                                                            style={{width:`${sb.progress||0}%`}} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

/* ─────────────────── Main Page ─────────────────── */
const InstructorBadgeManagement = () => {
    const { lang } = useLanguage();
    const [loading, setLoading]         = useState(true);
    const [badges, setBadges]           = useState([]);
    const [students, setStudents]       = useState([]);
    const [searchTerm, setSearchTerm]   = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [rarityFilter, setRarityFilter]   = useState('all');
    const [viewMode, setViewMode]       = useState('grid');
    const [activeTab, setActiveTab]     = useState('badges');

    const [showAwardModal, setShowAwardModal] = useState(false);
    const [prefillAwardBadge, setPrefillAwardBadge]     = useState(null);
    const [awardStudentPrefill, setAwardStudentPrefill] = useState(null);
    const [selectedStudent, setSelectedStudent]         = useState(null);
    const [studentBadges, setStudentBadges]             = useState([]);

    const token = () => localStorage.getItem('token');

    const fetchBadges = useCallback(async()=>{
        try{
            const res  = await fetch('http://localhost:5000/api/instructor/badges', { headers:{ Authorization:`Bearer ${token()}` } });
            const data = await res.json();
            if(res.ok) setBadges(data.badges||[]);
        }catch(e){ console.error(e); }
    },[]);

    const fetchStudents = useCallback(async()=>{
        try{
            const res  = await fetch('http://localhost:5000/api/instructor/badges/students?limit=200', { headers:{ Authorization:`Bearer ${token()}` } });
            const data = await res.json();
            if(res.ok) setStudents(data.students||[]);
        }catch(e){ console.error(e); }
    },[]);

    const fetchStudentBadges = async(studentId)=>{
        try{
            const res  = await fetch(`http://localhost:5000/api/instructor/badges/students/${studentId}/badges`, { headers:{ Authorization:`Bearer ${token()}` } });
            const data = await res.json();
            if(res.ok) setStudentBadges(data.allBadges||[]);
        }catch(e){ console.error(e); }
    };

    useEffect(()=>{
        Promise.all([fetchBadges(), fetchStudents()]).finally(()=>setLoading(false));
    },[fetchBadges,fetchStudents]);

    const handleAward = async(form)=>{
        try{
            const res  = await fetch(`http://localhost:5000/api/instructor/badges/students/${form.studentId}/badges`, {
                method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token()}` },
                body: JSON.stringify({ badgeId:form.badgeId, note:form.note, forceHonorary: form.forceHonorary || false })
            });
            const data = await res.json();
            if(res.ok){
                toast.success(UI_MAIN.awardSuccess);
                setShowAwardModal(false);
                await fetchStudents();
                if(form.studentId) fetchStudentBadges(form.studentId);
            }
            else toast.error(data.message||UI_MAIN.awardError);
        }catch{ toast.error(UI_MAIN.serverError); }
    };

    const handleRevoke = async(studentId, badgeId)=>{
        if(!window.confirm(UI_MAIN.revokeConfirm)) return;
        try{
            const res = await fetch(`http://localhost:5000/api/instructor/badges/students/${studentId}/badges/${badgeId}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token()}` } });
            if(res.ok){
                toast.success(UI_MAIN.revokeSuccess);
                await Promise.all([fetchStudentBadges(studentId), fetchStudents()]);
            }
            else{ const d=await res.json(); toast.error(d.message||UI_MAIN.revokeError); }
        }catch{ toast.error(UI_MAIN.serverError); }
    };

    const openAwardForBadge  = (badge)   => { setPrefillAwardBadge(badge); setAwardStudentPrefill(null); setShowAwardModal(true); };
    const openAwardForStudent= (student) => { setAwardStudentPrefill(student); setPrefillAwardBadge(null); setShowAwardModal(true); };
    const openStudentDetail  = (student) => { setSelectedStudent(student); fetchStudentBadges(student._id); };

    const filteredBadges = badges.filter(b=>{
        const matchSearch = b.name?.vi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.name?.en?.toLowerCase().includes(searchTerm.toLowerCase()) || b.emoji?.includes(searchTerm);
        const matchRarity = rarityFilter==='all' || b.rarity===rarityFilter;
        return matchSearch && matchRarity;
    });

    const filteredStudents = students.filter(s=>
        s.fullName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email?.toLowerCase().includes(studentSearch.toLowerCase())
    );

    const rarityCounts  = RARITY_ORDER.reduce((acc,r)=>{ acc[r]=badges.filter(b=>b.rarity===r).length; return acc; },{});
    const systemCount   = badges.filter(b=>b.isSystem).length;
    const customCount   = badges.filter(b=>!b.isSystem).length;
    const totalAwarded  = students.reduce((sum,s)=>sum+(s.badgeCount||0),0);
    const topStudent    = students.length ? students.reduce((a,b)=>(b.badgeCount||0)>(a.badgeCount||0)?b:a, students[0]) : null;

    if(loading){
        const loadingText = lang === 'en' ? 'Loading data...' : 'Đang tải dữ liệu...';
        return (
            <InstructorLayout>
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="relative w-14 h-14">
                        <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                        <div className="absolute inset-2 border-4 border-indigo-100 border-b-indigo-500 rounded-full animate-spin"
                            style={{animationDirection:'reverse',animationDuration:'0.8s'}} />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">{loadingText}</p>
                </div>
            </InstructorLayout>
        );
    }

    const RARITY = getRarity(lang);
    const CONDITION_TYPES = getConditionTypes(lang);

    const UI_MAIN = {
        pageTitle:       lang === 'en' ? 'Badges & Achievements'   : 'Huy Hiệu & Thành Tích',
        pageSubtitle:    lang === 'en' ? 'Manage badge system, achievements and rewards for students' : 'Quản lý hệ thống huy hiệu, thành tích và phần thưởng cho học viên',
        totalBadges:     lang === 'en' ? 'Total Badges'            : 'Tổng huy hiệu',
        system:          lang === 'en' ? 'System'                  : 'Hệ thống',
        custom:          lang === 'en' ? 'Custom'                  : 'Tùy chỉnh',
        awarded:         lang === 'en' ? 'Awarded'                 : 'Đã trao',
        students:        lang === 'en' ? 'Students'                : 'Học Viên',
        badgesTab:       lang === 'en' ? 'Badges'                  : 'Huy Hiệu',
        studentsTab:     lang === 'en' ? 'Students'                : 'Học Viên',
        awardHonor:      lang === 'en' ? 'Award Honorary Badge'    : 'Trao huy hiệu danh dự',
        awardSuccess:    lang === 'en' ? '🎖️ Honorary badge awarded!' : '🎖️ Trao huy hiệu danh dự thành công!',
        revokeConfirm:   lang === 'en' ? 'Revoke this badge?'      : 'Thu hồi huy hiệu này?',
        revokeSuccess:   lang === 'en' ? 'Badge revoked'           : 'Đã thu hồi huy hiệu',
        revokeError:     lang === 'en' ? 'Error revoking badge'    : 'Lỗi khi thu hồi',
        awardError:      lang === 'en' ? 'Error awarding badge'    : 'Lỗi khi trao huy hiệu',
        serverError:     lang === 'en' ? 'Server connection error' : 'Lỗi kết nối server',
        all:             lang === 'en' ? 'All'                     : 'Tất cả',
        gridView:        lang === 'en' ? 'Grid view'               : 'Dạng lưới',
        listView:        lang === 'en' ? 'List view'               : 'Dạng danh sách',
        refresh:         lang === 'en' ? 'Refresh'                 : 'Làm mới',
        noBadges:        lang === 'en' ? 'No badges found'         : 'Không tìm thấy huy hiệu nào',
        noBadgesHint:    lang === 'en' ? 'Try changing filters or search term' : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm',
        rarity:          lang === 'en' ? 'Rarity'                  : 'Độ hiếm',
        type:            lang === 'en' ? 'Type'                    : 'Loại',
        actions:         lang === 'en' ? 'Actions'                 : 'Thao tác',
        badgeCol:        lang === 'en' ? 'Badge'                   : 'Huy hiệu',
        descCol:         lang === 'en' ? 'Description'             : 'Mô tả',
        searchBadge:     lang === 'en' ? 'Search badges...'        : 'Tìm huy hiệu...',
        searchStudent:   lang === 'en' ? 'Search student name or email...' : 'Tìm tên hoặc email học viên...',
        progress:        lang === 'en' ? 'Progress'                : 'Tiến độ',
        noStudents:      lang === 'en' ? 'No students found'       : 'Không tìm thấy học viên',
        leadsLabel:      lang === 'en' ? 'leads'                   : 'dẫn đầu',
        noData:          lang === 'en' ? 'No data yet'             : 'Chưa có dữ liệu',
        avgPerStudent:   lang === 'en' ? 'avg per student'         : 'TB / học viên',
        noTopStudent:    lang === 'en' ? 'No students yet'         : 'Chưa có học viên',
    };

    return (
        <InstructorLayout>
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Hero Header ── */}
                <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
                    style={{
                        background:'linear-gradient(135deg, #0f172a 0%, #1e3a8a 40%, #1d4ed8 75%, #0284c7 100%)',
                        boxShadow:'0 12px 40px rgba(30,64,175,0.35)'
                    }}>
                    {/* decorative dot grid */}
                    <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
                        style={{ backgroundImage:'radial-gradient(circle at 1px 1px,white 1px,transparent 0)', backgroundSize:'24px 24px' }} />
                    {/* orbs */}
                    <div className="absolute -top-20 -right-20 w-72 h-72 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-indigo-300/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute top-1/2 -translate-y-1/2 right-1/4 w-32 h-32 bg-blue-200/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
                                    <Award className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-extrabold text-white tracking-tight leading-none">{UI_MAIN.pageTitle}</h1>
                                    <p className="text-blue-200 text-xs mt-0.5">{UI_MAIN.pageSubtitle}</p>
                                </div>
                            </div>

                            {/* Quick stats pills */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {[
                                    { icon:Layers,  label: UI_MAIN.totalBadges, val:badges.length  },
                                    { icon:Shield,  label: UI_MAIN.system,      val:systemCount    },
                                    { icon:Sparkles,label: UI_MAIN.custom,      val:customCount    },
                                    { icon:Trophy,  label: UI_MAIN.awarded,     val:totalAwarded   },
                                ].map((p,i)=>(
                                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-xs text-white">
                                        <p.icon className="w-3.5 h-3.5 text-blue-200" />
                                        <span className="text-blue-200">{p.label}:</span>
                                        <span className="font-bold">{p.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Hero actions */}
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                                <input type="text" placeholder={UI_MAIN.searchBadge} value={searchTerm}
                                    onChange={e=>setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2.5 bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl text-white
                                        placeholder-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 w-48 transition-all" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Stats Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            icon:Award,
                            label: UI_MAIN.totalBadges,
                            value:badges.length,
                            from:'#3b82f6', to:'#6366f1', bg:'#eff6ff', ic:'#3b82f6',
                            trend: systemCount + customCount === badges.length
                                ? `${systemCount} ${UI_MAIN.system} · ${customCount} ${UI_MAIN.custom}`
                                : `${badges.length} ${lang === 'en' ? 'badges' : 'huy hiệu'}`
                        },
                        {
                            icon:Shield,
                            label: UI_MAIN.system,
                            value:systemCount,
                            from:'#f59e0b', to:'#f97316', bg:'#fffbeb', ic:'#f59e0b',
                            trend: customCount > 0
                                ? `+ ${customCount} ${UI_MAIN.custom}`
                                : (lang === 'en' ? 'No custom' : 'Không có tùy chỉnh')
                        },
                        {
                            icon:Users,
                            label: UI_MAIN.students,
                            value:students.length,
                            from:'#8b5cf6', to:'#a78bfa', bg:'#f5f3ff', ic:'#8b5cf6',
                            trend: topStudent
                                ? `🏆 ${topStudent.fullName?.split(' ').pop()||'—'} ${UI_MAIN.leadsLabel} (${topStudent.badgeCount||0})`
                                : UI_MAIN.noTopStudent
                        },
                        {
                            icon:Trophy,
                            label: UI_MAIN.awarded,
                            value:totalAwarded,
                            from:'#10b981', to:'#34d399', bg:'#ecfdf5', ic:'#10b981',
                            trend: students.length
                                ? `${Math.round(totalAwarded / students.length * 10) / 10} ${UI_MAIN.avgPerStudent}`
                                : UI_MAIN.noData
                        },
                    ].map((s,i)=>(
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm
                            hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden group cursor-default">
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl"
                                style={{ background:`linear-gradient(135deg, ${s.from}, ${s.to})` }} />
                            <div className="flex items-start gap-3">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                                    style={{ background:s.bg }}>
                                    <s.icon className="w-5 h-5" style={{ color:s.ic }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-slate-400 font-medium leading-none mb-1">{s.label}</p>
                                    <p className="text-2xl font-black text-slate-900 leading-none"><StatNum value={s.value} /></p>
                                    <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-0.5 truncate">
                                        <TrendingUp className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                                        {s.trend}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Main Tab Panel ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                    {/* Row 1: Tabs + Award button */}
                    <div className="flex items-center justify-between px-5 border-b border-slate-100">
                        <div className="flex">
                            {[
                                { key:'badges',   label: UI_MAIN.badgesTab,   icon:Award, count:filteredBadges.length },
                                { key:'students', label: UI_MAIN.studentsTab, icon:Users, count:students.length },
                            ].map(({key,label,icon:Icon,count})=>(
                                <button key={key} onClick={()=>setActiveTab(key)}
                                    className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap
                                        ${activeTab===key
                                            ? 'border-blue-600 text-blue-700'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                                    <Icon className="w-4 h-4" />{label}
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold
                                        ${activeTab===key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {count}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={()=>{ setShowAwardModal(true); setPrefillAwardBadge(null); setAwardStudentPrefill(null); }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white
                                text-sm font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all
                                shadow-sm shadow-orange-300/30 whitespace-nowrap">
                            <span className="text-base leading-none">🎖️</span>{UI_MAIN.awardHonor}
                        </button>
                    </div>

                    {/* Row 2: filter bar (badges tab) */}
                    {activeTab==='badges' && (
                        <div className="px-5 py-3 border-b border-slate-50 flex items-center gap-2 flex-wrap bg-slate-50/50">
                            <button onClick={()=>setRarityFilter('all')}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border
                                    ${rarityFilter==='all'
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                                <LayoutGrid className="w-3.5 h-3.5" />{UI_MAIN.all}
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                                    ${rarityFilter==='all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {filteredBadges.length}
                                </span>
                            </button>

                            {RARITY_ORDER.map(r=>{
                                const rc     = RARITY[r];
                                const active = rarityFilter===r;
                                return (
                                    <button key={r} onClick={()=>setRarityFilter(active?'all':r)}
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border"
                                        style={active
                                            ? { background:rc.solidBg, borderColor:rc.solidColor, color:rc.solidColor, boxShadow:`0 2px 10px ${rc.glow}` }
                                            : { background:'#fff', borderColor:'#e2e8f0', color:'#475569' }}>
                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:rc.solidColor }} />
                                        {rc.label}
                                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                                            style={active
                                                ? { background:rc.solidColor, color:'#fff' }
                                                : { background:'#f1f5f9', color:'#64748b' }}>
                                            {rarityCounts[r]||0}
                                        </span>
                                    </button>
                                );
                            })}

                            <div className="ml-auto flex items-center gap-2">
                                <div className="flex bg-slate-100 rounded-lg p-0.5">
                                    <button onClick={()=>setViewMode('grid')}
                                        className={`p-1.5 rounded-md transition-all ${viewMode==='grid'?'bg-white shadow text-blue-600':'text-slate-400 hover:text-slate-600'}`}
                                        title={UI_MAIN.gridView}>
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                    <button onClick={()=>setViewMode('list')}
                                        className={`p-1.5 rounded-md transition-all ${viewMode==='list'?'bg-white shadow text-blue-600':'text-slate-400 hover:text-slate-600'}`}
                                        title={UI_MAIN.listView}>
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>
                                <button onClick={fetchBadges}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                    <RefreshCw className="w-3.5 h-3.5" />{UI_MAIN.refresh}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Row 2: search (students tab) */}
                    {activeTab==='students' && (
                        <div className="px-5 py-3 border-b border-slate-50 bg-slate-50/50">
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input value={studentSearch} onChange={e=>setStudentSearch(e.target.value)}
                                    placeholder={UI_MAIN.searchStudent}
                                    className="pl-9 pr-3 py-2 border-2 border-slate-200 rounded-xl text-sm w-full
                                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white" />
                            </div>
                        </div>
                    )}

                    {/* ── Badges Tab Content ── */}
                    {activeTab==='badges' && (
                        <div className="p-5">
                            {filteredBadges.length===0 ? (
                                <div className="text-center py-20">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Award className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-slate-600 font-semibold">{UI_MAIN.noBadges}</p>
                                    <p className="text-slate-400 text-sm mt-1">{UI_MAIN.noBadgesHint}</p>
                                </div>
                            ) : viewMode==='grid' ? (
                                <div className="space-y-8">
                                    {RARITY_ORDER.map(r=>{
                                        const tier = filteredBadges.filter(b=>b.rarity===r);
                                        if(tier.length===0) return null;
                                        const rc = RARITY[r];
                                        return(
                                            <div key={r}>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl border-2 font-semibold text-sm shadow-sm"
                                                        style={{background:rc.solidBg, borderColor:rc.solidColor, color:rc.solidColor}}>
                                                        <span>{rc.emoji}</span>{rc.label}
                                                        <span className="ml-1 text-xs opacity-60">({tier.length})</span>
                                                    </div>
                                                    <div className="flex-1 h-px" style={{background:`linear-gradient(90deg, ${rc.solidColor}44, transparent)`}} />
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                                    {tier.map(b=>(
                                                        <BadgeCard key={b._id} badge={b} lang={lang}
                                                            onAward={openAwardForBadge} />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* List view */
                                <div className="rounded-xl border border-slate-100 overflow-hidden">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">{UI_MAIN.badgeCol}</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">{UI_MAIN.descCol}</th>
                                                <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">{UI_MAIN.rarity}</th>
                                                <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">{UI_MAIN.type}</th>
                                                <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">{UI_MAIN.actions}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredBadges.map(b=>{
                                                const rc=RARITY[b.rarity]||RARITY.common;
                                                return(
                                                    <tr key={b._id} className="hover:bg-slate-50/60 transition-colors group">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                                                                    style={{background:`linear-gradient(135deg, white, ${rc.solidBg})`, border:`2px solid ${rc.border}`}}>
                                                                    <span className="text-xl">{b.emoji}</span>
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-slate-800 text-sm">{b.name?.[lang]||b.name?.vi}</p>
                                                                    <RarityBadge rarity={b.rarity} lang={lang} />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 hidden sm:table-cell">
                                                            <p className="text-xs text-slate-400 line-clamp-2 max-w-xs">{b.description?.[lang]||b.description?.vi||'—'}</p>
                                                            {b.conditionType && b.conditionType !== 'custom' && (
                                                                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                                                    {getConditionIcon(b.conditionType)} {getConditionLabel(b.conditionType, b.conditionValue, lang)}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center"><RarityBadge rarity={b.rarity} lang={lang} /></td>
                                                        <td className="px-4 py-3 text-center">
                                                            {b.isSystem
                                                                ? <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200">
                                                                    <Shield className="w-2.5 h-2.5" />{UI_MAIN.system}
                                                                  </span>
                                                                : <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full border border-blue-100">
                                                                    <Sparkles className="w-2.5 h-2.5" />{UI_MAIN.custom}
                                                                  </span>
                                                            }
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={()=>openAwardForBadge(b)}
                                                                    className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100 transition-colors" title={UI_MAIN.awardHonor}>
                                                                    <span className="text-sm leading-none">🎖️</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Students Tab Content ── */}
                    {activeTab==='students' && (
                        <div className="p-5">
                            {/* Rarity distribution summary */}
                            <div className="grid grid-cols-5 gap-3 mb-6">
                                {RARITY_ORDER.map(r=>{
                                    const rc    = RARITY[r];
                                    const count = rarityCounts[r]||0;
                                    return(
                                        <div key={r} className="text-center px-3 py-3 rounded-2xl border-2 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-default"
                                            style={{background:rc.solidBg, borderColor:rc.border}}>
                                            <div className="text-2xl mb-1">{rc.emoji}</div>
                                            <div className="text-xl font-black" style={{color:rc.solidColor}}>{count}</div>
                                            <div className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{color:rc.solidColor+'bb'}}>{rc.label}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Students table */}
                            <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">{UI_MAIN.students}</th>
                                            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                                            <th className="px-5 py-3.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                <span className="flex items-center justify-center gap-1">
                                                    <Trophy className="w-3 h-3 text-amber-500" />{lang === 'en' ? 'Official' : 'Chính thức'}
                                                </span>
                                            </th>
                                            <th className="px-5 py-3.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                <span className="flex items-center justify-center gap-1">
                                                    <span className="text-[11px] leading-none">🎖️</span>{lang === 'en' ? 'Honorary' : 'Danh dự'}
                                                </span>
                                            </th>
                                            <th className="px-5 py-3.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">{UI_MAIN.actions}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredStudents.length===0 && (
                                            <tr>
                                                <td colSpan={5}>
                                                    <div className="flex flex-col items-center py-14 text-slate-400 gap-2">
                                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                                                            <Users className="w-6 h-6 text-slate-300" />
                                                        </div>
                                                        <p className="text-sm font-medium">{lang === 'en' ? 'No students found' : 'Không tìm thấy học viên'}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {filteredStudents.map((s,i)=>{
                                            const palette = ['bg-blue-500','bg-emerald-500','bg-violet-500','bg-amber-500','bg-rose-500','bg-cyan-500','bg-indigo-500','bg-teal-500'];
                                            const avatarColor = palette[i%palette.length];
                                            return(
                                                <tr key={s._id} className="hover:bg-slate-50/70 transition-colors group">
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-xl ${avatarColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                                                                {s.fullName?.charAt(0)?.toUpperCase()}
                                                            </div>
                                                            <span className="font-semibold text-slate-800 text-sm">{s.fullName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-slate-400 text-sm hidden md:table-cell">{s.email}</td>
                                                    <td className="px-5 py-3.5 text-center">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border
                                                            ${(s.badgeCount||0) > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                                            {(s.badgeCount||0) > 0 && <Trophy className="w-3 h-3" />}
                                                            {s.badgeCount||0}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-center">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border
                                                            ${(s.honoraryBadgeCount||0) > 0 ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                                            {(s.honoraryBadgeCount||0) > 0 && <span className="text-[11px] leading-none">🎖️</span>}
                                                            {s.honoraryBadgeCount||0}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={()=>openStudentDetail(s)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700
                                                                    rounded-lg hover:bg-blue-100 border border-blue-100 transition-colors">
                                                                <Eye className="w-3.5 h-3.5" />{lang === 'en' ? 'Details' : 'Chi tiết'}
                                                            </button>
                                                            <button onClick={()=>openAwardForStudent(s)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700
                                                                    rounded-lg hover:bg-amber-100 border border-amber-100 transition-colors">
                                                                <span className="text-sm leading-none">🎖️</span>{UI_MAIN.awardHonor}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {filteredStudents.length > 0 && (
                                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                                        <span>
                                            {lang === 'en' ? 'Showing' : 'Hiển thị'} <span className="font-semibold text-slate-600">{filteredStudents.length}</span> / <span className="font-semibold text-slate-600">{students.length}</span> {lang === 'en' ? 'students' : 'học viên'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Trophy className="w-3 h-3 text-amber-400" />
                                            {lang === 'en' ? 'Official:' : 'Chính thức:'} <span className="font-semibold text-slate-600 ml-0.5">{totalAwarded}</span>
                                            <span className="mx-1 text-slate-300">|</span>
                                            <span className="text-[11px] leading-none">🎖️</span>
                                            {lang === 'en' ? 'Honorary:' : 'Danh dự:'} <span className="font-semibold text-slate-600 ml-0.5">{students.reduce((sum,s)=>sum+(s.honoraryBadgeCount||0),0)}</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {/* end tab panel */}

            </div>
            {/* end max-w wrapper */}

            {/* ── Modals ── */}
            <AwardModal
                open={showAwardModal}
                onClose={()=>{ setShowAwardModal(false); setPrefillAwardBadge(null); setAwardStudentPrefill(null); }}
                students={students}
                badges={badges}
                lang={lang}
                prefillBadge={prefillAwardBadge}
                awardStudentPrefill={awardStudentPrefill}
                onAward={handleAward}
            />
            <StudentDetailModal
                student={selectedStudent}
                studentBadges={studentBadges}
                lang={lang}
                onClose={()=>setSelectedStudent(null)}
                onRevoke={handleRevoke}
                onAward={(student)=>{
                    setSelectedStudent(null);
                    setAwardStudentPrefill(student);
                    setPrefillAwardBadge(null);
                    setShowAwardModal(true);
                }}
            />
        </InstructorLayout>
    );
};

export default InstructorBadgeManagement;
