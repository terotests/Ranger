#!/usr/bin/env python3
"""Build minimal OOXML .pptx fixtures for the Ranger PPTX viewer MVP."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures"


def crc32_png(data: bytes) -> int:
    return zlib.crc32(data) & 0xFFFFFFFF


def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc32_png(tag + data))


def solid_png(r: int, g: int, b: int, w: int = 64, h: int = 48) -> bytes:
    """Tiny uncompressed-scanline PNG (RGB)."""
    raw = b""
    row = bytes([0, r, g, b] * w)  # filter=None + RGB pixels — wrong layout
    # Correct: each row starts with filter byte 0, then RGB triples.
    row = bytes([0]) + bytes([r, g, b]) * w
    raw = row * h
    compressed = zlib.compress(raw, 9)
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", compressed)
        + chunk(b"IEND", b"")
    )


CT = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  {overrides}
</Types>
"""

ROOT_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>
"""

THEME = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Ranger">
  <a:themeElements>
    <a:clrScheme name="Ranger">
      <a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
      <a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="44546A"/></a:dk2>
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
    <a:fontScheme name="Ranger">
      <a:majorFont>
        <a:latin typeface="Calibri Light"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:majorFont>
      <a:minorFont>
        <a:latin typeface="Calibri"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Ranger">
      <a:fillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      </a:fillStyleLst>
      <a:lnStyleLst>
        <a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
        <a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
        <a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
      </a:lnStyleLst>
      <a:effectStyleLst>
        <a:effectStyle><a:effectLst/></a:effectStyle>
        <a:effectStyle><a:effectLst/></a:effectStyle>
        <a:effectStyle><a:effectLst/></a:effectStyle>
      </a:effectStyleLst>
      <a:bgFillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      </a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>
"""

MASTER = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill><a:schemeClr val="lt1"/></a:solidFill>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1"
    accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5"
    accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="2147483649" r:id="rId1"/>
  </p:sldLayoutIdLst>
</p:sldMaster>
"""

MASTER_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>
"""

LAYOUT = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank">
  <p:cSld name="Blank">
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>
"""

LAYOUT_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>
"""


def presentation_xml(slide_count: int) -> str:
    ids = "\n".join(
        f'    <p:sldId id="{256 + i}" r:id="rId{i + 2}"/>' for i in range(slide_count)
    )
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
{ids}
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>
"""


def presentation_rels(slide_count: int) -> str:
    rels = [
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>'
    ]
    for i in range(slide_count):
        rels.append(
            f'<Relationship Id="rId{i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i + 1}.xml"/>'
        )
    body = "\n  ".join(rels)
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  {body}
</Relationships>
"""


def sp_tree(*children: str) -> str:
    kids = "\n".join(children)
    return f"""  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="9144000" cy="6858000"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="9144000" cy="6858000"/>
        </a:xfrm>
      </p:grpSpPr>
{kids}
    </p:spTree>
  </p:cSld>"""


def slide_xml(body: str, tail: str = "") -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
{body}
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
{tail}
</p:sld>
"""


def click_effect(cid: int, spid: int, filter_name: str, dur: int,
                 paragraph: int | None = None) -> tuple[str, int]:
    """One click group of a build: a shape appears, with an effect over it."""
    inner = ""
    if paragraph is not None:
        inner = f'<p:txEl><p:pRg st="{paragraph}" end="{paragraph}"/></p:txEl>'
    tgt = f'<p:tgtEl><p:spTgt spid="{spid}">{inner}</p:spTgt></p:tgtEl>'
    xml = (
        f'<p:par><p:cTn id="{cid}" fill="hold">'
        f'<p:stCondLst><p:cond delay="indefinite"/></p:stCondLst><p:childTnLst>'
        f'<p:par><p:cTn id="{cid + 1}" fill="hold">'
        f'<p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>'
        f'<p:par><p:cTn id="{cid + 2}" presetID="1" presetClass="entr" fill="hold"'
        f' nodeType="clickEffect" dur="{dur}">'
        f'<p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>'
        f'<p:set><p:cBhvr><p:cTn id="{cid + 3}" dur="1" fill="hold"/>{tgt}'
        f'<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst>'
        f'</p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>'
        f'<p:animEffect transition="in" filter="{filter_name}">'
        f'<p:cBhvr><p:cTn id="{cid + 4}" dur="{dur}"/>{tgt}</p:cBhvr></p:animEffect>'
        f"</p:childTnLst></p:cTn></p:par>"
        f"</p:childTnLst></p:cTn></p:par>"
        f"</p:childTnLst></p:cTn></p:par>"
    )
    return xml, cid + 5


def timing_xml(effects: str) -> str:
    return (
        '<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never"'
        ' nodeType="tmRoot"><p:childTnLst>'
        '<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite"'
        f' nodeType="mainSeq"><p:childTnLst>{effects}</p:childTnLst></p:cTn>'
        '<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl>'
        "</p:cond></p:prevCondLst>"
        '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl>'
        "</p:cond></p:nextCondLst></p:seq>"
        "</p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>"
    )


def text_shape(
    sid: int,
    name: str,
    x: int,
    y: int,
    cx: int,
    cy: int,
    text: str,
    size_hundredths: int = 3200,
    bold: bool = False,
    color: str | None = None,
    scheme: str | None = "dk1",
    align: str = "l",
    prst: str = "rect",
    fill: str | None = None,
    fill_scheme: str | None = None,
) -> str:
    runs = [
        {
            "text": text,
            "size": size_hundredths,
            "bold": bold,
            "color": color,
            "scheme": scheme,
        }
    ]
    return text_shape_runs(
        sid, name, x, y, cx, cy, runs, align=align, prst=prst, fill=fill, fill_scheme=fill_scheme
    )


def _xml_escape(s: str) -> str:
    return (
        s.replace('&', '&amp;')
        .replace('<', '&lt;')
        .replace('>', '&gt;')
        .replace('"', '&quot;')
    )


def _run_xml(run: dict) -> str:
    b = ' b="1"' if run.get("bold") else ""
    i = ' i="1"' if run.get("italic") else ""
    size = run.get("size", 2400)
    if run.get("color"):
        solid = f'<a:solidFill><a:srgbClr val="{run["color"]}"/></a:solidFill>'
    else:
        scheme = run.get("scheme") or "dk1"
        solid = f'<a:solidFill><a:schemeClr val="{scheme}"/></a:solidFill>'
    face = run.get("font", "Calibri")
    return f"""            <a:r>
              <a:rPr lang="en-US" sz="{size}"{b}{i} dirty="0">
                {solid}
                <a:latin typeface="{face}"/>
              </a:rPr>
              <a:t xml:space="preserve">{_xml_escape(run["text"])}</a:t>
            </a:r>"""


def text_shape_runs(
    sid: int,
    name: str,
    x: int,
    y: int,
    cx: int,
    cy: int,
    paragraphs: list,
    align: str = "l",
    prst: str = "rect",
    fill: str | None = None,
    fill_scheme: str | None = None,
) -> str:
    """paragraphs: list of run-dicts, or list of list-of-run-dicts for multi-para."""
    if fill:
        fill_xml = f'<a:solidFill><a:srgbClr val="{fill}"/></a:solidFill>'
    elif fill_scheme:
        fill_xml = f'<a:solidFill><a:schemeClr val="{fill_scheme}"/></a:solidFill>'
    else:
        fill_xml = "<a:noFill/>"
    # Normalize: if first item is a dict, treat as single paragraph of runs
    if paragraphs and isinstance(paragraphs[0], dict):
        paras = [paragraphs]
    else:
        paras = paragraphs
    p_xml = []
    for para in paras:
        runs = "\n".join(_run_xml(r) for r in para)
        p_xml.append(
            f"""          <a:p>
            <a:pPr algn="{align}"/>
{runs}
          </a:p>"""
        )
    body = "\n".join(p_xml)
    return f"""      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="{sid}" name="{name}"/>
          <p:cNvSpPr txBox="1"/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="{x}" y="{y}"/>
            <a:ext cx="{cx}" cy="{cy}"/>
          </a:xfrm>
          <a:prstGeom prst="{prst}"><a:avLst/></a:prstGeom>
          {fill_xml}
        </p:spPr>
        <p:txBody>
          <a:bodyPr wrap="square" lIns="91440" tIns="91440" rIns="91440" bIns="91440"/>
          <a:lstStyle/>
{body}
        </p:txBody>
      </p:sp>"""


def group_shape(sid: int, name: str, x: int, y: int, cx: int, cy: int, children: list[str],
                ch_x: int = 0, ch_y: int = 0, ch_cx: int | None = None, ch_cy: int | None = None) -> str:
    if ch_cx is None:
        ch_cx = cx
    if ch_cy is None:
        ch_cy = cy
    kids = "\n".join(children)
    return f"""      <p:grpSp>
        <p:nvGrpSpPr>
          <p:cNvPr id="{sid}" name="{name}"/>
          <p:cNvGrpSpPr/>
          <p:nvPr/>
        </p:nvGrpSpPr>
        <p:grpSpPr>
          <a:xfrm>
            <a:off x="{x}" y="{y}"/>
            <a:ext cx="{cx}" cy="{cy}"/>
            <a:chOff x="{ch_x}" y="{ch_y}"/>
            <a:chExt cx="{ch_cx}" cy="{ch_cy}"/>
          </a:xfrm>
        </p:grpSpPr>
{kids}
      </p:grpSp>"""


def rect_shape(
    sid: int,
    name: str,
    x: int,
    y: int,
    cx: int,
    cy: int,
    fill: str = "4472C4",
    rot: int | None = None,
    prst: str = "rect",
) -> str:
    rot_attr = f' rot="{rot}"' if rot is not None else ""
    return f"""      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="{sid}" name="{name}"/>
          <p:cNvSpPr/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm{rot_attr}>
            <a:off x="{x}" y="{y}"/>
            <a:ext cx="{cx}" cy="{cy}"/>
          </a:xfrm>
          <a:prstGeom prst="{prst}"><a:avLst/></a:prstGeom>
          <a:solidFill><a:srgbClr val="{fill}"/></a:solidFill>
          <a:ln w="12700">
            <a:solidFill><a:srgbClr val="223344"/></a:solidFill>
          </a:ln>
        </p:spPr>
      </p:sp>"""


def pic_shape(sid: int, name: str, rid: str, x: int, y: int, cx: int, cy: int) -> str:
    return f"""      <p:pic>
        <p:nvPicPr>
          <p:cNvPr id="{sid}" name="{name}"/>
          <p:cNvPicPr/>
          <p:nvPr/>
        </p:nvPicPr>
        <p:blipFill>
          <a:blip r:embed="{rid}"/>
          <a:stretch><a:fillRect/></a:stretch>
        </p:blipFill>
        <p:spPr>
          <a:xfrm>
            <a:off x="{x}" y="{y}"/>
            <a:ext cx="{cx}" cy="{cy}"/>
          </a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        </p:spPr>
      </p:pic>"""


def slide_rels(layout: bool = True, images: dict[str, str] | None = None,
               extra: list[str] | None = None) -> str:
    rels = []
    if layout:
        rels.append(
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
        )
    if images:
        for rid, target in images.items():
            rels.append(
                f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="{target}"/>'
            )
    # Relationships named by content this reader does not model — a diagram's
    # four parts, a piece of ink. They belong to the slide as much as a
    # picture's does, and a rewrite that dropped them would leave the preserved
    # XML pointing at nothing.
    if extra:
        rels.extend(extra)
    body = "\n  ".join(rels)
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  {body}
</Relationships>
"""



