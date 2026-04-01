'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BUDGET_CATEGORIES, PROPOSAL_LABELS, saveDraft, loadDraft, clearDraft } from '@/lib/proposals';
import { formatBudget } from '@/data/councils';
import type { Council } from '@/data/councils';

interface ProposalFormProps {
  council: Council;
  councilSlug: string;
}

export default function ProposalForm({ council, councilSlug }: ProposalFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Available budget categories for this council
  const availableCategories = Object.entries(BUDGET_CATEGORIES).filter(([key]) => {
    const budget = council.budget;
    if (!budget) return false;
    const val = budget[key as keyof typeof budget];
    return val !== null && val !== undefined && val !== 0;
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = loadDraft(councilSlug);
    if (draft) {
      setTitle(draft.title);
      setBody(draft.body);
      setCategory(draft.budget_category);
      setLabels(draft.labels);
    }
  }, [councilSlug]);

  // Auto-submit if returning from auth with a saved draft
  useEffect(() => {
    if (user && title && body && category) {
      const draft = loadDraft(councilSlug);
      if (draft) {
        // User just authenticated — submit the draft
        handleSubmit();
      }
    }
    // Only run when user changes (i.e., after auth)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleLabel = (value: string) => {
    setLabels((prev) =>
      prev.includes(value) ? prev.filter((l) => l !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim() || !body.trim() || !category) return;

    // If not authenticated, save draft and redirect to login
    if (!user) {
      saveDraft({
        council_slug: councilSlug,
        budget_category: category,
        title: title.trim(),
        body: body.trim(),
        labels,
      });
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from('proposals')
      .insert({
        council_slug: councilSlug,
        budget_category: category,
        title: title.trim(),
        body: body.trim(),
        labels,
        author_id: user.id,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[ProposalForm] insert error:', insertError);
      setError(`Failed to create proposal: ${insertError.message}`);
      setIsSubmitting(false);
      return;
    }

    clearDraft();
    router.push(`/council/${councilSlug}/proposals/${data.id}`);
  };

  const budgetForCategory = category && council.budget
    ? council.budget[category as keyof typeof council.budget]
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Budget category */}
      <div className="space-y-2">
        <Label htmlFor="category" className="type-body-sm font-semibold">
          What area of spending is this about?
        </Label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="w-full h-12 px-3 rounded-lg border border-border bg-background type-body-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Choose a budget area</option>
          {availableCategories.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        {budgetForCategory !== null && budgetForCategory !== undefined && (
          <p className="type-caption text-muted-foreground">
            {council.name} spends {formatBudget(budgetForCategory as number)} on this area.
          </p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="type-body-sm font-semibold">
          Title
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What should change?"
          maxLength={200}
          required
          className="h-12"
        />
        <p className="type-caption text-muted-foreground tabular-nums text-right">
          {title.length}/200
        </p>
      </div>

      {/* Body */}
      <div className="space-y-2">
        <Label htmlFor="body" className="type-body-sm font-semibold">
          Explain your proposal
        </Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Why does this matter? What would you change? Be specific."
          maxLength={2000}
          required
          rows={6}
          className="resize-none"
        />
        <p className="type-caption text-muted-foreground tabular-nums text-right">
          {body.length}/2000
        </p>
      </div>

      {/* Labels */}
      <div className="space-y-2">
        <Label className="type-body-sm font-semibold">
          Tags (optional)
        </Label>
        <div className="flex flex-wrap gap-2">
          {PROPOSAL_LABELS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => toggleLabel(l.value)}
              className="cursor-pointer"
            >
              <Badge
                variant={labels.includes(l.value) ? 'default' : 'outline'}
                className="type-caption cursor-pointer"
              >
                {l.label}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="type-body-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        className="w-full h-12 type-body font-semibold cursor-pointer"
        disabled={isSubmitting || !title.trim() || !body.trim() || !category}
      >
        {isSubmitting ? 'Submitting...' : user ? 'Submit proposal' : 'Sign in to submit'}
      </Button>

      {!user && (
        <p className="type-caption text-muted-foreground text-center">
          Your draft will be saved. You can sign in and it will be submitted automatically.
        </p>
      )}
    </form>
  );
}
