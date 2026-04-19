// JSON-LD structured data builder functions for SEO + GEO (AI search).
// Each returns a plain object (no @context). Caller composes into @graph.
//
// 2026 priorities:
//   - Organization + WebSite live in the root layout (entity foundation).
//   - BreadcrumbList on every non-trivial page (AI navigation signal).
//   - FAQPage where question/answer pairs are the page's primary content
//     (still a strong AI extraction signal even where Google narrowed
//     rich-result eligibility).
//   - Article on insight pages (primary content type for citation).
//   - WebPage / AboutPage on utility pages (basic semantic anchoring).
//   - Dataset on council pages (downloadable data, AI authority signal).

const BASE_URL = 'https://www.civaccount.co.uk';
const ORG_ID = `${BASE_URL}/#organization`;
const WEBSITE_ID = `${BASE_URL}/#website`;

export function buildFAQPageSchema(
  faqs: Array<{ question: string; answer: string }>,
  id: string
) {
  return {
    '@type': 'FAQPage',
    '@id': `${BASE_URL}${id}#faq`,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; url?: string }>,
  id: string
) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${BASE_URL}${id}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url && { item: `${BASE_URL}${item.url}` }),
    })),
  };
}

export function buildWebPageSchema(
  title: string,
  description: string,
  url: string,
  options: { type?: 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage' | 'CheckoutPage'; lastReviewed?: string } = {}
) {
  return {
    '@type': options.type ?? 'WebPage',
    '@id': `${BASE_URL}${url}#webpage`,
    name: title,
    description,
    url: `${BASE_URL}${url}`,
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-GB',
    ...(options.lastReviewed && { lastReviewed: options.lastReviewed }),
  };
}

/**
 * Article schema for editorially-curated insight pages.
 *
 * In 2026, Article is the most reliably-cited schema for AI search engines
 * (ChatGPT, Perplexity, Claude). The combination of headline + datePublished
 * + dateModified + author/publisher + about + a stable @id is what feeds
 * Knowledge Graph entity recognition and citation eligibility.
 *
 * For data-driven articles like CivAccount insights, `about` should reference
 * the topic entity (e.g. "council tax in England") and `keywords` should
 * include the natural-language query the article answers.
 */
export function buildArticleSchema(opts: {
  headline: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  about?: string;
  keywords?: string[];
  imageUrl?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    '@type': 'Article',
    '@id': `${BASE_URL}${opts.url}#article`,
    headline: opts.headline,
    description: opts.description,
    url: `${BASE_URL}${opts.url}`,
    mainEntityOfPage: { '@id': `${BASE_URL}${opts.url}#webpage` },
    datePublished: opts.datePublished ?? '2025-09-01',
    dateModified: opts.dateModified ?? today,
    inLanguage: 'en-GB',
    isAccessibleForFree: true,
    isPartOf: { '@id': WEBSITE_ID },
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    ...(opts.imageUrl && { image: opts.imageUrl }),
    ...(opts.about && { about: { '@type': 'Thing', name: opts.about } }),
    ...(opts.keywords && opts.keywords.length > 0 && { keywords: opts.keywords.join(', ') }),
  };
}

/**
 * Convenience builder for insight sub-pages — combines WebPage, Article,
 * BreadcrumbList, and FAQ into one consistent @graph.
 */
export function buildInsightGraph(opts: {
  title: string;
  description: string;
  slug: string;                        // e.g. "biggest-tax-rises"
  faqs: Array<{ question: string; answer: string }>;
  about?: string;
  keywords?: string[];
  datePublished?: string;
  dateModified?: string;
}) {
  const url = `/insights/${opts.slug}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebPageSchema(opts.title, opts.description, url),
      buildArticleSchema({
        headline: opts.title,
        description: opts.description,
        url,
        about: opts.about,
        keywords: opts.keywords,
        datePublished: opts.datePublished,
        dateModified: opts.dateModified,
      }),
      buildBreadcrumbSchema(
        [
          { name: 'Home', url: '/' },
          { name: 'Insights', url: '/insights' },
          { name: opts.title },
        ],
        url,
      ),
      ...(opts.faqs.length > 0 ? [buildFAQPageSchema(opts.faqs, url)] : []),
    ],
  };
}
