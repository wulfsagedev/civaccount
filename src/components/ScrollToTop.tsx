'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollToTop() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Only scroll if pathname actually changed (not on initial mount with same path)
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;

      // Use multiple methods for cross-browser compatibility
      // Immediate scroll
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

      // Fallback for mobile Safari which can be delayed
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    }
  }, [pathname]);

  return null;
}
