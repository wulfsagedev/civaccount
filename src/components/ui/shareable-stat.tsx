'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { Share2, Check, Loader2 } from 'lucide-react';
import { getCouncilBySlug, getCouncilDisplayName } from '@/data/councils';

interface ShareableStatProps {
  /** The label shown above the stat (e.g. "CEO Salary") */
  label: string;
  /** The formatted value to display and share (e.g. "£223,979") */
  value: string;
  /** Optional context line (e.g. "per year") */
  context?: string;
  /** Children to render as the stat display — if not provided, renders value as text */
  children: ReactNode;
}

/**
 * Wraps any stat with a long-press/hover share affordance.
 * Tapping the share icon generates a single-stat card image and shares it.
 */
export function ShareableStat({ label, value, context, children }: ShareableStatProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle');
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!slug) return;

    setState('loading');

    const council = getCouncilBySlug(slug);
    const councilName = council ? getCouncilDisplayName(council) : '';
    const typeName = council?.type_name || '';

    const imageUrl = `/api/share/stat?${new URLSearchParams({
      label,
      value,
      council: councilName,
      type: typeName,
      ...(context ? { context } : {}),
    })}`;

    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error('Failed to generate image');
      const blob = await res.blob();

      // Try native share with file
      const file = new File([blob], 'civaccount-stat.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: `${label} — ${councilName}`,
            text: `${label}: ${value}${context ? ` ${context}` : ''} — ${councilName} on CivAccount`,
            files: [file],
          });
          setState('success');
          setTimeout(() => setState('idle'), 2000);
          return;
        } catch { /* cancelled */ }
      }

      // Fallback: copy image to clipboard
      if (navigator.clipboard?.write) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setState('success');
          setTimeout(() => setState('idle'), 2000);
          return;
        } catch { /* clipboard image failed */ }
      }

      // Fallback: copy text
      const shareUrl = `${window.location.origin}/council/${slug}`;
      await navigator.clipboard.writeText(`${label}: ${value} — ${councilName}\n${shareUrl}`);
      setState('success');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('idle');
    }
  }, [slug, label, value, context]);

  return (
    <span className="group/stat relative inline-block">
      {children}
      {slug && (
        <button
          type="button"
          onClick={handleShare}
          disabled={state === 'loading'}
          className="absolute -top-1 -right-1 sm:opacity-0 sm:group-hover/stat:opacity-100 sm:focus-within:opacity-100 transition-all duration-150 w-7 h-7 rounded-full bg-card border border-border/50 shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-60 hover:bg-muted"
          aria-label={`Share ${label}`}
        >
          {state === 'loading' ? (
            <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
          ) : state === 'success' ? (
            <Check className="h-3 w-3 text-positive" />
          ) : (
            <Share2 className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      )}
    </span>
  );
}
