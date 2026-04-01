'use client';

import { useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle,
  Accessibility,
  Eye,
  Keyboard,
  Monitor,
  Smartphone,
  Moon,
  Volume2,
  MousePointer2
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const accessibilityFeatures = [
  {
    icon: Eye,
    title: "Colour contrast",
    description: "All text meets WCAG 2.1 AA standards with a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text.",
    details: [
      "Tested against both light and dark backgrounds",
      "Muted colours carefully calibrated for readability",
      "No information conveyed by colour alone"
    ]
  },
  {
    icon: Keyboard,
    title: "Keyboard navigation",
    description: "Every feature is accessible using only a keyboard. Tab through the site, press Enter to activate, and use arrow keys where appropriate.",
    details: [
      "Skip link to jump straight to main content",
      "Visible focus indicators on all interactive elements",
      "Logical tab order throughout the site"
    ]
  },
  {
    icon: Volume2,
    title: "Screen reader support",
    description: "Semantic HTML and ARIA labels ensure screen readers can accurately describe all content and functionality.",
    details: [
      "Proper heading hierarchy (h1, h2, h3)",
      "Descriptive link text (no \"click here\")",
      "Alt text for meaningful images"
    ]
  },
  {
    icon: MousePointer2,
    title: "Touch targets",
    description: "All buttons and interactive elements have a minimum touch target of 44x44 pixels, making them easy to tap on mobile devices.",
    details: [
      "Generous padding on all buttons",
      "Well-spaced navigation links",
      "Mobile-optimised form controls"
    ]
  },
  {
    icon: Monitor,
    title: "Reduced motion",
    description: "Animations and transitions are automatically disabled for users who prefer reduced motion in their system settings.",
    details: [
      "Respects prefers-reduced-motion",
      "Essential functionality works without animation",
      "No flashing or strobing content"
    ]
  },
  {
    icon: Moon,
    title: "Dark mode",
    description: "A carefully designed dark theme reduces eye strain in low-light conditions and respects system preferences.",
    details: [
      "Automatically follows system settings",
      "Manual toggle available",
      "Same contrast standards as light mode"
    ]
  }
];

const standards = [
  { name: "WCAG 2.1 Level AA", status: "compliant" },
  { name: "Keyboard accessible", status: "compliant" },
  { name: "Screen reader compatible", status: "compliant" },
  { name: "Colour contrast 4.5:1", status: "compliant" },
  { name: "Touch targets 44px", status: "compliant" },
  { name: "Reduced motion support", status: "compliant" }
];

export default function AccessibilityPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main id="main-content" className="flex-1">
        <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 max-w-7xl">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 cursor-pointer">
                  <ArrowLeft className="h-4 w-4" />
                  Back to home
                </Button>
              </Link>
            </div>

            <div className="space-y-8">
              {/* Page Header */}
              <div className="text-center space-y-3">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Accessibility className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold">Accessibility</h1>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  CivAccount is designed to be accessible to everyone. We follow WCAG 2.1 AA
                  guidelines and continuously work to improve the experience for all users.
                </p>
              </div>

              {/* Standards Compliance */}
              <div className="card-elevated p-6 sm:p-8">
                <h2 className="type-title-2 mb-6">Our standards</h2>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  We believe everyone should be able to understand how their council spends money.
                  That means building a site that works for people with visual, motor, auditory,
                  and cognitive disabilities.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {standards.map((standard) => (
                    <div key={standard.name} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                      <CheckCircle className="h-4 w-4 shrink-0 text-positive" />
                      <span className="text-sm font-medium">{standard.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features Grid */}
              <div className="space-y-6">
                <h2 className="type-title-2">Accessibility features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {accessibilityFeatures.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div key={feature.title} className="card-elevated p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-2">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                              {feature.description}
                            </p>
                            <ul className="space-y-2">
                              {feature.details.map((detail, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-stone-400" />
                                  <span>{detail}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Testing */}
              <div className="card-elevated p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="type-title-2 mb-2">How we test</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      We regularly test CivAccount using:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-stone-400" />
                        <span>Keyboard-only navigation</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-stone-400" />
                        <span>VoiceOver (macOS) and NVDA (Windows) screen readers</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-stone-400" />
                        <span>Browser zoom up to 200%</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-stone-400" />
                        <span>High contrast mode (Windows)</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-stone-400" />
                        <span>Automated tools (axe, Lighthouse)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Feedback */}
              <div className="p-6 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex gap-4">
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Accessibility className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Found an accessibility issue?
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      We take accessibility seriously. If you encounter any barriers using CivAccount,
                      please let us know so we can fix them.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.dispatchEvent(new CustomEvent('open-feedback'))}
                      className="cursor-pointer"
                    >
                      Report an issue
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
