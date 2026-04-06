'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { councils, getCouncilSlug, getCouncilDisplayName, type Council } from '@/data/councils';
import { Search } from 'lucide-react';

interface CouncilSwitcherProps {
  currentSlug: string;
}

export default function CouncilSwitcher({ currentSlug }: CouncilSwitcherProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return councils
      .filter((c) => c.name.toLowerCase().includes(q))
      .filter((c) => getCouncilSlug(c) !== currentSlug)
      .slice(0, 5);
  }, [query, currentSlug]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (council: Council) => {
    setQuery('');
    setIsFocused(false);
    router.push(`/council/${getCouncilSlug(council)}/proposals`);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Switch council..."
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background type-body-sm text-muted-foreground focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setQuery('');
              setIsFocused(false);
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
      </div>

      {isFocused && results.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
          {results.map((council) => (
            <li key={council.ons_code}>
              <button
                type="button"
                onClick={() => handleSelect(council)}
                className="w-full text-left px-3 py-2.5 type-body-sm hover:bg-muted transition-colors cursor-pointer"
              >
                <span className="font-medium">{getCouncilDisplayName(council)}</span>
                <span className="type-caption text-muted-foreground ml-2">{council.type_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isFocused && query.trim() && results.length === 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="type-caption text-muted-foreground text-center">No councils found</p>
        </div>
      )}
    </div>
  );
}
