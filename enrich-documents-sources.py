#!/usr/bin/env python3
"""
Batch 2: Add documents and open_data_links arrays to councils that don't have them.

Generates from existing URLs already present in the TypeScript files:
- documents: [{title, url, type, year}] from budget_url, accounts_url
- open_data_links: [{theme, links: [{label, url, description}]}] from all available URLs

Sources already exist for all 317 councils (skip).

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


def extract_council_blocks(content):
    """Extract council name, start position, and URL fields for each council."""
    council_pattern = re.compile(r'^\s+name:\s+"([^"]+)",', re.MULTILINE)
    matches = list(council_pattern.finditer(content))

    councils = []
    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        section = content[start:end]

        # Extract URLs
        urls = {}
        for field in ["website", "council_tax_url", "budget_url", "accounts_url",
                       "transparency_url", "councillors_url"]:
            url_match = re.search(rf'{field}:\s*"([^"]+)"', section)
            if url_match:
                urls[field] = url_match.group(1)

        # Check what already exists
        has_documents = "documents:" in section
        has_open_data_links = "open_data_links:" in section

        # Find council name from the match
        name = match.group(1)

        councils.append({
            "name": name,
            "start": start,
            "end": end,
            "section": section,
            "urls": urls,
            "has_documents": has_documents,
            "has_open_data_links": has_open_data_links,
        })

    return councils


def generate_documents_block(name, urls):
    """Generate documents array from available URLs."""
    docs = []

    if "accounts_url" in urls:
        docs.append({
            "title": f"Statement of Accounts 2023-24",
            "url": urls["accounts_url"],
            "type": "accounts",
            "year": "2023-24",
        })

    if "budget_url" in urls:
        docs.append({
            "title": f"Budget 2025-26",
            "url": urls["budget_url"],
            "type": "budget",
            "year": "2025-26",
        })

    if "transparency_url" in urls:
        docs.append({
            "title": f"Transparency Data",
            "url": urls["transparency_url"],
            "type": "report",
            "year": "2024-25",
        })

    if not docs:
        return None

    lines = ["      documents: ["]
    for d in docs:
        title = escape_ts(d["title"])
        url = escape_ts(d["url"])
        lines.append(f'        {{ title: "{title}", url: "{url}", type: "{d["type"]}", year: "{d["year"]}" }},')
    lines.append("      ],")
    return "\n".join(lines)


def generate_open_data_links_block(name, urls):
    """Generate open_data_links array grouped by theme."""
    themes = []

    # Finance & spending
    finance_links = []
    if "budget_url" in urls:
        finance_links.append({
            "label": "Budget overview",
            "url": urls["budget_url"],
            "description": "Annual budget documents and breakdown",
        })
    if "accounts_url" in urls:
        finance_links.append({
            "label": "Statement of Accounts",
            "url": urls["accounts_url"],
            "description": "Audited financial statements",
        })
    if "transparency_url" in urls:
        finance_links.append({
            "label": "Spending data",
            "url": urls["transparency_url"],
            "description": "Spending over £500 and contract payments",
        })
    if finance_links:
        themes.append(("Finance & spending", finance_links))

    # Council & democracy
    democracy_links = []
    if "councillors_url" in urls:
        democracy_links.append({
            "label": "Your councillors",
            "url": urls["councillors_url"],
            "description": "Find and contact your local councillors",
        })
    if "council_tax_url" in urls:
        democracy_links.append({
            "label": "Council tax",
            "url": urls["council_tax_url"],
            "description": "Council tax rates, bands and payments",
        })
    if democracy_links:
        themes.append(("Council & democracy", democracy_links))

    # Data sources (standard GOV.UK sources that apply to all councils)
    if "website" in urls:
        themes.append(("Official website", [
            {
                "label": f"{name} council website",
                "url": urls["website"],
                "description": "Main council website with services and information",
            },
        ]))

    if not themes:
        return None

    lines = ["      open_data_links: ["]
    for theme_name, links in themes:
        lines.append(f'        {{')
        lines.append(f'          theme: "{escape_ts(theme_name)}",')
        lines.append(f'          links: [')
        for link in links:
            label = escape_ts(link["label"])
            url = escape_ts(link["url"])
            desc = escape_ts(link["description"])
            lines.append(f'            {{ label: "{label}", url: "{url}", description: "{desc}" }},')
        lines.append(f'          ],')
        lines.append(f'        }},')
    lines.append("      ],")
    return "\n".join(lines)


def enrich_file(ts_file):
    """Add documents and open_data_links to councils that need them."""
    with open(ts_file, "r") as f:
        content = f.read()

    councils = extract_council_blocks(content)
    docs_added = 0
    odl_added = 0

    # Process in reverse to preserve positions
    for council in reversed(councils):
        name = council["name"]
        urls = council["urls"]
        section = council["section"]
        start = council["start"]

        blocks_to_insert = []

        if not council["has_documents"]:
            doc_block = generate_documents_block(name, urls)
            if doc_block:
                blocks_to_insert.append(doc_block)
                docs_added += 1

        if not council["has_open_data_links"]:
            odl_block = generate_open_data_links_block(name, urls)
            if odl_block:
                blocks_to_insert.append(odl_block)
                odl_added += 1

        if not blocks_to_insert:
            continue

        # Find sources: or last_verified: in this section as insertion point
        # Insert before sources: if it exists, otherwise before last_verified:
        insert_match = re.search(r'^(\s+)sources:', section, re.MULTILINE)
        if not insert_match:
            insert_match = re.search(r'^(\s+)last_verified:', section, re.MULTILINE)
        if not insert_match:
            continue

        insert_pos = start + insert_match.start()
        block = "\n".join(blocks_to_insert) + "\n\n"
        content = content[:insert_pos] + block + content[insert_pos:]

    if docs_added > 0 or odl_added > 0:
        with open(ts_file, "w") as f:
            f.write(content)

    return docs_added, odl_added


def main():
    print("=== Batch 2: Documents + Open Data Links ===\n")

    total_docs = 0
    total_odl = 0

    for ts_file in TS_FILES:
        print(f"Processing {ts_file}...")
        docs, odl = enrich_file(ts_file)
        print(f"  Documents added: {docs}, Open data links added: {odl}")
        total_docs += docs
        total_odl += odl

    print(f"\n=== Summary ===")
    print(f"Documents arrays added: {total_docs}")
    print(f"Open data links arrays added: {total_odl}")

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
