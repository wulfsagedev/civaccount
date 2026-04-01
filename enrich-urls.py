#!/usr/bin/env python3
"""
Batch-insert discovered URLs (transparency_url, councillors_url, budget_url)
from discovered-urls.csv into council data files.

Inserts each URL after the corresponding existing URL field or after website:.
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


def load_url_data():
    """Load discovered URLs from CSV."""
    data = {}
    path = DATA_DIR / 'discovered-urls.csv'
    with open(path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row['name'].strip()
            urls = {}
            if row.get('transparency_url', '').strip():
                urls['transparency_url'] = row['transparency_url'].strip()
            if row.get('councillors_url', '').strip():
                urls['councillors_url'] = row['councillors_url'].strip()
            if row.get('budget_url', '').strip():
                urls['budget_url'] = row['budget_url'].strip()
            if urls:
                data[name] = urls
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


def process_file(filepath, url_data):
    content = open(filepath, 'r', encoding='utf-8').read()
    original = content

    name_pattern = re.compile(r'^\s{4}name:\s*"([^"]+)"', re.MULTILINE)
    names = name_pattern.findall(content)

    transparency_added = 0
    councillors_added = 0
    budget_added = 0

    for council_name in names:
        if council_name not in url_data:
            continue

        urls = url_data[council_name]
        name_idx = content.find(f'    name: "{council_name}"')
        if name_idx == -1:
            continue

        next_council = content.find('ons_code:', name_idx + 20)
        if next_council == -1:
            next_council = len(content)

        chunk = content[name_idx:next_council]

        # Insert budget_url after accounts_url (or after council_tax_url)
        if 'budget_url' in urls and 'budget_url:' not in chunk:
            url = urls['budget_url']
            new_line = f'      budget_url: "{url}",\n'
            content, ok = insert_after_line_containing(
                content, name_idx, next_council, 'accounts_url:', new_line
            )
            if not ok:
                content, ok = insert_after_line_containing(
                    content, name_idx, next_council, 'council_tax_url:', new_line
                )
            if ok:
                budget_added += 1
                next_council += len(new_line)

        # Re-read chunk
        chunk = content[name_idx:next_council]

        # Insert transparency_url after budget_url (or accounts_url, or council_tax_url)
        if 'transparency_url' in urls and 'transparency_url:' not in chunk:
            url = urls['transparency_url']
            new_line = f'      transparency_url: "{url}",\n'
            for marker in ['budget_url:', 'accounts_url:', 'council_tax_url:']:
                content, ok = insert_after_line_containing(
                    content, name_idx, next_council, marker, new_line
                )
                if ok:
                    transparency_added += 1
                    next_council += len(new_line)
                    break

        # Re-read chunk
        chunk = content[name_idx:next_council]

        # Insert councillors_url after transparency_url (or budget_url, or accounts_url)
        if 'councillors_url' in urls and 'councillors_url:' not in chunk:
            url = urls['councillors_url']
            new_line = f'      councillors_url: "{url}",\n'
            for marker in ['transparency_url:', 'budget_url:', 'accounts_url:', 'council_tax_url:']:
                content, ok = insert_after_line_containing(
                    content, name_idx, next_council, marker, new_line
                )
                if ok:
                    councillors_added += 1
                    next_council += len(new_line)
                    break

    return content, original, transparency_added, councillors_added, budget_added


def main():
    print("=== URL Enrichment ===\n")

    url_data = load_url_data()
    print(f"Loaded URLs for {len(url_data)} councils\n")

    total_t = 0
    total_c = 0
    total_b = 0
    temp_files = []

    for filename in COUNCIL_FILES:
        filepath = COUNCIL_DIR / filename
        if not filepath.exists():
            continue

        print(f"Processing {filename}...")
        content, original, t, c, b = process_file(filepath, url_data)

        total_t += t
        total_c += c
        total_b += b

        changes = []
        if t: changes.append(f"transparency: {t}")
        if c: changes.append(f"councillors: {c}")
        if b: changes.append(f"budget: {b}")
        if changes:
            print(f"  Added: {', '.join(changes)}")
        else:
            print(f"  No changes needed")

        tmp_path = filepath.with_suffix('.ts.tmp')
        with open(tmp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        temp_files.append((tmp_path, filepath))

    print(f"\nTotal transparency_url added: {total_t}")
    print(f"Total councillors_url added: {total_c}")
    print(f"Total budget_url added: {total_b}")
    print(f"Grand total URLs: {total_t + total_c + total_b}\n")

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
