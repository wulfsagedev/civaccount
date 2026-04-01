#!/usr/bin/env python3
"""
Add chief_executive_salary and staff_fte for county councils from
official council publications (Pay Policy Statements, Statements of Accounts).
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
]


def insert_after_line_containing(content, search_start, search_end, marker, new_lines):
    marker_idx = content.find(marker, search_start)
    if marker_idx == -1 or marker_idx > search_end:
        return content, False
    line_end = content.find('\n', marker_idx)
    if line_end == -1:
        return content, False
    content = content[:line_end + 1] + new_lines + content[line_end + 1:]
    return content, True


def load_data():
    data = {}
    path = DATA_DIR / 'county-council-official-data.csv'
    with open(path, 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            name = row['name'].strip()
            entry = {}
            if row['chief_executive_salary'].strip():
                entry['salary'] = int(row['chief_executive_salary'].strip())
            if row['staff_fte'].strip():
                entry['fte'] = int(row['staff_fte'].strip())
            if entry:
                data[name] = entry
    return data


def process_file(filepath, data):
    content = open(filepath, 'r', encoding='utf-8').read()
    original = content

    name_pattern = re.compile(r'^\s{4}name:\s*"([^"]+)"', re.MULTILINE)
    names = name_pattern.findall(content)

    salary_added = 0
    fte_added = 0

    for council_name in names:
        if council_name not in data:
            continue

        entry = data[council_name]
        name_idx = content.find(f'    name: "{council_name}"')
        if name_idx == -1:
            continue

        next_council = content.find('ons_code:', name_idx + 20)
        if next_council == -1:
            next_council = len(content)

        chunk = content[name_idx:next_council]

        # Add chief_executive_salary after chief_executive: line
        if 'salary' in entry and 'chief_executive_salary:' not in chunk:
            new_line = f'      chief_executive_salary: {entry["salary"]},\n'
            content, ok = insert_after_line_containing(
                content, name_idx, next_council, 'chief_executive:', new_line
            )
            if ok:
                salary_added += 1
                next_council += len(new_line)

        # Re-read chunk
        chunk = content[name_idx:next_council]

        # Add staff_fte after total_councillors: line
        if 'fte' in entry and 'staff_fte:' not in chunk:
            new_line = f'      staff_fte: {entry["fte"]},\n'
            content, ok = insert_after_line_containing(
                content, name_idx, next_council, 'total_councillors:', new_line
            )
            if ok:
                fte_added += 1
                next_council += len(new_line)

    return content, original, salary_added, fte_added


def main():
    print("=== County Council Official Data Enrichment ===\n")

    data = load_data()
    print(f"Loaded data for {len(data)} councils\n")

    total_salary = 0
    total_fte = 0
    temp_files = []

    for filename in COUNCIL_FILES:
        filepath = COUNCIL_DIR / filename
        if not filepath.exists():
            continue

        print(f"Processing {filename}...")
        content, original, sal, fte = process_file(filepath, data)

        total_salary += sal
        total_fte += fte

        changes = []
        if sal: changes.append(f"salary: {sal}")
        if fte: changes.append(f"fte: {fte}")
        if changes:
            print(f"  Added: {', '.join(changes)}")

        tmp_path = filepath.with_suffix('.ts.tmp')
        with open(tmp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        temp_files.append((tmp_path, filepath))

    print(f"\nTotal chief_executive_salary added: {total_salary}")
    print(f"Total staff_fte added: {total_fte}\n")

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
