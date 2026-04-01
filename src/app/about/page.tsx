'use client';

import { useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { FileText, Lightbulb, Clock, Database, MessageCircle, Scale, ExternalLink, CheckCircle, Info } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AboutPage() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main id="main-content" className="flex-1">
        <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 max-w-7xl">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="text-center mb-10 sm:mb-12">
              <Badge variant="outline" className="mb-4">About</Badge>
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">Why we built CivAccount</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Making UK council budget data accessible to everyone
              </p>
            </div>

            {/* The Problem */}
            <div className="card-elevated p-6 sm:p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <h2 className="type-title-2">The problem</h2>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every year, UK councils publish their budget information. This data shows how much money they receive,
                  how they spend it, and what your council tax pays for. It is public information that belongs to everyone.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  However, this data is often:
                </p>
                <ul className="space-y-3">
                  {[
                    'Scattered across different government websites and council pages',
                    'Hidden in PDF documents, spreadsheets, and technical reports',
                    'Written in technical language that is hard to understand',
                    'Formatted differently by each council, making comparisons difficult',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-stone-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Most people do not have time to search through government websites, download spreadsheets,
                  and work out what the numbers mean. This information gap means residents often do not know
                  how their council spends money or how their council tax compares to other areas.
                </p>
              </div>
            </div>

            {/* Our Solution */}
            <div className="card-elevated p-6 sm:p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-muted-foreground" />
                </div>
                <h2 className="type-title-2">What CivAccount does</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                CivAccount brings together official UK government data into one place. We take the raw data
                and present it in a way that is easy to understand.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-muted/30 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center mb-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2">Save time</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Find your council in seconds instead of searching through government websites
                  </p>
                </div>
                <div className="p-5 bg-muted/30 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center mb-3">
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2">All in one place</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Budget data, council tax rates, and service spending for 317 English councils
                  </p>
                </div>
                <div className="p-5 bg-muted/30 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center mb-3">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2">Easy to understand</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Plain language explanations of what your council does and where money goes
                  </p>
                </div>
                <div className="p-5 bg-muted/30 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center mb-3">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2">Compare councils</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    See how your council tax compares to similar councils across the country
                  </p>
                </div>
              </div>
            </div>

            {/* Data Sources */}
            <div className="card-elevated p-6 sm:p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Database className="h-5 w-5 text-muted-foreground" />
                </div>
                <h2 className="type-title-2">Where our data comes from</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                All data on CivAccount comes from official UK government sources. We do not create or estimate figures.
              </p>
              <div className="space-y-4">
                <a
                  href="https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 border border-border/50 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Council Tax Levels 2025-26</p>
                    <p className="text-sm text-muted-foreground mt-1">Ministry of Housing, Communities and Local Government</p>
                  </div>
                </a>
                <a
                  href="https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 border border-border/50 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Local Authority Revenue Expenditure</p>
                    <p className="text-sm text-muted-foreground mt-1">Ministry of Housing, Communities and Local Government</p>
                  </div>
                </a>
                <a
                  href="https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 border border-border/50 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Population Estimates</p>
                    <p className="text-sm text-muted-foreground mt-1">Office for National Statistics</p>
                  </div>
                </a>
              </div>
              <p className="text-sm text-muted-foreground mt-6 leading-relaxed">
                Data is updated when new official figures are published. Current data covers the 2025-26 financial year.
              </p>
              <div className="mt-4 p-4 rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Open data:</strong> All government data is published under the{' '}
                  <a
                    href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline hover:text-foreground/80 transition-colors"
                  >
                    Open Government Licence v3.0
                  </a>
                  , which allows free reuse and visualisation.
                </p>
              </div>
            </div>

            {/* Important Notes */}
            <div className="p-6 rounded-xl bg-muted/50 border border-border/50 mb-8">
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Info className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">About the council tax figures</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      The council tax amounts shown are for each council only. Your total bill will also include charges from police, fire services, and other bodies. This helps you see exactly what each council charges.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">About this website</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      CivAccount is an independent project. It is not connected to any council or government body and does not represent council policy. We take public data and make it easier to read. For official information, check your council&apos;s website or GOV.UK.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">How we use AI</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      AI tools help us gather data from official sources, structure information, and build visualisations. AI is a supporting tool, not a source of truth. All figures come from published government data.{' '}
                      <Link href="/methodology" className="text-foreground underline hover:text-foreground/80 transition-colors">
                        Read our methodology
                      </Link>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-8 py-4 bg-foreground text-background rounded-xl font-semibold hover:bg-foreground/90 transition-colors cursor-pointer"
              >
                Find your council
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
