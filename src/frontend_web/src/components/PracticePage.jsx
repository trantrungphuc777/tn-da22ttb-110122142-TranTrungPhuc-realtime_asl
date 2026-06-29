import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAssignment } from '../contexts/AssignmentContext';
import Header from './Header';
import Footer from './Footer';
import Layout from './Layout';
import { 
  Camera, Settings, Play, RefreshCw, 
  ArrowLeft, BookOpen, CheckCircle, XCircle,
  AlertTriangle, LogOut, MessageSquare, Target,
  Lightbulb, TrendingUp, SkipForward, ThumbsUp, ThumbsDown,
  Send, Trophy, BarChart3
} from 'lucide-react';
import { ASL_LETTER_FEEDBACK } from '../data/practiceFeedback';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-hot-toast';
import { VOCABULARY_BY_TOPIC, SENTENCES_BY_TOPIC, QUIZ_TOPICS } from '../data/aslQuizData';

const PracticePage = () => {
    const { t, lang } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const q = new URLSearchParams(location.search);
    const assignmentId = q.get('assignmentId');
    const assignmentCtx = useAssignment();

    // Assignment state
    const [assignment, setAssignment] = useState(null);
    const [assignmentLoading, setAssignmentLoading] = useState(false);
    const [assignmentCanSubmit, setAssignmentCanSubmit] = useState(true);
    const [assignmentAttemptCount, setAssignmentAttemptCount] = useState(0);
    const [assignmentMaxAttempts, setAssignmentMaxAttempts] = useState(null);
    const [assignmentRemainingAttempts, setAssignmentRemainingAttempts] = useState(null);
    const [assignmentBestScore, setAssignmentBestScore] = useState(null);
    const [assignmentIsCompleted, setAssignmentIsCompleted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [assignmentSubmitted, setAssignmentSubmitted] = useState(false);
    const [assignmentQuestionCount, setAssignmentQuestionCount] = useState(10);
    const [assignmentAnswers, setAssignmentAnswers] = useState([]);
    const startTimeRef = useRef(null);

    // Practice mode state (auto-set from assignment)
    const [practiceMode, setPracticeMode] = useState('letter'); // letter, word, sentence
    const [selectedTopic, setSelectedTopic] = useState('all');

    useEffect(() => {
        if (assignmentId && assignmentCtx && assignmentCtx.lock) {
            assignmentCtx.lock(assignmentId);
        }
        return () => {};
    }, [assignmentId]);

    // Fetch assignment data
    useEffect(() => {
        const fetchAssignmentData = async () => {
            if (!assignmentId) return;
            
            try {
                setAssignmentLoading(true);
                const token = localStorage.getItem('token');
                const res = await fetch(`http://localhost:5000/api/student/assignments/${assignmentId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok && data.assignment) {
                    const a = data.assignment;
                    setAssignment(a);
                    setAssignmentCanSubmit(data.canSubmit !== undefined ? data.canSubmit : true);
                    setAssignmentAttemptCount(data.attemptCount || 0);
                    setAssignmentMaxAttempts(data.maxAttempts ?? null);
                    setAssignmentRemainingAttempts(data.remainingAttempts ?? null);
                    setAssignmentBestScore(data.bestScore ?? null);
                    setAssignmentIsCompleted(data.isCompleted || false);
                    setAssignmentQuestionCount(a.settings?.questionCount || 10);
                    
                    // Start timer for this attempt
                    startTimeRef.current = Date.now();
                    
                    // If cannot submit (no remaining attempts), don't allow practice
                    if (data.canSubmit === false) {
                        setAssignmentSubmitted(true);
                    }
                    
                    // Auto-set practice mode and topic from assignment
                    if (a.type) {
                        setPracticeMode(a.type);
                    }
                    if (a.topic) {
                        setSelectedTopic(a.topic);
                    }
                }
            } catch (err) {
                console.error('Fetch assignment error:', err);
            } finally {
                setAssignmentLoading(false);
            }
        };

        fetchAssignmentData();
    }, [assignmentId]);

    // Prevent unload during active assignment
    useEffect(() => {
        if (!assignmentCtx) return;
        const onBefore = (e) => {
            if (assignmentCtx.isLocked) {
                e.preventDefault();
                e.returnValue = t('practicePage.leaveWarning');
            }
        };
        if (assignmentCtx.isLocked) window.addEventListener('beforeunload', onBefore);
        return () => window.removeEventListener('beforeunload', onBefore);
    }, [assignmentCtx && assignmentCtx.isLocked]);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const intervalRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const manualStopRef = useRef(false);

    // Camera state
    const [isStreaming, setIsStreaming] = useState(false);
    const [isCameraLoading, setIsCameraLoading] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    const [skeletonImage, setSkeletonImage] = useState(null);
    const [isHandPresent, setIsHandPresent] = useState(false);
    const [currentLetter, setCurrentLetter] = useState('-');
    const [cameraError, setCameraError] = useState('');

    // Practice state
    const [selectedLetter, setSelectedLetter] = useState(null);
    const [realtimeFeedback, setRealtimeFeedback] = useState(null);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({ correct: 0, wrong: 0, total: 0 });
    const [stabilityCount, setStabilityCount] = useState(0);
    const [lastDetectedLetter, setLastDetectedLetter] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const WS_URL = 'http://127.0.0.1:5001/predict';

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
            return;
        }

        getCameras();

        return () => {
            manualStopRef.current = true;
            cleanupCamera();
        };
    }, [navigate]);

    // Attach stream to video element
    useEffect(() => {
        if (isStreaming && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(err => console.log('Play error:', err));
        }
    }, [isStreaming]);

    const getCameras = async () => {
        try {
            const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setCameras(videoDevices);
            if (videoDevices.length > 0) {
                setSelectedCamera(videoDevices[0].deviceId);
            }
            tempStream.getTracks().forEach(track => track.stop());
        } catch (err) {
            console.error("Camera access denied:", err);
        }
    };

    const cleanupCamera = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const startCamera = async () => {
        if (isStreaming || isCameraLoading) return;
        setIsCameraLoading(true);
        setCameraError('');
        try {
            manualStopRef.current = false;
            const constraints = {
                video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(err => console.log('Play error:', err));
            }

            setIsStreaming(true);
            setIsCameraLoading(false);

            // Start sending frames
            const processFrame = async () => {
                if (videoRef.current && canvasRef.current && !manualStopRef.current) {
                    const context = canvasRef.current.getContext('2d');
                    context.drawImage(videoRef.current, 0, 0, 640, 480);
                    const base64 = canvasRef.current.toDataURL('image/jpeg', 0.7);

                    try {
                        const response = await fetch(WS_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                image: base64,
                                target_letter: selectedLetter || ''
                            })
                        });

                        if (response.ok) {
                            const data = await response.json();
                            handlePrediction(data);
                        }
                    } catch (err) {
                        console.log('Prediction error:', err);
                    }
                }
                
                // Continue loop if not stopped
                if (!manualStopRef.current) {
                    intervalRef.current = setTimeout(processFrame, 100); // Tăng tốc độ lấy mẫu (100ms delay)
                }
            };
            
            // Khởi động vòng lặp
            processFrame();
        } catch (err) {
            console.error('Camera error:', err);
            setCameraError(`${t('practiceFeedback.cameraError')}: ${err.name || t('practiceFeedback.cannotAccessCamera')}`);
            setIsStreaming(false);
            setIsCameraLoading(false);
        }
    };

    const stopCamera = () => {
        manualStopRef.current = true;
        setIsStreaming(false);
        setIsHandPresent(false);
        setCurrentLetter('-');
        setRealtimeFeedback(null);
        cleanupCamera();
    };

    const handlePrediction = (data) => {
        const detectedLetter = data.current_letter || '';
        const hasHand = data.is_hand_present === true;

        setIsHandPresent(hasHand);
        setSkeletonImage(data.skeleton_image || null);

        if (!hasHand) {
            setCurrentLetter('-');
            setRealtimeFeedback(null);
            setStabilityCount(0);
            setLastDetectedLetter('');
            return;
        }

        setCurrentLetter(detectedLetter || '-');

        if (selectedLetter && detectedLetter) {
            const isMatch = detectedLetter.toUpperCase() === selectedLetter.toUpperCase();

            if (isMatch) {
                if (detectedLetter !== lastDetectedLetter) {
                    setStabilityCount(1);
                } else {
                    setStabilityCount(prev => prev + 1);
                }

                if (stabilityCount >= 8) {
                    handleSuccess();
                } else {
                    setRealtimeFeedback({
                        type: 'correcting',
                        message: `${t('practiceFeedback.correctingProgress')} ${detectedLetter}. ${t('practiceFeedback.holdSteady')}...`,
                        progress: Math.min(100, ((stabilityCount + 1) / 8) * 100),
                        isCorrect: true
                    });
                }
            } else {
                setStabilityCount(0);
                const letterGuide = ASL_LETTER_FEEDBACK[selectedLetter.toUpperCase()];
                const corrections = [];

                if (letterGuide) {
                    letterGuide.keyPoints?.forEach(point => {
                        if (point.status === 'critical') {
                            corrections.push({
                                finger: point.aspect,
                                emoji: getEmojiForAspect(point.aspect),
                                issue: point.aspect.toUpperCase(),
                                fix: point.feedback,
                                priority: 'high'
                            });
                        }
                    });
                }

                setRealtimeFeedback({
                    type: 'correction',
                    detectedLetter: detectedLetter,
                    targetLetter: selectedLetter,
                    message: `${t('practiceFeedback.youAreShowing')} "${detectedLetter}" ${t('practiceFeedback.butNeedToShow')} "${selectedLetter}"!`,
                    corrections: corrections,
                    isCorrect: false
                });
            }
        } else if (!selectedLetter && detectedLetter) {
            setRealtimeFeedback({
                type: 'waiting',
                detectedLetter: detectedLetter,
                message: `${t('practiceFeedback.detectedLetter')} "${detectedLetter}"! ${t('practiceFeedback.selectLetterToStart')}`,
                isCorrect: null
            });
        }

        setLastDetectedLetter(detectedLetter);
    };

    const getEmojiForAspect = (aspect) => {
        const emojis = {
            thumb: '👍',
            index: '☝️',
            middle: '☝️',
            ring: '🖐️',
            tealy: '🤙',
            palm: '🖐️',
            wrist: '🤚'
        };
        return emojis[aspect] || '👆';
    };

    const handleSuccess = () => {
        setRealtimeFeedback({
            type: 'success',
            message: t('practiceFeedback.correctSign'),
            isCorrect: true
        });
        setIsSuccess(true);

        const newStats = {
            correct: stats.correct + 1,
            wrong: stats.wrong,
            total: stats.total + 1
        };
        setStats(newStats);

        setHistory(prev => [...prev.slice(-19), {
            letter: selectedLetter,
            isCorrect: true
        }]);

        // Track assignment answer
        if (assignmentId && !assignmentSubmitted) {
            const newAnswer = {
                question: selectedLetter,
                answer: selectedLetter,
                isCorrect: true
            };
            setAssignmentAnswers(prev => {
                const updated = [...prev, newAnswer];
                // Auto-submit khi đã hoàn thành đủ số câu
                if (updated.length >= assignmentQuestionCount) {
                    // Dùng setTimeout để state được cập nhật trước
                    setTimeout(() => submitAssignment(updated, newStats), 300);
                }
                return updated;
            });
        }
    };

    // Submit assignment kết quả lên server
    const submitAssignment = async (answers, currentStats) => {
        if (isSubmitting || assignmentSubmitted || !assignmentId) return;
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const timeSpent = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
            const total = answers ? answers.length : assignmentAnswers.length;
            const correctCount = answers ? answers.filter(a => a.isCorrect).length : assignmentAnswers.filter(a => a.isCorrect).length;
            const finalStats = currentStats || stats;
            const score = total > 0 ? Math.round((correctCount / assignmentQuestionCount) * 100) : 0;
            const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

            const payload = {
                answers: answers || assignmentAnswers,
                score,
                accuracy,
                timeSpent,
                total: assignmentQuestionCount,
                correctCount
            };

            const res = await fetch(`http://localhost:5000/api/student/assignments/${assignmentId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            let data = {};
            try {
                const text = await res.text();
                try { data = JSON.parse(text); } catch { data = { message: text }; }
            } catch (e) { data = {}; }

            if (res.ok) {
                toast.success(t('practice.resultsSaved'));
                setAssignmentSubmitted(true);
                if (data.attemptCount !== undefined) setAssignmentAttemptCount(data.attemptCount);
                if (data.remainingAttempts !== undefined) setAssignmentRemainingAttempts(data.remainingAttempts);
                if (data.bestScore !== undefined) setAssignmentBestScore(data.bestScore);
                if (data.isCompleted !== undefined) setAssignmentIsCompleted(data.isCompleted);
                if (data.canSubmit !== undefined) setAssignmentCanSubmit(data.canSubmit);
                // Stop camera after submission
                stopCamera();
            } else {
                if (data.message && (data.message.includes('hết số lần') || data.message.includes('hết lần'))) {
                    toast.error(data.message);
                    setAssignmentCanSubmit(false);
                    setAssignmentSubmitted(true);
                } else {
                    toast.error(data.message || t('practice.saveFailed'));
                }
            }
        } catch (err) {
            console.error('Submit assignment error:', err);
            toast.error(t('practice.submitError'));
        } finally {
            setIsSubmitting(false);
            try { if (assignmentCtx && assignmentCtx.release) assignmentCtx.release(); } catch (e) {}
        }
    };

    const selectLetter = (letter) => {
        setSelectedLetter(letter);
        setRealtimeFeedback(null);
        setStabilityCount(0);
        setLastDetectedLetter('');
        setIsSuccess(false);
    };

    const nextLetter = () => {
        // Track skipped (wrong) answer for assignment
        if (assignmentId && !assignmentSubmitted && selectedLetter && !isSuccess) {
            const skipAnswer = {
                question: selectedLetter,
                answer: currentLetter !== '-' ? currentLetter : '',
                isCorrect: false
            };
            setAssignmentAnswers(prev => {
                const updated = [...prev, skipAnswer];
                if (updated.length >= assignmentQuestionCount) {
                    setTimeout(() => submitAssignment(updated, { ...stats, wrong: stats.wrong + 1, total: stats.total + 1 }), 300);
                }
                return updated;
            });
            setStats(prev => ({ ...prev, wrong: prev.wrong + 1, total: prev.total + 1 }));
            setHistory(prev => [...prev.slice(-19), { letter: selectedLetter, isCorrect: false }]);
        }
        setSelectedLetter(null);
        setRealtimeFeedback(null);
        setStabilityCount(0);
        setLastDetectedLetter('');
        setIsSuccess(false);
    };

    const letterGuide = selectedLetter ? ASL_LETTER_FEEDBACK[selectedLetter.toUpperCase()] : null;

    // Assignment progress info
    const assignmentProgress = assignmentId ? {
        answered: assignmentAnswers.length,
        total: assignmentQuestionCount,
        correct: assignmentAnswers.filter(a => a.isCorrect).length,
        percent: Math.round((assignmentAnswers.length / assignmentQuestionCount) * 100)
    } : null;

    return (
        <Layout hideNav={!!assignmentId} hideFooter={!!assignmentId}>
            <div className="relative max-w-[1680px] mx-auto px-3 sm:px-6 lg:px-10 pb-3 sm:pb-4">
                    {/* header removed as requested */}

                {/* Assignment Info (when coming from assignment) */}
                {assignment && (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-3 mb-2 border border-blue-200/40">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <BookOpen className="w-4 h-4 text-blue-600" />
                                <div>
                                    <h2 className="font-semibold text-blue-900 text-sm">{assignment.title}</h2>
                                    <p className="text-xs text-blue-600/80">
                                        {assignment.type === 'letter' ? t('practicePage.letter') : assignment.type === 'word' ? t('practicePage.word') : t('practicePage.sentence')}
                                        {assignment.topic && ` - ${lang === 'vi' ? QUIZ_TOPICS.find(t => t.key === assignment.topic)?.viName : QUIZ_TOPICS.find(t => t.key === assignment.topic)?.name || assignment.topic}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {assignmentMaxAttempts !== null && (
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                        assignmentRemainingAttempts === 0 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {t('practicePage.attempts')} {assignmentAttemptCount}/{assignmentMaxAttempts}
                                    </span>
                                )}
                                {assignmentBestScore !== null && (
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                        {t('practicePage.highest')} {assignmentBestScore}%
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Assignment Progress Bar */}
                        {!assignmentSubmitted && assignmentProgress && (
                            <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
                                    <span>{t('practicePage.progress')} {assignmentProgress.answered}/{assignmentProgress.total} {t('practicePage.questions')}</span>
                                    <span>{assignmentProgress.correct} {t('practicePage.correct')}</span>
                                </div>
                                <div className="w-full bg-blue-200/50 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 rounded-full"
                                        style={{ width: `${assignmentProgress.percent}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Manual submit button */}
                        {!assignmentSubmitted && assignmentAnswers.length > 0 && assignmentAnswers.length < assignmentQuestionCount && (
                            <button
                                onClick={() => submitAssignment()}
                                disabled={isSubmitting}
                                className="mt-2 w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Send size={14} />
                                {isSubmitting ? t('practicePage.submitting') : `${t('practicePage.submitEarly')} (${assignmentAnswers.length}/${assignmentQuestionCount} ${t('practicePage.câu')})`}
                            </button>
                        )}
                    </div>
                )}

                {/* Assignment Result (after submission) */}
                {assignmentId && assignmentSubmitted && (
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/40 p-6 mb-3">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
                                <Trophy size={32} className="text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-blue-900 mb-1">{t('practicePage.submitted')}</h2>
                            <p className="text-sm text-blue-600/70 mb-4">
                                {assignment?.title || t('practicePage.realtimeAssignment')}
                            </p>

                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-blue-50 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-blue-700">{assignmentAnswers.length}</p>
                                    <p className="text-xs text-blue-500">{t('practicePage.totalQuestions')}</p>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-emerald-700">
                                        {assignmentAnswers.filter(a => a.isCorrect).length}
                                    </p>
                                    <p className="text-xs text-emerald-500">{t('practicePage.correct')}</p>
                                </div>
                                <div className="bg-amber-50 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-amber-700">
                                        {assignmentAnswers.length > 0 ? Math.round((assignmentAnswers.filter(a => a.isCorrect).length / assignmentQuestionCount) * 100) : 0}%
                                    </p>
                                    <p className="text-xs text-amber-500">{t('practicePage.score')}</p>
                                </div>
                            </div>

                            {/* Info about remaining attempts */}
                            {assignmentMaxAttempts !== null && (
                                <p className={`text-xs mb-3 ${
                                    assignmentCanSubmit ? 'text-blue-600' : 'text-red-600 font-bold'
                                }`}>
                                    {assignmentCanSubmit
                                        ? t('practicePage.attemptsLeft', { count: assignmentRemainingAttempts })
                                        : t('practicePage.noAttemptsLeft')
                                    }
                                </p>
                            )}

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => navigate('/my-assignments')}
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg transition-all text-sm"
                                >
                                    <ArrowLeft size={16} className="inline mr-1" />
                                    {t('practicePage.backToList')}
                                </button>
                                {assignmentCanSubmit && (
                                    <button
                                        onClick={() => {
                                            setAssignmentSubmitted(false);
                                            setAssignmentAnswers([]);
                                            setStats({ correct: 0, wrong: 0, total: 0 });
                                            setHistory([]);
                                            startTimeRef.current = Date.now();
                                        }}
                                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:shadow-lg transition-all text-sm"
                                    >
                                        <RefreshCw size={16} className="inline mr-1" />
                                        {t('practicePage.retry')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Practice area - hidden when assignment is submitted */}
                {!(assignmentId && assignmentSubmitted) && (<>
                {/* Practice Mode & Topic Selector */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-200/30 border border-blue-200/40 p-3 mb-2">
                    <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2 text-sm">
                        <Settings className="w-4 h-4 text-blue-500" />
                        {t('practice.selectLetter')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {/* Practice Mode */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                {t('practice.selectLetter')}
                            </label>
                            <select
                                value={practiceMode}
                                onChange={(e) => {
                                    setPracticeMode(e.target.value);
                                    setSelectedLetter(null);
                                }}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
                            >
                                <option value="letter">{t('practicePage.letterMode')}</option>
                                <option value="word">{t('practicePage.wordMode')}</option>
                                <option value="sentence">{t('practicePage.sentenceMode')}</option>
                            </select>
                        </div>
                        {/* Topic Selector */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                {t('practicePage.selectTopic')}
                            </label>
                            <select
                                value={selectedTopic}
                                onChange={(e) => setSelectedTopic(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
                            >
                                <option value="all">{t('practicePage.allTopics')}</option>
                                {practiceMode === 'word' && Object.keys(VOCABULARY_BY_TOPIC).map(topic => {
                                    const topicInfo = QUIZ_TOPICS.find(t => t.key === topic);
                                    return (
                                        <option key={topic} value={topic}>
                                            {topicInfo ? `${topicInfo.icon} ${topicInfo.viName}` : topic}
                                        </option>
                                    );
                                })}
                                {practiceMode === 'sentence' && Object.keys(SENTENCES_BY_TOPIC).map(topic => {
                                    const topicInfo = QUIZ_TOPICS.find(t => t.key === topic);
                                    return (
                                        <option key={topic} value={topic}>
                                            {topicInfo ? `${topicInfo.icon} ${topicInfo.viName}` : topic}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Letter Selection */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-200/30 border border-blue-200/40 p-3 mb-2">
                    <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2 text-sm">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        {t('practice.selectLetter')}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        {ALPHABET.map(letter => (
                            <button
                                key={letter}
                                onClick={() => selectLetter(letter)}
                                className={`w-9 h-9 rounded-lg font-bold text-xs transition-all duration-300 preserve-3d ${
                                    selectedLetter === letter
                                        ? 'bg-gradient-to-br from-blue-500 via-sky-400 to-cyan-400 text-white shadow-lg shadow-blue-500/40 scale-110 neon-btn translate-z-10'
                                        : isStreaming
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200/60 hover:bg-blue-100 hover:text-blue-800 hover:-translate-y-1 hover:shadow-md'
                                        : 'bg-gray-50/50 text-gray-400 border border-gray-200/50 cursor-not-allowed opacity-70'
                                }`}
                                disabled={!isStreaming}
                            >
                                {letter}
                            </button>
                        ))}
                    </div>
                    {!isStreaming && (
                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {t('practiceFeedback.enableCameraFirst')}
                        </p>
                    )}
                    {selectedLetter && (
                        <p className="text-xs text-emerald-600 mt-1.5 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {t('practiceFeedback.selectedLetter')} <span className="font-bold">{selectedLetter}</span> - {t('practiceFeedback.bringHandToCamera')}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-3 sm:gap-4">
                    {/* Main Practice Area */}
                    <div className="xl:col-span-4 space-y-2 sm:space-y-3">
                        {/* Camera Section */}
                        <div className="bg-white/80 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-blue-300/30 p-3 border border-blue-200/50 relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 p-2 rounded-xl mb-2 border border-blue-100 relative z-10">
                                <Settings size={16} className="text-blue-500 hidden sm:block" />
                                <select
                                    className="flex-1 w-full sm:w-auto bg-white/80 backdrop-blur border border-blue-200/60 rounded-lg px-3 py-1.5 outline-none font-semibold text-blue-900 shadow-sm focus:ring-2 focus:ring-blue-400/50 transition-all text-xs"
                                    value={selectedCamera}
                                    onChange={(e) => {
                                        setSelectedCamera(e.target.value);
                                        if (isStreaming) {
                                            stopCamera();
                                            setTimeout(startCamera, 500);
                                        }
                                    }}
                                >
                                    {cameras.length === 0 && <option value="">{t('practiceFeedback.searchingCamera')}</option>}
                                    {cameras.map((cam, index) => (
                                        <option key={cam.deviceId} value={cam.deviceId}>
                                            {cam.label || `${t('practiceFeedback.camera')} ${index + 1}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Camera + Skeleton side by side */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-2 relative z-10">
                                {/* Camera */}
                                <div className="relative aspect-video bg-blue-950/5 rounded-xl overflow-hidden flex items-center justify-center border border-blue-200/50 shadow-inner-lg">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className={`w-full h-full object-cover ${isStreaming ? 'scan-effect' : 'hidden'}`}
                                        style={{ transform: 'scaleX(-1)' }}
                                    />
                                    {!isStreaming && (
                                        <div className="text-blue-400 font-medium flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <Camera size={20} className="text-blue-500"/>
                                            </div>
                                            <p className="text-xs">{t('practiceFeedback.enableCameraStart')}</p>
                                        </div>
                                    )}
                                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-lg backdrop-blur-md transition-colors duration-300 ${
                                        isHandPresent ? 'bg-emerald-500/90 border border-emerald-400' : 'bg-gray-800/60 border border-gray-600/50'
                                    }`}>
                                        {isHandPresent ? t('practiceFeedback.handDetected') : t('practiceFeedback.noHand')}
                                    </div>
                                </div>

                                {/* Skeleton */}
                                <div className="relative aspect-video bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl overflow-hidden flex items-center justify-center border-2 border-cyan-200 shadow-inner holo-border">
                                    {skeletonImage ? (
                                        <img src={skeletonImage} alt="Hand skeleton" className="w-full h-full object-contain mix-blend-multiply" />
                                    ) : (
                                        <div className="text-blue-300 flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center border border-blue-100">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
                                                </svg>
                                            </div>
                                            <span className="text-xs font-bold tracking-wide">{t('dashboard.skeletonTitle')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Start/Stop Button */}
                            <button
                                onClick={isStreaming ? stopCamera : startCamera}
                                disabled={isCameraLoading}
                                className={`w-full py-2 rounded-xl font-bold text-xs transition-all duration-300 flex justify-center items-center gap-2 relative z-10 ${
                                    isStreaming
                                        ? 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white shadow-lg shadow-red-500/30 neon-btn'
                                        : isCameraLoading
                                        ? 'bg-gray-400 text-white cursor-not-allowed opacity-80'
                                        : 'bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 hover:from-blue-700 hover:via-sky-600 hover:to-cyan-500 text-white shadow-xl shadow-blue-500/40 neon-btn hover:-translate-y-0.5'
                                }`}
                            >
                                {isCameraLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        {t('practiceFeedback.connecting')}
                                    </>
                                ) : (
                                    <>
                                        <Camera size={16} />
                                        {isStreaming ? t('practiceFeedback.stopCamera') : t('practice.startCamera')}
                                    </>
                                )}
                            </button>

                            {cameraError && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                                    {cameraError}
                                </div>
                            )}

                            <canvas ref={canvasRef} width="640" height="480" className="hidden" />
                        </div>

                        {/* Real-time Feedback */}
                        {selectedLetter && isStreaming && (
                            <div className={`bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border ${[
                                realtimeFeedback?.isCorrect === true ? 'border-emerald-400 shadow-emerald-500/30' :
                                realtimeFeedback?.isCorrect === false ? 'border-amber-400 shadow-amber-500/30' : 'border-blue-200 shadow-blue-200/30'
                            ]} transition-all duration-300`}>
                                {/* Target Letter */}
                                <div className={`p-3 text-white text-center bg-gradient-to-r ${[
                                    realtimeFeedback?.isCorrect === true ? 'from-emerald-500 to-teal-500' :
                                    realtimeFeedback?.isCorrect === false ? 'from-amber-500 to-orange-500' :
                                    'from-blue-600 via-sky-500 to-cyan-500'
                                ]}`}>
                                    <p className="text-[10px] font-bold opacity-90 uppercase tracking-widest mb-0.5">{t('practiceFeedback.performSign')}</p>
                                    <div className="text-4xl font-black drop-shadow-md">{selectedLetter}</div>
                                </div>

                                {/* Feedback Content */}
                                <div className="p-3">
                                    {realtimeFeedback?.type === 'success' ? (
                                        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-3 text-center animate-bounce">
                                            <div className="text-4xl mb-2">🎉</div>
                                            <p className="font-bold text-emerald-700 text-sm">{t('practiceFeedback.correctSign')}</p>
                                            <button
                                                onClick={nextLetter}
                                                className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-lg font-bold hover:shadow-lg transition text-xs"
                                            >
                                                <SkipForward className="w-4 h-4 inline mr-1" />
                                                {t('practiceFeedback.nextLetter')}
                                            </button>
                                        </div>
                                    ) : realtimeFeedback?.type === 'correction' ? (
                                        <div className="space-y-2">
                                            {/* Main message */}
                                            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3">
                                                <div className="flex items-start gap-2">
                                                    <div className="text-3xl">⚠️</div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-red-800 text-sm leading-tight">
                                                            {t('practiceFeedback.youAreShowing')} "{realtimeFeedback.detectedLetter}"<br/>
                                                            {t('practiceFeedback.butNeedToShow')} "{realtimeFeedback.targetLetter}"!
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Corrections */}
                                            {realtimeFeedback.corrections && realtimeFeedback.corrections.length > 0 && (
                                                <div className="space-y-1.5">
                                                    <h4 className="font-bold text-gray-800 flex items-center gap-2 text-xs">
                                                        <span className="text-base">📋</span>
                                                        {t('practiceFeedback.correctionDetails')}
                                                    </h4>
                                                    {realtimeFeedback.corrections.map((corr, idx) => (
                                                        <div key={idx} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-2.5 border-2 border-amber-200">
                                                            <p className="font-bold text-gray-800 capitalize text-xs">
                                                                {t('practiceFeedback.finger')} {t(`practice.${corr.finger}`)}:
                                                            </p>
                                                            <p className="text-xs text-gray-700 font-medium">{corr.fix}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Hint */}
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                                                <p className="text-xs text-blue-700 flex items-center gap-2 justify-center">
                                                    <Lightbulb className="w-3.5 h-3.5" />
                                                    {t('practiceFeedback.adjustHand')}
                                                </p>
                                            </div>
                                        </div>
                                    ) : realtimeFeedback?.type === 'correcting' ? (
                                        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-3 text-center">
                                            <div className="flex items-center justify-center gap-2 mb-1.5">
                                                <ThumbsUp className="w-4 h-4 text-emerald-600" />
                                                <span className="font-bold text-emerald-700 text-xs">{realtimeFeedback.message}</span>
                                            </div>
                                            <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 transition-all duration-200 rounded-full"
                                                    style={{ width: `${realtimeFeedback.progress}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-emerald-600 mt-1">
                                                {t('practiceFeedback.confirming')} {Math.round(realtimeFeedback.progress)}%
                                            </p>
                                        </div>
                                    ) : realtimeFeedback?.type === 'waiting' ? (
                                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 text-center">
                                            <div className="flex items-center justify-center gap-2 mb-1.5">
                                                <Play className="w-4 h-4 text-cyan-600" />
                                                <span className="font-bold text-blue-700 text-xs">{realtimeFeedback.message}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 py-2">
                                            <Play className="w-5 h-5 mx-auto mb-1.5 opacity-50" />
                                            <p className="text-xs">{t('practiceFeedback.bringHandToCamera')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-2 sm:space-y-3">
                        {/* Letter Guide */}
                        {letterGuide && (
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-200/30 overflow-hidden border border-blue-200/40">
                                <div className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 p-3 text-white">
                                    <h3 className="font-bold text-sm flex items-center gap-2 drop-shadow-sm">
                                        <BookOpen className="w-4 h-4" />
                                        {t('practiceFeedback.letterGuide')} {selectedLetter}
                                    </h3>
                                </div>
                                <div className="p-3 space-y-2">
                                    <div className="bg-blue-50/50 rounded-xl p-2.5 border border-blue-100">
                                        <p className="text-xs text-blue-900 font-medium leading-relaxed">{letterGuide.description}</p>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-gray-700 mb-1 flex items-center gap-2 text-xs">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                            {t('practiceFeedback.importantPoints')}
                                        </h4>
                                        <div className="space-y-1">
                                            {letterGuide.keyPoints?.map((point, idx) => (
                                                <div key={idx} className={`p-1.5 rounded-lg text-xs ${
                                                    point.status === 'critical' ? 'bg-red-50 border border-red-100' :
                                                    point.status === 'important' ? 'bg-amber-50 border border-amber-100' :
                                                    'bg-gray-50 border border-gray-100'
                                                }`}>
                                                    <p className="text-xs text-gray-700">{point.feedback}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {letterGuide.commonMistakes && letterGuide.commonMistakes.length > 0 && (
                                        <div>
                                            <h4 className="font-bold text-red-600 mb-1 flex items-center gap-2 text-xs">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                {t('practiceFeedback.commonMistakes')}
                                            </h4>
                                            <div className="space-y-0.5">
                                                {letterGuide.commonMistakes.map((mistake, idx) => (
                                                    <div key={idx} className="flex items-start gap-1.5 text-xs text-gray-600">
                                                        <span className="text-red-400">•</span>
                                                        <span>{mistake}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* History */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-200/30 p-3 border border-blue-200/40">
                            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2 text-sm">
                                <TrendingUp className="w-4 h-4 text-blue-500" />
                                {t('practiceFeedback.history')}
                            </h3>
                            {history.length === 0 ? (
                                <div className="bg-blue-50/50 rounded-xl p-3 text-center border border-blue-100">
                                    <p className="text-xs text-blue-600 font-medium">
                                        {t('practiceFeedback.noHistory')}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {history.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm transition-transform hover:scale-110 ${
                                                item.isCorrect
                                                    ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-emerald-500/30'
                                                    : 'bg-gradient-to-br from-red-400 to-rose-500 text-white shadow-red-500/30'
                                            }`}
                                        >
                                            {item.letter}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                </>)} {/* End of practice area conditional */}
            </div>
        </Layout>
    );
};

export default PracticePage;
