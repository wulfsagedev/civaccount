'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-3 py-6 sm:px-6 max-w-7xl">
        <div className="space-y-4">
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-foreground">
              About
            </Link>
            <Link href="/updates" className="text-muted-foreground hover:text-foreground">
              Updates (v1.2)
            </Link>
            <a
              href="https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              Data Sources
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Disclaimer - Simple black/white */}
          <div className="text-center text-xs text-muted-foreground border-t pt-4">
            <p className="mb-1">
              This is not an official government website. CivAccount uses publicly available UK government data.
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center text-xs text-muted-foreground">
            <p>
              <strong>CivAccount</strong> - UK Council Budget Dashboard
            </p>
            <p className="mt-1">
              Data from official UK government sources. Last updated January 2025.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
