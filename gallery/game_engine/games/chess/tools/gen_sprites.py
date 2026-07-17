#!/usr/bin/env python3
"""Build chess assets: SpicyGame CC0 piece sheet + felt board + icon.

Pieces come from vendored 16×16 PNGs under assets/vendor/spicygame/
(SpicyGame “Pixel Chess Pieces”, CC0 — https://spicygame.itch.io/chess-pieces).

Sheet layout (game sheet kind: p0=col, p1=row):
  6 cols: P N B R Q K
  2 rows: white, black
  frame 16×16  (index.tsx draws at scale 175 ≈ 28px)

From repo root:
  python3 gallery/game_engine/games/chess/tools/gen_sprites.py
  npm run engine:chess:assets
"""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

try:
    from PIL import Image
except ImportError as e:
    raise SystemExit("Pillow required: pip install pillow") from e

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets"
VENDOR = OUT / "vendor" / "spicygame"
ORDER = ["P", "N", "B", "R", "Q", "K"]
FW = FH = 16


def write_png_bytes(path: Path, w: int, h: int, rgba: bytes) -> None:
    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    raw = bytearray()
    for y in range(h):
        raw.append(0)
        raw.extend(rgba[y * w * 4 : (y + 1) * w * 4])
    data = b"\x89PNG\r\n\x1a\n"
    data += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    data += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    data += chunk(b"IEND", b"")
    path.write_bytes(data)
    print(f"wrote {path.relative_to(ROOT)} ({w}x{h})")


def gen_pieces() -> None:
    missing = []
    for color in ("w", "b"):
        for p in ORDER:
            path = VENDOR / f"{color}{p}.png"
            if not path.is_file():
                missing.append(str(path.relative_to(ROOT)))
    if missing:
        raise SystemExit(
            "Missing vendored SpicyGame tiles:\n  "
            + "\n  ".join(missing)
            + "\nSee assets/CREDITS.md"
        )

    sheet = Image.new("RGBA", (FW * 6, FH * 2), (0, 0, 0, 0))
    for ri, color in enumerate(("w", "b")):
        for ci, p in enumerate(ORDER):
            im = Image.open(VENDOR / f"{color}{p}.png").convert("RGBA")
            if im.size != (FW, FH):
                im = im.resize((FW, FH), Image.NEAREST)
            sheet.paste(im, (ci * FW, ri * FH), im)
    out = OUT / "pieces.png"
    sheet.save(out)
    print(f"wrote {out.relative_to(ROOT)} ({sheet.size[0]}x{sheet.size[1]})")


def gen_board_bg() -> None:
    """Felt backdrop + wood frame + 8x8 checkerboard (matches index.tsx layout)."""
    w, h = 480, 270
    tile = 28
    origin_x, origin_y = 128, 22
    buf = bytearray(w * h * 4)
    for y in range(h):
        for x in range(w):
            dx = (x - w / 2) / (w / 2)
            dy = (y - h / 2) / (h / 2)
            d = math.sqrt(dx * dx + dy * dy)
            base_r, base_g, base_b = 18, 52, 38
            n = ((x * 37 + y * 17) ^ (x * y)) & 7
            shade = int(22 * min(1.0, d * 0.85))
            r = max(0, base_r - shade + (n - 3))
            g = max(0, base_g - shade + (n - 3))
            b = max(0, base_b - shade + (n - 2))
            i = (y * w + x) * 4
            buf[i : i + 4] = bytes((r, g, b, 255))

    def fill_rect(x0, y0, rw, rh, r, g, b):
        for y in range(y0, y0 + rh):
            for x in range(x0, x0 + rw):
                if 0 <= x < w and 0 <= y < h:
                    i = (y * w + x) * 4
                    buf[i : i + 4] = bytes((r, g, b, 255))

    fill_rect(origin_x - 8, origin_y - 8, tile * 8 + 16, tile * 8 + 16, 92, 58, 34)
    fill_rect(origin_x - 5, origin_y - 5, tile * 8 + 10, tile * 8 + 10, 120, 78, 44)
    for row in range(8):
        for col in range(8):
            x0 = origin_x + col * tile
            y0 = origin_y + row * tile
            if (col + row) % 2 == 0:
                fill_rect(x0, y0, tile, tile, 232, 208, 168)
                fill_rect(x0 + 1, y0 + tile - 3, tile - 2, 2, 210, 190, 150)
            else:
                fill_rect(x0, y0, tile, tile, 148, 98, 58)
                fill_rect(x0 + 1, y0 + 1, tile - 2, 2, 130, 86, 50)
    write_png_bytes(OUT / "board_bg.png", w, h, bytes(buf))


def gen_icon() -> None:
    """Launcher icon: board snippet + white king."""
    king = Image.open(VENDOR / "wK.png").convert("RGBA").resize((40, 40), Image.NEAREST)
    icon = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    for y in range(64):
        for x in range(64):
            light = ((x // 8) + (y // 8)) % 2 == 0
            if light:
                icon.putpixel((x, y), (232, 210, 170, 255))
            else:
                icon.putpixel((x, y), (120, 78, 48, 255))
    icon.paste(king, ((64 - 40) // 2, (64 - 40) // 2 + 2), king)
    out = OUT / "image.png"
    icon.save(out)
    print(f"wrote {out.relative_to(ROOT)} (64x64)")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    gen_pieces()
    gen_board_bg()
    gen_icon()
    print("chess assets ready")


if __name__ == "__main__":
    main()
