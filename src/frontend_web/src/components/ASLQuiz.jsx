import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, ArrowLeft, Check, X, Trophy, RotateCcw,
  Home, ChevronRight, Target, Zap, Award, Star,
  Lightbulb, EyeOff, Image as ImageIcon, BookOpen, MessageSquare,
  Sparkles, PartyPopper, Medal, TrendingUp, RefreshCw, Shuffle, ListFilter, FileText,
  Clock
} from 'lucide-react';
import {
  generateLetterQuiz,
  generateVocabularyQuiz,
  generateSentenceQuiz,
  generateTopicVocabularyQuiz,
  generateTopicSentenceQuiz,
  QUIZ_TOPICS,
  getASLLetterImage
} from '../data/aslQuizData';
import { useLanguage } from '../contexts/LanguageContext';
import Header from './Header';
import Footer from './Footer';
import { useAssignment } from '../contexts/AssignmentContext';
import { toast } from 'react-hot-toast';
import LeaveConfirmModal from './LeaveConfirmModal';

const ASLQuiz = ({ assignmentContext = null, onAssignmentComplete = null, onSubmitComplete = null, canSubmit = true, attemptCount = 0, maxAttempts = null, remainingAttempts = null, bestScore = null, isCompleted = false }) => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [quizType, setQuizType] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [showHint, setShowHint] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssignmentMode, setIsAssignmentMode] = useState(false);
  const [isFromAssignment, setIsFromAssignment] = useState(false);

  // Refs để track giá trị mới nhất tránh stale closure khi thoát giữa chừng
  const scoreRef = React.useRef(0);
  const questionsRef = React.useRef([]);
  const currentIndexRef = React.useRef(0);

  // ── COUNTDOWN TIMER (chỉ dùng trong chế độ bài kiểm tra) ──
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeExpired, setTimeExpired] = useState(false); // flash "Hết giờ"
  const timerRef = useRef(null);
  const isAdvancingRef = useRef(false); // chống gọi nextQuestion 2 lần

  // Thời gian per loại bài kiểm tra
  const QUIZ_TIME_LIMITS = {
    letter: 60,
    vocabulary: 90,
    sentence: 120,
  };

  const getTimerColor = (t) => {
    if (t <= 3) return 'text-red-500 animate-pulse';
    if (t <= 10) return 'text-orange-500';
    return 'text-blue-600';
  };

  const getTimerBg = (t) => {
    if (t <= 3) return 'bg-red-50 border-red-300';
    if (t <= 10) return 'bg-orange-50 border-orange-300';
    return 'bg-blue-50 border-blue-200';
  };

  // Mode cho vocabulary và sentence: 'random' hoặc 'topic'
  const [quizMode, setQuizMode] = useState('random');
  const [selectedTopic, setSelectedTopic] = useState('');

  const quizTypes = [
    {
      id: 'letter',
      titleKey: 'quiz.letterQuiz',
      descKey: 'quiz.letterQuizDesc',
      icon: <ImageIcon className="w-8 h-8" />,
      color: 'from-blue-600 via-blue-500 to-sky-400',
      bgColor: 'bg-blue-50/50',
      borderColor: 'border-blue-200/50',
      iconBg: 'bg-gradient-to-br from-blue-100 to-sky-100',
      hasTopicMode: false
    },
    {
      id: 'vocabulary',
      titleKey: 'quiz.vocabQuiz',
      descKey: 'quiz.vocabQuizDesc',
      icon: <BookOpen className="w-8 h-8" />,
      color: 'from-sky-500 via-cyan-400 to-teal-400',
      bgColor: 'bg-sky-50/50',
      borderColor: 'border-sky-200/50',
      iconBg: 'bg-gradient-to-br from-sky-100 to-cyan-100',
      hasTopicMode: true
    },
    {
      id: 'sentence',
      titleKey: 'quiz.sentenceQuiz',
      descKey: 'quiz.sentenceQuizDesc',
      icon: <MessageSquare className="w-8 h-8" />,
      color: 'from-blue-600 via-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-50/50',
      borderColor: 'border-indigo-200/50',
      iconBg: 'bg-gradient-to-br from-indigo-100 to-purple-100',
      hasTopicMode: true
    }
  ];

  // Optional props support for assignment mode
  // If this component is used as an assignment runner, parent can pass
  // `assignmentContext` and `onAssignmentComplete(result)` via props.

  const [answersLog, setAnswersLog] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const assignmentCtx = useAssignment();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const pendingActionRef = React.useRef(null);

  // Exit modal state (chỉ dùng khi đang trong luồng bài tập)
  const [showExitModal, setShowExitModal] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Phân biệt exam hay assignment để hiển thị đúng text
  const isExamMode = Boolean(assignmentContext?.isExam);

  const onRequestNavigateAway = (action) => {
    if (assignmentCtx?.isLocked) {
      pendingActionRef.current = action;
      setShowLeaveModal(true);
      return;
    }
    if (action) action();
  };

  // Thoát bài tập giữa chừng: submit kết quả hiện tại, trừ 1 lượt, về đúng trang
  const handleForceExit = async () => {
    if (isExiting) return;
    setIsExiting(true);
    try {
      if (onAssignmentComplete) {
        // Dùng refs để lấy giá trị mới nhất, tránh stale closure
        const total = questionsRef.current.length || 0;
        const correctCount = scoreRef.current;
        const answeredCount = answersLog.length;
        // Nếu chưa trả lời câu nào thì score = 0
        const accuracy = total > 0 && answeredCount > 0
          ? Math.round((correctCount / total) * 100)
          : 0;
        const timeSpent = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
        const result = { total, correctCount, score: accuracy, accuracy, timeSpent, answers: answersLog };
        await onAssignmentComplete(result);
      }
    } catch (e) {
      console.error('Force exit submit error:', e);
    } finally {
      setIsExiting(false);
      setShowExitModal(false);
      try { if (assignmentCtx && assignmentCtx.release) assignmentCtx.release(); } catch (e) {}
      if (isExamMode) {
        navigate('/student/exams');
      } else {
        navigate('/my-assignments');
      }
    }
  };

  const startQuiz = (type, isAssignment = false, overrideMode = null, overrideTopic = null) => {
    // Ưu tiên override (từ exam/assignment context) trước, sau đó mới dùng state
    const effectiveMode  = overrideMode  ?? quizMode;
    const effectiveTopic = overrideTopic ?? selectedTopic;

    let generatedQuestions = [];
    switch (type) {
      case 'letter':
        generatedQuestions = generateLetterQuiz(questionCount, isAssignment);
        break;
      case 'vocabulary':
        if (effectiveMode === 'topic' && effectiveTopic) {
          generatedQuestions = generateTopicVocabularyQuiz(effectiveTopic, questionCount);
        } else {
          generatedQuestions = generateVocabularyQuiz(questionCount);
        }
        break;
      case 'sentence':
        if (effectiveMode === 'topic' && effectiveTopic) {
          generatedQuestions = generateTopicSentenceQuiz(effectiveTopic, questionCount);
        } else {
          generatedQuestions = generateSentenceQuiz(questionCount, isAssignment);
        }
        break;
      default:
        break;
    }
    setQuestions(generatedQuestions);
    questionsRef.current = generatedQuestions;
    setQuizType(type);
    setCurrentIndex(0);
    setScore(0);
    scoreRef.current = 0;
    setQuizComplete(false);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(null);
    setShowHint(false);
    setAnswersLog([]);
    setStartTime(Date.now());
    setHasSubmitted(false);
    setIsSubmitting(false);
  };

  const handleAnswer = (answer) => {
    if (showResult) return;
    
    stopTimer(); // dừng timer khi đã chọn đáp án
    isAdvancingRef.current = false;
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const correct = answer === questions[currentIndex].correctAnswer;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(prev => {
        const next = prev + 1;
        scoreRef.current = next;
        return next;
      });
    }
    // record answer
    setAnswersLog(prev => [...prev, { index: currentIndex, selected: answer, correct }]);
  };

  const nextQuestion = () => {
    stopTimer();
    isAdvancingRef.current = false;
    setTimeExpired(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(null);
      setShowHint(false);
    } else {
      setQuizComplete(true);
    }
  };

  const resetQuiz = () => {
    stopTimer();
    setQuizType(null);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setQuizComplete(false);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(null);
    setShowHint(false);
    setAnswersLog([]);
    setStartTime(null);
    setHasSubmitted(false);
    setIsSubmitting(false);
    setIsAssignmentMode(false);
    setIsFromAssignment(false);
    setTimeLeft(0);
    setTimeExpired(false);
  };

  const handleShowHint = () => {
    setShowHint(prev => !prev);
  };

  // ── Timer helpers ──
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = (duration) => {
    stopTimer();
    setTimeLeft(duration);
    setTimeExpired(false);
    isAdvancingRef.current = false;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          // Hết giờ: tính điểm ngay (chưa chọn = sai)
          setTimeExpired(true);
          setShowResult(true);
          // Nếu chưa chọn đáp án → ghi nhận sai
          setSelectedAnswer(prev2 => {
            if (prev2 === null) {
              setIsCorrect(false);
              setAnswersLog(log => [...log, { index: currentIndexRef.current, selected: null, correct: false }]);
            }
            return prev2;
          });
          // Tự chuyển câu sau 1 giây
          setTimeout(() => {
            if (!isAdvancingRef.current) {
              isAdvancingRef.current = true;
              setTimeExpired(false);
              nextQuestionAuto();
            }
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // nextQuestion dùng cho auto (hết giờ) — không cần guard showResult
  const nextQuestionAuto = () => {
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next < questionsRef.current.length) {
        setSelectedAnswer(null);
        setShowResult(false);
        setIsCorrect(null);
        setShowHint(false);
        setTimeExpired(false);
        return next;
      } else {
        setQuizComplete(true);
        return prev;
      }
    });
  };

  // Cleanup timer khi unmount
  useEffect(() => {
    return () => stopTimer();
  }, []);

  // Sync currentIndexRef
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Khởi động timer khi câu hỏi thay đổi (chỉ trong chế độ bài kiểm tra)
  useEffect(() => {
    if (!isAssignmentMode || quizComplete || !quizType || questions.length === 0) return;
    if (showResult) return; // đang hiển thị kết quả, không reset timer
    const duration = QUIZ_TIME_LIMITS[quizType] ?? 60;
    const t = setTimeout(() => startTimer(duration), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isAssignmentMode, quizType, questions.length, quizComplete]);

  const getScoreMessage = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage === 100) return { text: t('quiz.perfectScore'), emoji: '🏆' };
    if (percentage >= 80) return { text: t('quiz.greatScore'), emoji: '🌟' };
    if (percentage >= 60) return { text: t('quiz.goodScore'), emoji: '👍' };
    if (percentage >= 40) return { text: t('quiz.tryHarder'), emoji: '💪' };
    return { text: t('quiz.keepLearning'), emoji: '📚' };
  };

  // Quiz Type Selection Screen
  // Auto-start when used as assignment runner
  useEffect(() => {
    // Don't auto-start if quiz is already complete or cannot submit
    if (quizComplete) return;
    if (assignmentContext && assignmentContext.presetType && canSubmit) {
      // map assignment type to quiz type (vocabulary vs word labels)
      let qType = assignmentContext.presetType;
      if (qType === 'word') qType = 'vocabulary';
      if (qType === 'sentence') qType = 'sentence';
      const count = assignmentContext.questionCount || questionCount;
      setQuestionCount(count);
      setIsAssignmentMode(true);
      setIsFromAssignment(true);
      // Truyền mode/topic trực tiếp để tránh async state issue
      const examMode  = assignmentContext.examMode  || null;
      const examTopic = assignmentContext.examTopic || null;
      startQuiz(qType, true, examMode, examTopic);
      // lock assignment if assignmentId present
      if (assignmentContext && assignmentContext.assignmentId && assignmentCtx && assignmentCtx.lock) {
        try { assignmentCtx.lock(assignmentContext.assignmentId); } catch (e) {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentContext, canSubmit]);

  // Prevent unload when assignment locked
  useEffect(() => {
    if (!assignmentCtx) return;
    const onBefore = (e) => {
      if (assignmentCtx.isLocked) {
        e.preventDefault();
        e.returnValue = t('quiz.leaveWarning');
      }
    };
    if (assignmentCtx.isLocked) window.addEventListener('beforeunload', onBefore);
    return () => window.removeEventListener('beforeunload', onBefore);
  }, [assignmentCtx && assignmentCtx.isLocked]);

  // Chặn Back button / navigate trong app khi đang làm bài tập
  // Dùng popstate thay vì useBlocker để tránh crash với React Router v7
  useEffect(() => {
    if (!isFromAssignment || quizComplete) return;

    // Push một entry giả vào history để "chặn" Back
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      // Khi user bấm Back → push lại để giữ nguyên trang
      window.history.pushState(null, '', window.location.href);
      // Hiện modal xác nhận
      setShowExitModal(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isFromAssignment, quizComplete]);

  // Notify parent when quiz completes (assignment mode) - only submit once
  useEffect(() => {
    if (quizComplete && onAssignmentComplete && !hasSubmitted && !isSubmitting) {
      const total = questions.length || 0;
      const correctCount = score;
      const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
      const timeSpent = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
      const result = {
        total,
        correctCount,
        score: accuracy,
        accuracy,
        timeSpent,
        answers: answersLog
      };
      // Mark as submitting immediately so user can see the results screen
      setIsSubmitting(true);
      try {
        setHasSubmitted(true);
        // Only call onAssignmentComplete if can submit
        if (canSubmit) {
          onAssignmentComplete(result);
        } else {
          // Can't submit, but still show results
          setIsSubmitting(false);
        }
      } catch (err) {
        console.error('onAssignmentComplete error:', err);
        setIsSubmitting(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizComplete, canSubmit]);
    // If used as assignment runner, accept props via window.__INJECT__ fallback (backwards compatible)
    // New behaviour: if `window.__ASSIGNMENT_PROPS__` exists, it can contain: { presetType, questionCount, onComplete }
    // But the proper integration is via `StudentAssignmentDetail` which will pass props to this component.

    // Quiz Type Selection Screen
  if (!quizType) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-transparent">
        {!assignmentCtx?.isLocked && <Header />}
        <div className="max-w-5xl mx-auto px-4 pt-1 pb-6 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-16"></div>
            <div className="w-16"></div>
          </div>

          {/* Assignment status: best score + attempts */}
          {(bestScore !== null || maxAttempts !== null) && (
            <div className="mb-4 p-3 rounded-lg bg-white/80 border border-blue-100 flex items-center gap-3">
              <div className="flex-1 text-left">
                {bestScore !== null && (
                  <div className="text-sm text-gray-700">{t('quiz.bestScore')}: <strong className="text-blue-700">{bestScore}%</strong></div>
                )}
                {maxAttempts !== null ? (
                  <div className="text-[12px] text-gray-500">{t('practicePage.attemptsRemaining')}: <strong>{remainingAttempts}</strong></div>
                ) : (
                  <div className="text-[12px] text-gray-500">{t('practicePage.attemptsInfinite')}</div>
                )}
                {isCompleted && (
                  <div className="text-[12px] text-emerald-700">{t('practicePage.studentCompleted')}</div>
                )}
              </div>
            </div>
          )}

          {/* Question Count Selector */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-200/30 p-4 mb-4 border border-blue-200/40">
            <div className="flex items-center gap-3 mb-3">
              <Target className="w-5 h-5 text-blue-500 animate-pulse" />
              <span className="font-semibold text-blue-900 text-sm">{t('quiz.numberOfQuestions')}</span>
              <div className="flex gap-1.5 ml-auto">
                {[5, 10, 15, 20].map(count => (
                  <button
                    key={count}
                    onClick={() => {
                      // prevent changing/starting when not allowed
                      if (!canSubmit || (remainingAttempts !== null && remainingAttempts <= 0)) {
                        toast.error(t('practicePage.noAttemptsLeft'));
                        return;
                      }
                      setQuestionCount(count);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-medium transition text-xs ${
                      questionCount === count
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/40 scale-105 neon-btn'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mode Selector - cho vocabulary và sentence */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-200/30 p-4 mb-4 border border-blue-200/40">
            <div className="flex items-center gap-3 mb-3">
              <Shuffle className="w-5 h-5 text-purple-500 animate-pulse" />
              <span className="font-semibold text-purple-900 text-sm">{t('quiz.mode')}</span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {/* Thông thường */}
              <button
                onClick={() => { setQuizMode('random'); setSelectedTopic(''); }}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  quizMode === 'random'
                    ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-200'
                    : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'
                }`}
              >
                <div className={`p-2 rounded-lg ${quizMode === 'random' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <Shuffle className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className={`font-semibold text-xs ${quizMode === 'random' ? 'text-purple-700' : 'text-gray-700'}`}>{t('quiz.normalMode')}</div>
                  <div className="text-[10px] text-gray-500">{t('quiz.normalModeDesc')}</div>
                </div>
                {quizMode === 'random' && (
                  <div className="ml-auto">
                    <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </button>

              {/* Theo chủ đề */}
              <button
                onClick={() => setQuizMode('topic')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  quizMode === 'topic'
                    ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-200'
                    : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
                }`}
              >
                <div className={`p-2 rounded-lg ${quizMode === 'topic' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <ListFilter className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className={`font-semibold text-xs ${quizMode === 'topic' ? 'text-emerald-700' : 'text-gray-700'}`}>{t('quiz.topicMode')}</div>
                  <div className="text-[10px] text-gray-500">{t('quiz.topicModeDesc')}</div>
                </div>
                {quizMode === 'topic' && (
                  <div className="ml-auto">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </button>
            </div>

            {/* Topic Selector - chỉ hiện khi chọn Theo chủ đề */}
            {quizMode === 'topic' && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <ListFilter className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-emerald-800 text-xs">{t('quiz.selectTopicLabel')}</span>
                  {selectedTopic && (
                    <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                      {QUIZ_TOPICS.find(t => t.key === selectedTopic)?.icon} {lang === 'vi' ? QUIZ_TOPICS.find(t => t.key === selectedTopic)?.viName : QUIZ_TOPICS.find(t => t.key === selectedTopic)?.name}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-1 max-h-36 overflow-y-auto justify-items-center">
                  {QUIZ_TOPICS.map(topic => (
                    <button
                      key={topic.key}
                      onClick={() => setSelectedTopic(topic.key)}
                      className={`flex items-center justify-center gap-1 px-1.5 py-1 rounded-lg border-2 transition-all text-[10px] w-full max-w-[100px] ${
                        selectedTopic === topic.key
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-100 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 text-gray-600'
                      }`}
                    >
                      <span className="text-xs">{topic.icon}</span>
                      <span className="truncate">{lang === 'vi' ? topic.viName : topic.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quiz Type Cards */}
          {quizMode === 'topic' && !selectedTopic ? (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 text-center">
              <div className="text-3xl mb-2">📋</div>
              <h3 className="text-sm font-bold text-amber-800 mb-1">{t('quiz.selectTopicWarning')}</h3>
              <p className="text-xs text-amber-600">{t('quiz.selectTopicHint')}</p>
            </div>
          ) : (
            <div className={`grid gap-4 perspective-1000 ${quizMode === 'topic' ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'md:grid-cols-3'}`}>
              {quizTypes
                .filter(type => {
                  // Khi chọn "Theo chủ đề", ẩn chữ cái (letter)
                  if (quizMode === 'topic' && type.id === 'letter') return false;
                  return true;
                })
                .map(type => (
              <button
                key={type.id}
                onClick={() => {
                  const starter = () => {
                    if (assignmentCtx?.isLocked) {
                      // allow starting only if matches assigned preset
                      const assigned = assignmentContext?.presetType ? (assignmentContext.presetType === 'word' ? 'vocabulary' : assignmentContext.presetType) : null;
                      if (!assigned || assigned !== type.id) {
                        toast(t('quiz.cannotChangeType'));
                        return;
                      }
                    }
                    startQuiz(type.id);
                  };
                  onRequestNavigateAway(starter);
                }}
                className="group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-200/20 hover:shadow-2xl hover:shadow-blue-400/40 transition-all duration-500 overflow-hidden border border-blue-200/40 hover:-translate-y-2 preserve-3d"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                {/* Decorative glowing orb */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${type.color} rounded-full blur-2xl opacity-20 group-hover:opacity-50 transition-opacity duration-500`} />
                
                <div className="p-5 text-center relative z-10 transform-style-3d group-hover:translate-z-10 transition-transform duration-500">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${type.iconBg} mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner electric-border`}>
                    <div className={`text-blue-600 group-hover:text-blue-700 transition-colors`}>
                      {type.icon}
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-blue-900 mb-1">{t(type.titleKey)}</h3>
                  <p className="text-xs text-blue-700/70 mb-3">{t(type.descKey)}</p>
                  <div className={`inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r ${type.color} text-white rounded-lg font-semibold shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105 neon-btn text-xs`}>
                    <Zap className="w-4 h-4 animate-pulse" />
                    {t('quiz.start')}
                  </div>
                </div>
              </button>
            ))}
            </div>
          )}

          {/* Tips */}
          <div className="mt-4 bg-white/60 backdrop-blur-lg rounded-2xl p-4 border border-blue-200/50 shadow-lg shadow-blue-200/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-300/20 rounded-full blur-2xl"></div>
            <div className="flex items-start gap-3 relative z-10">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-sky-100 rounded-lg shadow-inner border border-blue-200/50">
                <Star className="w-5 h-5 text-blue-500 animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 mb-1.5 text-sm">{t('quiz.learningTips')}</h3>
                <ul className="text-blue-800/80 space-y-1 text-xs">
                  <li>• {t('quiz.tip1')}</li>
                  <li>• {t('quiz.tip2')}</li>
                  <li>• {t('quiz.tip3')}</li>
                  <li>• {t('quiz.tip4')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <LeaveConfirmModal
          open={showLeaveModal}
          onCancel={() => { setShowLeaveModal(false); pendingActionRef.current = null; }}
          onConfirm={async () => {
            setShowLeaveModal(false);
            if (onAssignmentComplete) {
              try {
                const total = questions.length || 0;
                const correctCount = score;
                const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
                const timeSpent = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
                const result = { total, correctCount, score: accuracy, accuracy, timeSpent, answers: answersLog };
                await onAssignmentComplete(result);
              } catch (e) { console.error('assignment submit failed', e); }
            }
            try { if (assignmentCtx && assignmentCtx.release) assignmentCtx.release(); } catch(e){}
            if (pendingActionRef.current) pendingActionRef.current();
            pendingActionRef.current = null;
          }}
        />
        {!assignmentCtx?.isLocked && <Footer />}
      </div>
    );
  }

  // Quiz Complete Screen - Beautiful & Meaningful like Practice Section
  if (quizComplete) {
    const scoreInfo = getScoreMessage();
    const percentage = Math.round((score / questions.length) * 100);
    const correctCount = score;
    const wrongCount = questions.length - score;
    const quizTypeName = quizType === 'letter' ? t('quiz.letterQuiz') : quizType === 'vocabulary' ? t('quiz.vocabQuiz') : t('quiz.sentenceQuiz');
    const quizTypeIcon = quizType === 'letter' ? '📝' : quizType === 'vocabulary' ? '📚' : '💬';

    return (
      <div className="min-h-screen relative overflow-hidden bg-transparent">
        {/* Twinkling Stars Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(100)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={['#FFD700', '#FFA500', '#FF69B4', '#00FFFF', '#ADFF2F', '#FF1493'][Math.floor(Math.random() * 6)]}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          ))}
        </div>

        {/* Massive Confetti Rain */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(150)].map((_, i) => (
            <div
              key={`confetti-${i}`}
              className="absolute animate-confetti-rain"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${20 + Math.random() * 80}px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2.5 + Math.random() * 2}s`,
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF69B4', '#FF4500', '#00FF7F', '#FF1493', '#00FFFF'][Math.floor(Math.random() * 10)],
                width: `${8 + Math.random() * 12}px`,
                height: `${8 + Math.random() * 12}px`,
                borderRadius: Math.random() > 0.3 ? '50%' : '0',
              }}
            />
          ))}
        </div>

        {/* Firework Bursts for high scores */}
        {percentage >= 80 && (
          <>
            <div className="absolute top-10 left-20 animate-firework" style={{animationDelay: '0s'}}>
              <div className="w-4 h-4 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50"></div>
            </div>
            <div className="absolute top-20 right-32 animate-firework" style={{animationDelay: '0.5s'}}>
              <div className="w-3 h-3 bg-teal-400 rounded-full shadow-lg shadow-teal-400/50"></div>
            </div>
            <div className="absolute bottom-40 left-40 animate-firework" style={{animationDelay: '1s'}}>
              <div className="w-5 h-5 bg-orange-400 rounded-full shadow-lg shadow-orange-400/50"></div>
            </div>
            <div className="absolute top-32 right-20 animate-firework" style={{animationDelay: '1.5s'}}>
              <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"></div>
            </div>
            <div className="absolute top-16 left-1/3 animate-firework" style={{animationDelay: '0.8s'}}>
              <div className="w-4 h-4 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50"></div>
            </div>
            <div className="absolute bottom-32 right-1/4 animate-firework" style={{animationDelay: '1.2s'}}>
              <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-400/50"></div>
            </div>
          </>
        )}

        {/* Sparkle effects for perfect score */}
        {percentage === 100 && (
          <>
            <div className="absolute top-20 left-1/4 animate-pulse">
              <Sparkles className="w-10 h-10 text-yellow-400 fill-current" />
            </div>
            <div className="absolute top-32 right-1/4 animate-pulse" style={{animationDelay: '0.3s'}}>
              <Sparkles className="w-8 h-8 text-teal-400 fill-current" />
            </div>
            <div className="absolute bottom-40 left-1/4 animate-pulse" style={{animationDelay: '0.6s'}}>
              <Sparkles className="w-6 h-6 text-amber-400 fill-current" />
            </div>
            <div className="absolute top-1/2 right-20 animate-pulse" style={{animationDelay: '0.9s'}}>
              <Sparkles className="w-8 h-8 text-blue-400 fill-current" />
            </div>
          </>
        )}

        {/* Main Results Card */}
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-white via-amber-50 to-orange-50 rounded-3xl p-5 max-w-lg w-full mx-4 relative z-10 border-4 border-amber-300 shadow-2xl shadow-amber-200/50">

            {/* Glow effect behind the card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 rounded-3xl blur-sm opacity-30"></div>

            {/* Inner card content */}
            <div className="relative bg-gradient-to-br from-white via-amber-50 to-orange-50 rounded-2xl p-4 border-2 border-white/80 shadow-inner-lg">

            {/* Top Banner */}
            <div className="text-center mb-4">
              <div className="inline-block bg-gradient-to-r from-sky-500 via-blue-500 to-teal-500 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-xl">
                {t('quiz.quizComplete')}
              </div>
            </div>

            {/* Trophy & Title */}
            <div className="flex flex-col items-center mb-4">
              <div className={`text-5xl mb-1 ${percentage >= 80 ? 'animate-bounce' : ''}`}>
                {percentage === 100 ? '🏆' : percentage >= 80 ? '🥇' : percentage >= 60 ? '🥈' : percentage >= 40 ? '🥉' : '🎯'}
              </div>
              <h2 className={`text-2xl font-black ${
                percentage === 100
                  ? 'text-amber-600'
                  : percentage >= 80
                    ? 'text-yellow-600'
                  : percentage >= 60
                    ? 'text-blue-600'
                  : percentage >= 40
                    ? 'text-emerald-600'
                  : 'text-gray-600'
              }`}>
                {percentage === 100 ? t('quiz.perfect') : percentage >= 80 ? t('quiz.excellent') : percentage >= 60 ? t('quiz.good') : percentage >= 40 ? t('quiz.tryHarder') : t('quiz.dontGiveUp')}
              </h2>
              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                {quizTypeIcon} {quizTypeName}
              </div>
            </div>

            {/* Score Row */}
            <div className="flex items-center justify-center gap-4 mb-4 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-2xl p-4 shadow-lg shadow-amber-500/30">
              {/* Accuracy */}
              <div className="text-center">
                <div className={`text-3xl font-black text-white drop-shadow-lg`}>
                  {percentage}%
                </div>
                <div className="text-[10px] text-white/80 mt-0.5 font-medium">{t('quiz.accuracy')}</div>
              </div>

              {/* Divider */}
              <div className="w-px h-10 bg-white/40"></div>

              {/* Correct */}
              <div className="text-center">
                <div className="text-2xl font-black text-emerald-500 bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto shadow-lg">{correctCount}</div>
                <div className="text-[10px] text-white/80 mt-0.5 font-medium">{t('quiz.correct')}</div>
              </div>

              {/* Divider */}
              <div className="w-px h-10 bg-white/40"></div>

              {/* Wrong */}
              <div className="text-center">
                <div className="text-2xl font-black text-red-500 bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto shadow-lg">{wrongCount}</div>
                <div className="text-[10px] text-white/80 mt-0.5 font-medium">{t('quiz.wrong')}</div>
              </div>
            </div>

            {/* Encouragement Message */}
            <div className={`text-center p-3 rounded-xl mb-4 ${
              percentage >= 80
                ? 'bg-amber-100 border-2 border-amber-300'
                : percentage >= 60
                  ? 'bg-blue-100 border-2 border-blue-300'
                  : percentage >= 40
                    ? 'bg-emerald-100 border-2 border-emerald-300'
                    : 'bg-gray-100 border-2 border-gray-300'
            }`}>
              <p className={`text-base font-bold ${
                percentage >= 80 ? 'text-amber-700' : percentage >= 60 ? 'text-blue-700' : percentage >= 40 ? 'text-emerald-700' : 'text-gray-700'
              }`}>
                {percentage === 100 ? t('quiz.perfectScore') :
                 percentage >= 80 ? t('quiz.greatScore') :
                 percentage >= 60 ? t('quiz.goodScore') :
                 percentage >= 40 ? t('quiz.tryHarder') :
                 t('quiz.keepLearning')}
              </p>
            </div>

            {/* Practice Insights */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 mb-4 border border-cyan-100">
              <h4 className="font-bold text-cyan-700 mb-2 flex items-center gap-2 text-sm">
                <Lightbulb size={16} />
                {t('quiz.analysis')}
              </h4>
              <div className="space-y-1.5 text-xs">
                {percentage >= 80 ? (
                  <div className="flex items-start gap-2 text-emerald-700">
                    <span>✅</span>
                    <span>{t('quiz.greatJob')}</span>
                  </div>
                ) : percentage >= 60 ? (
                  <div className="flex items-start gap-2 text-blue-700">
                    <span>🎯</span>
                    <span>{t('quiz.keepImproving')}</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-amber-700">
                    <span>📚</span>
                    <span>{t('quiz.practiceMore')}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-gray-600 mt-2 pt-2 border-t border-cyan-200/50">
                  <span>💪</span>
                  <span>{t('quiz.focusOnFingers')}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {!canSubmit ? (
                <div className="bg-amber-100 border-2 border-amber-300 rounded-xl p-3 text-center">
                  <div className="text-amber-700 font-semibold mb-1 text-sm">
                    {remainingAttempts === 0 && maxAttempts !== null
                      ? t('quiz.noAttemptsLeft', { max: maxAttempts })
                      : t('quiz.cannotSubmitNow')
                    }
                  </div>
                  <div className="text-amber-600 text-xs">
                    {maxAttempts !== null
                      ? t('quiz.attemptsLeft', { remaining: remainingAttempts ?? 0, max: maxAttempts })
                      : t('quiz.unlimitedAttempts')
                    }
                  </div>
                  <div className="text-amber-600 text-[10px] mt-0.5">
                    {t('quiz.resultsNotSaved')}
                  </div>
                </div>
              ) : !isFromAssignment && (
                <button
                  onClick={() => startQuiz(quizType, isFromAssignment)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('quiz.retry')}
                </button>
              )}
              <button
                onClick={() => {
                  try { if (assignmentCtx && assignmentCtx.release) assignmentCtx.release(); } catch (e) {}
                  navigate('/dashboard', { replace: true });
                }}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm"
              >
                <Home className="w-4 h-4" />
                {t('quiz.goHome')}
              </button>
              {isFromAssignment && (
                <button
                  onClick={() => {
                    try { if (assignmentCtx && assignmentCtx.release) assignmentCtx.release(); } catch (e) {}
                    if (isExamMode) {
                      navigate(`/student/exams`);
                    } else {
                      navigate(`/my-assignments?refresh=${Date.now()}`);
                    }
                  }}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  {isExamMode ? 'Về trang kiểm tra' : t('quiz.backToAssignments')}
                </button>
              )}
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes confetti-rain {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
              }
              @keyframes firework {
                0% { transform: scale(0); opacity: 1; }
                50% { transform: scale(2); opacity: 0.8; }
                100% { transform: scale(3); opacity: 0; }
              }
              @keyframes twinkle {
                0%, 100% { opacity: 0.3; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.2); }
              }
              .animate-confetti-rain {
                animation: confetti-rain 4s linear infinite;
              }
              .animate-firework {
                animation: firework 1s ease-out forwards;
              }
              .animate-twinkle {
                animation: twinkle 2s ease-in-out infinite;
              }
            `}} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const quizInfo = quizTypes.find(t => t.id === quizType);

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] mix-blend-multiply animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-cyan-400/20 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-sky-400/20 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000"></div>
      </div>

      {!assignmentCtx?.isLocked && <Header />}
      <div className="max-w-5xl mx-auto px-4 pt-7 pb-4 relative z-10">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-2 bg-white/60 backdrop-blur-xl p-3 px-5 rounded-2xl shadow-lg shadow-blue-200/20 border border-white/60">
          {!isFromAssignment ? (
            <button
              onClick={resetQuiz}
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-all group text-sm"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>{t('quiz.exit')}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowExitModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg shadow transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              {isExamMode ? 'Thoát bài kiểm tra' : 'Thoát bài tập'}
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className={`p-2 ${quizInfo.iconBg} rounded-xl shadow-inner border border-blue-100/50`}>
              <div className="text-blue-600">{quizInfo.icon}</div>
            </div>
            <h1 className="text-base font-bold text-slate-800">{t(quizInfo.titleKey)}</h1>
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-2 rounded-full shadow-lg shadow-amber-500/30 border border-amber-300/50">
              <Trophy className="w-4 h-4 text-white" />
              <span className="font-bold text-white text-sm">{score}/{questions.length}</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full blur-md opacity-50 -z-10"></div>
          </div>
        </div>

        {/* Dòng thông báo phiên bị khóa — chỉ hiện khi đang trong luồng bài tập/kiểm tra */}
        {isFromAssignment && (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>
              Phiên {isExamMode ? 'kiểm tra' : 'bài tập'} đang bị khóa — bạn không thể thoát ra ngoài. Hoàn thành bài hoặc bấm <strong>{isExamMode ? 'Thoát bài kiểm tra' : 'Thoát bài tập'}</strong> để kết thúc (sẽ mất 1 lượt làm).
            </span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="bg-white/60 backdrop-blur-xl rounded-xl shadow-lg border border-white/60 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {t('quiz.question')} {currentIndex + 1} / {questions.length}
            </span>
            <div className="flex items-center gap-3">
              {/* Countdown Timer — chỉ hiện trong chế độ bài kiểm tra */}
              {isAssignmentMode && (
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-bold text-sm transition-all ${getTimerBg(timeLeft)}`}>
                  <Clock className={`w-4 h-4 ${getTimerColor(timeLeft)}`} />
                  <span className={getTimerColor(timeLeft)}>{timeLeft}s</span>
                </div>
              )}
              <span className="text-xs font-semibold text-blue-600">
                {Math.round(((currentIndex + 1) / questions.length) * 100)}%
              </span>
            </div>
          </div>
          <div className="h-2.5 bg-slate-200/50 rounded-full overflow-hidden shadow-inner relative">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
            </div>
          </div>
          {/* Timer bar — chỉ hiện trong chế độ bài kiểm tra */}
          {isAssignmentMode && (
            <div className="mt-2 h-1.5 bg-slate-200/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  timeLeft <= 3 ? 'bg-red-500' : timeLeft <= 10 ? 'bg-orange-400' : 'bg-blue-400'
                }`}
                style={{ width: `${(timeLeft / (QUIZ_TIME_LIMITS[quizType] ?? 60)) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Question Card */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-200/30 border border-white/60 overflow-hidden relative">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400"></div>
          {/* Flash "Hết giờ" overlay */}
          {timeExpired && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-red-500/20 backdrop-blur-sm rounded-2xl animate-pulse">
              <div className="bg-red-500 text-white px-6 py-3 rounded-2xl font-black text-xl shadow-2xl flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Hết giờ!
              </div>
            </div>
          )}
          <div className="p-5 relative z-10">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">{t(currentQuestion.questionKey)}</h2>
            </div>

            {/* Two Column Layout */}
            <div className="flex flex-col lg:flex-row gap-5">
              {/* Left Column: ASL Image */}
              <div className="lg:w-1/2">
                <div className="bg-gradient-to-br from-slate-50 via-blue-50/80 to-sky-50/60 rounded-2xl p-4 border border-blue-100/40 shadow-inner relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-blue-300/20 to-cyan-300/20 rounded-full blur-2xl animate-pulse"></div>

                  {/* Letter Quiz */}
                  {quizType === 'letter' && (
                    <div className="relative flex justify-center items-center">
                      <div className="group">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg shadow-blue-200/40 border border-blue-100/50 hover:shadow-xl hover:shadow-blue-300/50 transition-all duration-300">
                          <img
                            src={currentQuestion.aslImage || currentQuestion.image}
                            alt="ASL Sign"
                            className="w-48 h-48 object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
                          />
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 bg-gradient-to-br from-blue-500 to-sky-500 text-white w-10 h-10 flex items-center justify-center rounded-full text-xl font-bold shadow-lg shadow-blue-500/50 ring-4 ring-white animate-bounce-slow">
                        ?
                      </div>
                    </div>
                  )}

                  {/* Vocabulary Quiz */}
                  {quizType === 'vocabulary' && (
                    <div className="relative">
                      <div className="flex justify-center gap-2 flex-wrap">
                        {currentQuestion.aslSpelling.map((char, idx) => (
                          char === ' ' ? (
                            <div key={idx} className="w-9"></div>
                          ) : (
                            <div key={idx} className="relative group">
                              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-md shadow-blue-200/30 border border-blue-100/50 hover:shadow-lg hover:-translate-y-0.5 hover:scale-105 transition-all duration-200 cursor-pointer">
                                <img
                                  src={getASLLetterImage(char)}
                                  alt="ASL sign"
                                  className="w-14 h-14 object-contain"
                                />
                              </div>
                              {showHint && (
                                <span className="absolute -bottom-1.5 -right-1.5 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-lg shadow-emerald-500/50 ring-2 ring-white animate-bounce">
                                  {char}
                                </span>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                      <div className="text-center mt-3">
                        <span className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-blue-700 shadow-sm border border-blue-100/50">
                          <ImageIcon className="w-3.5 h-3.5" />
                          {t('quiz.aslSignForWord')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Sentence Quiz */}
                  {quizType === 'sentence' && (
                    <div className="relative">
                      <div className="flex justify-center gap-1.5 flex-wrap">
                        {currentQuestion.aslSpelling.map((char, idx) => (
                          char === ' ' ? (
                            <div key={idx} className="w-5"></div>
                          ) : (
                            <div key={idx} className="relative group">
                              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-1.5 shadow-md shadow-blue-200/30 border border-blue-100/50 hover:shadow-lg hover:-translate-y-0.5 hover:scale-105 transition-all duration-200 cursor-pointer">
                                <img
                                  src={getASLLetterImage(char)}
                                  alt="ASL sign"
                                  className="w-12 h-12 object-contain"
                                />
                              </div>
                              {showHint && (
                                <span className="absolute -bottom-0.5 -right-0.5 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg ring-2 ring-white">
                                  {char}
                                </span>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                      <div className="text-center mt-3">
                        <span className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-blue-700 shadow-sm border border-blue-100/50">
                          <ImageIcon className="w-3.5 h-3.5" />
                          {t('quiz.aslSignForSentence')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Hint Button */}
                  {!showResult && !isFromAssignment && (
                    <div className="mt-3 flex justify-center">
                      <button
                        onClick={handleShowHint}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                          showHint
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/50 hover:-translate-y-0.5'
                            : 'bg-white/80 backdrop-blur-sm text-blue-600 border border-blue-200/50 shadow-sm hover:bg-white hover:shadow-md hover:-translate-y-0.5'
                        }`}
                      >
                        {showHint ? <EyeOff className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
                        {showHint ? t('quiz.turnOffHint') : t('quiz.turnOnHint')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Answer Options */}
              <div className="lg:w-1/2 flex flex-col">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 content-start">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrectOption = option === currentQuestion.correctAnswer;

                    let buttonClass = 'bg-white/80 backdrop-blur-sm border-2 border-slate-200/60 hover:border-blue-400 hover:bg-blue-50/60 hover:shadow-lg hover:shadow-blue-200/30 hover:-translate-y-0.5 transition-all duration-200';
                    let iconClass = 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600';

                    if (showResult) {
                      if (isCorrectOption) {
                        buttonClass = 'bg-gradient-to-br from-emerald-50 to-green-100/80 border-2 border-emerald-400/60 shadow-lg shadow-emerald-200/40';
                        iconClass = 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-md';
                      } else if (isSelected && !isCorrectOption) {
                        buttonClass = 'bg-gradient-to-br from-red-50 to-rose-100/80 border-2 border-red-300/60';
                        iconClass = 'bg-gradient-to-br from-red-400 to-rose-500 text-white shadow-md';
                      } else {
                        buttonClass = 'bg-slate-50/60 border-2 border-slate-200/40 opacity-50 grayscale';
                        iconClass = 'bg-slate-200 text-slate-400';
                      }
                    }

                    const letters = ['A', 'B', 'C', 'D'];

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(option)}
                        disabled={showResult}
                        className={`p-4 rounded-xl font-semibold text-left transition-all duration-200 flex items-center gap-3 group ${buttonClass}`}
                      >
                        <span className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-200 ${iconClass} group-hover:scale-110`}>
                          {letters[idx]}
                        </span>
                        <span className="flex-1 text-slate-700 group-hover:text-slate-900 text-sm leading-tight">{option}</span>
                        {showResult && isCorrectOption && (
                          <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                        )}
                        {showResult && isSelected && !isCorrectOption && (
                          <X className="w-5 h-5 text-red-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Result Message */}
                {showResult && (
                  <div className={`mt-4 p-4 rounded-xl transition-all duration-300 animate-fade-in ${
                    isCorrect
                      ? 'bg-gradient-to-r from-emerald-50/80 to-green-100/60 border border-emerald-200/50 shadow-lg shadow-emerald-200/30'
                      : 'bg-gradient-to-r from-red-50/80 to-rose-100/60 border border-red-200/50 shadow-lg shadow-red-200/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl shrink-0 ${
                        isCorrect ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/40' : 'bg-gradient-to-br from-red-400 to-rose-500 shadow-lg shadow-red-500/40'
                      }`}>
                        {isCorrect ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <X className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                          {isCorrect ? t('quiz.answerCorrect') : t('quiz.answerWrong')}
                        </p>
                        <p className={`text-xs ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                          {t('quiz.correctAnswerIs')}: <span className="font-bold">{currentQuestion.correctAnswer}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Next Button */}
        {showResult && (
          <button
            onClick={nextQuestion}
            className="w-full py-4 mt-4 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 text-white rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            <span>{currentIndex < questions.length - 1 ? t('quiz.nextQuestion') : t('quiz.seeResult')}</span>
            {currentIndex < questions.length - 1 ? (
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            ) : (
              <Award className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {/* Exit Assignment Modal - chỉ hiện khi đang trong luồng bài tập */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                {isExamMode ? 'Xác nhận thoát bài kiểm tra' : 'Xác nhận thoát bài tập'}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              {t('common.exitAssignmentWarning') || 'Bạn có chắc muốn thoát? Kết quả hiện tại sẽ được lưu và bạn sẽ mất 1 lượt làm bài.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                disabled={isExiting}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                {t('common.cancel') || 'Hủy'}
              </button>
              <button
                onClick={handleForceExit}
                disabled={isExiting}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2 disabled:opacity-50"
              >
                {isExiting && (
                  <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                )}
                Thoát & Lưu kết quả
              </button>
            </div>
          </div>
        </div>
      )}
      <LeaveConfirmModal
        open={showLeaveModal}
        onCancel={() => { setShowLeaveModal(false); pendingActionRef.current = null; }}
        onConfirm={async () => {
          setShowLeaveModal(false);
          if (onAssignmentComplete) {
            try {
              const total = questions.length || 0;
              const correctCount = score;
              const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
              const timeSpent = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
              const result = { total, correctCount, score: accuracy, accuracy, timeSpent, answers: answersLog };
              await onAssignmentComplete(result);
            } catch (e) { console.error('assignment submit failed', e); }
          }
          try { if (assignmentCtx && assignmentCtx.release) assignmentCtx.release(); } catch(e){}
          if (pendingActionRef.current) pendingActionRef.current();
          pendingActionRef.current = null;
        }}
      />
      {!assignmentCtx?.isLocked && <Footer />}
    </div>
  );
};

export default ASLQuiz;
