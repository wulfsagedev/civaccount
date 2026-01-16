'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-xl space-y-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold">Find Your Council</h2>
              <p className="text-muted-foreground text-lg">
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
        <div className="container mx-auto px-3 py-4 sm:px-6 sm:py-6 max-w-7xl">
          {/* Combined Council Header Card */}
          <div className="mb-5 sm:mb-6">
            <CouncilSelector
              variant="dashboard"
              explainerText={getExplainerText()}
            />
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <div className="mb-5 sm:mb-6 -mx-3 px-3 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex w-full sm:w-auto h-auto p-1 sm:p-1.5 gap-0.5 sm:gap-1 bg-muted/50 rounded-xl overflow-x-auto scrollbar-hide">
                <TabsTrigger
                  value="overview"
                  className="flex-1 sm:flex-none text-[11px] sm:text-sm px-3 py-2.5 sm:px-4 sm:py-2.5 rounded-lg font-medium whitespace-nowrap transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="council-tax"
                  className="flex-1 sm:flex-none text-[11px] sm:text-sm px-3 py-2.5 sm:px-4 sm:py-2.5 rounded-lg font-medium whitespace-nowrap transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Council Tax
                </TabsTrigger>
                <TabsTrigger
                  value="services"
                  className="flex-1 sm:flex-none text-[11px] sm:text-sm px-3 py-2.5 sm:px-4 sm:py-2.5 rounded-lg font-medium whitespace-nowrap transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Services
                </TabsTrigger>
                <TabsTrigger
                  value="revenue"
                  className="flex-1 sm:flex-none text-[11px] sm:text-sm px-3 py-2.5 sm:px-4 sm:py-2.5 rounded-lg font-medium whitespace-nowrap transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Revenue
                </TabsTrigger>
                <TabsTrigger
                  value="performance"
                  className="flex-1 sm:flex-none text-[11px] sm:text-sm px-3 py-2.5 sm:px-4 sm:py-2.5 rounded-lg font-medium whitespace-nowrap transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Performance
                </TabsTrigger>
                <TabsTrigger
                  value="comparison"
                  className="flex-1 sm:flex-none text-[11px] sm:text-sm px-3 py-2.5 sm:px-4 sm:py-2.5 rounded-lg font-medium whitespace-nowrap transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Compare
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <TabsContent value="overview" className="mt-0 space-y-4 sm:space-y-6">
                <BudgetOverview />
              </TabsContent>

              <TabsContent value="council-tax" className="mt-0 space-y-4 sm:space-y-6">
                <CouncilTaxSection />
              </TabsContent>

              <TabsContent value="services" className="mt-0 space-y-4 sm:space-y-6">
                <ServicesSpending />
              </TabsContent>

              <TabsContent value="revenue" className="mt-0 space-y-4 sm:space-y-6">
                <RevenueBreakdown />
              </TabsContent>

              <TabsContent value="performance" className="mt-0 space-y-4 sm:space-y-6">
                <PerformanceMetrics />
              </TabsContent>

              <TabsContent value="comparison" className="mt-0 space-y-4 sm:space-y-6">
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
