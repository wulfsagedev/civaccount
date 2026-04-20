'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Check, Loader2, Download, X } from 'lucide-react';
import { useAnimatedModal } from '@/lib/use-animated-modal';
import { SITE_URL, buildShareUrl } from '@/lib/utils';

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
  /** Optional embed URL. When present, a second "Embed" tab appears in the modal. */
  embedUrl?: string;
  /** Card type slug — used to label the embed snippet. */
  cardType?: string;
  variant?: 'icon' | 'full' | 'hero';
  label?: string;
  showPreview?: boolean;
}

type EmbedSize = 'small' | 'medium' | 'full';
type EmbedTheme = 'auto' | 'light' | 'dark';

const EMBED_WIDTHS: Record<EmbedSize, string> = {
  small: '360px',
  medium: '540px',
  full: '100%',
};
const EMBED_HEIGHTS: Record<EmbedSize, number> = {
  small: 520,
  medium: 640,
  full: 720,
};

function buildEmbedUrl(baseUrl: string, theme: EmbedTheme, pinVersion: string | null): string {
  const url = new URL(baseUrl);
  if (theme !== 'auto') url.searchParams.set('theme', theme);
  if (pinVersion) url.searchParams.set('v', pinVersion);
  return url.toString();
}

function buildIframeSnippet(src: string, width: string, height: number): string {
  const widthAttr = width === '100%' ? 'width="100%"' : `width="${parseInt(width)}"`;
  return `<iframe src="${src}" ${widthAttr} height="${height}" style="border:0;max-width:100%;" loading="lazy" referrerpolicy="no-referrer-when-downgrade" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"></iframe>`;
}

