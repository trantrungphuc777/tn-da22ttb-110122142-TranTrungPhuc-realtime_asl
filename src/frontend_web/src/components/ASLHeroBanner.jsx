import React, { useRef, useEffect, useState, useCallback } from 'react';
import { HandMetal, Eye, Brain, ChevronRight } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   ASL Hero Banner — Ultra 3D Professional v2
   Features:
   - Canvas particle network (neural connections)
   - Mouse-tracking 3D perspective tilt
   - Holographic rotating ring
   - CSS 3D spinning cubes with glassmorphism faces
   - Animated typing text for ASL letters
   - Multi-layer depth parallax
   - Neon glow buttons with ripple effect
   - Live stats ticker
═══════════════════════════════════════════════════════════════ */

// ── Particle Network Canvas ──────────────────────────────────
const ParticleCanvas = ({ reduced }) => {
    const canvasRef = useRef(null);
    const animRef   = useRef(null);
    const ptRef     = useRef([]);

    useEffect(() => {
        if (reduced) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Init particles
        const COUNT = 55;
        ptRef.current = Array.from({ length: COUNT }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.55,
            vy: (Math.random() - 0.5) * 0.55,
            r:  Math.random() * 1.8 + 0.8,
            o:  Math.random() * 0.5 + 0.3,
        }));

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const pts = ptRef.current;

            // Draw connections
            for (let i = 0; i < pts.length; i++) {
                for (let j = i + 1; j < pts.length; j++) {
                    const dx = pts[i].x - pts[j].x;
                    const dy = pts[i].y - pts[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 110) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(56,189,248,${0.18 * (1 - dist / 110)})`;
                        ctx.lineWidth = 0.7;
                        ctx.moveTo(pts[i].x, pts[i].y);
                        ctx.lineTo(pts[j].x, pts[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Draw particles
            pts.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height)  p.vy *= -1;

                ctx.beginPath();
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
                grad.addColorStop(0, `rgba(56,189,248,${p.o})`);
                grad.addColorStop(1, 'rgba(56,189,248,0)');
                ctx.fillStyle = grad;
                ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
                ctx.fill();
            });

            animRef.current = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [reduced]);

    if (reduced) return null;
    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
        />
    );
};

// ── 3D Holographic Ring ──────────────────────────────────────
const HoloRing = ({ size = 120, color1 = '#38bdf8', color2 = '#818cf8', speed = 8 }) => (
    <div style={{ width: size, height: size, position: 'relative' }} className="pointer-events-none">
        {[0, 1, 2].map(i => (
            <div key={i} style={{
                position: 'absolute', inset: i * 14,
                borderRadius: '50%',
                border: `${1.5 - i * 0.3}px solid`,
                borderColor: i === 0 ? `${color1}60` : i === 1 ? `${color2}45` : `${color1}30`,
                animation: `holo-ring-spin-${i % 2 === 0 ? 'cw' : 'ccw'} ${speed + i * 3}s linear infinite`,
                boxShadow: i === 0 ? `0 0 12px ${color1}40, inset 0 0 12px ${color1}15` : 'none',
            }} />
        ))}
        {/* Center core */}
        <div style={{
            position: 'absolute', inset: '38%',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color1}80 0%, ${color2}40 60%, transparent 100%)`,
            animation: 'holo-core-pulse 2.5s ease-in-out infinite',
        }} />
    </div>
);

