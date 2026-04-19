/**
 * Fixture barrel — mirrors the shape of `src/data/councils/index.ts` so the
 * main data entrypoint can swap between real and fixture imports via a single
 * path alias (wired in next.config.ts during the Phase 1 cutover; see
 * DATA-ACCESS-POLICY.md).
 *
 * Only the three council types represented in the fixture get populated.
 * Other type arrays are empty — any page that expects a non-fixture council
 * will 404 in fixture mode, which is the correct behaviour.
 */

import type { Council } from '../councils';
import { fixtureCouncils } from './sample-councils';

export const allCouncils: Council[] = fixtureCouncils;

export const countyCouncils: Council[] = fixtureCouncils.filter((c) => c.type === 'SC');
export const metropolitanDistricts: Council[] = fixtureCouncils.filter((c) => c.type === 'MD');
export const londonBoroughs: Council[] = fixtureCouncils.filter((c) => c.type === 'LB');
export const unitaryAuthorities: Council[] = [];
export const districtCouncils: Council[] = [];
