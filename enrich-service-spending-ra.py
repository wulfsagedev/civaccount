#!/usr/bin/env python3
"""
Batch-enrich all 317 UK councils with service_spending data from GOV.UK RA CSV.

Reads the Revenue Account (RA) 2025-26 CSV and generates TypeScript service_spending
arrays with real per-service amounts for every council that doesn't already have one.

Usage: python3 enrich-service-spending-ra.py
"""

import csv
import re
import os
import sys
import subprocess
from pathlib import Path

# === CONFIGURATION ===

PROJECT_ROOT = Path(__file__).parent
CSV_PATH = PROJECT_ROOT / 'src/data/councils/pdfs/gov-uk-ra-data/RA_Part1_LA_Data.csv'
COUNCIL_DIR = PROJECT_ROOT / 'src/data/councils'

COUNCIL_FILES = [
    'county-councils.ts',
    'districts.ts',
    'metropolitan.ts',
    'unitary.ts',
    'london-boroughs.ts',
]

# Councils that already have manually-researched service_spending — do NOT overwrite
SKIP_COUNCILS = {
    'Cambridgeshire', 'Derbyshire', 'Devon', 'East Sussex', 'Essex',
    'Gloucestershire', 'Hampshire', 'Hertfordshire', 'Kent',
    'Folkestone & Hythe',
}

TODAY = '2026-03-04'

GOV_UK_RA_URL = 'https://www.gov.uk/government/statistics/local-authority-revenue-expenditure-and-financing-england-2025-to-2026-budget'

# === SERVICE CATEGORY MAPPINGS ===
# Each category maps to RA CSV column indices (0-based) and defines services.
# Services are listed in display order (roughly by typical spend size).
# 'cols' is a list of column indices to sum for the service amount.

