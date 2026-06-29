import { useState, useEffect, useRef } from 'react';
import { Camera, Volume2, Trash2, Copy, AlertCircle, CheckCircle2, Sparkles, Delete, ArrowLeft, ArrowRight, Space } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

const WS_URL = 'ws://127.0.0.1:8000/ws/predict';

const FreeRecognition = () => {
    const { t, lang } = useLanguage();

    const [isCameraActive, setIsCameraActive] = useState(false);
    const [sentence, setSentence] = useState('');
    const [currentLetter, setCurrentLetter] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false); // eslint-disable-line no-unused-vars
    const isListening = false; // eslint-disable-line no-unused-vars
    const [isHandPresent, setIsHandPresent] = useState(false);
    const [confidence, setConfidence] = useState(0);
    const [suggestions, setSuggestions] = useState([]);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [skeletonImage, setSkeletonImage] = useState(null);

    // Ref để lưu trữ giá trị mới nhất cho keyboard handler
    const sentenceRef = useRef('');
    const cursorRef = useRef(0);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const wsRef = useRef(null);
    const streamRef = useRef(null);
    const animationRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const cursorLockUntilRef = useRef(0);
    const isWaitingRef = useRef(false); // Thêm cờ để kiểm soát việc gửi frame

    // Load model
    useEffect(() => {
        const loadModel = async () => {
            try {
                const response = await fetch('http://localhost:8000/health');
                const data = await response.json();
                if (data.status === 'ok') {
                    console.log('[OK] AI Server connected');
                }
            } catch (err) {
                console.error('AI Server check error:', err);
            }
        };
        loadModel();
    }, []);

    // Start camera
    const startCamera = async () => {
        try {
            // Bỏ facingMode để canvas capture frame gốc
            // Backend sẽ flip frame như code gốc
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setIsCameraActive(true);
            connectWebSocket();
            toast.success(t('dashboard.cameraEnabled'));
        } catch (err) {
            console.error('Camera error:', err);
            toast.error(t('practice.freeRecognition.cameraAccessError'));
        }
    };

    // Stop camera
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
        }
        setIsCameraActive(false);
        setCurrentLetter('');
        setConfidence(0);
        setSkeletonImage(null);
    };

    // Connect WebSocket
    const connectWebSocket = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            return;
        }

        wsRef.current = new WebSocket(WS_URL);

        wsRef.current.onopen = () => {
            console.log('[OK] WebSocket connected');
        };

        wsRef.current.onmessage = (event) => {
            isWaitingRef.current = false; // Reset cờ khi nhận được phản hồi
            try {
                const data = JSON.parse(event.data);
                // Fix: use current_letter instead of letter
                if (data.current_letter !== undefined) {
                    setCurrentLetter(data.current_letter);
                    setConfidence(data.confidence || 0);
                }
                // Update sentence from server
                if (data.sentence !== undefined) {
                    setSentence(data.sentence);
                    // Chỉ cập nhật cursor nếu không bị lock
                    if (Date.now() >= cursorLockUntilRef.current) {
                        setCursorPosition(data.cursor_position !== undefined ? data.cursor_position : data.sentence.length);
                    }
                }
                // Update hand presence
                if (data.is_hand_present !== undefined) {
                    setIsHandPresent(data.is_hand_present);
                }
                // Update suggestions
                if (data.suggestions) {
                    setSuggestions(data.suggestions.filter(Boolean));
                }
                // Update skeleton image - clear when no hand
                if (data.skeleton_image) {
                    setSkeletonImage(data.skeleton_image);
                } else {
                    setSkeletonImage(null);
                }
            } catch (err) {
                console.error('WS message error:', err);
            }
        };

        wsRef.current.onerror = (err) => {
            console.error('WebSocket error:', err);
        };

        wsRef.current.onclose = () => {
            console.log('[INFO] WebSocket closed');
            if (isCameraActive && !wsRef.current) {
                reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
            }
        };
    };

    // Capture and send frame
    useEffect(() => {
        if (!isCameraActive) return;

        let lastSendTime = 0;
        const THROTTLE_MS = 50; // Tăng tốc độ lấy mẫu (20fps thay vì 10fps)

        const captureFrame = (timestamp) => {
            // Chỉ gửi frame mới nếu đã qua THROTTLE_MS VÀ server đã xử lý xong frame trước đó
            if (timestamp - lastSendTime >= THROTTLE_MS && !isWaitingRef.current) {
                if (videoRef.current && canvasRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    const ctx = canvasRef.current.getContext('2d');
                    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
                    const imageData = canvasRef.current.toDataURL('image/jpeg', 0.5);
                    isWaitingRef.current = true; // Đánh dấu đang chờ phản hồi
                    wsRef.current.send(JSON.stringify({ image: imageData }));
                    lastSendTime = timestamp;
                }
            }
            animationRef.current = requestAnimationFrame(captureFrame);
        };

        captureFrame(0);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isCameraActive]);

    // Send action to server
    const sendAction = (action, data = {}) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action, ...data }));
        }
    };

    // Delete character (backspace)
    const deleteChar = () => {
        cursorLockUntilRef.current = Date.now() + 500;
        if (cursorPosition > 0) {
            const newText = sentence.slice(0, cursorPosition - 1) + sentence.slice(cursorPosition);
            setSentence(newText);
            setCursorPosition(cursorPosition - 1);
            sendAction('delete_char');
        }
    };

    // Delete word
    const deleteWord = () => {
        cursorLockUntilRef.current = Date.now() + 500;
        const newText = sentence.slice(0, cursorPosition).trimEnd();
        const lastSpaceIndex = newText.lastIndexOf(' ');
        const cleanedText = lastSpaceIndex >= 0 ? sentence.slice(0, lastSpaceIndex) + sentence.slice(cursorPosition) : sentence.slice(cursorPosition);
        const newCursorPos = lastSpaceIndex >= 0 ? lastSpaceIndex : 0;
        setSentence(cleanedText);
        setCursorPosition(newCursorPos);
        sendAction('delete_word');
    };

    // Add space
    const addSpace = () => {
        cursorLockUntilRef.current = Date.now() + 500;
        const newText = sentence.slice(0, cursorPosition) + ' ' + sentence.slice(cursorPosition);
        setSentence(newText);
        setCursorPosition(cursorPosition + 1);
        sendAction('add_space');
    };

    // Move cursor left
    const moveCursorLeft = () => {
        cursorLockUntilRef.current = Date.now() + 500;
        if (cursorPosition > 0) {
            setCursorPosition(cursorPosition - 1);
            sendAction('set_cursor', { position: cursorPosition - 1 });
        }
    };

    // Move cursor right
    const moveCursorRight = () => {
        cursorLockUntilRef.current = Date.now() + 500;
        if (cursorPosition < sentence.length) {
            setCursorPosition(cursorPosition + 1);
            sendAction('set_cursor', { position: cursorPosition + 1 });
        }
    };

    // Apply suggestion
    const applySuggestion = (word) => {
        const trimmedWord = word.trim();
        if (trimmedWord) {
            const beforeCursor = sentence.slice(0, cursorPosition).trimEnd();
            const afterCursor = sentence.slice(cursorPosition);
            const newText = (beforeCursor ? beforeCursor + ' ' : '') + trimmedWord + ' ' + afterCursor;
            setSentence(newText);
            setCursorPosition((beforeCursor ? beforeCursor.length + 1 : 0) + trimmedWord.length + 1);
            sendAction('apply_suggestion', { word: trimmedWord });
        }
    };

    // Text to speech - sử dụng Web Speech API để phát âm ngay lập tức
    const speakText = () => {
        if (!sentence.trim() || isSpeaking) return;
        
        // Ngừng bất kỳ phát âm nào đang chạy
        speechSynthesis.cancel();
        
        // Phát âm ngay lập tức bằng Web Speech API - giọng nam trầm tiếng Anh
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = 'en-US';
        utterance.rate = 0.95;
        utterance.pitch = 1;
        
        // Không chỉ định giọng cụ thể, để hệ thống tự chọn giọng hay nhất
        
        setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        speechSynthesis.speak(utterance);
    };

    // Copy text
    const copyText = () => {
        navigator.clipboard.writeText(sentence);
        toast.success(t('dashboard.copiedSuccess'));
    };

    // Clear text
    const clearText = () => {
        cursorLockUntilRef.current = Date.now() + 300;
        setSentence('');
        setCursorPosition(0);
        sendAction('clear');
    };

    // Cập nhật refs khi state thay đổi
    useEffect(() => {
        sentenceRef.current = sentence;
        cursorRef.current = cursorPosition;
    }, [sentence, cursorPosition]);

    // Keyboard shortcuts - Chỉ cho phép điều khiển, không cho nhập chữ
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Chỉ intercept khi KHÔNG focus vào input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const currentSentence = sentenceRef.current;
            const currentCursor = cursorRef.current;

            // Chỉ xử lý các phím điều khiển, KHÔNG cho nhập chữ
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                cursorLockUntilRef.current = Date.now() + 2000;
                const newPos = Math.max(0, currentCursor - 1);
                setCursorPosition(newPos);
                sendAction('set_cursor', { position: newPos });
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                cursorLockUntilRef.current = Date.now() + 2000;
                const newPos = Math.min(currentSentence.length, currentCursor + 1);
                setCursorPosition(newPos);
                sendAction('set_cursor', { position: newPos });
            } else if (e.key === ' ') {
                e.preventDefault();
                cursorLockUntilRef.current = Date.now() + 2000;
                if (currentSentence.length > 0) {
                    const newText = currentSentence.slice(0, currentCursor) + ' ' + currentSentence.slice(currentCursor);
                    setSentence(newText);
                    setCursorPosition(currentCursor + 1);
                    sendAction('add_space');
                }
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                cursorLockUntilRef.current = Date.now() + 2000;
                if (currentCursor > 0) {
                    const newText = currentSentence.slice(0, currentCursor - 1) + currentSentence.slice(currentCursor);
                    setSentence(newText);
                    setCursorPosition(currentCursor - 1);
                    sendAction('delete_char');
                }
            } else if (e.key === 'Delete') {
                e.preventDefault();
                cursorLockUntilRef.current = Date.now() + 2000;
                if (currentCursor < currentSentence.length) {
                    const newText = currentSentence.slice(0, currentCursor) + currentSentence.slice(currentCursor + 1);
                    setSentence(newText);
                    sendAction('delete_forward_char');
                }
            }
            // Các phím khác (a-z, 0-9, etc.) - KHÔNG làm gì, để trình duyệt xử lý nhưng sẽ không có ô input nào focus
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    return (
        <div className="relative min-h-screen bg-transparent">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-blue-400/25 rounded-full blur-[120px] animate-pulse-glow"></div>
                <div className="absolute top-40 right-20 w-[400px] h-[400px] bg-sky-400/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-20 left-1/3 w-[350px] h-[350px] bg-cyan-400/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute inset-0 particle-grid opacity-40"></div>
                <div className="absolute top-32 right-1/4 w-4 h-4 bg-blue-500/40 rotate-45 animate-particle"></div>
                <div className="absolute top-48 left-1/4 w-6 h-6 bg-sky-400/50 rounded-full animate-particle" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-40 right-1/3 w-3 h-3 bg-cyan-400/50 rounded-full animate-particle" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-60 left-[60%] w-2 h-2 bg-blue-400/40 rounded-full animate-particle" style={{ animationDelay: '1.5s' }}></div>
            </div>
            <Header />

            <main className="pt-16 pb-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="text-center mb-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-3">
                            <Sparkles size={14} />
                            {t('nav.freeRecognition')}
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-blue-900 mb-2">
                            {t('dashboard.recognitionTitle')}
                            <span className="text-shimmer"> {t('dashboard.free')}</span>
                        </h1>
                        <p className="text-xs text-blue-700/70 max-w-2xl mx-auto">
                            {t('dashboard.recognitionDesc')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Cột trái: Camera + Skeleton */}
                        <div className="lg:col-span-2">
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-200/30 overflow-hidden border border-blue-200/40">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 px-4 py-3 relative overflow-hidden spotlight">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`}></div>
                                            <span className="text-white font-semibold text-sm">{t('dashboard.recognitionCamera')}</span>
                                            {isCameraActive && (
                                                <span className={`text-white/80 text-[10px] ${isHandPresent ? '' : 'text-yellow-300'}`}>
                                                    {isHandPresent ? `✓ ${t('practiceFeedback.handDetected')}` : `⟳ ${t('dashboard.waitForHand')}`}
                                                </span>
                                            )}
                                        </div>
                                        {isCameraActive && currentLetter && (
                                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                                                <span className="text-white/80 text-xs">{t('practiceFeedback.detecting')}: </span>
                                                <span className="text-white font-bold text-lg">{currentLetter}</span>
                                                <span className="text-white/60 text-[10px] ml-1">
                                                    {confidence > 0 ? `${Math.round(confidence * 100)}%` : '?'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Camera + Skeleton side by side - RIÊNG BIỆT */}
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-gray-200">
                                    {/* Camera */}
                                    <div className="relative aspect-video bg-gray-900 scan-effect">
                                        <video
                                            ref={videoRef}
                                            className={`w-full h-full object-cover ${isCameraActive ? '' : 'hidden'}`}
                                            style={{ transform: 'scaleX(-1)' }}
                                            playsInline
                                            muted
                                        />
                                        <canvas ref={canvasRef} className="hidden" width={640} height={480} />

                                        {!isCameraActive && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <Camera className="w-10 h-10 text-gray-400 mb-2" />
                                                <p className="text-gray-400 text-xs mb-2">{t('dashboard.cameraNotActive')}</p>
                                            </div>
                                        )}

                                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold text-white shadow bg-black/50">
                                            {t('dashboard.camera')}
                                        </div>
                                    </div>

                                    {/* Skeleton */}
                                    <div className="relative aspect-video bg-blue-50/50 holo-border">
                                        {skeletonImage ? (
                                            <img
                                                src={skeletonImage}
                                                alt="Hand Skeleton"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center">
                                                <div className="w-12 h-12 border-4 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-2">
                                                    <span className="text-xl">🖐️</span>
                                                </div>
                                                <p className="text-gray-400 text-xs">{t('dashboard.waitForSkeleton')}</p>
                                            </div>
                                        )}

                                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white shadow bg-black/50">
                                            {t('dashboard.skeleton')}
                                        </div>
                                    </div>
                                </div>

                                {/* Camera Controls */}
                                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                                    <div className="flex justify-center">
                                        <button
                                            onClick={isCameraActive ? stopCamera : startCamera}
                                            className={`px-6 py-2 rounded-lg font-semibold transition-all text-sm ${isCameraActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400 text-white neon-btn'}`}
                                        >
                                            {isCameraActive ? t('dashboard.stopCamera') : t('dashboard.startCamera')}
                                        </button>
                                    </div>
                                </div>

                                {/* Suggestions */}
                                {isCameraActive && suggestions.length > 0 && (
                                    <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
                                        <p className="text-[10px] text-blue-600 mb-1.5 font-medium">{t('dashboard.completionSuggestions')}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {suggestions.map((word, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => applySuggestion(word)}
                                                    className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-700 rounded-lg text-xs transition-all border border-blue-200 hover:border-blue-400"
                                                >
                                                    {word}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cột phải: Văn bản + Giọng nói */}
                        <div className="space-y-4">
                            {/* Văn bản nhận diện */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-200/30 p-4 border border-blue-200/40">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-blue-900 flex items-center gap-2 text-sm">
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                                        {t('dashboard.recognizedText')}
                                    </h3>
                                    <span className="text-[10px] text-blue-400/60">{sentence.length} {t('dashboard.characters')}</span>
                                </div>

                                {/* Ô hiển thị - read-only, con trỏ ở đây */}
                                <div
                                    className="min-h-20 p-3 bg-blue-50/50 rounded-xl border-2 border-blue-200/50 mb-3 cursor-text select-text overflow-auto"
                                    onClick={(e) => {
                                        if (e.target === e.currentTarget && sentence.length > 0) {
                                            cursorLockUntilRef.current = Date.now() + 500;
                                            setCursorPosition(sentence.length);
                                            sendAction('set_cursor', { position: sentence.length });
                                        }
                                    }}
                                >
                                    <p className="text-base text-gray-800 break-words leading-relaxed whitespace-pre-wrap">
                                        {sentence.split('').map((char, i) => (
                                            <span
                                                key={i}
                                                className={`inline-block ${
                                                    i === cursorPosition
                                                        ? 'bg-blue-300 border-b-2 border-blue-500 animate-pulse'
                                                        : ''
                                                } hover:bg-blue-100 cursor-pointer`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    cursorLockUntilRef.current = Date.now() + 2000;
                                                    setCursorPosition(i);
                                                    sendAction('set_cursor', { position: i });
                                                }}
                                            >
                                                {char === ' ' ? '\u00A0' : char}
                                            </span>
                                        ))}
                                        <span 
                                            className={`${
                                                cursorPosition === sentence.length 
                                                ? 'bg-blue-300 border-b-2 border-blue-500 animate-pulse' 
                                                : ''
                                            } inline-block w-1.5 h-4 hover:bg-blue-100 cursor-pointer`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                cursorLockUntilRef.current = Date.now() + 2000;
                                                setCursorPosition(sentence.length);
                                                sendAction('set_cursor', { position: sentence.length });
                                            }}
                                        >&nbsp;</span>
                                    </p>
                                    {sentence.length === 0 && (
                                        <p className="text-gray-400 italic text-xs">{t('dashboard.waitingForSign')}</p>
                                    )}
                                </div>

                                <div className="flex gap-1.5">
                                    <button onClick={speakText} disabled={!sentence.trim() || isSpeaking} className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 disabled:from-slate-300 disabled:to-slate-300 text-white font-medium rounded-lg neon-btn transition-all flex items-center justify-center gap-1.5 text-xs">
                                        <Volume2 size={14} />
                                        {isSpeaking ? t('dashboard.speakingNow') : t('dashboard.speak')}
                                    </button>
                                    <button onClick={copyText} disabled={!sentence.trim()} className="p-2 bg-blue-50 hover:bg-blue-100 disabled:bg-blue-50/30 text-blue-600 rounded-lg border border-blue-200/40 transition-all">
                                        <Copy size={14} />
                                    </button>
                                    <button onClick={clearText} disabled={!sentence.trim()} className="p-2 bg-blue-50 hover:bg-red-100 text-blue-600 hover:text-red-500 disabled:bg-blue-50/30 rounded-lg border border-blue-200/40 transition-all">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Điều khiển văn bản */}
                            <div className="bg-blue-50/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-200/30 p-4 border border-blue-200/40">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-blue-700 flex items-center gap-2 text-xs">
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                                        {t('dashboard.textControl')}
                                    </h3>
                                    <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                                        {t('dashboard.cursor')}: {cursorPosition} / {sentence.length}
                                    </span>
                                </div>

                                {/* Các nút điều khiển */}
                                <div className="grid grid-cols-4 gap-1.5 mb-2">
                                    <button onClick={moveCursorLeft} disabled={cursorPosition === 0} className="px-2 py-1.5 bg-blue-100 hover:bg-blue-200 disabled:bg-blue-50 disabled:text-blue-300 text-blue-700 rounded-lg transition-all flex items-center justify-center gap-0.5 text-xs font-medium">
                                        <ArrowLeft size={12} />
                                        <span>{t('dashboard.left')}</span>
                                    </button>
                                    <button onClick={moveCursorRight} disabled={cursorPosition >= sentence.length} className="px-2 py-1.5 bg-blue-100 hover:bg-blue-200 disabled:bg-blue-50 disabled:text-blue-300 text-blue-700 rounded-lg transition-all flex items-center justify-center gap-0.5 text-xs font-medium">
                                        <span>{t('dashboard.right')}</span>
                                        <ArrowRight size={12} />
                                    </button>
                                    <button onClick={addSpace} className="px-2 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-lg transition-all flex items-center justify-center gap-0.5 text-xs font-medium">
                                        <Space size={12} />
                                        <span>{t('dashboard.spaceKey')}</span>
                                    </button>
                                    <button onClick={deleteChar} disabled={cursorPosition === 0} className="px-2 py-1.5 bg-red-100 hover:bg-red-200 disabled:bg-red-50 disabled:text-red-300 text-red-600 rounded-lg transition-all flex items-center justify-center gap-0.5 text-xs font-medium">
                                        <Delete size={12} />
                                        <span>{t('dashboard.deleteChar')}</span>
                                    </button>
                                </div>

                                <div className="flex gap-1.5">
                                    <button onClick={() => {
                                        if (cursorPosition < sentence.length) {
                                            const newText = sentence.slice(0, cursorPosition) + sentence.slice(cursorPosition + 1);
                                            setSentence(newText);
                                            sendAction('delete_forward_char');
                                        }
                                    }} disabled={cursorPosition >= sentence.length} className="flex-1 px-2 py-1.5 bg-orange-100 hover:bg-orange-200 disabled:bg-orange-50 disabled:text-orange-300 text-orange-600 rounded-lg transition-all text-[10px] font-medium">
                                        {t('dashboard.deleteForward')}
                                    </button>
                                    <button onClick={deleteWord} disabled={sentence.trim().length === 0} className="flex-1 px-2 py-1.5 bg-blue-100 hover:bg-blue-200 disabled:bg-blue-50 disabled:text-blue-300 text-blue-600 rounded-lg transition-all text-[10px] font-medium">
                                        {t('dashboard.deleteWord')}
                                    </button>
                                    <button onClick={clearText} disabled={sentence.length === 0} className="flex-1 px-2 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-red-200 text-white rounded-lg transition-all text-[10px] font-medium">
                                        {t('dashboard.clearAll')}
                                    </button>
                                </div>
                            </div>

                            {/* Mẹo sử dụng */}
                            <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-3 border border-blue-200/40">
                                <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-1.5 text-xs">
                                    <AlertCircle size={14} />
                                    {t('dashboard.usageTips')}
                                </h4>
                                <ul className="space-y-1 text-[11px] text-gray-600">
                                    <li className="flex items-start gap-1.5">
                                        <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                        {t('dashboard.putHandInFrame')}
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                        {t('dashboard.holdHandStable')}
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                        {t('dashboard.useArrowKeys')}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default FreeRecognition;
