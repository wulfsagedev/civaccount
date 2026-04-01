#!/usr/bin/env python3
"""
Batch 1: Add descriptions to existing top_suppliers and grant_payments entries.

For top_suppliers: Uses tender_title from Contracts Finder OCDS data.
Join path: awards_suppliers.csv (supplier name) → main_ocid → main.csv → tender_title

For grant_payments: Re-parses source grant data for richer descriptions.

Modifies: src/data/councils/{county-councils,districts,metropolitan,unitary,london-boroughs}.ts
"""

import csv
import os
import re
import subprocess
import sys
from collections import defaultdict

BASE = "src/data/councils/pdfs/contracts-finder"
TS_FILES = [
    "src/data/councils/county-councils.ts",
    "src/data/councils/districts.ts",
    "src/data/councils/metropolitan.ts",
    "src/data/councils/unitary.ts",
    "src/data/councils/london-boroughs.ts",
]


# ── Council name matching (reused from parse-contracts-finder.py) ────────────

def load_council_names():
    names = set()
    with open("council-websites.csv", "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            names.add(row["name"])
    return names


def normalize_name(name):
    n = name.lower().strip()
    for prefix in ["london borough of ", "royal borough of ", "city of ",
                   "the ", "metropolitan borough of "]:
        if n.startswith(prefix):
            n = n[len(prefix):]
            break
    for suffix in [" metropolitan borough council", " metropolitan borough councils",
                   " royal borough of", " london borough of", " london borough",
                   " borough council", " borough councils",
                   " county council", " county councils",
                   " city council", " city councils",
                   " district council", " district councils",
                   " councils", " council"]:
        if n.endswith(suffix):
            n = n[:-len(suffix)]
            break
    n = n.replace(".", "").replace(",", "").replace("'", "").replace("\u2019", "")
    n = n.replace(" and ", " & ").replace("-", " ")
    n = re.sub(r"\s+", " ", n).strip()
    return n


def build_buyer_lookup(council_names):
    lookup = {}
    for name in council_names:
        norm = normalize_name(name)
        lookup[norm] = name

    ALIASES = {
        "city of london": "City of London",
        "city of london corporation": "City of London",
        "corporation of london": "City of London",
        "bristol city": "Bristol",
        "bristol": "Bristol",
        "herefordshire": "Herefordshire",
        "kingston upon hull": "Kingston upon Hull",
        "hull city": "Kingston upon Hull",
        "hull": "Kingston upon Hull",
        "kingston upon thames": "Kingston upon Thames",
        "royal borough of kingston upon thames": "Kingston upon Thames",
        "county durham": "Durham",
        "durham": "Durham",
        "durham county": "Durham",
        "st helens": "St Helens",
        "saint helens": "St Helens",
        "adur & worthing": "Adur",
        "adur": "Adur",
        "kent": "Kent",
        "derbyshire": "Derbyshire",
        "east devon": "East Devon",
        "lewes district": "Lewes",
        "lewes": "Lewes",
        "high peak & staffordshire moorlands": "Staffordshire Moorlands",
        "york": "York",
        "elmbridge": "Elmbridge",
        "brent": "Brent",
        "broxbourne": "Broxbourne",
        "east hertfordshire": "East Hertfordshire",
        "east lindsey": "East Lindsey",
        "harborough": "Harborough",
        "hinckley & bosworth": "Hinckley & Bosworth",
        "king's lynn & west norfolk": "King's Lynn & West Norfolk",
        "kings lynn & west norfolk": "King's Lynn & West Norfolk",
        "ribble valley": "Ribble Valley",
        "south holland": "South Holland",
        "staffordshire moorlands": "Staffordshire Moorlands",
        "vale of white horse": "Vale of White Horse",
        "west devon": "West Devon",
        "amber valley": "Amber Valley",
        "lewes & eastbourne": "Lewes",
    }
    for alias, real_name in ALIASES.items():
        lookup[alias] = real_name

    return lookup


def match_buyer_to_council(buyer_name, lookup):
    clean = re.sub(r"\s*\(.*?\)\s*$", "", buyer_name).strip()
    clean = re.sub(r"\s+on behalf of\s+.*$", "", clean, flags=re.IGNORECASE).strip()
    norm = normalize_name(clean)
    if norm in lookup:
        return lookup[norm]
    norm_full = normalize_name(buyer_name)
    if norm_full in lookup:
        return lookup[norm_full]
    for key, council in lookup.items():
        if len(key) > 5 and (key in norm or norm in key):
            return council
    return None


# ── Build supplier → description mapping from OCDS ──────────────────────────

def build_supplier_descriptions():
    """
    Parse OCDS data to build: {council: {supplier_name: description}}
    Uses the highest-value contract's tender_title as the description.
    """
    council_names = load_council_names()
    buyer_lookup = build_buyer_lookup(council_names)

    # {council: {supplier_name: [(value, title), ...]}}
    supplier_contracts = defaultdict(lambda: defaultdict(list))

    for year in ["2024", "2025"]:
        year_dir = f"{BASE}/{year}"
        if not os.path.exists(year_dir):
            continue

        print(f"  Loading {year} OCDS data...")

        # Step 1: main.csv → ocid_info
        ocid_info = {}
        with open(f"{year_dir}/main.csv", "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                buyer = row.get("buyer_name", "")
                council = match_buyer_to_council(buyer, buyer_lookup)
                if council:
                    ocid = row.get("ocid", "")
                    title = (row.get("tender_title", "") or "").strip()
                    if title:
                        ocid_info[ocid] = {
                            "council": council,
                            "title": title,
                        }

        print(f"    {len(ocid_info)} notices with titles matched to councils")

        # Step 2: awards.csv → award_id to ocid + value
        award_to_ocid = {}
        with open(f"{year_dir}/awards.csv", "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                ocid = row.get("main_ocid", "")
                if ocid in ocid_info:
                    award_id = row.get("id", "")
                    try:
                        value = abs(float(row.get("value_amount", 0) or 0))
                    except (ValueError, TypeError):
                        value = 0
                    award_to_ocid[award_id] = {"ocid": ocid, "value": value}

        print(f"    {len(award_to_ocid)} awards linked")

        # Step 3: awards_suppliers.csv → supplier name to titles
        with open(f"{year_dir}/awards_suppliers.csv", "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                award_id = row.get("awards_id", "")
                if award_id in award_to_ocid:
                    supplier_name = (row.get("name", "") or "").strip()
                    if not supplier_name:
                        continue
                    info = award_to_ocid[award_id]
                    ocid = info["ocid"]
                    value = info["value"]
                    council = ocid_info[ocid]["council"]
                    title = ocid_info[ocid]["title"]
                    supplier_contracts[council][supplier_name].append((value, title))

    # Pick best description per supplier per council (highest-value contract's title)
    result = {}
    for council, suppliers in supplier_contracts.items():
        result[council] = {}
        for supplier, contracts in suppliers.items():
            # Sort by value descending, pick the title from the highest-value contract
            contracts.sort(key=lambda x: x[0], reverse=True)
            best_title = contracts[0][1]
            # Clean up and truncate
            best_title = best_title.replace("\n", " ").replace("\r", " ")
            best_title = re.sub(r"\s+", " ", best_title).strip()
            if len(best_title) > 150:
                best_title = best_title[:147] + "..."
            result[council][supplier] = best_title

    return result


# ── Normalize supplier name for fuzzy matching ───────────────────────────────

def normalize_supplier(name):
    """Normalize supplier name for matching between TS files and OCDS data."""
    n = name.lower().strip()
    # Remove common suffixes
    for suffix in [" limited", " ltd", " plc", " llp", " inc", " uk",
                   " group", " services", " solutions"]:
        if n.endswith(suffix):
            n = n[:-len(suffix)]
    n = n.replace(".", "").replace(",", "").replace("'", "").replace('"', "")
    n = n.replace("&", "and").replace("-", " ")
    n = re.sub(r"\s+", " ", n).strip()
    return n


def find_best_description(supplier_name, council_descs):
    """Find the best matching description for a supplier name."""
    # Exact match first
    if supplier_name in council_descs:
        return council_descs[supplier_name]

    # Normalized match
    norm = normalize_supplier(supplier_name)
    for ocds_name, desc in council_descs.items():
        if normalize_supplier(ocds_name) == norm:
            return desc

    # Substring match (for cases like "Kier" vs "Kier Highways Ltd")
    for ocds_name, desc in council_descs.items():
        ocds_norm = normalize_supplier(ocds_name)
        if len(norm) > 4 and (norm in ocds_norm or ocds_norm in norm):
            return desc

    return None


# ── Escape TypeScript strings ────────────────────────────────────────────────

def escape_ts(s):
    """Escape a string for TypeScript literal."""
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ")


# ── Enrich top_suppliers in TS files ─────────────────────────────────────────

def enrich_top_suppliers_in_file(ts_file, supplier_descs):
    """Add description field to top_suppliers entries that don't have one."""
    with open(ts_file, "r") as f:
        content = f.read()

    # Find all top_suppliers entries without descriptions
    # Pattern: { name: "...", annual_spend: ..., category: "..." },
    # We need to add: description: "..." after category
    pattern = re.compile(
        r'(\{\s*name:\s*"([^"]+)",\s*annual_spend:\s*\d+,\s*category:\s*"[^"]+")(\s*\},)',
        re.DOTALL
    )

    enriched = 0
    skipped = 0

    # We need to find which council each entry belongs to
    # Strategy: find council name before each top_suppliers block
    council_pattern = re.compile(r'^\s+name:\s+"([^"]+)",', re.MULTILINE)
    council_matches = list(council_pattern.finditer(content))

    def find_council_for_pos(pos):
        """Find which council a position belongs to."""
        best = None
        for m in council_matches:
            if m.start() < pos:
                best = m.group(1)
            else:
                break
        return best

    # Process in reverse to preserve positions
    matches = list(pattern.finditer(content))
    for match in reversed(matches):
        supplier_name = match.group(2)
        council = find_council_for_pos(match.start())

        if not council or council not in supplier_descs:
            skipped += 1
            continue

        desc = find_best_description(supplier_name, supplier_descs[council])
        if not desc:
            skipped += 1
            continue

        escaped_desc = escape_ts(desc)
        replacement = f'{match.group(1)}, description: "{escaped_desc}"{match.group(3)}'
        content = content[:match.start()] + replacement + content[match.end():]
        enriched += 1

    if enriched > 0:
        with open(ts_file, "w") as f:
            f.write(content)

    return enriched, skipped


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=== Batch 1: Enrich Descriptions ===\n")

    # Part 1: Build supplier descriptions from OCDS
    print("Building supplier descriptions from Contracts Finder OCDS data...")
    supplier_descs = build_supplier_descriptions()
    total_descs = sum(len(v) for v in supplier_descs.values())
    print(f"  Built descriptions for {total_descs} supplier-council pairs across {len(supplier_descs)} councils\n")

    # Part 2: Enrich top_suppliers in TS files
    print("Enriching top_suppliers with descriptions...")
    total_enriched = 0
    total_skipped = 0

    for ts_file in TS_FILES:
        print(f"  Processing {ts_file}...")
        enriched, skipped = enrich_top_suppliers_in_file(ts_file, supplier_descs)
        print(f"    Enriched: {enriched}, No match: {skipped}")
        total_enriched += enriched
        total_skipped += skipped

    print(f"\n=== Summary ===")
    print(f"Top suppliers with descriptions added: {total_enriched}")
    print(f"No description available: {total_skipped}")

    # Part 3: TypeScript check
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
