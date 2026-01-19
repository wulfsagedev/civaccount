'use client';

import { useState, useMemo, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Users, Shield, GraduationCap, Car, Heart, Building, Settings, TrendingUp, CheckCircle, Info, Home, Trash2, MapPin, BookOpen, AlertTriangle } from "lucide-react";
import { useCouncil } from '@/context/CouncilContext';
import { formatBudget, formatCurrency } from '@/data/councils';

// Service descriptions - using muted grey tones
const SERVICE_INFO: Record<string, { name: string; description: string; icon: React.ElementType }> = {
  adult_social_care: {
    name: 'Adult Social Care',
    description: 'Helping older people and people with disabilities',
    icon: Shield,
  },
  childrens_social_care: {
    name: "Children's Services",
    description: 'Keeping children safe and helping families',
    icon: Users,
  },
  education: {
    name: 'Education & Schools',
    description: 'School buses and helping children learn',
    icon: GraduationCap,
  },
  transport: {
    name: 'Roads & Transport',
    description: 'Fixing roads and keeping traffic moving',
    icon: Car,
  },
  public_health: {
    name: 'Public Health',
    description: 'Stopping illness and keeping people healthy',
    icon: Heart,
  },
  housing: {
    name: 'Housing',
    description: 'Helping people find homes',
    icon: Home,
  },
  cultural: {
    name: 'Culture & Leisure',
    description: 'Libraries, museums, and community centres',
    icon: BookOpen,
  },
  environmental: {
    name: 'Environment & Streets',
    description: 'Collecting bins and keeping streets clean',
    icon: Trash2,
  },
  planning: {
    name: 'Planning & Development',
    description: 'Deciding what can be built',
    icon: MapPin,
  },
  central_services: {
    name: 'Corporate Services',
    description: 'Council operations and administration',
    icon: Building,
  },
};

