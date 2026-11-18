import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Where Stripe sends someone who leaves the payment page without paying.
// Before 18 Nov 2026 they landed on the homepage with no word about whether
// they had been charged (CA-B13).
export const metadata: Metadata = {
  title: 'No payment taken',
  description: 'You left the payment page. No money was taken.',
  robots: { index: false, follow: true },
};

export default function DonateCancelledPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-12 sm:px-6 max-w-md text-center">
          <h1 className="type-title-1 font-semibold mb-4">No payment taken</h1>

          <p className="type-body text-muted-foreground mb-8">
            You left the payment page, so no money was taken. You can give another time if you like.
          </p>

          <Link href="/">
            <Button className="gap-2 cursor-pointer">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to CivAccount
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
