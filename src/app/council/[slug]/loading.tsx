import Header from '@/components/Header';

export default function CouncilLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 max-w-3xl">
          {/* Council selector skeleton */}
          <div className="mb-6">
            <div className="h-12 rounded-xl bg-muted animate-pulse" />
          </div>

          {/* Hero card skeleton */}
          <div className="card-elevated p-5 sm:p-6 mb-5">
            <div className="space-y-3">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-12 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-56 bg-muted rounded animate-pulse" />
            </div>
            <div className="mt-6 space-y-4">
              <div className="h-3 rounded-full bg-muted animate-pulse" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between py-2">
                  <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Second card skeleton */}
          <div className="card-elevated p-5 sm:p-6">
            <div className="space-y-3">
              <div className="h-6 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-64 bg-muted rounded animate-pulse" />
              <div className="flex gap-2 mt-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
