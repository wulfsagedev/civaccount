'use client';

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { councils, getCouncilSlug } from '@/data/councils';
import CouncilSelector from '@/components/CouncilSelector';
import { createClient } from '@/lib/supabase/client';
import { timeAgo, getCurrentMilestone } from '@/lib/proposals';
import { CARD_STYLES } from '@/lib/utils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface RecentProposal {
  id: string;
  council_slug: string;
  budget_category: string;
  title: string;
  score: number;
  comment_count: number;
  created_at: string;
}

export default function TownHallPage() {
  const [recentProposals, setRecentProposals] = useState<RecentProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRecent() {
      const supabase = createClient();
      const { data } = await supabase
        .from('proposals')
        .select('id, council_slug, budget_category, title, score, comment_count, created_at')
        .neq('status', 'flagged')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) setRecentProposals(data);
      setIsLoading(false);
    }
    fetchRecent();
  }, []);

  return (
    <>
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl">
        {/* Hero — the pitch */}
        <div className="text-center mb-10">
          <h1 className="type-title-1 font-semibold mb-3">
            Tell your council what matters to you
          </h1>
          <p className="type-body-lg text-muted-foreground max-w-lg mx-auto">
            Suggest how your council could spend money better. Vote on other people&apos;s ideas. It takes 10 seconds.
          </p>
        </div>

        {/* Product preview — mini proposal cards fanned out like homepage */}
        <div
          className="flex items-center justify-center w-full max-w-[500px] mx-auto mb-8 pointer-events-none select-none"
          aria-hidden="true"
        >
          {/* Left card — faded */}
          <div className="w-[140px] sm:w-[160px] shrink-0 opacity-[0.3] -mr-3 sm:-mr-4">
            <div className="rounded-lg border border-border/40 bg-card shadow-sm p-3 text-left">
              <div className="flex items-center gap-2 mb-2">
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                <span className="type-body-sm font-semibold tabular-nums">12</span>
              </div>
              <p className="type-body-sm font-semibold leading-tight line-clamp-2">Fix the broken swings in the park</p>
              <div className="h-1 rounded-full bg-muted overflow-hidden mt-2">
                <div className="h-full rounded-full bg-foreground/60" style={{ width: '48%' }} />
              </div>
            </div>
          </div>

          {/* Center card — full visibility, larger */}
          <div className="w-[190px] sm:w-[220px] shrink-0 z-10">
            <div className="rounded-lg border border-border/40 bg-card shadow-sm p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <ChevronUp className="h-5 w-5 text-foreground" />
                <span className="type-body font-semibold tabular-nums">47</span>
              </div>
              <p className="type-body font-semibold leading-tight mb-1">Keep the library open on Saturdays</p>
              <p className="type-body-sm text-muted-foreground line-clamp-2">It&apos;s the only free warm space for families at weekends</p>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-3">
                <div className="h-full rounded-full bg-foreground" style={{ width: '78%' }} />
              </div>
              <p className="type-body-sm text-muted-foreground mt-1.5">Community interest</p>
            </div>
          </div>

          {/* Right card — faded */}
          <div className="w-[140px] sm:w-[160px] shrink-0 opacity-[0.3] -ml-3 sm:-ml-4">
            <div className="rounded-lg border border-border/40 bg-card shadow-sm p-3 text-left">
              <div className="flex items-center gap-2 mb-2">
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                <span className="type-body-sm font-semibold tabular-nums">103</span>
              </div>
              <p className="type-body-sm font-semibold leading-tight line-clamp-2">More bins on the high street please</p>
              <div className="h-1 rounded-full bg-muted overflow-hidden mt-2">
                <div className="h-full rounded-full bg-foreground/60" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Council search — uses the same component as homepage */}
        <CouncilSelector
          variant="townhall"
          navigateTo={(slug) => `/council/${slug}/proposals`}
        />

        <div className="h-10" />

        {/* What people are saying — social proof */}
        <div className={`${CARD_STYLES} p-5 sm:p-6`}>
          <h2 className="type-title-2 mb-1">What people are saying</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            Real ideas from real residents across England.
          </p>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : recentProposals.length > 0 ? (
            <div className="space-y-1">
              {recentProposals.map((p) => {
                const council = councils.find(c => getCouncilSlug(c) === p.council_slug);
                const councilName = council ? council.name : p.council_slug;
                const milestone = getCurrentMilestone(p.score);

                return (
                  <Link
                    key={p.id}
                    href={`/council/${p.council_slug}/proposals/${p.id}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer -mx-1"
                  >
                    <div className="min-w-0">
                      <p className="type-body-sm font-semibold line-clamp-1">{p.title}</p>
                      <p className="type-body-sm text-muted-foreground mt-0.5">
                        {councilName} · {timeAgo(p.created_at)}
                        {milestone && <span className="ml-1">· {milestone.label}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 type-body-sm text-muted-foreground tabular-nums">
                      <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                      {p.score}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="type-body font-semibold mb-2">
                Be the first to speak up
              </p>
              <p className="type-body-sm text-muted-foreground">
                No one has posted yet. Find your council above and share what you think.
              </p>
            </div>
          )}
        </div>

        {/* Reassurance — address fear of engaging */}
        <div className="mt-8 text-center space-y-2">
          <p className="type-body-sm text-muted-foreground">
            Your votes are private. You can post ideas without using your real name.
          </p>
          <p className="type-body-sm text-muted-foreground">
            This is a place to share ideas, not complaints. Keep it friendly.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
