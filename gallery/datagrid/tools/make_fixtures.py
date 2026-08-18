#!/usr/bin/env python3
"""Regenerate gallery/datagrid/fixtures/*.xlsx (stdlib zipfile, STORED).

Milestone 3 fixtures exercise FortuneSheet-aligned ops:
  styles / numFmt, freeze panes (sheetViews pane), fills, bold headers.
"""
import zipfile, os

ROOT = os.path.join(os.path.dirname(__file__), "..", "fixtures")

def write_xlsx(path, files):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_STORED) as z:
        for name, data in files.items():
            z.writestr(name, data)

CONTENT_TYPES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>'''

RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''

# FortuneSheet formatting slice: header fill/bold, 0.00, percent
STYLES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="0"/>
  <fonts count="2">
    <font><sz val="11"/><color theme="1"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1F4E79"/></patternFill></fill>
  </fills>
  <borders count="1"><border/></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1">
      <alignment horizontal="center"/>
    </xf>
    <xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1">
      <alignment horizontal="right"/>
    </xf>
    <xf numFmtId="9" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1">
      <alignment horizontal="right"/>
    </xf>
  </cellXfs>
</styleSheet>'''

WB = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Sales" sheetId="1" r:id="rId1"/>
    <sheet name="Summary" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>'''

WB_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'''

SST = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="8" uniqueCount="8">
  <si><t>Product</t></si>
  <si><t>Qty</t></si>
  <si><t>Price</t></si>
  <si><t>Total</t></si>
  <si><t>Widget</t></si>
  <si><t>Gadget</t></si>
  <si><t>Doohickey</t></si>
  <si><t>Quarterly Sales</t></si>
</sst>'''

# Freeze: 1 col + 2 rows (FortuneSheet freeze panes / Excel sheetViews pane)
SHEET1 = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:D6"/>
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0">
      <pane xSplit="1" ySplit="2" topLeftCell="B3" activePane="bottomRight" state="frozen"/>
    </sheetView>
  </sheetViews>
  <cols>
    <col min="1" max="1" width="16" customWidth="1"/>
    <col min="2" max="2" width="8" customWidth="1"/>
    <col min="3" max="4" width="12" customWidth="1"/>
  </cols>
  <sheetData>
    <row r="1" ht="28" customHeight="1">
      <c r="A1" s="1" t="s"><v>7</v></c>
    </row>
    <row r="2">
      <c r="A2" s="1" t="s"><v>0</v></c>
      <c r="B2" s="1" t="s"><v>1</v></c>
      <c r="C2" s="1" t="s"><v>2</v></c>
      <c r="D2" s="1" t="s"><v>3</v></c>
    </row>
    <row r="3">
      <c r="A3" t="s"><v>4</v></c>
      <c r="B3"><v>12</v></c>
      <c r="C3" s="2"><v>4.5</v></c>
      <c r="D3" s="2"><f>B3*C3</f><v>54</v></c>
    </row>
    <row r="4">
      <c r="A4" t="s"><v>5</v></c>
      <c r="B4"><v>3</v></c>
      <c r="C4" s="2"><v>19.9</v></c>
      <c r="D4" s="2"><f>B4*C4</f><v>59.7</v></c>
    </row>
    <row r="5">
      <c r="A5" t="s"><v>6</v></c>
      <c r="B5"><v>100</v></c>
      <c r="C5" s="3"><v>0.25</v></c>
      <c r="D5" s="2"><f>B5*C5</f><v>25</v></c>
    </row>
    <row r="6" ht="24" customHeight="1">
      <c r="A6" t="inlineStr"><is><t>Grand total</t></is></c>
      <c r="D6" s="2"><f>SUM(D3:D5)</f><v>138.7</v></c>
    </row>
  </sheetData>
  <mergeCells count="1">
    <mergeCell ref="A1:D1"/>
  </mergeCells>
</worksheet>'''

SHEET2 = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1" t="inlineStr"><is><t>Lines</t></is></c>
      <c r="B1"><v>3</v></c>
    </row>
    <row r="2">
      <c r="A2" t="inlineStr"><is><t>Sum</t></is></c>
      <c r="B2"><f>Sales!D6</f><v>138.7</v></c>
    </row>
    <row r="3">
      <c r="A3" t="b"><v>1</v></c>
      <c r="B3" t="inlineStr"><is><t>ok</t></is></c>
    </row>
  </sheetData>
</worksheet>'''

def main():
    write_xlsx(os.path.join(ROOT, "sales.xlsx"), {
        "[Content_Types].xml": CONTENT_TYPES,
        "_rels/.rels": RELS,
        "xl/workbook.xml": WB,
        "xl/_rels/workbook.xml.rels": WB_RELS,
        "xl/styles.xml": STYLES,
        "xl/sharedStrings.xml": SST,
        "xl/worksheets/sheet1.xml": SHEET1,
        "xl/worksheets/sheet2.xml": SHEET2,
    })
    rows = ['<row r="1"><c r="A1" t="inlineStr"><is><t>Row</t></is></c><c r="B1" t="inlineStr"><is><t>Value</t></is></c></row>']
    for i in range(2, 501):
        if i % 25 == 0 or i < 10:
            rows.append(f'<row r="{i}"><c r="A{i}"><v>{i}</v></c><c r="B{i}" t="inlineStr"><is><t>marker-{i}</t></is></c></row>')
    sheet_big = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:B500"/>
  <sheetData>
''' + "\n".join(rows) + '''
  </sheetData>
</worksheet>'''
    WB1 = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Sparse500" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>'''
    WB1_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'''
    CT1 = CONTENT_TYPES.replace(
        '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n  ',
        '').replace(
        '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>\n  ',
        '')
    write_xlsx(os.path.join(ROOT, "sparse500.xlsx"), {
        "[Content_Types].xml": CT1,
        "_rels/.rels": RELS,
        "xl/workbook.xml": WB1,
        "xl/_rels/workbook.xml.rels": WB1_RELS,
        "xl/styles.xml": STYLES,
        "xl/worksheets/sheet1.xml": sheet_big,
    })
    print("wrote", os.path.join(ROOT, "sales.xlsx"))
    print("wrote", os.path.join(ROOT, "sparse500.xlsx"))

if __name__ == "__main__":
    main()
