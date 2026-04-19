import { Badge } from "@/components/ui/badge";
import { Clock, Database, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PageContainer } from '@/components/ui/page-container';
import { getRecentDiffs } from '@/lib/civic-diffs';

export const metadata = {
  title: 'Data Change Log',
};

// Render this on the server so search/AI crawlers see the data directly
// rather than an empty shell + client fetch.
export const dynamic = 'force-dynamic';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);
}

export default function ChangelogPage() {
  const diffs = getRecentDiffs(50);

  // Group by year_to (the fiscal year the change lands in) for a scannable timeline
  const grouped = diffs.reduce((acc, d) => {
    const year = `${d.year_to}-${(d.year_to + 1).toString().slice(-2)}`;
    if (!acc[year]) acc[year] = [];
    acc[year].push(d);
    return acc;
  }, {} as Record<string, typeof diffs>);

  const years = Object.keys(grouped).sort().reverse();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <PageContainer className="py-8 sm:py-12">
        <div className="text-center mb-10 sm:mb-12">
          <Badge variant="outline" className="mb-4">Change log</Badge>
          <h1 className="type-title-1 font-semibold mb-4">What changed and when</h1>
          <p className="type-body-lg text-muted-foreground max-w-2xl mx-auto">
            Every council data change on CivAccount, sourced and dated. Year-over-year council tax
            movement and budget updates across all 317 councils.
          </p>
        </div>

        {/* Meta strip */}
        <div className="card-elevated p-5 sm:p-6 mb-8">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Database className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="type-body-sm font-semibold mb-1">How this log is built</p>
              <p className="type-body-sm text-muted-foreground">
                Council tax changes come from comparing the latest year against the prior year in{' '}
                <Link href="/developers" className="underline">our JSON API</Link>
                . Budget updates are posted when new RA returns land from MHCLG.
                Every row links to the council page where you can see the full context.
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {years.length === 0 ? (
          <div className="card-elevated p-8 text-center">
            <p className="type-body text-muted-foreground">
              No recent changes to display.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {years.map((year) => (
              <section key={year}>
                <div className="flex items-baseline gap-3 mb-4">
                  <h2 className="type-title-2 font-semibold">{year}</h2>
                  <p className="type-caption text-muted-foreground">
                    {grouped[year].length} change{grouped[year].length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="card-elevated overflow-hidden">
                  {grouped[year].map((d, i) => (
                    <Link
                      key={d.id}
                      href={`/council/${d.council_slug}`}
                      className={`block p-4 sm:p-5 hover:bg-muted/30 transition-colors cursor-pointer ${i > 0 ? 'border-t border-border/40' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="type-body-sm font-semibold mb-1">{d.council_name}</p>
                          <p className="type-caption text-muted-foreground leading-relaxed">
                            {d.summary}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`type-body-sm font-semibold tabular-nums ${d.pct_change > 0 ? 'text-negative' : d.pct_change < 0 ? 'text-positive' : 'text-muted-foreground'}`}>
                            {d.pct_change > 0 ? '+' : ''}
                            {d.pct_change.toFixed(1)}%
                          </span>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 type-caption text-muted-foreground">
                        <span className="tabular-nums">
                          {formatCurrency(d.amount_from)} → {formatCurrency(d.amount_to)}
                        </span>
                        <span>
                          {d.type === 'council_tax' ? 'Council tax' : 'Budget'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Meta: link to API */}
        <div className="mt-10 p-5 rounded-lg bg-muted/30 border border-border/40">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="type-body-sm font-semibold mb-1">Want this as a feed?</p>
              <p className="type-caption text-muted-foreground">
                Hit <code className="px-1.5 py-0.5 rounded bg-muted">GET /api/v1/diffs</code> for JSON,
                or <code className="px-1.5 py-0.5 rounded bg-muted">?council=kent</code> to filter to one council.
                See <Link href="/developers" className="underline">/developers</Link>.
              </p>
            </div>
          </div>
        </div>
      </PageContainer>

      <Footer />
    </div>
  );
}
