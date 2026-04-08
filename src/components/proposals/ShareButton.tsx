'use client';

import { useState, useCallback } from 'react';
import { Share2, Check, Loader2, Download } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  imageUrl?: string;
  variant?: 'icon' | 'full' | 'hero';
  label?: string;
  showPreview?: boolean;
}

const shareStyles = {
  idle: {
    backgroundColor: 'var(--share-accent-bg)',
    color: 'var(--share-accent)',
  },
  success: {},
} as const;

function ShareIcon({ state }: { state: 'idle' | 'loading' | 'success' }) {
  if (state === 'loading') {
    return <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--share-accent)' }} aria-hidden="true" />;
  }

  return (
    <span className="relative inline-flex items-center justify-center w-4 h-4" aria-hidden="true">
      <Share2
        className="h-4 w-4 absolute inset-0 transition-all duration-200 ease-out"
        style={{
          color: 'var(--share-accent)',
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

export default function ShareButton({ title, text, url, imageUrl, variant = 'icon', label }: ShareButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [feedback, setFeedback] = useState('');

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch { /* user cancelled */ }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setState('success');
      setFeedback('Link copied');
      setTimeout(() => { setState('idle'); setFeedback(''); }, 2000);
    } catch { /* clipboard failed */ }
  }, [title, text, shareUrl]);

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
  const btnStyle = isSuccess ? shareStyles.success : shareStyles.idle;

  // Hero: pill style CTA with download option
  if (variant === 'hero') {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleShare}
          disabled={state === 'loading'}
          className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-colors cursor-pointer min-h-[44px] disabled:opacity-60"
          style={btnStyle}
        >
          {isSuccess ? (
            <>
              <Check className="h-4 w-4 text-positive" aria-hidden="true" />
              <span className="type-body-sm font-semibold text-positive">{feedback}</span>
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" aria-hidden="true" />
              <span className="type-body-sm font-semibold">{label || 'Share'}</span>
            </>
          )}
        </button>
        {imageUrl && (
          <button
            type="button"
            onClick={handleDownload}
            disabled={state === 'loading'}
            className="flex items-center justify-center gap-2 px-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer min-h-[44px] disabled:opacity-60"
            aria-label="Download share image"
          >
            {state === 'loading' ? (
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    );
  }

  // Full: inline button
  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleShare}
        disabled={state === 'loading'}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer type-body-sm font-semibold disabled:opacity-60"
        style={btnStyle}
      >
        <ShareIcon state={state} />
        {feedback || 'Share'}
      </button>
    );
  }

  // Icon: compact pill button
  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={state === 'loading'}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
      style={btnStyle}
      aria-label={feedback || `Share ${title}`}
    >
      <ShareIcon state={state} />
      <span className="type-caption font-semibold" style={isSuccess ? undefined : { color: 'var(--share-accent)' }}>
        {feedback || 'Share'}
      </span>
    </button>
  );
}
