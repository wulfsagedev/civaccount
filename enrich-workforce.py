#!/usr/bin/env python3
"""
Batch-add staff_fte to all councils from LGA QPSES Q1 2025 data.
Also fills 3 remaining service_outcomes gaps (Bristol waste, Medway & Southend Ofsted).

Inserts staff_fte after total_councillors line (where missing).
"""

import csv
import re
import os
import sys
import subprocess
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
    'Kingston upon Hull': 'Kingston upon Hull, City of',
    'Buckinghamshire': 'BUCKINGHAMSHIRE COUNCIL',
    'City of London': 'Corporation of London',
    'Folkestone & Hythe': 'Shepway',
    'North Northamptonshire': 'NORTH NORTHAMPTONSHIRE',
    'North Yorkshire': 'NORTH YORKSHIRE',
    'Somerset': 'SOMERSET',
    'West Northamptonshire': 'WEST NORTHAMPTONSHIRE',
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


def load_workforce_data():
    """Load staff FTE per council from QPSES parsed CSV."""
    data = {}
    path = DATA_DIR / 'parsed-workforce.csv'
    with open(path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row['name'].strip()
            fte = int(row['staff_fte'])
            if fte > 0:
                data[name] = fte
    return data


def load_waste_data():
    """Load waste data for gap-filling."""
    data = {}
    path = DATA_DIR / 'parsed-waste.csv'
    with open(path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data[row['name'].strip()] = {
                'recycling_rate': float(row['recycling_rate']),
                'total_waste_tonnes': int(row['total_waste_tonnes']),
            }
    return data


def load_ofsted_data():
    """Load Ofsted data for gap-filling."""
    data = {}
    path = DATA_DIR / 'parsed-ofsted.csv'
    with open(path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data[row['name'].strip()] = {
                'rating': row['rating'],
                'date': row['date'],
            }
    return data


def insert_after_line_containing(content, search_start, search_end, marker, new_line):
    marker_idx = content.find(marker, search_start)
    if marker_idx == -1 or marker_idx > search_end:
        return content, False
    line_end = content.find('\n', marker_idx)
    if line_end == -1:
        return content, False
    content = content[:line_end + 1] + new_line + content[line_end + 1:]
    return content, True


def process_file(filepath, workforce_data, wf_names):
    content = open(filepath, 'r', encoding='utf-8').read()
    original = content

    name_pattern = re.compile(r'^\s{4}name:\s*"([^"]+)"', re.MULTILINE)
    names = name_pattern.findall(content)

    fte_added = 0

    for council_name in names:
        name_idx = content.find(f'    name: "{council_name}"')
        if name_idx == -1:
            continue

        next_council = content.find('ons_code:', name_idx + 20)
        if next_council == -1:
            next_council = len(content)

        chunk = content[name_idx:next_council]

        # 1. Add staff_fte after total_councillors
        if 'staff_fte:' not in chunk:
            lookup = gov_lookup(council_name, wf_names)
            if lookup and lookup in workforce_data:
                fte = workforce_data[lookup]
                new_line = f'      staff_fte: {fte},\n'
                content, ok = insert_after_line_containing(
                    content, name_idx, next_council, 'total_councillors:', new_line
                )
                if ok:
                    fte_added += 1
                    next_council += len(new_line)

    return content, original, fte_added


def main():
    print("=== Workforce & Gap-Fill Enrichment ===\n")

    workforce_data = load_workforce_data()
    wf_names = set(workforce_data.keys())
    print(f"Loaded {len(workforce_data)} councils from QPSES workforce data\n")

    total_fte = 0
    temp_files = []

    for filename in COUNCIL_FILES:
        filepath = COUNCIL_DIR / filename
        if not filepath.exists():
            continue

        print(f"Processing {filename}...")
        content, original, fte = process_file(filepath, workforce_data, wf_names)

        total_fte += fte

        if fte:
            print(f"  staff_fte added: {fte}")
        else:
            print(f"  No changes needed")

        tmp_path = filepath.with_suffix('.ts.tmp')
        with open(tmp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        temp_files.append((tmp_path, filepath))

    print(f"\nTotal staff_fte added: {total_fte}\n")

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
