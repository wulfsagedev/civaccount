#!/usr/bin/env python3
"""
Batch-add total_councillors from LGBCE Electoral Data Workbook (official Crown Copyright).
Source: Local Government Boundary Commission for England.
Inserts after council_leader: line.
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
    'Kingston upon Thames': 'Kingston Upon Thames',
}

# City of London has 100 Common Councillors + 25 Aldermen = 125 members
# Source: City of London Corporation website (official local authority)
MANUAL_DATA = {
    'City of London': 125,
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


def load_councillor_data():
    data = {}
    path = DATA_DIR / 'parsed-lgbce-councillors.csv'
    with open(path, 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            name = row['name'].strip()
            total = int(row['total_councillors'])
            if total > 0:
                data[name] = total
    # Add manual data
    data.update(MANUAL_DATA)
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


def process_file(filepath, councillor_data, data_names):
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

        if 'total_councillors:' in chunk:
            continue

        # Check manual data first, then LGBCE
        if council_name in MANUAL_DATA:
            total = MANUAL_DATA[council_name]
        else:
            lookup = gov_lookup(council_name, data_names)
            if not lookup or lookup not in councillor_data:
                continue
            total = councillor_data[lookup]

        new_line = f'      total_councillors: {total},\n'
        content, ok = insert_after_line_containing(
            content, name_idx, next_council, 'council_leader:', new_line
        )
        if ok:
            added += 1
            next_council += len(new_line)

    return content, original, added


def main():
    print("=== Councillor Count Enrichment (LGBCE Official Data) ===\n")

    data = load_councillor_data()
    data_names = set(data.keys())
    print(f"Loaded {len(data)} authorities from LGBCE + manual data\n")

    total_added = 0
    temp_files = []

    for filename in COUNCIL_FILES:
        filepath = COUNCIL_DIR / filename
        if not filepath.exists():
            continue

        print(f"Processing {filename}...")
        content, original, added = process_file(filepath, data, data_names)

        total_added += added
        if added:
            print(f"  total_councillors added: {added}")
        else:
            print(f"  No changes needed")

        tmp_path = filepath.with_suffix('.ts.tmp')
        with open(tmp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        temp_files.append((tmp_path, filepath))

    print(f"\nTotal added: {total_added}\n")

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
        print(f"\n=== SUCCESS === total_councillors added to {total_added} councils")
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
