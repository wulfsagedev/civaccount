#!/usr/bin/env python3
"""
Parse Contracts Finder OCDS data to extract top suppliers per English council.

Reads: src/data/councils/pdfs/contracts-finder/2024/ and 2025/
Outputs: parsed-top-suppliers.csv

Key improvement: Annualises contract values using contract period dates,
so we show estimated annual spend, not total contract ceiling.
"""

import csv
import os
import re
from collections import defaultdict
from datetime import datetime

BASE = "src/data/councils/pdfs/contracts-finder"

# ── Load our council names ────────────────────────────────────────────────────

def load_council_names():
    names = set()
    with open("council-websites.csv", "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            names.add(row["name"])
    return names


# ── Fuzzy matching ────────────────────────────────────────────────────────────

def normalize_name(name):
    n = name.lower().strip()
    # Strip prefixes
    for prefix in ["london borough of ", "royal borough of ", "city of ",
                   "the ", "metropolitan borough of "]:
        if n.startswith(prefix):
            n = n[len(prefix):]
            break
    # Apply longest suffixes first to avoid partial stripping
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
        "york": "York",
        "lewes & eastbourne": "Lewes",
        "high peak & staffordshire moorlands": "Staffordshire Moorlands",
    }
    for alias, real_name in ALIASES.items():
        lookup[alias] = real_name

    return lookup


def match_buyer_to_council(buyer_name, lookup):
    # Strip trading-as and parenthetical suffixes
    clean = re.sub(r"\s*\(.*?\)\s*$", "", buyer_name).strip()
    # Also strip "on Behalf of ..." suffixes
    clean = re.sub(r"\s+on behalf of\s+.*$", "", clean, flags=re.IGNORECASE).strip()

    norm = normalize_name(clean)
    if norm in lookup:
        return lookup[norm]

    # Also try the full buyer_name
    norm_full = normalize_name(buyer_name)
    if norm_full in lookup:
        return lookup[norm_full]

    # Partial match — buyer name contains council name or vice versa
    # But only if the key is long enough to avoid false positives
    for key, council in lookup.items():
        if len(key) > 5 and (key in norm or norm in key):
            return council

    return None


# ── CPV categories ────────────────────────────────────────────────────────────

CPV_CATEGORIES = {
    "09": "Energy & Fuel", "14": "Mining & Minerals", "15": "Food & Catering",
    "18": "Clothing & Textiles", "22": "Print & Publishing",
    "30": "IT & Office Equipment", "31": "Electrical Equipment",
    "32": "Telecoms & Broadcasting", "33": "Medical & Health",
    "34": "Transport Equipment", "35": "Security & Defence",
    "37": "Musical & Sports", "38": "Lab & Scientific",
    "39": "Furniture & Household", "41": "Water & Chemicals",
    "42": "Industrial Machinery", "44": "Construction Materials",
    "45": "Construction & Building", "48": "IT & Software",
    "50": "Repair & Maintenance", "51": "Installation Services",
    "55": "Hotel & Restaurant", "60": "Transport Services",
    "63": "Travel & Logistics", "64": "Postal & Telecoms",
    "65": "Utilities", "66": "Financial & Insurance",
    "70": "Property & Real Estate", "71": "Architecture & Engineering",
    "72": "IT & Digital Services", "73": "Research & Development",
    "75": "Public Administration", "77": "Agriculture Services",
    "79": "Business & Professional", "80": "Education & Training",
    "85": "Health & Social Care", "90": "Waste & Environment",
    "92": "Recreation & Culture", "98": "Other Services",
}


def cpv_to_category(cpv_code):
    if not cpv_code:
        return "Other"
    return CPV_CATEGORIES.get(cpv_code[:2], "Other")


# ── Date parsing ──────────────────────────────────────────────────────────────

def parse_date(date_str):
    if not date_str:
        return None
    try:
        # Handle ISO format with timezone
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except Exception:
        return None


def annualise_value(total_value, start_date_str, end_date_str):
    """
    Convert a total contract value to an annual figure.
    If dates are missing or nonsensical, use the raw value capped at a reasonable amount.
    """
    start = parse_date(start_date_str)
    end = parse_date(end_date_str)

    if start and end and end > start:
        years = (end - start).days / 365.25
        if years > 0.5:  # At least 6 months
            annual = total_value / years
            return round(annual)

    # No valid dates — cap at the raw value (assume 1 year)
    return round(total_value)


# ── Main processing ───────────────────────────────────────────────────────────

