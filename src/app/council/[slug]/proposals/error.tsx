'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ProposalsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Town Hall error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <span className="type-display text-muted-foreground/30">Error</span>
          </div>

          <h1 className="type-title-1 mb-3">Could not load Town Hall</h1>
          <p className="type-body text-muted-foreground mb-8">
            Something went wrong loading proposals. This is usually a temporary issue.
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
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 h-11 px-6 rounded-lg border border-border hover:bg-muted transition-colors type-body font-medium w-full cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to council
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
