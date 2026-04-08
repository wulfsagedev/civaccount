'use client';

import ShareButton from '@/components/proposals/ShareButton';

interface PageShareButtonProps {
  title: string;
  description: string;
}

/**
 * Page-level share button — sits in page headers.
 * Shares the current page URL with the page title and description.
 */
export function PageShareButton({ title, description }: PageShareButtonProps) {
  const url = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <ShareButton
      title={title}
      text={description}
      url={url}
      variant="icon"
    />
  );
}
