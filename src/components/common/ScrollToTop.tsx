import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop ensures that navigating to any new page resets the scroll position
 * to the top (0, 0), eliminating scroll offset carryover from previous pages.
 *
 * It prevents chain scrolling or unexpected scroll jumps when in-page search or filters change.
 * If a URL hash (#section-id) is present, it smoothly navigates to that target element.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();
  const prevPathnameRef = useRef<string>(pathname);

  useEffect(() => {
    if (hash) {
      const timeoutId = setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        }
      }, 50);
      return () => clearTimeout(timeoutId);
    }

    // Only scroll to top when transitioning to a different page route
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' as ScrollBehavior
      });
    }
  }, [pathname, hash]);

  return null;
};
