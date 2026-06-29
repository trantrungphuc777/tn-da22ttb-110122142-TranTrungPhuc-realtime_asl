import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ASLHeroBanner from './ASLHeroBanner';
import {
    Volume2,
    Mic,
    MicOff,
    Trash2,
    Copy,
    Sparkles,
    ArrowRight,
    Play,
    GraduationCap,
    Trophy,
    Eye,
    TrendingUp,
    BookOpen,
    HandMetal,
    Brain,
    MessageSquare,
    Star,
    ChevronRight,
    Target,
    Zap,
    CheckCircle2,
    AlertCircle,
    User,
    Calendar,
    Award,
    RefreshCw,
    MessageCircle,
    FileText,
    ClipboardList,
    Bell,
    Users
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import Layout from './Layout';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useReducedMotion, useScrollRevealAll, useMagicCardAll, useCounter, useMouseParallax } from '../hooks/useAnimations';

const DashboardPage = () => {
    const { t, lang } = useLanguage();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [recognizedText, setRecognizedText] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [pendingAssignments, setPendingAssignments] = useState(0);
    const [pendingExams, setPendingExams] = useState(0);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [unreadFeedback, setUnreadFeedback] = useState(0);
    const [myClassesCount, setMyClassesCount] = useState(0);
    const [myBadges, setMyBadges] = useState([]);
    const [allBadges, setAllBadges] = useState([]);
    const [totalBadges, setTotalBadges] = useState(0);
    const [recentActivities, setRecentActivities] = useState([]);
    const [userStats, setUserStats] = useState({
        streak: 0,
        practiceCount: 0,
        assignmentsCompleted: 0,
        examsTaken: 0,
        quizScore: 0,
        totalTime: '0h'
    });
    const recognitionRef = React.useRef(null);
    const prefersReducedMotion = useReducedMotion();

    // Scroll tracking đã được xử lý bởi Layout

    // ── NEW 2026: Scroll reveal IntersectionObserver (GSAP ScrollTrigger style) ──
    const pageRef = useRef(null);
    useScrollRevealAll(
        '.scroll-reveal, .scroll-reveal-left, .scroll-reveal-scale',
        { threshold: 0.1, rootMargin: '-30px', once: true },
        pageRef
    );

    // ── NEW 2026: Magic card glow (Stripe/Linear style) ──
    useMagicCardAll(pageRef, { enabled: !prefersReducedMotion });

    // ── NEW 2026: Mouse parallax for CSS 3D shapes (Spline depth style) ──
    useMouseParallax(pageRef, { enabled: !prefersReducedMotion, smoothing: 0.06 });

    // ── NEW 2026: Animated counters for stats ──
    const { count: countAccuracy, ref: refAccuracy } = useCounter(98, { duration: 1800, triggerOnView: true });
    const { count: countKeypoints, ref: refKeypoints } = useCounter(21, { duration: 1400, triggerOnView: true });
    const { count: countLatency, ref: refLatency } = useCounter(45, { duration: 1200, triggerOnView: true });
    const { count: countLayers, ref: refLayers } = useCounter(8, { duration: 1000, triggerOnView: true });

    // Check auth
    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
        }
        fetchPendingTasks();
    }, [navigate]);

    const fetchPendingTasks = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // ── Nhóm 1: Critical — hiển thị badge counts ngay lập tức ──
            const [assignmentsRes, examsRes, notificationsRes] = await Promise.all([
                fetch('http://localhost:5000/api/student/assignments?status=pending&limit=100', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/student/exams?status=pending&limit=100', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/student/notifications?limit=100', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const assignmentsData = await assignmentsRes.json();
            const examsData = await examsRes.json();
            const notificationsData = await notificationsRes.json();

            if (assignmentsRes.ok) {
                setPendingAssignments(assignmentsData.assignments?.filter(a => !a.isCompleted).length || 0);
            }
            if (examsRes.ok) {
                setPendingExams(examsData.exams?.filter(e => e.canSubmit && !e.isCompleted).length || 0);
            }
            if (notificationsRes.ok) {
                setUnreadNotifications(notificationsData.unreadCount || 0);
            }

            // ── Nhóm 2: Secondary — load sau, không block render ──
            const [feedbackRes, classesRes, badgesRes, statsRes, submissionsRes] = await Promise.all([
                fetch('http://localhost:5000/api/student/feedback?limit=100', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/student/classes?limit=100', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/student/badges', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/auth/profile/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/student/submissions?limit=5', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const feedbackData = await feedbackRes.json();
            const classesData = await classesRes.json();
            const badgesData = await badgesRes.json();
            const statsData = statsRes.ok ? await statsRes.json() : null;
            const submissionsData = submissionsRes.ok ? await submissionsRes.json() : null;

            if (feedbackRes.ok) {
                setUnreadFeedback(feedbackData.unreadCount || 0);
            }
            if (classesRes.ok) {
                setMyClassesCount(classesData.classes?.length || 0);
            }
            if (badgesRes.ok && badgesData.badges) {
                setAllBadges(badgesData.badges.slice(0, 12)); // tất cả badges kèm trạng thái earned/progress
                setMyBadges(badgesData.badges.filter(b => b.earned)); // không cắt slice để đếm đúng số huy hiệu đã đạt
                setTotalBadges(badgesData.totalBadges || 0);
            }
            if (statsData) {
                setUserStats({
                    streak: statsData.streak || 0,
                    practiceCount: statsData.practiceCount || 0,
                    assignmentsCompleted: statsData.assignmentsCompleted || 0,
                    examsTaken: statsData.examsTaken || 0,
                    quizScore: statsData.quizScore || 0,
                    totalTime: statsData.totalTime || '0h'
                });
            }
            if (submissionsData?.submissions) {
                setRecentActivities(submissionsData.submissions.slice(0, 3).map(s => {
                    const isExam = !!s.examId;
                    const title = isExam
                        ? (s.examId?.title || t('dashboard.completedQuiz'))
                        : (s.assignmentId?.title || t('dashboard.practiceASLSigns'));
                    const subtitle = s.score != null
                        ? `${t('dashboard.score')}: ${s.score}/${s.maxScore || 100}`
                        : (s.assignmentId?.type === 'recognition'
                            ? t('dashboard.signRecognition')
                            : t('dashboard.practiceASLSigns'));
                    const date = new Date(s.submittedAt || s.updatedAt || s.createdAt);
                    const diffMs = Date.now() - date.getTime();
                    const diffH = Math.floor(diffMs / 3600000);
                    const diffD = Math.floor(diffMs / 86400000);
                    const timeAgo = diffH < 1
                        ? t('dashboard.justNow') || 'Vừa xong'
                        : diffH < 24
                            ? `${diffH} ${t('dashboard.hoursAgo')}`
                            : `${diffD} ${t('dashboard.daysAgo')}`;
                    return { title, subtitle, timeAgo, isExam, type: s.assignmentId?.type };
                }));
            }
        } catch (error) {
            console.error('Fetch pending tasks error:', error);
        }
    };

    const quickAccess = [
        {
            titleKey: 'student.dashboard.myAssignments',
            descKey: 'student.dashboard.viewAssignments',
            icon: FileText,
            path: '/my-assignments',
            color: 'from-emerald-500 to-teal-600',
            gradient: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10',
            badge: pendingAssignments > 0 ? pendingAssignments : null,
            badgeColor: 'bg-amber-500'
        },
        {
            titleKey: 'student.dashboard.myExams',
            descKey: 'student.dashboard.completeExams',
            icon: ClipboardList,
            path: '/student/exams',
            color: 'from-purple-500 to-pink-600',
            gradient: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10',
            badge: pendingExams > 0 ? pendingExams : null,
            badgeColor: 'bg-amber-500'
        },
        {
            titleKey: 'student.dashboard.myClasses',
            descKey: 'student.dashboard.viewClasses',
            icon: GraduationCap,
            path: '/my-classes',
            color: 'from-blue-500 to-indigo-600',
            gradient: 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10',
            badge: myClassesCount > 0 ? myClassesCount : null,
            badgeColor: 'bg-blue-500'
        },
        {
            titleKey: 'student.dashboard.notifications',
            descKey: 'student.dashboard.instructorMessages',
            icon: Bell,
            path: '/notifications',
            color: 'from-orange-500 to-red-600',
            gradient: 'bg-gradient-to-br from-orange-500/10 to-red-500/10',
            badge: unreadNotifications > 0 ? unreadNotifications : null,
            badgeColor: 'bg-red-500'
        },
        {
            titleKey: 'student.dashboard.feedback',
            descKey: 'student.dashboard.instructorComments',
            icon: Star,
            path: '/feedback',
            color: 'from-yellow-500 to-orange-600',
            gradient: 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10',
            badge: unreadFeedback > 0 ? unreadFeedback : null,
            badgeColor: 'bg-amber-500'
        },
        {
            titleKey: 'dashboard.practiceTitle',
            descKey: 'dashboard.practiceDesc',
            icon: HandMetal,
            path: '/practice',
            color: 'from-sky-500 to-blue-600',
            statsKey: 'dashboard.twentySixSigns',
            gradient: 'bg-gradient-to-br from-sky-500/10 to-blue-500/10'
        },
        {
            titleKey: 'dashboard.feedbackTitle',
            descKey: 'dashboard.feedbackDesc',
            icon: MessageCircle,
            path: '/practice-feedback',
            color: 'from-amber-500 to-orange-600',
            statsKey: 'dashboard.autoCorrection',
            gradient: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10'
        },
        {
            titleKey: 'dashboard.quizTitle',
            descKey: 'dashboard.quizDesc',
            icon: Trophy,
            path: '/quiz',
            color: 'from-emerald-500 to-teal-600',
            statsKey: 'dashboard.questions',
            gradient: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10'
        },
        {
            titleKey: 'dashboard.comprehensiveTestTitle',
            descKey: 'dashboard.comprehensiveTestDesc',
            icon: Brain,
            path: '/comprehensive-test',
            color: 'from-purple-500 to-pink-600',
            statsKey: 'dashboard.comprehensiveTest',
            gradient: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10'
        },
        {
            titleKey: 'dashboard.recognitionTitle',
            descKey: 'dashboard.recognitionDesc',
            icon: Eye,
            path: '/free-recognition',
            color: 'from-cyan-500 to-blue-600',
            statsKey: 'dashboard.realtime',
            gradient: 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10'
        }
    ];

    const features = [
        {
            icon: HandMetal,
            titleKey: 'dashboard.twentySixASLSigns',
            descKey: 'dashboard.twentySixASLSignsDesc',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            icon: MessageSquare,
            titleKey: 'dashboard.buildSentence',
            descKey: 'dashboard.buildSentenceDesc',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            icon: Volume2,
            titleKey: 'dashboard.speech',
            descKey: 'dashboard.speechDesc',
            color: 'from-emerald-500 to-teal-500'
        },
        {
            icon: Brain,
            titleKey: 'dashboard.quizFeature',
            descKey: 'dashboard.quizFeatureDesc',
            color: 'from-teal-500 to-rose-500'
        }
    ];

    const stats = [
        {
            valueKey: 'dashboard.cnnEightLayers',
            labelKey: 'dashboard.deepLearningArch',
            descKey: 'dashboard.deepLearningDesc',
            icon: Brain,
            color: 'text-cyan-600',
            bg: 'bg-cyan-100/80 backdrop-blur-md',
            trendKey: 'dashboard.cnnEightLayers'
        },
        {
            valueKey: 'dashboard.twentyOneKeyPoints',
            labelKey: 'dashboard.mediapipeTracking',
            descKey: 'dashboard.mediapipeTrackingDesc',
            icon: HandMetal,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100',
            trendKey: 'dashboard.twentyOneKeyPoints'
        },
        {
            value: '< 45ms',
            labelKey: 'dashboard.responseLatency',
            descKey: 'dashboard.responseLatencyDesc',
            icon: Zap,
            color: 'text-amber-600',
            bg: 'bg-amber-100',
            trendKey: 'dashboard.realtime'
        },
        {
            value: '98,13%',
            labelKey: 'dashboard.aiAccuracy',
            descKey: 'dashboard.aiAccuracyDesc',
            icon: Target,
            color: 'text-cyan-600',
            bg: 'bg-cyan-100/80 backdrop-blur-md',
            trendKey: 'dashboard.highlyAccurate'
        }
    ];

    // Speech recognition
    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error(t('dashboard.browserNoSpeech'));
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'vi-VN';

        recognitionRef.current.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            if (transcript.trim()) {
                const newText = (recognizedText + ' ' + transcript.trim()).trim();
                const words = newText.split(/\s+/).filter(w => w.length > 0);
                if (words.length > 200) {
                    const trimmed = words.slice(0, 200).join(' ');
                    setRecognizedText(trimmed);
                    setCursorPosition(trimmed.length);
                } else {
                    setRecognizedText(newText);
                    setCursorPosition(newText.length);
                }
            }
        };

        recognitionRef.current.onend = () => {
            if (isListening) {
                recognitionRef.current.start();
            }
        };

        recognitionRef.current.start();
        setIsListening(true);
        toast.success(t('dashboard.listening'));
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    // Speak text
    const speakText = () => {
        if (!recognizedText.trim() || isSpeaking) return;
        
        const utterance = new SpeechSynthesisUtterance(recognizedText);
        utterance.lang = 'en-US';
        const voices = speechSynthesis.getVoices();
        const englishVoice = voices.find(v =>
            v.lang.startsWith('en') &&
            (v.name.toLowerCase().includes('male') ||
             v.name.toLowerCase().includes('david') ||
             v.name.toLowerCase().includes('mark') ||
             v.lang === 'en-US')
        );
        if (englishVoice) {
            utterance.voice = englishVoice;
        }
        utterance.rate = 0.9;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => {
            setIsSpeaking(false);
            toast.error(t('dashboard.speechError'));
        };
        speechSynthesis.speak(utterance);
    };

    // Copy text
    const copyText = () => {
        if (!recognizedText.trim()) return;
        navigator.clipboard.writeText(recognizedText);
        toast.success(t('dashboard.copiedSuccess'));
    };

    // Clear text
    const clearText = () => {
        setRecognizedText('');
        setCursorPosition(0);
    };

    return (
        <Layout>
            <div ref={pageRef} className="relative z-10 w-full pt-8 sm:pt-2 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    
                    {/* ══════════════════════════════════════════════════════
                        HERO BANNER v2 — Ultra 3D Professional ASL Banner
                        ══════════════════════════════════════════════════════ */}
                    <ASLHeroBanner user={user} navigate={navigate} t={t} prefersReducedMotion={prefersReducedMotion} />

                    {/* Stats Cards — magic card glow + counter animation + scroll reveal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 scroll-stagger">
                        {/* Card 0 — CNN 8 Layers */}
                        <MouseTrackingCard>
                            <div ref={refLayers} className="group p-5 bg-white/80 backdrop-blur-xl rounded-3xl border border-blue-200/40 shadow-md shadow-blue-100/30 card-3d-max magic-card-glow card-glare glow-border-hover scroll-reveal relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br opacity-5 group-hover:scale-150 transition-transform duration-500 from-current to-transparent pointer-events-none"></div>
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-cyan-100/80 backdrop-blur-md flex items-center justify-center group-hover:-translate-y-1 transition-transform duration-300 spring-max">
                                        <Brain className="w-6 h-6 text-cyan-600" />
                                    </div>
                                    <div className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-cyan-100/80 text-cyan-600 border border-current/10 uppercase tracking-wider glow-pulse-max">
                                        {t('dashboard.cnnEightLayers')}
                                    </div>
                                </div>
                                <div className="text-xl font-black text-blue-900 tracking-tight relative z-10">
                                    <span className="number-ticker">{countLayers}</span> CNN
                                </div>
                                <div className="text-[13px] font-bold text-blue-700 mt-1 relative z-10">{t('dashboard.deepLearningArch')}</div>
                                <p className="text-[11px] text-blue-500/60 mt-2 leading-relaxed relative z-10">{t('dashboard.deepLearningDesc')}</p>
                            </div>
                        </MouseTrackingCard>

                        {/* Card 1 — 21 Keypoints */}
                        <MouseTrackingCard>
                            <div ref={refKeypoints} className="group p-5 bg-white/80 backdrop-blur-xl rounded-3xl border border-blue-200/40 shadow-md shadow-blue-100/30 card-3d-max magic-card-glow card-glare glow-border-hover scroll-reveal relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br opacity-5 group-hover:scale-150 transition-transform duration-500 from-current to-transparent pointer-events-none"></div>
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center group-hover:-translate-y-1 transition-transform duration-300 spring-max">
                                        <HandMetal className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-600 border border-current/10 uppercase tracking-wider glow-pulse-max">
                                        {t('dashboard.twentyOneKeyPoints')}
                                    </div>
                                </div>
                                <div className="text-xl font-black text-blue-900 tracking-tight relative z-10">
                                    <span className="number-ticker">{countKeypoints}</span> pts
                                </div>
                                <div className="text-[13px] font-bold text-blue-700 mt-1 relative z-10">{t('dashboard.mediapipeTracking')}</div>
                                <p className="text-[11px] text-blue-500/60 mt-2 leading-relaxed relative z-10">{t('dashboard.mediapipeTrackingDesc')}</p>
                            </div>
                        </MouseTrackingCard>

                        {/* Card 2 — Latency */}
                        <MouseTrackingCard>
                            <div ref={refLatency} className="group p-5 bg-white/80 backdrop-blur-xl rounded-3xl border border-blue-200/40 shadow-md shadow-blue-100/30 card-3d-max magic-card-glow card-glare glow-border-hover scroll-reveal relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br opacity-5 group-hover:scale-150 transition-transform duration-500 from-current to-transparent pointer-events-none"></div>
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center group-hover:-translate-y-1 transition-transform duration-300 spring-max">
                                        <Zap className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <div className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-600 border border-current/10 uppercase tracking-wider glow-pulse-max">
                                        {t('dashboard.realtime')}
                                    </div>
                                </div>
                                <div className="text-xl font-black text-blue-900 tracking-tight relative z-10">
                                    &lt; <span className="number-ticker">{countLatency}</span>ms
                                </div>
                                <div className="text-[13px] font-bold text-blue-700 mt-1 relative z-10">{t('dashboard.responseLatency')}</div>
                                <p className="text-[11px] text-blue-500/60 mt-2 leading-relaxed relative z-10">{t('dashboard.responseLatencyDesc')}</p>
                            </div>
                        </MouseTrackingCard>

                        {/* Card 3 — Accuracy */}
                        <MouseTrackingCard>
                            <div ref={refAccuracy} className="group p-5 bg-white/80 backdrop-blur-xl rounded-3xl border border-blue-200/40 shadow-md shadow-blue-100/30 card-3d-max magic-card-glow card-glare glow-border-hover scroll-reveal relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br opacity-5 group-hover:scale-150 transition-transform duration-500 from-current to-transparent pointer-events-none"></div>
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-cyan-100/80 backdrop-blur-md flex items-center justify-center group-hover:-translate-y-1 transition-transform duration-300 spring-max">
                                        <Target className="w-6 h-6 text-cyan-600" />
                                    </div>
                                    <div className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-cyan-100/80 text-cyan-600 border border-current/10 uppercase tracking-wider glow-pulse-max">
                                        {t('dashboard.highlyAccurate')}
                                    </div>
                                </div>
                                <div className="text-xl font-black text-blue-900 tracking-tight relative z-10">
                                    <span className="number-ticker">{countAccuracy}</span>,13%
                                </div>
                                <div className="text-[13px] font-bold text-blue-700 mt-1 relative z-10">{t('dashboard.aiAccuracy')}</div>
                                <p className="text-[11px] text-blue-500/60 mt-2 leading-relaxed relative z-10">{t('dashboard.aiAccuracyDesc')}</p>
                            </div>
                        </MouseTrackingCard>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        
                        {/* Main Content - Left 2 columns */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Quick Access Cards - MAX Effects */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-blue-200/40 p-6 shadow-md shadow-blue-100/20 scroll-reveal scroll-stagger">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                                        <Sparkles size={20} className="text-blue-500 glow-pulse-max" />
                                        {t('dashboard.quickAccess')}
                                    </h2>
                                    <span className="text-sm text-blue-500/70">{t('dashboard.chooseFeature')}</span>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {quickAccess.map((item, index) => {
                                        const Icon = item.icon;
                                        return (
                                            <MouseTrackingCard key={index}>
                                                <button
                                                    onClick={() => navigate(item.path)}
                                                    className={`group relative p-5 rounded-2xl ${item.gradient} border border-blue-200/30 hover:shadow-xl hover:shadow-blue-200/30 transition-all duration-500 ease-out card-3d-max magic-card-glow card-glare glow-border-hover text-left overflow-hidden spotlight w-full elastic-bounce`}
                                                >
                                                    {item.badge && (
                                                        <span className={`absolute top-3 right-3 ${item.badgeColor} text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center spring-bounce`}>
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                    <div className="flex items-start gap-4">
                                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 spring-max`}>
                                                            <Icon className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-bold text-blue-900 mb-1 group-hover:text-blue-600 transition-colors">
                                                                {item.titleKey ? t(item.titleKey) : item.title}
                                                            </h3>
                                                            <p className="text-sm text-blue-700/70 leading-relaxed line-clamp-2">
                                                                {item.descKey ? t(item.descKey) : item.desc}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-200/20">
                                                        <span className="text-xs font-medium text-blue-600 bg-white/60 px-3 py-1 rounded-full border border-blue-200/30">
                                                            {item.statsKey ? t(item.statsKey) : (item.badge ? `${item.badge} ${t('student.dashboard.pending')}` : '')}
                                                        </span>
                                                        <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-500 group-hover:translate-x-2 group-hover:scale-110 transition-all" />
                                                    </div>
                                                </button>
                                            </MouseTrackingCard>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* My Badges Section - MAX Effects */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-orange-200/40 p-6 shadow-md shadow-orange-100/20 scroll-reveal-scale">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-xl font-bold text-orange-900 flex items-center gap-2">
                                        <Award size={20} className="text-orange-500 glow-pulse-max" />
                                        {t('homePage.badges.myBadges') || 'Huy Hiệu Của Tôi'}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 bg-orange-100 px-3 py-1 rounded-full">
                                            <span className="text-sm font-bold text-orange-700">{myBadges.length}</span>
                                            <span className="text-xs text-orange-500">/ {totalBadges}</span>
                                        </div>
                                        {totalBadges > 0 && (
                                            <div className="w-20 h-2 bg-orange-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all progress-animated"
                                                    style={{ width: `${Math.round((myBadges.length / totalBadges) * 100)}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Badge grid */}
                                {allBadges.length > 0 ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 scroll-stagger">
                                        {allBadges.map((badge) => (
                                            <MouseTrackingCard key={badge._id}>
                                                <div
                                                    title={badge.description?.[lang] || badge.description?.vi || ''}
                                                    className={`relative flex flex-col items-center p-3 rounded-xl border transition-all duration-300 hover-lift-max ${
                                                        badge.earned
                                                            ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 elastic-bounce'
                                                            : 'bg-gray-50 border-dashed border-gray-200 opacity-50'
                                                    }`}
                                                >
                                                    {/* Earned checkmark */}
                                                    {badge.earned && (
                                                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center spring-bounce">
                                                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </span>
                                                    )}
                                                    {/* Emoji */}
                                                    <span className={`text-3xl mb-1.5 ${badge.earned ? '' : 'grayscale'} ${badge.earned ? 'icon-bounce' : ''}`}>
                                                        {badge.emoji}
                                                    </span>
                                                    {/* Name */}
                                                    <p className={`text-xs font-medium text-center line-clamp-2 leading-tight ${
                                                        badge.earned ? 'text-orange-800' : 'text-gray-400'
                                                    }`}>
                                                        {badge.name?.[lang] || badge.name?.vi}
                                                    </p>
                                                    {/* Progress bar for unearned */}
                                                    {!badge.earned && badge.progress > 0 && (
                                                        <div className="w-full mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-blue-400 rounded-full progress-animated"
                                                                style={{ width: `${badge.progress}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </MouseTrackingCard>
                                        ))}
                                    </div>
                                ) : (
                                    /* Skeleton loading hoặc empty */
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                        {[...Array(10)].map((_, i) => (
                                            <div key={i} className="flex flex-col items-center p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 opacity-40 animate-pulse">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full mb-2" />
                                                <div className="w-12 h-2 bg-gray-200 rounded" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Khuyến khích khi chưa có huy hiệu */}
                                {allBadges.length > 0 && myBadges.length === 0 && (
                                    <p className="text-center text-sm text-orange-400/70 mt-4">
                                        🎯 Hoàn thành bài tập để nhận huy hiệu đầu tiên!
                                    </p>
                                )}
                            </div>

                            {/* Features Overview with MAX parallax background */}
                            <div className="bg-gradient-to-br from-blue-950 via-indigo-900 to-sky-900 rounded-3xl p-6 shadow-xl overflow-hidden relative scroll-reveal-scale">
                                {/* Animated background with MAX parallax */}
                                <div className="absolute inset-0">
                                    <div 
                                        className="absolute top-0 right-0 w-80 h-80 bg-blue-500/30 rounded-full blur-[100px] morph-blob-max pulse-orb"
                                        style={{ transform: prefersReducedMotion ? 'none' : 'translateY(calc(var(--scroll-y, 0) * -0.15px))' }}
                                    />
                                    <div 
                                        className="absolute bottom-0 left-0 w-80 h-80 bg-sky-400/25 rounded-full blur-[100px] floating-orb morph-blob-animate"
                                        style={{ transform: prefersReducedMotion ? 'none' : 'translateY(calc(var(--scroll-y, 0) * -0.1px))' }}
                                    />
                                    <div className="absolute inset-0 particle-grid opacity-30" />
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse glow-pulse-max"></div>
                                        <span className="text-emerald-300 text-sm font-medium">{t('dashboard.featuredFeatures')}</span>
                                    </div>

                                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 hero-text-reveal">
                                        {t('dashboard.everythingNeedTo')}
                                        <span className="text-shimmer"> {t('dashboard.learnASL')}</span>
                                    </h2>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-max is-visible">
                                        {features.map((feature, index) => {
                                            const Icon = feature.icon;
                                            return (
                                                <MouseTrackingCard key={index}>
                                                    <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-blue-400/20 hover:bg-white/20 hover:border-blue-300/40 transition-all duration-300 card-3d-max magic-card-glow spring-hover cursor-pointer">
                                                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg shadow-blue-500/30 spring-bounce`}>
                                                            <Icon className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-white">{t(feature.titleKey)}</h3>
                                                            <p className="text-sm text-blue-200/70">{t(feature.descKey)}</p>
                                                        </div>
                                                    </div>
                                                </MouseTrackingCard>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => navigate('/practice')}
                                        className="mt-6 group px-8 py-4 bg-white text-blue-700 font-bold rounded-xl neon-btn shimmer-btn pulsating-btn hover:shadow-lg transition-all duration-500 ease-out flex items-center gap-3 magnetic-btn-max hero-btn-reveal"
                                    >
                                        {t('dashboard.startLearning')}
                                        <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                                    </button>
                                </div>
                            </div>

                        </div>

                        {/* Right Sidebar - MAX Effects */}
                        <div className="space-y-6">
                            
                            {/* Voice Input */}
                            <MouseTrackingCard>
                                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-blue-200/40 p-6 shadow-md shadow-blue-100/20 card-3d-max magic-card-glow glow-border-hover scroll-reveal">
                                    <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-4">
                                        <Mic className={`w-6 h-6 ${isListening ? 'text-red-500' : 'text-blue-500'} glow-pulse-max`} />
                                        {t('dashboard.voiceInput')}
                                    </h3>

                                    <div className="relative">
                                        <div className={`w-full h-52 rounded-3xl ${isListening ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20' : 'bg-gradient-to-br from-blue-500/10 to-sky-400/10'} border-2 ${isListening ? 'border-red-300' : 'border-blue-200/60'} flex flex-col items-center justify-center transition-all duration-500 ease-out ${!isListening ? 'breathe-glow glow-pulse-max' : ''}`}>
                                            {/* Animated rings when listening */}
                                            {isListening && (
                                                <>
                                                    <div className="absolute w-24 h-24 rounded-full border-2 border-red-300 animate-ping opacity-70"></div>
                                                    <div className="absolute w-36 h-36 rounded-full border border-red-200 animate-ping opacity-50" style={{ animationDelay: '0.5s' }}></div>
                                                    <div className="absolute w-48 h-48 rounded-full border border-red-100 animate-ping opacity-30" style={{ animationDelay: '1s' }}></div>
                                                </>
                                            )}

                                            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${isListening ? 'from-red-500 to-rose-600' : 'from-blue-500 to-cyan-600'} flex items-center justify-center shadow-lg ${isListening ? 'animate-pulse scale-110' : 'spring-bounce'}`}>
                                                {isListening ? <MicOff size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
                                            </div>
                                            <p className="mt-4 text-sm font-medium text-blue-700">
                                                {isListening ? t('dashboard.listening') : t('dashboard.clickToSpeakVoice')}
                                            </p>
                                        </div>

                                        <button
                                            onClick={isListening ? stopListening : startListening}
                                            className={`mt-4 w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 magnetic-btn-max ${isListening ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/30' : 'bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400 neon-btn text-white'}`}
                                        >
                                            {isListening ? (
                                                <><MicOff size={20} /> {t('dashboard.stopListening')}</>
                                            ) : (
                                                <><Mic size={20} /> {t('dashboard.startSpeaking')}</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </MouseTrackingCard>

                            {/* Text Output */}
                            <MouseTrackingCard>
                                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-blue-200/40 p-6 shadow-md shadow-blue-100/20 card-3d-max magic-card-glow glow-border-hover scroll-reveal">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-blue-900 flex items-center gap-2">
                                            <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse glow-pulse-max"></span>
                                            {t('dashboard.text')}
                                        </h3>
                                        <span className="text-xs text-blue-400/60">
                                            {recognizedText.split(/\s+/).filter(w => w.length > 0).length}/200 {t('dashboard.words')}
                                        </span>
                                    </div>

                                    <div className="relative min-h-24">
                                        <textarea
                                            value={recognizedText}
                                            onChange={(e) => {
                                                const words = e.target.value.split(/\s+/).filter(w => w.length > 0);
                                                if (words.length <= 200) {
                                                    setRecognizedText(e.target.value);
                                                    setCursorPosition(e.target.selectionStart);
                                                }
                                            }}
                                            placeholder={t('dashboard.enterTextOrVoice')}
                                            className="w-full min-h-24 p-4 bg-blue-50/50 rounded-2xl border border-blue-200/50 text-lg text-blue-900 break-words leading-relaxed whitespace-pre-wrap resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 placeholder:text-blue-300/60 placeholder:italic transition-all"
                                            maxLength={10000}
                                        />
                                        {recognizedText && (
                                            <button
                                                onClick={clearText}
                                                className="absolute top-3 right-3 p-2 bg-slate-200 hover:bg-red-100 text-slate-500 hover:text-red-500 rounded-xl transition-all spring-max"
                                                title={t('dashboard.clear')}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={speakText}
                                            disabled={!recognizedText.trim() || isSpeaking}
                                            className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold rounded-xl neon-btn transition-all flex items-center justify-center gap-2 text-sm magnetic-btn-max"
                                        >
                                            <Volume2 size={20} />
                                            {isSpeaking ? t('dashboard.speakingNow') : t('dashboard.speak')}
                                        </button>
                                        <button
                                            onClick={copyText}
                                            disabled={!recognizedText.trim()}
                                            className="p-3 bg-blue-50 hover:bg-blue-100 disabled:bg-blue-50/30 text-blue-600 rounded-xl border border-blue-200/40 transition-all spring-max"
                                        >
                                            <Copy size={20} />
                                        </button>
                                    </div>
                                </div>
                            </MouseTrackingCard>

                            {/* Quick Tips */}
                            <MouseTrackingCard>
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border border-emerald-100/50 p-6 shadow-sm card-3d-max magic-card-glow glow-border-hover scroll-reveal">
                                    <h4 className="font-semibold text-emerald-700 mb-4 flex items-center gap-2">
                                        <CheckCircle2 size={20} className="text-emerald-500 glow-pulse-max" />
                                        {t('dashboard.learningTips')}
                                    </h4>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-3 text-sm text-sky-800">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0 shadow-lg shadow-emerald-500/50"></div>
                                            {t('dashboard.tipPracticeDaily')}
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-sky-800">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0 shadow-lg shadow-emerald-500/50"></div>
                                            {t('dashboard.tipStartSimple')}
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-sky-800">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0 shadow-lg shadow-emerald-500/50"></div>
                                            {t('dashboard.tipUseQuiz')}
                                        </li>
                                    </ul>
                                </div>
                            </MouseTrackingCard>

                            {/* Achievement Preview */}
                            <MouseTrackingCard>
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-100/50 p-6 shadow-sm card-3d-max magic-card-glow glow-border-hover scroll-reveal">
                                    <h4 className="font-semibold text-amber-700 mb-4 flex items-center gap-2">
                                        <Award size={20} className="text-amber-500 glow-pulse-max" />
                                        {t('dashboard.achievements')}
                                    </h4>

                                    <div className="space-y-3">
                                        {/* Streak */}
                                        <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 elastic-bounce cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shadow-lg shadow-amber-500/20 spring-bounce">
                                                    <Star size={18} className="text-amber-600" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{t('dashboard.learningStreak')}</span>
                                            </div>
                                            <span className="font-bold text-amber-600">
                                                {userStats.streak} {t('dashboard.days')}
                                            </span>
                                        </div>

                                        {/* Bài tập hoàn thành */}
                                        <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 elastic-bounce cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-cyan-100/80 backdrop-blur-md flex items-center justify-center shadow-lg shadow-cyan-500/20 spring-bounce">
                                                    <Target size={18} className="text-cyan-600" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{t('dashboard.assignmentsCompleted') || 'Bài tập hoàn thành'}</span>
                                            </div>
                                            <span className="font-bold text-cyan-600">{userStats.assignmentsCompleted}</span>
                                        </div>

                                        {/* Bài kiểm tra đã làm */}
                                        <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 elastic-bounce cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-500/20 spring-bounce">
                                                    <Trophy size={18} className="text-emerald-600" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{t('dashboard.examsTaken') || 'Bài kiểm tra đã làm'}</span>
                                            </div>
                                            <span className="font-bold text-emerald-600">{userStats.examsTaken}</span>
                                        </div>

                                        {/* Điểm trung bình */}
                                        <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 elastic-bounce cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shadow-lg shadow-purple-500/20 spring-bounce">
                                                    <TrendingUp size={18} className="text-purple-600" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{t('dashboard.avgScore') || 'Điểm trung bình'}</span>
                                            </div>
                                            <span className="font-bold text-purple-600">{userStats.quizScore > 0 ? `${userStats.quizScore}%` : '—'}</span>
                                        </div>

                                        {/* Tổng thời gian học */}
                                        <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 elastic-bounce cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center shadow-lg shadow-rose-500/20 spring-bounce">
                                                    <Calendar size={18} className="text-rose-600" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{t('dashboard.totalStudyTime') || 'Tổng thời gian học'}</span>
                                            </div>
                                            <span className="font-bold text-rose-600">{userStats.totalTime}</span>
                                        </div>
                                    </div>
                                </div>
                            </MouseTrackingCard>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom styles */}
            <style>{`
                @keyframes ping {
                    75%, 100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
                .animate-ping {
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
            </Layout>
    );
};

// Mouse Tracking Card Component — CSS-only hover, no JS per-card listener
const MouseTrackingCard = ({ children }) => {
    return (
        <div className="tilt-card h-full">
            {children}
        </div>
    );
};

export default DashboardPage;
