'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getCouncilBySlug, getCouncilDisplayName } from '@/data/councils';
import ProposalForm from '@/components/proposals/ProposalForm';
import Breadcrumb from '@/components/proposals/Breadcrumb';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { CARD_STYLES } from '@/lib/utils';
import Link from 'next/link';

export default function NewProposalPage() {
  const params = useParams();
  const slug = params.slug as string;
  const council = useMemo(() => getCouncilBySlug(slug), [slug]);

  if (!council) {
    return (
      <>
        <Header />
        <main id="main-content" className="container mx-auto px-4 py-12 max-w-3xl text-center">
          <p className="type-display text-muted-foreground/30 mb-4">404</p>
          <h1 className="type-title-1 mb-2">Council not found</h1>
          <p className="type-body-sm text-muted-foreground mb-6">
            We could not find a council matching this address.
          </p>
          <Link href="/">
            <Button className="cursor-pointer">Go to homepage</Button>
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const displayName = getCouncilDisplayName(council);

  return (
    <>
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: displayName, href: `/council/${slug}` },
          { label: 'Town Hall', href: `/council/${slug}/proposals` },
          { label: 'New proposal' },
        ]} />

        <div className={`${CARD_STYLES} p-5 sm:p-8`}>
          <h1 className="type-title-1 mb-1">New proposal</h1>
          <p className="type-body-sm text-muted-foreground mb-8">
            Suggest how {displayName} could spend your money better.
          </p>

          <ProposalForm council={council} councilSlug={slug} />
        </div>
      </main>
      <Footer />
    </>
  );
}
