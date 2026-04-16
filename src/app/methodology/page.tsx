'use client';

import { useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  AlertCircle,
  Database,
  Bot,
  Calculator,
  CheckCircle,
  ExternalLink,
  FileText,
  Scale,
  Info,
  Shield,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PageContainer } from '@/components/ui/page-container';
import { COVERAGE_STATS, VALIDATION_SUMMARY } from '@/data/coverage-stats';
import { DATA_YEARS } from '@/lib/data-years';

export default function MethodologyPage() {
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
              {/* Page Header */}
              <div className="space-y-3">
                <Badge variant="outline" className="mb-2">Transparency</Badge>
                <h1 className="type-title-1 font-semibold">Methodology</h1>
                <p className="text-muted-foreground">
                  How we collect, process, and present council data
                </p>
              </div>

              {/* Independence Notice - Prominent at top */}
              <div className="p-5 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-foreground" />
                  <div className="type-body-sm">
                    <p className="font-semibold text-foreground mb-2">
                      This is an independent project
                    </p>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      CivAccount is not an official government service. It is not connected to any UK council,
                      the Ministry of Housing, Communities and Local Government, or any other government body.
                    </p>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      This website does not represent council policy or decisions. It exists to help people
                      understand publicly available information about council finances.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      For official information, visit{' '}
                      <a
                        href="https://www.gov.uk/find-local-council"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground underline hover:text-foreground/80 transition-colors"
                      >
                        GOV.UK
                        <span className="sr-only"> (opens in new tab)</span>
                      </a>{' '}
                      or your council&apos;s website.
                    </p>
                  </div>
                </div>
              </div>

              {/* How AI is used - Required section */}
              <div className="card-elevated p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Bot className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="type-title-3 font-semibold">How AI is used in this project</h2>
                    <p className="type-body-sm text-muted-foreground">AI helps organise data, not create it</p>
                  </div>
                </div>

                <div className="space-y-4 type-body-sm leading-relaxed">
                  <p className="text-muted-foreground">
                    AI tools were used to help build this website. Here is exactly how:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Database className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Finding data</p>
                        <p className="text-muted-foreground">
                          AI helped locate relevant government datasets and official council documents.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Reading documents</p>
                        <p className="text-muted-foreground">
                          AI helped extract figures from published budget documents and spreadsheets.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Calculator className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Calculations</p>
                        <p className="text-muted-foreground">
                          AI helped with maths like working out percentages and per-person amounts from published totals.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Scale className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Writing code</p>
                        <p className="text-muted-foreground">
                          AI helped write the website code and design the charts and layouts.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50 mt-4">
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">AI is used to make complex public information easier to understand,
                      not to replace official data or decision-making.</strong>
                    </p>
                    <p className="text-muted-foreground mt-2">
                      AI does not invent figures, predict outcomes, or make decisions. All numbers shown on this
                      website come from official published sources.
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Sources */}
              <div className="card-elevated p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Database className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="type-title-3 font-semibold">Data sources</h2>
                    <p className="type-body-sm text-muted-foreground">Where we get our numbers and descriptions</p>
                  </div>
                </div>

                <div className="space-y-4 type-body-sm">
                  <p className="text-muted-foreground leading-relaxed">
                    Every figure on CivAccount (council tax amounts, budgets, salaries, grants, supplier payments)
                    comes from official UK government websites. We do not create, estimate, or model any financial data.
                  </p>

                  <p className="text-muted-foreground leading-relaxed">
                    Service descriptions for suppliers and grant recipients are editorial summaries written by us
                    to help you understand what the money pays for. These are based on published council documents,
                    grant award records, and publicly available information from provider websites.
                    They are not official government text.
                  </p>

                  <div className="space-y-3">
                    <a
                      href="https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 border border-border/50 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium">Council Tax Levels 2025-26</p>
                        <p className="text-muted-foreground mt-1">Ministry of Housing, Communities and Local Government</p>
                      </div>
                    </a>

                    <a
                      href="https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 border border-border/50 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium">Local Authority Revenue Expenditure</p>
                        <p className="text-muted-foreground mt-1">Budget data from Revenue Outturn (RO) returns</p>
                      </div>
                    </a>

                    <a
                      href="https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 border border-border/50 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium">Population Estimates</p>
                        <p className="text-muted-foreground mt-1">Office for National Statistics (ONS) Mid-2024 Estimates</p>
                      </div>
                    </a>

                    <a
                      href="https://www.gov.uk/find-local-council"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 border border-border/50 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium">Individual Council Websites</p>
                        <p className="text-muted-foreground mt-1">For detailed budget documents and leadership information</p>
                      </div>
                    </a>
                  </div>
                </div>
              </div>

              {/* Data Licensing */}
              <div className="card-elevated p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Scale className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="type-title-3 font-semibold">Data licensing</h2>
                    <p className="type-body-sm text-muted-foreground">Public data, freely reusable</p>
                  </div>
                </div>

                <div className="space-y-4 type-body-sm leading-relaxed">
                  <p className="text-muted-foreground">
                    All government data used on this website is published under the{' '}
                    <a
                      href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground underline hover:text-foreground/80 transition-colors"
                    >
                      Open Government Licence v3.0
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>.
                  </p>

                  <p className="text-muted-foreground">
                    This licence allows anyone to copy, publish, distribute, and adapt the data for any purpose,
                    including commercial use. The only requirement is to acknowledge the source.
                  </p>

                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="font-medium text-foreground mb-2">We acknowledge:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Ministry of Housing, Communities and Local Government</li>
                      <li>• Office for National Statistics</li>
                      <li>• Individual council transparency publications</li>
                    </ul>
                    <p className="text-muted-foreground mt-3">
                      Contains public sector information licensed under the Open Government Licence v3.0.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="font-medium text-foreground mb-2">What is and is not OGL-covered:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• <span className="font-medium text-foreground">OGL-covered:</span> Council tax amounts, budget figures, salary data, grant amounts, supplier payments, councillor allowances, performance metrics</li>
                      <li>• <span className="font-medium text-foreground">Not OGL-covered:</span> Service descriptions for suppliers and grant recipients are our editorial summaries to help you understand what the money pays for</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Understanding the data */}
              <div className="card-elevated p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Info className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="type-title-3 font-semibold">Understanding the data</h2>
                    <p className="type-body-sm text-muted-foreground">What the different types of numbers mean</p>
                  </div>
                </div>

                <div className="space-y-4 type-body-sm leading-relaxed">
                  <p className="text-muted-foreground">
                    This website shows three types of numbers. Each is clearly labelled:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 rounded-lg border border-border/50">
                      <Badge variant="outline" className="shrink-0 mt-0.5 bg-navy-50 text-navy-600 border-navy-200 dark:bg-navy-950/30 dark:text-navy-400 dark:border-navy-800">
                        Published data
                      </Badge>
                      <div>
                        <p className="text-muted-foreground">
                          Numbers taken directly from government sources without any changes.
                          Examples: Band D council tax rates, total budget amounts.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-lg border border-border/50">
                      <Badge variant="outline" className="shrink-0 mt-0.5">
                        Calculated
                      </Badge>
                      <div>
                        <p className="text-muted-foreground">
                          Numbers we work out from published data using simple maths.
                          Examples: Council tax for bands A-H (calculated from Band D using official ratios),
                          percentage breakdown of spending, per-person amounts.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-lg border border-border/50">
                      <Badge variant="outline" className="shrink-0 mt-0.5 bg-muted text-muted-foreground">
                        Comparison
                      </Badge>
                      <div>
                        <p className="text-muted-foreground">
                          Numbers that compare one council to others or to averages.
                          Examples: &quot;£50 above average&quot;, &quot;Ranked 5th highest&quot;.
                          These help you understand context but are not official figures.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-lg border border-border/50">
                      <Badge variant="outline" className="shrink-0 mt-0.5 bg-muted text-muted-foreground">
                        Editorial summary
                      </Badge>
                      <div>
                        <p className="text-muted-foreground">
                          Descriptions written by CivAccount to explain what a supplier does or
                          what a grant pays for. Based on published information but not official
                          government text.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-muted-foreground mt-4">
                    We never estimate, predict, or model future figures. All data reflects what has been
                    officially published.
                  </p>
                </div>
              </div>

              {/* Data Coverage & Validation */}
              <div className="card-elevated p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="type-title-3 font-semibold">Data coverage</h2>
                    <p className="type-body-sm text-muted-foreground">
                      How complete our data is across {VALIDATION_SUMMARY.totalCouncils} councils
                    </p>
                  </div>
                </div>

                {/* Validation health summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-muted/30 text-center">
                    <p className="type-metric font-semibold tabular-nums">{VALIDATION_SUMMARY.parityAverage}%</p>
                    <p className="type-caption text-muted-foreground">Data parity</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 text-center">
                    <p className="type-metric font-semibold tabular-nums">{VALIDATION_SUMMARY.totalCouncils}</p>
                    <p className="type-caption text-muted-foreground">Councils</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 text-center">
                    <p className="type-metric font-semibold tabular-nums">{VALIDATION_SUMMARY.totalChecks.toLocaleString('en-GB')}</p>
                    <p className="type-caption text-muted-foreground">Checks run</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 text-center">
                    <p className="type-metric font-semibold tabular-nums">{VALIDATION_SUMMARY.regressions}</p>
                    <p className="type-caption text-muted-foreground">Regressions</p>
                  </div>
                </div>

                {/* Per-dataset coverage */}
                <div className="space-y-2">
                  {Object.entries(COVERAGE_STATS).map(([key, stat]) => {
                    const pct = stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0;
                    const dataYear = DATA_YEARS[key as keyof typeof DATA_YEARS];
                    return (
                      <div key={key} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="type-body-sm font-medium">{stat.label}</p>
                          <p className="type-caption text-muted-foreground">
                            {stat.present}/{stat.total} councils
                            {dataYear && <span> · {dataYear}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-foreground"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="type-caption tabular-nums text-muted-foreground w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="type-caption text-muted-foreground mt-4">
                  Last validated: {VALIDATION_SUMMARY.timestamp} · Automated checks run on every code change and monthly against live GOV.UK data
                </p>
              </div>

              {/* Limitations */}
              <div className="card-elevated p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="type-title-3 font-semibold">Limitations</h2>
                    <p className="type-body-sm text-muted-foreground">What this website cannot do</p>
                  </div>
                </div>

                <div className="space-y-3 type-body-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground">•</span>
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Not real-time:</strong> Data is updated when new official figures are published,
                      typically once per year for council tax and budgets.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground">•</span>
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Not your exact bill:</strong> Your actual council tax depends on your property band
                      and any discounts or exemptions. Use this as a guide, not as your bill.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground">•</span>
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">May contain errors:</strong> We take care to present accurate data, but mistakes can happen.
                      For official figures, always check your council&apos;s website or GOV.UK.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground">•</span>
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Not advice:</strong> This website provides information only. It is not financial,
                      legal, or tax advice.
                    </p>
                  </div>
                </div>
              </div>

              {/* Transparency Checklist */}
              <div className="p-6 rounded-xl bg-muted/50 border border-border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  Transparency checklist
                </h3>
                <div className="space-y-2 type-body-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-positive shrink-0" />
                    <span className="text-muted-foreground">Data sources disclosed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-positive shrink-0" />
                    <span className="text-muted-foreground">Data licensing disclosed (Open Government Licence v3.0)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-positive shrink-0" />
                    <span className="text-muted-foreground">AI use disclosed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-positive shrink-0" />
                    <span className="text-muted-foreground">Calculations and comparisons clearly labelled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-positive shrink-0" />
                    <span className="text-muted-foreground">Independence and non-official status stated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-positive shrink-0" />
                    <span className="text-muted-foreground">Automated validation against GOV.UK source files (monthly)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-positive shrink-0" />
                    <span className="text-muted-foreground">Every data point tappable to see its exact source</span>
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Questions about how we handle data?
                </p>
                <a
                  href="https://github.com/wulfsagedev/civaccount/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 bg-muted hover:bg-muted/80 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  Ask on GitHub
                  <ExternalLink className="h-4 w-4 ml-2" />
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              </div>
            </div>
      </PageContainer>

      <Footer />
    </div>
  );
}