const ServiceSpending = () => {
  const { selectedCouncil } = useCouncil();
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Build services list from council data
  const services = useMemo(() => {
    if (!selectedCouncil?.budget?.total_service) return [];

    const budget = selectedCouncil.budget;
    const total = budget.total_service ?? 0;
    const result: Array<{
      key: string;
      name: string;
      description: string;
      icon: React.ElementType;
      amount: number;
      percentage: number;
    }> = [];

    const serviceKeys = [
      'adult_social_care', 'childrens_social_care', 'education', 'transport',
      'public_health', 'housing', 'cultural', 'environmental', 'planning', 'central_services'
    ];

    for (const key of serviceKeys) {
      const amount = budget[key as keyof typeof budget] as number | null;
      if (amount && amount > 0) {
        const info = SERVICE_INFO[key];
        result.push({
          key,
          name: info.name,
          description: info.description,
          icon: info.icon,
          amount: amount * 1000, // Convert from thousands to pounds
          percentage: (amount / total) * 100,
        });
      }
    }

    return result.sort((a, b) => b.amount - a.amount);
  }, [selectedCouncil]);

  // Set default selected service
  useEffect(() => {
    if (services.length > 0 && !selectedService) {
      setSelectedService(services[0].key);
    }
  }, [services, selectedService]);

  if (!selectedCouncil) {
    return (
      <div className="card-elevated p-6 sm:p-8 text-center">
        <p className="text-muted-foreground">Please select a council to view service spending.</p>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="card-elevated p-6 sm:p-8">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Info className="h-5 w-5" />
          <p>Service spending data not available for {selectedCouncil.name}.</p>
        </div>
      </div>
    );
  }

  const currentService = services.find(s => s.key === selectedService) || services[0];
  const totalBudget = selectedCouncil.budget?.total_service ? selectedCouncil.budget.total_service * 1000 : 0;
  const dailyCost = currentService.amount / 365;
  const maxPercentage = Math.max(...services.map(s => s.percentage));

  // Check if council has verified services list
  const hasVerifiedServices = selectedCouncil.detailed?.services && selectedCouncil.detailed.services.length > 0;

  return (
    <div className="space-y-8">
      {/* Hero Section - Selected Service */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Metric - Selected Service */}
        <div className="lg:col-span-2">
          <div className="card-elevated p-6 sm:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="type-overline mb-2">{currentService.name}</p>
                <p className="type-metric text-foreground">
                  {formatBudget(currentService.amount / 1000)}
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-medium">
                {currentService.percentage.toFixed(1)}%
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mb-6">
              {currentService.description}
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-border/50">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Daily cost</p>
                <p className="text-xl font-semibold tabular-nums">
                  {formatCurrency(dailyCost, { decimals: 0 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Monthly</p>
                <p className="text-xl font-semibold tabular-nums">
                  {formatCurrency(currentService.amount / 12, { decimals: 0 })}
                </p>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm text-muted-foreground mb-1">Service rank</p>
                <p className="text-xl font-semibold tabular-nums">
                  #{services.findIndex(s => s.key === currentService.key) + 1} of {services.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Service Grid Selector */}
        <div className="card-elevated p-6">
          <p className="type-overline mb-4">Select Service</p>
          <div className="grid grid-cols-2 gap-2">
            {services.slice(0, 6).map((service) => {
              const ServiceIcon = service.icon;
              const isSelected = selectedService === service.key;
              return (
                <button
                  key={service.key}
                  onClick={() => setSelectedService(service.key)}
                  className={`p-3 rounded-lg text-left transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-muted border-border shadow-sm text-foreground'
                      : 'bg-muted/30 border-transparent hover:bg-muted/50 text-foreground'
                  }`}
                >
                  <ServiceIcon className={`h-4 w-4 mb-1 ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`} />
                  <div className="font-medium text-xs truncate">{service.name}</div>
                </button>
              );
            })}
          </div>
          {services.length > 6 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              +{services.length - 6} more services below
            </p>
          )}
        </div>
      </div>

      {/* All Services - Bar Chart */}
      <div className="card-elevated p-6 sm:p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-1">All service spending</h2>
            <p className="text-sm text-muted-foreground">
              How {selectedCouncil.name}&apos;s budget is distributed
            </p>
          </div>
          <Badge variant="outline" className="text-xs">2024-25</Badge>
        </div>

        {/* Service breakdown - Monzo/Apple style */}
        <div className="space-y-5">
          {services.map((service) => {
            const isSelected = service.key === selectedService;
            const barWidth = (service.percentage / maxPercentage) * 100;

            return (
              <div
                key={service.key}
                className="group cursor-pointer"
                onClick={() => setSelectedService(service.key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedService(service.key)}
              >
                {/* Header row: service name + amount (Monzo pattern) */}
                <div className="flex items-baseline justify-between mb-1">
                  <span className={`type-body font-semibold ${isSelected ? 'text-foreground' : ''}`}>{service.name}</span>
                  <span className="type-body font-semibold tabular-nums">
                    {formatBudget(service.amount / 1000)}
                  </span>
                </div>
                {/* Description + percentage */}
                <div className="flex items-baseline justify-between mb-2">
                  <p className="type-caption text-muted-foreground">
                    {service.description}
                  </p>
                  <span className="type-caption text-muted-foreground tabular-nums">
                    {service.percentage.toFixed(0)}%
                  </span>
                </div>
                {/* Bar - visual reinforcement */}
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isSelected ? 'bg-foreground' : 'bg-muted-foreground/40'}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
          <span className="font-semibold">Total service expenditure</span>
          <span className="text-xl font-bold tabular-nums">
            {formatBudget(totalBudget / 1000)}
          </span>
        </div>
      </div>

      {/* What this service does */}
      <div className="card-elevated p-6 sm:p-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-6">What {currentService.name.toLowerCase()} covers</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {currentService.key === 'adult_social_care' &&
                'This pays for care homes, people who visit your home to help, and support for people with disabilities or mental health needs.'}
              {currentService.key === 'childrens_social_care' &&
                "This helps keep children safe. It pays for foster families, adoption, and workers who help families in trouble."}
              {currentService.key === 'education' &&
                'This pays for school buses, help for children who need extra support to learn, and some adult education classes.'}
              {currentService.key === 'transport' &&
                'This fixes roads, fills potholes, clears snow in winter, keeps street lights working, and helps run buses.'}
              {currentService.key === 'public_health' &&
                'This helps stop people getting ill. It pays for health check-ups, help to stop smoking, and drug and alcohol support.'}
              {currentService.key === 'housing' &&
                'This helps people who have nowhere to live, and makes plans for building new homes in the area.'}
              {currentService.key === 'cultural' &&
                'This keeps libraries and museums open, runs sports centres, and organises community events in your area.'}
              {currentService.key === 'environmental' &&
                'This collects your bins, runs recycling, cleans the streets, and inspects food establishments for hygiene.'}
              {currentService.key === 'planning' &&
                'This decides if people can build new houses or shops, and helps bring new businesses and investment to the area.'}
              {currentService.key === 'central_services' &&
                'This pays for council administration, staff who answer your questions, IT systems, and collecting council tax.'}
            </p>
          </div>

          <div className="p-4 bg-muted/30 rounded-xl">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Council type context
            </h3>
            <p className="text-sm leading-relaxed">
              {selectedCouncil.type === 'SC' &&
                'As a county council, this authority handles the largest services across the whole county area, including schools, social care, and major roads.'}
              {selectedCouncil.type === 'SD' &&
                'As a district council, this authority focuses on local services like housing, planning, waste collection, and environmental health.'}
              {(selectedCouncil.type === 'UA' || selectedCouncil.type === 'MD' || selectedCouncil.type === 'LB') &&
                'As a unitary authority, this council provides all local government services in one place - from social care to waste collection.'}
            </p>
          </div>
        </div>
      </div>

      {/* Verified Services - Only for councils with detailed data */}
      {hasVerifiedServices && (
        <div className="card-elevated p-6 sm:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-1">Verified services</h2>
              <p className="text-sm text-muted-foreground">
                What {selectedCouncil.name} actually provides to residents
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-medium bg-navy-50 text-navy-600 border-navy-200">
              From council website
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedCouncil.detailed!.services!.map((service, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-stone-400" />
                <div>
                  <p className="font-medium text-sm">{service.name}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* What this council doesn't do */}
          {selectedCouncil.type === 'SD' && (
            <div className="mt-6 p-6 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Info className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Not provided by this council
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Schools, adult social care, main roads, libraries, and public transport are provided by Kent County Council. Police and fire services are separate organisations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceSpending;
