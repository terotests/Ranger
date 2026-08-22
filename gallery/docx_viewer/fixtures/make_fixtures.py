#!/usr/bin/env python3
"""Regenerate WordprocessingML .docx fixtures for gallery/docx_viewer."""
from __future__ import annotations

import io
import zipfile
from pathlib import Path
from typing import Any, Iterable, Optional

FIX = Path(__file__).resolve().parent

CT = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>'''

RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''

STYLES_XML = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:sz w:val="22"/>
    </w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr>
      <w:spacing w:after="160" w:line="276" w:lineRule="auto"/>
    </w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/><w:qFormat/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:qFormat/>
    <w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="1F4E79"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:qFormat/>
    <w:pPr><w:spacing w:before="200" w:after="100"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="2E75B6"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/>
    <w:pPr><w:jc w:val="center"/><w:spacing w:after="200"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="40"/><w:color w:val="0D1B2A"/></w:rPr>
  </w:style>
</w:styles>'''

NUMBERING = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="bullet"/>
      <w:lvlText w:val="-"/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
    </w:lvl>
    <w:lvl w:ilvl="1">
      <w:start w:val="1"/>
      <w:numFmt w:val="bullet"/>
      <w:lvlText w:val="-"/>
      <w:pPr><w:ind w:left="1440" w:hanging="360"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:abstractNum w:abstractNumId="1">
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="decimal"/>
      <w:lvlText w:val="%1."/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:abstractNum w:abstractNumId="2">
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="decimal"/>
      <w:lvlText w:val="%1."/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
    </w:lvl>
    <w:lvl w:ilvl="1">
      <w:start w:val="1"/>
      <w:numFmt w:val="lowerLetter"/>
      <w:lvlText w:val="%2)"/>
      <w:pPr><w:ind w:left="1440" w:hanging="360"/></w:pPr>
    </w:lvl>
    <w:lvl w:ilvl="2">
      <w:start w:val="1"/>
      <w:numFmt w:val="lowerRoman"/>
      <w:lvlText w:val="%3."/>
      <w:pPr><w:ind w:left="2160" w:hanging="360"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
  <w:num w:numId="3"><w:abstractNumId w:val="2"/></w:num>
