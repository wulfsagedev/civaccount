'use client';

import { useState } from 'react';
import {
  User,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, toSentenceTypeName, type Council } from '@/data/councils';
import CardShareHeader from '@/components/dashboard/CardShareHeader';
import { getTypeAverages } from '@/lib/council-averages';
import SourceAnnotation from '@/components/ui/source-annotation';
import { getProvenance } from '@/data/provenance';
import DataGapNotice from '@/components/ui/data-gap-notice';

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

      {/* All leaders in consistent grid — cards are uniform height, role/portfolio
          clamped to 2 lines so e.g. "Department of Local Government Efficiency"
          wraps rather than truncating mid-word. CEO pay sits in its own row below
          so the people cards stay visually balanced. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {leader && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 min-h-[72px]">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="type-body-sm font-semibold leading-tight line-clamp-2">
                <SourceAnnotation
                  provenance={getProvenance('detailed.cabinet', selectedCouncil)}
                  reportContext={{
                    council: selectedCouncil.name,
                    field: 'Council Leader',
                    value: leader.name,
                  }}
                >{leader.name}</SourceAnnotation>
              </p>
              <p className="type-caption leading-tight text-muted-foreground">Council Leader</p>
            </div>
          </div>
        )}

        {detailed.chief_executive && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 min-h-[72px]">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="type-body-sm font-semibold leading-tight line-clamp-2">
                <SourceAnnotation
                  provenance={getProvenance('detailed.chief_executive', selectedCouncil)}
                  reportContext={{
                    council: selectedCouncil.name,
                    field: 'Chief Executive name',
                    value: detailed.chief_executive,
                  }}
                >{detailed.chief_executive}</SourceAnnotation>
              </p>
              <p className="type-caption leading-tight text-muted-foreground">Chief Executive</p>
            </div>
          </div>
        )}

        {/* Cabinet members in same grid */}
        {visibleMembers.map((member, index) => (
          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 min-h-[72px]">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="type-body-sm font-semibold leading-tight line-clamp-2" title={member.name}>
                <SourceAnnotation
                  provenance={getProvenance('detailed.cabinet', selectedCouncil)}
                  reportContext={{
                    council: selectedCouncil.name,
                    field: `Cabinet member: ${member.name}`,
                    value: member.name,
                  }}
                >{member.name}</SourceAnnotation>
              </p>
              <p className="type-caption leading-tight text-muted-foreground line-clamp-2" title={member.portfolio}>
                <SourceAnnotation
                  provenance={getProvenance('detailed.cabinet', selectedCouncil)}
                  reportContext={{
                    council: selectedCouncil.name,
                    field: `Cabinet member: ${member.name} portfolio`,
                    value: member.portfolio,
                  }}
                >{member.portfolio}</SourceAnnotation>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CEO pay — sits below the people cards so the grid stays balanced.
          Copy is deliberately neutral ("earns", not "is paid") and gives a
          peer comparison so a teenager sees the full context in one glance. */}
      {detailed.chief_executive && detailed.chief_executive_salary && (() => {
        const avgCeo = getTypeAverages(selectedCouncil.type).ceoSalary;
        return (
          <div className="mt-3 p-3 rounded-lg bg-muted/30">
            <p className="type-body-sm">
              <span className="font-semibold">{detailed.chief_executive}</span>
              {' earns '}
              <SourceAnnotation
                provenance={getProvenance('detailed.chief_executive_salary', selectedCouncil)}
                reportContext={{
                  council: selectedCouncil.name,
                  field: 'Chief Executive salary',
                  value: formatCurrency(detailed.chief_executive_salary!, { decimals: 0 }),
                }}
              ><span className="font-semibold tabular-nums whitespace-nowrap">{formatCurrency(detailed.chief_executive_salary!, { decimals: 0 })}</span></SourceAnnotation>
              {' a year'}
              {detailed.chief_executive_total_remuneration && (
                <>
                  {' ('}
                  <SourceAnnotation
                    provenance={getProvenance('detailed.chief_executive_total_remuneration', selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: 'Chief Executive total remuneration',
                      value: formatCurrency(detailed.chief_executive_total_remuneration, { decimals: 0 }),
                    }}
                  ><span className="tabular-nums whitespace-nowrap">{formatCurrency(detailed.chief_executive_total_remuneration, { decimals: 0 })}</span></SourceAnnotation>
                  {' total package)'}
                </>
              )}
              {'.'}
            </p>
            {avgCeo > 0 && (
              <p className="type-caption text-muted-foreground mt-1">
                {'Typical pay for a '}{toSentenceTypeName(selectedCouncil.type_name)}{' chief executive is about '}
                <SourceAnnotation provenance={getProvenance('vs_average', selectedCouncil)}><span className="tabular-nums whitespace-nowrap">{formatCurrency(Math.round(avgCeo), { decimals: 0 })}</span></SourceAnnotation>
                {'.'}
              </p>
            )}
          </div>
        );
      })()}

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
                <SourceAnnotation
                  provenance={getProvenance('detailed.staff_fte', selectedCouncil)}
                  reportContext={{
                    council: selectedCouncil.name,
                    field: 'Staff count (FTE)',
                    value: detailed.staff_fte.toLocaleString('en-GB'),
                  }}
                ><span className="font-medium text-foreground">{detailed.staff_fte.toLocaleString('en-GB')}</span></SourceAnnotation> staff (FTE)
              </p>
            )}
            {detailed.agency_staff_count && (
              <p className="type-caption text-muted-foreground">
                <SourceAnnotation
                  provenance={getProvenance('detailed.staff_fte', selectedCouncil)}
                  reportContext={{
                    council: selectedCouncil.name,
                    field: 'Agency staff count',
                    value: detailed.agency_staff_count.toLocaleString('en-GB'),
                  }}
                ><span className="font-medium text-foreground">{detailed.agency_staff_count.toLocaleString('en-GB')}</span></SourceAnnotation> agency staff
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
            <SourceAnnotation
              provenance={getProvenance('detailed.councillor_basic_allowance', selectedCouncil)}
              reportContext={{
                council: selectedCouncil.name,
                field: 'Councillor basic allowance',
                value: formatCurrency(detailed.councillor_basic_allowance, { decimals: 0 }),
              }}
            ><span className="font-medium text-foreground">{formatCurrency(detailed.councillor_basic_allowance, { decimals: 0 })}</span></SourceAnnotation> basic allowance × <SourceAnnotation
              provenance={getProvenance('detailed.total_councillors', selectedCouncil)}
              reportContext={{
                council: selectedCouncil.name,
                field: 'Total number of councillors',
                value: String(detailed.total_councillors),
              }}
            >{detailed.total_councillors}</SourceAnnotation> councillors
            {detailed.total_allowances_cost && (
              <span> · Total cost: <SourceAnnotation
                provenance={getProvenance('detailed.total_allowances_cost', selectedCouncil)}
                reportContext={{
                  council: selectedCouncil.name,
                  field: 'Total councillor allowances cost per year',
                  value: formatCurrency(detailed.total_allowances_cost, { decimals: 0 }),
                }}
              ><span className="font-medium text-foreground">{formatCurrency(detailed.total_allowances_cost, { decimals: 0 })}</span></SourceAnnotation>/year</span>
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
                {detailed.total_councillors ? (
                  <><SourceAnnotation
                    provenance={getProvenance('detailed.total_councillors', selectedCouncil)}
                    reportContext={{
                      council: selectedCouncil.name,
                      field: 'Total number of councillors',
                      value: String(detailed.total_councillors),
                    }}
                  >{detailed.total_councillors}</SourceAnnotation> councillors represent this area</>
                ) : (
                  "View all councillors on the council website"
                )}
              </p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-3" aria-hidden="true" />
          </a>
        </div>
      )}

      {/* Thin-cabinet notice — when fewer than 5 cabinet members are listed
          for a council that should have at least 6 (Kent baseline). */}
      {(detailed.cabinet?.length ?? 0) > 0 && (detailed.cabinet?.length ?? 0) < 5 && (
        <div className="mt-6 pt-5 border-t border-border/50">
          <DataGapNotice
            gapKey="cabinet.thin"
            council={selectedCouncil}
            extra={`${detailed.cabinet!.length} member${detailed.cabinet!.length === 1 ? "" : "s"} captured.`}
          />
        </div>
      )}
    </section>
  );
};

export default LeadershipCard;
