'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Heart, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  // Ensure we only render portal after component mounts (for SSR compatibility)
  useEffect(() => {
    setMounted(true);
  }, []);

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
        onClick={() => setIsOpen(true)}
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

      {/* Modal - rendered via portal to ensure it's above all other content */}
      {mounted && isOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal content */}
          <div
            className="w-full max-w-md bg-background rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--share-accent-bg)' }}>
                    <Heart className="h-5 w-5" style={{ color: 'var(--share-accent)' }} />
                  </div>
                  <div>
                    <h2 className="font-semibold type-title-3">Support CivAccount</h2>
                    <p className="type-body-sm text-muted-foreground">One-time contribution</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
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
                <label className="type-body-sm font-medium mb-2 block">Or enter a custom amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                  <input
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
      )}
    </>
  );
}
