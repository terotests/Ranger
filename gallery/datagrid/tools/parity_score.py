#!/usr/bin/env python3
"""Score gallery/datagrid/docs/PARITY.md against FortuneSheet.

Turns the checklist into one number so parity is tracked rather than felt.
done = 1, partial = 0.5, todo = 0.

    npm run datagrid:parity
    npm run datagrid:parity -- --todo     # only what is missing
    npm run datagrid:parity -- --check 60 # non-zero exit below 60%
"""
import os
import re
import sys

DOC = os.path.join(os.path.dirname(__file__), "..", "docs", "PARITY.md")
WEIGHT = {"done": 1.0, "partial": 0.5, "todo": 0.0}
ROW = re.compile(r"^\|\s*(.+?)\s*\|\s*(done|partial|todo)\s*\|\s*(.*?)\s*\|\s*$")


def parse(path):
    sections = []
    current = None
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.rstrip("\n")
            if line.startswith("## "):
                current = (line[3:].strip(), [])
                sections.append(current)
                continue
            m = ROW.match(line)
            if m and current is not None:
                feature, status, notes = m.group(1), m.group(2), m.group(3)
                current[1].append((feature, status, notes))
    return [s for s in sections if s[1]]


def bar(fraction, width=22):
    filled = int(round(fraction * width))
    return "█" * filled + "·" * (width - filled)


def main():
    args = sys.argv[1:]
    only_todo = "--todo" in args
    threshold = None
    if "--check" in args:
        i = args.index("--check")
        if i + 1 < len(args):
            threshold = float(args[i + 1])

    sections = parse(os.path.abspath(DOC))
    if not sections:
        print("no parity rows found in", DOC)
        return 2

    total_score = 0.0
    total_count = 0
    counts = {"done": 0, "partial": 0, "todo": 0}
    missing = []

    print("FortuneSheet parity — gallery/datagrid")
    print("=" * 62)
    for name, rows in sections:
        score = sum(WEIGHT[s] for _f, s, _n in rows)
        total_score += score
        total_count += len(rows)
        for feature, status, notes in rows:
            counts[status] += 1
            if status != "done":
                missing.append((name, feature, status, notes))
        frac = score / len(rows)
        print(f"  {name:<22} {bar(frac)} {score:5.1f} / {len(rows):<3} {frac * 100:5.1f}%")

    pct = (total_score / total_count) * 100.0
    print("-" * 62)
    print(f"  {'TOTAL':<22} {bar(total_score / total_count)} "
          f"{total_score:5.1f} / {total_count:<3} {pct:5.1f}%")
    print(f"  done {counts['done']}   partial {counts['partial']}   todo {counts['todo']}")

    if only_todo or threshold is not None:
        print()
        print("Not yet at parity:")
        for name, feature, status, notes in missing:
            print(f"  [{status:<7}] {name} / {feature}")
            if notes:
                print(f"            {notes}")

    if threshold is not None and pct < threshold:
        print(f"\nFAIL: {pct:.1f}% is below the required {threshold:.1f}%")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
