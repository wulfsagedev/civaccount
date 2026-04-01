#!/usr/bin/env python3
"""
Batch-enrich all councils with financial fields from bulk GOV.UK datasets.

Adds these fields (where missing) to each council's detailed object:
  - revenue_budget (derived from budget.net_current × 1000)
  - capital_programme (from GOV.UK COR A1 capital expenditure returns)
  - reserves (from GOV.UK RA Part 2 reserves data)
  - council_tax_base (from GOV.UK CTB returns — billing authorities only)
  - council_tax_requirement (from GOV.UK Council Tax levels Table 10)

Does NOT overwrite any existing values — only adds missing fields.
Inserts after council_tax_shares block, before chief_executive.

Usage: python3 enrich-financial-fields.py
"""

import csv
import re
import os
import sys
import subprocess
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent
DATA_DIR = PROJECT_ROOT / 'src/data/councils/pdfs/gov-uk-bulk-data'
COUNCIL_DIR = PROJECT_ROOT / 'src/data/councils'

COUNCIL_FILES = [
    'county-councils.ts',
    'districts.ts',
    'metropolitan.ts',
    'unitary.ts',
    'london-boroughs.ts',
]

SPECIAL_NAMES = {
    'Durham': 'County Durham',
    'Dorset UA': 'Dorset',
    'Medway Towns': 'Medway',
    'St Helens': 'St. Helens',
    'Bristol': 'Bristol, City of',
    'Herefordshire': 'Herefordshire, County of',
    'Kingston upon Hull': 'Kingston upon Hull, City of',
}


def gov_lookup(name, dataset_names):
    """Map our council name to a GOV.UK dataset name."""
    if name in dataset_names:
        return name
    alt = name.replace(' & ', ' and ')
    if alt in dataset_names:
        return alt
    if name in SPECIAL_NAMES:
        mapped = SPECIAL_NAMES[name]
        if mapped in dataset_names:
            return mapped
    for suffix in [', City of', ', County of']:
        if f'{name}{suffix}' in dataset_names:
            return f'{name}{suffix}'
    return None


