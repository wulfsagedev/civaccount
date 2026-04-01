#!/usr/bin/env python3
"""Restore service_spending descriptions that were accidentally removed by the blanket regex.

The regex `re.sub(r',\s*description:\s*\"[^\"]*\"(?=\s*\})', '', content)` removed
all `, description: "..."` where description was the LAST field before `}`.

This affected:
- county-councils.ts: 14 entries in Kent's service_spending (no amount field)
- districts.ts: ~33 entries in Folkestone & Hythe's services and service_spending
- london-boroughs.ts: ~8 entries in 2 boroughs' services

We extract originals from the conversation transcript.
"""

import json
import re
import sys

TRANSCRIPT = "/Users/owenfisher/.claude/projects/-Users-owenfisher-Projects-CivAccount/35ab1eae-74d8-4290-855d-0e03880fb685.jsonl"

FILES = {
    "county-councils.ts": "src/data/councils/county-councils.ts",
    "districts.ts": "src/data/councils/districts.ts",
    "london-boroughs.ts": "src/data/councils/london-boroughs.ts",
}


def find_original_content(transcript_path, target_filename):
    """Find the originalFile content for a given filename from the transcript."""
    with open(transcript_path, "r") as f:
        for i, line in enumerate(f):
            try:
                data = json.loads(line)
            except:
                continue

            tr = data.get("toolUseResult")
            if not tr or not isinstance(tr, dict):
                continue

            original = tr.get("originalFile", "")
            if not original or not isinstance(original, str):
                continue

            # Check if this originalFile is for the target filename
            file_path = tr.get("filePath", "")
            if not isinstance(file_path, str):
                continue
            if target_filename in file_path and len(original) > 10000:
                return original

    return None


def extract_name_only_descriptions(original_content):
    """Find all { name: "X", description: "Y" } entries (no amount) and return a dict."""
    # Match entries like: { name: "X", description: "Y" }
    # These are entries where description is the last field before }
    pattern = r'\{\s*name:\s*"([^"]+)",\s*description:\s*"([^"]+)"\s*\}'
    matches = re.findall(pattern, original_content)
    return {name: desc for name, desc in matches}


def restore_file(file_path, descriptions):
    """Restore descriptions in a file by finding { name: "X" } entries and adding description back."""
    with open(file_path, "r") as f:
        content = f.read()

    restored = 0
    for name, desc in descriptions.items():
        escaped_name = re.escape(name)

        # Only match entries that are MISSING description: { name: "X" }
        # Don't match entries that already have other fields
        pattern = r'(\{\s*name:\s*"' + escaped_name + r'")(\s*\})'

        # Check if this pattern exists
        if not re.search(pattern, content):
            continue

        # Escape the description
        escaped_desc = desc.replace("\\", "\\\\")

        replacement = r'\1, description: "' + escaped_desc + r'"\2'
        new_content = re.sub(pattern, replacement, content, count=1)

        if new_content != content:
            content = new_content
            restored += 1

    with open(file_path, "w") as f:
        f.write(content)

    return restored


def main():
    total = 0

    for ts_name, file_path in FILES.items():
        print(f"\nProcessing {ts_name}...")

        # Find original content from transcript
        original = find_original_content(TRANSCRIPT, ts_name)
        if not original:
            print(f"  Could not find original content for {ts_name}")
            continue

        # Extract descriptions that were in name-only entries
        descriptions = extract_name_only_descriptions(original)
        print(f"  Found {len(descriptions)} name+description entries in original")

        if not descriptions:
            continue

        # Restore them
        restored = restore_file(file_path, descriptions)
        print(f"  Restored {restored} descriptions")
        total += restored

    print(f"\nTotal restored: {total}")


if __name__ == "__main__":
    main()
