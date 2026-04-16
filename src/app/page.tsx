'use client';

import { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCouncil } from '@/context/CouncilContext';
import CouncilSelector from '@/components/CouncilSelector';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { DataFlowAnimation } from '@/components/ui/data-flow-animation';
import Link from 'next/link';
import { ChevronRight, Vote, GitCompareArrows } from 'lucide-react';
import { getCouncilSlug } from '@/data/councils';

// Memoized homepage content to prevent re-renders
const HomepageContent = memo(function HomepageContent() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-xl space-y-8">
          <div className="text-center space-y-6">
            <DataFlowAnimation />
            <div className="space-y-3">
              <h1 className="type-title-1 font-semibold leading-tight">
                The average English household pays £1,026 in council tax
              </h1>
              <p className="text-muted-foreground type-body-lg max-w-[320px] mx-auto">
                Find out what your council charges and how it&apos;s spent
              </p>
            </div>
          </div>
          <CouncilSelector variant="homepage" />

          {/* Trust signals */}
          <p className="type-caption text-center text-muted-foreground/70">
            317 councils · 2025-26 data · Free and independent
          </p>

          {/* Cross-promo CTAs */}
          <div className="space-y-2">
            <Link
              href="/townhall"
              className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Vote className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="leading-tight">
                  <p className="type-body-sm font-semibold">Town Hall</p>
                  <p className="type-caption text-muted-foreground">Vote on how your council spends your money</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
            </Link>
            <Link
              href="/compare"
              className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <GitCompareArrows className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="leading-tight">
                  <p className="type-body-sm font-semibold">Compare councils</p>
                  <p className="type-caption text-muted-foreground">See how your council stacks up against others</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
});

// Lightweight loading skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground/20 mx-auto mb-4" />
        <p className="text-muted-foreground type-body-sm">Loading...</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { selectedCouncil, isLoading } = useCouncil();
  const router = useRouter();

  // Returning visitors with a saved council get redirected to the canonical
  // /council/[slug] URL. Keeps `/` as the shareable homepage for everyone,
  // and ensures every council has a single, unique, crawlable URL.
  useEffect(() => {
    if (!isLoading && selectedCouncil) {
      router.replace(`/council/${getCouncilSlug(selectedCouncil)}`);
    }
  }, [isLoading, selectedCouncil, router]);

  if (isLoading || selectedCouncil) {
    return <LoadingSkeleton />;
  }

  return <HomepageContent />;
}
