#!/usr/bin/env python3
"""
Batch 5: Detect ModernGov instances and scrape cabinet member data.

Strategy:
1. Load known ModernGov URLs from moderngov-councils.csv
2. Test additional councils with common URL patterns (democracy.{slug}.gov.uk)
3. For each detected instance, find the Cabinet/Executive committee
4. Scrape member names, roles, and portfolios
5. Only scrape .gov.uk domains

Data source: Council .gov.uk ModernGov democracy portals

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
TIMEOUT = 10


def escape_ts(s):
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ").strip()


# ── Load council data ────────────────────────────────────────────────────────

def load_council_names():
    """Load all council names and websites."""
    councils = {}
    with open("council-websites.csv", "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            councils[row["name"]] = row.get("website", "")
    return councils


def load_known_moderngov():
    """Load already-known ModernGov URLs."""
    known = {}
    try:
        with open("src/data/councils/pdfs/gov-uk-bulk-data/moderngov-councils.csv") as f:
            reader = csv.DictReader(f)
            for row in reader:
                known[row["name"]] = row["moderngov_url"].rstrip("/")
    except FileNotFoundError:
        pass
    return known


# ── Detect ModernGov instances ───────────────────────────────────────────────

def slugify(name):
    """Convert council name to URL slug."""
    s = name.lower().strip()
    s = s.replace(" & ", "-").replace("&", "-")
    s = s.replace("'", "").replace(",", "")
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s


def test_moderngov_url(name, url):
    """Test if a ModernGov URL is valid."""
    try:
        resp = requests.get(url + "/mgListCommittees.aspx", timeout=TIMEOUT,
                           headers=HEADERS, allow_redirects=True)
        if resp.status_code == 200 and "mgCommitteeDetails" in resp.text:
            return name, url
    except Exception:
        pass
    return name, None


def detect_moderngov_instances(council_names, known):
    """Expand ModernGov detection to more councils."""
    to_test = {}

    for name in council_names:
        if name in known:
            continue  # Already known

        slug = slugify(name)
        # Try common patterns — only .gov.uk domains
        urls_to_try = [
            f"https://democracy.{slug}.gov.uk",
        ]

        # Handle special cases
        website = council_names[name]
        if website:
            # Extract domain from website
            domain = website.replace("https://", "").replace("http://", "").split("/")[0]
            domain = domain.replace("www.", "")
            # Try democracy.{domain}
            urls_to_try.append(f"https://democracy.{domain}")

        to_test[name] = urls_to_try

    print(f"  Testing {len(to_test)} councils for ModernGov...")
    detected = dict(known)

    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = []
        for name, urls in to_test.items():
            for url in urls:
                # Only test .gov.uk domains
                if ".gov.uk" not in url:
                    continue
                futures.append(executor.submit(test_moderngov_url, name, url))

        done = 0
        for future in as_completed(futures):
            done += 1
            name, url = future.result()
            if url and name not in detected:
                detected[name] = url

    print(f"  Total ModernGov instances: {len(detected)} (was {len(known)})")
    return detected


# ── Scrape Cabinet/Executive committee ───────────────────────────────────────

def find_cabinet_committee(moderngov_url):
    """Find the Cabinet or Executive committee page URL."""
    try:
        resp = requests.get(moderngov_url + "/mgListCommittees.aspx",
                           timeout=TIMEOUT, headers=HEADERS)
        if resp.status_code != 200:
            return None

        text = resp.text
        # Look for Cabinet or Executive committee links
        patterns = [
            r'href="(mgCommitteeDetails\.aspx\?ID=\d+)"[^>]*>[^<]*Cabinet[^<]*<',
            r'href="(mgCommitteeDetails\.aspx\?ID=\d+)"[^>]*>[^<]*Executive[^<]*<',
            r'href="(mgCommitteeDetails\.aspx\?ID=\d+)"[^>]*>[^<]*cabinet[^<]*<',
            r'href="(mgCommitteeDetails\.aspx\?ID=\d+)"[^>]*>[^<]*executive[^<]*<',
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return moderngov_url + "/" + match.group(1)

        return None
    except Exception:
        return None


def scrape_cabinet_members(cabinet_url):
    """Scrape cabinet members from a ModernGov committee page."""
    try:
        resp = requests.get(cabinet_url, timeout=TIMEOUT, headers=HEADERS)
        if resp.status_code != 200:
            return []

        text = resp.text
        members = []

        # ModernGov committee pages list members in a consistent format
        # Pattern 1: <a href="mgUserInfo.aspx?UID=...">Name</a> ... role text
        # Pattern 2: Table rows with member info

        # Try to find member links
        member_pattern = re.compile(
            r'mgUserInfo\.aspx\?UID=\d+"[^>]*>([^<]+)</a>'
            r'(?:[^<]*<[^>]*>)*?'
            r'(?:\s*[-–]\s*|\s*,\s*|\s*</td>\s*<td[^>]*>\s*)'
            r'([^<]{3,80})',
            re.DOTALL
        )

        seen_names = set()
        for match in member_pattern.finditer(text):
            name = match.group(1).strip()
            role_text = match.group(2).strip()

            # Clean up name
            name = re.sub(r'\s+', ' ', name).strip()
            if name in seen_names or len(name) < 3:
                continue

            # Clean up role
            role_text = re.sub(r'<[^>]+>', '', role_text).strip()
            role_text = re.sub(r'\s+', ' ', role_text).strip()

            # Determine role and portfolio
            role = "Cabinet Member"
            portfolio = role_text

            lower = role_text.lower()
            if "leader" in lower and "deputy" in lower:
                role = "Deputy Leader"
            elif "leader" in lower:
                role = "Leader"
            elif "deputy" in lower:
                role = "Deputy Leader"

            # Truncate long portfolios
            if len(portfolio) > 80:
                portfolio = portfolio[:77] + "..."

            seen_names.add(name)
            members.append({
                "name": name,
                "role": role,
                "portfolio": portfolio,
            })

        # If regex approach got too few results, try simpler extraction
        if len(members) < 3:
            # Simpler: just get all mgUserInfo links
            simple_pattern = re.compile(
                r'mgUserInfo\.aspx\?UID=\d+"[^>]*>\s*([^<]+?)\s*</a>',
                re.DOTALL
            )
            simple_members = []
            seen = set()
            for m in simple_pattern.finditer(text):
                name = m.group(1).strip()
                name = re.sub(r'\s+', ' ', name)
                if name and name not in seen and len(name) > 3 and not name.startswith("http"):
                    seen.add(name)
                    simple_members.append({
                        "name": name,
                        "role": "Cabinet Member",
                        "portfolio": "",
                    })

            if len(simple_members) > len(members):
                members = simple_members

        return members[:15]  # Cap at 15 members
    except Exception:
        return []


def scrape_council_cabinet(name, moderngov_url):
    """Full pipeline: find cabinet committee, then scrape members."""
    cabinet_url = find_cabinet_committee(moderngov_url)
    if not cabinet_url:
        return name, []

    members = scrape_cabinet_members(cabinet_url)
    return name, members


# ── Generate TypeScript block ────────────────────────────────────────────────

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


# ── Enrich TS files ──────────────────────────────────────────────────────────

def enrich_file(ts_file, cabinet_data):
    with open(ts_file, "r") as f:
        content = f.read()

    council_pattern = re.compile(r'^\s+name:\s+"([^"]+)",', re.MULTILINE)
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
            continue

        insert_pos = start + insert_match.start()
        content = content[:insert_pos] + block + "\n\n" + content[insert_pos:]
        added += 1

    if added > 0:
        with open(ts_file, "w") as f:
            f.write(content)

    return added


def main():
    print("=== Batch 5: ModernGov Cabinet Scraping ===\n")

    council_names = load_council_names()
    known = load_known_moderngov()
    print(f"Known ModernGov instances: {len(known)}")

    # Step 1: Expand detection
    print("\nStep 1: Detecting ModernGov instances...")
    all_moderngov = detect_moderngov_instances(council_names, known)

    # Step 2: Scrape cabinet members
    print(f"\nStep 2: Scraping cabinet data from {len(all_moderngov)} councils...")
    cabinet_data = {}

    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(scrape_council_cabinet, name, url): name
                   for name, url in all_moderngov.items()}

        done = 0
        for future in as_completed(futures):
            done += 1
            name, members = future.result()
            if members:
                cabinet_data[name] = members
            if done % 20 == 0:
                print(f"  Scraped {done}/{len(all_moderngov)}... ({len(cabinet_data)} with cabinet data)")

    print(f"\n  Councils with cabinet data: {len(cabinet_data)}")

    # Show sample
    for name in list(cabinet_data.keys())[:3]:
        print(f"\n  {name}:")
        for m in cabinet_data[name][:3]:
            print(f"    - {m['name']} ({m['role']})")

    # Step 3: Enrich TS files
    print(f"\nStep 3: Enriching TypeScript files...")
    total_added = 0

    for ts_file in TS_FILES:
        added = enrich_file(ts_file, cabinet_data)
        print(f"  {ts_file}: {added} councils enriched")
        total_added += added

    print(f"\n=== Summary ===")
    print(f"ModernGov instances detected: {len(all_moderngov)}")
    print(f"Councils with cabinet data scraped: {len(cabinet_data)}")
    print(f"Councils enriched with cabinet: {total_added}")

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