// ── 3D Glassmorphism Cube ────────────────────────────────────
const Cube3D = ({ size = 64, emojis, spinDur = 10, floatDur = 3.5, floatDelay = 0 }) => {
    const half = size / 2;
    return (
        <div style={{ width: size, height: size, perspective: `${size * 6}px`,
            animation: `cube-float ${floatDur}s ease-in-out infinite ${floatDelay}s` }}
            className="pointer-events-none">
            <div style={{
                width: '100%', height: '100%', position: 'relative',
                transformStyle: 'preserve-3d',
                animation: `cube-spin ${spinDur}s linear infinite`,
            }}>
                {[
                    { t: `translateZ(${half}px)`,                     e: emojis[0] },
                    { t: `rotateY(180deg) translateZ(${half}px)`,     e: emojis[1] },
                    { t: `rotateY(90deg) translateZ(${half}px)`,      e: emojis[2] },
                    { t: `rotateY(-90deg) translateZ(${half}px)`,     e: emojis[3] },
                    { t: `rotateX(90deg) translateZ(${half}px)`,      e: emojis[4] },
                    { t: `rotateX(-90deg) translateZ(${half}px)`,     e: emojis[5] },
                ].map(({ t, e }, i) => (
                    <div key={i} style={{
                        position: 'absolute', width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transform: t,
                        background: 'rgba(10,22,50,0.55)',
                        border: '1px solid rgba(56,189,248,0.28)',
                        backdropFilter: 'blur(6px)',
                        fontSize: size * 0.42,
                        boxShadow: i === 0 ? 'inset 0 0 20px rgba(56,189,248,0.12)' : 'none',
                    }}>
                        {e}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Typing Text Animator ─────────────────────────────────────
const TypingText = ({ words, className, style }) => {
    const [idx, setIdx]       = useState(0);
    const [display, setDisplay] = useState('');
    const [phase, setPhase]   = useState('type'); // 'type' | 'pause' | 'erase'
    const timerRef = useRef(null);

    useEffect(() => {
        const word = words[idx % words.length];
        if (phase === 'type') {
            if (display.length < word.length) {
                timerRef.current = setTimeout(() => setDisplay(word.slice(0, display.length + 1)), 80);
            } else {
                timerRef.current = setTimeout(() => setPhase('pause'), 1600);
            }
        } else if (phase === 'pause') {
            timerRef.current = setTimeout(() => setPhase('erase'), 400);
        } else {
            if (display.length > 0) {
                timerRef.current = setTimeout(() => setDisplay(d => d.slice(0, -1)), 45);
            } else {
                setIdx(i => i + 1);
                setPhase('type');
            }
        }
        return () => clearTimeout(timerRef.current);
    }, [display, phase, idx, words]);

    return (
        <span className={className} style={style}>
            {display}
            <span style={{ opacity: phase === 'erase' ? 0.3 : 1, animation: 'cursor-blink 0.9s step-end infinite' }}>|</span>
        </span>
    );
};

// ── Neon Button with ripple ──────────────────────────────────
const NeonButton = ({ onClick, gradient, border, glow, children, ghost }) => {
    const [ripples, setRipples] = useState([]);
    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const id   = Date.now();
        setRipples(r => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
        setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 650);
        onClick?.();
    };
    return (
        <button onClick={handleClick}
            style={{
                position: 'relative', overflow: 'hidden',
                background: ghost ? 'rgba(255,255,255,0.06)' : gradient,
                border: `1px solid ${border}`,
                boxShadow: ghost ? 'none' : `0 0 22px ${glow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
                color: '#fff',
                padding: '9px 20px',
                borderRadius: 14,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
                display: 'inline-flex', alignItems: 'center', gap: 7,
                transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)';
                if (!ghost) e.currentTarget.style.boxShadow = `0 0 35px ${glow}, inset 0 1px 0 rgba(255,255,255,0.22)`;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                if (!ghost) e.currentTarget.style.boxShadow = `0 0 22px ${glow}, inset 0 1px 0 rgba(255,255,255,0.18)`;
            }}>
            {ripples.map(rp => (
                <span key={rp.id} style={{
                    position: 'absolute',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.25)',
                    width: 8, height: 8,
                    left: rp.x - 4, top: rp.y - 4,
                    animation: 'btn-ripple 0.65s ease-out forwards',
                    pointerEvents: 'none',
                }} />
            ))}
            {children}
        </button>
    );
};

// ── ASL Alphabet 3D Carousel ────────────────────────────────
// Hiển thị 26 chữ cái ASL theo vòng tròn 3D tự động xoay
const ASLCarousel = ({ reduced }) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const emojis  = ['🤜','🖐️','🤙','☝️','✊','🤞','👍','🤟','☝️','🤙','✌️','👋','✊','✌️','👌','☝️','🤟','🤞','✊','🤙','🖐️','✌️','👋','🤘','🤙','🤟'];
    const colors  = ['#38bdf8','#818cf8','#34d399','#fbbf24','#f472b6','#a78bfa','#38bdf8','#34d399','#818cf8','#fbbf24'];

    const [active, setActive] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        timerRef.current = setInterval(() => setActive(a => (a + 1) % letters.length), 1100);
        return () => clearInterval(timerRef.current);
    }, []);

    // Show 5 visible: prev2, prev1, active, next1, next2
    const visible = [-2, -1, 0, 1, 2].map(offset => {
        const idx = (active + offset + letters.length) % letters.length;
        return { letter: letters[idx], emoji: emojis[idx], color: colors[idx % colors.length], offset };
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flexShrink: 0 }}
            className="hidden lg:flex">

            {/* Label */}
            <div style={{ color: 'rgba(56,189,248,0.55)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                ASL Alphabet
            </div>

            {/* 3D Carousel strip */}
            <div style={{ position: 'relative', height: 80, width: 220, overflow: 'hidden' }}>
                {visible.map(({ letter, emoji, color, offset }) => {
                    const isActive = offset === 0;
                    const abs = Math.abs(offset);
                    const scale   = isActive ? 1 : abs === 1 ? 0.72 : 0.48;
                    const opacity = isActive ? 1 : abs === 1 ? 0.55 : 0.25;
                    const tx      = offset * 52;
                    const blur    = abs === 2 ? 'blur(1.5px)' : 'none';
                    return (
                        <div key={letter + offset}
                            style={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                transform: `translateX(calc(-50% + ${tx}px)) translateY(-50%) scale(${scale})`,
                                opacity,
                                filter: blur,
                                transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                                width: 64,
                            }}>
                            <div style={{
                                width: isActive ? 58 : 46, height: isActive ? 58 : 46,
                                borderRadius: isActive ? 16 : 12,
                                background: isActive
                                    ? `linear-gradient(135deg, ${color}30, ${color}10)`
                                    : 'rgba(255,255,255,0.04)',
                                border: `${isActive ? 1.5 : 1}px solid ${isActive ? color : 'rgba(56,189,248,0.15)'}`,
                                backdropFilter: 'blur(10px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: isActive ? 28 : 20,
                                boxShadow: isActive ? `0 0 20px ${color}40, 0 0 40px ${color}15` : 'none',
                                transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                            }}>
                                {emoji}
                            </div>
                            {isActive && (
                                <span style={{
                                    color, fontSize: 10, fontWeight: 800,
                                    background: `linear-gradient(135deg, ${color}, #fff)`,
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    animation: 'stat-slide-in 0.3s ease',
                                }}>
                                    {letter}
                                </span>
                            )}
                        </div>
                    );
                })}
                {/* Active indicator glow underline */}
                <div style={{
                    position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                    width: 24, height: 2, borderRadius: 2,
                    background: `linear-gradient(90deg, transparent, ${colors[active % colors.length]}, transparent)`,
                    boxShadow: `0 0 8px ${colors[active % colors.length]}`,
                    transition: 'background 0.4s, box-shadow 0.4s',
                }} />
            </div>

            {/* Dot progress */}
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                {letters.map((_, i) => (
                    <div key={i} style={{
                        width: i === active ? 14 : 4,
                        height: 4, borderRadius: 2,
                        background: i === active ? colors[active % colors.length] : 'rgba(56,189,248,0.2)',
                        transition: 'all 0.35s ease',
                        boxShadow: i === active ? `0 0 6px ${colors[active % colors.length]}` : 'none',
                    }} />
                ))}
            </div>

            {/* Counter badge */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 12px',
                background: 'rgba(56,189,248,0.08)',
                border: '1px solid rgba(56,189,248,0.2)',
                borderRadius: 20,
            }}>
                <span style={{ color: 'rgba(186,230,253,0.55)', fontSize: 9, fontWeight: 600 }}>LETTER</span>
                <span style={{
                    background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    fontSize: 12, fontWeight: 800,
                }}>{active + 1} / 26</span>
            </div>
        </div>
    );
};

