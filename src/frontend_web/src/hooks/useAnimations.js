import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Mouse Position Tracker Hook
 * Tracks mouse position with smooth interpolation
 * Lazy rAF: chỉ chạy khi chuột di chuyển
 */
export const useMousePosition = (options = {}) => {
    const { throttleMs = 16 } = options;

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0, targetX: 0, targetY: 0 });
    const [isClicking, setIsClicking] = useState(false);
    const frameRef = useRef(null);
    const lastUpdateRef = useRef(0);
    const targetRef = useRef({ x: 0, y: 0 });
    const currentRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const animate = () => {
            const dx = targetRef.current.x - currentRef.current.x;
            const dy = targetRef.current.y - currentRef.current.y;
            if (Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) {
                frameRef.current = null;
                return;
            }
            currentRef.current.x += dx * 0.15;
            currentRef.current.y += dy * 0.15;
            setMousePosition({
                x: currentRef.current.x,
                y: currentRef.current.y,
                targetX: targetRef.current.x,
                targetY: targetRef.current.y,
            });
            frameRef.current = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e) => {
            const now = Date.now();
            if (now - lastUpdateRef.current < throttleMs) return;
            lastUpdateRef.current = now;
            targetRef.current = { x: e.clientX, y: e.clientY };
            if (!frameRef.current) frameRef.current = requestAnimationFrame(animate);
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            if (frameRef.current) { cancelAnimationFrame(frameRef.current); frameRef.current = null; }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [throttleMs]);

    return { ...mousePosition, isClicking, trail: [] };
};

/**
 * Element-specific mouse tracking - MAXIMUM 3D TILT
 * Returns transform values for ultra 3D tilt effects
 */
export const useElementMouseTrack = (elementRef, options = {}) => {
    const { 
        maxRotationX = 15,  // Increased from 10
        maxRotationY = 15,  // Increased from 10
        perspective = 1200, // Increased from 1000
        translateStrength = 8, // Increased from 5
        enabled = true,
        smoothing = 0.12 // Smoother follow
    } = options;
    
    const [transform, setTransform] = useState({
        rotateX: 0,
        rotateY: 0,
        translateX: 0,
        translateY: 0,
        scale: 1
    });
    
    const frameRef = useRef(null);
    const currentTransform = useRef(transform);
    
    useEffect(() => {
        if (!elementRef?.current || !enabled) return;
        
        const element = elementRef.current;
        
        const handleMouseMove = (e) => {
            if (frameRef.current) return;
            
            frameRef.current = requestAnimationFrame(() => {
                frameRef.current = null;
                
                const rect = element.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                // Calculate position relative to element center (0 to 1)
                const relativeX = (e.clientX - centerX) / (rect.width / 2);
                const relativeY = (e.clientY - centerY) / (rect.height / 2);
                
                // Calculate rotation based on mouse position - MAXIMUM
                const rotateY = relativeX * maxRotationY;
                const rotateX = -relativeY * maxRotationX; // Inverted for natural feel
                
                // Stronger translation for magnetic effect
                const translateX = relativeX * translateStrength;
                const translateY = relativeY * translateStrength;
                
                const newTransform = {
                    rotateX,
                    rotateY,
                    translateX,
                    translateY,
                    scale: 1.03 // Slight scale on hover
                };
                
                currentTransform.current = newTransform;
                setTransform(newTransform);
            });
        };
        
        const handleMouseLeave = () => {
            // Smooth return to center with spring effect
            setTransform({
                rotateX: 0,
                rotateY: 0,
                translateX: 0,
                translateY: 0,
                scale: 1
            });
        };
        
        const handleMouseEnter = () => {
            setTransform(prev => ({ ...prev, scale: 1.03 }));
        };
        
        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseleave', handleMouseLeave);
        element.addEventListener('mouseenter', handleMouseEnter);
        
        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
            element.removeEventListener('mousemove', handleMouseMove);
            element.removeEventListener('mouseleave', handleMouseLeave);
            element.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, [elementRef, maxRotationX, maxRotationY, perspective, translateStrength, enabled]);
    
    return {
        transform,
        transformStyle: `perspective(${perspective}px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) translateX(${transform.translateX}px) translateY(${transform.translateY}px) scale(${transform.scale})`
    };
};

/**
 * Scroll position tracker
 */
export const useScrollPosition = () => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const [scrollY, setScrollY] = useState(0);
    const [scrollDirection, setScrollDirection] = useState('down');
    const lastScrollY = useRef(0);
    
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = documentHeight > 0 ? currentScrollY / documentHeight : 0;
            
            setScrollY(currentScrollY);
            setScrollProgress(Math.min(1, Math.max(0, progress)));
            setScrollDirection(currentScrollY > lastScrollY.current ? 'down' : 'up');
            lastScrollY.current = currentScrollY;
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    return { scrollY, scrollProgress, scrollDirection };
};

