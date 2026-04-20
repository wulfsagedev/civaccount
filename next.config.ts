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
    // ─── CSP — shared base ────────────────────────────────────────────────
    // `unsafe-inline` on script-src is kept ONLY because the theme bootstrap
    // in src/app/layout.tsx runs inline to avoid a light-flash on load.
    // If that script is ever replaced with a nonce/external approach, drop
    // `unsafe-inline` from script-src immediately.
    const baseCsp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
      "manifest-src 'self'",
      "worker-src 'self' blob:",
      "media-src 'self'",
      "frame-src 'self' https://checkout.stripe.com https://js.stripe.com",
      "upgrade-insecure-requests",
      // Report CSP violations to our own endpoint.  `report-to` is the
      // modern directive (paired with the Reporting-Endpoints header below);
      // `report-uri` is the legacy directive Safari + older Chromium still
      // honour — ship both for compatibility.
      "report-uri /api/csp-report",
      "report-to csp-endpoint",
    ];

    const siteCsp = [...baseCsp, "frame-ancestors 'none'"].join('; ');
    const embedCsp = [...baseCsp, "frame-ancestors *"].join('; ');

    // Modern Reporting-Endpoints header — declares the named endpoint the
    // `report-to` CSP directive refers to.  Without this header, browsers
    // silently ignore the `report-to` directive.
    const reportingEndpoints =
      'csp-endpoint="/api/csp-report", default="/api/csp-report"';

    // Shared non-CSP hardening headers that apply to every response.
    // - HSTS: two years + preload (already on the HSTS preload list policy).
    // - X-Content-Type-Options: blocks MIME sniffing.
    // - Referrer-Policy: strict-origin-when-cross-origin matches the browser
    //   default but locking it here avoids surprises if the browser default
    //   loosens.
    // - Permissions-Policy: deny every feature CivAccount does not use.
    // - Cross-Origin-*: pin same-origin to defeat Spectre-class attacks and
    //   `target=_blank` window.opener tricks.
    // - X-Permitted-Cross-Domain-Policies: defeat Flash-era cross-domain
    //   trickery (still flagged by WAF scanners; defence-in-depth).
    const commonHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      {
        key: 'Permissions-Policy',
        value:
          'accelerometer=(), autoplay=(), browsing-topics=(), camera=(), ' +
          'cross-origin-isolated=(), display-capture=(), encrypted-media=(), ' +
          'fullscreen=(self), geolocation=(), gyroscope=(), hid=(), ' +
          'identity-credentials-get=(), idle-detection=(), interest-cohort=(), ' +
          'keyboard-map=(), magnetometer=(), microphone=(), midi=(), ' +
          'otp-credentials=(), payment=(self "https://checkout.stripe.com"), ' +
          'picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), ' +
          'serial=(), storage-access=(), sync-xhr=(), usb=(), web-share=(), ' +
          'window-management=(), xr-spatial-tracking=()',
      },
      { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Reporting-Endpoints', value: reportingEndpoints },
    ];

    return [
      // ─── Embed pages: framing allowed, still hardened otherwise ─────────
      {
        source: '/embed/:path*',
        headers: [
          ...commonHeaders,
          // No X-Frame-Options: CSP frame-ancestors is authoritative and
          // mixing the two with conflicting values breaks some browsers.
          // "ALLOWALL" was never a valid value anyway — browsers silently
          // dropped it.  frame-ancestors * in the embed CSP is the real
          // framing policy.
          { key: 'Content-Security-Policy', value: embedCsp },
        ],
      },
      // ─── OG share card endpoints: must be embeddable cross-origin ───────
      {
        source: '/api/share/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      // ─── Everything else ────────────────────────────────────────────────
      {
        source: '/((?!embed|api/share).*)',
        headers: [
          ...commonHeaders,
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: siteCsp },
        ],
      },
    ];
  },
  // Strip the `X-Powered-By: Next.js` header — free framework fingerprint
  // and vulnerability-surface advertising.
  poweredByHeader: false,
};

export default nextConfig;