// NeuralHand removed per user request

// ══════════════════════════════════════════════════════════════
//  MAIN BANNER COMPONENT — v2.1 Balanced Layout
// ══════════════════════════════════════════════════════════════
const ASLHeroBanner = ({ user, navigate, t, prefersReducedMotion }) => {
    const bannerRef = useRef(null);
    const innerRef  = useRef(null);

    // Mouse-tracking 3D tilt
    useEffect(() => {
        if (prefersReducedMotion) return;
        const el = bannerRef.current;
        if (!el) return;
        const onMove = (e) => {
            const rect = el.getBoundingClientRect();
            const mx = (e.clientX - rect.left) / rect.width  - 0.5;
            const my = (e.clientY - rect.top)  / rect.height - 0.5;
            if (innerRef.current) {
                innerRef.current.style.transform =
                    `perspective(900px) rotateY(${mx * 6}deg) rotateX(${-my * 4}deg) scale3d(1.01,1.01,1.01)`;
            }
        };
        const onLeave = () => {
            if (innerRef.current)
                innerRef.current.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)';
        };
        el.addEventListener('mousemove', onMove);
        el.addEventListener('mouseleave', onLeave);
        return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
    }, [prefersReducedMotion]);

    const aslWords = ['American Sign Language', 'Ngôn Ngữ Ký Hiệu', 'AI-Powered Recognition', '26 ASL Letters'];

    return (
        <div ref={bannerRef} className="mb-10 asl-banner-v2"
            style={{ position: 'relative', borderRadius: 28, overflow: 'hidden', cursor: 'default' }}>

            {/* ── BG layers ── */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0c1e3e 0%, #0f2554 35%, #0d1e48 65%, #0c1e3e 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <div className="asl-aurora-1" /><div className="asl-aurora-2" /><div className="asl-aurora-3" />
            </div>
            <div style={{
                position: 'absolute', inset: 0, zIndex: 0, opacity: 0.07,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='48' viewBox='0 0 56 48'%3E%3Cpolygon points='28,2 54,14 54,34 28,46 2,34 2,14' fill='none' stroke='%2338bdf8' stroke-width='0.7'/%3E%3C/svg%3E")`,
                backgroundSize: '56px 48px',
            }} />
            <ParticleCanvas reduced={prefersReducedMotion} />

            {/* 3D grid floor */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, zIndex: 1, overflow: 'hidden', perspective: '280px' }}>
                <div style={{
                    width: '100%', height: '100%',
                    transform: 'rotateX(65deg) translateY(15px)',
                    backgroundImage: 'linear-gradient(rgba(56,189,248,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.18) 1px, transparent 1px)',
                    backgroundSize: '44px 44px', opacity: 0.65,
                    animation: 'grid-scroll 8s linear infinite',
                }} />
            </div>

            {/* Sweep lines */}
            {!prefersReducedMotion && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 2, overflow: 'hidden', borderRadius: 28, pointerEvents: 'none' }}>
                    <div className="asl-sweep-line" />
                    <div className="asl-sweep-h-line" />
                </div>
            )}

            {/* ── Decorative elements — spread LEFT / CENTER / RIGHT ── */}
            {!prefersReducedMotion && (
                <>

                    {/* LEFT zone — holo ring bottom-left */}
                    <div style={{ position: 'absolute', bottom: 12, left: '2%', zIndex: 3, opacity: 0.55 }}>
                        <HoloRing size={64} color1="#818cf8" color2="#c084fc" speed={11} />
                    </div>

                    {/* CENTER zone — large holo ring top-center */}
                    <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', zIndex: 3, opacity: 0.35 }}>
                        <HoloRing size={110} color1="#38bdf8" color2="#6366f1" speed={8} />
                    </div>
                    {/* CENTER zone — floating ASL letters scattered center */}
                    {[
                        { ch: 'A', top: '15%', left: '44%', size: 13, delay: 0 },
                        { ch: 'S', top: '65%', left: '48%', size: 11, delay: 0.5 },
                        { ch: 'L', top: '40%', left: '41%', size: 12, delay: 1 },
                        { ch: '✦', top: '20%', left: '57%', size: 16, delay: 0.3 },
                        { ch: '✦', top: '70%', left: '55%', size: 12, delay: 0.9 },
                    ].map((item, i) => (
                        <div key={i} style={{
                            position: 'absolute', top: item.top, left: item.left,
                            color: i % 2 === 0 ? 'rgba(56,189,248,0.45)' : 'rgba(129,140,248,0.4)',
                            fontSize: item.size, fontWeight: 800,
                            pointerEvents: 'none', userSelect: 'none',
                            animation: `asl-letter-drift ${3 + i * 0.6}s ease-in-out infinite ${item.delay}s`,
                            zIndex: 3,
                        }}>
                            {item.ch}
                        </div>
                    ))}

                    {/* RIGHT zone — large cube top-right */}
                    <div style={{ position: 'absolute', top: 16, right: '3%', zIndex: 3 }}>
                        <Cube3D size={68} emojis={['🤟','✌️','👌','🤙','👍','🖐️']} spinDur={11} floatDur={3.8} floatDelay={0} />
                    </div>
                    {/* RIGHT zone — small holo ring bottom-right */}
                    <div style={{ position: 'absolute', bottom: 16, right: '4%', zIndex: 3, opacity: 0.65 }}>
                        <HoloRing size={56} color1="#38bdf8" color2="#34d399" speed={13} />
                    </div>
                </>
            )}

            {/* ── Inner tilt wrapper ── */}
            <div ref={innerRef} style={{ position: 'relative', zIndex: 10, transition: 'transform 0.12s ease-out', transformStyle: 'preserve-3d' }}>
                {/* Main content row — LEFT text + RIGHT carousel */}
                <div style={{
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center',
                    justifyContent: 'space-between', gap: 16,
                    padding: '30px 130px 26px 32px',   /* left flush, right clears cube deco */
                }}>

                    {/* ── LEFT: Text content ── */}
                    <div style={{ flex: '1 1 280px', minWidth: 0 }}>

                        {/* Status pill */}
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 7,
                            padding: '5px 14px',
                            background: 'rgba(56,189,248,0.1)',
                            border: '1px solid rgba(56,189,248,0.38)',
                            borderRadius: 100, marginBottom: 14,
                            animation: 'stat-slide-in 0.5s ease 0.1s both',
                        }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d39980', display: 'inline-block', animation: 'kp-pulse 1.5s ease-in-out infinite' }} />
                            <span style={{ color: '#38bdf8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                {t?.('dashboard.aslPlatformBadge') || 'ASL AI Recognition Platform'}
                            </span>
                            <span style={{ color: 'rgba(56,189,248,0.45)', fontSize: 9 }}>● {t?.('dashboard.live') || 'LIVE'}</span>
                        </div>

                        {/* Main heading */}
                        <h1 style={{ margin: '0 0 6px', lineHeight: 1.15, animation: 'stat-slide-in 0.5s ease 0.2s both' }}>
                            <span style={{
                                display: 'block',
                                background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 35%, #7dd3fc 65%, #a5f3fc 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                                fontSize: 'clamp(20px, 3.2vw, 40px)', fontWeight: 900, letterSpacing: '-0.02em',
                            }}>
                                {t?.('dashboard.welcome') || 'Hello'},
                            </span>
                            <span style={{
                                display: 'block',
                                background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 45%, #c084fc 80%, #f0abfc 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                                fontSize: 'clamp(22px, 3.6vw, 44px)', fontWeight: 900, letterSpacing: '-0.03em',
                                filter: 'drop-shadow(0 0 24px rgba(56,189,248,0.35))',
                            }}>
                                {user?.fullName || user?.username || 'Student'}
                            </span>
                        </h1>

                        {/* Typing subtitle */}
                        <p style={{ color: 'rgba(186,230,253,0.65)', fontSize: 13, fontWeight: 500, margin: '0 0 18px', animation: 'stat-slide-in 0.5s ease 0.3s both' }}>
                            {t?.('dashboard.welcomeBack') || 'Welcome back!'}&nbsp;—&nbsp;
                            {!prefersReducedMotion
                                ? <TypingText words={aslWords} style={{ color: '#38bdf8', fontWeight: 700 }} />
                                : <span style={{ color: '#38bdf8', fontWeight: 700 }}>American Sign Language</span>
                            }
                        </p>

                        {/* CTA Buttons */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, animation: 'stat-slide-in 0.5s ease 0.4s both' }}>
                            <NeonButton onClick={() => navigate('/practice')}
                                gradient="linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)"
                                border="rgba(56,189,248,0.5)" glow="rgba(14,165,233,0.45)">
                                <HandMetal size={14} />
                                {t?.('dashboard.startLearning') || 'Start Learning'}
                            </NeonButton>
                            <NeonButton onClick={() => navigate('/free-recognition')}
                                ghost border="rgba(56,189,248,0.3)" glow="rgba(56,189,248,0.2)">
                                <Eye size={14} />
                                {t?.('dashboard.liveRecognition') || 'Live Recognition'}
                            </NeonButton>
                            <NeonButton onClick={() => navigate('/comprehensive-test')}
                                ghost border="rgba(129,140,248,0.3)" glow="rgba(129,140,248,0.2)">
                                <Brain size={14} />
                                {t?.('dashboard.comprehensiveTestTitle') || 'Comprehensive Test'}
                                <ChevronRight size={12} style={{ opacity: 0.6 }} />
                            </NeonButton>
                        </div>
                    </div>

                    {/* ── RIGHT: ASL Alphabet 3D Carousel ── */}
                    <ASLCarousel reduced={prefersReducedMotion} />
                </div>
            </div>

            {/* ── Bottom gradient bar ── */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, zIndex: 15,
                background: 'linear-gradient(90deg, transparent 0%, #38bdf8 25%, #818cf8 50%, #c084fc 75%, transparent 100%)',
                animation: 'bar-shimmer 3s linear infinite',
                backgroundSize: '200% 100%',
            }} />
        </div>
    );
};

