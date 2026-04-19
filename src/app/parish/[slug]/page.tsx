import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PageContainer } from '@/components/ui/page-container';
import { getParishBySlug, getAllParishSlugs } from '@/data/parishes';
import Link from 'next/link';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllParishSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const parish = getParishBySlug(slug);
  if (!parish) return { title: 'Parish not found' };
  return {
    title: `${parish.name} ${parish.type_name} — precept, accounts & councillors`,
    description: `${parish.name} ${parish.type_name} in ${parish.billing_authority.name} — parish precept, annual accounts, councillors and clerk contact.`,
    alternates: { canonical: `/parish/${parish.slug}` },
  };
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function ParishPage({ params }: Props) {
  const { slug } = await params;
  const parish = getParishBySlug(slug);
  if (!parish) notFound();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <PageContainer className="py-8 sm:py-12">
        <div className="mb-8">
          <p className="type-caption text-muted-foreground mb-2">
            <Link href="/parish" className="underline">Parish councils</Link>
            {' · '}Billing authority:{' '}
            <Link
              href={`/council/${parish.billing_authority.slug}`}
              className="underline"
            >
              {parish.billing_authority.name}
            </Link>
          </p>
          <h1 className="type-title-1 font-semibold">
            {parish.name} {parish.type_name}
          </h1>
        </div>

        {/* Precept */}
        {parish.precept?.band_d_2025 && (
          <section className="card-elevated p-6 mb-6">
            <p className="type-caption text-muted-foreground mb-1">
              Parish precept on your Band D bill
            </p>
            <p className="type-display font-semibold tabular-nums">
              {formatCurrency(parish.precept.band_d_2025)}
            </p>
            <p className="type-caption text-muted-foreground mt-1">
              {parish.precept.year}
            </p>
            {parish.precept_summary && (
              <p className="type-body-sm text-muted-foreground mt-4">
                {parish.precept_summary}
              </p>
            )}
          </section>
        )}

        {/* Accounts */}
        {parish.annual_accounts && (
          <section className="card-elevated p-6 mb-6">
            <h2 className="type-title-2 mb-4">Annual accounts {parish.annual_accounts.year}</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="type-caption text-muted-foreground">Income</dt>
                <dd className="type-metric font-semibold tabular-nums">
                  {formatCurrency(parish.annual_accounts.income)}
                </dd>
              </div>
              <div>
                <dt className="type-caption text-muted-foreground">Expenditure</dt>
                <dd className="type-metric font-semibold tabular-nums">
                  {formatCurrency(parish.annual_accounts.expenditure)}
                </dd>
              </div>
              <div>
                <dt className="type-caption text-muted-foreground">Reserves</dt>
                <dd className="type-metric font-semibold tabular-nums">
                  {formatCurrency(parish.annual_accounts.reserves)}
                </dd>
              </div>
              {parish.annual_accounts.staff_costs && (
                <div>
                  <dt className="type-caption text-muted-foreground">Staff costs</dt>
                  <dd className="type-metric font-semibold tabular-nums">
                    {formatCurrency(parish.annual_accounts.staff_costs)}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {/* Contacts */}
        {(parish.leader || parish.clerk || parish.website) && (
          <section className="card-elevated p-6">
            <h2 className="type-title-2 mb-4">Contact</h2>
            <dl className="space-y-3">
              {parish.leader && (
                <div>
                  <dt className="type-caption text-muted-foreground">Chair / Mayor</dt>
                  <dd className="type-body font-medium">{parish.leader}</dd>
                </div>
              )}
              {parish.clerk && (
                <div>
                  <dt className="type-caption text-muted-foreground">Clerk</dt>
                  <dd className="type-body font-medium">{parish.clerk}</dd>
                </div>
              )}
              {parish.website && (
                <div>
                  <dt className="type-caption text-muted-foreground">Website</dt>
                  <dd>
                    <a
                      href={parish.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="type-body underline"
                    >
                      {parish.website.replace(/^https?:\/\//, '')}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>
        )}
      </PageContainer>

      <Footer />
    </div>
  );
}