# A theme whose fmtScheme actually does something: a plain fill, a light
# gradient and a dark one, the way Office's own theme is built. Shapes that
# carry only a <p:style> get their look from here.
STYLED_THEME_FMT = """  <a:fmtScheme name="Ranger styled">
      <a:fillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:gradFill rotWithShape="1"><a:gsLst>
          <a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="50000"/></a:schemeClr></a:gs>
          <a:gs pos="100000"><a:schemeClr val="phClr"><a:tint val="20000"/></a:schemeClr></a:gs>
        </a:gsLst><a:lin ang="5400000" scaled="1"/></a:gradFill>
        <a:gradFill rotWithShape="1"><a:gsLst>
          <a:gs pos="0"><a:schemeClr val="phClr"><a:shade val="80000"/></a:schemeClr></a:gs>
          <a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="40000"/></a:schemeClr></a:gs>
        </a:gsLst><a:lin ang="0" scaled="1"/></a:gradFill>
      </a:fillStyleLst>
      <a:lnStyleLst>
        <a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"><a:shade val="50000"/></a:schemeClr></a:solidFill></a:ln>
        <a:ln w="25400"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
        <a:ln w="38100"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
      </a:lnStyleLst>
      <a:effectStyleLst>
        <a:effectStyle><a:effectLst/></a:effectStyle>
        <a:effectStyle><a:effectLst><a:outerShdw blurRad="40000" dist="23000" dir="5400000" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="35000"/></a:srgbClr></a:outerShdw></a:effectLst></a:effectStyle>
        <a:effectStyle><a:effectLst/></a:effectStyle>
      </a:effectStyleLst>
      <a:bgFillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      </a:bgFillStyleLst>
    </a:fmtScheme>"""


def styled_theme() -> str:
    """THEME with its format scheme replaced by one that has gradients in it."""
    start = THEME.index("<a:fmtScheme")
    end = THEME.index("</a:fmtScheme>") + len("</a:fmtScheme>")
    return THEME[:start] + STYLED_THEME_FMT.strip() + THEME[end:]


def adj_shape(sid: int, name: str, x: int, y: int, cx: int, cy: int,
              prst: str, adj: int | None, line: str = "C0504D",
              fill: str | None = "4472C4", w: int = 28575) -> str:
    """A preset with its own adjustment, and possibly no fill — a bracket or a
    brace is a stroke, and a rounded rectangle's corners are what `adj` says."""
    av = f'<a:gd name="adj" fmla="val {adj}"/>' if adj is not None else ""
    fill_xml = f'<a:solidFill><a:srgbClr val="{fill}"/></a:solidFill>' if fill else "<a:noFill/>"
    return f"""      <p:sp>
        <p:nvSpPr><p:cNvPr id="{sid}" name="{name}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>
          <a:prstGeom prst="{prst}"><a:avLst>{av}</a:avLst></a:prstGeom>
          {fill_xml}
          <a:ln w="{w}"><a:solidFill><a:srgbClr val="{line}"/></a:solidFill></a:ln>
        </p:spPr>
      </p:sp>"""


# A master whose typography lives where a deck built by anything but PowerPoint
# puts it: on the master's own placeholder shapes, with `p:txStyles` left as a
# generic black nobody meant. Nine levels, each with its own size, colour,
# indent and bullet.
def inherited_master() -> str:
    def lvl(i: int, size: int, colour: str, indent: int, bullet: str) -> str:
        return (
            f'<a:lvl{i}pPr marL="{indent}" indent="-228600" algn="l">'
            f'<a:buClr><a:srgbClr val="{colour}"/></a:buClr>'
            f'<a:buSzPts val="{size - 200}"/>'
            f'<a:buChar char="{bullet}"/>'
            f'<a:defRPr sz="{size}"><a:solidFill><a:srgbClr val="{colour}"/></a:solidFill>'
            f'<a:latin typeface="Calibri"/></a:defRPr></a:lvl{i}pPr>'
        )
    body_levels = "".join(
        lvl(i, 2800 - (i - 1) * 200, ["1F4E79", "2E75B6", "9DC3E6", "BDD7EE",
                                      "DEEBF7", "F2F2F2", "D9D9D9", "BFBFBF", "A6A6A6"][i - 1],
            457200 * i, "●○■▪•–›»⁃"[i - 1])
        for i in range(1, 10)
    )
    title_style = (
        '<a:lvl1pPr algn="l"><a:buNone/>'
        '<a:defRPr sz="4000" b="1"><a:solidFill><a:srgbClr val="C00000"/></a:solidFill>'
        '<a:latin typeface="Calibri"/></a:defRPr></a:lvl1pPr>'
    )
    ph = (
        '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title Placeholder"/><p:cNvSpPr txBox="1"/>'
        '<p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>'
        '<p:spPr><a:xfrm><a:off x="457200" y="274638"/><a:ext cx="8229600" cy="1143000"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>'
        f'<p:txBody><a:bodyPr/><a:lstStyle>{title_style}</a:lstStyle><a:p/></p:txBody></p:sp>'
        '<p:sp><p:nvSpPr><p:cNvPr id="3" name="Body Placeholder"/><p:cNvSpPr txBox="1"/>'
        '<p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr>'
        '<p:spPr><a:xfrm><a:off x="457200" y="1600200"/><a:ext cx="8229600" cy="4525963"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>'
        f'<p:txBody><a:bodyPr/><a:lstStyle>{body_levels}</a:lstStyle><a:p/></p:txBody></p:sp>'
    )
    # txStyles says something ELSE, so a reader that stops there is caught.
    tx_styles = (
        "<p:txStyles>"
        '<p:titleStyle><a:lvl1pPr><a:defRPr sz="1400"><a:solidFill><a:srgbClr val="000000"/>'
        "</a:solidFill></a:defRPr></a:lvl1pPr></p:titleStyle>"
        '<p:bodyStyle><a:lvl1pPr><a:defRPr sz="1400"><a:solidFill><a:srgbClr val="000000"/>'
        "</a:solidFill></a:defRPr></a:lvl1pPr></p:bodyStyle>"
        '<p:otherStyle><a:lvl1pPr><a:defRPr sz="1400"/></a:lvl1pPr></p:otherStyle>'
        "</p:txStyles>"
    )
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr/>
    {ph}
  </p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2"
   accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6"
   hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
  {tx_styles}
</p:sldMaster>
"""


def levelled_body(sid: int, levels: list[tuple[int, str]], x: int = 457200,
                  y: int = 1600200, cx: int = 8229600, cy: int = 4000000,
                  autofit: tuple[int, int] | None = None,
                  last_no_bullet: bool = False) -> str:
    """A body placeholder that states almost nothing: the levels come from the
    master, which is the whole point."""
    fit = ""
    if autofit:
        fit = f'<a:normAutofit fontScale="{autofit[0]}" lnSpcReduction="{autofit[1]}"/>'
    paras = []
    for i, (lvl, text) in enumerate(levels):
        last = last_no_bullet and i == len(levels) - 1
        ppr = f'<a:pPr lvl="{lvl}"' + (' marL="0" indent="0"><a:buNone/></a:pPr>' if last else "/>")
        paras.append(
            f"<a:p>{ppr}<a:r><a:rPr lang=\"en-US\"/><a:t>{_xml_escape(text)}</a:t></a:r></a:p>"
        )
    return f"""      <p:sp>
        <p:nvSpPr><p:cNvPr id="{sid}" name="Levelled body"/><p:cNvSpPr txBox="1"/>
          <p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
        <p:txBody><a:bodyPr>{fit}</a:bodyPr><a:lstStyle/>
          {"".join(paras)}
        </p:txBody>
      </p:sp>"""


def highlight_shape(sid: int, x: int, y: int, cx: int, cy: int) -> str:
    def run(t: str, hl: str | None) -> str:
        h = f'<a:highlight><a:srgbClr val="{hl}"/></a:highlight>' if hl else ""
        return (f'<a:r><a:rPr lang="en-US" sz="2000">{h}</a:rPr>'
                f"<a:t>{_xml_escape(t)}</a:t></a:r>")
    return f"""      <p:sp>
        <p:nvSpPr><p:cNvPr id="{sid}" name="Highlighted"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/>
          <a:p>{run("plain ", None)}{run("marked", "FFFF00")}{run(" plain", None)}</a:p>
        </p:txBody>
      </p:sp>"""


def styled_table(sid: int, x: int, y: int, cols: list[int], rows: list[list[str]],
                 row_h: int = 400000, frame: tuple[int, int] = (3000000, 3000000),
                 rule_after_first: bool = True) -> str:
    """A table whose grid is what it states, in a frame that says otherwise —
    which is what Google Slides writes, and what a reader must not believe."""
    grid = "".join(f'<a:gridCol w="{w}"/>' for w in cols)
    trs = []
    for ri, row in enumerate(rows):
        tcs = []
        for text in row:
            rule = ""
            if rule_after_first and ri == 0:
                rule = ('<a:lnB w="9525"><a:solidFill><a:srgbClr val="C0504D"/></a:solidFill>'
                        '<a:prstDash val="solid"/></a:lnB>')
            # Every other edge is stated and invisible, the way a real deck does it.
            blank = "".join(
                f'<a:ln{e} w="9525"><a:solidFill><a:srgbClr val="B7B7B7"><a:alpha val="0"/>'
                f"</a:srgbClr></a:solidFill></a:ln{e}>"
                for e in ("L", "R", "T")
            )
            body = (
                '<a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:pPr algn="l"/>'
                f'<a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="CCCCCC"/>'
                f"</a:solidFill></a:rPr><a:t>{_xml_escape(text)}</a:t></a:r></a:p></a:txBody>"
            )
            tcs.append(
                f'<a:tc>{body}<a:tcPr marL="91425" marR="91425" marT="91425" marB="91425">'
                f"{blank}{rule}</a:tcPr></a:tc>"
            )
        trs.append(f'<a:tr h="{row_h}">' + "".join(tcs) + "</a:tr>")
    return f"""      <p:graphicFrame>
        <p:nvGraphicFramePr><p:cNvPr id="{sid}" name="Styled table"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr>
        <p:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{frame[0]}" cy="{frame[1]}"/></p:xfrm>
        <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
          <a:tbl><a:tblPr><a:noFill/></a:tblPr><a:tblGrid>{grid}</a:tblGrid>{"".join(trs)}</a:tbl>
        </a:graphicData></a:graphic>
      </p:graphicFrame>"""


def styled_shape(sid: int, name: str, x: int, y: int, cx: int, cy: int,
                 fill_idx: int, line_idx: int, scheme: str = "accent1",
                 text: str | None = None, font_scheme: str = "lt1",
                 prst: str = "rect") -> str:
    """A shape that states no fill of its own: the theme's fmtScheme has it."""
    body = (
        "<p:txBody><a:bodyPr rtlCol=\"0\" anchor=\"ctr\"/><a:lstStyle/>"
        "<a:p><a:pPr algn=\"ctr\"/>"
        + (f"<a:r><a:rPr lang=\"en-US\" sz=\"1800\"/><a:t>{_xml_escape(text)}</a:t></a:r>" if text else "")
        + "</a:p></p:txBody>"
    )
    return f"""      <p:sp>
        <p:nvSpPr><p:cNvPr id="{sid}" name="{name}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>
          <a:prstGeom prst="{prst}"><a:avLst/></a:prstGeom>
        </p:spPr>
        <p:style>
          <a:lnRef idx="{line_idx}"><a:schemeClr val="{scheme}"/></a:lnRef>
          <a:fillRef idx="{fill_idx}"><a:schemeClr val="{scheme}"/></a:fillRef>
          <a:effectRef idx="0"><a:schemeClr val="{scheme}"/></a:effectRef>
          <a:fontRef idx="minor"><a:schemeClr val="{font_scheme}"/></a:fontRef>
        </p:style>
        {body}
      </p:sp>"""


