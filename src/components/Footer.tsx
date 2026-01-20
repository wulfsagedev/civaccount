'use client';

import { Landmark, History, Map, Accessibility, Github } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { PulsingDot } from '@/components/ui/pulsing-dot';
import { DonateButton } from '@/components/DonateButton';

export default function Footer() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="container mx-auto px-4 py-4 sm:px-6 max-w-7xl">
        {/* Main row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand + Version (side by side on mobile) */}
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                <Landmark className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-semibold">CivAccount</span>
            </Link>
            <Link href="/updates" className="inline-flex items-center gap-1.5 cursor-pointer sm:hidden">
              <PulsingDot />
              <Badge variant="outline" className="text-sm cursor-pointer hover:bg-muted">
                v1.6
              </Badge>
            </Link>
          </div>

          {/* Links row */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            <Link
              href="/updates"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <History className="h-3.5 w-3.5" />
              Updates
            </Link>
            <Link
              href="/roadmap"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Map className="h-3.5 w-3.5" />
              Roadmap
            </Link>
            <Link
              href="/accessibility"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Accessibility className="h-3.5 w-3.5" />
              Accessibility
            </Link>
            <a
              href="https://github.com/wulfsagedev/civaccount"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
            <DonateButton />
          </div>

          {/* Version (desktop only - mobile version is next to logo) */}
          <Link href="/updates" className="hidden sm:inline-flex items-center gap-1.5 cursor-pointer">
            <PulsingDot />
            <Badge variant="outline" className="text-sm cursor-pointer hover:bg-muted">
              v1.6
            </Badge>
          </Link>
        </div>

        {/* Legal row */}
        <div className="mt-3 pt-3 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>
Made by{' '}
            <a
              href="https://owenfisher.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline"
            >
              Owen
            </a>
            {' '}· Not affiliated with UK government
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors cursor-pointer">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors cursor-pointer">
              Terms
            </Link>
            <Link href="/license" className="hover:text-foreground transition-colors cursor-pointer">
              License
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
