'use client';

import { MessageSquare } from 'lucide-react';

interface Props {
  label: string;
  subject?: string;
}

export default function PressContactButton({ label, subject }: Props) {
  const openFeedback = () => {
    document.dispatchEvent(
      new CustomEvent('open-feedback', { detail: subject ? { subject } : undefined }),
    );
  };

  return (
    <button
      onClick={openFeedback}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background type-body-sm font-semibold hover:bg-foreground/90 transition-colors cursor-pointer"
    >
      <MessageSquare className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
