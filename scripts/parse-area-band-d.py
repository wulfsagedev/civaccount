#!/usr/bin/env python3
"""
Parse GOV.UK Band_D_2026-27.ods → parsed-area-band-d.csv

Source: GOV.UK Live Table, sheet "Area_CT" (Table 5)
  = total Band D area council tax including all precepts
  = what residents actually pay

Output: CSV with ONS code, name, class, and band_d for 2021-2025
  This CSV is the single derived artifact that the validator checks against.

Run: python3 scripts/parse-area-band-d.py
"""

import os
import sys

try:
    from odf.opendocument import load
    from odf.table import Table, TableRow, TableCell
    from odf.text import P
except ImportError:
    print("Installing odfpy...")
    import subprocess
    subprocess.run([sys.executable, '-m', 'pip', 'install', '--quiet', 'odfpy'], check=True)
    from odf.opendocument import load
    from odf.table import Table, TableRow, TableCell
    from odf.text import P


def get_text(cell):
    ps = cell.getElementsByType(P)
    parts = []
    for p in ps:
        for node in p.childNodes:
            if hasattr(node, 'data'):
                parts.append(node.data)
            elif hasattr(node, 'childNodes'):
                for child in node.childNodes:
                    if hasattr(child, 'data'):
                        parts.append(child.data)
    return ' '.join(parts).strip()


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    bulk_dir = os.path.join(project_root, 'src', 'data', 'councils', 'pdfs', 'gov-uk-bulk-data')

    ods_path = os.path.join(bulk_dir, 'Band_D_2026-27.ods')
    csv_path = os.path.join(bulk_dir, 'parsed-area-band-d.csv')

    if not os.path.exists(ods_path):
        print(f"ERROR: {ods_path} not found")
        sys.exit(1)

    print(f"Parsing {ods_path}...")
    doc = load(ods_path)
    sheets = doc.spreadsheet.getElementsByType(Table)

    area_ct_sheet = None
    for sheet in sheets:
        if sheet.getAttribute('name') == 'Area_CT':
            area_ct_sheet = sheet
            break

    if not area_ct_sheet:
        print("ERROR: Area_CT sheet not found")
        sys.exit(1)

    rows = area_ct_sheet.getElementsByType(TableRow)

    # Parse header to find year columns
    header_row = rows[2]
    header_cells = header_row.getElementsByType(TableCell)
    headers = []
    for cell in header_cells:
        repeat = cell.getAttribute('numbercolumnsrepeated')
        text = get_text(cell)
        if repeat and int(repeat) > 20:
            break
        count = int(repeat) if repeat else 1
        headers.extend([text] * count)

    year_cols = {}
    for i, h in enumerate(headers):
        if '2021 to 2022' in h: year_cols['band_d_2021'] = i
        elif '2022 to 2023' in h: year_cols['band_d_2022'] = i
        elif '2023 to 2024' in h: year_cols['band_d_2023'] = i
        elif '2024 to 2025' in h: year_cols['band_d_2024'] = i
        elif '2025 to 2026' in h: year_cols['band_d_2025'] = i

    print(f"Year columns: {list(year_cols.keys())}")

    # Parse data
    authorities = []
    for row in rows[3:]:
        cells = row.getElementsByType(TableCell)
        vals = []
        for cell in cells:
            repeat = cell.getAttribute('numbercolumnsrepeated')
            text = get_text(cell)
            if repeat and int(repeat) > 20:
                break
            count = int(repeat) if repeat else 1
            vals.extend([text] * count)

        if len(vals) < 6:
            continue
        ons = vals[1].strip()
        if not ons.startswith('E'):
            continue
        name = vals[2].strip()
        current = vals[3].strip()
        cls = vals[4].strip()

        if current != 'YES':
            continue

        years = {}
        for field, col_idx in year_cols.items():
            if col_idx < len(vals):
                raw = vals[col_idx].replace(',', '').strip()
                if raw and raw not in ('[z]', '-', ''):
                    try:
                        years[field] = raw  # Keep as string for exact CSV output
                    except ValueError:
                        pass

        if years:
            authorities.append({
                'ons_code': ons,
                'name': name,
                'class': cls,
                **years
            })

    # Write CSV
    fields = ['band_d_2021', 'band_d_2022', 'band_d_2023', 'band_d_2024', 'band_d_2025']
    with open(csv_path, 'w') as f:
        f.write(','.join(['ons_code', 'name', 'class'] + fields) + '\n')
        for a in authorities:
            name = f'"{a["name"]}"' if ',' in a['name'] else a['name']
            vals = [a.get(field, '') for field in fields]
            f.write(','.join([a['ons_code'], name, a['class']] + vals) + '\n')

    print(f"Wrote {csv_path} ({len(authorities)} authorities)")

    # Quick verification
    for a in authorities:
        if a['ons_code'] == 'E08000032':
            print(f"\nVerification — Bradford: band_d_2025={a.get('band_d_2025', '?')}")
            break

    print("\nDone. Run npm run validate to verify data integrity.")


if __name__ == '__main__':
    main()
