#!/usr/bin/env python3
"""
Auto-discover transparency, councillors, and budget URLs for councils
by testing common URL patterns against each council's website.

Outputs a CSV of discovered URLs for batch insertion.
Uses HEAD requests with short timeouts for speed.
"""

import csv
import re
import sys
import time
import json
from pathlib import Path
from urllib.parse import urljoin
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import requests
except ImportError:
    print("Installing requests...")
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'requests'])
    import requests

PROJECT_ROOT = Path(__file__).parent
COUNCIL_DIR = PROJECT_ROOT / 'src/data/councils'
DATA_DIR = PROJECT_ROOT / 'src/data/councils/pdfs/gov-uk-bulk-data'

# Common URL path patterns for each field
TRANSPARENCY_PATTERNS = [
    '/transparency',
    '/council/transparency',
    '/about-the-council/transparency',
    '/your-council/transparency',
    '/council-and-democracy/transparency',
    '/about/transparency',
    '/council/spending-and-transparency',
    '/about-us/transparency',
    '/open-data',
    '/about-the-councils/open-data',
    '/council-and-democracy/budgets-and-spending',
    '/your-council/budgets-and-spending',
    '/council/budgets-and-spending',
    '/about-council/budgets-and-spending',
    '/council-budgets-and-spending',
    '/council-and-democracy/council-budgets-and-spending',
    '/about-your-council/budgets-spending',
    '/the-council-and-democracy/budgets-and-spending',
    '/council-and-mayor/council-spending-and-performance',
]

COUNCILLORS_PATTERNS = [
    '/councillors',
    '/your-councillors',
    '/find-your-councillor',
    '/council/councillors',
    '/council-and-democracy/councillors',
    '/your-council/councillors',
    '/about-council/councillors',
    '/councillors-and-committees/councillors',
    '/council-and-democracy/councillors-and-committees',
    '/democracy/councillors',
    '/members',
]

BUDGET_PATTERNS = [
    '/budget',
    '/council/budget',
    '/budgets',
    '/council/finance/budget',
    '/your-council/finance/budget',
    '/council-and-democracy/budgets-and-spending/budget',
    '/about-council/budget',
    '/council-tax-and-finance/budget',
]

SESSION = requests.Session()
SESSION.headers.update({
    'User-Agent': 'Mozilla/5.0 (compatible; CivAccountBot/1.0; +https://github.com/civaccount)',
})


def check_url(url, timeout=8):
    """Check if a URL returns 200 (following redirects)."""
    try:
        resp = SESSION.head(url, timeout=timeout, allow_redirects=True)
        if resp.status_code == 200:
            return resp.url  # Return final URL after redirects
        # Some servers don't support HEAD, try GET
        if resp.status_code in (403, 405, 501):
            resp = SESSION.get(url, timeout=timeout, allow_redirects=True, stream=True)
            resp.close()
            if resp.status_code == 200:
                return resp.url
    except (requests.ConnectionError, requests.Timeout, requests.TooManyRedirects):
        pass
    return None


def discover_url(website, patterns):
    """Try URL patterns against a website, return first working URL."""
    for pattern in patterns:
        url = website.rstrip('/') + pattern
        result = check_url(url)
        if result:
            return result
    return None


def load_councils():
    """Load council names, websites, and existing URL fields."""
    councils = []
    for fn in ['county-councils.ts', 'districts.ts', 'metropolitan.ts', 'unitary.ts', 'london-boroughs.ts']:
        path = COUNCIL_DIR / fn
        if not path.exists():
            continue
        content = open(path, 'r', encoding='utf-8').read()
        names = re.findall(r'^\s{4}name:\s*"([^"]+)"', content, re.MULTILINE)

        for name in names:
            idx = content.find(f'    name: "{name}"')
            next_c = content.find('ons_code:', idx + 20)
            if next_c == -1:
                next_c = len(content)
            chunk = content[idx:next_c]

            website_match = re.search(r'website:\s*"([^"]+)"', chunk)
            website = website_match.group(1) if website_match else ''

            councils.append({
                'file': fn,
                'name': name,
                'website': website,
                'has_transparency': 'transparency_url:' in chunk,
                'has_councillors': 'councillors_url:' in chunk,
                'has_budget': 'budget_url:' in chunk,
            })
    return councils


def discover_single(council):
    """Discover URLs for a single council."""
    name = council['name']
    website = council['website']
    if not website:
        return name, None, None, None

    results = {}

    if not council['has_transparency']:
        results['transparency'] = discover_url(website, TRANSPARENCY_PATTERNS)

    if not council['has_councillors']:
        results['councillors'] = discover_url(website, COUNCILLORS_PATTERNS)

    if not council['has_budget']:
        results['budget'] = discover_url(website, BUDGET_PATTERNS)

    return (
        name,
        results.get('transparency'),
        results.get('councillors'),
        results.get('budget'),
    )


def main():
    print("=== URL Auto-Discovery ===\n")

    councils = load_councils()
    print(f"Loaded {len(councils)} councils\n")

    # Filter to only councils that need URL discovery
    needs_work = [c for c in councils if not c['has_transparency'] or not c['has_councillors'] or not c['has_budget']]
    print(f"Councils needing URL discovery: {len(needs_work)}")
    print(f"  Missing transparency_url: {sum(1 for c in councils if not c['has_transparency'])}")
    print(f"  Missing councillors_url: {sum(1 for c in councils if not c['has_councillors'])}")
    print(f"  Missing budget_url: {sum(1 for c in councils if not c['has_budget'])}")
    print()

    # Run discovery with thread pool (10 threads for manageable load)
    results = []
    total = len(needs_work)
    done = 0

    print(f"Checking URLs for {total} councils (10 threads)...")
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(discover_single, c): c for c in needs_work}
        for future in as_completed(futures):
            name, transparency, councillors, budget = future.result()
            done += 1
            found = sum(1 for x in [transparency, councillors, budget] if x)
            if found:
                print(f"  [{done}/{total}] {name}: +{found} URLs found")
            elif done % 25 == 0:
                print(f"  [{done}/{total}] progress...")
            results.append({
                'name': name,
                'transparency_url': transparency or '',
                'councillors_url': councillors or '',
                'budget_url': budget or '',
            })

    # Write results CSV
    output_path = DATA_DIR / 'discovered-urls.csv'
    with open(output_path, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['name', 'transparency_url', 'councillors_url', 'budget_url'])
        w.writeheader()
        for r in sorted(results, key=lambda x: x['name']):
            if any(r[k] for k in ['transparency_url', 'councillors_url', 'budget_url']):
                w.writerow(r)

    # Summary
    found_transparency = sum(1 for r in results if r['transparency_url'])
    found_councillors = sum(1 for r in results if r['councillors_url'])
    found_budget = sum(1 for r in results if r['budget_url'])

    print(f"\n=== Results ===")
    print(f"  Transparency URLs discovered: {found_transparency}")
    print(f"  Councillors URLs discovered: {found_councillors}")
    print(f"  Budget URLs discovered: {found_budget}")
    print(f"  Total new URLs: {found_transparency + found_councillors + found_budget}")
    print(f"\nSaved to {output_path}")


if __name__ == '__main__':
    main()
