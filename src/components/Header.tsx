'use client';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Landmark } from 'lucide-react';
import Link from 'next/link';
import { useCouncil } from '@/context/CouncilContext';
import FeatureRequestDialog from '@/components/FeatureRequestDialog';
import SearchCommand from '@/components/SearchCommand';

export default function Header() {
  const { setSelectedCouncil } = useCouncil();

  const handleLogoClick = () => {
    setSelectedCouncil(null);
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 sm:px-6 max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo and version */}
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/" onClick={handleLogoClick} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                <Landmark className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold leading-tight">CivAccount</h1>
            </Link>
            <Link href="/updates" className="hidden sm:flex items-center gap-2 cursor-pointer">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
                v1.2
              </Badge>
            </Link>
          </div>

          {/* Center: Search (desktop) */}
          <div className="hidden sm:flex flex-1 justify-center max-w-md">
            <SearchCommand />
          </div>

          {/* Right: Navigation */}
          <nav className="flex items-center gap-2 shrink-0">
            <SearchCommand mobileOnly />
            <Link
              href="/insights"
              className="h-9 px-3 inline-flex items-center justify-center text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors cursor-pointer"
            >
              Insights
            </Link>
            <Link
              href="/about"
              className="h-9 px-3 inline-flex items-center justify-center text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors cursor-pointer"
            >
              About
            </Link>
            <FeatureRequestDialog />
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
