'use client';

import { memo } from 'react';

/**
 * Floating coins/blocks animation for CivAccount landing page.
 * Smooth orbital motion with 3D rotation representing money flow.
 * Grayscale palette - clean and professional.
 * Pure CSS - no JavaScript animation.
 */
const DataFlowAnimation = memo(function DataFlowAnimation() {
  return (
    <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto perspective-500" aria-hidden="true">
      {/* Ambient glow behind everything */}
      <div className="absolute inset-[-20%] animate-breathe-slow">
        <div className="absolute inset-0 rounded-full bg-gradient-radial from-muted/60 via-muted/20 to-transparent blur-2xl" />
      </div>

      {/* Floating coin 1 - top left */}
      <div className="absolute top-[5%] left-[8%] animate-float-coin-1">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-background to-muted/80 border border-border/60 shadow-lg flex items-center justify-center transform-gpu animate-rotate-coin-1">
          <span className="text-sm sm:text-base font-bold text-foreground/70">£</span>
        </div>
      </div>

      {/* Floating coin 2 - top right */}
      <div className="absolute top-[10%] right-[5%] animate-float-coin-2">
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-gradient-to-br from-background to-muted/60 border border-border/50 shadow-md flex items-center justify-center transform-gpu animate-rotate-coin-2">
          <span className="text-xs sm:text-sm font-bold text-foreground/60">£</span>
        </div>
      </div>

      {/* Floating coin 3 - bottom left */}
      <div className="absolute bottom-[15%] left-[2%] animate-float-coin-3">
        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-background to-muted/70 border border-border/50 shadow-lg flex items-center justify-center transform-gpu animate-rotate-coin-3">
          <span className="text-sm font-bold text-foreground/65">£</span>
        </div>
      </div>

      {/* Floating coin 4 - bottom right */}
      <div className="absolute bottom-[8%] right-[10%] animate-float-coin-4">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-gradient-to-br from-background to-muted/50 border border-border/40 shadow flex items-center justify-center transform-gpu animate-rotate-coin-4">
          <span className="text-[10px] sm:text-xs font-bold text-foreground/50">£</span>
        </div>
      </div>

      {/* Floating block 5 - left side */}
      <div className="absolute top-[42%] left-[-2%] animate-float-coin-5">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-gradient-to-br from-muted/40 to-muted/70 border border-border/30 shadow-sm transform-gpu animate-rotate-coin-5" />
      </div>

      {/* Floating block 6 - right side */}
      <div className="absolute top-[35%] right-[-1%] animate-float-coin-6">
        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-gradient-to-br from-muted/30 to-muted/60 border border-border/25 shadow-sm transform-gpu animate-rotate-coin-6" />
      </div>

      {/* Center £ token - the focal point with subtle pulse */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-card border border-border/70 shadow-xl flex items-center justify-center transform-gpu animate-center-pulse">
          <span className="text-4xl sm:text-5xl font-bold text-foreground">£</span>
        </div>
      </div>
    </div>
  );
});

export { DataFlowAnimation };
