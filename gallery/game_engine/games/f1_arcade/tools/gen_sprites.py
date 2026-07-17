#!/usr/bin/env python3
"""Generate arcade-style RGBA PNG sprites for F1 Arcade.

Run from games/f1_arcade:
  python3 tools/gen_sprites.py
"""
from __future__ import annotations

import math
import os
import struct
import zlib

OUT = os.path.join(os.path.dirname(__file__), "..", "assets")


def write_png(path: str, w: int, h: int, pixels: list) -> None:
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w):
            raw.extend(pixels[y * w + x])
    comp = zlib.compress(bytes(raw), 9)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    open(path, "wb").write(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", comp)
        + chunk(b"IEND", b"")
    )
    print("wrote", path, w, h)


def blank(w: int, h: int):
    return [(0, 0, 0, 0)] * (w * h)


def setp(pix, w, h, x, y, rgba):
    if 0 <= x < w and 0 <= y < h and rgba[3] > 0:
        i = y * w + x
        if pix[i][3] == 0 or rgba[3] >= 250:
            pix[i] = rgba


def fill_rect(pix, w, h, x0, y0, rw, rh, rgba):
    for y in range(y0, y0 + rh):
        for x in range(x0, x0 + rw):
            setp(pix, w, h, x, y, rgba)


def fill_ellipse(pix, w, h, cx, cy, rx, ry, rgba):
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            dx = (x - cx) / max(0.001, rx)
            dy = (y - cy) / max(0.001, ry)
            if dx * dx + dy * dy <= 1.05:
                setp(pix, w, h, x, y, rgba)


