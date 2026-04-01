'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import { getCategoryLabel, timeAgo } from '@/lib/proposals';
import VoteButton from './VoteButton';
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
}

export default function ProposalCard({ proposal, userVote }: ProposalCardProps) {
  return (
    <div className={`${CARD_STYLES} p-4 sm:p-5`}>
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

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="type-caption bg-navy-50 text-navy-600 border-navy-200">
              {getCategoryLabel(proposal.budget_category)}
            </Badge>
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
          </div>
        </div>
      </div>
    </div>
  );
}
