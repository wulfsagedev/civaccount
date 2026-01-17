'use client';

import { useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useCouncil } from '@/context/CouncilContext';
import { getCouncilBySlug } from '@/data/councils';
import CouncilDashboard from '@/components/CouncilDashboard';

export default function CouncilPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { setSelectedCouncil, isLoading } = useCouncil();

  const council = getCouncilBySlug(slug);

  useEffect(() => {
    if (council) {
      setSelectedCouncil(council);
    }
  }, [council, setSelectedCouncil]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!council) {
    notFound();
  }

  return <CouncilDashboard />;
}
