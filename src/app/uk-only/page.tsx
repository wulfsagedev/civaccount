import Link from 'next/link';
import { Home, Globe } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'UK Residents Only — CivAccount',
  description: 'CivAccount Town Hall is for UK residents. You can still browse council data.',
};

export default function UKOnlyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Globe className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
          </div>

          <h1 className="type-title-1 mb-3">UK residents only</h1>
          <p className="type-body text-muted-foreground mb-4">
            Voting, commenting, and creating proposals on CivAccount is for people who live in England and pay council tax.
          </p>
          <p className="type-body-sm text-muted-foreground mb-8">
            You can still browse all council data, budgets, and comparisons without an account.
          </p>

          <div className="space-y-3">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors type-body font-medium"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Browse council data
            </Link>
          </div>

          <p className="type-caption text-muted-foreground/50 mt-8">
            You are seeing this because we detected your location as outside the UK. If you are using a VPN, try disconnecting it and refreshing the page.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
