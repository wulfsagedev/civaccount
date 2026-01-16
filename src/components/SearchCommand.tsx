'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Building2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { councils, Council, formatCurrency, getCouncilDisplayName } from '@/data/councils';
import { useCouncil } from '@/context/CouncilContext';

export default function SearchCommand() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { setSelectedCouncil } = useCouncil();

  // Only show on non-homepage routes
  const isHomepage = pathname === '/';

  // Filter councils based on search query
  const filteredCouncils = useMemo(() => {
    if (!searchQuery) {
      return councils.slice(0, 10);
    }

    const query = searchQuery.toLowerCase();
    return councils
      .filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.type_name.toLowerCase().includes(query) ||
        getCouncilDisplayName(c).toLowerCase().includes(query)
      )
      .slice(0, 10);
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

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    // Check if user is typing in an input/textarea
    const target = e.target as HTMLElement;
    const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    // Open search with F key (when not typing)
    if (e.key === 'f' && !isInputFocused && !isHomepage) {
      e.preventDefault();
      setIsOpen(true);
    }

    // Close with Escape
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
      setSearchQuery('');
    }
  }, [isOpen, isHomepage]);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  const handleSelect = (council: Council) => {
    setSelectedCouncil(council);
    setSearchQuery('');
    setIsOpen(false);
    router.push('/');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
  };

  // Don't render on homepage
  if (isHomepage) {
    return null;
  }

  return (
    <>
      {/* Search trigger button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground h-9 px-3"
      >
        <Search className="h-4 w-4" />
        <span className="text-sm">Search</span>
        <kbd className="ml-2 pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground flex">
          F
        </kbd>
      </Button>

      {/* Mobile search icon */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="sm:hidden h-9 w-9"
      >
        <Search className="h-4 w-4" />
      </Button>

      {/* Search overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery('');
            }}
          />

          {/* Search dialog */}
          <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-lg px-4">
            <div className="bg-card border rounded-xl shadow-lg overflow-hidden">
              {/* Search input */}
              <div className="flex items-center border-b px-4">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for a council..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 h-12 px-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className="h-8 w-8 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[300px] overflow-y-auto p-2">
                {filteredCouncils.length > 0 ? (
                  <div className="space-y-1">
                    {filteredCouncils.map((council, index) => {
                      const displayName = getCouncilDisplayName(council);
                      const bandDAmount = council.council_tax
                        ? formatCurrency(council.council_tax.band_d_2025, { decimals: 2 })
                        : null;
                      const isHighlighted = index === highlightedIndex;

                      return (
                        <button
                          key={council.ons_code}
                          data-search-item
                          onClick={() => handleSelect(council)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                            isHighlighted
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Building2 className={`h-4 w-4 shrink-0 ${isHighlighted ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{displayName}</div>
                              <div className="text-xs text-muted-foreground">{council.type_name}</div>
                            </div>
                          </div>
                          {bandDAmount && (
                            <Badge variant="outline" className="text-xs shrink-0 ml-2">
                              Band D: {bandDAmount}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    No councils found for &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">Enter</kbd>
                  to select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">Esc</kbd>
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
