'use client';

import { useState, useMemo } from 'react';
import { councils, getCouncilDisplayName, formatCurrency, formatBudget, getCouncilSlug, type Council } from '@/data/councils';
import { BUDGET_CATEGORIES } from '@/lib/proposals';
import { CARD_STYLES } from '@/lib/utils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { X, Plus, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

type SortField = 'band_d' | 'total_budget' | 'name';

export default function ComparePage() {
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
      <main id="main-content" className="container mx-auto px-4 py-6 max-w-5xl">
        <h1 className="type-title-1 mb-1">Compare councils</h1>
        <p className="type-body-sm text-muted-foreground mb-6">
          See how councils compare on spending and council tax. Add up to 5 councils.
        </p>

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
          <div className={`${CARD_STYLES} p-8 text-center`}>
            <p className="type-body-sm text-muted-foreground">
              Search above to add councils and compare them side by side.
            </p>
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
      </main>
      <Footer />
    </>
  );
}
