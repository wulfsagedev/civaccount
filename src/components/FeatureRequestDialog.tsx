'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, CheckCircle, X } from 'lucide-react';
import { useAnimatedModal } from '@/lib/use-animated-modal';

// Detail payload accepted by the open-feedback CustomEvent. All optional —
// when omitted, the dialog acts as the original generic feedback form.
export interface FeedbackEventDetail {
  /** Pre-fill the message body (e.g. for "Report incorrect data") */
  prefillMessage?: string;
  /** Override the dialog title */
  title?: string;
  /** Override the dialog subtitle */
  subtitle?: string;
}

// This component renders only the modal overlay
// It listens for a custom 'open-feedback' event to open
export default function FeedbackModal() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [dialogTitle, setDialogTitle] = useState('Send feedback');
  const [dialogSubtitle, setDialogSubtitle] = useState('Tell us about a mistake, a problem or an idea.');
  const triggerRef = useRef<Element | null>(null);
  const lastTemplate = useRef<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setOpen(false);
    if (isSuccess) {
      setIsSuccess(false);
    }
    // Reset to defaults for the next open
    setDialogTitle('Send feedback');
    setDialogSubtitle('Tell us about a mistake, a problem or an idea.');
    // Restore focus to the element that triggered the dialog
    if (triggerRef.current && triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
    }
  }, [isSuccess]);

  // Listen for custom event to open the dialog (with optional prefill detail)
  useEffect(() => {
    const handleOpenFeedback = (e: Event) => {
      triggerRef.current = document.activeElement;
      const detail = (e as CustomEvent<FeedbackEventDetail | undefined>).detail;
      // A form opened with a template (the report form) leaves it behind for
      // the next plain open only if someone wrote into it (launch QA, 29 Oct 2026)
      const template = detail?.prefillMessage;
      // read the last template now: React may run the updater after the line
      // below has already replaced it (independent review, 17 Nov 2026)
      const previous = lastTemplate.current;
      setFormData((prev) => ({
        ...prev,
        message: template ?? (prev.message === previous ? '' : prev.message),
      }));
      lastTemplate.current = template ?? null;
      if (detail?.title) setDialogTitle(detail.title);
      if (detail?.subtitle) setDialogSubtitle(detail.subtitle);
      setOpen(true);
    };
    document.addEventListener('open-feedback', handleOpenFeedback);
    return () => document.removeEventListener('open-feedback', handleOpenFeedback);
  }, []);

  // Focus trap and auto-focus
  useEffect(() => {
    if (!open) return;
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
  }, [open]);

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
    setErrorMsg('');

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
      } else {
        // Say why, or at least that it did not go (CA-B5): before, a refused
        // or failed send left the form exactly as it was, with no words.
        const body = await response.json().catch(() => null);
        const known = response.status === 400 || response.status === 429;
        setErrorMsg(
          known && typeof body?.error === 'string'
            ? body.error
            : 'Your message was not sent. Please try again in a minute.',
        );
      }
    } catch (error) {
      console.error('Error submitting feature request:', error);
      setErrorMsg('Your message was not sent. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { shouldRender, dataState } = useAnimatedModal(open);
  if (!shouldRender) return null;

  return (
    <div ref={dialogRef} className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="feedback-title" data-state={dataState}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 modal-overlay ease-out-snap data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-240 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-180 motion-reduce:animate-none"
        data-state={dataState}
        onClick={handleClose}
      />

      {/* Feedback dialog */}
      <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-md px-4">
        <div
          className="modal-content overflow-hidden ease-out-snap data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-240 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-180 motion-reduce:animate-none"
          data-state={dataState}
        >
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <CheckCircle className="h-12 w-12 text-positive" />
              <div className="text-center">
                <h3 className="font-semibold type-title-3">Thank you!</h3>
                <p className="type-body-sm text-muted-foreground">Your feedback has been sent.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                  <h2 id="feedback-title" className="font-semibold text-base">{dialogTitle}</h2>
                  <p className="type-body-sm text-muted-foreground">{dialogSubtitle}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-11 w-11 shrink-0"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="type-body-sm">Name</Label>
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
                    <Label htmlFor="email" className="type-body-sm">Email</Label>
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
                    <Label htmlFor="message" className="type-body-sm">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us what you noticed, or what would help..."
                      className="min-h-[100px] resize-none"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {errorMsg && (
                  <p role="alert" className="px-4 pb-3 type-body-sm text-destructive">
                    {errorMsg}
                  </p>
                )}

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
                        Send
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
  );
}
