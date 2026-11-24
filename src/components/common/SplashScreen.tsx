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

// 130ms per frame provides a brisk ~1.17s flight animation
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
    document.body.style.overflow = 'hidden';

    // 1. Eagerly preload all frame images
    FRAMES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    // 2. Step through frames 0 -> 8
    let animComplete = false;
    const frameInterval = setInterval(() => {
      setFrameIndex((prev) => {
        if (prev < FRAMES.length - 1) {
          return prev + 1;
        }
        animComplete = true;
        clearInterval(frameInterval);
        return prev;
      });
    }, FRAME_DURATION);

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
      clearInterval(frameInterval);
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
      className={`fixed inset-0 z-[9999999] flex items-center justify-center bg-white bg-cover bg-center bg-no-repeat transition-opacity duration-400 ease-out select-none cursor-pointer ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundImage: `url('/splash-bg.jpg')`,
        touchAction: 'none',
        overscrollBehavior: 'contain'
      }}
    >
      {/* Centered Animation on Travel Pattern Background - Mobile & Desktop responsive */}
      <div className="relative z-10 w-[280px] sm:w-[340px] md:w-[380px] lg:w-[420px] max-w-[88vw] -translate-y-6 sm:-translate-y-10 lg:-translate-y-12 flex items-center justify-center mx-auto transition-transform pointer-events-none">
        <img
          src={FRAMES[frameIndex]}
          alt={`Trip By Genie Loading Frame ${frameIndex + 1}`}
          className="w-full h-auto object-contain select-none pointer-events-none"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  );
};
