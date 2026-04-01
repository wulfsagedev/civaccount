'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { timeAgo } from '@/lib/proposals';
import { cn } from '@/lib/utils';
import { Flag, MessageSquare } from 'lucide-react';
import CommentForm from './CommentForm';
import { useRouter } from 'next/navigation';

interface Comment {
  id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  author: {
    display_name: string | null;
  } | null;
  children?: Comment[];
}

interface CommentThreadProps {
  comments: Comment[];
  proposalId: string;
}

function buildTree(comments: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];

  comments.forEach((c) => {
    map.set(c.id, { ...c, children: [] });
  });

  comments.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function CommentNode({ comment, proposalId, depth }: { comment: Comment; proposalId: string; depth: number }) {
  const { user } = useAuth();
  const router = useRouter();
  const [showReply, setShowReply] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const [flagged, setFlagged] = useState(false);

  const handleFlag = useCallback(async () => {
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (flagged) return;
    setIsFlagging(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('comments')
      .select('flag_count')
      .eq('id', comment.id)
      .single();
    const currentCount = data?.flag_count ?? 0;
    await supabase
      .from('comments')
      .update({ flag_count: currentCount + 1, status: currentCount + 1 >= 3 ? 'flagged' as const : 'visible' as const })
      .eq('id', comment.id);
    setIsFlagging(false);
    setFlagged(true);
  }, [user, router, comment.id, flagged]);

  const canReply = depth < 2; // Max 3 levels (0, 1, 2)

  return (
    <div className={cn(depth > 0 && 'ml-4 sm:ml-6 pl-4 border-l-2 border-border/40')}>
      <div className="py-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="type-body-sm font-semibold">
            {comment.author?.display_name ?? 'Anonymous'}
          </span>
          <span className="type-caption text-muted-foreground">
            {timeAgo(comment.created_at)}
          </span>
        </div>
        <p className="type-body-sm text-foreground whitespace-pre-wrap">{comment.body}</p>
        <div className="flex items-center gap-3 mt-2">
          {canReply && (
            <button
              type="button"
              onClick={() => setShowReply(!showReply)}
              className="type-caption text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              Reply
            </button>
          )}
          <button
            type="button"
            onClick={handleFlag}
            disabled={isFlagging || flagged}
            className={cn(
              "type-caption transition-colors flex items-center gap-1 cursor-pointer",
              flagged ? "text-negative" : "text-muted-foreground hover:text-negative"
            )}
            aria-label="Flag this comment"
          >
            <Flag className="h-3.5 w-3.5" aria-hidden="true" />
            {flagged ? 'Flagged' : isFlagging ? 'Flagging...' : 'Flag'}
          </button>
        </div>
        {showReply && (
          <div className="mt-3">
            <CommentForm
              proposalId={proposalId}
              parentId={comment.id}
              onCancel={() => setShowReply(false)}
              onSubmitted={() => setShowReply(false)}
            />
          </div>
        )}
      </div>
      {comment.children?.map((child) => (
        <CommentNode key={child.id} comment={child} proposalId={proposalId} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function CommentThread({ comments, proposalId }: CommentThreadProps) {
  const tree = buildTree(comments);

  return (
    <div className="space-y-0 divide-y divide-border/40">
      {tree.length === 0 ? (
        <p className="type-body-sm text-muted-foreground py-6 text-center">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        tree.map((comment) => (
          <CommentNode key={comment.id} comment={comment} proposalId={proposalId} depth={0} />
        ))
      )}
    </div>
  );
}
