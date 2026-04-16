'use client';

import { useState, useMemo } from 'react';
import { councils, getCouncilDisplayName, getCouncilPopulation, formatCurrency, formatBudget, getCouncilSlug, type Council } from '@/data/councils';
import { BUDGET_CATEGORIES } from '@/lib/proposals';
import { CARD_STYLES } from '@/lib/utils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { X, Plus, ArrowUpDown, ChevronRight, Vote } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { PageShareButton } from '@/components/ui/page-share-button';
import Link from 'next/link';

type SortField = 'band_d' | 'total_budget' | 'name';

export default function CompareClient() {
  const [selected, setSelected] = useState<Council[]>([]);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('band_d');

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return councils
      .filter(c =>
        c.name.toLowerCase().includes(q) &&
        !selected.some(s => s.ons_code === c.ons_code)
      )
      .slice(0, 8);
  }, [search, selected]);

  const addCouncil = (council: Council) => {
    if (selected.length >= 5) return;
    setSelected([...selected, council]);
    setSearch('');
  };

  const removeCouncil = (code: string) => {
    setSelected(selected.filter(c => c.ons_code !== code));
  };

  const sorted = useMemo(() => {
    return [...selected].sort((a, b) => {
      if (sortField === 'name') return a.name.localeCompare(b.name);
      if (sortField === 'band_d') {
        return (b.council_tax?.band_d_2025 ?? 0) - (a.council_tax?.band_d_2025 ?? 0);
      }
      return (b.budget?.total_service ?? 0) - (a.budget?.total_service ?? 0);
    });
  }, [selected, sortField]);

  const budgetKeys = Object.keys(BUDGET_CATEGORIES) as (keyof typeof BUDGET_CATEGORIES)[];

  return (
    <>
      <Header />
      <PageContainer>
        <div className="flex items-start justify-between gap-2 mb-6">
          <div>
            <h1 className="type-title-1 mb-1">Compare councils</h1>
            <p className="type-body-sm text-muted-foreground">
              See how councils compare on spending and council tax. Add up to 5 councils.
            </p>
          </div>
          <PageShareButton
            title="Compare Councils — CivAccount"
            description="Compare council tax rates and spending across English councils on CivAccount"
          />
        </div>

        {/* Search to add councils */}
        <div className="relative mb-6">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {selected.map((c) => (
              <Badge key={c.ons_code} variant="outline" className="type-body-sm gap-1 px-3 py-1.5">
                {getCouncilDisplayName(c)}
                <button
                  type="button"
                  onClick={() => removeCouncil(c.ons_code)}
                  className="ml-1 cursor-pointer"
                  aria-label={`Remove ${c.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          {selected.length < 5 && (
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for a council to add..."
                className="w-full h-12 px-4 rounded-xl border border-border bg-background type-body-sm focus:outline-none focus:border-foreground/50"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/40 rounded-xl shadow-lg z-10 overflow-hidden">
                  {searchResults.map((c) => (
                    <button
                      key={c.ons_code}
                      type="button"
                      onClick={() => addCouncil(c)}
                      className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted transition-colors cursor-pointer text-left"
                    >
                      <div>
                        <p className="type-body-sm font-semibold">{c.name}</p>
                        <p className="type-caption text-muted-foreground">{c.type_name}</p>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {selected.length === 0 ? (
          <div className={`${CARD_STYLES} p-6 sm:p-8`}>
            <div className="max-w-md mx-auto text-center">
              <p className="type-title-3 mb-2">Compare up to 5 councils</p>
              <p className="type-body-sm text-muted-foreground mb-6">
                See council tax, spending, and budget breakdowns side by side.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
              {[
                { label: 'Council Tax', desc: 'Band D rates compared' },
                { label: 'Total Budget', desc: 'Service spending compared' },
                { label: 'Per Category', desc: 'Education, transport, housing...' },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="type-body-sm font-semibold">{item.label}</p>
                  <p className="type-caption text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/townhall"
                className="type-body-sm text-muted-foreground hover:text-foreground transition-colors underline cursor-pointer"
              >
                Or visit Town Hall to vote on how councils spend your money
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Sort controls */}
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="type-caption text-muted-foreground">Sort by:</span>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
                {([['band_d', 'Council Tax'], ['total_budget', 'Budget'], ['name', 'Name']] as const).map(([field, label]) => (
                  <button
                    key={field}
                    type="button"
                    onClick={() => setSortField(field)}
                    className={`px-3 py-1.5 rounded-md type-caption font-medium transition-colors cursor-pointer ${
                      sortField === field ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type mismatch warning */}
            {(() => {
              const types = new Set(selected.map(c => c.type));
              if (types.size <= 1) return null;
              return (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 mb-4">
                  <p className="type-caption text-muted-foreground">
                    You are comparing different types of councils. County councils provide different services than districts, so their costs are not directly comparable.
                  </p>
                </div>
              );
            })()}

            {/* Council Tax comparison */}
            <div className={`${CARD_STYLES} p-5 sm:p-6 mb-4`}>
              <h2 className="type-title-2 mb-1">Council Tax (Band D)</h2>
              <p className="type-body-sm text-muted-foreground mb-5">2025-26 Band D rates</p>
              <div className="space-y-4">
                {sorted.map((c) => {
                  const bandD = c.council_tax?.band_d_2025;
                  const maxBandD = Math.max(...selected.map(s => s.council_tax?.band_d_2025 ?? 0));
                  const pct = bandD && maxBandD ? (bandD / maxBandD) * 100 : 0;
                  const change = c.council_tax?.band_d_2024
                    ? ((bandD ?? 0) - c.council_tax.band_d_2024) / c.council_tax.band_d_2024 * 100
                    : null;

                  return (
                    <div key={c.ons_code}>
                      <div className="flex items-baseline justify-between mb-1">
                        <Link href={`/council/${getCouncilSlug(c)}`} className="type-body font-semibold hover:text-navy-600 transition-colors cursor-pointer">
                          {getCouncilDisplayName(c)}
                        </Link>
                        <div className="flex items-center gap-2">
                          {change !== null && (
                            <span className={`type-caption ${change > 0 ? 'text-negative' : 'text-positive'}`}>
                              {change > 0 ? '+' : ''}{change.toFixed(1)}%
                            </span>
                          )}
                          <span className="type-body font-semibold tabular-nums">
                            {bandD ? formatCurrency(bandD, { decimals: 2 }) : '—'}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Budget comparison */}
            <div className={`${CARD_STYLES} p-5 sm:p-6 mb-4`}>
              <h2 className="type-title-2 mb-1">Total Service Budget</h2>
              <p className="type-body-sm text-muted-foreground mb-5">Net service expenditure (in thousands)</p>
              <div className="space-y-4">
                {sorted.map((c) => {
                  const total = c.budget?.total_service;
                  const maxTotal = Math.max(...selected.map(s => s.budget?.total_service ?? 0));
                  const pct = total && maxTotal ? (total / maxTotal) * 100 : 0;

                  return (
                    <div key={c.ons_code}>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="type-body font-semibold">{getCouncilDisplayName(c)}</span>
                        <span className="type-body font-semibold tabular-nums">
                          {total ? formatBudget(total) : '—'}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Per-capita spending comparison */}
            {(() => {
              const perCapitaData = sorted
                .map((c) => {
                  const total = c.budget?.total_service;
                  const pop = getCouncilPopulation(c.name);
                  if (!total || !pop) return null;
                  return { council: c, perCapita: (total * 1000) / pop, population: pop };
                })
                .filter(Boolean) as { council: Council; perCapita: number; population: number }[];

              if (perCapitaData.length < 2) return null;

              const maxPerCapita = Math.max(...perCapitaData.map(d => d.perCapita));

              return (
                <div className={`${CARD_STYLES} p-5 sm:p-6 mb-4`}>
                  <h2 className="type-title-2 mb-1">Spending per person</h2>
                  <p className="type-body-sm text-muted-foreground mb-5">Total service budget divided by population</p>
                  <div className="space-y-4">
                    {perCapitaData
                      .sort((a, b) => b.perCapita - a.perCapita)
                      .map(({ council: c, perCapita, population }) => {
                        const pct = (perCapita / maxPerCapita) * 100;
                        return (
                          <div key={c.ons_code}>
                            <div className="flex items-baseline justify-between mb-1">
                              <span className="type-body font-semibold">{getCouncilDisplayName(c)}</span>
                              <span className="type-body font-semibold tabular-nums">
                                {formatCurrency(perCapita, { decimals: 0 })}/person
                              </span>
                            </div>
                            <div className="flex items-baseline justify-between mb-2">
                              <span className="type-caption text-muted-foreground">
                                Population: {population.toLocaleString('en-GB')}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <p className="type-caption text-muted-foreground mt-5 pt-3 border-t border-border/30">
                    Source: ONS Mid-2024 Population Estimates, GOV.UK Revenue Expenditure
                  </p>
                </div>
              );
            })()}

            {/* Service breakdown comparison */}
            <div className={`${CARD_STYLES} p-5 sm:p-6`}>
              <h2 className="type-title-2 mb-1">Spending by Service</h2>
              <p className="type-body-sm text-muted-foreground mb-5">Budget allocation per service area (in thousands)</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left type-caption text-muted-foreground font-medium py-2 pr-4">Service</th>
                      {sorted.map((c) => (
                        <th key={c.ons_code} className="text-right type-caption text-muted-foreground font-medium py-2 px-2 min-w-[100px]">
                          {c.name.split(' ')[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {budgetKeys.map((key) => {
                      const hasData = sorted.some(c => {
                        const val = c.budget?.[key as keyof typeof c.budget];
                        return val !== null && val !== undefined && val !== 0;
                      });
                      if (!hasData) return null;

                      return (
                        <tr key={key} className="border-b border-border/20">
                          <td className="type-body-sm py-2.5 pr-4">{BUDGET_CATEGORIES[key]}</td>
                          {sorted.map((c) => {
                            const val = c.budget?.[key as keyof typeof c.budget];
                            return (
                              <td key={c.ons_code} className="type-body-sm tabular-nums text-right py-2.5 px-2">
                                {val ? formatBudget(val as number) : '—'}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Cross-promo CTAs */}
        {selected.length > 0 && (
          <div className="mt-8 space-y-2">
            <Link
              href={`/council/${getCouncilSlug(selected[0])}`}
              className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <div>
                  <p className="type-body-sm font-semibold !leading-none group-hover:text-foreground transition-colors">
                    See the full {getCouncilDisplayName(selected[0])} budget
                  </p>
                  <p className="type-body-sm text-muted-foreground !leading-none mt-1">
                    Detailed spending breakdown, leadership, and performance
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
            </Link>
            <Link
              href={`/council/${getCouncilSlug(selected[0])}/proposals`}
              className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Vote className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <div>
                  <p className="type-body-sm font-semibold !leading-none group-hover:text-foreground transition-colors">
                    Think {getCouncilDisplayName(selected[0])} could do better?
                  </p>
                  <p className="type-body-sm text-muted-foreground !leading-none mt-1">
                    Suggest a change in Town Hall
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
            </Link>
          </div>
        )}
      </PageContainer>
      <Footer />
    </>
  );
}