/**
 * Intersection Observer for scroll reveal animations - MAXIMUM POWER
 */
export const useInView = (options = {}) => {
    const { threshold = 0.15, rootMargin = '-50px', triggerOnce = true } = options;
    const [isInView, setIsInView] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);
    const ref = useRef(null);
    
    useEffect(() => {
        if (!ref.current) return;
        
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    if (triggerOnce) {
                        setHasAnimated(true);
                    }
                } else if (!triggerOnce) {
                    setIsInView(false);
                }
            },
            { threshold, rootMargin }
        );
        
        observer.observe(ref.current);
        
        return () => observer.disconnect();
    }, [threshold, rootMargin, triggerOnce]);
    
    return { ref, isInView: triggerOnce ? isInView || hasAnimated : isInView };
};

/**
 * Scroll-triggered animation hook
 */
export const useScrollTrigger = (options = {}) => {
    const { threshold = 0.2, rootMargin = '0px' } = options;
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);
    
    useEffect(() => {
        if (!ref.current) return;
        
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold, rootMargin }
        );
        
        observer.observe(ref.current);
        
        return () => observer.disconnect();
    }, [threshold, rootMargin]);
    
    return { ref, isVisible };
};

/**
 * Counter animation hook
 */
export const useCounter = (endValue, options = {}) => {
    const { duration = 2000, start = 0, triggerOnView = true } = options;
    const [count, setCount] = useState(start);
    const [hasStarted, setHasStarted] = useState(false);
    const ref = useRef(null);
    
    useEffect(() => {
        if (triggerOnView && !ref.current) return;
        
        if (triggerOnView) {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting && !hasStarted) {
                        setHasStarted(true);
                    }
                },
                { threshold: 0.5 }
            );
            
            observer.observe(ref.current);
            return () => observer.disconnect();
        } else {
            setHasStarted(true);
        }
    }, [triggerOnView, hasStarted]);
    
    useEffect(() => {
        if (!hasStarted) return;
        
        const startTime = Date.now();
        const startVal = start;
        const endVal = endValue;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startVal + (endVal - startVal) * eased);
            
            setCount(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }, [hasStarted, endValue, duration, start]);
    
    return { count, ref };
};

/**
 * Reduced motion check hook for accessibility
 */
export const useReducedMotion = () => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);
        
        const handler = (e) => setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);
    
    return prefersReducedMotion;
};

/**
 * Magnetic button effect hook
 */
export const useMagneticEffect = (elementRef, options = {}) => {
    const { strength = 0.3, enabled = true } = options;
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const frameRef = useRef(null);
    
    useEffect(() => {
        if (!elementRef?.current || !enabled) return;
        
        const element = elementRef.current;
        
        const handleMouseMove = (e) => {
            if (frameRef.current) return;
            
            frameRef.current = requestAnimationFrame(() => {
                frameRef.current = null;
                
                const rect = element.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const deltaX = (e.clientX - centerX) * strength;
                const deltaY = (e.clientY - centerY) * strength;
                
                setPosition({ x: deltaX, y: deltaY });
            });
        };
        
        const handleMouseLeave = () => {
            setPosition({ x: 0, y: 0 });
        };
        
        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseleave', handleMouseLeave);
        
        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
            element.removeEventListener('mousemove', handleMouseMove);
            element.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [elementRef, strength, enabled]);
    
    return position;
};


/* ═══════════════════════════════════════════════════════════════════════
   NEW HOOKS 2026 — Spline + GSAP + Apple + Stripe style
   Additive only — không thay thế hooks hiện tại
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * useScrollReveal — IntersectionObserver thực sự (GSAP ScrollTrigger style)
 * Thêm class 'in-view' khi element vào viewport
 * Dùng với CSS classes: .scroll-reveal, .scroll-reveal-left, .scroll-reveal-scale
 */
export const useScrollReveal = (options = {}) => {
    const { threshold = 0.12, rootMargin = '-40px', once = true } = options;
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('in-view');
                    if (once) observer.disconnect();
                } else if (!once) {
                    el.classList.remove('in-view');
                }
            },
            { threshold, rootMargin }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold, rootMargin, once]);

    return ref;
};

