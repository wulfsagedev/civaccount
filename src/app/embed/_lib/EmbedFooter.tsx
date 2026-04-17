import { ExternalLink } from 'lucide-react';

interface EmbedFooterProps {
  councilName?: string;
  viewHref: string;
  dataYear: string;
  pinned: boolean;
}

export default function EmbedFooter({ councilName, viewHref, dataYear, pinned }: EmbedFooterProps) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 px-1 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="type-caption font-semibold text-foreground">CivAccount</span>
        <span className="type-caption text-muted-foreground whitespace-nowrap">
          · {councilName ? `${councilName} · ` : ''}{dataYear}{pinned ? ' · pinned' : ''}
        </span>
      </div>
      <a
        href={viewHref}
        target="_blank"
        rel="noopener noreferrer"
        className="type-caption font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0 transition-colors"
      >
        View on CivAccount
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </a>
    </div>
  );
}
