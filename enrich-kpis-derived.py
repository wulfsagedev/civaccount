#!/usr/bin/env python3
"""
Phase 1.5: Derive performance_kpis from existing service_outcomes data.

Targets:
  - 164 district councils (0% coverage)
  - 2 unitary authorities: Cumberland, Westmorland and Furness

Derivation rules (from existing service_outcomes fields):
  1. Recycling rate → KPI with RAG status vs national 45% target
  2. Housing delivery → KPI with RAG status vs 95% target
  3. Road condition → KPI with RAG status vs 95% target (if data exists)
  4. Ofsted rating → KPI (if data exists)

All values already exist in the council data — this script just reformats them
into performance_kpis entries. No external data sources.
"""

import re
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "src", "data", "councils")

FILES = [
    "districts.ts",
    "unitary.ts",
]


def derive_kpis_from_outcomes(outcomes_text):
    """Parse service_outcomes block and derive performance_kpis entries."""
    kpis = []

    # 1. Recycling rate
    recycling_match = re.search(r'recycling_rate_percent:\s*([\d.]+)', outcomes_text)
    if recycling_match:
        rate = float(recycling_match.group(1))
        year_match = re.search(r'recycling_rate_percent:.*?year:\s*"([^"]+)"', outcomes_text, re.DOTALL)
        period = year_match.group(1) if year_match else "2023-24"
        if rate >= 50:
            status = "green"
        elif rate >= 35:
            status = "amber"
        else:
            status = "red"
        kpis.append(
            f'        {{ metric: "Household waste recycled", value: "{rate}%", target: "50%", status: "{status}", period: "{period}" }}'
        )

    # 2. Housing delivery
    delivery_match = re.search(r'delivery_percent:\s*([\d.]+)', outcomes_text)
    if delivery_match:
        delivery = float(delivery_match.group(1))
        homes_match = re.search(r'homes_built:\s*(\d+)', outcomes_text)
        target_match = re.search(r'homes_target:\s*(\d+)', outcomes_text)
        year_match = re.search(r'homes_built_year:\s*"([^"]+)"', outcomes_text)
        period = year_match.group(1) if year_match else "2024-25"
        homes = int(homes_match.group(1)) if homes_match else None
        target = int(target_match.group(1)) if target_match else None
        if delivery >= 95:
            status = "green"
        elif delivery >= 75:
            status = "amber"
        else:
            status = "red"
        value_str = f"{int(delivery)}%" if delivery == int(delivery) else f"{delivery}%"
        if homes and target:
            kpis.append(
                f'        {{ metric: "Housing delivery ({homes:,} of {target:,} target)", value: "{value_str}", target: "95%", status: "{status}", period: "{period}" }}'
            )
        else:
            kpis.append(
                f'        {{ metric: "Housing delivery rate", value: "{value_str}", target: "95%", status: "{status}", period: "{period}" }}'
            )

    # 3. Road condition (less common in districts, but check)
    road_match = re.search(r'condition_good_percent:\s*([\d.]+)', outcomes_text)
    if road_match:
        condition = float(road_match.group(1))
        if condition >= 95:
            status = "green"
        elif condition >= 85:
            status = "amber"
        else:
            status = "red"
        value_str = f"{int(condition)}%" if condition == int(condition) else f"{condition}%"
        kpis.append(
            f'        {{ metric: "Roads in good condition", value: "{value_str}", target: "95%", status: "{status}", period: "2023-24" }}'
        )

    # 4. Ofsted rating (if children's services data exists)
    ofsted_match = re.search(r'ofsted_rating:\s*"([^"]+)"', outcomes_text)
    if ofsted_match:
        rating = ofsted_match.group(1)
        date_match = re.search(r'ofsted_date:\s*"([^"]+)"', outcomes_text)
        period = date_match.group(1) if date_match else "2023-24"
        if rating in ("Outstanding", "Good"):
            status = "green"
        elif rating == "Requires Improvement":
            status = "amber"
        else:
            status = "red"
        kpis.append(
            f'        {{ metric: "Ofsted overall rating", value: "{rating}", status: "{status}", period: "{period}" }}'
        )

    return kpis


