'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8 sm:px-6 max-w-7xl">
        <div className="space-y-6">
          {/* Links - consistent baseline alignment */}
          <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm sm:text-base">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link
              href="/updates"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              v1.2
            </Link>
            <a
              href="https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
            >
              Data Sources
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </nav>

          {/* Disclaimer */}
          <div className="text-center text-sm sm:text-base text-muted-foreground border-t pt-6">
            <p>
              This is not an official government website. Council tax figures shown are for each council only.
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center text-sm sm:text-base text-muted-foreground">
            <p>
              <strong>CivAccount</strong> · Data from official UK government sources · Updated January 2025
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
