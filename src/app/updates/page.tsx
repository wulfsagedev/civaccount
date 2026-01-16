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

      <main className="flex-1 container mx-auto px-4 py-8 sm:px-6 sm:py-10 max-w-7xl">
        <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold">What&apos;s New in CivAccount</h1>
            <p className="text-muted-foreground">
              We keep making this tool better. Here is what has changed.
            </p>
          </div>

          {/* Current Version Highlight */}
          <Card className="border-2 border-primary rounded-xl">
            <CardHeader className="p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <Sparkles className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-xl">Version {VERSION}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Released January 2025</p>
                </div>
                <Badge variant="default" className="ml-auto">You have this version</Badge>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
              <p className="text-sm text-muted-foreground mb-5">
                The latest version includes data for all 324 councils in England with detailed breakdowns.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {updates[0].changes.map((change, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>{change}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Version History */}
          <Card className="rounded-xl">
            <CardHeader className="p-5 sm:p-6">
              <CardTitle className="flex items-center gap-3">
                <History className="h-5 w-5" />
                Previous Versions
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
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
                        <span className="text-xs text-muted-foreground">{update.date}</span>
                      </div>
                      <ul className="space-y-2">
                        {update.changes.map((change, changeIndex) => (
                          <li key={changeIndex} className="text-sm text-muted-foreground flex items-start gap-3">
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
          <Card className="border-dashed rounded-xl">
            <CardContent className="p-5 sm:p-6">
              <p className="text-sm text-muted-foreground text-center">
                CivAccount uses data from official UK government sources.
                We update the data when new information is published.
              </p>
            </CardContent>
          </Card>
        </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
