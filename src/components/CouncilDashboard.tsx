'use client';

import { useEffect, useRef } from 'react';
import { useCouncil } from '@/context/CouncilContext';

import CouncilSelector from '@/components/CouncilSelector';
import UnifiedDashboard from '@/components/dashboard/UnifiedDashboard';
import RelatedCouncils from '@/components/dashboard/RelatedCouncils';
import DataSourcesFooter from '@/components/DataSourcesFooter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import { getCouncilDisplayName, getCouncilPopulation, getAverageBandDByType, formatCurrency, formatBudget, toSentenceTypeName, type Council } from '@/data/councils';

interface CouncilDashboardProps {
  // When the route knows the council from its slug (e.g. /council/[slug]),
  // it should pass the council in directly. This lets the dashboard SSR
  // with a real H1, breadcrumb and narrative — load-bearing for crawlers
  // and AI engines, which won't see context values populated only by a
  // client-side useEffect.
  initialCouncil?: Council;
}

export default function CouncilDashboard({ initialCouncil }: CouncilDashboardProps = {}) {
  const { selectedCouncil: contextCouncil } = useCouncil();
  const selectedCouncil = contextCouncil ?? initialCouncil ?? null;
  const prevCouncilRef = useRef(selectedCouncil);

  // Scroll to top when council changes
  useEffect(() => {
    if (selectedCouncil !== prevCouncilRef.current) {
      window.scrollTo(0, 0);
      prevCouncilRef.current = selectedCouncil;
    }
  }, [selectedCouncil]);

  if (!selectedCouncil) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Build narrative summary
  const displayName = getCouncilDisplayName(selectedCouncil);
  const bandD = selectedCouncil.council_tax?.band_d_2025;
  const bandD2024 = selectedCouncil.council_tax?.band_d_2024;
  const population = getCouncilPopulation(selectedCouncil.name);
  const typeName = selectedCouncil.type_name || 'Council';
  const budget = selectedCouncil.budget;
  const totalBudget = budget?.total_service ? formatBudget(budget.total_service) : null;

  const taxChange = bandD && bandD2024 ? ((bandD - bandD2024) / bandD2024) * 100 : null;

  // Find biggest spending category (lowercase used in narrative prose)
  const serviceMap = [
    { key: 'environmental', name: 'bins, streets & environment' },
    { key: 'planning', name: 'planning' },
    { key: 'central_services', name: 'running the council' },
    { key: 'cultural', name: 'parks, libraries & leisure' },
    { key: 'housing', name: 'housing' },
    { key: 'adult_social_care', name: 'adult social care' },
    { key: 'childrens_social_care', name: "children's services" },
    { key: 'education', name: 'education' },
    { key: 'transport', name: 'roads & transport' },
    { key: 'public_health', name: 'public health' },
  ];
  let biggestCategory: { name: string; pct: number } | null = null;
  if (budget?.total_service) {
    const total = budget.total_service;
    for (const service of serviceMap) {
      const amount = budget[service.key as keyof typeof budget] as number | null;
      if (amount && amount > 0) {
        const pct = (amount / total) * 100;
        if (!biggestCategory || pct > biggestCategory.pct) {
          biggestCategory = { name: service.name, pct };
        }
      }
    }
  }

  // Narrative summary — visible for users and crawlers.
  // Use sentence-form that preserves proper nouns ("London borough", not "london borough").
  const typeNameSentence = toSentenceTypeName(typeName);
  const narrativeParts: string[] = [];
  narrativeParts.push(`${displayName} is a ${typeNameSentence}${population ? ` serving ${population.toLocaleString('en-GB')} residents` : ''}.`);
  if (bandD) {
    let taxSentence = `In 2025-26, Band D council tax is ${formatCurrency(bandD, { decimals: 2 })}`;
    if (taxChange !== null) {
      const direction = taxChange > 0 ? 'more' : 'less';
      taxSentence += ` — ${Math.abs(taxChange).toFixed(1)}% ${direction} than last year`;
    }
    taxSentence += '.';
    narrativeParts.push(taxSentence);
  }
  if (totalBudget && biggestCategory) {
    narrativeParts.push(`The council manages a total service budget of ${totalBudget}, with ${biggestCategory.name} being the largest spending area at ${biggestCategory.pct.toFixed(0)}% of the total.`);
  } else if (totalBudget) {
    narrativeParts.push(`The council manages a total service budget of ${totalBudget}.`);
  }
  const narrativeText = narrativeParts.join(' ');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main id="main-content" className="flex-1">
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 max-w-3xl">
          {/* Council Header with integrated SEO content.
              The H1 is rendered here (not in CouncilSelector) so it can
              SSR from the `initialCouncil` prop before CouncilContext has
              hydrated on the client. This is load-bearing: Googlebot,
              OAI-SearchBot, Claude-SearchBot, PerplexityBot and AI Overviews
              treat the H1 as the page's canonical topic signal. */}
          <div className="mb-6">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: displayName }]} />
            <CouncilSelector variant="dashboard" />
            <h1 className="type-title-1 font-bold text-foreground leading-tight mt-2">
              {displayName}
            </h1>
            <p className="type-body-sm text-muted-foreground mt-2">{narrativeText}</p>
          </div>

          {/* Single scrolling dashboard */}
          <UnifiedDashboard />

          {/* Related councils for internal linking */}
          <div className="mt-5">
            <RelatedCouncils council={selectedCouncil} />
          </div>
        </div>

        <DataSourcesFooter />
      </main>

      <Footer />
    </div>
  );
}
