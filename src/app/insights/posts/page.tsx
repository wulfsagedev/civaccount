import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PageContainer } from '@/components/ui/page-container';
import { insightPosts } from '@/data/insights-posts';
import { buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

export const metadata: Metadata = {
  title: 'Insights — long reads from the CivAccount dataset',
  description:
    'Long-form analysis from the CivAccount dataset. Methodology updates, council case studies, and what 317 sets of audited council accounts tell us about local government in England.',
  alternates: { canonical: '/insights/posts' },
  openGraph: {
    title: 'Insights — long reads from the CivAccount dataset',
    description:
      'Methodology updates and council case studies from the CivAccount dataset.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Insights — long reads from the CivAccount dataset',
    description:
      'Methodology updates and council case studies from the CivAccount dataset.',
  },
};

export default function InsightPostsHub() {
  const sorted = [...insightPosts].sort((a, b) => b.date.localeCompare(a.date));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbSchema(
        [
          { name: 'Home', url: '/' },
          { name: 'Insights', url: '/insights' },
          { name: 'Long reads' },
        ],
        '/insights/posts',
      ),
      {
        '@type': 'CollectionPage',
        '@id': 'https://www.civaccount.co.uk/insights/posts#collection',
        name: 'CivAccount long reads',
        description:
          'Methodology updates and council case studies from the CivAccount dataset.',
        hasPart: sorted.map((p) => ({
          '@type': 'Article',
          headline: p.title,
          datePublished: p.date,
          url: `https://www.civaccount.co.uk/insights/posts/${p.slug}`,
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <PageContainer className="py-8 sm:py-12">
        <div className="text-center mb-10 sm:mb-12">
          <Badge variant="outline" className="mb-4">Long reads</Badge>
          <h1 className="type-title-1 font-semibold mb-4">
            Insights from the dataset
          </h1>
          <p className="type-body-lg text-muted-foreground max-w-2xl mx-auto">
            Methodology updates, council case studies, and what 317 sets of audited
            accounts reveal about local government in England.
          </p>
        </div>

        <ul className="space-y-3">
          {sorted.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/insights/posts/${post.slug}`}
                className="card-elevated p-5 sm:p-6 flex items-start gap-4 hover:bg-muted/30 transition-colors group cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="type-caption text-muted-foreground mb-2 flex items-center gap-3">
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </time>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {post.readMinutes} min read
                    </span>
                  </p>
                  <h2 className="type-title-3 font-semibold mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="type-body-sm text-muted-foreground">{post.hook}</p>
                </div>
                <ChevronRight
                  className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0 mt-1"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </PageContainer>

      <Footer />
    </div>
  );
}