</w:numbering>'''

NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
IMG_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"
HDR_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header"
FTR_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer"
HDR_CT = "application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"
FTR_CT = "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"


def _esc(s: str) -> str:
    """XML attribute escaping. Alt text is the author's prose and will contain
    ampersands and quotes sooner or later."""
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def p(
    text_runs,
    pstyle=None,
    jc=None,
    numId=None,
    ilvl=0,
    drawing_rid=None,
    extent=None,
    alt=None,
    alt_title=None,
    firstLine=None,
    hanging=None,
    left=None,
    spacing_before=None,
    spacing_after=None,
    underline=False,
    sect_pr_xml=None,
):
    """Build a w:p. text_runs: list of (text, bold, italic, sz, color) or 6-tuples with underline."""
    ppr = []
    if pstyle:
        ppr.append(f'<w:pStyle w:val="{pstyle}"/>')
    if jc:
        ppr.append(f'<w:jc w:val="{jc}"/>')
    if numId is not None:
        ppr.append(
            f'<w:numPr><w:ilvl w:val="{ilvl}"/><w:numId w:val="{numId}"/></w:numPr>'
        )
    ind_attrs = []
    if left is not None:
        ind_attrs.append(f'w:left="{left}"')
    if firstLine is not None:
        ind_attrs.append(f'w:firstLine="{firstLine}"')
    if hanging is not None:
        ind_attrs.append(f'w:hanging="{hanging}"')
    if ind_attrs:
        ppr.append(f'<w:ind {" ".join(ind_attrs)}/>')
    sp_attrs = []
    if spacing_before is not None:
        sp_attrs.append(f'w:before="{spacing_before}"')
    if spacing_after is not None:
        sp_attrs.append(f'w:after="{spacing_after}"')
    if sp_attrs:
        ppr.append(f'<w:spacing {" ".join(sp_attrs)}/>')
    if sect_pr_xml:
        ppr.append(sect_pr_xml)
    ppr_xml = f'<w:pPr>{"".join(ppr)}</w:pPr>' if ppr else ""
    runs = []
    for item in text_runs:
        if len(item) == 5:
            t, bold, italic, sz, color = item
            ul = underline
        else:
            t, bold, italic, sz, color, ul = item
        rpr = []
        if bold:
            rpr.append("<w:b/>")
        if italic:
            rpr.append("<w:i/>")
        if ul:
            rpr.append('<w:u w:val="single"/>')
        if sz:
            rpr.append(f'<w:sz w:val="{sz}"/>')
        if color:
            rpr.append(f'<w:color w:val="{color}"/>')
        rpr_xml = f'<w:rPr>{"".join(rpr)}</w:rPr>' if rpr else ""
        runs.append(f'<w:r>{rpr_xml}<w:t xml:space="preserve">{t}</w:t></w:r>')
    if drawing_rid:
        cx, cy = extent or (2286000, 1143000)  # 2.5" x 1.25"
        # wp:docPr carries the author's alt text. A picture with none is the
        # ordinary case in these fixtures and is left without one on purpose:
        # a viewer has to be able to say "the document has no alt text here"
        # as clearly as it says what the alt text is.
        doc_pr = ""
        if alt is not None or alt_title is not None:
            attrs = 'id="1" name="%s"' % _esc(alt_title or "Picture 1")
            if alt is not None:
                attrs += ' descr="%s"' % _esc(alt)
            if alt_title is not None:
                attrs += ' title="%s"' % _esc(alt_title)
            doc_pr = "<wp:docPr %s/>" % attrs
        runs.append(
            f'''<w:r><w:drawing>
  <wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
             xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <wp:extent cx="{cx}" cy="{cy}"/>{doc_pr}
    <a:graphic>
      <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
        <pic:pic>
          <pic:blipFill>
            <a:blip r:embed="{drawing_rid}"/>
          </pic:blipFill>
        </pic:pic>
      </a:graphicData>
    </a:graphic>
  </wp:inline>
