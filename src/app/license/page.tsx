'use client';

import { useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Github, Scale, Heart } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function LicensePage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main id="main-content" className="flex-1">
        <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 max-w-7xl">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 cursor-pointer">
                  <ArrowLeft className="h-4 w-4" />
                  Back to home
                </Button>
              </Link>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <Badge variant="outline" className="mb-2">Open Source</Badge>
                <h1 className="text-2xl sm:text-3xl font-bold">License</h1>
                <p className="text-muted-foreground">
                  CivAccount is free and open source software
                </p>
              </div>

              {/* Open source highlight */}
              <div className="card-elevated p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Scale className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">MIT License</h2>
                    <p className="text-sm text-muted-foreground">Free to use, modify, and distribute</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm leading-relaxed">
                  <p className="text-muted-foreground">
                    CivAccount is released under the MIT License. This means you are free to:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      Use CivAccount for any purpose, including commercial projects
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      Modify the code to suit your needs
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      Distribute copies of the original or modified code
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      Include CivAccount in your own projects
                    </li>
                  </ul>
                  <p className="text-muted-foreground">
                    The only requirement is that you include the original copyright notice and
                    license text in any copy of the software.
                  </p>
                </div>
              </div>

              {/* License text */}
              <div className="card-elevated p-8">
                <h3 className="font-semibold mb-4">Full license text</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm text-muted-foreground leading-relaxed">
                  <p className="mb-4">MIT License</p>
                  <p className="mb-4">Copyright (c) 2025 Owen Fisher</p>
                  <p className="mb-4">
                    Permission is hereby granted, free of charge, to any person obtaining a copy
                    of this software and associated documentation files (the &quot;Software&quot;), to deal
                    in the Software without restriction, including without limitation the rights
                    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                    copies of the Software, and to permit persons to whom the Software is
                    furnished to do so, subject to the following conditions:
                  </p>
                  <p className="mb-4">
                    The above copyright notice and this permission notice shall be included in all
                    copies or substantial portions of the Software.
                  </p>
                  <p>
                    THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                    SOFTWARE.
                  </p>
                </div>
              </div>

              {/* Contributing */}
              <div className="card-elevated p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Heart className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Contributing</h2>
                    <p className="text-sm text-muted-foreground">Help make CivAccount better</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    We welcome contributions from the community. Whether it&apos;s fixing bugs,
                    adding features, improving documentation, or suggesting ideas, your help
                    makes CivAccount better for everyone.
                  </p>
                  <p>
                    Visit our GitHub repository to get started:
                  </p>
                </div>

                <a
                  href="https://github.com/wulfsagedev/civaccount"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium cursor-pointer"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                </a>
              </div>

              {/* Data license */}
              <div className="card-elevated p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Scale className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Data Licence</h2>
                    <p className="text-sm text-muted-foreground">Open Government Licence v3.0</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm leading-relaxed">
                  <p className="text-muted-foreground">
                    All council data displayed on CivAccount comes from UK government sources
                    and is published under the{' '}
                    <a
                      href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Open Government Licence v3.0
                    </a>.
                  </p>

                  <p className="text-muted-foreground">
                    This licence allows anyone to:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      Copy, publish, and distribute the data
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      Adapt and transform the data
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      Use the data commercially and non-commercially
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      Combine the data with other information
                    </li>
                  </ul>

                  <div className="p-4 rounded-lg bg-muted/30 mt-4">
                    <p className="font-medium text-foreground mb-2">Attribution</p>
                    <p className="text-muted-foreground">
                      Contains public sector information licensed under the Open Government Licence v3.0.
                    </p>
                    <p className="text-muted-foreground mt-2">
                      Data sources: Ministry of Housing, Communities and Local Government;
                      Office for National Statistics; individual council transparency publications.
                    </p>
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
