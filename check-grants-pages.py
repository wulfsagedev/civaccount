#!/usr/bin/env python3
"""Check grants pages for downloadable data files."""

import csv
import re
import requests

HEADERS = {"User-Agent": "CivAccount/2.0 (civic transparency project)"}

with open("spending-csv-urls.csv") as f:
    reader = csv.DictReader(f)
    grants_pages = [r for r in reader if "grant" in r.get("type", "").lower()]

print(f"Checking {len(grants_pages)} grants pages...\n")

for g in grants_pages:
    name = g["name"]
    url = g["url"]
    try:
        resp = requests.get(url, timeout=15, headers=HEADERS, allow_redirects=True)
        if resp.status_code != 200:
            print(f"{name:30s} HTTP {resp.status_code}")
            continue

        text = resp.text
        csv_links = re.findall(r'href="([^"]*\.csv[^"]*)"', text, re.IGNORECASE)
        xlsx_links = re.findall(r'href="([^"]*\.xlsx?[^"]*)"', text, re.IGNORECASE)
        pdf_links = re.findall(r'href="([^"]*\.pdf[^"]*)"', text, re.IGNORECASE)
        table_count = text.lower().count("<table")

        status = f"{len(csv_links)} CSV, {len(xlsx_links)} XLS, {len(pdf_links)} PDF, {table_count} tables"
        indicator = "***" if csv_links else ("**" if xlsx_links else ("*" if table_count > 0 else ""))
        print(f"{name:30s} {status} {indicator}")
        if csv_links:
            for l in csv_links[:3]:
                print(f"  CSV: {l[:120]}")
        if xlsx_links:
            for l in xlsx_links[:3]:
                print(f"  XLS: {l[:120]}")
    except Exception as e:
        print(f"{name:30s} ERROR: {str(e)[:60]}")
