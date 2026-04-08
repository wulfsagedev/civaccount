'use client';

import { useState, useCallback } from 'react';
import { Share2, Check, Loader2, Download } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  /** API route URL for image generation (e.g. /api/share/kent/your-bill?format=story) */
  imageUrl?: string;
  variant?: 'icon' | 'full' | 'hero';
  /** Custom label for hero variant (default: "Share your council tax card") */
  label?: string;
  /** Show preview is no longer used — kept for API compat */
  showPreview?: boolean;
}

type ShareResult = 'shared-native' | 'copied-url' | 'downloaded' | 'failed';

function ShareIcon({ state }: { state: 'idle' | 'loading' | 'success' }) {
  if (state === 'loading') {
    return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" aria-hidden="true" />;
  }

  return (
    <span className="relative inline-flex items-center justify-center w-4 h-4" aria-hidden="true">
      <Share2
        className="h-4 w-4 text-muted-foreground absolute inset-0 transition-all duration-200 ease-out"
        style={{
          opacity: state === 'success' ? 0 : 1,
          transform: state === 'success' ? 'scale(0.6)' : 'scale(1)',
        }}
      />
      <Check
        className="h-4 w-4 text-positive absolute inset-0 transition-all duration-200 ease-out"
        style={{
          opacity: state === 'success' ? 1 : 0,
          transform: state === 'success' ? 'scale(1)' : 'scale(0.6)',
        }}
      />
    </span>
  );
}

function resultLabel(result: ShareResult): string {
  switch (result) {
    case 'copied-url': return 'Link copied';
    case 'downloaded': return 'Image saved';
    default: return '';
  }
}

export default function ShareButton({ title, text, url, imageUrl, variant = 'icon', label }: ShareButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [feedback, setFeedback] = useState('');

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // Primary action: share the URL (instant, no image fetch needed)
  // OG images handle the visual preview in WhatsApp/iMessage/Slack automatically
  const handleShare = useCallback(async () => {
    // Level 1: Native share (mobile — opens WhatsApp, iMessage, etc. instantly)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return; // native share handles its own feedback
      } catch {
        // User cancelled — fall through to clipboard
      }
    }

    // Level 2: Copy URL to clipboard (desktop)
    try {
      await navigator.clipboard.writeText(shareUrl);
      setState('success');
      setFeedback('Link copied');
      setTimeout(() => { setState('idle'); setFeedback(''); }, 2000);
    } catch {
      // Clipboard failed
    }
  }, [title, text, shareUrl]);

  // Secondary action: download the share image
  const handleDownload = useCallback(async () => {
    if (!imageUrl) return;
    setState('loading');
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'civaccount-share.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      setState('success');
      setFeedback('Image saved');
      setTimeout(() => { setState('idle'); setFeedback(''); }, 2000);
    } catch {
      setState('idle');
    }
  }, [imageUrl]);

  const isSuccess = state === 'success';

  // Hero: full-width CTA with optional download button
  if (variant === 'hero') {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleShare}
          disabled={state === 'loading'}
          className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted transition-colors cursor-pointer min-h-[44px] disabled:opacity-60"
        >
          <ShareIcon state={state} />
          <span className={`type-body-sm font-semibold ${isSuccess ? 'text-positive' : ''}`}>
            {feedback || label || 'Share'}
          </span>
        </button>
        {imageUrl && (
          <button
            type="button"
            onClick={handleDownload}
            disabled={state === 'loading'}
            className="flex items-center justify-center gap-2 px-4 p-3 rounded-lg bg-muted/30 hover:bg-muted transition-colors cursor-pointer min-h-[44px] disabled:opacity-60"
            aria-label="Download share image"
          >
            <Download className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }

  // Full: inline button with "Share" label
  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleShare}
        disabled={state === 'loading'}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer type-body-sm font-medium disabled:opacity-60"
      >
        <ShareIcon state={state} />
        {feedback || 'Share'}
      </button>
    );
  }

  // Icon: compact button with visible "Share" label
  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={state === 'loading'}
      className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer disabled:opacity-60"
      aria-label={feedback || `Share ${title}`}
    >
      <ShareIcon state={state} />
      <span className={`type-caption ${isSuccess ? 'text-positive' : 'text-muted-foreground'}`}>
        {feedback || 'Share'}
      </span>
    </button>
  );
}
