'use client';

import { useState, useCallback } from 'react';
import { Share2, Check } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  variant?: 'icon' | 'full' | 'hero';
  /** Custom label for hero variant (default: "Share your council tax card") */
  label?: string;
}

export default function ShareButton({ title, text, url, variant = 'icon', label }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleShare = useCallback(async () => {
    // Try native share (mobile — opens WhatsApp, iMessage, etc.)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed — do nothing
    }
  }, [title, text, shareUrl]);

  // Hero: full-width CTA for the bill card
  if (variant === 'hero') {
    return (
      <button
        type="button"
        onClick={handleShare}
        className="flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-muted/30 hover:bg-muted transition-colors cursor-pointer min-h-[44px]"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-positive" aria-hidden="true" />
            <span className="type-body-sm font-semibold text-positive">Link copied</span>
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="type-body-sm font-semibold">{label || 'Share your council tax card'}</span>
          </>
        )}
      </button>
    );
  }

  // Full: inline button with "Share" label
  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer type-body-sm font-medium"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-positive" aria-hidden="true" />
            Link copied
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Share
          </>
        )}
      </button>
    );
  }

  // Icon: compact button with visible "Share" label
  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
      aria-label={copied ? 'Link copied' : `Share ${title}`}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-positive" aria-hidden="true" />
          <span className="type-caption text-positive">Copied</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="type-caption text-muted-foreground">Share</span>
        </>
      )}
    </button>
  );
}
