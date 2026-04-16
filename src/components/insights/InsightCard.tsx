import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ShareButton from '@/components/proposals/ShareButton';

interface InsightCardProps {
  slug: string;
  title: string;
  subtitle: string;
  /** Hero number or short headline (e.g. "£2,280", "40p"). */
  hero: string;
  /** One-line context under the hero — keeps the card scannable in 30 seconds. */
  explainer: string;
  /** Optional share text; defaults to title. */
  shareText?: string;
  /** Additional classes on the root tile — e.g. `sm:col-span-2` to fill a row. */
  className?: string;
}

/**
 * Tile used on the /insights grid. One per card in INSIGHT_CARDS.
 *
 * Follows the project card anatomy: L1 hero number, L5 caption label above,
 * one-line explainer below, clickable → /insights/<slug>.
 */
export function InsightCard({
  slug,
  title,
  subtitle,
  hero,
  explainer,
  shareText,
  className,
}: InsightCardProps) {
  const href = `/insights/${slug}`;
  const imageUrl = `${href}/opengraph-image`;

  return (
    <div
      className={`card-elevated p-5 sm:p-6 flex flex-col gap-4 relative group${className ? ` ${className}` : ''}`}
    >
      <Link
        href={href}
        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${title} — read more`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="type-caption text-muted-foreground mb-1">{subtitle}</p>
          <h2 className="type-title-3 font-semibold">{title}</h2>
        </div>
        <div className="relative z-10 shrink-0">
          <ShareButton
            title={title}
            text={shareText ?? `${title} — CivAccount`}
            url={href}
            imageUrl={imageUrl}
            variant="icon"
          />
        </div>
      </div>

      <p className="type-display font-semibold tabular-nums">{hero}</p>

      <p className="type-body-sm text-muted-foreground">{explainer}</p>

      <div className="flex items-center gap-1 type-body-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        <span>Read more</span>
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </div>
    </div>
  );
}
