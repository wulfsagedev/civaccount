'use client';

import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Council, getCouncilSlug, councils as allCouncilsList } from '@/data/councils';
import { useCouncil } from '@/context/CouncilContext';
import { SEARCH_RESULT_LIMIT } from '@/lib/utils';
import { searchCouncilsFast, getDefaultCouncils } from '@/lib/search-index';
import { useAnimatedModal } from '@/lib/use-animated-modal';

const POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d?[A-Z]{0,2}$/i;
function isPostcode(query: string): boolean {
  return POSTCODE_REGEX.test(query.trim());
}

interface SearchCommandProps {
  forceDesktopStyle?: boolean;
  // Header renders three responsive SearchCommand instances (desktop, tablet,
  // mobile). Only one should own the overlay state + keyboard listener;
  // the other two are pure trigger buttons that dispatch `open-search`.
  // Defaults to `true` for backward compatibility. Set `false` on the
  // secondary responsive instances — otherwise pressing F opens three
  // stacked overlays and each close callback only dismisses one.
  renderOverlay?: boolean;
}

// Memoized result item for optimal re-render performance
const SearchResultItem = memo(function SearchResultItem({
  council,
  isHighlighted,
  onSelect,
}: {
  council: Council;
  isHighlighted: boolean;
  onSelect: (council: Council) => void;
}) {
  const bandD = council.council_tax?.band_d_2025;

  return (
    <button
      role="option"
      data-search-item
      onClick={() => onSelect(council)}
      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
        isHighlighted
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-muted'
      }`}
    >
      <div className="min-w-0">
        <div className="font-medium type-body-sm truncate">{council.name}</div>
        <div className="type-body-sm text-muted-foreground">{council.type_name}</div>
      </div>
      {bandD && (
        <span className="type-body-sm text-muted-foreground shrink-0 ml-2 tabular-nums">
          £{Math.round(bandD).toLocaleString('en-GB')}/yr
        </span>
      )}
    </button>
  );
});

// Pre-compute default councils once
const defaultCouncils = getDefaultCouncils(SEARCH_RESULT_LIMIT);

export default function SearchCommand({ forceDesktopStyle = false, renderOverlay = true }: SearchCommandProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { shouldRender: shouldRenderOverlay, dataState: overlayState } = useAnimatedModal(isOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [postcodeResults, setPostcodeResults] = useState<Council[]>([]);
  const [postcodeLoading, setPostcodeLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { selectedCouncil, setSelectedCouncil } = useCouncil();

  const isHomepageWithoutCouncil = pathname === '/' && !selectedCouncil;

  // Callback ref for immediate focus when input mounts
  const inputCallbackRef = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      inputRef.current = node;
      // Focus immediately when mounted
      node.focus();
    }
  }, []);

  const isPostcodeQuery = isPostcode(searchQuery.trim()) && searchQuery.trim().replace(/\s/g, '').length >= 5;

  // Postcode lookup
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query || !isPostcode(query) || query.replace(/\s/g, '').length < 5) {
      setPostcodeResults([]);
      return;
    }
    const controller = new AbortController();
    setPostcodeLoading(true);
    const normalize = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, ' ').trim();
    const findCouncil = (name: string) => allCouncilsList.find(c => normalize(c.name) === normalize(name));

    fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data.status === 200 && data.result) {
          const matched: Council[] = [];
          if (data.result.admin_district) {
            const d = findCouncil(data.result.admin_district);
            if (d) matched.push(d);
          }
          if (data.result.admin_county) {
            const c = findCouncil(data.result.admin_county);
            if (c) matched.push(c);
          }
          if (matched.length === 0 && data.result.admin_district) {
            const norm = normalize(data.result.admin_district);
            const partial = allCouncilsList.find(c => normalize(c.name).includes(norm) || norm.includes(normalize(c.name)));
            if (partial) matched.push(partial);
          }
          setPostcodeResults(matched);
        } else {
          setPostcodeResults([]);
        }
        setPostcodeLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') { setPostcodeResults([]); setPostcodeLoading(false); }
      });
    return () => controller.abort();
  }, [searchQuery]);

  // Fast search using pre-computed index
  const filteredCouncils = useMemo(() => {
    if (!searchQuery) return defaultCouncils;
    if (isPostcodeQuery) return postcodeResults;
    return searchCouncilsFast(searchQuery, SEARCH_RESULT_LIMIT);
  }, [searchQuery, isPostcodeQuery, postcodeResults]);

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

  // Backup focus attempts if callback ref didn't work (e.g., re-renders)
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Additional focus attempt after render settles
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
    // Restore focus to the element that triggered the search
    if (triggerRef.current && triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
    }
  }, []);

  // Global keyboard shortcuts — only the overlay-owning instance listens.
  // `isOpen` is read via ref to avoid recreating the listener on every state
  // change (which was causing the listener to detach/reattach and could race
  // with browser focus restoration on reload).
  const isOpenRef = useRef(isOpen);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  useEffect(() => {
    if (!renderOverlay) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'f' && !isInputFocused) {
        e.preventDefault();
        triggerRef.current = document.activeElement;
        setIsOpen(true);
      }

      if (e.key === 'Escape' && isOpenRef.current) {
        closeSearch();
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [renderOverlay, closeSearch]);

  // Listen for custom event to open search — only the overlay-owning instance.
  useEffect(() => {
    if (!renderOverlay) return;
    const handleOpenSearch = () => {
      triggerRef.current = document.activeElement;
      document.dispatchEvent(new CustomEvent('close-mobile-menu'));
      setIsOpen(true);
    };
    document.addEventListener('open-search', handleOpenSearch);
    return () => document.removeEventListener('open-search', handleOpenSearch);
  }, [renderOverlay]);

  // Focus trap for the search overlay
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = dialog.querySelectorAll(focusableSelector);
      const first = focusables[0] as HTMLElement;
      const last = focusables[focusables.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    dialog.addEventListener('keydown', handleTabKey);
    return () => dialog.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Don't render the button on homepage without council, but still render the overlay
  const showButton = !isHomepageWithoutCouncil || forceDesktopStyle;

  return (
    <>
      {showButton && (
        forceDesktopStyle ? (
          // Sticky nav button - only triggers event, doesn't render overlay
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.dispatchEvent(new CustomEvent('open-search'))}
            className="flex items-center justify-between text-muted-foreground hover:text-foreground h-9 px-3 min-w-[180px]"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="type-body-sm">Find council</span>
            </div>
            <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono type-body-sm font-medium text-muted-foreground hidden sm:flex">
              F
            </kbd>
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (renderOverlay) {
                  triggerRef.current = document.activeElement;
                  setIsOpen(true);
                } else {
                  // Secondary instance — route click through the singleton event.
                  document.dispatchEvent(new CustomEvent('open-search'));
                }
              }}
              className="hidden lg:flex items-center justify-between text-muted-foreground hover:text-foreground h-9 px-3 min-w-[180px]"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="type-body-sm">Find council</span>
              </div>
              <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono type-body-sm font-medium text-muted-foreground flex">
                F
              </kbd>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (renderOverlay) {
                  triggerRef.current = document.activeElement;
                  setIsOpen(true);
                } else {
                  // Secondary instance — route click through the singleton event.
                  document.dispatchEvent(new CustomEvent('open-search'));
                }
              }}
              className="lg:hidden h-11 w-11"
              aria-label="Search councils"
            >
              <Search className="h-6 w-6" />
            </Button>
          </>
        )
      )}

      {/* Search overlay — only one SearchCommand instance renders it.
          Header mounts three responsive instances (desktop / tablet / mobile);
          only the first is the overlay owner. `forceDesktopStyle` is the
          sticky-nav variant which is always button-only. */}
      {renderOverlay && !forceDesktopStyle && shouldRenderOverlay && (
        <div ref={dialogRef} className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Search councils" data-state={overlayState}>
          <div
            className="absolute inset-0 modal-overlay ease-out-snap data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-240 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-180 motion-reduce:animate-none"
            data-state={overlayState}
            onClick={closeSearch}
          />
          <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-lg px-4 top-28 sm:top-[20%]">
            <div
              className="modal-content overflow-hidden ease-out-snap data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-240 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-180 motion-reduce:animate-none"
              data-state={overlayState}
            >
              <div className="p-3 pb-0">
                <div className="relative shadow-sm rounded-xl">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground z-10" aria-hidden="true" />
                  <input
                    ref={inputCallbackRef}
                    type="text"
                    placeholder="Search by name or postcode..."
                    value={searchQuery}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    aria-label="Search councils by name or postcode"
                    className="w-full pl-11 sm:pl-12 pr-12 py-3 sm:py-3.5 text-base bg-background border border-muted-foreground/40 rounded-xl focus:outline-none focus:border-foreground placeholder:text-muted-foreground/50"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    enterKeyHint="go"
                    tabIndex={0}
                  />
                  <button
                    onClick={closeSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label="Close search"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div ref={listRef} className="max-h-[60vh] sm:max-h-[300px] overflow-y-auto p-2">
                {filteredCouncils.length > 0 ? (
                  <div className="space-y-0.5" role="listbox">
                    {filteredCouncils.map((council, index) => (
                      <SearchResultItem
                        key={council.ons_code}
                        council={council}
                        isHighlighted={index === highlightedIndex}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground type-body-sm">
                    {postcodeLoading && isPostcodeQuery
                      ? 'Looking up postcode...'
                      : `No councils found for "${searchQuery}"`}
                  </div>
                )}
              </div>

              <div className="hidden sm:flex border-t px-4 py-2 type-body-sm text-muted-foreground items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono type-body-sm">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono type-body-sm">↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono type-body-sm">Enter</kbd>
                  to select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono type-body-sm">Esc</kbd>
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
