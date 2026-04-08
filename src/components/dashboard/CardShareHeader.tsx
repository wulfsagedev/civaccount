'use client';

import { useParams } from 'next/navigation';
import ShareButton from '@/components/proposals/ShareButton';

interface CardShareHeaderProps {
  cardType: string;
  title: string;
  subtitle?: string;
  councilName: string;
  show?: boolean;
  /** Extra className on the subtitle <p> (e.g. "mb-5", "mb-6") */
  subtitleClassName?: string;
}

export default function CardShareHeader({
  cardType,
  title,
  subtitle,
  councilName,
  show = true,
  subtitleClassName = 'mb-5',
}: CardShareHeaderProps) {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const shareUrl = slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/council/${slug}/card/${cardType}` : undefined;
  const imageUrl = slug ? `/api/share/${slug}/${cardType}?format=story` : undefined;

  return (
    <div className="group/share">
      <div className="flex items-start justify-between gap-2">
        <h2 className="type-title-2 mb-1">{title}</h2>
        {show && shareUrl && (
          <div className="sm:opacity-0 sm:group-hover/share:opacity-100 sm:focus-within:opacity-100 transition-opacity duration-150">
            <ShareButton
              title={`${title} — ${councilName}`}
              text={`${title} — ${councilName} on CivAccount`}
              url={shareUrl}
              imageUrl={imageUrl}
              variant="icon"
            />
          </div>
        )}
      </div>
      {subtitle && (
        <p className={`type-body-sm text-muted-foreground ${subtitleClassName}`}>{subtitle}</p>
      )}
    </div>
  );
}
