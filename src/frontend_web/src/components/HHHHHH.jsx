import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Brain, 
    MessageSquare, 
    Sparkles,
    ArrowRight,
    Play,
    Zap,
    Shield,
    Users,
    HandMetal,
    Volume2,
    Mic,
    BookOpen,
    Trophy,
    Target,
    TrendingUp,
    Clock,
    Star,
    ChevronRight,
    GraduationCap,
    Layers,
    Eye
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
// Header and Footer are provided by Layout when HomePage is rendered inside it

const HomePage = () => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [activeFeature, setActiveFeature] = useState(0);
    const { t } = useLanguage();
    
    // Scroll tracking for parallax — dùng CSS var thay vì React state để tránh re-render
    useEffect(() => {
        const handleScroll = () => {
            document.documentElement.style.setProperty('--scroll-y', window.scrollY.toString());
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    useEffect(() => {
        setTimeout(() => setIsVisible(true), 100);
    }, []);

    // Auto-rotate active feature for demo
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature(prev => (prev + 1) % features.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const quickAccess = [
        {
            title: t('homePage.practice'),
            description: t('homePage.practiceDesc'),
            icon: GraduationCap,
            path: '/practice',
            color: 'from-sky-500 to-blue-600',
            stats: t('homePage.practiceStats')
        },
        {
            title: t('homePage.quiz'),
            description: t('homePage.quizDesc'),
            icon: Trophy,
            path: '/quiz',
            color: 'from-amber-500 to-orange-600',
            stats: t('homePage.quizStats')
        },
        {
            title: t('homePage.recognition'),
            description: t('homePage.recognitionDesc'),
            icon: Eye,
            path: '/free-recognition',
            color: 'from-emerald-500 to-teal-600',
            stats: t('homePage.recognitionStats')
        },
        {
            title: t('homePage.profile'),
            description: t('homePage.profileDesc'),
            icon: TrendingUp,
            path: '/profile',
            color: 'from-blue-500 to-cyan-600',
            stats: t('homePage.profileStats')
        }
    ];

    const features = [
        {
            icon: HandMetal,
            title: t('homePage.twentySixSigns'),
            description: t('homePage.twentySixSignsDesc'),
            color: 'from-blue-500 to-cyan-500',
            details: [t('homePage.twentySixSignsDetail1'), t('homePage.twentySixSignsDetail2'), t('homePage.twentySixSignsDetail3')]
        },
        {
            icon: MessageSquare,
            title: t('homePage.buildSentenceTitle'),
            description: t('homePage.buildSentenceDesc'),
            color: 'from-blue-500 to-cyan-500',
            details: [t('homePage.buildSentenceDetail1'), t('homePage.buildSentenceDetail2'), t('homePage.buildSentenceDetail3')]
        },
        {
            icon: Volume2,
            title: t('homePage.speechTitle'),
            description: t('homePage.speechDesc'),
            color: 'from-emerald-500 to-teal-500',
            details: [t('homePage.speechDetail1'), t('homePage.speechDetail2'), t('homePage.speechDetail3')]
        },
        {
            icon: Mic,
            title: t('homePage.voiceRecognitionTitle'),
            description: t('homePage.voiceRecognitionDesc'),
            color: 'from-amber-500 to-orange-500',
            details: [t('homePage.voiceRecognitionDetail1'), t('homePage.voiceRecognitionDetail2'), t('homePage.voiceRecognitionDetail3')]
        },
        {
            icon: Brain,
            title: t('homePage.quizFeatureTitle'),
            description: t('homePage.quizFeatureDesc'),
            color: 'from-teal-500 to-rose-500',
            details: [t('homePage.quizFeatureDetail1'), t('homePage.quizFeatureDetail2'), t('homePage.quizFeatureDetail3')]
        },
        {
            icon: Target,
            title: t('homePage.feedbackTitle'),
            description: t('homePage.feedbackDesc'),
            color: 'from-sky-500 to-blue-500',
            details: [t('homePage.feedbackDetail1'), t('homePage.feedbackDetail2'), t('homePage.feedbackDetail3')]
        }
    ];

    const stats = [
        { 
            value: t('homePage.cnnEightLayers'), 
            label: t('homePage.cnnLabel'), 
            desc: t('homePage.cnnDesc'),
            icon: Brain, 
            color: 'text-blue-600', 
            bg: 'bg-blue-100',
            trend: 'Multi-layer'
        },
        { 
            value: t('homePage.twentyOnePoints'), 
            label: t('homePage.pointsLabel'), 
            desc: t('homePage.pointsDesc'), 
            icon: HandMetal, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-100',
            trend: 'Live Tracking'
        },
        { 
            value: t('homePage.lowLatency'), 
            label: t('homePage.latencyLabel'), 
            desc: t('homePage.latencyDesc'), 
            icon: Target, 
            color: 'text-amber-600', 
            bg: 'bg-amber-100',
            trend: t('homePage.latencyTrend')
        },
        { 
            value: t('homePage.highAccuracy'), 
            label: t('homePage.accuracyLabel'), 
            desc: t('homePage.accuracyDesc'), 
            icon: BookOpen, 
            color: 'text-blue-600', 
            bg: 'bg-blue-100',
            trend: t('homePage.accuracyTrend')
        }
    ];

    const testimonials = [
        {
            name: t('homePage.testimonialName1'),
            role: t('homePage.testimonialRole1'),
            content: t('homePage.testimonialContent1'),
            avatar: 'A',
            rating: 5
        },
        {
            name: t('homePage.testimonialName2'),
            role: t('homePage.testimonialRole2'),
            content: t('homePage.testimonialContent2'),
            avatar: 'B',
            rating: 5
        },
        {
            name: t('homePage.testimonialName3'),
            role: t('homePage.testimonialRole3'),
            content: t('homePage.testimonialContent3'),
            avatar: 'C',
            rating: 5
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 overflow-x-hidden">
            {/* Hero Section - Modern Glassmorphism with 3D Mouse Effects */}
            <section className="relative pt-0 pb-20 sm:pt-0 sm:pb-28 overflow-hidden">
                {/* Animated Background Elements with Parallax */}
                <div className="absolute inset-0 overflow-hidden">
                    <div 
                        className="absolute top-10 left-10 w-[500px] h-[500px] bg-blue-400/25 rounded-full blur-[120px] animate-pulse-glow parallax-slow"
                    />
                    <div 
                        className="absolute top-40 right-20 w-[400px] h-[400px] bg-sky-400/20 rounded-full blur-[100px] animate-pulse-glow parallax-slow"
                        style={{ animationDelay: '1s' }}
                    />
                    <div 
                        className="absolute bottom-20 left-1/3 w-[350px] h-[350px] bg-cyan-400/20 rounded-full blur-[100px] animate-float"
                        style={{ animationDelay: '2s' }}
                    />
                    <div className="absolute inset-0 particle-grid opacity-40" />
                    
                    {/* Floating geometric shapes */}
                    <div className="absolute top-32 right-1/4 w-4 h-4 bg-blue-500/40 rotate-45 animate-particle" />
                    <div className="absolute top-48 left-1/4 w-6 h-6 bg-sky-400/50 rounded-full animate-particle" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute bottom-40 right-1/3 w-3 h-3 bg-cyan-400/50 rounded-full animate-particle" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-60 left-[60%] w-2 h-2 bg-blue-400/40 rounded-full animate-particle" style={{ animationDelay: '1.5s' }} />
                </div>

                <div className="relative z-10 -mt-28 sm:-mt-36 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                        {/* Badge with float animation */}
                        <div className="hero-float-badge inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-xl border border-blue-200/60 shadow-lg shadow-blue-500/15 mb-4 breathe-glow">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-semibold text-shimmer font-extrabold">
                                {t('homePage.aiTitle')}
                            </span>
                        </div>

                        {/* Main Heading with text reveal */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
                            <span className="bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500 bg-clip-text text-transparent hero-text-reveal">
                                {t('homePage.aiSubtitle')}
                            </span>
                            <br />
                            <span className="text-shimmer hero-text-reveal" style={{ animationDelay: '0.3s' }}>
                                {t('homePage.aiHeading')}
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg sm:text-xl text-blue-800/80 max-w-3xl mx-auto mb-12 leading-relaxed reveal-blur is-visible">
                            {t('homePage.aiParagraph')}
                        </p>

                        {/* CTA Buttons - Modern Glass with magnetic effect */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                            <button
                                onClick={() => navigate('/practice')}
                                className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-sky-500 text-white neon-btn animate-pulse-ring font-bold tracking-wide rounded-2xl shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden magnetic-pull"
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    <GraduationCap size={22} />
                                    {t('homePage.startNow')}
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>

                            <button
                                onClick={() => navigate('/quiz')}
                                className="group px-8 py-4 bg-white/90 backdrop-blur-xl text-blue-800 font-bold rounded-2xl border border-blue-200/60 hover:border-blue-400 hover:bg-blue-50/80 transition-all duration-300 hover:-translate-y-1 flex items-center gap-3 shadow-lg shadow-blue-200/30 depth-shadow magnetic-pull"
                            >
                                <Trophy size={22} className="text-amber-500" />
                                {t('homePage.takeQuiz')}
                            </button>
                        </div>

                        {/* Stats Cards - Glassmorphism with MAX 3D tilt */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto stagger-max is-visible">
                            {stats.map((stat, index) => {
                                const Icon = stat.icon;
                                return (
                                    <MouseTrackingCard key={index} index={index}>
                                        <div className="group p-5 bg-white/70 backdrop-blur-xl rounded-3xl border border-blue-200/40 shadow-lg shadow-blue-200/20 hover:shadow-2xl hover:shadow-blue-300/30 card-3d-max relative overflow-hidden h-full">
                                            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br opacity-5 group-hover:scale-150 transition-transform duration-500 from-current to-transparent pointer-events-none"></div>
                                            <div className="flex items-center justify-between mb-4 relative z-10">
                                                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:-translate-y-1 transition-transform duration-300 spring-max flex-shrink-0`}>
                                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                                </div>
                                                <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${stat.bg} ${stat.color} border border-current/20 uppercase tracking-wider glow-pulse-max whitespace-nowrap ml-2`}>
                                                    {stat.trend}
                                                </div>
                                            </div>
                                            <div className="text-xl sm:text-2xl font-black text-blue-900 tracking-tight relative z-10 text-left">
                                                {stat.value}
                                            </div>
                                            <div className="text-[13px] font-bold text-blue-700 mt-1 relative z-10 text-left">
                                                {stat.label}
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed relative z-10 text-left">
                                                {stat.desc}
                                            </p>
                                        </div>
                                    </MouseTrackingCard>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-7 h-10 rounded-full border-2 border-blue-300 flex justify-center pt-2 bg-white/60 backdrop-blur-sm">
                        <div className="w-1.5 h-3 bg-blue-400 rounded-full animate-scroll"></div>
                    </div>
                </div>
            </section>

            {/* Quick Access Section with scroll reveal */}
            <section className="relative py-20 sm:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header with reveal animation */}
                    <div className="text-center mb-16 reveal-max is-visible">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-4 glow-pulse-max">
                            {t('homePage.quickAccess')}
                        </span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-900 mb-4">
                            {t('homePage.exploreFeatures')}
                        </h2>
                        <p className="text-sky-800 max-w-2xl mx-auto text-lg">
                            {t('homePage.chooseFeature')}
                        </p>
                    </div>

                    {/* Quick Access Grid with stagger animation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children is-visible">
                        {quickAccess.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <MouseTrackingCard key={index} index={index}>
                                    <button
                                        onClick={() => navigate(item.path)}
                                        className="group relative p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-blue-200/40 shadow-lg shadow-blue-100/30 card-3d-depth text-left overflow-hidden spotlight w-full h-full elastic-card"
                                    >
                                        {/* Gradient overlay on hover */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                                        
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300 spring-hover`}>
                                            <Icon className="w-7 h-7 text-white" />
                                        </div>
                                        
                                        <h3 className="text-xl font-bold text-blue-900 mb-2 group-hover:text-blue-600 transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-blue-700/70 text-sm mb-4 leading-relaxed">
                                            {item.description}
                                        </p>
                                        
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
                                                {item.stats}
                                            </span>
                                            <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </button>
                                </MouseTrackingCard>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Features Detail Section with scroll reveal */}
            <section className="relative py-20 sm:py-28 bg-gradient-to-b from-white via-blue-50/50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header with reveal */}
                    <div className="text-center mb-16 reveal-max is-visible">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-100 text-cyan-700 text-sm font-semibold mb-4 glow-pulse-max">
                            {t('homePage.featuresTitle')}
                        </span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-900 mb-4">
                            {t('homePage.everythingNeed')}
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-600 font-extrabold"> {t('homePage.learnASL')}</span>
                        </h2>
                        <p className="text-sky-800 max-w-2xl mx-auto text-lg">
                            {t('homePage.featuresIntro')}
                        </p>
                    </div>

                    {/* Features Grid with stagger animation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children is-visible">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <MouseTrackingCard key={index} index={index}>
                                    <div
                                        className={`group relative p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-blue-200/40 shadow-lg shadow-blue-100/20 card-3d-depth h-full ${
                                            activeFeature === index ? 'ring-2 ring-blue-400 ring-offset-2 neural-pulse' : ''
                                        }`}
                                        onMouseEnter={() => setActiveFeature(index)}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 spring-hover`}>
                                            <Icon className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-blue-900 mb-3 group-hover:text-blue-600 transition-colors">
                                            {feature.title}
                                        </h3>
                                        <p className="text-blue-700/70 leading-relaxed mb-4">
                                            {feature.description}
                                        </p>
                                        
                                        {/* Feature details */}
                                        <ul className="space-y-2">
                                            {feature.details.map((detail, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-blue-600/60">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                                                    {detail}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </MouseTrackingCard>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Testimonials Section with reveal animation */}
            <section className="relative py-20 sm:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 reveal-max is-visible">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-4 glow-pulse-max">
                            {t('homePage.testimonials')}
                        </span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-900 mb-4">
                            {t('homePage.studentSays')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-max is-visible">
                        {testimonials.map((item, index) => (
                            <MouseTrackingCard key={index} index={index}>
                                <div className="relative p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-blue-200/40 shadow-lg shadow-blue-100/20 hover:shadow-xl hover:shadow-blue-200/30 transition-all duration-300 card-3d-max h-full">
                                    {/* Rating stars with bounce */}
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(item.rating)].map((_, i) => (
                                            <Star key={i} size={18} className="text-amber-400 fill-amber-400 spring-max" />
                                        ))}
                                    </div>
                                    
                                    <p className="text-blue-700/70 leading-relaxed mb-6 italic">
                                        "{item.content}"
                                    </p>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30 spring-bounce">
                                            {item.avatar}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-blue-900">{item.name}</div>
                                            <div className="text-sm text-blue-500">{item.role}</div>
                                        </div>
                                    </div>
                                </div>
                            </MouseTrackingCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section - MAX Effects */}
            <section className="relative py-20 sm:py-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-indigo-900 to-sky-900">
                    {/* MAX Animated gradient orbs */}
                    <div className="absolute inset-0 opacity-40">
                        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[150px] morph-blob-max pulse-orb parallax-slow"></div>
                        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500 rounded-full blur-[150px] floating-orb morph-blob-animate"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-500 rounded-full blur-[120px] pulse-orb"></div>
                    </div>
                    <div className="absolute inset-0 particle-grid opacity-20" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 hero-text-reveal">
                        {t('homePage.readyStart')}
                        <br />
                        <span className="bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text text-transparent">
                            {t('homePage.aslJourney')}
                        </span>
                    </h2>
                    <p className="text-lg text-blue-200/80 mb-10 max-w-2xl mx-auto hero-subtitle-reveal">
                        {t('homePage.aslJourneyDesc')}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 hero-btn-reveal">
                        <button
                            onClick={() => navigate('/practice')}
                            className="group px-10 py-4 bg-white text-blue-700 font-bold rounded-2xl shadow-2xl hover:shadow-xl neon-btn transition-all duration-300 hover:-translate-y-1 flex items-center gap-3 magnetic-btn-max"
                        >
                            <GraduationCap size={22} />
                            {t('homePage.startLearning')}
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => navigate('/quiz')}
                            className="px-10 py-4 bg-white/10 backdrop-blur-sm text-white font-bold rounded-2xl border border-blue-400/40 hover:bg-white/20 hover:border-blue-300/60 neon-btn transition-all duration-300 hover:-translate-y-1 flex items-center gap-3 magnetic-btn-max"
                        >
                            <Trophy size={22} />
                            {t('homePage.takeQuiz')}
                        </button>
                    </div>
                </div>
            </section>

            {/* Custom CSS for animations */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-12px); }
                }
                @keyframes scroll {
                    0%, 100% { transform: translateY(0); opacity: 1; }
                    50% { transform: translateY(8px); opacity: 0.3; }
                }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-scroll { animation: scroll 2s ease-in-out infinite; }
                
                /* Smooth scrolling */
                html {
                    scroll-behavior: smooth;
                }
                
                /* Glassmorphism utilities */
                .glass {
                    background: rgba(255, 255, 255, 0.6);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                
                /* Gradient text */
                .gradient-text {
                    background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
            `}</style>
        </div>
    );
};

// Mouse Tracking Card Component - CSS-only hover, no JS per-card listener
const MouseTrackingCard = ({ children, index = 0 }) => {
    return (
        <div className="tilt-card h-full">
            {children}
        </div>
    );
};

export default HomePage;
