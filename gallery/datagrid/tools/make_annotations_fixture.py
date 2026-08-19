#!/usr/bin/env python3
"""Write fixtures/annotations.xlsx: hyperlinks, comments and data validation.

Raw OOXML through zipfile, like the other fixture writers here — no openpyxl,
so the fixture is exactly the bytes this repository decided to test against
rather than whatever a library happens to emit this year.

The three features share one sheet on purpose: they are all CELL METADATA that
lives outside the cell, and a loader that reads one of them by accident while
walking the sheet would be caught here.
"""
import os
import zipfile

OUT = os.path.join(os.path.dirname(__file__), "..", "fixtures", "annotations.xlsx")

SHARED = [
    "Link out",              # 0
    "Link inside",           # 1
    "Note here",             # 2
    "Pick one",              # 3
    "Amount",                # 4
    "north",                 # 5
    "Second sheet",          # 6
]

CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/comments1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml"/>
</Types>"""

ROOT_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>"""

WORKBOOK = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Notes" sheetId="1" r:id="rId1"/>
    <sheet name="Lists" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>"""

WORKBOOK_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""

# The sheet's own relationships: one external hyperlink, and the comments part.
# The comments target is written as "../comments1.xml" deliberately — that is
# the relative form Excel writes, and resolving it is part of what is tested.
SHEET1_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://example.com/report" TargetMode="External"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="../comments1.xml"/>
</Relationships>"""

SHEET1 = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
           xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:C6"/>
  <sheetData>
    <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row>
    <row r="2"><c r="A2" t="s"><v>3</v></c><c r="B2" t="s"><v>4</v></c></row>
    <row r="3"><c r="A3" t="s"><v>5</v></c><c r="B3"><v>42</v></c></row>
  </sheetData>
  <hyperlinks>
    <hyperlink ref="A1" r:id="rId1"/>
    <hyperlink ref="B1" location="Lists!A1" display="Second sheet"/>
  </hyperlinks>
  <dataValidations count="2">
    <dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="1" sqref="A3:A6">
      <formula1>"north,south,east,west"</formula1>
    </dataValidation>
    <dataValidation type="whole" operator="between" allowBlank="1" showErrorMessage="1" errorTitle="Out of range" error="Enter 1 to 100" sqref="B3:B6">
      <formula1>1</formula1>
      <formula2>100</formula2>
    </dataValidation>
  </dataValidations>
</worksheet>"""

SHEET2 = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:A2"/>
  <sheetData>
    <row r="1"><c r="A1" t="s"><v>6</v></c></row>
  </sheetData>
</worksheet>"""

COMMENTS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<comments xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <authors><author>Reviewer</author></authors>
  <commentList>
    <comment ref="C1" authorId="0">
      <text><r><rPr><b/></rPr><t>Reviewer:</t></r><r><t xml:space="preserve"> check this number</t></r></text>
    </comment>
    <comment ref="B3" authorId="0">
      <text><r><t>Must stay under a hundred</t></r></text>
    </comment>
  </commentList>
</comments>"""

STYLES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>"""


def shared_strings():
    items = "".join(f"<si><t>{s}</t></si>" for s in SHARED)
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
            '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
            f'count="{len(SHARED)}" uniqueCount="{len(SHARED)}">{items}</sst>')


def main():
    out = os.path.abspath(OUT)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", CONTENT_TYPES)
        z.writestr("_rels/.rels", ROOT_RELS)
        z.writestr("xl/workbook.xml", WORKBOOK)
        z.writestr("xl/_rels/workbook.xml.rels", WORKBOOK_RELS)
        z.writestr("xl/worksheets/sheet1.xml", SHEET1)
        z.writestr("xl/worksheets/_rels/sheet1.xml.rels", SHEET1_RELS)
        z.writestr("xl/worksheets/sheet2.xml", SHEET2)
        z.writestr("xl/comments1.xml", COMMENTS)
        z.writestr("xl/sharedStrings.xml", shared_strings())
        z.writestr("xl/styles.xml", STYLES)
    print("wrote", out)


if __name__ == "__main__":
    main()
