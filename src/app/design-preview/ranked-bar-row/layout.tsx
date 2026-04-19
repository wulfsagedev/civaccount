import type { Metadata } from 'next';

// Internal design system preview — never index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DesignPreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
