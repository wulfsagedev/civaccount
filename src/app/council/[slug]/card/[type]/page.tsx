import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCouncilBySlug, getCouncilDisplayName } from '@/data/councils';
import { CARD_TYPES, VALID_CARD_TYPES } from '../_lib/card-types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; type: string }>;
}): Promise<Metadata> {
  const { slug, type } = await params;
  const council = getCouncilBySlug(slug);
  const displayName = council ? getCouncilDisplayName(council) : 'Council';
  const cardType = CARD_TYPES[type];

  const title = cardType ? cardType.title(displayName) : `${displayName} | CivAccount`;
  const description = cardType ? cardType.description(displayName) : `Council data for ${displayName}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'CivAccount',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ slug: string; type: string }>;
}) {
  const { slug, type } = await params;

  if (VALID_CARD_TYPES.includes(type)) {
    redirect(`/council/${slug}#${type}`);
  }

  redirect(`/council/${slug}`);
}
