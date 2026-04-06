'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { timeAgo, canEdit } from '@/lib/proposals';
import { cn } from '@/lib/utils';
import { Flag, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import CommentForm from './CommentForm';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { isUKUser } from '@/lib/geo';

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

function CommentNode({
  comment,
  proposalId,
  depth,
  onRefresh,
}: {
  comment: Comment;
  proposalId: string;
  depth: number;
  onRefresh?: () => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [showReply, setShowReply] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFlagConfirm, setShowFlagConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const [flagged, setFlagged] = useState(false);

  const isAuthor = user && comment.author_id && user.id === comment.author_id;
  const isRemoved = comment.status === 'removed';
  const canEditComment = isAuthor && canEdit(comment.created_at) && !isRemoved;
  const canReply = depth < 2 && !isRemoved;

  // Check if already flagged via localStorage
  const alreadyFlagged = typeof window !== 'undefined' && localStorage.getItem(`flagged_${comment.id}`) === '1';

  const handleFlag = useCallback(async () => {
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setIsFlagging(true);
    const supabase = createClient();
    // Use RPC to atomically flag — prevents race conditions and enforces one-flag-per-user
    const { error } = await supabase.rpc('flag_comment', { p_comment_id: comment.id });
    if (error) {
      if (error.message.includes('already flagged')) {
        toast('You have already flagged this comment.');
      } else {
        toast('Could not flag comment. Try again.');
      }
    } else {
      localStorage.setItem(`flagged_${comment.id}`, '1');
      setFlagged(true);
      toast('Comment flagged. Thank you.');
    }
    setIsFlagging(false);
    setShowFlagConfirm(false);
  }, [user, router, comment.id]);

  const handleDelete = async () => {
    if (!user) return;
    setIsDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('comments')
      .update({ body: '', status: 'removed' })
      .eq('id', comment.id)
      .eq('author_id', user.id);

    if (error) {
      toast.error('Could not delete comment. Try again.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      return;
    }

    toast('Comment deleted.');
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    onRefresh?.();
  };

  // Removed comment placeholder
  if (isRemoved) {
    return (
      <div className={cn(depth > 0 && 'ml-4 sm:ml-6 pl-4 border-l-2 border-border/40')}>
        <div className="py-3">
          <p className="type-body-sm text-muted-foreground italic">
            [Removed by author]
          </p>
        </div>
        {comment.children?.map((child) => (
          <CommentNode
            key={child.id}
            comment={child}
            proposalId={proposalId}
            depth={depth + 1}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn(depth > 0 && 'ml-4 sm:ml-6 pl-4 border-l-2 border-border/40')}>
      <div className="py-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="type-body-sm font-semibold">
            {isAuthor ? 'You' : (comment.author?.display_name ?? 'Anonymous')}
          </span>
          <span className="type-caption text-muted-foreground">
            {timeAgo(comment.created_at)}
          </span>
          {comment.edited_at && (
            <span className="type-caption text-muted-foreground" title={`Edited ${timeAgo(comment.edited_at)}`}>
              (edited)
            </span>
          )}
        </div>

        {isEditing ? (
          <CommentForm
            proposalId={proposalId}
            mode="edit"
            commentId={comment.id}
            initialBody={comment.body}
            onCancel={() => setIsEditing(false)}
            onSubmitted={() => {
              setIsEditing(false);
              onRefresh?.();
            }}
          />
        ) : (
          <>
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
              {canEditComment && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="type-caption text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </button>
              )}
              {isAuthor && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="type-caption text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete
                </button>
              )}
              {!isAuthor && (
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                      return;
                    }
                    if (alreadyFlagged || flagged) return;
                    setShowFlagConfirm(true);
                  }}
                  disabled={isFlagging || flagged || alreadyFlagged}
                  className={cn(
                    "type-caption transition-colors flex items-center gap-1 cursor-pointer",
                    flagged || alreadyFlagged ? "text-negative" : "text-muted-foreground hover:text-negative"
                  )}
                  aria-label="Flag this comment"
                >
                  <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                  {flagged || alreadyFlagged ? 'Flagged' : 'Flag'}
                </button>
              )}
            </div>
          </>
        )}

        {showReply && (
          <div className="mt-3">
            {/* Reply context quote */}
            <div className="mb-2 pl-3 border-l-2 border-border/40">
              <p className="type-caption text-muted-foreground">
                Replying to {comment.author?.display_name ?? 'Anonymous'}
              </p>
              <p className="type-caption text-muted-foreground/70 line-clamp-2">
                {comment.body.length > 100 ? comment.body.slice(0, 100) + '...' : comment.body}
              </p>
            </div>
            <CommentForm
              proposalId={proposalId}
              parentId={comment.id}
              onCancel={() => setShowReply(false)}
              onSubmitted={() => {
                setShowReply(false);
                onRefresh?.();
              }}
              autoFocus
            />
          </div>
        )}
      </div>

      {comment.children?.map((child) => (
        <CommentNode
          key={child.id}
          comment={child}
          proposalId={proposalId}
          depth={depth + 1}
          onRefresh={onRefresh}
        />
      ))}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete this comment?"
        description="The comment will be replaced with '[Removed by author]'. Replies will remain."
        confirmLabel="Delete comment"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      {/* Flag confirmation */}
      <ConfirmDialog
        open={showFlagConfirm}
        onOpenChange={setShowFlagConfirm}
        title="Flag this comment?"
        description="This marks the comment for review. Comments with 3 or more flags are hidden."
        confirmLabel="Flag comment"
        variant="default"
        onConfirm={handleFlag}
        isLoading={isFlagging}
      />
    </div>
  );
}

export default function CommentThread({ comments, proposalId }: CommentThreadProps) {
  const tree = buildTree(comments);
  const [, forceUpdate] = useState(0);
  const handleRefresh = () => forceUpdate(n => n + 1);

  return (
    <div className="space-y-0 divide-y divide-border/40">
      {tree.length === 0 ? (
        <p className="type-body-sm text-muted-foreground py-6 text-center">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        tree.map((comment) => (
          <CommentNode
            key={comment.id}
            comment={comment}
            proposalId={proposalId}
            depth={0}
            onRefresh={handleRefresh}
          />
        ))
      )}
    </div>
  );
}
