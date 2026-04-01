#!/usr/bin/env python3
"""
Enrich council TypeScript files with grant_payments from parsed-grants.csv.

Reads: parsed-grants.csv
Modifies: src/data/councils/{county-councils,districts,metropolitan,unitary,london-boroughs}.ts

Inserts grant_payments arrays before last_verified in each council's detailed block.
Skips councils that already have grant_payments.
"""

import csv
import re
import subprocess
import sys
from collections import defaultdict

CSV_FILE = "parsed-grants.csv"
TS_FILES = [
    "src/data/councils/county-councils.ts",
    "src/data/councils/districts.ts",
    "src/data/councils/metropolitan.ts",
    "src/data/councils/unitary.ts",
    "src/data/councils/london-boroughs.ts",
]

# Source URLs for transparency links
SOURCES = {
    "Cambridgeshire": "https://data.cambridgeshireinsight.org.uk/dataset/cambridgeshire-county-council-payments",
    "Camden": "https://opendata.camden.gov.uk/Community/Grants-to-Voluntary-Community-and-Social-Enterpris/fqws-c3sc/about_data",
    "Trafford": "https://www.trafford.gov.uk/residents/about-the-council/open-data/open-data.aspx",
    "Birmingham": "https://www.birmingham.gov.uk/info/50265/about_the_council/2875/grants",
    "Barnet": "https://open.barnet.gov.uk/dataset/1pxal/barnet-council-grants-data",
    "Essex": "https://data.essex.gov.uk/dataset/2rk4m/community-initiatives-fund-grants",
    "South Oxfordshire": "https://www.southandvale.gov.uk/south-oxfordshire-district-council/community-grants-and-funding/",
    "Vale of White Horse": "https://www.southandvale.gov.uk/vale-of-white-horse-district-council/community-grants-and-funding/",
    "Epping Forest": "https://www.eppingforestdc.gov.uk/your-council/spending-and-contracts/",
}


def load_grants():
    """Load parsed-grants.csv into {council_name: [{recipient, amount, purpose}, ...]}."""
    data = defaultdict(list)
    with open(CSV_FILE, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            council = row["council"]
            data[council].append({
                "recipient": row["recipient"],
                "amount": int(row["amount"]),
                "purpose": row["purpose"],
            })
    return data


def escape_ts_string(s):
    """Escape a string for TypeScript literal."""
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ")


def generate_grant_payments_block(council_name, grants):
    """Generate the TypeScript grant_payments array block."""
    source_url = SOURCES.get(council_name, "")
    lines = []
    if source_url:
        lines.append(f"      // Grant payments to voluntary and community organisations")
        lines.append(f"      // Source: {source_url}")
    else:
        lines.append(f"      // Grant payments to voluntary and community organisations")
    lines.append("      grant_payments: [")
    for g in grants:
        recipient = escape_ts_string(g["recipient"])
        amount = g["amount"]
        purpose = escape_ts_string(g["purpose"]) if g["purpose"] else ""
        if purpose:
            lines.append(f'        {{ recipient: "{recipient}", amount: {amount}, purpose: "{purpose}" }},')
        else:
            lines.append(f'        {{ recipient: "{recipient}", amount: {amount} }},')
    lines.append("      ],")
    return "\n".join(lines)


def enrich_file(ts_file, grant_data):
    """Insert grant_payments into a TypeScript file for matching councils."""
    with open(ts_file, "r") as f:
        content = f.read()

    enriched = 0
    skipped_existing = 0
    skipped_no_data = 0

    council_pattern = re.compile(r'^\s+name:\s+"([^"]+)",', re.MULTILINE)
    matches = list(council_pattern.finditer(content))

    for match in reversed(matches):
        council_name = match.group(1)

        if council_name not in grant_data:
            skipped_no_data += 1
            continue

        # Check if this council already has grant_payments
        start = match.start()
        next_match = None
        for m in matches:
            if m.start() > start:
                next_match = m
                break
        end = next_match.start() if next_match else len(content)
        section = content[start:end]

        if "grant_payments:" in section:
            skipped_existing += 1
            continue

        # Find last_verified in this section
        lv_match = re.search(r'^(\s+)last_verified:', section, re.MULTILINE)
        if not lv_match:
            print(f"  WARNING: No last_verified found for {council_name} in {ts_file}")
            continue

        insert_pos = start + lv_match.start()
        block = generate_grant_payments_block(council_name, grant_data[council_name])
        content = content[:insert_pos] + block + "\n\n" + content[insert_pos:]
        enriched += 1

    if enriched > 0:
        with open(ts_file, "w") as f:
            f.write(content)

    return enriched, skipped_existing, skipped_no_data


def main():
    print("=== Enrich Grant Payments ===\n")

    grant_data = load_grants()
    print(f"Loaded grant data for {len(grant_data)} councils\n")

    total_enriched = 0
    total_skipped_existing = 0

    for ts_file in TS_FILES:
        print(f"Processing {ts_file}...")
        enriched, skipped_existing, skipped_no_data = enrich_file(ts_file, grant_data)
        print(f"  Enriched: {enriched}, Already had: {skipped_existing}, No data: {skipped_no_data}")
        total_enriched += enriched
        total_skipped_existing += skipped_existing

    print(f"\n=== Summary ===")
    print(f"Councils enriched: {total_enriched}")
    print(f"Already had grant_payments: {total_skipped_existing}")

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
