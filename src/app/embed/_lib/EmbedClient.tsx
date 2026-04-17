'use client';

import { useEffect, useMemo } from 'react';
import {
  calculateBands,
  getAverageBandDByType,
  getCouncilPopulation,
  getTotalBandD,
  type Council,
  type ServiceSpendingDetail,
} from '@/data/councils';
import { EmbedProvider } from '@/lib/embed-context';
import YourBillCard from '@/components/dashboard/YourBillCard';
import TaxBandsCard from '@/components/dashboard/TaxBandsCard';
import BillHistoryCard from '@/components/dashboard/BillHistoryCard';
import SpendingCard from '@/components/dashboard/SpendingCard';
import SuppliersGrantsCard from '@/components/dashboard/SuppliersGrantsCard';
import FinancialHealthCard from '@/components/dashboard/FinancialHealthCard';
import LeadershipCard from '@/components/dashboard/LeadershipCard';
import PayAllowancesCard from '@/components/dashboard/PayAllowancesCard';
import ServiceOutcomesCard from '@/components/dashboard/ServiceOutcomesCard';
import EmbedAutoResize from './EmbedAutoResize';
import EmbedFooter from './EmbedFooter';

export type EmbedCardType =
  | 'your-bill'
  | 'bill-breakdown'
  | 'tax-bands'
  | 'bill-history'
  | 'spending'
  | 'suppliers'
  | 'grants'
  | 'financial-health'
  | 'leadership'
  | 'pay'
  | 'performance'
  | 'service-outcomes';

interface EmbedClientProps {
  council: Council;
  cardType: EmbedCardType;
  theme: 'auto' | 'light' | 'dark';
  dataYear: string;
  pinned: boolean;
  viewHref: string;
}

