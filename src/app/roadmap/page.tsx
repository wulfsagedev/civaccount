'use client';

import { useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Database,
  CheckCircle,
  Circle,
  Clock,
  Link as LinkIcon,
  FileCheck,
  Users,
  BarChart3,
  Bell,
  Map,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface RoadmapItem {
  text: string;
  completed: boolean;
  description?: string;
}

interface RoadmapPhase {
  phase: string;
  title: string;
  status: 'completed' | 'in_progress' | 'planned';
  quarter: string;
  items: RoadmapItem[];
}

const roadmapItems: RoadmapPhase[] = [
  {
    phase: "Phase 1",
    title: "Foundation",
    status: "completed",
    quarter: "Q4 2024 - Q1 2025",
    items: [
      { text: "Launch with all 324 English councils", completed: true },
      { text: "Council tax data for 2025-26", completed: true },
      { text: "Basic budget breakdowns by service", completed: true },
      { text: "Search and filter functionality", completed: true },
      { text: "Mobile-responsive design", completed: true },
      { text: "Dark mode support", completed: true },
      { text: "WCAG 2.1 AA accessibility compliance", completed: true },
      { text: "Fair comparisons by council type", completed: true, description: "Insights page groups councils by comparable service scope" }
    ]
  },
  {
    phase: "Phase 2",
    title: "Data depth",
    status: "in_progress",
    quarter: "Q1 2025",
    items: [
      { text: "Individual council data sourcing", completed: false, description: "Link each data point to its original council source document" },
      { text: "Historical data (5 year trends)", completed: false, description: "Track council tax and spending changes over time" },
      { text: "Precept breakdowns for all councils", completed: false, description: "Show police, fire, and parish contributions everywhere" },
      { text: "Service-level detail from council websites", completed: false, description: "What each council actually provides to residents" },
      { text: "Data freshness indicators", completed: false, description: "Show when data was last verified and updated" }
    ]
  },
  {
    phase: "Phase 3",
    title: "Verification",
    status: "planned",
    quarter: "Q2 2025",
    items: [
      { text: "Direct links to source documents", completed: false, description: "Every figure links back to official council PDFs and spreadsheets" },
      { text: "Council budget document library", completed: false, description: "Archive of council Medium Term Financial Plans and budget reports" },
      { text: "Automated data validation", completed: false, description: "Cross-check figures against multiple sources" },
      { text: "Community corrections", completed: false, description: "Let residents flag potential data errors" },
      { text: "Data confidence scores", completed: false, description: "Show how reliable each data point is" }
    ]
  },
  {
    phase: "Phase 4",
    title: "Insights",
    status: "planned",
    quarter: "Q3 2025",
    items: [
      { text: "Council performance comparisons", completed: false, description: "Compare similar councils on key metrics" },
      { text: "Value for money analysis", completed: false, description: "What you get for your council tax compared to others" },
      { text: "Budget change alerts", completed: false, description: "Get notified when your council budget changes" },
      { text: "Election and leadership data", completed: false, description: "Who runs your council and when elections happen" },
      { text: "Local news integration", completed: false, description: "Relevant council news from local sources" }
    ]
  },
  {
    phase: "Phase 5",
    title: "Expansion",
    status: "planned",
    quarter: "2026",
    items: [
      { text: "Wales councils", completed: false, description: "Expand coverage to all Welsh local authorities" },
      { text: "Scotland councils", completed: false, description: "Include Scottish council data with different tax bands" },
      { text: "Northern Ireland councils", completed: false, description: "Cover NI district councils" },
      { text: "Parish and town councils", completed: false, description: "Include precept data for over 10,000 parish councils" },
      { text: "Combined authorities and mayors", completed: false, description: "Track spending by metro mayors and combined authorities" }
    ]
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
          Completed
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
          In progress
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">
          Planned
        </Badge>
      );
  }
};

const getPhaseIcon = (phase: string) => {
  switch (phase) {
    case 'Phase 1':
      return Database;
    case 'Phase 2':
      return FileCheck;
    case 'Phase 3':
      return LinkIcon;
    case 'Phase 4':
      return BarChart3;
    case 'Phase 5':
      return Map;
    default:
      return Circle;
  }
};

export default function RoadmapPage() {
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
              {/* Page Header */}
              <div className="text-center space-y-3">
                <Badge variant="outline" className="mb-2">Product roadmap</Badge>
                <h1 className="text-2xl sm:text-3xl font-bold">What we&apos;re building</h1>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Our focus is on data quality, verifiability, and making council information
                  as trustworthy as possible.
                </p>
              </div>

              {/* Current Focus */}
              <div className="card-elevated p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold">Current focus</h2>
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                        Q1 2025
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Data depth and individual council sourcing</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Right now, most of our data comes from central government sources like GOV.UK and the ONS.
                  While this is accurate, it doesn&apos;t always reflect the full picture. Our next priority is
                  sourcing data directly from each council&apos;s own budget documents, so you can trace every
                  figure back to its origin.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
                    <LinkIcon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Source linking</p>
                      <p className="text-sm text-muted-foreground">Every number links to where it came from</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
                    <Clock className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Historical trends</p>
                      <p className="text-sm text-muted-foreground">See how your council has changed over time</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
                    <FileCheck className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Council documents</p>
                      <p className="text-sm text-muted-foreground">Access actual budget reports and plans</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
                    <Users className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Community input</p>
                      <p className="text-sm text-muted-foreground">Help us improve data accuracy</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-6">
                {roadmapItems.map((phase, phaseIndex) => {
                  const PhaseIcon = getPhaseIcon(phase.phase);
                  const isCompleted = phase.status === 'completed';
                  const isInProgress = phase.status === 'in_progress';

                  return (
                    <div key={phase.phase} className="card-elevated p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isCompleted
                              ? 'bg-emerald-50 dark:bg-emerald-950/30'
                              : isInProgress
                                ? 'bg-amber-50 dark:bg-amber-950/30'
                                : 'bg-muted'
                          }`}>
                            <PhaseIcon className={`h-5 w-5 ${
                              isCompleted
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isInProgress
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-muted-foreground'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{phase.phase}: {phase.title}</h3>
                              {getStatusBadge(phase.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{phase.quarter}</p>
                          </div>
                        </div>
                      </div>

                      <ul className="space-y-3">
                        {phase.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-3">
                            {item.completed ? (
                              <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Circle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                            )}
                            <div>
                              <span className={`text-sm ${item.completed ? 'text-muted-foreground' : ''}`}>
                                {item.text}
                              </span>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* Feedback CTA */}
              <div className="p-6 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex gap-4">
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">
                      Have a suggestion?
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      We&apos;re building this for you. If there&apos;s something you&apos;d like to see,
                      or you have ideas for improving data quality, we&apos;d love to hear from you.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.dispatchEvent(new CustomEvent('open-feedback'))}
                      className="cursor-pointer"
                    >
                      Send feedback
                    </Button>
                  </div>
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
