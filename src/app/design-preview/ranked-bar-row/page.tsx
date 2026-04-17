import { RankedBarRow, RankedBarList } from '@/components/insights/RankedBarRow';

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <header>
        <h1 className="type-title-1 mb-1">RankedBarRow — variations</h1>
        <p className="type-body-sm text-muted-foreground">
          One component, every current insight-list shape.
        </p>
      </header>

      <section className="card-elevated p-5 sm:p-6">
        <h2 className="type-title-2 mb-1">Variation A · Percentage + fraction subline</h2>
        <p className="type-body-sm text-muted-foreground mb-6">
          Shape used by &ldquo;Social care squeeze&rdquo;. One subline on the left, bar.
        </p>
        <RankedBarList>
          <RankedBarRow
            rank={1}
            title="Blackpool Council"
            href="/council/blackpool"
            value="51%"
            subLeft="Care spend £143.9m of £280.2m"
            fillPct={100}
          />
        </RankedBarList>
      </section>

      <section className="card-elevated p-5 sm:p-6">
        <h2 className="type-title-2 mb-1">Variation B · Two sublines + bar</h2>
        <p className="type-body-sm text-muted-foreground mb-6">
          Shape used by &ldquo;Bigger bills&rdquo; and &ldquo;Closest to bankruptcy&rdquo;.
        </p>
        <RankedBarList>
          <RankedBarRow
            rank={1}
            title="Birmingham Council"
            href="/council/birmingham"
            value="+£332"
            subLeft="£1,913 → £2,245 a year"
            subRight="up 17.4%"
            fillPct={100}
          />
        </RankedBarList>
      </section>

      <section className="card-elevated p-5 sm:p-6">
        <h2 className="type-title-2 mb-1">Variation C · Plain title (no link)</h2>
        <p className="type-body-sm text-muted-foreground mb-6">
          Shape used by &ldquo;Biggest companies&rdquo; — rows aren&rsquo;t councils.
        </p>
        <RankedBarList>
          <RankedBarRow
            rank={1}
            title="Axis Europe PLC"
            value="£965.8m"
            subLeft="6 councils · Construction & Building"
            fillPct={100}
          />
        </RankedBarList>
      </section>

      <section className="card-elevated p-5 sm:p-6">
        <h2 className="type-title-2 mb-1">Variation D · No bar (compact list)</h2>
        <p className="type-body-sm text-muted-foreground mb-6">
          Shape for &ldquo;Council tax increases&rdquo; — bar omitted by leaving fillPct off.
        </p>
        <RankedBarList>
          <RankedBarRow
            rank={1}
            title="Somerset Council"
            href="/council/somerset"
            value="+15.3%"
            subLeft="£2,116 → £2,439 a year"
            subRight="+£323"
          />
        </RankedBarList>
      </section>

      <section className="card-elevated p-5 sm:p-6">
        <h2 className="type-title-2 mb-1">Variation E · Value only (no sublines)</h2>
        <p className="type-body-sm text-muted-foreground mb-6">
          Minimal shape — headline figure and a bar, nothing else.
        </p>
        <RankedBarList>
          <RankedBarRow
            rank={1}
            title="Suffolk County Council"
            href="/council/suffolk"
            value="49%"
            fillPct={96}
          />
        </RankedBarList>
      </section>

      <section className="card-elevated p-5 sm:p-6">
        <h2 className="type-title-2 mb-1">Three stacked · Budget gap leaderboard</h2>
        <p className="type-body-sm text-muted-foreground mb-6">
          Same spacing, typography and bar behaviour across every row.
        </p>
        <RankedBarList>
          <RankedBarRow
            rank={1}
            title="Birmingham Council"
            href="/council/birmingham"
            value="£578.6m"
            subLeft="20% of £2.8bn net budget"
            subRight="Savings target £520.7m"
            fillPct={100}
          />
          <RankedBarRow
            rank={2}
            title="Hackney"
            href="/council/hackney"
            value="£301.6m"
            subLeft="29% of £1.0bn net budget"
            subRight="Savings target £271.4m"
            fillPct={52}
          />
          <RankedBarRow
            rank={3}
            title="Newham"
            href="/council/newham"
            value="£253.2m"
            subLeft="27% of £929.8m net budget"
            subRight="Savings target £227.8m"
            fillPct={44}
          />
        </RankedBarList>
      </section>
    </div>
  );
}
