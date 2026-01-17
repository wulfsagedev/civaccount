'use client';

import { useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Sparkles, CheckCircle, ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const VERSION = "1.4";

const updates = [
  {
    version: "1.4",
    date: "January 2025",
    isCurrent: true,
    changes: [
      "New design system with muted, earthy colour palette",
      "WCAG 2.1 AA accessibility compliance",
      "Linear-style dark mode with layered elevation",
      "Skip links and keyboard navigation improvements",
      "New accessibility standards page",
      "Product roadmap page",
      "Insights page groups councils by type for fair comparisons",
      "Reduced motion and high contrast mode support"
    ]
  },
  {
    version: "1.2",
    date: "January 2025",
    isCurrent: false,
    changes: [
      "Added all 324 councils in England",
      "New council search and filter system",
      "Compare councils by type and national averages",
      "Council tax calculator for all bands (A-H)",
      "Detailed precept breakdown showing district, county, police and fire contributions",
      "Council-specific verified data sources with direct links",
      "Population data from ONS mid-2024 estimates for all councils",
      "Per-capita spending and efficiency metrics",
      "Administrative overhead comparisons across councils",
      "National Insights page with aggregate statistics",
      "Keyboard shortcut (F) to search from any page",
      "Feedback button for feature requests and bug reports",
      "Dark mode syncs with system settings automatically",
      "Modernised UI with consistent card styling"
    ]
  },
  {
    version: "1.1",
    date: "December 2024",
    isCurrent: false,
    changes: [
      "Added dark mode toggle",
      "Better mobile layout",
      "Better budget charts"
    ]
  },
  {
    version: "1.0",
    date: "November 2024",
    isCurrent: false,
    changes: [
      "First release",
      "Kent County Council data",
      "Basic budget breakdown",
      "Council tax information"
    ]
  }
];

export default function UpdatesPage() {
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
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Button>
            </Link>
          </div>

          <div className="space-y-8">
            <div className="text-center space-y-3">
              <Badge variant="outline" className="mb-2">Changelog</Badge>
              <h1 className="text-2xl sm:text-3xl font-bold">What&apos;s new in CivAccount</h1>
              <p className="text-muted-foreground">
                We keep making this tool better. Here is what has changed.
              </p>
            </div>

            {/* Current Version Highlight */}
            <div className="card-elevated p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">Version {VERSION}</h2>
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                      Current
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Released January 2025</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                The latest version includes data for all 324 councils in England with detailed breakdowns.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {updates[0].changes.map((change, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-stone-400" />
                    <span>{change}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Version History */}
            <div className="card-elevated p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <History className="h-5 w-5 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">Previous versions</h2>
              </div>

              <div className="space-y-8">
                {updates.slice(1).map((update, index) => (
                  <div
                    key={update.version}
                    className={`relative pl-8 ${index !== updates.length - 2 ? 'pb-8 border-l-2 border-muted ml-2' : 'ml-2'}`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-muted" />

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">Version {update.version}</span>
                        <span className="text-sm text-muted-foreground">{update.date}</span>
                      </div>
                      <ul className="space-y-2">
                        {update.changes.map((change, changeIndex) => (
                          <li key={changeIndex} className="text-sm text-muted-foreground flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-1.5 shrink-0" />
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info about data */}
            <div className="p-6 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  CivAccount uses data from official UK government sources.
                  We update the data when new information is published.
                </p>
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
