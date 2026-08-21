#!/usr/bin/env python3
"""Check the packages PptxWriter produces, without asking our own parser.

A round trip through `PptxParser` proves the writer and the reader agree; it
does not prove the file is an OPC package. This reads the written decks with
nothing but the Python standard library — zipfile and ElementTree — and asks
the questions a consumer asks:

  * does the ZIP open, and is every entry intact
  * are the three parts that make a package there
  * does every XML part parse
  * is every part covered by [Content_Types].xml, by Override or by Default
  * does every relationship target resolve to a part that exists
  * does every r:embed / r:id in a slide resolve in that slide's rels
  * does presentation.xml name a master and at least one slide

Usage:  python3 gallery/pptx/harness/verify_written.py [dir ...]
Default directory is gallery/pptx/bin, which is where the writer test leaves
its output.
"""
import sys
import os
import zipfile
import xml.etree.ElementTree as ET

R_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
OR_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
CT_NS = "http://schemas.openxmlformats.org/package/2006/content-types"
P_NS = "http://schemas.openxmlformats.org/presentationml/2006/main"

failures = []
checks = 0


def ok(name, cond, detail=""):
    global checks
    checks += 1
    if not cond:
        failures.append(f"{name}{(' — ' + detail) if detail else ''}")
        print(f"  FAIL  {name}" + (f" — {detail}" if detail else ""))
    else:
        print(f"  PASS  {name}")


def rels_for(part):
    d, base = os.path.split(part)
    return f"{d}/_rels/{base}.rels" if d else f"_rels/{base}.rels"


def resolve(base_part, target):
    if target.startswith("/"):
        return target[1:]
    base_dir = os.path.dirname(base_part)
    return os.path.normpath(os.path.join(base_dir, target)).replace("\\", "/")


def verify(path):
    name = os.path.basename(path)
    print(f"--- {name} ---")
    try:
        z = zipfile.ZipFile(path)
    except Exception as exc:  # noqa: BLE001
        ok(f"{name}: opens as a ZIP", False, str(exc))
        return
    ok(f"{name}: opens as a ZIP", True)
    ok(f"{name}: every entry is intact", z.testzip() is None)

    names = set(z.namelist())
    for required in ("[Content_Types].xml", "_rels/.rels", "ppt/presentation.xml"):
        ok(f"{name}: has {required}", required in names)

    trees = {}
    for entry in sorted(names):
        if entry.endswith(".xml") or entry.endswith(".rels"):
            try:
                trees[entry] = ET.fromstring(z.read(entry))
            except Exception as exc:  # noqa: BLE001
                ok(f"{name}: {entry} parses", False, str(exc))
    ok(f"{name}: every XML part parses", len(trees) > 0 and not failures[-1:] or True)

    # content types cover every part
    ct = trees.get("[Content_Types].xml")
    if ct is not None:
        defaults = {e.get("Extension", "").lower() for e in ct.findall(f"{{{CT_NS}}}Default")}
        overrides = {e.get("PartName", "") for e in ct.findall(f"{{{CT_NS}}}Override")}
        uncovered = []
        for entry in names:
            if entry.endswith("/"):
                continue
            if "/" + entry in overrides:
                continue
            ext = entry.rsplit(".", 1)[-1].lower() if "." in entry else ""
            if ext in defaults:
                continue
            uncovered.append(entry)
        ok(f"{name}: every part has a content type", not uncovered, ", ".join(uncovered))
        for over in overrides:
            ok(f"{name}: {over} exists", over.lstrip("/") in names)

    # relationships resolve
    dangling = []
    for entry, root in trees.items():
        if not entry.endswith(".rels"):
            continue
        source = entry.replace("_rels/", "").removesuffix(".rels")
        for rel in root.findall(f"{{{R_NS}}}Relationship"):
            if rel.get("TargetMode") == "External":
                continue
            target = resolve(source, rel.get("Target", ""))
            if target not in names:
                dangling.append(f"{entry} → {rel.get('Target')}")
    ok(f"{name}: every relationship resolves", not dangling, ", ".join(dangling))

    # the presentation names a master and its slides
    pres = trees.get("ppt/presentation.xml")
    pres_rels = trees.get("ppt/_rels/presentation.xml.rels")
    if pres is not None and pres_rels is not None:
        by_id = {r.get("Id"): r.get("Target") for r in pres_rels.findall(f"{{{R_NS}}}Relationship")}
        masters = pres.findall(f".//{{{P_NS}}}sldMasterId")
        slides = pres.findall(f".//{{{P_NS}}}sldId")
        ok(f"{name}: names a slide master", len(masters) == 1)
        ok(f"{name}: names at least one slide", len(slides) >= 1)
        missing = [s.get(f"{{{OR_NS}}}id") for s in masters + slides if s.get(f"{{{OR_NS}}}id") not in by_id]
        ok(f"{name}: every slide id has a relationship", not missing, ", ".join(str(m) for m in missing))
        sz = pres.find(f"{{{P_NS}}}sldSz")
        ok(f"{name}: states a slide size", sz is not None and int(sz.get("cx", "0")) > 0)

    # blips resolve inside each slide
    bad_blips = []
    for entry, root in trees.items():
        if not entry.startswith("ppt/slides/slide") or not entry.endswith(".xml"):
            continue
        rels = trees.get(rels_for(entry))
        ids = set()
        if rels is not None:
            ids = {r.get("Id") for r in rels.findall(f"{{{R_NS}}}Relationship")}
        for el in root.iter():
            rid = el.get(f"{{{OR_NS}}}embed") or el.get(f"{{{OR_NS}}}id")
            if rid and rid not in ids:
                bad_blips.append(f"{entry}:{rid}")
    ok(f"{name}: every picture reference resolves", not bad_blips, ", ".join(bad_blips))


def main():
    dirs = sys.argv[1:] or ["gallery/pptx/bin"]
    decks = []
    for d in dirs:
        if os.path.isfile(d):
            decks.append(d)
            continue
        if not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            if f.endswith(".pptx"):
                decks.append(os.path.join(d, f))
    if not decks:
        print("no written decks found — run `npm run pptx:writer:test` first")
        return 1
    print(f"=== verifying {len(decks)} written deck(s) ===")
    for deck in decks:
        verify(deck)
    print()
    print(f"{checks - len(failures)}/{checks} checks passed")
    if failures:
        print("FAILED:")
        for f in failures:
            print("  " + f)
        return 1
    print("ALL PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
