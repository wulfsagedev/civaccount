'use client';

import { useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Sparkles, CheckCircle, ArrowLeft, Info, Rss } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PageContainer } from '@/components/ui/page-container';
import { updates } from '@/data/updates';

const VERSION = updates[0].version;

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
                  <div className="flex items-center gap-3" id={`v${VERSION.replace(/\./g, '-')}`}>
                    <h2 className="type-title-2">Version {VERSION}</h2>
                    <Badge variant="outline" className="type-overline bg-navy-50 text-navy-600 border-navy-200 dark:bg-navy-950/30 dark:text-navy-400 dark:border-navy-800">
                      Current
                    </Badge>
                  </div>
                  <p className="type-body-sm text-muted-foreground mt-1">Released {updates[0].label}</p>
                </div>
              </div>

              <p className="type-body-sm text-muted-foreground mb-6 leading-relaxed">
                {updates[0].summary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {updates[0].changes.map((change, index) => (
                  <div key={index} className="flex items-start gap-3 type-body-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span>{change}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-border/50">
                <a
                  href="/updates/rss.xml"
                  className="inline-flex items-center gap-2 type-body-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Rss className="h-4 w-4" aria-hidden="true" />
                  Subscribe to the RSS feed
                  <span className="sr-only"> (opens RSS feed)</span>
                </a>
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
                    id={`v${update.version.replace(/\./g, '-')}`}
                    className={`relative pl-8 ${index !== updates.length - 2 ? 'pb-8 border-l-2 border-muted ml-2' : 'ml-2'}`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-muted" />

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">Version {update.version}</span>
                        <span className="type-body-sm text-muted-foreground">{update.label}</span>
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
