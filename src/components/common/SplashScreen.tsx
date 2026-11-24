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
// Maximum 2.5s absolute ceiling (never wait longer than 2.5 seconds)
const MAX_TIMEOUT_MS = 2500;
// Minimum 1.1s display time so users catch the brand flight
const MIN_DISPLAY_MS = 1100;

export const SplashScreen: React.FC = () => {
  // Show splash only when necessary: on fresh session visit (or ?splash=1 to force)
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('nosplash') === '1') return false;
    if (params.get('splash') === '1') return true;

    try {
      const seen = sessionStorage.getItem('tbg_splash_seen');
      if (seen) return false;
    } catch {
      // Storage unavailable
    }
    return true;
  });

  const [frameIndex, setFrameIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const dismissedRef = useRef(false);

  const dismiss = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setIsFading(true);
    try {
      sessionStorage.setItem('tbg_splash_seen', 'true');
    } catch {
      // Ignore
    }
    // Clean, quick 400ms fade transition to grant instant access
    setTimeout(() => {
      setIsVisible(false);
    }, 400);
  };

  useEffect(() => {
    if (!isVisible) return;

    // Prevent background scrolling while splash is active
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    // 1. Preload background image into memory
    const bgImg = new Image();
    bgImg.src = '/splash-bg.jpg';

    // 2. Hardware-accelerated frame pacing with requestAnimationFrame
    // Eliminates mobile timer jitter, frame drops, and drift
    let animComplete = false;
    let startTime: number | null = null;
    let rafId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const currentIdx = Math.min(Math.floor(elapsed / FRAME_DURATION), FRAMES.length - 1);

      setFrameIndex(currentIdx);

      if (currentIdx >= FRAMES.length - 1) {
        animComplete = true;
      } else {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);

    // 3. Track page readiness (homepage resources load in background)
    let pageReady = document.readyState === 'complete';
    const onPageLoad = () => {
      pageReady = true;
      if (animComplete) {
        dismiss();
      }
    };

    if (!pageReady) {
      window.addEventListener('load', onPageLoad);
    }

    // 4. As soon as animation finishes AND page is ready, dismiss without delay
    const checkInterval = setInterval(() => {
      if (document.readyState === 'complete') {
        pageReady = true;
      }
      if (animComplete && pageReady) {
        clearInterval(checkInterval);
        dismiss();
      }
    }, 80);

    // 5. Min timer: if page is already loaded, dismiss promptly (~1.1s)
    const minTimer = setTimeout(() => {
      if (pageReady || document.readyState === 'complete') {
        dismiss();
      }
    }, MIN_DISPLAY_MS);

    // 6. Absolute safety cap: maximum 2.5s
    const maxTimer = setTimeout(() => {
      dismiss();
    }, MAX_TIMEOUT_MS);

    // 7. Allow instant bypass via tap/click or any keypress
    const handleKeyDown = () => dismiss();
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      cancelAnimationFrame(rafId);
      clearInterval(checkInterval);
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
      window.removeEventListener('load', onPageLoad);
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
      className={`fixed inset-0 z-[9999999] w-screen h-screen h-[100dvh] flex flex-col items-center justify-center bg-white bg-cover bg-center bg-no-repeat transition-opacity duration-400 ease-out select-none cursor-pointer ${isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
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
              className={`absolute inset-0 w-full h-full object-contain pointer-events-none will-change-[opacity] ${idx === frameIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              loading="eager"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
