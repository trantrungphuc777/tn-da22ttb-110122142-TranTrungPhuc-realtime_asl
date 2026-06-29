/**
 * ExamComprehensivePage - Bài kiểm tra tổng hợp ASL (dùng cho chức năng Bài Kiểm Tra)
 * Nhận examConfig từ giảng viên, submit kết quả về server qua onComplete callback
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Camera, Clock, Trophy, Target, Check, X,
  AlertTriangle, RefreshCw, Brain, Play,
  CheckCircle, XCircle, SkipForward, RotateCcw,
  Home, TrendingUp, BarChart3, Star, Medal
} from 'lucide-react';
import {
  generateComprehensiveTest,
  calculateSignScore,
  calculateQuizScore,
  calculateFinalResult,
  QUESTION_TYPES,
  SCORE_CONFIG,
  getLetterImage,
  getGrade
} from '../data/comprehensiveTestData';

const WS_URL = 'http://127.0.0.1:5001/predict';

const ExamComprehensivePage = ({ examConfig, examMode, examTopic, examId, onComplete, canSubmit, bestScore, attemptCount, maxAttempts, remainingAttempts }) => {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

  // ── Exit modal state (tính năng 2, 3, 4) ──
  const [showExitModal, setShowExitModal] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const examSubmittedRef = useRef(false);
  // Camera refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);
  const manualStopRef = useRef(false);
  const isProcessingRef = useRef(false);

  // Detection refs
  const stabilityCountRef = useRef(0);
  const lastDetectedRef = useRef('');
  const detectedSignsRef = useRef([]);
  const currentChainIndexRef = useRef(0);
  const showResultRef = useRef(false);
  const currentQuestionRef = useRef(null);
  const testStartedRef = useRef(false);
  const testCompletedRef = useRef(false);
  const timeSpentRef = useRef(0);
  const answersRef = useRef([]);
  const currentIndexRef = useRef(0);
  const questionsRef = useRef([]);
  const isAdvancingRef = useRef(false);

  // Camera state
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [skeletonImage, setSkeletonImage] = useState(null);
  const [isHandPresent, setIsHandPresent] = useState(false);
  const [currentLetter, setCurrentLetter] = useState('-');
  const [cameraError, setCameraError] = useState('');

  // Test state
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [currentChainIndexState, setCurrentChainIndexState] = useState(0);
  const [detectedSignsState, setDetectedSignsState] = useState([]);
  const [realtimeFeedback, setRealtimeFeedback] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => { testStartedRef.current = testStarted; }, [testStarted]);
  useEffect(() => { testCompletedRef.current = testCompleted; }, [testCompleted]);

  const cleanupCamera = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    return () => {
      manualStopRef.current = true;
      cleanupCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cleanupCamera]);

  // ── Tính năng 5: beforeunload — chặn đóng tab / F5 khi đang làm bài ──
  useEffect(() => {
    if (!testStarted || testCompleted) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = t('common.exitAssignmentWarning') || 'Bạn đang làm bài kiểm tra. Rời trang sẽ tự động nộp kết quả.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [testStarted, testCompleted]);

  // ── Tính năng 6: popstate — chặn Back button khi đang làm bài ──
  useEffect(() => {
    if (!testStarted || testCompleted) return;
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      setShowExitModal(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [testStarted, testCompleted]);

  // ── Tính năng 4: handleForceExit — submit kết quả hiện tại rồi thoát ──
  const handleForceExit = async () => {
    if (isExiting) return;
    setIsExiting(true);
    try {
      if (!examSubmittedRef.current) {
        // Tính kết quả từ những gì đã làm được
        const partialResult = calculateFinalResult(answersRef.current);
        if (onComplete) {
          examSubmittedRef.current = true;
          await onComplete({
            answers: answersRef.current,
            score: partialResult.percentage,
            accuracy: partialResult.percentage,
            timeSpent: answersRef.current.reduce((s, a) => s + (a.result?.timeSpent || 0), 0),
            total: partialResult.totalQuestions,
            correctCount: partialResult.correctAnswers,
            finalResult: partialResult
          });
        }
      }
    } catch (e) {
      console.error('Force exit exam error:', e);
    } finally {
      setIsExiting(false);
      setShowExitModal(false);
      // Tắt camera
      try {
        manualStopRef.current = true;
        cleanupCamera();
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      } catch (e) {}
      navigate('/student/exams');
    }
  };

  const startCamera = async () => {
    if (isStreaming || isCameraLoading) return;
    setIsCameraLoading(true);
    setCameraError('');
    try {
      manualStopRef.current = false;
      isProcessingRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsStreaming(true);
      setIsCameraLoading(false);
      intervalRef.current = setInterval(async () => {
        if (isProcessingRef.current || manualStopRef.current) return;
        if (videoRef.current && canvasRef.current) {
          isProcessingRef.current = true;
          const ctx = canvasRef.current.getContext('2d');
          ctx.drawImage(videoRef.current, 0, 0, 640, 480);
          const base64 = canvasRef.current.toDataURL('image/jpeg', 0.7);
          try {
            const q = currentQuestionRef.current;
            const isSignQ = q && q.type !== QUESTION_TYPES.QUIZ_IMAGE;
            const expectedLetter = isSignQ ? (q.aslSpelling ? q.aslSpelling[currentChainIndexRef.current] : (q.target ? q.target[currentChainIndexRef.current] : '')) : '';
            const target = isSignQ ? (q.target || q.displayText || '') : '';
            const response = await fetch(WS_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64, target_letter: expectedLetter || target, expected_letter: expectedLetter, target })
            });
            if (response.ok) {
              const data = await response.json();
              handlePrediction(data);
            }
          } catch (e) { /* ignore */ } finally { isProcessingRef.current = false; }
        }
      }, 100);
    } catch (err) {
      setCameraError(t('comprehensiveTest.cameraError'));
      setIsStreaming(false);
      setIsCameraLoading(false);
    }
  };

  const stopCamera = () => {
    manualStopRef.current = true;
    setIsStreaming(false);
    cleanupCamera();
  };

  const handlePrediction = useCallback((data) => {
    try {
      const rawLetter = data.current_letter || '';
      const detectedLetter = typeof rawLetter === 'string' ? rawLetter.trim().toUpperCase() : String(rawLetter).trim().toUpperCase();
      const hasHand = data.is_hand_present === true;
      const topPredictions = data.top_predictions || [];

      setIsHandPresent(hasHand);
      setSkeletonImage(data.skeleton_image || null);

      if (!hasHand) {
        setCurrentLetter('-');
        setRealtimeFeedback(null);
        stabilityCountRef.current = 0;
        lastDetectedRef.current = '';
        return;
      }
      setCurrentLetter(detectedLetter || '-');

      const question = currentQuestionRef.current;
      if (showResultRef.current || !testStartedRef.current || testCompletedRef.current || !question) return;

      const signTypes = [QUESTION_TYPES.LETTER, QUESTION_TYPES.SHORT_WORD, QUESTION_TYPES.LONG_WORD, QUESTION_TYPES.COMPLEX, QUESTION_TYPES.CHAIN];
      if (signTypes.includes(question.type)) {
        const expectedSeq = question.aslSpelling
          ? question.aslSpelling.map(l => l?.toString().trim().toUpperCase())
          : (question.target ? question.target.split('').map(l => l?.toString().trim().toUpperCase()) : []);
        const expectedLetter = expectedSeq[currentChainIndexRef.current] || '';
        const stableThreshold = 8;

        if (currentChainIndexRef.current >= expectedSeq.length) {
          setRealtimeFeedback({ type: 'completed', message: t('comprehensiveTest.completedCurrentChar'), isCorrect: true });
          return;
        }

        if (detectedLetter !== lastDetectedRef.current) {
          stabilityCountRef.current = 1;
        } else {
          stabilityCountRef.current += 1;
        }

        const topPred = topPredictions[0] || null;
        const topConf = topPred?.confidence || 0;
        const topLetter = (topPred?.label || topPred?.letter || '').toString().trim().toUpperCase();
        const immediateAccept = topConf >= 0.75 && topLetter === expectedLetter;

        if (immediateAccept || stabilityCountRef.current >= stableThreshold) {
          const isCorrect = detectedLetter === expectedLetter;
          detectedSignsRef.current = [...detectedSignsRef.current, { letter: detectedLetter, correct: isCorrect }];
          setDetectedSignsState(detectedSignsRef.current.slice());
          currentChainIndexRef.current += 1;
          setCurrentChainIndexState(currentChainIndexRef.current);
          stabilityCountRef.current = 0;
          lastDetectedRef.current = '';
          setRealtimeFeedback({
            type: isCorrect ? 'success' : 'incorrect',
            detectedLetter, targetLetter: expectedSeq[currentChainIndexRef.current] || '',
            message: isCorrect
              ? `${t('comprehensiveTest.detectedLetter', { letter: detectedLetter })} ${t('comprehensiveTest.continueNextSign')}`
              : `${t('comprehensiveTest.wrongLetter', { letter: detectedLetter })} ${t('comprehensiveTest.moveToNextChar')}`,
            isCorrect, topPredictions, stabilityCount: 0
          });
        } else {
          setRealtimeFeedback({
            type: 'correcting', detectedLetter, targetLetter: expectedLetter,
            message: t('comprehensiveTest.holdToConfirm', { letter: detectedLetter }),
            progress: Math.min(100, (stabilityCountRef.current / stableThreshold) * 100),
            isCorrect: detectedLetter === expectedLetter, topPredictions,
            stabilityCount: stabilityCountRef.current
          });
        }
      }
      lastDetectedRef.current = detectedLetter;
    } catch (err) { console.error('handlePrediction error:', err); }
  }, []);

  const recordAnswer = (question, result) => {
    const entry = { question, result, timeSpent: timeSpentRef.current };
    const qid = question?.id ?? null;
    if (qid !== null) {
      const idx = answersRef.current.findIndex(a => a.question?.id === qid);
      if (idx !== -1) { answersRef.current[idx] = entry; }
      else { answersRef.current = [...answersRef.current, entry]; }
    } else {
      answersRef.current = [...answersRef.current, entry];
    }
    setAnswers(answersRef.current.slice());
  };

  const finalizeSignQuestion = (question) => {
    const result = calculateSignScore(question, detectedSignsRef.current, timeSpentRef.current);
    setCurrentResult(result);
    recordAnswer(question, result);
    return result;
  };

  const handleQuizAnswer = useCallback((answer) => {
    const question = currentQuestionRef.current;
    if (!question || question.type !== QUESTION_TYPES.QUIZ_IMAGE) return;
    setSelectedAnswer(answer);
    setRealtimeFeedback({ type: 'selected', message: `${t('comprehensiveTest.selected')} "${answer}". ${t('comprehensiveTest.clickNextContinue')}`, selectedAnswer: answer });
  }, []);

  const startTimer = (duration) => {
    setTimeLeft(duration);
    setTimeSpent(0);
    timeSpentRef.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          const question = currentQuestionRef.current;
          if (question) {
            if (question.type === QUESTION_TYPES.QUIZ_IMAGE) {
              const result = calculateQuizScore(question, null, timeSpentRef.current);
              setCurrentResult(result); setShowResult(true); showResultRef.current = true;
              recordAnswer(question, result);
            } else {
              const result = finalizeSignQuestion(question);
              setCurrentResult(result); setShowResult(true); showResultRef.current = true;
            }
            setTimeout(() => { if (showResultRef.current) nextQuestion(); }, 800);
          }
          return 0;
        }
        return prev - 1;
      });
      setTimeSpent(prev => { const v = prev + 1; timeSpentRef.current = v; return v; });
    }, 1000);
  };

  const nextQuestion = useCallback(() => {
    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;
    const question = currentQuestionRef.current;
    const idx = currentIndexRef.current;
    const allQuestions = questionsRef.current;

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    if (question && !showResultRef.current) {
      if (question.type !== QUESTION_TYPES.QUIZ_IMAGE) {
        finalizeSignQuestion(question);
      } else {
        const result = calculateQuizScore(question, selectedAnswer, timeSpentRef.current);
        setCurrentResult(result);
        recordAnswer(question, result);
      }
      setShowResult(false); showResultRef.current = false;
    }

    if (idx < allQuestions.length - 1) {
      const nextIdx = idx + 1;
      currentIndexRef.current = nextIdx;
      setCurrentIndex(nextIdx);
      setShowResult(false); setCurrentResult(null); setSelectedAnswer(null);
      setRealtimeFeedback(null); setCurrentChainIndexState(0);
      stabilityCountRef.current = 0; lastDetectedRef.current = '';
      detectedSignsRef.current = []; currentChainIndexRef.current = 0;
      showResultRef.current = false; timeSpentRef.current = 0;
      setDetectedSignsState([]);
      setTimeout(() => {
        isAdvancingRef.current = false;
        const nextQ = allQuestions[nextIdx];
        if (nextQ) startTimer(nextQ.timeLimit);
      }, 500);
    } else {
      isAdvancingRef.current = false;
      finishTest();
    }
  }, [selectedAnswer]);

  const finishTest = () => {
    stopCamera();
    const result = calculateFinalResult(answersRef.current);
    setFinalResult(result);
    setTestCompleted(true); testCompletedRef.current = true;
    setTestStarted(false); testStartedRef.current = false;
    // Gọi callback để StudentExamDetail submit lên server
    if (onComplete) {
      onComplete({
        answers: answersRef.current,
        score: result.percentage,
        accuracy: result.percentage,
        timeSpent: answersRef.current.reduce((s, a) => s + (a.result?.timeSpent || 0), 0),
        total: result.totalQuestions,
        correctCount: result.correctAnswers,
        finalResult: result
      });
    }
  };

  const startTest = () => {
    stabilityCountRef.current = 0; lastDetectedRef.current = '';
    detectedSignsRef.current = []; currentChainIndexRef.current = 0;
    showResultRef.current = false; timeSpentRef.current = 0;
    isAdvancingRef.current = false;

    // Sinh câu hỏi theo examConfig hoặc mặc định 20 câu
    const config = examConfig && typeof examConfig === 'object' ? examConfig : 20;
    const generated = generateComprehensiveTest(config, { mode: examMode || 'random', topic: examTopic || null });
    setQuestions(generated); questionsRef.current = generated;
    setCurrentIndex(0); currentIndexRef.current = 0;
    answersRef.current = []; setAnswers([]);
    setCurrentChainIndexState(0); setDetectedSignsState([]);
    setTestStarted(true); testStartedRef.current = true;
    setTestCompleted(false); testCompletedRef.current = false;
    setFinalResult(null); setShowResult(false); setCurrentResult(null);
    setSelectedAnswer(null); setRealtimeFeedback(null);
    setTimeout(() => startCamera(), 500);
  };

  const retryQuestion = () => {
    setRealtimeFeedback(null);
    stabilityCountRef.current = 0; lastDetectedRef.current = '';
    currentChainIndexRef.current = 0; setCurrentChainIndexState(0);
    detectedSignsRef.current = []; setDetectedSignsState([]);
  };

  const handleReDetectAt = (index) => {
    detectedSignsRef.current = detectedSignsRef.current.slice(0, index);
    setDetectedSignsState(detectedSignsRef.current.slice());
    currentChainIndexRef.current = index; setCurrentChainIndexState(index);
    stabilityCountRef.current = 0; lastDetectedRef.current = '';
    setRealtimeFeedback({ type: 're-detect', message: t('comprehensiveTest.redoSign'), targetIndex: index });
  };

  // Sync refs
  const currentQuestion = questions[currentIndex];
  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
    currentIndexRef.current = currentIndex;
    showResultRef.current = false;
    setCurrentChainIndexState(0);
  }, [currentQuestion, currentIndex]);

  // Start timer khi câu hỏi thay đổi
  useEffect(() => {
    if (testStarted && questions.length > 0 && !testCompleted && currentQuestion) {
      const t = setTimeout(() => { if (!showResultRef.current) startTimer(currentQuestion.timeLimit); }, 300);
      return () => clearTimeout(t);
    }
  }, [testStarted, currentQuestion, questions.length, testCompleted]);

  // Camera on/off theo loại câu hỏi
  useEffect(() => {
    if (!testStarted || testCompleted || !currentQuestion) return;
    if (currentQuestion.type === QUESTION_TYPES.QUIZ_IMAGE) {
      if (isStreaming) stopCamera();
    } else {
      if (!isStreaming && !isCameraLoading) startCamera();
    }
  }, [currentQuestion, isStreaming, isCameraLoading, testStarted, testCompleted]);

  const formatTime = (s) => { const m = Math.floor(s / 60); const sec = s % 60; return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${s}s`; };
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const isQuizImage = currentQuestion?.type === QUESTION_TYPES.QUIZ_IMAGE;
  const tileLetters = currentQuestion?.aslSpelling?.length ? currentQuestion.aslSpelling : currentQuestion?.target?.split('') || [];
  const promptPhrase = currentQuestion?.type === QUESTION_TYPES.CHAIN
    ? (currentQuestion?.aslSpelling?.join(' → ') || '')
    : currentQuestion?.displayText;

  // ===== RENDER: MÀN HÌNH BẮT ĐẦU =====
  if (!testStarted && !testCompleted) {
    const totalQ = examConfig && typeof examConfig === 'object'
      ? Object.values(examConfig).reduce((s, v) => s + (parseInt(v) || 0), 0)
      : 20;
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-200/30 p-6 border border-blue-200/40">
          <div className="text-center mb-6">
            <div className="inline-block p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-3">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-blue-950 mb-1">{t('comprehensiveTest.testTitle')}</h2>
            <p className="text-sm text-blue-700/70">{t('comprehensiveTest.testDesc')}</p>
          </div>

          {/* Thông tin lượt làm */}
          {maxAttempts !== undefined && (
            <div className="bg-blue-50 rounded-xl p-3 mb-4 border border-blue-100 text-sm text-blue-700 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>
                {t('comprehensiveTest.attemptsLabel')}: <strong>{attemptCount || 0}/{maxAttempts}</strong> —
                {t('comprehensiveTest.remainingLabel')}: <strong>{remainingAttempts ?? maxAttempts}</strong> {t('comprehensiveTest.leftLabel')}
                {bestScore !== null && bestScore !== undefined && (
                  <> — {t('comprehensiveTest.bestScoreLabel')}: <strong className="text-emerald-600">{bestScore}%</strong></>
                )}
              </span>
            </div>
          )}

          {/* Cấu hình câu hỏi */}
          {examConfig && typeof examConfig === 'object' && (
            <div className="mb-4">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm">{t('comprehensiveTest.examStructure', { total: totalQ })}</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {examConfig.letterCount > 0 && <div className="bg-blue-50 rounded-lg p-2 border border-blue-100"><span className="font-medium text-blue-700">{t('comprehensiveTest.singleLetter')}:</span> {examConfig.letterCount} {t('comprehensiveTest.questionsUnit')}</div>}
                {examConfig.shortWordCount > 0 && <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100"><span className="font-medium text-emerald-700">{t('comprehensiveTest.shortWord')}:</span> {examConfig.shortWordCount} {t('comprehensiveTest.questionsUnit')}</div>}
                {examConfig.longWordCount > 0 && <div className="bg-amber-50 rounded-lg p-2 border border-amber-100"><span className="font-medium text-amber-700">{t('comprehensiveTest.longWord')}:</span> {examConfig.longWordCount} {t('comprehensiveTest.questionsUnit')}</div>}
                {examConfig.complexCount > 0 && <div className="bg-sky-50 rounded-lg p-2 border border-sky-100"><span className="font-medium text-sky-700">{t('comprehensiveTest.complexSentence')}:</span> {examConfig.complexCount} {t('comprehensiveTest.questionsUnit')}</div>}
                {examConfig.quizCount > 0 && <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-100"><span className="font-medium text-indigo-700">{t('comprehensiveTest.vocabQuiz')}:</span> {examConfig.quizCount} {t('comprehensiveTest.questionsUnit')}</div>}
                {examConfig.chainCount > 0 && <div className="bg-cyan-50 rounded-lg p-2 border border-cyan-100"><span className="font-medium text-cyan-700">{t('comprehensiveTest.signChain')}:</span> {examConfig.chainCount} {t('comprehensiveTest.questionsUnit')}</div>}
              </div>
            </div>
          )}

          {/* Chế độ câu hỏi */}
          {examMode && examMode !== 'random' && (
            <div className="mb-4 bg-purple-50 rounded-xl p-3 border border-purple-100 text-xs text-purple-700 flex items-center gap-2">
              <span className="text-base">🏷️</span>
              <span>
                <strong>{t('comprehensiveTest.modeLabel')}:</strong>{' '}
                {examMode === 'topic' ? t('comprehensiveTest.modeTopic') : t('comprehensiveTest.modeRandom')}
                {examTopic && <> — <strong>{t('comprehensiveTest.topicLabel')}:</strong> {examTopic}</>}
              </span>
            </div>
          )}

          <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-200 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700">
                <div className="font-semibold text-amber-800">{t('comprehensiveTest.warningTitle')}</div>
                <ul className="mt-0.5 space-y-0.5">
                  <li>• {t('comprehensiveTest.warningCamera')}</li>
                  <li>• {t('comprehensiveTest.warningTime')}</li>
                  <li>• {t('comprehensiveTest.warningBonus')}</li>
                </ul>
              </div>
            </div>
          </div>

          {canSubmit !== false ? (
            <button onClick={startTest} className="w-full py-3 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 neon-btn">
              <Play className="w-5 h-5" /> {t('comprehensiveTest.startTest')}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-bold text-sm text-center">
                {t('comprehensiveTest.noAttemptsLeft')}
              </div>
              <button
                onClick={() => navigate('/student/exams')}
                className="w-full py-3 bg-white border-2 border-blue-200 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-4 h-4" /> {t('comprehensiveTest.backToExams')}
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 bg-white border-2 border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" /> {t('comprehensiveTest.backToDashboard')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== RENDER: KẾT QUẢ =====
  if (testCompleted && finalResult) {
    const isPassing = finalResult.percentage >= 60;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 overflow-hidden relative flex flex-col">
        {/* Nền animated — copy từ Layout */}
        <div className="fixed inset-0 pointer-events-none z-0 particle-grid hex-grid data-stream" />
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[5%] left-[5%] w-[600px] h-[600px] bg-blue-400/25 rounded-full blur-[150px] animate-float-slow" />
          <div className="absolute bottom-[5%] right-[5%] w-[700px] h-[700px] bg-sky-400/20 rounded-full blur-[180px] animate-float-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[35%] left-[45%] w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-[130px] animate-float" style={{ animationDelay: '1s' }} />
        </div>

        {/* Confetti */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-10">
          {[...Array(50)].map((_, i) => (
            <div
              key={`confetti-${i}`}
              className="absolute animate-confetti-rain"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${20 + Math.random() * 80}px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2.5 + Math.random() * 2}s`,
                backgroundColor: ['#FFD700','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4'][Math.floor(Math.random() * 5)],
                width: `${8 + Math.random() * 8}px`,
                height: `${8 + Math.random() * 8}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '0'
              }}
            />
          ))}
        </div>

        {/* Layout compact — vừa màn hình, không cần scroll */}
        <div className="min-h-screen flex items-center justify-center px-4 py-6 relative z-20">
          <div className="w-full max-w-2xl">

            {/* Grade header — nhỏ gọn */}
            <div className="text-center mb-4">
              <div className={`text-6xl mb-2 ${finalResult.percentage >= 80 ? 'animate-bounce' : ''}`}>
                {finalResult.gradeEmoji}
              </div>
              <h2 className={`text-3xl font-black ${
                finalResult.percentage >= 90 ? 'text-amber-600' :
                finalResult.percentage >= 70 ? 'text-emerald-600' : 'text-blue-600'
              }`}>
                {finalResult.grade}
              </h2>
              <p className="text-blue-700/70 text-sm mt-1">{t('comprehensiveTest.testResults')}</p>
            </div>

            {/* Main card — trong suốt để thấy nền animated */}
            <div className="bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 border border-blue-200/50 relative overflow-hidden">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 rounded-3xl blur-sm opacity-10 pointer-events-none" />
              <div className="relative">

                {/* Score + passing badge — một hàng */}
                <div className="flex items-center justify-center gap-4 mb-5">
                  <div className="text-center">
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                      {finalResult.percentage}%
                    </div>
                    <div className="text-blue-600 font-medium text-sm">{t('comprehensiveTest.accuracy')}</div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
                    isPassing ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {isPassing ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {isPassing ? t('comprehensiveTest.passed') : t('comprehensiveTest.notPassed')}
                  </div>
                </div>

                {/* Stats 4 ô */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-200">
                    <div className="text-2xl font-black text-emerald-600">{finalResult.correctAnswers}</div>
                    <div className="text-[10px] text-emerald-700 font-medium mt-0.5">{t('comprehensiveTest.correctAnswers')}</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center border border-red-200">
                    <div className="text-2xl font-black text-red-600">{finalResult.wrongAnswers}</div>
                    <div className="text-[10px] text-red-700 font-medium mt-0.5">{t('comprehensiveTest.wrongAnswers')}</div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
                    <div className="text-2xl font-black text-blue-600">{finalResult.avgResponseTime}s</div>
                    <div className="text-[10px] text-blue-700 font-medium mt-0.5">{t('comprehensiveTest.avgTime')}</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-200">
                    <div className="text-2xl font-black text-amber-600">{finalResult.totalScore}/100</div>
                    <div className="text-[10px] text-amber-700 font-medium mt-0.5">{t('comprehensiveTest.totalScore')}</div>
                  </div>
                </div>

                {/* Thống kê chi tiết — compact 2 cột */}
                <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
                  <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                    <TrendingUp className="w-3.5 h-3.5" /> {t('comprehensiveTest.detailedStats')}
                  </h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-gray-500">{t('comprehensiveTest.totalQuestions')}:</span><span className="font-bold text-gray-800">{finalResult.totalQuestions}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">{t('comprehensiveTest.accuracy')}:</span><span className="font-bold text-gray-800">{finalResult.avgAccuracy}%</span></div>
                    {finalResult.totalChains > 0 && (
                      <div className="flex justify-between"><span className="text-gray-500">{t('comprehensiveTest.chainsCompleted')}:</span><span className="font-bold text-gray-800">{finalResult.chainsCompleted}/{finalResult.totalChains}</span></div>
                    )}
                    {bestScore !== null && bestScore !== undefined && (
                      <div className="flex justify-between col-span-2"><span className="text-gray-500">{t('comprehensiveTest.yourBestScore')}:</span><span className="font-bold text-emerald-600">{Math.max(bestScore, finalResult.percentage)}%</span></div>
                    )}
                  </div>
                </div>

                {/* Nút điều hướng */}
                <div className="flex flex-col gap-2">
                  {remainingAttempts > 0 && (
                    <button
                      onClick={() => {
                        setTestCompleted(false);
                        testCompletedRef.current = false;
                        setFinalResult(null);
                        setTestStarted(false);
                        testStartedRef.current = false;
                      }}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {t('comprehensiveTest.retakeTest')}
                      <span className="opacity-75 text-xs">({remainingAttempts} {t('comprehensiveTest.attemptsLeft')})</span>
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => navigate('/student/exams')}
                      className="py-3 bg-white text-blue-700 rounded-2xl font-bold border-2 border-blue-200 hover:bg-blue-50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <BarChart3 className="w-4 h-4" />
                      {t('comprehensiveTest.backToExams')}
                    </button>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="py-3 bg-white text-gray-700 rounded-2xl font-bold border-2 border-gray-200 hover:bg-gray-50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Home className="w-4 h-4" />
                      {t('comprehensiveTest.backToDashboard')}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes confetti-rain {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
          }
          .animate-confetti-rain { animation: confetti-rain 4s linear infinite; }
        `}} />
      </div>
    );
  }

  // ===== RENDER: MÀN HÌNH LÀM BÀI =====
  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-4 mb-2 border border-blue-200/40">
        {/* Nút Thoát đỏ */}
        <button
          onClick={() => setShowExitModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-300/50 transition-all shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Thoát bài kiểm tra
        </button>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
          <Trophy className="w-4 h-4" />
          {questions.length > 0 ? Math.round((answers.filter(a => a.result?.isCorrect).length / questions.length) * 100) : 0}/100
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="text-sm font-bold text-blue-700">{t('comprehensiveTest.question')} {currentIndex + 1}/{questions.length}</span>
            <span className="text-sm font-bold text-blue-700">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-blue-100 rounded-full overflow-hidden border border-blue-200">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold ${timeLeft <= 3 ? 'bg-red-500 text-white animate-pulse' : timeLeft <= 10 ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'}`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Dòng thông báo phiên bị khóa */}
      <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span>Phiên kiểm tra đang bị khóa — bạn không thể thoát ra ngoài. Hoàn thành bài hoặc bấm <strong>Thoát bài kiểm tra</strong> để kết thúc (sẽ mất 1 lượt làm).</span>
      </div>

      {/* Tính năng 3: Modal xác nhận thoát */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                {t('common.confirmExitAssignment') || 'Xác nhận thoát bài kiểm tra'}
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
                {t('common.exitAndSave') || 'Thoát & Lưu kết quả'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-4 ${isQuizImage ? 'xl:grid-cols-[1.8fr_0.8fr]' : 'xl:grid-cols-[1.25fr_1fr_0.8fr]'}`}>
        {/* Camera column */}
        {!isQuizImage && (
          <div className="space-y-4">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl p-5 border border-blue-200/40 min-h-[26rem] flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-black text-slate-900">{t('comprehensiveTest.signRecognition')}</h3>
                <span className="text-sm text-slate-500">{isStreaming ? t('comprehensiveTest.running') : t('comprehensiveTest.paused')}</span>
              </div>
              <div className="rounded-3xl overflow-hidden border border-blue-100 bg-slate-50 flex-1 mb-3">
                <div className="aspect-[4/3] relative">
                  <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isStreaming ? '' : 'hidden'}`} style={{ transform: 'scaleX(-1)' }} />
                  <canvas ref={canvasRef} width={640} height={480} className="hidden" aria-hidden="true" />
                  {!isStreaming && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                      <Camera className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={isStreaming ? stopCamera : startCamera} className={`rounded-2xl py-2.5 font-bold text-white text-sm transition ${isStreaming ? 'bg-gradient-to-r from-rose-500 to-red-500' : 'bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400'}`}>
                  {isStreaming ? t('comprehensiveTest.stopCamera') : t('comprehensiveTest.startCamera')}
                </button>
                <button onClick={retryQuestion} className="rounded-2xl py-2.5 font-bold bg-white border border-blue-200 text-blue-900 hover:bg-blue-50 text-sm transition">
                  {t('comprehensiveTest.redetect')}
                </button>
              </div>
            </div>
            <div className="bg-white/95 rounded-[2rem] shadow-xl p-4 border border-blue-200/40">
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">{t('comprehensiveTest.sign')}: {currentLetter}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isHandPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  {isHandPresent ? t('comprehensiveTest.handDetected') : t('comprehensiveTest.noHand')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Question column */}
        <div className="space-y-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl p-5 border border-blue-200/40">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-[0.35em] text-blue-500 font-bold">{isQuizImage ? t('comprehensiveTest.vocabQuiz') : t('comprehensiveTest.signRecognition')}</p>
              <span className="text-sm text-slate-500">{currentQuestion?.timeLimit}s</span>
            </div>

            {isQuizImage ? (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-blue-100 flex items-center justify-center min-h-[120px]">
                  {currentQuestion?.subType === 'letter' && currentQuestion.image && (
                    <img src={currentQuestion.image} alt={currentQuestion.displayText} className="max-h-40 object-contain rounded-xl shadow" />
                  )}
                  {(currentQuestion?.subType === 'vocabulary' || currentQuestion?.subType === 'sentence') && currentQuestion?.aslSpelling && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {currentQuestion.aslSpelling.map((ltr, i) => (
                        <div key={`${ltr}-${i}`} className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <img src={getLetterImage(ltr)} alt={ltr} className="w-10 h-10 object-cover rounded-md" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentQuestion.options.map((option, idx) => (
                    <button key={idx} onClick={() => handleQuizAnswer(option)} disabled={showResult}
                      className={`text-left rounded-2xl p-3 border transition ${selectedAnswer === option ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-blue-500 text-white font-black text-sm flex items-center justify-center">{String.fromCharCode(65 + idx)}</span>
                        <span className="font-semibold text-slate-900 text-sm">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="grid gap-2 mt-3">
                  <button onClick={nextQuestion} className="w-full py-2.5 rounded-xl bg-white border border-blue-200 text-blue-900 font-bold hover:bg-blue-50 text-sm">{t('comprehensiveTest.skipNewQuestion')}</button>
                  <button onClick={() => { setSelectedAnswer(null); setRealtimeFeedback(null); setShowResult(false); }} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white font-bold text-sm">{t('comprehensiveTest.redoQuestion')}</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200">
                  <p className="text-sm text-emerald-700 mb-1">{t('comprehensiveTest.performSign')}</p>
                  <div className="text-3xl font-black text-emerald-800">{promptPhrase}</div>
                  <div className="mt-3 p-3 rounded-2xl bg-white border border-emerald-100">
                    <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">{t('comprehensiveTest.detectingLetter')}</p>
                    <div className="text-4xl font-black text-slate-900">{currentLetter || '-'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {tileLetters.map((letter, idx) => {
                    const confirmed = detectedSignsState[idx] || null;
                    const isCurrent = idx === currentChainIndexState;
                    if (confirmed) {
                      return (
                        <div key={`${letter}-${idx}`} onClick={() => handleReDetectAt(idx)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base cursor-pointer relative ${confirmed.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                          {confirmed.correct ? tileLetters[idx] : confirmed.letter}
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white rounded-full text-[10px] flex items-center justify-center">↻</span>
                        </div>
                      );
                    }
                    if (isCurrent) return <div key={`${letter}-${idx}`} onClick={() => handleReDetectAt(idx)} className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base bg-yellow-400 text-white animate-pulse cursor-pointer">{currentLetter !== '-' ? currentLetter : '?'}</div>;
                    return <div key={`${letter}-${idx}`} onClick={() => handleReDetectAt(idx)} className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base bg-gray-200 text-gray-500 cursor-pointer">?</div>;
                  })}
                </div>
                <div className="grid gap-2">
                  <button onClick={retryQuestion} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white font-bold text-sm">{t('comprehensiveTest.redetectQuestion')}</button>
                  <button onClick={nextQuestion} className="w-full py-2.5 rounded-xl bg-white border border-blue-200 text-blue-900 font-bold hover:bg-blue-50 text-sm">{t('comprehensiveTest.newQuestion')}</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats column */}
        <div className="space-y-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-xl p-4 border border-blue-200/40">
            <h4 className="text-xs uppercase tracking-widest text-blue-500 font-bold mb-3">{t('comprehensiveTest.stats')}</h4>
            <div className="grid gap-2 text-sm text-slate-700">
              <div className="flex justify-between"><span>{t('comprehensiveTest.correct')}</span><span className="font-bold text-emerald-600">{answers.filter(a => a.result?.isCorrect).length}</span></div>
              <div className="flex justify-between"><span>{t('comprehensiveTest.wrong')}</span><span className="font-bold text-red-600">{answers.filter(a => !a.result?.isCorrect).length}</span></div>
              <div className="flex justify-between"><span>{t('comprehensiveTest.totalScore')}</span><span className="font-bold text-amber-600">{questions.length > 0 ? Math.round((answers.filter(a => a.result?.isCorrect).length / questions.length) * 100) : 0}/100</span></div>
              <div className="flex justify-between"><span>{t('comprehensiveTest.percentCorrect')}</span><span className="font-bold text-blue-600">{answers.length ? Math.round((answers.filter(a => a.result?.isCorrect).length / answers.length) * 100) : 0}%</span></div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-600 to-cyan-400 text-white rounded-[2rem] p-4 shadow-xl">
            <div className="text-xs uppercase tracking-widest font-bold mb-1">{t('comprehensiveTest.currentScore')}</div>
            <div className="text-4xl font-black">{questions.length > 0 ? Math.round((answers.filter(a => a.result?.isCorrect).length / questions.length) * 100) : 0}/100</div>
            <div className="text-xs text-blue-100 mt-1">{answers.length} {t('comprehensiveTest.questionsAnswered')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamComprehensivePage;
