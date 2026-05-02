import type { Metadata } from 'next';
import { getCouncilBySlug, getAllCouncilSlugs, getCouncilDisplayName, getAverageBandDByType, formatCurrency, formatBudget, getCouncilPopulation, toSentenceTypeName, getTotalBandD } from '@/data/councils';
import { buildFAQPageSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';


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
      title: 'Council Not Found',
    };
  }

  const displayName = getCouncilDisplayName(council);
  const bandD = council.council_tax?.band_d_2025;
  const totalServiceK = council.budget?.total_service ?? null;
  const ceoSalary = council.detailed?.chief_executive_salary ?? null;

  // Build a punchy, keyword-dense, fact-first description (≤160 chars).
  // Compact form: "<Council> Tax 2025-26 — Band D £X, total budget £Ym, CEO £Z. All from .gov.uk."
  // The .gov.uk trust signal at the end lifts CTR for AI-search results.
  const facts: string[] = [];
  if (bandD) facts.push(`Band D £${bandD.toLocaleString('en-GB')}`);
  if (totalServiceK && totalServiceK > 0) {
    const m = totalServiceK / 1000;
    facts.push(`budget ${m >= 1000 ? `£${(m / 1000).toFixed(1)}bn` : `£${m.toFixed(0)}m`}`);
  }
  if (ceoSalary && ceoSalary > 0) {
    facts.push(`CEO £${Math.round(ceoSalary / 1000)}k`);
  }
  const factClause = facts.length > 0 ? ` — ${facts.join(', ')}.` : '.';
  const punchyDescription =
    `${displayName} council tax and spending 2025-26${factClause} Every figure verbatim from .gov.uk publications.`;

  // Title: keyword-front-loaded ("Council Tax 2025-26"), council second.
  // Falls inside Google's 60-char display limit for typical council names.
  const punchyTitle = `${displayName} Council Tax 2025-26 & Budget Breakdown`;

  return {
    title: punchyTitle,
    description: punchyDescription,
    alternates: {
      canonical: `/council/${slug}`,
    },
    openGraph: {
      title: `${displayName} — Council Tax 2025-26 & Budget`,
      description: punchyDescription,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: punchyTitle,
      description: punchyDescription,
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

  const totalBill = getTotalBandD(council);
  if (totalBill && bandD) {
    const pct = Math.round((bandD / totalBill) * 100);
    const isSoleAuthority = pct >= 100 || (detailed?.precepts?.length ?? 0) < 2;
    faqs.push({
      question: `What percentage of my bill goes to ${council.name}?`,
      answer: isSoleAuthority
        ? `All of your council tax (${formatCurrency(bandD, { decimals: 2 })}) goes to ${council.name}.`
        : `${pct}% of your total bill (${formatCurrency(bandD, { decimals: 2 })} out of ${formatCurrency(totalBill, { decimals: 2 })}).`,
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

  // Use sentence-form that preserves proper nouns ("London borough", not "london borough").
  const typeNameSentence = toSentenceTypeName(typeName);
  const narrativeParts: string[] = [];
  narrativeParts.push(`${displayName} is a ${typeNameSentence}${population ? ` serving ${population.toLocaleString('en-GB')} residents` : ''}.`);

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
          ...(population && { populationServed: population }),
        },
        ...(detailed?.website && { url: detailed.website }),
        // Chief executive & council leader as named members. Adds entity-rich
        // content to AI-search Knowledge Panel; lets Google connect a person
        // search ("Paul Brewer Adur") back to this council page.
        ...(detailed?.chief_executive || detailed?.council_leader ? {
          member: [
            ...(detailed?.chief_executive ? [{
              '@type': 'Person',
              name: detailed.chief_executive,
              jobTitle: 'Chief Executive',
              worksFor: { '@id': `https://www.civaccount.co.uk/council/${slug}#organization` },
            }] : []),
            ...(detailed?.council_leader ? [{
              '@type': 'Person',
              name: detailed.council_leader,
              jobTitle: 'Leader of the Council',
              worksFor: { '@id': `https://www.civaccount.co.uk/council/${slug}#organization` },
            }] : []),
            // Cabinet members — each rendered as a Person with their portfolio
            // as jobTitle. Powers Person ↔ Organization knowledge-graph links.
            ...(detailed?.cabinet?.map((m) => ({
              '@type': 'Person',
              name: m.name,
              jobTitle: m.portfolio || m.role,
              worksFor: { '@id': `https://www.civaccount.co.uk/council/${slug}#organization` },
              ...(m.party && { affiliation: { '@type': 'PoliticalParty', name: m.party } }),
            })) ?? []),
          ],
        } : {}),
        // Parent organization — for districts, the county council (residents
        // also pay county tax). Helps two-tier-area users navigate up.
        ...((council.type === 'SD' && detailed?.precepts) ? (() => {
          const county = detailed.precepts.find((p) =>
            p.authority.toLowerCase().includes('county council') &&
            !p.authority.toLowerCase().includes(council.name.toLowerCase()),
          );
          if (!county) return {};
          return {
            parentOrganization: {
              '@type': 'GovernmentOrganization',
              name: county.authority,
            },
          };
        })() : {}),
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
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      {children}
    </>
  );
}
