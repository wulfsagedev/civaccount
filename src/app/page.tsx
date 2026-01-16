'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown } from 'lucide-react';
import { useCouncil } from '@/context/CouncilContext';
import { getCouncilDisplayName } from '@/data/councils';

// Import components
import CouncilSelector from '@/components/CouncilSelector';
import BudgetOverview from '@/components/dashboard/BudgetOverview';
import CouncilTaxSection from '@/components/dashboard/CouncilTaxSection';
import ServicesSpending from '@/components/dashboard/ServiceSpending';
import RevenueBreakdown from '@/components/dashboard/RevenueBreakdown';
import PerformanceMetrics from '@/components/dashboard/PerformanceMetrics';
import BandComparison from '@/components/dashboard/BandComparison';
import DataSourcesFooter from '@/components/DataSourcesFooter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CouncilDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const { selectedCouncil, isLoading } = useCouncil();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Homepage - centered search
  if (!selectedCouncil) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
          <div className="w-full max-w-xl space-y-10">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-5 bg-primary/10 rounded-full">
                  <svg className="h-10 w-10 sm:h-12 sm:w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Find Your Council</h1>
              <p className="text-muted-foreground text-base sm:text-lg">
                See where your council tax goes
              </p>
            </div>
            <CouncilSelector variant="homepage" />
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Dashboard view - when council is selected
  const councilDisplayName = getCouncilDisplayName(selectedCouncil);

  // Get the appropriate explainer text based on council type
  const getExplainerText = () => {
    if (selectedCouncil.type === 'SC' || selectedCouncil.type === 'SD') {
      return `This is just the ${selectedCouncil.name} share. Your full bill also includes county, police, and fire charges.`;
    } else if (selectedCouncil.type === 'LB' || selectedCouncil.type === 'OLB' || selectedCouncil.type === 'ILB') {
      return `This is just the ${selectedCouncil.name} share. Your full bill also includes the Greater London Authority charge.`;
    }
    return `This is just the ${selectedCouncil.name} share. Your full bill may include police and fire charges.`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 max-w-7xl">
          {/* Combined Council Header Card */}
          <div className="mb-6 sm:mb-8">
            <CouncilSelector
              variant="dashboard"
              explainerText={getExplainerText()}
            />
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            {/* Mobile: Dropdown selector */}
            <div className="mb-6 sm:hidden">
              <div className="relative">
                <select
                  value={selectedTab}
                  onChange={(e) => setSelectedTab(e.target.value)}
                  className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-4 pr-12 text-base font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  <option value="overview">Overview</option>
                  <option value="council-tax">Council Tax</option>
                  <option value="services">Services</option>
                  <option value="revenue">Revenue</option>
                  <option value="performance">Performance</option>
                  <option value="comparison">Compare</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Desktop: Full-width tabs */}
            <div className="mb-8 hidden sm:block">
              <TabsList className="w-full h-auto p-2 gap-2 bg-muted/50 rounded-xl grid grid-cols-6">
                <TabsTrigger
                  value="overview"
                  className="text-sm px-4 py-3 rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="council-tax"
                  className="text-sm px-4 py-3 rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Council Tax
                </TabsTrigger>
                <TabsTrigger
                  value="services"
                  className="text-sm px-4 py-3 rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Services
                </TabsTrigger>
                <TabsTrigger
                  value="revenue"
                  className="text-sm px-4 py-3 rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Revenue
                </TabsTrigger>
                <TabsTrigger
                  value="performance"
                  className="text-sm px-4 py-3 rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Performance
                </TabsTrigger>
                <TabsTrigger
                  value="comparison"
                  className="text-sm px-4 py-3 rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Compare
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="space-y-6 sm:space-y-8">
              <TabsContent value="overview" className="mt-0">
                <BudgetOverview />
              </TabsContent>

              <TabsContent value="council-tax" className="mt-0">
                <CouncilTaxSection />
              </TabsContent>

              <TabsContent value="services" className="mt-0">
                <ServicesSpending />
              </TabsContent>

              <TabsContent value="revenue" className="mt-0">
                <RevenueBreakdown />
              </TabsContent>

              <TabsContent value="performance" className="mt-0">
                <PerformanceMetrics />
              </TabsContent>

              <TabsContent value="comparison" className="mt-0">
                <BandComparison />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DataSourcesFooter />
      </main>

      <Footer />
    </div>
  );
}
