'use client';

import { Landmark } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { PulsingDot } from '@/components/ui/pulsing-dot';

export default function Footer() {
  return (
    <footer className="border-t bg-muted/20" aria-label="Site footer">
      <div className="container mx-auto px-4 py-6 sm:px-6 max-w-5xl">
        {/* Brand + links */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                <Landmark className="h-3.5 w-3.5 text-primary-foreground" aria-hidden="true" />
              </div>
              <span className="font-semibold">CivAccount</span>
            </Link>
            <Link href="/updates" className="inline-flex items-center gap-1.5 cursor-pointer">
              <PulsingDot />
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">v3.0</Badge>
            </Link>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 type-body-sm">
            <Link href="/townhall" className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer min-h-[44px] inline-flex items-center">Town Hall</Link>
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer min-h-[44px] inline-flex items-center">About</Link>
            <Link href="/methodology" className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer min-h-[44px] inline-flex items-center">Methodology</Link>
            <Link href="/updates" className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer min-h-[44px] inline-flex items-center">Updates</Link>
            <button
              type="button"
              onClick={() => document.dispatchEvent(new CustomEvent('open-feedback'))}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer min-h-[44px] inline-flex items-center"
            >
              Feedback
            </button>
            <a
              href="https://github.com/wulfsagedev/civaccount"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer min-h-[44px] inline-flex items-center"
            >
              GitHub
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          </div>
        </div>

        {/* Notice + legal */}
        <div className="pt-4 border-t border-border/50 space-y-3">
          <p className="type-caption text-muted-foreground/70">
            Independent project. Not affiliated with any UK council or government body.
            Contains public sector information licensed under the{' '}
            <a
              href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Open Government Licence v3.0
              <span className="sr-only"> (opens in new tab)</span>
            </a>.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 type-caption text-muted-foreground/70">
            <p>
              Made by{' '}
              <a
                href="https://owenfisher.co"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Owen
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-foreground transition-colors cursor-pointer min-h-[44px] inline-flex items-center">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors cursor-pointer min-h-[44px] inline-flex items-center">Terms</Link>
              <Link href="/license" className="hover:text-foreground transition-colors cursor-pointer min-h-[44px] inline-flex items-center">License</Link>
              <Link href="/accessibility" className="hover:text-foreground transition-colors cursor-pointer min-h-[44px] inline-flex items-center">Accessibility</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
