#!/usr/bin/env python3
"""
Batch-enrich all 317 councils with service_outcomes data from bulk GOV.UK datasets.

Adds these fields (where missing) to each council's service_outcomes:
  - population_served (from ONS mid-2024 population estimates)
  - roads.maintained_miles (from DfT RDL0102 road length stats)

Does NOT overwrite any existing values — only adds missing fields.

Usage: python3 enrich-service-outcomes.py
"""

import csv
import re
import os
import sys
import subprocess
from pathlib import Path

# === CONFIGURATION ===

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

# === NAME MAPPING ===

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


def insert_after_line_containing(content, search_start, search_end, marker, new_line):
    """Insert new_line after the line containing marker, within [search_start, search_end]."""
    marker_idx = content.find(marker, search_start)
    if marker_idx == -1 or marker_idx > search_end:
        return content, False
    # Find end of this line
    line_end = content.find('\n', marker_idx)
    if line_end == -1:
        return content, False
    content = content[:line_end + 1] + new_line + content[line_end + 1:]
    return content, True


def process_file(filepath, pop_data, road_len_data, pop_names, road_names):
    """Process a single .ts file: add missing service_outcomes fields."""
    content = open(filepath, 'r', encoding='utf-8').read()
    original_content = content

    name_pattern = re.compile(r'^\s{4}name:\s*"([^"]+)"', re.MULTILINE)
    names = name_pattern.findall(content)

    pop_added = 0
    road_miles_added = 0

    for council_name in names:
        name_idx = content.find(f'    name: "{council_name}"')
        if name_idx == -1:
            continue

        next_council = content.find('ons_code:', name_idx + 20)
        if next_council == -1:
            next_council = len(content)

        so_idx = content.find('service_outcomes:', name_idx)
        if so_idx == -1 or so_idx > next_council:
            continue

        # === ADD population_served ===
        pop_check = content.find('population_served:', name_idx)
        has_pop = pop_check != -1 and pop_check < next_council

        if not has_pop:
            pop_lookup = gov_lookup(council_name, pop_names)
            if pop_lookup and pop_lookup in pop_data:
                pop_val = int(float(pop_data[pop_lookup]['population']))
                # Insert after "service_outcomes: {" line
                pop_line = f'        population_served: {pop_val},\n'
                content, ok = insert_after_line_containing(
                    content, so_idx, next_council, 'service_outcomes: {', pop_line
                )
                if ok:
                    pop_added += 1
                    next_council += len(pop_line)

        # === ADD roads.maintained_miles ===
        roads_check = content.find('roads:', name_idx)
        has_roads = roads_check != -1 and roads_check < next_council

        if has_roads:
            miles_check = content.find('maintained_miles:', name_idx)
            has_miles = miles_check != -1 and miles_check < next_council

            if not has_miles:
                road_lookup = gov_lookup(council_name, road_names)
                if road_lookup and road_lookup in road_len_data:
                    miles_val = int(float(road_len_data[road_lookup]['total_miles']))
                    if miles_val > 0:
                        # Insert after condition_poor_percent line (last field before roads closing })
                        miles_line = f'          maintained_miles: {miles_val},\n'
                        content, ok = insert_after_line_containing(
                            content, roads_check, next_council,
                            'condition_poor_percent:', miles_line
                        )
                        if ok:
                            road_miles_added += 1
                            next_council += len(miles_line)

    return content, original_content, pop_added, road_miles_added


def main():
    print("=== Batch Service Outcomes Enrichment ===\n")

    print("Loading datasets...")
    pop_data = load_csv('parsed-population.csv')
    road_len_data = load_csv('parsed-road-length.csv')
    print(f"  Population: {len(pop_data)} entries")
    print(f"  Road length: {len(road_len_data)} entries")
    print()

    pop_names = set(pop_data.keys())
    road_names = set(road_len_data.keys())

    total_pop = 0
    total_miles = 0
    temp_files = []

    for filename in COUNCIL_FILES:
        filepath = COUNCIL_DIR / filename
        if not filepath.exists():
            print(f"  ERROR: {filepath} not found!")
            continue

        print(f"Processing {filename}...")
        content, original, pop_added, miles_added = process_file(
            filepath, pop_data, road_len_data, pop_names, road_names
        )

        total_pop += pop_added
        total_miles += miles_added

        print(f"  population_served added: {pop_added}")
        print(f"  maintained_miles added: {miles_added}")

        tmp_path = filepath.with_suffix('.ts.tmp')
        with open(tmp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        temp_files.append((tmp_path, filepath))
        print()

    print(f"Total population_served added: {total_pop}")
    print(f"Total maintained_miles added: {total_miles}")
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
        print()
        print(f"=== SUCCESS ===")
        print(f"  population_served: {total_pop} councils")
        print(f"  maintained_miles: {total_miles} councils")
    else:
        print("  TypeScript compilation: FAILED")
        print(result.stdout[:2000] if result.stdout else '')
        print(result.stderr[:2000] if result.stderr else '')
        for tmp_path, orig_path in temp_files:
            backup_path = orig_path.with_suffix('.ts.bak')
            if backup_path.exists():
                os.rename(orig_path, tmp_path)
                os.rename(backup_path, orig_path)
        print("\n=== ROLLED BACK ===")
        sys.exit(1)


if __name__ == '__main__':
    main()
