'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getCouncilBySlug, getCouncilDisplayName } from '@/data/councils';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { BUDGET_CATEGORIES, getCategoryLabel } from '@/lib/proposals';
import { CARD_STYLES } from '@/lib/utils';
import ProposalCard from '@/components/proposals/ProposalCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
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

  const fetchProposals = useCallback(async () => {
    const supabase = createClient();

    let query = supabase
      .from('proposals')
      .select('*')
      .eq('council_slug', slug)
      .neq('status', 'flagged');

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
    return null;
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
        {/* Back link */}
        <Link
          href={`/council/${slug}`}
          className="inline-flex items-center gap-2 type-body-sm text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {displayName}
        </Link>

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="type-title-1 mb-1">Community proposals</h1>
            <p className="type-body-sm text-muted-foreground">
              Ideas for how {displayName} could spend your money better.
            </p>
          </div>
          <Link href={`/council/${slug}/proposals/new`}>
            <Button className="shrink-0 cursor-pointer gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">New proposal</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        </div>

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
          <div className={`${CARD_STYLES} p-8 text-center`}>
            <p className="type-body-sm text-muted-foreground mb-4">
              {categoryFilter
                ? `No proposals for ${getCategoryLabel(categoryFilter)} yet.`
                : 'No proposals yet. Be the first to suggest how your council could do better.'}
            </p>
            <Link href={`/council/${slug}/proposals/new`}>
              <Button variant="outline" className="cursor-pointer gap-2">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create the first proposal
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={{
                  ...proposal,
                  author: authors[proposal.author_id] ?? null,
                }}
                userVote={userVotes[proposal.id] ?? null}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
