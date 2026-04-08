'use client';

import { useState, useCallback, useRef } from 'react';
import { Share2, Check, Loader2 } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  /** API route URL for image generation (e.g. /api/share/kent/your-bill?format=story) */
  imageUrl?: string;
  variant?: 'icon' | 'full' | 'hero';
  /** Custom label for hero variant (default: "Share your council tax card") */
  label?: string;
  /** Show preview before sharing (default: false for icon variant, true for hero) */
  showPreview?: boolean;
}

type ShareResult = 'shared-native-file' | 'shared-native' | 'copied-image' | 'copied-url' | 'downloaded' | 'failed';

/** Progressive share: native file → native URL → clipboard image → clipboard URL → download */
async function progressiveShare(data: {
  title: string;
  text: string;
  url: string;
  imageBlob?: Blob;
}): Promise<ShareResult> {
  const { title, text, url, imageBlob } = data;

  // Level 1: Native share with file (mobile)
  if (imageBlob) {
    const file = new File([imageBlob], 'civaccount-share.png', { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title, text, files: [file] });
        return 'shared-native-file';
      } catch { /* user cancelled */ }
    }
  }

  // Level 2: Native share URL (mobile)
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'shared-native';
    } catch { /* user cancelled */ }
  }

  // Level 3: Copy image to clipboard (desktop — Chrome 76+, Safari 13.1+, Firefox 127+)
  if (imageBlob && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': imageBlob })
      ]);
      return 'copied-image';
    } catch { /* clipboard image write not supported */ }
  }

  // Level 4: Multi-format clipboard (URL + rich text)
  if (navigator.clipboard?.write) {
    try {
      const plainBlob = new Blob([url], { type: 'text/plain' });
      const htmlBlob = new Blob(
        [`<a href="${url}">${title} — CivAccount</a>`],
        { type: 'text/html' }
      );
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': plainBlob,
          'text/html': htmlBlob,
        })
      ]);
      return 'copied-url';
    } catch { /* multi-format failed, try plain text */ }
  }

  // Level 5: Plain text clipboard
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return 'copied-url';
    } catch { /* clipboard failed */ }
  }

  // Level 6: Download image
  if (imageBlob) {
    const downloadUrl = URL.createObjectURL(imageBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'civaccount-share.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
    return 'downloaded';
  }

  return 'failed';
}

function ShareIcon({ state }: { state: 'idle' | 'loading' | 'success' }) {
  if (state === 'loading') {
    return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" aria-hidden="true" />;
  }

  return (
    <span className="relative inline-flex items-center justify-center w-4 h-4" aria-hidden="true">
      {/* Share icon — fades out on success */}
      <Share2
        className="h-4 w-4 text-muted-foreground absolute inset-0 transition-all duration-200 ease-out"
        style={{
          opacity: state === 'success' ? 0 : 1,
          transform: state === 'success' ? 'scale(0.6)' : 'scale(1)',
        }}
      />
      {/* Checkmark — fades in on success */}
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
    case 'copied-image': return 'Image copied';
    case 'copied-url': return 'Link copied';
    case 'downloaded': return 'Image saved';
    default: return '';
  }
}

export default function ShareButton({ title, text, url, imageUrl, variant = 'icon', label, showPreview }: ShareButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [feedback, setFeedback] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shouldPreview = showPreview ?? variant === 'hero';

  const fetchImage = useCallback(async (): Promise<Blob | null> => {
    if (!imageUrl) return null;
    if (blobRef.current) return blobRef.current;
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) return null;
      const blob = await res.blob();
      blobRef.current = blob;
      return blob;
    } catch {
      return null;
    }
  }, [imageUrl]);

  const handleShare = useCallback(async () => {
    setState('loading');

    // If preview mode: show preview first, then share on second tap
    if (shouldPreview && !previewVisible && imageUrl) {
      const blob = await fetchImage();
      if (blob) {
        setPreviewSrc(URL.createObjectURL(blob));
        setPreviewVisible(true);
        setState('idle');
        return;
      }
    }

    // Close preview if open
    if (previewVisible) {
      setPreviewVisible(false);
    }

    const imageBlob = await fetchImage();
    const result = await progressiveShare({ title, text, url: shareUrl, imageBlob: imageBlob ?? undefined });

    const label = resultLabel(result);
    if (label) {
      setState('success');
      setFeedback(label);
      setTimeout(() => { setState('idle'); setFeedback(''); }, 2000);
    } else {
      setState('idle');
    }
  }, [title, text, shareUrl, imageUrl, fetchImage, shouldPreview, previewVisible]);

  const dismissPreview = useCallback(() => {
    setPreviewVisible(false);
    if (previewSrc) {
      URL.revokeObjectURL(previewSrc);
      setPreviewSrc(null);
    }
  }, [previewSrc]);

  const isSuccess = state === 'success';

  // Hero: full-width CTA for the bill card
  if (variant === 'hero') {
    return (
      <div className="relative">
        {/* Preview card */}
        {previewVisible && previewSrc && (
          <div className="mb-3 rounded-lg overflow-hidden border border-border/50 bg-muted/30">
            <img
              src={previewSrc}
              alt="Share preview"
              className="w-full h-auto"
            />
            <div className="flex gap-2 p-3">
              <button
                type="button"
                onClick={handleShare}
                disabled={state === 'loading'}
                className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-foreground text-background type-body-sm font-semibold cursor-pointer min-h-[44px] transition-colors hover:bg-foreground/90 disabled:opacity-60"
              >
                <ShareIcon state={state} />
                {state === 'loading' ? 'Preparing...' : feedback || 'Share this'}
              </button>
              <button
                type="button"
                onClick={dismissPreview}
                className="px-4 p-2.5 rounded-lg bg-muted hover:bg-muted/80 type-body-sm font-medium cursor-pointer min-h-[44px] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Main CTA */}
        {!previewVisible && (
          <button
            type="button"
            onClick={handleShare}
            disabled={state === 'loading'}
            className="flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-muted/30 hover:bg-muted transition-colors cursor-pointer min-h-[44px] disabled:opacity-60"
          >
            <ShareIcon state={state} />
            <span className={`type-body-sm font-semibold ${isSuccess ? 'text-positive' : ''}`}>
              {state === 'loading' ? 'Preparing...' : feedback || label || 'Share your council tax card'}
            </span>
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
        {state === 'loading' ? 'Preparing...' : feedback || 'Share'}
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
      aria-label={state === 'loading' ? 'Preparing share image' : feedback || `Share ${title}`}
    >
      <ShareIcon state={state} />
      <span className={`type-caption ${isSuccess ? 'text-positive' : 'text-muted-foreground'}`}>
        {state === 'loading' ? '...' : feedback || 'Share'}
      </span>
    </button>
  );
}
