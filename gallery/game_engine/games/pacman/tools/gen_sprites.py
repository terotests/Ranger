#!/usr/bin/env python3
"""Generate Pac-Man character spritesheets (committed under assets/).

Layout (sheet kind: p0=col, p1=row):
  pac.png          4 cols (mouth) x 4 rows (dir: up/right/down/left), 16x16
  ghost_*.png      2 cols (wobble) x 4 rows (dir), 16x16
  ghost_scared.png 2 cols (flash)  x 2 rows (unused dir), 16x16
  ghost_eyes.png   1 col           x 4 rows (dir), 16x16

From repo root:
  python3 gallery/game_engine/games/pacman/tools/gen_sprites.py
  npm run engine:pacman:assets
"""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets"
FW = FH = 16


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


def blank() -> bytearray:
    return bytearray(FW * FH * 4)


def setp(buf: bytearray, x: int, y: int, r: int, g: int, b: int, a: int = 255) -> None:
    if 0 <= x < FW and 0 <= y < FH:
        i = (y * FW + x) * 4
        buf[i : i + 4] = bytes((r, g, b, a))


def fill_circle(
    buf: bytearray, cx: int, cy: int, rad: int, r: int, g: int, b: int, a: int = 255
) -> None:
    rr = rad * rad
    for y in range(max(0, cy - rad), min(FH, cy + rad + 1)):
        for x in range(max(0, cx - rad), min(FW, cx + rad + 1)):
            if (x - cx) * (x - cx) + (y - cy) * (y - cy) <= rr:
                setp(buf, x, y, r, g, b, a)


def forward(dir_: int) -> tuple[float, float]:
    if dir_ == 0:
        return 0.0, -1.0
    if dir_ == 1:
        return 1.0, 0.0
    if dir_ == 2:
        return 0.0, 1.0
    return -1.0, 0.0


def clear_mouth(buf: bytearray, cx: int, cy: int, rad: int, dir_: int, open_amt: int) -> None:
    if open_amt <= 0:
        return
    # half-angle radians: closed→wide
    half = (0.0, 0.45, 0.85, 1.25)[open_amt]
    fx, fy = forward(dir_)
    rr = (rad + 1) * (rad + 1)
    for y in range(max(0, cy - rad - 1), min(FH, cy + rad + 2)):
        for x in range(max(0, cx - rad - 1), min(FW, cx + rad + 2)):
            dx = x - cx + 0.0
            dy = y - cy + 0.0
            if dx * dx + dy * dy > rr:
                continue
            ln = math.sqrt(dx * dx + dy * dy) or 1.0
            nx, ny = dx / ln, dy / ln
            ang = math.atan2(nx * fy - ny * fx, nx * fx + ny * fy)
            if abs(ang) <= half:
                setp(buf, x, y, 0, 0, 0, 0)


def draw_pac(open_amt: int, dir_: int) -> bytearray:
    buf = blank()
    cx = cy = 7
    fill_circle(buf, cx, cy, 6, 255, 230, 40)
    for y in range(FH):
        for x in range(FW):
            d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy)
            if 37 <= d2 <= 49:
                setp(buf, x, y, 230, 190, 20)
    clear_mouth(buf, cx, cy, 7, dir_, open_amt)
    fx, fy = forward(dir_)
    # eye sits toward the top-ish relative to facing
    ex = cx + int(round(-fy * 2 + fx * 0))
    ey = cy + int(round(fx * 0 - 2))
    if dir_ == 1:
        ex, ey = cx + 1, cy - 2
    elif dir_ == 3:
        ex, ey = cx - 1, cy - 2
    elif dir_ == 0:
        ex, ey = cx + 2, cy - 1
    else:
        ex, ey = cx + 2, cy + 1
    setp(buf, ex, ey, 25, 25, 45)
    return buf


def draw_ghost(
    color: tuple[int, int, int],
    dir_: int,
    frame: int,
    eyes_only: bool = False,
    scared: bool = False,
) -> bytearray:
    buf = blank()
    body = ((40, 80, 255) if frame == 0 else (210, 210, 255)) if scared else color
    if not eyes_only:
        fill_circle(buf, 7, 6, 6, *body)
        for y in range(6, 13):
            for x in range(1, 14):
                setp(buf, x, y, *body)
        scallop = [0, 1, 0, 1, 0, 1, 0] if frame == 0 else [1, 0, 1, 0, 1, 0, 1]
        for i, s in enumerate(scallop):
            x0 = 1 + i * 2
            if s:
                setp(buf, x0, 13, 0, 0, 0, 0)
                setp(buf, x0 + 1, 13, 0, 0, 0, 0)
            else:
                setp(buf, x0, 13, *body)
                setp(buf, x0 + 1, 13, *body)
                setp(buf, x0, 14, *body)
                setp(buf, x0 + 1, 14, *body)
    if scared:
        for x in range(4, 12):
            y = 11 + (1 if (x + frame) % 2 == 0 else 0)
            setp(buf, x, y, 255, 255, 255)
        setp(buf, 5, 6, 255, 255, 255)
        setp(buf, 10, 6, 255, 255, 255)
        return buf
    ox = oy = 0
    if dir_ == 0:
        oy = -1
    elif dir_ == 1:
        ox = 1
    elif dir_ == 2:
        oy = 1
    else:
        ox = -1
    pupil = (20, 40, 160)
    for ex, ey in ((4, 5), (9, 5)):
        for dy in range(3):
            for dx in range(3):
                setp(buf, ex + dx, ey + dy, 255, 255, 255)
        setp(buf, ex + 1 + ox, ey + 1 + oy, *pupil)
        setp(buf, ex + 1 + ox, ey + oy, *pupil)
    return buf


def compose(frames: dict[tuple[int, int], bytearray], cols: int, rows: int) -> tuple[bytearray, int, int]:
    w, h = cols * FW, rows * FH
    out = bytearray(w * h * 4)
    for r in range(rows):
        for c in range(cols):
            src = frames[(r, c)]
            for y in range(FH):
                for x in range(FW):
                    si = (y * FW + x) * 4
                    di = ((r * FH + y) * w + c * FW + x) * 4
                    out[di : di + 4] = src[si : si + 4]
    return out, w, h


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    pac = {(d, m): draw_pac(m, d) for d in range(4) for m in range(4)}
    buf, w, h = compose(pac, 4, 4)
    write_png(OUT / "pac.png", w, h, buf)

    colors = {
        "ghost_red.png": (220, 40, 60),
        "ghost_pink.png": (255, 140, 180),
        "ghost_cyan.png": (80, 220, 220),
        "ghost_orange.png": (255, 160, 60),
    }
    for name, col in colors.items():
        frames = {(d, f): draw_ghost(col, d, f) for d in range(4) for f in range(2)}
        buf, w, h = compose(frames, 2, 4)
        write_png(OUT / name, w, h, buf)

    scared = {(r, f): draw_ghost((0, 0, 0), 1, f, scared=True) for r in range(2) for f in range(2)}
    buf, w, h = compose(scared, 2, 2)
    write_png(OUT / "ghost_scared.png", w, h, buf)

    eyes = {(d, 0): draw_ghost((0, 0, 0), d, 0, eyes_only=True) for d in range(4)}
    buf, w, h = compose(eyes, 1, 4)
    write_png(OUT / "ghost_eyes.png", w, h, buf)


if __name__ == "__main__":
    main()
