#!/usr/bin/env python3
"""Compare the character formatting we resolve with the one the file states.

A .xlsx describes a cell's look by indirection: the cell names an `xf`, the xf
names a `font`, and the font carries the weight, size and colour. Every step is
an index into a list, so getting a list one entry short — by skipping an empty
`<font/>`, say — does not lose one font, it shifts every font after it, and
cells come out wearing their neighbour's formatting. Nothing crashes and
nothing looks obviously broken; it just isn't the document.

    python3 gallery/datagrid/tools/check_styles.py somefile.xlsx

This walks the indirection in Python, independently of the Ranger loader, and
reports every cell where the two disagree.
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


def fonts_of(styles_root):
    """[(bold, italic, underline, strike, sizePt, '#rrggbb')] in file order."""
    out = []
    holder = styles_root.find(NS + "fonts")
    if holder is None:
        return out
    default_size = None
    for f in holder.findall(NS + "font"):
        sz = f.find(NS + "sz")
        size = float(sz.get("val")) if sz is not None and sz.get("val") else None
        if size is None:
            size = default_size if default_size is not None else 11.0
        if default_size is None:
            default_size = size
        col = f.find(NS + "color")
        rgb = ""
        if col is not None and col.get("rgb"):
            rgb = "#" + col.get("rgb")[-6:]
        out.append((
            f.find(NS + "b") is not None,
            f.find(NS + "i") is not None,
            f.find(NS + "u") is not None,
            f.find(NS + "strike") is not None,
            size,
            rgb,
        ))
    return out


def stated(path):
    """{(sheet, row, col): (b, i, u, strike, size, rgb)} straight from the file."""
    out = {}
    with zipfile.ZipFile(path) as z:
        if "xl/styles.xml" not in z.namelist():
            return out
        styles = ET.fromstring(z.read("xl/styles.xml"))
        fonts = fonts_of(styles)
        xfs = []
        cell_xfs = styles.find(NS + "cellXfs")
        if cell_xfs is not None:
            for xf in cell_xfs.findall(NS + "xf"):
                xfs.append(int(xf.get("fontId") or 0))
        sheets = sorted(
            (n for n in z.namelist() if re.match(r"xl/worksheets/sheet\d+\.xml$", n)),
            key=lambda n: int(re.search(r"(\d+)\.xml$", n).group(1)),
        )
        for idx, part in enumerate(sheets):
            root = ET.fromstring(z.read(part))
            for c in root.iter(NS + "c"):
                s = c.get("s")
                ref = c.get("r") or ""
                m = re.match(r"([A-Z]+)(\d+)$", ref)
                if s is None or not m:
                    continue
                si = int(s)
                if si >= len(xfs):
                    continue
                fid = xfs[si]
                if fid >= len(fonts):
                    continue
                col = 0
                for ch in m.group(1):
                    col = col * 26 + (ord(ch) - 64)
                out[(idx, int(m.group(2)) - 1, col - 1)] = fonts[fid]
    return out


def ours(path):
    script = """
      const { GridApp } = require(process.argv[1]);
      const app = new GridApp();
      app.init('');
      if (!app.loadXlsx(process.argv[2])) { console.error('LOAD ' + app.loadError); process.exit(2); }
      const out = {};
      for (let s = 0; s < app.book.sheetCount(); s++) {
        const sh = app.book.sheetAt(s);
        for (let r = 0; r < sh.rowCount; r++) {
          for (let c = 0; c < sh.colCount; c++) {
            const st = sh.getCellStyle(r, c);
            out[s + ',' + r + ',' + c] =
              [st.bold, st.italic, st.underline, st.strike, st.fontSizePt, st.textRgb];
          }
        }
      }
      process.stdout.write('---STYLES---' + JSON.stringify(out));
    """
    res = subprocess.run(
        ["node", "-e", script, MODULE, os.path.abspath(path)],
        capture_output=True, text=True, cwd=os.path.join(ROOT, "gallery", "datagrid"),
    )
    if res.returncode != 0:
        sys.exit("engine failed: " + (res.stderr.strip() or "?")[-800:])
    if "---STYLES---" not in res.stdout:
        sys.exit("engine printed no styles: " + (res.stderr.strip() or res.stdout.strip())[-800:])
    return json.loads(res.stdout.split("---STYLES---", 1)[1])


def main(paths):
    bad = 0
    for path in paths:
        want = stated(path)
        got = ours(path)
        print("==", os.path.relpath(path, ROOT))
        wrong = []
        for key, exp in sorted(want.items()):
            mine = got.get("%d,%d,%d" % key)
            if mine is None:
                wrong.append((key, exp, None))
                continue
            b, i, u, st, size, rgb = exp
            same = (bool(mine[0]) == b and bool(mine[1]) == i and bool(mine[2]) == u
                    and bool(mine[3]) == st and abs(float(mine[4]) - size) < 0.01)
            if rgb:
                same = same and (str(mine[5]).lower() == rgb.lower())
            if not same:
                wrong.append((key, exp, mine))
        print("  %d styled cells, %d disagree" % (len(want), len(wrong)))
        for key, exp, mine in wrong[:15]:
            print("   sheet %d R%dC%d  file=%s  ours=%s" % (key[0], key[1] + 1, key[2] + 1, exp, mine))
        if len(wrong) > 15:
            print("   … and %d more" % (len(wrong) - 15))
        bad += len(wrong)
    return 1 if bad else 0


if __name__ == "__main__":
    args = sys.argv[1:] or sorted(
        os.path.join(ROOT, "gallery", "datagrid", "fixtures", f)
        for f in os.listdir(os.path.join(ROOT, "gallery", "datagrid", "fixtures"))
        if f.endswith(".xlsx")
    )
    sys.exit(main(args))
