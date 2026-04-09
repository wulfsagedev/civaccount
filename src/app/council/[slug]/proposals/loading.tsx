import Header from '@/components/Header';
import { CARD_STYLES } from '@/lib/utils';

export default function ProposalsLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="sr-only" role="status">Loading proposals</div>
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          <div className="h-4 w-4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        </div>

        {/* Title + button */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
          <div className="h-9 w-20 bg-muted rounded-lg animate-pulse" />
        </div>

        {/* Budget pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-36 bg-muted rounded-full animate-pulse" />
          ))}
        </div>

        {/* Sort bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-9 w-28 bg-muted rounded-lg animate-pulse" />
          <div className="h-9 w-24 bg-muted rounded-lg animate-pulse" />
        </div>

        {/* Proposal skeletons */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`${CARD_STYLES} p-5 animate-pulse`}>
              <div className="flex gap-3">
                <div className="w-10 space-y-2 shrink-0">
                  <div className="h-5 bg-muted rounded" />
                  <div className="h-4 w-6 bg-muted rounded mx-auto" />
                  <div className="h-5 bg-muted rounded" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="flex gap-2 mt-2">
                    <div className="h-6 w-24 bg-muted rounded-full" />
                    <div className="h-6 w-16 bg-muted rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
