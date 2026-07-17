#!/usr/bin/env python3
"""Generate LittleCiv PNG assets: chrome bg, tiles (+fog), pieces, launcher icon."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets"

VIEW_COLS, VIEW_ROWS, TILE = 16, 10, 24
ORIGIN_X, ORIGIN_Y = 8, 34
W, H = 480, 270


def clamp(v: float) -> int:
    if v < 0:
        return 0
    if v > 255:
        return 255
    return int(v)


def write_png(path: Path, w: int, h: int, raw: bytearray, alpha: bool = False) -> None:
    rows = []
    bpp = 4 if alpha else 3
    for y in range(h):
        row = bytearray([0])
        base = y * w * bpp
        row += raw[base : base + w * bpp]
        rows.append(bytes(row))
    data = b"".join(rows)
    color = 6 if alpha else 2

    def chunk(tag: bytes, payload: bytes) -> bytes:
        return (
            struct.pack(">I", len(payload))
            + tag
            + payload
            + struct.pack(">I", zlib.crc32(tag + payload) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", w, h, 8, color, 0, 0, 0)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(data, 9))
        + chunk(b"IEND", b"")
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(png)
    print(f"{path} {w}x{h} ({len(png)} bytes)")


def setp(buf, x, y, r, g, b, a=None, width=W, height=H) -> None:
    if x < 0 or y < 0 or x >= width or y >= height:
        return
    if a is None:
        o = (y * width + x) * 3
        buf[o] = clamp(r)
        buf[o + 1] = clamp(g)
        buf[o + 2] = clamp(b)
    else:
        o = (y * width + x) * 4
        buf[o] = clamp(r)
        buf[o + 1] = clamp(g)
        buf[o + 2] = clamp(b)
        buf[o + 3] = clamp(a)


def fill_rect(buf, x, y, w, h, r, g, b, a=None, width=W, height=H) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            setp(buf, xx, yy, r, g, b, a, width, height)


def draw_tile(buf, tx, ty, ch, width=W, height=H) -> None:
    if ch == "~":
        base, hi, lo = (36, 98, 156), (54, 130, 190), (22, 70, 120)
    elif ch == "f":
        base, hi, lo = (40, 110, 48), (58, 140, 62), (24, 78, 34)
    elif ch == "h":
        base, hi, lo = (138, 122, 78), (168, 148, 96), (100, 88, 56)
    elif ch == "?":
        base, hi, lo = (12, 14, 22), (22, 26, 36), (8, 10, 16)
    else:
        base, hi, lo = (86, 158, 72), (110, 184, 90), (64, 128, 54)

    for yy in range(TILE - 1):
        for xx in range(TILE - 1):
            t = yy / max(1, TILE - 2)
            r = base[0] * (1 - t) + lo[0] * t
            g = base[1] * (1 - t) + lo[1] * t
            b = base[2] * (1 - t) + lo[2] * t
            n = ((xx * 17 + yy * 31 + tx * 3 + ty * 5) % 7) - 3
            setp(buf, tx + xx, ty + yy, r + n * 2, g + n * 2, b + n, width=width, height=height)

    for xx in range(TILE - 1):
        setp(buf, tx + xx, ty, hi[0], hi[1], hi[2], width=width, height=height)

    if ch == "~":
        for wx in range(2, TILE - 4, 5):
            wy = 7 + ((tx + wx) % 3)
            for i in range(4):
                setp(buf, tx + wx + i, ty + wy, 180, 220, 245, width=width, height=height)
    elif ch == "f":
        for tree_x, tree_y in ((6, 5), (14, 8)):
            fill_rect(buf, tx + tree_x + 1, ty + tree_y + 5, 2, 6, 70, 48, 28, width=width, height=height)
            fill_rect(buf, tx + tree_x - 1, ty + tree_y + 1, 6, 5, 28, 92, 36, width=width, height=height)
    elif ch == "h":
        for yy in range(5, 17):
            half = (yy - 5) // 2
            for xx in range(11 - half, 11 + half + 1):
                setp(buf, tx + xx, ty + yy, 160, 140, 90, width=width, height=height)
    elif ch == "?":
        # Question-mark fog
        fill_rect(buf, tx + 9, ty + 6, 5, 8, 40, 48, 70, width=width, height=height)
        fill_rect(buf, tx + 10, ty + 16, 3, 3, 40, 48, 70, width=width, height=height)
    else:
        for gx, gy in ((5, 15), (12, 12), (17, 16)):
            setp(buf, tx + gx, ty + gy, 54, 120, 40, width=width, height=height)


def gen_chrome() -> bytearray:
    pix = bytearray(W * H * 3)
    for y in range(H):
        for x in range(W):
            nx = (x / W) - 0.5
            ny = (y / H) - 0.5
            v = 1.0 - (nx * nx + ny * ny) * 0.85
            setp(pix, x, y, 16 * v, 22 * v, 34 * v)

    # Map viewport frame (tiles are drawn on top by the game).
    mw, mh = VIEW_COLS * TILE, VIEW_ROWS * TILE
    fill_rect(pix, ORIGIN_X - 2, ORIGIN_Y - 2, mw + 3, mh + 3, 8, 12, 20)
    fill_rect(pix, ORIGIN_X - 1, ORIGIN_Y - 1, mw + 1, mh + 1, 200, 180, 90)
    # Dark fill inside so unexplored gaps never flash neon.
    fill_rect(pix, ORIGIN_X, ORIGIN_Y, mw - 1, mh - 1, 10, 12, 18)

    lx = ORIGIN_X + mw + 8
    fill_rect(pix, lx, ORIGIN_Y, 78, 150, 24, 32, 48)
    font = {
        "O": ["111", "101", "101", "101", "111"],
        "C": ["111", "100", "100", "100", "111"],
        "E": ["111", "100", "110", "100", "111"],
        "A": ["010", "101", "111", "101", "101"],
        "N": ["101", "111", "111", "101", "101"],
        "P": ["110", "101", "110", "100", "100"],
        "L": ["100", "100", "100", "100", "111"],
        "I": ["111", "010", "010", "010", "111"],
        "S": ["111", "100", "111", "001", "111"],
        "F": ["111", "100", "110", "100", "100"],
        "R": ["110", "101", "110", "101", "101"],
        "T": ["111", "010", "010", "010", "010"],
        "H": ["101", "101", "111", "101", "101"],
        "G": ["111", "100", "101", "101", "111"],
        "U": ["101", "101", "101", "101", "111"],
        " ": ["000", "000", "000", "000", "000"],
        "?": ["111", "001", "010", "000", "010"],
    }

    def blit_text(x, y, text, rgb):
        cx = x
        for ch in text:
            glyph = font.get(ch, font[" "])
            for gy, row in enumerate(glyph):
                for gx, bit in enumerate(row):
                    if bit == "1":
                        setp(pix, cx + gx, y + gy, *rgb)
            cx += 4

    labels = [("~", "OCEAN"), (".", "PLAINS"), ("f", "FOREST"), ("h", "HILLS"), ("?", "FOG")]
    for i, (ch, name) in enumerate(labels):
        yy = ORIGIN_Y + 6 + i * 28
        # mini 16px sample
        scratch = bytearray(W * H * 3)
        draw_tile(scratch, 0, 0, ch)
        for yy2 in range(16):
            for xx2 in range(16):
                o = (yy2 * W + xx2) * 3
                setp(pix, lx + 4 + xx2, yy + yy2, scratch[o], scratch[o + 1], scratch[o + 2])
        blit_text(lx + 24, yy + 5, name, (210, 220, 235))
    return pix


def gen_tiles() -> bytearray:
    # 6 frames: ocean plains forest hills fog unused
    n = 6
    tw = TILE
    tpix = bytearray((tw * n) * tw * 3)
    for i, ch in enumerate(["~", ".", "f", "h", "?", "."]):
        scratch = bytearray(W * H * 3)
        draw_tile(scratch, 0, 0, ch)
        for yy in range(tw):
            for xx in range(tw):
                o = (yy * W + xx) * 3
                to = (yy * (tw * n) + i * tw + xx) * 3
                tpix[to] = scratch[o]
                tpix[to + 1] = scratch[o + 1]
                tpix[to + 2] = scratch[o + 2]
    return tpix


def gen_pieces() -> bytearray:
    fw = fh = 32
    pc, pr = 4, 2
    sw, sh = fw * pc, fh * pr
    sp = bytearray(sw * sh * 4)

    def sset(x, y, r, g, b, a=255):
        setp(sp, x, y, r, g, b, a, width=sw, height=sh)

    def sfill(x, y, w, h, r, g, b, a=255):
        fill_rect(sp, x, y, w, h, r, g, b, a, width=sw, height=sh)

    def origin(col, row):
        return col * fw, row * fh

    def draw_city(col, row, body, roof, flag):
        ox, oy = origin(col, row)
        sfill(ox + 6, oy + 24, 20, 3, 0, 0, 0, 60)
        sfill(ox + 6, oy + 14, 20, 12, *body)
        sfill(ox + 14, oy + 18, 4, 8, 40, 30, 20)
        for yy in range(8):
            half = yy
            for xx in range(16 - half, 16 + half + 1):
                sset(ox + xx, oy + 6 + yy, *roof)
        sfill(ox + 24, oy + 4, 2, 12, 200, 200, 200)
        sfill(ox + 26, oy + 4, 5, 4, *flag)

    def draw_cursor(col, row):
        ox, oy = origin(col, row)
        c = (255, 240, 80)
        for i in range(28):
            sset(ox + 2 + i, oy + 2, *c)
            sset(ox + 2 + i, oy + 29, *c)
            sset(ox + 2, oy + 2 + i, *c)
            sset(ox + 29, oy + 2 + i, *c)

    draw_city(0, 0, (220, 190, 70), (180, 140, 40), (255, 220, 80))
    draw_city(1, 0, (200, 70, 70), (150, 40, 40), (255, 90, 90))
    draw_cursor(2, 1)
    return sp


def main() -> None:
    chrome = gen_chrome()
    write_png(OUT / "chrome.png", W, H, chrome, alpha=False)
    write_png(OUT / "image.png", W, H, chrome, alpha=False)
    write_png(OUT / "tiles.png", TILE * 6, TILE, gen_tiles(), alpha=False)
    write_png(OUT / "pieces.png", 128, 64, gen_pieces(), alpha=True)
    # Keep a tiny map.png stub so older docs don't break lookups.
    write_png(OUT / "map.png", W, H, chrome, alpha=False)


if __name__ == "__main__":
    main()
