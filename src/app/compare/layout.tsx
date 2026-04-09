import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare Councils — Council Tax & Spending',
  description: 'Compare council tax rates and spending across English councils side by side. Add up to 5 councils to see Band D rates, total budgets, and service breakdowns.',
  alternates: {
    canonical: '/compare',
  },
  openGraph: {
    title: 'Compare Councils — CivAccount',
    description: 'Compare council tax rates and spending across English councils side by side.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare Councils — CivAccount',
    description: 'Compare council tax rates and spending across English councils side by side.',
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
