import React from 'react';
import { Link } from 'react-router-dom';
import {
    Mail,
    Phone,
    Camera,
    Brain,
    HandMetal,
    ExternalLink,
    MapPin,
    Zap,
    Eye,
    Target,
    BookOpen,
    ArrowUpRight,
    Sparkles,
    Globe,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

/* ───────────── Custom SVG Icons ───────────── */
const GithubIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
);

const FacebookIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const MessengerIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.975 12-11.111C24 4.975 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z" />
    </svg>
);

/* ───────────── Tech stack ───────────── */
const techStack = [
    { label: 'React',      color: 'bg-white/15 text-white border-white/25 hover:bg-white/25' },
    { label: 'TensorFlow', color: 'bg-orange-300/20 text-orange-100 border-orange-300/30 hover:bg-orange-300/35' },
    { label: 'MediaPipe',  color: 'bg-white/15 text-white border-white/25 hover:bg-white/25' },
    { label: 'OpenCV',     color: 'bg-green-300/20 text-green-100 border-green-300/30 hover:bg-green-300/35' },
    { label: 'FastAPI',    color: 'bg-teal-300/20 text-teal-100 border-teal-300/30 hover:bg-teal-300/35' },
    { label: 'Python',     color: 'bg-yellow-300/20 text-yellow-100 border-yellow-300/30 hover:bg-yellow-300/35' },
];

