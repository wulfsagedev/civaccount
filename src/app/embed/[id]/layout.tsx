import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Embedded Proposal',
  robots: { index: false, follow: false },
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ margin: 0, padding: 0, background: 'transparent' }}>
      {children}
    </div>
  );
}
