#!/usr/bin/env python3
"""Regenerate gallery/datagrid/fixtures/styles-showcase.xlsx (stdlib zipfile).

A FortuneSheet-shaped formatting showcase — the demo sheet the DataGrid is
benchmarked against has Background / Border / Font / Format sections, so this
fixture carries the same matrix:

  * fills
  * every border line style OOXML defines, in several colours, per edge
  * bold / italic / underline / strike / size / colour fonts
  * number formats

Written as raw OOXML through zipfile so it regenerates without openpyxl.
"""
import zipfile
import os

ROOT = os.path.join(os.path.dirname(__file__), "..", "fixtures")
OUT = os.path.abspath(os.path.join(ROOT, "styles-showcase.xlsx"))


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
  <sheets><sheet name="Styles" sheetId="1" r:id="rId1"/></sheets>
</workbook>'''

# --- fonts ------------------------------------------------------------------
# index: 0 base, 1 bold, 2 italic, 3 underline, 4 strike, 5 big, 6 small,
#        7 coloured, 8 bold+coloured on fill
FONTS = [
    '<font><sz val="11"/><color rgb="FF000000"/><name val="Calibri"/></font>',
    '<font><b/><sz val="11"/><color rgb="FF000000"/><name val="Calibri"/></font>',
    '<font><i/><sz val="11"/><color rgb="FF000000"/><name val="Calibri"/></font>',
    '<font><u/><sz val="11"/><color rgb="FF000000"/><name val="Calibri"/></font>',
    '<font><strike/><sz val="11"/><color rgb="FF000000"/><name val="Calibri"/></font>',
    '<font><sz val="18"/><color rgb="FF000000"/><name val="Calibri"/></font>',
    '<font><sz val="8"/><color rgb="FF000000"/><name val="Calibri"/></font>',
    '<font><sz val="11"/><color rgb="FF4285F4"/><name val="Calibri"/></font>',
    '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>',
]

# --- fills ------------------------------------------------------------------
# 0 none, 1 gray125 (required), 2 blue, 3 green, 4 amber
FILLS = [
    '<fill><patternFill patternType="none"/></fill>',
    '<fill><patternFill patternType="gray125"/></fill>',
    '<fill><patternFill patternType="solid"><fgColor rgb="FF1A73E8"/></patternFill></fill>',
    '<fill><patternFill patternType="solid"><fgColor rgb="FF34A853"/></patternFill></fill>',
    '<fill><patternFill patternType="solid"><fgColor rgb="FFFBBC04"/></patternFill></fill>',
]

# --- borders ----------------------------------------------------------------
# 0 none, then one per line style all round, then per-edge cases.
RED = "FFEA4335"
BLUE = "FF1A73E8"
GREEN = "FF34A853"


def all_round(style, rgb):
    edges = "".join(
        f'<{e} style="{style}"><color rgb="{rgb}"/></{e}>'
        for e in ("left", "right", "top", "bottom")
    )
    return f"<border>{edges}</border>"


def one_edge(edge, style, rgb):
    return f'<border><{edge} style="{style}"><color rgb="{rgb}"/></{edge}></border>'


BORDER_STYLES = [
    ("thin", RED),
    ("medium", RED),
    ("thick", RED),
    ("double", RED),
    ("dashed", BLUE),
    ("dotted", BLUE),
    ("dashDot", GREEN),
    ("hair", GREEN),
]

BORDERS = ["<border/>"]
for st, rgb in BORDER_STYLES:
    BORDERS.append(all_round(st, rgb))
# per-edge only, to prove edges are independent
BORDERS.append(one_edge("bottom", "thick", BLUE))
BORDERS.append(one_edge("left", "medium", GREEN))
BORDERS.append(one_edge("top", "dashed", RED))
# a border with no <color> must default to black
BORDERS.append('<border><left style="thin"/><right style="thin"/>'
               '<top style="thin"/><bottom style="thin"/></border>')

# --- cellXfs ----------------------------------------------------------------
# 0 plain
XFS = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>']
XF = {"plain": 0}


def add_xf(name, *, font=0, fill=0, border=0, numfmt=0, align=None,
           valign=None, wrap=False, rotation=None):
    attrs = (f'numFmtId="{numfmt}" fontId="{font}" fillId="{fill}" '
             f'borderId="{border}" xfId="0" applyFont="1" applyFill="1" '
             f'applyBorder="1" applyNumberFormat="1"')
    parts = []
    if align:
        parts.append(f'horizontal="{align}"')
    if valign:
        parts.append(f'vertical="{valign}"')
    if wrap:
        parts.append('wrapText="1"')
    if rotation is not None:
        # OOXML: 0..90 anticlockwise, 91..180 = 1..90 clockwise, 255 stacked.
        parts.append(f'textRotation="{rotation}"')
    if parts:
        XFS.append(f'<xf {attrs} applyAlignment="1"><alignment {" ".join(parts)}/></xf>')
    else:
        XFS.append(f"<xf {attrs}/>")
    XF[name] = len(XFS) - 1


add_xf("header", font=8, fill=2, align="center")
add_xf("fillBlue", fill=2)
add_xf("fillGreen", fill=3)
add_xf("fillAmber", fill=4)
for i, (st, _rgb) in enumerate(BORDER_STYLES):
    add_xf(f"b_{st}", border=i + 1)
add_xf("b_bottomThick", border=len(BORDER_STYLES) + 1)
add_xf("b_leftMedium", border=len(BORDER_STYLES) + 2)
add_xf("b_topDashed", border=len(BORDER_STYLES) + 3)
add_xf("b_default", border=len(BORDER_STYLES) + 4)
add_xf("r_45", rotation=45, align="center")
add_xf("r_90", rotation=90, align="center")
add_xf("r_down45", rotation=135, align="center")
add_xf("r_stacked", rotation=255, align="center")
add_xf("f_bold", font=1)
add_xf("f_italic", font=2)
add_xf("f_underline", font=3)
add_xf("f_strike", font=4)
add_xf("f_big", font=5)
add_xf("f_small", font=6)
add_xf("f_color", font=7)
add_xf("n_2dp", numfmt=2, align="right")
add_xf("n_pct", numfmt=9, align="right")
add_xf("n_money", numfmt=164, align="right")
add_xf("a_wrap", wrap=True, valign="top")
add_xf("a_top", valign="top")
add_xf("a_middle", valign="center")
add_xf("a_bottom", valign="bottom")

STYLES = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0.00"/>
  </numFmts>
  <fonts count="{len(FONTS)}">{"".join(FONTS)}</fonts>
  <fills count="{len(FILLS)}">{"".join(FILLS)}</fills>
  <borders count="{len(BORDERS)}">{"".join(BORDERS)}</borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="{len(XFS)}">{"".join(XFS)}</cellXfs>
</styleSheet>'''

