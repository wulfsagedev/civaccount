'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getCouncilBySlug, getCouncilDisplayName } from '@/data/councils';
import ProposalForm from '@/components/proposals/ProposalForm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CARD_STYLES } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewProposalPage() {
  const params = useParams();
  const slug = params.slug as string;
  const council = useMemo(() => getCouncilBySlug(slug), [slug]);

  if (!council) {
    return null;
  }

  const displayName = getCouncilDisplayName(council);

  return (
    <>
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Back link */}
        <Link
          href={`/council/${slug}/proposals`}
          className="inline-flex items-center gap-2 type-body-sm text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to proposals
        </Link>

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
