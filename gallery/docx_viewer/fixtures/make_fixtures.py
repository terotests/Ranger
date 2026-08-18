#!/usr/bin/env python3
"""Regenerate minimal WordprocessingML .docx fixtures for gallery/docx_viewer."""
import io
import zipfile
from pathlib import Path

FIX = Path(__file__).resolve().parent

CT = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
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
      <w:lvlText w:val="•"/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
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
      <w:lvlText w:val="%1.%2)"/>
      <w:pPr><w:ind w:left="1440" w:hanging="360"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
  <w:num w:numId="3"><w:abstractNumId w:val="2"/></w:num>
</w:numbering>'''


def p(text_runs, pstyle=None, jc=None, numId=None, ilvl=0, drawing_rid=None, extent=None):
    ppr = []
    if pstyle:
        ppr.append(f'<w:pStyle w:val="{pstyle}"/>')
    if jc:
        ppr.append(f'<w:jc w:val="{jc}"/>')
    if numId is not None:
        ppr.append(
            f'<w:numPr><w:ilvl w:val="{ilvl}"/><w:numId w:val="{numId}"/></w:numPr>'
        )
    ppr_xml = f'<w:pPr>{"".join(ppr)}</w:pPr>' if ppr else ''
    runs = []
    for t, bold, italic, sz, color in text_runs:
        rpr = []
        if bold:
            rpr.append('<w:b/>')
        if italic:
            rpr.append('<w:i/>')
        if sz:
            rpr.append(f'<w:sz w:val="{sz}"/>')
        if color:
            rpr.append(f'<w:color w:val="{color}"/>')
        rpr_xml = f'<w:rPr>{"".join(rpr)}</w:rPr>' if rpr else ''
        runs.append(f'<w:r>{rpr_xml}<w:t xml:space="preserve">{t}</w:t></w:r>')
    if drawing_rid:
        cx, cy = extent or (2286000, 1143000)  # 2.5" x 1.25"
        runs.append(
            f'''<w:r><w:drawing>
  <wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
             xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <wp:extent cx="{cx}" cy="{cy}"/>
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
    return f'<w:p>{ppr_xml}{"".join(runs)}</w:p>'


def doc_xml(body_paras):
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    {"".join(body_paras)}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
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
                "ffmpeg", "-y", "-f", "lavfi",
                "-i", f"color=c={hexcol}:s={w}x{h}",
                "-frames:v", "1", path,
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


def write_docx(name, paras, extra_rels=None, media=None):
    """media: list of (part_name, bytes) e.g. ('word/media/image1.jpeg', data)"""
    path = FIX / name
    doc_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
'''
    if extra_rels:
        for rid, target, typ in extra_rels:
            doc_rels += f'  <Relationship Id="{rid}" Type="{typ}" Target="{target}"/>\n'
    doc_rels += '</Relationships>'

    with zipfile.ZipFile(path, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', CT)
        z.writestr('_rels/.rels', RELS)
        z.writestr('word/_rels/document.xml.rels', doc_rels)
        z.writestr('word/styles.xml', STYLES_XML)
        z.writestr('word/numbering.xml', NUMBERING)
        z.writestr('word/document.xml', doc_xml(paras))
        if media:
            for part, data in media:
                z.writestr(part, data)
    print('wrote', path.name, path.stat().st_size, 'bytes')


if __name__ == '__main__':
    write_docx('hello.docx', [
        p([('Ranger DOCX Viewer', True, False, None, None)], pstyle='Title'),
        p([('Hello ', False, False, None, None), ('world', True, False, None, None),
           (' — ', False, False, None, None), ('paragraphs', False, True, None, None),
           (' with ', False, False, None, None), ('runs', True, True, None, None),
           ('.', False, False, None, None)]),
        p([('This sample is a minimal WordprocessingML package (ZIP + OPC parts).', False, False, None, None)]),
    ])
    write_docx('styles_demo.docx', [
        p([('Style Resolution Demo', True, False, None, None)], pstyle='Heading1'),
        p([('Heading styles come from styles.xml; direct formatting wins on conflict.', False, False, None, None)]),
        p([('Centered block', False, False, None, None)], jc='center'),
        p([('Right-aligned note', False, True, None, None)], jc='right'),
        p([('Inline ', False, False, None, None), ('red emphasis', True, False, None, 'C00000'),
           (' and ', False, False, None, None), ('larger text', False, False, '28', None),
           ('.', False, False, None, None)], pstyle='Heading2'),
        p([('Normal body continues after the heading with document defaults (11pt Calibri → Open Sans).', False, False, None, None)]),
    ])
    write_docx('lists_demo.docx', [
        p([('Lists', True, False, None, None)], pstyle='Heading1'),
        p([('Bullet items', False, False, None, None)], pstyle='Heading2'),
        p([('Open OPC package', False, False, None, None)], numId=1),
        p([('Parse WordprocessingML', False, False, None, None)], numId=1),
        p([('Resolve styles', False, False, None, None)], numId=1),
        p([('Numbered steps', False, False, None, None)], pstyle='Heading2'),
        p([('Read document.xml', False, False, None, None)], numId=2),
        p([('Merge equivalent runs', False, False, None, None)], numId=2),
        p([('Paginate via DocumentLayout', False, False, None, None)], numId=2),
        p([('Outline (multi-level)', False, False, None, None)], pstyle='Heading2'),
        p([('Install fonts', False, False, None, None)], numId=3, ilvl=0),
        p([('Open Sans Regular', False, False, None, None)], numId=3, ilvl=1),
        p([('Open Sans Bold', False, False, None, None)], numId=3, ilvl=1),
        p([('Parse numbering.xml', False, False, None, None)], numId=3, ilvl=0),
        p([('Done — EVG paints the resolved page.', False, False, None, None)]),
    ])

    jpeg = make_jpeg_bytes(240, 120, (30, 90, 160))
    img_type = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image'
    write_docx(
        'images_demo.docx',
        [
            p([('Images', True, False, None, None)], pstyle='Heading1'),
            p([('DrawingML inline picture via a:blip relationship:', False, False, None, None)]),
            p([], drawing_rid='rId10', extent=(2743200, 1371600), jc='center'),
            p([('Caption: sample JPEG embedded in the OPC package.', False, True, None, None)], jc='center'),
        ],
        extra_rels=[('rId10', 'media/image1.jpeg', img_type)],
        media=[('word/media/image1.jpeg', jpeg)],
    )
