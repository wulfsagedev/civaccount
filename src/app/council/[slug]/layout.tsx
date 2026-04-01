import type { Metadata } from 'next';
import { getCouncilBySlug, getAllCouncilSlugs, getCouncilDisplayName } from '@/data/councils';

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

export default async function CouncilLayout({ params, children }: Props) {
  const { slug } = await params;
  const council = getCouncilBySlug(slug);

  if (!council) {
    return children;
  }

  const displayName = getCouncilDisplayName(council);
  const bandD = council.council_tax?.band_d_2025;
  const typeName = council.type_name || 'Council';

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
        ...(council.detailed?.website && { url: council.detailed.website }),
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
      },
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