/* ───────────── Component ───────────── */
const Footer = () => {
    const { t } = useLanguage();
    const currentYear = new Date().getFullYear();

    const socialLinks = [
        {
            key: 'github',
            href: 'https://github.com/trantrungphuc777',
            icon: GithubIcon,
            label: 'GitHub',
            sublabelKey: 'footer.socialSourceCode',
            cardStyle: 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/35',
            iconColor: 'text-white/90',
            dot: 'bg-white/60',
        },
        {
            key: 'facebook',
            href: 'https://www.facebook.com/share/18mfBqLCXN/?mibextid=wwXIfr',
            icon: FacebookIcon,
            label: 'Facebook',
            sublabelKey: 'footer.socialFollow',
            cardStyle: 'bg-white/10 border-white/20 hover:bg-blue-300/30 hover:border-blue-200/50',
            iconColor: 'text-blue-100',
            dot: 'bg-blue-200',
        },
        {
            key: 'messenger',
            href: 'https://m.me/100024437363761?hash=Abb5zyrsmcmGBDhW&source_id=8585216',
            icon: MessengerIcon,
            label: 'Messenger',
            sublabelKey: 'footer.socialMessage',
            cardStyle: 'bg-white/10 border-white/20 hover:bg-violet-300/25 hover:border-violet-200/50',
            iconColor: 'text-violet-200',
            dot: 'bg-violet-300',
        },
        {
            key: 'email',
            href: 'mailto:trantrungphuc98021@gmail.com',
            icon: Mail,
            label: 'Gmail',
            sublabelKey: 'footer.socialSendEmail',
            cardStyle: 'bg-white/10 border-white/20 hover:bg-red-400/20 hover:border-red-300/40',
            iconColor: 'text-red-200',
            dot: 'bg-red-300',
        },
    ];

    const contactItems = [
        {
            icon: Phone,
            label: '0365 530 100',
            href: 'tel:0365530100',
            sublabelKey: 'footer.contactCall',
            iconBg: 'bg-green-300/20 border-green-200/30',
            iconColor: 'text-green-200',
            pulse: true,
        },
        {
            icon: Mail,
            label: 'trantrungphuc98021@gmail.com',
            href: 'mailto:trantrungphuc98021@gmail.com',
            sublabelKey: 'footer.contactEmail',
            iconBg: 'bg-red-300/20 border-red-200/30',
            iconColor: 'text-red-200',
            pulse: false,
        },
        {
            icon: MapPin,
            label: 'TP. Hồ Chí Minh, Việt Nam',
            href: null,
            sublabelKey: 'footer.contactLocation',
            iconBg: 'bg-white/15 border-white/25',
            iconColor: 'text-white/80',
            pulse: false,
        },
    ];

    const quickLinks = [
        { path: '/dashboard',         labelKey: 'nav.home',             icon: HandMetal },
        { path: '/practice',          labelKey: 'nav.practice',         icon: BookOpen  },
        { path: '/free-recognition',  labelKey: 'nav.freeRecognition',  icon: Camera    },
        { path: '/practice-feedback', labelKey: 'nav.practiceFeedback', icon: Target    },
        { path: '/quiz',              labelKey: 'nav.quiz',             icon: Brain     },
    ];

    const features = [
        { labelKey: 'footer.featRecognition',    icon: Zap,       iconBg: 'bg-yellow-300/20 border-yellow-200/30', iconColor: 'text-yellow-200' },
        { labelKey: 'footer.featAIHandTracking', icon: Eye,       iconBg: 'bg-cyan-300/20 border-cyan-200/30',     iconColor: 'text-cyan-200'   },
        { labelKey: 'footer.featFingerAnalysis', icon: HandMetal, iconBg: 'bg-violet-300/20 border-violet-200/30', iconColor: 'text-violet-200' },
        { labelKey: 'footer.featAccuracy',       icon: Target,    iconBg: 'bg-rose-300/20 border-rose-200/30',     iconColor: 'text-rose-200'   },
        { labelKey: 'footer.featInteractive',    icon: BookOpen,  iconBg: 'bg-emerald-300/20 border-emerald-200/30',iconColor: 'text-emerald-200'},
    ];

    return (
        <footer
            className="relative text-white overflow-hidden"
            style={{ background: 'linear-gradient(150deg, #1d4ed8 0%, #1e40af 40%, #1e3a8a 75%, #1b3480 100%)' }}
        >
            {/* ── Ambient glow blobs ── */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-16 -left-16 w-[520px] h-[360px] rounded-full blur-[130px]"
                    style={{ background: 'rgba(147,210,255,0.18)' }}></div>
                <div className="absolute -bottom-10 right-0 w-[440px] h-[280px] rounded-full blur-[120px]"
                    style={{ background: 'rgba(165,180,252,0.14)' }}></div>
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[180px] rounded-full blur-[100px]"
                    style={{ background: 'rgba(255,255,255,0.05)' }}></div>
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
                        backgroundSize: '30px 30px',
                    }}
                />
            </div>

            <div className="relative z-10">
                <div className="h-[3px] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-14">

                    {/* ══ Col 1 — Brand ══ */}
                    <div className="lg:col-span-1 space-y-6">
                        <Link to="/dashboard" className="flex items-center gap-3 group w-fit">
                            <div className="relative w-12 h-12 rounded-2xl overflow-hidden transition-all duration-200 ease-out group-hover:scale-105 group-hover:rotate-2 shadow-xl shadow-black/20 ring-2 ring-white/20 group-hover:ring-white/40">
                                <img src="/logo.jpg" alt="ASL Translator Logo" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h2 className="font-extrabold text-lg leading-tight tracking-tight text-white">
                                    ASL Translator
                                </h2>
                                <p className="text-[11px] text-white/85 leading-tight flex items-center gap-1">
                                    <Sparkles size={9} className="text-white/90" />
                                    {t('footer.aiPowered')}
                                </p>
                            </div>
                        </Link>

                        <p className="text-white/90 text-[13px] leading-relaxed border-l-2 border-white/40 pl-3">
                            {t('footer.brandDesc')}
                        </p>

                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Globe size={10} className="text-white/90" />
                                <p className="text-[10px] text-white/90 uppercase tracking-[0.15em] font-semibold">{t('footer.connectWithMe')}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {socialLinks.map(({ key, href, icon: Icon, label, sublabelKey, cardStyle, iconColor, dot }) => (
                                    <a
                                        key={key}
                                        href={href}
                                        target={href.startsWith('mailto') ? undefined : '_blank'}
                                        rel="noopener noreferrer"
                                        aria-label={label}
                                        className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-150 ease-out hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-lg overflow-hidden ${cardStyle}`}
                                    >
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.07) 50%, transparent 60%)' }} />
                                        <span className={`${iconColor} flex-shrink-0`}>
                                            <Icon size={15} />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-semibold text-white leading-none truncate">{label}</p>
                                            <p className="text-[9px] text-white/55 leading-none mt-0.5 truncate">{t(sublabelKey)}</p>
                                        </div>
                                        <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${dot} opacity-70`}></div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ══ Col 2 — Quick Links ══ */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="h-5 w-0.5 rounded-full bg-gradient-to-b from-white/90 via-cyan-200/60 to-transparent"></div>
                            <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.18em]">
                                {t('footer.quickLinks')}
                            </h3>
                        </div>
                        <ul className="space-y-0.5">
                            {quickLinks.map((link) => {
                                const Icon = link.icon;
                                return (
                                    <li key={link.path}>
                                        <Link
                                            to={link.path}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/90 hover:text-white hover:bg-white/15 transition-all duration-150 ease-out text-[13px] group border border-transparent hover:border-white/25"
                                        >
                                            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 group-hover:bg-white/25 transition-colors duration-150 ease-out">
                                                <Icon size={13} className="text-white/90 group-hover:text-white transition-colors duration-150 ease-out" />
                                            </div>
                                            <span className="font-medium group-hover:translate-x-0.5 transition-transform duration-150 ease-out">
                                                {t(link.labelKey)}
                                            </span>
                                            <ArrowUpRight size={11} className="ml-auto opacity-0 group-hover:opacity-70 transition-opacity duration-150 ease-out flex-shrink-0" />
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* ══ Col 3 — Features ══ */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="h-5 w-0.5 rounded-full bg-gradient-to-b from-white/90 via-teal-200/60 to-transparent"></div>
                            <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.18em]">
                                {t('footer.features')}
                            </h3>
                        </div>
                        <ul className="space-y-2">
                            {features.map((feat) => {
                                const Icon = feat.icon;
                                return (
                                    <li key={feat.labelKey} className="flex items-center gap-3 group">
                                        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${feat.iconBg} transition-all duration-150 ease-out group-hover:scale-110`}>
                                            <Icon size={12} className={feat.iconColor} />
                                        </div>
                                        <span className="text-[13px] text-white/90 group-hover:text-white transition-colors duration-150 ease-out leading-tight font-medium">
                                            {t(feat.labelKey)}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="pt-5 border-t border-white/20 mt-4">
                            <p className="text-[10px] text-white/80 uppercase tracking-[0.15em] mb-3 font-semibold">Tech Stack</p>
                            <div className="flex flex-wrap gap-1.5">
                                {techStack.map(({ label, color }) => (
                                    <span
                                        key={label}
                                        className={`px-2.5 py-1 text-[10px] rounded-full border font-semibold transition-all duration-150 ease-out cursor-default hover:scale-105 hover:-translate-y-0.5 ${color}`}
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ══ Col 4 — Contact ══ */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="h-5 w-0.5 rounded-full bg-gradient-to-b from-white/90 via-violet-200/60 to-transparent"></div>
                            <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.18em]">
                                {t('footer.contact')}
                            </h3>
                        </div>

                        <div className="space-y-2">
                            {contactItems.map(({ icon: Icon, label, href, sublabelKey, iconBg, iconColor, pulse }) => (
                                <div
                                    key={label}
                                    className="group flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/25 hover:bg-white/[0.18] hover:border-white/40 transition-all duration-150 ease-out"
                                >
                                    <div className={`relative w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconBg} transition-transform duration-150 ease-out group-hover:scale-105`}>
                                        <Icon size={14} className={iconColor} />
                                        {pulse && (
                                            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-70"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-300"></span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] text-white/75 uppercase tracking-wide font-semibold mb-0.5">{t(sublabelKey)}</p>
                                        {href ? (
                                            <a
                                                href={href}
                                                className="text-[12px] text-white/95 hover:text-white hover:underline underline-offset-2 transition-colors duration-150 ease-out font-medium block truncate"
                                            >
                                                {label}
                                            </a>
                                        ) : (
                                            <span className="text-[12px] text-white/90 font-medium block truncate">{label}</span>
                                        )}
                                    </div>
                                    {href && (
                                        <ExternalLink size={10} className="text-white/60 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out" />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="p-3 rounded-xl bg-white/10 border border-white/25 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"
                                style={{ background: 'rgba(255,255,255,0.08)' }}></div>
                            <div className="flex items-start gap-2">
                                <Sparkles size={12} className="text-white/80 flex-shrink-0 mt-0.5" />
                                <p className="text-[11px] text-white/85 italic leading-relaxed">
                                    {t('footer.graduationProject')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom Bar ── */}
            <div className="relative z-10">
                <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-[11px] text-white/75">
                            © {currentYear}&nbsp;
                            <span className="text-white/95 font-semibold">{t('footer.brand')}</span>
                            .&nbsp;{t('footer.rightsReserved')}
                        </p>
                        <p className="text-[11px] text-white/70 italic flex items-center gap-1.5">
                            <span className="w-3 h-px bg-white/40 rounded"></span>
                            {t('footer.developer')}
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
