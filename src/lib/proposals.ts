// Budget category labels — maps CouncilBudget keys to plain English
export const BUDGET_CATEGORIES: Record<string, string> = {
  education: 'Education',
  transport: 'Roads & Transport',
  childrens_social_care: "Children's Social Care",
  adult_social_care: 'Adult Social Care',
  public_health: 'Public Health',
  housing: 'Housing',
  cultural: 'Culture & Leisure',
  environmental: 'Environment & Streets',
  planning: 'Planning',
  central_services: 'Council Running Costs',
  other: 'Other Services',
};

export const PROPOSAL_LABELS = [
  { value: 'overspend', label: 'Too much spent' },
  { value: 'underfunded', label: 'Not enough spent' },
  { value: 'transparency', label: 'Hard to find out' },
  { value: 'efficiency', label: 'Money wasted' },
] as const;

export const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  acknowledged: 'Acknowledged',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  flagged: 'Flagged',
};

export const PROPOSAL_STATUS_DESCRIPTIONS: Record<string, string> = {
  open: 'Accepting votes and comments',
  // No council is connected to Town Hall, so these never claim the council
  // did anything (CA-D4, 18 Nov 2026).
  acknowledged: 'Marked as seen',
  in_progress: 'Being looked into',
  resolved: 'Marked as done',
  closed: 'No longer accepting votes',
};

export const PROPOSAL_STATUS_STYLES: Record<string, string> = {
  open: 'bg-muted text-muted-foreground',
  acknowledged: 'bg-navy-50 text-navy-600 border-navy-200',
  in_progress: 'bg-negative/10 text-negative border-negative/20',
  resolved: 'bg-positive/10 text-positive border-positive/20',
  closed: 'bg-muted text-muted-foreground',
};

// Milestones — community engagement thresholds
export const MILESTONES = [
  { votes: 25, label: 'Community interest' },
  { votes: 100, label: 'Widely supported' },
] as const;

export function getCurrentMilestone(score: number): typeof MILESTONES[number] | null {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (score >= MILESTONES[i].votes) return MILESTONES[i];
  }
  return null;
}

export function getNextMilestone(score: number): typeof MILESTONES[number] | null {
  for (const m of MILESTONES) {
    if (score < m.votes) return m;
  }
  return null;
}

// Edit window — 15 minutes (like Reddit)
export const EDIT_WINDOW_MS = 15 * 60 * 1000;

export function canEdit(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  return Date.now() - created < EDIT_WINDOW_MS;
}

export function editWindowRemaining(createdAt: string): string {
  const created = new Date(createdAt).getTime();
  const remaining = EDIT_WINDOW_MS - (Date.now() - created);
  if (remaining <= 0) return '';
  const mins = Math.ceil(remaining / 60000);
  return `${mins} min${mins !== 1 ? 's' : ''} left to edit`;
}

/**
 * What to tell someone when saving an edit fails. The database refuses edits
 * after the window closes, which can happen while the form is still open.
 */
export function editErrorMessage(error: { message?: string }): string {
  return error.message?.includes('Edit window')
    ? 'The 15 minutes for editing have passed, so your changes were not saved.'
    : 'Could not save your changes. Try again.';
}

export function getCategoryLabel(key: string): string {
  return BUDGET_CATEGORIES[key] ?? key;
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Whole words, not "6mo" or "3h" (CA-D7: readers are mostly 70+).
  const ago = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return ago(minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return ago(hours, 'hour');
  const days = Math.floor(hours / 24);
  if (days < 30) return ago(days, 'day');
  const months = Math.floor(days / 30);
  if (months < 12) return ago(months, 'month');
  return ago(Math.floor(months / 12), 'year');
}

// Anonymous draft storage
const DRAFT_KEY = 'civaccount_proposal_draft';
const DRAFT_TTL = 24 * 60 * 60 * 1000; // 24 hours

export interface ProposalDraft {
  council_slug: string;
  budget_category: string;
  title: string;
  body: string;
  labels: string[];
  saved_at: number;
}

export function saveDraft(draft: Omit<ProposalDraft, 'saved_at'>) {
  const payload: ProposalDraft = { ...draft, saved_at: Date.now() };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
}

export function loadDraft(councilSlug: string): ProposalDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft: ProposalDraft = JSON.parse(raw);
    // Check TTL and council match
    if (Date.now() - draft.saved_at > DRAFT_TTL) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    if (draft.council_slug !== councilSlug) return null;
    return draft;
  } catch {
    return null;
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

/** The 25 accounts supabase/migrations/seed-proposals.sql created to show how
 * Town Hall works. Their posts are examples, not residents' ideas, and say so. */
export const EXAMPLE_AUTHOR_ID_PREFIX = '00000000-0000-4000-a000-';

export function isExamplePost(authorId: string | null | undefined): boolean {
  return typeof authorId === 'string' && authorId.startsWith(EXAMPLE_AUTHOR_ID_PREFIX);
}

/** A label's plain name, whatever case it was stored in ("Overspend" or "overspend"). */
export function getLabelName(value: string): string {
  return PROPOSAL_LABELS.find((l) => l.value === value.toLowerCase())?.label ?? value;
}
