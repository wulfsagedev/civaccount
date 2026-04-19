'use client';

import { useEffect, Suspense, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useCouncil } from '@/context/CouncilContext';
import { getCouncilBySlug } from '@/data/councils';
import CouncilDashboard from '@/components/CouncilDashboard';

// Lightweight loading skeleton (only rendered if slug lookup ever becomes async).
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
  const { setSelectedCouncil } = useCouncil();

  // Council lookup is synchronous — we derive it from the URL slug directly,
  // so the dashboard can SSR with a fully-populated council object even
  // before CouncilContext has hydrated from localStorage. This is load-bearing
  // for SEO: crawlers (Googlebot, OAI-SearchBot, Claude-SearchBot,
  // PerplexityBot) and AI engines need the H1 and narrative on first render.
  const council = useMemo(() => getCouncilBySlug(slug), [slug]);

  useEffect(() => {
    if (council) {
      setSelectedCouncil(council);
    }
  }, [council, setSelectedCouncil]);

  if (!council) {
    notFound();
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CouncilDashboard initialCouncil={council} />
    </Suspense>
  );
}
