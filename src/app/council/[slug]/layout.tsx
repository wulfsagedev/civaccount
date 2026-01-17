import type { Metadata } from 'next';
import { getCouncilBySlug, getAllCouncilSlugs, getCouncilDisplayName } from '@/data/councils';

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateStaticParams() {
  const slugs = getAllCouncilSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const council = getCouncilBySlug(slug);

  if (!council) {
    return {
      title: 'Council Not Found | CivAccount',
    };
  }

  const displayName = getCouncilDisplayName(council);
  const bandD = council.council_tax?.band_d_2025;
  const bandDText = bandD ? ` - Band D £${bandD.toLocaleString('en-GB')}` : '';

  return {
    title: `${displayName} Budget & Council Tax 2025-26 | CivAccount`,
    description: `See how ${displayName} spends your council tax${bandDText}. Budget breakdown, service spending, and tax band information for 2025-26.`,
    openGraph: {
      title: `${displayName} Council Tax & Budget`,
      description: `Council tax and budget breakdown for ${displayName} 2025-26`,
      type: 'website',
    },
  };
}

export default function CouncilLayout({ children }: Props) {
  return children;
}
