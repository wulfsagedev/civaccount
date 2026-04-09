import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thank You',
  description: 'Thank you for supporting CivAccount. Your donation helps keep council data transparent and free.',
  robots: { index: false, follow: true },
};

export default function ThankYouLayout({ children }: { children: React.ReactNode }) {
  return children;
}
