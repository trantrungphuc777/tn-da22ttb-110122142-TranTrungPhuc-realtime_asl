import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trophy, Star, Flame, Target, Zap, Crown, BookOpen,
    GraduationCap, Sparkles, Award, Shield, Medal,
    ChevronLeft, Lock, CheckCircle2, TrendingUp, Calendar,
    Filter, Grid3X3, List, RefreshCw, Info, X, Rocket
} from 'lucide-react';
import Layout from './Layout';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-hot-toast';

/* ─── Icon map ─────────────────────────────────────────────────────────────── */
const ICON_MAP = {
    Star, Trophy, Flame, Target, Zap, Crown, BookOpen,
    GraduationCap, Sparkles, Award, Shield, Medal
};

/* ─── Rarity config ─────────────────────────────────────────────────────────── */
const RARITY_BASE = {
    common: {
        gradient: 'from-red-400 to-rose-500',
        glow: 'rgba(239,68,68,0.7)', border: 'rgba(239,68,68,0.6)',
        bg: 'from-red-50 to-rose-50', text: '#dc2626', ring: '#f87171', stars: 1,
        glowClass: '', emoji: '🔴',
        solidColor: '#ef4444', solidBg: '#fee2e2',
    },
    uncommon: {
        gradient: 'from-emerald-400 to-teal-500',
        glow: 'rgba(16,185,129,0.75)', border: 'rgba(16,185,129,0.6)',
        bg: 'from-emerald-50 to-teal-50', text: '#047857', ring: '#10b981', stars: 2,
        glowClass: '', emoji: '🟢',
        solidColor: '#10b981', solidBg: '#d1fae5',
    },
    rare: {
        gradient: 'from-sky-400 to-blue-500',
        glow: 'rgba(14,165,233,0.75)', border: 'rgba(14,165,233,0.6)',
        bg: 'from-sky-50 to-blue-50', text: '#0369a1', ring: '#0ea5e9', stars: 3,
        glowClass: '', emoji: '🔵',
        solidColor: '#0ea5e9', solidBg: '#e0f2fe',
    },
    epic: {
        gradient: 'from-orange-400 to-amber-500',
        glow: 'rgba(249,115,22,0.8)', border: 'rgba(249,115,22,0.65)',
        bg: 'from-orange-50 to-amber-50', text: '#ea580c', ring: '#fb923c', stars: 4,
        glowClass: 'epic-glow', emoji: '🟠',
        solidColor: '#f97316', solidBg: '#ffedd5',
    },
    legendary: {
        gradient: 'from-amber-400 via-orange-500 to-red-500',
        glow: 'rgba(251,191,36,0.9)', border: 'rgba(251,191,36,0.75)',
        bg: 'from-amber-50 via-orange-50 to-red-50', text: '#b45309', ring: '#fbbf24', stars: 5,
        glowClass: 'legendary-glow', emoji: '🟡',
        solidColor: '#f59e0b', solidBg: '#fef3c7',
    },
};

const RARITY_LABELS = {
    vi: { common: 'Cơ Bản', uncommon: 'Trung Cấp', rare: 'Nâng Cao', epic: 'Chuyên Sâu', legendary: 'Tinh Hoa' },
    en: { common: 'Basic',  uncommon: 'Intermediate', rare: 'Advanced', epic: 'Expert',   legendary: 'Elite' },
};

const getRARITY = (lang = 'vi') => {
    const labels = RARITY_LABELS[lang] || RARITY_LABELS.vi;
    const result = {};
    Object.entries(RARITY_BASE).forEach(([k, v]) => { result[k] = { ...v, label: labels[k] }; });
    return result;
};

// Keep backward-compat alias defaulting to 'vi' (for components not yet passing lang)
const RARITY = getRARITY('vi');

const RARITY_ORDER = ['common','uncommon','rare','epic','legendary'];

/* ─── Animated counter ──────────────────────────────────────────────────────── */
const AnimatedNumber = ({ value, duration = 1200 }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0;
        const step = value / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= value) { setDisplay(value); clearInterval(timer); }
            else setDisplay(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [value, duration]);
    return <span>{display}</span>;
};

/* ─── Confetti burst ────────────────────────────────────────────────────────── */
const ConfettiBurst = ({ active }) => {
    const pieces = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        color: ['#fbbf24','#f472b6','#60a5fa','#34d399','#a78bfa','#fb923c','#f87171','#38bdf8'][i % 8],
        x: Math.random() * 100,
        delay: Math.random() * 0.6,
        size: 5 + Math.random() * 10,
        rotate: Math.random() * 360,
        duration: 2.2 + Math.random() * 1.2,
    }));
    if (!active) return null;
    return (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
            {pieces.map(p => (
                <div key={p.id} className="absolute confetti-3d"
                    style={{
                        left: `${p.x}%`, top: '-20px',
                        width: p.size, height: p.size,
                        background: p.color,
                        borderRadius: Math.random() > 0.5 ? '50%' : '3px',
                        transform: `rotate(${p.rotate}deg)`,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                    }}
                />
            ))}
        </div>
    );
};

