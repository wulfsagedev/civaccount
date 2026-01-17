'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, CheckCircle, X } from 'lucide-react';

interface FeatureRequestDialogProps {
  variant?: 'desktop' | 'mobile';
  className?: string;
}

export default function FeatureRequestDialog({ variant = 'desktop', className }: FeatureRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleClose = useCallback(() => {
    setOpen(false);
    if (isSuccess) {
      setIsSuccess(false);
    }
  }, [isSuccess]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feature-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSuccess(true);
        setFormData({ name: '', email: '', message: '' });
        setTimeout(() => {
          setOpen(false);
          setIsSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting feature request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultDesktopClass = "h-9 px-4 inline-flex items-center justify-center text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer";
  const defaultMobileClass = "h-11 px-4 w-full inline-flex items-center text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className || (variant === 'mobile' ? defaultMobileClass : defaultDesktopClass)}
      >
        Feedback
      </button>

      {/* Feedback overlay - same style as SearchCommand */}
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Feedback dialog */}
          <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-md px-4">
            <div className="bg-card border rounded-xl shadow-lg overflow-hidden">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">Thank you!</h3>
                    <p className="text-sm text-muted-foreground">Your feedback has been sent.</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                      <h2 className="font-semibold text-base">Send Feedback</h2>
                      <p className="text-xs text-muted-foreground">Feature request or bug report</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClose}
                      className="h-8 w-8 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit}>
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm">Name</Label>
                        <Input
                          id="name"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-sm">Message</Label>
                        <Textarea
                          id="message"
                          placeholder="Tell us about your feature request or feedback..."
                          className="min-h-[100px] resize-none"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t px-4 py-3 flex justify-end">
                      <Button type="submit" disabled={isSubmitting} size="sm">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Feedback
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
