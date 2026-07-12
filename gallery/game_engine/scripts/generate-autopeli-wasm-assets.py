#!/usr/bin/env python3
"""Generate minimal placeholder PNG sprites for autopeli_wasm CI/dev.

Real art lives in games/autopeli_physics/assets/ — copy with sync-autopeli-wasm-assets.sh.
These placeholders keep sheet loading and blit paths working without the full asset pack.
"""

from __future__ import annotations

import struct
import zlib
from pathlib import Path


def _chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)


def write_rgba_png(path: Path, width: int, height: int, rgba: bytes) -> None:
    raw = b""
    stride = width * 4
    for y in range(height):
        raw += b"\x00" + rgba[y * stride : (y + 1) * stride]
    compressed = zlib.compress(raw, 9)
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + _chunk(b"IHDR", ihdr) + _chunk(b"IDAT", compressed) + _chunk(b"IEND", b"")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(png)


def solid(w: int, h: int, r: int, g: int, b: int, a: int = 255) -> bytes:
    px = bytes((r, g, b, a))
    return px * (w * h)


def car_png(w: int, h: int, body: tuple[int, int, int]) -> bytes:
    buf = bytearray(solid(w, h, 0, 0, 0, 0))
    r, g, b = body
    cx, cy = w // 2, h // 2
    for y in range(h):
        for x in range(w):
            if abs(x - cx) < w * 0.22 and abs(y - cy) < h * 0.38:
                i = (y * w + x) * 4
                buf[i : i + 4] = bytes((r, g, b, 255))
    return bytes(buf)


def main() -> None:
    root = Path(__file__).resolve().parents[1] / "games" / "autopeli_wasm" / "assets"
    specs = {
        "car1.png": (471, 909, car_png(471, 909, (120, 220, 160))),
        "car2.png": (471, 908, car_png(471, 908, (220, 140, 120))),
        "othercar.png": (285, 625, car_png(285, 625, (180, 180, 200))),
        "cone.png": (204, 275, car_png(204, 275, (255, 120, 40))),
        "oil.png": (891, 706, car_png(891, 706, (40, 40, 50))),
    }
    for name, (w, h, rgba) in specs.items():
        out = root / name
        write_rgba_png(out, w, h, rgba)
        print(f"wrote {out} ({w}x{h})")


if __name__ == "__main__":
    main()
