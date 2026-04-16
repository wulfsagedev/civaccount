'use client';

import { useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Sparkles, CheckCircle, ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PageContainer } from '@/components/ui/page-container';

const VERSION = "3.0";

const updates = [
  {
    version: "3.0",
    date: "April 2026",
    isCurrent: true,
    changes: [
      "Town Hall — have your say on how your council spends money",
      "Vote and comment on ideas from other residents",
      "Milestone progress bars on proposals (25 and 100 vote thresholds)",
      "Redesigned Town Hall homepage with product preview and postcode search",
      "Budget context shown on every proposal detail page",
      "Cabinet members and leadership for all 317 English councils",
      "Chief executive salary data for 99% of councils",
      "Councillor basic allowance data for 96% of councils",
      "Top suppliers and grant payments for 95% of councils",
      "Compare any two councils side by side with cross-links to budgets and Town Hall",
      "Embeddable Town Hall widgets you can share anywhere",
      "Performance data covering roads, waste, housing, and more",
      "Full design system audit — all typography, colours, and accessibility standards enforced",
      "Dashboard split into 10 focused components for faster page loads",
      "All interactive elements meet 44px minimum tap target for mobile",
    ]
  },
  {
    version: "2.0",
    date: "March 2026",
    isCurrent: false,
    changes: [
      "See who leads your London borough — every cabinet member and their role",
      "Latest Ofsted ratings for children's services across all 33 London boroughs",
      "See which local charities and community groups your council funds",
      "Staff salary bands for every London borough",
      "What your elected councillors are paid in allowances",
      "Direct links to council budget documents, meetings, and open data"
    ]
  },
  {
    version: "1.8",
    date: "February 2026",
    isCurrent: false,
    changes: [
      "Kent County Council now has the richest data on the site",
      "Detailed descriptions for all 15 KCC grant recipients",
      "Detailed descriptions for all 20 KCC top suppliers",
      "Tap any supplier or grant to see exactly what the money pays for",
      "Council data split into separate files for faster loading",
      "Bigger, clearer text for supplier and grant names",
      "All descriptions sourced from official records and charity registers"
    ]
  },
  {
    version: "1.6",
    date: "January 2026",
    isCurrent: false,
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
      "Now covers all 317 councils in England",
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

      <PageContainer className="py-8 sm:py-12">
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
              <h1 className="type-title-1 font-semibold">What&apos;s new in CivAccount</h1>
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
                    <Badge variant="outline" className="type-overline bg-navy-50 text-navy-600 border-navy-200 dark:bg-navy-950/30 dark:text-navy-400 dark:border-navy-800">
                      Current
                    </Badge>
                  </div>
                  <p className="type-body-sm text-muted-foreground mt-1">Released April 2026</p>
                </div>
              </div>

              <p className="type-body-sm text-muted-foreground mb-6 leading-relaxed">
                Now you can have your say. Propose how your council should spend money, vote on ideas from other residents, and join the discussion. Plus, all 317 councils now have detailed leadership, salary, and spending data.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {updates[0].changes.map((change, index) => (
                  <div key={index} className="flex items-start gap-3 type-body-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
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
                        <span className="type-body-sm text-muted-foreground">{update.date}</span>
                      </div>
                      <ul className="space-y-2">
                        {update.changes.map((change, changeIndex) => (
                          <li key={changeIndex} className="type-body-sm text-muted-foreground flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
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
                <p className="type-body-sm text-muted-foreground leading-relaxed">
                  CivAccount uses data from official UK government sources.
                  We update the data when new information is published.
                </p>
              </div>
            </div>
          </div>
      </PageContainer>

      <Footer />
    </div>
  );
}
