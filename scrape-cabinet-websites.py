#!/usr/bin/env python3
"""
Phase 2.2: Scrape cabinet data from council .gov.uk websites.

Strategy:
1. For each council without cabinet data:
   a. Try their councillors_url (from discovered-urls.csv) — look for cabinet links
   b. Try common cabinet page URL patterns on their .gov.uk domain
   c. For ModernGov URLs, use committee page scraping
2. Parse cabinet member names, roles, and portfolios
3. Only use .gov.uk domains

Modifies: src/data/councils/{county-councils,districts,metropolitan,unitary,london-boroughs}.ts
"""

import csv
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

TS_FILES = [
    "src/data/councils/county-councils.ts",
    "src/data/councils/districts.ts",
    "src/data/councils/metropolitan.ts",
    "src/data/councils/unitary.ts",
    "src/data/councils/london-boroughs.ts",
]

HEADERS = {
    "User-Agent": "CivAccount/2.0 (civic transparency project; contact: owen@civaccount.uk)"
}
TIMEOUT = 12


def escape_ts(s):
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ").strip()


# ── Load data ────────────────────────────────────────────────────────────────

def load_councils_needing_cabinet():
    """Find councils in TS files that don't have cabinet data."""
    needs_cabinet = set()
    for ts_file in TS_FILES:
        with open(ts_file, "r") as f:
            content = f.read()

        # Find council entries
        entries = re.finditer(
            r'\n  \{\n    ons_code: "[^"]+",\n    name: "([^"]+)"',
            content
        )
        entries = list(entries)

        for i, match in enumerate(entries):
            name = match.group(1)
            start = match.start()
            end = entries[i + 1].start() if i + 1 < len(entries) else len(content)
            section = content[start:end]

            if "cabinet:" not in section:
                needs_cabinet.add(name)

    return needs_cabinet


