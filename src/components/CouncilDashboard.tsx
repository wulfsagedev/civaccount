'use client';

import { useEffect, useRef } from 'react';
import { useCouncil } from '@/context/CouncilContext';

import CouncilSelector from '@/components/CouncilSelector';
import UnifiedDashboard from '@/components/dashboard/UnifiedDashboard';
import DataSourcesFooter from '@/components/DataSourcesFooter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CouncilDashboard() {
  const { selectedCouncil, isLoading } = useCouncil();
  const prevCouncilRef = useRef(selectedCouncil);

  // Scroll to top when council changes
  useEffect(() => {
    if (selectedCouncil !== prevCouncilRef.current) {
      window.scrollTo(0, 0);
      prevCouncilRef.current = selectedCouncil;
    }
  }, [selectedCouncil]);

  if (isLoading || !selectedCouncil) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main id="main-content" className="flex-1">
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 max-w-3xl">
          {/* Council Header - Minimal */}
          <div className="mb-6">
            <CouncilSelector variant="dashboard" />
          </div>

          {/* Single scrolling dashboard */}
          <UnifiedDashboard />
        </div>

        <DataSourcesFooter />
      </main>

      <Footer />
    </div>
  );
}
