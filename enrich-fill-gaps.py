#!/usr/bin/env python3
"""
Fill remaining small gaps across all councils:
1. Add missing budget blocks for 7 districts (from RA Part 1 CSV)
2. Add revenue_budget where missing (from RA data)
3. Add missing capital_programme where possible
4. Add missing reserves where possible

Does NOT overwrite existing values.
"""

import csv
import re
import os
import sys
import subprocess
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent
COUNCIL_DIR = PROJECT_ROOT / 'src/data/councils'
RA_CSV = PROJECT_ROOT / 'src/data/councils/pdfs/gov-uk-ra-data/RA_Part1_LA_Data.csv'
RA2_CSV = PROJECT_ROOT / 'src/data/councils/pdfs/gov-uk-ra-data/RA_Part2_LA_Data.csv'
DATA_DIR = PROJECT_ROOT / 'src/data/councils/pdfs/gov-uk-bulk-data'

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


def parse_ra_csv():
    """Parse RA Part 1 CSV and return dict of budget data per council."""
    data = {}
    with open(RA_CSV, 'r', encoding='utf-8') as f:
        rows = list(csv.reader(f))

    # Budget category column indices (total columns)
    COLS = {
        'education': 12,
        'transport': 28,
        'childrens_social_care': 37,
        'adult_social_care': 56,
        'public_health': 81,
        'housing': 89,
        'cultural': 96,
        'environmental': 125,
        'planning': 134,
        'central_services': 148,
    }
    # Total service expenditure and net current are at specific columns
    # Let's find them. Column headers are at row 9
    headers = rows[9]
    total_svc_col = None
    net_current_col = None
    for i, h in enumerate(headers):
        h_clean = h.strip().lower()
        if 'total service expenditure' in h_clean:
            total_svc_col = i
        if 'net current expenditure' in h_clean:
            net_current_col = i

    for row in rows[10:]:
        if len(row) < 6:
            continue
        ecode = row[0].strip()
        name = row[2].strip()
        cls = row[3].strip()
        if not ecode or ecode == '-':
            continue
        if cls not in ('SC', 'SD', 'UA', 'MD', 'LB'):
            continue

        def get_val(col):
            try:
                return float(row[col]) if row[col].strip() else 0.0
            except (ValueError, IndexError):
                return 0.0

        budget = {}
        for cat, col in COLS.items():
            budget[cat] = get_val(col)
        budget['other'] = 0.0
        budget['total_service'] = get_val(total_svc_col) if total_svc_col else sum(budget.values())
        budget['net_current'] = get_val(net_current_col) if net_current_col else budget['total_service']

        data[name] = budget

    return data


def generate_budget_block(budget_data):
    """Generate TypeScript budget: { ... } block."""
    lines = ['    budget: {']
    for key in ['education', 'transport', 'childrens_social_care', 'adult_social_care',
                'public_health', 'housing', 'cultural', 'environmental', 'planning',
                'central_services', 'other', 'total_service', 'net_current']:
        val = budget_data.get(key, 0.0)
        lines.append(f'      {key}: {val},')
    lines.append('    },')
    return '\n'.join(lines) + '\n'


def process_file(filepath, ra_data, ra_names):
    """Process one .ts file: fill gaps."""
    content = open(filepath, 'r', encoding='utf-8').read()
    original = content

    name_pattern = re.compile(r'^\s{4}name:\s*"([^"]+)"', re.MULTILINE)
    names = name_pattern.findall(content)

    budget_blocks_added = 0
    revenue_added = 0

    for council_name in names:
        name_idx = content.find(f'    name: "{council_name}"')
        if name_idx == -1:
            continue

        next_council = content.find('ons_code:', name_idx + 20)
        if next_council == -1:
            next_council = len(content)

        chunk = content[name_idx:next_council]

        # 1. Add missing budget block (top-level, between council_tax and detailed)
        has_budget_block = bool(re.search(r'^\s{4}budget:\s*\{', chunk, re.MULTILINE))
        if not has_budget_block:
            ra_lookup = gov_lookup(council_name, ra_names)
            if ra_lookup and ra_lookup in ra_data:
                budget = ra_data[ra_lookup]
                # Check there's actual data
                if budget.get('total_service', 0) != 0 or budget.get('net_current', 0) != 0:
                    budget_text = generate_budget_block(budget)
                    # Insert before "    detailed: {"
                    detailed_idx = content.find('    detailed:', name_idx)
                    if detailed_idx != -1 and detailed_idx < next_council:
                        content = content[:detailed_idx] + budget_text + content[detailed_idx:]
                        budget_blocks_added += 1
                        next_council += len(budget_text)

        # 2. Add missing revenue_budget (in detailed block)
        chunk = content[name_idx:next_council]  # re-read after possible insertion
        has_revenue = 'revenue_budget:' in chunk

        if not has_revenue:
            # Try to derive from budget.net_current
            net_match = re.search(r'net_current:\s*([\d.]+)', chunk)
            if net_match:
                net_current_k = float(net_match.group(1))
                if net_current_k > 0:
                    revenue_pounds = int(net_current_k * 1000)
                    # Insert after council_tax_shares closing
                    cts_idx = content.find('council_tax_shares:', name_idx)
                    if cts_idx != -1 and cts_idx < next_council:
                        # Find the ], that closes the array
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
                                        line_end = content.find('\n', pos)
                                        if line_end != -1:
                                            insert_text = f'      revenue_budget: {revenue_pounds},\n'
                                            content = content[:line_end + 1] + insert_text + content[line_end + 1:]
                                            revenue_added += 1
                                            next_council += len(insert_text)
                                        break
                                pos += 1

    return content, original, budget_blocks_added, revenue_added


def main():
    print("=== Fill Remaining Gaps ===\n")

    print("Parsing RA CSV for budget data...")
    ra_data = parse_ra_csv()
    ra_names = set(ra_data.keys())
    print(f"  Found {len(ra_data)} councils\n")

    total_budgets = 0
    total_revenue = 0
    temp_files = []

    for filename in COUNCIL_FILES:
        filepath = COUNCIL_DIR / filename
        if not filepath.exists():
            continue

        print(f"Processing {filename}...")
        content, original, budgets, revenue = process_file(filepath, ra_data, ra_names)

        total_budgets += budgets
        total_revenue += revenue

        if budgets:
            print(f"  Budget blocks added: {budgets}")
        if revenue:
            print(f"  revenue_budget added: {revenue}")
        if not budgets and not revenue:
            print(f"  No changes needed")

        tmp_path = filepath.with_suffix('.ts.tmp')
        with open(tmp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        temp_files.append((tmp_path, filepath))
        print()

    print(f"Total budget blocks added: {total_budgets}")
    print(f"Total revenue_budget added: {total_revenue}\n")

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
