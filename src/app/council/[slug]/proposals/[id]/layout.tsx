import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getCouncilBySlug, getCouncilDisplayName } from '@/data/councils';
import { getCategoryLabel } from '@/lib/proposals';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const council = getCouncilBySlug(slug);
  const displayName = council ? getCouncilDisplayName(council) : 'Council';

  // Fetch proposal from Supabase for title/description
  const supabase = await createClient();
  const { data: proposal } = await supabase
    .from('proposals')
    .select('title, body, budget_category, score')
    .eq('id', id)
    .single();

  if (!proposal) {
    return {
      title: `Proposal — ${displayName} Town Hall`,
      description: `View this proposal for ${displayName} on CivAccount Town Hall.`,
    };
  }

  const category = getCategoryLabel(proposal.budget_category);
  const bodyPreview = proposal.body.length > 155
    ? proposal.body.slice(0, 155).trimEnd() + '...'
    : proposal.body;

  return {
    title: `${proposal.title} — ${displayName} Town Hall`,
    description: bodyPreview,
    alternates: {
      canonical: `/council/${slug}/proposals/${id}`,
    },
    openGraph: {
      title: `${proposal.title}`,
      description: `${bodyPreview} — ${proposal.score} votes · ${category} · ${displayName}`,
      type: 'article',
      siteName: 'CivAccount',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${proposal.title}`,
      description: `${bodyPreview} — ${proposal.score} votes · ${category}`,
    },
  };
}

export default function ProposalDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
