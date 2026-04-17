'use client';

import { useEffect, useState } from 'react';
import { getCouncilBySlug } from '@/data/councils';
import { VALID_CARD_TYPES } from '@/app/council/[slug]/card/_lib/card-types';
import EmbedClient, { type EmbedCardType } from '@/app/embed/_lib/EmbedClient';

const VALID_THEMES = ['auto', 'light', 'dark'] as const;
type Theme = (typeof VALID_THEMES)[number];

const CURRENT_DATA_YEAR = '2025-26';

interface Location {
  slug: string;
  type: string;
  theme?: string;
  v?: string;
}

function parseLocation(): Location | null {
  if (typeof window === 'undefined') return null;
  const match = window.location.pathname.match(/^\/embed\/council\/([^\/]+)\/([^\/]+)/);
  if (!match) return null;
  const [, slug, type] = match;
  const p = new URLSearchParams(window.location.search);
  return {
    slug,
    type,
    theme: p.get('theme') ?? undefined,
    v: p.get('v') ?? undefined,
  };
}

export default function EmbedCouncilCardPage() {
  const [loc, setLoc] = useState<Location | null>(null);

  useEffect(() => {
    setLoc(parseLocation());
  }, []);

  if (!loc) {
    return <div style={{ minHeight: 300 }} aria-hidden="true" />;
  }

  const { slug, type } = loc;

  if (!VALID_CARD_TYPES.includes(type)) {
    return <div style={{ padding: 20 }}>Unknown card type: {type}</div>;
  }

  const council = getCouncilBySlug(slug);
  if (!council) {
    return <div style={{ padding: 20 }}>Council not found: {slug}</div>;
  }

  const theme: Theme = VALID_THEMES.includes(loc.theme as Theme)
    ? (loc.theme as Theme)
    : 'auto';

  const pinned = Boolean(loc.v);
  const dataYear = pinned ? loc.v! : CURRENT_DATA_YEAR;
  const viewHref = `https://www.civaccount.co.uk/council/${slug}?utm_source=embed&utm_medium=iframe&utm_content=${type}`;

  return (
    <EmbedClient
      council={council}
      cardType={type as EmbedCardType}
      theme={theme}
      dataYear={dataYear}
      pinned={pinned}
      viewHref={viewHref}
    />
  );
}