function buildImageSnippet(imageUrl: string, pageUrl: string, title: string): string {
  const absUrl = imageUrl.startsWith('http') ? imageUrl : `${SITE_URL}${imageUrl}`;
  return `<a href="${pageUrl}" target="_blank" rel="noopener"><img src="${absUrl}" alt="${title}" style="max-width:100%;height:auto;"/></a>`;
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
  embedUrl,
  cardType,
  title,
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
  embedUrl?: string;
  cardType?: string;
  title: string;
  state: 'idle' | 'loading' | 'success';
  feedback: string;
  triggerRef?: React.RefObject<Element | null>;
}) {
  const [tab, setTab] = useState<'share' | 'embed'>('share');
  const [size, setSize] = useState<EmbedSize>('medium');
  const [theme, setTheme] = useState<EmbedTheme>('auto');
  // Stable cache-buster computed once when the modal mounts — prevents the
  // preview URL changing on every render (which is what React's purity rule
  // flagged). `Date.now()` still runs, just in an initialiser.
  const [cacheBuster] = useState(() => Date.now());
  const [pinData, setPinData] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const dataYearToPin = '2025-26';
  const finalEmbedUrl = embedUrl
    ? buildEmbedUrl(embedUrl, theme, pinData ? dataYearToPin : null)
    : '';
  const iframeSnippet = finalEmbedUrl
    ? buildIframeSnippet(finalEmbedUrl, EMBED_WIDTHS[size], EMBED_HEIGHTS[size])
    : '';
  const imageSnippet = imageUrl && cardType
    ? buildImageSnippet(imageUrl.replace('?format=story', '?format=og'), shareUrl, title)
    : '';

  const copyTo = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const dialogRef = useRef<HTMLDivElement>(null);
  const hasEmbed = Boolean(embedUrl);

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
        <div className="flex items-center justify-between mb-4">
          <h3 className="type-title-2">{tab === 'embed' ? 'Embed' : 'Share'}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tab switcher (only when embed available) */}
        {hasEmbed && (
          <div className="flex gap-1 mb-5 p-1 rounded-lg bg-muted/50" role="tablist">
            <button
              role="tab"
              aria-selected={tab === 'share'}
              onClick={() => setTab('share')}
              className={`flex-1 py-2 rounded-md type-body-sm font-semibold transition-colors cursor-pointer ${tab === 'share' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Share
            </button>
            <button
              role="tab"
              aria-selected={tab === 'embed'}
              onClick={() => setTab('embed')}
              className={`flex-1 py-2 rounded-md type-body-sm font-semibold transition-colors cursor-pointer ${tab === 'embed' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Embed
            </button>
          </div>
        )}

        {tab === 'share' ? (
          <>
            {imageUrl && <OGImagePreview src={imageUrl} />}

            <div className="p-3 rounded-lg bg-muted/30 mb-5">
              <p className="type-body-sm text-muted-foreground break-words">{text}</p>
              <p className="type-caption text-muted-foreground mt-1 truncate opacity-60">{shareUrl}</p>
            </div>

            <div className="flex flex-col gap-2">
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

              {(hasNativeShare || onDownload) && (
                <div className="flex gap-2">
                  {hasNativeShare && (
                    <button
                      onClick={onCopy}
                      disabled={state === 'loading'}
                      className="flex-1 flex items-center justify-center p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer min-h-[44px]"
                    >
                      <span className="type-caption font-medium text-muted-foreground">Copy link</span>
                    </button>
                  )}
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
          </>
        ) : (
          <EmbedTabBody
            previewImageUrl={imageUrl ? `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}cb=${cacheBuster}` : undefined}
            iframeSnippet={iframeSnippet}
            imageSnippet={imageSnippet}
            size={size}
            setSize={setSize}
            theme={theme}
            setTheme={setTheme}
            pinData={pinData}
            setPinData={setPinData}
            dataYearToPin={dataYearToPin}
            copiedKey={copiedKey}
            onCopyText={copyTo}
          />
        )}
      </div>
    </div>
  );
}

function EmbedTabBody({
  previewImageUrl,
  iframeSnippet,
  imageSnippet,
  size,
  setSize,
  theme,
  setTheme,
  pinData,
  setPinData,
  dataYearToPin,
  copiedKey,
  onCopyText,
}: {
  previewImageUrl?: string;
  iframeSnippet: string;
  imageSnippet: string;
  size: EmbedSize;
  setSize: (s: EmbedSize) => void;
  theme: EmbedTheme;
  setTheme: (t: EmbedTheme) => void;
  pinData: boolean;
  setPinData: (p: boolean) => void;
  dataYearToPin: string;
  copiedKey: string | null;
  onCopyText: (text: string, key: string) => void;
}) {
  const [previewLoaded, setPreviewLoaded] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Preview — OG card image. Fast, reliable, matches what social + image
          embeds render. The live iframe snippet they copy updates with theme
          and size; the preview conveys layout and data. */}
      <div className="relative rounded-lg overflow-hidden border border-border/40 bg-muted/30 aspect-[1200/630]">
        {previewImageUrl ? (
          <>
            {!previewLoaded && (
              <div className="absolute inset-0 animate-pulse bg-muted flex items-center justify-center">
                <span className="type-caption text-muted-foreground">Loading preview</span>
              </div>
            )}
            <img
              src={previewImageUrl}
              alt="Embed preview"
              className={`w-full h-full object-cover ${previewLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setPreviewLoaded(true)}
            />
            <span className="absolute top-2 left-2 type-caption font-semibold px-2 py-0.5 rounded-md bg-background/80 backdrop-blur-sm text-foreground">
              Preview
            </span>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="type-caption text-muted-foreground">No preview available</span>
          </div>
        )}
      </div>

      {/* Size toggle */}
      <SegmentedGroup
        label="Size"
        options={[
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'full', label: 'Full' },
        ]}
        value={size}
        onChange={(v) => setSize(v as EmbedSize)}
      />

      {/* Theme toggle */}
      <SegmentedGroup
        label="Theme"
        options={[
          { value: 'auto', label: 'Auto' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
        value={theme}
        onChange={(v) => setTheme(v as EmbedTheme)}
      />

      {/* Data pin toggle */}
      <label className="flex items-center justify-between p-3 rounded-lg bg-muted/30 cursor-pointer select-none">
        <div className="pr-3">
          <p className="type-body-sm font-semibold">Data</p>
          <p className="type-caption text-muted-foreground">
            {pinData ? `Pinned to ${dataYearToPin}` : 'Always current'}
          </p>
        </div>
        <span
          role="switch"
          aria-checked={pinData}
          aria-label={pinData ? 'Unpin data year' : `Pin to ${dataYearToPin}`}
          tabIndex={0}
          onClick={() => setPinData(!pinData)}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              setPinData(!pinData);
            }
          }}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${pinData ? 'bg-foreground' : 'bg-muted-foreground/30'}`}
          style={{ minHeight: 0, minWidth: 0 }}
        >
          <span
            aria-hidden="true"
            className={`inline-block h-6 w-6 transform rounded-full bg-background shadow-sm transition-transform ${pinData ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
          />
        </span>
      </label>

      {/* Copy snippets */}
      <div className="flex flex-col gap-2">
        <CopyRow
          label="Copy embed code"
          sublabel="Interactive iframe, updates automatically"
          value={iframeSnippet}
          copyKey="iframe"
          copiedKey={copiedKey}
          onCopy={onCopyText}
        />
        {imageSnippet && (
          <CopyRow
            label="Copy as image"
            sublabel="Static PNG with link — works in emails"
            value={imageSnippet}
            copyKey="image"
            copiedKey={copiedKey}
            onCopy={onCopyText}
          />
        )}
      </div>
    </div>
  );
}

function SegmentedGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="type-body-sm font-semibold w-16 shrink-0">{label}</span>
      <div className="flex gap-1 p-1 rounded-lg bg-muted/50 flex-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-1.5 rounded-md type-caption font-semibold transition-colors cursor-pointer ${value === opt.value ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CopyRow({
  label,
  sublabel,
  value,
  copyKey,
  copiedKey,
  onCopy,
}: {
  label: string;
  sublabel: string;
  value: string;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  const isCopied = copiedKey === copyKey;
  return (
    <button
      type="button"
      onClick={() => onCopy(value, copyKey)}
      className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer text-left min-h-[44px]"
    >
      <div className="min-w-0 pr-3">
        <p className="type-body-sm font-semibold">{label}</p>
        <p className="type-caption text-muted-foreground truncate">{sublabel}</p>
      </div>
      {isCopied ? (
        <span className="type-caption font-semibold text-positive inline-flex items-center gap-1.5 shrink-0">
          <Check className="h-4 w-4" aria-hidden="true" />
          Copied
        </span>
      ) : (
        <span className="type-caption font-semibold shrink-0" style={{ color: 'var(--share-accent)' }}>Copy</span>
      )}
    </button>
  );
}

export default function ShareButton({ title, text, url, imageUrl, embedUrl, cardType, variant = 'icon', label }: ShareButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [feedback, setFeedback] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Always produce an absolute URL. A relative or empty `url` prop falls back
  // to the current pathname (and then SITE_URL) so copy/share never leaks a
  // relative path or an empty string.
  const shareUrl = (() => {
    if (url && url.startsWith('http')) return url;
    if (url) return buildShareUrl(url);
    if (typeof window !== 'undefined') {
      const href = window.location.href;
      if (href && href.startsWith('http')) return href;
      return buildShareUrl(window.location.pathname);
    }
    return SITE_URL;
  })();

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
          embedUrl={embedUrl}
          cardType={cardType}
          title={title}
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
          embedUrl={embedUrl}
          cardType={cardType}
          title={title}
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
        embedUrl={embedUrl}
        cardType={cardType}
        title={title}
        state={state}
        feedback={feedback}
        hasNativeShare={hasNativeShare}
      />
    </>
  );
}
