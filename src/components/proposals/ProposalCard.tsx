'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import { getCategoryLabel, timeAgo, PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_STYLES, PROPOSAL_STATUS_DESCRIPTIONS } from '@/lib/proposals';
import VoteButton from './VoteButton';
import ShareButton from './ShareButton';
import MilestoneBar from './MilestoneBar';
import { CARD_STYLES } from '@/lib/utils';

interface ProposalCardProps {
  proposal: {
    id: string;
    title: string;
    body: string;
    budget_category: string;
    score: number;
    status: string;
    labels: string[];
    comment_count: number;
    created_at: string;
    council_slug: string;
    author: {
      display_name: string | null;
    } | null;
  };
  userVote: 'up' | 'down' | null;
  isHighlighted?: boolean;
}

export default function ProposalCard({ proposal, userVote, isHighlighted }: ProposalCardProps) {
  const statusStyle = PROPOSAL_STATUS_STYLES[proposal.status] ?? '';
  const statusDescription = PROPOSAL_STATUS_DESCRIPTIONS[proposal.status] ?? '';

  return (
    <div className={`${CARD_STYLES} p-4 sm:p-5 ${isHighlighted ? 'ring-2 ring-foreground/10' : ''}`}>
      <div className="flex gap-3">
        {/* Vote column */}
        <div className="shrink-0">
          <VoteButton
            proposalId={proposal.id}
            initialScore={proposal.score}
            initialUserVote={userVote}
            layout="vertical"
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <Link
            href={`/council/${proposal.council_slug}/proposals/${proposal.id}`}
            className="block group cursor-pointer"
          >
            <h3 className="type-body font-semibold group-hover:text-navy-600 transition-colors line-clamp-2">
              {proposal.title}
            </h3>
          </Link>

          <p className="type-body-sm text-muted-foreground mt-1 line-clamp-2">
            {proposal.body}
          </p>

          {/* Milestone progress */}
          {proposal.score > 0 && (
            <MilestoneBar score={proposal.score} />
          )}

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-2 mt-3">
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
            <span className="type-caption text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              {proposal.comment_count}
            </span>
            <span className="type-caption text-muted-foreground">
              {timeAgo(proposal.created_at)}
            </span>
            {proposal.author?.display_name && (
              <span className="type-caption text-muted-foreground">
                by {proposal.author.display_name}
              </span>
            )}
            <ShareButton
              title={proposal.title}
              text={`${proposal.title} — ${proposal.score} votes on CivAccount. Have your say.`}
              url={typeof window !== 'undefined' ? `${window.location.origin}/council/${proposal.council_slug}/proposals/${proposal.id}` : ''}
              imageUrl={`/council/${proposal.council_slug}/proposals/${proposal.id}/opengraph-image`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
