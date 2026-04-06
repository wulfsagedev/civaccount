import type { Metadata } from 'next';
import { getCouncilBySlug, getCouncilDisplayName } from '@/data/councils';

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const council = getCouncilBySlug(slug);

  if (!council) {
    return {
      title: 'Proposals | CivAccount',
    };
  }

  const displayName = getCouncilDisplayName(council);

  return {
    title: `Town Hall — ${displayName} | CivAccount`,
    description: `Have your say on how ${displayName} spends your money. Vote on ideas, suggest changes, and join the conversation.`,
    alternates: {
      canonical: `/council/${slug}/proposals`,
    },
    openGraph: {
      title: `Town Hall — ${displayName}`,
      description: `Have your say on how ${displayName} spends your money. Vote, comment, and suggest changes.`,
      type: 'website',
      siteName: 'CivAccount',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Town Hall — ${displayName}`,
      description: `Have your say on how ${displayName} spends your money. Vote, comment, and suggest changes.`,
    },
  };
}

export default async function ProposalsLayout({ children }: Props) {
  return <>{children}</>;
}
