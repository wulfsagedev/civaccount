'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Circle } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface RoadmapSection {
  title: string;
  status: 'done' | 'now' | 'next';
  items: { text: string; done: boolean }[];
}

const roadmap: RoadmapSection[] = [
  {
    title: "Done",
    status: "done",
    items: [
      { text: "All 317 English councils with budget data", done: true },
      { text: "Council tax rates and 5-year history", done: true },
      { text: "Service spending breakdowns", done: true },
      { text: "Fast search across all councils", done: true },
      { text: "Mobile-first design with dark mode", done: true },
      { text: "Fair comparisons between similar councils", done: true },
    ]
  },
  {
    title: "Working on",
    status: "now",
    items: [
      { text: "Police, fire, and parish council tax breakdown", done: false },
      { text: "Links to original council budget documents", done: false },
      { text: "Data freshness indicators", done: false },
    ]
  },
  {
    title: "Up next",
    status: "next",
    items: [
      { text: "Scotland, Wales, and Northern Ireland councils", done: false },
      { text: "Value for money insights", done: false },
      { text: "Council leadership and election info", done: false },
    ]
  }
];

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main id="main-content" className="flex-1">
        <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 max-w-3xl">
          {/* Back link */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 -ml-2 cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-10">
            <h1 className="type-title-1 mb-2">Roadmap</h1>
            <p className="type-body text-muted-foreground">
              What we have built, what we are working on, and what comes next.
            </p>
          </div>

          {/* Roadmap sections */}
          <div className="space-y-8">
            {roadmap.map((section) => (
              <section key={section.title} className="card-elevated p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="type-title-2">{section.title}</h2>
                  {section.status === 'done' && (
                    <Badge variant="outline" className="text-xs bg-navy-50 text-navy-600 border-navy-200 dark:bg-navy-950/30 dark:text-navy-400 dark:border-navy-800">
                      Complete
                    </Badge>
                  )}
                  {section.status === 'now' && (
                    <Badge variant="outline" className="text-xs bg-muted text-foreground border-border">
                      In progress
                    </Badge>
                  )}
                </div>

                <ul className="space-y-3">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      {item.done ? (
                        <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-positive" aria-hidden="true" />
                      ) : (
                        <Circle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      )}
                      <span className={`type-body-sm ${item.done ? 'text-muted-foreground' : ''}`}>
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* Feedback CTA */}
          <section className="mt-8 p-5 sm:p-6 rounded-xl bg-muted/30 border border-border/50">
            <h3 className="type-title-3 mb-2">Have a suggestion?</h3>
            <p className="type-body-sm text-muted-foreground mb-4">
              We are building this for you. Tell us what would make CivAccount more useful.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.dispatchEvent(new CustomEvent('open-feedback'))}
              className="cursor-pointer"
            >
              Send feedback
            </Button>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
