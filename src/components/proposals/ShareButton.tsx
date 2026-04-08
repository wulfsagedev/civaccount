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
}

export default function ShareButton({ title, text, url, imageUrl, variant = 'icon', label }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleShare = useCallback(async () => {
    // If we have an image URL, try image sharing first
    if (imageUrl) {
      setLoading(true);
      try {
        const response = await fetch(imageUrl);
        if (response.ok) {
          const blob = await response.blob();
          const file = new File([blob], `civaccount-share.png`, { type: 'image/png' });

          // Try native share with file (iOS Safari 15+, Android Chrome)
          if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
            try {
              await navigator.share({ title, text, files: [file] });
              setLoading(false);
              return;
            } catch {
              // User cancelled — fall through
            }
          }

          // Fallback: download the image
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `civaccount-share.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);
          setLoading(false);
          return;
        }
      } catch {
        // Image fetch failed — fall through to URL sharing
      }
      setLoading(false);
    }

    // URL sharing (original behaviour)
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
  }, [title, text, shareUrl, imageUrl]);

  const icon = loading
    ? <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" aria-hidden="true" />
    : copied
      ? <Check className="h-4 w-4 text-positive" aria-hidden="true" />
      : <Share2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />;

  const statusText = loading ? 'Preparing...' : copied ? 'Link copied' : null;

  // Hero: full-width CTA for the bill card
  if (variant === 'hero') {
    return (
      <button
        type="button"
        onClick={handleShare}
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-muted/30 hover:bg-muted transition-colors cursor-pointer min-h-[44px] disabled:opacity-60"
      >
        {icon}
        <span className={`type-body-sm font-semibold ${copied ? 'text-positive' : ''}`}>
          {statusText || label || 'Share your council tax card'}
        </span>
      </button>
    );
  }

  // Full: inline button with "Share" label
  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleShare}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer type-body-sm font-medium disabled:opacity-60"
      >
        {icon}
        {statusText || 'Share'}
      </button>
    );
  }

  // Icon: compact button with visible "Share" label
  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={loading}
      className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer disabled:opacity-60"
      aria-label={loading ? 'Preparing share image' : copied ? 'Link copied' : `Share ${title}`}
    >
      {icon}
      <span className={`type-caption ${copied ? 'text-positive' : 'text-muted-foreground'}`}>
        {loading ? '...' : copied ? 'Copied' : 'Share'}
      </span>
    </button>
  );
}