def arrow_connector(sid: int, x: int, y: int, cx: int, cy: int,
                    tail: str = "arrow", head: str = "none",
                    flip_h: bool = False, flip_v: bool = False) -> str:
    flips = (' flipH="1"' if flip_h else "") + (' flipV="1"' if flip_v else "")
    return f"""      <p:cxnSp>
        <p:nvCxnSpPr><p:cNvPr id="{sid}" name="Straight Arrow Connector {sid}"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr>
        <p:spPr>
          <a:xfrm{flips}><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>
          <a:prstGeom prst="straightConnector1"><a:avLst/></a:prstGeom>
          <a:ln w="28575"><a:solidFill><a:srgbClr val="C0504D"/></a:solidFill><a:headEnd type="{head}"/><a:tailEnd type="{tail}"/></a:ln>
        </p:spPr>
      </p:cxnSp>"""


def spaced_runs_shape(sid: int, x: int, y: int, cx: int, cy: int) -> str:
    """Three runs where the middle one is a single space — the space IS content."""
    def run(t: str) -> str:
        return f'<a:r><a:rPr lang="en-US" sz="2000"/><a:t>{t}</a:t></a:r>'
    return f"""      <p:sp>
        <p:nvSpPr><p:cNvPr id="{sid}" name="Spaced runs"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/>
        </p:spPr>
        <p:txBody><a:bodyPr wrap="square" rtlCol="0"/><a:lstStyle/>
          <a:p>{run("The")}{run(" ")}{run("Ultimate")}{run(" ")}{run("Diary")}</a:p>
        </p:txBody>
      </p:sp>"""


# --- things a reader is allowed not to understand -----------------------------
#
# A shape tree carries more than shapes. SmartArt and newer chart types arrive
# wrapped in `mc:AlternateContent`, ink arrives as `p:contentPart`, and
# `p:extLst` holds whatever the writing tool wanted to say to itself. Ranger
# models none of it, walks past all of it, and — before the source spans — a
# save that rewrote the slide deleted every one of them.
#
# The namespaces are declared on the elements themselves rather than on the
# root, which is legal and keeps `slide_xml` unchanged for every other fixture.

def alternate_content(sid: int, x: int, y: int, cx: int, cy: int) -> str:
    """An mc:AlternateContent block, shaped like the one PowerPoint writes
    around a diagram: a Choice nothing here can read, and a Fallback picture
    of it."""
    return f"""      <mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">
        <mc:Choice xmlns:adec="http://schemas.microsoft.com/office/drawing/2017/decorative" Requires="adec">
          <p:graphicFrame>
            <p:nvGraphicFramePr>
              <p:cNvPr id="{sid}" name="Diagram {sid}"/>
              <p:cNvGraphicFramePr/>
              <p:nvPr/>
            </p:nvGraphicFramePr>
            <p:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></p:xfrm>
            <a:graphic>
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/diagram">
                <dgm:relIds xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram"
                 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                 r:dm="rId10" r:lo="rId11" r:qs="rId12" r:cs="rId13"/>
              </a:graphicData>
            </a:graphic>
          </p:graphicFrame>
        </mc:Choice>
        <mc:Fallback>
          <p:sp>
            <p:nvSpPr>
              <p:cNvPr id="{sid + 100}" name="Diagram fallback"/>
              <p:cNvSpPr/>
              <p:nvPr/>
            </p:nvSpPr>
            <p:spPr>
              <a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>
              <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
            </p:spPr>
          </p:sp>
        </mc:Fallback>
      </mc:AlternateContent>"""


def content_part(rid: str = "rId20") -> str:
    """Ink. A single self-closing element, which is the case that catches a
    span recorded only for elements with an end tag."""
    return (f'      <p:contentPart xmlns:r="http://schemas.openxmlformats.org/'
            f'officeDocument/2006/relationships" r:id="{rid}"/>')


def tree_ext_lst() -> str:
    """A `p:extLst` inside the shape tree, holding a creation id — the kind of
    thing a tool writes for itself and expects to find again."""
    return """      <p:extLst>
        <p:ext uri="{BB962C8B-B14F-4D97-AF65-F5344CB8AC3E}">
          <p14:creationId xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" val="1234567"/>
        </p:ext>
      </p:extLst>"""