</w:drawing></w:r>'''
        )
    return f"<w:p>{ppr_xml}{''.join(runs)}</w:p>"


def page_break_p():
    """Paragraph containing an explicit page break."""
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


def sect_pr(
    w=12240,
    h=15840,
    orient=None,
    top=1440,
    right=1440,
    bottom=1440,
    left=1440,
    header_rid=None,
    footer_rid=None,
    title_pg=False,
):
    """Build a w:sectPr element (usable as body final or inside pPr for section breaks)."""
    parts = []
    if header_rid:
        parts.append(
            f'<w:headerReference w:type="default" r:id="{header_rid}"/>'
        )
    if footer_rid:
        parts.append(
            f'<w:footerReference w:type="default" r:id="{footer_rid}"/>'
        )
    if title_pg:
        parts.append("<w:titlePg/>")
    sz_attrs = f'w:w="{w}" w:h="{h}"'
    if orient:
        sz_attrs += f' w:orient="{orient}"'
    parts.append(f"<w:pgSz {sz_attrs}/>")
    parts.append(
        f'<w:pgMar w:top="{top}" w:right="{right}" w:bottom="{bottom}" w:left="{left}"/>'
    )
    return f'<w:sectPr xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">{"".join(parts)}</w:sectPr>'


def table(rows: list[list[dict | str | tuple]], col_widths: Optional[list[int]] = None) -> str:
    """
    Build a w:tbl.

    Each cell may be:
      - str
      - (text,) / (text, opts_dict)
      - dict with keys: text, gridSpan, fill, borders (dict of side->val/color/sz)
    """
    if not rows:
        return ""
    ncols = 0
    for row in rows:
        span_sum = 0
        for cell in row:
            opts = _cell_opts(cell)
            span_sum += int(opts.get("gridSpan", 1))
        ncols = max(ncols, span_sum)
    if col_widths is None:
        each = max(1440, 9000 // max(1, ncols))
        col_widths = [each] * ncols
    grid = "".join(f'<w:gridCol w:w="{w}"/>' for w in col_widths)
    trs = []
    for row in rows:
        tcs = []
        for cell in row:
            opts = _cell_opts(cell)
            text = opts.get("text", "")
            tcpr = []
            if opts.get("gridSpan", 1) > 1:
                tcpr.append(f'<w:gridSpan w:val="{opts["gridSpan"]}"/>')
            if opts.get("fill"):
                tcpr.append(
                    f'<w:shd w:val="clear" w:color="auto" w:fill="{opts["fill"]}"/>'
                )
            borders = opts.get("borders")
            if borders:
                sides = []
                for side in ("top", "left", "bottom", "right"):
                    b = borders.get(side) or borders.get("all")
                    if not b:
                        continue
                    val = b.get("val", "single")
                    sz = b.get("sz", 8)
                    color = b.get("color", "000000")
                    sides.append(
                        f'<w:{side} w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
                    )
                if sides:
                    tcpr.append(f'<w:tcBorders>{"".join(sides)}</w:tcBorders>')
            tcpr_xml = f'<w:tcPr>{"".join(tcpr)}</w:tcPr>' if tcpr else ""
            bold = opts.get("bold", False)
            para = p([(text, bold, False, None, None)])
            tcs.append(f"<w:tc>{tcpr_xml}{para}</w:tc>")
        trs.append(f'<w:tr>{"".join(tcs)}</w:tr>')
    return (
        f'<w:tbl>'
        f'<w:tblPr><w:tblW w:w="0" w:type="auto"/>'
        f'<w:tblBorders>'
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="666666"/>'
        f'<w:left w:val="single" w:sz="4" w:space="0" w:color="666666"/>'
        f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="666666"/>'
        f'<w:right w:val="single" w:sz="4" w:space="0" w:color="666666"/>'
        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="AAAAAA"/>'
        f'<w:insideV w:val="single" w:sz="4" w:space="0" w:color="AAAAAA"/>'
        f"</w:tblBorders></w:tblPr>"
        f"<w:tblGrid>{grid}</w:tblGrid>"
        f'{"".join(trs)}'
        f"</w:tbl>"
    )


def _cell_opts(cell: Any) -> dict:
    if isinstance(cell, str):
        return {"text": cell}
    if isinstance(cell, tuple):
        if len(cell) == 1:
            return {"text": cell[0]}
        if len(cell) == 2 and isinstance(cell[1], dict):
            out = dict(cell[1])
            out["text"] = cell[0]
            return out
        return {"text": str(cell[0])}
    if isinstance(cell, dict):
        return cell
    return {"text": str(cell)}


def doc_xml(body_paras, final_sect_pr: Optional[str] = None):
    sect = final_sect_pr or sect_pr()
    # sect_pr() already includes xmlns:r; strip duplicate xmlns when embedding
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    {"".join(body_paras)}
    {sect}
  </w:body>
</w:document>'''


def make_jpeg_bytes(w=240, h=120, color=(30, 90, 160)):
    import subprocess
    import tempfile

    hexcol = f"0x{color[0]:02X}{color[1]:02X}{color[2]:02X}"
    with tempfile.NamedTemporaryFile(suffix=".jpeg", delete=False) as tmp:
        path = tmp.name
    try:
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-f",
                "lavfi",
                "-i",
                f"color=c={hexcol}:s={w}x{h}",
                "-frames:v",
                "1",
                path,
            ],
            check=True,
            capture_output=True,
        )
        return Path(path).read_bytes()
    finally:
        try:
            Path(path).unlink()
        except OSError:
            pass


