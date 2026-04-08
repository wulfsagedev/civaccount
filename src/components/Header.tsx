'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PulsingDot } from '@/components/ui/pulsing-dot';
import { Landmark, Menu, X, BarChart3, Info, MessageSquare, Search, Vote, User, LogOut, GitCompareArrows } from 'lucide-react';
import Link from 'next/link';
import { useCouncil } from '@/context/CouncilContext';
import { useAuth } from '@/context/AuthContext';
import { getCouncilDisplayName, getCouncilBySlug, getCouncilSlug } from '@/data/councils';
import FeedbackModal from '@/components/FeatureRequestDialog';
import SearchCommand from '@/components/SearchCommand';
import AccountModal from '@/components/AccountModal';
import { DonateButton } from '@/components/DonateButton';
import { cn } from '@/lib/utils';

// Static class strings — outside component to avoid recreation on every render
const NAV_LINK_BASE = 'inline-flex items-center justify-center gap-2 whitespace-nowrap type-body-sm font-medium h-9 px-4 py-2 rounded-lg transition-colors cursor-pointer';
const MOBILE_NAV_LINK_BASE = 'inline-flex items-center justify-start gap-2 whitespace-nowrap type-body-sm font-medium h-11 px-4 py-2 rounded-lg transition-colors cursor-pointer w-full';
const NAV_LINK_CLASS = `${NAV_LINK_BASE} text-muted-foreground hover:text-foreground hover:bg-muted`;
const MOBILE_NAV_LINK_CLASS = `${MOBILE_NAV_LINK_BASE} text-muted-foreground hover:text-foreground hover:bg-muted`;

