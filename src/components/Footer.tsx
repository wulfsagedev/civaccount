'use client';

import { ExternalLink, Landmark } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function Footer() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 max-w-7xl">
        {/* Main footer content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Landmark className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">CivAccount</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Making UK council budget data accessible and easy to understand for everyone.
            </p>
          </div>

          {/* Navigation Column */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Navigate</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/updates"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  Updates
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Data Column */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Data Sources</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  Council Tax Data
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  Revenue Data
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  Updated January 2025
                </span>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <span className="text-sm text-muted-foreground">
                  Not an official government site
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  Council portion figures only
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} CivAccount. Data from official UK government sources.
            </p>
            <Link href="/updates" className="inline-flex items-center gap-1.5 cursor-pointer">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </span>
              <Badge variant="outline" className="text-sm cursor-pointer hover:bg-muted">
                v1.2
              </Badge>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
