#!/usr/bin/env python3
"""Restore remaining service descriptions for london-boroughs.ts and districts.ts.

Extracted from V1.8 originals in transcript e9e3a8c7.
"""

import re

# All entries that need description restored: { name: "X" } -> { name: "X", description: "Y" }
RESTORATIONS = {
    "src/data/councils/london-boroughs.ts": {
        # Barking & Dagenham services
        "Schools": "Education services for children and young people",
        "Roads & Pavements": "Highway maintenance and improvements",
        "Libraries": "Public library services",
        "Rubbish Collection": "Waste collection and recycling services",
        "Social Care": "Support for vulnerable children and adults",
        # City of London services
        "City of London Police": "Separate police force for the Square Mile",
        "Open Spaces": "Manages Hampstead Heath, Epping Forest and other green spaces",
        "Barbican Centre": "Arts and conference centre",
    },
    "src/data/councils/districts.ts": {
        # Folkestone & Hythe top-level services
        "Waste & Recycling": "Household waste and recycling collection",
        "Parks & Open Spaces": "Maintaining parks, play areas, and green spaces",
        "Street Cleansing": "Keeping streets and public areas clean",
        "Environmental Health": "Food safety, pollution control, pest control",
        "Housing": "Social housing and homelessness services",
        "Planning": "Development control and local planning",
        "Coast Protection": "Beach management and coastal defences",
        "Lifeline Services": "Emergency response for vulnerable residents",
        "Hythe Pool": "Public swimming pool management",
        # Folkestone & Hythe service_spending services
        "Waste Collection": "Weekly refuse collection for 50,000+ households",
        "Recycling": "Fortnightly recycling collections and bring sites",
        # "Street Cleansing" already covered above
        # "Parks & Open Spaces" already covered above
        # "Coast Protection" already covered above
        "Environmental Enforcement": "Fly-tipping, noise complaints, abandoned vehicles",
        "Council Housing": "Managing 3,400+ council homes",
        "Homelessness Prevention": "Support for those at risk of homelessness",
        "Housing Advice": "Housing options and private sector support",
        "Housing Benefit": "Processing claims and payments",
        "Development Control": "Processing planning applications",
        "Building Control": "Building regulations inspections",
        "Local Plan": "Strategic planning and policy",
        "Conservation": "Listed buildings and heritage protection",
        # "Hythe Pool" already covered above
        "Community Centres": "Supporting local community facilities",
        "Tourism": "Destination marketing and visitor economy",
        "Events": "Supporting local festivals and events",
        "Council Tax Collection": "Billing and collection for all authorities",
        "Customer Services": "Call centre and face-to-face services",
        "Democratic Services": "Council meetings and elections",
        "Finance": "Accounts, audit, and treasury management",
        "Legal Services": "Legal advice and contracts",
        "HR & ICT": "Staff support and IT systems",
    },
}


def restore_file(file_path, descriptions):
    with open(file_path, "r") as f:
        content = f.read()

    restored = 0
    for name, desc in descriptions.items():
        escaped_name = re.escape(name)

        # Match { name: "X" } entries missing description
        pattern = r'(\{\s*name:\s*"' + escaped_name + r'")(\s*\})'

        if not re.search(pattern, content):
            continue

        escaped_desc = desc.replace("\\", "\\\\")
        replacement = r'\1, description: "' + escaped_desc + r'"\2'
        new_content = re.sub(pattern, replacement, content)

        if new_content != content:
            content = new_content
            restored += 1

    with open(file_path, "w") as f:
        f.write(content)

    return restored


total = 0
for file_path, descriptions in RESTORATIONS.items():
    restored = restore_file(file_path, descriptions)
    print(f"{file_path}: restored {restored}/{len(descriptions)} descriptions")
    total += restored

print(f"\nTotal restored: {total}")
