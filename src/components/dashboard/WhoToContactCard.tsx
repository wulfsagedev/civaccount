'use client';

import Link from 'next/link';
import {
  Home,
  Building2,
  Check,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { getCouncilByName, getCouncilSlug, councils, type Council } from '@/data/councils';

// Helper function to find a linkable council from precept authority name
const findLinkedCouncil = (authorityName: string) => {
  const cleanName = authorityName
    .replace(' District Council', '')
    .replace(' County Council', '')
    .replace(' Council', '')
    .replace(' Borough', '')
    .trim();

  const council = getCouncilByName(cleanName) ||
                 getCouncilByName(authorityName) ||
                 councils.find(c => c.name.toLowerCase().includes(cleanName.toLowerCase()));

  if (council) {
    return { council, slug: getCouncilSlug(council) };
  }
  return null;
};

const CONTACT_ISSUES = {
  district: [
    { issue: 'Missed bin collection', contact: 'district' },
    { issue: 'Planning application', contact: 'district' },
    { issue: 'Council tax bill', contact: 'district' },
    { issue: 'Housing problem', contact: 'district' },
    { issue: 'Noisy neighbours', contact: 'district' },
    { issue: 'Parks and playgrounds', contact: 'district' },
  ],
  county: [
    { issue: 'Pothole or road damage', contact: 'county' },
    { issue: 'Street lights not working', contact: 'county' },
    { issue: 'School transport', contact: 'county' },
    { issue: 'Social care for adults', contact: 'county' },
    { issue: 'Children\'s services', contact: 'county' },
    { issue: 'Library services', contact: 'county' },
  ],
};

interface WhoToContactCardProps {
  selectedCouncil: Council;
}

const WhoToContactCard = ({ selectedCouncil }: WhoToContactCardProps) => {
  const detailed = selectedCouncil.detailed;
  const isDistrictCouncil = selectedCouncil.type === 'SD';
  const isCountyCouncil = selectedCouncil.type === 'SC';

  return (
    <>
      {/* Who to contact (for district councils) */}
      {isDistrictCouncil && (
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Who to contact</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            You have two councils. Here&apos;s who handles what.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* District council card */}
            <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center shrink-0">
                  <Home className="h-4 w-4 text-foreground" aria-hidden="true" />
                </div>
                <p className="type-body-sm font-semibold">{selectedCouncil.name}</p>
              </div>
              <div className="space-y-2 mb-4">
                {CONTACT_ISSUES.district.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                    <span className="type-caption text-muted-foreground">{item.issue}</span>
                  </div>
                ))}
              </div>
              {detailed?.website && (
                <a
                  href={detailed.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-foreground text-background type-body-sm font-semibold hover:bg-foreground/90 transition-colors cursor-pointer"
                >
                  Contact {selectedCouncil.name}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">(opens in new tab)</span>
                </a>
              )}
            </div>

            {/* County council card */}
            {(() => {
              const countyPrecept = detailed?.precepts?.find(p => p.authority.toLowerCase().includes('county'));
              const countyLink = countyPrecept ? findLinkedCouncil(countyPrecept.authority) : null;
              const countyName = countyPrecept?.authority.replace(' Council', '') || null;
              const countyWebsite = countyLink?.council?.detailed?.website;

              if (!countyName) return null;

              return (
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <p className="type-body-sm font-semibold">{countyName}</p>
                  </div>
                  <div className="space-y-2 mb-4">
                    {CONTACT_ISSUES.county.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                        <span className="type-caption text-muted-foreground">{item.issue}</span>
                      </div>
                    ))}
                  </div>
                  {countyLink ? (
                    <Link
                      href={`/council/${countyLink.slug}`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-muted text-foreground type-body-sm font-semibold hover:bg-muted/70 transition-colors cursor-pointer"
                    >
                      View {countyName} budget
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  ) : countyWebsite ? (
                    <a
                      href={countyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-muted text-foreground type-body-sm font-semibold hover:bg-muted/70 transition-colors cursor-pointer"
                    >
                      Contact {countyName}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">(opens in new tab)</span>
                    </a>
                  ) : null}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* District councils in your area (for county councils) */}
      {isCountyCouncil && (
        <section className="card-elevated p-5 sm:p-6">
          <h2 className="type-title-2 mb-1">Your local councils</h2>
          <p className="type-body-sm text-muted-foreground mb-5">
            You also have a district or borough council for local services.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* County council card (this council) */}
            <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-foreground" aria-hidden="true" />
                </div>
                <p className="type-body-sm font-semibold">{selectedCouncil.name}</p>
              </div>
              <div className="space-y-2 mb-4">
                {CONTACT_ISSUES.county.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                    <span className="type-caption text-muted-foreground">{item.issue}</span>
                  </div>
                ))}
              </div>
              {detailed?.website && (
                <a
                  href={detailed.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-foreground text-background type-body-sm font-semibold hover:bg-foreground/90 transition-colors cursor-pointer"
                >
                  Contact {selectedCouncil.name}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">(opens in new tab)</span>
                </a>
              )}
            </div>

            {/* District councils info */}
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Home className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="type-body-sm font-semibold">Your district council</p>
              </div>
              <div className="space-y-2 mb-4">
                {CONTACT_ISSUES.district.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                    <span className="type-caption text-muted-foreground">{item.issue}</span>
                  </div>
                ))}
              </div>
              <a
                href="https://www.gov.uk/find-local-council"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-muted text-foreground type-body-sm font-semibold hover:bg-muted/70 transition-colors cursor-pointer"
              >
                Find your district council
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">(opens in new tab)</span>
              </a>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default WhoToContactCard;
