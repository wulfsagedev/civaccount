'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CouncilResultItem } from '@/components/ui/council-result-item';
import { councils, Council, getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { useCouncil } from '@/context/CouncilContext';
import { SEARCH_RESULT_LIMIT } from '@/lib/utils';

interface SearchCommandProps {
  /** Always show the desktop-style button (for sticky nav) */
  forceDesktopStyle?: boolean;
}

export default function SearchCommand({ forceDesktopStyle = false }: SearchCommandProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { selectedCouncil, setSelectedCouncil } = useCouncil();

  // Only hide on homepage when no council is selected (shows its own search)
  const isHomepageWithoutCouncil = pathname === '/' && !selectedCouncil;

  // Filter councils based on search query
  const filteredCouncils = useMemo(() => {
    if (!searchQuery) {
      return councils.slice(0, SEARCH_RESULT_LIMIT);
    }

    const query = searchQuery.toLowerCase();
    return councils
      .filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.type_name.toLowerCase().includes(query) ||
        getCouncilDisplayName(c).toLowerCase().includes(query)
      )
      .slice(0, SEARCH_RESULT_LIMIT);
  }, [searchQuery]);

  // Reset highlighted index when results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredCouncils]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[data-search-item]');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Focus input when opened - aggressive focus for mobile keyboard
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Immediate focus attempt
      inputRef.current.focus();

      // Multiple delayed attempts for mobile browsers
      const timer1 = setTimeout(() => {
        inputRef.current?.focus();
      }, 10);

      const timer2 = setTimeout(() => {
        inputRef.current?.focus();
        // Also try selecting to ensure cursor is ready
        inputRef.current?.select();
      }, 100);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    if (e.key === 'f' && !isInputFocused) {
      e.preventDefault();
      setIsOpen(true);
    }

    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  // Listen for custom event to open search (from sticky nav mobile button)
  useEffect(() => {
    const handleOpenSearch = () => {
      // Close mobile menu first, then open search
      document.dispatchEvent(new CustomEvent('close-mobile-menu'));
      setIsOpen(true);
    };
    document.addEventListener('open-search', handleOpenSearch);
    return () => document.removeEventListener('open-search', handleOpenSearch);
  }, []);

  const handleSelect = useCallback((council: Council) => {
    setSelectedCouncil(council);
    setSearchQuery('');
    setIsOpen(false);
    const slug = getCouncilSlug(council);
    router.push(`/council/${slug}`);
  }, [setSelectedCouncil, router]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev < filteredCouncils.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCouncils[highlightedIndex]) {
        handleSelect(filteredCouncils[highlightedIndex]);
      }
    }
  }, [filteredCouncils, highlightedIndex, handleSelect]);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Don't render on homepage without council selected (unless forced for sticky nav)
  if (isHomepageWithoutCouncil && !forceDesktopStyle) return null;

  return (
    <>
      {forceDesktopStyle ? (
        /* Always show desktop-style button (for sticky nav) - same width as main nav */
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-between text-muted-foreground hover:text-foreground h-9 px-3 min-w-[180px]"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="text-sm">Find council</span>
          </div>
          <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-sm font-medium text-muted-foreground hidden sm:flex">
            F
          </kbd>
        </Button>
      ) : (
        <>
          {/* Desktop: Text button with keyboard hint */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center justify-between text-muted-foreground hover:text-foreground h-9 px-3 min-w-[180px]"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="text-sm">Find council</span>
            </div>
            <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-sm font-medium text-muted-foreground flex">
              F
            </kbd>
          </Button>

          {/* Mobile: Icon button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="sm:hidden h-11 w-11"
            aria-label="Search councils"
          >
            <Search className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Search overlay - z-[60] to appear above sticky nav (z-50) */}
      {isOpen && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={closeSearch}
          />
          <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-lg px-4 top-20 sm:top-[20%]">
            <div className="bg-card border rounded-xl shadow-lg overflow-hidden">
              <div className="flex items-center border-b px-4">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Find your council..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="flex-1 h-14 text-base px-3 bg-transparent outline-none placeholder:text-muted-foreground"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeSearch}
                  className="h-10 w-10 shrink-0 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div ref={listRef} className="max-h-[60vh] sm:max-h-[300px] overflow-y-auto p-2">
                {filteredCouncils.length > 0 ? (
                  <div className="space-y-1">
                    {filteredCouncils.map((council, index) => (
                      <CouncilResultItem
                        key={council.ons_code}
                        council={council}
                        isHighlighted={index === highlightedIndex}
                        onSelect={handleSelect}
                        showBadge
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    No councils found for &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>

              {/* Keyboard hints - hidden on mobile */}
              <div className="hidden sm:flex border-t px-4 py-2 text-sm text-muted-foreground items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-sm">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-sm">↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-sm">Enter</kbd>
                  to select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-sm">Esc</kbd>
                  to close
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
