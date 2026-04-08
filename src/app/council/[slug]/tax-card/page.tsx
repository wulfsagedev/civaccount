import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCouncilBySlug, getCouncilDisplayName, formatCurrency } from '@/data/councils';
import { buildBreadcrumbSchema } from '@/lib/structured-data';
import TaxCardClient from './TaxCardClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const council = getCouncilBySlug(slug);
  if (!council) return { title: 'Council Tax Card | CivAccount' };

  const name = getCouncilDisplayName(council);
  const bandD = council.council_tax?.band_d_2025;
  const bandDText = bandD ? ` Band D: ${formatCurrency(bandD, { decimals: 2 })}` : '';

  return {
    title: `Your Council Tax Card — ${name} | CivAccount`,
    description: `See exactly where your council tax goes in ${name}.${bandDText}. Get your personalised receipt and share it.`,
    alternates: { canonical: `/council/${slug}/tax-card` },
    openGraph: {
      title: `Your Council Tax Card — ${name}`,
      description: `Where does your council tax go? See your personalised receipt for ${name}.`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Your Council Tax Card — ${name}`,
      description: `Where does your council tax go? See your personalised receipt for ${name}.`,
    },
  };
}

export default async function TaxCardPage({ params }: Props) {
  const { slug } = await params;
  const council = getCouncilBySlug(slug);
  if (!council || !council.council_tax?.band_d_2025) notFound();

  const name = getCouncilDisplayName(council);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbSchema(
        [{ name: 'Home', url: '/' }, { name: name, url: `/council/${slug}` }, { name: 'Tax Card' }],
        `/council/${slug}/tax-card`
      ),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TaxCardClient />
    </>
  );
}
