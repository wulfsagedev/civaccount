'use client';

import { useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ThankYouPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-12 sm:px-6 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-positive/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-positive" />
          </div>

          <Badge variant="outline" className="mb-4">Donation received</Badge>

          <h1 className="type-title-1 font-semibold mb-4">Thank you!</h1>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            Your support is appreciated.
          </p>

          <Link href="/">
            <Button className="gap-2 cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
              Back to CivAccount
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
