'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';

interface CommentFormProps {
  proposalId: string;
  parentId?: string | null;
  onCancel?: () => void;
  onSubmitted?: () => void;
}

export default function CommentForm({ proposalId, parentId = null, onCancel, onSubmitted }: CommentFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="p-4 rounded-lg bg-muted/30 text-center">
        <p className="type-body-sm text-muted-foreground mb-2">
          Sign in to join the discussion.
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

    setIsSubmitting(true);
    setError('');

    const supabase = createClient();
    const { error: insertError } = await supabase.from('comments').insert({
      proposal_id: proposalId,
      parent_id: parentId,
      author_id: user.id,
      body: body.trim(),
    });

    if (insertError) {
      setError('Failed to post comment. Please try again.');
      setIsSubmitting(false);
      return;
    }

    setBody('');
    setIsSubmitting(false);
    onSubmitted?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={parentId ? 'Write a reply...' : 'Share your thoughts...'}
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
          {isSubmitting ? 'Posting...' : parentId ? 'Reply' : 'Comment'}
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
        <span className="type-caption text-muted-foreground ml-auto tabular-nums">
          {body.length}/2000
        </span>
      </div>
    </form>
  );
}
