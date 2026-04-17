import Link from 'next/link';
import type { ReactNode } from 'react';

export type RankedBarRowProps = {
  rank?: number;
  title: ReactNode;
  href?: string;
  value: ReactNode;
  subLeft?: ReactNode;
  subRight?: ReactNode;
  fillPct?: number;
};

export function RankedBarRow({
  rank,
  title,
  href,
  value,
  subLeft,
  subRight,
  fillPct,
}: RankedBarRowProps) {
  const titleClass = 'type-body !font-semibold leading-none min-h-0';
  const label = rank != null ? <>{rank}. {title}</> : title;
  const titleNode = href ? (
    <Link href={href} className={`${titleClass} hover:underline`}>
      {label}
    </Link>
  ) : (
    <span className={titleClass}>{label}</span>
  );

  const hasBar = typeof fillPct === 'number';
  const hasSubline = subLeft != null || subRight != null;
  const width = hasBar ? Math.max(0, Math.min(100, fillPct!)) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        {titleNode}
        <span className="type-body !font-semibold tabular-nums leading-none shrink-0">
          {value}
        </span>
      </div>
      {hasSubline && (
        <div className="flex items-baseline justify-between gap-4 mt-2">
          <span className="type-caption text-muted-foreground tabular-nums leading-none">
            {subLeft}
          </span>
          {subRight != null && (
            <span className="type-caption text-muted-foreground tabular-nums leading-none shrink-0">
              {subRight}
            </span>
          )}
        </div>
      )}
      {hasBar && (
        <div className="h-2 rounded-full bg-muted overflow-hidden mt-2">
          <div
            className="h-full rounded-full bg-muted-foreground"
            style={{ width: `${width}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function RankedBarList({ children }: { children: ReactNode }) {
  return <div className="space-y-5">{children}</div>;
}
