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
import { getCouncilDisplayName, getCouncilPopulation, getAverageBandDByType, getAreaBandD, formatCurrency, formatBudget, toSentenceTypeName, type Council } from '@/data/councils';

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

  // Build narrative summary — the Band D figure is the most recent verified
  // year for this council (2026-27 for billing authorities, 2025-26 for
  // county councils), with the year stated in the sentence.
  const displayName = getCouncilDisplayName(selectedCouncil);
  const areaBandD = getAreaBandD(selectedCouncil);
  const population = getCouncilPopulation(selectedCouncil.name);
  const typeName = selectedCouncil.type_name || 'Council';
  const budget = selectedCouncil.budget;
  const totalBudget = budget?.total_service ? formatBudget(budget.total_service) : null;

  const taxChange = areaBandD && areaBandD.previous
    ? ((areaBandD.value - areaBandD.previous) / areaBandD.previous) * 100
    : null;

  // Compute top 3 spending categories (with £ amounts) for the answer-first
  // narrative. Lists the actual £ figure per service so AI engines can extract
  // "how much does [council] spend on [service]" queries verbatim from the SSR
  // markup. Lowercase names are used because they read naturally in prose.
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
  type TopService = { key: string; name: string; amount: number; pct: number };
  let topServices: TopService[] = [];
  if (budget?.total_service) {
    const total = budget.total_service;
    topServices = serviceMap
      .map((service) => {
        const amount = budget[service.key as keyof typeof budget] as number | null;
        return amount && amount > 0
          ? { key: service.key, name: service.name, amount, pct: (amount / total) * 100 }
          : null;
      })
      .filter((s): s is TopService => s !== null)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);
  }
  const biggestCategory = topServices[0] ?? null;

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
              {areaBandD && (
                <>
                  {' '}In {areaBandD.year}, Band D council tax is{' '}
                  <SourceAnnotation
                    provenance={getProvenance(areaBandD.fieldPath, selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: `Band D council tax ${areaBandD.year}`,
                      value: formatCurrency(areaBandD.value, { decimals: 2 }),
                    }}
                  >{formatCurrency(areaBandD.value, { decimals: 2 })}</SourceAnnotation>
                  {taxChange !== null && (
                    <> — {Math.abs(taxChange).toFixed(1)}% {taxChange > 0 ? 'more' : 'less'} than last year</>
                  )}
                  .
                </>
              )}
              {totalBudget && topServices.length >= 3 ? (
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
                  {' '}Here&apos;s where your council tax goes: {topServices[0].name} takes the biggest share at{' '}
                  <SourceAnnotation
                    provenance={getProvenance(`budget.${topServices[0].key}`, selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: `Spending — ${topServices[0].name}`,
                      value: formatBudget(topServices[0].amount),
                    }}
                  >{formatBudget(topServices[0].amount)}</SourceAnnotation>{' '}({topServices[0].pct.toFixed(0)}%),
                  {' '}followed by {topServices[1].name} at{' '}
                  <SourceAnnotation
                    provenance={getProvenance(`budget.${topServices[1].key}`, selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: `Spending — ${topServices[1].name}`,
                      value: formatBudget(topServices[1].amount),
                    }}
                  >{formatBudget(topServices[1].amount)}</SourceAnnotation>{' '}({topServices[1].pct.toFixed(0)}%)
                  {' '}and {topServices[2].name} at{' '}
                  <SourceAnnotation
                    provenance={getProvenance(`budget.${topServices[2].key}`, selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: `Spending — ${topServices[2].name}`,
                      value: formatBudget(topServices[2].amount),
                    }}
                  >{formatBudget(topServices[2].amount)}</SourceAnnotation>{' '}({topServices[2].pct.toFixed(0)}%).
                </>
              ) : totalBudget && biggestCategory ? (
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
