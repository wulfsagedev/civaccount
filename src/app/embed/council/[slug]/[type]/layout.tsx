import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCouncilBySlug } from '@/data/councils';
import { VALID_CARD_TYPES } from '@/app/council/[slug]/card/_lib/card-types';

type Props = { params: Promise<{ slug: string; type: string }>; children: React.ReactNode };

// An unknown council or card used to return 200 "index, follow" with an empty
// frame (CA-B15). Embeds live inside other sites, so none are indexed.
export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { slug, type } = await params;
  if (!getCouncilBySlug(slug) || !VALID_CARD_TYPES.includes(type)) notFound();
  return { robots: { index: false, follow: false } };
}

// Checked here too: generateMetadata is streamed to browsers (not to bots),
// so a notFound() there alone still answered browsers with a 200.
export default async function EmbedCardLayout({ params, children }: Props) {
  const { slug, type } = await params;
  if (!getCouncilBySlug(slug) || !VALID_CARD_TYPES.includes(type)) notFound();
  return children;
}
