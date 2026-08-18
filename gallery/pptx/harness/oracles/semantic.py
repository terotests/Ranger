#!/usr/bin/env python3
"""Semantic oracle: python-pptx model vs Ranger inspect.json."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

try:
    from pptx import Presentation
    from pptx.enum.shapes import MSO_SHAPE_TYPE
    from pptx.util import Emu
except ImportError:
    print("SKIP semantic: python-pptx not installed (pip install python-pptx)", file=sys.stderr)
    sys.exit(0)


def emu_to_pt(emu: int) -> float:
    return float(emu) / 12700.0


def shape_summary(shape) -> dict:
    kind = "shape"
    st = shape.shape_type
    if st == MSO_SHAPE_TYPE.PICTURE:
        kind = "picture"
    elif st == MSO_SHAPE_TYPE.GROUP:
        kind = "group"
    elif st == MSO_SHAPE_TYPE.LINE:
        kind = "connector"
    elif st == MSO_SHAPE_TYPE.TEXT_BOX:
        kind = "shape"

    out = {
        "kind": kind,
        "name": shape.name or "",
        "x": round(emu_to_pt(shape.left), 2) if shape.left is not None else 0.0,
        "y": round(emu_to_pt(shape.top), 2) if shape.top is not None else 0.0,
        "w": round(emu_to_pt(shape.width), 2) if shape.width is not None else 0.0,
        "h": round(emu_to_pt(shape.height), 2) if shape.height is not None else 0.0,
        "hasText": False,
        "text": "",
        "rotation": round(float(shape.rotation), 2) if hasattr(shape, "rotation") else 0.0,
    }
    if shape.has_text_frame:
        texts = []
        for p in shape.text_frame.paragraphs:
            texts.append("".join(r.text for r in p.runs) or (p.text or ""))
        out["hasText"] = True
        out["text"] = "\n".join(texts)
        out["paragraphs"] = len(shape.text_frame.paragraphs)
        out["runs"] = sum(len(p.runs) for p in shape.text_frame.paragraphs)
    if kind == "group":
        out["children"] = len(list(shape.shapes))
    if kind == "picture":
        out["imageBytes"] = len(shape.image.blob) if shape.image else 0
    # preset / auto-shape type name when available
    try:
        if shape.shape_type == MSO_SHAPE_TYPE.AUTO_SHAPE:
            out["preset"] = str(shape.auto_shape_type).split()[-1].strip("()").lower()
    except Exception:
        pass
    return out


def dump_pptx(path: Path) -> dict:
    prs = Presentation(str(path))
    slides = []
    for i, slide in enumerate(prs.slides):
        shapes = [shape_summary(s) for s in slide.shapes]
        slides.append(
            {
                "index": i,
                "shapeCount": len(shapes),
                "shapes": shapes,
            }
        )
    return {
        "slides": len(prs.slides),
        "slideWidth": round(emu_to_pt(prs.slide_width), 2),
        "slideHeight": round(emu_to_pt(prs.slide_height), 2),
        "slide": slides,
        "oracle": "python-pptx",
    }


def texts_of(info: dict) -> list[str]:
    out = []
    for slide in info.get("slide", []):
        for s in slide.get("shapes", []):
            if s.get("inherited"):
                continue
            if s.get("text"):
                out.append(s["text"])
    return out


def count_kind(info: dict, kind: str) -> int:
    n = 0
    for slide in info.get("slide", []):
        for s in slide.get("shapes", []):
            if s.get("inherited"):
                continue
            if s.get("kind") == kind:
                n += 1
    return n


def compare(ref: dict, ranger: dict) -> list[str]:
    fails = []
    if ref["slides"] != ranger.get("slides"):
        fails.append(f"slides ref={ref['slides']} ranger={ranger.get('slides')}")
    if abs(ref["slideWidth"] - float(ranger.get("slideWidth", 0))) > 1.0:
        fails.append(f"slideWidth ref={ref['slideWidth']} ranger={ranger.get('slideWidth')}")
    if abs(ref["slideHeight"] - float(ranger.get("slideHeight", 0))) > 1.0:
        fails.append(f"slideHeight ref={ref['slideHeight']} ranger={ranger.get('slideHeight')}")

    for i, rslide in enumerate(ref["slide"]):
        if i >= len(ranger.get("slide", [])):
            fails.append(f"slide[{i}] missing in ranger")
            continue
        sslide = ranger["slide"][i]
        # shapeCount is authored (non-inherited) on the Ranger side
        if rslide["shapeCount"] != sslide.get("shapeCount"):
            fails.append(
                f"slide[{i}].shapeCount ref={rslide['shapeCount']} ranger={sslide.get('shapeCount')}"
            )

    # Top-level text presence (order-insensitive contains)
    ref_texts = texts_of(ref)
    ranger_blob = "\n".join(texts_of(ranger))
    for t in ref_texts:
        t = t.strip()
        if not t:
            continue
        if t not in ranger_blob:
            fails.append(f"missing text {t!r}")

    for kind in ("picture", "group"):
        rc = count_kind(ref, kind)
        sc = count_kind(ranger, kind)
        if rc != sc:
            fails.append(f"{kind} count ref={rc} ranger={sc}")

    return fails


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("pptx")
    ap.add_argument("--ranger-inspect", required=True, help="Ranger inspect.json path")
    ap.add_argument("--out-ref", help="Write python-pptx JSON here")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    ref = dump_pptx(Path(args.pptx))
    if args.out_ref:
        Path(args.out_ref).write_text(json.dumps(ref, indent=2), encoding="utf-8")

    ranger = json.loads(Path(args.ranger_inspect).read_text(encoding="utf-8"))
    fails = compare(ref, ranger)
    result = {"ok": len(fails) == 0, "fails": fails, "refSlides": ref["slides"]}
    if args.json:
        print(json.dumps(result))
    else:
        if fails:
            print("FAIL semantic")
            for f in fails:
                print("  ·", f)
        else:
            print("PASS semantic")
    return 0 if not fails else 1


if __name__ == "__main__":
    raise SystemExit(main())
