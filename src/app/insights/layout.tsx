import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Council Tax Insights — Compare All 317 English Councils',
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
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
