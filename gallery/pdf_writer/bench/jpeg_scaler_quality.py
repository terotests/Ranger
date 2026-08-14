#!/usr/bin/env python3
"""Quality comparison for jpeg_scaler vs npm / ImageMagick.

Decodes every JPEG with the same ImageMagick convert, then scores RGB
PSNR / RMSE / MAE against two lossless references:
  - triangle (bilinear), closest to Ranger's scaleToSize
  - lanczos, ImageMagick's default -resize filter

Also prints JPEG sampling (4:4:4 vs 4:2:0) and file size.
"""
from __future__ import annotations

import struct
import subprocess
import sys
from pathlib import Path

import numpy as np

import os

# Repo root: RANGER_ROOT wins, then the checkout this file lives in, so the
# script runs outside the /workspace sandbox it was first written in.
ROOT = Path(os.environ.get("RANGER_ROOT") or Path(__file__).resolve().parents[3])
EX = ROOT / "gallery/pdf_writer/assets/images/Example.jpg"
GPS = ROOT / "gallery/pdf_writer/assets/images/GPS_test.jpg"
P1080 = ROOT / "tmp/jpeg-bench/images/plasma_1080.jpg"
OUT = ROOT / "tmp/jpeg-bench/quality"
JS = ROOT / "gallery/pdf_writer/bench/js_scalers"
RANGER_NODE = ROOT / "workspace/tmp/jpeg-bench/es6/jpeg_scaler.js"
RANGER_CPP_CANDIDATES = [
    ROOT / "tmp/jpeg-bench/bin/cpp/jpeg_scaler",
    ROOT / "workspace/tmp/jpeg-bench/cpp/jpeg_scaler",
]


def run(cmd, **kw):
    subprocess.check_call(cmd, **kw)


def jpeg_sampling(path: Path) -> str:
    data = path.read_bytes()
    i = 2
    while i + 8 < len(data):
        if data[i] != 0xFF:
            i += 1
            continue
        m = data[i + 1]
        if m in (0xC0, 0xC1, 0xC2):
            n = data[i + 9]
            comps = []
            p = i + 10
            for _ in range(n):
                cid = data[p]
                samp = data[p + 1]
                comps.append(f"{cid}:{(samp >> 4)}x{(samp & 0xF)}")
                p += 3
            ys = data[i + 11] >> 4
            xs = data[i + 11] & 0xF
            # Y is first component
            y_h, y_v = data[i + 11] >> 4, data[i + 11] & 0xF
            if n >= 3:
                cb_h, cb_v = data[i + 14] >> 4, data[i + 14] & 0xF
                if y_h == cb_h and y_v == cb_v:
                    return f"4:4:4 ({', '.join(comps)})"
                if y_h == 2 * cb_h and y_v == 2 * cb_v:
                    return f"4:2:0 ({', '.join(comps)})"
                if y_h == 2 * cb_h and y_v == cb_v:
                    return f"4:2:2 ({', '.join(comps)})"
            return ", ".join(comps)
        if m in (0xD8, 0xD9) or 0xD0 <= m <= 0xD7:
            i += 2
            continue
        if m == 0x00:
            i += 1
            continue
        seglen = struct.unpack(">H", data[i + 2 : i + 4])[0]
        i += 2 + seglen
    return "?"


def to_rgb(path: Path) -> np.ndarray:
    ident = subprocess.check_output(
        ["identify", "-format", "%w %h", str(path)], text=True
    ).strip()
    w, h = map(int, ident.split())
    raw_path = path.with_suffix(path.suffix + ".rgb")
    run(
        [
            "convert",
            str(path),
            "-colorspace",
            "sRGB",
            "-depth",
            "8",
            f"rgb:{raw_path}",
        ]
    )
    arr = np.fromfile(raw_path, dtype=np.uint8)
    if arr.size != w * h * 3:
        raise RuntimeError(f"{path}: got {arr.size} bytes, expected {w*h*3} ({w}x{h})")
    return arr.reshape(h, w, 3)


def psnr(a: np.ndarray, b: np.ndarray) -> float:
    mse = np.mean((a.astype(np.float64) - b.astype(np.float64)) ** 2)
    if mse <= 1e-12:
        return 99.0
    return 10.0 * np.log10((255.0**2) / mse)


def rmse(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.sqrt(np.mean((a.astype(np.float64) - b.astype(np.float64)) ** 2)))