def extract_council_blocks(content):
    """Find all council entries and their service_outcomes + whether they have performance_kpis."""
    # Each council entry starts with "  {" at column 2, with ons_code on the next line
    # Then name: "..." is the second field
    # Pattern: find each "  {\n    ons_code:" to locate council boundaries
    council_starts = list(re.finditer(r'\n(  \{\n    ons_code: "[^"]+",\n    name: "([^"]+)")', content))

    if not council_starts:
        # Try alternate indentation
        council_starts = list(re.finditer(r'\n(\s{2,4}\{\s*\n\s+ons_code: "[^"]+"[,\s]*\n\s+name: "([^"]+)")', content))

    results = []
    for i, match in enumerate(council_starts):
        start = match.start()
        # End is start of next council or end of file
        end = council_starts[i + 1].start() if i + 1 < len(council_starts) else len(content)
        block = content[start:end]

        has_kpis = 'performance_kpis:' in block or 'performance_kpis: [' in block
        name = match.group(2)

        # Extract service_outcomes block
        outcomes_match = re.search(r'service_outcomes:\s*\{', block)
        outcomes_text = ""
        if outcomes_match:
            # Find the matching closing brace
            brace_count = 0
            oidx = outcomes_match.start()
            for j in range(outcomes_match.start(), len(block)):
                if block[j] == '{':
                    brace_count += 1
                elif block[j] == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        outcomes_text = block[oidx:j + 1]
                        break

        results.append({
            'name': name,
            'start': start,
            'end': end,
            'block': block,
            'has_kpis': has_kpis,
            'outcomes_text': outcomes_text,
        })

    return results


def insert_kpis(content, council, kpis_lines):
    """Insert performance_kpis block before last_verified in the council's block."""
    block = council['block']

    # Find where to insert — before last_verified
    insert_match = re.search(r'\n(\s+)last_verified:', block)
    if not insert_match:
        # Try before the closing brace of the council
        insert_match = re.search(r'\n(\s+)\},?\s*$', block)
        if not insert_match:
            return content, False

    insert_pos_in_block = insert_match.start()
    indent = insert_match.group(1)

    kpis_block = f"\n{indent}performance_kpis: [\n"
    kpis_block += ",\n".join(kpis_lines)
    kpis_block += f",\n{indent}],"

    new_block = block[:insert_pos_in_block] + kpis_block + block[insert_pos_in_block:]

    # Replace in full content
    new_content = content[:council['start']] + new_block + content[council['end']:]
    return new_content, True


def process_file(filepath):
    """Process a single TS file."""
    with open(filepath, 'r') as f:
        content = f.read()

    councils = extract_council_blocks(content)
    added = 0
    skipped_has_kpis = 0
    skipped_no_data = 0

    # Process in reverse order so insertions don't shift positions
    for council in reversed(councils):
        if council['has_kpis']:
            skipped_has_kpis += 1
            continue

        if not council['outcomes_text']:
            skipped_no_data += 1
            print(f"  SKIP (no service_outcomes): {council['name']}")
            continue

        kpis = derive_kpis_from_outcomes(council['outcomes_text'])
        if not kpis:
            skipped_no_data += 1
            print(f"  SKIP (no derivable KPIs): {council['name']}")
            continue

        content, success = insert_kpis(content, council, kpis)
        if success:
            added += 1
            print(f"  + {council['name']} ({len(kpis)} KPIs)")
        else:
            print(f"  FAIL (insert point not found): {council['name']}")

    with open(filepath, 'w') as f:
        f.write(content)

    return added, skipped_has_kpis, skipped_no_data


def main():
    total_added = 0
    total_skipped_has = 0
    total_skipped_no = 0

    for filename in FILES:
        filepath = os.path.join(DATA_DIR, filename)
        if not os.path.exists(filepath):
            print(f"File not found: {filepath}")
            continue

        print(f"\n{'='*60}")
        print(f"Processing: {filename}")
        print(f"{'='*60}")

        added, skipped_has, skipped_no = process_file(filepath)
        total_added += added
        total_skipped_has += skipped_has
        total_skipped_no += skipped_no

        print(f"\n  Summary: +{added} added, {skipped_has} already had KPIs, {skipped_no} no data")

    print(f"\n{'='*60}")
    print(f"TOTAL: +{total_added} councils gained performance_kpis")
    print(f"       {total_skipped_has} already had KPIs")
    print(f"       {total_skipped_no} had no derivable data")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
