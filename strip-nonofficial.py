#!/usr/bin/env python3
"""
Remove all data sourced from non-official UK government sources:
1. chief_executive_salary / chief_executive_total_remuneration (TaxPayers' Alliance)
2. total_councillors (Open Council Data UK)
3. staff_fte (LGA QPSES)

Removes the lines entirely from all council data files.
"""

import re
import os
import sys
import subprocess
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent
COUNCIL_DIR = PROJECT_ROOT / 'src/data/councils'

COUNCIL_FILES = [
    'county-councils.ts',
    'districts.ts',
    'metropolitan.ts',
    'unitary.ts',
    'london-boroughs.ts',
]

# Patterns matching the exact lines to remove (with leading whitespace)
REMOVE_PATTERNS = [
    re.compile(r'^\s+chief_executive_salary:\s+\d+,?\s*\n', re.MULTILINE),
    re.compile(r'^\s+chief_executive_total_remuneration:\s+\d+,?\s*\n', re.MULTILINE),
    re.compile(r'^\s+total_councillors:\s+\d+,?\s*\n', re.MULTILINE),
    re.compile(r'^\s+staff_fte:\s+\d+,?\s*\n', re.MULTILINE),
]

# Also remove staff_cost and agency_staff_count (from manual entries using non-official sources)
REMOVE_PATTERNS.extend([
    re.compile(r'^\s+staff_cost:\s+\d+,?\s*\n', re.MULTILINE),
    re.compile(r'^\s+agency_staff_count:\s+\d+,?\s*\n', re.MULTILINE),
])

# Remove any comment lines about staff that precede the now-removed fields
STAFF_COMMENT_PATTERNS = [
    re.compile(r'^\s+// Staff \([^)]+\)\s*\n', re.MULTILINE),
]


def process_file(filepath):
    content = open(filepath, 'r', encoding='utf-8').read()
    original = content

    removals = {}
    for pattern in REMOVE_PATTERNS:
        field_name = pattern.pattern.split(r'\s+')[1].split(':')[0]
        matches = pattern.findall(content)
        if matches:
            removals[field_name] = len(matches)
            content = pattern.sub('', content)

    # Remove orphaned staff comment lines
    for pattern in STAFF_COMMENT_PATTERNS:
        content = pattern.sub('', content)

    # Clean up any double blank lines created by removal
    content = re.sub(r'\n\n\n+', '\n\n', content)

    return content, original, removals


def main():
    print("=== Stripping Non-Official Data Sources ===\n")

    total_removals = {}
    temp_files = []

    for filename in COUNCIL_FILES:
        filepath = COUNCIL_DIR / filename
        if not filepath.exists():
            continue

        print(f"Processing {filename}...")
        content, original, removals = process_file(filepath)

        for field, count in removals.items():
            total_removals[field] = total_removals.get(field, 0) + count

        if removals:
            for field, count in removals.items():
                print(f"  Removed {field}: {count}")
        else:
            print(f"  No removals needed")

        tmp_path = filepath.with_suffix('.ts.tmp')
        with open(tmp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        temp_files.append((tmp_path, filepath))

    print(f"\n=== Total Removals ===")
    for field, count in sorted(total_removals.items()):
        print(f"  {field}: {count}")

    # TypeScript check
    print("\nRunning TypeScript compilation check...")
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
        print(f"\n=== SUCCESS — non-official data removed ===")
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
