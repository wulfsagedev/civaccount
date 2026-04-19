'use client';

import { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Code, Copy, Check, Database, ExternalLink, Zap } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PageContainer } from '@/components/ui/page-container';

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative group">
      <pre className="p-4 pr-12 rounded-lg bg-muted/60 border border-border/50 overflow-x-auto text-sm leading-relaxed font-mono">
        <code className={language ? `language-${language}` : ''}>{code}</code>
      </pre>
      <button
        onClick={copy}
        aria-label="Copy code"
        className="absolute top-3 right-3 w-8 h-8 rounded-md bg-background/80 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background transition-colors cursor-pointer"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function DevelopersPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const embedExample = `<iframe
  src="https://www.civaccount.co.uk/embed/council/kent"
  width="100%"
  height="720"
  loading="lazy"
  title="Kent council tax & budget — CivAccount"
  style="border:0;border-radius:12px"></iframe>`;

  const embedCardExample = `<!-- Just the "your bill" card -->
<iframe
  src="https://www.civaccount.co.uk/embed/council/kent/your-bill"
  width="100%" height="320" loading="lazy"
  title="Kent your bill"
  style="border:0;border-radius:12px"></iframe>`;

  const apiListExample = `curl "https://www.civaccount.co.uk/api/v1/councils?search=kent"`;

  const apiCouncilExample = `curl https://www.civaccount.co.uk/api/v1/councils/kent`;

  const apiCouncilJson = `{
  "slug": "kent",
  "name": "Kent",
  "ons_code": "E10000016",
  "type": "SC",
  "type_name": "County Council",
  "council_tax": {
    "band_d_2025": 1842.66,
    "band_d_2024": 1765.44,
    ...
  },
  "budget": {
    "total_service": 1234567,
    "education": 456789,
    ...
  },
  "detailed": {
    "council_leader": "...",
    "chief_executive": "...",
    "top_suppliers": [ ... ],
    "grant_payments": [ ... ]
  },
  "field_sources": {
    "chief_executive_salary": {
      "url": "https://...gov.uk/...",
      "accessed": "2026-04-13"
    }
  }
}`;

  const apiDiffsExample = `curl https://www.civaccount.co.uk/api/v1/diffs?since=2026-04-01`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <PageContainer className="py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <Badge variant="outline" className="mb-4">Developers</Badge>
          <h1 className="type-title-1 font-semibold mb-4">Free UK council data API & embeds</h1>
          <p className="type-body-lg text-muted-foreground max-w-2xl mx-auto">
            Every figure on this site is available as a public API and as an embeddable widget.
            No API key required. Open Government Licence v3.0.
          </p>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="card-elevated p-5 text-center">
            <p className="type-display font-semibold tabular-nums">317</p>
            <p className="type-caption text-muted-foreground mt-1">English councils covered</p>
          </div>
          <div className="card-elevated p-5 text-center">
            <p className="type-display font-semibold tabular-nums">100</p>
            <p className="type-caption text-muted-foreground mt-1">Requests / minute / IP</p>
          </div>
          <div className="card-elevated p-5 text-center">
            <p className="type-display font-semibold tabular-nums">£0</p>
            <p className="type-caption text-muted-foreground mt-1">To use — forever</p>
          </div>
        </div>

        {/* Embed section */}
        <section className="card-elevated p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <h2 className="type-title-2">Embed a council widget</h2>
          </div>
          <p className="type-body-sm text-muted-foreground mb-5">
            Drop this iframe into any page — news article, estate agent listing, mortgage calculator, campaign site — to show council tax and budget for any of England&apos;s 317 councils.
            Replace <code className="px-1.5 py-0.5 rounded bg-muted text-[13px]">kent</code> with the council slug you want.
          </p>

          <p className="type-body-sm font-semibold mb-2">Full dashboard (recommended)</p>
          <CodeBlock code={embedExample} language="html" />

          <p className="type-body-sm font-semibold mt-6 mb-2">Single card</p>
          <p className="type-caption text-muted-foreground mb-2">
            Card types: <code className="px-1.5 py-0.5 rounded bg-muted">your-bill</code>,{' '}
            <code className="px-1.5 py-0.5 rounded bg-muted">tax-bands</code>,{' '}
            <code className="px-1.5 py-0.5 rounded bg-muted">spending</code>,{' '}
            <code className="px-1.5 py-0.5 rounded bg-muted">suppliers</code>,{' '}
            <code className="px-1.5 py-0.5 rounded bg-muted">financial-health</code>,{' '}
            <code className="px-1.5 py-0.5 rounded bg-muted">leadership</code>
          </p>
          <CodeBlock code={embedCardExample} language="html" />

          <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/40">
            <p className="type-body-sm font-semibold mb-1">Attribution</p>
            <p className="type-caption text-muted-foreground">
              Every embed footer includes a tiny CivAccount link and Open Government Licence credit.
              You don&apos;t need to add anything else.
            </p>
          </div>
        </section>

        {/* API section */}
        <section className="card-elevated p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Code className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <h2 className="type-title-2">JSON API</h2>
          </div>
          <p className="type-body-sm text-muted-foreground mb-5">
            Base URL: <code className="px-1.5 py-0.5 rounded bg-muted">https://www.civaccount.co.uk/api/v1</code>.
            No key. 100 requests per minute per IP. All responses are JSON under
            CORS <code className="px-1.5 py-0.5 rounded bg-muted">*</code>.
          </p>

          {/* List councils */}
          <h3 className="type-title-3 mb-2">Search councils</h3>
          <p className="type-caption text-muted-foreground mb-2">
            <code className="px-1.5 py-0.5 rounded bg-muted">GET /api/v1/councils</code>
            {' '}— requires <code className="px-1.5 py-0.5 rounded bg-muted">search</code> or <code className="px-1.5 py-0.5 rounded bg-muted">type</code> (SC, SD, UA, MD, LB). Max <code className="px-1.5 py-0.5 rounded bg-muted">limit</code> 20, slim records only.
            <br />
            Unfiltered enumeration is not offered — look up the councils you need individually using the endpoint below.
          </p>
          <CodeBlock code={apiListExample} language="bash" />

          {/* Get one council */}
          <h3 className="type-title-3 mt-6 mb-2">Get one council</h3>
          <p className="type-caption text-muted-foreground mb-2">
            <code className="px-1.5 py-0.5 rounded bg-muted">GET /api/v1/councils/[slug]</code>
            {' '}— returns everything for that council (tax bands, budget, leadership, suppliers, grants, field-level source URLs).
          </p>
          <CodeBlock code={apiCouncilExample} language="bash" />

          <details className="mt-3">
            <summary className="type-body-sm font-semibold cursor-pointer select-none">Example response (truncated)</summary>
            <div className="mt-2">
              <CodeBlock code={apiCouncilJson} language="json" />
            </div>
          </details>

          {/* Diffs */}
          <h3 className="type-title-3 mt-6 mb-2">Data change feed</h3>
          <p className="type-caption text-muted-foreground mb-2">
            <code className="px-1.5 py-0.5 rounded bg-muted">GET /api/v1/diffs</code>
            {' '}— returns commits that modified council data, with affected councils listed.
            Query param <code className="px-1.5 py-0.5 rounded bg-muted">since</code> (ISO date).
          </p>
          <CodeBlock code={apiDiffsExample} language="bash" />

          {/* No bulk */}
          <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/40">
            <p className="type-body-sm font-semibold mb-1">No bulk export</p>
            <p className="type-caption text-muted-foreground">
              There is no whole-dataset CSV or JSON endpoint. Per-council lookups are the only way to pull structured
              data. Slugs are listed in the <a href="/sitemap.xml" className="underline">sitemap</a>.
            </p>
          </div>
        </section>

        {/* Data provenance */}
        <section className="card-elevated p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Database className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <h2 className="type-title-2">Where the data comes from</h2>
          </div>
          <p className="type-body-sm text-muted-foreground mb-4">
            Every council record links to its own <code className="px-1.5 py-0.5 rounded bg-muted">.gov.uk</code> source.
            National aggregates are traceable to one of these:
          </p>
          <ul className="space-y-2 type-body-sm">
            <li className="flex gap-2">
              <span className="text-muted-foreground mt-1">•</span>
              <span>
                <strong>Council Tax 2025-26</strong> —{' '}
                <a href="https://www.gov.uk/government/statistics/council-tax-levels-set-by-local-authorities-in-england-2025-to-2026" target="_blank" rel="noopener" className="underline">GOV.UK Council Tax Levels</a>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-muted-foreground mt-1">•</span>
              <span>
                <strong>Budgets</strong> —{' '}
                <a href="https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing" target="_blank" rel="noopener" className="underline">GOV.UK Revenue Expenditure (RA returns)</a>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-muted-foreground mt-1">•</span>
              <span>
                <strong>Population</strong> —{' '}
                <a href="https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/bulletins/populationestimatesforenglandandwales/mid2024" target="_blank" rel="noopener" className="underline">ONS Mid-2024 Population Estimates</a>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-muted-foreground mt-1">•</span>
              <span>
                <strong>Waste</strong> —{' '}
                <a href="https://www.gov.uk/government/statistical-data-sets/env18-local-authority-collected-waste-annual-results-tables" target="_blank" rel="noopener" className="underline">DEFRA Local Authority Collected Waste</a>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-muted-foreground mt-1">•</span>
              <span>
                <strong>Councillor counts / boundaries</strong> —{' '}
                <a href="https://www.lgbce.org.uk" target="_blank" rel="noopener" className="underline">LGBCE</a>
              </span>
            </li>
          </ul>
          <p className="type-caption text-muted-foreground mt-5">
            Full methodology: <Link href="/methodology" className="underline">civaccount.co.uk/methodology</Link>.
            Live data change log: <Link href="/changelog" className="underline">/changelog</Link>.
          </p>
        </section>

        {/* Licence */}
        <section className="card-elevated p-6 sm:p-8 mb-8">
          <h2 className="type-title-2 mb-3">Licence & terms</h2>
          <ul className="space-y-2 type-body-sm text-muted-foreground">
            <li className="flex gap-2">
              <Check className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
              <span>Data: <strong>Open Government Licence v3.0</strong> (because the source data is). Use commercially. Attribution appreciated, not required.</span>
            </li>
            <li className="flex gap-2">
              <Check className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
              <span>Code: <strong>MIT</strong>. Fork, build on it, ship it.</span>
            </li>
            <li className="flex gap-2">
              <Check className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
              <span>Rate limit: 100 req/min/IP. If you need more, get in touch.</span>
            </li>
            <li className="flex gap-2">
              <Check className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                AI / LLM crawlers: see{' '}
                <a href="/llms.txt" target="_blank" rel="noopener" className="underline">/llms.txt</a>
                {' '}for a curated index of canonical URLs.
              </span>
            </li>
          </ul>
        </section>

        <div className="text-center">
          <p className="type-body-sm text-muted-foreground mb-3">
            Building something interesting with this data? I&apos;d love to hear about it.
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-1 type-body-sm underline hover:text-primary transition-colors"
          >
            Get in touch
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </PageContainer>

      <Footer />
    </div>
  );
}
