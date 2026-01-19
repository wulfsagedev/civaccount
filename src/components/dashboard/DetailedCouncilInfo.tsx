'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  FileText,
  ExternalLink,
  TrendingDown,
  Briefcase,
  MapPin,
  Check,
  ChevronRight,
  PieChart,
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useCouncil } from '@/context/CouncilContext';
import { formatCurrency } from '@/data/councils';
import { CARD_STYLES } from '@/lib/utils';

export default function DetailedCouncilInfo() {
  const { selectedCouncil } = useCouncil();

  if (!selectedCouncil?.detailed) {
    return null;
  }

  const detailed = selectedCouncil.detailed;
  const hasLeadership = detailed.leadership_team && detailed.leadership_team.length > 0;
  const hasCabinet = detailed.cabinet && detailed.cabinet.length > 0;
  const hasParishPrecepts = detailed.parish_precepts && detailed.parish_precepts.length > 0;
  const hasDocuments = detailed.documents && detailed.documents.length > 0;
  const hasSavingsData = detailed.savings_target || detailed.savings_achieved;
  const hasBudgetCategories = detailed.budget_categories && detailed.budget_categories.length > 0;
  const hasCouncilTaxShares = detailed.council_tax_shares && detailed.council_tax_shares.length > 0;

  return (
    <div className="space-y-6">
      {/* Council Tax Share Breakdown */}
      {hasCouncilTaxShares && (
        <Card className={CARD_STYLES}>
          <CardHeader className="p-5 sm:p-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Where Your Council Tax Goes</h3>
              </div>
              {detailed.total_band_d && (
                <Badge variant="outline" className="text-sm">
                  Band D: {formatCurrency(detailed.total_band_d, { decimals: 2 })}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Your council tax is split between different authorities
            </p>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="space-y-3">
              {detailed.council_tax_shares!.map((share, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{share.authority}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm tabular-nums font-semibold">
                        {formatCurrency(share.band_d, { decimals: 2 })}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        ({share.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-full transition-all"
                      style={{ width: `${share.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {detailed.council_tax_requirement && detailed.council_tax_base && (
              <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Council Tax Requirement</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {formatCurrency(detailed.council_tax_requirement, { decimals: 0 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Tax Base (Band D equiv.)</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {detailed.council_tax_base.toLocaleString('en-GB', { maximumFractionDigits: 0 })} properties
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Budget Breakdown by Category */}
      {hasBudgetCategories && (
        <Card className={CARD_STYLES}>
          <CardHeader className="p-5 sm:p-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Budget Breakdown 2024-25</h3>
              </div>
              {detailed.revenue_budget && (
                <Badge variant="outline" className="text-sm">
                  Net Budget: {formatCurrency(detailed.revenue_budget, { decimals: 0 })}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Expenditure, income, and net cost by category
            </p>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="overflow-x-auto -mx-5 px-5 sm:-mx-6 sm:px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Expenditure</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Income</th>
                    <th className="text-right py-2 pl-2 font-medium text-muted-foreground">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {detailed.budget_categories!.map((cat, index) => (
                    <tr key={index} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="font-medium">{cat.name}</p>
                        {cat.description && (
                          <p className="text-xs text-muted-foreground">{cat.description}</p>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums whitespace-nowrap">
                        <span className="flex items-center justify-end gap-1">
                          <ArrowUpRight className="h-3 w-3 text-rose-500" />
                          {formatCurrency(cat.expenditure, { decimals: 0 })}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums whitespace-nowrap">
                        {cat.income > 0 && (
                          <span className="flex items-center justify-end gap-1">
                            <ArrowDownRight className="h-3 w-3 text-positive" />
                            {formatCurrency(cat.income, { decimals: 0 })}
                          </span>
                        )}
                        {cat.income === 0 && <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className={`py-3 pl-2 text-right tabular-nums font-semibold whitespace-nowrap ${
                        cat.net < 0 ? 'text-positive' : ''
                      }`}>
                        {cat.net < 0 ? '(' : ''}{formatCurrency(Math.abs(cat.net), { decimals: 0 })}{cat.net < 0 ? ')' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {detailed.reserves && (
              <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Total Reserves</p>
                  <p className="text-xs text-muted-foreground">General Fund and Earmarked Reserves</p>
                </div>
                <p className="text-lg font-semibold tabular-nums">
                  {formatCurrency(detailed.reserves, { decimals: 0 })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Financial Efficiency Section */}
      {hasSavingsData && (
        <Card className={CARD_STYLES}>
          <CardHeader className="p-5 sm:p-6 pb-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-positive" />
              <h3 className="text-lg font-semibold">Financial Efficiency</h3>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {detailed.savings_target && (
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Savings Target</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {formatCurrency(detailed.savings_target, { decimals: 0 })}
                  </p>
                </div>
              )}
              {detailed.savings_achieved && (
                <div className="p-4 rounded-xl status-success" style={{ backgroundColor: 'var(--status-bg)' }}>
                  <p className="text-sm text-muted-foreground mb-1">Savings Achieved</p>
                  <p className="text-xl font-semibold tabular-nums text-positive">
                    {formatCurrency(detailed.savings_achieved, { decimals: 0 })}
                  </p>
                  {detailed.savings_target && (
                    <p className="text-sm text-positive mt-1">
                      {((detailed.savings_achieved / detailed.savings_target) * 100).toFixed(0)}% of target
                    </p>
                  )}
                </div>
              )}
              {detailed.mtfs_deficit && (
                <div className="p-4 rounded-xl status-warning" style={{ backgroundColor: 'var(--status-bg)' }}>
                  <p className="text-sm text-muted-foreground mb-1">MTFS Forecast Gap</p>
                  <p className="text-xl font-semibold tabular-nums text-negative">
                    {formatCurrency(detailed.mtfs_deficit, { decimals: 0 })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leadership Team */}
      {hasLeadership && (
        <Card className={CARD_STYLES}>
          <CardHeader className="p-5 sm:p-6 pb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Senior Leadership</h3>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="space-y-4">
              {detailed.leadership_team!.map((leader, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{leader.name}</p>
                    <p className="text-sm text-muted-foreground">{leader.role}</p>
                    {leader.responsibilities && leader.responsibilities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {leader.responsibilities.slice(0, 4).map((resp, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {resp}
                          </Badge>
                        ))}
                        {leader.responsibilities.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{leader.responsibilities.length - 4} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cabinet Members */}
      {hasCabinet && (
        <Card className={CARD_STYLES}>
          <CardHeader className="p-5 sm:p-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Cabinet</h3>
              </div>
              {detailed.total_councillors && (
                <Badge variant="outline">{detailed.total_councillors} councillors total</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {detailed.cabinet!.map((member, index) => (
                <div key={index} className="p-3 rounded-xl border border-border/50 hover:border-border transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{member.name}</p>
                    {member.role === 'Leader' && (
                      <Badge variant="default" className="text-xs">Leader</Badge>
                    )}
                    {member.role === 'Deputy Leader' && (
                      <Badge variant="secondary" className="text-xs">Deputy</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{member.portfolio}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parish/Town Council Precepts */}
      {hasParishPrecepts && (
        <Card className={CARD_STYLES}>
          <CardHeader className="p-5 sm:p-6 pb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Town & Parish Councils</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Additional precepts that may apply depending on your location
            </p>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="space-y-2">
              {detailed.parish_precepts!
                .sort((a, b) => b.precept_total - a.precept_total)
                .map((parish, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="font-medium text-sm">{parish.name}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {formatCurrency(parish.precept_total, { decimals: 0 })}
                    <span className="text-xs ml-1">total precept</span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Documents */}
      {hasDocuments && (
        <Card className={CARD_STYLES}>
          <CardHeader className="p-5 sm:p-6 pb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Official Documents</h3>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {detailed.documents!.map((doc, index) => (
                <a
                  key={index}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:border-border hover:bg-muted/30 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate group-hover:text-foreground transition-colors">
                        {doc.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {doc.year && <span>{doc.year}</span>}
                        {doc.size_kb && <span>• {(doc.size_kb / 1024).toFixed(1)}MB</span>}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-2" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Sources */}
      {detailed.sources && detailed.sources.length > 0 && (
        <Card className={CARD_STYLES}>
          <CardHeader className="p-5 sm:p-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-positive" />
                <h3 className="text-lg font-semibold">Data Sources</h3>
              </div>
              {detailed.last_verified && (
                <Badge variant="outline" className="text-xs">
                  Verified {detailed.last_verified}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="space-y-2">
              {detailed.sources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div>
                    <p className="font-medium text-sm group-hover:text-foreground transition-colors">
                      {source.title}
                    </p>
                    {source.description && (
                      <p className="text-xs text-muted-foreground">{source.description}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
