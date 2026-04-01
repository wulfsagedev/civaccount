#!/usr/bin/env python3
"""
Batch-enrich all council TypeScript files with top_suppliers from Contracts Finder OCDS data.

Reads: parsed-top-suppliers.csv (output of parse-contracts-finder.py)
Modifies: src/data/councils/{county-councils,districts,metropolitan,unitary,london-boroughs}.ts

Inserts top_suppliers arrays before last_verified in each council's detailed block.
Skips councils that already have top_suppliers.
"""

import csv
import re
import subprocess
import sys
from collections import defaultdict

# ── Config ────────────────────────────────────────────────────────────────────

CSV_FILE = "parsed-top-suppliers.csv"
TS_FILES = [
    "src/data/councils/county-councils.ts",
    "src/data/councils/districts.ts",
    "src/data/councils/metropolitan.ts",
    "src/data/councils/unitary.ts",
    "src/data/councils/london-boroughs.ts",
]


# ── Load CSV data ─────────────────────────────────────────────────────────────

def load_suppliers():
    """Load parsed-top-suppliers.csv into {council_name: [{name, annual_spend, category}, ...]}."""
    data = defaultdict(list)
    with open(CSV_FILE, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            council = row["council"]
            data[council].append({
                "name": row["supplier_name"],
                "annual_spend": int(row["annual_value"]),
                "category": row["primary_category"],
            })
    return data


# ── Generate TypeScript block ─────────────────────────────────────────────────

def escape_ts_string(s):
    """Escape a string for TypeScript literal."""
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ")


def generate_top_suppliers_block(suppliers):
    """Generate the TypeScript top_suppliers array block."""
    lines = []
    lines.append("      // Top suppliers from Contracts Finder OCDS data (annualised contract values)")
    lines.append("      // Source: https://www.contractsfinder.service.gov.uk/ via https://data.open-contracting.org/")
    lines.append("      top_suppliers: [")
    for s in suppliers:
        name = escape_ts_string(s["name"])
        spend = s["annual_spend"]
        cat = escape_ts_string(s["category"])
        lines.append(f'        {{ name: "{name}", annual_spend: {spend}, category: "{cat}" }},')
    lines.append("      ],")
    return "\n".join(lines)


# ── Insert into TypeScript file ───────────────────────────────────────────────

def enrich_file(ts_file, supplier_data):
    """Insert top_suppliers into a TypeScript file for matching councils."""
    with open(ts_file, "r") as f:
        content = f.read()

    enriched = 0
    skipped_existing = 0
    skipped_no_data = 0

    # Find all councils in this file
    # Pattern: name: "Council Name",
    council_pattern = re.compile(r'^\s+name:\s+"([^"]+)",', re.MULTILINE)
    matches = list(council_pattern.finditer(content))

    # Process in reverse order so insertions don't shift positions
    for match in reversed(matches):
        council_name = match.group(1)

        if council_name not in supplier_data:
            skipped_no_data += 1
            continue

        # Check if this council already has top_suppliers
        # Look between this name and the next name (or end of file)
        start = match.start()
        next_match = None
        for m in matches:
            if m.start() > start:
                next_match = m
                break
        end = next_match.start() if next_match else len(content)
        section = content[start:end]

        if "top_suppliers:" in section:
            skipped_existing += 1
            continue

        # Find last_verified in this section
        lv_match = re.search(r'^(\s+)last_verified:', section, re.MULTILINE)
        if not lv_match:
            print(f"  WARNING: No last_verified found for {council_name} in {ts_file}")
            continue

        # Calculate absolute position for insertion
        insert_pos = start + lv_match.start()

        # Generate the block
        block = generate_top_suppliers_block(supplier_data[council_name])

        # Insert before last_verified with a blank line separator
        content = content[:insert_pos] + block + "\n\n" + content[insert_pos:]
        enriched += 1

    if enriched > 0:
        with open(ts_file, "w") as f:
            f.write(content)

    return enriched, skipped_existing, skipped_no_data


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=== Enrich Top Suppliers from Contracts Finder ===\n")

    supplier_data = load_suppliers()
    print(f"Loaded supplier data for {len(supplier_data)} councils\n")

    total_enriched = 0
    total_skipped_existing = 0
    total_skipped_no_data = 0

    for ts_file in TS_FILES:
        print(f"Processing {ts_file}...")
        enriched, skipped_existing, skipped_no_data = enrich_file(ts_file, supplier_data)
        print(f"  Enriched: {enriched}, Already had: {skipped_existing}, No data: {skipped_no_data}")
        total_enriched += enriched
        total_skipped_existing += skipped_existing
        total_skipped_no_data += skipped_no_data

    print(f"\n=== Summary ===")
    print(f"Councils enriched: {total_enriched}")
    print(f"Already had top_suppliers: {total_skipped_existing}")
    print(f"No Contracts Finder data: {total_skipped_no_data}")

    # Type check
    print(f"\nRunning TypeScript check...")
    result = subprocess.run(
        ["npx", "tsc", "--noEmit"],
        capture_output=True, text=True, timeout=120
    )
    if result.returncode == 0:
        print("TypeScript compilation: OK")
    else:
        print("TypeScript compilation: FAILED")
        print(result.stdout[:2000] if result.stdout else "")
        print(result.stderr[:2000] if result.stderr else "")
        sys.exit(1)


if __name__ == "__main__":
    main()
