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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-3 py-4 sm:px-6 sm:py-6 max-w-7xl">
          {/* Page Title */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">
              {councilDisplayName} Budget 2025-26
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {selectedCouncil.type_name} • Financial year 2025-26
            </p>
          </div>

          {/* Council Info Bar */}
          <div className="mb-4">
            <CouncilSelector variant="dashboard" />
          </div>

          {/* Info Note */}
          <Alert className="mb-4 sm:mb-6 p-3 sm:p-4">
            <AlertDescription className="text-sm leading-relaxed">
              {selectedCouncil.type === 'SC' || selectedCouncil.type === 'SD' ? (
                <>The council tax shown is only the {selectedCouncil.name} portion. Your total bill also includes charges from your county council, police, and fire service.</>
              ) : selectedCouncil.type === 'LB' || selectedCouncil.type === 'OLB' || selectedCouncil.type === 'ILB' ? (
                <>The council tax shown is only the {selectedCouncil.name} portion. Your total bill also includes the Greater London Authority (GLA) charge.</>
              ) : (
                <>The council tax shown is only the {selectedCouncil.name} portion. Your total bill may also include police and fire charges.</>
              )}
            </AlertDescription>
          </Alert>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-4 sm:mb-6 h-auto p-1">
              <TabsTrigger
                value="overview"
                className="text-xs sm:text-sm px-1 py-2 sm:px-3 sm:py-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="council-tax"
                className="text-xs sm:text-sm px-1 py-2 sm:px-3 sm:py-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                Council Tax
              </TabsTrigger>
              <TabsTrigger
                value="services"
                className="text-xs sm:text-sm px-1 py-2 sm:px-3 sm:py-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                Services
              </TabsTrigger>
              <TabsTrigger
                value="revenue"
                className="text-xs sm:text-sm px-1 py-2 sm:px-3 sm:py-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                Revenue
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="text-xs sm:text-sm px-1 py-2 sm:px-3 sm:py-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                Performance
              </TabsTrigger>
              <TabsTrigger
                value="comparison"
                className="text-xs sm:text-sm px-1 py-2 sm:px-3 sm:py-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                Compare
              </TabsTrigger>
            </TabsList>

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
