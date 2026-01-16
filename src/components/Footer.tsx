'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8 sm:px-6 max-w-7xl">
        <div className="space-y-6">
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/updates" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
                v1.2
              </Badge>
            </Link>
            <a
              href="https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              Data Sources
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Disclaimer */}
          <div className="text-center text-sm text-muted-foreground border-t pt-6">
            <p>
              This is not an official government website. Council tax figures shown are for each council only.
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              <strong>CivAccount</strong> · Data from official UK government sources · Updated January 2025
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
