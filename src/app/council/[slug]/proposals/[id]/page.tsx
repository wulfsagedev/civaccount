'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getCouncilBySlug, getCouncilDisplayName, formatBudget } from '@/data/councils';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getCategoryLabel, timeAgo, PROPOSAL_STATUS_LABELS } from '@/lib/proposals';
import { CARD_STYLES } from '@/lib/utils';
import VoteButton from '@/components/proposals/VoteButton';
import CommentThread from '@/components/proposals/CommentThread';
import CommentForm from '@/components/proposals/CommentForm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { getDiffsForCouncil } from '@/lib/civic-diffs';

interface Proposal {
  id: string;
  council_slug: string;
  budget_category: string;
  title: string;
  body: string;
  author_id: string;
  score: number;
  status: string;
  labels: string[];
  comment_count: number;
  created_at: string;
}

interface Comment {
  id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  author: {
    display_name: string | null;
  } | null;
}

export default function ProposalDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const proposalId = params.id as string;
  const council = useMemo(() => getCouncilBySlug(slug), [slug]);
  const { user } = useAuth();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    // Fetch proposal
    const { data: proposalData } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (!proposalData) {
      setIsLoading(false);
      return;
    }

    setProposal(proposalData);

    // Fetch author name
    const { data: authorData } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', proposalData.author_id)
      .single();
    setAuthorName(authorData?.display_name ?? null);

    // Fetch user vote
    if (user) {
      const { data: voteData } = await supabase
        .from('votes')
        .select('direction')
        .eq('proposal_id', proposalId)
        .eq('user_id', user.id)
        .single();
      setUserVote((voteData?.direction as 'up' | 'down') ?? null);
    }

    // Fetch comments with author names
    const { data: commentsData } = await supabase
      .from('comments')
      .select('id, body, created_at, parent_id, author_id')
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: true });

    if (commentsData && commentsData.length > 0) {
      const commentAuthorIds = [...new Set(commentsData.map((c) => c.author_id))];
      const { data: commentAuthors } = await supabase
        .from('users')
        .select('id, display_name')
        .in('id', commentAuthorIds);

      const authorMap = new Map(commentAuthors?.map((a) => [a.id, a.display_name]) ?? []);

      setComments(
        commentsData.map((c) => ({
          id: c.id,
          body: c.body,
          created_at: c.created_at,
          parent_id: c.parent_id,
          author: { display_name: authorMap.get(c.author_id) ?? null },
        }))
      );
    }

    setIsLoading(false);
  }, [proposalId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!council) return null;

  const displayName = getCouncilDisplayName(council);

  // Get budget figure for the linked category
  const budgetAmount = proposal && council.budget
    ? council.budget[proposal.budget_category as keyof typeof council.budget]
    : null;

  // Get relevant civic diffs for this council
  const civicDiffs = useMemo(() => getDiffsForCouncil(slug), [slug]);

  if (isLoading) {
    return (
      <>
        <Header />
        <main id="main-content" className="container mx-auto px-4 py-6 max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-32" />
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </main>
      </>
    );
  }

  if (!proposal) {
    return (
      <>
        <Header />
        <main id="main-content" className="container mx-auto px-4 py-6 max-w-3xl text-center">
          <p className="type-body text-muted-foreground">Proposal not found.</p>
          <Link
            href={`/council/${slug}/proposals`}
            className="type-body-sm text-navy-600 hover:underline mt-4 inline-block cursor-pointer"
          >
            Back to proposals
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Back link */}
        <Link
          href={`/council/${slug}/proposals`}
          className="inline-flex items-center gap-2 type-body-sm text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {displayName} proposals
        </Link>

        {/* Proposal card */}
        <div className={`${CARD_STYLES} p-5 sm:p-8`}>
          <div className="flex gap-4">
            {/* Vote column */}
            <div className="shrink-0 pt-1">
              <VoteButton
                proposalId={proposal.id}
                initialScore={proposal.score}
                initialUserVote={userVote}
                layout="vertical"
              />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <h1 className="type-title-1 mb-2">{proposal.title}</h1>

              {/* Meta */}
              <div className="flex items-center flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="type-caption bg-navy-50 text-navy-600 border-navy-200">
                  {getCategoryLabel(proposal.budget_category)}
                </Badge>
                <Badge variant="outline" className="type-caption">
                  {PROPOSAL_STATUS_LABELS[proposal.status] ?? proposal.status}
                </Badge>
                {proposal.labels.map((label) => (
                  <Badge key={label} variant="outline" className="type-caption">
                    {label}
                  </Badge>
                ))}
              </div>

              {/* Budget context */}
              {budgetAmount !== null && budgetAmount !== undefined && (
                <div className="p-3 rounded-lg bg-muted/30 mb-4">
                  <p className="type-caption text-muted-foreground">
                    {displayName} currently spends{' '}
                    <span className="font-semibold text-foreground">{formatBudget(budgetAmount as number)}</span>
                    {' '}on {getCategoryLabel(proposal.budget_category).toLowerCase()}.
                  </p>
                </div>
              )}

              {/* Civic diffs — recent changes */}
              {civicDiffs.length > 0 && (
                <div className="space-y-2 mb-4">
                  {civicDiffs.slice(0, 2).map((diff) => (
                    <div key={diff.id} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                      {diff.pct_change > 0 ? (
                        <TrendingUp className="h-4 w-4 text-negative shrink-0 mt-0.5" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-positive shrink-0 mt-0.5" aria-hidden="true" />
                      )}
                      <p className="type-caption text-muted-foreground">{diff.summary}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Body */}
              <div className="type-body text-foreground whitespace-pre-wrap mb-4">
                {proposal.body}
              </div>

              {/* Author + time */}
              <p className="type-caption text-muted-foreground">
                Posted by {authorName ?? 'Anonymous'} {timeAgo(proposal.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Comments section */}
        <div className={`${CARD_STYLES} p-5 sm:p-8 mt-4`}>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <h2 className="type-title-2">
              {proposal.comment_count === 0
                ? 'Discussion'
                : `${proposal.comment_count} comment${proposal.comment_count !== 1 ? 's' : ''}`}
            </h2>
          </div>

          {/* Comment form */}
          <div className="mb-6">
            <CommentForm proposalId={proposal.id} onSubmitted={fetchData} />
          </div>

          {/* Comment thread */}
          <CommentThread comments={comments} proposalId={proposal.id} />
        </div>
      </main>
      <Footer />
    </>
  );
}
