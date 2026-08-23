#!/usr/bin/env python3
"""
presetShapeDefinitions.xml  ->  the compact catalogue Ranger reads at runtime.

The specification states all 187 preset geometries as data: a list of named
guides computed from the shape's box and its adjustment handles, then a path
written in terms of those guides. That is exactly what a custGeom is, which is
why one evaluator can answer both — and why transcribing 153 shapes by hand
would have been transcribing an evaluator 153 times.

The XML is 559 KB of namespaced elements and would need the XML parser and a
tree walk at startup. This flattens it to one line per record, so the runtime
side is string splitting and nothing else:

    #name                     a shape begins
    A name value              an adjustment's default (avLst is always "val N")
    G name op a b c           a guide, in the order it must be evaluated
    R l t r b                 the text rectangle, as four expressions
    P w h fill stroke         a path begins; w/h 0 means "the shape's own box"
    m x y                     move
    l x y                     line
    c x1 y1 x2 y2 x y         cubic
    q x1 y1 x y               quadratic
    a wR hR st sw             arc, DrawingML's centre-and-sweep form
    z                         close

Every coordinate is a literal or a guide name; the evaluator does not care
which. Regenerate with:

    python3 gallery/office/geom/tools/make_preset_asset.py <presetShapeDefinitions.xml>
"""
import re, sys, os

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "presets.txt")

x = open(SRC, encoding="utf-8-sig").read()
# One block per shape. The root's children are the shape names, and they are
# the only elements at that indentation — matching on the name alone would
# also match every <path> and <gd> in the file.
blocks = re.split(r'\n  <([A-Za-z][A-Za-z0-9]*)>', x)
shapes = {}
order = []
for i in range(1, len(blocks) - 1, 2):
    name, body = blocks[i], blocks[i + 1]
    # The published file lists upDownArrow twice, identically. Keeping the
    # first and ignoring the repeat is what makes the record count equal the
    # shape count.
    if name in shapes:
        continue
    shapes[name] = body
    order.append(name)

def attrs(tag):
    return dict(re.findall(r'(\w+)="([^"]*)"', tag))

lines = []
for name in order:
    body = shapes[name]
    lines.append("#" + name)

    av = re.search(r'<avLst\b[^>]*>(.*?)</avLst>', body, re.S)
    if av:
        for gd in re.finditer(r'<gd name="([^"]+)" fmla="([^"]+)"\s*/?>', av.group(1)):
            f = gd.group(2).split()
            # avLst entries are always "val N"; anything else would be a
            # specification change and is worth failing loudly on.
            assert f[0] == "val", (name, gd.group(2))
            lines.append("A %s %s" % (gd.group(1), f[1]))

    gl = re.search(r'<gdLst\b[^>]*>(.*?)</gdLst>', body, re.S)
    if gl:
        for gd in re.finditer(r'<gd name="([^"]+)" fmla="([^"]+)"\s*/?>', gl.group(1)):
            lines.append("G %s %s" % (gd.group(1), gd.group(2)))

    rc = re.search(r'<rect ([^>]*)/>', body)
    if rc:
        a = attrs(rc.group(1))
        lines.append("R %s %s %s %s" % (a.get("l", "l"), a.get("t", "t"),
                                        a.get("r", "r"), a.get("b", "b")))

    pl = re.search(r'<pathLst\b[^>]*>(.*?)</pathLst>', body, re.S)
    if pl:
        for pm in re.finditer(r'<path([^>]*)>(.*?)</path>', pl.group(1), re.S):
            a = attrs(pm.group(1))
            lines.append("P %s %s %s %s" % (
                a.get("w", "0"), a.get("h", "0"),
                a.get("fill", "norm"),
                "0" if a.get("stroke", "true") == "false" else "1"))
            # Each command is either self-closing (close, arcTo) or a wrapper
            # around one to three <pt>. Walking the tags in order is simpler
            # and less breakable than one regex trying to do both.
            body2 = pm.group(2)
            OPS = {"moveTo": "m", "lnTo": "l", "cubicBezTo": "c", "quadBezTo": "q"}
            for cmd in re.finditer(
                    r'<(moveTo|lnTo|cubicBezTo|quadBezTo)\b[^>]*>(.*?)</\1>'
                    r'|<(close)\s*/>'
                    r'|<(arcTo)\b([^>]*)/>', body2, re.S):
                if cmd.group(3):
                    lines.append("z")
                elif cmd.group(4):
                    a2 = attrs(cmd.group(5))
                    lines.append("a %s %s %s %s" % (a2["wR"], a2["hR"], a2["stAng"], a2["swAng"]))
                else:
                    pts = re.findall(r'<pt x="([^"]+)" y="([^"]+)"\s*/?>', cmd.group(2))
                    lines.append(OPS[cmd.group(1)] + " " + " ".join(v for pt in pts for v in pt))

# upArrow is in ST_ShapeType and is not in this copy of the definitions. It is
# downArrow mirrored about the horizontal axis, which is an exact
# transformation and not a reconstruction: every t becomes b, every offset
# from one edge becomes the same offset from the other, and the arrowhead's
# apex moves from the bottom to the top. The guide names are downArrow's,
# because a guide name is internal to the shape.
UP_ARROW = """#upArrow
A adj1 50000
A adj2 50000
G maxAdj2 */ 100000 h ss
G a1 pin 0 adj1 100000
G a2 pin 0 adj2 maxAdj2
G dy1 */ ss a2 100000
G y1 +- t dy1 0
G dx1 */ w a1 200000
G x1 +- hc 0 dx1
G x2 +- hc dx1 0
G dy2 */ x1 dy1 wd2
G y2 +- y1 0 dy2
R x1 y2 x2 b
P 0 0 norm 1
m l y1
l x1 y1
l x1 b
l x2 b
l x2 y1
l r y1
l hc t
z"""
lines.extend(UP_ARROW.split("\n"))

out = "\n".join(lines) + "\n"
open(OUT, "w", encoding="utf-8").write(out)
n = sum(1 for l in lines if l.startswith("#"))
print("%d shapes, %d records, %d bytes -> %s" % (n, len(lines), len(out), os.path.normpath(OUT)))
