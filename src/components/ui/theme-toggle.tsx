'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const manualOverride = localStorage.getItem('theme-manual') === 'true';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    setIsManual(manualOverride);

    // If manually set, use stored preference; otherwise follow system
    if (manualOverride && stored) {
      const dark = stored === 'dark';
      setIsDark(dark);
      document.documentElement.classList.toggle('dark', dark);
    } else {
      setIsDark(prefersDark);
      document.documentElement.classList.toggle('dark', prefersDark);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if not manually overridden
      if (localStorage.getItem('theme-manual') !== 'true') {
        setIsDark(e.matches);
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    setIsManual(true);

    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    localStorage.setItem('theme-manual', 'true');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 hover:bg-accent hover:text-accent-foreground transition-colors"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-all" />
      ) : (
        <Moon className="h-4 w-4 transition-all" />
      )}
    </Button>
  );
}