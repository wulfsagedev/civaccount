import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Product Roadmap - What we\'re building',
  description: 'See what features we\'re working on next for CivAccount. Our focus is on data quality, verifiability, and making council information trustworthy.',
  openGraph: {
    title: 'Product Roadmap - What we\'re building',
    description: 'See what features we\'re working on next for CivAccount.',
  },
};

export default function RoadmapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
