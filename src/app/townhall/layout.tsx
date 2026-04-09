import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Town Hall — Have Your Say',
  description: 'Have your say on how your council spends your money. Vote on ideas, suggest changes, and join the conversation with other residents across 317 English councils.',
  alternates: {
    canonical: '/townhall',
  },
  openGraph: {
    title: 'Town Hall — Have Your Say on Council Spending',
    description: 'Vote on ideas, suggest changes, and join the conversation with other residents. 317 English councils.',
    type: 'website',
    siteName: 'CivAccount',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Town Hall — Have Your Say on Council Spending',
    description: 'Vote on ideas, suggest changes, and join the conversation with other residents.',
  },
};

export default function TownHallLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