/* ── Inject global styles ──────────────────────────────────── */
const BannerStyles = () => (
    <style>{`
        /* ── Cube ── */
        @keyframes cube-spin {
            from { transform: rotateX(20deg) rotateY(0deg); }
            to   { transform: rotateX(20deg) rotateY(360deg); }
        }
        @keyframes cube-float {
            0%,100% { transform: translateY(0px); }
            50%      { transform: translateY(-12px); }
        }

        /* ── Holo ring ── */
        @keyframes holo-ring-spin-cw  { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
        @keyframes holo-ring-spin-ccw { from { transform: rotate(0deg); }   to { transform: rotate(-360deg); } }
        @keyframes holo-core-pulse    { 0%,100% { opacity:0.6; transform:scale(1); } 50% { opacity:1; transform:scale(1.15); } }

        /* ── Keypoints ── */
        @keyframes kp-pulse { 0%,100% { transform:scale(1); opacity:0.7; } 50% { transform:scale(1.6); opacity:1; } }

        /* ── Neural hand float ── */
        @keyframes neural-hand-float { 0%,100% { transform:translateY(0) rotate(-2deg); } 50% { transform:translateY(-10px) rotate(2deg); } }

        /* ── Stat slide in ── */
        @keyframes stat-slide-in { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }

        /* ── Cursor blink ── */
        @keyframes cursor-blink { 0%,100% { opacity:1; } 50% { opacity:0; } }

        /* ── ASL letter drift ── */
        @keyframes asl-letter-drift {
            0%,100% { transform: translateY(0px) rotate(0deg);  opacity: 0.45; }
            35%      { transform: translateY(-9px) rotate(4deg);  opacity: 0.8; }
            70%      { transform: translateY(-4px) rotate(-3deg); opacity: 0.55; }
        }

        /* ── Button ripple ── */
        @keyframes btn-ripple { to { transform:scale(28); opacity:0; } }

        /* ── Aurora orbs ── */
        @keyframes aurora-drift-1 {
            0%,100% { transform: translate(0%,0%) scale(1); opacity:0.55; }
            33%      { transform: translate(8%,-12%) scale(1.15); opacity:0.75; }
            66%      { transform: translate(-5%,8%) scale(0.9); opacity:0.5; }
        }
        @keyframes aurora-drift-2 {
            0%,100% { transform: translate(0%,0%) scale(1); opacity:0.4; }
            40%      { transform: translate(-10%,10%) scale(1.2); opacity:0.65; }
            80%      { transform: translate(6%,-8%) scale(0.85); opacity:0.35; }
        }
        @keyframes aurora-drift-3 {
            0%,100% { transform: translate(0%,0%) scale(1); opacity:0.3; }
            50%      { transform: translate(12%,5%) scale(1.1); opacity:0.5; }
        }
        .asl-aurora-1 {
            position:absolute; width:70%; height:120%; top:-10%; right:-10%;
            background: radial-gradient(ellipse at 60% 40%, rgba(14,165,233,0.3) 0%, rgba(99,102,241,0.15) 45%, transparent 75%);
            border-radius:50%; filter:blur(50px);
            animation: aurora-drift-1 9s ease-in-out infinite;
        }
        .asl-aurora-2 {
            position:absolute; width:60%; height:100%; top:0; left:-5%;
            background: radial-gradient(ellipse at 30% 70%, rgba(99,102,241,0.22) 0%, rgba(192,132,252,0.1) 50%, transparent 75%);
            border-radius:50%; filter:blur(60px);
            animation: aurora-drift-2 12s ease-in-out infinite 1.5s;
        }
        .asl-aurora-3 {
            position:absolute; width:40%; height:80%; top:10%; right:30%;
            background: radial-gradient(ellipse, rgba(6,182,212,0.18) 0%, transparent 70%);
            border-radius:50%; filter:blur(40px);
            animation: aurora-drift-3 7s ease-in-out infinite 0.8s;
        }

        /* ── Sweep lines ── */
        .asl-sweep-line {
            position:absolute; top:0; left:-70%; width:50%; height:100%;
            background: linear-gradient(90deg, transparent, rgba(56,189,248,0.06), rgba(56,189,248,0.04), transparent);
            animation: sweep-h 5s linear infinite;
        }
        @keyframes sweep-h { 0% { left:-70%; } 100% { left:130%; } }

        .asl-sweep-h-line {
            position:absolute; left:0; top:-60%; width:100%; height:40%;
            background: linear-gradient(180deg, transparent, rgba(56,189,248,0.05), transparent);
            animation: sweep-v 7s linear infinite 2s;
        }
        @keyframes sweep-v { 0% { top:-60%; } 100% { top:130%; } }

        /* ── Grid scroll ── */
        @keyframes grid-scroll { from { backgroundPositionY:0; } to { backgroundPositionY:44px; } }

        /* ── Bar shimmer ── */
        @keyframes bar-shimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        /* ── Banner box shadow ── */
        .asl-banner-v2 {
            box-shadow:
                0 0 0 1px rgba(56,189,248,0.15),
                0 8px 32px rgba(14,165,233,0.1),
                0 2px 8px rgba(0,0,0,0.15);
            transition: box-shadow 0.5s ease;
        }
        .asl-banner-v2:hover {
            box-shadow:
                0 0 0 1px rgba(56,189,248,0.25),
                0 12px 40px rgba(14,165,233,0.15),
                0 4px 12px rgba(0,0,0,0.18);
        }
    `}</style>
);

// Re-export with styles injected
const ASLHeroBannerWithStyles = (props) => (
    <>
        <BannerStyles />
        <ASLHeroBanner {...props} />
    </>
);

// Override default export to include styles
export { ASLHeroBannerWithStyles as default };