/**
 * useScrollRevealAll — Áp dụng IntersectionObserver cho nhiều elements cùng lúc
 * Dùng: useScrollRevealAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-scale', options, containerRef)
 */
export const useScrollRevealAll = (selector = '.scroll-reveal', options = {}, containerRef = null) => {
    const { threshold = 0.1, rootMargin = '-30px', once = true } = options;
    const internalRef = useRef(null);

    useEffect(() => {
        // Delay nhỏ để DOM render xong trước khi query
        const timer = setTimeout(() => {
            const container = containerRef?.current || internalRef.current || document;
            const elements = container.querySelectorAll(selector);
            if (!elements.length) return;

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('in-view');
                            if (once) observer.unobserve(entry.target);
                        } else if (!once) {
                            entry.target.classList.remove('in-view');
                        }
                    });
                },
                { threshold, rootMargin }
            );
            elements.forEach(el => observer.observe(el));
            return () => observer.disconnect();
        }, 100);

        return () => clearTimeout(timer);
    }, [selector, threshold, rootMargin, once]);

    return internalRef;
};

/**
 * useMagicCard — Mouse-following spotlight glow (Stripe/Linear/Vercel style)
 * Sets CSS vars --mouse-x, --mouse-y (%) and --glare-x, --glare-y (%) on element
 */