/* ─── Sparkle dots around earned badge icon ────────────────────────────────── */
const SparkleRing = ({ color }) => (
    <div className="absolute inset-0 pointer-events-none">
        {[
            { cls: 'sparkle-1', top: '-8px', left: '50%', ml: '-4px' },
            { cls: 'sparkle-2', top: '50%', right: '-8px', mt: '-4px' },
            { cls: 'sparkle-3', bottom: '-8px', left: '50%', ml: '-4px' },
            { cls: 'sparkle-4', top: '50%', left: '-8px', mt: '-4px' },
        ].map((s, i) => (
            <div key={i} className={`absolute w-2 h-2 rounded-full ${s.cls}`}
                style={{ background: color, top: s.top, left: s.left, right: s.right,
                    bottom: s.bottom, marginLeft: s.ml, marginTop: s.mt }} />
        ))}
    </div>
);

/* ─── Skeleton card ─────────────────────────────────────────────────────────── */
const SkeletonCard = () => (
    <div className="rounded-[20px] overflow-hidden border border-slate-200/60 bg-white/80 p-4">
        <div className="skeleton-shimmer w-16 h-16 rounded-2xl mx-auto mb-3" />
        <div className="skeleton-shimmer h-3 w-3/4 mx-auto mb-2 rounded-full" />
        <div className="skeleton-shimmer h-2 w-1/2 mx-auto rounded-full" />
    </div>
);

