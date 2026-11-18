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

export default function EmbedCardLayout({ children }: Props) {
  return children;
}
