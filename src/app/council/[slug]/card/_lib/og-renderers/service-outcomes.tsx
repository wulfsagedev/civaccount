import type { Council } from '@/data/councils';
import type { ReactElement } from 'react';
import { OG_COLORS } from '../og-shared';

export function renderServiceOutcomes(council: Council, _councilName: string): ReactElement {
  const outcomes = council.detailed?.service_outcomes;
  if (!outcomes) return <div style={{ display: 'flex' }}>No data</div>;

  const stats: Array<{ label: string; value: string }> = [];

  if (outcomes.waste?.recycling_rate_percent) {
    stats.push({ label: 'Recycling rate', value: `${outcomes.waste.recycling_rate_percent}%` });
  }
  if (outcomes.housing?.homes_built) {
    stats.push({ label: 'Homes built', value: outcomes.housing.homes_built.toLocaleString('en-GB') });
  }
  if (outcomes.children_services?.ofsted_rating) {
    stats.push({ label: "Children's services", value: outcomes.children_services.ofsted_rating });
  }
  if (outcomes.roads?.condition_good_percent) {
    stats.push({ label: 'Roads in good condition', value: `${outcomes.roads.condition_good_percent}%` });
  }
  if (outcomes.libraries?.count) {
    stats.push({ label: 'Libraries', value: outcomes.libraries.count.toString() });
  }
  if (outcomes.housing?.planning_major_on_time_percent) {
    stats.push({ label: 'Major planning on time', value: `${outcomes.housing.planning_major_on_time_percent}%` });
  }

  const displayStats = stats.slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', fontSize: '32px', fontWeight: 700, color: OG_COLORS.text }}>
        What your money does
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {displayStats.map((stat) => (
          <div
            key={stat.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(0,0,0,0.03)',
              minWidth: '200px',
            }}
          >
            <span style={{ fontSize: '15px', color: OG_COLORS.secondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {stat.label}
            </span>
            <span style={{ fontSize: '36px', fontWeight: 700, color: OG_COLORS.text }}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
