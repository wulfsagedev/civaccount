import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { CouncilProvider } from "@/context/CouncilContext";
import { AuthProvider } from "@/context/AuthContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { RouteAnnouncer } from "@/components/RouteAnnouncer";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Council Tax & Spending, All 317 English Councils",
    template: "%s | CivAccount",
  },
  description: "See where your council tax goes. Band D rates, budget breakdowns, CEO salaries and suppliers for all 317 English councils. Free, independent, from .gov.uk.",
  metadataBase: new URL('https://www.civaccount.co.uk'),
  applicationName: 'CivAccount',
  authors: [{ name: 'CivAccount', url: 'https://www.civaccount.co.uk/about' }],
  keywords: [
    'council tax',
    'council tax England',
    'council tax 2025',
    'council tax by council',
    'council budget',
    'local government spending',
    'council CEO salary',
    'council tax band D',
    'civic transparency',
  ],
  openGraph: {
    title: "Council Tax & Spending for All 317 English Councils",
    description: "See where your council tax goes. Band D rates, budget breakdowns, CEO salaries and supplier contracts for all 317 English councils. Free and independent.",
    siteName: "CivAccount",
    locale: "en_GB",
    type: "website",
    url: 'https://www.civaccount.co.uk',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'CivAccount — Council tax and spending for all 317 English councils',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Council Tax & Spending for All 317 English Councils",
    description: "See where your council tax goes. Band D rates, budget breakdowns, CEO salaries and supplier contracts for all 317 English councils.",
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  other: {
    'theme-color': '#1c1917',
  },
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': [
        { url: '/updates/rss.xml', title: 'CivAccount updates' },
      ],
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical third-party origins — cuts ~120ms off LCP
            (Lighthouse "uses-rel-preconnect"). Only the domains actually
            loaded on every page: Vercel Analytics script + Supabase client.
            Do not add speculative preconnects — each one costs a TCP+TLS
            handshake on every visit. */}
        <link rel="preconnect" href="https://va.vercel-scripts.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://va.vercel-scripts.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
        {/* Structured Data - Organization and WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://www.civaccount.co.uk/#website",
                  "url": "https://www.civaccount.co.uk",
                  "name": "CivAccount",
                  "description": "UK council budget transparency. See exactly where your council tax goes.",
                  "inLanguage": "en-GB",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                      "@type": "EntryPoint",
                      "urlTemplate": "https://www.civaccount.co.uk/?search={search_term_string}"
                    },
                    "query-input": "required name=search_term_string"
                  }
                },
                {
                  "@type": "Organization",
                  "@id": "https://www.civaccount.co.uk/#organization",
                  "name": "CivAccount",
                  "alternateName": "Civ Account",
                  "url": "https://www.civaccount.co.uk",
                  "description": "Free, independent database of UK council finance covering all 317 English councils. Every figure traced to an official .gov.uk source.",
                  "foundingDate": "2025-09-01",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.civaccount.co.uk/icon-512",
                    "width": 512,
                    "height": 512
                  },
                  "image": "https://www.civaccount.co.uk/opengraph-image",
                  "sameAs": [
                    "https://github.com/wulfsagedev/civaccount"
                  ],
                  "founder": {
                    "@type": "Person",
                    "@id": "https://www.civaccount.co.uk/#founder",
                    "name": "Owen Fisher",
                    "jobTitle": "Founder",
                    "worksFor": { "@id": "https://www.civaccount.co.uk/#organization" }
                  },
                  "contactPoint": [
                    {
                      "@type": "ContactPoint",
                      "contactType": "public engagement",
                      "url": "https://www.civaccount.co.uk/press",
                      "availableLanguage": ["en-GB"]
                    }
                  ],
                  "knowsAbout": [
                    "UK local government",
                    "council tax",
                    "council budgets",
                    "public finance",
                    "local authority spending",
                    "civic technology",
                    "open data"
                  ],
                  "areaServed": {
                    "@type": "Country",
                    "name": "United Kingdom"
                  }
                }
              ]
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Skip link for keyboard navigation - WCAG 2.1 requirement */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthProvider>
          <CouncilProvider>
            <ScrollToTop />
            <RouteAnnouncer />
            {children}
          </CouncilProvider>
        </AuthProvider>
        <Toaster position="bottom-center" toastOptions={{ duration: 5000 }} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}