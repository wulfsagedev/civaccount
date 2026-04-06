'use client';

import { DonateButton } from '@/components/DonateButton';

export default function ContributeBanner() {
  return (
    <section className="card-elevated p-5 sm:p-6">
      <p className="type-title-3 mb-1">Built by one person</p>
      <p className="type-body-sm text-muted-foreground mb-4">
        CivAccount is free and independent. If you find it useful, your support keeps it going.
      </p>
      <DonateButton variant="header" />
    </section>
  );
}
