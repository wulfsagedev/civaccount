#!/usr/bin/env python3
"""
Batch-add chief_executive_salary from TaxPayers' Alliance Town Hall Rich List 2025.
Inserts chief_executive_salary and chief_executive_total_remuneration after chief_executive line.
"""

import csv
import re
import os
import sys
import subprocess
import openpyxl
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent
COUNCIL_DIR = PROJECT_ROOT / 'src/data/councils'
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
    'Kingston upon Hull': 'Hull',
    'Bournemouth, Christchurch & Poole': 'Bournemouth, Christchurch, and Poole',
    'City of London': 'Corporation of London',
    'Stoke-on-Trent': 'Stoke-on-Trent',
    'York': 'City of York',
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
    # Case-insensitive fallback
    name_lower = name.lower()
    for dn in dataset_names:
        if dn.lower() == name_lower:
            return dn
    return None


def is_ceo_title(title):
    """Determine if a job title represents the chief executive."""
    t = title.lower().strip()

    # Definite CEOs
    if t in ('chief executive', 'chief executive officer'):
        return True

    # Combined roles like "Deputy chief executive/chief executive"
    if '/' in t and 'chief executive' in t:
        parts = [p.strip() for p in t.split('/')]
        if any(p in ('chief executive', 'chief executive officer') for p in parts):
            return True

    # Acting/interim CEOs
    if t.startswith('acting chief executive') or t.startswith('interim chief executive'):
        return True

    # Head of paid service (statutory CEO equivalent)
    if 'head of paid service' in t and 'deputy' not in t and 'assistant' not in t:
        return True

    # Managing director (some councils use this title)
    if t.startswith('managing director') and 'ltd' not in t and 'limited' not in t:
        return True

    # Chief executive with parenthetical qualifier
    if t.startswith('chief executive (') or t.startswith('chief executive and '):
        return True

    # Specific alternative title: "City director" (Stoke-on-Trent)
    if t == 'city director':
        return True

    # Exclude assistants, deputies (unless combined as above)
    if 'assistant chief executive' in t or 'deputy chief executive' in t:
        return False

    return False


def load_ceo_data():
    """Load CEO salary data from TPA Town Hall Rich List xlsx."""
    wb = openpyxl.load_workbook(DATA_DIR / 'tpa-rich-list-2025.xlsx', data_only=True)
    ws = wb['Mastersheet']
    rows = list(ws.iter_rows(min_row=2, values_only=True))

    english_regions = {
        'East Midlands', 'East of England', 'London', 'North East',
        'North West', 'South East', 'South West', 'West Midlands',
        'Yorkshire and the Humber'
    }

    ceo_data = {}
    for row in rows:
        council = str(row[0]).strip() if row[0] else ''
        region = str(row[1]).strip() if row[1] else ''
        if region not in english_regions:
            continue

        title = str(row[3]).strip() if row[3] else ''
        salary = int(row[4]) if row[4] else 0
        total_rem = int(row[11]) if row[11] else (int(row[9]) if row[9] else 0)

        if not council or salary <= 0:
            continue

        if is_ceo_title(title):
            if council not in ceo_data or salary > ceo_data[council]['salary']:
                ceo_data[council] = {
                    'salary': salary,
                    'total': total_rem,
                }

    return ceo_data


def insert_after_line_containing(content, search_start, search_end, marker, new_lines):
    marker_idx = content.find(marker, search_start)
    if marker_idx == -1 or marker_idx > search_end:
        return content, False
    line_end = content.find('\n', marker_idx)
    if line_end == -1:
        return content, False
    content = content[:line_end + 1] + new_lines + content[line_end + 1:]
    return content, True


def process_file(filepath, ceo_data, ceo_names):
    content = open(filepath, 'r', encoding='utf-8').read()
    original = content

    name_pattern = re.compile(r'^\s{4}name:\s*"([^"]+)"', re.MULTILINE)
    names = name_pattern.findall(content)

    added = 0

    for council_name in names:
        name_idx = content.find(f'    name: "{council_name}"')
        if name_idx == -1:
            continue

        next_council = content.find('ons_code:', name_idx + 20)
        if next_council == -1:
            next_council = len(content)

        chunk = content[name_idx:next_council]

        if 'chief_executive_salary:' in chunk:
            continue

        lookup = gov_lookup(council_name, ceo_names)
        if not lookup or lookup not in ceo_data:
            continue

        data = ceo_data[lookup]
        new_lines = f'      chief_executive_salary: {data["salary"]},\n'
        if data['total'] and data['total'] > data['salary']:
            new_lines += f'      chief_executive_total_remuneration: {data["total"]},\n'

        # Insert after chief_executive: line (the name field)
        content, ok = insert_after_line_containing(
            content, name_idx, next_council, 'chief_executive:', new_lines
        )
        if ok:
            added += 1
            next_council += len(new_lines)

    return content, original, added


def main():
    print("=== CEO Salary Enrichment (TPA Rich List 2025) ===\n")

    ceo_data = load_ceo_data()
    ceo_names = set(ceo_data.keys())
    print(f"Loaded {len(ceo_data)} English councils from TPA data\n")

    total_added = 0
    temp_files = []

    for filename in COUNCIL_FILES:
        filepath = COUNCIL_DIR / filename
        if not filepath.exists():
            continue

        print(f"Processing {filename}...")
        content, original, added = process_file(filepath, ceo_data, ceo_names)

        total_added += added
        if added:
            print(f"  chief_executive_salary added: {added}")
        else:
            print(f"  No changes needed")

        tmp_path = filepath.with_suffix('.ts.tmp')
        with open(tmp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        temp_files.append((tmp_path, filepath))

    print(f"\nTotal chief_executive_salary added: {total_added}\n")

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
        print(f"\n=== SUCCESS ===")
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
