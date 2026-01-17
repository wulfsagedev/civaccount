'use client';

import { useState } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Landmark, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useCouncil } from '@/context/CouncilContext';
import FeatureRequestDialog from '@/components/FeatureRequestDialog';
import SearchCommand from '@/components/SearchCommand';

export default function Header() {
  const { setSelectedCouncil } = useCouncil();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogoClick = () => {
    setSelectedCouncil(null);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Consistent nav link styling
  const navLinkClass = "h-9 px-3 inline-flex items-center justify-center text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors cursor-pointer";

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-3 sm:px-6 max-w-7xl">
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

          {/* Right: Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-1 shrink-0">
            <Link href="/insights" className={navLinkClass}>
              Insights
            </Link>
            <Link href="/about" className={navLinkClass}>
              About
            </Link>
            <FeatureRequestDialog className={navLinkClass} />
            <ThemeToggle />
          </nav>

          {/* Right: Mobile Navigation */}
          <div className="flex sm:hidden items-center gap-2">
            <SearchCommand mobileOnly />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-9 w-9"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-4 pt-4 border-t">
            <nav className="flex flex-col gap-1">
              <Link
                href="/insights"
                onClick={closeMobileMenu}
                className="h-11 px-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors cursor-pointer"
              >
                Insights
              </Link>
              <Link
                href="/about"
                onClick={closeMobileMenu}
                className="h-11 px-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors cursor-pointer"
              >
                About
              </Link>
              <Link
                href="/updates"
                onClick={closeMobileMenu}
                className="h-11 px-3 inline-flex items-center justify-between text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors cursor-pointer"
              >
                <span>Updates</span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <Badge variant="outline" className="text-xs">v1.2</Badge>
                </div>
              </Link>
              <FeatureRequestDialog variant="mobile" />
              <div className="h-11 px-3 inline-flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
