'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DisplayNameField from '@/components/DisplayNameField';
import { User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AccountModal() {
  const { user, displayName, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

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

          {/* Display name: shared with the phone menus */}
          <div className="p-4">
            <DisplayNameField />
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
