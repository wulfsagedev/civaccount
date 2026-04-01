#!/usr/bin/env python3
"""
Audit every council against Kent's gold standard and output a gap analysis.

Checks each council for the presence of every field Kent has, generates:
1. Console summary with percentage scores
2. CSV with per-council gap details

Kent's fields (47 field groups):
  Core: ons_code, name, type, type_name
  Council tax: council_tax (5 years)
  Budget: budget (11 categories)
  Detailed: website, council_leader, chief_executive, total_councillors,
            cabinet, councillor_basic_allowance, total_allowances_cost,
            chief_executive_salary, staff_fte, salary_bands,
            councillor_allowances_detail,
            council_tax_url, accounts_url, transparency_url, councillors_url, budget_url,
            governance_transparency, section_transparency, documents,
            open_data_links, sources, service_outcomes, service_spending,
            top_suppliers, waste_destinations, performance_kpis,
            budget_gap, savings_target, grant_payments, last_verified
"""

import csv
import re
import sys

TS_FILES = [
    ("County Councils", "src/data/councils/county-councils.ts"),
    ("District Councils", "src/data/councils/districts.ts"),
    ("Metropolitan Districts", "src/data/councils/metropolitan.ts"),
    ("Unitary Authorities", "src/data/councils/unitary.ts"),
    ("London Boroughs", "src/data/councils/london-boroughs.ts"),
]

# Kent's field groups - what a fully enriched council should have
KENT_FIELDS = [
    # Core (always present)
    ("ons_code", "Core"),
    ("name", "Core"),
    ("type", "Core"),
    ("type_name", "Core"),
    # Council tax
    ("council_tax", "Council Tax"),
    # Budget
    ("budget", "Budget"),
    # Detailed fields
    ("website", "URLs"),
    ("council_tax_url", "URLs"),
    ("accounts_url", "URLs"),
    ("transparency_url", "URLs"),
    ("councillors_url", "URLs"),
    ("budget_url", "URLs"),
    # Leadership
    ("council_leader", "Leadership"),
    ("chief_executive", "Leadership"),
    ("total_councillors", "Leadership"),
    ("cabinet", "Leadership"),
    ("councillor_basic_allowance", "Allowances"),
    ("total_allowances_cost", "Allowances"),
    ("chief_executive_salary", "Salary"),
    ("staff_fte", "Workforce"),
    ("salary_bands", "Salary"),
    ("councillor_allowances_detail", "Allowances"),
    # Transparency
    ("governance_transparency", "Transparency"),
    ("section_transparency", "Transparency"),
    ("documents", "Transparency"),
    ("open_data_links", "Transparency"),
    ("sources", "Transparency"),
    # Service data
    ("service_outcomes", "Services"),
    ("service_spending", "Services"),
    ("top_suppliers", "Suppliers"),
    ("waste_destinations", "Environment"),
    ("performance_kpis", "Performance"),
    # Financial
    ("budget_gap", "Financial Strategy"),
    ("savings_target", "Financial Strategy"),
    ("grant_payments", "Financial"),
    # Metadata
    ("last_verified", "Metadata"),
]

# Fields that districts legitimately don't have (they don't provide these services)
DISTRICT_EXEMPT = {
    "waste_destinations",  # Districts handle collection, not disposal
    # Note: districts CAN have cabinet, allowances, salary_bands etc.
}


def audit_council(section, name, council_type):
    """Check which Kent fields a council has."""
    results = {}
    for field, category in KENT_FIELDS:
        # Check if field exists in section
        has_field = f"{field}:" in section

        # Check exemptions
        exempt = False
        if council_type == "District Councils" and field in DISTRICT_EXEMPT:
            exempt = True

        results[field] = {
            "has": has_field,
            "category": category,
            "exempt": exempt,
        }

    return results


def calculate_score(results):
    """Calculate parity percentage."""
    applicable = sum(1 for r in results.values() if not r["exempt"])
    present = sum(1 for r in results.values() if r["has"] and not r["exempt"])
    return present, applicable


def main():
    all_councils = []

    for council_type, fpath in TS_FILES:
        with open(fpath) as f:
            content = f.read()

        entries = list(re.finditer(
            r'\n  \{\n    ons_code: "([^"]+)",\n    name: "([^"]+)"',
            content
        ))

        for i, match in enumerate(entries):
            ons = match.group(1)
            name = match.group(2)
            start = match.start()
            end = entries[i + 1].start() if i + 1 < len(entries) else len(content)
            section = content[start:end]

            results = audit_council(section, name, council_type)
            present, applicable = calculate_score(results)
            pct = round(present / applicable * 100, 1) if applicable > 0 else 0

            missing = [f for f, r in results.items() if not r["has"] and not r["exempt"]]

            all_councils.append({
                "name": name,
                "ons_code": ons,
                "type": council_type,
                "score": pct,
                "present": present,
                "applicable": applicable,
                "missing": missing,
            })

    # Sort by score ascending (worst first)
    all_councils.sort(key=lambda x: x["score"])

    # Summary
    print("=" * 80)
    print("KENT PARITY AUDIT — All 317 Councils")
    print("=" * 80)

    # By type
    type_stats = {}
    for c in all_councils:
        t = c["type"]
        if t not in type_stats:
            type_stats[t] = {"scores": [], "count": 0}
        type_stats[t]["scores"].append(c["score"])
        type_stats[t]["count"] += 1

    print("\nAverage parity by council type:")
    for t, stats in type_stats.items():
        avg = sum(stats["scores"]) / len(stats["scores"])
        print(f"  {t:25s} {avg:5.1f}% avg ({stats['count']} councils)")

    # Distribution
    brackets = [(0, 50), (50, 60), (60, 70), (70, 80), (80, 90), (90, 100), (100, 101)]
    print("\nParity score distribution:")
    for low, high in brackets:
        count = sum(1 for c in all_councils if low <= c["score"] < high)
        label = f"{low}-{high-1}%" if high <= 100 else "100%"
        bar = "#" * count
        print(f"  {label:8s} {count:3d}  {bar}")

    # Top 10 best
    print("\nTop 10 (closest to Kent parity):")
    for c in sorted(all_councils, key=lambda x: -x["score"])[:10]:
        print(f"  {c['score']:5.1f}%  {c['name']} ({c['type']})")
        if c["missing"]:
            print(f"         Missing: {', '.join(c['missing'][:5])}")

    # Bottom 10 worst
    print("\nBottom 10 (furthest from Kent parity):")
    for c in all_councils[:10]:
        print(f"  {c['score']:5.1f}%  {c['name']} ({c['type']})")
        print(f"         Missing: {', '.join(c['missing'][:8])}")

    # Most common missing fields
    field_missing = {}
    for c in all_councils:
        for f in c["missing"]:
            field_missing[f] = field_missing.get(f, 0) + 1

    print("\nMost commonly missing fields:")
    for field, count in sorted(field_missing.items(), key=lambda x: -x[1]):
        pct = count * 100 // 317
        print(f"  {field:35s} {count:3d}/317 missing ({pct}%)")

    # Write CSV
    csv_path = "kent-parity-audit.csv"
    with open(csv_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["name", "ons_code", "type", "parity_score", "present", "applicable", "missing_fields"])
        for c in all_councils:
            writer.writerow([
                c["name"], c["ons_code"], c["type"],
                c["score"], c["present"], c["applicable"],
                "; ".join(c["missing"]),
            ])

    print(f"\nDetailed CSV written to: {csv_path}")
    print(f"\nOverall average parity: {sum(c['score'] for c in all_councils) / len(all_councils):.1f}%")


if __name__ == "__main__":
    main()
