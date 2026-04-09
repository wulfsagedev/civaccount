import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Methodology — How We Source Our Data',
  description: 'How CivAccount collects, verifies, and presents council budget data. All data comes from official UK government sources.',
  alternates: {
    canonical: '/methodology',
  },
  openGraph: {
    title: 'Methodology - How we source our data',
    description: 'How CivAccount collects, verifies, and presents council budget data.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Methodology - How we source our data',
    description: 'How CivAccount collects, verifies, and presents council budget data.',
  },
};

export default function MethodologyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
