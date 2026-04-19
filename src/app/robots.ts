import type { MetadataRoute } from 'next';

/**
 * robots.txt — 2026 best-practice configuration.
 *
 * AI crawler landscape (April 2026): each major provider operates separate
 * user-agents for *training* vs *live retrieval*. Blocking the training bot
 * does NOT block the search/citation bot. Our policy:
 *   - ALLOW search/retrieval bots (Google, OAI-SearchBot, Claude-SearchBot,
 *     PerplexityBot, etc.) — we WANT to be cited.
 *   - ALLOW user-initiated fetchers (ChatGPT-User, Claude-User, Perplexity-User)
 *     — these only fetch when a user asks for a page directly.
 *   - ALLOW training crawlers — CivAccount data is OGL v3.0 / MIT licensed
 *     and is explicitly published for civic reuse, including AI training.
 *
 * Disallowed paths apply to ALL crawlers:
 *   /api/         — JSON endpoints, no SEO value
 *   /_next/       — build artefacts
 *   /auth/        — login flow
 *   /embed/       — iframe-only pages, indexed via parent
 *   /uk-only      — geo-blocking landing
 *   /design-preview — internal design system previews
 */

const DISALLOW_PATHS = ['/api/', '/_next/', '/auth/', '/embed/', '/uk-only', '/design-preview'];

// Bots we explicitly enumerate to signal a deliberate decision rather than
// rely on the wildcard. Order matters in some crawler implementations.
const NAMED_BOTS = [
  // Google
  'Googlebot',
  'Googlebot-Image',
  'Googlebot-News',
  'Google-Extended',          // Gemini training opt-out token (we ALLOW)
  // Bing / Microsoft
  'Bingbot',
  'msnbot',
  // OpenAI
  'GPTBot',                   // training
  'OAI-SearchBot',            // ChatGPT search index
  'ChatGPT-User',             // user-initiated browse
  // Anthropic (post-2024 split)
  'ClaudeBot',                // training
  'Claude-SearchBot',         // search retrieval
  'Claude-User',              // user-initiated browse
  'anthropic-ai',             // legacy training agent
  // Perplexity
  'PerplexityBot',            // indexing
  'Perplexity-User',          // user-initiated
  // Apple
  'Applebot',                 // Search/Siri
  'Applebot-Extended',        // Apple Intelligence training
  // Meta
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  // Common Crawl (used by many models for training)
  'CCBot',
  // Other major training bots
  'Bytespider',               // ByteDance
  'cohere-ai',
  'Diffbot',
  'Amazonbot',
  // Search engines beyond Google/Bing
  'DuckDuckBot',
  'Slurp',                    // Yahoo
  'YandexBot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default policy for any crawler not explicitly named.
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOW_PATHS,
      },
      // Explicitly enumerate every major bot with the same allow-with-restricted-paths
      // rule. This makes the intent unambiguous to crawlers that look up their
      // own user-agent (most do) rather than relying on the wildcard.
      ...NAMED_BOTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: DISALLOW_PATHS,
      })),
    ],
    sitemap: 'https://www.civaccount.co.uk/sitemap.xml',
    host: 'https://www.civaccount.co.uk',
  };
}