def mae(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.mean(np.abs(a.astype(np.float64) - b.astype(np.float64))))


def ssim_y(a: np.ndarray, b: np.ndarray) -> float:
    # Mean SSIM on luma, 8x8 windows, constants from Wang et al.
    ya = (0.299 * a[:, :, 0] + 0.587 * a[:, :, 1] + 0.114 * a[:, :, 2]).astype(np.float64)
    yb = (0.299 * b[:, :, 0] + 0.587 * b[:, :, 1] + 0.114 * b[:, :, 2]).astype(np.float64)
    k1, k2, L = 0.01, 0.03, 255.0
    c1, c2 = (k1 * L) ** 2, (k2 * L) ** 2
    win = 8
    vals = []
    for y in range(0, ya.shape[0] - win + 1, win):
        for x in range(0, ya.shape[1] - win + 1, win):
            pa = ya[y : y + win, x : x + win]
            pb = yb[y : y + win, x : x + win]
            ma, mb = pa.mean(), pb.mean()
            va = pa.var()
            vb = pb.var()
            cov = np.mean((pa - ma) * (pb - mb))
            vals.append(
                ((2 * ma * mb + c1) * (2 * cov + c2))
                / ((ma * ma + mb * mb + c1) * (va + vb + c2))
            )
    return float(np.mean(vals)) if vals else 0.0


def ranger(width: int, src: Path, dst: Path):
    dst.parent.mkdir(parents=True, exist_ok=True)
    cpp = next((p for p in RANGER_CPP_CANDIDATES if p.exists()), None)
    if cpp is not None:
        run([str(cpp), "-width", str(width), str(src), str(dst)], stdout=subprocess.DEVNULL)
    elif RANGER_NODE.exists():
        run(["node", str(RANGER_NODE), "-width", str(width), str(src), str(dst)], stdout=subprocess.DEVNULL)
    else:
        raise FileNotFoundError("ranger jpeg_scaler binary not found; run jpeg_scaler_bench.sh first")


def npm(script: str, width: int, src: Path, dst: Path):
    run(["node", str(JS / script), str(width), str(src), str(dst)])


def im(src: Path, dst: Path, width: int, extra: list[str]):
    run(["convert", str(src), *extra, "-resize", f"{width}x", "-quality", "85", str(dst)])


def make_ref(src: Path, dst: Path, width: int, filt: str):
    run(
        [
            "convert",
            str(src),
            "-colorspace",
            "sRGB",
            "-filter",
            filt,
            "-resize",
            f"{width}x",
            "-depth",
            "8",
            str(dst),
        ]
    )


def crop_strip(images: list[tuple[str, Path]], crop: str, dest: Path):
    tiles = []
    for name, path in images:
        tile = dest.parent / f"crop_{name}.png"
        run(["convert", str(path), "-crop", crop, "+repage", "-resize", "200x200!", str(tile)])
        labeled = dest.parent / f"lab_{name}.png"
        run(
            [
                "convert",
                str(tile),
                "-gravity",
                "south",
                "-background",
                "black",
                "-fill",
                "white",
                "-pointsize",
                "14",
                "-splice",
                "0x22",
                "-annotate",
                "+0+2",
                name,
                str(labeled),
            ]
        )
        tiles.append(str(labeled))
    run(["montage", *tiles, "-tile", f"{len(tiles)}x1", "-geometry", "+2+2", str(dest)])


