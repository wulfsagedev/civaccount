'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Council, getCouncilByCode } from '@/data/councils';

interface CouncilContextType {
  selectedCouncil: Council | null;
  setSelectedCouncil: (council: Council | null) => void;
  isLoading: boolean;
  /** The council came back from an earlier visit (localStorage), rather than being picked just now. */
  restored: boolean;
}

const CouncilContext = createContext<CouncilContextType | undefined>(undefined);

export function CouncilProvider({ children }: { children: ReactNode }) {
  const [selectedCouncil, setSelectedCouncil] = useState<Council | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    // Where this visit began, so the homepage only sends on a visit that began
    // there (src/app/page.tsx). Kept for the visit, never overwritten.
    try {
      if (!sessionStorage.getItem('civaccount-landed')) sessionStorage.setItem('civaccount-landed', window.location.pathname);
    } catch {
      // No storage: the homepage sends on as it always did.
    }
    // Try to load from localStorage
    const saved = localStorage.getItem('selectedCouncilCode');
    if (saved) {
      const council = getCouncilByCode(saved);
      if (council) {
        setSelectedCouncil(council);
        setRestored(true);
      }
    }
    setIsLoading(false);
  }, []);

  // Stable reference so effects that depend on it (e.g. the council page's
  // URL→context sync) don't re-fire every render and fight with logo clicks.
  const handleSetCouncil = useCallback((council: Council | null) => {
    setSelectedCouncil(council);
    setRestored(false);
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
      restored,
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
