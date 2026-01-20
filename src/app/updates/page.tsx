'use client';

import { useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Sparkles, CheckCircle, ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const VERSION = "1.6";

const updates = [
  {
    version: "1.6",
    date: "January 2026",
    isCurrent: true,
    changes: [
      "New animated landing page with floating £ blocks",
      "Lightning-fast search to find your council instantly",
      "20 county councils now have detailed budget breakdowns",
      "All data linked to official government sources",
      "Contribute button to support CivAccount development",
      "Better mobile navigation",
      "Press F to search from any page"
    ]
  },
  {
    version: "1.4",
    date: "January 2026",
    isCurrent: false,
    changes: [
      "Sticky navigation bar follows you as you scroll",
      "Quick access to all pages from the floating menu",
      "Cleaner, easier to read dashboard",
      "Better dark mode for easier reading",
      "Works better with screen readers and keyboards",
      "Insights page groups similar councils for fairer comparisons"
    ]
  },
  {
    version: "1.2",
    date: "January 2026",
    isCurrent: false,
    changes: [
      "Now covers all 324 councils in England",
      "Search to find your council quickly",
      "See council tax for all bands (A to H)",
      "See where your council tax goes (district, county, police, fire)",
      "Links to official council websites",
      "Compare your council to similar councils",
      "National insights with averages across England"
    ]
  },
  {
    version: "1.0",
    date: "December 2025",
    isCurrent: false,
    changes: [
      "First release with Kent County Council",
      "Council tax and budget breakdown",
      "Dark mode",
      "Works on phones and tablets"
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
            <div className="card-elevated p-6 sm:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="type-title-2">Version {VERSION}</h2>
                    <Badge variant="outline" className="text-xs bg-navy-50 text-navy-600 border-navy-200 dark:bg-navy-950/30 dark:text-navy-400 dark:border-navy-800">
                      Current
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Released January 2026</p>
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
            <div className="card-elevated p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <History className="h-5 w-5 text-muted-foreground" />
                </div>
                <h2 className="type-title-2">Previous versions</h2>
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
