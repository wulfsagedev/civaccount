#!/usr/bin/env python3
"""
Clean up bad cabinet data from the website scraper.
Removes garbage entries and fixes minor issues in good entries.
"""

import re

# Councils where cabinet data is GARBAGE and should be completely removed
REMOVE_CABINET = {
    "src/data/councils/districts.ts": [
        "Adur", "Elmbridge", "North Hertfordshire", "South Kesteven",
        "South Oxfordshire", "Warwick", "Welwyn Hatfield", "Worthing",
    ],
    "src/data/councils/unitary.ts": [
        "Bracknell Forest", "Peterborough",
    ],
    "src/data/councils/london-boroughs.ts": [
        "Croydon", "Lambeth", "Redbridge", "Tower Hamlets", "Westminster",
        "Haringey",  # Only last names scraped, not accurate
    ],
}


def remove_cabinet_from_council(content, council_name):
    """Remove the cabinet: [...], block from a specific council's section."""
    # Find the council
    council_match = re.search(
        r'\n  \{\n    ons_code: "[^"]+",\n    name: "' + re.escape(council_name) + '"',
        content
    )
    if not council_match:
        print(f"  Council not found: {council_name}")
        return content, False

    start = council_match.start()
    # Find next council or end
    next_match = re.search(r'\n  \{\n    ons_code: "[^"]+",\n    name: "', content[start + 10:])
    end = start + 10 + next_match.start() if next_match else len(content)
    section = content[start:end]

    # Find and remove cabinet block
    cab_match = re.search(r'\n\s+cabinet: \[.*?\],\n', section, re.DOTALL)
    if not cab_match:
        print(f"  No cabinet found in: {council_name}")
        return content, False

    new_section = section[:cab_match.start()] + section[cab_match.end():]
    content = content[:start] + new_section + content[end:]
    return content, True


def fix_stoke_on_trent(content):
    """Fix Stoke-on-Trent: remove garbled 5th entry and fix HTML entity."""
    # Fix HTML entity
    content = content.replace("Children&#39;s Services", "Children's Services")

    # Remove the garbled entry: "Councillor Finlay Gordon" with wrong portfolio
    content = content.replace(
        '        { name: "Councillor Finlay Gordon", role: "Cabinet Member", portfolio: "McCusker - Cabinet Member for Transport, Infrastructure and Regeneration" },\n',
        ''
    )
    return content


def fix_oxford_leader(content):
    """Fix Oxford: Susan Brown should be Leader, not Cabinet Member."""
    content = content.replace(
        '{ name: "Councillor Susan Brown", role: "Cabinet Member", portfolio: "Leader, and Cabinet Member for Partnership Working and Inclusive Economic Growth" }',
        '{ name: "Councillor Susan Brown", role: "Leader", portfolio: "Partnership Working and Inclusive Economic Growth" }'
    )
    return content


def main():
    total_removed = 0

    for ts_file, councils in REMOVE_CABINET.items():
        print(f"\n{ts_file}:")
        with open(ts_file, "r") as f:
            content = f.read()

        removed = 0
        for council_name in councils:
            content, success = remove_cabinet_from_council(content, council_name)
            if success:
                removed += 1
                print(f"  - Removed cabinet from: {council_name}")

        with open(ts_file, "w") as f:
            f.write(content)

        total_removed += removed
        print(f"  Removed: {removed}")

    # Fix Stoke-on-Trent
    print("\nFixing Stoke-on-Trent...")
    with open("src/data/councils/unitary.ts", "r") as f:
        content = f.read()
    content = fix_stoke_on_trent(content)
    with open("src/data/councils/unitary.ts", "w") as f:
        f.write(content)
    print("  Fixed HTML entity + removed garbled entry")

    # Fix Oxford leader role
    print("Fixing Oxford leader role...")
    with open("src/data/councils/districts.ts", "r") as f:
        content = f.read()
    content = fix_oxford_leader(content)
    with open("src/data/councils/districts.ts", "w") as f:
        f.write(content)
    print("  Fixed Susan Brown role to Leader")

    print(f"\nTotal garbage cabinet entries removed: {total_removed}")
    print(f"Remaining good entries: Oxford (8), Stafford (8), Stoke-on-Trent (4), Hackney (12)")


if __name__ == "__main__":
    main()