export default function EmbedClient({
  council,
  cardType,
  theme,
  dataYear,
  pinned,
  viewHref,
}: EmbedClientProps) {
  // Apply theme: auto lets system decide, light/dark force class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const sync = () => root.classList.toggle('dark', mq.matches);
      sync();
      mq.addEventListener('change', sync);
      return () => mq.removeEventListener('change', sync);
    }
  }, [theme]);

  const councilTax = council.council_tax;
  const budget = council.budget;
  const detailed = council.detailed;

  const totalBudget = budget?.total_service ? budget.total_service * 1000 : null;
  const population = getCouncilPopulation(council.name);

  const thisCouncilBandD = useMemo(() => {
    if (!councilTax) return null;
    if (detailed?.precepts && detailed.precepts.length > 0) {
      const councilNameLower = council.name.toLowerCase();
      const matching = detailed.precepts.find(p => {
        const authLower = p.authority.toLowerCase();
        return authLower.includes(councilNameLower) ||
               councilNameLower.split(' ').some(word => word.length > 3 && authLower.includes(word));
      });
      if (matching) return matching.band_d;
    }
    return councilTax.band_d_2025;
  }, [council, councilTax, detailed]);

  const taxChange = councilTax && councilTax.band_d_2024
    ? ((councilTax.band_d_2025 - councilTax.band_d_2024) / councilTax.band_d_2024) * 100
    : null;

  const typeAverage = getAverageBandDByType(council.type);
  const vsAverage = typeAverage && councilTax ? councilTax.band_d_2025 - typeAverage : null;

  const totalBandDBill = getTotalBandD(council);
  const totalDailyCost = totalBandDBill ? totalBandDBill / 365 : null;

  const taxChangeAmount = councilTax && councilTax.band_d_2024
    ? councilTax.band_d_2025 - councilTax.band_d_2024
    : null;

  const allBands = useMemo(() => {
    if (!councilTax) return null;
    return calculateBands(councilTax.band_d_2025);
  }, [councilTax]);

  const totalBandAmounts = useMemo(() => {
    if (!totalBandDBill || !allBands || !councilTax) return null;
    const bandDRatio = totalBandDBill / councilTax.band_d_2025;
    return {
      A: allBands.A * bandDRatio,
      B: allBands.B * bandDRatio,
      C: allBands.C * bandDRatio,
      D: totalBandDBill,
      E: allBands.E * bandDRatio,
      F: allBands.F * bandDRatio,
      G: allBands.G * bandDRatio,
      H: allBands.H * bandDRatio,
    };
  }, [totalBandDBill, allBands, councilTax]);

  const spendingCategories = useMemo(() => {
    if (!budget) return [];
    const total = budget.total_service || 1;
    const serviceMap = [
      { key: 'environmental', name: 'Bins, streets & environment' },
      { key: 'planning', name: 'Planning' },
      { key: 'central_services', name: 'Running the council' },
      { key: 'cultural', name: 'Parks, libraries & leisure' },
      { key: 'housing', name: 'Housing' },
      { key: 'adult_social_care', name: 'Adult social care' },
      { key: 'childrens_social_care', name: "Children's services" },
      { key: 'education', name: 'Education' },
      { key: 'transport', name: 'Roads & transport' },
      { key: 'public_health', name: 'Public health' },
    ];
    const categories: Array<{ name: string; amount: number; percentage: number; key: string; yourShare: number | null }> = [];
    for (const service of serviceMap) {
      const amount = budget[service.key as keyof typeof budget] as number | null;
      if (amount && amount > 0) {
        const percentage = (amount / total) * 100;
        const yourShare = councilTax ? (councilTax.band_d_2025 * percentage) / 100 : null;
        categories.push({ name: service.name, amount: amount * 1000, percentage, key: service.key, yourShare });
      }
    }
    return categories.sort((a, b) => b.percentage - a.percentage);
  }, [budget, councilTax]);

  const serviceSpendingMap = useMemo(() => {
    const map = new Map<string, ServiceSpendingDetail>();
    if (detailed?.service_spending) {
      for (const item of detailed.service_spending) {
        map.set(item.category, item);
      }
    }
    return map;
  }, [detailed]);

  const reservesInWeeks = useMemo(() => {
    if (!detailed?.reserves) return null;
    const annualBudget = detailed.revenue_budget || totalBudget;
    if (!annualBudget || annualBudget === 0) return null;
    const weeklyBudget = annualBudget / 52;
    const weeks = Math.round(detailed.reserves / weeklyBudget);
    return weeks > 0 ? weeks : null;
  }, [detailed?.reserves, detailed?.revenue_budget, totalBudget]);

  let card: React.ReactNode = null;

  switch (cardType) {
    case 'your-bill':
    case 'bill-breakdown':
      card = (
        <YourBillCard
          selectedCouncil={council}
          thisCouncilBandD={thisCouncilBandD}
          taxChange={taxChange}
          taxChangeAmount={taxChangeAmount}
          vsAverage={vsAverage}
          totalDailyCost={totalDailyCost}
        />
      );
      break;
    case 'tax-bands':
      if (allBands) {
        card = (
          <TaxBandsCard
            selectedCouncil={council}
            allBands={allBands}
            totalBandAmounts={totalBandAmounts}
          />
        );
      }
      break;
    case 'bill-history':
      card = <BillHistoryCard selectedCouncil={council} />;
      break;
    case 'spending':
      if (spendingCategories.length > 0) {
        card = (
          <SpendingCard
            selectedCouncil={council}
            spendingCategories={spendingCategories}
            serviceSpendingMap={serviceSpendingMap}
            totalBudget={totalBudget}
            population={population}
          />
        );
      }
      break;
    case 'suppliers':
    case 'grants':
      card = <SuppliersGrantsCard selectedCouncil={council} />;
      break;
    case 'financial-health':
      card = <FinancialHealthCard selectedCouncil={council} reservesInWeeks={reservesInWeeks} />;
      break;
    case 'leadership':
      card = <LeadershipCard selectedCouncil={council} />;
      break;
    case 'pay':
      card = <PayAllowancesCard selectedCouncil={council} />;
      break;
    case 'performance':
    case 'service-outcomes':
      card = <ServiceOutcomesCard selectedCouncil={council} />;
      break;
  }

  if (!card) {
    return (
      <EmbedProvider>
        <div className="p-6">
          <div className="card-elevated p-6">
            <p className="type-body text-muted-foreground">
              Data isn&apos;t available for this card yet.
            </p>
          </div>
          <EmbedFooter councilName={council.name} viewHref={viewHref} dataYear={dataYear} pinned={pinned} />
        </div>
        <EmbedAutoResize />
      </EmbedProvider>
    );
  }

  return (
    <EmbedProvider>
      <div className="p-4 sm:p-5 bg-background min-h-screen">
        {card}
        <EmbedFooter councilName={council.name} viewHref={viewHref} dataYear={dataYear} pinned={pinned} />
      </div>
      <EmbedAutoResize />
    </EmbedProvider>
  );
}
