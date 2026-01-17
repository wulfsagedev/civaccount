'use client';

import { Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Council, formatCurrency, getCouncilDisplayName } from '@/data/councils';

interface CouncilResultItemProps {
  council: Council;
  isHighlighted: boolean;
  onSelect: (council: Council) => void;
  variant?: 'search' | 'homepage' | 'dashboard';
  showBadge?: boolean;
}

export function CouncilResultItem({
  council,
  isHighlighted,
  onSelect,
  variant = 'search',
  showBadge = true,
}: CouncilResultItemProps) {
  const displayName = getCouncilDisplayName(council);
  const bandDAmount = council.council_tax
    ? formatCurrency(council.council_tax.band_d_2025, { decimals: 2 })
    : null;

  if (variant === 'homepage') {
    return (
      <button
        data-council-item
        onClick={() => onSelect(council)}
        className={`w-full px-3 py-2 text-left rounded-lg transition-colors cursor-pointer ${
          isHighlighted
            ? 'bg-muted'
            : 'hover:bg-muted/60'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate text-foreground">
              {displayName}
            </p>
            <p className="text-sm text-muted-foreground">
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
  }

  if (variant === 'dashboard') {
    return (
      <button
        data-council-item
        onClick={() => onSelect(council)}
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
              <Badge variant="secondary" className="text-sm">
                {council.type_name}
              </Badge>
            </div>
          </div>
          <div className="text-right shrink-0">
            {council.council_tax && (
              <p className="text-sm text-muted-foreground">
                {bandDAmount}/year
              </p>
            )}
          </div>
        </div>
      </button>
    );
  }

  // Default 'search' variant
  return (
    <button
      data-search-item
      onClick={() => onSelect(council)}
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
          <div className="text-sm text-muted-foreground">{council.type_name}</div>
        </div>
      </div>
      {showBadge && bandDAmount && (
        <Badge variant="outline" className="text-sm shrink-0 ml-2">
          Band D: {bandDAmount}
        </Badge>
      )}
    </button>
  );
}
