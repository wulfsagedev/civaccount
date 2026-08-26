import Link from 'next/link';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import type { InsightCardEntry } from '@/data/insights';

/**
 * Shown in place of an insight card that has been pulled because it cannot
 * currently be computed honestly.
 *
 * A 404 would be the easy answer, but it tells a reader who arrives from a
 * search result or a saved link nothing at all. On a site whose whole claim is
 * that every figure is traceable, saying plainly why a number was withdrawn is
 * worth more than hiding that it ever existed — and it means the URL is still
 * there when the card comes back.
 *
 * The route is `noindex` (set in each page's metadata) and the card is dropped
 * from the hub, sitemap and llms.txt, so nothing points here any more.
 */
export function WithdrawnCard({ card }: { card: InsightCardEntry }) {
  // Header and Footer come from src/app/insights/layout.tsx — rendering them
  // here too gives the page two of each.
  return (
    <>
      <main id="main-content" className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Insights', href: '/insights' },
              { label: card.title },
            ]}
          />

          <div className="mt-6 mb-8">
            <h1 className="type-title-1 mb-2">{card.title}</h1>
            <p className="type-body-sm text-muted-foreground">
              This card has been withdrawn while we fix it.
            </p>
          </div>

          <section className="card-elevated p-5 sm:p-6">
            <h2 className="type-title-2 mb-1">Why it was pulled</h2>
            <p className="type-body-sm text-muted-foreground mb-4">
              {card.withdrawn?.reason}
            </p>
            <p className="type-caption text-muted-foreground pt-4 border-t border-border/50">
              Withdrawn {card.withdrawn?.since}. We would rather show nothing
              than show a number we cannot stand behind.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="type-title-2 mb-1">In the meantime</h2>
            <p className="type-body-sm text-muted-foreground mb-5">
              These cards cover the same ground and are computed from figures we
              can source.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/insights/biggest-tax-rises"
                className="card-elevated p-4 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <p className="type-body-sm font-semibold mb-1">
                  Biggest council tax rises
                </p>
                <p className="type-caption text-muted-foreground">
                  Which councils put the bill up the most this year.
                </p>
              </Link>
              <Link
                href="/insights"
                className="card-elevated p-4 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <p className="type-body-sm font-semibold mb-1">All insights</p>
                <p className="type-caption text-muted-foreground">
                  Every national card on CivAccount.
                </p>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
