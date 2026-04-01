#!/usr/bin/env python3
"""
Fill remaining waste_destinations gaps using:
1. ONS code matching for unitaries with &/and mismatches (7 councils)
2. Joint waste authority data for metropolitan boroughs (13 councils)
3. Joint waste authority data for London boroughs (21 councils)

All data from DEFRA Table 2 (2022-23) — official GOV.UK source.

Joint waste authorities serve multiple councils collectively.
Tonnage figures represent the whole authority's total, consistent
with how county-level data is shown (e.g. Kent shows Kent CC's total).
"""

import re
import subprocess
import sys
from odf.opendocument import load
from odf.table import Table, TableRow, TableCell
from odf.text import P

TS_FILES = {
    "unitary": "src/data/councils/unitary.ts",
    "metro": "src/data/councils/metropolitan.ts",
    "london": "src/data/councils/london-boroughs.ts",
}

DEFRA_FILE = "src/data/councils/pdfs/gov-uk-bulk-data/defra-waste-2022-23.ods"

# Joint waste authority → member councils
JOINT_WASTE_MEMBERS = {
    "E50000005": [  # Greater Manchester WDA
        "Bolton", "Bury", "Oldham", "Rochdale", "Salford",
        "Stockport", "Tameside", "Trafford",
        # Manchester already has waste data
    ],
    "E50000006": [  # Merseyside WDA
        "Knowsley", "Liverpool", "Sefton", "St Helens", "Wirral",
    ],
    "E50000001": [  # East London Waste Authority
        "Barking & Dagenham", "Havering", "Newham", "Redbridge",
    ],
    "E50000002": [  # North London Waste Authority
        "Barnet", "Camden", "Enfield", "Hackney", "Haringey",
        "Islington", "Waltham Forest",
    ],
    "E50000003": [  # West London Waste Authority
        "Brent", "Ealing", "Harrow", "Hillingdon",
        "Hounslow", "Richmond upon Thames",
    ],
    "E50000004": [  # Western Riverside Waste Authority
        "Hammersmith & Fulham", "Kensington & Chelsea",
        "Lambeth", "Wandsworth",
    ],
}

# Unitary ONS code → our name (for & vs and mismatches)
UNITARY_ONS_MAP = {
    "E06000022": "Bath & North East Somerset",
    "E06000058": "Bournemouth, Christchurch & Poole",
    "E06000043": "Brighton & Hove",
    "E06000050": "Cheshire West & Chester",
    "E06000003": "Redcar & Cleveland",
    "E06000020": "Telford & Wrekin",
    "E06000040": "Windsor & Maidenhead",
}


def get_cell_text(cell):
    ps = cell.getElementsByType(P)
    return " ".join(p.firstChild.data if p.firstChild else "" for p in ps).strip() if ps else ""


def parse_number(s):
    if not s or s == "-" or s == "..":
        return 0
    try:
        return int(s.replace(",", "").replace(" ", ""))
    except ValueError:
        try:
            return int(float(s.replace(",", "").replace(" ", "")))
        except ValueError:
            return 0


def load_defra_by_ons():
    """Load DEFRA waste data indexed by ONS code."""
    doc = load(DEFRA_FILE)
    sheets = doc.spreadsheet.getElementsByType(Table)
    table2 = sheets[6]
    rows = table2.getElementsByType(TableRow)

    waste_by_ons = {}
    for row in rows[4:]:
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
        if len(vals) < 13 or vals[0] != "2022-23":
            continue

        ons = vals[3].strip()
        auth = vals[5].strip()
        landfill = parse_number(vals[7])
        efw = parse_number(vals[8])
        incineration = parse_number(vals[9])
        recycled = parse_number(vals[10])
        other = parse_number(vals[11])
        total = parse_number(vals[12])

        if total <= 0:
            continue

        destinations = []
        if recycled > 0:
            pct = round(recycled / total * 100)
            destinations.append(("Recycled & composted", recycled, pct))
        if efw > 0:
            pct = round(efw / total * 100)
            destinations.append(("Energy recovery", efw, pct))
        if landfill > 0:
            pct = round(landfill / total * 100)
            destinations.append(("Landfill", landfill, pct))
        if incineration > 0:
            pct = round(incineration / total * 100)
            destinations.append(("Incineration (without EfW)", incineration, pct))
        if other > 0:
            pct = round(other / total * 100)
            destinations.append(("Other", other, pct))

        destinations.sort(key=lambda x: x[1], reverse=True)
        waste_by_ons[ons] = {"auth": auth, "destinations": destinations}

    return waste_by_ons


