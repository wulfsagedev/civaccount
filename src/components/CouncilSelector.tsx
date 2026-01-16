'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Building2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { councils, Council, formatCurrency, getCouncilDisplayName } from '@/data/councils';
import { useCouncil } from '@/context/CouncilContext';

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
      return councils.slice(0, 50);
    }

    const query = searchQuery.toLowerCase();
    return councils
      .filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.type_name.toLowerCase().includes(query) ||
        getCouncilDisplayName(c).toLowerCase().includes(query)
      )
      .slice(0, 50);
  }, [searchQuery]);

  // Reset highlighted index when results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredCouncils]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[data-council-item]');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (council: Council) => {
    setSelectedCouncil(council);
    setSearchQuery('');
    onSelect?.(council);
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

  const handleBackToSearch = () => {
    setSelectedCouncil(null);
    setSearchQuery('');
  };

  // Get the autocomplete suggestion (first matching council)
  const autocompleteSuggestion = useMemo(() => {
    if (!searchQuery || filteredCouncils.length === 0) return '';
    const firstMatch = getCouncilDisplayName(filteredCouncils[0]);
    if (firstMatch.toLowerCase().startsWith(searchQuery.toLowerCase())) {
      return searchQuery + firstMatch.slice(searchQuery.length);
    }
    return '';
  }, [searchQuery, filteredCouncils]);

  // Show the selected council bar (only on dashboard)
  if (selectedCouncil && variant === 'dashboard') {
    const displayName = getCouncilDisplayName(selectedCouncil);
    const bandDAmount = selectedCouncil.council_tax
      ? formatCurrency(selectedCouncil.council_tax.band_d_2025, { decimals: 2 })
      : null;

    return (
      <div className="w-full">
        <Card className="border border-border/40 bg-card shadow-sm rounded-xl">
          <CardContent className="p-5 sm:p-6">
            {/* Header row: badges + change button */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs font-medium">
                  {selectedCouncil.type_name}
                </Badge>
                <Badge variant="outline" className="text-xs font-medium">
                  2025-26
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToSearch}
                className="flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                Change
              </Button>
            </div>

            {/* Council name - clear hierarchy */}
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-3">
              {displayName}
            </h1>

            {/* Band D info */}
            {bandDAmount && (
              <p className="text-base text-muted-foreground mb-4">
                Band D: <span className="font-semibold text-foreground">{bandDAmount}</span>/year
              </p>
            )}

            {/* Explainer text */}
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

  // Homepage variant - prominent search box
  if (variant === 'homepage') {
    return (
      <div className="w-full">
        <div className="space-y-8">
          {/* Search Input - Primary focus */}
          <div className="relative shadow-lg rounded-2xl">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for your council..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-14 pr-6 py-4 sm:py-5 text-base sm:text-lg bg-background border-2 border-muted-foreground/30 rounded-2xl focus:outline-none focus:border-primary focus:shadow-xl transition-all placeholder:text-muted-foreground/50"
              autoFocus
            />
          </div>

          {/* Results - Fixed height container to prevent layout shift */}
          <div
            ref={listRef}
            className="h-[224px] overflow-y-auto space-y-2 scrollbar-hide"
          >
            {filteredCouncils.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                No councils found. Try a different spelling.
              </p>
            ) : (
              filteredCouncils.map((council, index) => {
                const displayName = getCouncilDisplayName(council);
                const isHighlighted = index === highlightedIndex;
                return (
                  <button
                    key={council.ons_code}
                    data-council-item
                    onClick={() => handleSelect(council)}
                    className={`w-full p-4 text-left rounded-xl transition-all cursor-pointer ${
                      isHighlighted
                        ? 'bg-muted-foreground/15 shadow-sm'
                        : 'hover:bg-muted/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-base truncate text-foreground">
                          {displayName}
                        </p>
                        <p className="text-sm mt-1 text-muted-foreground">
                          {council.type_name}
                        </p>
                      </div>
                      <div className="text-right shrink-0 text-sm text-muted-foreground">
                        {council.council_tax && (
                          <p>£{Math.round(council.council_tax.band_d_2025).toLocaleString('en-GB')}/yr</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
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

  // Dashboard variant - with card wrapper (when no council selected on dashboard page)
  return (
    <div className="w-full">
      <Card className="border border-border/40 bg-card shadow-sm rounded-xl">
        <CardContent className="p-5 sm:p-6">
          <div className="space-y-5">
            {/* Search Input with autocomplete */}
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
                className="w-full pl-11 pr-4 py-3 border-2 rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-base"
                autoFocus
              />
            </div>

            {/* Results - max 3 visible, scrollable */}
            <div
              ref={listRef}
              className="max-h-[192px] overflow-y-auto space-y-2 border rounded-xl p-3"
            >
              {filteredCouncils.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">
                  No councils found. Try a different spelling.
                </p>
              ) : (
                filteredCouncils.map((council, index) => {
                  const displayName = getCouncilDisplayName(council);
                  const isHighlighted = index === highlightedIndex;
                  return (
                    <button
                      key={council.ons_code}
                      data-council-item
                      onClick={() => handleSelect(council)}
                      className={`w-full p-4 text-left rounded-lg transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-primary/10 border-primary/30'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className={`font-medium text-sm truncate ${isHighlighted ? 'text-primary' : ''}`}>
                            {displayName}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {council.type_name}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {council.council_tax && (
                            <p className="text-sm text-muted-foreground">
                              £{council.council_tax.band_d_2025.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/year
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
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
