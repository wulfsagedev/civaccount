'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Council, councils, getCouncilByCode } from '@/data/councils';

export type DashboardViewMode = 'detailed' | 'simple';

interface CouncilContextType {
  selectedCouncil: Council | null;
  setSelectedCouncil: (council: Council | null) => void;
  isLoading: boolean;
  viewMode: DashboardViewMode;
  setViewMode: (mode: DashboardViewMode) => void;
}

const CouncilContext = createContext<CouncilContextType | undefined>(undefined);

export function CouncilProvider({ children }: { children: ReactNode }) {
  const [selectedCouncil, setSelectedCouncil] = useState<Council | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<DashboardViewMode>('simple');

  useEffect(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('selectedCouncilCode');
    if (saved) {
      const council = getCouncilByCode(saved);
      if (council) {
        setSelectedCouncil(council);
      }
    }
    // Load view mode preference
    const savedViewMode = localStorage.getItem('dashboardViewMode');
    if (savedViewMode === 'simple' || savedViewMode === 'detailed') {
      setViewMode(savedViewMode);
    }
    setIsLoading(false);
  }, []);

  const handleSetCouncil = (council: Council | null) => {
    setSelectedCouncil(council);
    if (council) {
      localStorage.setItem('selectedCouncilCode', council.ons_code);
    } else {
      localStorage.removeItem('selectedCouncilCode');
    }
  };

  const handleSetViewMode = (mode: DashboardViewMode) => {
    setViewMode(mode);
    localStorage.setItem('dashboardViewMode', mode);
  };

  return (
    <CouncilContext.Provider value={{
      selectedCouncil,
      setSelectedCouncil: handleSetCouncil,
      isLoading,
      viewMode,
      setViewMode: handleSetViewMode
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
