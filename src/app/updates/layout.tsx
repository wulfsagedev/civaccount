import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Updates - What\'s new in CivAccount',
  description: 'See the latest updates and improvements to CivAccount. We regularly add new councils, features, and data to help you understand your council tax.',
  openGraph: {
    title: 'Updates - What\'s new in CivAccount',
    description: 'See the latest updates and improvements to CivAccount.',
  },
};

export default function UpdatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
