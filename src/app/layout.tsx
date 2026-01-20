import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CouncilProvider } from "@/context/CouncilContext";

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
  description: "Explore how your local council spends your money. Budget breakdowns, council tax data, and spending insights for all 324 English councils.",
  metadataBase: new URL('https://civaccount.uk'),
  openGraph: {
    title: "CivAccount - See where your council tax goes",
    description: "Explore how your local council spends your money. Budget breakdowns, council tax data, and spending insights for all 324 English councils.",
    siteName: "CivAccount",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CivAccount - See where your council tax goes",
    description: "Explore how your local council spends your money. Budget breakdowns for all 324 English councils.",
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Skip link for keyboard navigation - WCAG 2.1 requirement */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <CouncilProvider>
          {children}
        </CouncilProvider>
      </body>
    </html>
  );
}