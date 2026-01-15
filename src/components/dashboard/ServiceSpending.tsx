'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Shield, GraduationCap, Car, Heart, Building, Settings, Home, Trash2, MapPin } from "lucide-react";
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
      <div className="p-6 bg-muted/50 rounded-xl text-center">
        <p className="text-muted-foreground">Please select a council to view service spending.</p>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="p-6 bg-muted/50 rounded-xl text-center">
        <p className="text-muted-foreground">Service spending data not available for {selectedCouncil.name}.</p>
      </div>
    );
  }

  const currentService = services.find(s => s.key === selectedService) || services[0];
  const totalBudget = selectedCouncil.budget?.total_service ? selectedCouncil.budget.total_service * 1000 : 0;
  const dailyCost = currentService.amount / 365;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Service Selector */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Explore {selectedCouncil.name} Services</CardTitle>
          <CardDescription>Click on any service to see details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {services.map((service) => {
              const ServiceIcon = service.icon;
              return (
                <Button
                  key={service.key}
                  variant={selectedService === service.key ? "default" : "outline"}
                  onClick={() => setSelectedService(service.key)}
                  className="h-auto p-3 flex flex-col items-start text-left gap-1"
                >
                  <div className="flex items-center gap-2 w-full">
                    <ServiceIcon className="h-4 w-4 shrink-0" />
                    <span className="font-medium text-sm truncate">{service.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatBudget(service.amount / 1000)} ({service.percentage.toFixed(0)}%)
                  </span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Service Details */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <currentService.icon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{currentService.name}</CardTitle>
            </div>
            <Badge variant="default" className="text-xs">{currentService.percentage.toFixed(0)}%</Badge>
          </div>
          <CardDescription>{currentService.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-primary/5 rounded-xl">
              <div className="text-xl font-bold text-primary">{formatBudget(currentService.amount / 1000)}</div>
              <div className="text-xs text-muted-foreground mt-1">per year</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-xl">
              <div className="text-xl font-bold">£{Math.round(dailyCost).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">per day</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-xl">
              <div className="text-xl font-bold">{currentService.percentage.toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground mt-1">of budget</div>
            </div>
          </div>

          {/* Service explanation */}
          <div className="p-4 bg-muted/30 rounded-xl">
            <h4 className="font-medium mb-2 text-sm">What does this pay for?</h4>
            <p className="text-sm text-muted-foreground">
              {currentService.key === 'adult_social_care' &&
                'Care homes, home visits, and support for people with disabilities or mental health needs.'}
              {currentService.key === 'childrens_social_care' &&
                "Foster families, adoption, and workers who help families in trouble."}
              {currentService.key === 'education' &&
                'School buses, help for children with extra needs, and adult classes.'}
              {currentService.key === 'transport' &&
                'Road repairs, potholes, snow clearing, street lights, and buses.'}
              {currentService.key === 'public_health' &&
                'Health check-ups, help to stop smoking, and drug and alcohol support.'}
              {currentService.key === 'housing' &&
                'Help for homeless people and plans for building new homes.'}
              {currentService.key === 'cultural' &&
                'Libraries, museums, sports centres, and community events.'}
              {currentService.key === 'environmental' &&
                'Bin collection, recycling, street cleaning, and food hygiene checks.'}
              {currentService.key === 'planning' &&
                'Building permits and bringing new businesses to the area.'}
              {currentService.key === 'central_services' &&
                'Council meetings, customer service, and collecting council tax.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Service Comparison - Simplified */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">All Services</CardTitle>
          <CardDescription>How {selectedCouncil.name}&apos;s budget is distributed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {services.map((service, index) => {
              const ServiceIcon = service.icon;
              const isSelected = service.key === selectedService;
              return (
                <div
                  key={service.key}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                  onClick={() => setSelectedService(service.key)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                    <ServiceIcon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm ${isSelected ? 'font-medium text-primary' : ''}`}>{service.name}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-medium text-sm ${isSelected ? 'text-primary' : ''}`}>{formatBudget(service.amount / 1000)}</span>
                    <span className="text-xs text-muted-foreground ml-2">{service.percentage.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <span className="font-medium text-sm">Total</span>
            <span className="font-bold">{formatBudget(totalBudget / 1000)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceSpending;
