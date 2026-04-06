import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Council Tax Insights - Compare all 317 English councils',
  description: 'Compare council tax rates and spending across all 317 English councils. See which councils charge the most and least, and how your council compares.',
  alternates: {
    canonical: '/insights',
  },
  openGraph: {
    title: 'Council Tax Insights - Compare all 317 English councils',
    description: 'Compare council tax rates and spending across all 317 English councils.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Council Tax Insights - Compare all 317 English councils',
    description: 'Compare council tax rates and spending across all 317 English councils.',
  },
};

export default function InsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
