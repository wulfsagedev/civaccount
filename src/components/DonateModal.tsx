'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, X, Loader2 } from 'lucide-react';

const PRESET_AMOUNTS = [3, 5, 10, 25];

export default function DonateModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(5);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsLoading(false);
    setError(null);
  }, []);

  // Listen for custom event to open modal
  useEffect(() => {
    const handler = () => handleOpen();
    document.addEventListener('open-donate', handler);
    return () => document.removeEventListener('open-donate', handler);
  }, [handleOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount('');
    setError(null);
  };

  const handleCustomClick = () => {
    setIsCustom(true);
    setSelectedAmount(null);
    setError(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setCustomAmount(value);
    setError(null);
  };

  const getFinalAmount = (): number | null => {
    if (isCustom) {
      const parsed = parseFloat(customAmount);
      return isNaN(parsed) ? null : parsed;
    }
    return selectedAmount;
  };

  const handleDonate = async () => {
    const amount = getFinalAmount();

    if (!amount || amount < 1) {
      setError('Please enter at least £1');
      return;
    }

    if (amount > 500) {
      setError('Maximum donation is £500');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process donation');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const finalAmount = getFinalAmount();

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <Heart className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h2 className="font-semibold">Support CivAccount</h2>
                <p className="text-sm text-muted-foreground">Help keep it free</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-9 w-9 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              CivAccount is free and open source. Your donation helps cover hosting
              costs and supports continued development.
            </p>

            {/* Amount selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Select amount</label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handlePresetClick(amount)}
                    className={`h-12 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                      selectedAmount === amount && !isCustom
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    £{amount}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div
                className={`relative rounded-xl border-2 transition-colors ${
                  isCustom ? 'border-primary' : 'border-transparent'
                }`}
              >
                <button
                  type="button"
                  onClick={handleCustomClick}
                  className={`w-full h-12 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isCustom
                      ? 'bg-primary/10'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {isCustom ? (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-muted-foreground">£</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={customAmount}
                        onChange={handleCustomChange}
                        placeholder="Other"
                        className="w-20 bg-transparent text-center focus:outline-none text-foreground"
                        autoFocus
                      />
                    </div>
                  ) : (
                    'Other'
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}

            {/* Donate button */}
            <Button
              onClick={handleDonate}
              disabled={isLoading || !finalAmount}
              className="w-full h-12 text-base cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : finalAmount ? (
                `Donate £${finalAmount}`
              ) : (
                'Select an amount'
              )}
            </Button>

            {/* Security note */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                Secure checkout by Stripe
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
