'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { isUKUser } from '@/lib/geo';

interface VoteButtonProps {
  proposalId: string;
  initialScore: number;
  initialUserVote: 'up' | 'down' | null;
  layout?: 'vertical' | 'horizontal';
}

export default function VoteButton({
  proposalId,
  initialScore,
  initialUserVote,
  layout = 'vertical',
}: VoteButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = useCallback(async (direction: 'up' | 'down') => {
    if (!isUKUser()) {
      router.push('/uk-only');
      return;
    }
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}&reason=vote`);
      return;
    }
    if (isVoting) return;

    setIsVoting(true);
    const supabase = createClient();

    // Optimistic update
    const prevScore = score;
    const prevVote = userVote;
    const isRemoving = userVote === direction;

    if (isRemoving) {
      // Remove vote
      setUserVote(null);
      setScore(score + (direction === 'up' ? -1 : 1));
    } else {
      // Add or change vote
      const delta = userVote === null
        ? (direction === 'up' ? 1 : -1)
        : (direction === 'up' ? 2 : -2);
      setUserVote(direction);
      setScore(score + delta);
    }

    try {
      if (isRemoving) {
        // Remove vote
        await supabase
          .from('votes')
          .delete()
          .eq('proposal_id', proposalId)
          .eq('user_id', user.id);
        toast('Vote removed.');
      } else if (prevVote === null) {
        // New vote
        await supabase
          .from('votes')
          .insert({ proposal_id: proposalId, user_id: user.id, direction });

        // First-time voter context (one-time)
        const explained = localStorage.getItem('civaccount_vote_explained');
        if (!explained) {
          toast.success('Vote recorded. You can change or remove your vote at any time.');
          localStorage.setItem('civaccount_vote_explained', '1');
        } else {
          toast.success('Vote recorded.');
        }
      } else {
        // Change vote direction
        await supabase
          .from('votes')
          .update({ direction })
          .eq('proposal_id', proposalId)
          .eq('user_id', user.id);
        toast.success('Vote changed.');
      }
    } catch {
      // Revert on error
      setScore(prevScore);
      setUserVote(prevVote);
      toast.error('Could not record your vote. Try again.');
    }

    setIsVoting(false);
  }, [user, router, isVoting, score, userVote, proposalId]);

  const isVertical = layout === 'vertical';

  return (
    <div className={cn(
      'flex items-center gap-0.5',
      isVertical ? 'flex-col' : 'flex-row'
    )}>
      <button
        type="button"
        onClick={() => handleVote('up')}
        disabled={isVoting}
        className={cn(
          'flex items-center justify-center rounded-md transition-colors cursor-pointer',
          isVertical ? 'w-11 h-11' : 'w-11 h-11',
          userVote === 'up'
            ? 'text-positive bg-muted'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        aria-label="Vote up"
      >
        <ChevronUp className={isVertical ? 'h-5 w-5' : 'h-4 w-4'} />
      </button>
      <span
        key={score}
        className={cn(
          'font-semibold tabular-nums text-center animate-in zoom-in-95 fade-in duration-180 ease-out-snap motion-reduce:animate-none',
          isVertical ? 'type-body min-w-[2ch]' : 'type-body-sm min-w-[2ch] px-1',
          score > 0 ? 'text-positive' : score < 0 ? 'text-negative' : 'text-muted-foreground'
        )}
      >
        {score}
      </span>
      <button
        type="button"
        onClick={() => handleVote('down')}
        disabled={isVoting}
        className={cn(
          'flex items-center justify-center rounded-md transition-colors cursor-pointer',
          isVertical ? 'w-11 h-11' : 'w-11 h-11',
          userVote === 'down'
            ? 'text-negative bg-muted'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        aria-label="Vote down"
      >
        <ChevronDown className={isVertical ? 'h-5 w-5' : 'h-4 w-4'} />
      </button>
    </div>
  );
}
