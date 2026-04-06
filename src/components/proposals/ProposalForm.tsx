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
import { StatusPanel } from '@/components/ui/status-panel';
import { BUDGET_CATEGORIES, PROPOSAL_LABELS, saveDraft, loadDraft, clearDraft, getCategoryLabel } from '@/lib/proposals';
import { formatBudget } from '@/data/councils';
import { toast } from 'sonner';
import { isUKUser } from '@/lib/geo';
import Link from 'next/link';
import type { Council } from '@/data/councils';

interface ProposalFormProps {
  council: Council;
  councilSlug: string;
  mode?: 'create' | 'edit';
  initialData?: {
    id: string;
    title: string;
    body: string;
    budget_category: string;
    labels: string[];
  };
  onSaved?: () => void;
  onCancel?: () => void;
}

export default function ProposalForm({
  council,
  councilSlug,
  mode = 'create',
  initialData,
  onSaved,
  onCancel,
}: ProposalFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [body, setBody] = useState(initialData?.body ?? '');
  const [category, setCategory] = useState(initialData?.budget_category ?? '');
  const [labels, setLabels] = useState<string[]>(initialData?.labels ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null);

  // Validation state
  const [touched, setTouched] = useState({ title: false, body: false, category: false });

  // Available budget categories for this council
  const availableCategories = Object.entries(BUDGET_CATEGORIES).filter(([key]) => {
    const budget = council.budget;
    if (!budget) return false;
    const val = budget[key as keyof typeof budget];
    return val !== null && val !== undefined && val !== 0;
  });

  // Load draft from localStorage on mount (create mode only)
  useEffect(() => {
    if (mode === 'create' && !initialData) {
      const draft = loadDraft(councilSlug);
      if (draft) {
        setTitle(draft.title);
        setBody(draft.body);
        setCategory(draft.budget_category);
        setLabels(draft.labels);
      }
    }
  }, [councilSlug, mode, initialData]);

  // Auto-submit if returning from auth with a saved draft
  useEffect(() => {
    if (mode === 'create' && user && title && body && category) {
      const draft = loadDraft(councilSlug);
      if (draft) {
        handleSubmit();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleLabel = (value: string) => {
    setLabels((prev) =>
      prev.includes(value) ? prev.filter((l) => l !== value) : [...prev, value]
    );
  };

  // Validation
  const titleError = touched.title && !title.trim() ? 'Enter a title for your proposal' :
    touched.title && title.trim().length > 0 && title.trim().length < 10 ? 'Give your proposal a clearer title' : '';
  const bodyError = touched.body && !body.trim() ? 'Explain what you would change and why' : '';
  const categoryError = touched.category && !category ? 'Choose which area of spending this is about' : '';

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Mark all as touched on submit
    setTouched({ title: true, body: true, category: true });

    if (!title.trim() || !body.trim() || !category) return;
    if (title.trim().length < 10) return;

    // Geo check — UK residents only
    if (!isUKUser()) {
      router.push('/uk-only');
      return;
    }

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

    if (mode === 'edit' && initialData) {
      const { error: updateError } = await supabase
        .from('proposals')
        .update({
          title: title.trim(),
          body: body.trim(),
          labels,
          edited_at: new Date().toISOString(),
        })
        .eq('id', initialData.id)
        .eq('author_id', user.id);

      if (updateError) {
        setError('Could not save your changes. Try again.');
        setIsSubmitting(false);
        return;
      }

      toast.success('Your changes have been saved.');
      setIsSubmitting(false);
      onSaved?.();
      return;
    }

    // Create mode
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
      setError(`Could not create proposal. Try again.`);
      setIsSubmitting(false);
      return;
    }

    clearDraft();
    setIsSubmitting(false);
    setSubmitted({ id: data.id });
  };

  // Success state after creation
  if (submitted) {
    return (
      <StatusPanel variant="success" title="Your proposal has been published.">
        <p className="mb-4">Other residents can now vote and comment on it.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href={`/council/${councilSlug}/proposals/${submitted.id}`}
            className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-foreground text-background type-body-sm font-medium hover:bg-foreground/90 transition-colors cursor-pointer"
          >
            View your proposal
          </Link>
          <Link
            href={`/council/${councilSlug}/proposals`}
            className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-border type-body-sm font-medium hover:bg-muted transition-colors cursor-pointer"
          >
            Back to Town Hall
          </Link>
        </div>
      </StatusPanel>
    );
  }

  const budgetForCategory = category && council.budget
    ? council.budget[category as keyof typeof council.budget]
    : null;

  const titleRemaining = 200 - title.length;
  const bodyRemaining = 2000 - body.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Budget category — hidden in edit mode (category shouldn't change) */}
      {mode === 'create' && (
        <div className="space-y-2">
          <Label htmlFor="category" className="type-body-sm font-semibold">
            What area of spending is this about?
          </Label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, category: true }))}
            aria-describedby={categoryError ? 'category-error' : undefined}
            aria-invalid={!!categoryError}
            className="w-full h-12 px-3 rounded-lg border border-border bg-background type-body-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Choose a budget area</option>
            {availableCategories.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          {categoryError && (
            <p id="category-error" className="type-caption text-destructive">{categoryError}</p>
          )}
          {budgetForCategory !== null && budgetForCategory !== undefined && (
            <p className="type-caption text-muted-foreground">
              {council.name} spends {formatBudget(budgetForCategory as number)} on this area.
            </p>
          )}
        </div>
      )}

      {/* In edit mode, show the category as context */}
      {mode === 'edit' && initialData && (
        <div className="p-3 rounded-lg bg-muted/30">
          <p className="type-caption text-muted-foreground">
            Category: <span className="font-semibold text-foreground">{getCategoryLabel(initialData.budget_category)}</span>
          </p>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="type-body-sm font-semibold">
          Title
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => setTouched(t => ({ ...t, title: true }))}
          placeholder="What should change?"
          maxLength={200}
          aria-describedby={titleError ? 'title-error' : 'title-count'}
          aria-invalid={!!titleError}
          className="h-12"
        />
        {titleError && (
          <p id="title-error" className="type-caption text-destructive">{titleError}</p>
        )}
        <p
          id="title-count"
          className={`type-caption tabular-nums text-right ${
            titleRemaining <= 10 ? 'text-destructive' : titleRemaining <= 40 ? 'text-negative' : 'text-muted-foreground'
          }`}
          aria-live="polite"
        >
          {titleRemaining} characters remaining
        </p>
      </div>

      {/* Body */}
      <div className="space-y-2">
        <Label htmlFor="body" className="type-body-sm font-semibold">
          {mode === 'edit' ? 'Explain your proposal' : 'Explain your proposal'}
        </Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={() => setTouched(t => ({ ...t, body: true }))}
          placeholder="Why does this matter? What would you change? Be specific."
          maxLength={2000}
          rows={6}
          aria-describedby={bodyError ? 'body-error' : 'body-count'}
          aria-invalid={!!bodyError}
          className="resize-none"
        />
        {bodyError && (
          <p id="body-error" className="type-caption text-destructive">{bodyError}</p>
        )}
        <p
          id="body-count"
          className={`type-caption tabular-nums text-right ${
            bodyRemaining <= 100 ? 'text-destructive' : bodyRemaining <= 400 ? 'text-negative' : 'text-muted-foreground'
          }`}
          aria-live="polite"
        >
          {bodyRemaining} characters remaining
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

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          className={`${mode === 'create' ? 'w-full' : ''} h-12 type-body font-semibold cursor-pointer`}
          disabled={isSubmitting || !title.trim() || !body.trim() || (mode === 'create' && !category)}
        >
          {isSubmitting
            ? (mode === 'edit' ? 'Saving...' : 'Submitting...')
            : mode === 'edit'
              ? 'Save changes'
              : user ? 'Submit proposal' : 'Sign in to submit'
          }
        </Button>
        {mode === 'edit' && onCancel && (
          <Button
            type="button"
            variant="outline"
            className="h-12 type-body cursor-pointer"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </div>

      {mode === 'create' && !user && (
        <p className="type-caption text-muted-foreground text-center">
          Your draft will be saved. You can sign in and it will be submitted automatically.
        </p>
      )}
    </form>
  );
}
