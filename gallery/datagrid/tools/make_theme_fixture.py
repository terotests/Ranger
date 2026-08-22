#!/usr/bin/env python3
"""Write fixtures/theme-colors.xlsx: colours named the three ways that are not
a plain rgb.

A `<color>` in a workbook says which colour one of four ways, and only one of
them is a hex string. The other three were dropped on the floor:

    rgb="FFCC0000"           read
    theme="4" tint="0.4"     "" — and this is what Excel writes for EVERY cell
                             styled from the palette. "Blue, Accent 1,
                             Lighter 40%" IS a theme index and a tint.
    indexed="10"             "" — the pre-2007 fixed palette, still written by
                             anything old
    auto="1"                 "" — the system colour

`xl/theme/theme1.xml` was in every one of these packages already, unread.

Two things this fixture is shaped to catch:

  * Excel's theme INDICES are not the theme file's order. `theme="0"` is the
    light background and `theme="1"` the dark text — the first two pairs are
    swapped — so a reader that maps them in file order paints white on white.
    A2 and A3 are those two, and they must come out opposite ways round.
  * Excel's `tint` is not DrawingML's `tint`. It scales HLS luminance, so a
    lighter blue is still BLUE; scaling RGB channels instead would wash the
    hue out. B2 and B3 are the same accent lighter and darker, and both have
    to stay blue.

Written as raw OOXML through zipfile so it regenerates without openpyxl.
"""
import os
import zipfile

OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "fixtures", "theme-colors.xlsx"))

CONTENT_TYPES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
</Types>'''

ROOT_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''

WB_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>'''

WORKBOOK = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Theme" sheetId="1" r:id="rId1"/></sheets>
</workbook>'''

# A theme whose twelve colours are all distinct and none of them grey, so a
# wrong slot is a visibly wrong colour rather than a near miss.
THEME = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Probe">
  <a:themeElements>
    <a:clrScheme name="Probe">
      <a:dk1><a:sysClr val="windowText" lastClr="1A1A1A"/></a:dk1>
      <a:lt1><a:sysClr val="window" lastClr="FDFDFD"/></a:lt1>
      <a:dk2><a:srgbClr val="203864"/></a:dk2>
      <a:lt2><a:srgbClr val="E7E6E6"/></a:lt2>
      <a:accent1><a:srgbClr val="4472C4"/></a:accent1>
      <a:accent2><a:srgbClr val="ED7D31"/></a:accent2>
      <a:accent3><a:srgbClr val="A5A5A5"/></a:accent3>
      <a:accent4><a:srgbClr val="FFC000"/></a:accent4>
      <a:accent5><a:srgbClr val="5B9BD5"/></a:accent5>
      <a:accent6><a:srgbClr val="70AD47"/></a:accent6>
      <a:hlink><a:srgbClr val="0563C1"/></a:hlink>
      <a:folHlink><a:srgbClr val="954F72"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Probe">
      <a:majorFont><a:latin typeface="Calibri Light"/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Probe">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>'''

# Fonts 1..6 are the cases. Font 0 is the plain default every workbook has.
STYLES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="7">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><sz val="11"/><name val="Calibri"/><color theme="4"/></font>
    <font><sz val="11"/><name val="Calibri"/><color theme="4" tint="0.4"/></font>
    <font><sz val="11"/><name val="Calibri"/><color theme="4" tint="-0.5"/></font>
    <font><sz val="11"/><name val="Calibri"/><color theme="0"/></font>
    <font><sz val="11"/><name val="Calibri"/><color theme="1"/></font>
    <font><sz val="11"/><name val="Calibri"/><color indexed="10"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor theme="9"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor theme="9" tint="0.6"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="9">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="6" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="0" fillId="2" borderId="0" xfId="0" applyFill="1"/>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1"/>
  </cellXfs>
</styleSheet>'''

SHEET = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1"><c r="A1" t="inlineStr" s="1"><is><t>accent1</t></is></c></row>
    <row r="2"><c r="A2" t="inlineStr" s="2"><is><t>lighter</t></is></c></row>
    <row r="3"><c r="A3" t="inlineStr" s="3"><is><t>darker</t></is></c></row>
    <row r="4"><c r="A4" t="inlineStr" s="4"><is><t>theme0</t></is></c></row>
    <row r="5"><c r="A5" t="inlineStr" s="5"><is><t>theme1</t></is></c></row>
    <row r="6"><c r="A6" t="inlineStr" s="6"><is><t>indexed</t></is></c></row>
    <row r="7"><c r="A7" t="inlineStr" s="7"><is><t>fill</t></is></c></row>
    <row r="8"><c r="A8" t="inlineStr" s="8"><is><t>fill tinted</t></is></c></row>
  </sheetData>
</worksheet>'''


def main() -> None:
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", CONTENT_TYPES)
        z.writestr("_rels/.rels", ROOT_RELS)
        z.writestr("xl/workbook.xml", WORKBOOK)
        z.writestr("xl/_rels/workbook.xml.rels", WB_RELS)
        z.writestr("xl/theme/theme1.xml", THEME)
        z.writestr("xl/styles.xml", STYLES)
        z.writestr("xl/worksheets/sheet1.xml", SHEET)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
