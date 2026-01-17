'use client';

import { useState } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PulsingDot } from '@/components/ui/pulsing-dot';
import { Landmark, Menu, X, BarChart3, Info, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useCouncil } from '@/context/CouncilContext';
import FeedbackModal from '@/components/FeatureRequestDialog';
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

  const openFeedback = () => {
    document.dispatchEvent(new CustomEvent('open-feedback'));
    closeMobileMenu();
  };

  // Consistent nav link styling - use fixed padding for uniform hover background size
  const navLinkClass = "h-9 px-4 inline-flex items-center justify-center text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer";
  const mobileNavLinkClass = "h-11 px-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors cursor-pointer";

  return (
    <>
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-3 sm:px-6 max-w-7xl">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Logo and version */}
            <div className="flex items-center gap-4 shrink-0">
              <Link href="/" onClick={handleLogoClick} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                  <Landmark className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold leading-tight">CivAccount</h1>
              </Link>
              <Link href="/updates" className="hidden sm:flex items-center gap-2 cursor-pointer">
                <PulsingDot size="md" />
                <Badge variant="outline" className="text-sm cursor-pointer hover:bg-muted">
                  v1.4
                </Badge>
              </Link>
            </div>

            {/* Right: Search + Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              <SearchCommand />
              <nav className="flex items-center gap-1 ml-2">
                <Link href="/insights" className={navLinkClass}>
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  Insights
                </Link>
                <Link href="/about" className={navLinkClass}>
                  <Info className="h-4 w-4 mr-1.5" />
                  About
                </Link>
                <button type="button" onClick={openFeedback} className={navLinkClass}>
                  <MessageSquare className="h-4 w-4 mr-1.5" />
                  Feedback
                </button>
                <ThemeToggle />
              </nav>
            </div>

            {/* Right: Mobile Navigation */}
            <div className="flex sm:hidden items-center gap-1">
              <SearchCommand mobileOnly size="lg" />
              <ThemeToggle size="lg" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-11 w-11"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
                  className={mobileNavLinkClass}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Insights
                </Link>
                <Link
                  href="/about"
                  onClick={closeMobileMenu}
                  className={mobileNavLinkClass}
                >
                  <Info className="h-4 w-4 mr-2" />
                  About
                </Link>
                <Link
                  href="/updates"
                  onClick={closeMobileMenu}
                  className="h-11 px-3 inline-flex items-center justify-between text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors cursor-pointer"
                >
                  <span>Updates</span>
                  <div className="flex items-center gap-2">
                    <PulsingDot size="md" />
                    <Badge variant="outline" className="text-sm">v1.4</Badge>
                  </div>
                </Link>
                <button type="button" onClick={openFeedback} className={mobileNavLinkClass}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Feedback
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Feedback Modal - rendered once, controlled via custom event */}
      <FeedbackModal />
    </>
  );
}