/* ─── 3D Badge Card ─────────────────────────────────────────────────────────── */
const BadgeCard = ({ badge, index, onSelect, isNew }) => {
    const { lang } = useLanguage();
    const cardRef = useRef(null);
    const r = getRARITY(lang)[badge.rarity] || getRARITY(lang).common;
    const earned = badge.earned;
    const progress = badge.progress ?? 0;
    const isLegendary = badge.rarity === 'legendary';
    const isEpic = badge.rarity === 'epic';

    const handleMouseMove = useCallback((e) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        card.style.transform = `perspective(700px) rotateX(${-dy * 14}deg) rotateY(${dx * 14}deg) translateZ(18px) scale(1.05)`;
        card.style.boxShadow = `${-dx * 14}px ${-dy * 14}px 48px ${r.glow}, 0 8px 32px rgba(0,0,0,0.12)`;
    }, [r.glow]);

    const handleMouseLeave = useCallback(() => {
        const card = cardRef.current;
        if (!card) return;
        card.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)';
        card.style.boxShadow = earned
            ? `0 4px 24px ${r.glow.replace('0.', '0.3')}`
            : '0 2px 12px rgba(0,0,0,0.06)';
    }, [earned, r.glow]);

    return (
        <div
            ref={cardRef}
            onClick={() => onSelect(badge)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`relative cursor-pointer select-none badge-card-3d badge-enter ${isNew ? 'badge-unlock' : ''}`}
            style={{
                animationDelay: `${index * 0.055}s`,
                borderRadius: '20px',
            }}
        >
            {/* Outer glow for epic/legendary */}
            <div className={`relative rounded-[20px] overflow-hidden border-2 transition-all duration-300
                ${earned ? r.glowClass : ''}
                ${!earned ? 'opacity-60 grayscale' : ''}`}
                style={{
                    borderColor: earned ? r.border : 'rgba(203,213,225,0.5)',
                    background: earned
                        ? 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 100%)'
                        : 'rgba(248,250,252,0.85)',
                    backdropFilter: 'blur(12px)',
                }}
            >
                {/* Rarity top strip */}
                {earned && (
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${r.gradient}`}
                        style={{ borderRadius: '20px 20px 0 0' }} />
                )}

                {/* Holographic shimmer for legendary */}
                {earned && isLegendary && <div className="holo-shimmer" />}

                {/* Card shimmer sweep for all earned */}
                {earned && <div className="card-shimmer-effect absolute inset-0 pointer-events-none rounded-[20px]" />}

                {/* Glow overlay */}
                {earned && (
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ background: `radial-gradient(ellipse at 50% 0%, ${r.glow.replace('0.', '0.07')} 0%, transparent 70%)` }} />
                )}

                {/* Lock overlay */}
                {!earned && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <div className="bg-white/60 backdrop-blur-sm rounded-full p-2">
                            <Lock className="w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                )}

                {/* Earned checkmark */}
                {earned && (
                    <div className="absolute top-3 right-3 z-10">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${r.ring}, ${r.text})` }}>
                            <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                    </div>
                )}

                {/* Badge icon area */}
                <div className="pt-6 pb-3 px-4 flex flex-col items-center">
                    <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                        style={{
                            background: earned
                                ? `linear-gradient(135deg, ${r.glow.replace('0.', '0.15')}, ${r.glow.replace('0.', '0.28')})`
                                : 'rgba(241,245,249,0.8)',
                            boxShadow: earned ? `0 4px 20px ${r.glow.replace('0.', '0.45')}` : 'none',
                        }}
                    >
                        <span className={`text-3xl ${earned ? 'icon-bounce' : ''}`}
                            style={{ filter: earned ? 'none' : 'grayscale(1)' }}>
                            {badge.emoji}
                        </span>
                        {/* Sparkle ring for epic/legendary earned */}
                        {earned && (isLegendary || isEpic) && <SparkleRing color={r.ring} />}
                        {/* Pulse ring */}
                        {earned && (isLegendary || isEpic) && (
                            <div className="absolute inset-0 rounded-2xl animate-pulse-ring"
                                style={{ '--ring-color': r.ring }} />
                        )}
                    </div>

                    {/* Stars — khi đạt: 5 sao đầy đủ màu rarity; chưa đạt: số sao theo cấp độ khó */}
                    <div className="flex gap-0.5 mb-2">
                        {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} className="w-3 h-3"
                                fill={earned ? r.ring : (i < r.stars ? r.ring : 'transparent')}
                                stroke={earned ? r.ring : (i < r.stars ? r.ring : '#cbd5e1')}
                                strokeWidth={1.5} />
                        ))}
                    </div>

                    <h3 className={`font-bold text-center text-sm leading-tight mb-1 line-clamp-2
                        ${earned ? 'badge-name-gradient-earned' : 'text-slate-500'}`}
                        style={earned ? {
                            backgroundImage: `linear-gradient(135deg, ${r.text}, ${r.ring})`,
                        } : {}}>
                        {badge.name?.[lang] || badge.name?.vi || badge.name?.en}
                    </h3>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                        style={{
                            background: earned ? `${r.glow.replace('0.', '0.15')}` : 'rgba(241,245,249,1)',
                            color: earned ? r.text : '#94a3b8',
                        }}>
                        {r.label}
                    </span>
                </div>

                {/* Progress bar for unearned */}
                {!earned && (
                    <div className="px-4 pb-4">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>{lang === 'vi' ? 'Tiến độ' : 'Progress'}</span><span>{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full progress-animated"
                                style={{
                                    width: `${progress}%`,
                                    background: `linear-gradient(90deg, ${r.ring}, ${r.text})`,
                                    boxShadow: `0 0 6px ${r.glow.replace('0.', '0.5')}`,
                                }} />
                        </div>
                    </div>
                )}

                {/* Earned date */}
                {earned && badge.earnedAt && (
                    <div className="px-4 pb-4 text-center">
                        <span className="text-[10px] text-slate-400">
                            {new Date(badge.earnedAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─── Badge Detail Modal ────────────────────────────────────────────────────── */
const BadgeDetailModal = ({ badge, onClose }) => {
    const { lang } = useLanguage();
    if (!badge) return null;
    const r = getRARITY(lang)[badge.rarity] || getRARITY(lang).common;
    const earned = badge.earned;
    const isLegendary = badge.rarity === 'legendary';
    const isEpic = badge.rarity === 'epic';

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(10px)' }}
            onClick={onClose}>
            <div className={`relative w-full max-w-sm rounded-3xl overflow-hidden modal-enter
                ${earned && isLegendary ? 'legendary-glow' : ''}
                ${earned && isEpic ? 'epic-glow' : ''}`}
                style={{
                    background: 'rgba(255,255,255,0.98)',
                    boxShadow: `0 32px 80px ${r.glow}, 0 0 0 1px ${r.border}`,
                }}
                onClick={e => e.stopPropagation()}>

                {/* Holographic shimmer for legendary modal */}
                {earned && isLegendary && <div className="holo-shimmer" />}

                {/* Top gradient banner */}
                <div className={`h-36 bg-gradient-to-br ${r.gradient} relative overflow-hidden flex items-center justify-center`}>
                    <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    {/* Aurora overlay on banner */}
                    <div className="absolute inset-0 hero-aurora opacity-40" />
                    <div className="relative w-24 h-24 rounded-2xl flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                        <span className={`text-5xl ${earned ? 'icon-bounce' : ''}`}>{badge.emoji}</span>
                        {earned && (isLegendary || isEpic) && <SparkleRing color="rgba(255,255,255,0.9)" />}
                    </div>
                    {earned && (
                        <div className="absolute top-3 right-3 bg-white/30 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span className="text-white text-xs font-bold">{lang === 'vi' ? 'Đã đạt' : 'Earned'}</span>
                        </div>
                    )}
                </div>

                {/* Close button */}
                <button onClick={onClose}
                    className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center hover:bg-white/50 transition-colors">
                    <X className="w-4 h-4 text-white" />
                </button>

                {/* Content */}
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="flex gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                                <Star key={i} className="w-3.5 h-3.5"
                                    fill={earned ? r.ring : (i < r.stars ? r.ring : 'transparent')}
                                    stroke={earned ? r.ring : (i < r.stars ? r.ring : '#cbd5e1')}
                                    strokeWidth={1.5} />
                            ))}
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: r.text }}>
                            {r.label}
                        </span>
                    </div>

                    <h2 className="text-xl font-black text-slate-800 mb-2">
                        {badge.name?.[lang] || badge.name?.vi || badge.name?.en}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">
                        {badge.description?.[lang] || badge.description?.vi || badge.description?.en}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {[
                            { label: lang === 'vi' ? 'Trạng thái' : 'Status', value: earned ? `✅ ${lang === 'vi' ? 'Đã đạt' : 'Earned'}` : `🔒 ${lang === 'vi' ? 'Chưa đạt' : 'Not yet'}` },
                            { label: lang === 'vi' ? 'Tiến độ' : 'Progress', value: earned ? '100%' : `${badge.progress ?? 0}%` },
                        ].map((s, i) => (
                            <div key={i} className="rounded-2xl p-3 text-center"
                                style={{ background: `${r.glow.replace('0.', '0.08')}` }}>
                                <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                                <p className="font-bold text-sm" style={{ color: r.text }}>{s.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Progress bar */}
                    {!earned && (
                        <div className="mb-4">
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full badge-progress-bar progress-animated"
                                    style={{ width: `${badge.progress ?? 0}%` }} />
                            </div>
                        </div>
                    )}

                    {earned && badge.earnedAt && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Calendar className="w-4 h-4" />
                            <span>{lang === 'vi' ? 'Đạt được' : 'Earned on'}: {new Date(badge.earnedAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ─── Rarity filter pill ────────────────────────────────────────────────────── */
const RarityPill = ({ rarity, active, count, onClick }) => {
    const { lang } = useLanguage();
    const r = getRARITY(lang)[rarity] || getRARITY(lang).common;
    return (
        <button onClick={onClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 rarity-card"
            style={{
                background: active ? `linear-gradient(135deg, ${r.ring}33, ${r.text}22)` : 'white',
                color: active ? r.text : '#475569',
                border: `1.5px solid ${active ? r.border : '#e2e8f0'}`,
                boxShadow: active ? `0 2px 12px ${r.glow.replace('0.', '0.3')}` : '0 1px 4px rgba(0,0,0,0.06)',
                transform: active ? 'scale(1.05)' : 'scale(1)',
            }}>
            <span>{r.emoji}</span>
            {r.label}
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: active ? r.text : '#e2e8f0', color: active ? 'white' : '#475569' }}>
                {count}
            </span>
        </button>
    );
};

/* ─── Rarity breakdown mini card ────────────────────────────────────────────── */
const RarityCard = ({ rarity, earnedCount, totalCount, active, onClick }) => {
    const { lang } = useLanguage();
    const r = getRARITY(lang)[rarity] || getRARITY(lang).common;
    return (
        <div onClick={onClick}
            className="rarity-card rounded-2xl p-3 text-center cursor-pointer transition-all duration-200"
            style={{
                background: active
                    ? `linear-gradient(145deg, ${r.solidBg}, white)`
                    : 'white',
                border: `2px solid ${active ? r.solidColor : '#e2e8f0'}`,
                boxShadow: active
                    ? `0 6px 20px ${r.glow.replace(/[\d.]+\)$/, '0.35)')}, inset 0 1px 0 rgba(255,255,255,0.9)`
                    : '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)',
            }}>
            {/* Colored dot indicator */}
            <div className="w-8 h-8 rounded-full mx-auto mb-1.5 flex items-center justify-center shadow-md"
                style={{ background: `linear-gradient(135deg, ${r.solidColor}, ${r.ring})` }}>
                <span className="text-white text-xs font-black">{earnedCount}</span>
            </div>
            <div className="text-[11px] font-black" style={{ color: r.solidColor }}>
                <span>{earnedCount}</span>
                <span className="text-xs text-slate-400 font-normal">/{totalCount}</span>
            </div>
            <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: r.solidColor }}>
                {r.label}
            </div>
            {/* Mini progress bar */}
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                    style={{
                        width: totalCount > 0 ? `${(earnedCount / totalCount) * 100}%` : '0%',
                        background: `linear-gradient(90deg, ${r.solidColor}, ${r.ring})`,
                    }} />
            </div>
        </div>
    );
};

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
const StudentBadgesPage = () => {
    const navigate = useNavigate();
    const { lang, t } = useLanguage();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all'); // all | earned | unearned | honorary
    const [rarityFilter, setRarityFilter] = useState('all');
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [newBadgeId, setNewBadgeId] = useState(null);
    const prevEarnedIds = useRef(new Set());

    const fetchBadges = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/student/badges', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                const incoming = data.badges || [];
                // Detect newly earned official badges since last fetch
                const newlyEarned = incoming.filter(b => b.earned && !b.isHonorary && !prevEarnedIds.current.has(b._id));
                // Detect newly earned honorary badges
                const newlyHonorary = incoming.filter(b => b.isHonorary && !prevEarnedIds.current.has('honorary_' + b._id));

                if (newlyEarned.length > 0 && prevEarnedIds.current.size > 0) {
                    setNewBadgeId(newlyEarned[0]._id);
                    setShowConfetti(true);
                    toast.success(`🎉 ${lang === 'vi' ? 'Bạn vừa đạt huy hiệu' : 'You just earned'}: ${newlyEarned[0].name?.[lang] || newlyEarned[0].name?.vi}`, { duration: 4000 });
                    setTimeout(() => { setShowConfetti(false); setNewBadgeId(null); }, 3500);
                }

                if (newlyHonorary.length > 0 && prevEarnedIds.current.size > 0) {
                    toast(`🎖️ ${lang === 'vi' ? 'Giảng viên vừa trao huy hiệu danh dự' : 'Instructor awarded you an honorary badge'}: ${newlyHonorary[0].name?.[lang] || newlyHonorary[0].name?.vi}`, {
                        duration: 5000,
                        icon: '🎖️',
                        style: { background: '#faf5ff', border: '1px solid #c084fc', color: '#7e22ce' }
                    });
                }

                prevEarnedIds.current = new Set([
                    ...incoming.filter(b => b.earned && !b.isHonorary).map(b => b._id),
                    ...incoming.filter(b => b.isHonorary).map(b => 'honorary_' + b._id)
                ]);
                setBadges(incoming);
            } else {
                toast.error(lang === 'vi' ? 'Không thể tải huy hiệu' : 'Could not load badges');
            }
        } catch {
            toast.error(lang === 'vi' ? 'Lỗi kết nối server' : 'Server connection error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchBadges(); }, [fetchBadges]);

    // Tự refresh khi tab được focus lại — để cập nhật sau khi giảng viên trao danh dự
    // Dùng debounce nhẹ để tránh gọi 2 lần liên tiếp khi trang vừa load
    useEffect(() => {
        let lastFocus = Date.now();
        const onFocus = () => {
            const now = Date.now();
            if (now - lastFocus > 2000) { // chỉ refresh nếu đã rời tab > 2 giây
                fetchBadges(true);
            }
            lastFocus = now;
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [fetchBadges]);

    const earned = badges.filter(b => b.earned && !b.isHonorary);
    const honorary = badges.filter(b => b.isHonorary);
    const unearned = badges.filter(b => !b.earned && !b.isHonorary);
    const total = badges.filter(b => !b.isHonorary).length;
    const pct = total > 0 ? Math.round((earned.length / total) * 100) : 0;

    const rarityCounts = RARITY_ORDER.reduce((acc, r) => {
        acc[r] = badges.filter(b => b.rarity === r && !b.isHonorary).length;
        return acc;
    }, {});
    const rarityEarnedCounts = RARITY_ORDER.reduce((acc, r) => {
        acc[r] = badges.filter(b => b.rarity === r && b.earned && !b.isHonorary).length;
        return acc;
    }, {});

    const filtered = badges.filter(b => {
        if (filter === 'honorary') return b.isHonorary;
        if (b.isHonorary) return false; // ẩn honorary khỏi các tab khác
        const matchFilter = filter === 'all' || (filter === 'earned' ? b.earned : !b.earned);
        const matchRarity = rarityFilter === 'all' || b.rarity === rarityFilter;
        return matchFilter && matchRarity;
    });

    const handleSelectBadge = (badge) => {
        setSelectedBadge(badge);
        if (badge.earned && (badge.rarity === 'legendary' || badge.rarity === 'epic')) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
        }
    };

    /* ── Loading skeleton ── */
    if (loading) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Skeleton hero */}
                    <div className="skeleton-shimmer h-48 rounded-3xl mb-8" />
                    {/* Skeleton rarity row */}
                    <div className="grid grid-cols-5 gap-3 mb-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="skeleton-shimmer h-20 rounded-2xl" />
                        ))}
                    </div>
                    {/* Skeleton grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {/* Confetti */}
            <ConfettiBurst active={showConfetti} />

            {/* Badge detail modal */}
            {selectedBadge && (
                <BadgeDetailModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
            )}

            <div className="relative min-h-screen page-enter">
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8">

                    {/* ── Back button ── */}
                    <button onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-6 group">
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">{lang === 'vi' ? 'Quay lại Dashboard' : 'Back to Dashboard'}</span>
                    </button>

                    {/* ── Hero Banner ── */}
                    <div className="relative rounded-3xl overflow-hidden mb-8 p-8 noise-overlay spotlight"
                        style={{
                            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 40%, #0ea5e9 80%, #38bdf8 100%)',
                            boxShadow: '0 20px 60px rgba(30,64,175,0.35)',
                        }}>
                        {/* Aurora mesh overlay */}
                        <div className="absolute inset-0 hero-aurora opacity-60" />
                        {/* Dot grid */}
                        <div className="absolute inset-0 opacity-10"
                            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
                        {/* Orbs */}
                        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-15 orb-1"
                            style={{ background: 'radial-gradient(circle, #fbbf24, transparent)', transform: 'translate(30%,-30%)' }} />
                        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-15 orb-2"
                            style={{ background: 'radial-gradient(circle, #60a5fa, transparent)', transform: 'translate(-30%,30%)' }} />

                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                            {/* Trophy icon */}
                            <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 animate-float"
                                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                                <span className="text-4xl">🏆</span>
                            </div>

                            {/* Text */}
                            <div className="flex-1">
                                <h1 className="text-3xl sm:text-4xl font-black text-white mb-1 tracking-tight">
                                    {lang === 'vi' ? 'Thành Tích Học Tập' : 'Learning Achievements'}
                                </h1>
                                <p className="text-blue-200 text-sm mb-4">
                                    {lang === 'vi' ? 'Hoàn thành các mục tiêu học tập để nhận huy hiệu và ghi nhận thành tích của bạn' : 'Complete learning goals to earn badges and have your achievements recognized'}
                                </p>
                                {/* Progress bar */}
                                <div className="max-w-sm">
                                    <div className="flex justify-between text-xs text-blue-200 mb-1.5">
                                        <span>{lang === 'vi' ? 'Tiến độ tổng thể' : 'Overall progress'}</span>
                                        <span className="font-bold text-white">{pct}%</span>
                                    </div>
                                    <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full glow-progress progress-animated"
                                            style={{ width: `${pct}%` }} />
                                    </div>
                                    <p className="text-blue-200 text-xs mt-1.5">
                                        <span className="text-white font-bold">{earned.length}</span> / {total} {lang === 'vi' ? 'huy hiệu' : 'badges'}
                                    </p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex gap-3 flex-shrink-0">
                                {[
                                    { label: lang === 'vi' ? 'Đã đạt' : 'Earned', value: earned.length, emoji: '✅' },
                                    { label: lang === 'vi' ? 'Chưa đạt' : 'Not yet', value: unearned.length, emoji: '🔒' },
                                    { label: lang === 'vi' ? 'Danh dự' : 'Honorary', value: honorary.length, emoji: '🎖️' },
                                    { label: lang === 'vi' ? 'Tổng cộng' : 'Total', value: total, emoji: '🎯' },
                                ].map((s, i) => (
                                    <div key={i} className="text-center px-4 py-3 rounded-2xl stat-pop"
                                        style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', animationDelay: `${i * 0.1}s` }}>
                                        <div className="text-xl mb-0.5">{s.emoji}</div>
                                        <div className="text-2xl font-black text-white">
                                            <AnimatedNumber value={s.value} />
                                        </div>
                                        <div className="text-blue-200 text-[10px] font-medium">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Main Tab Navigation ── */}
                    <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 border border-slate-200/60 shadow-sm mb-6 w-fit">
                        <button
                            onClick={() => { setFilter('all'); setRarityFilter('all'); }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                            style={{
                                background: filter !== 'honorary'
                                    ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                                    : 'transparent',
                                color: filter !== 'honorary' ? 'white' : '#64748b',
                                boxShadow: filter !== 'honorary' ? '0 2px 12px rgba(99,102,241,0.4)' : 'none',
                            }}>
                            <Trophy className="w-4 h-4" />
                            {lang === 'vi' ? 'Huy Hiệu' : 'Badges'}
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-black"
                                style={{
                                    background: filter !== 'honorary' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                                    color: filter !== 'honorary' ? 'white' : '#475569'
                                }}>
                                {total}
                            </span>
                        </button>
                        <button
                            onClick={() => setFilter('honorary')}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                            style={{
                                background: filter === 'honorary'
                                    ? 'linear-gradient(135deg, #9333ea, #a855f7)'
                                    : 'transparent',
                                color: filter === 'honorary' ? 'white' : '#64748b',
                                boxShadow: filter === 'honorary' ? '0 2px 12px rgba(147,51,234,0.4)' : 'none',
                            }}>
                            <Medal className="w-4 h-4" />
                            {lang === 'vi' ? 'Huy Hiệu Danh Dự' : 'Honorary Badges'}
                            {honorary.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-black"
                                    style={{
                                        background: filter === 'honorary' ? 'rgba(255,255,255,0.25)' : '#f3e8ff',
                                        color: filter === 'honorary' ? 'white' : '#9333ea'
                                    }}>
                                    {honorary.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* ── Sub-filter bar (chỉ hiển thị khi ở tab Huy Hiệu) ── */}
                    {filter !== 'honorary' && (
                        <div>
                            {/* Rarity breakdown cards */}
                            <div className="grid grid-cols-5 gap-3 mb-5">
                                {RARITY_ORDER.map(r => (
                                    <RarityCard key={r} rarity={r}
                                        earnedCount={rarityEarnedCounts[r] || 0}
                                        totalCount={rarityCounts[r] || 0}
                                        active={rarityFilter === r}
                                        onClick={() => setRarityFilter(rarityFilter === r ? 'all' : r)} />
                                ))}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                {/* Status sub-filter */}
                                <div className="flex gap-2 bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 border border-slate-200/60 shadow-sm">
                                    {[
                                        { key: 'all', label: `${lang === 'vi' ? 'Tất cả' : 'All'} (${total})`, icon: Grid3X3 },
                                        { key: 'earned', label: `${lang === 'vi' ? 'Đã đạt' : 'Earned'} (${earned.length})`, icon: CheckCircle2 },
                                        { key: 'unearned', label: `${lang === 'vi' ? 'Chưa đạt' : 'Not yet'} (${unearned.length})`, icon: Lock },
                                    ].map(({ key, label, icon: Icon }) => (
                                        <button key={key} onClick={() => setFilter(key)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                                            style={{
                                                background: filter === key
                                                    ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                                                    : 'transparent',
                                                color: filter === key ? 'white' : '#64748b',
                                                boxShadow: filter === key ? '0 2px 12px rgba(99,102,241,0.4)' : 'none',
                                            }}>
                                            <Icon className="w-3.5 h-3.5" />{label}
                                        </button>
                                    ))}
                                </div>

                                {/* Rarity pills */}
                                <div className="flex flex-wrap gap-2">
                                    {RARITY_ORDER.map(r => (
                                        <RarityPill key={r} rarity={r} active={rarityFilter === r}
                                            count={rarityCounts[r] || 0}
                                            onClick={() => setRarityFilter(rarityFilter === r ? 'all' : r)} />
                                    ))}
                                </div>

                                {/* Refresh */}
                                <button onClick={() => fetchBadges(true)} disabled={refreshing}
                                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                                    {lang === 'vi' ? 'Làm mới' : 'Refresh'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Refresh button khi ở tab danh dự */}
                    {filter === 'honorary' && (
                        <div className="flex justify-end mb-4">
                            <button onClick={() => fetchBadges(true)} disabled={refreshing}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-all">
                                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                                {lang === 'vi' ? 'Làm mới' : 'Refresh'}
                            </button>
                        </div>
                    )}

                    {/* ── Badge grid ── */}
                    {filter === 'honorary' ? (
                        /* ── Honorary tab ── */
                        honorary.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4 animate-float">🎖️</div>
                                <p className="text-slate-500 font-semibold text-sm">{lang === 'vi' ? 'Chưa có huy hiệu danh dự' : 'No honorary badges yet'}</p>
                                <p className="text-slate-400 text-xs mt-1">{lang === 'vi' ? 'Giảng viên sẽ trao khi bạn có tiến bộ đặc biệt' : 'Instructors will award these for exceptional progress'}</p>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl mb-6"
                                    style={{ background: 'linear-gradient(135deg, #faf5ff, #ede9fe)', border: '1.5px solid #c084fc' }}>
                                    <span className="text-2xl">🎖️</span>
                                    <div>
                                        <p className="text-sm font-bold text-purple-800">{lang === 'vi' ? 'Huy Hiệu Danh Dự' : 'Honorary Badges'}</p>
                                        <p className="text-xs text-purple-600 mt-0.5">
                                            {lang === 'vi'
                                                ? <>Những huy hiệu này được giảng viên trao đặc biệt để ghi nhận sự tiến bộ của bạn. Chúng <strong>không tính</strong> vào thành tích chính thức nhưng thể hiện sự ghi nhận từ giảng viên.</>
                                                : <>These badges are specially awarded by instructors to recognize your progress. They <strong>do not count</strong> toward official achievements but reflect instructor recognition.</>
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {honorary.map((badge, i) => {
                                        const r = getRARITY(lang)[badge.rarity] || getRARITY(lang).common;
                                        return (
                                            <div key={badge._id}
                                                onClick={() => setSelectedBadge({ ...badge, earned: true })}
                                                className="relative cursor-pointer rounded-[20px] overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                                                style={{ borderColor: '#c084fc', background: 'linear-gradient(145deg, #faf5ff, white)' }}>
                                                {/* Purple glow strip */}
                                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-violet-500" />
                                                {/* Honorary ribbon */}
                                                <div className="absolute top-3 left-3 z-10">
                                                        <span className="text-[9px] font-black bg-purple-600 text-white px-1.5 py-0.5 rounded-full tracking-wide">
                                                        {lang === 'vi' ? 'DANH DỰ' : 'HONORARY'}
                                                    </span>
                                                </div>
                                                <div className="pt-7 pb-3 px-4 flex flex-col items-center">
                                                    <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                                                        style={{ background: 'linear-gradient(135deg, rgba(192,132,252,0.2), rgba(139,92,246,0.3))', boxShadow: '0 4px 20px rgba(139,92,246,0.4)' }}>
                                                        <span className="text-3xl">{badge.emoji}</span>
                                                    </div>
                                                    <h3 className="font-bold text-center text-[13px] leading-tight mb-1 line-clamp-2 text-purple-900">
                                                        {badge.name?.[lang] || badge.name?.vi || badge.name?.en}
                                                    </h3>
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                                        style={{ background: r.solidBg, color: r.solidColor }}>
                                                        {r.label}
                                                    </span>
                                                    {badge.earnedAt && (
                                                        <p className="text-[10px] text-purple-400 mt-2 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(badge.earnedAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                                                        </p>
                                                    )}
                                                    {badge.honoraryNote && (
                                                        <p className="text-[9px] text-purple-500 mt-1 italic text-center line-clamp-2">
                                                            "{badge.honoraryNote}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4 animate-float">🔍</div>
                            <p className="text-slate-400 font-medium">{lang === 'vi' ? 'Không tìm thấy huy hiệu nào' : 'No badges found'}</p>
                        </div>
                    ) : (rarityFilter === 'all' && filter === 'all') ? (
                        /* ── Grouped by tier when viewing all ── */
                        <div className="space-y-8">
                            {RARITY_ORDER.map(r => {
                                const tierBadges = filtered.filter(b => b.rarity === r);
                                if (tierBadges.length === 0) return null;
                                const rc = getRARITY(lang)[r];
                                const earnedInTier = tierBadges.filter(b => b.earned).length;
                                return (
                                    <div key={r}>
                                        {/* Tier header */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border"
                                                style={{ background: rc.solidBg, borderColor: rc.border }}>
                                                <span className="text-base">{rc.emoji}</span>
                                                <span className="font-bold text-sm" style={{ color: rc.text }}>
                                                    {rc.label}
                                                </span>
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                                                    style={{ background: rc.solidColor + '22', color: rc.text }}>
                                                    {earnedInTier}/{tierBadges.length}
                                                </span>
                                            </div>
                                            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${rc.solidColor}44, transparent)` }} />
                                        </div>
                                        {/* Tier badges */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                            {tierBadges.map((badge, i) => (
                                                <BadgeCard key={badge._id} badge={badge} index={i}
                                                    onSelect={handleSelectBadge}
                                                    isNew={badge._id === newBadgeId} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* ── Flat grid when filtering ── */
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {filtered.map((badge, i) => (
                                <BadgeCard key={badge._id} badge={badge} index={i}
                                    onSelect={handleSelectBadge}
                                    isNew={badge._id === newBadgeId} />
                            ))}
                        </div>
                    )}

                    {/* ── Motivational footer ── */}
                    {unearned.length > 0 && (
                        <div className="mt-10 rounded-3xl p-6 text-center footer-pulse"
                            style={{
                                background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.06))',
                                border: '1.5px solid rgba(99,102,241,0.15)',
                            }}>
                            <div className="text-3xl mb-2 animate-float">💪</div>
                            <h3 className="font-bold text-slate-700 mb-1">{lang === 'vi' ? `Còn ${unearned.length} huy hiệu chưa đạt được` : `${unearned.length} badge${unearned.length !== 1 ? 's' : ''} still to earn`}</h3>
                            <p className="text-sm text-slate-400">{lang === 'vi' ? 'Tiếp tục luyện tập để hoàn thành các mục tiêu học tập còn lại' : 'Keep practicing to complete your remaining learning goals'}</p>
                            <button onClick={() => navigate('/practice')}
                                className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold text-white neon-btn inline-flex items-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                                <Rocket className="w-4 h-4" />
                                {lang === 'vi' ? 'Luyện tập ngay' : 'Practice now'}
                            </button>
                        </div>
                    )}

                    {/* ── All earned! ── */}
                    {unearned.length === 0 && total > 0 && (
                        <div className="mt-10 rounded-3xl p-8 text-center legendary-glow"
                            style={{
                                background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.08))',
                                border: '2px solid rgba(251,191,36,0.3)',
                            }}>
                            <div className="text-5xl mb-3 animate-float">🌟</div>
                            <h3 className="text-2xl font-black text-amber-700 mb-2">{lang === 'vi' ? 'Hoàn Thành Toàn Bộ Chương Trình!' : 'All Achievements Completed!'}</h3>
                            <p className="text-amber-600">{lang === 'vi' ? `Bạn đã đạt được tất cả ${total} huy hiệu thành tích. Kết quả học tập xuất sắc!` : `You've earned all ${total} achievement badges. Outstanding learning results!`}</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default StudentBadgesPage;
