'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search, Clock, Database, Users, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-3 py-8 sm:px-6 max-w-4xl">
          {/* Page Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Why We Built CivAccount</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Making UK council budget data accessible to everyone
            </p>
          </div>

          {/* The Problem */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-primary" />
                The Problem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Every year, UK councils publish their budget information. This data shows how much money they receive,
                how they spend it, and what your council tax pays for. It is public information that belongs to everyone.
              </p>
              <p className="text-muted-foreground">
                However, this data is often:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Scattered across different government websites and council pages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Hidden in PDF documents, spreadsheets, and technical reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Written in technical language that is hard to understand</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Formatted differently by each council, making comparisons difficult</span>
                </li>
              </ul>
              <p className="text-muted-foreground">
                Most people do not have time to search through government websites, download spreadsheets,
                and work out what the numbers mean. This information gap means residents often do not know
                how their council spends money or how their council tax compares to other areas.
              </p>
            </CardContent>
          </Card>

          {/* Our Solution */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Search className="h-5 w-5 text-primary" />
                What CivAccount Does
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                CivAccount brings together official UK government data into one place. We take the raw data
                and present it in a way that is easy to understand.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-muted rounded-lg">
                  <Clock className="h-5 w-5 text-primary mb-2" />
                  <h4 className="font-semibold mb-1">Save Time</h4>
                  <p className="text-sm text-muted-foreground">
                    Find your council in seconds instead of searching through government websites
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <Database className="h-5 w-5 text-primary mb-2" />
                  <h4 className="font-semibold mb-1">All In One Place</h4>
                  <p className="text-sm text-muted-foreground">
                    Budget data, council tax rates, and service spending for all English councils
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <Users className="h-5 w-5 text-primary mb-2" />
                  <h4 className="font-semibold mb-1">Easy to Understand</h4>
                  <p className="text-sm text-muted-foreground">
                    Plain language explanations of what your council does and where money goes
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <Search className="h-5 w-5 text-primary mb-2" />
                  <h4 className="font-semibold mb-1">Compare Councils</h4>
                  <p className="text-sm text-muted-foreground">
                    See how your council tax compares to similar councils across the country
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Database className="h-5 w-5 text-primary" />
                Where Our Data Comes From
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                All data on CivAccount comes from official UK government sources. We do not create or estimate figures.
              </p>
              <div className="space-y-3">
                <a
                  href="https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Council Tax Levels 2025-26</p>
                    <p className="text-xs text-muted-foreground">Department for Levelling Up, Housing and Communities</p>
                  </div>
                </a>
                <a
                  href="https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Local Authority Revenue Expenditure</p>
                    <p className="text-xs text-muted-foreground">Department for Levelling Up, Housing and Communities</p>
                  </div>
                </a>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Data is updated when new official figures are published. Current data covers the 2025-26 financial year.
              </p>
            </CardContent>
          </Card>

          {/* Important Note */}
          <Card className="border-dashed">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground text-center">
                CivAccount is an independent project and is not affiliated with any government body.
                We simply present publicly available data in a more accessible format.
                For official information, always refer to your council&apos;s website or gov.uk.
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center mt-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Find Your Council
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
