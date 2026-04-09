'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, ArrowLeft, RefreshCw, Search } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CouncilError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Council page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center" role="alert">
          <div className="mb-6">
            <span className="type-display text-muted-foreground/30">Error</span>
          </div>

          <h1 className="type-title-1 mb-3">Could not load council data</h1>
          <p className="type-body text-muted-foreground mb-8">
            Something went wrong loading this council. The data might be temporarily unavailable.
          </p>

          <div className="space-y-3">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors type-body font-medium w-full cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>

            <button
              onClick={() => document.dispatchEvent(new CustomEvent('open-search'))}
              className="flex items-center justify-center gap-2 h-11 px-6 rounded-lg border border-border hover:bg-muted transition-colors type-body font-medium w-full cursor-pointer"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search for a council
            </button>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 h-11 px-6 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors type-body font-medium"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Go to homepage
            </Link>

            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 h-11 px-6 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors type-body font-medium w-full cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Go back
            </button>
          </div>

          {error.digest && (
            <p className="type-caption text-muted-foreground/50 mt-8">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