def load_csv(filename):
    """Load a parsed CSV file into a dict keyed by name."""
    data = {}
    path = DATA_DIR / filename
    if not path.exists():
        print(f"  WARNING: {path} not found, skipping")
        return data
    with open(path, 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            data[row['name']] = row
    return data


def find_insertion_point(content, name_idx, next_council):
    """Find the right place to insert financial fields.

    Strategy: insert after council_tax_shares closing '],', before chief_executive.
    Falls back to after council_tax_increase_percent line, or after total_band_d.
    """
    # Try: after council_tax_shares array closes
    cts_idx = content.find('council_tax_shares:', name_idx)
    if cts_idx != -1 and cts_idx < next_council:
        # Find the matching ],
        bracket_start = content.find('[', cts_idx)
        if bracket_start != -1:
            depth = 0
            pos = bracket_start
            while pos < next_council:
                if content[pos] == '[':
                    depth += 1
                elif content[pos] == ']':
                    depth -= 1
                    if depth == 0:
                        # Find end of this line (the ],)
                        line_end = content.find('\n', pos)
                        if line_end != -1:
                            return line_end + 1
                        return pos + 2
                pos += 1

    # Fallback: after council_tax_increase_percent line
    cti_idx = content.find('council_tax_increase_percent:', name_idx)
    if cti_idx != -1 and cti_idx < next_council:
        line_end = content.find('\n', cti_idx)
        if line_end != -1:
            return line_end + 1

    return -1


def process_file(filepath, capex_data, reserves_data, ctb_data, ctr_data,
                 capex_names, reserves_names, ctb_names, ctr_names):
    """Process a single .ts file: add missing financial fields."""
    content = open(filepath, 'r', encoding='utf-8').read()
    original_content = content

    name_pattern = re.compile(r'^\s{4}name:\s*"([^"]+)"', re.MULTILINE)
    names = name_pattern.findall(content)

    stats = {'revenue_budget': 0, 'capital_programme': 0, 'reserves': 0,
             'council_tax_base': 0, 'council_tax_requirement': 0}

    for council_name in names:
        name_idx = content.find(f'    name: "{council_name}"')
        if name_idx == -1:
            continue

        next_council = content.find('ons_code:', name_idx + 20)
        if next_council == -1:
            next_council = len(content)

        # Check which fields are already present
        chunk = content[name_idx:next_council]
        has_revenue = 'revenue_budget:' in chunk
        has_capex = 'capital_programme:' in chunk
        has_reserves = 'reserves:' in chunk
        has_ctb = 'council_tax_base:' in chunk
        has_ctr = 'council_tax_requirement:' in chunk

        # Build list of lines to insert
        lines_to_insert = []

        # 1. revenue_budget — derive from budget.net_current
        if not has_revenue:
            net_match = re.search(r'net_current:\s*([\d.]+)', chunk)
            if net_match:
                net_current_k = float(net_match.group(1))
                revenue_pounds = int(net_current_k * 1000)
                if revenue_pounds > 0:
                    lines_to_insert.append(f'      revenue_budget: {revenue_pounds},')
                    stats['revenue_budget'] += 1

        # 2. capital_programme — from COR data
        if not has_capex:
            lookup = gov_lookup(council_name, capex_names)
            if lookup and lookup in capex_data:
                capex_k = float(capex_data[lookup]['capital_expenditure_k'])
                capex_pounds = int(capex_k * 1000)
                if capex_pounds > 0:
                    lines_to_insert.append(f'      capital_programme: {capex_pounds},')
                    stats['capital_programme'] += 1

        # 3. council_tax_requirement — from CT levels (already in £)
        if not has_ctr:
            lookup = gov_lookup(council_name, ctr_names)
            if lookup and lookup in ctr_data:
                ctr_val = float(ctr_data[lookup]['council_tax_requirement'])
                ctr_pounds = int(ctr_val)
                if ctr_pounds > 0:
                    lines_to_insert.append(f'      council_tax_requirement: {ctr_pounds},')
                    stats['council_tax_requirement'] += 1

        # 4. council_tax_base — from CTB data (decimal number)
        if not has_ctb:
            lookup = gov_lookup(council_name, ctb_names)
            if lookup and lookup in ctb_data:
                ctb_val = float(ctb_data[lookup]['tax_base'])
                if ctb_val > 0:
                    # Format with 2 decimal places
                    lines_to_insert.append(f'      council_tax_base: {ctb_val:.2f},')
                    stats['council_tax_base'] += 1

        # 5. reserves — from RA Part 2 (in £k, convert to £)
        if not has_reserves:
            lookup = gov_lookup(council_name, reserves_names)
            if lookup and lookup in reserves_data:
                reserves_k = float(reserves_data[lookup]['reserves_k'])
                reserves_pounds = int(reserves_k * 1000)
                if reserves_pounds > 0:
                    lines_to_insert.append(f'      reserves: {reserves_pounds},')
                    stats['reserves'] += 1

        if not lines_to_insert:
            continue

        # Find insertion point
        insert_idx = find_insertion_point(content, name_idx, next_council)
        if insert_idx == -1:
            print(f"  WARNING: No insertion point for '{council_name}'")
            continue

        # Build insertion text
        insert_text = '\n'.join(lines_to_insert) + '\n'
        content = content[:insert_idx] + insert_text + content[insert_idx:]

    return content, original_content, stats


def main():
    print("=== Batch Financial Fields Enrichment ===\n")

    print("Loading datasets...")
    capex_data = load_csv('parsed-capital-expenditure.csv')
    reserves_data = load_csv('parsed-reserves.csv')
    ctb_data = load_csv('parsed-council-tax-base.csv')
    ctr_data = load_csv('parsed-council-tax-requirement.csv')

    print(f"  Capital expenditure: {len(capex_data)} entries")
    print(f"  Reserves: {len(reserves_data)} entries")
    print(f"  Council tax base: {len(ctb_data)} entries")
    print(f"  Council tax requirement: {len(ctr_data)} entries")
    print()

    capex_names = set(capex_data.keys())
    reserves_names = set(reserves_data.keys())
    ctb_names = set(ctb_data.keys())
    ctr_names = set(ctr_data.keys())

    totals = {'revenue_budget': 0, 'capital_programme': 0, 'reserves': 0,
              'council_tax_base': 0, 'council_tax_requirement': 0}
    temp_files = []

    for filename in COUNCIL_FILES:
        filepath = COUNCIL_DIR / filename
        if not filepath.exists():
            print(f"  ERROR: {filepath} not found!")
            continue

        print(f"Processing {filename}...")
        content, original, stats = process_file(
            filepath, capex_data, reserves_data, ctb_data, ctr_data,
            capex_names, reserves_names, ctb_names, ctr_names
        )

        for k, v in stats.items():
            totals[k] += v
            if v > 0:
                print(f"  {k}: +{v}")

        tmp_path = filepath.with_suffix('.ts.tmp')
        with open(tmp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        temp_files.append((tmp_path, filepath))
        print()

    print("Totals:")
    for k, v in totals.items():
        print(f"  {k}: {v} councils")
    print()

    # TypeScript check
    print("Running TypeScript compilation check...")

    for tmp_path, orig_path in temp_files:
        backup_path = orig_path.with_suffix('.ts.bak')
        os.rename(orig_path, backup_path)
        os.rename(tmp_path, orig_path)

    result = subprocess.run(
        ['npx', 'tsc', '--noEmit'],
        cwd=str(PROJECT_ROOT),
        capture_output=True,
        text=True,
        timeout=120,
    )

    if result.returncode == 0:
        print("  TypeScript compilation: PASSED")
        for tmp_path, orig_path in temp_files:
            backup_path = orig_path.with_suffix('.ts.bak')
            if backup_path.exists():
                os.remove(backup_path)
        print("\n=== SUCCESS ===")
        for k, v in totals.items():
            print(f"  {k}: {v} councils enriched")
    else:
        print("  TypeScript compilation: FAILED")
        print(result.stdout[:3000] if result.stdout else '')
        print(result.stderr[:3000] if result.stderr else '')
        for tmp_path, orig_path in temp_files:
            backup_path = orig_path.with_suffix('.ts.bak')
            if backup_path.exists():
                os.rename(orig_path, tmp_path)
                os.rename(backup_path, orig_path)
        print("\n=== ROLLED BACK ===")
        sys.exit(1)


if __name__ == '__main__':
    main()
