/**
 * ComprehensiveTestPage - Bài kiểm tra tổng hợp ASL
 * Kết hợp: Chữ cái + Từ ngắn + Từ dài + Trắc nghiệm ảnh + Chuỗi ký hiệu
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Camera, CameraOff, Settings, Play, Check, X, Clock,
  Trophy, Target, Zap, Award, CheckCircle, XCircle,
  AlertTriangle, RefreshCw, Home, ChevronRight, Eye,
  Image as ImageIcon, BookOpen, MessageSquare, Brain,
  Star, Sparkles, PartyPopper, Medal, TrendingUp,
  ThumbsUp, RotateCcw, History, BarChart3, SkipForward
} from 'lucide-react';
import {
  generateComprehensiveTest,
  calculateSignScore,
  calculateQuizScore,
  calculateFinalResult,
  QUESTION_TYPES,
  TIME_LIMITS,
  SCORE_CONFIG,
  getLetterImage,
  getGrade,
  FEEDBACK_MESSAGES
} from '../data/comprehensiveTestData';
import { useLanguage } from '../contexts/LanguageContext';
import Header from './Header';
import Footer from './Footer';
import Layout from './Layout';

const ComprehensiveTestPage = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  
  // Camera refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);
  const manualStopRef = useRef(false);
  const isProcessingRef = useRef(false);
  
  // Sign detection refs (ALL detection state must be refs to avoid stale closures)
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
  
  // Camera state
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [skeletonImage, setSkeletonImage] = useState(null);
  const [isHandPresent, setIsHandPresent] = useState(false);
  const [currentLetter, setCurrentLetter] = useState('-');
  const [cameraError, setCameraError] = useState('');
  const [wsStatus, setWsStatus] = useState('disconnected');
  
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
  // detected signs state for rendering assembled badges
  const [detectedSignsState, setDetectedSignsState] = useState([]);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    testStartedRef.current = testStarted;
  }, [testStarted]);

  useEffect(() => {
    testCompletedRef.current = testCompleted;
  }, [testCompleted]);
  
  // Sign detection is handled entirely by refs (no state) to avoid stale closures
  // detectedSigns, currentChainIndex, stabilityCount, lastDetected are managed via refs only
  
  // Real-time feedback state (như PracticeFeedback)
  const [realtimeFeedback, setRealtimeFeedback] = useState(null);
  
  // Final results
  const [finalResult, setFinalResult] = useState(null);
  
  const WS_URL = 'http://127.0.0.1:5001/predict';

  const getExpectedSequence = (question) => {
    if (!question) return [];
    if (question.aslSpelling?.length) {
      return question.aslSpelling.map(l => l?.toString().trim().toUpperCase());
    }
    return question.target ? question.target.split('').map(l => l?.toString().trim().toUpperCase()) : [];
  };

  const recordAnswer = (question, result) => {
    const entry = { question, result, timeSpent: timeSpentRef.current };
    const qid = question?.id ?? null;
    // Dedup chỉ theo id — tránh ghi đè nhầm câu khác có cùng displayText
    if (qid !== null) {
      const existingIndex = answersRef.current.findIndex(a => a.question?.id === qid);
      if (existingIndex !== -1) {
        answersRef.current[existingIndex] = entry;
      } else {
        answersRef.current = [...answersRef.current, entry];
      }
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

  // Check auth
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);
  
  // Cleanup camera - phải đặt TRƯỚC useEffect gọi nó
  const cleanupCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      manualStopRef.current = true;
      cleanupCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cleanupCamera]);
  
  // Get cameras
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
  
  // Start camera
  const startCamera = async () => {
    if (isStreaming || isCameraLoading) return;
    setIsCameraLoading(true);
    setCameraError('');
    
    try {
      manualStopRef.current = false;
      isProcessingRef.current = false;
      
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
      setWsStatus('connected');
      
      // Start sending frames
      intervalRef.current = setInterval(async () => {
        if (isProcessingRef.current || manualStopRef.current || isPaused) return;
        
        if (videoRef.current && canvasRef.current) {
          isProcessingRef.current = true;
          const context = canvasRef.current.getContext('2d');
          context.drawImage(videoRef.current, 0, 0, 640, 480);
          const base64 = canvasRef.current.toDataURL('image/jpeg', 0.7);
          try {
              const q = currentQuestionRef.current;
              const isSignQ = q && q.type !== QUESTION_TYPES.QUIZ_IMAGE;
              const expectedLetter = isSignQ ? (q.aslSpelling ? q.aslSpelling[currentChainIndexRef.current] : (q.target ? q.target[currentChainIndexRef.current] : '')) : '';
              const target = isSignQ ? (q.target || q.displayText || '') : '';

              const response = await fetch(WS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64, target_letter: expectedLetter || target, expected_letter: expectedLetter, target: target })
              });
              
              if (response.ok) {
                const data = await response.json();
                try {
                  handlePrediction(data);
                } catch (predErr) {
                  console.error('Prediction handler error:', predErr);
                }
              }
            } catch (err) {
              // Silently ignore prediction errors
            } finally {
              isProcessingRef.current = false;
            }
        }
      }, 100);
      
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(t('comprehensiveTest.cameraError'));
      setIsStreaming(false);
      setIsCameraLoading(false);
    }
  };
  
  // Stop camera
  const stopCamera = () => {
    manualStopRef.current = true;
    setIsStreaming(false);
    setWsStatus('disconnected');
    cleanupCamera();
  };
  
  // Handle prediction from server - ALL detection state via refs to avoid stale closures
  const handlePrediction = useCallback((data) => {
    try {
    const rawDetectedLetter = data.current_letter || '';
    const detectedLetter = typeof rawDetectedLetter === 'string' ? rawDetectedLetter.trim().toUpperCase() : String(rawDetectedLetter).trim().toUpperCase();
    const hasHand = data.is_hand_present === true;
    const topPredictions = data.top_predictions || [];

    // Update hand detection status
    setIsHandPresent(hasHand);
    setSkeletonImage(data.skeleton_image || null);

    if (!hasHand) {
      setCurrentLetter('-');
      setRealtimeFeedback(null);
      stabilityCountRef.current = 0;
      lastDetectedRef.current = '';
      return;
    }

    // Update current detected letter
    setCurrentLetter(detectedLetter || '-');

    // Lấy question hiện tại từ ref (tránh stale state)
    const question = currentQuestionRef.current;
    const questionType = question?.type;

    // Bỏ qua nếu đã hiển thị kết quả hoặc chưa bắt đầu
    if (showResultRef.current || !testStartedRef.current || testCompletedRef.current || !question) {
      return;
    }

    const signQuestionTypes = [
      QUESTION_TYPES.LETTER,
      QUESTION_TYPES.SHORT_WORD,
      QUESTION_TYPES.LONG_WORD,
      QUESTION_TYPES.COMPLEX,
      QUESTION_TYPES.CHAIN
    ];

    // ========== XỬ LÝ CÁC CÂU HỎI NHẬN DIỆN ==========
    if (signQuestionTypes.includes(questionType)) {
      const expectedSequence = question.aslSpelling
        ? question.aslSpelling.map(l => l?.toString().trim().toUpperCase())
        : (question.target ? question.target.split('').map(l => l?.toString().trim().toUpperCase()) : []);
      const expectedLetter = expectedSequence[currentChainIndexRef.current] || '';
      const stableThreshold = 8; // Match Practice: confirm after a few stable frames

      if (detectedLetter) {
        const topPrediction = (topPredictions && topPredictions[0]) ? topPredictions[0] : null;
        const topConfidence = (topPrediction && typeof topPrediction.confidence === 'number') ? topPrediction.confidence : 0;
        const topLetter = topPrediction ? (topPrediction.label || topPrediction.letter || '').toString().trim().toUpperCase() : '';
        const immediateAccept = topConfidence >= 0.75 && topLetter === expectedLetter;

        if (currentChainIndexRef.current >= expectedSequence.length) {
          setRealtimeFeedback({
            type: 'completed',
            message: t('comprehensiveTest.completedSign'),
            isCorrect: true
          });
          return;
        }

        if (detectedLetter !== lastDetectedRef.current) {
          stabilityCountRef.current = 1;
        } else {
          stabilityCountRef.current += 1;
        }

        if (immediateAccept || stabilityCountRef.current >= stableThreshold) {
          const isCorrect = detectedLetter === expectedLetter;
          detectedSignsRef.current = [
            ...detectedSignsRef.current,
            { letter: detectedLetter, correct: isCorrect }
          ];
          setDetectedSignsState(detectedSignsRef.current.slice());
          currentChainIndexRef.current += 1;
          setCurrentChainIndexState(currentChainIndexRef.current);
          stabilityCountRef.current = 0;
          lastDetectedRef.current = '';

          setRealtimeFeedback({
            type: isCorrect ? 'success' : 'incorrect',
            detectedLetter: detectedLetter,
            targetLetter: expectedSequence[currentChainIndexRef.current] || '',
            message: isCorrect
              ? `${t('comprehensiveTest.recognized').replace('$detected', detectedLetter)} ${t('comprehensiveTest.continueNext')}`
              : `${t('comprehensiveTest.recognizedWrong').replace('$detected', detectedLetter)} ${t('comprehensiveTest.wrongNext')}`,
            isCorrect: isCorrect,
            topPredictions: topPredictions,
            stabilityCount: 0
          });
        } else {
          setRealtimeFeedback({
            type: 'correcting',
            detectedLetter: detectedLetter,
            targetLetter: expectedLetter,
            message: `${t('comprehensiveTest.holdToConfirm').replace('$letter', detectedLetter)}`,
            progress: Math.min(100, (stabilityCountRef.current / stableThreshold) * 100),
            isCorrect: detectedLetter === expectedLetter,
            topPredictions: topPredictions,
            stabilityCount: stabilityCountRef.current
          });
        }
      } else {
        setRealtimeFeedback({
          type: 'waiting',
          message: t('comprehensiveTest.placeHand'),
          isCorrect: null,
          stabilityCount: stabilityCountRef.current
        });
      }
    }

    // ========== XỬ LÝ TRẮC NGHIỆM ẢNH ==========
    else if (questionType === QUESTION_TYPES.QUIZ_IMAGE) {
      setRealtimeFeedback({
        type: 'waiting',
        message: t('comprehensiveTest.selectCorrectAnswer'),
        isCorrect: null,
        stabilityCount: 0
      });
    }

    // Cập nhật lastDetected sau cùng
    lastDetectedRef.current = detectedLetter;
    } catch (err) {
      console.error('handlePrediction error:', err);
    }
  }, []);
  
  // Handle sign completion (used by manual confirm button)
  const handleSignComplete = useCallback((detectedLetters) => {
    const question = currentQuestionRef.current;
    if (!question) return;

    const result = calculateSignScore(question, detectedLetters, timeSpentRef.current);
    setCurrentResult(result);
    setShowResult(true);
    showResultRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // record answer (deduplicated)
    recordAnswer(question, result);
    setDetectedSignsState(detectedSignsRef.current.slice());
  }, []);

  // Handle quiz answer (fixed: use refs to avoid stale closure)
  const handleQuizAnswer = useCallback((answer) => {
    const question = currentQuestionRef.current;
    if (!question || question.type !== QUESTION_TYPES.QUIZ_IMAGE) return;

    setSelectedAnswer(answer);
    setRealtimeFeedback({
      type: 'selected',
      message: `${t('comprehensiveTest.selectedAnswer').replace('$answer', answer)} ${t('comprehensiveTest.pressNewQuestion')}`,
      selectedAnswer: answer
    });
  }, []); // Empty deps - uses refs only
  
  // Start timer - uses timeSpentRef directly to avoid circular deps
  const startTimer = (duration) => {
    setTimeLeft(duration);
    setTimeSpent(0);
    timeSpentRef.current = 0;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          // Call handleTimeUp logic inline to avoid circular useCallback deps
          const question = currentQuestionRef.current;
          if (question) {
            if (question.type === QUESTION_TYPES.QUIZ_IMAGE) {
              const result = calculateQuizScore(question, null, timeSpentRef.current);
              setCurrentResult(result);
              setShowResult(true);
              showResultRef.current = true;
              // record answer deduplicated
              recordAnswer(question, result);
            } else {
              const result = finalizeSignQuestion(question);
              setCurrentResult(result);
              setShowResult(true);
              showResultRef.current = true;
            }

            // Sau khi tính kết quả xong, tự chuyển sang câu mới
            setTimeout(() => {
              if (showResultRef.current) {
                nextQuestion();
              }
            }, 800);
          }
          return 0;
        }
        return prev - 1;
      });
      setTimeSpent(prev => {
        const newVal = prev + 1;
        timeSpentRef.current = newVal;
        return newVal;
      });
    }, 1000);
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const currentChainIndex = currentChainIndexState;
  const detectedSigns = detectedSignsRef.current;
  const isQuizImage = currentQuestion?.type === QUESTION_TYPES.QUIZ_IMAGE;
  const isChain = currentQuestion?.type === QUESTION_TYPES.CHAIN;
  const isSignQuestion = currentQuestion && !isQuizImage;
  const questionModeLabel = isQuizImage ? t('comprehensiveTest.quiz') : t('comprehensiveTest.signRecognition');
  const promptPhrase = currentQuestion?.type === QUESTION_TYPES.CHAIN
    ? (currentQuestion?.aslSpelling?.join(' → ') || '')
    : currentQuestion?.displayText;
  const tileLetters = currentQuestion?.aslSpelling?.length
    ? currentQuestion.aslSpelling
    : currentQuestion?.target?.split('') || [];

  // Sync currentQuestionRef when currentIndex changes
  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
    currentIndexRef.current = currentIndex;
    showResultRef.current = false;
    setCurrentChainIndexState(0);
  }, [currentQuestion, currentIndex]);

  // Start timer when test starts or question changes
  useEffect(() => {
    if (testStarted && questions.length > 0 && !testCompleted && currentQuestion) {
      const timer = setTimeout(() => {
        if (!showResultRef.current) {
          startTimer(currentQuestion.timeLimit);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [testStarted, currentQuestion, questions.length, testCompleted]);

  // Ensure camera is active only for sign questions and paused for quiz questions
  useEffect(() => {
    if (!testStarted || testCompleted || !currentQuestion) return;

    if (currentQuestion.type === QUESTION_TYPES.QUIZ_IMAGE) {
      if (isStreaming) {
        stopCamera();
      }
    } else {
      if (!isStreaming && !isCameraLoading) {
        startCamera();
      }
    }
  }, [currentQuestion, isStreaming, isCameraLoading, testStarted, testCompleted]);

  // Start test
  const startTest = () => {
    getCameras();

    // Reset all refs
    stabilityCountRef.current = 0;
    lastDetectedRef.current = '';
    detectedSignsRef.current = [];
    currentChainIndexRef.current = 0;
    showResultRef.current = false;
    timeSpentRef.current = 0;

    // Generate questions
    const generatedQuestions = generateComprehensiveTest(20);
    setQuestions(generatedQuestions);
    questionsRef.current = generatedQuestions;
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    answersRef.current = [];
    setAnswers([]);
    setCurrentChainIndexState(0);
    setTestStarted(true);
    testStartedRef.current = true;
    setTestCompleted(false);
    testCompletedRef.current = false;
    setFinalResult(null);
    setShowResult(false);
    setCurrentResult(null);
    setSelectedAnswer(null);
    setRealtimeFeedback(null);

    // Start camera
    setTimeout(() => {
      startCamera();
    }, 500);
  };
  
  // Guard chống nextQuestion bị gọi 2 lần liên tiếp cho cùng 1 câu
  const isAdvancingRef = useRef(false);

  // Move to next question — dùng refs để tránh stale closure
  const nextQuestion = useCallback(() => {
    // Nếu đang trong quá trình chuyển câu thì bỏ qua
    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;

    const question = currentQuestionRef.current;
    const idx = currentIndexRef.current;
    const allQuestions = questionsRef.current;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (question && !showResultRef.current) {
      if (question.type !== QUESTION_TYPES.QUIZ_IMAGE) {
        finalizeSignQuestion(question);
      } else {
        const result = calculateQuizScore(question, selectedAnswer, timeSpentRef.current);
        setCurrentResult(result);
        recordAnswer(question, result);
      }
      setShowResult(false);
      showResultRef.current = false;
    }

    if (idx < allQuestions.length - 1) {
      const nextIdx = idx + 1;
      currentIndexRef.current = nextIdx;
      setCurrentIndex(nextIdx);
      setShowResult(false);
      setCurrentResult(null);
      setSelectedAnswer(null);
      setRealtimeFeedback(null);
      setCurrentChainIndexState(0);

      stabilityCountRef.current = 0;
      lastDetectedRef.current = '';
      detectedSignsRef.current = [];
      currentChainIndexRef.current = 0;
      showResultRef.current = false;
      timeSpentRef.current = 0;
      setDetectedSignsState([]);

      setTimeout(() => {
        isAdvancingRef.current = false; // reset guard sau khi chuyển câu
        const nextQ = allQuestions[nextIdx];
        if (nextQ) {
          startTimer(nextQ.timeLimit);
        }
      }, 500);
    } else {
      isAdvancingRef.current = false;
      finishTest();
    }
  }, [selectedAnswer]); // chỉ cần selectedAnswer vì mọi thứ khác dùng refs
  
  // Finish test
  const finishTest = () => {
    stopCamera();
    // answersRef ensures final calculation has the latest data
    const result = calculateFinalResult(answersRef.current);
    setFinalResult(result);
    setTestCompleted(true);
    testCompletedRef.current = true;
    setTestStarted(false);
    testStartedRef.current = false;
  };
  
  // Reset test
  const resetTest = () => {
    stopCamera();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTestStarted(false);
    testStartedRef.current = false;
    setTestCompleted(false);
    testCompletedRef.current = false;
    setQuestions([]);
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    questionsRef.current = [];
    answersRef.current = [];
    setAnswers([]);
    setCurrentChainIndexState(0);
    setDetectedSignsState([]);
    setShowResult(false);
    setCurrentResult(null);
    setFinalResult(null);
    setSelectedAnswer(null);
    setRealtimeFeedback(null);

    // Reset refs
    stabilityCountRef.current = 0;
    lastDetectedRef.current = '';
    detectedSignsRef.current = [];
    currentChainIndexRef.current = 0;
    showResultRef.current = false;
    timeSpentRef.current = 0;
    isAdvancingRef.current = false;
  };
  
  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const retryQuestion = () => {
    setRealtimeFeedback(null);
    stabilityCountRef.current = 0;
    lastDetectedRef.current = '';
    currentChainIndexRef.current = 0;
    setCurrentChainIndexState(0);
    detectedSignsRef.current = [];
    setDetectedSignsState([]);
  };

  // Re-detect a confirmed letter at index: set currentChainIndex to that index and remove later letters
  const handleReDetectAt = (index) => {
    if (!isSignQuestion) return;
    // remove confirmed letters after index
    detectedSignsRef.current = detectedSignsRef.current.slice(0, index);
    setDetectedSignsState(detectedSignsRef.current.slice());
    currentChainIndexRef.current = index;
    setCurrentChainIndexState(index);
    stabilityCountRef.current = 0;
    lastDetectedRef.current = '';
    setRealtimeFeedback({ type: 're-detect', message: t('comprehensiveTest.redoSign'), targetIndex: index });
  };
  
  // ========== RENDER: START SCREEN ==========
  if (!testStarted && !testCompleted) {
    const questionTypeCards = [
      {
        label: t('comprehensiveTest.letters'),
        time: t('comprehensiveTest.letterSec'),
        icon: 'A',
        iconType: 'text',
        color: 'blue',
        bg: 'from-blue-500 to-blue-600',
        cardBg: 'from-blue-50/80 to-sky-50/60',
        border: 'border-blue-200/60',
        textColor: 'text-blue-700',
        timeColor: 'text-blue-500',
        dot: 'bg-blue-400',
      },
      {
        label: t('comprehensiveTest.shortWords'),
        time: t('comprehensiveTest.vocabSec'),
        icon: 'W',
        iconType: 'text',
        color: 'emerald',
        bg: 'from-emerald-500 to-teal-500',
        cardBg: 'from-emerald-50/80 to-teal-50/60',
        border: 'border-emerald-200/60',
        textColor: 'text-emerald-700',
        timeColor: 'text-emerald-500',
        dot: 'bg-emerald-400',
      },
      {
        label: t('comprehensiveTest.longWords'),
        time: t('comprehensiveTest.sentenceSec'),
        icon: 'S',
        iconType: 'text',
        color: 'amber',
        bg: 'from-amber-500 to-orange-500',
        cardBg: 'from-amber-50/80 to-orange-50/60',
        border: 'border-amber-200/60',
        textColor: 'text-amber-700',
        timeColor: 'text-amber-500',
        dot: 'bg-amber-400',
      },
      {
        label: t('comprehensiveTest.complex'),
        time: t('comprehensiveTest.comprehensiveSec'),
        icon: 'C',
        iconType: 'text',
        color: 'purple',
        bg: 'from-purple-500 to-violet-500',
        cardBg: 'from-purple-50/80 to-violet-50/60',
        border: 'border-purple-200/60',
        textColor: 'text-purple-700',
        timeColor: 'text-purple-500',
        dot: 'bg-purple-400',
      },
      {
        label: t('comprehensiveTest.quiz'),
        time: t('comprehensiveTest.correctSec'),
        icon: null,
        iconType: 'component',
        color: 'rose',
        bg: 'from-rose-500 to-pink-500',
        cardBg: 'from-rose-50/80 to-pink-50/60',
        border: 'border-rose-200/60',
        textColor: 'text-rose-700',
        timeColor: 'text-rose-500',
        dot: 'bg-rose-400',
      },
      {
        label: t('comprehensiveTest.signChain'),
        time: t('comprehensiveTest.realtimeSec'),
        icon: '→',
        iconType: 'text',
        color: 'cyan',
        bg: 'from-cyan-500 to-sky-500',
        cardBg: 'from-cyan-50/80 to-sky-50/60',
        border: 'border-cyan-200/60',
        textColor: 'text-cyan-700',
        timeColor: 'text-cyan-500',
        dot: 'bg-cyan-400',
      },
    ];

    return (
      <Layout>
        <div className="relative overflow-hidden">
          <div className="max-w-3xl mx-auto px-4 pt-2 pb-2 relative z-10">

            {/* ── Main Card ── */}
            <div className="bg-white/85 backdrop-blur-2xl rounded-2xl shadow-xl shadow-blue-200/40 border border-white/70 overflow-hidden">

              {/* ── Hero Header ── */}
              <div className="relative bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 px-5 pt-7 pb-7 overflow-hidden">
                {/* decorative blobs */}
                <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-cyan-300/20 rounded-full blur-xl pointer-events-none" />

                <div className="relative text-center">
                  {/* icon badge */}
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-md mb-2">
                    <Brain className="w-6 h-6 text-white drop-shadow" />
                  </div>
                  <h2 className="text-lg font-extrabold text-white tracking-tight drop-shadow-sm mb-0.5">
                    {t('comprehensiveTest.testTitle')}
                  </h2>
                  <p className="text-xs text-white/75 font-medium">{t('comprehensiveTest.testDesc')}</p>
                </div>

                {/* ── Stat Pills ── */}
                <div className="relative grid grid-cols-4 gap-1.5 mt-3">
                  {[
                    { value: '20',  label: t('comprehensiveTest.questions') },
                    { value: '6',   label: t('comprehensiveTest.types')     },
                    { value: '~10', label: t('comprehensiveTest.minutes')   },
                    { value: '26',  label: 'Topics'                         },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/20 backdrop-blur-sm rounded-xl py-2 px-1 text-center border border-white/25">
                      <div className="text-base font-black text-white leading-none">{s.value}</div>
                      <div className="text-[9px] font-semibold text-white/75 mt-0.5 leading-tight">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Body ── */}
              <div className="px-4 py-5">

                {/* ── Question Types ── */}
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-1 h-3.5 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full" />
                    <h3 className="font-bold text-blue-900 text-xs tracking-wide">
                      {t('comprehensiveTest.questionTypes')}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {questionTypeCards.map((card, i) => (
                      <div
                        key={i}
                        className={`group relative flex items-center gap-2 bg-gradient-to-br ${card.cardBg} rounded-xl p-2 border ${card.border} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default overflow-hidden`}
                      >
                        {/* subtle shine */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/40 to-transparent rounded-xl pointer-events-none" />

                        {/* icon */}
                        <div className={`relative shrink-0 w-8 h-8 bg-gradient-to-br ${card.bg} rounded-lg flex items-center justify-center shadow-sm`}>
                          {card.iconType === 'component'
                            ? <ImageIcon className="w-4 h-4 text-white" />
                            : <span className="text-white font-black text-xs">{card.icon}</span>
                          }
                        </div>

                        {/* text */}
                        <div className="relative min-w-0">
                          <div className={`font-bold ${card.textColor} text-[11px] leading-snug truncate`}>{card.label}</div>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            <Clock className={`w-2.5 h-2.5 ${card.timeColor} shrink-0`} />
                            <span className={`text-[10px] font-semibold ${card.timeColor}`}>{card.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Note ── */}
                <div className="relative bg-gradient-to-br from-amber-50/90 to-orange-50/70 rounded-xl p-3 border border-amber-200/70 mb-3 overflow-hidden">
                  <div className="absolute top-0 right-0 w-14 h-14 bg-amber-200/20 rounded-full -translate-y-4 translate-x-4 blur-lg pointer-events-none" />
                  <div className="relative flex items-start gap-2.5">
                    <div className="shrink-0 w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-400 rounded-lg flex items-center justify-center shadow-sm">
                      <AlertTriangle className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-amber-800 text-[10px] mb-1 tracking-wide uppercase">{t('comprehensiveTest.note')}</div>
                      <ul className="space-y-0.5">
                        {[
                          t('comprehensiveTest.cameraRequired'),
                          t('comprehensiveTest.eachQuestionTimeLimit'),
                          t('comprehensiveTest.bonusFastAccurate'),
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px] text-amber-700">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* ── Start Button ── */}
                <button
                  onClick={startTest}
                  className="group relative w-full py-2.5 rounded-xl font-bold text-sm text-white overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/40 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" />
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                  <span className="relative flex items-center justify-center gap-2">
                    <Play className="w-4 h-4 fill-white" />
                    {t('comprehensiveTest.startTest')}
                  </span>
                </button>

              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  // ========== RENDER: RESULTS SCREEN ==========
  if (testCompleted && finalResult) {
    const gradeInfo = getGrade(finalResult.percentage);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 relative overflow-hidden">
        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={`confetti-${i}`}
              className="absolute animate-confetti-rain"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${20 + Math.random() * 80}px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2.5 + Math.random() * 2}s`,
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)],
                width: `${8 + Math.random() * 8}px`,
                height: `${8 + Math.random() * 8}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '0'
              }}
            />
          ))}
        </div>
        
        <div className="max-w-xl mx-auto px-4 pt-10 pb-6 relative z-10">
          {/* Header */}
          <div className="text-center mb-5">
            <div className={`text-5xl mb-3 ${finalResult.percentage >= 80 ? 'animate-bounce' : ''}`}>
              {finalResult.gradeEmoji}
            </div>
            <h2 className={`text-2xl font-black ${finalResult.percentage >= 90 ? 'text-amber-600' : finalResult.percentage >= 70 ? 'text-emerald-600' : 'text-blue-600'}`}>
              {finalResult.grade}
            </h2>
            <p className="text-blue-700/70 mt-1 text-sm">{t('comprehensiveTest.resultsSubtitle')}</p>
          </div>
          
          {/* Main Score Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-5 mb-4 border-2 border-blue-200 relative overflow-hidden">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 rounded-2xl blur-sm opacity-20"></div>
            
            <div className="relative">
              {/* Score Display */}
              <div className="text-center mb-5">
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  {finalResult.percentage}%
                </div>
                <div className="text-blue-600 font-medium text-sm">{t('comprehensiveTest.accuracy')}</div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-200">
                  <div className="text-xl font-black text-emerald-600">{finalResult.correctAnswers}</div>
                  <div className="text-xs text-emerald-700 font-medium">{t('comprehensiveTest.correct')}</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center border border-red-200">
                  <div className="text-xl font-black text-red-600">{finalResult.wrongAnswers}</div>
                  <div className="text-xs text-red-700 font-medium">{t('comprehensiveTest.wrong')}</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
                  <div className="text-xl font-black text-blue-600">{finalResult.avgResponseTime}s</div>
                  <div className="text-xs text-blue-700 font-medium">{t('comprehensiveTest.avgTime')}</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-200">
                  <div className="text-xl font-black text-amber-600">{finalResult.totalScore}/100</div>
                  <div className="text-xs text-amber-700 font-medium">{t('comprehensiveTest.totalScore')}</div>
                </div>
              </div>
              
              {/* Detailed Stats */}
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  {t('comprehensiveTest.detailedStats')}
                </h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('comprehensiveTest.totalQuestions')}:</span>
                    <span className="font-bold text-gray-800">{finalResult.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('comprehensiveTest.avgAccuracy')}:</span>
                    <span className="font-bold text-gray-800">{finalResult.avgAccuracy}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('comprehensiveTest.chainsCompleted')}:</span>
                    <span className="font-bold text-gray-800">{finalResult.chainsCompleted}/{finalResult.totalChains}</span>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={resetTest}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('comprehensiveTest.retakeTest')}
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 bg-white text-gray-700 rounded-xl font-bold border-2 border-gray-200 hover:bg-gray-50 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                >
                  <Home className="w-4 h-4" />
                  {t('comprehensiveTest.backToDashboard')}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes confetti-rain {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
          }
          .animate-confetti-rain {
            animation: confetti-rain 4s linear infinite;
          }
        `}} />
      </div>
    );
  }

  // ========== RENDER: TEST SCREEN ==========
  return (
    <Layout>
      <div className="bg-transparent relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 pt-2 pb-2 relative z-10">

          {/* ========== TOP HEADER BAR ========== */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg p-2.5 mb-2 border border-blue-200/40">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                <Trophy className="w-3.5 h-3.5" />
                {questions.length > 0 ? Math.round((answers.filter(a => a.result?.isCorrect).length / questions.length) * 100) : 0}/100
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-blue-700">{t('comprehensiveTest.question')} {currentIndex + 1}/{questions.length}</span>
                <span className="text-xs font-bold text-blue-700">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden border border-blue-200">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm ${timeLeft <= 3 ? 'bg-red-500 text-white animate-pulse' : timeLeft <= 10 ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'}`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          </div>

          <div className={`grid grid-cols-1 gap-2 ${isQuizImage ? 'xl:grid-cols-[1.8fr_0.8fr]' : 'xl:grid-cols-[1.25fr_1fr_0.8fr]'}`}>
            {!isQuizImage && (
              <div className="space-y-2">
                <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl p-3 border border-blue-200/40 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-blue-500 font-bold">Camera</p>
                      <h3 className="text-base font-black text-slate-900">{t('comprehensiveTest.signRecognition')}</h3>
                    </div>
                    <span className="text-xs text-slate-500">{isStreaming ? t('comprehensiveTest.running') : t('comprehensiveTest.paused')}</span>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-blue-100 bg-slate-50 mb-2">
                    <div className="aspect-[4/3] relative bg-blue-950/5">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${isStreaming ? '' : 'hidden'}`}
                        style={{ transform: 'scaleX(-1)' }}
                      />
                      <canvas
                        ref={canvasRef}
                        width={640}
                        height={480}
                        className="hidden"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={isStreaming ? stopCamera : startCamera}
                      className={`w-full rounded-xl py-2 text-sm font-bold text-white transition duration-200 ${
                        isStreaming ? 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600' : 'bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 hover:from-blue-700'
                      }`}
                    >
                      {isStreaming ? t('comprehensiveTest.stopCamera') : t('comprehensiveTest.startCamera')}
                    </button>
                    <button onClick={retryQuestion} className="w-full rounded-xl py-2 text-sm font-bold bg-white border border-blue-200 text-blue-900 hover:bg-blue-50 transition duration-200">
                      {t('comprehensiveTest.redetect')}
                    </button>
                  </div>
                </div>

                <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-md p-2.5 border border-blue-200/40">
                  <div className="text-xs text-slate-500 mb-1">{t('comprehensiveTest.detectionStatus')}</div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-700">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{t('comprehensiveTest.sign')}: {currentLetter}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isHandPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {isHandPresent ? t('comprehensiveTest.handDetected') : t('comprehensiveTest.noHand')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* MIDDLE COLUMN: QUESTION */}
            <div className="space-y-2">
              <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl p-3 border border-blue-200/40">
                  <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-blue-500 font-bold">{questionModeLabel}</p>
                    {isQuizImage && (
                      <h3 className="text-lg font-black text-slate-900">{t('comprehensiveTest.whatSignIsThis')}</h3>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">{currentQuestion?.timeLimit}s</span>
                </div>

                {isQuizImage ? (
                  <div className="space-y-2">
                    <div className="bg-slate-50 rounded-2xl p-2.5 border border-blue-100">
                      <p className="text-xs text-slate-500 mb-1">{t('comprehensiveTest.question')}</p>
                      <div className="text-sm font-semibold text-slate-900">{t('comprehensiveTest.observeChoose')}</div>
                    </div>

                    {/* ASL image preview area for quiz questions */}
                    <div className="bg-white rounded-xl p-2.5 border border-slate-100 flex items-center justify-center">
                      {currentQuestion?.subType === 'letter' && currentQuestion.image && (
                        <img src={currentQuestion.image} alt={currentQuestion.displayText} className="max-h-32 object-contain rounded-lg shadow-md" />
                      )}

                      {(currentQuestion?.subType === 'vocabulary' || currentQuestion?.subType === 'sentence') && currentQuestion?.aslSpelling && (
                        <div className="flex flex-wrap gap-1.5 justify-center py-1 px-1">
                          {currentQuestion.aslSpelling.map((ltr, i) => (
                            <div key={`${ltr}-${i}`} className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                              <img src={getLetterImage(ltr)} alt={ltr} className="w-9 h-9 object-cover rounded-md" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {currentQuestion.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuizAnswer(option)}
                          disabled={showResult}
                          className={`w-full text-left rounded-2xl p-2.5 border transition duration-200 ${
                            selectedAnswer === option ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-500 text-white font-black text-sm">{String.fromCharCode(65 + idx)}</span>
                            <span className="font-semibold text-slate-900 text-sm">{option}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-2 mt-2">
                      <button onClick={nextQuestion} className="w-full py-2 rounded-xl bg-white border border-blue-200 text-blue-900 font-bold text-sm hover:bg-blue-50">{t('comprehensiveTest.skipNext')}</button>
                      <button onClick={() => { setSelectedAnswer(null); setRealtimeFeedback(null); setShowResult(false); }} className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white font-bold text-sm">{t('comprehensiveTest.retryQuestion')}</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-emerald-50/80 rounded-2xl p-3 border border-emerald-200 shadow-sm">
                      <p className="text-xs text-emerald-700 mb-1">{t('comprehensiveTest.performSign')}</p>
                      <div className="text-2xl font-black text-emerald-800 leading-tight">{promptPhrase}</div>
                      <div className="mt-2 p-2.5 rounded-2xl bg-white border border-emerald-100 shadow-sm">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 mb-1">{t('comprehensiveTest.detecting')}</p>
                        <div className="text-4xl font-black text-slate-900">{currentLetter || '-'}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {tileLetters.map((letter, idx) => {
                        const confirmedLetter = detectedSignsState[idx] || null;
                        const isCurrent = idx === currentChainIndex;
                        const display = confirmedLetter
                          ? (confirmedLetter.correct ? tileLetters[idx] || confirmedLetter.letter : confirmedLetter.letter || tileLetters[idx])
                          : ((realtimeFeedback && realtimeFeedback.detectedLetter)
                              ? realtimeFeedback.detectedLetter
                              : (currentLetter && currentLetter !== '-')
                                ? currentLetter
                                : '?');

                        if (confirmedLetter) {
                          const isCorrect = confirmedLetter.correct;
                          return (
                            <div
                              key={`${letter}-${idx}`}
                              onClick={() => handleReDetectAt(idx)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition relative group cursor-pointer ${
                                isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                              }`}
                              title={isCorrect ? t('comprehensiveTest.confirmedCorrect') : t('comprehensiveTest.confirmedWrong')}
                            >
                              {display}
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white rounded-full text-[9px] flex items-center justify-center opacity-80">↻</span>
                            </div>
                          );
                        }

                        if (isCurrent) {
                          return (
                            <div
                              key={`${letter}-${idx}`}
                              onClick={() => handleReDetectAt(idx)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-yellow-400 text-white animate-pulse transition relative group cursor-pointer"
                              title={t('comprehensiveTest.currentLetterTip')}
                            >
                              {display}
                            </div>
                          );
                        }

                        return (
                          <div
                            key={`${letter}-${idx}`}
                            onClick={() => handleReDetectAt(idx)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-gray-200 text-gray-600 transition relative group cursor-pointer"
                            title={t('comprehensiveTest.redetectTip')}
                          >
                            ?
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid gap-2">
                      <button onClick={retryQuestion} className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white font-bold text-sm">{t('comprehensiveTest.redetectQuestion')}</button>
                      <button onClick={nextQuestion} className="w-full py-2 rounded-xl bg-white border border-blue-200 text-blue-900 font-bold text-sm hover:bg-blue-50">{t('comprehensiveTest.nextQuestion')}</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: STATS */}
            <div className="space-y-2">
              <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl p-3 border border-blue-200/40">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] uppercase tracking-[0.3em] text-blue-500 font-bold">{t('comprehensiveTest.statistics')}</h4>
                  <span className="text-[10px] text-slate-500">{t('comprehensiveTest.live')}</span>
                </div>
                <div className="grid gap-2 text-xs text-slate-700">
                  <div className="flex justify-between"><span>{t('comprehensiveTest.correct')}</span><span className="font-bold text-emerald-600">{answers.filter(a => a.result.isCorrect).length}</span></div>
                  <div className="flex justify-between"><span>{t('comprehensiveTest.wrong')}</span><span className="font-bold text-red-600">{answers.filter(a => !a.result.isCorrect).length}</span></div>
                  <div className="flex justify-between"><span>{t('comprehensiveTest.totalScore')}</span><span className="font-bold text-amber-600">{questions.length > 0 ? Math.round((answers.filter(a => a.result?.isCorrect).length / questions.length) * 100) : 0}/100</span></div>
                  <div className="flex justify-between"><span>{t('comprehensiveTest.percentCorrect')}</span><span className="font-bold text-blue-600">{answers.length ? Math.round((answers.filter(a => a.result.isCorrect).length / answers.length) * 100) : 0}%</span></div>
                </div>
              </div>

              {showResult && currentResult && (
                <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl p-3 border border-blue-200/40">
                  <div className="text-center mb-2">
                    <div className="text-2xl mb-1">{currentResult.isCorrect ? '✅' : '❌'}</div>
                    <div className="font-bold text-blue-900 text-sm">{currentResult.isCorrect ? t('comprehensiveTest.correct') : t('comprehensiveTest.wrong')}</div>
                  </div>
                  <div className="grid gap-1.5 text-xs text-slate-700">
                    <div className="flex justify-between"><span>{t('comprehensiveTest.time')}</span><span>{currentResult.timeSpent || 0}s</span></div>
                    <div className="flex justify-between"><span>{t('comprehensiveTest.accuracy')}</span><span>{currentResult.accuracy || 0}%</span></div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-r from-blue-600 to-cyan-400 text-white rounded-2xl p-3 shadow-xl">
                <div className="text-[10px] uppercase tracking-[0.3em] font-bold mb-1">{t('comprehensiveTest.currentScore')}</div>
                <div className="text-3xl font-black">{questions.length > 0 ? Math.round((answers.filter(a => a.result?.isCorrect).length / questions.length) * 100) : 0}/100</div>
                <div className="text-[10px] text-blue-100 mt-0.5">{answers.length} {t('comprehensiveTest.answered')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </Layout>
    );
  }

export default ComprehensiveTestPage;
