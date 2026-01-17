'use client';

import { useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsPage() {
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
                <h1 className="text-2xl sm:text-3xl font-bold">Terms of Use</h1>
                <p className="text-muted-foreground">
                  Last updated: January 2025
                </p>
              </div>

              {/* Important disclaimer */}
              <div className="p-5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
                      Not an official government service
                    </p>
                    <p className="text-amber-700 dark:text-amber-400 leading-relaxed">
                      CivAccount is an independent project. We are not affiliated with, endorsed by,
                      or connected to any UK council or government department.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-elevated p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Using CivAccount</h2>
                    <p className="text-sm text-muted-foreground">Please read before using this service</p>
                  </div>
                </div>

                <div className="space-y-6 text-sm leading-relaxed">
                  <section className="space-y-3">
                    <h3 className="font-semibold text-base">Purpose</h3>
                    <p className="text-muted-foreground">
                      CivAccount is a free tool designed to help UK residents understand how their
                      local councils spend money. We present publicly available government data in
                      an accessible format.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h3 className="font-semibold text-base">Data accuracy</h3>
                    <p className="text-muted-foreground">
                      We take care to present accurate data, but we cannot guarantee it is error-free.
                      All data comes from official UK government sources, which may contain errors or
                      become outdated. For official figures, always refer to your council&apos;s website
                      or GOV.UK.
                    </p>
                    <p className="text-muted-foreground">
                      If you spot an error, please let us know via GitHub so we can correct it.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h3 className="font-semibold text-base">Not financial advice</h3>
                    <p className="text-muted-foreground">
                      CivAccount provides information only. Nothing on this site constitutes financial,
                      legal, or tax advice. For questions about your council tax bill, contact your
                      local council directly.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h3 className="font-semibold text-base">Limitation of liability</h3>
                    <p className="text-muted-foreground">
                      CivAccount is provided &quot;as is&quot; without warranty of any kind. We are not
                      liable for any decisions you make based on data shown on this site. Use the
                      information at your own discretion.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h3 className="font-semibold text-base">Acceptable use</h3>
                    <p className="text-muted-foreground">
                      You may use CivAccount for personal, educational, journalistic, or research
                      purposes. You may not use automated systems to scrape data at high volume
                      or in ways that degrade the service for others.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h3 className="font-semibold text-base">Changes to these terms</h3>
                    <p className="text-muted-foreground">
                      We may update these terms from time to time. Continued use of CivAccount
                      after changes constitutes acceptance of the new terms.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h3 className="font-semibold text-base">Open source</h3>
                    <p className="text-muted-foreground">
                      CivAccount is open source software. See our{' '}
                      <Link href="/license" className="text-primary hover:underline">
                        license page
                      </Link>
                      {' '}for details about the code license and how you can contribute.
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
