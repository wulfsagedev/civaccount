'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { isUKUser } from '@/lib/geo';

interface CommentFormProps {
  proposalId: string;
  parentId?: string | null;
  mode?: 'create' | 'edit';
  commentId?: string;
  initialBody?: string;
  onCancel?: () => void;
  onSubmitted?: () => void;
  autoFocus?: boolean;
}

export default function CommentForm({
  proposalId,
  parentId = null,
  mode = 'create',
  commentId,
  initialBody = '',
  onCancel,
  onSubmitted,
  autoFocus = false,
}: CommentFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [body, setBody] = useState(mode === 'edit' ? initialBody : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  if (!user) {
    return (
      <div className="p-4 rounded-lg bg-muted/30 text-center">
        <p className="type-body-sm text-muted-foreground mb-1">
          Sign in to join the discussion.
        </p>
        <p className="type-caption text-muted-foreground mb-3">
          We use email-only sign in — no passwords needed.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`)}
          className="cursor-pointer"
        >
          Sign in
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    if (!isUKUser()) {
      router.push('/uk-only');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const supabase = createClient();

    if (mode === 'edit' && commentId) {
      const { error: updateError } = await supabase
        .from('comments')
        .update({
          body: body.trim(),
          edited_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .eq('author_id', user.id);

      if (updateError) {
        setError('Could not save your changes. Try again.');
        setIsSubmitting(false);
        return;
      }

      toast.success('Comment updated.');
      setIsSubmitting(false);
      onSubmitted?.();
      return;
    }

    // Create mode
    const { error: insertError } = await supabase.from('comments').insert({
      proposal_id: proposalId,
      parent_id: parentId,
      author_id: user.id,
      body: body.trim(),
    });

    if (insertError) {
      setError('Could not post comment. Try again.');
      setIsSubmitting(false);
      return;
    }

    setBody('');
    setIsSubmitting(false);
    onSubmitted?.();
  };

  const remaining = 2000 - body.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={
          mode === 'edit' ? '' :
          parentId ? 'Write a reply...' : 'Share your thoughts...'
        }
        maxLength={2000}
        rows={parentId ? 2 : 3}
        className="resize-none"
      />
      {error && <p className="type-caption text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !body.trim()}
          className="cursor-pointer"
        >
          {isSubmitting
            ? (mode === 'edit' ? 'Saving...' : 'Posting...')
            : mode === 'edit'
              ? 'Save changes'
              : parentId ? 'Reply' : 'Comment'
          }
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="cursor-pointer"
          >
            Cancel
          </Button>
        )}
        <span
          className={`type-caption ml-auto tabular-nums ${
            remaining <= 100 ? 'text-destructive' : remaining <= 400 ? 'text-negative' : 'text-muted-foreground'
          }`}
          aria-live="polite"
        >
          {remaining} remaining
        </span>
      </div>
    </form>
  );
}
