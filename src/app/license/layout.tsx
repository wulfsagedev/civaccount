import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Open Source License - CivAccount',
  description: 'CivAccount is open source software. View our MIT license and contribute to making council data more accessible.',
  openGraph: {
    title: 'Open Source License - CivAccount',
    description: 'CivAccount is open source software under the MIT license.',
  },
};

export default function LicenseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