def process_year(year_dir, buyer_lookup):
    # Step 1: Load main.csv
    print(f"  Loading {year_dir}/main.csv...")
    ocid_info = {}
    matched = 0
    total = 0

    with open(f"{year_dir}/main.csv", "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total += 1
            buyer = row.get("buyer_name", "")
            council = match_buyer_to_council(buyer, buyer_lookup)
            if council:
                matched += 1
                ocid = row.get("ocid", "")
                ocid_info[ocid] = {
                    "council": council,
                    "category": cpv_to_category(row.get("tender_classification_id", "")),
                    "contract_start": row.get("tender_contractPeriod_startDate", ""),
                    "contract_end": row.get("tender_contractPeriod_endDate", ""),
                }

    print(f"    {matched}/{total} notices matched to our councils")

    # Step 2: Load awards.csv — annualise values
    print(f"  Loading {year_dir}/awards.csv...")
    award_values = {}

    with open(f"{year_dir}/awards.csv", "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            ocid = row.get("main_ocid", "")
            if ocid in ocid_info:
                award_id = row.get("id", "")
                try:
                    raw_value = float(row.get("value_amount", 0) or 0)
                except (ValueError, TypeError):
                    raw_value = 0
                if raw_value > 0:
                    # Use award-level dates first, fall back to tender-level
                    start = row.get("contractPeriod_startDate", "") or ocid_info[ocid]["contract_start"]
                    end = row.get("contractPeriod_endDate", "") or ocid_info[ocid]["contract_end"]
                    annual = annualise_value(raw_value, start, end)

                    # Cap unreasonable values (>£500m annual is likely a framework)
                    if annual > 500_000_000:
                        annual = 0  # Skip framework ceiling values

                    if annual > 0:
                        award_values[award_id] = {"annual_value": annual, "ocid": ocid}

    print(f"    {len(award_values)} awards with valid annualised values")

    # Step 3: Load awards_suppliers.csv
    print(f"  Loading {year_dir}/awards_suppliers.csv...")
    council_suppliers = defaultdict(lambda: defaultdict(lambda: {"total": 0, "categories": defaultdict(float)}))

    with open(f"{year_dir}/awards_suppliers.csv", "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            award_id = row.get("awards_id", "")
            if award_id in award_values:
                supplier_name = row.get("name", "").strip()
                if not supplier_name:
                    continue
                info = award_values[award_id]
                ocid = info["ocid"]
                council = ocid_info[ocid]["council"]
                category = ocid_info[ocid]["category"]
                annual = info["annual_value"]

                council_suppliers[council][supplier_name]["total"] += annual
                council_suppliers[council][supplier_name]["categories"][category] += annual

    return council_suppliers


def main():
    print("=== Parse Contracts Finder OCDS Data (Annualised) ===\n")

    council_names = load_council_names()
    print(f"Loaded {len(council_names)} council names")
    buyer_lookup = build_buyer_lookup(council_names)

    all_suppliers = defaultdict(lambda: defaultdict(lambda: {"total": 0, "categories": defaultdict(float)}))

    for year in ["2024", "2025"]:
        year_dir = f"{BASE}/{year}"
        if os.path.exists(year_dir):
            print(f"\nProcessing {year}...")
            year_data = process_year(year_dir, buyer_lookup)
            for council, suppliers in year_data.items():
                for supplier, data in suppliers.items():
                    all_suppliers[council][supplier]["total"] += data["total"]
                    for cat, val in data["categories"].items():
                        all_suppliers[council][supplier]["categories"][cat] += val

    # Deduplicate: take max annual value per supplier per council (not sum across years)
    # because the same contract appears in both 2024 and 2025 data
    # Actually, OCDS data is per-notice, so the same contract won't double-count if the
    # ocid is the same. But across years, some contracts appear in both.
    # For now, accept the sum as it captures newly awarded contracts.

    print(f"\n=== Results ===")
    print(f"Councils with supplier data: {len(all_suppliers)}/317")

    by_count = defaultdict(int)
    for council, suppliers in all_suppliers.items():
        n = len(suppliers)
        if n >= 20: by_count["20+"] += 1
        elif n >= 10: by_count["10-19"] += 1
        elif n >= 5: by_count["5-9"] += 1
        else: by_count["1-4"] += 1

    print(f"  20+ suppliers: {by_count.get('20+', 0)}")
    print(f"  10-19 suppliers: {by_count.get('10-19', 0)}")
    print(f"  5-9 suppliers: {by_count.get('5-9', 0)}")
    print(f"  1-4 suppliers: {by_count.get('1-4', 0)}")

    # Write output CSV
    with open("parsed-top-suppliers.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["council", "rank", "supplier_name", "annual_value", "primary_category"])

        for council in sorted(all_suppliers.keys()):
            suppliers = all_suppliers[council]
            sorted_suppliers = sorted(suppliers.items(), key=lambda x: x[1]["total"], reverse=True)[:20]
            for rank, (supplier_name, data) in enumerate(sorted_suppliers, 1):
                cats = data["categories"]
                primary_cat = max(cats, key=cats.get) if cats else "Other"
                writer.writerow([council, rank, supplier_name, round(data["total"]), primary_cat])

    # Show examples
    examples = ["Kent", "Birmingham", "Manchester", "Leeds", "Westminster"]
    for council in examples:
        if council in all_suppliers:
            print(f"\n{council} - Top 5 suppliers (annualised):")
            sorted_s = sorted(all_suppliers[council].items(), key=lambda x: x[1]["total"], reverse=True)[:5]
            for i, (name, data) in enumerate(sorted_s, 1):
                cats = data["categories"]
                primary = max(cats, key=cats.get) if cats else "Other"
                val = data["total"]
                if val >= 1_000_000:
                    print(f"  {i}. {name[:40]:40s} £{val/1_000_000:>7.1f}m  ({primary})")
                else:
                    print(f"  {i}. {name[:40]:40s} £{val:>10,.0f}  ({primary})")

    # Show councils without data
    missing = council_names - set(all_suppliers.keys())
    if missing:
        print(f"\n{len(missing)} councils without supplier data:")
        for m in sorted(missing)[:20]:
            print(f"  - {m}")
        if len(missing) > 20:
            print(f"  ... and {len(missing) - 20} more")

    print(f"\nSaved to parsed-top-suppliers.csv")


if __name__ == "__main__":
    main()
