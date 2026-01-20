'use client';

import { Suspense, memo } from 'react';
import { useCouncil } from '@/context/CouncilContext';
import CouncilSelector from '@/components/CouncilSelector';
import CouncilDashboard from '@/components/CouncilDashboard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Memoized homepage content to prevent re-renders
const HomepageContent = memo(function HomepageContent() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-xl space-y-10">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-muted rounded-full">
                <svg className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Find Your Council</h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              See where your council tax goes
            </p>
          </div>
          <CouncilSelector variant="homepage" />
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
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { selectedCouncil, isLoading } = useCouncil();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Homepage - centered search (no council selected)
  if (!selectedCouncil) {
    return <HomepageContent />;
  }

  // Dashboard view - when council is selected
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CouncilDashboard />
    </Suspense>
  );
}
