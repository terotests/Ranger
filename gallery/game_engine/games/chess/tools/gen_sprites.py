#!/usr/bin/env python3
"""Generate chess piece sheet, board backdrop, and launcher icon.

pieces.png layout (sheet kind: p0=col, p1=row):
  6 cols: pawn, knight, bishop, rook, queen, king
  2 rows: white, black
  frame 28x28

From repo root:
  python3 gallery/game_engine/games/chess/tools/gen_sprites.py
  npm run engine:chess:assets
"""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets"
FW = FH = 28


def write_png(path: Path, w: int, h: int, rgba: bytearray) -> None:
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


def blank(w: int = FW, h: int = FH) -> bytearray:
    return bytearray(w * h * 4)


def setp(buf: bytearray, w: int, h: int, x: int, y: int, r: int, g: int, b: int, a: int = 255) -> None:
    if 0 <= x < w and 0 <= y < h:
        i = (y * w + x) * 4
        buf[i : i + 4] = bytes((r, g, b, a))


def fill_rect(buf, w, h, x0, y0, rw, rh, r, g, b, a=255) -> None:
    for y in range(y0, y0 + rh):
        for x in range(x0, x0 + rw):
            setp(buf, w, h, x, y, r, g, b, a)


def fill_ellipse(buf, w, h, cx, cy, rx, ry, r, g, b, a=255) -> None:
    for y in range(max(0, cy - ry), min(h, cy + ry + 1)):
        for x in range(max(0, cx - rx), min(w, cx + rx + 1)):
            dx = (x - cx) / max(1, rx)
            dy = (y - cy) / max(1, ry)
            if dx * dx + dy * dy <= 1.0:
                setp(buf, w, h, x, y, r, g, b, a)


def fill_circle(buf, w, h, cx, cy, rad, r, g, b, a=255) -> None:
    fill_ellipse(buf, w, h, cx, cy, rad, rad, r, g, b, a)


def outline_pixel(buf, w, h, x, y, fr, fg, fb, br, bg, bb) -> None:
    """Draw a filled pixel with a 1px dark outline if neighbor is empty."""
    setp(buf, w, h, x, y, fr, fg, fb, 255)


def stamp_mask(buf, w, h, mask, ox, oy, fr, fg, fb, or_, og, ob) -> None:
    """mask is list of strings; '#' fill, 'o' outline-only tip."""
    mh = len(mask)
    mw = max(len(row) for row in mask)
    # First pass: fill
    for y, row in enumerate(mask):
        for x, ch in enumerate(row):
            if ch in "#*":
                setp(buf, w, h, ox + x, oy + y, fr, fg, fb, 255)
    # Outline: any empty neighbor of a filled pixel
    for y, row in enumerate(mask):
        for x, ch in enumerate(row):
            if ch not in "#*":
                continue
            px, py = ox + x, oy + y
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    nx, ny = x + dx, y + dy
                    empty = True
                    if 0 <= ny < mh and 0 <= nx < len(mask[ny]) and mask[ny][nx] in "#*":
                        empty = False
                    if empty:
                        setp(buf, w, h, px + dx, py + dy, or_, og, ob, 255)


# Classic Staunton-ish silhouettes (14 wide × ~20 tall), feet at bottom.
PIECES = {
    "P": [  # pawn
        ".....###......",
        "....#####.....",
        "....#####.....",
        ".....###......",
        "....#####.....",
        "...#######....",
        "....#####.....",
        "....#####.....",
        "...#######....",
        "..#########...",
        ".###########..",
        "##############",
    ],
    "N": [  # knight
        "......####....",
        "....########..",
        "...##########.",
        "..####..######",
        ".####....#####",
        ".###......####",
        ".###......####",
        "..###....####.",
        "...###..####..",
        "...########...",
        "..##########..",
        ".############.",
        "##############",
    ],
    "B": [  # bishop
        "......##......",
        ".....####.....",
        "....######....",
        "...###..###...",
        "...###..###...",
        "....######....",
        ".....####.....",
        ".....####.....",
        "....######....",
        "...########...",
        "..##########..",
        ".############.",
        "##############",
    ],
    "R": [  # rook
        ".##..##..##...",
        ".##..##..##...",
        ".##########...",
        ".##########...",
        "..########....",
        "..########....",
        "..########....",
        "..########....",
        "..########....",
        ".##########...",
        ".############.",
        "##############",
    ],
    "Q": [  # queen
        "#..#..#..#..#.",
        "##.##.##.##.##",
        ".############.",
        "..##########..",
        "...########...",
        "...########...",
        "...########...",
        "..##########..",
        ".############.",
        ".############.",
        "##############",
        "##############",
    ],
    "K": [  # king
        "......##......",
        "....######....",
        "......##......",
        "....######....",
        "...########...",
        "...###..###...",
        "...###..###...",
        "...########...",
        "...########...",
        "..##########..",
        ".############.",
        "##############",
        "##############",
    ],
}

