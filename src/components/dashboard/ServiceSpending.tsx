'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Users, Shield, GraduationCap, Car, Heart, Building, Settings, TrendingUp, CheckCircle, Info, Home, Trash2, MapPin } from "lucide-react";
import { useCouncil } from '@/context/CouncilContext';
import { formatBudget } from '@/data/councils';

// Service descriptions based on council type
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
    name: 'Libraries & Fun Stuff',
    description: 'Libraries, museums, and community centres',
    icon: Building,
  },
  environmental: {
    name: 'Bins & Streets',
    description: 'Collecting bins and keeping streets clean',
    icon: Trash2,
  },
  planning: {
    name: 'Planning',
    description: 'Deciding what can be built',
    icon: MapPin,
  },
  central_services: {
    name: 'Running the Council',
    description: 'Meetings and staff who run the council',
    icon: Settings,
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
  useMemo(() => {
    if (services.length > 0 && !selectedService) {
      setSelectedService(services[0].key);
    }
  }, [services, selectedService]);

  if (!selectedCouncil) {
    return (
      <Card className="border border-border/40 bg-card shadow-sm rounded-xl">
        <CardContent className="p-5 sm:p-6 text-center">
          <p className="text-muted-foreground text-sm sm:text-base">Please select a council to view service spending.</p>
        </CardContent>
      </Card>
    );
  }

  if (services.length === 0) {
    return (
      <Card className="border border-border/40 bg-card shadow-sm rounded-xl">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Info className="h-5 w-5" />
            <p className="text-sm sm:text-base">Service spending data not available for {selectedCouncil.name}.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentService = services.find(s => s.key === selectedService) || services[0];
  const totalBudget = selectedCouncil.budget?.total_service ? selectedCouncil.budget.total_service * 1000 : 0;
  const dailyCost = currentService.amount / 365;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Service Selector */}
      <Card className="border border-border/40 bg-card shadow-sm rounded-xl">
        <CardHeader className="p-5 sm:p-6 pb-4">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-primary opacity-70" />
            <div>
              <CardTitle className="text-lg sm:text-xl font-semibold">Explore {selectedCouncil.name} Services</CardTitle>
              <CardDescription className="text-sm sm:text-base leading-relaxed">
                Click on any service to see detailed spending information
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3">
            {services.map((service) => {
              const ServiceIcon = service.icon;
              const isSelected = selectedService === service.key;
              return (
                <Button
                  key={service.key}
                  variant="outline"
                  onClick={() => setSelectedService(service.key)}
                  className={`h-auto p-3 sm:p-4 flex flex-col items-start text-left gap-1.5 rounded-xl ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20 dark:border-primary/50'
                      : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                  }`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <ServiceIcon className="h-4 w-4 shrink-0" />
                    <div className="font-semibold text-sm truncate">{service.name}</div>
                  </div>
                  <div className={`text-sm ${isSelected ? 'text-primary/70' : 'text-muted-foreground'}`}>
                    {formatBudget(service.amount / 1000)} ({service.percentage.toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%)
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Service Details */}
      <Card className="border border-border/40 bg-card shadow-sm rounded-xl">
        <CardHeader className="p-5 sm:p-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3">
              <currentService.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary opacity-70" />
              <CardTitle className="text-lg sm:text-2xl font-semibold">{currentService.name}</CardTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default" className="text-sm">{currentService.percentage.toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% of budget</Badge>
            </div>
          </div>
          <CardDescription className="text-sm sm:text-base leading-relaxed">{currentService.description}</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="text-center p-3 sm:p-5 bg-background/80 rounded-xl">
              <div className="text-lg sm:text-2xl font-bold text-primary">
                {formatBudget(currentService.amount / 1000)}
              </div>
              <div className="text-sm text-primary/80 mt-1">Annual Budget</div>
            </div>
            <div className="text-center p-3 sm:p-5 bg-background/60 rounded-xl">
              <div className="text-lg sm:text-2xl font-bold">
                £{Math.round(dailyCost).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Daily Cost</div>
            </div>
            <div className="text-center p-3 sm:p-5 bg-background/60 rounded-xl">
              <div className="text-lg sm:text-2xl font-bold">
                {currentService.percentage.toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">Share of Total</div>
            </div>
          </div>

          {/* Service explanation based on council type */}
          <div className="p-4 sm:p-4 bg-background/60 rounded-xl mb-4">
            <h4 className="font-semibold mb-2.5 flex items-center gap-2 text-sm sm:text-base">
              <Info className="h-4 w-4 opacity-70" />
              What does this service do?
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentService.key === 'adult_social_care' &&
                'This pays for care homes, people who visit your home to help, and support for people with disabilities or mental health needs.'}
              {currentService.key === 'childrens_social_care' &&
                "This helps keep children safe. It pays for foster families, adoption, and workers who help families in trouble."}
              {currentService.key === 'education' &&
                'This pays for school buses, help for children who need extra support to learn, and some adult classes.'}
              {currentService.key === 'transport' &&
                'This fixes roads, fills potholes, clears snow in winter, keeps street lights working, and helps run buses.'}
              {currentService.key === 'public_health' &&
                'This helps stop people getting ill. It pays for health check-ups, help to stop smoking, and drug and alcohol support.'}
              {currentService.key === 'housing' &&
                'This helps people who have nowhere to live, and makes plans for building new homes.'}
              {currentService.key === 'cultural' &&
                'This keeps libraries and museums open, runs sports centres, and puts on events in your area.'}
              {currentService.key === 'environmental' &&
                'This collects your bins, runs recycling, cleans the streets, and checks food places are clean.'}
              {currentService.key === 'planning' &&
                'This decides if people can build new houses or shops, and helps bring new businesses to the area.'}
              {currentService.key === 'central_services' &&
                'This pays for council meetings, staff who answer your questions, and collecting council tax.'}
            </p>
          </div>

          {/* Context based on council type */}
          <div className="p-4 sm:p-4 bg-background/80 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-primary text-sm sm:text-base">What kind of council is this?</h4>
            </div>
            <p className="text-sm text-primary/80 leading-relaxed">
              {selectedCouncil.type === 'SC' &&
                'County councils look after the big stuff - like social care, schools, and main roads - for the whole county.'}
              {selectedCouncil.type === 'SD' &&
                'District councils look after local things - like housing, planning, bins, and keeping streets clean.'}
              {(selectedCouncil.type === 'UA' || selectedCouncil.type === 'MD' || selectedCouncil.type === 'LB') &&
                'This council does everything! From social care to bins - all in one place.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Service Comparison */}
      <Card className="border border-border/40 bg-card shadow-sm rounded-xl">
        <CardHeader className="p-5 sm:p-6 pb-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary opacity-70" />
            <div>
              <CardTitle className="text-lg sm:text-xl font-semibold">Service Spending Comparison</CardTitle>
              <CardDescription className="text-sm sm:text-base leading-relaxed">
                How {selectedCouncil.name}&apos;s budget is distributed across services
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="space-y-3 sm:space-y-3">
            {services.map((service, index) => {
              const ServiceIcon = service.icon;
              const isSelected = service.key === selectedService;
              return (
                <div
                  key={service.key}
                  className={`flex items-center justify-between p-3 sm:p-4 rounded-xl gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                  onClick={() => setSelectedService(service.key)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedService(service.key)}
                >
                  <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {index + 1}
                    </div>
                    <ServiceIcon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="min-w-0">
                      <div className={`font-medium text-sm sm:text-base truncate ${isSelected ? 'text-primary' : ''}`}>{service.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {service.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-bold text-sm sm:text-base ${isSelected ? 'text-primary' : ''}`}>{formatBudget(service.amount / 1000)}</div>
                    <div className="text-sm text-muted-foreground">{service.percentage.toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="mt-5 pt-4 border-t border-border/50 flex justify-between items-center">
            <span className="font-semibold text-sm sm:text-base">Total Service Expenditure</span>
            <span className="font-bold text-base sm:text-lg">{formatBudget(totalBudget / 1000)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceSpending;
