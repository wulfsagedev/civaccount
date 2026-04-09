import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Proposal',
  description: 'Submit a new proposal for how your council should spend its budget.',
  robots: { index: false, follow: true },
};

export default function NewProposalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
