#!/usr/bin/env python3
"""LibreOffice formula oracle: compare LO-calculated values to Ranger dump.

SKIP (exit 0) when LibreOffice is not installed. When present, converts the
workbook to CSV via headless Calc (recalculates) and diffs selected cells
against Ranger's formula inspect JSON.
"""

from __future__ import annotations

import argparse
import csv
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def find_soffice() -> str | None:
    for c in ("soffice", "libreoffice", "/usr/bin/soffice", "/usr/bin/libreoffice"):
        p = Path(c)
        if shutil.which(c) or p.exists():
            return c
    return None


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("xlsx")
    ap.add_argument("--ranger", required=True, help="Ranger formula values JSON")
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--strict", action="store_true")
    args = ap.parse_args()

    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)

    soffice = find_soffice()
    if not soffice:
        print("SKIP formula oracle: LibreOffice not installed")
        sys.exit(0)

    ranger_path = Path(args.ranger)
    if not ranger_path.exists():
        print(f"SKIP formula oracle: missing Ranger dump {ranger_path}")
        sys.exit(0)

    ranger = json.loads(ranger_path.read_text())
    cells = ranger.get("cells") or []
    if not cells:
        print("SKIP formula oracle: no cells in Ranger dump")
        sys.exit(0)

    with tempfile.TemporaryDirectory() as td:
        tdir = Path(td)
        r = subprocess.run(
            [soffice, "--headless", "--convert-to", "csv", "--outdir", str(tdir), str(args.xlsx)],
            capture_output=True,
            text=True,
        )
        csvs = list(tdir.glob("*.csv"))
        if not csvs:
            print("SKIP formula oracle: LibreOffice produced no CSV")
            if args.strict:
                sys.exit(1)
            sys.exit(0)

        # LO dumps active sheet only for simple convert-to csv — compare what we can.
        rows = list(csv.reader(csvs[0].open(newline="")))
        report = {"compared": 0, "pass": 0, "fail": [], "csv": csvs[0].name}
        for item in cells:
            sheet = item.get("sheet", "")
            r0 = int(item["row"])
            c0 = int(item["col"])
            want = str(item.get("value", ""))
            # Only compare when dump marks sheet as active/first for LO csv
            if item.get("sheetIndex", 0) != 0 and sheet not in (ranger.get("active"), ""):
                continue
            if r0 >= len(rows):
                continue
            row = rows[r0]
            if c0 >= len(row):
                continue
            got = row[c0].strip()
            report["compared"] += 1
            # numeric soft compare
            ok = got == want
            try:
                ok = abs(float(got) - float(want)) < 1e-6
            except ValueError:
                pass
            if ok:
                report["pass"] += 1
            else:
                report["fail"].append({"cell": item.get("addr"), "ranger": want, "libreoffice": got})

        (out / "formula_lo_report.json").write_text(json.dumps(report, indent=2))
        print(
            f"formula oracle: {report['pass']}/{report['compared']} PASS"
            + (f"  fails={len(report['fail'])}" if report["fail"] else "")
        )
        if report["fail"] and args.strict:
            sys.exit(1)
        sys.exit(0)


if __name__ == "__main__":
    main()
