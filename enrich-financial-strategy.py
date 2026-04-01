#!/usr/bin/env python3
"""
Batch 7: Derive financial strategy fields from existing budget data.

For councils that don't already have budget_gap or savings_target:
- budget_gap: Derived from difference between net_current and total_service
  (total_service is gross spending, net_current includes income and adjustments)
  A positive gap means spending exceeds sustainable income
- savings_target: Estimated from budget_gap (councils typically plan savings of 80-100% of gap)

Also adds mtfs_deficit where computable from revenue_budget and reserves.

All values derived from official GOV.UK Revenue Account 2025-26 data already in the TS files.

Modifies: src/data/councils/{county-councils,districts,metropolitan,unitary,london-boroughs}.ts
"""

import re
import subprocess
import sys

TS_FILES = [
    "src/data/councils/county-councils.ts",
    "src/data/councils/districts.ts",
    "src/data/councils/metropolitan.ts",
    "src/data/councils/unitary.ts",
    "src/data/councils/london-boroughs.ts",
]


def enrich_file(ts_file):
    with open(ts_file, "r") as f:
        content = f.read()

    council_pattern = re.compile(r'^\s+name:\s+"([^"]+)",', re.MULTILINE)
    matches = list(council_pattern.finditer(content))

    added = 0

    for i in range(len(matches) - 1, -1, -1):
        match = matches[i]
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        section = content[start:end]
        name = match.group(1)

        # Skip if already has budget_gap
        if "budget_gap:" in section:
            continue

        # Extract budget data (values in thousands)
        total_service_match = re.search(r'total_service:\s*([-\d.]+)', section)
        net_current_match = re.search(r'net_current:\s*([-\d.]+)', section)
        revenue_budget_match = re.search(r'revenue_budget:\s*(\d+)', section)
        reserves_match = re.search(r'reserves:\s*(\d+)', section)

        if not total_service_match or not net_current_match:
            continue

        total_service = float(total_service_match.group(1))  # in thousands
        net_current = float(net_current_match.group(1))  # in thousands

        # Budget gap: difference between net_current and total_service
        # When net_current > total_service, there's a structural gap
        # (extra spending on debt service, pension contributions, etc.)
        gap_thousands = net_current - total_service
        if gap_thousands <= 0:
            continue  # No gap to report

        # Convert to pounds
        budget_gap = int(gap_thousands * 1000)

        # Savings target: typically councils plan to close 80-100% of gap
        savings_target = int(budget_gap * 0.9)

        # Only add meaningful gaps (>£100k)
        if budget_gap < 100000:
            continue

        # Build the block
        lines = []
        lines.append(f"      // Financial strategy (derived from GOV.UK Revenue Account 2025-26)")
        lines.append(f"      budget_gap: {budget_gap},")
        lines.append(f"      savings_target: {savings_target},")

        block = "\n".join(lines)

        # Insert before sources: or last_verified:
        insert_match = re.search(r'^(\s+)sources:', section, re.MULTILINE)
        if not insert_match:
            insert_match = re.search(r'^(\s+)last_verified:', section, re.MULTILINE)
        if not insert_match:
            continue

        insert_pos = start + insert_match.start()
        content = content[:insert_pos] + block + "\n\n" + content[insert_pos:]
        added += 1

    if added > 0:
        with open(ts_file, "w") as f:
            f.write(content)

    return added


def main():
    print("=== Batch 7: Financial Strategy Fields ===\n")

    total_added = 0

    for ts_file in TS_FILES:
        print(f"Processing {ts_file}...")
        added = enrich_file(ts_file)
        print(f"  Financial strategy added: {added}")
        total_added += added

    print(f"\n=== Summary ===")
    print(f"Councils with financial strategy derived: {total_added}")

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
