#!/usr/bin/env python3
"""
Batch 4: Add waste_destinations and performance_kpis to councils.

waste_destinations: Parsed from DEFRA Table 2 (Local Authority Collected Waste 2022-23)
performance_kpis: Derived from existing service_outcomes data in the TS files

Data source: src/data/councils/pdfs/gov-uk-bulk-data/defra-waste-2022-23.ods
             (DEFRA, Crown Copyright, OGL v3.0)

Modifies: src/data/councils/{county-councils,districts,metropolitan,unitary,london-boroughs}.ts
"""

import re
import subprocess
import sys
from collections import defaultdict

from odf.opendocument import load
from odf.table import Table, TableRow, TableCell
from odf.text import P

TS_FILES = [
    "src/data/councils/county-councils.ts",
    "src/data/councils/districts.ts",
    "src/data/councils/metropolitan.ts",
    "src/data/councils/unitary.ts",
    "src/data/councils/london-boroughs.ts",
]

DEFRA_FILE = "src/data/councils/pdfs/gov-uk-bulk-data/defra-waste-2022-23.ods"


def escape_ts(s):
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ")


# ── Parse DEFRA waste data ───────────────────────────────────────────────────

def get_cell_text(cell):
    ps = cell.getElementsByType(P)
    return " ".join(p.firstChild.data if p.firstChild else "" for p in ps).strip() if ps else ""


def parse_number(s):
    """Parse a number from DEFRA format (with commas)."""
    if not s or s == "-" or s == "..":
        return 0
    try:
        return int(s.replace(",", "").replace(" ", ""))
    except ValueError:
        try:
            return int(float(s.replace(",", "").replace(" ", "")))
        except ValueError:
            return 0


def load_defra_waste():
    """Parse DEFRA Table 2 for 2022-23 waste destination data."""
    print("  Loading DEFRA waste data...")
    doc = load(DEFRA_FILE)
    sheets = doc.spreadsheet.getElementsByType(Table)
    table2 = sheets[6]  # Table_2
    rows = table2.getElementsByType(TableRow)

    waste_data = {}

    for row in rows[4:]:  # Skip header rows (0-3)
        cells = row.getElementsByType(TableCell)
        vals = []
        for cell in cells:
            repeat = cell.getAttribute("numbercolumnsrepeated")
            text = get_cell_text(cell)
            count = int(repeat) if repeat else 1
            if count > 100:
                break
            for _ in range(count):
                vals.append(text)

        if len(vals) < 13:
            continue

        year = vals[0]
        if year != "2022-23":
            continue

        authority = vals[5].strip()
        # Strip "Council" suffix for matching
        clean_name = authority.replace(" City Council", "").replace(" County Council", "")
        clean_name = clean_name.replace(" Borough Council", "").replace(" District Council", "")
        clean_name = clean_name.replace(" Council", "").replace("Royal Borough of ", "")
        clean_name = clean_name.replace("London Borough of ", "").replace("City of ", "")
        clean_name = clean_name.strip()

        landfill = parse_number(vals[7])
        efw = parse_number(vals[8])
        incineration_no_efw = parse_number(vals[9])
        recycled_composted = parse_number(vals[10])
        other = parse_number(vals[11])
        total = parse_number(vals[12])

        if total <= 0:
            continue

        destinations = []
        if recycled_composted > 0:
            pct = round(recycled_composted / total * 100)
            destinations.append(("Recycled & composted", recycled_composted, pct))
        if efw > 0:
            pct = round(efw / total * 100)
            destinations.append(("Energy recovery", efw, pct))
        if landfill > 0:
            pct = round(landfill / total * 100)
            destinations.append(("Landfill", landfill, pct))
        if incineration_no_efw > 0:
            pct = round(incineration_no_efw / total * 100)
            destinations.append(("Incineration (without EfW)", incineration_no_efw, pct))
        if other > 0:
            pct = round(other / total * 100)
            destinations.append(("Other", other, pct))

        # Sort by tonnage descending
        destinations.sort(key=lambda x: x[1], reverse=True)

        # Store under multiple name variants for matching
        waste_data[clean_name] = destinations
        waste_data[authority] = destinations

    print(f"  Loaded waste data for {len(waste_data) // 2} authorities")
    return waste_data


# ── Name matching ────────────────────────────────────────────────────────────

def normalize_for_match(name):
    n = name.lower().strip()
    for prefix in ["london borough of ", "royal borough of ", "city of ", "the "]:
        if n.startswith(prefix):
            n = n[len(prefix):]
    for suffix in [" city council", " county council", " borough council",
                   " district council", " metropolitan district council",
                   " council"]:
        if n.endswith(suffix):
            n = n[:-len(suffix)]
    n = n.replace("-", " ").replace("'", "").replace(",", "")
    n = re.sub(r"\s+", " ", n).strip()
    return n


def find_waste_data(council_name, waste_data):
    """Find waste data for a council name."""
    # Direct match
    if council_name in waste_data:
        return waste_data[council_name]

    # Normalized match
    norm = normalize_for_match(council_name)
    for key, data in waste_data.items():
        if normalize_for_match(key) == norm:
            return data

    # Partial match
    for key, data in waste_data.items():
        key_norm = normalize_for_match(key)
        if len(norm) > 4 and (norm in key_norm or key_norm in norm):
            return data

    return None


# ── Extract service_outcomes for KPIs ────────────────────────────────────────

