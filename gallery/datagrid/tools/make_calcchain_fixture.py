#!/usr/bin/env python3
"""Write fixtures/calc-chain.xlsx: formulas that depend on formulas, deeply.

Every .xlsx stores, beside each formula, the value the writing program last
computed. This file's cached values are computed HERE, in Python, from the same
arithmetic Excel would do — so the fixture is an oracle: load it, recalculate
from the formulas alone, and any disagreement is ours.

What it covers is the shape a real report has and a small test usually does not:

  A   a chain 400 long where each cell reads the one BELOW it — the worst case
      for a recalculation that sweeps the sheet in cell order
  B   the same chain the other way up
  C   a ladder of SUMs, each summing a window that includes the previous SUM
  D   subtotals of subtotals: SUM over a range of cells that are themselves SUMs
  E   a cross-sheet chain, so the walk has to leave the sheet and come back

`tools/check_calc.py fixtures/calc-chain.xlsx` is the check.
"""
import os
import zipfile

OUT = os.path.join(os.path.dirname(__file__), "..", "fixtures", "calc-chain.xlsx")
DEPTH = 400
LADDER = 120

CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>"""

ROOT_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>"""

WORKBOOK = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Chain" sheetId="1" r:id="rId1"/>
    <sheet name="Feeder" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>"""

WORKBOOK_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""

STYLES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>"""


def num(v):
    """Excel writes a plain number; keep integers integral so text compares."""
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return repr(v) if not isinstance(v, str) else v


def main():
    out = os.path.abspath(OUT)
    os.makedirs(os.path.dirname(out), exist_ok=True)

    # --- the values, computed here ------------------------------------------
    a = [0.0] * (DEPTH + 1)          # A: chain reading the row below
    a[DEPTH] = 1.0
    for r in range(DEPTH - 1, 0, -1):
        a[r] = a[r + 1] + 1.0
    b = [0.0] * (DEPTH + 1)          # B: chain reading the row above
    b[1] = 5.0
    for r in range(2, DEPTH + 1):
        b[r] = b[r - 1] * 1.0 + 2.0
    c = [0.0] * (LADDER + 1)         # C: SUM ladder over a moving window
    c[1] = 1.0
    c[2] = 1.0
    for r in range(3, LADDER + 1):
        c[r] = c[r - 1] + c[r - 2]
    # D: subtotals of subtotals — every tenth row sums the ten above it,
    # and the last one sums those.
    d = {}
    for r in range(10, LADDER + 1, 10):
        d[r] = sum(c[r - 9:r + 1])
    grand = sum(d.values())
    # E: a cross-sheet chain — Feeder reads Chain, Chain reads Feeder back.
    feeder = [0.0] * 21
    for i in range(1, 21):
        feeder[i] = a[i] * 2.0
    echo = sum(feeder[1:21])

    rows = []
    for r in range(1, DEPTH + 1):
        cells = []
        if r == DEPTH:
            cells.append(f'<c r="A{r}"><v>1</v></c>')
        else:
            cells.append(f'<c r="A{r}"><f>A{r + 1}+1</f><v>{num(a[r])}</v></c>')
        if r == 1:
            cells.append(f'<c r="B{r}"><v>5</v></c>')
        else:
            cells.append(f'<c r="B{r}"><f>B{r - 1}+2</f><v>{num(b[r])}</v></c>')
        if r <= LADDER:
            if r <= 2:
                cells.append(f'<c r="C{r}"><v>1</v></c>')
            else:
                cells.append(f'<c r="C{r}"><f>SUM(C{r - 2}:C{r - 1})</f><v>{num(c[r])}</v></c>')
            if r % 10 == 0:
                cells.append(f'<c r="D{r}"><f>SUM(C{r - 9}:C{r})</f><v>{num(d[r])}</v></c>')
        if r == 1:
            cells.append(f'<c r="E1"><f>SUM(D1:D{LADDER})</f><v>{num(grand)}</v></c>')
            cells.append(f'<c r="F1"><f>SUM(Feeder!A1:A20)</f><v>{num(echo)}</v></c>')
        rows.append(f'<row r="{r}">{"".join(cells)}</row>')

    sheet1 = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
              '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
              f'<dimension ref="A1:F{DEPTH}"/><sheetData>{"".join(rows)}</sheetData></worksheet>')

    frows = []
    for i in range(1, 21):
        frows.append(f'<row r="{i}"><c r="A{i}"><f>Chain!A{i}*2</f><v>{num(feeder[i])}</v></c></row>')
    sheet2 = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
              '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
              f'<dimension ref="A1:A20"/><sheetData>{"".join(frows)}</sheetData></worksheet>')

    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", CONTENT_TYPES)
        z.writestr("_rels/.rels", ROOT_RELS)
        z.writestr("xl/workbook.xml", WORKBOOK)
        z.writestr("xl/_rels/workbook.xml.rels", WORKBOOK_RELS)
        z.writestr("xl/worksheets/sheet1.xml", sheet1)
        z.writestr("xl/worksheets/sheet2.xml", sheet2)
        z.writestr("xl/styles.xml", STYLES)
    print("wrote", out)
    print(f"  A1={num(a[1])}  B{DEPTH}={num(b[DEPTH])}  C{LADDER}={num(c[LADDER])}"
          f"  E1={num(grand)}  F1={num(echo)}")


if __name__ == "__main__":
    main()
