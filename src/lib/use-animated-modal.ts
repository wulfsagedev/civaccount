'use client';

import { useEffect, useState } from 'react';

/**
 * Drives enter/exit animations for custom modals (non-Radix).
 *
 * Returns:
 *   shouldRender — render the modal? (true while open OR during exit animation)
 *   dataState    — set on the modal's `data-state` attribute, paired with
 *                  tw-animate-css classes like `data-[state=open]:animate-in`
 *
 * Pattern:
 *   const { shouldRender, dataState } = useAnimatedModal(open);
 *   if (!shouldRender) return null;
 *   return <div data-state={dataState} ...>...</div>;
 *
 * Exit duration is 180ms — match the close duration in your animation classes.
 */
const EXIT_DURATION_MS = 180;

export function useAnimatedModal(open: boolean) {
  const [shouldRender, setShouldRender] = useState(open);
  // Always start "closed" so the first paint is the pre-animation state;
  // the rAF below then flips to "open" and triggers the enter animation.
  const [dataState, setDataState] = useState<'open' | 'closed'>('closed');

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      const id = requestAnimationFrame(() => setDataState('open'));
      return () => cancelAnimationFrame(id);
    }

    setDataState('closed');
    const t = setTimeout(() => setShouldRender(false), EXIT_DURATION_MS);
    return () => clearTimeout(t);
  }, [open]);

  return { shouldRender, dataState };
}
