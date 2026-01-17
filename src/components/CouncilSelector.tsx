'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CouncilResultItem } from '@/components/ui/council-result-item';
import { councils, Council, formatCurrency, getCouncilDisplayName } from '@/data/councils';
import { useCouncil } from '@/context/CouncilContext';
import { SELECTOR_RESULT_LIMIT, CARD_STYLES, CARD_PADDING } from '@/lib/utils';

interface CouncilSelectorProps {
  onSelect?: (council: Council) => void;
  variant?: 'homepage' | 'dashboard';
  explainerText?: string;
}

export default function CouncilSelector({ onSelect, variant = 'homepage', explainerText }: CouncilSelectorProps) {
  const { selectedCouncil, setSelectedCouncil } = useCouncil();
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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
  }, [setSelectedCouncil, onSelect]);

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

  const handleBackToSearch = useCallback(() => {
    setSelectedCouncil(null);
    setSearchQuery('');
  }, [setSelectedCouncil]);

  const autocompleteSuggestion = useMemo(() => {
    if (!searchQuery || filteredCouncils.length === 0) return '';
    const firstMatch = getCouncilDisplayName(filteredCouncils[0]);
    if (firstMatch.toLowerCase().startsWith(searchQuery.toLowerCase())) {
      return searchQuery + firstMatch.slice(searchQuery.length);
    }
    return '';
  }, [searchQuery, filteredCouncils]);

  // Selected council header (dashboard only)
  if (selectedCouncil && variant === 'dashboard') {
    const displayName = getCouncilDisplayName(selectedCouncil);
    const bandDAmount = selectedCouncil.council_tax
      ? formatCurrency(selectedCouncil.council_tax.band_d_2025, { decimals: 2 })
      : null;

    // Calculate full bill if precepts available
    const hasFullBill = selectedCouncil.detailed?.total_band_d;
    const fullBillAmount = hasFullBill
      ? formatCurrency(selectedCouncil.detailed!.total_band_d!, { decimals: 2 })
      : null;

    // Get what this council type is responsible for
    const getResponsibilities = () => {
      if (selectedCouncil.type === 'SD') {
        return "Waste collection, recycling, housing, planning, parks, environmental health";
      } else if (selectedCouncil.type === 'SC') {
        return "Schools, social care, roads, libraries, public health";
      } else if (selectedCouncil.type === 'LB' || selectedCouncil.type === 'MD' || selectedCouncil.type === 'UA') {
        return "All local services including social care, schools, roads, waste, housing, planning";
      }
      return null;
    };

    const responsibilities = getResponsibilities();

    return (
      <div className="w-full">
        <Card className={CARD_STYLES}>
          <CardContent className={CARD_PADDING}>
            {/* Top row with badges and prominent change button */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-sm font-medium">
                  {selectedCouncil.type_name}
                </Badge>
                <Badge variant="outline" className="text-sm font-medium">
                  2025-26
                </Badge>
                {hasFullBill && (
                  <Badge variant="outline" className="text-sm font-medium bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                    Verified
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToSearch}
                className="flex items-center gap-2 shrink-0 cursor-pointer bg-muted/50 hover:bg-muted border-border/60 transition-colors"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Change council</span>
                <span className="sm:hidden">Change</span>
              </Button>
            </div>

            {/* Council name as prominent hero element */}
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-4">
              {displayName}
            </h1>

            {/* Key financial stats in a highlighted row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 pb-4 border-b border-border/50">
              {bandDAmount && (
                <div>
                  <p className="text-sm text-muted-foreground mb-0.5">This council&apos;s share</p>
                  <p className="text-lg font-semibold text-foreground tabular-nums">{bandDAmount}<span className="text-sm font-normal text-muted-foreground">/year</span></p>
                </div>
              )}
              {fullBillAmount && (
                <div>
                  <p className="text-sm text-muted-foreground mb-0.5">Your full bill</p>
                  <p className="text-lg font-semibold text-foreground tabular-nums">{fullBillAmount}<span className="text-sm font-normal text-muted-foreground">/year</span></p>
                </div>
              )}
            </div>

            {/* What this council is responsible for */}
            {responsibilities && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                <span className="font-medium text-foreground">Responsible for:</span> {responsibilities}
              </p>
            )}

            {explainerText && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {explainerText}
              </p>
            )}
          </CardContent>
        </Card>
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
              placeholder="Search for your council..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 text-sm sm:text-base bg-background border border-muted-foreground/40 rounded-xl focus:outline-none focus:border-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          <div ref={listRef} className="h-[148px] overflow-y-auto scrollbar-hide">
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
