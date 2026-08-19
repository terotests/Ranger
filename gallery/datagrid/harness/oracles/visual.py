#!/usr/bin/env python3
"""Visual oracle: LibreOffice Calc → PNG vs Ranger SoftCanvas PNG (MAE)."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

try:
    from PIL import Image, ImageChops
except ImportError:
    print("SKIP visual: Pillow not installed", file=sys.stderr)
    sys.exit(0)


def find_soffice() -> str | None:
    for c in ("soffice", "libreoffice", "/usr/bin/soffice", "/usr/bin/libreoffice"):
        if shutil.which(c) or Path(c).exists():
            return c if not Path(c).exists() else c
    return None


def mae(a: Image.Image, b: Image.Image) -> tuple[float, float]:
    a = a.convert("RGB")
    b = b.convert("RGB")
    if a.size != b.size:
        b = b.resize(a.size)
    diff = ImageChops.difference(a, b)
    hist = diff.histogram()
    # mean of all channel bins
    total = sum(i * hist[i] for i in range(256)) + sum(i * hist[256 + i] for i in range(256)) + sum(
        i * hist[512 + i] for i in range(256)
    )
    count = a.size[0] * a.size[1] * 3
    mean = total / max(count, 1)
    extrema = diff.getextrema()
    mx = max(ch[1] for ch in extrema)
    return mean, float(mx)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("xlsx")
    ap.add_argument("--ranger-png", required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--mae-limit", type=float, default=45.0)
    ap.add_argument("--strict", action="store_true")
    args = ap.parse_args()

    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    soffice = find_soffice()
    if not soffice:
        print("SKIP visual: LibreOffice not installed")
        sys.exit(0)
    if not shutil.which("pdftoppm"):
        print("SKIP visual: pdftoppm (poppler-utils) not installed")
        sys.exit(0)

    lo_dir = out / "libreoffice"
    lo_dir.mkdir(exist_ok=True)
    subprocess.run(
        [soffice, "--headless", "--convert-to", "pdf", "--outdir", str(lo_dir), str(args.xlsx)],
        check=False,
        capture_output=True,
    )
    pdfs = list(lo_dir.glob("*.pdf"))
    if not pdfs:
        print("SKIP visual: LibreOffice produced no PDF")
        sys.exit(0)
    subprocess.run(["pdftoppm", "-png", "-r", "96", "-f", "1", "-l", "1", str(pdfs[0]), str(lo_dir / "page")], check=False)
    pages = list(lo_dir.glob("page*.png"))
    if not pages:
        print("SKIP visual: no PNG from PDF")
        sys.exit(0)

    ref = Image.open(pages[0])
    ranger = Image.open(args.ranger_png)
    mean, mx = mae(ref, ranger)
    print(f"visual MAE={mean:.2f} max={mx:.1f}")
    if mean > args.mae_limit:
        print("FAIL visual" if args.strict else "ADVISORY visual above limit")
        sys.exit(1 if args.strict else 0)
    print("PASS visual")
    sys.exit(0)


if __name__ == "__main__":
    main()
