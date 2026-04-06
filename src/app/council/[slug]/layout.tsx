import type { Metadata } from 'next';
import { getCouncilBySlug, getAllCouncilSlugs, getCouncilDisplayName, getAverageBandDByType, formatCurrency, formatBudget, getCouncilPopulation } from '@/data/councils';
import { buildFAQPageSchema } from '@/lib/structured-data';


interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateStaticParams() {
  const slugs = getAllCouncilSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const council = getCouncilBySlug(slug);

  if (!council) {
    return {
      title: 'Council Not Found | CivAccount',
    };
  }

  const displayName = getCouncilDisplayName(council);
  const bandD = council.council_tax?.band_d_2025;
  const bandDText = bandD ? ` - Band D £${bandD.toLocaleString('en-GB')}` : '';

  return {
    title: `${displayName} Budget & Council Tax 2025-26 | CivAccount`,
    description: `See how ${displayName} spends your council tax${bandDText}. Budget breakdown, service spending, and tax band information for 2025-26.`,
    alternates: {
      canonical: `/council/${slug}`,
    },
    openGraph: {
      title: `${displayName} Council Tax & Budget`,
      description: `Council tax and budget breakdown for ${displayName} 2025-26`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} Council Tax & Budget 2025-26`,
      description: `See how ${displayName} spends your council tax${bandDText}. Budget breakdown and spending insights.`,
    },
  };
}

// Service category mapping (matches UnifiedDashboard)
const SERVICE_MAP = [
  { key: 'environmental', name: 'Environment & Streets' },
  { key: 'planning', name: 'Planning' },
  { key: 'central_services', name: 'Council Services' },
  { key: 'cultural', name: 'Leisure & Culture' },
  { key: 'housing', name: 'Housing' },
  { key: 'adult_social_care', name: 'Adult Social Care' },
  { key: 'childrens_social_care', name: "Children's Services" },
  { key: 'education', name: 'Education' },
  { key: 'transport', name: 'Roads & Transport' },
  { key: 'public_health', name: 'Public Health' },
];

export default async function CouncilLayout({ params, children }: Props) {
  const { slug } = await params;
  const council = getCouncilBySlug(slug);

  if (!council) {
    return children;
  }

  const displayName = getCouncilDisplayName(council);
  const bandD = council.council_tax?.band_d_2025;
  const bandD2024 = council.council_tax?.band_d_2024;
  const typeName = council.type_name || 'Council';
  const detailed = council.detailed;
  const budget = council.budget;

  // Compute FAQ data server-side (mirrors UnifiedDashboard logic)
  const typeAverage = getAverageBandDByType(council.type);
  const vsAverage = bandD && typeAverage ? bandD - typeAverage : null;
  const taxChange = bandD && bandD2024 ? ((bandD - bandD2024) / bandD2024) * 100 : null;
  const taxChangeAmount = bandD && bandD2024 ? bandD - bandD2024 : null;

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

  if (detailed?.total_band_d && bandD) {
    const pct = ((bandD / detailed.total_band_d) * 100).toFixed(0);
    faqs.push({
      question: `What percentage of my bill goes to ${council.name}?`,
      answer: `${pct}% of your total bill (${formatCurrency(bandD, { decimals: 2 })} out of ${formatCurrency(detailed.total_band_d, { decimals: 2 })}).`,
    });
  }

  if (spendingCategories.length > 0) {
    faqs.push({
      question: 'What does most of my money go towards?',
      answer: `${spendingCategories[0].name} takes the biggest share at ${spendingCategories[0].percentage.toFixed(0)}% of the budget.`,
    });
  }

  if (vsAverage !== null && bandD) {
    const diff = formatCurrency(Math.abs(vsAverage), { decimals: 2 });
    const comparison = vsAverage > 0
      ? `This council charges ${diff} more than the average ${typeName.toLowerCase()}.`
      : vsAverage < 0
        ? `This council charges ${diff} less than the average ${typeName.toLowerCase()}.`
        : `This council charges about the same as the average ${typeName.toLowerCase()}.`;
    faqs.push({
      question: 'Is this council expensive compared to others?',
      answer: comparison,
    });
  }

  if (taxChange !== null && taxChangeAmount !== null) {
    const changeDesc = taxChangeAmount > 0
      ? `Your bill went up by ${formatCurrency(taxChangeAmount, { decimals: 2 })} (${taxChange.toFixed(1)}%) from last year.`
      : taxChangeAmount < 0
        ? `Your bill went down by ${formatCurrency(Math.abs(taxChangeAmount), { decimals: 2 })} (${Math.abs(taxChange).toFixed(1)}%) from last year.`
        : 'Your bill stayed the same as last year.';
    faqs.push({
      question: 'How much has my bill gone up this year?',
      answer: changeDesc,
    });
  }

  // Build narrative summary segments
  const population = getCouncilPopulation(council.name);
  const totalBudget = budget?.total_service ? formatBudget(budget.total_service) : null;
  const biggestCategory = spendingCategories.length > 0 ? spendingCategories[0] : null;

  const narrativeParts: string[] = [];
  narrativeParts.push(`${displayName} is a ${typeName.toLowerCase()}${population ? ` serving ${population.toLocaleString('en-GB')} residents` : ''}.`);

  if (bandD) {
    let taxSentence = `In 2025-26, Band D council tax is ${formatCurrency(bandD, { decimals: 2 })}`;
    if (taxChange !== null) {
      const direction = taxChange > 0 ? 'more' : 'less';
      taxSentence += ` — ${Math.abs(taxChange).toFixed(1)}% ${direction} than last year`;
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
      {
        '@type': 'Dataset',
        '@id': `https://www.civaccount.co.uk/council/${slug}#dataset`,
        name: `${displayName} Budget & Council Tax Data 2025-26`,
        description: `Budget breakdown, council tax bands, and spending data for ${displayName}`,
        license: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
        temporalCoverage: '2025/2026',
        spatialCoverage: {
          '@type': 'AdministrativeArea',
          name: displayName,
        },
        publisher: {
          '@type': 'Organization',
          '@id': 'https://www.civaccount.co.uk/#organization',
          name: 'CivAccount',
        },
        ...(bandD && {
          variableMeasured: {
            '@type': 'PropertyValue',
            name: 'Band D Council Tax',
            value: bandD,
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
      },
      // FAQPage schema for AI/search visibility
      ...(faqs.length > 0 ? [buildFAQPageSchema(faqs, `/council/${slug}`)] : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