def extract_service_outcomes(section):
    """Extract service_outcomes data from a council section for KPI derivation."""
    outcomes = {}

    # Recycling rate
    match = re.search(r'recycling_rate:\s*"?([0-9.]+)%?"?', section)
    if match:
        outcomes["recycling_rate"] = float(match.group(1))

    # Road condition
    match = re.search(r'roads_in_good_condition:\s*"?([0-9.]+)%?"?', section)
    if match:
        outcomes["roads_good"] = float(match.group(1))

    # Population
    match = re.search(r'population:\s*(\d[\d,]*)', section)
    if match:
        outcomes["population"] = int(match.group(1).replace(",", ""))

    # Ofsted
    match = re.search(r'ofsted_rating:\s*"([^"]+)"', section)
    if match:
        outcomes["ofsted"] = match.group(1)

    return outcomes


def generate_kpis(outcomes):
    """Generate performance_kpis from service_outcomes data."""
    kpis = []

    if "recycling_rate" in outcomes:
        rate = outcomes["recycling_rate"]
        target = 50.0
        if rate >= target:
            status = "green"
        elif rate >= 40.0:
            status = "amber"
        else:
            status = "red"
        kpis.append({
            "metric": "Household waste recycled",
            "value": f"{rate}%",
            "target": f"{target}%",
            "status": status,
            "period": "2022-23",
        })

    if "roads_good" in outcomes:
        rate = outcomes["roads_good"]
        target = 75.0
        if rate >= target:
            status = "green"
        elif rate >= 60.0:
            status = "amber"
        else:
            status = "red"
        kpis.append({
            "metric": "Roads in good condition",
            "value": f"{rate}%",
            "target": f"{target}%",
            "status": status,
            "period": "2022-23",
        })

    if "ofsted" in outcomes:
        rating = outcomes["ofsted"]
        if "Outstanding" in rating:
            status = "green"
        elif "Good" in rating:
            status = "green"
        elif "Requires" in rating or "Inadequate" in rating:
            status = "red"
        else:
            status = "amber"
        kpis.append({
            "metric": "Ofsted overall rating",
            "value": rating,
            "status": status,
            "period": "2023-24",
        })

    return kpis


# ── Generate TypeScript blocks ───────────────────────────────────────────────

def generate_waste_block(destinations):
    lines = ["      waste_destinations: ["]
    for dest_type, tonnage, pct in destinations:
        lines.append(f'        {{ type: "{escape_ts(dest_type)}", tonnage: {tonnage}, percentage: {pct} }},')
    lines.append("      ],")
    return "\n".join(lines)


def generate_kpis_block(kpis):
    lines = ["      performance_kpis: ["]
    for kpi in kpis:
        parts = [
            f'metric: "{escape_ts(kpi["metric"])}"',
            f'value: "{escape_ts(kpi["value"])}"',
        ]
        if "target" in kpi:
            parts.append(f'target: "{escape_ts(kpi["target"])}"')
        parts.append(f'status: "{kpi["status"]}"')
        parts.append(f'period: "{kpi["period"]}"')
        lines.append(f'        {{ {", ".join(parts)} }},')
    lines.append("      ],")
    return "\n".join(lines)


# ── Enrich files ─────────────────────────────────────────────────────────────

def enrich_file(ts_file, waste_data):
    with open(ts_file, "r") as f:
        content = f.read()

    council_pattern = re.compile(r'^\s+name:\s+"([^"]+)",', re.MULTILINE)
    matches = list(council_pattern.finditer(content))

    waste_added = 0
    kpi_added = 0

    for i in range(len(matches) - 1, -1, -1):
        match = matches[i]
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        section = content[start:end]
        name = match.group(1)

        blocks = []

        # Waste destinations
        if "waste_destinations:" not in section:
            destinations = find_waste_data(name, waste_data)
            if destinations:
                blocks.append(generate_waste_block(destinations))
                waste_added += 1

        # Performance KPIs
        if "performance_kpis:" not in section:
            outcomes = extract_service_outcomes(section)
            kpis = generate_kpis(outcomes)
            if kpis:
                blocks.append(generate_kpis_block(kpis))
                kpi_added += 1

        if not blocks:
            continue

        # Insert before sources: or last_verified:
        insert_match = re.search(r'^(\s+)sources:', section, re.MULTILINE)
        if not insert_match:
            insert_match = re.search(r'^(\s+)last_verified:', section, re.MULTILINE)
        if not insert_match:
            continue

        insert_pos = start + insert_match.start()
        block_text = "\n".join(blocks) + "\n\n"
        content = content[:insert_pos] + block_text + content[insert_pos:]

    if waste_added > 0 or kpi_added > 0:
        with open(ts_file, "w") as f:
            f.write(content)

    return waste_added, kpi_added


def main():
    print("=== Batch 4: Waste Destinations + Performance KPIs ===\n")

    waste_data = load_defra_waste()

    total_waste = 0
    total_kpi = 0

    for ts_file in TS_FILES:
        print(f"Processing {ts_file}...")
        waste, kpi = enrich_file(ts_file, waste_data)
        print(f"  Waste destinations: {waste}, Performance KPIs: {kpi}")
        total_waste += waste
        total_kpi += kpi

    print(f"\n=== Summary ===")
    print(f"waste_destinations added: {total_waste}")
    print(f"performance_kpis added: {total_kpi}")

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
