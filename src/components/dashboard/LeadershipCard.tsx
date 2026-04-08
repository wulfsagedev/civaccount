'use client';

import { useState } from 'react';
import {
  User,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, type Council } from '@/data/councils';
import CardShareHeader from '@/components/dashboard/CardShareHeader';
import { ShareableStat } from '@/components/ui/shareable-stat';

interface LeadershipCardProps {
  selectedCouncil: Council;
}

const LeadershipCard = ({ selectedCouncil }: LeadershipCardProps) => {
  const [showAllCabinet, setShowAllCabinet] = useState(false);
  const detailed = selectedCouncil.detailed!;

  const leader = detailed.cabinet?.find(m => m.role === 'Leader');
  const otherMembers = detailed.cabinet?.filter(m => m.role !== 'Leader') || [];
  const visibleMembers = showAllCabinet ? otherMembers : otherMembers.slice(0, 4);

  return (
    <section id="leadership" className="card-elevated p-5 sm:p-6">
      <CardShareHeader
        cardType="leadership"
        title="Who runs the council"
        subtitle={detailed.chief_executive_salary || detailed.staff_fte ? 'Leadership, pay and staffing' : 'Council leadership'}
        councilName={selectedCouncil.name}
      />

      {/* All leaders in consistent grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {leader && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="type-body-sm font-semibold leading-none truncate">{leader.name}</p>
              <p className="type-caption leading-none text-muted-foreground">Council Leader</p>
            </div>
          </div>
        )}

        {detailed.chief_executive && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="type-body-sm font-semibold leading-none truncate">{detailed.chief_executive}</p>
              <p className="type-caption leading-none text-muted-foreground">Chief Executive</p>
              {detailed.chief_executive_salary && (
                <ShareableStat
                  label="CEO Salary"
                  value={formatCurrency(detailed.chief_executive_salary, { decimals: 0 })}
                  context="per year"
                >
                  <p className="type-caption leading-none text-muted-foreground">
                    Salary: {formatCurrency(detailed.chief_executive_salary, { decimals: 0 })}/year
                    {detailed.chief_executive_total_remuneration && (
                      <span> · {formatCurrency(detailed.chief_executive_total_remuneration, { decimals: 0 })} total package</span>
                    )}
                  </p>
                </ShareableStat>
              )}
            </div>
          </div>
        )}

        {/* Cabinet members in same grid */}
        {visibleMembers.map((member, index) => (
          <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="type-body-sm font-semibold leading-none truncate">{member.name}</p>
              <p className="type-caption leading-none text-muted-foreground truncate">{member.portfolio}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Show all cabinet button */}
      {otherMembers.length > 4 && (
        <button
          onClick={() => setShowAllCabinet(!showAllCabinet)}
          className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors type-body-sm font-medium text-foreground cursor-pointer min-h-[44px]"
          aria-expanded={showAllCabinet}
          aria-controls="cabinet-members-list"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${showAllCabinet ? 'rotate-180' : ''}`} aria-hidden="true" />
          {showAllCabinet
            ? 'Show less'
            : `Show all ${otherMembers.length + (leader ? 1 : 0)} cabinet members`
          }
        </button>
      )}

      {/* Workforce stats */}
      {(detailed.staff_fte || detailed.agency_staff_count) && (
        <div className="mt-4 p-3 rounded-lg bg-muted/30">
          <p className="type-body-sm font-semibold mb-1">Council workforce</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {detailed.staff_fte && (
              <p className="type-caption text-muted-foreground">
                <span className="font-medium text-foreground">{detailed.staff_fte.toLocaleString('en-GB')}</span> staff (FTE)
              </p>
            )}
            {detailed.agency_staff_count && (
              <p className="type-caption text-muted-foreground">
                <span className="font-medium text-foreground">{detailed.agency_staff_count.toLocaleString('en-GB')}</span> agency staff
              </p>
            )}
          </div>
        </div>
      )}

      {/* Councillor allowances summary */}
      {detailed.councillor_basic_allowance && detailed.total_councillors && (
        <div className="mt-3 p-3 rounded-lg bg-muted/30">
          <p className="type-body-sm font-semibold mb-1">Councillor allowances</p>
          <p className="type-caption text-muted-foreground">
            <span className="font-medium text-foreground">{formatCurrency(detailed.councillor_basic_allowance, { decimals: 0 })}</span> basic allowance × {detailed.total_councillors} councillors
            {detailed.total_allowances_cost && (
              <span> · Total cost: <span className="font-medium text-foreground">{formatCurrency(detailed.total_allowances_cost, { decimals: 0 })}</span>/year</span>
            )}
          </p>
        </div>
      )}

      {(detailed.total_councillors || detailed.councillors_url) && (
        <div className="mt-4">
          <a
            href={detailed.councillors_url || "https://www.writetothem.com/"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted transition-colors group cursor-pointer"
          >
            <div>
              <p className="type-body-sm font-semibold group-hover:text-foreground transition-colors">
                Find your councillor
                <span className="sr-only"> (opens in new tab)</span>
              </p>
              <p className="type-caption text-muted-foreground">
                {detailed.total_councillors
                  ? `${detailed.total_councillors} councillors represent this area`
                  : "View all councillors on the council website"}
              </p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-3" aria-hidden="true" />
          </a>
        </div>
      )}
    </section>
  );
};

export default LeadershipCard;