def scale_nearest(src, sw, sh, nw, nh):
    out = blank(nw, nh)
    for y in range(nh):
        for x in range(nw):
            sx = min(sw - 1, (x * sw) // nw)
            sy = min(sh - 1, (y * sh) // nh)
            out[y * nw + x] = src[sy * sw + sx]
    return out


def draw_palm(w=64, h=96):
    pix = blank(w, h)
    for y in range(36, h - 3):
        t = (y - 36) / (h - 39)
        tw = int(4 + t * 3)
        sway = (y // 6) % 2
        cx = w // 2 + sway
        for x in range(cx - tw, cx + tw + 1):
            shade = 140 - (x - (cx - tw)) * 8
            ring = 30 if (y % 7) < 2 else 0
            setp(pix, w, h, x, y, (shade - ring, 90 - ring // 2, 40, 255))
    fill_ellipse(pix, w, h, w // 2, 30, 10, 12, (34, 150, 55, 255))
    greens = [
        (28, 130, 45, 255),
        (45, 175, 65, 255),
        (22, 105, 38, 255),
        (55, 195, 80, 255),
        (35, 160, 50, 255),
    ]
    arms = []
    for a in range(10):
        ang = -2.6 + a * 0.52
        arms.append((math.cos(ang), math.sin(ang)))
    for i, (ux, uy) in enumerate(arms):
        col = greens[i % len(greens)]
        length = 22 + (i % 3) * 3
        for s in range(length):
            t = s / length
            x = int(w // 2 + ux * s * 1.15)
            y = int(28 + uy * s * 0.7 + t * t * 14)
            thick = 4 if s < length * 0.45 else 2
            for oy in range(-thick, 1):
                for ox in range(-1, 2):
                    setp(pix, w, h, x + ox, y + oy, col)
            if s > 4 and s % 2 == 0:
                lx = int(ux * 0.6 - uy * 0.8)
                ly = int(uy * 0.6 + ux * 0.8)
                setp(pix, w, h, x + lx * 2, y + ly, col)
                setp(pix, w, h, x - lx * 2, y - ly, greens[(i + 1) % 5])
    fill_ellipse(pix, w, h, w // 2 - 4, 34, 3, 3, (130, 80, 25, 255))
    fill_ellipse(pix, w, h, w // 2 + 3, 35, 3, 3, (110, 65, 20, 255))
    fill_ellipse(pix, w, h, w // 2, 37, 2, 2, (100, 55, 15, 255))
    return pix, w, h


def draw_house(w=64, h=64, wall=(215, 80, 60, 255), roof=(50, 70, 135, 255), trim=(240, 220, 180, 255)):
    pix = blank(w, h)
    fill_rect(pix, w, h, 10, 26, 44, 34, wall)
    fill_rect(
        pix,
        w,
        h,
        10,
        26,
        4,
        34,
        (max(0, wall[0] - 35), max(0, wall[1] - 30), max(0, wall[2] - 25), 255),
    )
    for y in range(8, 28):
        half = int(8 + (28 - y) * 1.1)
        for x in range(w // 2 - half, w // 2 + half + 1):
            shade = 15 if y < 14 else 0
            setp(pix, w, h, x, y, (roof[0] + shade, roof[1] + shade // 2, roof[2] + shade, 255))
    for x in range(6, 58):
        setp(pix, w, h, x, 27, trim)
    fill_rect(pix, w, h, 42, 10, 7, 14, (100, 95, 100, 255))
    fill_rect(pix, w, h, 41, 9, 9, 3, (80, 75, 80, 255))
    fill_rect(pix, w, h, 28, 40, 10, 20, (95, 55, 30, 255))
    fill_rect(pix, w, h, 29, 41, 8, 8, (110, 70, 40, 255))
    setp(pix, w, h, 36, 50, (220, 190, 70, 255))
    for wx in (14, 42):
        fill_rect(pix, w, h, wx - 2, 34, 2, 10, (wall[0] - 20, wall[1] - 10, wall[2], 255))
        fill_rect(pix, w, h, wx + 8, 34, 2, 10, (wall[0] - 20, wall[1] - 10, wall[2], 255))
        fill_rect(pix, w, h, wx, 34, 8, 10, (160, 210, 245, 255))
        fill_rect(pix, w, h, wx + 3, 34, 2, 10, (70, 90, 120, 255))
        fill_rect(pix, w, h, wx, 38, 8, 2, (70, 90, 120, 255))
        setp(pix, w, h, wx + 1, 35, (220, 240, 255, 255))
    fill_rect(pix, w, h, 13, 44, 10, 3, (90, 50, 30, 255))
    for fx in range(14, 22, 2):
        setp(pix, w, h, fx, 43, (220, 60, 80, 255))
    fill_rect(pix, w, h, 10, 58, 44, 3, (90, 90, 95, 255))
    fill_rect(pix, w, h, 12, 61, 40, 2, (25, 90, 35, 160))
    return pix, w, h


def draw_person(pix, w, h, ox, oy, shirt, pants=(45, 55, 100, 255), arm_up=True, skin=(245, 200, 160, 255), hair=(55, 35, 20, 255), scale=1.0):
    def S(v):
        return int(v * scale)

    fill_ellipse(pix, w, h, ox + S(8), oy + S(7), S(5), S(6), skin)
    fill_ellipse(pix, w, h, ox + S(8), oy + S(4), S(5), S(3), hair)
    fill_rect(pix, w, h, ox + S(3), oy + S(5), S(10), S(2), hair)
    setp(pix, w, h, ox + S(6), oy + S(7), (30, 30, 30, 255))
    setp(pix, w, h, ox + S(10), oy + S(7), (30, 30, 30, 255))
    setp(pix, w, h, ox + S(7), oy + S(10), (180, 80, 80, 255))
    setp(pix, w, h, ox + S(8), oy + S(10), (180, 80, 80, 255))
    setp(pix, w, h, ox + S(9), oy + S(10), (180, 80, 80, 255))
    fill_rect(pix, w, h, ox + S(4), oy + S(14), S(9), S(12), shirt)
    fill_rect(
        pix,
        w,
        h,
        ox + S(6),
        oy + S(14),
        S(5),
        S(2),
        (max(0, shirt[0] - 40), max(0, shirt[1] - 40), max(0, shirt[2] - 40), 255),
    )
    fill_rect(pix, w, h, ox + S(4), oy + S(26), S(3), S(12), pants)
    fill_rect(pix, w, h, ox + S(10), oy + S(26), S(3), S(12), pants)
    fill_rect(pix, w, h, ox + S(3), oy + S(37), S(5), S(3), (25, 25, 28, 255))
    fill_rect(pix, w, h, ox + S(9), oy + S(37), S(5), S(3), (25, 25, 28, 255))
    if arm_up:
        fill_rect(pix, w, h, ox + S(0), oy + S(4), S(3), S(12), shirt)
        fill_ellipse(pix, w, h, ox + S(1), oy + S(3), S(2), S(2), skin)
        fill_rect(pix, w, h, ox + S(14), oy + S(6), S(3), S(11), shirt)
        fill_ellipse(pix, w, h, ox + S(15), oy + S(5), S(2), S(2), skin)
    else:
        fill_rect(pix, w, h, ox + S(0), oy + S(14), S(3), S(11), shirt)
        fill_ellipse(pix, w, h, ox + S(1), oy + S(25), S(2), S(2), skin)
        fill_rect(pix, w, h, ox + S(14), oy + S(4), S(3), S(12), shirt)
        fill_ellipse(pix, w, h, ox + S(15), oy + S(3), S(2), S(2), skin)


def draw_crowd_frame(arm_phase):
    fw, fh = 72, 56
    pix = blank(fw, fh)
    shirts = [(220, 45, 50, 255), (45, 95, 220, 255), (240, 195, 40, 255), (40, 155, 85, 255)]
    hairs = [(40, 25, 15, 255), (90, 60, 30, 255), (20, 20, 25, 255), (180, 140, 60, 255)]
    pants = [(40, 50, 95, 255), (50, 45, 40, 255), (35, 55, 90, 255), (60, 40, 40, 255)]
    for i, px in enumerate((2, 22, 42)):
        up = arm_phase if (i % 2 == 0) else (not arm_phase)
        draw_person(pix, fw, fh, px, 2, shirts[i], pants=pants[i], arm_up=up, hair=hairs[i])
    draw_person(
        pix, fw, fh, 56, 12, shirts[3], pants=pants[3], arm_up=not arm_phase, hair=hairs[3], scale=0.75
    )
    if arm_phase:
        fill_rect(pix, fw, fh, 2, 0, 5, 4, (220, 40, 40, 255))
    return pix, fw, fh


def draw_crowd_sheet():
    f0, fw, fh = draw_crowd_frame(True)
    f1, _, _ = draw_crowd_frame(False)
    w, h = fw * 2, fh
    pix = blank(w, h)
    for y in range(fh):
        for x in range(fw):
            pix[y * w + x] = f0[y * fw + x]
            pix[y * w + x + fw] = f1[y * fw + x]
    return pix, w, h, fw, fh


def draw_rear_tire(pix, w, h, x, y, tw=12, th=16):
    """Rear-facing tire: stacked tread boxes + shiny highlight on top."""
    bands = [
        (0, 0, tw, 3, (28, 28, 32, 255)),
        (0, 3, tw, 3, (12, 12, 14, 255)),
        (1, 6, tw - 2, 3, (22, 22, 26, 255)),
        (0, 9, tw, 3, (10, 10, 12, 255)),
        (1, 12, tw - 2, max(2, th - 12), (18, 18, 20, 255)),
    ]
    for bx, by, bw, bh, col in bands:
        fill_rect(pix, w, h, x + bx, y + by, bw, bh, col)
    fill_rect(pix, w, h, x + 2, y + 1, max(1, tw - 4), 2, (210, 215, 230, 255))
    fill_rect(pix, w, h, x + 3, y + 1, 2, 1, (255, 255, 255, 255))
    fill_rect(pix, w, h, x, y + 2, 1, max(1, th - 4), (40, 40, 48, 255))
    fill_rect(pix, w, h, x + tw - 1, y + 2, 1, max(1, th - 4), (40, 40, 48, 255))


def draw_front_tire(pix, w, h, x, y, size=7):
    """Smaller rear-facing front tire (drawn behind the body)."""
    tw = size
    th = size + 2
    fill_rect(pix, w, h, x, y, tw, th, (16, 16, 18, 255))
    fill_rect(pix, w, h, x + 1, y + 2, max(1, tw - 2), 2, (10, 10, 12, 255))
    fill_rect(pix, w, h, x + 1, y + 5, max(1, tw - 2), max(1, th - 6), (22, 22, 26, 255))
    # Shine on top edge.
    fill_rect(pix, w, h, x + 1, y, max(1, tw - 2), 1, (200, 205, 220, 255))
    fill_rect(pix, w, h, x + 2, y, 1, 1, (255, 255, 255, 255))


def draw_f1_rear(
    body=(220, 50, 40, 255),
    accent=(40, 120, 220, 255),
    w=56,
    h=38,
    lean=0,
):
    """Rear chase-cam view. lean: -1 left / 0 center / +1 right — body + tires shift."""
    pix = blank(w, h)
    wing = (22, 22, 26, 255)
    shade = (
        max(0, body[0] - 45),
        max(0, body[1] - 35),
        max(0, body[2] - 30),
        255,
    )
    # Body yaw toward steer; tires offset more on the outer side.
    ox = lean * 5
    tip = lean * 2

    # 1) Front tires FIRST — outboard of the narrow chassis so they stay visible
    #    between body and rear tires (not covered by sidepods).
    fl_x = 7 + ox - lean * 3
    fr_x = 42 + ox - lean * 3
    draw_front_tire(pix, w, h, fl_x, 19, 8)
    draw_front_tire(pix, w, h, fr_x, 19, 8)

    # 2) Body first (so spoiler can sit on it), narrow sidepods.
    fill_rect(pix, w, h, 17 + ox, 14, 22, 14, body)
    fill_rect(pix, w, h, 19 + ox, 16, 18, 10, shade)
    fill_rect(pix, w, h, 21 + ox, 13, 14, 3, (32, 32, 38, 255))
    fill_rect(pix, w, h, 12 + ox + tip, 16, 7, 10, body)
    fill_rect(pix, w, h, 37 + ox - tip, 16, 7, 10, body)

    # Helmet from behind.
    fill_ellipse(pix, w, h, w // 2 + ox, 15, 5, 4, (26, 26, 30, 255))
    fill_ellipse(pix, w, h, w // 2 + ox, 14, 3, 3, accent)

    # 3) Spoiler attached to body top (no air gap).
    wing_w = 30
    wing_x = (w - wing_w) // 2 + ox
    fill_rect(pix, w, h, wing_x, 10, wing_w, 3, wing)
    fill_rect(pix, w, h, wing_x + 1, 9, wing_w - 2, 2, (48, 48, 54, 255))
    # Endplates + stalks down into the body.
    fill_rect(pix, w, h, wing_x - 1, 9, 3, 6, wing)
    fill_rect(pix, w, h, wing_x + wing_w - 2, 9, 3, 6, wing)
    fill_rect(pix, w, h, wing_x + 4, 12, 2, 3, wing)
    fill_rect(pix, w, h, wing_x + wing_w - 6, 12, 2, 3, wing)
    for sx in range(wing_x + 4, wing_x + wing_w - 4, 5):
        fill_rect(pix, w, h, sx, 10, 1, 2, (70, 70, 78, 255))

    # Exhaust tucked between rear tires.
    fill_rect(pix, w, h, 22 + ox, 26, 12, 2, (255, 150, 40, 255))

    # 4) Rear tires LAST — body bottom overlaps their top edge.
    rl_x = 0 + lean * 4
    rr_x = 44 + lean * 4
    draw_rear_tire(pix, w, h, rl_x, 22, 12, 15)
    draw_rear_tire(pix, w, h, rr_x, 22, 12, 15)
    return pix, w, h


def draw_f1(body=(220, 50, 40, 255), accent=(40, 120, 220, 255), w=56, h=38):
    return draw_f1_rear(body, accent, w, h, lean=0)


def draw_player_sheet(body=(230, 55, 40, 255), accent=(40, 140, 230, 255), w=56, h=38):
    """3-frame sheet: lean left | center | lean right."""
    frames = [
        draw_f1_rear(body, accent, w, h, lean=-1)[0],
        draw_f1_rear(body, accent, w, h, lean=0)[0],
        draw_f1_rear(body, accent, w, h, lean=1)[0],
    ]
    sw, sh = w * 3, h
    pix = blank(sw, sh)
    for fi, fp in enumerate(frames):
        for y in range(h):
            for x in range(w):
                pix[y * sw + fi * w + x] = fp[y * w + x]
    return pix, sw, sh, w, h


def save_tiers(name, pix, w, h, frame_w=None, frame_h=None):
    tiers = [(0, 0.32), (1, 0.58), (2, 1.00)]
    for ti, frac in tiers:
        if frame_w:
            nw = max(4, int(frame_w * frac) * 2)
            nh = max(4, int(frame_h * frac))
        else:
            nw = max(4, int(w * frac))
            nh = max(4, int(h * frac))
        write_png(os.path.join(OUT, f"{name}_{ti}.png"), nw, nh, scale_nearest(pix, w, h, nw, nh))


def main():
    os.makedirs(OUT, exist_ok=True)
    palm, pw, ph = draw_palm()
    house_a, hw, hh = draw_house()
    house_b, _, _ = draw_house(wall=(235, 210, 155, 255), roof=(150, 55, 45, 255), trim=(255, 240, 200, 255))
    crowd, cw, ch, cfw, cfh = draw_crowd_sheet()
    save_tiers("palm", palm, pw, ph)
    save_tiers("house", house_a, hw, hh)
    save_tiers("house2", house_b, hw, hh)
    save_tiers("crowd", crowd, cw, ch, cfw, cfh)
    write_png(os.path.join(OUT, "palm_2.png"), pw, ph, palm)
    write_png(os.path.join(OUT, "house_2.png"), hw, hh, house_a)
    write_png(os.path.join(OUT, "crowd_2.png"), cw, ch, crowd)

    player_sheet, psw, psh, pfw, pfh = draw_player_sheet()
    write_png(os.path.join(OUT, "car_player.png"), psw, psh, player_sheet)

    cars = {
        "ai0": draw_f1((220, 45, 45, 255), (25, 25, 30, 255)),
        "ai1": draw_f1((45, 85, 220, 255), (240, 240, 250, 255)),
        "ai2": draw_f1((240, 205, 35, 255), (30, 30, 30, 255)),
        "ai3": draw_f1((235, 235, 245, 255), (200, 35, 40, 255)),
    }
    for name, (pix, w, h) in cars.items():
        for ti, frac in [(0, 0.28), (1, 0.48), (2, 0.70), (3, 1.00)]:
            nw = max(4, int(w * frac))
            nh = max(4, int(h * frac))
            sp = scale_nearest(pix, w, h, nw, nh)
            write_png(os.path.join(OUT, f"{name}_{ti}.png"), nw, nh, sp)
        # Full-size alias for live pose.scale (pseudo-3D).
        write_png(os.path.join(OUT, f"{name}.png"), w, h, pix)
    write_png(os.path.join(OUT, "palm.png"), pw, ph, palm)
    write_png(os.path.join(OUT, "house.png"), hw, hh, house_a)
    write_png(os.path.join(OUT, "house2.png"), hw, hh, house_b)
    write_png(os.path.join(OUT, "crowd.png"), cw, ch, crowd)
    write_panorama()
    write_sun_and_clouds()


def write_panorama():
    """960px strip: N pine / E sunny / S sandstone / W snow — scrolls with heading."""
    w, h = 960, 56
    pix = blank(w, h)

    def peak_line(x0, x1, base_y, peaks, color, snow=None):
        heights = [0] * w
        for px, ht in peaks:
            for x in range(max(x0, px - 80), min(x1, px + 80)):
                d = abs(x - px) / 80.0
                hgt = int(ht * (1 - d) * (1 - d))
                if hgt > heights[x]:
                    heights[x] = hgt
        for x in range(x0, x1):
            top = base_y - heights[x]
            for y in range(max(0, top), base_y):
                t = (base_y - y) / max(1, heights[x])
                r = min(255, color[0] + int(t * 35))
                g = min(255, color[1] + int(t * 30))
                b = min(255, color[2] + int(t * 20))
                setp(pix, w, h, x, y, (r, g, b, 255))
                if snow and t > 0.62 and heights[x] > 16:
                    setp(pix, w, h, x, y, snow)

    peak_line(0, 240, h, [(40, 38), (90, 50), (140, 34), (190, 46), (230, 28)], (55, 95, 60))
    peak_line(240, 480, h, [(270, 26), (320, 42), (370, 32), (420, 44), (460, 22)], (90, 140, 75))
    for x in range(240, 480):
        for y in range(h):
            p = pix[y * w + x]
            if p[3]:
                setp(
                    pix,
                    w,
                    h,
                    x,
                    y,
                    (min(255, p[0] + 20), min(255, p[1] + 12), max(0, p[2] - 8), 255),
                )
    peak_line(480, 720, h, [(510, 34), (560, 48), (610, 28), (660, 46), (700, 30)], (175, 135, 85))
    for x in range(545, 575):
        for y in range(h - 48, h - 40):
            setp(pix, w, h, x, y, (190, 150, 95, 255))
    peak_line(
        720,
        960,
        h,
        [(750, 40), (800, 52), (850, 36), (900, 48), (940, 32)],
        (95, 115, 140),
        snow=(235, 245, 255, 255),
    )
    write_png(os.path.join(OUT, "panorama.png"), w, h, pix)


def write_sun_and_clouds():
    sw, sh = 32, 32
    sp = blank(sw, sh)
    fill_ellipse(sp, sw, sh, 16, 16, 12, 12, (255, 220, 80, 255))
    fill_ellipse(sp, sw, sh, 16, 16, 8, 8, (255, 245, 160, 255))
    write_png(os.path.join(OUT, "sun.png"), sw, sh, sp)

    def cloud(name, w, h, blobs):
        cp = blank(w, h)
        for cx, cy, rx, ry in blobs:
            fill_ellipse(cp, w, h, cx, cy, rx, ry, (245, 248, 255, 255))
            fill_ellipse(cp, w, h, cx - 1, cy - 1, max(1, rx - 2), max(1, ry - 2), (255, 255, 255, 255))
        write_png(os.path.join(OUT, name), w, h, cp)

    cloud("cloud_a.png", 48, 24, [(14, 14, 12, 8), (26, 12, 14, 9), (36, 15, 10, 7)])
    cloud("cloud_b.png", 40, 20, [(12, 12, 10, 7), (24, 10, 12, 8), (32, 13, 8, 6)])
    cloud("cloud_c.png", 36, 18, [(10, 10, 9, 6), (22, 9, 11, 7)])


if __name__ == "__main__":
    main()
