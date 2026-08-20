#!/usr/bin/env python3
"""Regenerate gallery/datagrid/fixtures/accented-text.xlsx.

Every other fixture here is ASCII, which is why a whole class of bug lived in
this repository unseen: Ranger's `string` is UTF-16 code units on the JavaScript
target and BYTES on the C++ one, so text handling can be correct in one and
silently wrong in the other — and ASCII is exactly the text where the two agree.

This one is deliberately not ASCII. Finnish, Swedish and German names, a Greek
letter, an em dash and a currency sign: one byte, two bytes, three bytes, and a
character above the BMP, so every branch of a UTF-8 walk is exercised by simply
drawing the sheet.

Written as raw OOXML through zipfile so it regenerates without openpyxl.
"""
import os
import zipfile

OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "fixtures", "accented-text.xlsx"))

CONTENT_TYPES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>'''

RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''

WB_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'''

WB = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Nimet" sheetId="1" r:id="rId1"/></sheets>
</workbook>'''

STYLES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="10.0"/><color rgb="FF000000"/><name val="Arial"/></font>
    <font><b/><sz val="10.0"/><color rgb="FF000000"/></font>
  </fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border/></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>'''

# One byte, two, three, and one above the BMP.
ROWS = [
    ("Paikkakunta", "Huomio"),
    ("Hämeenlinna", "hoida tämä asia"),
    ("Järvenpää", "Ylöjärvi, Kalliorinne"),
    ("Malmö", "Göteborg"),
    ("Zürich", "Düsseldorf"),
    ("μ ja Ω", "en dash – ja em dash —"),
    ("1 234,50 €", "£ ja ¥ ja ¤"),
    ("Ångström", "Œuvre, garçon, naïve"),
    ("emoji: 🌍", "above the BMP"),
]


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def main():
    strings = []
    index = {}
    for a, b in ROWS:
        for v in (a, b):
            if v not in index:
                index[v] = len(strings)
                strings.append(v)

    sst = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
           '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
           'count="%d" uniqueCount="%d">' % (len(ROWS) * 2, len(strings))
           + "".join("<si><t>%s</t></si>" % esc(v) for v in strings)
           + "</sst>")

    rows = []
    for i, (a, b) in enumerate(ROWS):
        r = i + 1
        s = "1" if i == 0 else "0"
        rows.append('<row r="%d">'
                    '<c r="A%d" s="%s" t="s"><v>%d</v></c>'
                    '<c r="B%d" s="%s" t="s"><v>%d</v></c>'
                    '</row>' % (r, r, s, index[a], r, s, index[b]))

    sheet = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
             '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
             '<sheetFormatPr defaultRowHeight="12.75" defaultColWidth="12.63"/>'
             '<cols><col min="1" max="2" width="26.0" customWidth="1"/></cols>'
             '<sheetData>' + "".join(rows) + '</sheetData></worksheet>')

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with zipfile.ZipFile(OUT, "w", compression=zipfile.ZIP_STORED) as z:
        z.writestr("[Content_Types].xml", CONTENT_TYPES)
        z.writestr("_rels/.rels", RELS)
        z.writestr("xl/_rels/workbook.xml.rels", WB_RELS)
        z.writestr("xl/workbook.xml", WB)
        z.writestr("xl/styles.xml", STYLES)
        z.writestr("xl/sharedStrings.xml", sst)
        z.writestr("xl/worksheets/sheet1.xml", sheet)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
