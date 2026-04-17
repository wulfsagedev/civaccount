'use client';

import { useParams } from 'next/navigation';
import { useCouncil } from '@/context/CouncilContext';
import { getCouncilSlug } from '@/data/councils';
import { useIsEmbed } from '@/lib/embed-context';
import ShareButton from '@/components/proposals/ShareButton';

interface CardShareHeaderProps {
  cardType: string;
  title: string;
  subtitle?: string;
  councilName: string;
  show?: boolean;
  /** Extra className on the subtitle <p> (e.g. "mb-5", "mb-6") */
  subtitleClassName?: string;
  /** Data year label shown next to the title (e.g. "2024-25 data") */
  dataYear?: string;
}

export default function CardShareHeader({
  cardType,
  title,
  subtitle,
  councilName,
  show = true,
  subtitleClassName = 'mb-5',
  dataYear,
}: CardShareHeaderProps) {
  // Get slug from URL params OR from CouncilContext (homepage renders dashboard without URL slug)
  const params = useParams<{ slug: string }>();
  const { selectedCouncil } = useCouncil();
  const isEmbed = useIsEmbed();
  const slug = params?.slug || (selectedCouncil ? getCouncilSlug(selectedCouncil) : undefined);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = slug ? `${origin}/council/${slug}/card/${cardType}` : undefined;
  const imageUrl = slug ? `/api/share/${slug}/${cardType}?format=story` : undefined;
  const embedUrl = slug ? `${origin}/embed/council/${slug}/${cardType}` : undefined;

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h2 className="type-title-2 mb-1">{title}</h2>
          {dataYear && (
            <span className="type-caption text-muted-foreground whitespace-nowrap">{dataYear} data</span>
          )}
        </div>
        {show && shareUrl && !isEmbed && (
          <ShareButton
            title={`${title} — ${councilName}`}
            text={`${title} — ${councilName} on CivAccount`}
            url={shareUrl}
            imageUrl={imageUrl}
            embedUrl={embedUrl}
            cardType={cardType}
            variant="icon"
          />
        )}
      </div>
      {subtitle && (
        <p className={`type-body-sm text-muted-foreground ${subtitleClassName}`}>{subtitle}</p>
      )}
    </div>
  );
}
