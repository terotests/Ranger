#!/usr/bin/env python3
"""Recalculate a workbook and compare against the values Excel itself stored.

Every .xlsx carries, beside each formula, the value the program that wrote it
last computed. That is a free oracle: no LibreOffice, no network, no second
implementation to install — the answers are already in the file.

    python3 gallery/datagrid/tools/check_calc.py somefile.xlsx

It loads the workbook through the compiled Ranger engine, recalculates it from
the formulas alone, and reports every cell where our answer differs from the
stored one — grouped by the functions the formula uses, because a whole column
going wrong is nearly always ONE unimplemented function at the top of it.

Cells whose stored value is an Excel error (#N/A, #REF!, …) are counted apart:
reproducing an error is a different question from computing a number.
"""
import json
import os
import re
import subprocess
import sys
import zipfile
from collections import Counter
from xml.etree import ElementTree as ET

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
MODULE = os.path.join(ROOT, "gallery", "datagrid", "bin", "grid_app_module.cjs")
FUNC = re.compile(r"([A-Z][A-Z0-9\.]*)\s*\(")
ERRORS = {"#N/A", "#REF!", "#VALUE!", "#DIV/0!", "#NAME?", "#NULL!", "#NUM!"}


def stored_values(path):
    """{(sheet index, row, col): (formula, cached value)} straight from the file."""
    out = {}
    with zipfile.ZipFile(path) as z:
        wb = ET.fromstring(z.read("xl/workbook.xml"))
        names = [s.get("name") for s in wb.iter(NS + "sheet")]
        sheets = [n for n in z.namelist() if re.match(r"xl/worksheets/sheet\d+\.xml$", n)]
        sheets.sort(key=lambda n: int(re.search(r"(\d+)\.xml$", n).group(1)))
        for idx, part in enumerate(sheets):
            root = ET.fromstring(z.read(part))
            shared = {}
            for c in root.iter(NS + "c"):
                f = c.find(NS + "f")
                if f is None:
                    continue
                text = (f.text or "").strip()
                si = f.get("si")
                if text and f.get("t") == "shared" and si is not None:
                    shared[si] = text
                if not text and f.get("t") == "shared" and si in shared:
                    # A member of a shared run. Its own text is the anchor's,
                    # translated — which is the loader's job, not this
                    # oracle's; for grouping by function the anchor's text is
                    # exactly as informative, and the cached value below is
                    # this cell's own.
                    text = shared[si]
                if not text:
                    continue
                v = c.find(NS + "v")
                ref = c.get("r") or ""
                m = re.match(r"([A-Z]+)(\d+)$", ref)
                if not m:
                    continue
                col = 0
                for ch in m.group(1):
                    col = col * 26 + (ord(ch) - 64)
                out[(idx, int(m.group(2)) - 1, col - 1)] = (
                    text,
                    (v.text or "").strip() if v is not None else "",
                    names[idx] if idx < len(names) else part,
                )
    return out


def our_values(path):
    """What our engine makes of the same file."""
    script = """
      const { createRequire } = require('node:module');
      const { GridApp } = require(process.argv[1]);
      const app = new GridApp();
      app.init(process.argv[3]);
      if (!app.loadXlsx(process.argv[2])) { console.error('LOAD ' + app.loadError); process.exit(2); }
      const out = {};
      for (let s = 0; s < app.book.sheetCount(); s++) {
        const sh = app.book.sheetAt(s);
        for (let r = 0; r < sh.rowCount; r++) {
          for (let c = 0; c < sh.colCount; c++) {
            if (!sh.getFormula(r, c)) continue;
            out[s + ',' + r + ',' + c] = String(sh.getCell(r, c));
          }
        }
      }
      process.stdout.write('---VALUES---' + JSON.stringify(out));
    """
    fonts = os.path.join(ROOT, "gallery", "pdf_writer", "assets", "fonts")
    run = subprocess.run(
        ["node", "-e", script, MODULE, os.path.abspath(path), fonts],
        capture_output=True, text=True, cwd=ROOT,
    )
    if "---VALUES---" not in run.stdout:
        print(run.stderr.strip()[-800:] or "no output from the engine")
        sys.exit(2)
    return json.loads(run.stdout.split("---VALUES---", 1)[1])


def same(a, b):
    if a == b:
        return True
    try:
        fa, fb = float(a), float(b)
    except ValueError:
        return a.strip() == b.strip()
    if fa == fb:
        return True
    scale = max(abs(fa), abs(fb), 1.0)
    return abs(fa - fb) <= scale * 1e-9


def main():
    if not os.path.exists(MODULE):
        print("missing " + MODULE + " — run: npm run datagrid:module")
        return 2
    paths = sys.argv[1:] or [os.path.join(ROOT, "gallery/datagrid/fixtures/formulas.xlsx")]
    bad_total = 0
    for path in paths:
        print(f"\n== {os.path.relpath(path, ROOT)}")
        stored = stored_values(path)
        ours = our_values(path)
        wrong, missing, errs, blank = [], 0, 0, 0
        for key, (formula, want, sheet) in sorted(stored.items()):
            got = ours.get(f"{key[0]},{key[1]},{key[2]}")
            if got is None:
                missing += 1
                continue
            if want in ERRORS:
                errs += 1
                continue
            if want == "":
                # No cached value in the file — nothing to compare against.
                # Files written by a program that does not calculate (including
                # this repository's own fixture writers) look like this.
                blank += 1
                continue
            if not same(got, want):
                wrong.append((sheet, key, formula, want, got))
        print(f"  {len(stored)} formulas, {len(wrong)} disagree, "
              f"{missing} not seen by the loader, {errs} stored as an error, "
              f"{blank} with no cached value to compare")
        if wrong:
            blame = Counter()
            for _, _, formula, _, _ in wrong:
                fns = set(FUNC.findall(formula)) or {"(operators only)"}
                for fn in fns:
                    blame[fn] += 1
            print("  functions in the disagreeing formulas:")
            for fn, n in blame.most_common(12):
                print(f"    {n:5d}  {fn}")
            print("  first few:")
            for sheet, (s, r, c), formula, want, got in wrong[:12]:
                col = ""
                cc = c + 1
                while cc:
                    cc, rem = divmod(cc - 1, 26)
                    col = chr(65 + rem) + col
                print(f"    {sheet}!{col}{r + 1}  ={formula}")
                print(f"        file says {want!r}, we say {got!r}")
        bad_total += len(wrong)
    return 1 if bad_total else 0


if __name__ == "__main__":
    sys.exit(main())
