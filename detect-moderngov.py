#!/usr/bin/env python3
"""
Detect which councils use Modern.gov for their committee management.
Tests common URL patterns and outputs a CSV of detected councils with their
Modern.gov base URLs.
"""

import csv
import re
import sys
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

PROJECT_ROOT = Path(__file__).parent
COUNCIL_DIR = PROJECT_ROOT / 'src/data/councils'
DATA_DIR = PROJECT_ROOT / 'src/data/councils/pdfs/gov-uk-bulk-data'

SESSION = requests.Session()
SESSION.headers.update({
    'User-Agent': 'Mozilla/5.0 (compatible; CivAccountBot/1.0)',
})


def check_url(url, timeout=8):
    """Check if a URL returns 200."""
    try:
        resp = SESSION.head(url, timeout=timeout, allow_redirects=True)
        if resp.status_code == 200:
            return resp.url
        if resp.status_code in (403, 405, 501):
            resp = SESSION.get(url, timeout=timeout, allow_redirects=True, stream=True)
            resp.close()
            if resp.status_code == 200:
                return resp.url
    except (requests.ConnectionError, requests.Timeout, requests.TooManyRedirects, Exception):
        pass
    return None


def extract_domain_slug(website):
    """Extract the slug from a council website URL for moderngov subdomain testing."""
    # https://www.councilname.gov.uk -> councilname
    import re
    m = re.match(r'https?://(?:www\.)?([^.]+)\.gov\.uk', website)
    if m:
        return m.group(1)
    return None


def detect_moderngov(council):
    """Try to find a council's Modern.gov installation."""
    name = council['name']
    website = council['website']
    slug = extract_domain_slug(website)

    if not slug:
        return name, None

    # Common patterns for Modern.gov installations
    patterns = [
        f'https://{slug}.moderngov.co.uk/mgMemberIndex.aspx',
        f'https://democracy.{slug}.gov.uk/mgMemberIndex.aspx',
        f'https://modgov.{slug}.gov.uk/mgMemberIndex.aspx',
        f'https://committeepapers.{slug}.gov.uk/mgMemberIndex.aspx',
        f'https://council.{slug}.gov.uk/mgMemberIndex.aspx',
    ]

    for url in patterns:
        result = check_url(url)
        if result and 'mgMemberIndex' in result:
            # Extract base URL (everything before mgMemberIndex)
            base = result.split('mgMemberIndex')[0]
            return name, base

    return name, None


def load_councils():
    """Load council data."""
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
            councils.append({
                'name': name,
                'file': fn,
                'website': website_match.group(1) if website_match else '',
                'has_cabinet': 'cabinet:' in chunk,
            })
    return councils


def main():
    print("=== Modern.gov Detection ===\n", flush=True)

    councils = load_councils()
    # Only check councils missing cabinet data
    needs_check = [c for c in councils if not c['has_cabinet']]
    print(f"Checking {len(needs_check)} councils for Modern.gov installations...\n", flush=True)

    detected = []
    done = 0
    total = len(needs_check)

    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(detect_moderngov, c): c for c in needs_check}
        for future in as_completed(futures):
            name, base_url = future.result()
            done += 1
            if base_url:
                detected.append({'name': name, 'moderngov_url': base_url})
                print(f"  [{done}/{total}] ✓ {name}: {base_url}", flush=True)
            elif done % 30 == 0:
                print(f"  [{done}/{total}] progress...", flush=True)

    print(f"\n=== Results ===")
    print(f"Councils with Modern.gov: {len(detected)}")

    # Write CSV
    output_path = DATA_DIR / 'moderngov-councils.csv'
    with open(output_path, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['name', 'moderngov_url'])
        w.writeheader()
        for d in sorted(detected, key=lambda x: x['name']):
            w.writerow(d)

    print(f"Saved to {output_path}")


if __name__ == '__main__':
    main()