export default function Header() {
  const { selectedCouncil, setSelectedCouncil } = useCouncil();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    // Navigate first, then clear council to avoid race conditions
    // with council page trying to set council from URL
    router.push('/');
    // Small delay to ensure navigation starts before clearing
    setTimeout(() => setSelectedCouncil(null), 10);
  }, [router, setSelectedCouncil]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const openFeedback = () => {
    document.dispatchEvent(new CustomEvent('open-feedback'));
    closeMobileMenu();
  };

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

  // Nav item styling — using pathname for active state
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const navLink = (href: string) => `${NAV_LINK_BASE} ${isActive(href) ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`;
  const mobileNavLink = (href: string) => `${MOBILE_NAV_LINK_BASE} ${isActive(href) ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`;

  return (
    <>
      {/* Main header - always visible at top */}
      <header className="border-b bg-background relative z-40">
        <div className="container mx-auto px-4 py-3 sm:px-6 max-w-5xl">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Logo and version */}
            <div className="flex items-center gap-4 shrink-0">
              <Link href="/" onClick={handleLogoClick} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                  <Landmark className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg sm:text-xl font-bold leading-tight">CivAccount</span>
              </Link>
              <Link href="/updates" className="hidden sm:flex items-center gap-2 cursor-pointer">
                <PulsingDot size="md" />
                <Badge variant="outline" className="type-body-sm cursor-pointer hover:bg-muted">
                  v3.0
                </Badge>
              </Link>
            </div>

            {/* Right: Search + Desktop Navigation (simplified: 3 core pages + actions) */}
            <div className="hidden lg:flex items-center gap-1 shrink-0">
              <SearchCommand />
              <nav className="flex items-center gap-1 ml-2" aria-label="Main navigation">
                <Link href={selectedCouncil ? `/council/${getCouncilSlug(selectedCouncil)}/proposals` : '/townhall'} className={navLink(pathname.includes('/proposals') ? pathname : '/townhall')}>
                  <Vote className="h-4 w-4" aria-hidden="true" />
                  Town Hall
                </Link>
                <Link href="/compare" className={navLink('/compare')}>
                  <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
                  Compare
                </Link>
                <Link href="/insights" className={navLink('/insights')}>
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />
                  Insights
                </Link>
                {user ? (
                  <AccountModal />
                ) : (
                  <Link href="/auth/login" className={NAV_LINK_CLASS}>
                    <User className="h-4 w-4" aria-hidden="true" />
                    Sign in
                  </Link>
                )}
                <ThemeToggle />
              </nav>
            </div>

            {/* Right: Medium screens — Town Hall + Compare + essentials */}
            <div className="hidden md:flex lg:hidden items-center gap-1 shrink-0">
              <SearchCommand />
              <nav className="flex items-center gap-1 ml-1" aria-label="Main navigation">
                <Link href={selectedCouncil ? `/council/${getCouncilSlug(selectedCouncil)}/proposals` : '/townhall'} className={navLink(pathname.includes('/proposals') ? pathname : '/townhall')}>
                  <Vote className="h-4 w-4" aria-hidden="true" />
                  Town Hall
                </Link>
                <Link href="/compare" className={navLink('/compare')}>
                  <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
                  Compare
                </Link>
              </nav>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-11 w-11"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
              </Button>
            </div>

            {/* Right: Mobile Navigation (small screens only) */}
            <div className="flex md:hidden items-center gap-1">
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

          {/* Mobile Menu Dropdown — simplified hierarchy */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pt-4 border-t">
              <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                {/* Primary: core features */}
                <Link href={selectedCouncil ? `/council/${getCouncilSlug(selectedCouncil)}/proposals` : '/townhall'} onClick={closeMobileMenu} className={mobileNavLink(pathname.includes('/proposals') ? pathname : '/townhall')}>
                  <Vote className="h-4 w-4" aria-hidden="true" />
                  Town Hall
                </Link>
                <Link href="/compare" onClick={closeMobileMenu} className={mobileNavLink('/compare')}>
                  <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
                  Compare
                </Link>
                <Link href="/insights" onClick={closeMobileMenu} className={mobileNavLink('/insights')}>
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />
                  Insights
                </Link>
                <Link href="/about" onClick={closeMobileMenu} className={mobileNavLink('/about')}>
                  <Info className="h-4 w-4" aria-hidden="true" />
                  About
                </Link>

                {/* Secondary: meta + actions */}
                <div className="pt-2 mt-2 border-t border-border/50 flex flex-col gap-1">
                  <Link href="/updates" onClick={closeMobileMenu} className={MOBILE_NAV_LINK_CLASS}>
                    <PulsingDot size="md" />
                    Updates
                    <Badge variant="outline" className="type-body-sm ml-auto">v3.0</Badge>
                  </Link>
                  <button type="button" onClick={openFeedback} className={MOBILE_NAV_LINK_CLASS}>
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    Feedback
                  </button>
                  {user ? (
                    <button type="button" onClick={() => { signOut(); closeMobileMenu(); }} className={MOBILE_NAV_LINK_CLASS}>
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Sign out
                    </button>
                  ) : (
                    <Link href="/auth/login" onClick={closeMobileMenu} className={MOBILE_NAV_LINK_CLASS}>
                      <User className="h-4 w-4" aria-hidden="true" />
                      Sign in
                    </Link>
                  )}
                </div>
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
            {/* Left: Logo + Page title */}
            <div className="flex items-center gap-3 shrink-0 min-w-0 flex-1">
              <Link
                href="/"
                onClick={handleLogoClick}
                className="flex items-center justify-center w-9 h-9 bg-primary rounded-full cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                aria-label="CivAccount home"
              >
                <Landmark className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
              </Link>

              {/* Always show context — council name, page title, or brand. Never empty. */}
              {(() => {
                // 1. Council pages — show council name
                if (pathname.startsWith('/council/')) {
                  const council = selectedCouncil || getCouncilBySlug(pathname.split('/')[2] || '');
                  if (council) {
                    return (
                      <p className="type-body-sm font-semibold truncate leading-tight">
                        <span className="sm:hidden">{council.name}</span>
                        <span className="hidden sm:inline">{getCouncilDisplayName(council)}</span>
                      </p>
                    );
                  }
                }

                // 2. Homepage with selected council — show council name
                if (pathname === '/' && selectedCouncil) {
                  return (
                    <p className="type-body-sm font-semibold truncate leading-tight">
                      <span className="sm:hidden">{selectedCouncil.name}</span>
                      <span className="hidden sm:inline">{getCouncilDisplayName(selectedCouncil)}</span>
                    </p>
                  );
                }

                // 3. Known pages and sub-pages — match by prefix
                const pageRoutes: [string, string][] = [
                  ['/townhall', 'Town Hall'],
                  ['/compare', 'Compare'],
                  ['/insights', 'Insights'],
                  ['/about', 'About'],
                  ['/updates', 'Updates'],
                  ['/roadmap', 'Roadmap'],
                  ['/methodology', 'Methodology'],
                  ['/accessibility', 'Accessibility'],
                  ['/privacy', 'Privacy'],
                  ['/terms', 'Terms'],
                  ['/license', 'License'],
                  ['/auth/login', 'Sign In'],
                ];

                for (const [route, title] of pageRoutes) {
                  if (pathname === route || pathname.startsWith(route + '/')) {
                    return <p className="type-body-sm font-semibold truncate leading-tight">{title}</p>;
                  }
                }

                // 4. Fallback — always show brand name, never empty
                return <p className="type-body-sm font-semibold truncate leading-tight">CivAccount</p>;
              })()}
            </div>

            {/* Right: Nav links + Search + Theme toggle + Mobile menu */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Desktop: Town Hall + Compare in compact pill */}
              <div className="hidden lg:flex items-center gap-1">
                <Link href={selectedCouncil ? `/council/${getCouncilSlug(selectedCouncil)}/proposals` : '/townhall'} className={navLink(pathname.includes('/proposals') ? pathname : '/townhall')}>
                  <Vote className="h-4 w-4" aria-hidden="true" />
                  Town Hall
                </Link>
                <Link href="/compare" className={navLink('/compare')}>
                  <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
                  Compare
                </Link>
              </div>
              {/* Desktop: Full search button */}
              <div className="hidden lg:block">
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
                className="lg:hidden h-9 w-9"
                aria-label="Search councils"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </Button>
              <ThemeToggle />
              {/* Mobile: Hamburger menu */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden h-9 w-9"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
              </Button>
            </div>
          </div>

          {/* Mobile menu dropdown - attached to sticky nav */}
          {mobileMenuOpen && isScrolled && (
            <div className="lg:hidden bg-background/95 backdrop-blur-xl border border-t-0 border-border/40 rounded-b-2xl shadow-lg p-3">
              <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                <Link href={selectedCouncil ? `/council/${getCouncilSlug(selectedCouncil)}/proposals` : '/townhall'} onClick={closeMobileMenu} className={mobileNavLink(pathname.includes('/proposals') ? pathname : '/townhall')}>
                  <Vote className="h-4 w-4" aria-hidden="true" />
                  Town Hall
                </Link>
                <Link href="/compare" onClick={closeMobileMenu} className={mobileNavLink('/compare')}>
                  <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
                  Compare
                </Link>
                <Link href="/insights" onClick={closeMobileMenu} className={mobileNavLink('/insights')}>
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />
                  Insights
                </Link>
                <Link href="/about" onClick={closeMobileMenu} className={mobileNavLink('/about')}>
                  <Info className="h-4 w-4" aria-hidden="true" />
                  About
                </Link>
                <div className="pt-2 mt-2 border-t border-border/50 flex flex-col gap-1">
                  <button type="button" onClick={openFeedback} className={MOBILE_NAV_LINK_CLASS}>
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    Feedback
                  </button>
                  {user ? (
                    <button type="button" onClick={() => { signOut(); closeMobileMenu(); }} className={MOBILE_NAV_LINK_CLASS}>
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Sign out
                    </button>
                  ) : (
                    <Link href="/auth/login" onClick={closeMobileMenu} className={MOBILE_NAV_LINK_CLASS}>
                      <User className="h-4 w-4" aria-hidden="true" />
                      Sign in
                    </Link>
                  )}
                </div>
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
            rgba(var(--background-rgb), 0.95) 0%,
            rgba(var(--background-rgb), 0.8) 50%,
            rgba(var(--background-rgb), 0) 100%
          )`,
        }}
        aria-hidden="true"
      />

      {/* Modals */}
      <FeedbackModal />
    </>
  );
}
