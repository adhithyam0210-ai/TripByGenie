import React, { useState, useEffect, useRef } from 'react';

const FRAMES = [
  '/splash_frames/frame_0.png',
  '/splash_frames/frame_1.png',
  '/splash_frames/frame_2.png',
  '/splash_frames/frame_3.png',
  '/splash_frames/frame_4.png',
  '/splash_frames/frame_5.png',
  '/splash_frames/frame_6.png',
  '/splash_frames/frame_7.png',
  '/splash_frames/frame_8.png'
];

// 130ms per frame provides a silky ~1.17s flight animation
const FRAME_DURATION = 130;
// Maximum 6.5s absolute ceiling (safety in case a remote image connection hangs)
const MAX_TIMEOUT_MS = 6500;
// Splash screen appears ONLY if page load takes longer than 500ms
const APPEAR_DELAY_MS = 500;

export const SplashScreen: React.FC = () => {
  // Initially false: only appears if the page load takes longer than 500ms
  const [isVisible, setIsVisible] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const dismissedRef = useRef(false);
  const pageReadyRef = useRef(false);

  // Helper to check if page structure and card images are completely loaded and visible
  const checkPageReady = (): boolean => {
    if (typeof document === 'undefined') return false;

    // Structure check: main content or root container mounted
    const main = document.querySelector('main') || document.getElementById('root');
    if (!main) return false;

    // Query all content images excluding splash screen itself
    const imgs = Array.from(document.querySelectorAll('img')).filter((img) => {
      return !img.closest('[role="dialog"]') && !img.src.includes('splash');
    });

    // If there are content images, verify critical visible cards have loaded
    if (imgs.length > 0) {
      const criticalCards = imgs.slice(0, 10);
      const allLoaded = criticalCards.every((img) => {
        return img.complete && (img.naturalWidth > 0 || img.naturalHeight > 0);
      });
      return allLoaded;
    }

    return true;
  };

  const dismiss = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setIsFading(true);
    // Clean, quick 400ms fade transition to grant instant access to fully rendered page
    setTimeout(() => {
      setIsVisible(false);
    }, 400);
  };

  // Phase 1: Check page readiness and only trigger splash if page load exceeds 500ms
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Allow manual bypass via URL parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('nosplash') === '1') {
      dismissedRef.current = true;
      return;
    }

    // Preload background image into memory early so if splash appears, it renders instantly
    const bgImg = new Image();
    bgImg.src = '/splash-bg.jpg';

    // Monitor page readiness early
    const earlyCheckInterval = setInterval(() => {
      if (checkPageReady()) {
        pageReadyRef.current = true;
      }
    }, 50);

    // Only appear if the page load takes longer than 500ms
    const appearTimer = setTimeout(() => {
      clearInterval(earlyCheckInterval);
      // If page is already completely loaded within 500ms, do NOT show splash
      if (checkPageReady() || pageReadyRef.current) {
        dismissedRef.current = true;
        return;
      }

      // Page load took longer than 500ms -> show the splash screen
      setIsVisible(true);
    }, APPEAR_DELAY_MS);

    return () => {
      clearTimeout(appearTimer);
      clearInterval(earlyCheckInterval);
    };
  }, []);

  // Phase 2: Active splash screen lifecycle (runs only when isVisible is true)
  useEffect(() => {
    if (!isVisible || dismissedRef.current) return;

    // Prevent background scrolling while splash is active
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    // Hardware-accelerated continuous frame pacing with requestAnimationFrame
    // Loops continuously until cards, images, and structure are completely loaded
    let animCompletedOnce = false;
    let startTime: number | null = null;
    let rafId: number;

    const totalCycleDuration = FRAME_DURATION * FRAMES.length;

    const animate = (timestamp: number) => {
      if (dismissedRef.current) return;
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // Continuously loop through all frames seamlessly
      const currentIdx = Math.floor(elapsed / FRAME_DURATION) % FRAMES.length;
      setFrameIndex(currentIdx);

      // Verify at least one full flight animation cycle has completed
      if (elapsed >= totalCycleDuration) {
        animCompletedOnce = true;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    // Poll readiness: once animation has completed at least one full cycle AND cards/images are loaded, dismiss
    const checkInterval = setInterval(() => {
      if (animCompletedOnce && checkPageReady()) {
        clearInterval(checkInterval);
        dismiss();
      }
    }, 60);

    // Absolute safety cap (max 6.5s in case a remote image connection hangs)
    const maxTimer = setTimeout(() => {
      dismiss();
    }, MAX_TIMEOUT_MS);

    // Allow instant bypass via tap/click or any keypress
    const handleKeyDown = () => dismiss();
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      cancelAnimationFrame(rafId);
      clearInterval(checkInterval);
      clearTimeout(maxTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Trip By Genie Loading"
      onPointerDown={dismiss}
      className={`fixed inset-0 z-[9999999] w-screen h-screen h-[100dvh] flex flex-col items-center justify-center bg-white bg-cover bg-center bg-no-repeat transition-opacity duration-400 ease-out animate-in fade-in select-none cursor-pointer ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundImage: `url('/splash-bg.jpg')`,
        touchAction: 'none',
        overscrollBehavior: 'contain'
      }}
    >
      {/* 
        Optimal Mobile & Desktop Alignment:
        - Locked aspect ratio (506/335) completely prevents any layout jitter or image pop-in.
        - Stacked <img> layers are GPU-composited with will-change-[opacity], running at full 60fps on mobile.
        - Balanced optical centering (-translate-y-4 on mobile, -translate-y-8 on desktop).
      */}
      <div className="relative z-10 w-full max-w-[270px] xs:max-w-[300px] sm:max-w-[360px] md:max-w-[400px] px-4 -translate-y-4 sm:-translate-y-8 flex items-center justify-center mx-auto pointer-events-none">
        <div className="relative w-full aspect-[506/335]">
          {FRAMES.map((src, idx) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`absolute inset-0 w-full h-full object-contain pointer-events-none will-change-[opacity] ${
                idx === frameIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
              loading="eager"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