# --- sheet ------------------------------------------------------------------
SHARED = []


def sst(text):
    if text not in SHARED:
        SHARED.append(text)
    return SHARED.index(text)


rows = {}


def put(ref, value, style="plain", numeric=False):
    col = "".join(ch for ch in ref if ch.isalpha())
    row = int("".join(ch for ch in ref if ch.isdigit()))
    s = XF[style]
    if value is None:
        cell = f'<c r="{ref}" s="{s}"/>'
    elif numeric:
        cell = f'<c r="{ref}" s="{s}"><v>{value}</v></c>'
    else:
        cell = f'<c r="{ref}" s="{s}" t="s"><v>{sst(value)}</v></c>'
    rows.setdefault(row, []).append((col, cell))


put("A1", "Section", "header")
put("B1", "Sample", "header")
put("C1", "Sample", "header")
put("D1", "Sample", "header")

put("A3", "Background", "f_bold")
put("B3", None, "fillBlue")
put("C3", None, "fillGreen")
put("D3", None, "fillAmber")

put("A5", "Border", "f_bold")
r = 5
for i, (st, _rgb) in enumerate(BORDER_STYLES):
    ref_row = 5 + (i // 3) * 2
    ref_col = "BCD"[i % 3]
    put(f"{ref_col}{ref_row}", st, f"b_{st}")
put("B11", "bottom", "b_bottomThick")
put("C11", "left", "b_leftMedium")
put("D11", "top", "b_topDashed")
put("B13", "default black", "b_default")

put("A15", "Font", "f_bold")
put("B15", "bold", "f_bold")
put("C15", "italic", "f_italic")
put("D15", "underline", "f_underline")
put("B16", "strike", "f_strike")
put("C16", "18pt", "f_big")
put("D16", "8pt", "f_small")
put("B17", "coloured", "f_color")

put("A21", "Wrap", "f_bold")
put("B21", "This sentence is far too long for one cell and must wrap onto several lines.", "a_wrap")
put("C21", "top", "a_top")
put("D21", "middle", "a_middle")
put("A23", "Overflow", "f_bold")
put("B23", "This long text spills across the empty neighbours to its right")
put("A25", "Truncate", "f_bold")
put("B25", "This long text is cut because the next cell is occupied")
put("C25", "blocked")

put("A27", "Rotation", "f_bold")
put("B27", "45 up", "r_45")
put("C27", "90 up", "r_90")
put("D27", "45 down", "r_down45")
put("B28", "stacked", "r_stacked")

put("A19", "Format", "f_bold")
put("B19", "0.25", "n_2dp", numeric=True)
put("C19", "0.25", "n_pct", numeric=True)
put("D19", "1234.5", "n_money", numeric=True)

row_xml = []
for rnum in sorted(rows):
    cells = "".join(c for _col, c in sorted(rows[rnum], key=lambda t: (len(t[0]), t[0])))
    row_xml.append(f'<row r="{rnum}">{cells}</row>')

SHEET = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:D28"/>
  <cols>
    <col min="1" max="1" width="16" customWidth="1"/>
    <col min="2" max="4" width="18" customWidth="1"/>
  </cols>
  <sheetData>{"".join(row_xml)}</sheetData>
</worksheet>'''

SST = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
       f'<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
       f'count="{len(SHARED)}" uniqueCount="{len(SHARED)}">'
       + "".join(f"<si><t>{t}</t></si>" for t in SHARED)
       + "</sst>")

write_xlsx(OUT, {
    "[Content_Types].xml": CONTENT_TYPES,
    "_rels/.rels": RELS,
    "xl/workbook.xml": WB,
    "xl/_rels/workbook.xml.rels": WB_RELS,
    "xl/worksheets/sheet1.xml": SHEET,
    "xl/sharedStrings.xml": SST,
    "xl/styles.xml": STYLES,
})
print("wrote", OUT)
print(f"  {len(BORDERS)} borders, {len(FONTS)} fonts, {len(XFS)} cellXfs")
