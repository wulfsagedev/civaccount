import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center shrink-0">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mx-1.5" aria-hidden="true" />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="type-body-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={
                  isLast
                    ? 'type-body-sm text-foreground font-medium truncate max-w-[180px] sm:max-w-[400px]'
                    : 'type-body-sm text-muted-foreground whitespace-nowrap'
                }>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
