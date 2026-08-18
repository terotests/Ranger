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


def slide_xml(body: str) -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
{body}
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>
"""


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
              <a:t>{run["text"]}</a:t>
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


def slide_rels(layout: bool = True, images: dict[str, str] | None = None) -> str:
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
    body = "\n  ".join(rels)
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  {body}
</Relationships>
"""


def write_pptx(name: str, slides: list[tuple[str, str | None]], media: dict[str, bytes] | None = None) -> None:
    """slides: list of (slide_xml, optional slide_rels_xml)."""
    media = media or {}
    path = FIXTURES / name
    overrides = []
    for i in range(len(slides)):
        overrides.append(
            f'<Override PartName="/ppt/slides/slide{i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        )
    ct = CT.format(overrides="\n  ".join(overrides))

    with ZipFile(path, "w", compression=ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", ct)
        zf.writestr("_rels/.rels", ROOT_RELS)
        zf.writestr("ppt/presentation.xml", presentation_xml(len(slides)))
        zf.writestr("ppt/_rels/presentation.xml.rels", presentation_rels(len(slides)))
        zf.writestr("ppt/theme/theme1.xml", THEME)
        zf.writestr("ppt/slideMasters/slideMaster1.xml", MASTER)
        zf.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", MASTER_RELS)
        zf.writestr("ppt/slideLayouts/slideLayout1.xml", LAYOUT)
        zf.writestr("ppt/slideLayouts/_rels/slideLayout1.xml.rels", LAYOUT_RELS)
        for i, (sxml, srels) in enumerate(slides):
            zf.writestr(f"ppt/slides/slide{i + 1}.xml", sxml)
            if srels is not None:
                zf.writestr(f"ppt/slides/_rels/slide{i + 1}.xml.rels", srels)
        for mname, data in media.items():
            zf.writestr(f"ppt/media/{mname}", data)
    print(f"wrote {path}")


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
                4,
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
            (k2, slide_rels(images={"rId2": "../media/icon.png"})),
        ],
        media={"icon.png": png2},
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

    print("fixtures ready")


if __name__ == "__main__":
    main()
