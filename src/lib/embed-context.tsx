'use client';

import { createContext, useContext, type ReactNode } from 'react';

const EmbedContext = createContext(false);

export function EmbedProvider({ children }: { children: ReactNode }) {
  return <EmbedContext.Provider value={true}>{children}</EmbedContext.Provider>;
}

export function useIsEmbed() {
  return useContext(EmbedContext);
}
