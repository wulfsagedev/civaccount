import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * PageContainer — canonical content-column wrapper for every page.
 *
 * The default variant matches the council dashboard width exactly
 * (max-w-3xl / 768px) so navigation between pages doesn't jump.
 *
 * Variants:
 * - `default` (no prop): max-w-3xl, px-4 sm:px-6, py-6 sm:py-8 — council-match
 * - `narrow`: max-w-md — centred auth / error / minimal success pages
 * - `hero`: max-w-xl — homepage search-hero only
 *
 * Do NOT add a `wide` variant. Pages that previously used max-w-5xl were
 * dead outer wrappers; the content inside should reflow to 768px.
 *
 * See DASHBOARD-UX-PLAN.md and CLAUDE.md for the width benchmark rationale.
 */

type Variant = 'default' | 'narrow' | 'hero';

interface PageContainerProps {
  children: ReactNode;
  /**
   * Width variant. Defaults to council-match (max-w-3xl).
   */
  variant?: Variant;
  /**
   * Additional classes appended to the container. Use for one-off vertical
   * rhythm tweaks (e.g. `py-12` on a landing page). Do NOT override max-w —
   * pick a variant instead.
   */
  className?: string;
  /**
   * Render as <main id="main-content"> instead of <div>. Most top-level
   * pages want this so the skip-to-main-content link works.
   */
  as?: 'main' | 'div';
  /**
   * Pass-through id (rare — `as="main"` already sets id="main-content").
   */
  id?: string;
}

const WIDTH: Record<Variant, string> = {
  default: 'max-w-3xl',
  narrow: 'max-w-md',
  hero: 'max-w-xl',
};

const PADDING: Record<Variant, string> = {
  default: 'px-4 sm:px-6 py-6 sm:py-8',
  // Narrow + hero sit in their own flex/grid centred layouts; keep padding tight.
  narrow: 'px-4 sm:px-6',
  hero: 'px-4 sm:px-6',
};

export function PageContainer({
  children,
  variant = 'default',
  className,
  as = 'main',
  id,
}: PageContainerProps) {
  const Tag = as;
  const isMain = as === 'main';

  return (
    <Tag
      id={id ?? (isMain ? 'main-content' : undefined)}
      className={cn(
        'flex-1 container mx-auto w-full',
        WIDTH[variant],
        PADDING[variant],
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export default PageContainer;