def write_pptx(
    name: str,
    slides: list[tuple[str, str | None]],
    media: dict[str, bytes] | None = None,
    *,
    master_xml: str | None = None,
    layout_xml: str | None = None,
    theme_xml: str | None = None,
    sld_sz: tuple[int, int] | None = None,
    extra_layouts: dict[str, tuple[str, str]] | None = None,
    extra_parts: dict[str, str] | None = None,
) -> None:
    """slides: list of (slide_xml, optional slide_rels_xml)."""
    media = media or {}
    path = FIXTURES / name
    overrides = []
    for i in range(len(slides)):
        overrides.append(
            f'<Override PartName="/ppt/slides/slide{i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        )
    if extra_layouts:
        for lname in extra_layouts:
            overrides.append(
                f'<Override PartName="/ppt/slideLayouts/{lname}" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'
            )
    ct = CT.format(overrides="\n  ".join(overrides))
    master_xml = master_xml or MASTER
    layout_xml = layout_xml or LAYOUT
    theme_xml = theme_xml or THEME

    with ZipFile(path, "w", compression=ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", ct)
        zf.writestr("_rels/.rels", ROOT_RELS)
        if sld_sz is not None:
            cx, cy = sld_sz
            ids = "\n".join(
                f'    <p:sldId id="{256 + i}" r:id="rId{i + 2}"/>' for i in range(len(slides))
            )
            pres = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
{ids}
  </p:sldIdLst>
  <p:sldSz cx="{cx}" cy="{cy}"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>
"""
            zf.writestr("ppt/presentation.xml", pres)
        else:
            zf.writestr("ppt/presentation.xml", presentation_xml(len(slides)))
        zf.writestr("ppt/_rels/presentation.xml.rels", presentation_rels(len(slides)))
        zf.writestr("ppt/theme/theme1.xml", theme_xml)
        zf.writestr("ppt/slideMasters/slideMaster1.xml", master_xml)
        master_rels = MASTER_RELS
        if extra_layouts:
            # rId1 stays layout1; extra layouts get rId3+
            extra_rels = []
            rid = 3
            for lname in extra_layouts:
                extra_rels.append(
                    f'<Relationship Id="rId{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/{lname}"/>'
                )
                rid += 1
            master_rels = MASTER_RELS.replace(
                "</Relationships>",
                "  " + "\n  ".join(extra_rels) + "\n</Relationships>",
            )
        zf.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", master_rels)
        zf.writestr("ppt/slideLayouts/slideLayout1.xml", layout_xml)
        zf.writestr("ppt/slideLayouts/_rels/slideLayout1.xml.rels", LAYOUT_RELS)
        if extra_layouts:
            for lname, (lxml, lrels) in extra_layouts.items():
                zf.writestr(f"ppt/slideLayouts/{lname}", lxml)
                zf.writestr(f"ppt/slideLayouts/_rels/{lname}.rels", lrels)
        for i, (sxml, srels) in enumerate(slides):
            zf.writestr(f"ppt/slides/slide{i + 1}.xml", sxml)
            if srels is not None:
                zf.writestr(f"ppt/slides/_rels/slide{i + 1}.xml.rels", srels)
        for mname, data in media.items():
            zf.writestr(f"ppt/media/{mname}", data)
        # Parts nothing here models, named by relationships from the slide.
        if extra_parts:
            for pname, ptext in extra_parts.items():
                zf.writestr(pname, ptext)
    print(f"wrote {path}")


def ph_shape(
    sid: int,
    name: str,
    ph_type: str,
    idx: int | None,
    x: int,
    y: int,
    cx: int,
    cy: int,
    *,
    text: str | None = None,
    size_hundredths: int = 3200,
    bold: bool = False,
    scheme: str | None = "dk1",
    color: str | None = None,
    align: str = "l",
    fill: str | None = None,
    fill_scheme: str | None = None,
    lst_sz: int | None = None,
    lst_scheme: str | None = None,
    lst_align: str | None = None,
    anchor: str = "t",
    has_xfrm: bool = True,
) -> str:
    """Placeholder shape for master/layout/slide."""
    idx_attr = f' idx="{idx}"' if idx is not None else ""
    type_attr = f' type="{ph_type}"' if ph_type else ""
    if fill:
        fill_xml = f'<a:solidFill><a:srgbClr val="{fill}"/></a:solidFill>'
    elif fill_scheme:
        fill_xml = f'<a:solidFill><a:schemeClr val="{fill_scheme}"/></a:solidFill>'
    else:
        fill_xml = "<a:noFill/>"
    if has_xfrm:
        xfrm = f"""          <a:xfrm>
            <a:off x="{x}" y="{y}"/>
            <a:ext cx="{cx}" cy="{cy}"/>
          </a:xfrm>"""
    else:
        xfrm = ""
    lst = "<a:lstStyle/>"
    if lst_sz is not None or lst_scheme or lst_align:
        algn = f' algn="{lst_align}"' if lst_align else ""
        solid = ""
        if lst_scheme:
            solid = f'<a:solidFill><a:schemeClr val="{lst_scheme}"/></a:solidFill>'
        sz = f' sz="{lst_sz}"' if lst_sz is not None else ""
        lst = f"""          <a:lstStyle>
            <a:lvl1pPr{algn}>
              <a:defRPr{sz}>
                {solid}
                <a:latin typeface="Calibri"/>
              </a:defRPr>
            </a:lvl1pPr>
          </a:lstStyle>"""
    body_paras = ""
    if text is not None:
        run = {
            "text": text,
            "size": size_hundredths,
            "bold": bold,
            "color": color,
            "scheme": scheme,
        }
        body_paras = f"""          <a:p>
            <a:pPr algn="{align}"/>
{_run_xml(run)}
          </a:p>"""
    else:
        body_paras = """          <a:p>
            <a:pPr/>
            <a:endParaRPr lang="en-US"/>
          </a:p>"""
    return f"""      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="{sid}" name="{name}"/>
          <p:cNvSpPr txBox="1"/>
          <p:nvPr>
            <p:ph{type_attr}{idx_attr}/>
          </p:nvPr>
        </p:nvSpPr>
        <p:spPr>
{xfrm}
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          {fill_xml}
        </p:spPr>
        <p:txBody>
          <a:bodyPr wrap="square" lIns="91440" tIns="91440" rIns="91440" bIns="91440" anchor="{anchor}"/>
{lst}
{body_paras}
        </p:txBody>
      </p:sp>"""


def master_with_chrome(bg_scheme: str = "lt1", chrome: str = "") -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill><a:schemeClr val="{bg_scheme}"/></a:solidFill>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
{chrome}
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1"
    accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5"
    accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="2147483649" r:id="rId1"/>
  </p:sldLayoutIdLst>
</p:sldMaster>
"""


def layout_with_shapes(name: str, children: str, bg_scheme: str | None = None) -> str:
    bg = ""
    if bg_scheme:
        bg = f"""    <p:bg>
      <p:bgPr>
        <a:solidFill><a:schemeClr val="{bg_scheme}"/></a:solidFill>
      </p:bgPr>
    </p:bg>
"""
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="title">
  <p:cSld name="{name}">
{bg}
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="9144000" cy="6858000"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="9144000" cy="6858000"/>
        </a:xfrm>
      </p:grpSpPr>
{children}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>
"""


def solid_jpeg(r: int, g: int, b: int, w: int = 80, h: int = 60) -> bytes:
    from PIL import Image
    import io

    im = Image.new("RGB", (w, h), (r, g, b))
    buf = io.BytesIO()
    im.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def gradient_png(w: int = 120, h: int = 80) -> bytes:
    from PIL import Image
    import io

    im = Image.new("RGB", (w, h))
    px = im.load()
    for y in range(h):
        for x in range(w):
            px[x, y] = (int(40 + 180 * x / w), int(80 + 100 * y / h), 200)
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue()


def main() -> None:
    FIXTURES.mkdir(parents=True, exist_ok=True)

    # 01-text: title + body text using theme colors
    s1 = slide_xml(
        sp_tree(
            text_shape(
                2,
                "Title",
                914400,
                914400,
                7315200,
                1143000,
                "Hello from PowerPoint",
                size_hundredths=4400,
                bold=True,
                scheme="dk1",
                align="ctr",
            ),
            text_shape(
                3,
                "Body",
                914400,
                2743200,
                7315200,
                1828800,
                "Ranger PPTX Lite viewer",
                size_hundredths=2800,
                scheme="accent1",
                align="ctr",
            ),
        )
    )
    write_pptx(
        "01-text.pptx",
        [(s1, slide_rels())],
    )

    # 02-shapes: rect + ellipse + rotated rect with theme accent fill on one
    s2 = slide_xml(
        sp_tree(
            text_shape(
                2,
                "Title",
                457200,
                228600,
                8229600,
                685800,
                "Shapes",
                size_hundredths=3600,
                bold=True,
                scheme="dk1",
            ),
            rect_shape(3, "Rect", 914400, 1371600, 2743200, 1828800, fill="4472C4"),
            rect_shape(4, "Ellipse", 4572000, 1371600, 2743200, 1828800, fill="ED7D31", prst="ellipse"),
            rect_shape(
                5,
                "Rotated",
                2743200,
                4114800,
                2743200,
                1143000,
                fill="70AD47",
                rot=1200000,  # 20 degrees in 1/60000 deg
            ),
        )
    )
    write_pptx("02-shapes.pptx", [(s2, slide_rels())])

    # 03-image: PNG picture + caption
    png = solid_png(68, 114, 196)
    s3 = slide_xml(
        sp_tree(
            text_shape(
                2,
                "Title",
                914400,
                457200,
                7315200,
                914400,
                "Embedded image",
                size_hundredths=3600,
                bold=True,
                scheme="dk1",
                align="ctr",
            ),
            pic_shape(3, "Picture", "rId2", 2743200, 1828800, 3657600, 2743200),
            text_shape(
                4,
                "Caption",
                914400,
                5029200,
                7315200,
                685800,
                "64x48 PNG via relationship",
                size_hundredths=1800,
                scheme="dk2",
                align="ctr",
            ),
        )
    )
    write_pptx(
        "03-image.pptx",
        [(s3, slide_rels(images={"rId2": "../media/image1.png"}))],
        media={"image1.png": png},
    )

    # 04-multi: two slides for navigation
    a = slide_xml(
        sp_tree(
            text_shape(
                2,
                "Title",
                914400,
                2743200,
                7315200,
                1371600,
                "Slide 1 of 2",
                size_hundredths=4000,
                bold=True,
                scheme="accent1",
                align="ctr",
            )
        )
    )
    b = slide_xml(
        sp_tree(
            text_shape(
                2,
                "Title",
                914400,
                2743200,
                7315200,
                1371600,
                "Slide 2 of 2",
                size_hundredths=4000,
                bold=True,
                scheme="accent2",
                align="ctr",
            ),
            rect_shape(3, "Accent", 3657600, 4572000, 1828800, 914400, fill="5B9BD5"),
        )
    )
    write_pptx(
        "04-multi.pptx",
        [(a, slide_rels()), (b, slide_rels())],
    )

    # 05-group: two rects inside a group transform
    s5 = slide_xml(
        sp_tree(
            text_shape(
                2,
                "Title",
                457200,
                228600,
                8229600,
                685800,
                "Grouped shapes",
                size_hundredths=3600,
                bold=True,
                scheme="dk1",
            ),
            group_shape(
                10,
                "Cluster",
                1371600,
                1828800,
                6400800,
                3200400,
                [
                    rect_shape(11, "G-Left", 0, 0, 2743200, 1828800, fill="4472C4"),
                    rect_shape(12, "G-Right", 3200400, 914400, 2743200, 1828800, fill="ED7D31"),
                ],
                ch_x=0,
                ch_y=0,
                ch_cx=6400800,
                ch_cy=3200400,
            ),
        )
    )
    write_pptx("05-group.pptx", [(s5, slide_rels())])

    # 06-text-runs: multi-run + multi-paragraph styled text
    s6 = slide_xml(
        sp_tree(
            text_shape_runs(
                2,
                "Title",
                914400,
                685800,
                7315200,
                1143000,
                [
                    {"text": "Hello ", "size": 4000, "bold": False, "scheme": "dk1"},
                    {"text": "World", "size": 4000, "bold": True, "scheme": "accent1"},
                ],
                align="ctr",
            ),
            text_shape_runs(
                3,
                "Body",
                914400,
                2286000,
                7315200,
                2743200,
                [
                    [
                        {"text": "Regular, ", "size": 2400, "scheme": "dk2"},
                        {"text": "italic", "size": 2400, "italic": True, "scheme": "accent2"},
                        {"text": ", and ", "size": 2400, "scheme": "dk2"},
                        {"text": "bold accent", "size": 2400, "bold": True, "scheme": "accent6"},
                    ],
                    [
                        {"text": "Second paragraph with theme color.", "size": 2200, "scheme": "accent5"},
                    ],
                ],
                align="l",
            ),
        )
    )
    write_pptx("06-text-runs.pptx", [(s6, slide_rels())])

    # 07-theme-fills: shapes filled via schemeClr (resolver must expand)
    s7 = slide_xml(
        sp_tree(
            text_shape(
                2,
                "Title",
                457200,
                228600,
                8229600,
                685800,
                "Theme fills",
                size_hundredths=3600,
                bold=True,
                scheme="dk1",
            ),
            rect_shape(3, "A1", 457200, 1371600, 1524000, 1524000, fill="4472C4"),  # placeholder; use scheme via custom
        )
    )
    # Rebuild slide 7 with scheme fills via raw shapes
    def scheme_rect(sid, name, x, y, cx, cy, scheme):
        return f"""      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="{sid}" name="{name}"/>
          <p:cNvSpPr/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="{x}" y="{y}"/>
            <a:ext cx="{cx}" cy="{cy}"/>
          </a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:solidFill><a:schemeClr val="{scheme}"/></a:solidFill>
        </p:spPr>
      </p:sp>"""

    s7 = slide_xml(
        sp_tree(
            text_shape(
                2,
                "Title",
                457200,
                228600,
                8229600,
                685800,
                "Theme fills",
                size_hundredths=3600,
                bold=True,
                scheme="dk1",
            ),
            scheme_rect(3, "Accent1", 457200, 1371600, 1371600, 1371600, "accent1"),
            scheme_rect(4, "Accent2", 2057400, 1371600, 1371600, 1371600, "accent2"),
            scheme_rect(5, "Accent4", 3657600, 1371600, 1371600, 1371600, "accent4"),
            scheme_rect(6, "Accent6", 5257800, 1371600, 1371600, 1371600, "accent6"),
            text_shape(
                7,
                "Note",
                457200,
                3429000,
                8229600,
                914400,
                "Fills use schemeClr; resolver maps to theme sRGB",
                size_hundredths=1800,
                scheme="dk2",
            ),
        )
    )
    write_pptx("07-theme-fills.pptx", [(s7, slide_rels())])

    # 08-presets: more DrawingML preset geometries
    s8 = slide_xml(
        sp_tree(
            text_shape(
                2,
                "Title",
                457200,
                228600,
                8229600,
                685800,
                "Preset geometries",
                size_hundredths=3600,
                bold=True,
                scheme="dk1",
            ),
            rect_shape(3, "RoundRect", 457200, 1371600, 1828800, 1371600, fill="5B9BD5", prst="roundRect"),
            rect_shape(4, "Triangle", 2743200, 1371600, 1828800, 1371600, fill="ED7D31", prst="triangle"),
            rect_shape(5, "Diamond", 5029200, 1371600, 1828800, 1371600, fill="70AD47", prst="diamond"),
            rect_shape(6, "Chevron", 7315200, 1371600, 1371600, 1371600, fill="FFC000", prst="chevron"),
            rect_shape(7, "Star5", 2057400, 3429000, 1828800, 1828800, fill="4472C4", prst="star5"),
            rect_shape(8, "Ellipse", 4572000, 3429000, 2286000, 1371600, fill="954F72", prst="ellipse"),
        )
    )
    write_pptx("08-presets.pptx", [(s8, slide_rels())])

    # 09-kitchen: multi-slide mixed features (text + shapes + image + group)
    png2 = solid_png(237, 125, 49, 48, 48)
    jpg_k = solid_jpeg(68, 114, 196, 64, 48)
    k1 = slide_xml(
        sp_tree(
            text_shape(
                2,
                "Title",
                914400,
                685800,
                7315200,
                1143000,
                "Kitchen sink — slide A",
                size_hundredths=4000,
                bold=True,
                scheme="dk1",
                align="ctr",
            ),
            rect_shape(3, "Banner", 914400, 2286000, 7315200, 914400, fill="4472C4"),
            text_shape(
                4,
                "OnBanner",
                914400,
                2400300,
                7315200,
                685800,
                "Shape + text + theme",
                size_hundredths=2800,
                color="FFFFFF",
                scheme=None,
                align="ctr",
            ),
        )
    )
    k2 = slide_xml(
        sp_tree(
            text_shape(
                2,
                "Title",
                457200,
                228600,
                8229600,
                685800,
                "Kitchen sink — slide B",
                size_hundredths=3600,
                bold=True,
                scheme="accent1",
            ),
            pic_shape(3, "Icon", "rId2", 914400, 1371600, 1828800, 1828800),
            pic_shape(4, "Photo", "rId3", 3200400, 4114800, 1828800, 1143000),
            group_shape(
                20,
                "Pair",
                3429000,
                1371600,
                4572000,
                2286000,
                [
                    rect_shape(21, "P1", 0, 0, 1828800, 1371600, fill="70AD47"),
                    rect_shape(22, "P2", 2286000, 457200, 1828800, 1371600, fill="ED7D31", prst="ellipse"),
                ],
            ),
            text_shape(
                5,
                "Footer",
                914400,
                5029200,
                7315200,
                685800,
                "Image + group on one slide",
                size_hundredths=2000,
                scheme="dk2",
            ),
        )
    )
    write_pptx(
        "09-kitchen.pptx",
        [
            (k1, slide_rels()),
            (
                k2,
                slide_rels(images={"rId2": "../media/icon.png", "rId3": "../media/photo.jpg"}),
            ),
        ],
        media={"icon.png": png2, "photo.jpg": jpg_k},
    )

    # 10-widescreen: 13.333" x 7.5" (widescreen sldSz)
    # Custom presentation writer for this one
    path = FIXTURES / "10-widescreen.pptx"
    overrides = [
        '<Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
    ]
    ct = CT.format(overrides="\n  ".join(overrides))
    pres_wide = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>
"""
    sw = slide_xml(
        sp_tree(
            text_shape(
                2,
                "Title",
                914400,
                2286000,
                10363200,
                1371600,
                "Widescreen 16:9",
                size_hundredths=4400,
                bold=True,
                scheme="accent1",
                align="ctr",
            ),
            rect_shape(3, "Bar", 914400, 4114800, 10363200, 457200, fill="ED7D31"),
        )
    )
    with ZipFile(path, "w", compression=ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", ct)
        zf.writestr("_rels/.rels", ROOT_RELS)
        zf.writestr("ppt/presentation.xml", pres_wide)
        zf.writestr("ppt/_rels/presentation.xml.rels", presentation_rels(1))
        zf.writestr("ppt/theme/theme1.xml", THEME)
        zf.writestr("ppt/slideMasters/slideMaster1.xml", MASTER)
        zf.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", MASTER_RELS)
        zf.writestr("ppt/slideLayouts/slideLayout1.xml", LAYOUT)
        zf.writestr("ppt/slideLayouts/_rels/slideLayout1.xml.rels", LAYOUT_RELS)
        zf.writestr("ppt/slides/slide1.xml", sw)
        zf.writestr("ppt/slides/_rels/slide1.xml.rels", slide_rels())
    print(f"wrote {path}")

    # ------------------------------------------------------------------
    # Fidelity fixtures: master/layout/placeholders, images, text, business
    # ------------------------------------------------------------------

    master_bar = master_with_chrome(
        "lt1",
        rect_shape(10, "MasterBar", 0, 0, 9144000, 685800, fill="1F4E79")
        + "\n"
        + rect_shape(11, "MasterAccent", 0, 6400800, 9144000, 457200, fill="2E75B6"),
    )
    title_layout = layout_with_shapes(
        "Title",
        ph_shape(
            2,
            "Title Placeholder",
            "title",
            0,
            685800,
            1143000,
            7772400,
            1371600,
            lst_sz=4400,
            lst_scheme="dk1",
            lst_align="ctr",
            anchor="ctr",
        )
        + "\n"
        + ph_shape(
            3,
            "Subtitle Placeholder",
            "subTitle",
            1,
            1143000,
            2971800,
            6858000,
            1143000,
            lst_sz=2400,
            lst_scheme="dk2",
            lst_align="ctr",
        ),
    )

    # 11 — master background + chrome bar visible without slide shapes covering it
    s11 = slide_xml(
        sp_tree(
            text_shape(
                2,
                "Note",
                914400,
                2286000,
                7315200,
                1371600,
                "Master chrome should paint above the theme background",
                size_hundredths=2400,
                scheme="dk1",
                align="ctr",
            )
        )
    )
    write_pptx(
        "11-master-background.pptx",
        [(s11, slide_rels())],
        master_xml=master_bar,
        layout_xml=LAYOUT,
    )

    # 12 — layout placeholder geometry inherited (slide ph omits xfrm)
    s12 = slide_xml(
        sp_tree(
            ph_shape(
                2,
                "Title",
                "title",
                0,
                0,
                0,
                0,
                0,
                text="Inherited title box",
                size_hundredths=4000,
                bold=True,
                scheme="dk1",
                align="ctr",
                has_xfrm=False,
            ),
            ph_shape(
                3,
                "Subtitle",
                "subTitle",
                1,
                0,
                0,
                0,
                0,
                text="Position comes from the layout placeholder",
                size_hundredths=2200,
                scheme="accent1",
                align="ctr",
                has_xfrm=False,
            ),
        )
    )
    write_pptx(
        "12-layout-placeholder.pptx",
        [(s12, slide_rels())],
        master_xml=master_bar,
        layout_xml=title_layout,
    )

    # 13 — title placeholder with lstStyle font size inheritance
    s13 = slide_xml(
        sp_tree(
            ph_shape(
                2,
                "Title",
                "ctrTitle",
                0,
                0,
                0,
                0,
                0,
                text="Title via placeholder style",
                scheme="dk1",
                align="ctr",
                has_xfrm=False,
                # omit explicit size so lstStyle sz=4400 wins
                size_hundredths=1800,
            ),
        )
    )
    # Force run without sz by customizing — rewrite with no sz on run for inheritance test
    s13 = slide_xml(
        f"""  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="9144000" cy="6858000"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="9144000" cy="6858000"/>
        </a:xfrm>
      </p:grpSpPr>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Title"/>
          <p:cNvSpPr txBox="1"/>
          <p:nvPr><p:ph type="ctrTitle"/></p:nvPr>
        </p:nvSpPr>
        <p:spPr>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:noFill/>
        </p:spPr>
        <p:txBody>
          <a:bodyPr anchor="ctr"/>
          <a:lstStyle/>
          <a:p>
            <a:pPr algn="ctr"/>
            <a:r>
              <a:rPr lang="en-US" dirty="0">
                <a:solidFill><a:schemeClr val="dk1"/></a:solidFill>
                <a:latin typeface="Calibri"/>
              </a:rPr>
              <a:t>Title via placeholder style</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>"""
    )
    write_pptx(
        "13-title-placeholder.pptx",
        [(s13, slide_rels())],
        master_xml=master_bar,
        layout_xml=title_layout,
    )

    # 14 — theme inheritance on master bg + scheme fills on chrome
    theme_green = THEME.replace("4472C4", "2E7D32").replace("ED7D31", "F9A825")
    master_theme = master_with_chrome(
        "lt2",
        rect_shape(10, "Stripe", 0, 0, 9144000, 457200, fill="2E7D32"),
    )
    s14 = slide_xml(
        sp_tree(
            text_shape(
                2,
                "Title",
                914400,
                1371600,
                7315200,
                1143000,
                "Theme + master background",
                size_hundredths=3600,
                bold=True,
                scheme="dk1",
                align="ctr",
            ),
            text_shape(
                3,
                "Body",
                914400,
                2743200,
                7315200,
                914400,
                "accent1 should resolve from the custom theme",
                size_hundredths=2200,
                scheme="accent1",
                align="ctr",
            ),
        )
    )
    write_pptx(
        "14-theme-inheritance.pptx",
        [(s14, slide_rels())],
        master_xml=master_theme,
        theme_xml=theme_green,
    )

    # 15 — mixed master chrome + layout placeholders + slide override geometry
    s15 = slide_xml(
        sp_tree(
            ph_shape(
                2,
                "Title",
                "title",
                0,
                685800,
                914400,
                7772400,
                1143000,
                text="Slide overrides title Y",
                size_hundredths=4000,
                bold=True,
                scheme="lt1",
                align="ctr",
                has_xfrm=True,
            ),
            ph_shape(
                3,
                "Body",
                "body",
                1,
                0,
                0,
                0,
                0,
                text="Body position inherited from layout",
                size_hundredths=2400,
                scheme="dk1",
                align="l",
                has_xfrm=False,
            ),
            rect_shape(4, "SlideOnly", 6858000, 4572000, 1828800, 1143000, fill="ED7D31"),
        )
    )
    body_layout = layout_with_shapes(
        "TitleBody",
        ph_shape(
            2,
            "Title Placeholder",
            "title",
            0,
            685800,
            1371600,
            7772400,
            1143000,
            lst_sz=4000,
            lst_scheme="lt1",
            lst_align="ctr",
            anchor="ctr",
        )
        + "\n"
        + ph_shape(
            3,
            "Body Placeholder",
            "body",
            1,
            914400,
            2743200,
            7315200,
            2743200,
            lst_sz=2200,
            lst_scheme="dk1",
            lst_align="l",
        )
        + "\n"
        + rect_shape(20, "LayoutBadge", 457200, 5029200, 1371600, 685800, fill="70AD47"),
    )
    write_pptx(
        "15-master-layout-mixed.pptx",
        [(s15, slide_rels())],
        master_xml=master_bar,
        layout_xml=body_layout,
    )

    # 16 — PNG image SoftCanvas
    png16 = gradient_png(160, 100)
    s16 = slide_xml(
        sp_tree(
            text_shape(
                2,
                "Title",
                914400,
                457200,
                7315200,
                685800,
                "PNG in SoftCanvas",
                size_hundredths=3600,
                bold=True,
                scheme="dk1",
                align="ctr",
            ),
            pic_shape(3, "Gradient", "rId2", 2286000, 1600200, 4572000, 2857500),
        )
    )
    write_pptx(
        "16-image-png.pptx",
        [(s16, slide_rels(images={"rId2": "../media/grad.png"}))],
        media={"grad.png": png16},
    )

    # 17 — JPEG
    jpg17 = solid_jpeg(220, 80, 60, 100, 70)
    s17 = slide_xml(
        sp_tree(
            text_shape(
                2,
                "Title",
                914400,
                457200,
                7315200,
                685800,
                "JPEG in SoftCanvas",
                size_hundredths=3600,
                bold=True,
                scheme="dk1",
                align="ctr",
            ),
            pic_shape(3, "Photo", "rId2", 2743200, 1600200, 3657600, 2743200),
        )
    )
    write_pptx(
        "17-image-jpeg.pptx",
        [(s17, slide_rels(images={"rId2": "../media/photo.jpg"}))],
        media={"photo.jpg": jpg17},
    )

    # 18 — mixed PNG + JPEG
    s18 = slide_xml(
        sp_tree(
            text_shape(
                2,
                "Title",
                457200,
                228600,
                8229600,
                685800,
                "PNG + JPEG",
                size_hundredths=3600,
                bold=True,
                scheme="dk1",
            ),
            pic_shape(3, "A", "rId2", 685800, 1371600, 3429000, 2286000),
            pic_shape(4, "B", "rId3", 4572000, 1371600, 3429000, 2286000),
        )
    )
    write_pptx(
        "18-image-mixed.pptx",
        [
            (
                s18,
                slide_rels(images={"rId2": "../media/a.png", "rId3": "../media/b.jpg"}),
            )
        ],
        media={"a.png": gradient_png(96, 64), "b.jpg": solid_jpeg(68, 114, 196, 96, 64)},
    )

    # 19 — text fidelity: align, sizes, colors, margins, wrapping
    s19 = slide_xml(
        sp_tree(
            text_shape(
                2,
                "Left",
                457200,
                457200,
                2743200,
                914400,
                "Left aligned",
                size_hundredths=2800,
                scheme="dk1",
                align="l",
            ),
            text_shape(
                3,
                "Center",
                3429000,
                457200,
                2743200,
                914400,
                "Center",
                size_hundredths=2800,
                bold=True,
                scheme="accent1",
                align="ctr",
            ),
            text_shape(
                4,
                "Right",
                6400800,
                457200,
                2286000,
                914400,
                "Right",
                size_hundredths=2800,
                scheme="accent2",
                align="r",
            ),
            text_shape_runs(
                5,
                "Wrap",
                914400,
                1828800,
                3657600,
                2743200,
                [
                    [
                        {
                            "text": "This paragraph wraps inside a narrow text box with explicit margins and mixed ",
                            "size": 2000,
                            "scheme": "dk2",
                        },
                        {"text": "bold", "size": 2000, "bold": True, "scheme": "accent1"},
                        {"text": " and ", "size": 2000, "scheme": "dk2"},
                        {"text": "italic", "size": 2000, "italic": True, "scheme": "accent2"},
                        {"text": " runs for SoftCanvas fidelity.", "size": 2000, "scheme": "dk2"},
                    ]
                ],
                align="l",
            ),
            text_shape(
                6,
                "Big",
                5029200,
                1828800,
                3657600,
                1371600,
                "44pt",
                size_hundredths=4400,
                bold=True,
                scheme="accent6",
                align="ctr",
            ),
            text_shape(
                7,
                "Small",
                5029200,
                3429000,
                3657600,
                914400,
                "14pt secondary",
                size_hundredths=1400,
                scheme="dk2",
                align="ctr",
            ),
        )
    )
    write_pptx("19-text-fidelity.pptx", [(s19, slide_rels())])

    # 20 — business deck (widescreen, 5 slides)
    biz_master = master_with_chrome(
        "lt1",
        rect_shape(10, "HeaderBar", 0, 0, 12192000, 685800, fill="0D47A1")
        + "\n"
        + rect_shape(11, "FooterBar", 0, 6400800, 12192000, 457200, fill="1565C0"),
    )
    biz_title_layout = layout_with_shapes(
        "Title",
        ph_shape(
            2,
            "Title",
            "ctrTitle",
            0,
            914400,
            2286000,
            10363200,
            1371600,
            lst_sz=4800,
            lst_scheme="lt1",
            lst_align="ctr",
            anchor="ctr",
        )
        + "\n"
        + ph_shape(
            3,
            "Subtitle",
            "subTitle",
            1,
            1371600,
            3886200,
            9448800,
            914400,
            lst_sz=2400,
            lst_scheme="lt2",
            lst_align="ctr",
        ),
    )
    biz_content = layout_with_shapes(
        "TitleContent",
        ph_shape(
            2,
            "Title",
            "title",
            0,
            685800,
            914400,
            10820400,
            914400,
            lst_sz=3600,
            lst_scheme="dk1",
            lst_align="l",
        )
        + "\n"
        + ph_shape(
            3,
            "Body",
            "body",
            1,
            685800,
            2057400,
            6858000,
            3657600,
            lst_sz=2200,
            lst_scheme="dk2",
            lst_align="l",
        ),
    )

    def slide_rels_layout(layout_target: str, images: dict[str, str] | None = None) -> str:
        rels = [
            f'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="{layout_target}"/>'
        ]
        if images:
            for rid, target in images.items():
                rels.append(
                    f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="{target}"/>'
                )
        body = "\n  ".join(rels)
        return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  {body}
</Relationships>
"""

    b1 = slide_xml(
        sp_tree(
            ph_shape(
                2,
                "Title",
                "ctrTitle",
                0,
                0,
                0,
                0,
                0,
                text="Northwind Quarterly Review",
                scheme="lt1",
                align="ctr",
                has_xfrm=False,
            ),
            ph_shape(
                3,
                "Subtitle",
                "subTitle",
                1,
                0,
                0,
                0,
                0,
                text="FY2026 - Customer Success & Growth",
                scheme="lt2",
                align="ctr",
                has_xfrm=False,
            ),
        )
    )
    b2 = slide_xml(
        sp_tree(
            ph_shape(
                2,
                "Title",
                "title",
                0,
                0,
                0,
                0,
                0,
                text="Agenda",
                scheme="dk1",
                align="l",
                has_xfrm=False,
            ),
            ph_shape(
                3,
                "Body",
                "body",
                1,
                0,
                0,
                0,
                0,
                text="1. Highlights\n2. Product snapshot\n3. Next steps",
                scheme="dk2",
                align="l",
                has_xfrm=False,
            ),
            rect_shape(4, "Card", 8229600, 2286000, 2743200, 2743200, fill="E3F2FD", prst="roundRect"),
            text_shape(
                5,
                "CardText",
                8458200,
                2743200,
                2286000,
                1371600,
                "5 slides",
                size_hundredths=2800,
                bold=True,
                scheme="accent1",
                align="ctr",
            ),
        )
    )
    logo = gradient_png(128, 128)
    photo = solid_jpeg(25, 118, 210, 160, 100)
    b3 = slide_xml(
        sp_tree(
            ph_shape(
                2,
                "Title",
                "title",
                0,
                0,
                0,
                0,
                0,
                text="Product snapshot",
                scheme="dk1",
                has_xfrm=False,
            ),
            pic_shape(3, "Logo", "rId2", 685800, 2286000, 2743200, 2743200),
            pic_shape(4, "ChartImg", "rId3", 4114800, 2286000, 4114800, 2743200),
            text_shape(
                5,
                "Caption",
                685800,
                5257800,
                7543800,
                685800,
                "Brand mark + photo assets from package relationships",
                size_hundredths=1600,
                scheme="dk2",
            ),
        )
    )
    b4 = slide_xml(
        sp_tree(
            ph_shape(
                2,
                "Title",
                "title",
                0,
                0,
                0,
                0,
                0,
                text="Shape language",
                scheme="dk1",
                has_xfrm=False,
            ),
            group_shape(
                20,
                "Metrics",
                914400,
                2286000,
                10363200,
                2743200,
                [
                    rect_shape(21, "M1", 0, 0, 2743200, 1828800, fill="1976D2", prst="roundRect"),
                    rect_shape(22, "M2", 3429000, 457200, 2743200, 1828800, fill="00897B", prst="ellipse"),
                    rect_shape(23, "M3", 6858000, 0, 2743200, 1828800, fill="F9A825", prst="chevron"),
                ],
                ch_cx=10363200,
                ch_cy=2743200,
            ),
            text_shape_runs(
                3,
                "Legend",
                914400,
                5257800,
                10363200,
                685800,
                [
                    {"text": "Pipeline ", "size": 1800, "scheme": "dk2"},
                    {"text": "↑ 18%", "size": 1800, "bold": True, "scheme": "accent6"},
                    {"text": " / Retention ", "size": 1800, "scheme": "dk2"},
                    {"text": "92%", "size": 1800, "bold": True, "scheme": "accent1"},
                ],
                align="ctr",
            ),
        )
    )
    b5 = slide_xml(
        sp_tree(
            ph_shape(
                2,
                "Title",
                "title",
                0,
                0,
                0,
                0,
                0,
                text="Thank you",
                scheme="dk1",
                align="ctr",
                has_xfrm=False,
            ),
            text_shape(
                3,
                "Contact",
                1371600,
                2971800,
                9448800,
                1371600,
                "questions@northwind.example - Continue the conversation",
                size_hundredths=2200,
                scheme="accent1",
                align="ctr",
            ),
        )
    )

    # Widescreen presentation with two layouts
    path = FIXTURES / "20-business-deck.pptx"
    overrides = []
    for i in range(5):
        overrides.append(
            f'<Override PartName="/ppt/slides/slide{i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        )
    overrides.append(
        '<Override PartName="/ppt/slideLayouts/slideLayout2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'
    )
    ct = CT.format(overrides="\n  ".join(overrides))
    pres_wide = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
    <p:sldId id="257" r:id="rId3"/>
    <p:sldId id="258" r:id="rId4"/>
    <p:sldId id="259" r:id="rId5"/>
    <p:sldId id="260" r:id="rId6"/>
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>
"""
    master_rels_biz = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout2.xml"/>
</Relationships>
"""
    with ZipFile(path, "w", compression=ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", ct)
        zf.writestr("_rels/.rels", ROOT_RELS)
        zf.writestr("ppt/presentation.xml", pres_wide)
        zf.writestr("ppt/_rels/presentation.xml.rels", presentation_rels(5))
        zf.writestr("ppt/theme/theme1.xml", THEME)
        zf.writestr("ppt/slideMasters/slideMaster1.xml", biz_master)
        zf.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", master_rels_biz)
        zf.writestr("ppt/slideLayouts/slideLayout1.xml", biz_title_layout)
        zf.writestr("ppt/slideLayouts/_rels/slideLayout1.xml.rels", LAYOUT_RELS)
        zf.writestr("ppt/slideLayouts/slideLayout2.xml", biz_content)
        zf.writestr("ppt/slideLayouts/_rels/slideLayout2.xml.rels", LAYOUT_RELS)
        zf.writestr("ppt/slides/slide1.xml", b1)
        zf.writestr("ppt/slides/_rels/slide1.xml.rels", slide_rels_layout("../slideLayouts/slideLayout1.xml"))
        zf.writestr("ppt/slides/slide2.xml", b2)
        zf.writestr("ppt/slides/_rels/slide2.xml.rels", slide_rels_layout("../slideLayouts/slideLayout2.xml"))
        zf.writestr("ppt/slides/slide3.xml", b3)
        zf.writestr(
            "ppt/slides/_rels/slide3.xml.rels",
            slide_rels_layout(
                "../slideLayouts/slideLayout2.xml",
                {"rId2": "../media/logo.png", "rId3": "../media/photo.jpg"},
            ),
        )
        zf.writestr("ppt/slides/slide4.xml", b4)
        zf.writestr("ppt/slides/_rels/slide4.xml.rels", slide_rels_layout("../slideLayouts/slideLayout2.xml"))
        zf.writestr("ppt/slides/slide5.xml", b5)
        zf.writestr("ppt/slides/_rels/slide5.xml.rels", slide_rels_layout("../slideLayouts/slideLayout2.xml"))
        zf.writestr("ppt/media/logo.png", logo)
        zf.writestr("ppt/media/photo.jpg", photo)
    print(f"wrote {path}")

    # Enrich kitchen sink with a second real raster

    # ------------------------------------------------------------------
    # Effects / tables / charts / geom
    # ------------------------------------------------------------------

    def grad_rect(sid, name, x, y, cx, cy, c1="4472C4", c2="70AD47", ang=5400000):
        return f"""      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="{sid}" name="{name}"/>
          <p:cNvSpPr/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="{x}" y="{y}"/>
            <a:ext cx="{cx}" cy="{cy}"/>
          </a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:gradFill>
            <a:gsLst>
              <a:gs pos="0"><a:srgbClr val="{c1}"/></a:gs>
              <a:gs pos="100000"><a:srgbClr val="{c2}"/></a:gs>
            </a:gsLst>
            <a:lin ang="{ang}" scaled="0"/>
          </a:gradFill>
        </p:spPr>
      </p:sp>"""

    def shadow_rect(sid, name, x, y, cx, cy, fill="ED7D31"):
        return f"""      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="{sid}" name="{name}"/>
          <p:cNvSpPr/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="{x}" y="{y}"/>
            <a:ext cx="{cx}" cy="{cy}"/>
          </a:xfrm>
          <a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>
          <a:solidFill><a:srgbClr val="{fill}"/></a:solidFill>
          <a:effectLst>
            <a:outerShdw blurRad="101600" dist="76200" dir="2700000" algn="tl" rotWithShape="0">
              <a:srgbClr val="000000"><a:alpha val="40000"/></a:srgbClr>
            </a:outerShdw>
          </a:effectLst>
        </p:spPr>
      </p:sp>"""

    def bullet_shape(sid, name, x, y, cx, cy, lines):
        paras = []
        for text in lines:
            paras.append(f"""          <a:p>
            <a:pPr lvl="0">
              <a:buChar char="•"/>
            </a:pPr>
            <a:r>
              <a:rPr lang="en-US" sz="2400" dirty="0">
                <a:solidFill><a:schemeClr val="dk1"/></a:solidFill>
                <a:latin typeface="Calibri"/>
              </a:rPr>
              <a:t>{_xml_escape(text)}</a:t>
            </a:r>
          </a:p>""")
        body = "\n".join(paras)
        return f"""      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="{sid}" name="{name}"/>
          <p:cNvSpPr txBox="1"/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="{x}" y="{y}"/>
            <a:ext cx="{cx}" cy="{cy}"/>
          </a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:noFill/>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/><a:lstStyle/>
{body}
        </p:txBody>
      </p:sp>"""

    def cust_triangle(sid, name, x, y, cx, cy, fill="5B9BD5"):
        return f"""      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="{sid}" name="{name}"/>
          <p:cNvSpPr/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="{x}" y="{y}"/>
            <a:ext cx="{cx}" cy="{cy}"/>
          </a:xfrm>
          <a:custGeom>
            <a:avLst/>
            <a:gdLst/>
            <a:ahLst/>
            <a:cxnLst/>
            <a:rect l="0" t="0" r="0" b="0"/>
            <a:pathLst>
              <a:path w="100" h="100">
                <a:moveTo><a:pt x="50" y="0"/></a:moveTo>
                <a:lnTo><a:pt x="100" y="100"/></a:lnTo>
                <a:lnTo><a:pt x="0" y="100"/></a:lnTo>
                <a:close/>
              </a:path>
            </a:pathLst>
          </a:custGeom>
          <a:solidFill><a:srgbClr val="{fill}"/></a:solidFill>
        </p:spPr>
      </p:sp>"""

    s21 = slide_xml(sp_tree(
        text_shape(2, "Title", 457200, 228600, 8229600, 685800, "Gradients", size_hundredths=3600, bold=True, scheme="dk1"),
        grad_rect(3, "VGrad", 914400, 1371600, 3429000, 2286000, "4472C4", "70AD47", 5400000),
        grad_rect(4, "HGrad", 5029200, 1371600, 3429000, 2286000, "ED7D31", "FFC000", 0),
    ))
    write_pptx("21-gradient.pptx", [(s21, slide_rels())])

    s22 = slide_xml(sp_tree(
        text_shape(2, "Title", 457200, 228600, 8229600, 685800, "Shadows", size_hundredths=3600, bold=True, scheme="dk1"),
        shadow_rect(3, "Card", 2286000, 1714500, 4572000, 2743200, "5B9BD5"),
    ))
    write_pptx("22-shadow.pptx", [(s22, slide_rels())])

    s23 = slide_xml(sp_tree(
        text_shape(2, "Title", 457200, 228600, 8229600, 685800, "Bullets", size_hundredths=3600, bold=True, scheme="dk1"),
        bullet_shape(3, "List", 914400, 1371600, 7315200, 4114800, [
            "Ship gradients and shadows",
            "Render bullets with indent",
            "Tables and charts next",
        ]),
    ))
    write_pptx("23-bullets.pptx", [(s23, slide_rels())])

    s24 = slide_xml(sp_tree(
        text_shape(2, "Title", 457200, 228600, 8229600, 685800, "Custom geom + presets", size_hundredths=3600, bold=True, scheme="dk1"),
        cust_triangle(3, "CustTri", 914400, 1600200, 2743200, 2286000, "4472C4"),
        rect_shape(4, "Diamond", 4114800, 1600200, 2286000, 2286000, fill="ED7D31", prst="diamond"),
        rect_shape(5, "Star", 6858000, 1600200, 1828800, 2286000, fill="70AD47", prst="star5"),
    ))
    write_pptx("24-custom-geom.pptx", [(s24, slide_rels())])

    # 25-table via graphicFrame
    table_xml = f"""  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="9144000" cy="6858000"/><a:chOff x="0" y="0"/><a:chExt cx="9144000" cy="6858000"/></a:xfrm></p:grpSpPr>
{text_shape(2, "Title", 457200, 228600, 8229600, 685800, "Table", size_hundredths=3600, bold=True, scheme="dk1")}
      <p:graphicFrame>
        <p:nvGraphicFramePr>
          <p:cNvPr id="3" name="Table 1"/>
          <p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr>
          <p:nvPr/>
        </p:nvGraphicFramePr>
        <p:xfrm>
          <a:off x="914400" y="1371600"/>
          <a:ext cx="7315200" cy="3429000"/>
        </p:xfrm>
        <a:graphic>
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
            <a:tbl>
              <a:tblGrid>
                <a:gridCol w="2438400"/>
                <a:gridCol w="2438400"/>
                <a:gridCol w="2438400"/>
              </a:tblGrid>
              <a:tr h="1143000">
                <a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="2000" b="1"/><a:t>Q1</a:t></a:r></a:p></a:txBody><a:tcPr><a:solidFill><a:srgbClr val="4472C4"/></a:solidFill></a:tcPr></a:tc>
                <a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="2000" b="1"/><a:t>Q2</a:t></a:r></a:p></a:txBody><a:tcPr><a:solidFill><a:srgbClr val="4472C4"/></a:solidFill></a:tcPr></a:tc>
                <a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="2000" b="1"/><a:t>Q3</a:t></a:r></a:p></a:txBody><a:tcPr><a:solidFill><a:srgbClr val="4472C4"/></a:solidFill></a:tcPr></a:tc>
              </a:tr>
              <a:tr h="1143000">
                <a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="1800"/><a:t>12</a:t></a:r></a:p></a:txBody><a:tcPr/></a:tc>
                <a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="1800"/><a:t>18</a:t></a:r></a:p></a:txBody><a:tcPr/></a:tc>
                <a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="1800"/><a:t>21</a:t></a:r></a:p></a:txBody><a:tcPr/></a:tc>
              </a:tr>
              <a:tr h="1143000">
                <a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="1800"/><a:t>9</a:t></a:r></a:p></a:txBody><a:tcPr/></a:tc>
                <a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="1800"/><a:t>14</a:t></a:r></a:p></a:txBody><a:tcPr/></a:tc>
                <a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="1800"/><a:t>16</a:t></a:r></a:p></a:txBody><a:tcPr/></a:tc>
              </a:tr>
            </a:tbl>
          </a:graphicData>
        </a:graphic>
      </p:graphicFrame>
    </p:spTree>
  </p:cSld>"""
    write_pptx("25-table.pptx", [(slide_xml(table_xml), slide_rels())])

    # 26-chart: minimal chart part
    chart_part = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
 xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <c:chart>
    <c:title>
      <c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>Revenue</a:t></a:r></a:p></c:rich></c:tx>
    </c:title>
    <c:plotArea>
      <c:barChart>
        <c:barDir val="col"/>
        <c:grouping val="clustered"/>
        <c:ser>
          <c:idx val="0"/><c:order val="0"/>
          <c:tx><c:v>Series 1</c:v></c:tx>
          <c:cat>
            <c:strRef><c:strCache>
              <c:ptCount val="4"/>
              <c:pt idx="0"><c:v>A</c:v></c:pt>
              <c:pt idx="1"><c:v>B</c:v></c:pt>
              <c:pt idx="2"><c:v>C</c:v></c:pt>
              <c:pt idx="3"><c:v>D</c:v></c:pt>
            </c:strCache></c:strRef>
          </c:cat>
          <c:val>
            <c:numRef><c:numCache>
              <c:ptCount val="4"/>
              <c:pt idx="0"><c:v>28</c:v></c:pt>
              <c:pt idx="1"><c:v>55</c:v></c:pt>
              <c:pt idx="2"><c:v>43</c:v></c:pt>
              <c:pt idx="3"><c:v>91</c:v></c:pt>
            </c:numCache></c:numRef>
          </c:val>
        </c:ser>
      </c:barChart>
    </c:plotArea>
  </c:chart>
</c:chartSpace>
"""
    chart_slide = f"""  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="9144000" cy="6858000"/><a:chOff x="0" y="0"/><a:chExt cx="9144000" cy="6858000"/></a:xfrm></p:grpSpPr>
{text_shape(2, "Title", 457200, 228600, 8229600, 685800, "Chart via Vela", size_hundredths=3600, bold=True, scheme="dk1")}
      <p:graphicFrame>
        <p:nvGraphicFramePr>
          <p:cNvPr id="3" name="Chart 1"/>
          <p:cNvGraphicFramePr/>
          <p:nvPr/>
        </p:nvGraphicFramePr>
        <p:xfrm>
          <a:off x="914400" y="1371600"/>
          <a:ext cx="7315200" cy="4572000"/>
        </p:xfrm>
        <a:graphic>
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
            <c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId2"/>
          </a:graphicData>
        </a:graphic>
      </p:graphicFrame>
    </p:spTree>
  </p:cSld>"""
    # Custom writer for chart relationships + content types
    path = FIXTURES / "26-chart-vela.pptx"
    overrides = [
        '<Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>',
        '<Override PartName="/ppt/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>',
    ]
    ct = CT.format(overrides="\n  ".join(overrides))
    srels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/>
</Relationships>
"""
    with ZipFile(path, "w", compression=ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", ct)
        zf.writestr("_rels/.rels", ROOT_RELS)
        zf.writestr("ppt/presentation.xml", presentation_xml(1))
        zf.writestr("ppt/_rels/presentation.xml.rels", presentation_rels(1))
        zf.writestr("ppt/theme/theme1.xml", THEME)
        zf.writestr("ppt/slideMasters/slideMaster1.xml", MASTER)
        zf.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", MASTER_RELS)
        zf.writestr("ppt/slideLayouts/slideLayout1.xml", LAYOUT)
        zf.writestr("ppt/slideLayouts/_rels/slideLayout1.xml.rels", LAYOUT_RELS)
        zf.writestr("ppt/slides/slide1.xml", slide_xml(chart_slide))
        zf.writestr("ppt/slides/_rels/slide1.xml.rels", srels)
        zf.writestr("ppt/charts/chart1.xml", chart_part)
    print(f"wrote {path}")


    # 28 — a show: a transition per slide and a click-through build on one
    t1 = text_shape(2, "Title box", 400000, 400000, 7000000, 1200000,
                    "A show, not a page", size_hundredths=4000, bold=True)
    t2 = text_shape(3, "First point", 400000, 2000000, 3200000, 900000,
                    "First", fill="ED7D31", color="FFFFFF", scheme=None)
    t3 = text_shape(4, "Second point", 3900000, 2000000, 3200000, 900000,
                    "Second", fill="70AD47", color="FFFFFF", scheme=None)
    e1, nid = click_effect(3, 3, "fade", 500)
    e2, nid = click_effect(nid, 4, "wipe(right)", 750)
    show1 = slide_xml(
        sp_tree(t1, t2, t3),
        '<p:transition spd="med"><p:fade/></p:transition>' + timing_xml(e1 + e2),
    )
    show2 = slide_xml(
        sp_tree(text_shape(2, "Next", 400000, 1200000, 7000000, 2000000,
                           "Pushed up from below", fill="5B9BD5",
                           color="FFFFFF", scheme=None)),
        '<p:transition spd="fast" advTm="4000"><p:push dir="u"/></p:transition>',
    )
    write_pptx("28-transitions.pptx", [(show1, slide_rels()), (show2, slide_rels())])

    # 29 — the theme doing the work: <p:style> fills, arrows, and a space run
    styled = sp_tree(
        styled_shape(2, "Solid from theme", 300000, 300000, 2400000, 900000,
                     fill_idx=1, line_idx=2, text="fillRef 1"),
        styled_shape(3, "Gradient from theme", 3000000, 300000, 2400000, 900000,
                     fill_idx=2, line_idx=1, text="fillRef 2"),
        styled_shape(4, "Dark gradient", 5700000, 300000, 2400000, 900000,
                     fill_idx=3, line_idx=1, scheme="dk2", text="fillRef 3"),
        arrow_connector(5, 600000, 1800000, 2000000, 0),
        arrow_connector(6, 3200000, 1800000, 2000000, 600000, head="arrow"),
        arrow_connector(7, 6000000, 1800000, 1600000, 600000, flip_v=True),
        spaced_runs_shape(8, 600000, 3000000, 5000000, 700000),
    )
    write_pptx("29-theme-styles.pptx", [(slide_xml(styled), slide_rels())],
               theme_xml=styled_theme())

    # 30 — a table that states its own grid, with only the edges it names
    table30 = sp_tree(styled_table(
        2, 400000, 800000,
        cols=[1200000, 3600000, 2400000],
        rows=[["", "JavaScript", "Scala.js"],
              ["Typing", "TypeScript, Flow, and a long line that has to wrap", "Built-in"],
              ["Tooling", "Gulp, Bower, Babel, JSX, npm, Webpack, Browserify", "SBT"]],
    ))
    write_pptx("30-table-grid.pptx", [(slide_xml(table30), slide_rels())])

    # 31 — typography a deck inherits rather than states
    inh = sp_tree(
        levelled_body(2, [(0, "First level"), (1, "Second level"), (2, "Third level"),
                          (3, "Fourth level"), (0, "Back to the first"),
                          (0, "This one says it has no bullet")], last_no_bullet=True),
        highlight_shape(3, 457200, 5000000, 5000000, 600000),
    )
    fitted = sp_tree(levelled_body(
        2, [(0, "Shrunk to fit"), (0, "by the tool that wrote this")],
        autofit=(62000, 20000)))
    write_pptx("31-inherited-text.pptx", [(slide_xml(inh), slide_rels()),
                                          (slide_xml(fitted), slide_rels())],
               master_xml=inherited_master())

    # 32 — a slide holding things this reader does not model
    #
    # Between two ordinary shapes sits an mc:AlternateContent block (a diagram),
    # after them a contentPart (ink) and a p:extLst. None of the three is in
    # PptxModel. Editing the text and saving must leave all three exactly as
    # they are: that is what the source spans are for.
    unmodelled = sp_tree(
        text_shape(2, "Heading", 457200, 400000, 6000000, 800000, "Before the diagram"),
        alternate_content(3, 457200, 1400000, 4000000, 2400000),
        text_shape(4, "Footer", 457200, 4200000, 6000000, 800000, "After the diagram"),
        content_part(),
        tree_ext_lst(),
    )
    # ...and at slide level too. CT_Slide orders its children
    # `cSld, clrMapOvr, transition, timing, extLst`, so a transition sits
    # between the two unmodelled ones and they have to go back on the sides of
    # it they came from: an extLst written before the transition is a part
    # PowerPoint rejects. The clrMapOvr is the other half of this — the writer
    # used to state a plain `masterClrMapping` whatever the slide said, which
    # throws away a palette swap.
    unmodelled_tail = """  <p:transition spd="med"><p:fade/></p:transition>
  <p:extLst>
    <p:ext uri="{DEADBEEF-0000-4000-8000-000000000001}">
      <p14:creationId xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" val="7654321"/>
    </p:ext>
  </p:extLst>"""
    # The relationships the preserved content names. A diagram points at four
    # parts of its own and the ink at one; none is modelled here, and all five
    # have to come through a save with the XML that names them.
    dgm = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagram"
    unmodelled_rels = [
        f'<Relationship Id="rId10" Type="{dgm}Data" Target="../diagrams/data1.xml"/>',
        f'<Relationship Id="rId11" Type="{dgm}Layout" Target="../diagrams/layout1.xml"/>',
        f'<Relationship Id="rId12" Type="{dgm}QuickStyle" Target="../diagrams/quickStyle1.xml"/>',
        f'<Relationship Id="rId13" Type="{dgm}Colors" Target="../diagrams/colors1.xml"/>',
        '<Relationship Id="rId20" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml" Target="../ink/ink1.xml"/>',
    ]
    write_pptx("32-unmodelled-content.pptx",
               [(slide_xml(unmodelled, tail=unmodelled_tail),
                 slide_rels(extra=unmodelled_rels))],
               extra_parts={
                   "ppt/diagrams/data1.xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<dgm:dataModel xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram"><dgm:ptLst/></dgm:dataModel>\n',
                   "ppt/diagrams/layout1.xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<dgm:layoutDef xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram"/>\n',
                   "ppt/diagrams/quickStyle1.xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<dgm:styleDef xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram"/>\n',
                   "ppt/diagrams/colors1.xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<dgm:colorsDef xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram"/>\n',
                   "ppt/ink/ink1.xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<inkml:ink xmlns:inkml="http://www.w3.org/2003/InkML"/>\n',
               })

    print("fixtures ready")


if __name__ == "__main__":
    main()