CATEGORY_MAPPINGS = [
    {
        'key': 'adult_social_care',
        'total_col': 56,
        'services': [
            {'name': "Older People's Care", 'desc': "Residential, nursing and home care for older residents", 'cols': [39, 41, 43]},
            {'name': "Learning Disability Services", 'desc': "Support for adults with learning disabilities", 'cols': [44, 45]},
            {'name': "Physical Disability & Sensory Support", 'desc': "Support for adults with physical disabilities and sensory needs", 'cols': [38, 40, 42]},
            {'name': "Mental Health Services", 'desc': "Community mental health support and specialist placements", 'cols': [46, 47]},
            {'name': "Social Support & Carers", 'desc': "Carer support, substance misuse, asylum seeker and social isolation support", 'cols': [48, 49, 50, 51]},
            {'name': "Assessment & Care Management", 'desc': "Assistive equipment, care activities, information and commissioning", 'cols': [52, 53, 54, 55]},
        ],
    },
    {
        'key': 'childrens_social_care',
        'total_col': 37,
        'services': [
            {'name': "Children Looked After", 'desc': "Foster care, residential placements and care leavers", 'cols': [30]},
            {'name': "Safeguarding", 'desc': "Child protection, safeguarding and assessment", 'cols': [34]},
            {'name': "Family Support Services", 'desc': "Family support and intervention services", 'cols': [32]},
            {'name': "Sure Start & Children's Centres", 'desc': "Early years centres and flying start programmes", 'cols': [29]},
            {'name': "Youth Justice", 'desc': "Youth offending teams and justice services", 'cols': [33]},
            {'name': "Services for Young People", 'desc': "Youth services and activities for young people", 'cols': [36]},
            {'name': "Asylum Seekers (Children)", 'desc': "Support for unaccompanied asylum-seeking children", 'cols': [35]},
            {'name': "Other Children & Family Services", 'desc': "Other children and family services", 'cols': [31]},
        ],
    },
    {
        'key': 'education',
        'total_col': 12,
        'services': [
            {'name': "Primary Schools", 'desc': "Funding for primary school education", 'cols': [7]},
            {'name': "Secondary Schools", 'desc': "Funding for secondary school education", 'cols': [8]},
            {'name': "Early Years", 'desc': "Early years childcare and nursery provision", 'cols': [6]},
            {'name': "Special Schools & Alternative Provision", 'desc': "Support for children with complex needs including SEND", 'cols': [9]},
            {'name': "Other Education", 'desc': "Other education services including home to school transport", 'cols': [11]},
            {'name': "Post-16 Provision", 'desc': "Sixth form and further education funding", 'cols': [10]},
        ],
    },
    {
        'key': 'transport',
        'total_col': 28,
        'services': [
            {'name': "Highway Maintenance", 'desc': "Road repairs, resurfacing and structural maintenance", 'cols': [13, 14, 15]},
            {'name': "Public Transport", 'desc': "Concessionary fares and bus service support", 'cols': [23, 24, 25, 26]},
            {'name': "Street Lighting", 'desc': "Street lighting including energy costs", 'cols': [17]},
            {'name': "Winter Maintenance", 'desc': "Gritting and snow clearance on priority routes", 'cols': [16]},
            {'name': "Traffic Management & Road Safety", 'desc': "Road safety education, congestion charging and traffic management", 'cols': [18, 19, 20, 21]},
            {'name': "Parking Services", 'desc': "Car park management and enforcement", 'cols': [22]},
        ],
    },
    {
        'key': 'public_health',
        'total_col': 81,
        'services': [
            {'name': "Children's Public Health", 'desc': "Health visiting, school nursing and 0-19 services", 'cols': [62, 63, 75, 76, 77]},
            {'name': "Sexual Health", 'desc': "STI testing, contraception and sexual health promotion", 'cols': [57, 58, 59]},
            {'name': "Substance Misuse", 'desc': "Drug and alcohol treatment and harm reduction", 'cols': [68, 69, 70, 71, 72]},
            {'name': "Obesity & Physical Activity", 'desc': "Weight management and physical activity programmes", 'cols': [64, 65, 66, 67]},
            {'name': "Smoking & Tobacco", 'desc': "Stop smoking services and wider tobacco control", 'cols': [73, 74]},
            {'name': "NHS Health Checks", 'desc': "NHS health check programme", 'cols': [60]},
            {'name': "Other Public Health", 'desc': "Health protection, mental health, health at work and other", 'cols': [61, 78, 79, 80]},
        ],
    },
    {
        'key': 'environmental',
        'total_col': 125,
        'services': [
            {'name': "Waste Disposal", 'desc': "Household waste disposal and treatment", 'cols': [120]},
            {'name': "Waste Collection", 'desc': "Household waste collection services", 'cols': [119]},
            {'name': "Recycling", 'desc': "Recycling collection and processing", 'cols': [122]},
            {'name': "Street Cleansing", 'desc': "Street cleansing and litter removal", 'cols': [118]},
            {'name': "Regulatory Services", 'desc': "Trading standards, food safety, environmental protection and licensing", 'cols': [98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109]},
            {'name': "Community Safety", 'desc': "Crime reduction, safety services and CCTV", 'cols': [110, 111, 112]},
            {'name': "Flood & Drainage", 'desc': "Flood defences, land drainage and coast protection", 'cols': [113, 114, 115, 116]},
            {'name': "Cemetery & Cremation", 'desc': "Cemetery, cremation and mortuary services", 'cols': [97]},
            {'name': "Climate Change", 'desc': "Climate change costs and initiatives", 'cols': [124]},
        ],
    },
    {
        'key': 'cultural',
        'total_col': 96,
        'services': [
            {'name': "Library Service", 'desc': "Public library services", 'cols': [95]},
            {'name': "Recreation & Sport", 'desc': "Recreation and sport facilities and programmes", 'cols': [92]},
            {'name': "Open Spaces", 'desc': "Parks, open spaces and countryside access", 'cols': [93]},
            {'name': "Culture & Heritage", 'desc': "Culture and heritage services (excluding archives)", 'cols': [91]},
            {'name': "Archives", 'desc': "Archives and local records services", 'cols': [90]},
            {'name': "Tourism", 'desc': "Tourism promotion and visitor economy", 'cols': [94]},
        ],
    },
    {
        'key': 'central_services',
        'total_col': 148,
        'services': [
            {'name': "Corporate & Democratic Core", 'desc': "Democratic representation and corporate management", 'cols': [139]},
            {'name': "Other Central Services", 'desc': "Other central services to the public", 'cols': [144]},
            {'name': "Non-Distributed Costs", 'desc': "Retirement benefits, unused IT and surplus asset costs", 'cols': [145, 146, 147]},
            {'name': "Local Tax Collection", 'desc': "Council tax collection, discounts and administration", 'cols': [140, 141, 142]},
            {'name': "Coroner's Court", 'desc': "Coroner's court and inquest services", 'cols': [137]},
            {'name': "Emergency Planning", 'desc': "Civil emergency planning and resilience", 'cols': [143]},
        ],
    },
    {
        'key': 'planning',
        'total_col': 134,
        'services': [
            {'name': "Development Control", 'desc': "Planning applications, decisions and enforcement", 'cols': [127]},
            {'name': "Planning Policy", 'desc': "Local plan and strategic planning policy", 'cols': [128]},
            {'name': "Economic Development", 'desc': "Economic development and regeneration", 'cols': [130]},
            {'name': "Building Control", 'desc': "Building regulations and inspections", 'cols': [126]},
            {'name': "Environmental Initiatives", 'desc': "Environmental and sustainability initiatives", 'cols': [129]},
            {'name': "Community Development", 'desc': "Community development programmes", 'cols': [131]},
        ],
    },
    {
        'key': 'housing',
        'total_col': 89,
        'services': [
            {'name': "Supporting People", 'desc': "Housing-related support services", 'cols': [87]},
            {'name': "Housing Strategy & Enabling", 'desc': "Housing strategy, advice, renewals and licensing", 'cols': [82]},
            {'name': "Homelessness", 'desc': "Homelessness prevention and support", 'cols': [83]},
            {'name': "Housing Benefits Administration", 'desc': "Processing housing benefit claims", 'cols': [85]},
            {'name': "Council Property & Traveller Sites", 'desc': "Traveller sites and non-HRA council property", 'cols': [86]},
            {'name': "Other Welfare Services", 'desc': "Other welfare services", 'cols': [88]},
        ],
    },
]


