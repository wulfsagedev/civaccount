'use client';

import { Suspense, memo } from 'react';
import { useCouncil } from '@/context/CouncilContext';
import CouncilSelector from '@/components/CouncilSelector';
import CouncilDashboard from '@/components/CouncilDashboard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { DataFlowAnimation } from '@/components/ui/data-flow-animation';

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
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
                Where your council tax goes
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
                See how your council spends your money
              </p>
            </div>
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
