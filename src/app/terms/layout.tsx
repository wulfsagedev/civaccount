import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use - CivAccount',
  description: 'Terms of use for CivAccount. Our data comes from official government sources but is provided for informational purposes only.',
  openGraph: {
    title: 'Terms of Use - CivAccount',
    description: 'Terms of use for CivAccount.',
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
