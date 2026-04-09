'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCouncilBySlug, getCouncilDisplayName, formatBudget } from '@/data/councils';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  getCategoryLabel, timeAgo, PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_DESCRIPTIONS, PROPOSAL_STATUS_STYLES,
  canEdit, editWindowRemaining,
} from '@/lib/proposals';
import { CARD_STYLES } from '@/lib/utils';
import VoteButton from '@/components/proposals/VoteButton';
import ShareButton from '@/components/proposals/ShareButton';
import CommentThread from '@/components/proposals/CommentThread';
import CommentForm from '@/components/proposals/CommentForm';
import ProposalForm from '@/components/proposals/ProposalForm';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, TrendingUp, TrendingDown, Pencil, Trash2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getDiffsForCouncil } from '@/lib/civic-diffs';
import MilestoneBar from '@/components/proposals/MilestoneBar';
import { toast } from 'sonner';

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
  edited_at?: string | null;
}

interface Comment {
  id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  status?: string;
  edited_at?: string | null;
  author_id?: string;
  author: {
    display_name: string | null;
  } | null;
}

export default function ProposalDetailPage() {
  const params = useParams();
  const routerNav = useRouter();
  const slug = params.slug as string;
  const proposalId = params.id as string;
  const council = useMemo(() => getCouncilBySlug(slug), [slug]);
  const { user } = useAuth();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      .select('id, body, created_at, parent_id, author_id, status, edited_at')
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
          status: c.status,
          edited_at: c.edited_at,
          author_id: c.author_id,
          author: { display_name: authorMap.get(c.author_id) ?? null },
        }))
      );
    }

    setIsLoading(false);
  }, [proposalId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!user || !proposal) return;
    setIsDeleting(true);

    const supabase = createClient();
    const { error } = await supabase
      .from('proposals')
      .update({ status: 'deleted' })
      .eq('id', proposal.id)
      .eq('author_id', user.id);

    if (error) {
      toast.error('Could not delete proposal. Try again.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      return;
    }

    toast('Proposal deleted.');
    routerNav.push(`/council/${slug}/proposals`);
  };

  // Hooks must be called before any early returns
  const civicDiffs = useMemo(() => getDiffsForCouncil(slug), [slug]);

  if (!council) return null;

  const displayName = getCouncilDisplayName(council);
  const isAuthor = user && proposal && user.id === proposal.author_id;
  const canEditProposal = isAuthor && proposal && canEdit(proposal.created_at);
  const editTimeLeft = proposal ? editWindowRemaining(proposal.created_at) : '';

  const budgetAmount = proposal && council.budget
    ? council.budget[proposal.budget_category as keyof typeof council.budget]
    : null;

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
            Back to Town Hall
          </Link>
        </main>
      </>
    );
  }

  // Status badge styling
  const statusStyle = PROPOSAL_STATUS_STYLES[proposal.status] ?? 'bg-muted text-muted-foreground';
  const statusDescription = PROPOSAL_STATUS_DESCRIPTIONS[proposal.status] ?? '';

  return (
    <>
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: displayName, href: `/council/${slug}` },
          { label: 'Town Hall', href: `/council/${slug}/proposals` },
          { label: proposal.title },
        ]} />

        {/* Proposal card */}
        {isEditing ? (
          <div className={`${CARD_STYLES} p-5 sm:p-8`}>
            <h2 className="type-title-2 mb-6">Edit proposal</h2>
            <ProposalForm
              council={council}
              councilSlug={slug}
              mode="edit"
              initialData={{
                id: proposal.id,
                title: proposal.title,
                body: proposal.body,
                budget_category: proposal.budget_category,
                labels: proposal.labels,
              }}
              onSaved={() => {
                setIsEditing(false);
                fetchData();
              }}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : (
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
                {/* Title row with share action */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h1 className="type-title-1">{proposal.title}</h1>
                  <div className="shrink-0 pt-1">
                    <ShareButton
                      title={proposal.title}
                      text={`${proposal.title} — ${proposal.score} votes on CivAccount. Have your say.`}
                      url={`${typeof window !== 'undefined' ? window.location.origin : ''}/council/${slug}/proposals/${proposal.id}`}
                      imageUrl={`/council/${slug}/proposals/${proposal.id}/opengraph-image`}
                    />
                  </div>
                </div>

                {/* Body — immediately after title */}
                <div className="type-body text-foreground whitespace-pre-wrap mb-4">
                  {proposal.body}
                </div>

                {/* Milestone progress */}
                {proposal.score > 0 && (
                  <div className="mb-4">
                    <MilestoneBar score={proposal.score} />
                  </div>
                )}

                {/* Footer: author line */}
                <p className="type-caption text-muted-foreground mb-2">
                  Posted by {isAuthor ? 'you' : (authorName ?? 'Anonymous')} {timeAgo(proposal.created_at)}
                  {proposal.edited_at && (
                    <span title={`Edited ${timeAgo(proposal.edited_at)}`}> (edited)</span>
                  )}
                </p>
                {/* Tags */}
                <div className="flex items-center flex-wrap gap-1.5">
                  <Badge variant="outline" className="type-caption bg-navy-50 text-navy-600 border-navy-200">
                    {getCategoryLabel(proposal.budget_category)}
                  </Badge>
                  {proposal.status !== 'open' && (
                    <Badge
                      variant="outline"
                      className={`type-caption ${statusStyle}`}
                      title={statusDescription}
                    >
                      {PROPOSAL_STATUS_LABELS[proposal.status] ?? proposal.status}
                    </Badge>
                  )}
                  {proposal.labels.map((label) => (
                    <Badge key={label} variant="outline" className="type-caption">
                      {label}
                    </Badge>
                  ))}
                </div>

                {/* Author actions */}
                {isAuthor && (
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
                    {canEditProposal && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-1.5 type-caption text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </button>
                    )}
                    {canEditProposal && editTimeLeft && (
                      <span className="type-caption text-muted-foreground/60">
                        {editTimeLeft}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="inline-flex items-center gap-1.5 type-caption text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                )}

                {/* Context section — budget + recent changes, separated from the proposal */}
                {(budgetAmount !== null && budgetAmount !== undefined) || civicDiffs.length > 0 ? (
                  <div className="mt-5 pt-4 border-t border-border/50">
                    <p className="type-caption font-semibold text-muted-foreground mb-3">Context</p>

                    {/* Budget context — inline, not boxed */}
                    {budgetAmount !== null && budgetAmount !== undefined && (
                      <p className="type-caption text-muted-foreground mb-2">
                        {displayName} spends{' '}
                        <span className="font-semibold text-foreground">{formatBudget(budgetAmount as number)}</span>
                        {' '}on {getCategoryLabel(proposal.budget_category).toLowerCase()}.
                      </p>
                    )}

                    {/* Civic diffs — compact inline list */}
                    {civicDiffs.slice(0, 2).map((diff) => (
                      <div key={diff.id} className="flex items-start gap-2 mb-1.5">
                        {diff.pct_change > 0 ? (
                          <TrendingUp className="h-3.5 w-3.5 text-negative shrink-0 mt-0.5" aria-hidden="true" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-positive shrink-0 mt-0.5" aria-hidden="true" />
                        )}
                        <p className="type-caption text-muted-foreground">{diff.summary}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Status description for non-open statuses */}
                {proposal.status !== 'open' && statusDescription && (
                  <p className="type-caption text-muted-foreground mt-3">
                    {statusDescription}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Budget context — how much the council spends in this area */}
        {budgetAmount && typeof budgetAmount === 'number' && budgetAmount > 0 && (
          <Link
            href={`/council/${slug}`}
            className={`${CARD_STYLES} mt-4 p-4 sm:p-5 flex items-center justify-between group hover:bg-muted/50 transition-colors cursor-pointer`}
          >
            <div className="leading-tight">
              <p className="type-body-sm font-semibold group-hover:text-foreground transition-colors">
                {displayName} spends{' '}
                <span className="text-foreground">{formatBudget(budgetAmount)}</span>
                {' '}per year on {getCategoryLabel(proposal.budget_category).toLowerCase()}
              </p>
              <p className="type-caption text-muted-foreground">
                See the full budget breakdown
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
          </Link>
        )}

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

        {/* Delete confirmation */}
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete this proposal?"
          description="This removes the proposal and all its votes and comments permanently."
          confirmLabel="Delete proposal"
          variant="destructive"
          onConfirm={handleDelete}
          isLoading={isDeleting}
        />
      </main>
      <Footer />
    </>
  );
}
