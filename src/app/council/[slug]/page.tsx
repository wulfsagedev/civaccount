'use client';

import { useEffect, Suspense, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useCouncil } from '@/context/CouncilContext';
import { getCouncilBySlug } from '@/data/councils';
import CouncilDashboard from '@/components/CouncilDashboard';

// Lightweight loading skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-14 border-b bg-background/95" />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-48 bg-muted rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function CouncilPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { setSelectedCouncil, isLoading } = useCouncil();

  // Memoize council lookup to avoid repeated searches
  const council = useMemo(() => getCouncilBySlug(slug), [slug]);

  useEffect(() => {
    if (council) {
      setSelectedCouncil(council);
    }
  }, [council, setSelectedCouncil]);

  // Show skeleton during initial hydration
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!council) {
    notFound();
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CouncilDashboard />
    </Suspense>
  );
}
