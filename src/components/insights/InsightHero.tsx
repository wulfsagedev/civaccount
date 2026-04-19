import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import { PageShareButton } from '@/components/ui/page-share-button';
import type { InsightCardEntry } from '@/data/insights';
import { buildArticleSchema, buildWebPageSchema } from '@/lib/structured-data';

interface InsightHeroProps {
  entry: InsightCardEntry;
  /** Hero block — large primary number plus any supporting data. */
  hero: ReactNode;
  /** Optional body content shown between hero and FAQ (chart, table, etc.). */
  children?: ReactNode;
}

/**
 * Full-page shell for an insight sub-page.
 *
 * Standard layout:
 *   header → breadcrumb → share button → H1 → hero → body → FAQ → sources → footer
 *
 * Each card's `/insights/<slug>/page.tsx` passes its registry entry + a hero
 * node. Body content is optional — simple cards may just need the hero.
 *
 * SEO/GEO: this component owns the WebPage + Article JSON-LD for every
 * insight sub-page. The page itself remains responsible for FAQPage and
 * BreadcrumbList JSON-LD (which include page-specific values not on the
 * registry entry).
 */
export function InsightHero({ entry, hero, children }: InsightHeroProps) {
  const url = `/insights/${entry.slug}`;
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebPageSchema(entry.title, entry.metaDescription, url),
      buildArticleSchema({
        headline: entry.title,
        description: entry.metaDescription,
        url,
        about: 'UK local government finance',
        keywords: [
          'council tax',
          'council spending',
          'UK councils',
          'local government finance',
          'council budgets',
        ],
      }),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <main id="main-content" className="flex-1 container mx-auto px-4 max-w-3xl py-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Insights', href: '/insights' },
            { label: entry.title },
          ]}
        />

        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="type-title-1 font-semibold">{entry.title}</h1>
          <div className="shrink-0 pt-1">
            <PageShareButton
              title={`${entry.title} — CivAccount`}
              description={entry.shareText}
            />
          </div>
        </div>
        <p className="type-body-sm text-muted-foreground mb-8">{entry.subtitle}</p>

        <section className="card-elevated p-5 sm:p-6 mb-8">{hero}</section>

        {children && <div className="mb-8">{children}</div>}

        {entry.longformCopy.length > 0 && (
          <section className="card-elevated p-5 sm:p-6 mb-8">
            <h2 className="type-title-2 mb-4">About this number</h2>
            <div className="space-y-4">
              {entry.longformCopy.map((paragraph, i) => (
                <p key={i} className="type-body text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        )}

        {entry.faq.length > 0 && (
          <section className="card-elevated p-5 sm:p-6 mb-8">
            <h2 className="type-title-2 mb-4">Questions people ask</h2>
            <div className="space-y-6">
              {entry.faq.map((item) => (
                <div key={item.question}>
                  <h3 className="type-title-3 mb-2">{item.question}</h3>
                  <p className="type-body text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {entry.sources.length > 0 && (
          <section className="card-elevated p-5 sm:p-6 mb-8">
            <h2 className="type-title-2 mb-4">Sources</h2>
            <ul className="space-y-3">
              {entry.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="type-body-sm font-medium hover:underline"
                  >
                    {source.title}
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Link
          href="/insights"
          className="inline-flex items-center gap-2 type-body-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to all insights
        </Link>
      </main>
    </>
  );
}
