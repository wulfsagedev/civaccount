'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, X, Coffee, Loader2 } from 'lucide-react';

const DONATION_AMOUNTS = [
  { value: 3, label: '£3', description: 'Small' },
  { value: 5, label: '£5', description: 'Medium' },
  { value: 10, label: '£10', description: 'Large' },
  { value: 25, label: '£25', description: 'Extra large' },
];

export function DonateButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <Heart className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Donate</span>
      </Button>

      {/* Modal backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
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
                  <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                    <Coffee className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Support CivAccount</h2>
                    <p className="text-sm text-muted-foreground">One-time contribution</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              <p className="text-sm text-muted-foreground">
                CivAccount is free to use. Contributions help cover server and development costs.
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
                        : 'border-border/50 hover:border-border hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-lg font-semibold">{option.label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div>
                <label className="text-sm font-medium mb-2 block">Or enter a custom amount</label>
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
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              {/* Donate button */}
              <Button
                onClick={handleDonate}
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redirecting to checkout...
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-2" />
                    Donate £{customAmount || selectedAmount}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Secure payment powered by Stripe. One-time donation.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
