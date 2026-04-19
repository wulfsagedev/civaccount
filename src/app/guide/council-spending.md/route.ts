import { GUIDE_MARKDOWN } from '@/data/guide-markdown';

export function GET() {
  return new Response(GUIDE_MARKDOWN['council-spending'], {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
