// JSON-LD structured data builder functions for SEO
// Each returns a plain object (no @context). Caller composes into @graph.

const BASE_URL = 'https://www.civaccount.co.uk';

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
  url: string
) {
  return {
    '@type': 'WebPage',
    '@id': `${BASE_URL}${url}#webpage`,
    name: title,
    description,
    url: `${BASE_URL}${url}`,
    isPartOf: {
      '@id': `${BASE_URL}/#website`,
    },
    publisher: {
      '@id': `${BASE_URL}/#organization`,
    },
  };
}
