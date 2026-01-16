'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const VERSION = "1.2";

const updates = [
  {
    version: "1.2",
    date: "January 2025",
    isCurrent: true,
    changes: [
      "Added all 324 councils in England",
      "New council search and filter system",
      "Compare councils by type and national averages",
      "Council tax calculator for all bands (A-H)",
      "Detailed precept breakdown showing district, county, police and fire contributions",
      "Council-specific verified data sources with direct links",
      "Feedback button for feature requests and bug reports",
      "Dark mode syncs with system settings automatically",
      "Modernised UI with consistent card styling",
      "Improved visual hierarchy and cleaner design"
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
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-3 py-6 sm:px-6 sm:py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold">What&apos;s New in CivAccount</h1>
            <p className="text-muted-foreground">
              We keep making this tool better. Here is what has changed.
            </p>
          </div>

          {/* Current Version Highlight */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-xl">Version {VERSION}</CardTitle>
                  <p className="text-sm text-muted-foreground">Released January 2025</p>
                </div>
                <Badge variant="default" className="ml-auto">You have this version</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                The latest version includes data for all 324 councils in England with detailed breakdowns.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {updates[0].changes.map((change, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>{change}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Version History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Previous Versions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {updates.slice(1).map((update, index) => (
                  <div
                    key={update.version}
                    className={`relative pl-6 ${index !== updates.length - 2 ? 'pb-6 border-l-2 border-muted ml-2' : 'ml-2'}`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-muted" />

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Version {update.version}</span>
                        <span className="text-xs text-muted-foreground">{update.date}</span>
                      </div>
                      <ul className="space-y-1">
                        {update.changes.map((change, changeIndex) => (
                          <li key={changeIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-muted-foreground mt-0.5">•</span>
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Info about data */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground text-center">
                CivAccount uses data from official UK government sources.
                We update the data when new information is published.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
