#!/usr/bin/env python3
"""
Download spending-over-£500 CSVs from council websites and extract grant payments.

Strategy:
1. Try direct CSV download URLs (common patterns on council open data portals)
2. Scrape transparency/spending pages for CSV links
3. Parse downloaded CSVs for grant-like payments to voluntary/community organisations
4. Output: parsed-grants.csv
"""

import csv
import os
import re
import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin, urlparse

import requests

TIMEOUT = 20
HEADERS = {
    "User-Agent": "CivAccount/2.0 (civic transparency project; contact: owen@civaccount.uk)"
}
OUT_DIR = "src/data/councils/pdfs/spending-csvs"

# ── Known direct CSV URLs (manually verified or discovered) ──────────────────

KNOWN_CSV_URLS = {
    "Cambridgeshire": "https://data.cambridgeshireinsight.org.uk/sites/default/files/CambsPayments2025-12.csv",
}

# ── URL patterns to try for CSV downloads ────────────────────────────────────

CSV_PATTERNS = [
    # East Devon pattern (direct CSV)
    "{website}/transparency/finance/Payments/EastDevonPaymentsOver500YTD.csv",
]


# ── Load councils ────────────────────────────────────────────────────────────

def load_councils():
    councils = []
    with open("council-websites.csv", "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            councils.append(row)
    return councils


# ── Try to find and download spending CSV ────────────────────────────────────

def find_csv_links_on_page(url):
    """Scrape a page for CSV/XLSX download links."""
    try:
        resp = requests.get(url, timeout=TIMEOUT, headers=HEADERS, allow_redirects=True)
        if resp.status_code != 200:
            return []

        text = resp.text
        # Find all links to CSV/XLSX files
        links = re.findall(r'href=["\']([^"\']*\.(?:csv|xlsx|xls)(?:\?[^"\']*)?)["\']', text, re.IGNORECASE)
        # Also find links with "download" or "spending" or "grant" in text
        download_links = re.findall(r'href=["\']([^"\']+)["\'][^>]*>[^<]*(?:download|spending|grant|csv)[^<]*<', text, re.IGNORECASE)

        all_links = set()
        for link in links + download_links:
            full_url = urljoin(url, link)
            all_links.add(full_url)

        return list(all_links)
    except Exception:
        return []


def download_csv(url, council_name):
    """Download a CSV file. Returns the local path or None."""
    safe_name = re.sub(r'[^a-z0-9]', '-', council_name.lower())
    ext = '.csv'
    if '.xlsx' in url.lower():
        ext = '.xlsx'
    elif '.xls' in url.lower():
        ext = '.xls'

    local_path = f"{OUT_DIR}/{safe_name}{ext}"

    try:
        resp = requests.get(url, timeout=30, headers=HEADERS, allow_redirects=True, stream=True)
        if resp.status_code != 200:
            return None

        # Check content type - skip HTML responses
        ct = resp.headers.get('content-type', '').lower()
        if 'text/html' in ct and ext == '.csv':
            # Might be a redirect to a page, not a CSV
            first_bytes = resp.content[:200].decode('latin-1', errors='replace')
            if '<html' in first_bytes.lower() or '<!doctype' in first_bytes.lower():
                return None

        # Check file size - skip tiny files (likely error pages)
        content = resp.content
        if len(content) < 500:
            return None

        with open(local_path, 'wb') as f:
            f.write(content)

        return local_path
    except Exception:
        return None


def try_find_spending_csv(council_name, website, transparency_url):
    """Try multiple strategies to find a spending CSV for a council."""

    # Strategy 1: Known direct URLs
    if council_name in KNOWN_CSV_URLS:
        path = download_csv(KNOWN_CSV_URLS[council_name], council_name)
        if path:
            return path, "known_url"

    # Strategy 2: Scrape transparency page for CSV links
    pages_to_try = []
    if transparency_url:
        pages_to_try.append(transparency_url)

    # Common spending page paths
    base = website.rstrip("/")
    for suffix in [
        "/transparency/spending-over-500",
        "/council/transparency/spending-over-500",
        "/your-council/transparency/spending-over-500",
        "/about-the-council/budgets-and-spending/spending-over-500",
        "/open-data/spending",
        "/opendata/spending",
        "/council/spending-and-budgets/spending-over-500",
        "/transparency/spending",
        "/about-the-council/transparency/spending",
    ]:
        pages_to_try.append(base + suffix)

    for page_url in pages_to_try:
        csv_links = find_csv_links_on_page(page_url)
        if csv_links:
            # Prefer CSVs, then XLSX
            csv_links.sort(key=lambda u: (0 if '.csv' in u.lower() else 1, u))
            # Try the most recent looking one (often has year in filename)
            for link in csv_links[:3]:
                path = download_csv(link, council_name)
                if path:
                    return path, "scraped_page"

    return None, None


# ── Parse spending CSV for grants ────────────────────────────────────────────

# Keywords that indicate a grant payment (in expense type/description)
GRANT_KEYWORDS = ['grant to', 'grants to', 'voluntary', 'vcs grant', 'community grant',
                  'grant funding', 'grant payment', 'expenditure on grants']

# Expense types that ARE grants
GRANT_EXPENSE_TYPES = ['grants', 'expenditure on grants', 'contributions to partnerships',
                       'voluntary sector grants', 'community grants', 'vcs grants',
                       'grant to voluntary bodies', 'grant payment', 'grants & contributions',
                       'grants - voluntary organisations', 'grants to voluntary organisations']

# Supplier types that are voluntary/community sector
VCS_SUPPLIER_TYPES = ['charity', 'local clubs & groups', 'trust (other)',
                      'voluntary', 'community', 'not for profit']

# Keywords in supplier name suggesting voluntary sector
VCS_NAME_KEYWORDS = ['trust', 'cic', 'charity', 'foundation', 'association',
                     'community', 'citizens advice', 'age uk', 'mind ', 'shelter',
                     'carers', 'befriend', 'volunteer', 'parish council',
                     'scout', 'guide', 'youth', 'church', 'mosque', 'temple',
                     'sports club', 'cricket club', 'football club', 'rugby club',
                     'rotary', 'lions club', 'friends of', 'support group']

# Exclude these - they're commercial/NHS, not voluntary sector
EXCLUDE_KEYWORDS = ['nhs', 'limited', ' ltd', ' plc', 'university', 'college',
                    'police', 'fire', 'ambulance', 'department for',
                    'hmrc', 'inland revenue', 'redacted', 'personal data']


def parse_spending_csv(filepath, council_name):
    """Parse a spending CSV and extract grant payments to voluntary/community orgs."""
    grants = defaultdict(lambda: {'total': 0, 'count': 0, 'purposes': set()})

    # Try different encodings
    for encoding in ['utf-8', 'latin-1', 'cp1252']:
        try:
            with open(filepath, 'r', encoding=encoding) as f:
                # Read first line to check it's a CSV
                first_line = f.readline()
                if '<html' in first_line.lower() or '<!doctype' in first_line.lower():
                    return {}
                f.seek(0)

                reader = csv.DictReader(f)
                headers = reader.fieldnames
                if not headers:
                    continue

                # Map column names (different councils use different names)
                h_lower = {h.lower().strip(): h for h in headers}

                amount_col = None
                supplier_col = None
                expense_col = None
                desc_col = None
                supplier_type_col = None

                for key, orig in h_lower.items():
                    if 'amount' in key and not amount_col:
                        amount_col = orig
                    elif ('supplier' in key or 'vendor' in key or 'payee' in key or 'beneficiary' in key) and 'type' not in key and not supplier_col:
                        supplier_col = orig
                    elif ('expense' in key or 'category' in key or 'service' in key or 'directorate' in key) and 'type' in key and not expense_col:
                        expense_col = orig
                    elif ('description' in key or 'narrative' in key or 'purpose' in key) and not desc_col:
                        desc_col = orig
                    elif 'supplier type' in key or 'vendor type' in key:
                        supplier_type_col = orig

                # Fallback: try more generic column detection
                if not supplier_col:
                    for key, orig in h_lower.items():
                        if 'supplier' in key or 'vendor' in key or 'payee' in key:
                            supplier_col = orig
                            break

                if not amount_col:
                    for key, orig in h_lower.items():
                        if 'amount' in key or 'value' in key or 'payment' in key:
                            amount_col = orig
                            break

                if not expense_col:
                    for key, orig in h_lower.items():
                        if 'expense' in key or 'type' in key or 'category' in key:
                            expense_col = orig
                            break

                if not supplier_col or not amount_col:
                    continue

                for row in reader:
                    supplier = (row.get(supplier_col, '') or '').strip()
                    if not supplier or len(supplier) < 3:
                        continue

                    # Skip redacted/personal data
                    supplier_lower = supplier.lower()
                    if any(x in supplier_lower for x in ['redacted', 'personal data', 'individual', 'withheld']):
                        continue

                    # Get expense type and description
                    expense = (row.get(expense_col, '') or '').lower().strip() if expense_col else ''
                    desc = (row.get(desc_col, '') or '').lower().strip() if desc_col else ''
                    supplier_type = (row.get(supplier_type_col, '') or '').lower().strip() if supplier_type_col else ''
                    combined = expense + ' ' + desc

                    # Determine if this is a grant payment
                    is_grant = False

                    # Method 1: Expense type is specifically grants
                    if expense in GRANT_EXPENSE_TYPES:
                        is_grant = True

                    # Method 2: Supplier type is voluntary sector AND expense mentions grant
                    if supplier_type and any(t in supplier_type for t in VCS_SUPPLIER_TYPES):
                        if any(k in combined for k in ['grant', 'contribution', 'funding']):
                            is_grant = True

                    # Method 3: Combined text has strong grant indicators
                    if any(k in combined for k in GRANT_KEYWORDS):
                        is_grant = True

                    if not is_grant:
                        continue

                    # Exclude commercial entities
                    if any(x in supplier_lower for x in EXCLUDE_KEYWORDS):
                        # But allow if it's clearly a charity (e.g. "Age UK Limited")
                        if not any(v in supplier_lower for v in ['age uk', 'mind ', 'shelter', 'citizens advice', 'carers']):
                            continue

                    # Parse amount
                    amt_str = (row.get(amount_col, '') or '').replace(',', '').replace('£', '').replace('\xa3', '').replace('"', '').strip()
                    # Handle negative amounts (some councils use negatives for payments)
                    try:
                        amt = abs(float(amt_str))
                    except (ValueError, TypeError):
                        continue

                    if amt < 100 or amt > 50_000_000:  # Skip tiny or unreasonable amounts
                        continue

                    purpose = expense.title() if expense else (desc[:100].title() if desc else '')
                    grants[supplier]['total'] += amt
                    grants[supplier]['count'] += 1
                    if purpose:
                        grants[supplier]['purposes'].add(purpose)

                return dict(grants)

        except (UnicodeDecodeError, csv.Error):
            continue

    return {}


# ── Main ──────────────────────────────────────────────────────────────────────

def process_council(council):
    """Find spending CSV, download it, parse for grants."""
    name = council['name']
    website = council['website']
    transparency_url = council.get('transparency_url', '')

    filepath, source = try_find_spending_csv(name, website, transparency_url)
    if not filepath:
        return name, None, None

    grants = parse_spending_csv(filepath, name)
    return name, grants, source


def main():
    print("=== Download & Parse Grants from Spending CSVs ===\n")

    os.makedirs(OUT_DIR, exist_ok=True)

    councils = load_councils()
    print(f"Loaded {len(councils)} councils\n")

    # Skip councils that already have grant_payments
    # (We'll check this during enrichment, but good to know)

    results = {}
    csv_found = 0
    grants_found = 0

    print("Downloading and parsing spending CSVs...")
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(process_council, c): c for c in councils}
        done = 0
        for future in as_completed(futures):
            done += 1
            if done % 20 == 0:
                print(f"  Processed {done}/{len(councils)}... (CSVs found: {csv_found}, with grants: {grants_found})")

            name, grants, source = future.result()
            if grants is not None:
                csv_found += 1
                if grants:
                    grants_found += 1
                    results[name] = grants

    print(f"\n=== Results ===")
    print(f"CSVs downloaded: {csv_found}")
    print(f"Councils with grant data: {grants_found}")

    # Write output
    with open("parsed-grants.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["council", "rank", "recipient", "amount", "purpose"])

        for council in sorted(results.keys()):
            grants = results[council]
            sorted_grants = sorted(grants.items(), key=lambda x: x[1]['total'], reverse=True)[:15]
            for rank, (recipient, data) in enumerate(sorted_grants, 1):
                purposes = list(data['purposes'])
                purpose = purposes[0] if purposes else ''
                writer.writerow([council, rank, recipient, round(data['total']), purpose])

    total_rows = sum(min(len(g), 15) for g in results.values())
    print(f"Saved {total_rows} rows to parsed-grants.csv")

    # Show examples
    for council in ["Kent", "Birmingham", "Manchester", "Camden", "Leeds"]:
        if council in results:
            print(f"\n{council} - Top grants:")
            sorted_g = sorted(results[council].items(), key=lambda x: x[1]['total'], reverse=True)[:5]
            for name, data in sorted_g:
                print(f"  {name[:45]:45s} £{data['total']:>10,.0f}  ({data['count']} payments)")


if __name__ == "__main__":
    main()
