#!/usr/bin/env python3
"""Hand every PNG this repository writes to Python's zlib and see if it holds.

The writer's own decoder agreeing with the writer proves nothing: they share
the bug. So this reads the files with the standard library — the same inflate
every browser, Word and Excel use — and checks that

  * the signature and chunk CRCs are right,
  * the IDAT stream inflates,
  * it inflates to EXACTLY height x (1 + width * bytes-per-pixel) bytes,
  * every scanline's filter byte is one of the five PNG defines,
  * unfiltering it produces the pixels without running off the row.

Usage: check_png.py [path ...]      (default: gallery/datagrid/artifacts/*.png)
"""
import glob
import os
import struct
import sys
import zlib

CHANNELS = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}


def check(path):
    data = open(path, "rb").read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        return f"{path}: not a PNG"
    pos = 8
    idat = b""
    width = height = depth = ctype = None
    saw_end = False
    while pos < len(data):
        (length,) = struct.unpack(">I", data[pos:pos + 4])
        tag = data[pos + 4:pos + 8]
        body = data[pos + 8:pos + 8 + length]
        (crc,) = struct.unpack(">I", data[pos + 8 + length:pos + 12 + length])
        if crc != zlib.crc32(tag + body) & 0xFFFFFFFF:
            return f"{path}: bad CRC on {tag.decode('ascii', 'replace')}"
        if tag == b"IHDR":
            width, height, depth, ctype = struct.unpack(">IIBB", body[:10])
        elif tag == b"IDAT":
            idat += body
        elif tag == b"IEND":
            saw_end = True
        pos += 12 + length
    if not saw_end:
        return f"{path}: no IEND"
    if ctype not in CHANNELS:
        return f"{path}: colour type {ctype} not handled here"
    if depth != 8:
        return f"{path}: bit depth {depth} not handled here"

    try:
        raw = zlib.decompress(idat)
    except zlib.error as exc:
        return f"{path}: IDAT does not inflate ({exc})"

    bpp = CHANNELS[ctype]
    stride = 1 + width * bpp
    if len(raw) != height * stride:
        return (f"{path}: inflated to {len(raw)} bytes, expected "
                f"{height * stride} ({width}x{height}, {bpp} channels)")

    prev = bytearray(width * bpp)
    for y in range(height):
        f = raw[y * stride]
        if f > 4:
            return f"{path}: row {y} has filter {f}"
        line = bytearray(raw[y * stride + 1:(y + 1) * stride])
        for x in range(len(line)):
            a = line[x - bpp] if x >= bpp else 0
            b = prev[x]
            c = prev[x - bpp] if x >= bpp else 0
            if f == 1:
                line[x] = (line[x] + a) & 255
            elif f == 2:
                line[x] = (line[x] + b) & 255
            elif f == 3:
                line[x] = (line[x] + (a + b) // 2) & 255
            elif f == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        prev = line

    ratio = len(data) / float(height * stride)
    print(f"  OK {os.path.basename(path):<34} {width}x{height} "
          f"{len(data):>9,} bytes  ({ratio * 100:.1f}% of raw)")
    return None


def main():
    paths = sys.argv[1:]
    if not paths:
        here = os.path.dirname(os.path.abspath(__file__))
        paths = sorted(glob.glob(os.path.join(here, "..", "artifacts", "*.png")))
    if not paths:
        print("no PNGs to check")
        return 1
    bad = []
    for p in paths:
        why = check(p)
        if why:
            print("  FAIL " + why)
            bad.append(p)
    print(f"\n{len(paths) - len(bad)} of {len(paths)} PNGs read back cleanly")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