def generate_waste_block(destinations):
    """Generate TypeScript waste_destinations block."""
    lines = ["      waste_destinations: ["]
    for dtype, tonnage, pct in destinations:
        lines.append(f'        {{ type: "{dtype}", tonnage: {tonnage}, percentage: {pct} }},')
    lines.append("      ],")
    return "\n".join(lines)


def insert_waste(content, council_name, waste_block):
    """Insert waste_destinations before last_verified or performance_kpis."""
    council_match = re.search(
        r'\n  \{\n    ons_code: "[^"]+",\n    name: "' + re.escape(council_name) + '"',
        content
    )
    if not council_match:
        return content, False

    start = council_match.start()
    next_match = re.search(r'\n  \{\n    ons_code:', content[start + 10:])
    end = start + 10 + next_match.start() if next_match else len(content)
    section = content[start:end]

    if "waste_destinations:" in section:
        return content, False

    # Insert before performance_kpis or last_verified
    insert_match = re.search(r'^(\s+)performance_kpis:', section, re.MULTILINE)
    if not insert_match:
        insert_match = re.search(r'^(\s+)last_verified:', section, re.MULTILINE)
    if not insert_match:
        insert_match = re.search(r'^(\s+)sources:', section, re.MULTILINE)
    if not insert_match:
        return content, False

    insert_pos = start + insert_match.start()
    content = content[:insert_pos] + waste_block + "\n" + content[insert_pos:]
    return content, True


def main():
    print("=== Fill remaining waste_destinations gaps ===\n")

    waste_by_ons = load_defra_by_ons()
    print(f"Loaded DEFRA data for {len(waste_by_ons)} authorities")

    total_added = 0

    # 1. Fix unitaries (ONS code matching)
    print("\n--- Unitaries (ONS code matching) ---")
    with open(TS_FILES["unitary"]) as f:
        content = f.read()

    for ons, our_name in UNITARY_ONS_MAP.items():
        if ons not in waste_by_ons:
            print(f"  SKIP: {our_name} — ONS {ons} not in DEFRA")
            continue

        waste = waste_by_ons[ons]
        block = generate_waste_block(waste["destinations"])
        content, success = insert_waste(content, our_name, block)
        if success:
            total_added += 1
            print(f"  + {our_name} ← {waste['auth']}")
        else:
            print(f"  SKIP: {our_name} — already has waste data or not found")

    with open(TS_FILES["unitary"], "w") as f:
        f.write(content)

    # 2. Fix metros (joint waste authority)
    print("\n--- Metropolitan boroughs (joint waste authorities) ---")
    with open(TS_FILES["metro"]) as f:
        content = f.read()

    for jwa_ons, members in JOINT_WASTE_MEMBERS.items():
        if jwa_ons not in waste_by_ons:
            continue
        if not jwa_ons.startswith("E50000005") and not jwa_ons.startswith("E50000006"):
            continue  # Only GM and Merseyside for metros

        waste = waste_by_ons[jwa_ons]
        block = generate_waste_block(waste["destinations"])

        for council_name in members:
            content, success = insert_waste(content, council_name, block)
            if success:
                total_added += 1
                print(f"  + {council_name} ← {waste['auth']}")

    with open(TS_FILES["metro"], "w") as f:
        f.write(content)

    # 3. Fix London boroughs (joint waste authority)
    print("\n--- London boroughs (joint waste authorities) ---")
    with open(TS_FILES["london"]) as f:
        content = f.read()

    for jwa_ons, members in JOINT_WASTE_MEMBERS.items():
        if jwa_ons not in waste_by_ons:
            continue
        if not jwa_ons.startswith("E50000001") and not jwa_ons.startswith("E50000002") and \
           not jwa_ons.startswith("E50000003") and not jwa_ons.startswith("E50000004"):
            continue

        waste = waste_by_ons[jwa_ons]
        block = generate_waste_block(waste["destinations"])

        for council_name in members:
            content, success = insert_waste(content, council_name, block)
            if success:
                total_added += 1
                print(f"  + {council_name} ← {waste['auth']}")

    with open(TS_FILES["london"], "w") as f:
        f.write(content)

    print(f"\n=== Total added: {total_added} ===")

    # TypeScript check
    print("\nRunning TypeScript check...")
    result = subprocess.run(["npx", "tsc", "--noEmit"], capture_output=True, text=True, timeout=120)
    if result.returncode == 0:
        print("TypeScript compilation: OK")
    else:
        print("TypeScript compilation: FAILED")
        print((result.stdout + result.stderr)[:2000])
        sys.exit(1)


if __name__ == "__main__":
    main()
