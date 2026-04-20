'use client';

import { usePathname } from 'next/navigation';
import ShareButton from '@/components/proposals/ShareButton';
import { buildShareUrl } from '@/lib/utils';

interface PageShareButtonProps {
  title: string;
  description: string;
}

/**
 * Page-level share button — sits in page headers.
 * Shares the current page URL with the page title and description.
 * Automatically discovers the OG image for the current route.
 */
export function PageShareButton({ title, description }: PageShareButtonProps) {
  const pathname = usePathname();
  const url = buildShareUrl(pathname);
  const imageUrl = pathname ? `${pathname}/opengraph-image` : undefined;

  return (
    <ShareButton
      title={title}
      text={description}
      url={url}
      imageUrl={imageUrl}
      variant="icon"
    />
  );
}
