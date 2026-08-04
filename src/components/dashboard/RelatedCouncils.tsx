import Link from 'next/link';
import { Council, councils, getCouncilDisplayName, getCouncilSlug, getAreaBandD, formatCurrency, toSentenceTypeName } from '@/data/councils';
import SourceAnnotation from '@/components/ui/source-annotation';
import { getProvenance } from '@/data/provenance';

interface RelatedCouncilsProps {
  council: Council;
}

export default function RelatedCouncils({ council }: RelatedCouncilsProps) {
  // Same-type councils share the same data year via getAreaBandD (2026-27
  // for billing authority types, 2025-26 for counties), so the closeness
  // comparison never mixes years.
  const areaBandD = getAreaBandD(council);
  if (!areaBandD) return null;
  const bandD = areaBandD.value;

  const slug = getCouncilSlug(council);

  // Find 5 councils of the same type, closest Band D rate (excluding self)
  const related = councils
    .filter(
      (c) =>
        c.type === council.type &&
        getAreaBandD(c) &&
        c.ons_code !== council.ons_code
    )
    .map((c) => ({
      council: c,
      diff: Math.abs(getAreaBandD(c)!.value - bandD),
    }))
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 5);

  if (related.length === 0) return null;

  return (
    <section className="card-elevated p-5 sm:p-6">
      <h2 className="type-title-2 mb-1">Similar councils</h2>
      <p className="type-body-sm text-muted-foreground mb-5">
        Other {toSentenceTypeName(council.type_name)}s with similar council tax rates
      </p>

      <div className="space-y-3">
        {related.map(({ council: c }) => {
          const relatedSlug = getCouncilSlug(c);
          const name = getCouncilDisplayName(c);
          const relatedArea = getAreaBandD(c)!;
          const relatedBandD = relatedArea.value;

          return (
            <div key={c.ons_code} className="flex items-baseline justify-between gap-3 py-2">
              <Link
                href={`/council/${relatedSlug}`}
                className="type-body-sm font-medium hover:text-foreground transition-colors min-w-0 truncate"
              >
                {name}
              </Link>
              <div className="flex items-baseline gap-3 shrink-0">
                <span className="type-body-sm font-semibold tabular-nums whitespace-nowrap">
                  <SourceAnnotation
                    provenance={getProvenance(relatedArea.fieldPath, c)}
                    reportContext={{
                      council: c.name,
                      field: `Council tax Band D ${relatedArea.year}`,
                      value: formatCurrency(relatedBandD, { decimals: 2 }),
                    }}
                  >
                    {formatCurrency(relatedBandD, { decimals: 2 })}
                  </SourceAnnotation>
                </span>
                <Link
                  href={`/compare/${[slug, relatedSlug].sort().join('-vs-')}`}
                  className="type-caption text-muted-foreground hover:text-foreground transition-colors"
                >
                  Compare
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
