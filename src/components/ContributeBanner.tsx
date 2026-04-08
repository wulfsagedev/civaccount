'use client';

import { DonateButton } from '@/components/DonateButton';
import { Heart } from 'lucide-react';

export default function ContributeBanner() {
  return (
    <section className="card-elevated p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--share-accent-bg)' }}>
          <Heart className="h-5 w-5" style={{ color: 'var(--share-accent)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="type-title-3 mb-1">Built by one person</p>
          <p className="type-body-sm text-muted-foreground mb-4">
            CivAccount is free and independent. If you find it useful, your support keeps it going.
          </p>
          <DonateButton />
        </div>
      </div>
    </section>
  );
}
