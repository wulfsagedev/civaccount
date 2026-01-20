import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { CouncilProvider } from "@/context/CouncilContext";
import { ScrollToTop } from "@/components/ScrollToTop";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CivAccount - See where your council tax goes",
  description: "Explore how your local council spends your money. See exactly where every pound goes with budget breakdowns, council tax rates by band, and spending insights for all 324 English councils.",
  metadataBase: new URL('https://civaccount.uk'),
  openGraph: {
    title: "CivAccount - See where your council tax goes",
    description: "Explore how your local council spends your money. See exactly where every pound goes with budget breakdowns, council tax rates by band, and spending insights for all 324 English councils.",
    siteName: "CivAccount",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CivAccount - See where your council tax goes",
    description: "Explore how your local council spends your money. See exactly where every pound goes with budget breakdowns, council tax rates by band, and spending insights for all 324 English councils.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
                  "@id": "https://civaccount.uk/#website",
                  "url": "https://civaccount.uk",
                  "name": "CivAccount",
                  "description": "UK council budget transparency. See exactly where your council tax goes.",
                  "inLanguage": "en-GB",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                      "@type": "EntryPoint",
                      "urlTemplate": "https://civaccount.uk/?search={search_term_string}"
                    },
                    "query-input": "required name=search_term_string"
                  }
                },
                {
                  "@type": "Organization",
                  "@id": "https://civaccount.uk/#organization",
                  "name": "CivAccount",
                  "url": "https://civaccount.uk",
                  "description": "Open source council budget transparency project for UK citizens.",
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
        <CouncilProvider>
          <ScrollToTop />
          {children}
        </CouncilProvider>
        <Analytics />
      </body>
    </html>
  );
}