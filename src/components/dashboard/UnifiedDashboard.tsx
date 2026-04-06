'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChevronUp } from "lucide-react";
import { useCouncil } from '@/context/CouncilContext';
import { formatCurrency, formatBudget, getCouncilPopulation, getAverageBandDByType, calculateBands, type ServiceSpendingDetail } from '@/data/councils';
import ContributeBanner from '@/components/ContributeBanner';
import YourBillCard from '@/components/dashboard/YourBillCard';
import TaxBandsCard from '@/components/dashboard/TaxBandsCard';
import BillHistoryCard from '@/components/dashboard/BillHistoryCard';
import SpendingCard from '@/components/dashboard/SpendingCard';
import SuppliersGrantsCard from '@/components/dashboard/SuppliersGrantsCard';
import FinancialHealthCard from '@/components/dashboard/FinancialHealthCard';
import LeadershipCard from '@/components/dashboard/LeadershipCard';
import PayAllowancesCard from '@/components/dashboard/PayAllowancesCard';
import WhoToContactCard from '@/components/dashboard/WhoToContactCard';
import ServiceOutcomesCard from '@/components/dashboard/ServiceOutcomesCard';

const UnifiedDashboard = () => {
  const { selectedCouncil } = useCouncil();
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Back-to-top visibility
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 1200);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // All data calculations
  const budget = selectedCouncil?.budget;
  const councilTax = selectedCouncil?.council_tax;
  const detailed = selectedCouncil?.detailed;

  const totalBudget = budget?.total_service ? budget.total_service * 1000 : null;
  const population = selectedCouncil ? getCouncilPopulation(selectedCouncil.name) : null;

  // Get the council's own portion from precepts (more precise) or fall back to band_d_2025
  const thisCouncilBandD = useMemo(() => {
    if (!selectedCouncil || !councilTax) return null;

    if (detailed?.precepts && detailed.precepts.length > 0) {
      const councilNameLower = selectedCouncil.name.toLowerCase();
      const matchingPrecept = detailed.precepts.find(p => {
        const authLower = p.authority.toLowerCase();
        return authLower.includes(councilNameLower) ||
               councilNameLower.split(' ').some(word => word.length > 3 && authLower.includes(word));
      });
      if (matchingPrecept) {
        return matchingPrecept.band_d;
      }
    }
    return councilTax.band_d_2025;
  }, [selectedCouncil, councilTax, detailed]);

  const taxChange = councilTax && councilTax.band_d_2024
    ? ((councilTax.band_d_2025 - councilTax.band_d_2024) / councilTax.band_d_2024 * 100)
    : null;

  const typeAverage = selectedCouncil ? getAverageBandDByType(selectedCouncil.type) : null;
  const vsAverage = typeAverage && councilTax ? councilTax.band_d_2025 - typeAverage : null;

  const totalDailyCost = detailed?.total_band_d ? detailed.total_band_d / 365 : null;

  const taxChangeAmount = councilTax && councilTax.band_d_2024
    ? councilTax.band_d_2025 - councilTax.band_d_2024
    : null;

  // Calculate reserves in weeks of operation
  const reservesInWeeks = useMemo(() => {
    if (!detailed?.reserves) return null;
    const annualBudget = detailed.revenue_budget || totalBudget;
    if (!annualBudget || annualBudget === 0) return null;
    const weeklyBudget = annualBudget / 52;
    const weeks = Math.round(detailed.reserves / weeklyBudget);
    return weeks > 0 ? weeks : null;
  }, [detailed?.reserves, detailed?.revenue_budget, totalBudget]);

  // Calculate all bands
  const allBands = useMemo(() => {
    if (!councilTax) return null;
    return calculateBands(councilTax.band_d_2025);
  }, [councilTax]);

  // Calculate total band amounts including precepts
  const totalBandAmounts = useMemo(() => {
    if (!detailed?.total_band_d || !allBands) return null;
    const bandDRatio = detailed.total_band_d / councilTax!.band_d_2025;
    return {
      A: allBands.A * bandDRatio,
      B: allBands.B * bandDRatio,
      C: allBands.C * bandDRatio,
      D: detailed.total_band_d,
      E: allBands.E * bandDRatio,
      F: allBands.F * bandDRatio,
      G: allBands.G * bandDRatio,
      H: allBands.H * bandDRatio,
    };
  }, [detailed, allBands, councilTax]);

  // Build spending categories with "your share" calculation
  const spendingCategories = useMemo(() => {
    if (!budget) return [];

    const total = budget.total_service || 1;
    const categories: Array<{
      name: string;
      amount: number;
      percentage: number;
      key: string;
      yourShare: number | null;
    }> = [];

    const serviceMap = [
      { key: 'environmental', name: 'Environment & Streets' },
      { key: 'planning', name: 'Planning' },
      { key: 'central_services', name: 'Council Services' },
      { key: 'cultural', name: 'Leisure & Culture' },
      { key: 'housing', name: 'Housing' },
      { key: 'adult_social_care', name: 'Adult Social Care' },
      { key: 'childrens_social_care', name: "Children's Services" },
      { key: 'education', name: 'Education' },
      { key: 'transport', name: 'Roads & Transport' },
      { key: 'public_health', name: 'Public Health' },
    ];

    for (const service of serviceMap) {
      const amount = budget[service.key as keyof typeof budget] as number | null;
      if (amount && amount > 0) {
        const percentage = (amount / total) * 100;
        const yourShare = councilTax ? (councilTax.band_d_2025 * percentage) / 100 : null;

        categories.push({
          name: service.name,
          amount: amount * 1000,
          percentage,
          key: service.key,
          yourShare,
        });
      }
    }

    return categories.sort((a, b) => b.percentage - a.percentage);
  }, [budget, councilTax]);

  // Build lookup from service_spending for drill-down data
  const serviceSpendingMap = useMemo(() => {
    const map = new Map<string, ServiceSpendingDetail>();
    if (detailed?.service_spending) {
      for (const item of detailed.service_spending) {
        map.set(item.category, item);
      }
    }
    return map;
  }, [detailed]);

  if (!selectedCouncil) {
    return (
      <div className="card-elevated p-8 text-center">
        <p className="text-muted-foreground">Please select a council to view information.</p>
      </div>
    );
  }

  const hasHistoricalData = councilTax?.band_d_2021 && councilTax?.band_d_2022 && councilTax?.band_d_2023 && councilTax?.band_d_2024;
  const hasSupplierOrGrantData = detailed?.top_suppliers?.length || detailed?.grant_payments?.length;
  const hasFinancialData = detailed?.savings_achieved || detailed?.reserves || detailed?.mtfs_deficit || detailed?.accountability;
  const hasLeadershipData = detailed?.chief_executive || detailed?.cabinet?.find(m => m.role === 'Leader');
  const hasPayData = detailed?.councillor_allowances_detail?.length || detailed?.salary_bands?.length;
  const isTwoTier = selectedCouncil.type === 'SD' || selectedCouncil.type === 'SC';
  const hasServiceOutcomes = detailed?.service_outcomes;
  const hasPerformanceData = detailed?.performance_kpis?.length || detailed?.waste_destinations?.length || detailed?.service_outcomes?.roads?.maintenance_backlog;

  return (
    <div className="space-y-5">
      {/* SECTION 1: Your Bill */}
      <YourBillCard
        selectedCouncil={selectedCouncil}
        thisCouncilBandD={thisCouncilBandD}
        taxChange={taxChange}
        taxChangeAmount={taxChangeAmount}
        vsAverage={vsAverage}
        totalDailyCost={totalDailyCost}
      />

      {/* SECTION 2: Tax Bands */}
      {allBands && (
        <TaxBandsCard
          selectedCouncil={selectedCouncil}
          allBands={allBands}
          totalBandAmounts={totalBandAmounts}
        />
      )}

      {/* SECTION 2.5: Bill History */}
      {hasHistoricalData && (
        <BillHistoryCard selectedCouncil={selectedCouncil} />
      )}

      {/* SECTION 3 + 3a: Spending + Have Your Say */}
      {spendingCategories.length > 0 && (
        <SpendingCard
          selectedCouncil={selectedCouncil}
          spendingCategories={spendingCategories}
          serviceSpendingMap={serviceSpendingMap}
          totalBudget={totalBudget}
          population={population}
        />
      )}

      {/* SECTION 3b: Suppliers & Grants */}
      {hasSupplierOrGrantData && (
        <SuppliersGrantsCard selectedCouncil={selectedCouncil} />
      )}

      {/* SECTION 5 + 5b: Financial Health & Accountability */}
      {hasFinancialData && (
        <FinancialHealthCard
          selectedCouncil={selectedCouncil}
          reservesInWeeks={reservesInWeeks}
        />
      )}

      {/* Contribute CTA */}
      <ContributeBanner />

      {/* SECTION 8: Leadership */}
      {hasLeadershipData && (
        <LeadershipCard selectedCouncil={selectedCouncil} />
      )}

      {/* SECTION 8b: Pay & Allowances */}
      {hasPayData && (
        <PayAllowancesCard selectedCouncil={selectedCouncil} />
      )}

      {/* SECTION 8 contact + 8b districts: Who to Contact */}
      {isTwoTier && (
        <WhoToContactCard selectedCouncil={selectedCouncil} />
      )}

      {/* SECTION 8a + 8a.2: Service Outcomes & Performance */}
      {(hasServiceOutcomes || hasPerformanceData) && (
        <ServiceOutcomesCard selectedCouncil={selectedCouncil} />
      )}

      {/* SECTION 8.5: Common Questions (FAQ) - kept inline */}
      {councilTax && (
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Common questions</h2>
          <p className="type-body-sm text-muted-foreground mb-5">Quick answers about your council tax</p>

          <div className="space-y-3">
            {detailed?.total_band_d && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="type-body-sm font-semibold mb-1">What percentage of my bill goes to {selectedCouncil.name}?</p>
                <p className="type-caption text-muted-foreground">
                  <span className="font-semibold text-foreground">{((councilTax.band_d_2025 / detailed.total_band_d) * 100).toFixed(0)}%</span> of your total bill ({formatCurrency(councilTax.band_d_2025, { decimals: 2 })} out of {formatCurrency(detailed.total_band_d, { decimals: 2 })})
                </p>
              </div>
            )}

            {spendingCategories.length > 0 && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="type-body-sm font-semibold mb-1">What does most of my money go towards?</p>
                <p className="type-caption text-muted-foreground">
                  <span className="font-semibold text-foreground">{spendingCategories[0].name}</span> takes the biggest share at {spendingCategories[0].percentage.toFixed(0)}%
                  {spendingCategories[0].yourShare && ` (${formatCurrency(spendingCategories[0].yourShare, { decimals: 0 })} of your bill)`}
                </p>
              </div>
            )}

            {vsAverage !== null && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="type-body-sm font-semibold mb-1">Is this council expensive compared to others?</p>
                <p className="type-caption text-muted-foreground">
                  {vsAverage > 0 ? (
                    <>This council charges <span className="font-semibold text-negative">{formatCurrency(vsAverage, { decimals: 2 })} more</span> than the average {selectedCouncil.type_name.toLowerCase()}</>
                  ) : vsAverage < 0 ? (
                    <>This council charges <span className="font-semibold text-positive">{formatCurrency(Math.abs(vsAverage), { decimals: 2 })} less</span> than the average {selectedCouncil.type_name.toLowerCase()}</>
                  ) : (
                    <>This council charges about the same as the average {selectedCouncil.type_name.toLowerCase()}</>
                  )}
                </p>
              </div>
            )}

            {taxChange !== null && taxChangeAmount !== null && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="type-body-sm font-semibold mb-1">How much has my bill gone up this year?</p>
                <p className="type-caption text-muted-foreground">
                  {taxChangeAmount > 0 ? (
                    <>Your bill went up by <span className="font-semibold text-negative">{formatCurrency(taxChangeAmount, { decimals: 2 })}</span> ({taxChange.toFixed(1)}%) from last year</>
                  ) : taxChangeAmount < 0 ? (
                    <>Your bill went down by <span className="font-semibold text-positive">{formatCurrency(Math.abs(taxChangeAmount), { decimals: 2 })}</span> ({Math.abs(taxChange).toFixed(1)}%) from last year</>
                  ) : (
                    <>Your bill stayed the same as last year</>
                  )}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Data sources, documents, and methodology are consolidated in DataSourcesFooter */}

      {/* Back to top button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-foreground text-background shadow-lg flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
          aria-label="Back to top"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default UnifiedDashboard;
