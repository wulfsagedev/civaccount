'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CARD_STYLES } from '@/lib/utils';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse h-64 w-96 bg-muted rounded-xl" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { signInWithEmail } = useAuth();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/';
  const error = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState(error === 'auth' ? 'The sign-in link has expired or was already used. Enter your email to get a new one.' : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`;
    const { error: signInError } = await signInWithEmail(email, callbackUrl);

    if (signInError) {
      setErrorMsg(signInError);
      setIsSubmitting(false);
    } else {
      setSent(true);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className={`${CARD_STYLES} w-full max-w-md p-6 sm:p-8`}>
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6 text-positive" />
              </div>
              <h1 className="type-title-2">Check your email</h1>
              <p className="type-body-sm text-muted-foreground">
                We sent a sign-in link to <span className="font-semibold text-foreground">{email}</span>.
                Click the link to sign in.
              </p>
              <p className="type-caption text-muted-foreground">
                No email? Check your spam folder.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-muted-foreground" />
                </div>
                <h1 className="type-title-2 mb-1">Sign in to CivAccount</h1>
                <p className="type-body-sm text-muted-foreground">
                  Join the conversation about how your council spends your money.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="type-body-sm font-medium">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="h-12"
                  />
                </div>

                {errorMsg && (
                  <p className="type-body-sm text-destructive">{errorMsg}</p>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 type-body font-semibold"
                  disabled={isSubmitting || !email.trim()}
                >
                  {isSubmitting ? 'Sending link...' : 'Send sign-in link'}
                </Button>
              </form>

              <p className="type-caption text-muted-foreground text-center mt-6">
                No password needed. We send you a magic link.
              </p>
            </>
          )}

          <div className="mt-6 pt-4 border-t border-border/50">
            <Link
              href={redirectTo}
              className="inline-flex items-center gap-2 type-body-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
