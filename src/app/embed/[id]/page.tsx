'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getCategoryLabel, timeAgo } from '@/lib/proposals';
import { ChevronUp, ChevronDown, MessageSquare, ExternalLink } from 'lucide-react';

interface Proposal {
  id: string;
  council_slug: string;
  title: string;
  body: string;
  budget_category: string;
  score: number;
  comment_count: number;
  created_at: string;
}

export default function EmbedPage() {
  const params = useParams();
  const proposalId = params.id as string;
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProposal = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('proposals')
      .select('id, council_slug, title, body, budget_category, score, comment_count, created_at')
      .eq('id', proposalId)
      .single();
    setProposal(data);
    setIsLoading(false);
  }, [proposalId]);

  useEffect(() => {
    fetchProposal();
  }, [fetchProposal]);

  if (isLoading) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '16px' }}>
        <div style={{ height: '80px', background: '#f3f4f6', borderRadius: '8px', animation: 'pulse 2s infinite' }} />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '16px', color: '#6b7280', textAlign: 'center' }}>
        Proposal not found.
      </div>
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://www.civaccount.co.uk');
  const proposalUrl = `${appUrl}/council/${proposal.council_slug}/proposals/${proposal.id}`;

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      overflow: 'hidden',
      maxWidth: '500px',
      background: '#fff',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>C</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e' }}>CivAccount</span>
        </div>
        <span style={{
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: '9999px',
          background: '#eef2ff',
          color: '#4338ca',
          fontWeight: 500,
        }}>
          {getCategoryLabel(proposal.budget_category)}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <a
          href={proposalUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px', lineHeight: 1.3, color: '#111' }}>
            {proposal.title}
          </h3>
        </a>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 12px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {proposal.body}
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
            <ChevronUp style={{ width: '14px', height: '14px' }} />
            {proposal.score}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MessageSquare style={{ width: '14px', height: '14px' }} />
            {proposal.comment_count}
          </span>
          <span>{timeAgo(proposal.created_at)}</span>
        </div>
      </div>

      {/* Footer CTA */}
      <a
        href={proposalUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '10px 16px',
          borderTop: '1px solid #f3f4f6',
          fontSize: '13px',
          fontWeight: 500,
          color: '#4338ca',
          textDecoration: 'none',
          background: '#fafafa',
        }}
      >
        Have your say on CivAccount
        <ExternalLink style={{ width: '12px', height: '12px' }} />
      </a>
    </div>
  );
}
