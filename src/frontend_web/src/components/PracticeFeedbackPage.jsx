import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Camera, Settings, User, LogOut, MessageSquare,
  CheckCircle, XCircle, Target, TrendingUp, Award,
  SkipForward, Lightbulb, BookOpen, ThumbsUp, ThumbsDown,
  AlertTriangle, AlertCircle, RefreshCw, Play, Check
} from 'lucide-react';
import {
  ASL_LETTER_FEEDBACK,
  generateFeedback
} from '../data/practiceFeedback';
import {
  generateLetterPairCorrections,
  sortCorrectionsByPriority,
  getPriorityColors
} from '../data/fingerCorrections';
import { useLanguage } from '../contexts/LanguageContext';
import Header from './Header';
import Footer from './Footer';
import Layout from './Layout';

const PracticeFeedbackPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);
  const streamRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const manualStopRef = useRef(false);
  const isProcessingRef = useRef(false);

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
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [history, setHistory] = useState([]);
  const [isCorrect, setIsCorrect] = useState(null);

  // Real-time feedback state
  const [realtimeFeedback, setRealtimeFeedback] = useState(null);
  const [lastDetectedLetter, setLastDetectedLetter] = useState('');
  const [stabilityCount, setStabilityCount] = useState(0);
  const [wsStatus, setWsStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected'  // Stats
  const [stats, setStats] = useState({ correct: 0, wrong: 0, total: 0 });

  // Use a ref to hold latest state for closures
  const stateRef = useRef({
    selectedLetter,
    showResult,
    lastDetectedLetter,
    stabilityCount
  });

  useEffect(() => {
    stateRef.current = {
      selectedLetter,
      showResult,
      lastDetectedLetter,
      stabilityCount
    };
  }, [selectedLetter, showResult, lastDetectedLetter, stabilityCount]);

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

  // Attach stream to video element when streaming changes
  useEffect(() => {
    if (!isStreaming) return;
    
    const attachStream = () => {
      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(err => {
          console.log('Video play error:', err);
        });
      }
    };

    // Delay to ensure DOM is ready
    const timer = setTimeout(attachStream, 200);
    return () => clearTimeout(timer);
  }, [isStreaming]);

  // Also try to attach when streamRef changes
  useEffect(() => {
    if (isStreaming && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [streamRef.current]);

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
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    const stream = streamRef.current || videoRef.current?.srcObject;
    const tracks = stream?.getTracks() || [];
    tracks.forEach(track => track.stop());
    streamRef.current = null;
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
      isProcessingRef.current = false;
      const constraints = {
        video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Attach stream to video element immediately
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.log('Play error:', err));
      }
      
      setIsStreaming(true);
      setIsCameraLoading(false);
      setWsStatus('connecting');

      // Start sending frames via HTTP
      intervalRef.current = setInterval(async () => {
        if (isProcessingRef.current || manualStopRef.current) return;
        
        if (videoRef.current && canvasRef.current) {
          isProcessingRef.current = true;
          const context = canvasRef.current.getContext('2d');
          context.drawImage(videoRef.current, 0, 0, 640, 480);
          const base64 = canvasRef.current.toDataURL('image/jpeg', 0.7);
          
          try {
            const response = await fetch(WS_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                image: base64,
                target_letter: stateRef.current.selectedLetter || ''
              })
            });
            
            if (response.ok) {
              setWsStatus('connected');
              const data = await response.json();
              handleWebSocketMessage(data);
            } else {
              setWsStatus('error');
            }
          } catch (err) {
            console.log('Prediction error:', err);
            setWsStatus('error');
          } finally {
            isProcessingRef.current = false;
          }
        }
      }, 200); // Send frame every 200ms (optimized from 500ms)
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

  const handleWebSocketMessage = (data) => {
    const { selectedLetter, showResult, lastDetectedLetter, stabilityCount } = stateRef.current;
    const detectedLetter = data.current_letter || '';
    const hasHand = data.is_hand_present === true;
    const topPredictions = data.top_predictions || [];
    
    // Update hand detection status
    setIsHandPresent(hasHand);
    setSkeletonImage(data.skeleton_image || null);
    
    if (!hasHand) {
      setCurrentLetter('-');
      setRealtimeFeedback(null);
      setStabilityCount(0);
      setLastDetectedLetter('');
      return;
    }
    
    // Update current detected letter
    setCurrentLetter(detectedLetter || '-');

    // Always provide real-time feedback when hand is detected
    if (selectedLetter && !showResult) {
      if (detectedLetter) {
        const isMatch = detectedLetter.toUpperCase() === selectedLetter.toUpperCase();
        
          if (isMatch) {
            if (detectedLetter !== lastDetectedLetter) {
              setStabilityCount(1);
            } else {
              setStabilityCount(prev => prev + 1);
            }

            if (stabilityCount >= 30) {
              handleSuccess();
            } else {
              setRealtimeFeedback({
                type: 'correcting',
                detectedLetter: detectedLetter,
                targetLetter: selectedLetter,
                message: `${t('practiceFeedback.holdingCorrect')} ${detectedLetter}. ${t('practiceFeedback.confirming')}...`,
                progress: Math.min(100, (stabilityCount / 30) * 100),
                isCorrect: true
              });
            }
          } else {
          // Letter doesn't match - CORRECTION NEEDED with detailed finger analysis
          setStabilityCount(0);
          
          // Get corrections from server (backend đã xử lý đúng cho tất cả các cặp G/H)
          let corrections = [];
          
          if (data.corrections && Array.isArray(data.corrections) && data.corrections.length > 0) {
            // Use server corrections - backend đã phân tích đúng dựa trên target_letter
            corrections = data.corrections;
          } else {
            // Fallback to local corrections
            corrections = generateLetterPairCorrections(detectedLetter, selectedLetter);
          }
          
          // Also add specific guidance for the TARGET letter
          const targetGuidance = getLetterTargetGuidance(selectedLetter);
          
          setRealtimeFeedback({
            type: 'correction',
            detectedLetter: detectedLetter,
            targetLetter: selectedLetter,
            message: `⚠️ ${t('practiceFeedback.youAreShowingLetter')} "${detectedLetter}" ${t('practiceFeedback.insteadOf')} "${selectedLetter}"!`,
            corrections: corrections,
            targetGuidance: targetGuidance,
            topPredictions: topPredictions,
            isCorrect: false
          });
        }
      } else {
        setRealtimeFeedback({
          type: 'waiting',
          message: t('practiceFeedback.handInFrameNotClear'),
          isCorrect: null
        });
      }
    } else if (!selectedLetter && detectedLetter) {
      setRealtimeFeedback({
        type: 'waiting',
        detectedLetter: detectedLetter,
        message: `${t('practiceFeedback.detectedLetterChoose')} "${detectedLetter}" - ${t('practiceFeedback.selectLetterToStartPractice')}`,
        isCorrect: null
      });
    }
    
    setLastDetectedLetter(detectedLetter);
  };

  const getCorrectionFeedback = (target, detected) => {
    const letterData = ASL_LETTER_FEEDBACK[target.toUpperCase()];
    if (!letterData) {
      return {
        type: 'correction',
        message: `${t('practiceFeedback.performingWrong')} "${detected || '?'}" ${t('practiceFeedback.insteadOf')} "${target}". ${t('practiceFeedback.fixByGuide')}`,
        tips: [t('practiceFeedback.seeGuideBelow')],
        isCorrect: false
      };
    }

    // Generate specific correction based on common mistakes
    const corrections = [];
    
    letterData.keyPoints.forEach(point => {
      if (point.status === 'critical') {
        corrections.push({
          aspect: point.aspect,
          message: point.feedback,
          icon: getAspectIcon(point.aspect)
        });
      }
    });

    return {
      type: 'correction',
      message: `${t('practiceFeedback.performingWrong')} "${detected || '?'}" ${t('practiceFeedback.insteadOf')} "${target}". ${t('practiceFeedback.fixByGuide')}`,
      corrections: corrections,
      tips: letterData.improvementTips.slice(0, 2),
      commonMistakes: letterData.commonMistakes.slice(0, 1),
      isCorrect: false
    };
  };

  // Get finger corrections from backend or generate fallback
  const getFingerCorrections = (detectedLetter, targetLetter) => {
    let corrections = [];
    
    // Thử dùng letter pair corrections trước (chi tiết nhất)
    corrections = generateLetterPairCorrections(detectedLetter, targetLetter);
    
    // Nếu không có corrections cho cặp này, dùng fallback từ ASL_LETTER_FEEDBACK
    if (corrections.length === 0) {
      const targetData = ASL_LETTER_FEEDBACK[targetLetter.toUpperCase()];
      if (targetData) {
        targetData.keyPoints.forEach(point => {
          if (point.status === 'critical') {
            corrections.push({
              finger: point.aspect,
              emoji: getAspectIcon(point.aspect),
              issue: point.aspect.toUpperCase(),
              fix: point.feedback,
              priority: 'high'
            });
          }
        });
      }
    }
    
    // Sắp xếp theo priority
    return sortCorrectionsByPriority(corrections);
  };

  // More specific corrections based on letter comparison
  const getSpecificCorrections = (target, detected) => {
    const corrections = [];
    
    // Common letter-specific corrections
    const letterComparisons = {
      'A': { 
        shape: 'Nắm đấm với ngón cái áp vào bên hông nắm đấm',
        tips: ['Ngón cái phải nằm ngang, không đứng lên', 'Các ngón khác nắm chặt thành nắm đấm tròn']
      },
      'B': { 
        shape: 'Bàn tay phẳng, 4 ngón duỗi thẳng, ngón cái gập vào lòng bàn tay',
        tips: ['4 ngón tay duỗi thẳng và sát nhau', 'Ngón cái gập cong qua ngón trỏ', 'Lòng bàn tay hướng về phía trước']
      },
      'C': { 
        shape: 'Các ngón tay cong tạo thành hình chữ C',
        tips: ['Tay tạo hình giống chữ C hoa', 'Ngón cái và ngón út là 2 đầu mút', 'Giữ khoảng trống ở giữa']
      },
      'D': { 
        shape: 'Ngón trỏ duỗi lên, các ngón khác nắm chặt, ngón cái chạm ngón giữa',
        tips: ['Chỉ có ngón trỏ duỗi thẳng lên', 'Ngón cái chạm đầu ngón giữa', '3 ngón còn lại nắm lại']
      },
      'E': { 
        shape: 'Tất cả ngón tay gập xuống, đầu ngón chạm lòng bàn tay',
        tips: ['4 ngón tay gập cong xuống', 'Đầu các ngón chạm vào lòng bàn tay', 'Ngón cái nằm tự nhiên bên cạnh']
      },
      'F': { 
        shape: 'Ngón trỏ và ngón cái chạm nhau tạo vòng, 3 ngón còn lại duỗi',
        tips: ['Ngón cái và ngón trỏ tạo vòng tròn', '3 ngón kia duỗi thẳng ra', 'Lòng bàn tay hướng ra ngoài']
      },
      'G': { 
        shape: 'Ngón trỏ và ngón cái duỗi thẳng song song với nhau, hướng ra ngoài',
        tips: ['Ngón trỏ và ngón cái tạo đường thẳng', 'Hướng ngón tay ra bên ngoài', 'Các ngón khác nắm lại']
      },
      'H': { 
        shape: 'Ngón trỏ và ngón giữa duỗi thẳng song song, ngón cái gập dưới',
        tips: ['2 ngón giữa duỗi thẳng song song', 'Ngón cái nằm dưới 2 ngón đó', 'Hướng ngón tay sang ngang']
      },
      'I': { 
        shape: 'Chỉ có ngón út duỗi thẳng lên, các ngón khác nắm',
        tips: ['Chỉ có ngón út duỗi', 'Ngón út hướng lên trên', 'Tay nắm tự nhiên']
      },
      'K': { 
        shape: 'Ngón trỏ và ngón giữa duỗi tạo chữ V, ngón cái đặt giữa 2 ngón đó',
        tips: ['Tạo hình chữ V với ngón trỏ và giữa', 'Ngón cái đặt giữa 2 ngón', 'Các ngón còn lại nắm lại']
      },
      'L': { 
        shape: 'Ngón cái duỗi ngang, ngón trỏ duỗi lên vuông góc với ngón cái',
        tips: ['Tạo hình chữ L', 'Ngón cái hướng sang ngang', 'Ngón trỏ hướng lên thẳng']
      },
      'M': { 
        shape: '3 ngón giữa đặt xuống dưới ngón cái, ngón cái đè lên trên',
        tips: ['3 ngón giữa gập xuống', 'Ngón cái đè lên 3 ngón đó', 'Ngón trỏ và ngón út có thể thò ra ngoài']
      },
      'N': { 
        shape: '2 ngón giữa đặt xuống dưới ngón cái, ngón cái đè lên',
        tips: ['2 ngón giữa gập xuống', 'Ngón cái đè lên ngón giữa', 'Ngón trỏ và ngón út thò lên']
      },
      'O': { 
        shape: 'Tất cả ngón tay cong tạo hình tròn với ngón cái',
        tips: ['Các ngón tay cong tạo hình O', 'Ngón cái chạm đầu ngón trỏ hoặc ngón giữa', 'Có khoảng trống hình tròn ở giữa']
      },
      'P': { 
        shape: 'Ngón trỏ chỉ xuống, ngón cái đặt ngang, các ngón khác nắm',
        tips: ['Ngón trỏ hướng xuống dưới', 'Ngón cái đặt ngang', 'Tay tạo góc vuông']
      },
      'Q': { 
        shape: 'Ngón trỏ chỉ xuống, ngón cái chỉ xuống, các ngón nắm',
        tips: ['Ngón trỏ và ngón cái chỉ xuống', 'Hai ngón tạo hình chữ L ngược', 'Các ngón còn lại nắm lại']
      },
      'R': { 
        shape: 'Ngón trỏ và ngón giữa duỗi và bắt chéo nhau',
        tips: ['2 ngón giữa bắt chéo nhau', 'Ngón cái đặt dưới', 'Các ngón còn lại nắm lại']
      },
      'S': { 
        shape: 'Nắm đấm tròn, ngón cái nằm phía trước các ngón khác',
        tips: ['Tạo nắm đấm tròn', 'Ngón cái nằm phía trước thay vì bên hông', 'Các ngón khác nắm chặt']
      },
      'T': { 
        shape: 'Ngón cái đặt giữa ngón trỏ và ngón giữa, các ngón nắm',
        tips: ['Ngón cái đặt giữa ngón trỏ và ngón giữa', 'Ngón cái có thể thấy được từ trên', 'Tạo hình chữ T']
      },
      'U': { 
        shape: 'Ngón trỏ và ngón giữa duỗi thẳng, hướng lên, chạm nhau',
        tips: ['2 ngón tạo hình chữ U', 'Đầu 2 ngón chạm nhau hoặc sát nhau', 'Ngón cái nắm bên dưới']
      },
      'V': { 
        shape: 'Ngón trỏ và ngón giữa duỗi thẳng tạo chữ V',
        tips: ['Tạo hình chữ V', '2 ngón duỗi thẳng và sát nhau', 'Ngón cái nắm bên dưới']
      },
      'W': { 
        shape: '3 ngón giữa duỗi thẳng tạo chữ W',
        tips: ['Ngón trỏ, giữa, út duỗi lên', 'Tạo hình chữ W', 'Ngón cái và ngón áp út nắm lại']
      },
      'X': { 
        shape: 'Ngón trỏ gập cong tạo móc, các ngón nắm',
        tips: ['Ngón trỏ gập tạo hình móc', 'Các ngón khác nắm lại', 'Nhìn từ trên giống chữ X']
      },
      'Y': { 
        shape: 'Ngón cái và ngón út duỗi ra hai bên, tạo hình chữ Y',
        tips: ['Ngón cái và ngón út duỗi ra', 'Tạo hình chữ Y hoặc OK', '3 ngón giữa nắm lại']
      },
      'Z': { 
        shape: 'Ngón trỏ duỗi, ngón cái đặt ngang, vẽ chữ Z trong không trung',
        tips: ['Ngón trỏ duỗi thẳng', 'Dùng ngón trỏ vẽ chữ Z trong không khí', 'Hoặc giữ ngón trỏ và ngón cái tạo góc']
      }
    };

    // Get corrections for target letter
    const targetInfo = letterComparisons[target.toUpperCase()];
    const detectedInfo = letterComparisons[detected.toUpperCase()];

    if (targetInfo) {
      corrections.push({
        icon: '📍',
        title: t('practiceFeedback.shapeRequired'),
        message: targetInfo.shape
      });
      
      targetInfo.tips.forEach(tip => {
        corrections.push({
          icon: '✅',
          title: '',
          message: tip
        });
      });
    }

    // Add comparison hint
    if (detectedInfo && detectedInfo !== targetInfo) {
      corrections.push({
        icon: '🔄',
        title: t('practiceFeedback.compare'),
        message: `${t('practiceFeedback.showingSimilarTo')} "${detected}" - ${t('practiceFeedback.needToChangeTo')} "${target}"`
      });
    }

    return corrections;
  };

  const handleSuccess = () => {
    setRealtimeFeedback({
      type: 'success',
      message: t('practiceFeedback.excellentPerformCorrect'),
      isCorrect: true
    });
    setShowResult(true);
    setIsCorrect(true);
    
    // Update stats
    setStats(prev => ({
      correct: prev.correct + 1,
      wrong: prev.wrong,
      total: prev.total + 1
    }));
    
    // Update history
    setHistory(prev => [...prev.slice(-19), {
      letter: selectedLetter,
      isCorrect: true
    }]);
  };

  const getAspectIcon = (aspect) => {
    const icons = {
      fingers: '✋',
      thumb: '👍',
      wrist: '🤚',
      palm: '🖐️',
      indexFinger: '☝️',
      index: '☝️',
      indexThumb: '🤞',
      indexMiddle: '✌️',
      tealy: '🤙',
      crossedFingers: '🤞',
      movement: '➡️',
      position: '📍',
      angle: '📐'
    };
    return icons[aspect] || '👆';
  };

  // Get detailed guidance for the TARGET letter (always show this when practicing)
  const getLetterTargetGuidance = (targetLetter) => {
    const letterUpper = targetLetter.toUpperCase();
    
    // Map letter to translation keys
    const guidanceMap = {
      'A': { shapeKey: 'practiceFeedback.letterGuidanceA', stepKeys: ['practiceFeedback.letterGuidanceAStep1', 'practiceFeedback.letterGuidanceAStep2', 'practiceFeedback.letterGuidanceAStep3'] },
      'B': { shapeKey: 'practiceFeedback.letterGuidanceB', stepKeys: ['practiceFeedback.letterGuidanceBStep1', 'practiceFeedback.letterGuidanceBStep2', 'practiceFeedback.letterGuidanceBStep3'] },
      'C': { shapeKey: 'practiceFeedback.letterGuidanceC', stepKeys: ['practiceFeedback.letterGuidanceCStep1', 'practiceFeedback.letterGuidanceCStep2', 'practiceFeedback.letterGuidanceCStep3'] },
      'D': { shapeKey: 'practiceFeedback.letterGuidanceD', stepKeys: ['practiceFeedback.letterGuidanceDStep1', 'practiceFeedback.letterGuidanceDStep2', 'practiceFeedback.letterGuidanceDStep3'] },
      'E': { shapeKey: 'practiceFeedback.letterGuidanceE', stepKeys: ['practiceFeedback.letterGuidanceEStep1', 'practiceFeedback.letterGuidanceEStep2', 'practiceFeedback.letterGuidanceEStep3'] },
      'F': { shapeKey: 'practiceFeedback.letterGuidanceF', stepKeys: ['practiceFeedback.letterGuidanceFStep1', 'practiceFeedback.letterGuidanceFStep2', 'practiceFeedback.letterGuidanceFStep3'] },
      'G': { shapeKey: 'practiceFeedback.letterGuidanceG', stepKeys: ['practiceFeedback.letterGuidanceGStep1', 'practiceFeedback.letterGuidanceGStep2', 'practiceFeedback.letterGuidanceGStep3'] },
      'H': { shapeKey: 'practiceFeedback.letterGuidanceH', stepKeys: ['practiceFeedback.letterGuidanceHStep1', 'practiceFeedback.letterGuidanceHStep2', 'practiceFeedback.letterGuidanceHStep3'] },
      'I': { shapeKey: 'practiceFeedback.letterGuidanceI', stepKeys: ['practiceFeedback.letterGuidanceIStep1', 'practiceFeedback.letterGuidanceIStep2', 'practiceFeedback.letterGuidanceIStep3'] },
      'K': { shapeKey: 'practiceFeedback.letterGuidanceK', stepKeys: ['practiceFeedback.letterGuidanceKStep1', 'practiceFeedback.letterGuidanceKStep2', 'practiceFeedback.letterGuidanceKStep3'] },
      'L': { shapeKey: 'practiceFeedback.letterGuidanceL', stepKeys: ['practiceFeedback.letterGuidanceLStep1', 'practiceFeedback.letterGuidanceLStep2', 'practiceFeedback.letterGuidanceLStep3'] },
      'U': { shapeKey: 'practiceFeedback.letterGuidanceU', stepKeys: ['practiceFeedback.letterGuidanceUStep1', 'practiceFeedback.letterGuidanceUStep2', 'practiceFeedback.letterGuidanceUStep3'] },
      'V': { shapeKey: 'practiceFeedback.letterGuidanceV', stepKeys: ['practiceFeedback.letterGuidanceVStep1', 'practiceFeedback.letterGuidanceVStep2', 'practiceFeedback.letterGuidanceVStep3'] },
      'W': { shapeKey: 'practiceFeedback.letterGuidanceW', stepKeys: ['practiceFeedback.letterGuidanceWStep1', 'practiceFeedback.letterGuidanceWStep2', 'practiceFeedback.letterGuidanceWStep3'] },
      'Y': { shapeKey: 'practiceFeedback.letterGuidanceY', stepKeys: ['practiceFeedback.letterGuidanceYStep1', 'practiceFeedback.letterGuidanceYStep2', 'practiceFeedback.letterGuidanceYStep3'] },
    };
    
    const config = guidanceMap[letterUpper];
    
    if (config) {
      return {
        shape: t(config.shapeKey),
        steps: config.stepKeys.map(key => t(key))
      };
    }
    
    return {
      shape: t('practiceFeedback.letterGuidanceDefault'),
      steps: [t('practiceFeedback.letterGuidanceDefaultStep')]
    };
  };

  const selectLetter = (letter) => {
    setSelectedLetter(letter);
    setShowResult(false);
    setRealtimeFeedback(null);
    setIsCorrect(null);
    setStabilityCount(0);
    setLastDetectedLetter('');
  };

  const nextLetter = () => {
    setSelectedLetter(null);
    setShowResult(false);
    setRealtimeFeedback(null);
    setIsCorrect(null);
    setStabilityCount(0);
  };

  const letterGuide = selectedLetter ? ASL_LETTER_FEEDBACK[selectedLetter.toUpperCase()] : null;

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-2 sm:px-3 lg:px-4 pb-2">
        {/* Letter Selection Bar */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg shadow-blue-200/30 p-2 sm:p-3 mb-2">
          <h3 className="font-bold text-blue-900 mb-1.5 flex items-center gap-1.5 text-xs sm:text-sm">
            <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" />
            {t('practiceFeedback.selectLetterToPractice')}
          </h3>
          <div className="grid grid-cols-13 gap-0.5 sm:gap-1" style={{gridTemplateColumns: 'repeat(13, minmax(0, 1fr))'}}>

            {ALPHABET.map(letter => (
              <button
                key={letter}
                onClick={() => selectLetter(letter)}
                className={`w-full h-6 sm:h-7 rounded text-xs font-bold transition-all duration-200 preserve-3d ${
                  selectedLetter === letter
                    ? 'bg-gradient-to-br from-blue-500 via-sky-400 to-cyan-400 text-white shadow-md shadow-blue-500/40 scale-110 neon-btn'
                    : isStreaming
                    ? 'bg-blue-50 text-blue-700 border border-blue-200/60 hover:bg-blue-100'
                    : 'bg-gray-50/50 text-gray-400 border border-gray-200/50 cursor-not-allowed opacity-70'
                }`}
                disabled={!isStreaming}
              >
                {letter}
              </button>
            ))}
          </div>
          {!isStreaming && (
            <p className="text-[10px] text-gray-500 mt-1">
              <AlertTriangle className="w-2.5 h-2.5 inline mr-0.5" />
              {t('practiceFeedback.enableCameraFirst')}
            </p>
          )}
          {selectedLetter && (
            <p className="text-[10px] text-emerald-600 mt-1 font-medium">
              <CheckCircle className="w-2.5 h-2.5 inline mr-0.5" />
              {t('practiceFeedback.selectedLetter')} <span className="font-bold">{selectedLetter}</span> - {t('practiceFeedback.bringHandToCamera')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {/* Main Practice Area */}
          <div className="lg:col-span-2 space-y-2">
            {/* Camera Section */}
            <div className="bg-white/80 backdrop-blur-2xl rounded-xl shadow-lg shadow-blue-300/30 p-2 border border-blue-200/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5 pointer-events-none"></div>
              
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 p-1.5 rounded-lg mb-2 border border-blue-100 relative z-10">
                <Settings size={13} className="text-blue-500 shrink-0" />
                <select 
                  className="flex-1 bg-white/80 backdrop-blur border border-blue-200/60 rounded-md px-2 py-1 outline-none font-semibold text-blue-900 text-xs shadow-sm focus:ring-1 focus:ring-blue-400/50 transition-all"
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

              <div className="grid grid-cols-2 gap-2 mb-2 relative z-10">
                {/* Camera */}
                <div className="relative bg-blue-950/5 rounded-lg overflow-hidden flex items-center justify-center border border-blue-200/50" style={{height: '200px'}}>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className={`w-full h-full object-cover ${isStreaming ? 'scan-effect' : 'hidden'}`}
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  {!isStreaming && (
                    <div className="text-blue-400 font-medium flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Camera size={16} className="text-blue-500"/>
                      </div>
                      <p className="text-[10px] text-center px-1">{t('practiceFeedback.enableCameraStart')}</p>
                    </div>
                  )}
                  <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white backdrop-blur-md ${
                    isHandPresent ? 'bg-emerald-500/90' : 'bg-gray-800/60'
                  }`}>
                    {isHandPresent ? t('practiceFeedback.handDetected') : t('practiceFeedback.noHand')}
                  </div>
                </div>
                
                {/* Skeleton */}
                <div className="relative bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg overflow-hidden flex items-center justify-center border-2 border-cyan-200 holo-border" style={{height: '200px'}}>
                  {skeletonImage ? (
                    <img src={skeletonImage} alt="Hand skeleton" className="w-full h-full object-contain mix-blend-multiply" />
                  ) : (
                    <div className="text-blue-300 flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center border border-blue-100">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold">{t('practiceFeedback.handSkeleton')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detected Letter + Button row */}
              <div className="flex items-center gap-2 relative z-10">
                <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-50 rounded-lg px-3 py-1 border border-blue-100 flex items-center gap-2 flex-1">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider whitespace-nowrap">{t('practiceFeedback.detecting')}</p>
                  <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-cyan-500">{currentLetter}</div>
                </div>
                <button
                  onClick={isStreaming ? stopCamera : startCamera}
                  className={`py-2 px-3 rounded-lg font-bold text-xs transition-all duration-200 flex items-center gap-1 whitespace-nowrap ${
                    isStreaming
                      ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-md shadow-red-500/30'
                      : isCameraLoading
                      ? 'bg-gray-400 text-white cursor-not-allowed opacity-80'
                      : 'bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white shadow-md shadow-blue-500/40'
                  }`}
                >
                  {isCameraLoading ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Camera size={13} />
                  )}
                  {isStreaming ? t('practiceFeedback.stopCamera') : t('practiceFeedback.startCamera')}
                </button>
              </div>

              {cameraError && (
                <div className="mt-1.5 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                  {cameraError}
                </div>
              )}

              <canvas ref={canvasRef} width="640" height="480" className="hidden" />
            </div>

            {/* Real-time Feedback Panel */}
            {selectedLetter && isStreaming && (
              <div className={`bg-white/90 backdrop-blur-xl rounded-xl shadow-lg overflow-hidden border ${
                realtimeFeedback?.isCorrect === true ? 'border-emerald-400' : 
                realtimeFeedback?.isCorrect === false ? 'border-amber-400' : 'border-blue-200'
              } transition-all duration-300`}>
                <div className={`px-3 py-1.5 text-white flex items-center justify-between bg-gradient-to-r ${
                  realtimeFeedback?.isCorrect === true ? 'from-emerald-500 to-teal-500' :
                  realtimeFeedback?.isCorrect === false ? 'from-amber-500 to-orange-500' :
                  'from-blue-600 via-sky-500 to-cyan-500'
                }`}>
                  <p className="text-[10px] font-bold opacity-90 uppercase tracking-widest">{t('practiceFeedback.performSign')}</p>
                  <div className="text-3xl font-black drop-shadow-md">{selectedLetter}</div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <div className={`w-1.5 h-1.5 rounded-full ${wsStatus === 'connected' ? 'bg-white' : wsStatus === 'connecting' ? 'bg-yellow-300 animate-pulse' : 'bg-red-300'}`}></div>
                    <span className="opacity-80">{wsStatus === 'connected' ? 'AI' : wsStatus === 'connecting' ? '...' : 'Off'}</span>
                  </div>
                </div>
                <div className="p-2">
                  {realtimeFeedback?.type === 'success' ? (
                    <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-2 text-center">
                      <div className="text-2xl mb-0.5">🎉</div>
                      <p className="font-bold text-emerald-700 text-xs">{t('practiceFeedback.correctSign')}</p>
                      <button onClick={nextLetter} className="mt-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-md font-bold text-xs">
                        <SkipForward className="w-3 h-3 inline mr-1" />{t('practiceFeedback.nextLetter')}
                      </button>
                    </div>
                  ) : realtimeFeedback?.type === 'correction' ? (
                    <div className="space-y-1.5">
                      <div className="bg-red-50 border border-red-300 rounded-lg p-2 flex items-start gap-1.5">
                        <span className="text-base">⚠️</span>
                        <p className="font-bold text-red-800 text-xs leading-tight">
                          {t('practiceFeedback.youAreShowing')} "{realtimeFeedback.detectedLetter}" → {t('practiceFeedback.butNeedToShow')} "{realtimeFeedback.targetLetter}"
                        </p>
                      </div>
                      {realtimeFeedback.corrections?.slice(0, 3).map((correction, idx) => (
                        <div key={idx} className={`rounded-lg p-2 border text-xs ${correction.priority === 'high' ? 'bg-red-50 border-red-200' : correction.priority === 'medium' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                          {(correction.finger || correction.title) && <p className="font-bold text-gray-800 uppercase text-[10px]">{correction.finger || correction.title}</p>}
                          {correction.issue && <p className="text-red-600 text-[10px]">❌ {correction.issue}</p>}
                          <p className="text-gray-700"><span className="font-semibold text-emerald-600">{t('practiceFeedback.fix')} </span>{correction.fix || correction.message || ''}</p>
                        </div>
                      ))}
                      {realtimeFeedback.targetGuidance?.steps && (
                        <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                          <p className="font-bold text-blue-900 text-[10px] mb-1">🎯 {t('practiceFeedback.guidanceForLetter')} "{realtimeFeedback.targetLetter}"</p>
                          <p className="text-blue-800 text-[10px] font-semibold mb-1">{realtimeFeedback.targetGuidance.shape}</p>
                          {realtimeFeedback.targetGuidance.steps.map((step, idx) => (
                            <div key={idx} className="flex gap-1 text-[10px] text-gray-700"><span className="text-cyan-500 font-bold">{idx + 1}.</span><span>{step}</span></div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : realtimeFeedback?.type === 'correcting' ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <ThumbsUp className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-emerald-700 text-xs">{realtimeFeedback.message}</span>
                      </div>
                      <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-200 rounded-full" style={{ width: `${realtimeFeedback.progress}%` }} />
                      </div>
                      <p className="text-[10px] text-emerald-600 mt-1">{Math.round(realtimeFeedback.progress)}%</p>
                    </div>
                  ) : realtimeFeedback?.type === 'waiting' ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center justify-center gap-1.5">
                      <Play className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-blue-700 text-xs">{realtimeFeedback.message}</span>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-2">
                      <Play className="w-5 h-5 mx-auto mb-1 opacity-50" />
                      <p className="text-xs">{t('practiceFeedback.bringHandToCamera')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-2">
            {/* Letter Guide */}
            {letterGuide && (
              <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg shadow-blue-200/30 overflow-hidden border border-blue-200/40">
                <div className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 p-2 text-white">
                  <h3 className="font-bold text-sm flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    {t('practiceFeedback.letterGuide')} {selectedLetter}
                  </h3>
                </div>
                <div className="p-2.5 space-y-2">
                  <div className="bg-blue-50/50 rounded-lg p-2 border border-blue-100">
                    <p className="text-blue-900 text-[10px] font-medium leading-relaxed">{letterGuide.description}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-700 mb-1 flex items-center gap-1 text-xs">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      {t('practiceFeedback.importantPoints')}:
                    </h4>
                    <div className="space-y-1">
                      {letterGuide.keyPoints?.map((point, idx) => (
                        <div key={idx} className={`p-1.5 rounded-md ${point.status === 'critical' ? 'bg-red-50 border border-red-100' : point.status === 'important' ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50 border border-gray-100'}`}>
                          <p className="text-[10px] text-gray-700">{point.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-red-600 mb-1 flex items-center gap-1 text-xs">
                      <AlertTriangle className="w-3 h-3" />
                      {t('practiceFeedback.commonMistakes')}:
                    </h4>
                    <div className="space-y-0.5">
                      {letterGuide.commonMistakes?.map((mistake, idx) => (
                        <div key={idx} className="flex items-start gap-1 text-[10px] text-gray-600">
                          <span className="text-red-400">•</span><span>{mistake}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Real-time Corrections Panel */}
            {isStreaming && realtimeFeedback?.corrections?.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 text-white">
                  <h3 className="font-bold text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {t('practiceFeedback.needsFix')} ({realtimeFeedback.corrections.length})
                  </h3>
                </div>
                <div className="p-2 space-y-1.5 max-h-48 overflow-y-auto">
                  {sortCorrectionsByPriority([...realtimeFeedback.corrections]).map((corr, idx) => {
                    const { borderColor, bgGradient } = getPriorityColors(corr.priority);
                    return (
                      <div key={idx} className={`border ${borderColor} bg-gradient-to-br ${bgGradient} p-1.5 rounded-lg`}>
                        <div className="font-bold text-gray-800 capitalize text-[10px]">{corr?.finger || t('practiceFeedback.finger')}</div>
                        <div className="text-[10px] text-gray-700 font-semibold">{corr?.issue || ''}</div>
                        <div className="text-[10px] text-gray-600 leading-relaxed">{corr?.fix || ''}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* History */}
            <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg shadow-blue-200/30 p-2.5 border border-blue-200/40">
              <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-1.5 text-sm">
                <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                {t('practiceFeedback.history')}
              </h3>
              {history.length === 0 ? (
                <div className="bg-blue-50/50 rounded-lg p-3 text-center border border-blue-100">
                  <p className="text-[10px] text-blue-600 font-medium">{t('practiceFeedback.noHistory')}</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {history.map((item, idx) => (
                    <div key={idx} className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-xs shadow-sm transition-transform hover:scale-110 ${
                      item.isCorrect ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white' : 'bg-gradient-to-br from-red-400 to-rose-500 text-white'
                    }`}>
                      {item.letter}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PracticeFeedbackPage;