def make_png_bytes(w=160, h=100, color=(40, 140, 80)):
    from PIL import Image

    img = Image.new("RGB", (w, h), color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _header_xml(paras: list[str]) -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  {"".join(paras)}
</w:hdr>'''


def _footer_xml(paras: list[str]) -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  {"".join(paras)}
</w:ftr>'''


def write_docx(
    name,
    paras,
    extra_rels=None,
    media=None,
    headers=None,
    footers=None,
    content_type_overrides=None,
    final_sect_pr: Optional[str] = None,
    numbering: Optional[str] = None,
):
    """
    Write a .docx package.

    headers: list of (part_name, xml_bytes_or_str) e.g. ('word/header1.xml', xml)
    footers: list of (part_name, xml_bytes_or_str)
    content_type_overrides: list of (PartName, ContentType)
    extra_rels: list of (rid, target, type) added to document.xml.rels
    """
    path = FIX / name
    doc_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
'''
    if extra_rels:
        for rid, target, typ in extra_rels:
            doc_rels += f'  <Relationship Id="{rid}" Type="{typ}" Target="{target}"/>\n'
    doc_rels += "</Relationships>"

    ct = CT
    if content_type_overrides:
        # Insert overrides before closing </Types>
        extra = "".join(
            f'  <Override PartName="{pn}" ContentType="{ctype}"/>\n'
            for pn, ctype in content_type_overrides
        )
        ct = ct.replace("</Types>", extra + "</Types>")

    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", ct)
        z.writestr("_rels/.rels", RELS)
        z.writestr("word/_rels/document.xml.rels", doc_rels)
        z.writestr("word/styles.xml", STYLES_XML)
        z.writestr("word/numbering.xml", numbering or NUMBERING)
        z.writestr("word/document.xml", doc_xml(paras, final_sect_pr=final_sect_pr))
        if media:
            for part, data in media:
                z.writestr(part, data)
        if headers:
            for part, data in headers:
                z.writestr(part, data if isinstance(data, (bytes, bytearray)) else data.encode("utf-8"))
        if footers:
            for part, data in footers:
                z.writestr(part, data if isinstance(data, (bytes, bytearray)) else data.encode("utf-8"))
    print("wrote", path.name, path.stat().st_size, "bytes")


def _body_lorem(n: int = 1) -> list[str]:
    sentence = (
        "Ranger DOCX layout measures paragraphs, wraps text to the content width, "
        "and paginates across section page sizes with margins from sectPr. "
    )
    out = []
    for i in range(n):
        out.append(
            p([(f"({i + 1}) {sentence * 3}", False, False, None, None)])
        )
    return out


if __name__ == "__main__":
    # --- existing fixtures (compat names) ---
    write_docx(
        "hello.docx",
        [
            p([("Ranger DOCX Viewer", True, False, None, None)], pstyle="Title"),
            p(
                [
                    ("Hello ", False, False, None, None),
                    ("world", True, False, None, None),
                    (" -- ", False, False, None, None),
                    ("paragraphs", False, True, None, None),
                    (" with ", False, False, None, None),
                    ("runs", True, True, None, None),
                    (".", False, False, None, None),
                ]
            ),
            p(
                [
                    (
                        "This sample is a minimal WordprocessingML package (ZIP + OPC parts).",
                        False,
                        False,
                        None,
                        None,
                    )
                ]
            ),
        ],
    )

    write_docx(
        "styles_demo.docx",
        [
            p([("Style Resolution Demo", True, False, None, None)], pstyle="Heading1"),
            p(
                [
                    (
                        "Heading styles come from styles.xml; direct formatting wins on conflict.",
                        False,
                        False,
                        None,
                        None,
                    )
                ]
            ),
            p([("Centered block", False, False, None, None)], jc="center"),
            p([("Right-aligned note", False, True, None, None)], jc="right"),
            p(
                [
                    ("Inline ", False, False, None, None),
                    ("red emphasis", True, False, None, "C00000"),
                    (" and ", False, False, None, None),
                    ("larger text", False, False, "28", None),
                    (".", False, False, None, None),
                ],
                pstyle="Heading2",
            ),
            p(
                [
                    (
                        "Normal body continues after the heading with document defaults (11pt Calibri -> Open Sans).",
                        False,
                        False,
                        None,
                        None,
                    )
                ]
            ),
        ],
    )

    write_docx(
        "lists_demo.docx",
        [
            p([("Lists", True, False, None, None)], pstyle="Heading1"),
            p([("Bullet items", False, False, None, None)], pstyle="Heading2"),
            p([("Open OPC package", False, False, None, None)], numId=1),
            p([("Parse WordprocessingML", False, False, None, None)], numId=1),
            p([("Resolve styles", False, False, None, None)], numId=1),
            p([("Numbered steps", False, False, None, None)], pstyle="Heading2"),
            p([("Read document.xml", False, False, None, None)], numId=2),
            p([("Merge equivalent runs", False, False, None, None)], numId=2),
            p([("Paginate via DocumentLayout", False, False, None, None)], numId=2),
            p([("Outline (multi-level)", False, False, None, None)], pstyle="Heading2"),
            p([("Install fonts", False, False, None, None)], numId=3, ilvl=0),
            p([("Open Sans Regular", False, False, None, None)], numId=3, ilvl=1),
            p([("Open Sans Bold", False, False, None, None)], numId=3, ilvl=1),
            p([("Roman detail", False, False, None, None)], numId=3, ilvl=2),
            p([("Parse numbering.xml", False, False, None, None)], numId=3, ilvl=0),
            p([("Done -- EVG paints the resolved page.", False, False, None, None)]),
        ],
    )

    jpeg = make_jpeg_bytes(240, 120, (30, 90, 160))
    write_docx(
        "images_demo.docx",
        [
            p([("Images", True, False, None, None)], pstyle="Heading1"),
            p(
                [
                    (
                        "DrawingML inline picture via a:blip relationship:",
                        False,
                        False,
                        None,
                        None,
                    )
                ]
            ),
            p([], drawing_rid="rId10", extent=(2743200, 1371600), jc="center"),
            p(
                [
                    (
                        "Caption: sample JPEG embedded in the OPC package.",
                        False,
                        True,
                        None,
                        None,
                    )
                ],
                jc="center",
            ),
        ],
        extra_rels=[("rId10", "media/image1.jpeg", IMG_REL)],
        media=[("word/media/image1.jpeg", jpeg)],
    )

    # --- 05 table basic ---
    write_docx(
        "05-table-basic.docx",
        [
            p([("Basic Table", True, False, None, None)], pstyle="Heading1"),
            p([("A simple 3x3 table with a header row.", False, False, None, None)]),
            table(
                [
                    [
                        {"text": "Name", "bold": True},
                        {"text": "Qty", "bold": True},
                        {"text": "Notes", "bold": True},
                    ],
                    ["Alpha", "10", "first"],
                    ["Beta", "20", "second"],
                    ["Gamma", "30", "third"],
                ],
                col_widths=[3000, 1500, 4500],
            ),
        ],
    )

    # --- 06 table format ---
    border_all = {"all": {"val": "single", "sz": 12, "color": "1F4E79"}}
    write_docx(
        "06-table-format.docx",
        [
            p([("Formatted Table", True, False, None, None)], pstyle="Heading1"),
            p([("Cell backgrounds and borders.", False, False, None, None)]),
            table(
                [
                    [
                        {"text": "A", "fill": "1F4E79", "bold": True, "borders": border_all},
                        {"text": "B", "fill": "2E75B6", "bold": True, "borders": border_all},
                        {"text": "C", "fill": "5B9BD5", "bold": True, "borders": border_all},
                    ],
                    [
                        {"text": "soft", "fill": "D6EAF8", "borders": border_all},
                        {"text": "mid", "fill": "AED6F1", "borders": border_all},
                        {"text": "deep", "fill": "85C1E9", "borders": border_all},
                    ],
                ],
                col_widths=[2500, 2500, 2500],
            ),
        ],
    )

    # --- 07 table merged ---
    write_docx(
        "07-table-merged.docx",
        [
            p([("Merged Cells", True, False, None, None)], pstyle="Heading1"),
            p([("Horizontal merge via w:gridSpan.", False, False, None, None)]),
            table(
                [
                    [{"text": "Spanning header", "gridSpan": 3, "bold": True, "fill": "E7E6E6"}],
                    ["Left", "Middle", "Right"],
                    [{"text": "Two columns", "gridSpan": 2}, "Solo"],
                ],
                col_widths=[2400, 2400, 2400],
            ),
        ],
    )

    # --- 08 multi-page via volume ---
    write_docx(
        "08-pages.docx",
        [
            p([("Multi-page Flow", True, False, None, None)], pstyle="Title"),
            p(
                [
                    (
                        "Enough body text to paginate past one letter-size page.",
                        False,
                        False,
                        None,
                        None,
                    )
                ]
            ),
            *_body_lorem(28),
        ],
    )

    # --- 09 explicit page break ---
    write_docx(
        "09-page-break.docx",
        [
            p([("Page One", True, False, None, None)], pstyle="Heading1"),
            p([("Content before the explicit page break.", False, False, None, None)]),
            page_break_p(),
            p([("Page Two", True, False, None, None)], pstyle="Heading1"),
            p([("Content after the page break.", False, False, None, None)]),
        ],
    )

    # --- 10 portrait then landscape section ---
    # Section break in last para of first section; final sectPr is landscape.
    write_docx(
        "10-landscape-section.docx",
        [
            p([("Portrait Section", True, False, None, None)], pstyle="Heading1"),
            p(
                [
                    (
                        "This section uses portrait letter page size.",
                        False,
                        False,
                        None,
                        None,
                    )
                ]
            ),
            p(
                [("End of portrait section.", False, False, None, None)],
                sect_pr_xml=sect_pr(w=12240, h=15840),
            ),
            p([("Landscape Section", True, False, None, None)], pstyle="Heading1"),
            p(
                [
                    (
                        "This section is landscape with swapped page size 15840x12240.",
                        False,
                        False,
                        None,
                        None,
                    )
                ]
            ),
        ],
        final_sect_pr=sect_pr(w=15840, h=12240, orient="landscape"),
    )

    # --- 11 mixed margins ---
    write_docx(
        "11-mixed-sections.docx",
        [
            p([("Narrow Margins", True, False, None, None)], pstyle="Heading1"),
            p([("First section uses 720 twip margins.", False, False, None, None)]),
            p(
                [("Section break follows.", False, False, None, None)],
                sect_pr_xml=sect_pr(top=720, right=720, bottom=720, left=720),
            ),
            p([("Wide Margins", True, False, None, None)], pstyle="Heading1"),
            p([("Second section uses 2160 twip margins.", False, False, None, None)]),
        ],
        final_sect_pr=sect_pr(top=2160, right=2160, bottom=2160, left=2160),
    )

    # --- 12 header + footer ---
    hdr = _header_xml(
        [p([("Acme Corp -- Confidential", False, True, "18", "666666")], jc="right")]
    )
    ftr = _footer_xml(
        [p([("Oracle harness footer  -  page sample", False, False, "16", "888888")], jc="center")]
    )
    write_docx(
        "12-header-footer.docx",
        [
            p([("Headers and Footers", True, False, None, None)], pstyle="Title"),
            p(
                [
                    (
                        "sectPr references header1.xml and footer1.xml via relationships.",
                        False,
                        False,
                        None,
                        None,
                    )
                ]
            ),
            p([("Body paragraph under the header band.", False, False, None, None)]),
        ],
        extra_rels=[
            ("rId10", "header1.xml", HDR_REL),
            ("rId11", "footer1.xml", FTR_REL),
        ],
        headers=[("word/header1.xml", hdr)],
        footers=[("word/footer1.xml", ftr)],
        content_type_overrides=[
            ("/word/header1.xml", HDR_CT),
            ("/word/footer1.xml", FTR_CT),
        ],
        final_sect_pr=sect_pr(header_rid="rId10", footer_rid="rId11"),
    )

    # --- 23 alt text: what a screen reader has to go on -------------------
    #
    # Two pictures: one whose author wrote alt text, and one whose author did
    # not. Both cases have to be visible, because a viewer that cannot tell
    # them apart cannot report the second as the accessibility failure it is.
    alt_png_a = make_png_bytes(200, 120, (60, 120, 200))
    alt_png_b = make_png_bytes(140, 90, (200, 120, 60))
    write_docx(
        "23-image-alt-text.docx",
        [
            p([("Alt text", True, False, None, None)], pstyle="Heading1"),
            p(
                [],
                drawing_rid="rId10",
                extent=(1828800, 1097280),
                jc="center",
                alt="Quarterly revenue by region, rising from 8.1 to 13.9 million",
                alt_title="Revenue chart",
            ),
            p([("The picture above has alt text.", False, False, None, None)]),
            p([], drawing_rid="rId11", extent=(1280160, 823088), jc="center"),
            p([("The picture above has none.", False, False, None, None)]),
        ],
        extra_rels=[
            ("rId10", "media/image1.png", IMG_REL),
            ("rId11", "media/image2.png", IMG_REL),
        ],
        media=[
            ("word/media/image1.png", alt_png_a),
            ("word/media/image2.png", alt_png_b),
        ],
        content_type_overrides=[
            ("/word/media/image1.png", "image/png"),
            ("/word/media/image2.png", "image/png"),
        ],
    )

    # --- 13 mixed images ---
    jpeg2 = make_jpeg_bytes(180, 100, (180, 60, 40))
    png = make_png_bytes(160, 100, (40, 140, 80))
    write_docx(
        "13-images-mixed.docx",
        [
            p([("Mixed Images", True, False, None, None)], pstyle="Heading1"),
            p([("JPEG then PNG media parts.", False, False, None, None)]),
            p([], drawing_rid="rId10", extent=(2057400, 1143000), jc="center"),
            p([("JPEG sample", False, True, None, None)], jc="center"),
            p([], drawing_rid="rId11", extent=(1828800, 1143000), jc="center"),
            p([("PNG sample", False, True, None, None)], jc="center"),
        ],
        extra_rels=[
            ("rId10", "media/image1.jpeg", IMG_REL),
            ("rId11", "media/image2.png", IMG_REL),
        ],
        media=[
            ("word/media/image1.jpeg", jpeg2),
            ("word/media/image2.png", png),
        ],
    )

    # --- 14 styles / indent ---
    write_docx(
        "14-styles-indent.docx",
        [
            p([("Indent and Spacing", True, False, None, None)], pstyle="Heading1"),
            p(
                [
                    (
                        "First-line indent paragraph: the opening line is pushed in while subsequent lines return to the left margin.",
                        False,
                        False,
                        None,
                        None,
                    )
                ],
                firstLine=720,
                spacing_before=200,
                spacing_after=200,
            ),
            p(
                [
                    (
                        "Hanging indent paragraph: the first line hangs left of the body block used for wrapped lines.",
                        False,
                        False,
                        None,
                        None,
                    )
                ],
                left=720,
                hanging=360,
                spacing_after=200,
            ),
            p(
                [
                    ("Underlined ", False, False, None, None, True),
                    ("and justified ", False, False, None, None),
                    ("body text for alignment coverage.", False, False, None, None),
                ],
                jc="both",
                spacing_after=200,
            ),
            p([("Done with indent fixtures.", False, True, None, None)]),
        ],
    )

    # --- 20 business report (kitchen sink) ---
    report_jpeg = make_jpeg_bytes(320, 160, (20, 70, 120))
    report_hdr = _header_xml(
        [p([("Northwind Quarterly Report", True, False, "18", "1F4E79")], jc="left")]
    )
    report_ftr = _footer_xml(
        [p([("Internal use only", False, False, "16", "666666")], jc="center")]
    )
    report_paras = [
        p([("Northwind Quarterly Business Report", True, False, None, None)], pstyle="Title"),
        p([("Q2 FY2026  -  Prepared for executive review", False, True, None, None)], jc="center"),
        p([("1. Executive Summary", True, False, None, None)], pstyle="Heading1"),
        p(
            [
                ("Revenue ", False, False, None, None),
                ("grew 12%", True, False, None, "C00000"),
                (" while operating expenses remained ", False, False, None, None),
                ("flat", False, True, None, None),
                (". Customer retention improved across enterprise accounts.", False, False, None, None),
            ]
        ),
        p([("2. Highlights", True, False, None, None)], pstyle="Heading1"),
        p([("2.1 Product", True, False, None, None)], pstyle="Heading2"),
        p([("Shipped DOCX viewer milestone", False, False, None, None)], numId=2),
        p([("Expanded fixture coverage", False, False, None, None)], numId=2),
        p([("Oracle harness draft", False, False, None, None)], numId=2),
        p([("2.2 Operations", True, False, None, None)], pstyle="Heading2"),
        p([("Hiring", False, False, None, None)], numId=1),
        p([("Engineering", False, False, None, None)], numId=1, ilvl=1),
        p([("Design", False, False, None, None)], numId=1, ilvl=1),
        p([("Infra upgrades", False, False, None, None)], numId=1),
        p([("Outline priorities", False, False, None, None)], numId=3, ilvl=0),
        p([("Layout fidelity", False, False, None, None)], numId=3, ilvl=1),
        p([("Visual oracles", False, False, None, None)], numId=3, ilvl=2),
        p([("3. Metrics Table", True, False, None, None)], pstyle="Heading1"),
        table(
            [
                [
                    {"text": "Metric", "bold": True, "fill": "D9E2F3"},
                    {"text": "Q1", "bold": True, "fill": "D9E2F3"},
                    {"text": "Q2", "bold": True, "fill": "D9E2F3"},
                ],
                ["ARR ($M)", "12.4", "13.9"],
                ["NPS", "42", "48"],
                ["Support tickets", "910", "860"],
            ],
            col_widths=[3000, 2000, 2000],
        ),
        p([("4. Product Snapshot", True, False, None, None)], pstyle="Heading1"),
        p([], drawing_rid="rId20", extent=(3657600, 1828800), jc="center"),
        p([("Figure: product engagement chart (placeholder JPEG).", False, True, None, None)], jc="center"),
        *_body_lorem(10),
        page_break_p(),
        p([("5. Deep Dive", True, False, None, None)], pstyle="Heading1"),
        *_body_lorem(12),
        p(
            [("End of portrait deep-dive section.", False, False, None, None)],
            sect_pr_xml=sect_pr(
                w=12240,
                h=15840,
                header_rid="rId10",
                footer_rid="rId11",
            ),
        ),
        p([("6. Landscape Appendix", True, False, None, None)], pstyle="Heading1"),
        p(
            [
                (
                    "Wide appendix section for charts that need landscape orientation.",
                    False,
                    False,
                    None,
                    None,
                )
            ]
        ),
        table(
            [
                [
                    {"text": "Region", "bold": True},
                    {"text": "Growth", "bold": True},
                    {"text": "Owner", "bold": True},
                    {"text": "Status", "bold": True},
                ],
                ["AMER", "+14%", "Lee", "On track"],
                ["EMEA", "+9%", "Novak", "Watch"],
                ["APAC", "+18%", "Chen", "On track"],
            ],
            col_widths=[2200, 2200, 2200, 2200],
        ),
        *_body_lorem(6),
    ]
    write_docx(
        "20-business-report.docx",
        report_paras,
        extra_rels=[
            ("rId10", "header1.xml", HDR_REL),
            ("rId11", "footer1.xml", FTR_REL),
            ("rId20", "media/chart.jpeg", IMG_REL),
        ],
        media=[("word/media/chart.jpeg", report_jpeg)],
        headers=[("word/header1.xml", report_hdr)],
        footers=[("word/footer1.xml", report_ftr)],
        content_type_overrides=[
            ("/word/header1.xml", HDR_CT),
            ("/word/footer1.xml", FTR_CT),
        ],
        final_sect_pr=sect_pr(
            w=15840,
            h=12240,
            orient="landscape",
            header_rid="rId10",
            footer_rid="rId11",
        ),
    )

    print("all fixtures ready in", FIX)
