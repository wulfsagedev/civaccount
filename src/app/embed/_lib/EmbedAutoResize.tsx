'use client';

import { useEffect } from 'react';

/**
 * Posts iframe content height to the parent on mount + on resize/mutation
 * so publishers can auto-size the iframe without a companion script.
 *
 * Parent listens for `{ type: 'civaccount:resize', height }` messages.
 */
export default function EmbedAutoResize() {
  useEffect(() => {
    const post = () => {
      const height = document.documentElement.scrollHeight;
      try {
        window.parent.postMessage({ type: 'civaccount:resize', height }, '*');
      } catch {
        // cross-origin post is allowed; ignore failures
      }
    };

    post();

    const ro = new ResizeObserver(post);
    ro.observe(document.documentElement);

    const mo = new MutationObserver(post);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true });

    window.addEventListener('load', post);

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('load', post);
    };
  }, []);

  return null;
}
