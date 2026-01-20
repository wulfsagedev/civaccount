import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accessibility - CivAccount',
  description: 'CivAccount is designed to be accessible to everyone. We follow WCAG 2.1 AA guidelines with high contrast, keyboard navigation, and screen reader support.',
  openGraph: {
    title: 'Accessibility - CivAccount',
    description: 'CivAccount is designed to be accessible to everyone.',
  },
};

export default function AccessibilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
