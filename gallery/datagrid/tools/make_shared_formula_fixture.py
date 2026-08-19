#!/usr/bin/env python3
"""Regenerate gallery/datagrid/fixtures/shared-formulas.xlsx.

Our own writer produces a tidy, explicit file: every formula written out, every
font present, every row and column sized. Real files are not like that, and the
three shortcuts other programs take are exactly the three this fixture carries:

  * SHARED FORMULAS. A run of cells with the same formula is written once —
    <f t="shared" ref="E1:E4" si="0">SUM(B1:D1)</f> on the first, and a bare
    <f t="shared" si="0"/> on the rest. A reader that only takes the tags with
    text keeps the cached numbers and no formulas, and the sheet quietly stops
    recalculating.

  * AN EMPTY <font/>. Legal, common, and means "the workbook default". Skip it
    and every font after it moves down one index, so cells wear a neighbour's
    weight and colour.

  * <sheetFormatPr>. Most columns in a real sheet have no <col> element at all
    and most rows no height; the defaults live here, and a row carrying larger
    type than the default is auto-fitted rather than clipped.

Written as raw OOXML through zipfile so it regenerates without openpyxl.
"""
import os
import zipfile

OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "fixtures", "shared-formulas.xlsx"))

CONTENT_TYPES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>'''

RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''

WB_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'''

WB = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Shared" sheetId="1" r:id="rId1"/></sheets>
</workbook>'''

# font 0: the workbook default, Arial 10.
# font 1: EMPTY — the one that shifts the table when a reader drops it.
# font 2: bold 10, dark red.
# font 3: 12pt — larger than the sheet's default row, so the row must grow.
STYLES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="10.0"/><color rgb="FF000000"/><name val="Arial"/></font>
    <font/>
    <font><b/><sz val="10.0"/><color rgb="FFC00000"/></font>
    <font><sz val="12.0"/><color rgb="FF000000"/></font>
  </fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border/></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>'''

VALUES = [
    [1.0, 2.0, 3.0],
    [10.0, 20.0, 30.0],
    [100.0, 200.0, 300.0],
    [1000.0, 2000.0, 3000.0],
]


def sheet_xml():
    rows = []
    for i, vals in enumerate(VALUES):
        r = i + 1
        cells = []
        # A: a label, in the bold dark-red font (xf 2 → font 2). If an empty
        # <font/> is dropped, this resolves to font 3 — 12pt, not bold.
        cells.append('<c r="A%d" s="2" t="inlineStr"><is><t>Row %d</t></is></c>' % (r, r))
        for j, v in enumerate(vals):
            cells.append('<c r="%s%d"><v>%g</v></c>' % ("BCD"[j], r, v))
        total = sum(vals)
        if r == 1:
            # The anchor of the shared run carries the text …
            cells.append('<c r="E1"><f t="shared" ref="E1:E4" si="0">SUM(B1:D1)</f><v>%g</v></c>' % total)
        else:
            # … and every other member carries only the id.
            cells.append('<c r="E%d"><f t="shared" si="0"/><v>%g</v></c>' % (r, total))
        rows.append('<row r="%d">%s</row>' % (r, "".join(cells)))

    # Row 6: a grand total over the shared column, so a change to an input has
    # to travel two hops — B2 → E2 → E6 — to show up.
    grand = sum(sum(v) for v in VALUES)
    rows.append('<row r="6">'
                '<c r="A6" s="2" t="inlineStr"><is><t>Total</t></is></c>'
                '<c r="E6"><f>SUM(E1:E4)</f><v>%g</v></c>'
                '</row>' % grand)

    # Row 8 carries 12pt type in a sheet whose rows default to 12.75pt: too
    # tall for the default row, and the file does not size the row, so the
    # reader has to.
    rows.append('<row r="8">'
                '<c r="A8" s="3" t="inlineStr"><is><t>Twelve point</t></is></c>'
                '</row>')

    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            '<sheetFormatPr defaultRowHeight="12.75" defaultColWidth="12.63"/>'
            '<cols><col min="1" max="1" width="20.0" customWidth="1"/></cols>'
            '<sheetData>' + "".join(rows) + '</sheetData>'
            '</worksheet>')


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with zipfile.ZipFile(OUT, "w", compression=zipfile.ZIP_STORED) as z:
        z.writestr("[Content_Types].xml", CONTENT_TYPES)
        z.writestr("_rels/.rels", RELS)
        z.writestr("xl/_rels/workbook.xml.rels", WB_RELS)
        z.writestr("xl/workbook.xml", WB)
        z.writestr("xl/styles.xml", STYLES)
        z.writestr("xl/worksheets/sheet1.xml", sheet_xml())
    print("wrote", OUT)


if __name__ == "__main__":
    main()