def parse_csv():
    """Parse RA CSV and return dict: council_name -> {col_index: float_value}"""
    data = {}
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)

    # Data rows start at index 10 (row 11 in the file)
    for row in rows[10:]:
        if len(row) < 6:
            continue
        ecode = row[0].strip()
        name = row[2].strip()
        cls = row[3].strip()

        # Skip summary rows (E-code starts with '-' or is empty)
        if not ecode or ecode == '-':
            continue
        # Skip non-council types (Police, Fire, etc.)
        if cls not in ('SC', 'SD', 'UA', 'MD', 'LB'):
            continue

        row_data = {}
        for i in range(6, len(row)):
            try:
                val = float(row[i]) if row[i].strip() else 0.0
            except ValueError:
                val = 0.0
            row_data[i] = val

        data[name] = row_data

    return data


def sum_cols(row_data, cols):
    """Sum specified columns from row data, return integer in pounds (× 1000)."""
    total = sum(row_data.get(c, 0.0) for c in cols)
    return int(round(total * 1000))


def generate_service_spending(council_name, row_data):
    """Generate TypeScript service_spending array text for one council."""
    categories = []

    for cat in CATEGORY_MAPPINGS:
        total_val = row_data.get(cat['total_col'], 0.0)
        if total_val == 0:
            continue  # Skip zero-total categories

        budget_pounds = int(round(total_val * 1000))

        # Build services list (only non-zero services, sorted by |amount| desc)
        services = []
        for svc in cat['services']:
            amount = sum_cols(row_data, svc['cols'])
            if amount == 0:
                continue
            services.append((svc['name'], svc['desc'], amount))

        # Sort by absolute amount descending
        services.sort(key=lambda s: abs(s[2]), reverse=True)

        if not services:
            continue  # No non-zero services even though total is non-zero

        # Build TypeScript text for this category
        svc_lines = []
        for name, desc, amount in services:
            # Escape quotes in name/description
            ename = name.replace('"', '\\"')
            edesc = desc.replace('"', '\\"')
            svc_lines.append(
                f'            {{ name: "{ename}", description: "{edesc}", amount: {amount} }}'
            )
        svc_text = ',\n'.join(svc_lines)

        cat_text = f"""        {{
          category: '{cat['key']}',
          budget: {budget_pounds},
          services: [
{svc_text},
          ],
          transparency_links: [
            {{ label: "GOV.UK RA data 2025-26", url: "{GOV_UK_RA_URL}", description: "Revenue Account budget returns to MHCLG" }},
          ],
        }}"""
        categories.append(cat_text)

    if not categories:
        return None  # No service spending to add

    inner = ',\n'.join(categories)
    return f"""      // Service spending (2025-26) from GOV.UK Revenue Account budget returns
      service_spending: [
{inner},
      ],

"""


