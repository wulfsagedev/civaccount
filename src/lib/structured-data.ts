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

import { getDataLastVerified } from '@/lib/data-freshness';

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
  // `dateModified` defaults to the real max `last_verified` across the
  // dataset — a genuine data-freshness signal. Never fake today's date;
  // that actively harms trust in the sitemap + AI citation eligibility.
  const dataLastVerified = getDataLastVerified();
  return {
    '@type': 'Article',
    '@id': `${BASE_URL}${opts.url}#article`,
    headline: opts.headline,
    description: opts.description,
    url: `${BASE_URL}${opts.url}`,
    mainEntityOfPage: { '@id': `${BASE_URL}${opts.url}#webpage` },
    datePublished: opts.datePublished ?? '2025-09-01',
    dateModified: opts.dateModified ?? dataLastVerified,
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

/**
 * Dataset schema for council pages.
 *
 * Exists because two pages hand-rolled their own Dataset block and drifted
 * apart, which Search Console caught on 2026-08-26 (WNC-10030322):
 *
 *   - "Missing field creator" — the council page had `publisher` but no
 *     `creator`. Recommended, not required, but it is the field that says who
 *     compiled the data as opposed to who serves it, and on this site those
 *     happen to be the same organisation.
 *
 *   - "Invalid object type for field spatialCoverage" — the council page used
 *     `AdministrativeArea`. That IS a subclass of Place in schema.org, so it
 *     is semantically fine, but Google's Dataset parser accepts only Text or
 *     Place and rejects the subtype. The provenance page used Place but hung
 *     `addressCountry` directly on it, which belongs to PostalAddress.
 *
 * Both now go through here. Add Dataset properties in this function, not at
 * the call site, so the two can't diverge again.
 */
export function buildDatasetSchema(opts: {
  /** Path the dataset belongs to, e.g. `/council/bradford`. */
  url: string;
  name: string;
  description: string;
  /** Place name for spatialCoverage — the AREA, not the organisation. */
  areaName: string;
  keywords?: string[];
  /** ISO date the underlying data was last verified. */
  dateModified?: string;
  temporalCoverage?: string;
  variableMeasured?: Record<string, unknown>;
  distribution?: Array<Record<string, unknown>>;
}) {
  return {
    '@type': 'Dataset',
    '@id': `${BASE_URL}${opts.url}#dataset`,
    name: opts.name,
    description: opts.description,
    url: `${BASE_URL}${opts.url}`,
    isAccessibleForFree: true,
    // Who compiled it and who publishes it. Same organisation here, but
    // Google asks for both and they are genuinely different roles.
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    // The compiled dataset is under the CivAccount Data Licence; the
    // underlying GOV.UK source data stays OGL v3.0, linked per field.
    license: `${BASE_URL}/license`,
    // Place, never AdministrativeArea — see the note above. The country goes
    // in the name rather than a nested address, matching Google's own
    // "Tahoe City, CA" example; a council area has no postal address.
    spatialCoverage: {
      '@type': 'Place',
      name: `${opts.areaName}, England, United Kingdom`,
    },
    ...(opts.keywords?.length && { keywords: opts.keywords.join(', ') }),
    ...(opts.dateModified && { dateModified: opts.dateModified }),
    ...(opts.temporalCoverage && { temporalCoverage: opts.temporalCoverage }),
    ...(opts.variableMeasured && { variableMeasured: opts.variableMeasured }),
    ...(opts.distribution?.length && { distribution: opts.distribution }),
  };
}
