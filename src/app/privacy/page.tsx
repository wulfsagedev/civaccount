'use client';

import { useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main id="main-content" className="flex-1">
        <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 max-w-7xl">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 cursor-pointer">
                  <ArrowLeft className="h-4 w-4" />
                  Back to home
                </Button>
              </Link>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <Badge variant="outline" className="mb-2">Legal</Badge>
                <h1 className="text-2xl sm:text-3xl font-bold">Privacy Policy</h1>
                <p className="text-muted-foreground">
                  Last updated: January 2025
                </p>
              </div>

              <div className="card-elevated p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">We respect your privacy</h2>
                    <p className="text-sm text-muted-foreground">CivAccount collects minimal data</p>
                  </div>
                </div>

                <div className="space-y-6 text-sm leading-relaxed">
                  <section className="space-y-3">
                    <h3 className="font-semibold text-base">What we collect</h3>
                    <p className="text-muted-foreground">
                      CivAccount stores your selected council preference in your browser&apos;s local storage.
                      This data never leaves your device and is only used to remember your council selection
                      between visits.
                    </p>
                    <p className="text-muted-foreground">
                      We do not use cookies for tracking. We do not collect personal information.
                      We do not require you to create an account.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h3 className="font-semibold text-base">Analytics</h3>
                    <p className="text-muted-foreground">
                      We may use privacy-respecting analytics to understand how people use CivAccount.
                      This helps us improve the service. Any analytics data is aggregated and anonymous.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h3 className="font-semibold text-base">Third-party services</h3>
                    <p className="text-muted-foreground">
                      CivAccount is hosted on Vercel. When you visit, Vercel may collect standard
                      server logs (IP address, browser type, pages visited). See{' '}
                      <a
                        href="https://vercel.com/legal/privacy-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Vercel&apos;s privacy policy
                      </a>
                      {' '}for details.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h3 className="font-semibold text-base">Data sources</h3>
                    <p className="text-muted-foreground">
                      All council data displayed on CivAccount comes from publicly available
                      UK government sources. We do not collect or store any data about individual
                      council tax payers.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h3 className="font-semibold text-base">Your rights</h3>
                    <p className="text-muted-foreground">
                      You can clear your browser&apos;s local storage at any time to remove your
                      council preference. Since we don&apos;t collect personal data, there&apos;s nothing
                      else to delete.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h3 className="font-semibold text-base">Contact</h3>
                    <p className="text-muted-foreground">
                      If you have questions about this privacy policy, please open an issue on our{' '}
                      <a
                        href="https://github.com/wulfsagedev/civaccount"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        GitHub repository
                      </a>.
                    </p>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
