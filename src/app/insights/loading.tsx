/**
 * Loading skeleton shown while any /insights/* route renders.
 * Most visible on hub → subpage navigation: gives instant feedback so the
 * click feels acknowledged instead of "loading nothing".
 *
 * Generic enough to look right for both the hub (grid of tiles) and the
 * subpage hero — readers' eyes are on the H1 area in both cases.
 */
export default function InsightsLoading() {
  return (
    <main id="main-content" className="flex-1 container mx-auto px-4 max-w-3xl py-8">
      <div className="sr-only" role="status">Loading insight</div>

      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-6 animate-pulse">
        <div className="h-3 w-12 bg-muted rounded" />
        <div className="h-3 w-3 bg-muted/50 rounded-full" />
        <div className="h-3 w-16 bg-muted rounded" />
      </div>

      {/* H1 + subtitle skeleton */}
      <div className="space-y-2 mb-8 animate-pulse">
        <div className="h-8 w-3/4 bg-muted rounded-md" />
        <div className="h-4 w-1/2 bg-muted/70 rounded" />
      </div>

      {/* Hero card skeleton */}
      <div className="card-elevated p-5 sm:p-6 mb-8">
        <div className="space-y-3 animate-pulse">
          <div className="h-3 w-2/3 bg-muted/70 rounded" />
          <div className="h-12 w-40 bg-muted rounded-md" />
          <div className="h-4 w-full bg-muted/70 rounded" />
          <div className="h-4 w-5/6 bg-muted/70 rounded" />
        </div>
      </div>

      {/* Body card skeleton — ranked list rows */}
      <div className="card-elevated p-5 sm:p-6 mb-8">
        <div className="space-y-2 mb-6 animate-pulse">
          <div className="h-5 w-1/2 bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted/70 rounded" />
        </div>
        <div className="space-y-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-1.5 animate-pulse">
              <div className="flex items-baseline justify-between">
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
              <div className="h-2 rounded-full bg-muted/60" style={{ width: `${100 - i * 10}%` }} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
