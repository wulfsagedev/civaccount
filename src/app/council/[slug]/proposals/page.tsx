'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getCouncilBySlug, getCouncilDisplayName, formatBudget, type Council } from '@/data/councils';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { BUDGET_CATEGORIES, getCategoryLabel, loadDraft, clearDraft } from '@/lib/proposals';
import { CARD_STYLES } from '@/lib/utils';
import ProposalCard from '@/components/proposals/ProposalCard';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import CouncilSwitcher from '@/components/proposals/CouncilSwitcher';
import { StatusPanel } from '@/components/ui/status-panel';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ChevronRight, GitCompareArrows } from 'lucide-react';
import Link from 'next/link';

type SortMode = 'hot' | 'new';

interface ProposalRow {
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
  author_id: string;
}

interface AuthorMap {
  [userId: string]: { display_name: string | null };
}

function BudgetContext({ council, slug, availableCategories }: {
  council: Council;
  slug: string;
  availableCategories: [string, string][];
}) {
  if (!council.budget || availableCategories.length === 0) return null;

  const budget = council.budget;
  const topCategories = availableCategories
    .map(([key, label]) => ({
      key,
      label,
      amount: budget[key as keyof typeof budget] as number,
    }))
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  if (topCategories.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-1.5">
        {topCategories.map(({ key, label, amount }) => (
          <Link
            key={key}
            href={`/council/${slug}/proposals/new?category=${key}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
          >
            <span className="type-caption font-medium">{label}</span>
            <span className="type-caption text-muted-foreground">{formatBudget(amount)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ProposalsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const council = useMemo(() => getCouncilBySlug(slug), [slug]);
  const { user } = useAuth();

  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [authors, setAuthors] = useState<AuthorMap>({});
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down'>>({});
  const [sort, setSort] = useState<SortMode>('hot');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasDraft, setHasDraft] = useState(false);

  // Check for draft on mount
  useEffect(() => {
    try {
      const draft = loadDraft(slug);
      setHasDraft(!!draft);
    } catch {
      // localStorage may not be available
    }
  }, [slug]);

  const fetchProposals = useCallback(async () => {
    const supabase = createClient();

    let query = supabase
      .from('proposals')
      .select('*')
      .eq('council_slug', slug)
      .neq('status', 'flagged')
      .neq('status', 'deleted');

    if (categoryFilter) {
      query = query.eq('budget_category', categoryFilter);
    }

    if (sort === 'hot') {
      query = query.order('score', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.limit(50);

    const { data } = await query;
    if (data) {
      setProposals(data);

      // Fetch author display names
      const authorIds = [...new Set(data.map((p) => p.author_id))];
      if (authorIds.length > 0) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, display_name')
          .in('id', authorIds);
        if (userData) {
          const map: AuthorMap = {};
          userData.forEach((u) => {
            map[u.id] = { display_name: u.display_name };
          });
          setAuthors(map);
        }
      }
    }

    // Fetch user votes
    if (user && data) {
      const { data: votesData } = await supabase
        .from('votes')
        .select('proposal_id, direction')
        .eq('user_id', user.id)
        .in('proposal_id', data.map((p) => p.id));
      if (votesData) {
        const voteMap: Record<string, 'up' | 'down'> = {};
        votesData.forEach((v) => {
          voteMap[v.proposal_id] = v.direction as 'up' | 'down';
        });
        setUserVotes(voteMap);
      }
    }

    setIsLoading(false);
  }, [slug, sort, categoryFilter, user]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  if (!council) {
    return (
      <>
        <Header />
        <main id="main-content" className="container mx-auto px-4 py-12 max-w-3xl text-center">
          <p className="type-display text-muted-foreground/30 mb-4">404</p>
          <h1 className="type-title-1 mb-2">Council not found</h1>
          <p className="type-body-sm text-muted-foreground mb-6">
            We could not find a council matching this address.
          </p>
          <Link href="/">
            <Button className="cursor-pointer">Go to homepage</Button>
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const displayName = getCouncilDisplayName(council);

  // Only show categories that exist in this council's budget
  const availableCategories = Object.entries(BUDGET_CATEGORIES).filter(([key]) => {
    const budget = council.budget;
    if (!budget) return false;
    const val = budget[key as keyof typeof budget];
    return val !== null && val !== undefined && val !== 0;
  });

  return (
    <>
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: displayName, href: `/council/${slug}` },
          { label: 'Town Hall' },
        ]} />

        {/* Council header — matches dashboard styling */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="secondary" className="type-body-sm font-medium">
              {council.type_name}
            </Badge>
            <Badge variant="outline" className="type-body-sm font-medium">
              Town Hall
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-3 mb-1">
            <h1 className="type-title-1 font-bold text-foreground leading-tight">{displayName}</h1>
            <Link href={`/council/${slug}/proposals/new`}>
              <Button size="sm" className="shrink-0 cursor-pointer gap-1.5">
                <Plus className="h-4 w-4" aria-hidden="true" />
                New
              </Button>
            </Link>
          </div>
          <p className="type-body-sm text-muted-foreground mb-2">
            Have your say on how {displayName} spends your money.
          </p>
          <CouncilSwitcher currentSlug={slug} />
        </div>

        {/* Draft recovery banner */}
        {hasDraft && (
          <div className="mb-4">
            <StatusPanel
              variant="info"
              onDismiss={() => {
                clearDraft();
                setHasDraft(false);
              }}
            >
              You have an unsaved draft.{' '}
              <Link
                href={`/council/${slug}/proposals/new`}
                className="font-semibold text-foreground underline underline-offset-2 cursor-pointer"
              >
                Continue editing
              </Link>
            </StatusPanel>
          </div>
        )}

        {/* Budget context */}
        <BudgetContext council={council} slug={slug} availableCategories={availableCategories} />

        {/* Sort + Filter bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
            <button
              type="button"
              onClick={() => setSort('hot')}
              className={`px-3 py-1.5 rounded-md type-caption font-medium transition-colors cursor-pointer ${
                sort === 'hot' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Top
            </button>
            <button
              type="button"
              onClick={() => setSort('new')}
              className={`px-3 py-1.5 rounded-md type-caption font-medium transition-colors cursor-pointer ${
                sort === 'new' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              New
            </button>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-background type-caption cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All areas</option>
            {availableCategories.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Proposals list */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`${CARD_STYLES} p-5 animate-pulse`}>
                <div className="flex gap-3">
                  <div className="w-10 space-y-2">
                    <div className="h-6 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <div className={`${CARD_STYLES} p-8`}>
            {categoryFilter ? (
              <p className="type-body-sm text-muted-foreground text-center mb-4">
                Nothing on {getCategoryLabel(categoryFilter)} yet.
              </p>
            ) : (
              <div className="max-w-md mx-auto">
                <h2 className="type-title-2 mb-2 text-center">No proposals yet</h2>
                <p className="type-body-sm text-muted-foreground text-center mb-4">
                  Town Hall is where residents suggest how {displayName} could spend money differently.
                  Anyone can post a proposal, and other residents vote and comment on it.
                </p>
              </div>
            )}
            <div className="text-center">
              <Link href={`/council/${slug}/proposals/new`}>
                <Button variant="outline" className="cursor-pointer gap-2">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create the first proposal
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {(() => {
              const firstUnvotedId = proposals.find(p => !userVotes[p.id] && p.status === 'open')?.id;
              return proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={{
                    ...proposal,
                    author: authors[proposal.author_id] ?? null,
                  }}
                  userVote={userVotes[proposal.id] ?? null}
                  isHighlighted={proposal.id === firstUnvotedId}
                />
              ));
            })()}
          </div>
        )}

        {/* Cross-promo CTAs */}
        <div className="mt-8 space-y-2">
          <Link
            href={`/council/${slug}`}
            className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/50 transition-colors group cursor-pointer"
          >
            <div className="leading-tight">
              <p className="type-body-sm font-semibold group-hover:text-foreground transition-colors">
                See the full budget breakdown
              </p>
              <p className="type-caption text-muted-foreground">
                Where {displayName} spends your council tax
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
          </Link>
          <Link
            href="/compare"
            className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <GitCompareArrows className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <div className="leading-tight">
                <p className="type-body-sm font-semibold group-hover:text-foreground transition-colors">
                  Compare with other councils
                </p>
                <p className="type-caption text-muted-foreground">
                  See how {displayName} stacks up
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