ORDER = ["P", "N", "B", "R", "Q", "K"]


def draw_piece_frame(kind: str, white: bool) -> bytearray:
    buf = blank()
    mask = PIECES[kind]
    mw = max(len(r) for r in mask)
    mh = len(mask)
    ox = (FW - mw) // 2
    oy = FH - mh - 1
    if white:
        fr, fg, fb = 245, 240, 230
        or_, og, ob = 40, 36, 30
    else:
        fr, fg, fb = 36, 34, 40
        or_, og, ob = 210, 205, 195
    stamp_mask(buf, FW, FH, mask, ox, oy, fr, fg, fb, or_, og, ob)
    # Soft highlight on white pieces
    if white:
        for y, row in enumerate(mask):
            for x, ch in enumerate(row):
                if ch in "#*" and y < mh // 3:
                    setp(buf, FW, FH, ox + x, oy + y, 255, 252, 245, 255)
    return buf


def gen_pieces() -> None:
    cols, rows = 6, 2
    sheet = blank(FW * cols, FH * rows)
    for ci, kind in enumerate(ORDER):
        for ri, white in enumerate((True, False)):
            frame = draw_piece_frame(kind, white)
            for y in range(FH):
                for x in range(FW):
                    si = (y * FW + x) * 4
                    di = ((ri * FH + y) * (FW * cols) + (ci * FW + x)) * 4
                    sheet[di : di + 4] = frame[si : si + 4]
    write_png(OUT / "pieces.png", FW * cols, FH * rows, sheet)


def gen_board_bg() -> None:
    """Felt backdrop + wood frame + 8x8 checkerboard (matches index.tsx layout)."""
    w, h = 480, 270
    tile = 28
    origin_x, origin_y = 128, 22
    buf = blank(w, h)
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
            setp(buf, w, h, x, y, r, g, b, 255)

    # Wood frame
    fill_rect(buf, w, h, origin_x - 8, origin_y - 8, tile * 8 + 16, tile * 8 + 16, 92, 58, 34)
    fill_rect(buf, w, h, origin_x - 5, origin_y - 5, tile * 8 + 10, tile * 8 + 10, 120, 78, 44)

    for row in range(8):
        for col in range(8):
            x0 = origin_x + col * tile
            y0 = origin_y + row * tile
            if (col + row) % 2 == 0:
                fill_rect(buf, w, h, x0, y0, tile, tile, 232, 208, 168)
                fill_rect(buf, w, h, x0 + 1, y0 + tile - 3, tile - 2, 2, 210, 190, 150)
            else:
                fill_rect(buf, w, h, x0, y0, tile, tile, 148, 98, 58)
                fill_rect(buf, w, h, x0 + 1, y0 + 1, tile - 2, 2, 130, 86, 50)

    write_png(OUT / "board_bg.png", w, h, buf)


def gen_icon() -> None:
    w = h = 64
    buf = blank(w, h)
    # Green square with a white king silhouette
    fill_rect(buf, w, h, 0, 0, w, h, 22, 70, 48)
    for y in range(w):
        for x in range(w):
            light = ((x // 8) + (y // 8)) % 2 == 0
            if light:
                setp(buf, w, h, x, y, 232, 210, 170, 255)
            else:
                setp(buf, w, h, x, y, 120, 78, 48, 255)
    frame = draw_piece_frame("K", True)
    # scale 28→~40 by nearest neighbor into center
    scale = 2
    dw, dh = FW * scale, FH * scale
    ox, oy = (w - dw) // 2, (h - dh) // 2 + 2
    for y in range(FH):
        for x in range(FW):
            i = (y * FW + x) * 4
            a = frame[i + 3]
            if a < 128:
                continue
            r, g, b = frame[i], frame[i + 1], frame[i + 2]
            for sy in range(scale):
                for sx in range(scale):
                    setp(buf, w, h, ox + x * scale + sx, oy + y * scale + sy, r, g, b, 255)
    write_png(OUT / "image.png", w, h, buf)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    gen_pieces()
    gen_board_bg()
    gen_icon()
    print("chess assets ready")


if __name__ == "__main__":
    main()
