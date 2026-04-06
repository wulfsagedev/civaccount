'use client';

import { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import { councils as allCouncilsList } from '@/data/councils';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Council, getCouncilDisplayName, getCouncilSlug } from '@/data/councils';
import { useCouncil } from '@/context/CouncilContext';
import { SELECTOR_RESULT_LIMIT, CARD_STYLES, CARD_PADDING } from '@/lib/utils';
import { searchCouncilsFast, getAutocompleteSuggestion, totalCouncilCount, getDefaultCouncils } from '@/lib/search-index';

interface CouncilSelectorProps {
  onSelect?: (council: Council) => void;
  variant?: 'homepage' | 'dashboard' | 'townhall';
  navigateTo?: (slug: string) => string;
}

// Memoized result item for homepage variant
const HomepageResultItem = memo(function HomepageResultItem({
  council,
  isHighlighted,
  onSelect,
}: {
  council: Council;
  isHighlighted: boolean;
  onSelect: (council: Council) => void;
}) {
  const bandD = council.council_tax?.band_d_2025;
  const prevBandD = council.council_tax?.band_d_2024;
  const yoyChange = bandD && prevBandD ? ((bandD - prevBandD) / prevBandD) * 100 : null;

  return (
    <button
      data-council-item
      onClick={() => onSelect(council)}
      className={`w-full px-3 py-2.5 text-left rounded-lg transition-colors cursor-pointer ${
        isHighlighted ? 'bg-muted' : 'hover:bg-muted'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold type-body-sm truncate text-foreground">{council.name}</p>
          <p className="type-body-sm text-muted-foreground">{council.type_name}</p>
        </div>
        <div className="text-right shrink-0">
          {bandD && <p className="type-body-sm text-muted-foreground tabular-nums">£{Math.round(bandD).toLocaleString('en-GB')}/yr</p>}
          {yoyChange !== null && (
            <p className={`type-body-sm tabular-nums ${yoyChange > 0 ? 'text-negative' : yoyChange < 0 ? 'text-positive' : 'text-muted-foreground'}`}>
              {yoyChange > 0 ? '+' : ''}{yoyChange.toFixed(1)}% from last year
            </p>
          )}
        </div>
      </div>
    </button>
  );
});

// Memoized result item for dashboard variant
const DashboardResultItem = memo(function DashboardResultItem({
  council,
  isHighlighted,
  onSelect,
}: {
  council: Council;
  isHighlighted: boolean;
  onSelect: (council: Council) => void;
}) {
  const displayName = getCouncilDisplayName(council);
  const bandD = council.council_tax?.band_d_2025;

  return (
    <button
      data-council-item
      onClick={() => onSelect(council)}
      className={`w-full p-4 text-left rounded-lg transition-colors cursor-pointer ${
        isHighlighted ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className={`font-medium type-body-sm truncate ${isHighlighted ? 'text-primary' : ''}`}>
            {displayName}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="type-body-sm">
              {council.type_name}
            </Badge>
          </div>
        </div>
        <div className="text-right shrink-0">
          {bandD && (
            <p className="type-body-sm text-muted-foreground tabular-nums">
              £{bandD.toFixed(2)}/year
            </p>
          )}
        </div>
      </div>
    </button>
  );
});

// Pre-compute default councils once at module level
const defaultCouncils = getDefaultCouncils(SELECTOR_RESULT_LIMIT);

// UK postcode regex (partial or full)
const POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d?[A-Z]{0,2}$/i;

function isPostcode(query: string): boolean {
  return POSTCODE_REGEX.test(query.trim());
}

export default function CouncilSelector({ onSelect, variant = 'homepage', navigateTo }: CouncilSelectorProps) {
  const { selectedCouncil, setSelectedCouncil } = useCouncil();
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [postcodeResults, setPostcodeResults] = useState<Council[]>([]);
  const [postcodeLoading, setPostcodeLoading] = useState(false);
  const [postcodeError, setPostcodeError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Postcode lookup via postcodes.io
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query || !isPostcode(query) || query.replace(/\s/g, '').length < 5) {
      setPostcodeResults([]);
      setPostcodeError('');
      return;
    }

    const controller = new AbortController();
    setPostcodeLoading(true);
    setPostcodeError('');

    fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data.status === 200 && data.result) {
          const { admin_district, admin_county } = data.result;
          const matched: Council[] = [];

          // Normalize for matching: "Folkestone and Hythe" vs "Folkestone & Hythe"
          const normalize = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, ' ').trim();

          const findCouncil = (name: string) =>
            allCouncilsList.find(c => normalize(c.name) === normalize(name));

          // Match district council
          if (admin_district) {
            const district = findCouncil(admin_district);
            if (district) matched.push(district);
          }

          // Match county council
          if (admin_county) {
            const county = findCouncil(admin_county);
            if (county) matched.push(county);
          }

          // If no exact match, try partial
          if (matched.length === 0 && admin_district) {
            const norm = normalize(admin_district);
            const partial = allCouncilsList.find(c =>
              normalize(c.name).includes(norm) || norm.includes(normalize(c.name))
            );
            if (partial) matched.push(partial);
          }

          setPostcodeResults(matched);
          if (matched.length === 0) {
            setPostcodeError(`We found ${admin_district || 'your area'} but it is not in our database yet.`);
          }
        } else {
          setPostcodeResults([]);
          setPostcodeError('Postcode not found. Check the spelling.');
        }
        setPostcodeLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setPostcodeResults([]);
          setPostcodeError('Could not look up postcode. Try searching by council name.');
          setPostcodeLoading(false);
        }
      });

    return () => controller.abort();
  }, [searchQuery]);

  const isPostcodeQuery = isPostcode(searchQuery.trim()) && searchQuery.trim().replace(/\s/g, '').length >= 5;

  // Fast search using pre-computed index
  const filteredCouncils = useMemo(() => {
    if (!searchQuery) return defaultCouncils;
    if (isPostcodeQuery) return postcodeResults;
    return searchCouncilsFast(searchQuery, SELECTOR_RESULT_LIMIT);
  }, [searchQuery, isPostcodeQuery, postcodeResults]);

  // Fast autocomplete (disabled for postcode queries)
  const autocompleteSuggestion = useMemo(() => {
    if (!searchQuery || isPostcodeQuery || filteredCouncils.length === 0) return '';
    return getAutocompleteSuggestion(searchQuery);
  }, [searchQuery, isPostcodeQuery, filteredCouncils]);

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
    const slug = getCouncilSlug(council);
    router.push(navigateTo ? navigateTo(slug) : `/council/${slug}`);
  }, [setSelectedCouncil, onSelect, router, navigateTo]);

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
    } else if (e.key === 'Tab' && autocompleteSuggestion) {
      e.preventDefault();
      setSearchQuery(autocompleteSuggestion);
    }
  }, [filteredCouncils, highlightedIndex, handleSelect, autocompleteSuggestion]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Selected council header (dashboard only)
  if (selectedCouncil && variant === 'dashboard') {
    const displayName = getCouncilDisplayName(selectedCouncil);

    return (
      <div className="w-full">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="secondary" className="type-body-sm font-medium">
            {selectedCouncil.type_name}
          </Badge>
          <Badge variant="outline" className="type-body-sm font-medium">
            2025-26
          </Badge>
        </div>
        <h1 className="type-title-1 font-bold text-foreground leading-tight">
          {displayName}
        </h1>
      </div>
    );
  }

  // Town Hall variant — dropdown style, results only when typing
  if (variant === 'townhall') {
    return (
      <div className="w-full">
        <div className="relative">
          <div className="relative shadow-sm rounded-xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground z-10" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by name or postcode..."
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 text-base bg-background border border-muted-foreground/40 rounded-xl focus:outline-none focus:border-foreground placeholder:text-muted-foreground/50"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>

          {/* Results — dropdown overlay, no layout shift */}
          {searchQuery.trim() && (
            <div ref={listRef} className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border/40 bg-card shadow-lg z-20 overflow-hidden max-h-[280px] overflow-y-auto">
              {postcodeLoading && isPostcodeQuery ? (
                <p className="text-center type-body-sm text-muted-foreground py-4">
                  Looking up postcode...
                </p>
              ) : filteredCouncils.length === 0 ? (
                <p className="text-center type-body-sm text-muted-foreground py-4">
                  {postcodeError || 'No councils found. Try a different spelling or postcode.'}
                </p>
              ) : (
                filteredCouncils.map((council, index) => (
                  <button
                    key={council.ons_code}
                    data-council-item
                    onClick={() => handleSelect(council)}
                    className={`w-full px-4 py-3 text-left transition-colors cursor-pointer min-h-[44px] border-b border-border/20 last:border-b-0 ${
                      index === highlightedIndex ? 'bg-muted' : 'hover:bg-muted'
                    }`}
                  >
                    <p className="font-semibold type-body-sm text-foreground">{council.name}</p>
                    <p className="type-body-sm text-muted-foreground">{council.type_name}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <p className="type-body-sm text-center text-muted-foreground mt-3">
          {totalCouncilCount} councils across England. Free. No sign-up needed to browse.
        </p>
      </div>
    );
  }

  // Homepage variant - optimized for speed
  if (variant === 'homepage') {
    return (
      <div className="w-full">
        <div className="space-y-3">
          <div className="relative shadow-sm rounded-xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground z-10" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by name or postcode..."
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 text-base bg-background border border-muted-foreground/40 rounded-xl focus:outline-none focus:border-foreground placeholder:text-muted-foreground/50"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>

          <div ref={listRef} className="h-[220px] overflow-y-auto scrollbar-hide">
            {postcodeLoading && isPostcodeQuery ? (
              <p className="text-center type-body-sm text-muted-foreground py-4">
                Looking up postcode...
              </p>
            ) : filteredCouncils.length === 0 ? (
              <p className="text-center type-body-sm text-muted-foreground py-4">
                {postcodeError || 'No councils found. Try a different spelling or postcode.'}
              </p>
            ) : (
              filteredCouncils.map((council, index) => (
                <HomepageResultItem
                  key={council.ons_code}
                  council={council}
                  isHighlighted={index === highlightedIndex}
                  onSelect={handleSelect}
                />
              ))
            )}
          </div>

          <p className="type-body-sm text-center text-muted-foreground">
            {searchQuery
              ? `${filteredCouncils.length} councils found`
              : `${totalCouncilCount} councils in England`
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
                placeholder="Search by name or postcode..."
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="w-full pl-11 pr-4 py-3 border-2 rounded-xl bg-background focus:outline-none focus:border-primary transition-colors text-base"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                autoFocus
              />
            </div>

            <div ref={listRef} className="max-h-[192px] overflow-y-auto space-y-2 border rounded-xl p-3">
              {filteredCouncils.length === 0 ? (
                <p className="text-center type-body-sm text-muted-foreground py-6">
                  No councils found. Try a different spelling.
                </p>
              ) : (
                filteredCouncils.map((council, index) => (
                  <DashboardResultItem
                    key={council.ons_code}
                    council={council}
                    isHighlighted={index === highlightedIndex}
                    onSelect={handleSelect}
                  />
                ))
              )}
            </div>

            <p className="type-body-sm text-center text-muted-foreground">
              {searchQuery
                ? `${filteredCouncils.length} councils found · Press Enter to select`
                : `${totalCouncilCount} councils in England`
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