def load_council_websites():
    """Load council website URLs."""
    websites = {}
    with open("council-websites.csv", "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            websites[row["name"]] = row.get("website", "").strip()
    return websites


def load_councillor_urls():
    """Load discovered councillor URLs."""
    urls = {}
    try:
        with open("src/data/councils/pdfs/gov-uk-bulk-data/discovered-urls.csv") as f:
            reader = csv.DictReader(f)
            for row in reader:
                url = row.get("councillors_url", "").strip()
                if url and ".gov.uk" in url:
                    urls[row["name"]] = url
    except FileNotFoundError:
        pass
    return urls


# ── URL pattern testing ──────────────────────────────────────────────────────

def get_domain(url):
    """Extract domain from URL."""
    return url.replace("https://", "").replace("http://", "").split("/")[0]


def try_cabinet_urls(name, website):
    """Try common cabinet page URL patterns on a council website."""
    if not website or ".gov.uk" not in website:
        return None, None

    domain = get_domain(website)
    base = f"https://{domain}"

    # Common cabinet page patterns
    paths = [
        "/cabinet",
        "/your-council/cabinet",
        "/councillors-and-committees/cabinet",
        "/council-and-democracy/cabinet",
        "/council/cabinet",
        "/about/cabinet",
        "/about-the-council/cabinet",
        "/council-and-democracy/councillors-and-committees/cabinet",
        "/your-council/councillors/cabinet",
        "/council-leadership",
        "/your-council/council-leadership",
        "/your-council/cabinet-and-executive",
        "/executive",
        "/council/executive",
        "/the-cabinet",
    ]

    for path in paths:
        url = base + path
        try:
            resp = requests.get(url, timeout=TIMEOUT, headers=HEADERS, allow_redirects=True)
            if resp.status_code == 200 and len(resp.text) > 500:
                # Check if page actually contains cabinet member info
                text_lower = resp.text.lower()
                if ("cabinet" in text_lower or "executive" in text_lower) and (
                    "portfolio" in text_lower or "councillor" in text_lower or "cllr" in text_lower
                ):
                    return url, resp.text
        except Exception:
            continue

    return None, None


def try_moderngov_cabinet(councillors_url):
    """For ModernGov councillor URLs, try to find and scrape cabinet committee."""
    if "democracy." not in councillors_url and "modgov." not in councillors_url:
        return None, None

    # Extract ModernGov base URL
    domain = get_domain(councillors_url)
    moderngov_base = f"https://{domain}"

    try:
        # Get committee list
        resp = requests.get(
            moderngov_base + "/mgListCommittees.aspx",
            timeout=TIMEOUT, headers=HEADERS
        )
        if resp.status_code != 200:
            return None, None

        # Find Cabinet/Executive committee
        patterns = [
            r'href="(mgCommitteeDetails\.aspx\?ID=\d+)"[^>]*>[^<]*Cabinet[^<]*<',
            r'href="(mgCommitteeDetails\.aspx\?ID=\d+)"[^>]*>[^<]*Executive[^<]*<',
        ]

        for pattern in patterns:
            match = re.search(pattern, resp.text, re.IGNORECASE)
            if match:
                cabinet_url = moderngov_base + "/" + match.group(1)
                cabinet_resp = requests.get(cabinet_url, timeout=TIMEOUT, headers=HEADERS)
                if cabinet_resp.status_code == 200:
                    return cabinet_url, cabinet_resp.text
    except Exception:
        pass

    return None, None


# ── HTML parsing for cabinet members ─────────────────────────────────────────

def parse_moderngov_cabinet(html):
    """Parse cabinet members from a ModernGov committee page."""
    members = []
    seen = set()

    # Pattern: member links with role info in adjacent cells/text
    member_pattern = re.compile(
        r'mgUserInfo\.aspx\?UID=\d+"[^>]*>\s*([^<]+?)\s*</a>'
        r'(?:[^<]*<[^>]*>)*?'
        r'(?:\s*[-–]\s*|\s*,\s*|\s*</td>\s*<td[^>]*>\s*)'
        r'([^<]{3,100})',
        re.DOTALL
    )

    for match in member_pattern.finditer(html):
        name = re.sub(r'\s+', ' ', match.group(1)).strip()
        role_text = re.sub(r'<[^>]+>', '', match.group(2)).strip()
        role_text = re.sub(r'\s+', ' ', role_text).strip()

        if name in seen or len(name) < 3:
            continue

        role, portfolio = classify_role(name, role_text)
        seen.add(name)
        members.append({"name": name, "role": role, "portfolio": portfolio})

    # Fallback: just get names
    if len(members) < 3:
        simple = re.compile(r'mgUserInfo\.aspx\?UID=\d+"[^>]*>\s*([^<]+?)\s*</a>', re.DOTALL)
        seen2 = set()
        fallback = []
        for m in simple.finditer(html):
            name = re.sub(r'\s+', ' ', m.group(1)).strip()
            if name and name not in seen2 and len(name) > 3:
                seen2.add(name)
                fallback.append({"name": name, "role": "Cabinet Member", "portfolio": "Cabinet Member"})
        if len(fallback) > len(members):
            members = fallback

    return members[:15]


def parse_council_cabinet_page(html):
    """Parse cabinet members from a generic council .gov.uk page."""
    members = []
    seen = set()

    # Strategy 1: Look for structured cabinet member blocks
    # Many council sites use heading + description patterns
    # e.g., <h3>Cllr Name</h3><p>Portfolio description</p>
    # or <strong>Cllr Name</strong> - Portfolio

    # Try: heading tags with councillor names followed by portfolio text
    heading_pattern = re.compile(
        r'<h[2-4][^>]*>\s*(?:<[^>]*>)*\s*'
        r'((?:Cllr|Councillor|Coun)\s+[A-Z][^<]{3,60}?)\s*'
        r'(?:</[^>]*>)*\s*</h[2-4]>'
        r'\s*(?:<[^>]*>\s*)*'
        r'([^<]{5,100})',
        re.DOTALL | re.IGNORECASE
    )

    for match in heading_pattern.finditer(html):
        name = re.sub(r'\s+', ' ', match.group(1)).strip()
        portfolio = re.sub(r'<[^>]+>', '', match.group(2)).strip()
        portfolio = re.sub(r'\s+', ' ', portfolio).strip()

        if name in seen or len(name) < 5:
            continue

        role, port = classify_role(name, portfolio)
        seen.add(name)
        members.append({"name": name, "role": role, "portfolio": port})

    # Strategy 2: <li> or <div> with "Cllr Name - Portfolio" pattern
    if len(members) < 3:
        li_pattern = re.compile(
            r'((?:Cllr|Councillor|Coun)\.?\s+[A-Z][a-zA-Z\s\'-]+?)'
            r'\s*[-–:]\s*'
            r'([A-Z][^<\n]{5,100})',
            re.MULTILINE
        )
        for match in li_pattern.finditer(html):
            name = re.sub(r'\s+', ' ', match.group(1)).strip()
            portfolio = re.sub(r'\s+', ' ', match.group(2)).strip()

            if name in seen or len(name) < 5:
                continue

            role, port = classify_role(name, portfolio)
            seen.add(name)
            members.append({"name": name, "role": role, "portfolio": port})

    # Strategy 3: Links containing councillor names
    if len(members) < 3:
        link_pattern = re.compile(
            r'<a[^>]+href="[^"]*councillor[^"]*"[^>]*>\s*'
            r'((?:Cllr|Councillor)\.?\s+[^<]{3,60}?)\s*</a>'
            r'(?:[^<]*<[^>]*>)*?\s*'
            r'([^<]{5,100})',
            re.DOTALL | re.IGNORECASE
        )
        for match in link_pattern.finditer(html):
            name = re.sub(r'\s+', ' ', match.group(1)).strip()
            portfolio = re.sub(r'<[^>]+>', '', match.group(2)).strip()
            portfolio = re.sub(r'\s+', ' ', portfolio).strip()

            if name in seen or len(name) < 5:
                continue

            role, port = classify_role(name, portfolio)
            seen.add(name)
            members.append({"name": name, "role": role, "portfolio": port})

    return members[:15]


def classify_role(name, text):
    """Classify role and extract portfolio from text."""
    role = "Cabinet Member"
    portfolio = text.strip()

    lower = text.lower()
    if "leader" in lower and "deputy" in lower:
        role = "Deputy Leader"
    elif "leader" in lower and "cabinet" not in lower:
        role = "Leader"
    elif "deputy" in lower:
        role = "Deputy Leader"

    # Clean up portfolio
    portfolio = portfolio.strip("- –:,")
    if len(portfolio) > 80:
        portfolio = portfolio[:77] + "..."
    if not portfolio or len(portfolio) < 3:
        portfolio = role

    return role, portfolio


# ── Main scraping pipeline ───────────────────────────────────────────────────

def scrape_council(name, website, councillors_url):
    """Try all methods to get cabinet data for a council."""
    members = []

    # Method 1: If councillors_url is ModernGov, use committee scraping
    if councillors_url and ("democracy." in councillors_url or "modgov." in councillors_url):
        url, html = try_moderngov_cabinet(councillors_url)
        if html:
            members = parse_moderngov_cabinet(html)
            if members:
                return name, members, "moderngov"

    # Method 2: Try common cabinet page URLs on council website
    if website:
        url, html = try_cabinet_urls(name, website)
        if html:
            members = parse_council_cabinet_page(html)
            if members:
                return name, members, "cabinet-page"

    # Method 3: Try councillors page for cabinet member info
    if councillors_url and ".gov.uk" in councillors_url:
        try:
            resp = requests.get(councillors_url, timeout=TIMEOUT, headers=HEADERS)
            if resp.status_code == 200:
                # Look for cabinet section or filter
                if "cabinet" in resp.text.lower():
                    members = parse_council_cabinet_page(resp.text)
                    if members:
                        return name, members, "councillors-page"
        except Exception:
            pass

    return name, [], "none"


# ── Generate TypeScript ──────────────────────────────────────────────────────

def generate_cabinet_block(members):
    lines = ["      cabinet: ["]
    for m in members:
        name = escape_ts(m["name"])
        role = escape_ts(m["role"])
        portfolio = escape_ts(m["portfolio"])
        if not portfolio:
            portfolio = role
        lines.append(f'        {{ name: "{name}", role: "{role}", portfolio: "{portfolio}" }},')
    lines.append("      ],")
    return "\n".join(lines)


def enrich_file(ts_file, cabinet_data):
    with open(ts_file, "r") as f:
        content = f.read()

    council_pattern = re.compile(
        r'\n  \{\n    ons_code: "[^"]+",\n    name: "([^"]+)"',
    )
    matches = list(council_pattern.finditer(content))
    added = 0

    for i in range(len(matches) - 1, -1, -1):
        match = matches[i]
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        section = content[start:end]
        name = match.group(1)

        if "cabinet:" in section:
            continue

        if name not in cabinet_data or not cabinet_data[name]:
            continue

        block = generate_cabinet_block(cabinet_data[name])

        # Insert before sources: or last_verified:
        insert_match = re.search(r'^(\s+)sources:', section, re.MULTILINE)
        if not insert_match:
            insert_match = re.search(r'^(\s+)last_verified:', section, re.MULTILINE)
        if not insert_match:
            insert_match = re.search(r'^(\s+)service_outcomes:', section, re.MULTILINE)
        if not insert_match:
            continue

        insert_pos = start + insert_match.start()
        content = content[:insert_pos] + block + "\n" + content[insert_pos:]
        added += 1

    if added > 0:
        with open(ts_file, "w") as f:
            f.write(content)

    return added


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=== Phase 2.2: Council Website Cabinet Scraping ===\n")

    # Load data
    needs_cabinet = load_councils_needing_cabinet()
    websites = load_council_websites()
    councillor_urls = load_councillor_urls()

    print(f"Councils needing cabinet data: {len(needs_cabinet)}")
    print(f"Council websites available: {len(websites)}")
    print(f"Councillor URLs available: {len(councillor_urls)}")

    # Scrape
    cabinet_data = {}
    method_counts = {"moderngov": 0, "cabinet-page": 0, "councillors-page": 0, "none": 0}

    print(f"\nScraping cabinet data...")

    with ThreadPoolExecutor(max_workers=15) as executor:
        futures = {}
        for name in needs_cabinet:
            website = websites.get(name, "")
            councillors_url = councillor_urls.get(name, "")
            if website or councillors_url:
                futures[executor.submit(scrape_council, name, website, councillors_url)] = name

        done = 0
        for future in as_completed(futures):
            done += 1
            name, members, method = future.result()
            method_counts[method] += 1
            if members:
                cabinet_data[name] = members
                print(f"  + {name} ({len(members)} members via {method})")
            if done % 50 == 0:
                print(f"  Progress: {done}/{len(futures)}...")

    print(f"\n  Results by method:")
    for method, count in method_counts.items():
        print(f"    {method}: {count}")
    print(f"  Total councils with cabinet data: {len(cabinet_data)}")

    if not cabinet_data:
        print("\nNo new cabinet data found. Exiting.")
        return

    # Show sample
    for name in list(cabinet_data.keys())[:5]:
        print(f"\n  {name}:")
        for m in cabinet_data[name][:4]:
            print(f"    - {m['name']} ({m['role']}: {m['portfolio']})")

    # Enrich TS files
    print(f"\nEnriching TypeScript files...")
    total_added = 0

    for ts_file in TS_FILES:
        added = enrich_file(ts_file, cabinet_data)
        print(f"  {ts_file}: {added} councils enriched")
        total_added += added

    print(f"\n=== Summary ===")
    print(f"Councils scraped with cabinet data: {len(cabinet_data)}")
    print(f"Councils enriched in TS files: {total_added}")

    # TypeScript check
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