def process_file(filepath, ra_data):
    """Process a single .ts file: insert service_spending for councils that don't have it."""
    content = open(filepath, 'r', encoding='utf-8').read()
    original_content = content

    # Find all council names in the file
    name_pattern = re.compile(r'^\s{4}name:\s*"([^"]+)"', re.MULTILINE)
    names = name_pattern.findall(content)

    enriched = 0
    skipped_existing = 0
    skipped_no_data = 0
    skipped_list = 0

    for council_name in names:
        # Skip if in the skip list
        if council_name in SKIP_COUNCILS:
            skipped_list += 1
            continue

        # Find council position
        name_marker = f'    name: "{council_name}"'
        name_idx = content.find(name_marker)
        if name_idx == -1:
            print(f"  WARNING: Could not find '{council_name}' in {filepath.name}")
            continue

        # Find last_verified after this council
        lv_search_start = name_idx
        lv_idx = content.find('      last_verified:', lv_search_start)
        if lv_idx == -1 or (lv_idx - name_idx) > 15000:
            print(f"  WARNING: No last_verified found for '{council_name}' within range")
            continue

        # Check if service_spending already exists between name and last_verified
        sp_idx = content.find('service_spending:', name_idx)
        if sp_idx != -1 and sp_idx < lv_idx:
            skipped_existing += 1
            continue

        # Look up RA data
        if council_name not in ra_data:
            skipped_no_data += 1
            print(f"  WARNING: No RA data for '{council_name}'")
            continue

        # Generate service_spending text
        ts_text = generate_service_spending(council_name, ra_data[council_name])
        if ts_text is None:
            skipped_no_data += 1
            continue

        # Insert before last_verified
        # Find the start of the last_verified line (including leading whitespace)
        line_start = content.rfind('\n', 0, lv_idx) + 1
        insert_point = line_start

        content = content[:insert_point] + ts_text + content[insert_point:]
        enriched += 1

    return content, original_content, enriched, skipped_existing, skipped_no_data, skipped_list


def main():
    print("=== Batch Service Spending Enrichment ===")
    print(f"CSV: {CSV_PATH}")
    print()

    # Step 1: Parse CSV
    print("Step 1: Parsing RA CSV...")
    ra_data = parse_csv()
    print(f"  Found {len(ra_data)} councils in CSV")
    print()

    # Step 2: Process each file
    total_enriched = 0
    total_skipped = 0
    temp_files = []

    for filename in COUNCIL_FILES:
        filepath = COUNCIL_DIR / filename
        if not filepath.exists():
            print(f"  ERROR: {filepath} not found!")
            continue

        print(f"Step 2: Processing {filename}...")
        content, original, enriched, skip_exist, skip_nodata, skip_list = process_file(filepath, ra_data)

        total_enriched += enriched
        total_skipped += skip_exist + skip_nodata + skip_list

        print(f"  Enriched: {enriched}")
        print(f"  Skipped (existing): {skip_exist}")
        print(f"  Skipped (skip list): {skip_list}")
        if skip_nodata:
            print(f"  Skipped (no RA data): {skip_nodata}")

        # Write to temp file
        tmp_path = filepath.with_suffix('.ts.tmp')
        with open(tmp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        temp_files.append((tmp_path, filepath))
        print()

    print(f"Total enriched: {total_enriched}")
    print(f"Total skipped: {total_skipped}")
    print()

    # Step 3: TypeScript compilation check
    print("Step 3: Running TypeScript compilation check...")

    # First, swap temp files in
    for tmp_path, orig_path in temp_files:
        backup_path = orig_path.with_suffix('.ts.bak')
        os.rename(orig_path, backup_path)
        os.rename(tmp_path, orig_path)

    result = subprocess.run(
        ['npx', 'tsc', '--noEmit'],
        cwd=str(PROJECT_ROOT),
        capture_output=True,
        text=True,
        timeout=120,
    )

    if result.returncode == 0:
        print("  TypeScript compilation: PASSED")
        # Remove backups
        for tmp_path, orig_path in temp_files:
            backup_path = orig_path.with_suffix('.ts.bak')
            if backup_path.exists():
                os.remove(backup_path)
        print()
        print("=== SUCCESS ===")
        print(f"Enriched {total_enriched} councils across {len(COUNCIL_FILES)} files.")
    else:
        print("  TypeScript compilation: FAILED")
        print(result.stdout[:2000] if result.stdout else '')
        print(result.stderr[:2000] if result.stderr else '')
        # Restore backups
        for tmp_path, orig_path in temp_files:
            backup_path = orig_path.with_suffix('.ts.bak')
            if backup_path.exists():
                os.rename(orig_path, tmp_path)  # Move bad file to .tmp
                os.rename(backup_path, orig_path)  # Restore original
        print()
        print("=== ROLLED BACK ===")
        print("Original files restored. Check .tmp files for debugging.")
        sys.exit(1)


if __name__ == '__main__':
    main()
