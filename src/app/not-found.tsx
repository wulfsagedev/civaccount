'use client';

import Link from 'next/link';
import { Search, Home, MapPin, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState('');

  // Open search overlay on enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // Dispatch custom event to open search with query
      document.dispatchEvent(new CustomEvent('open-search', { detail: { query: searchQuery } }));
    }
  };

  // Allow F key to open search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('open-search'));
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          {/* 404 indicator */}
          <div className="mb-6">
            <span className="type-display text-muted-foreground/30">404</span>
          </div>

          {/* Main message */}
          <h1 className="type-title-1 mb-3">Page not found</h1>
          <p className="type-body text-muted-foreground mb-8">
            Sorry, we could not find the page you are looking for. It may have been moved or does not exist.
          </p>

          {/* Search box */}
          <div className="mb-8">
            <label htmlFor="search-council" className="type-body-sm text-muted-foreground mb-2 block">
              Looking for a council?
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <input
                id="search-council"
                type="text"
                placeholder="Search for your council..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/50 type-body"
              />
            </div>
            <p className="type-caption text-muted-foreground mt-2">
              Press Enter to search or <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">F</kbd> to open search
            </p>
          </div>

          {/* Helpful links */}
          <div className="space-y-3">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors type-body font-medium"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Go to homepage
            </Link>

            <Link
              href="/insights"
              className="flex items-center justify-center gap-2 h-11 px-6 rounded-lg border border-border hover:bg-muted transition-colors type-body font-medium"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              View national insights
            </Link>

            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 h-11 px-6 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors type-body font-medium w-full cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Go back
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
