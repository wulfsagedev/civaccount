#!/usr/bin/env python3
"""
Batch 3: Add governance_transparency and section_transparency to councils.

Generates from existing URLs in the TypeScript files:
- governance_transparency: [{label, url, description}] — links to pay, allowances, spending pages
- section_transparency: {finances: [...], outcomes: [...]} — grouped transparency links

Only adds these where we have actual URLs to reference.

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


def escape_ts(s):
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ")


def extract_council_data(content):
    """Extract council info including name, URLs, and existing fields."""
    council_pattern = re.compile(r'^\s+name:\s+"([^"]+)",', re.MULTILINE)
    matches = list(council_pattern.finditer(content))

    councils = []
    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        section = content[start:end]

        urls = {}
        for field in ["website", "council_tax_url", "budget_url", "accounts_url",
                       "transparency_url", "councillors_url"]:
            url_match = re.search(rf'{field}:\s*"([^"]+)"', section)
            if url_match:
                urls[field] = url_match.group(1)

        has_governance = "governance_transparency:" in section
        has_section = "section_transparency:" in section

        councils.append({
            "name": match.group(1),
            "start": start,
            "end": end,
            "section": section,
            "urls": urls,
            "has_governance": has_governance,
            "has_section": has_section,
        })

    return councils


def generate_governance_block(name, urls):
    """Generate governance_transparency array from available URLs."""
    links = []

    if "transparency_url" in urls:
        base = urls["transparency_url"].rstrip("/")
        links.append({
            "label": "Spending over £500",
            "url": urls["transparency_url"],
            "description": "Quarterly spending data as required by the Transparency Code",
        })

    if "councillors_url" in urls:
        links.append({
            "label": "Councillor information",
            "url": urls["councillors_url"],
            "description": "Your elected councillors and their contact details",
        })

    if not links:
        return None

    lines = ["      governance_transparency: ["]
    for link in links:
        label = escape_ts(link["label"])
        url = escape_ts(link["url"])
        desc = escape_ts(link["description"])
        lines.append(f'        {{ label: "{label}", url: "{url}", description: "{desc}" }},')
    lines.append("      ],")
    return "\n".join(lines)


def generate_section_block(name, urls):
    """Generate section_transparency object with finances and outcomes."""
    finances = []
    outcomes = []

    if "accounts_url" in urls:
        finances.append({
            "label": "Statement of Accounts",
            "url": urls["accounts_url"],
            "description": "Audited annual financial statements",
        })

    if "budget_url" in urls:
        finances.append({
            "label": "Budget documents",
            "url": urls["budget_url"],
            "description": "Annual budget and medium term financial plan",
        })

    if "transparency_url" in urls:
        finances.append({
            "label": "Spending data",
            "url": urls["transparency_url"],
            "description": "Payments to suppliers and spending over £500",
        })

    if "council_tax_url" in urls:
        outcomes.append({
            "label": "Council tax information",
            "url": urls["council_tax_url"],
            "description": "Council tax rates, bands and collection data",
        })

    if not finances and not outcomes:
        return None

    lines = ["      section_transparency: {"]
    if finances:
        lines.append("        finances: [")
        for link in finances:
            label = escape_ts(link["label"])
            url = escape_ts(link["url"])
            desc = escape_ts(link["description"])
            lines.append(f'          {{ label: "{label}", url: "{url}", description: "{desc}" }},')
        lines.append("        ],")
    if outcomes:
        lines.append("        outcomes: [")
        for link in outcomes:
            label = escape_ts(link["label"])
            url = escape_ts(link["url"])
            desc = escape_ts(link["description"])
            lines.append(f'          {{ label: "{label}", url: "{url}", description: "{desc}" }},')
        lines.append("        ],")
    lines.append("      },")
    return "\n".join(lines)


def enrich_file(ts_file):
    """Add governance_transparency and section_transparency."""
    with open(ts_file, "r") as f:
        content = f.read()

    councils = extract_council_data(content)
    gov_added = 0
    sec_added = 0

    for council in reversed(councils):
        name = council["name"]
        urls = council["urls"]
        section = council["section"]
        start = council["start"]

        blocks = []

        if not council["has_governance"]:
            block = generate_governance_block(name, urls)
            if block:
                blocks.append(block)
                gov_added += 1

        if not council["has_section"]:
            block = generate_section_block(name, urls)
            if block:
                blocks.append(block)
                sec_added += 1

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

    if gov_added > 0 or sec_added > 0:
        with open(ts_file, "w") as f:
            f.write(content)

    return gov_added, sec_added


def main():
    print("=== Batch 3: Governance & Section Transparency ===\n")

    total_gov = 0
    total_sec = 0

    for ts_file in TS_FILES:
        print(f"Processing {ts_file}...")
        gov, sec = enrich_file(ts_file)
        print(f"  Governance: {gov}, Section: {sec}")
        total_gov += gov
        total_sec += sec

    print(f"\n=== Summary ===")
    print(f"governance_transparency added: {total_gov}")
    print(f"section_transparency added: {total_sec}")

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
