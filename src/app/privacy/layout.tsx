import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - CivAccount',
  description: 'CivAccount privacy policy. We respect your privacy and only use essential cookies. No tracking, no ads, no data selling.',
  openGraph: {
    title: 'Privacy Policy - CivAccount',
    description: 'CivAccount privacy policy. We respect your privacy.',
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
