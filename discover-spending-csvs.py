#!/usr/bin/env python3
"""
Phase 1: Discover spending CSV URLs for all English councils.

Two approaches combined:
1. Query data.gov.uk CKAN API for spending datasets
2. Test common URL patterns on council websites

Output: spending-csv-urls.csv with columns: name, url, source, type
"""

import csv
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse

import requests

TIMEOUT = 15
HEADERS = {
    "User-Agent": "CivAccount/2.0 (civic transparency project; contact: owen@civaccount.uk)"
}

# ── data.gov.uk CKAN API ──────────────────────────────────────────────────────

def search_datagov(council_name, council_website):
    """Search data.gov.uk for spending datasets published by this council."""
    results = []

    # Try searching by council name
    queries = [
        f'"{council_name}" spending over 500',
        f'"{council_name}" expenditure 500',
        f'"{council_name}" transparency spending',
    ]

    # Also try by publisher slug derived from website
    domain = urlparse(council_website).hostname or ""
    slug = domain.replace("www.", "").replace(".gov.uk", "").replace(".", "-")

    seen_urls = set()

    for q in queries[:1]:  # Just use first query to save API calls
        try:
            resp = requests.get(
                "https://data.gov.uk/api/action/package_search",
                params={"q": q, "rows": 5},
                timeout=TIMEOUT,
                headers=HEADERS,
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("success"):
                    for pkg in data["result"]["results"]:
                        for res in pkg.get("resources", []):
                            url = res.get("url", "")
                            fmt = (res.get("format", "") or "").upper()
                            if fmt in ("CSV", "XLS", "XLSX", "ODS") and url not in seen_urls:
                                seen_urls.add(url)
                                results.append({
                                    "name": council_name,
                                    "url": url,
                                    "source": "data.gov.uk",
                                    "type": "spending",
                                    "format": fmt,
                                    "title": res.get("name", pkg.get("title", "")),
                                })
        except Exception:
            pass

    return results


# ── Direct URL pattern testing ────────────────────────────────────────────────

def get_slug(website):
    """Extract the council slug from website URL."""
    domain = urlparse(website).hostname or ""
    # e.g. www.kent.gov.uk -> kent, go.walsall.gov.uk -> walsall
    parts = domain.replace(".gov.uk", "").split(".")
    # Take last part before .gov.uk, skip www/go
    for p in reversed(parts):
        if p not in ("www", "go", "my", "new"):
            return p
    return parts[-1]


SPENDING_URL_PATTERNS = [
    # Direct CSV download patterns
    "{website}/open-data/spending",
    "{website}/open-data/spending-over-500",
    "{website}/opendata/spending",
    "{website}/transparency/spending",
    "{website}/transparency/spending-over-500",
    "{website}/council/transparency/spending-over-500",
    "{website}/downloads/spending",
    "{website}/info/200109/open_data/2024/expenditure_over_500",
    "{website}/your-council/transparency/spending-over-500",
    "{website}/council-and-democracy/transparency/spending-over-500",
    "{website}/about-the-council/transparency/spending",
    "{website}/about-the-council/budgets-and-spending/spending-over-500",
    "{website}/council/spending-and-budgets/spending-over-500",
    "{website}/the-council/performance-and-spending/spending-over-500",
    "{website}/your-council/budgets-and-finance/spending-over-500",
    # data.gov.uk pattern
    "https://data.{slug}.gov.uk",
    # Open data portals
    "{website}/open",
    "{website}/open-data",
    "{website}/opendata",
]

GRANTS_URL_PATTERNS = [
    "{website}/transparency/grants",
    "{website}/open-data/grants",
    "{website}/council/transparency/grants-to-voluntary-organisations",
    "{website}/about-the-council/transparency/grants",
    "{website}/your-council/transparency/grants",
]


def test_url(url):
    """Test if a URL returns a valid response."""
    try:
        resp = requests.head(url, timeout=TIMEOUT, headers=HEADERS, allow_redirects=True)
        if resp.status_code == 200:
            return True
        # Try GET if HEAD fails (some servers don't support HEAD)
        if resp.status_code in (403, 405):
            resp = requests.get(url, timeout=TIMEOUT, headers=HEADERS, allow_redirects=True, stream=True)
            return resp.status_code == 200
    except Exception:
        pass
    return False


def discover_spending_urls(council_name, website):
    """Test spending URL patterns for a single council."""
    results = []
    slug = get_slug(website)
    website = website.rstrip("/")

    for pattern in SPENDING_URL_PATTERNS:
        url = pattern.format(website=website, slug=slug)
        if test_url(url):
            results.append({
                "name": council_name,
                "url": url,
                "source": "url_pattern",
                "type": "spending_page",
            })
            break  # One spending URL is enough

    for pattern in GRANTS_URL_PATTERNS:
        url = pattern.format(website=website, slug=slug)
        if test_url(url):
            results.append({
                "name": council_name,
                "url": url,
                "source": "url_pattern",
                "type": "grants_page",
            })
            break

    return results


# ── Also try the transparency_url we already have ─────────────────────────────

def check_transparency_for_spending(council_name, transparency_url):
    """Check if a known transparency URL leads to spending data."""
    if not transparency_url:
        return []

    results = []
    # The transparency URL itself is a good starting point
    results.append({
        "name": council_name,
        "url": transparency_url,
        "source": "existing_transparency_url",
        "type": "transparency_page",
    })
    return results


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=== Phase 1: Discover Spending CSV URLs ===\n")

    # Load councils
    councils = []
    with open("council-websites.csv", "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            councils.append(row)

    print(f"Loaded {len(councils)} councils\n")

    all_results = []

    # Step 1: Check existing transparency URLs
    print("Step 1: Checking existing transparency URLs...")
    for c in councils:
        results = check_transparency_for_spending(c["name"], c["transparency_url"])
        all_results.extend(results)
    existing = len([r for r in all_results if r["source"] == "existing_transparency_url"])
    print(f"  Found {existing} councils with existing transparency URLs\n")

    # Step 2: Test URL patterns (parallel)
    print("Step 2: Testing spending URL patterns (parallel)...")
    councils_without = [c for c in councils if not c["transparency_url"]]
    found_patterns = 0

    with ThreadPoolExecutor(max_workers=15) as executor:
        futures = {
            executor.submit(discover_spending_urls, c["name"], c["website"]): c
            for c in councils
        }
        done = 0
        for future in as_completed(futures):
            done += 1
            if done % 50 == 0:
                print(f"  Tested {done}/{len(councils)}...")
            results = future.result()
            if results:
                found_patterns += len(results)
            all_results.extend(results)

    print(f"  Found {found_patterns} URLs via pattern testing\n")

    # Step 3: Query data.gov.uk API
    print("Step 3: Querying data.gov.uk CKAN API...")
    datagov_count = 0

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {
            executor.submit(search_datagov, c["name"], c["website"]): c
            for c in councils
        }
        done = 0
        for future in as_completed(futures):
            done += 1
            if done % 50 == 0:
                print(f"  Queried {done}/{len(councils)}...")
            results = future.result()
            if results:
                datagov_count += len(results)
            all_results.extend(results)

    print(f"  Found {datagov_count} datasets on data.gov.uk\n")

    # Deduplicate by council name + type
    seen = set()
    unique_results = []
    for r in all_results:
        key = (r["name"], r.get("type", ""))
        if key not in seen:
            seen.add(key)
            unique_results.append(r)

    # Write output
    with open("spending-csv-urls.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["name", "url", "source", "type", "format", "title"])
        writer.writeheader()
        for r in unique_results:
            writer.writerow({
                "name": r.get("name", ""),
                "url": r.get("url", ""),
                "source": r.get("source", ""),
                "type": r.get("type", ""),
                "format": r.get("format", ""),
                "title": r.get("title", ""),
            })

    # Summary
    councils_with_any = set(r["name"] for r in unique_results)
    councils_with_spending = set(r["name"] for r in unique_results if "spending" in r.get("type", ""))
    councils_with_grants = set(r["name"] for r in unique_results if "grant" in r.get("type", ""))
    councils_with_datagov = set(r["name"] for r in unique_results if r.get("source") == "data.gov.uk")

    print(f"=== RESULTS ===")
    print(f"Councils with any URL found: {len(councils_with_any)}/317")
    print(f"  - Spending page URLs: {len(councils_with_spending)}")
    print(f"  - Grants page URLs: {len(councils_with_grants)}")
    print(f"  - data.gov.uk datasets: {len(councils_with_datagov)}")
    print(f"\nSaved to spending-csv-urls.csv")


if __name__ == "__main__":
    main()
