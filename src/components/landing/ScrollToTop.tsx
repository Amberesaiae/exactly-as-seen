import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Lean UX Utility: ScrollToTop
 * Ensures that navigating between landing sub-pages always starts at the top.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
