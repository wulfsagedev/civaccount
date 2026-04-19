import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// ─── Data source resolver (@council-data alias) ────────────────────────────
// The compiled dataset lives at `src/data/councils/` and, after the Phase 1
// cutover (see /DATA-ACCESS-POLICY.md), is sourced from the private
// `civaccount-data` Git submodule at that path.
//
// In environments without the submodule (contributor clones, or CI with
// CIVACCOUNT_FIXTURES=1), the alias falls back to the committed 3-council
// fixture at `src/data/councils-fixtures/`.
//
// Turbopack's `resolveAlias` needs a path RELATIVE to the project root
// (absolute paths trigger "server relative imports are not implemented").
// NOTE: we point at the `index` *file inside the folder* (not the bare folder
// name), because `src/data/councils.ts` is a sibling file that would otherwise
// win the file-vs-folder resolution race.
const hasRealCouncilData = existsSync(resolve(__dirname, "src/data/councils/index.ts"));
const useFixtures = process.env.CIVACCOUNT_FIXTURES === "1" || !hasRealCouncilData;
const councilDataPath = useFixtures
  ? "./src/data/councils-fixtures/index.ts"
  : "./src/data/councils/index.ts";

if (useFixtures) {
  console.log(
    `[civaccount] Using fixture council data at ${councilDataPath}. ` +
      `Set CIVACCOUNT_FIXTURES=0 and ensure the submodule is checked out for the full dataset.`,
  );
}

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  turbopack: {
    resolveAlias: {
      "@council-data": councilDataPath,
    },
  },
  async redirects() {
    return [
      // Removed: FOI archive page (feature parked indefinitely).
      { source: '/foi', destination: '/', permanent: false },
      { source: '/foi/:path*', destination: '/', permanent: false },
    ];
  },
  async headers() {
    return [
      // Allow embed pages to be framed
      {
        source: '/embed/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors *" },
        ],
      },
      {
        source: '/((?!embed).*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;