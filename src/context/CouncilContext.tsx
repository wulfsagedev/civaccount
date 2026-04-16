'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Council, getCouncilByCode } from '@/data/councils';

interface CouncilContextType {
  selectedCouncil: Council | null;
  setSelectedCouncil: (council: Council | null) => void;
  isLoading: boolean;
}

const CouncilContext = createContext<CouncilContextType | undefined>(undefined);

export function CouncilProvider({ children }: { children: ReactNode }) {
  const [selectedCouncil, setSelectedCouncil] = useState<Council | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('selectedCouncilCode');
    if (saved) {
      const council = getCouncilByCode(saved);
      if (council) {
        setSelectedCouncil(council);
      }
    }
    setIsLoading(false);
  }, []);

  // Stable reference so effects that depend on it (e.g. the council page's
  // URL→context sync) don't re-fire every render and fight with logo clicks.
  const handleSetCouncil = useCallback((council: Council | null) => {
    setSelectedCouncil(council);
    if (council) {
      localStorage.setItem('selectedCouncilCode', council.ons_code);
    } else {
      localStorage.removeItem('selectedCouncilCode');
    }
  }, []);

  return (
    <CouncilContext.Provider value={{
      selectedCouncil,
      setSelectedCouncil: handleSetCouncil,
      isLoading,
    }}>
      {children}
    </CouncilContext.Provider>
  );
}

export function useCouncil() {
  const context = useContext(CouncilContext);
  if (context === undefined) {
    throw new Error('useCouncil must be used within a CouncilProvider');
  }
  return context;
}
