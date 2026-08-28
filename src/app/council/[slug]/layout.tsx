import type { Metadata } from 'next';
import { getCouncilBySlug, getAllCouncilSlugs, getCouncilDisplayName, getAverageBandDByType, formatCurrency, formatBudget, getCouncilPopulation, toSentenceTypeName, getTotalBandD, getAreaBandD, getAreaBandDChange, PREVIOUS_TAX_YEAR } from '@/data/councils';
import { buildFAQPageSchema, buildDatasetSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';


interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateStaticParams() {
  const slugs = getAllCouncilSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Any slug not in generateStaticParams() must 404 with a real HTTP 404.
//
// Without this, an unknown slug falls through to on-demand rendering and
// page.tsx — a client component — calls notFound(). That renders the
// not-found UI but cannot set the status code, because the response has
// already been streamed with a 200. The result was a soft 404 across an
// unbounded URL space: /council/anything-at-all returned 200 with the
// homepage canonical, which burns crawl budget and reads to Google as a
// site-quality problem.
//
// Safe to force: getCouncilBySlug() matches on generateSlug(name) and
// getAllCouncilSlugs() returns generateSlug(name) for every council, so the
// two sets are identical — there are no aliases to strand. Nested dynamic
// segments keep their own dynamicParams, so runtime-created proposal IDs
// under /council/<slug>/proposals/<id> are unaffected.
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const council = getCouncilBySlug(slug);

  if (!council) {
    return {
      title: 'Council Not Found',
    };
  }

  const displayName = getCouncilDisplayName(council);
  // Most recent verified AREA Band D — 2026-27 for billing authorities,
  // 2025-26 fallback for county councils. `area.year` says which.
  const area = getAreaBandD(council);
  const taxYear = area?.year ?? PREVIOUS_TAX_YEAR;
  const bandDText = area ? ` - Band D ${formatCurrency(area.value, { decimals: 2 })} (${area.year})` : '';

  return {
    title: `${displayName} Budget & Council Tax ${taxYear}`,
    description: `See how ${displayName} spends your council tax${bandDText}. Budget breakdown, service spending, and tax band information for ${taxYear}.`,
    alternates: {
      canonical: `/council/${slug}`,
    },
    openGraph: {
      title: `${displayName} Council Tax & Budget`,
      description: `Council tax and budget breakdown for ${displayName} ${taxYear}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} Council Tax & Budget ${taxYear}`,
      description: `See how ${displayName} spends your council tax${bandDText}. Budget breakdown and spending insights.`,
    },
  };
}

// Service category mapping (matches UnifiedDashboard)
const SERVICE_MAP = [
  { key: 'environmental', name: 'Bins, streets & environment' },
  { key: 'planning', name: 'Planning' },
  { key: 'central_services', name: 'Running the council' },
  { key: 'cultural', name: 'Parks, libraries & leisure' },
  { key: 'housing', name: 'Housing' },
  { key: 'adult_social_care', name: 'Adult social care' },
  { key: 'childrens_social_care', name: "Children's services" },
  { key: 'education', name: 'Education' },
  { key: 'transport', name: 'Roads & transport' },
  { key: 'public_health', name: 'Public health' },
];

export default async function CouncilLayout({ params, children }: Props) {
  const { slug } = await params;
  const council = getCouncilBySlug(slug);

  if (!council) {
    return children;
  }

  const displayName = getCouncilDisplayName(council);
  // 2025-26 own-share figure — stays next to the 2025-26 precept breakdown.
  const bandD = council.council_tax?.band_d_2025;
  const typeName = council.type_name || 'Council';
  const detailed = council.detailed;
  const budget = council.budget;

  // Compute FAQ data server-side (mirrors UnifiedDashboard logic)
  // Most recent verified AREA Band D (2026-27 for billing authorities;
  // county councils fall back to 2025-26 — `area.year` says which).
  const area = getAreaBandD(council);
  const typeAverage = getAverageBandDByType(council.type);
  // Same-year comparison: getAverageBandDByType averages the year
  // getAreaBandD returns for that type.
  const vsAverage = area && typeAverage ? area.value - typeAverage : null;
  // Year-on-year change computed from the two most recent published years.
  const areaChange = getAreaBandDChange(council);

  // Build spending categories sorted by percentage
  const spendingCategories: Array<{ name: string; percentage: number }> = [];
  if (budget?.total_service) {
    const total = budget.total_service;
    for (const service of SERVICE_MAP) {
      const amount = budget[service.key as keyof typeof budget] as number | null;
      if (amount && amount > 0) {
        spendingCategories.push({
          name: service.name,
          percentage: (amount / total) * 100,
        });
      }
    }
    spendingCategories.sort((a, b) => b.percentage - a.percentage);
  }

  // Build FAQ pairs for schema
  const faqs: Array<{ question: string; answer: string }> = [];

  // Precept-based split — stays in 2025-26, the year the precept rows belong to.
  const totalBill = getTotalBandD(council);
  if (totalBill && bandD) {
    const pct = Math.round((bandD / totalBill) * 100);
    const isSoleAuthority = pct >= 100 || (detailed?.precepts?.length ?? 0) < 2;
    faqs.push({
      question: `What percentage of my bill goes to ${council.name}?`,
      answer: isSoleAuthority
        ? `In 2025-26, all of your council tax (${formatCurrency(bandD, { decimals: 2 })}) goes to ${council.name}.`
        : `In 2025-26, ${pct}% of your total bill (${formatCurrency(bandD, { decimals: 2 })} out of ${formatCurrency(totalBill, { decimals: 2 })}).`,
    });
  }

  if (spendingCategories.length > 0) {
    faqs.push({
      question: 'What does most of my money go towards?',
      answer: `${spendingCategories[0].name} takes the biggest share at ${spendingCategories[0].percentage.toFixed(0)}% of the budget.`,
    });
  }

  if (vsAverage !== null && area) {
    const diff = formatCurrency(Math.abs(vsAverage), { decimals: 2 });
    const comparison = vsAverage > 0
      ? `In ${area.year}, this council charges ${diff} more than the average ${typeName.toLowerCase()}.`
      : vsAverage < 0
        ? `In ${area.year}, this council charges ${diff} less than the average ${typeName.toLowerCase()}.`
        : `In ${area.year}, this council charges about the same as the average ${typeName.toLowerCase()}.`;
    faqs.push({
      question: 'Is this council expensive compared to others?',
      answer: comparison,
    });
  }

  if (areaChange !== null) {
    const changeDesc = areaChange.amount > 0
      ? `Your Band D bill went up by ${formatCurrency(areaChange.amount, { decimals: 2 })} (${areaChange.percent.toFixed(1)}%) from ${areaChange.fromYear} to ${areaChange.toYear}.`
      : areaChange.amount < 0
        ? `Your Band D bill went down by ${formatCurrency(Math.abs(areaChange.amount), { decimals: 2 })} (${Math.abs(areaChange.percent).toFixed(1)}%) from ${areaChange.fromYear} to ${areaChange.toYear}.`
        : `Your Band D bill stayed the same from ${areaChange.fromYear} to ${areaChange.toYear}.`;
    faqs.push({
      question: 'How much has my bill gone up this year?',
      answer: changeDesc,
    });
  }

  // Build narrative summary segments
  const population = getCouncilPopulation(council.name);
  const totalBudget = budget?.total_service ? formatBudget(budget.total_service) : null;
  const biggestCategory = spendingCategories.length > 0 ? spendingCategories[0] : null;

  // Use sentence-form that preserves proper nouns ("London borough", not "london borough").
  const typeNameSentence = toSentenceTypeName(typeName);
  const narrativeParts: string[] = [];
  narrativeParts.push(`${displayName} is a ${typeNameSentence}${population ? ` serving ${population.toLocaleString('en-GB')} residents` : ''}.`);

  if (area) {
    let taxSentence = `In ${area.year}, Band D council tax is ${formatCurrency(area.value, { decimals: 2 })}`;
    if (areaChange !== null) {
      const direction = areaChange.percent > 0 ? 'more' : 'less';
      taxSentence += ` — ${Math.abs(areaChange.percent).toFixed(1)}% ${direction} than in ${areaChange.fromYear}`;
    }
    taxSentence += '.';
    narrativeParts.push(taxSentence);
  }

  if (totalBudget && biggestCategory) {
    narrativeParts.push(
      `The council manages a total service budget of ${totalBudget}, with ${biggestCategory.name.toLowerCase()} being the largest spending area at ${biggestCategory.percentage.toFixed(0)}% of the total.`
    );
  } else if (totalBudget) {
    narrativeParts.push(`The council manages a total service budget of ${totalBudget}.`);
  }

  const narrativeText = narrativeParts.join(' ');

  // Build JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'GovernmentOrganization',
        '@id': `https://www.civaccount.co.uk/council/${slug}#organization`,
        name: displayName,
        description: `${typeName} in England`,
        areaServed: {
          '@type': 'AdministrativeArea',
          name: displayName,
        },
        ...(detailed?.website && { url: detailed.website }),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `https://www.civaccount.co.uk/council/${slug}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://www.civaccount.co.uk',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: displayName,
            item: `https://www.civaccount.co.uk/council/${slug}`,
          },
        ],
      },
      buildDatasetSchema({
        url: `/council/${slug}`,
        name: `${displayName} Budget & Council Tax Data ${area?.year ?? PREVIOUS_TAX_YEAR}`,
        description: `Budget breakdown, council tax bands, and spending data for ${displayName}`,
        areaName: council.name,
        temporalCoverage: area?.year === '2026-27' ? '2026/2027' : '2025/2026',
        ...(council.detailed?.last_verified && {
          dateModified: council.detailed.last_verified,
        }),
        ...(area && {
          variableMeasured: {
            '@type': 'PropertyValue',
            name: `Band D Council Tax (${area.year})`,
            value: area.value,
            unitCode: 'GBP',
          },
        }),
        distribution: [
          {
            '@type': 'DataDownload',
            encodingFormat: 'text/csv',
            contentUrl: 'https://www.civaccount.co.uk/api/v1/download?format=csv',
          },
          {
            '@type': 'DataDownload',
            encodingFormat: 'application/json',
            contentUrl: 'https://www.civaccount.co.uk/api/v1/download?format=json',
          },
        ],
      }),
      // FAQPage schema for AI/search visibility
      ...(faqs.length > 0 ? [buildFAQPageSchema(faqs, `/council/${slug}`)] : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      {children}
    </>
  );
}
