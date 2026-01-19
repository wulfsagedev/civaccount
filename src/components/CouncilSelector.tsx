'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CouncilResultItem } from '@/components/ui/council-result-item';
import { useRouter } from 'next/navigation';
import { councils, Council, formatCurrency, getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { useCouncil } from '@/context/CouncilContext';
import { SELECTOR_RESULT_LIMIT, CARD_STYLES, CARD_PADDING } from '@/lib/utils';

interface CouncilSelectorProps {
  onSelect?: (council: Council) => void;
  variant?: 'homepage' | 'dashboard';
}

export default function CouncilSelector({ onSelect, variant = 'homepage' }: CouncilSelectorProps) {
  const { selectedCouncil, setSelectedCouncil } = useCouncil();
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const filteredCouncils = useMemo(() => {
    if (!searchQuery) {
      return councils.slice(0, SELECTOR_RESULT_LIMIT);
    }

    const query = searchQuery.toLowerCase();
    return councils
      .filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.type_name.toLowerCase().includes(query) ||
        getCouncilDisplayName(c).toLowerCase().includes(query)
      )
      .slice(0, SELECTOR_RESULT_LIMIT);
  }, [searchQuery]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredCouncils]);

  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[data-council-item]');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = useCallback((council: Council) => {
    setSelectedCouncil(council);
    setSearchQuery('');
    onSelect?.(council);
    // Navigate to SEO-friendly URL
    const slug = getCouncilSlug(council);
    router.push(`/council/${slug}`);
  }, [setSelectedCouncil, onSelect, router]);

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

  const autocompleteSuggestion = useMemo(() => {
    if (!searchQuery || filteredCouncils.length === 0) return '';
    const firstMatch = getCouncilDisplayName(filteredCouncils[0]);
    if (firstMatch.toLowerCase().startsWith(searchQuery.toLowerCase())) {
      return searchQuery + firstMatch.slice(searchQuery.length);
    }
    return '';
  }, [searchQuery, filteredCouncils]);

  // Selected council header (dashboard only) - minimal, just context
  if (selectedCouncil && variant === 'dashboard') {
    const displayName = getCouncilDisplayName(selectedCouncil);
    const hasVerifiedData = selectedCouncil.detailed?.total_band_d;

    return (
      <div className="w-full">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs font-medium">
            {selectedCouncil.type_name}
          </Badge>
          <Badge variant="outline" className="text-xs font-medium">
            2025-26
          </Badge>
          {hasVerifiedData && (
            <Badge variant="outline" className="text-xs font-medium bg-navy-50 text-navy-600 border-navy-200">
              Verified
            </Badge>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          {displayName}
        </h1>
      </div>
    );
  }

  // Homepage variant
  if (variant === 'homepage') {
    return (
      <div className="w-full">
        <div className="space-y-3">
          <div className="relative shadow-sm rounded-xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground z-10" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Find your council..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 text-base bg-background border border-muted-foreground/40 rounded-xl focus:outline-none focus:border-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          <div ref={listRef} className="h-[220px] overflow-y-auto scrollbar-hide">
            {filteredCouncils.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                No councils found. Try a different spelling.
              </p>
            ) : (
              filteredCouncils.map((council, index) => (
                <CouncilResultItem
                  key={council.ons_code}
                  council={council}
                  isHighlighted={index === highlightedIndex}
                  onSelect={handleSelect}
                  variant="homepage"
                />
              ))
            )}
          </div>

          <p className="text-sm text-center text-muted-foreground">
            {searchQuery
              ? `${filteredCouncils.length} councils found`
              : `${councils.length} councils in England`
            }
          </p>
        </div>
      </div>
    );
  }

  // Dashboard variant (no council selected)
  return (
    <div className="w-full">
      <Card className={CARD_STYLES}>
        <CardContent className={CARD_PADDING}>
          <div className="space-y-5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {autocompleteSuggestion && (
                <div className="absolute left-11 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 pointer-events-none text-base">
                  {autocompleteSuggestion}
                </div>
              )}
              <input
                ref={inputRef}
                type="text"
                placeholder="Type your council name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-11 pr-4 py-3 border-2 rounded-xl bg-background focus:outline-none focus:border-primary transition-colors text-base"
                autoFocus
              />
            </div>

            <div ref={listRef} className="max-h-[192px] overflow-y-auto space-y-2 border rounded-xl p-3">
              {filteredCouncils.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">
                  No councils found. Try a different spelling.
                </p>
              ) : (
                filteredCouncils.map((council, index) => (
                  <CouncilResultItem
                    key={council.ons_code}
                    council={council}
                    isHighlighted={index === highlightedIndex}
                    onSelect={handleSelect}
                    variant="dashboard"
                  />
                ))
              )}
            </div>

            <p className="text-sm text-center text-muted-foreground">
              {searchQuery
                ? `${filteredCouncils.length} councils found · Press Enter to select`
                : `${councils.length} councils in England`
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