export const useMagicCard = (elementRef, options = {}) => {
    const { enabled = true } = options;
    const frameRef = useRef(null);

    useEffect(() => {
        const el = elementRef?.current;
        if (!el || !enabled) return;

        const handleMouseMove = (e) => {
            if (frameRef.current) return;
            frameRef.current = requestAnimationFrame(() => {
                frameRef.current = null;
                const rect = el.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                el.style.setProperty('--mouse-x', `${x}%`);
                el.style.setProperty('--mouse-y', `${y}%`);
                el.style.setProperty('--glare-x', `${x}%`);
                el.style.setProperty('--glare-y', `${y}%`);
            });
        };
        const handleMouseLeave = () => {
            el.style.setProperty('--mouse-x', '50%');
            el.style.setProperty('--mouse-y', '50%');
        };

        el.addEventListener('mousemove', handleMouseMove, { passive: true });
        el.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            el.removeEventListener('mousemove', handleMouseMove);
            el.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [elementRef, enabled]);
};

/**
 * useMagicCardAll — Áp dụng magic card effect cho tất cả .magic-card-glow trong container
 * Optimized: cache card list, chỉ re-query khi cần
 */
export const useMagicCardAll = (containerRef, options = {}) => {
    const { enabled = true, selector = '.magic-card-glow' } = options;
    const frameRef = useRef(null);
    const cardsRef = useRef([]);

    useEffect(() => {
        const container = containerRef?.current || document;
        if (!enabled) return;

        // Cache card list sau khi DOM render xong, refresh mỗi 2s để bắt card mới
        const refreshCards = () => {
            cardsRef.current = Array.from(container.querySelectorAll(selector));
        };
        refreshCards();
        const refreshInterval = setInterval(refreshCards, 2000);

        const handleMouseMove = (e) => {
            if (frameRef.current) return;
            frameRef.current = requestAnimationFrame(() => {
                frameRef.current = null;
                cardsRef.current.forEach(card => {
                    const rect = card.getBoundingClientRect();
                    // Bỏ qua card ngoài viewport
                    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    card.style.setProperty('--mouse-x', `${x}%`);
                    card.style.setProperty('--mouse-y', `${y}%`);
                    card.style.setProperty('--glare-x', `${x}%`);
                    card.style.setProperty('--glare-y', `${y}%`);
                });
            });
        };

        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => {
            clearInterval(refreshInterval);
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, [containerRef, enabled, selector]);
};

/**
 * useTypewriter — Typewriter effect hook
 * @param {string[]} words - Array of strings to cycle through
 * @param {number} typeSpeed - ms per character when typing
 * @param {number} deleteSpeed - ms per character when deleting
 * @param {number} pauseMs - ms to pause after full word typed
 */
export const useTypewriter = (words = [], options = {}) => {
    const { typeSpeed = 80, deleteSpeed = 45, pauseMs = 1800, loop = true } = options;
    const [displayText, setDisplayText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [wordIndex, setWordIndex] = useState(0);
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (!words.length) return;
        const currentWord = words[wordIndex % words.length];

        const tick = () => {
            if (!isDeleting) {
                // Typing
                if (displayText.length < currentWord.length) {
                    setDisplayText(currentWord.slice(0, displayText.length + 1));
                    timeoutRef.current = setTimeout(tick, typeSpeed);
                } else {
                    // Pause then start deleting
                    timeoutRef.current = setTimeout(() => setIsDeleting(true), pauseMs);
                }
            } else {
                // Deleting
                if (displayText.length > 0) {
                    setDisplayText(currentWord.slice(0, displayText.length - 1));
                    timeoutRef.current = setTimeout(tick, deleteSpeed);
                } else {
                    setIsDeleting(false);
                    if (loop || wordIndex < words.length - 1) {
                        setWordIndex(prev => (prev + 1) % words.length);
                    }
                }
            }
        };

        timeoutRef.current = setTimeout(tick, isDeleting ? deleteSpeed : typeSpeed);
        return () => clearTimeout(timeoutRef.current);
    }, [displayText, isDeleting, wordIndex, words, typeSpeed, deleteSpeed, pauseMs, loop]);

    return displayText;
};

/**
 * useRipple — Ripple click effect
 * Returns: { ripples, addRipple } — addRipple(e) gọi khi onClick
 */
export const useRipple = () => {
    const [ripples, setRipples] = useState([]);

    const addRipple = useCallback((e) => {
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now() + Math.random();

        setRipples(prev => [...prev, { id, x, y }]);
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== id));
        }, 600);
    }, []);

    return { ripples, addRipple };
};

/**
 * useMouseParallax — Sets CSS vars --mx, --my (normalized -1 to 1) on element
 * Dùng với .parallax-mouse-layer-1/2/3 classes
 * Lazy rAF: chỉ chạy khi chuột di chuyển, dừng khi đã settle
 */
export const useMouseParallax = (containerRef, options = {}) => {
    const { enabled = true, smoothing = 0.08 } = options;
    const frameRef = useRef(null);
    const targetRef = useRef({ x: 0, y: 0 });
    const currentRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!enabled) return;
        const container = containerRef?.current || document.documentElement;

        const animate = () => {
            const dx = targetRef.current.x - currentRef.current.x;
            const dy = targetRef.current.y - currentRef.current.y;

            if (Math.abs(dx) < 0.0005 && Math.abs(dy) < 0.0005) {
                frameRef.current = null;
                return;
            }

            currentRef.current.x += dx * smoothing;
            currentRef.current.y += dy * smoothing;
            container.style.setProperty('--mx', currentRef.current.x.toFixed(4));
            container.style.setProperty('--my', currentRef.current.y.toFixed(4));
            frameRef.current = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e) => {
            targetRef.current = {
                x: (e.clientX / window.innerWidth) * 2 - 1,
                y: (e.clientY / window.innerHeight) * 2 - 1,
            };
            if (!frameRef.current) {
                frameRef.current = requestAnimationFrame(animate);
            }
        };

        document.addEventListener('mousemove', handleMouseMove, { passive: true });

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            if (frameRef.current) { cancelAnimationFrame(frameRef.current); frameRef.current = null; }
        };
    }, [containerRef, enabled, smoothing]);
};
