'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Check, Loader2, Download, X } from 'lucide-react';
import { useAnimatedModal } from '@/lib/use-animated-modal';

/** OG image with skeleton loader — handles loading state properly */
function OGImagePreview({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="rounded-lg overflow-hidden border border-border/30 mb-4 bg-muted/30">
      {/* Skeleton — shows until image loads */}
      {!loaded && !error && (
        <div className="aspect-[1200/630] w-full animate-pulse bg-muted flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60 animate-spin" />
            <span className="type-caption text-muted-foreground">Loading preview</span>
          </div>
        </div>
      )}
      {/* Image — hidden until loaded */}
      <img
        src={src}
        alt="Share preview"
        className={`w-full h-auto ${loaded ? 'block' : 'hidden'}`}
        loading="eager"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  imageUrl?: string;
  variant?: 'icon' | 'full' | 'hero';
  label?: string;
  showPreview?: boolean;
}

function SharePreviewModal({
  open,
  onClose,
  onShare,
  onCopy,
  onDownload,
  hasNativeShare,
  imageUrl,
  text,
  shareUrl,
  state,
  feedback,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  onShare: () => void;
  onCopy: () => void;
  onDownload?: () => void;
  hasNativeShare: boolean;
  imageUrl?: string;
  text: string;
  shareUrl: string;
  state: 'idle' | 'loading' | 'success';
  feedback: string;
  triggerRef?: React.RefObject<Element | null>;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  // Focus trap, auto-focus, and focus restore
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusables = dialog.querySelectorAll(focusableSelector);
    const first = focusables[0] as HTMLElement;
    const last = focusables[focusables.length - 1] as HTMLElement;

    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const currentFocusables = dialog.querySelectorAll(focusableSelector);
      const currentFirst = currentFocusables[0] as HTMLElement;
      const currentLast = currentFocusables[currentFocusables.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === currentFirst) {
        e.preventDefault();
        currentLast?.focus();
      } else if (!e.shiftKey && document.activeElement === currentLast) {
        e.preventDefault();
        currentFirst?.focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
      // Restore focus on cleanup (when modal closes)
      if (triggerRef?.current && triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
  }, [open, triggerRef]);

  const { shouldRender, dataState } = useAnimatedModal(open);
  if (!shouldRender) return null;

  return (
    <div ref={dialogRef} className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Share proposal" onClick={onClose} data-state={dataState}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 modal-overlay ease-out-snap data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-240 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-180 motion-reduce:animate-none"
        data-state={dataState}
      />

      {/* Modal — matches card-elevated design */}
      <div
        className="relative w-full max-w-md modal-content p-5 sm:p-6 ease-out-snap data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-240 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-180 motion-reduce:animate-none"
        onClick={(e) => e.stopPropagation()}
        data-state={dataState}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="type-title-2">Share</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* OG image preview with skeleton loading */}
        {imageUrl && (
          <OGImagePreview src={imageUrl} />
        )}

        {/* Share text preview */}
        <div className="p-3 rounded-lg bg-muted/30 mb-5">
          <p className="type-body-sm text-muted-foreground break-words">{text}</p>
          <p className="type-caption text-muted-foreground mt-1 truncate opacity-60">{shareUrl}</p>
        </div>

        {/* Actions — adapt to platform */}
        <div className="flex flex-col gap-2">
          {/* Primary: native share on mobile, copy link on desktop */}
          <button
            onClick={onShare}
            disabled={state === 'loading'}
            className="w-full flex items-center justify-center p-3 rounded-lg transition-colors cursor-pointer min-h-[44px] disabled:opacity-60"
            style={{ backgroundColor: 'var(--share-accent-bg)', color: 'var(--share-accent)' }}
          >
            {state === 'success' ? (
              <span className="type-body-sm font-semibold text-positive inline-flex items-center gap-1.5 animate-in zoom-in-95 fade-in duration-180 ease-out-snap motion-reduce:animate-none">
                <Check className="h-4 w-4" aria-hidden="true" />
                {feedback}
              </span>
            ) : (
              <span className="type-body-sm font-semibold">
                {hasNativeShare ? 'Share' : 'Copy link'}
              </span>
            )}
          </button>

          {/* Secondary row — platform-aware to avoid duplicates */}
          {(hasNativeShare || onDownload) && (
            <div className="flex gap-2">
              {/* Copy link: only on mobile (desktop primary already copies) */}
              {hasNativeShare && (
                <button
                  onClick={onCopy}
                  disabled={state === 'loading'}
                  className="flex-1 flex items-center justify-center p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer min-h-[44px]"
                >
                  <span className="type-caption font-medium text-muted-foreground">Copy link</span>
                </button>
              )}
              {/* Download image: both platforms */}
              {onDownload && (
                <button
                  onClick={onDownload}
                  disabled={state === 'loading'}
                  className="flex-1 flex items-center justify-center p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer min-h-[44px]"
                >
                  {state === 'loading' ? (
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                  ) : (
                    <span className="type-caption font-medium text-muted-foreground">Download image</span>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShareButton({ title, text, url, imageUrl, variant = 'icon', label }: ShareButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [feedback, setFeedback] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // OG image URL for preview (landscape format, not story)
  const previewImageUrl = imageUrl?.replace('?format=story', '?format=og');

  // Detect native share API (mobile browsers)
  const hasNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const doShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: `${text}\n${shareUrl}` });
        setModalOpen(false);
        return;
      } catch { /* user cancelled */ }
    }

    // Fallback: copy
    try {
      await navigator.clipboard.writeText(shareUrl);
      setState('success');
      setFeedback('Link copied');
      setTimeout(() => { setState('idle'); setFeedback(''); setModalOpen(false); }, 1500);
    } catch { /* clipboard failed */ }
  }, [text, shareUrl]);

  const doCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setState('success');
      setFeedback('Link copied');
      setTimeout(() => { setState('idle'); setFeedback(''); }, 1500);
    } catch { /* clipboard failed */ }
  }, [shareUrl]);

  const doDownload = useCallback(async () => {
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
      setTimeout(() => { setState('idle'); setFeedback(''); }, 1500);
    } catch {
      setState('idle');
    }
  }, [imageUrl]);

  const shareTriggerRef = useRef<Element | null>(null);

  const openModal = () => {
    shareTriggerRef.current = document.activeElement;
    setModalOpen(true);
  };

  const isSuccess = state === 'success';

  // Hero: larger CTA that opens modal
  if (variant === 'hero') {
    return (
      <>
        <button
          type="button"
          onClick={openModal}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg transition-colors cursor-pointer min-h-[44px]"
          style={{ backgroundColor: 'var(--share-accent-bg)', color: 'var(--share-accent)' }}
        >
          <span className="type-body-sm font-semibold">{label || 'Share'}</span>
        </button>
        <SharePreviewModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onShare={doShare}
          onCopy={doCopy}
          onDownload={imageUrl ? doDownload : undefined}
          imageUrl={previewImageUrl}
          text={text}
          shareUrl={shareUrl}
          state={state}
          feedback={feedback}
          hasNativeShare={hasNativeShare}
          triggerRef={shareTriggerRef}
        />
      </>
    );
  }

  // Full: inline button that opens modal
  if (variant === 'full') {
    return (
      <>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer type-body-sm font-semibold"
          style={{ backgroundColor: 'var(--share-accent-bg)', color: 'var(--share-accent)' }}
        >
          {isSuccess ? feedback : 'Share'}
        </button>
        <SharePreviewModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onShare={doShare}
          onCopy={doCopy}
          onDownload={imageUrl ? doDownload : undefined}
          imageUrl={previewImageUrl}
          text={text}
          shareUrl={shareUrl}
          state={state}
          feedback={feedback}
          hasNativeShare={hasNativeShare}
          triggerRef={shareTriggerRef}
        />
      </>
    );
  }

  // Icon (default): compact text button that opens modal
  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center h-11 px-3 rounded-lg transition-colors cursor-pointer"
        style={{ backgroundColor: 'var(--share-accent-bg)', color: 'var(--share-accent)' }}
      >
        <span className="type-caption font-semibold">Share</span>
      </button>
      <SharePreviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onShare={doShare}
        onCopy={doCopy}
        onDownload={imageUrl ? doDownload : undefined}
        imageUrl={previewImageUrl}
        text={text}
        shareUrl={shareUrl}
        state={state}
        feedback={feedback}
        hasNativeShare={hasNativeShare}
      />
    </>
  );
}
