// CivAccount Weekly Email Digest
// Supabase Edge Function — triggered by pg_cron weekly
//
// Setup:
// 1. Set RESEND_API_KEY in Supabase Edge Function secrets
// 2. Deploy: supabase functions deploy email-digest
// 3. Schedule: Run weekly via pg_cron or invoke manually
//
// This is a reference implementation. To use it:
// - Sign up at resend.com and get an API key
// - Verify your sending domain
// - Deploy this function to Supabase

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BATCH_SIZE = 100;
const SITE_URL = 'https://www.civaccount.co.uk';

interface Proposal {
  id: string;
  title: string;
  council_slug: string;
  budget_category: string;
  score: number;
  comment_count: number;
  created_at: string;
}

interface UserRow {
  id: string;
  email: string;
  display_name: string | null;
  council_slug: string | null;
}

Deno.serve(async () => {
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Get proposals from the last 7 days
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentProposals } = await supabase
    .from('proposals')
    .select('id, title, council_slug, budget_category, score, comment_count, created_at')
    .gte('created_at', oneWeekAgo)
    .neq('status', 'flagged')
    .order('score', { ascending: false })
    .limit(20);

  if (!recentProposals || recentProposals.length === 0) {
    return new Response(JSON.stringify({ message: 'No proposals this week, skipping digest' }));
  }

  // Get all users with a council_slug set (they follow a council)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, display_name, council_slug')
    .not('council_slug', 'is', null)
    .limit(BATCH_SIZE);

  if (usersError || !users || users.length === 0) {
    return new Response(JSON.stringify({ message: 'No subscribers found' }));
  }

  let sent = 0;
  let failed = 0;

  for (const user of users as UserRow[]) {
    // Filter proposals for this user's council
    const relevant = recentProposals.filter(
      (p: Proposal) => p.council_slug === user.council_slug
    );

    // If no proposals for their council, send top proposals globally
    const proposalsToSend = relevant.length > 0 ? relevant.slice(0, 5) : recentProposals.slice(0, 5);
    const isLocal = relevant.length > 0;

    const proposalListHtml = proposalsToSend.map((p: Proposal) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
          <a href="${SITE_URL}/council/${p.council_slug}/proposals/${p.id}" style="text-decoration: none; color: #111;">
            <strong style="font-size: 15px;">${escapeHtml(p.title)}</strong>
          </a>
          <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
            ${p.score} votes · ${p.comment_count} comments
          </div>
        </td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="padding: 24px 0;">
          <h1 style="font-size: 20px; margin: 0 0 4px;">Weekly from CivAccount</h1>
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 20px;">
            ${isLocal ? `What\'s happening in your council this week.` : `Top proposals across the UK this week.`}
          </p>
          <table style="width: 100%; border-collapse: collapse;">
            ${proposalListHtml}
          </table>
          <div style="margin-top: 24px;">
            <a href="${SITE_URL}" style="display: inline-block; padding: 10px 20px; background: #111; color: #fff; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
              View all proposals
            </a>
          </div>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 32px;">
            You're getting this because you follow a council on CivAccount.
          </p>
        </div>
      </div>
    `;

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'CivAccount <digest@civaccount.co.uk>',
          to: user.email,
          subject: isLocal ? 'This week in your council' : 'This week on CivAccount',
          html,
        }),
      });

      if (res.ok) {
        sent++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return new Response(JSON.stringify({ sent, failed, total: users.length }));
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
