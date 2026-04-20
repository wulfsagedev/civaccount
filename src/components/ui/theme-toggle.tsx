'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

type ThemePref = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  size?: 'default' | 'lg';
}

function readPref(): ThemePref {
  if (typeof window === 'undefined') return 'system';
  const raw = localStorage.getItem('theme');
  return raw === 'light' || raw === 'dark' ? raw : 'system';
}

function applyPref(pref: ThemePref) {
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = pref === 'dark' || (pref === 'system' && systemDark);

  root.classList.add('theme-transition');
  root.classList.toggle('dark', dark);
  window.setTimeout(() => root.classList.remove('theme-transition'), 200);
}

export function ThemeToggle({ size = 'default' }: ThemeToggleProps) {
  const [pref, setPref] = useState<ThemePref>('system');
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // Hydrate preference + wire system-change listener when in 'system' mode.
  useEffect(() => {
    setMounted(true);
    const initial = readPref();
    setPref(initial);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      if (readPref() === 'system') applyPref('system');
    };
    mq.addEventListener('change', onSystemChange);
    return () => mq.removeEventListener('change', onSystemChange);
  }, []);

  const choose = useCallback((next: ThemePref) => {
    setPref(next);
    if (next === 'system') {
      // Keep a marker so the inline bootstrap script can distinguish "user
      // explicitly chose system" from "never set" — both behave identically,
      // but storing the value prevents other scripts guessing.
      localStorage.setItem('theme', 'system');
    } else {
      localStorage.setItem('theme', next);
    }
    applyPref(next);
    setOpen(false);
  }, []);

  const isLarge = size === 'lg';
  const iconSize = isLarge ? 'h-6 w-6' : 'h-[18px] w-[18px]';

  // Pick which icon to show on the trigger button.
  const resolved = mounted
    ? pref === 'system'
      ? 'system'
      : pref
    : 'system';

  const TriggerIcon =
    resolved === 'system' ? Monitor : resolved === 'dark' ? Sun : Moon;

  // Prevent hydration mismatch — render a transparent placeholder at the same
  // footprint until we know the user's stored preference.
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={isLarge ? 'h-11 w-11' : ''}
        aria-label="Theme"
      >
        <div className={iconSize} />
      </Button>
    );
  }

  const labelMap: Record<ThemePref, string> = {
    system: 'System theme',
    light: 'Light theme',
    dark: 'Dark theme',
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={isLarge ? 'h-11 w-11' : ''}
          aria-label={`Theme: ${labelMap[pref]}. Click to change.`}
        >
          <TriggerIcon className={iconSize} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1">
        <div className="flex flex-col" role="radiogroup" aria-label="Theme">
          <ThemeOption
            label="System"
            sublabel="Follow device"
            Icon={Monitor}
            active={pref === 'system'}
            onSelect={() => choose('system')}
          />
          <ThemeOption
            label="Light"
            Icon={Sun}
            active={pref === 'light'}
            onSelect={() => choose('light')}
          />
          <ThemeOption
            label="Dark"
            Icon={Moon}
            active={pref === 'dark'}
            onSelect={() => choose('dark')}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ThemeOption({
  label,
  sublabel,
  Icon,
  active,
  onSelect,
}: {
  label: string;
  sublabel?: string;
  Icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-left transition-colors cursor-pointer hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block type-body-sm font-medium">{label}</span>
        {sublabel && (
          <span className="block type-caption text-muted-foreground">{sublabel}</span>
        )}
      </span>
      {active && <Check className="h-4 w-4 text-foreground shrink-0" aria-hidden="true" />}
    </button>
  );
}