def case(name: str, src: Path, width: int, crop: str):
    d = OUT / name
    d.mkdir(parents=True, exist_ok=True)
    print(f"\n======== {name} {src.name} -> width {width} ========")
    refs = {
        "ref-triangle": d / "ref_triangle.png",
        "ref-lanczos": d / "ref_lanczos.png",
    }
    make_ref(src, refs["ref-triangle"], width, "triangle")
    make_ref(src, refs["ref-lanczos"], width, "Lanczos")
    tri = to_rgb(refs["ref-triangle"])
    lan = to_rgb(refs["ref-lanczos"])

    outputs: dict[str, Path] = {}
    ranger(width, src, d / "ranger.jpg")
    outputs["ranger"] = d / "ranger.jpg"
    npm("scale-jimp.cjs", width, src, d / "jimp.jpg")
    outputs["jimp"] = d / "jimp.jpg"
    npm("scale-jpegjs.cjs", width, src, d / "jpegjs.jpg")
    outputs["jpeg-js"] = d / "jpegjs.jpg"
    npm("scale-imagejs.cjs", width, src, d / "imagejs.jpg")
    outputs["image-js"] = d / "imagejs.jpg"
    npm("scale-sharp.cjs", width, src, d / "sharp.jpg")
    outputs["sharp"] = d / "sharp.jpg"
    im(src, d / "im_default.jpg", width, [])
    outputs["im-default"] = d / "im_default.jpg"
    im(src, d / "im_triangle.jpg", width, ["-filter", "triangle"])
    outputs["im-triangle"] = d / "im_triangle.jpg"
    im(
        src,
        d / "im_444.jpg",
        width,
        ["-filter", "triangle", "-sampling-factor", "4:4:4"],
    )
    outputs["im-tri-444"] = d / "im_444.jpg"

    print(
        f"{'tool':<12} {'bytes':>8} {'samp':<28} "
        f"{'PSNR△':>7} {'PSNR L':>7} {'SSIM△':>7} {'RMSE△':>6}"
    )
    rows = []
    for label, path in outputs.items():
        rgb = to_rgb(path)
        if rgb.shape != tri.shape:
            print(f"{label:<12} size mismatch {rgb.shape} vs {tri.shape}")
            continue
        samp = jpeg_sampling(path)
        row = {
            "tool": label,
            "bytes": path.stat().st_size,
            "samp": samp.split(" (")[0],
            "psnr_tri": psnr(rgb, tri),
            "psnr_lan": psnr(rgb, lan),
            "ssim_tri": ssim_y(rgb, tri),
            "rmse_tri": rmse(rgb, tri),
            "mae_tri": mae(rgb, tri),
        }
        rows.append(row)
        print(
            f"{label:<12} {row['bytes']:8d} {row['samp']:<28} "
            f"{row['psnr_tri']:7.2f} {row['psnr_lan']:7.2f} "
            f"{row['ssim_tri']:7.4f} {row['rmse_tri']:6.2f}"
        )

    crop_strip(
        [("tri", refs["ref-triangle"]), ("lan", refs["ref-lanczos"])]
        + [(k, v) for k, v in outputs.items()],
        crop,
        d / "crops.png",
    )
    return name, rows


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    cases = []
    cases.append(case("example_600", EX, 600, "80x80+180+80"))
    cases.append(case("gps_400", GPS, 400, "80x80+120+80"))
    if P1080.exists():
        cases.append(case("plasma_800", P1080, 800, "80x80+200+120"))

    md = []
    md.append("## Scaling and encode quality")
    md.append("")
    md.append(
        "Ranger `scaleToSize` is bilinear (triangle). The encoder writes **4:4:4** "
        "(no chroma subsample) at IJG quality 85 using an integer FDCT. Jimp / jpeg-js "
        "/ image-js also write 4:4:4 here; only sharp defaults to 4:2:0. Ranger's "
        "larger files are not higher fidelity — see PSNR vs the bilinear PNG."
    )
    md.append("")
    md.append(
        "Scores are against lossless ImageMagick PNG references of the same size: "
        "`triangle` = bilinear, `Lanczos` = IM default `-resize`. Every JPEG is "
        "decoded with the same `convert` so the metric is pixels, not containers."
    )
    md.append("")
    for name, rows in cases:
        md.append(f"### {name}")
        md.append("")
        md.append(
            "| tool | bytes | sampling | PSNR vs bilinear | PSNR vs Lanczos | SSIM vs bilinear | RMSE vs bilinear |"
        )
        md.append("| --- | ---: | --- | ---: | ---: | ---: | ---: |")
        for r in rows:
            md.append(
                f"| {r['tool']} | {r['bytes']} | {r['samp']} | "
                f"{r['psnr_tri']:.2f} | {r['psnr_lan']:.2f} | "
                f"{r['ssim_tri']:.4f} | {r['rmse_tri']:.2f} |"
            )
        md.append("")
    print("\n".join(md))
    (OUT / "quality.md").write_text("\n".join(md) + "\n")
    print(f"\nwrote {OUT / 'quality.md'}")
    print("crop strips:", list(OUT.glob("*/crops.png")))


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as e:
        print("command failed", e, file=sys.stderr)
        sys.exit(1)
