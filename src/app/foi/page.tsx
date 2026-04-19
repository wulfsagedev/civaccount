import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, Clock, AlertCircle, Check, Inbox } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PageContainer } from '@/components/ui/page-container';
import { FOI_REQUESTS, FOI_BACKLOG, type FoiStatus } from '@/data/foi';

const STATUS_STYLES: Record<FoiStatus, { label: string; badge: string; Icon: typeof Check }> = {
  responded: { label: "Responded", badge: "bg-muted text-foreground", Icon: Check },
  filed: { label: "Filed, awaiting", badge: "bg-muted/60 text-muted-foreground", Icon: Clock },
  overdue: { label: "Overdue", badge: "bg-muted text-foreground", Icon: AlertCircle },
  refused: { label: "Refused", badge: "bg-muted text-foreground", Icon: AlertCircle },
};

export default function FoiPage() {
  const responded = FOI_REQUESTS.filter(r => r.status === "responded");
  const pending = FOI_REQUESTS.filter(r => r.status !== "responded");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <PageContainer className="py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <Badge variant="outline" className="mb-4">FOI archive</Badge>
          <h1 className="type-title-1 font-semibold mb-4">Data councils don&apos;t volunteer</h1>
          <p className="type-body-lg text-muted-foreground max-w-2xl mx-auto">
            Freedom of Information requests we file and publish in full. Covers data that councils are
            legally required to release but don&apos;t routinely put on their websites.
          </p>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="card-elevated p-5 text-center">
            <p className="type-display font-semibold tabular-nums">{responded.length}</p>
            <p className="type-caption text-muted-foreground mt-1">Responses published</p>
          </div>
          <div className="card-elevated p-5 text-center">
            <p className="type-display font-semibold tabular-nums">{pending.length}</p>
            <p className="type-caption text-muted-foreground mt-1">Requests pending</p>
          </div>
          <div className="card-elevated p-5 text-center">
            <p className="type-display font-semibold tabular-nums">{FOI_BACKLOG.length}</p>
            <p className="type-caption text-muted-foreground mt-1">Requests queued</p>
          </div>
        </div>

        {/* Empty state */}
        {FOI_REQUESTS.length === 0 && (
          <section className="card-elevated p-6 sm:p-8 mb-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Inbox className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <div>
                <h2 className="type-title-2 mb-1">Archive opens soon</h2>
                <p className="type-body-sm text-muted-foreground">
                  We&apos;re filing our first batch of FOI requests now. Responses and raw data files
                  will appear here as they come back — usually within 20 working days of filing.
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/40">
              <p className="type-body-sm font-semibold mb-2">Why do this?</p>
              <p className="type-body-sm text-muted-foreground mb-3">
                There are things councils legally <em>must</em> release but don&apos;t publish proactively —
                Household Support Fund recipient lists, employer pension contributions, SEND transport
                costs per provider, councillor expense claims by individual journey. We ask for them,
                wait 20 working days, and publish whatever comes back.
              </p>
              <p className="type-body-sm text-muted-foreground">
                Every response gets a stable URL so journalists, researchers and AI assistants can
                cite it. The raw files (CSV/PDF) are served straight off{' '}
                <code className="px-1.5 py-0.5 rounded bg-muted text-[13px]">/foi/[slug].csv</code>.
              </p>
            </div>
          </section>
        )}

        {/* Responded */}
        {responded.length > 0 && (
          <section className="mb-10">
            <h2 className="type-title-2 font-semibold mb-4">Responses</h2>
            <div className="card-elevated overflow-hidden">
              {responded.map((r, i) => {
                const s = STATUS_STYLES[r.status];
                return (
                  <div
                    key={r.slug}
                    className={`p-4 sm:p-5 ${i > 0 ? 'border-t border-border/40' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="type-body-sm font-semibold">{r.title}</p>
                        <Link
                          href={`/council/${r.council_slug}`}
                          className="type-caption text-muted-foreground underline hover:text-foreground"
                        >
                          {r.council}
                        </Link>
                      </div>
                      <span className={`type-caption font-medium px-2 py-1 rounded ${s.badge}`}>
                        {s.label}
                      </span>
                    </div>
                    {r.summary && (
                      <p className="type-caption text-muted-foreground mb-3">
                        {r.summary}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      {r.response_url && (
                        <a
                          href={r.response_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 type-body-sm underline hover:text-foreground transition-colors"
                        >
                          Download response
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      )}
                      {r.request_url && (
                        <a
                          href={r.request_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 type-caption text-muted-foreground hover:text-foreground"
                        >
                          Original request
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Pending */}
        {pending.length > 0 && (
          <section className="mb-10">
            <h2 className="type-title-2 font-semibold mb-4">Pending</h2>
            <div className="card-elevated overflow-hidden">
              {pending.map((r, i) => {
                const s = STATUS_STYLES[r.status];
                return (
                  <div
                    key={r.slug}
                    className={`p-4 sm:p-5 ${i > 0 ? 'border-t border-border/40' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="type-body-sm font-semibold">{r.title}</p>
                        <Link
                          href={`/council/${r.council_slug}`}
                          className="type-caption text-muted-foreground underline hover:text-foreground"
                        >
                          {r.council}
                        </Link>
                        <p className="type-caption text-muted-foreground mt-1">
                          Filed {new Date(r.filed_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`type-caption font-medium px-2 py-1 rounded ${s.badge}`}>
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Backlog */}
        {FOI_BACKLOG.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="type-title-2 font-semibold">Queued to file</h2>
            </div>
            <p className="type-body-sm text-muted-foreground mb-5">
              What we plan to ask for next. Suggestions welcome via the{' '}
              <Link href="/about" className="underline">feedback form</Link>.
            </p>
            <div className="space-y-4">
              {FOI_BACKLOG.map((item, i) => (
                <div key={i} className="card-elevated p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="type-body-sm font-semibold mb-1">{item.title}</p>
                      <p className="type-caption text-muted-foreground mb-2">{item.rationale}</p>
                      <p className="type-caption">
                        <span className="font-medium">Target:</span>{' '}
                        <span className="text-muted-foreground">{item.target}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Foot */}
        <div className="mt-10 p-5 rounded-lg bg-muted/30 border border-border/40">
          <p className="type-body-sm font-semibold mb-1">How to cite a response</p>
          <p className="type-caption text-muted-foreground">
            Each response has a stable URL under{' '}
            <code className="px-1.5 py-0.5 rounded bg-muted text-[13px]">/foi/[slug]</code>.
            The raw file is an equally stable URL you can link to directly
            (<code className="px-1.5 py-0.5 rounded bg-muted text-[13px]">/foi/[slug].csv</code> etc.)
            — please link to it, don&apos;t rehost.
          </p>
        </div>
      </PageContainer>

      <Footer />
    </div>
  );
}
