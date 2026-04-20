import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ShareButton from '@/components/proposals/ShareButton';
import { buildShareUrl } from '@/lib/utils';

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
  const shareUrl = buildShareUrl(href);
  const imageUrl = `${href}/opengraph-image`;

  return (
    <div
      className={`card-elevated-interactive p-5 sm:p-6 flex flex-col gap-4 relative group${className ? ` ${className}` : ''}`}
    >
      <Link
        href={href}
        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${title} — read more`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="type-title-3 font-semibold mb-1">{title}</h2>
          <p className="type-caption text-muted-foreground">{subtitle}</p>
        </div>
        <div className="relative z-10 shrink-0">
          <ShareButton
            title={title}
            text={shareText ?? `${title} — CivAccount`}
            url={shareUrl}
            imageUrl={imageUrl}
            variant="icon"
          />
        </div>
      </div>

      <p className="type-display font-semibold tabular-nums">{hero}</p>

      <p className="type-body-sm text-muted-foreground">{explainer}</p>

      <div className="flex items-center gap-1 type-body-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-150 ease-out-snap">
        <span>Read more</span>
        <ArrowRight
          className="h-4 w-4 transition-transform duration-180 ease-out-snap group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
