'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, ShieldAlert, ShieldQuestion, ExternalLink, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PageContainer } from '@/components/ui/page-container';

/**
 * /data-validation — public-facing page explaining:
 *   1. The integrity rule (every number traces to a public opengov document).
 *   2. The process we follow (scrape → archive → extract → verify → render).
 *   3. Current validation status per category of data.
 *   4. How to spot-check a number yourself.
 *   5. Link to the public source-archive repo.
 *
 * This page is the destination every `DataValidationNotice` points at.
 * Keep the copy honest about what's verified and what's in progress — the
 * point of the page is transparency, not reassurance.
 */
export default function DataValidationPage() {
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

        <div className="space-y-10">
          {/* Header */}
          <div className="space-y-3">
            <Badge variant="outline" className="mb-2">Integrity</Badge>
            <h1 className="type-title-1 font-semibold">Data validation</h1>
            <p className="type-body-lg text-muted-foreground">
              Every number on CivAccount must trace to a .gov.uk, ONS or open-government document.
              In a few clicks you should be able to open the document and find the number yourself.
            </p>
          </div>

          {/* The rule */}
          <section className="space-y-3">
            <h2 className="type-title-2">The rule</h2>
            <p className="type-body text-muted-foreground">
              Zero hallucination. Zero estimation. Zero algorithms to guess or fill gaps.
              If a figure cannot be traced to a specific row, cell or page of a public
              government document, it does not render.
            </p>
            <p className="type-body text-muted-foreground">
              Where a value is currently live on the site but still working towards that
              bar, you&apos;ll see a &ldquo;Data validation in progress&rdquo; notice next to it.
              The notice points at the source we do have, so you can verify the direction
              while we wire the row-level citation.
            </p>
          </section>

          {/* How verification works */}
          <section className="space-y-3">
            <h2 className="type-title-2">How verification works</h2>
            <ol className="space-y-4">
              <li className="p-4 rounded-lg bg-muted/30 border border-border/40">
                <p className="type-body-sm font-semibold mb-1">1. Scrape from the canonical source</p>
                <p className="type-body-sm text-muted-foreground">
                  Each data category has a canonical publisher — MHCLG for council tax and revenue
                  outturn, ONS for population, DEFRA for waste, DfT for roads, Ofsted for children&apos;s
                  services, LGBCE for councillors, each council&apos;s own transparency pages for
                  leadership and local spend. We scrape directly from those publishers.
                </p>
              </li>
              <li className="p-4 rounded-lg bg-muted/30 border border-border/40">
                <p className="type-body-sm font-semibold mb-1">2. Archive the raw file</p>
                <p className="type-body-sm text-muted-foreground">
                  Every source file is preserved with its fetch date, so citations don&apos;t
                  rot when a government site reorganises. The archive is public (see below).
                </p>
              </li>
              <li className="p-4 rounded-lg bg-muted/30 border border-border/40">
                <p className="type-body-sm font-semibold mb-1">3. Extract with the method recorded</p>
                <p className="type-body-sm text-muted-foreground">
                  For CSVs: cell lookup by ONS code and column name. For PDFs: text extraction
                  with page number recorded. For council pages: HTML scraping with the selector
                  preserved. The extraction method is part of the citation.
                </p>
              </li>
              <li className="p-4 rounded-lg bg-muted/30 border border-border/40">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <p className="type-body-sm font-semibold">4. Sample-verify by human</p>
                </div>
                <p className="type-body-sm text-muted-foreground">
                  Automated extraction is reviewed on a rolling sample. Where a value was
                  extracted by OCR or an LLM tool, a human re-reads the source and records
                  the verification. We don&apos;t publish values that haven&apos;t been confirmed
                  against the source.
                </p>
              </li>
              <li className="p-4 rounded-lg bg-muted/30 border border-border/40">
                <p className="type-body-sm font-semibold mb-1">5. Render with a cited source link</p>
                <p className="type-body-sm text-muted-foreground">
                  Every number carries a tappable source popover. The link opens the document
                  at the location the figure came from. If the source URL goes 404, we fall
                  back to the archived copy.
                </p>
              </li>
            </ol>
          </section>

          {/* Current status */}
          <section className="space-y-3">
            <h2 className="type-title-2">Current validation status</h2>
            <p className="type-body text-muted-foreground">
              Snapshot as of publication. A live report is generated by
              {' '}
              <code className="type-caption bg-muted px-1.5 py-0.5 rounded">scripts/validate/audit-provenance.mjs</code>.
            </p>
            <div className="space-y-3">
              <StatusRow
                icon={<ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
                title="Verified sources, row-level citations in progress"
                body="Council tax (Band D 2021–2026, historical series), revenue-expenditure service budgets, population, DEFRA waste destinations and recycling rate, DfT road condition and length, Ofsted children&rsquo;s services rating, LGBCE councillor counts, MHCLG housing supply, council reserves, capital programme. All sourced from published national CSVs. Row-level citation UI is the next step."
              />
              <StatusRow
                icon={<ShieldAlert className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
                title="Data validation in progress"
                body="Supplier totals (currently from Contracts Finder — a .gov.uk register of contract ceilings, not payments). Grant entries for councils without a raw source file in the repo. Staff FTE — re-tracing the build path against ONS Public Sector Personnel. CEO salary, cabinet, councillor allowances, salary bands, MTFS figures — PDF-scraped, row-level citations and re-verification queued."
              />
              <StatusRow
                icon={<ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
                title="Quiet affirmation (raw source on file)"
                body="Grants for Barnet, Birmingham, Cambridgeshire, Camden, Epping Forest, Essex, South Oxfordshire, Trafford, Vale of White Horse — each sourced from a 360Giving CSV/XLSX or spending CSV preserved in the repo."
              />
              <StatusRow
                icon={<ShieldQuestion className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
                title="Removed"
                body="The red/amber/green RAG colour on performance indicators used CivAccount-invented thresholds with no statutory basis. We&rsquo;ve removed the colour; the metric, value, period and any published target stay."
              />
            </div>
          </section>

          {/* How to spot-check */}
          <section className="space-y-3">
            <h2 className="type-title-2">How to spot-check a number</h2>
            <ol className="list-decimal list-inside space-y-2 type-body text-muted-foreground">
              <li>Tap any figure on the site — a popover shows the source title, data year, and an &ldquo;Open source document&rdquo; link.</li>
              <li>Click the link. The document opens directly in a new tab.</li>
              <li>For a CSV source, look up the row by ONS code or council name. For a PDF, use the page reference shown.</li>
              <li>If the document has moved, the popover falls back to the archived copy from when we last verified.</li>
              <li>If the number doesn&apos;t match what the source says, tap &ldquo;Report incorrect data&rdquo; on the popover — every report is triaged and the triage decision is recorded with the original citation.</li>
            </ol>
          </section>

          {/* Source archive */}
          <section className="space-y-3">
            <h2 className="type-title-2">Source archive</h2>
            <p className="type-body text-muted-foreground">
              Raw scraped files are preserved alongside their citations. The archive acknowledges
              automation: extraction is scripted, verification is sampled, and discrepancies
              against the live source are welcomed.
            </p>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
              <p className="type-body-sm font-medium">Public archive repository</p>
              <p className="type-body-sm text-muted-foreground mt-1">
                The civaccount-source-archive repo (scaffold in progress) will mirror the
                raw files that back every citation, with fetch dates and source URLs. Until
                it&apos;s public, raw files live alongside the private dataset — cite-links on
                the site open the live source directly so you don&apos;t need the archive to
                verify.
              </p>
            </div>
          </section>

          {/* Report */}
          <section className="space-y-3">
            <h2 className="type-title-2">Report a discrepancy</h2>
            <p className="type-body text-muted-foreground">
              Every popover includes a &ldquo;Report incorrect data&rdquo; link that pre-fills a
              form with the council, field, current value, and source we cited. Reports go
              into a triage queue. We respond by either correcting the rendered value,
              updating the citation, or (if the source itself is wrong) publishing the
              discrepancy alongside the figure.
            </p>
          </section>

          {/* Methodology cross-link */}
          <section className="space-y-3">
            <h2 className="type-title-2">See also</h2>
            <div className="space-y-2">
              <Link href="/methodology" className="type-body underline hover:text-foreground inline-flex items-center gap-1">
                Data methodology — how we collect and verify
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
              <br />
              <a
                href="https://github.com/wulfsagedev/civaccount/blob/main/PROVENANCE-INTEGRITY-PLAN.md"
                target="_blank"
                rel="noopener noreferrer"
                className="type-body underline hover:text-foreground inline-flex items-center gap-1"
              >
                PROVENANCE-INTEGRITY-PLAN.md — the technical plan driving this work
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </section>
        </div>
      </PageContainer>

      <Footer />
    </div>
  );
}

function StatusRow({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="p-4 rounded-lg bg-muted/30 border border-border/40 flex gap-3">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="type-body-sm font-semibold mb-1">{title}</p>
        <p className="type-body-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
