import { Badge } from "@/components/ui/badge";
import { Landmark } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PageContainer } from '@/components/ui/page-container';
import { PARISHES } from '@/data/parishes';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import { serializeJsonLd } from '@/lib/safe-json-ld';

export const metadata: Metadata = {
  title: 'Parish & Town Councils — The Missing Tier',
  description:
    'England has around 10,000 parish and town councils — the tier below district and unitary. CivAccount is building coverage from AGAR returns, starting with one pilot county.',
  alternates: { canonical: '/parish' },
  openGraph: {
    title: 'Parish & Town Councils — The Missing Tier',
    description: 'England has around 10,000 parish and town councils — the tier below district and unitary. CivAccount is building coverage from AGAR returns.',
    type: 'website',
    siteName: 'CivAccount',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parish & Town Councils — The Missing Tier',
    description: 'England has around 10,000 parish and town councils — the tier below district and unitary. CivAccount is building coverage.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    buildWebPageSchema(
      'Parish & Town Councils — The Missing Tier',
      'CivAccount coverage plan for England\'s ~10,000 parish and town councils: AGAR-sourced precept, income, expenditure, reserves and staff costs per parish.',
      '/parish',
      { type: 'CollectionPage' },
    ),
    buildBreadcrumbSchema(
      [{ name: 'Home', url: '/' }, { name: 'Parish councils' }],
      '/parish',
    ),
  ],
};

export default function ParishIndexPage() {
  const hasParishes = PARISHES.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <Header />

      <PageContainer className="py-8 sm:py-12">
        <div className="text-center mb-10 sm:mb-12">
          <Badge variant="outline" className="mb-4">Parish councils</Badge>
          <h1 className="type-title-1 font-semibold mb-4">The missing tier</h1>
          <p className="type-body-lg text-muted-foreground max-w-2xl mx-auto">
            England has around 10,000 parish and town councils — a whole tier of local government
            almost nobody covers. Here&apos;s where CivAccount is expanding next.
          </p>
        </div>

        {!hasParishes && (
          <section className="card-elevated p-6 sm:p-8 mb-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Landmark className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <div>
                <h2 className="type-title-2 mb-1">Pilot coverage starts soon</h2>
                <p className="type-body-sm text-muted-foreground">
                  We&apos;re building the data layer for this now, starting with one county as a
                  proof. If you want to help, or you&apos;re a parish clerk who&apos;d like your
                  council included, get in touch via{' '}
                  <Link href="/about" className="underline">the about page</Link>.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
                <p className="type-body-sm font-semibold mb-1">Why this matters</p>
                <p className="type-caption text-muted-foreground">
                  Parish precepts sit on your council tax bill but almost no one publishes what
                  they fund. Income, expenditure and reserves are reported annually in AGAR returns
                  but scattered across 10,000 websites. Bringing them into one place is pure public
                  benefit.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
                <p className="type-body-sm font-semibold mb-1">What we&apos;ll show per parish</p>
                <p className="type-caption text-muted-foreground">
                  Precept on your bill, who chairs it, how many councillors, annual income and
                  expenditure, reserves, staff costs, and a link to their accounts. Same
                  plain-English structure as the main council pages.
                </p>
              </div>
            </div>
          </section>
        )}

        {hasParishes && (
          <div className="card-elevated overflow-hidden">
            {PARISHES.map((p, i) => (
              <Link
                key={p.slug}
                href={`/parish/${p.slug}`}
                className={`block p-4 sm:p-5 hover:bg-muted/30 transition-colors cursor-pointer ${i > 0 ? 'border-t border-border/40' : ''}`}
              >
                <p className="type-body-sm font-semibold">{p.name} {p.type_name}</p>
                <p className="type-caption text-muted-foreground">
                  Billing authority: {p.billing_authority.name}
                </p>
              </Link>
            ))}
          </div>
        )}
      </PageContainer>

      <Footer />
    </div>
  );
}
