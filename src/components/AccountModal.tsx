'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, LogOut, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AccountModal() {
  const { user, displayName, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(displayName ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync name when displayName loads
  useEffect(() => {
    if (displayName) setName(displayName);
  }, [displayName]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        triggerButtonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on Escape and restore focus
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // Move focus into popover when it opens, and trap focus
  useEffect(() => {
    if (!isOpen) return;
    const popover = popoverRef.current;
    if (!popover) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusables = popover.querySelectorAll(focusableSelector);
    const first = focusables[0] as HTMLElement;
    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const currentFocusables = popover.querySelectorAll(focusableSelector);
      const currentFirst = currentFocusables[0] as HTMLElement;
      const currentLast = currentFocusables[currentFocusables.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === currentFirst) {
        e.preventDefault();
        currentLast?.focus();
      } else if (!e.shiftKey && document.activeElement === currentLast) {
        e.preventDefault();
        currentFirst?.focus();
      }
    };

    popover.addEventListener('keydown', handleKeyDown);
    return () => popover.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!user) return null;

  const handleSaveName = async () => {
    if (!name.trim() || name.trim() === displayName) return;
    setIsSaving(true);
    const supabase = createClient();
    await supabase
      .from('users')
      .update({ display_name: name.trim() })
      .eq('id', user.id);
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Reload to pick up new name everywhere
    window.location.reload();
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  return (
    <div className="relative" ref={modalRef}>
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap type-body-sm font-medium h-9 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        aria-label="Account"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <User className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline max-w-[100px] truncate">{displayName}</span>
      </button>

      {isOpen && (
        <div ref={popoverRef} role="menu" className={cn(
          "absolute right-0 top-full mt-2 w-72 rounded-xl border border-border/40 bg-card shadow-lg z-50 overflow-hidden"
        )}>
          {/* Header */}
          <div className="p-4 border-b border-border/40">
            <p className="type-body-sm font-semibold">{displayName}</p>
            <p className="type-caption text-muted-foreground">{user.email}</p>
          </div>

          {/* Display name */}
          <div className="p-4 space-y-2">
            <Label htmlFor="display-name" className="type-caption font-medium">
              Display name
            </Label>
            <div className="flex gap-2">
              <Input
                id="display-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name or nickname"
                maxLength={50}
                className="h-9 flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant={saved ? 'outline' : 'default'}
                disabled={isSaving || !name.trim() || name.trim() === displayName}
                onClick={handleSaveName}
                className="h-9 cursor-pointer"
              >
                {saved ? <Check className="h-4 w-4 text-positive" /> : isSaving ? '...' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Sign out */}
          <div className="p-2 border-t border-border/40">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg type-body-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
