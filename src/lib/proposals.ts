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
  { value: 'overspend', label: 'Overspend' },
  { value: 'underfunded', label: 'Underfunded' },
  { value: 'transparency', label: 'Transparency' },
  { value: 'efficiency', label: 'Efficiency' },
] as const;

export const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  acknowledged: 'Acknowledged',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  flagged: 'Flagged',
};

export function getCategoryLabel(key: string): string {
  return BUDGET_CATEGORIES[key] ?? key;
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
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
