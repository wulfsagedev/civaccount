'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Heart, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnimatedModal } from '@/lib/use-animated-modal';

const DONATION_AMOUNTS = [
  { value: 3, label: '£3', description: 'Small' },
  { value: 5, label: '£5', description: 'Medium' },
  { value: 10, label: '£10', description: 'Large' },
  { value: 25, label: '£25', description: 'Extra large' },
];

interface DonateButtonProps {
  variant?: 'default' | 'header';
}

export function DonateButton({ variant = 'default' }: DonateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<Element | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Ensure we only render portal after component mounts (for SSR compatibility)
  useEffect(() => {
    setMounted(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    if (triggerRef.current && triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
    }
  }, []);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeModal]);

  // Focus trap and auto-focus
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusables = dialog.querySelectorAll(focusableSelector);
    const first = focusables[0] as HTMLElement;
    const last = focusables[focusables.length - 1] as HTMLElement;

    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const currentFocusables = dialog.querySelectorAll(focusableSelector);
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

    dialog.addEventListener('keydown', handleKeyDown);
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleDonate = async () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;

    if (!amount || amount < 1 || amount > 500) {
      setError('Please enter an amount between £1 and £500');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Something went wrong');
        setIsLoading(false);
      }
    } catch {
      setError('Failed to connect to payment service');
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => { triggerRef.current = document.activeElement; setIsOpen(true); }}
        className={cn(
          'inline-flex items-center gap-2 font-semibold transition-all cursor-pointer rounded-lg',
          variant === 'header'
            ? 'h-9 px-4 py-2 type-body-sm text-muted-foreground hover:text-foreground hover:bg-muted'
            : 'h-11 px-6 py-2 type-body-sm rounded-lg'
        )}
        style={variant === 'default' ? {
          backgroundColor: 'var(--share-accent)',
          color: 'white',
        } : undefined}
      >
        <Heart className="h-4 w-4" aria-hidden="true" />
        Donate
      </button>

      <DonateModal
        mounted={mounted}
        isOpen={isOpen}
        closeModal={closeModal}
        dialogRef={dialogRef}
        selectedAmount={selectedAmount}
        setSelectedAmount={setSelectedAmount}
        customAmount={customAmount}
        setCustomAmount={setCustomAmount}
        isLoading={isLoading}
        error={error}
        setError={setError}
        handleDonate={handleDonate}
      />
    </>
  );
}

function DonateModal({
  mounted,
  isOpen,
  closeModal,
  dialogRef,
  selectedAmount,
  setSelectedAmount,
  customAmount,
  setCustomAmount,
  isLoading,
  error,
  setError,
  handleDonate,
}: {
  mounted: boolean;
  isOpen: boolean;
  closeModal: () => void;
  dialogRef: React.RefObject<HTMLDivElement | null>;
  selectedAmount: number;
  setSelectedAmount: (n: number) => void;
  customAmount: string;
  setCustomAmount: (s: string) => void;
  isLoading: boolean;
  error: string;
  setError: (s: string) => void;
  handleDonate: () => void;
}) {
  const { shouldRender, dataState } = useAnimatedModal(isOpen);
  if (!mounted || !shouldRender) return null;

  return createPortal(
        <div
          ref={dialogRef}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="donate-title"
          onClick={closeModal}
          data-state={dataState}
        >
          <div
            className="absolute inset-0 modal-overlay ease-out-snap data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-240 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-180 motion-reduce:animate-none"
            data-state={dataState}
          />
          {/* Modal content */}
          <div
            className="relative w-full max-w-md modal-content overflow-hidden ease-out-snap data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-240 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-180 motion-reduce:animate-none"
            onClick={(e) => e.stopPropagation()}
            data-state={dataState}
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--share-accent-bg)' }}>
                    <Heart className="h-5 w-5" style={{ color: 'var(--share-accent)' }} />
                  </div>
                  <div>
                    <h2 id="donate-title" className="font-semibold type-title-3">Support CivAccount</h2>
                    <p className="type-body-sm text-muted-foreground">One-time contribution</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-11 h-11 rounded-full hover:bg-muted flex items-center justify-center cursor-pointer"
                  aria-label="Close donation modal"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              <p className="type-body-sm text-muted-foreground">
                If you find CivAccount useful, consider supporting its development.
              </p>

              {/* Preset amounts */}
              <div className="grid grid-cols-2 gap-3">
                {DONATION_AMOUNTS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedAmount(option.value);
                      setCustomAmount('');
                      setError('');
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      selectedAmount === option.value && !customAmount
                        ? 'border-foreground bg-muted'
                        : 'border-border/50 hover:border-border hover:bg-muted'
                    }`}
                  >
                    <span className="type-body-lg font-semibold">{option.label}</span>
                    <p className="type-body-sm text-muted-foreground mt-0.5">{option.description}</p>
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div>
                <label htmlFor="custom-donation-amount" className="type-body-sm font-medium mb-2 block">Or enter a custom amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                  <input
                    id="custom-donation-amount"
                    type="number"
                    min="1"
                    max="500"
                    placeholder="5"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setError('');
                    }}
                    className="w-full pl-7 pr-4 py-3 rounded-xl border border-border bg-background focus:border-foreground focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <p className="type-body-sm text-destructive">{error}</p>
              )}

              {/* Donate button */}
              <button
                onClick={handleDonate}
                disabled={isLoading}
                className="w-full h-12 rounded-xl text-base font-semibold cursor-pointer flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                style={{ backgroundColor: 'var(--share-accent)', color: 'white' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirecting to checkout...
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4" />
                    Donate £{customAmount || selectedAmount}
                  </>
                )}
              </button>

              <p className="type-body-sm text-center text-muted-foreground">
                Secure payment powered by Stripe. One-time donation.
              </p>
            </div>
          </div>
        </div>,
    document.body
  );
}
