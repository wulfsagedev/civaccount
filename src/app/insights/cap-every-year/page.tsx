import type { Metadata } from 'next';
import { getInsightCard } from '@/data/insights';
import { WithdrawnCard } from '@/components/insights/WithdrawnCard';

const card = getInsightCard('cap-every-year')!;

export const metadata: Metadata = {
  title: `${card.title} — withdrawn · CivAccount`,
  description:
    'This insight card has been withdrawn while we fix how it is calculated.',
  // Withdrawn cards must not be indexed. The route stays up for anyone
  // arriving from an old link, but it is no longer a page we want ranking.
  robots: { index: false, follow: true },
  alternates: { canonical: `/insights/${card.slug}` },
};

export default function Page() {
  return <WithdrawnCard card={card} />;
}
