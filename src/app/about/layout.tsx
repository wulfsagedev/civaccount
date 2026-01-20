import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About CivAccount - Why we built this',
  description: 'Learn why we created CivAccount to make UK council budget data accessible to everyone. Our mission is transparency in local government spending.',
  openGraph: {
    title: 'About CivAccount - Why we built this',
    description: 'Learn why we created CivAccount to make UK council budget data accessible to everyone.',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
