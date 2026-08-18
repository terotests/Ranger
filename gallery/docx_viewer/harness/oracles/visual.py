#!/usr/bin/env python3
"""Visual oracle: LibreOffice headless PDF→PNG vs Ranger SoftCanvas page PNGs."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    from PIL import Image, ImageChops, ImageDraw, ImageStat
except ImportError:
    print("SKIP visual: Pillow not installed (pip install Pillow)", file=sys.stderr)
    sys.exit(0)


def which(cmd: str) -> str | None:
    return shutil.which(cmd)


def soffice_bin() -> str | None:
    return which("soffice") or which("libreoffice")


def convert_with_libreoffice(docx: Path, out_dir: Path, dpi: int) -> list[Path]:
    soffice = soffice_bin()
    pdftoppm = which("pdftoppm")
    if not soffice:
        raise RuntimeError("LibreOffice (soffice) not found")
    if not pdftoppm:
        raise RuntimeError("pdftoppm not found (poppler-utils)")

    out_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="docx-lo-") as tmp:
        tmp_path = Path(tmp)
        profile = tmp_path / "profile"
        profile.mkdir()
        env_user = f"-env:UserInstallation=file://{profile}"
        cmd = [
            soffice,
            env_user,
            "--headless",
            "--norestore",
            "--convert-to",
            "pdf",
            "--outdir",
            str(tmp_path),
            str(docx.resolve()),
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            raise RuntimeError(f"soffice failed: {proc.stderr or proc.stdout}")
        pdfs = list(tmp_path.glob("*.pdf"))
        if not pdfs:
            raise RuntimeError("LibreOffice produced no PDF")
        pdf = pdfs[0]
        prefix = tmp_path / "page"
        ppm = subprocess.run(
            [pdftoppm, "-png", "-r", str(dpi), str(pdf), str(prefix)],
            capture_output=True,
            text=True,
        )
        if ppm.returncode != 0:
            raise RuntimeError(f"pdftoppm failed: {ppm.stderr}")
        pages = sorted(tmp_path.glob("page-*.png"))
        if not pages:
            pages = sorted(tmp_path.glob("page*.png"))
        exported = []
        for i, src in enumerate(pages):
            dest = out_dir / f"page-{i:03d}.png"
            shutil.copy2(src, dest)
            exported.append(dest)
        return exported


def mae(a: Image.Image, b: Image.Image) -> float:
    if a.size != b.size:
        b = b.resize(a.size, Image.Resampling.BILINEAR)
    if a.mode != "RGB":
        a = a.convert("RGB")
    if b.mode != "RGB":
        b = b.convert("RGB")
    diff = ImageChops.difference(a, b)
    stat = ImageStat.Stat(diff)
    return sum(stat.mean) / 3.0


def max_channel(a: Image.Image, b: Image.Image) -> float:
    if a.size != b.size:
        b = b.resize(a.size, Image.Resampling.BILINEAR)
    a = a.convert("RGB")
    b = b.convert("RGB")
    diff = ImageChops.difference(a, b)
    return max(ImageStat.Stat(diff).extrema[c][1] for c in range(3))


def write_diff(a: Image.Image, b: Image.Image, path: Path) -> None:
    if a.size != b.size:
        b = b.resize(a.size, Image.Resampling.BILINEAR)
    a = a.convert("RGB")
    b = b.convert("RGB")
    diff = ImageChops.difference(a, b)
    amplified = diff.point(lambda p: min(255, p * 4))
    panel = Image.new("RGB", (a.width * 3, a.height), (20, 20, 24))
    panel.paste(a, (0, 0))
    panel.paste(b, (a.width, 0))
    panel.paste(amplified, (a.width * 2, 0))
    draw = ImageDraw.Draw(panel)
    draw.text((8, 8), "LibreOffice", fill=(240, 240, 240))
    draw.text((a.width + 8, 8), "Ranger", fill=(240, 240, 240))
    draw.text((a.width * 2 + 8, 8), "diff×4", fill=(240, 240, 240))
    path.parent.mkdir(parents=True, exist_ok=True)
    panel.save(path)


def compare_dirs(ref_dir: Path, ranger_dir: Path, diff_dir: Path, mae_limit: float, max_limit: float) -> dict:
    refs = sorted(ref_dir.glob("page-*.png"))
    results = []
    fails = []
    for ref in refs:
        ranger = ranger_dir / ref.name
        if not ranger.exists():
            fails.append(f"missing ranger {ref.name}")
            results.append({"page": ref.name, "ok": False, "error": "missing ranger"})
            continue
        a = Image.open(ref)
        b = Image.open(ranger)
        m = mae(a, b)
        mx = max_channel(a, b)
        ok = m <= mae_limit and mx <= max_limit
        if not ok:
            fails.append(f"{ref.name} mae={m:.2f} max={mx:.1f}")
            write_diff(a, b, diff_dir / ref.name.replace(".png", "-diff.png"))
        results.append(
            {
                "page": ref.name,
                "ok": ok,
                "mae": round(m, 3),
                "max": round(mx, 1),
                "refSize": list(a.size),
                "rangerSize": list(b.size),
            }
        )
    return {"ok": len(fails) == 0, "fails": fails, "pages": results}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("docx")
    ap.add_argument("--ranger-dir", required=True, help="Directory with Ranger page-XXX.png")
    ap.add_argument("--out-dir", required=True, help="Write LibreOffice refs + diffs here")
    ap.add_argument("--dpi", type=int, default=96)
    ap.add_argument("--mae-limit", type=float, default=45.0, help="Mean abs channel error 0..255")
    ap.add_argument("--max-limit", type=float, default=255.0, help="Max channel error; informational by default")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--skip-if-missing", action="store_true")
    args = ap.parse_args()

    if not soffice_bin() or not which("pdftoppm"):
        msg = "SKIP visual: need soffice + pdftoppm"
        if args.json:
            print(json.dumps({"ok": True, "skipped": True, "reason": msg}))
        else:
            print(msg)
        return 0

    out = Path(args.out_dir)
    ref_dir = out / "libreoffice"
    diff_dir = out / "diff"
    try:
        pages = convert_with_libreoffice(Path(args.docx), ref_dir, args.dpi)
    except Exception as e:
        if args.json:
            print(json.dumps({"ok": False, "fails": [str(e)]}))
        else:
            print("FAIL visual convert:", e)
        return 1

    if not pages:
        print("FAIL visual: no pages")
        return 1

    result = compare_dirs(ref_dir, Path(args.ranger_dir), diff_dir, args.mae_limit, args.max_limit)
    result["refPages"] = len(pages)
    if args.json:
        print(json.dumps(result))
    else:
        print("PASS visual" if result["ok"] else "FAIL visual")
        for s in result["pages"]:
            mark = "ok" if s["ok"] else "DIFF"
            print(
                f"  {mark}  {s['page']}  mae={s.get('mae')} max={s.get('max')} "
                f"sizes={s.get('refSize')}/{s.get('rangerSize')}"
            )
        for f in result["fails"]:
            print("  ·", f)
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
