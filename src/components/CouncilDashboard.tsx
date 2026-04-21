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
import SourceAnnotation from '@/components/ui/source-annotation';
import { getProvenance } from '@/data/provenance';
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

  // Narrative hero — now rendered as cited JSX below (every number is a
  // click-through to its source). The plain-text equivalent for
  // <meta description> / OpenGraph is computed in
  // src/app/council/[slug]/layout.tsx where the metadata actually lives.
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
            {/* Hero narrative — SEO/GEO-critical.
                Numbers are cited inline via SourceAnnotation so readers can
                open the document the figure was taken from in one click.
                The `title` attribute makes the provenance of the prose
                itself legible: the sentence structure is CivAccount-
                generated; every quantity inside is sourced. */}
            <p
              className="type-body-sm text-muted-foreground mt-2"
              title="Generated summary of the sourced facts shown below. Every number in this paragraph is a click-through to its source document."
            >
              {displayName} is a {toSentenceTypeName(typeName)}
              {population ? (
                <>
                  {' '}serving{' '}
                  <SourceAnnotation
                    provenance={getProvenance('population', selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: 'Population',
                      value: population.toLocaleString('en-GB'),
                    }}
                  >{population.toLocaleString('en-GB')}</SourceAnnotation>
                  {' '}residents
                </>
              ) : null}
              .
              {bandD && (
                <>
                  {' '}In 2025-26, Band D council tax is{' '}
                  <SourceAnnotation
                    provenance={getProvenance('council_tax.band_d_2025', selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: 'Band D council tax 2025-26',
                      value: formatCurrency(bandD, { decimals: 2 }),
                    }}
                  >{formatCurrency(bandD, { decimals: 2 })}</SourceAnnotation>
                  {taxChange !== null && (
                    <> — {Math.abs(taxChange).toFixed(1)}% {taxChange > 0 ? 'more' : 'less'} than last year</>
                  )}
                  .
                </>
              )}
              {totalBudget && biggestCategory ? (
                <>
                  {' '}The council manages a total service budget of{' '}
                  <SourceAnnotation
                    provenance={getProvenance('budget.total_service', selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: 'Total service budget',
                      value: totalBudget,
                    }}
                  >{totalBudget}</SourceAnnotation>, with {biggestCategory.name} being the largest spending area at {biggestCategory.pct.toFixed(0)}% of the total.
                </>
              ) : totalBudget ? (
                <>
                  {' '}The council manages a total service budget of{' '}
                  <SourceAnnotation
                    provenance={getProvenance('budget.total_service', selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: 'Total service budget',
                      value: totalBudget,
                    }}
                  >{totalBudget}</SourceAnnotation>.
                </>
              ) : null}
            </p>
            <p className="type-caption text-muted-foreground mt-1 italic">
              Generated summary of the sourced facts below.{' '}
              <a href="/data-validation" className="underline hover:text-foreground">How we verify data</a>
            </p>
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
