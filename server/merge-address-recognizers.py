#!/usr/bin/env python3
"""
Insert the address recognizers into an existing Presidio recognizer-registry YAML.

Your analyzer already runs a customised registry (PersonalausweisRecognizer,
KfzKennzeichenRecognizer, DeutscheSteuerIdRecognizer …), so this appends to the
`recognizers:` list instead of replacing the file: comments, ordering and every
existing entry are preserved byte for byte.

The script writes a candidate file and validates it. It only replaces the
original when you pass --apply, and always keeps a timestamped backup.

    python3 merge-address-recognizers.py default_recognizers.yaml
    python3 merge-address-recognizers.py default_recognizers.yaml --apply

Requires PyYAML (present in the analyzer image; on a bare host: pip install pyyaml).
"""

from __future__ import annotations

import argparse
import datetime as dt
import shutil
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("PyYAML is required: pip install pyyaml")

BLOCK_FILE = Path(__file__).with_name("address-recognizers.yaml")


def load_block() -> tuple[str, list[dict]]:
    if not BLOCK_FILE.exists():
        sys.exit(f"Missing {BLOCK_FILE.name} next to this script.")
    text = BLOCK_FILE.read_text(encoding="utf-8")
    parsed = yaml.safe_load("recognizers:\n" + text)
    return text, parsed["recognizers"]


def recognizer_names(doc: dict) -> list[str]:
    out = []
    for entry in doc.get("recognizers") or []:
        out.append(entry if isinstance(entry, str) else entry.get("name", "<unnamed>"))
    return out


def find_recognizers_block(lines: list[str]) -> tuple[int, int]:
    """Return (start, end) line indices of the top-level `recognizers:` block."""
    start = None
    for i, line in enumerate(lines):
        if line.rstrip() == "recognizers:" or line.startswith("recognizers:"):
            if not line[0].isspace():
                start = i
                break
    if start is None:
        sys.exit("No top-level `recognizers:` key found — is this the registry config?")

    end = len(lines)
    for i in range(start + 1, len(lines)):
        stripped = lines[i].strip()
        if not stripped or stripped.startswith("#"):
            continue
        # A new top-level key ends the block.
        if not lines[i][0].isspace():
            end = i
            break
    return start, end


def detect_indent(lines: list[str], start: int, end: int) -> str:
    for i in range(start + 1, end):
        line = lines[i]
        if line.lstrip().startswith("- "):
            return line[: len(line) - len(line.lstrip())]
    return "  "


def reindent(block: str, indent: str) -> str:
    if indent == "  ":
        return block
    out = []
    for line in block.splitlines():
        if not line.strip():
            out.append(line)
        elif line.startswith("  "):
            out.append(indent + line[2:])
        else:
            out.append(line)
    return "\n".join(out) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("config", type=Path, help="the registry YAML to extend")
    parser.add_argument("--apply", action="store_true", help="replace the file (a backup is kept)")
    args = parser.parse_args()

    target: Path = args.config
    if not target.is_file():
        sys.exit(f"Not a file: {target}")

    original = target.read_text(encoding="utf-8")
    try:
        before = yaml.safe_load(original)
    except yaml.YAMLError as exc:
        sys.exit(f"{target} is not valid YAML, refusing to touch it:\n{exc}")
    if not isinstance(before, dict) or "recognizers" not in before:
        sys.exit(f"{target} has no `recognizers:` key — wrong file?")

    block_text, block_entries = load_block()
    new_names = [entry["name"] for entry in block_entries]
    existing = recognizer_names(before)

    already = [n for n in new_names if n in existing]
    if len(already) == len(new_names):
        print(f"Already present in {target.name}: {', '.join(already)}")
        print("Nothing to do.")
        return 0
    if already:
        sys.exit(
            "Partially applied already — "
            f"{', '.join(already)} exist but others do not.\n"
            "Remove those entries by hand, then re-run."
        )

    lines = original.splitlines(keepends=True)
    start, end = find_recognizers_block(lines)
    indent = detect_indent(lines, start, end)

    insert_at = end
    while insert_at > start + 1 and not lines[insert_at - 1].strip():
        insert_at -= 1

    payload = "\n" + reindent(block_text, indent)
    if not payload.endswith("\n"):
        payload += "\n"
    merged = "".join(lines[:insert_at]) + payload + "".join(lines[insert_at:])

    # Validate: still parseable, nothing lost, exactly our entries gained.
    try:
        after = yaml.safe_load(merged)
    except yaml.YAMLError as exc:
        sys.exit(f"Merge produced invalid YAML, aborting:\n{exc}")

    after_names = recognizer_names(after)
    lost = [n for n in existing if n not in after_names]
    if lost:
        sys.exit(f"Merge would drop recognizers, aborting: {', '.join(lost)}")
    gained = [n for n in after_names if n not in existing]
    if sorted(gained) != sorted(new_names):
        sys.exit(f"Unexpected result, aborting. Gained: {gained}")
    for key, value in before.items():
        if key != "recognizers" and after.get(key) != value:
            sys.exit(f"Top-level key `{key}` changed, aborting.")

    candidate = target.with_suffix(target.suffix + ".new")
    candidate.write_text(merged, encoding="utf-8")
    print(f"{len(existing)} recognizers before, {len(after_names)} after.")
    print(f"Added: {', '.join(new_names)}")
    print(f"Candidate written to {candidate}")

    if not args.apply:
        print(f"\nReview it, then re-run with --apply:\n  diff -u {target} {candidate}")
        return 0

    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = target.with_suffix(target.suffix + f".bak-{stamp}")
    shutil.copy2(target, backup)
    shutil.move(str(candidate), target)
    print(f"\nApplied. Backup: {backup}")
    print("Restart the analyzer for the change to take effect.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
