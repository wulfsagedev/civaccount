'use client';

import { useState, useEffect, useCallback } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PulsingDot } from '@/components/ui/pulsing-dot';
import { Landmark, Menu, X, BarChart3, Info, MessageSquare, Search } from 'lucide-react';
import Link from 'next/link';
import { useCouncil } from '@/context/CouncilContext';
import { getCouncilDisplayName } from '@/data/councils';
import FeedbackModal from '@/components/FeatureRequestDialog';
// import DonateModal from '@/components/DonateModal';
import SearchCommand from '@/components/SearchCommand';
import { cn } from '@/lib/utils';

export default function Header() {
  const { selectedCouncil, setSelectedCouncil } = useCouncil();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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

  // const openDonate = () => {
  //   document.dispatchEvent(new CustomEvent('open-donate'));
  //   closeMobileMenu();
  // };

  // Simple threshold-based scroll detection
  // Per NN/Group: avoid complex animations, use simple state changes
  const handleScroll = useCallback(() => {
    const scrolled = window.scrollY > 50;
    setIsScrolled(scrolled);
    // Close mobile menu when scrolling back to top
    if (!scrolled) {
      setMobileMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Listen for close-mobile-menu event (dispatched when search opens)
  useEffect(() => {
    const handleCloseMobileMenu = () => setMobileMenuOpen(false);
    document.addEventListener('close-mobile-menu', handleCloseMobileMenu);
    return () => document.removeEventListener('close-mobile-menu', handleCloseMobileMenu);
  }, []);

  // Nav item styling
  const navLinkClass = 'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium h-9 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer';
  const mobileNavLinkClass = 'inline-flex items-center justify-start gap-2 whitespace-nowrap text-sm font-medium h-11 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer w-full';

  return (
    <>
      {/* Main header - always visible at top */}
      <header className="border-b bg-background relative z-40">
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
                  v1.4.2
                </Badge>
              </Link>
            </div>

            {/* Right: Search + Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              <SearchCommand />
              <nav className="flex items-center gap-1 ml-2">
                <Link href="/insights" className={navLinkClass}>
                  <BarChart3 className="h-4 w-4" />
                  Insights
                </Link>
                <Link href="/about" className={navLinkClass}>
                  <Info className="h-4 w-4" />
                  About
                </Link>
                <button type="button" onClick={openFeedback} className={navLinkClass}>
                  <MessageSquare className="h-4 w-4" />
                  Feedback
                </button>
                <ThemeToggle />
              </nav>
            </div>

            {/* Right: Mobile Navigation */}
            <div className="flex sm:hidden items-center gap-1">
              <SearchCommand />
              <ThemeToggle />
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
                <Link href="/insights" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                  <BarChart3 className="h-4 w-4" />
                  Insights
                </Link>
                <Link href="/about" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                  <Info className="h-4 w-4" />
                  About
                </Link>
                <Link href="/updates" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                  <PulsingDot size="md" />
                  Updates
                  <Badge variant="outline" className="text-sm ml-auto">v1.4.2</Badge>
                </Link>
                <button type="button" onClick={openFeedback} className={mobileNavLinkClass}>
                  <MessageSquare className="h-4 w-4" />
                  Feedback
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Floating compact nav - slides in from top when scrolled */}
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 pt-3',
          'transition-all duration-300 ease-out',
          isScrolled
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-full pointer-events-none'
        )}
      >
        <div className="mx-auto" style={{ maxWidth: '845px' }}>
          {/* Main pill nav */}
          <div className={cn(
            'flex items-center justify-between gap-3 px-4 py-2.5 bg-background/95 backdrop-blur-xl border border-border/40 shadow-lg',
            mobileMenuOpen && isScrolled ? 'rounded-t-2xl rounded-b-none border-b-0' : 'rounded-full'
          )}>
            {/* Left: Logo + Council name or version */}
            <div className="flex items-center gap-3 shrink-0 min-w-0">
              <Link
                href="/"
                onClick={handleLogoClick}
                className="flex items-center justify-center w-9 h-9 bg-primary rounded-full cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                aria-label="CivAccount home"
              >
                <Landmark className="h-5 w-5 text-primary-foreground" />
              </Link>

              {selectedCouncil ? (
                <p className="text-sm font-semibold truncate leading-tight hidden sm:block">
                  {getCouncilDisplayName(selectedCouncil)}
                </p>
              ) : (
                <Link href="/updates" className="hidden sm:flex items-center gap-2 cursor-pointer">
                  <PulsingDot size="md" />
                  <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
                    v1.4.2
                  </Badge>
                </Link>
              )}
            </div>

            {/* Right: Search + Theme toggle + Mobile menu */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Desktop: Full search button */}
              <div className="hidden sm:block">
                <SearchCommand forceDesktopStyle />
              </div>
              {/* Mobile: Icon-only search */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setMobileMenuOpen(false);
                  document.dispatchEvent(new CustomEvent('open-search'));
                }}
                className="sm:hidden h-9 w-9"
                aria-label="Search councils"
              >
                <Search className="h-5 w-5" />
              </Button>
              <ThemeToggle />
              {/* Mobile: Hamburger menu */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden h-9 w-9"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile menu dropdown - attached to sticky nav */}
          {mobileMenuOpen && isScrolled && (
            <div className="sm:hidden bg-background/95 backdrop-blur-xl border border-t-0 border-border/40 rounded-b-2xl shadow-lg p-3">
              <nav className="flex flex-col gap-1">
                <Link href="/insights" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                  <BarChart3 className="h-4 w-4" />
                  Insights
                </Link>
                <Link href="/about" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                  <Info className="h-4 w-4" />
                  About
                </Link>
                <Link href="/updates" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                  <PulsingDot size="md" />
                  Updates
                  <Badge variant="outline" className="text-sm ml-auto">v1.4.2</Badge>
                </Link>
                <button type="button" onClick={openFeedback} className={mobileNavLinkClass}>
                  <MessageSquare className="h-4 w-4" />
                  Feedback
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Fade overlay - softly hides content behind floating header */}
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-40 pointer-events-none',
          'transition-opacity duration-300 ease-out',
          isScrolled ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          height: '80px',
          background: `linear-gradient(to bottom,
            rgb(var(--background-rgb) / 0.95) 0%,
            rgb(var(--background-rgb) / 0.8) 50%,
            transparent 100%
          )`,
        }}
        aria-hidden="true"
      />

      {/* Modals */}
      <FeedbackModal />
      {/* <DonateModal /> */}
    </>
  );
}
