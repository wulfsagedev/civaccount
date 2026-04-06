import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { CouncilProvider } from "@/context/CouncilContext";
import { AuthProvider } from "@/context/AuthContext";
import { ScrollToTop } from "@/components/ScrollToTop";
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
  title: "CivAccount - See where your council tax goes",
  description: "Search by name or postcode to see how your council spends your money. Budget breakdowns, council tax by band, CEO salary, spending comparisons, and Town Hall — have your say on all 317 English councils. Free and independent.",
  metadataBase: new URL('https://www.civaccount.co.uk'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "CivAccount - See where your council tax goes",
    description: "Search by name or postcode to see how your council spends your money. Budget breakdowns, CEO salary, spending comparisons, and Town Hall for all 317 English councils.",
    siteName: "CivAccount",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CivAccount - See where your council tax goes",
    description: "Search by name or postcode to see how your council spends your money. Budget breakdowns, CEO salary, spending comparisons, and Town Hall for all 317 English councils.",
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
                  "url": "https://www.civaccount.co.uk",
                  "description": "Open source council budget transparency project for UK citizens.",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.civaccount.co.uk/icon",
                    "width": 32,
                    "height": 32
                  },
                  "sameAs": [
                    "https://github.com/wulfsagedev/civaccount"
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