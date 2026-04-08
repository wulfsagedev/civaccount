'use client';

import { useState, useCallback, useEffect } from 'react';
import { Check, Loader2, Download, X } from 'lucide-react';

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
  imageUrl,
  text,
  shareUrl,
  state,
  feedback,
}: {
  open: boolean;
  onClose: () => void;
  onShare: () => void;
  onCopy: () => void;
  onDownload?: () => void;
  imageUrl?: string;
  text: string;
  shareUrl: string;
  state: 'idle' | 'loading' | 'success';
  feedback: string;
}) {
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-card rounded-2xl border border-border/50 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <h3 className="type-body-sm font-semibold">Share</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Preview */}
        <div className="px-5 py-4">
          {/* OG image preview */}
          {imageUrl && (
            <div className="rounded-lg overflow-hidden border border-border/30 mb-4 bg-muted/30">
              <img
                src={imageUrl}
                alt="Share preview"
                className="w-full h-auto"
                loading="eager"
              />
            </div>
          )}

          {/* Share text preview */}
          <div className="p-3 rounded-lg bg-muted/30 mb-4">
            <p className="type-caption text-muted-foreground break-words whitespace-pre-wrap">{text}</p>
            <p className="type-caption text-muted-foreground mt-1 truncate opacity-60">{shareUrl}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex flex-col gap-2">
          {/* Primary: Share (mobile) or Copy link (desktop) */}
          <button
            onClick={onShare}
            disabled={state === 'loading'}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg transition-colors cursor-pointer min-h-[44px] disabled:opacity-60"
            style={{ backgroundColor: 'var(--share-accent-bg)', color: 'var(--share-accent)' }}
          >
            {state === 'success' ? (
              <span className="type-body-sm font-semibold text-positive">{feedback}</span>
            ) : (
              <span className="type-body-sm font-semibold">
                {typeof navigator !== 'undefined' && 'share' in navigator ? 'Share' : 'Copy link'}
              </span>
            )}
          </button>

          {/* Secondary actions row */}
          <div className="flex gap-2">
            <button
              onClick={onCopy}
              disabled={state === 'loading'}
              className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer min-h-[44px]"
            >
              <span className="type-caption font-medium text-muted-foreground">Copy link</span>
            </button>
            {onDownload && (
              <button
                onClick={onDownload}
                disabled={state === 'loading'}
                className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer min-h-[44px]"
              >
                {state === 'loading' ? (
                  <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                ) : (
                  <span className="type-caption font-medium text-muted-foreground">Download image</span>
                )}
              </button>
            )}
          </div>
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

  const openModal = () => setModalOpen(true);

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
        className="inline-flex items-center h-8 px-3 rounded-lg transition-colors cursor-pointer"
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
      />
    </>
  );
}
