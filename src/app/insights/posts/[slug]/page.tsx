import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Clock, ChevronRight, ExternalLink } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PageContainer } from '@/components/ui/page-container';
import {
  getInsightPost,
  getAllInsightPostSlugs,
} from '@/data/insights-posts';
import { buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllInsightPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getInsightPost(slug);
  if (!post) return { title: 'Post not found' };

  return {
    title: `${post.title} · CivAccount`,
    description: post.description,
    alternates: { canonical: `/insights/posts/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

export default async function InsightPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getInsightPost(slug);
  if (!post) notFound();

  const url = `https://www.civaccount.co.uk/insights/posts/${slug}`;

  // Article JSON-LD — full schema for AI search engines and rich-result eligibility.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        dateModified: post.date,
        author: {
          '@type': 'Organization',
          name: post.author,
          url: 'https://www.civaccount.co.uk/about',
        },
        publisher: {
          '@type': 'Organization',
          name: 'CivAccount',
          url: 'https://www.civaccount.co.uk',
        },
        url,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        wordCount: post.sections
          .flatMap((s) => s.paragraphs)
          .reduce((n, p) => n + p.split(/\s+/).length, 0),
      },
      buildBreadcrumbSchema(
        [
          { name: 'Home', url: '/' },
          { name: 'Insights', url: '/insights' },
          { name: 'Long reads', url: '/insights/posts' },
          { name: post.title },
        ],
        `/insights/posts/${slug}`,
      ),
    ],
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <PageContainer className="py-8 sm:py-12 max-w-3xl">
        <div className="mb-6">
          <Link
            href="/insights/posts"
            className="inline-flex items-center gap-1 type-body-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            All long reads
          </Link>
        </div>

        <article>
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="outline">Long read</Badge>
              <time
                dateTime={post.date}
                className="type-caption text-muted-foreground"
              >
                {new Date(post.date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
              <span className="type-caption text-muted-foreground inline-flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {post.readMinutes} min read
              </span>
            </div>

            <h1 className="type-title-1 font-semibold mb-4">{post.title}</h1>
            <p className="type-body-lg text-muted-foreground">{post.hook}</p>
          </header>

          <div className="prose-content space-y-8">
            {post.sections.map((section, i) => (
              <section key={i}>
                {section.heading && (
                  <h2 className="type-title-2 font-semibold mb-3">
                    {section.heading}
                  </h2>
                )}
                <div className="space-y-4">
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className="type-body-lg text-foreground">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {post.related && post.related.length > 0 && (
            <section className="mt-12 pt-8 border-t border-border/50">
              <h2 className="type-title-3 font-semibold mb-4">Read next</h2>
              <ul className="space-y-1">
                {post.related.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center justify-between gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer min-h-11"
                    >
                      <span className="type-body-sm font-semibold leading-tight group-hover:text-primary transition-colors">
                        {link.label}
                      </span>
                      <ChevronRight
                        className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {post.sources && post.sources.length > 0 && (
            <section className="mt-8 pt-8 border-t border-border/50">
              <h2 className="type-title-3 font-semibold mb-4">Sources</h2>
              <ul className="space-y-2">
                {post.sources.map((s) => (
                  <li key={s.href}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-start gap-2 type-body-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink
                        className="h-4 w-4 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span className="underline-offset-2 hover:underline">
                        {s.label}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </PageContainer>

      <Footer />
    </div>
  );
}
