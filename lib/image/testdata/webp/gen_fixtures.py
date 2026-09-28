#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
#
# Regenerates the WebP decoder fixtures in this folder and the expected
# checksums in fixtures.txt.  Needs Pillow (built with libwebp) and the
# `webp` package (pip install pillow webp), and vpxenc (vpx-tools): Pillow is
# the reference decoder (libwebp); `webp` gives access to the encoder options
# Pillow hides (filter type, segments, alpha compression / filtering);
# libvpx writes the key frames libwebp's encoder never does (several token
# partitions, skipped macroblocks, loop filter deltas), wrapped here in a RIFF.
#
#   python3 gen_fixtures.py [source-image]
#
# The ALPH chunks with a chosen filter method are written by hand below,
# because no encoder option forces one filter.
import os, struct, subprocess, sys, tempfile, zlib, random
import numpy as np
from PIL import Image
from webp import _webp, WebPConfig, WebPPicture

HERE = os.path.dirname(os.path.abspath(__file__))
ffi, lib = _webp.ffi, _webp.lib

def config(lossless=False, quality=75, method=4, **raw):
    c = WebPConfig.new(lossless=lossless, quality=quality, method=method)
    ints = ffi.cast('int*', c.ptr)
    idx = dict(segments=6, sns_strength=7, filter_strength=8, filter_sharpness=9,
               filter_type=10, autofilter=11, alpha_compression=12, alpha_filtering=13,
               alpha_quality=14, preprocessing=17, partitions=18, near_lossless=23,
               exact=24, use_delta_palette=25)
    for k, v in raw.items():
        ints[idx[k]] = v
    assert c.validate(), raw
    return c

def encode(img, cfg):
    return bytes(WebPPicture.from_numpy(np.ascontiguousarray(np.asarray(img)),
                                        pilmode=img.mode).encode(cfg).buffer())

def chunks(data):
    out, p = [], 12
    while p + 8 <= len(data):
        t, n = data[p:p + 4], struct.unpack('<I', data[p + 4:p + 8])[0]
        out.append((t, data[p + 8:p + 8 + n]))
        p += 8 + n + (n & 1)
    return out

def chunk(tag, payload):
    b = tag + struct.pack('<I', len(payload)) + payload
    return b + (b'\0' if len(payload) & 1 else b'')

def riff(body):
    return b'RIFF' + struct.pack('<I', 4 + len(body)) + b'WEBP' + body

def vp8x(w, h, flags):
    return chunk(b'VP8X', bytes([flags, 0, 0, 0]) + (w - 1).to_bytes(3, 'little') + (h - 1).to_bytes(3, 'little'))

def vpx_keyframe(img, *opts):
    """A VP8 key frame from libvpx, as a WebP file."""
    w, h = img.size
    ycc = np.asarray(img.convert('YCbCr')).astype(np.float32)
    cw, ch = (w + 1) // 2, (h + 1) // 2
    pad = np.pad(ycc, ((0, ch * 2 - h), (0, cw * 2 - w), (0, 0)), mode='edge')
    u = pad[:, :, 1].reshape(ch, 2, cw, 2).mean(axis=(1, 3)).round().astype(np.uint8)
    v = pad[:, :, 2].reshape(ch, 2, cw, 2).mean(axis=(1, 3)).round().astype(np.uint8)
    with tempfile.TemporaryDirectory() as tmp:
        y4m, ivf = os.path.join(tmp, 'in.y4m'), os.path.join(tmp, 'out.ivf')
        with open(y4m, 'wb') as f:
            f.write(b'YUV4MPEG2 W%d H%d F25:1 Ip A1:1 C420jpeg\nFRAME\n' % (w, h))
            f.write(ycc[:, :, 0].astype(np.uint8).tobytes() + u.tobytes() + v.tobytes())
        subprocess.run(['vpxenc', '--codec=vp8', '--ivf', '--limit=1', '-q', '-o', ivf, y4m] + list(opts), check=True)
        d = open(ivf, 'rb').read()
    n = struct.unpack('<I', d[32:36])[0]
    return riff(chunk(b'VP8 ', d[44:44 + n]))

def predictor_image(seed, w, h, tile):
    """Tiles each built with one VP8L predictor, so the encoder picks those."""
    avg = lambda a, b: (a + b) >> 1
    clip = lambda v: max(0, min(255, v))
    def half(a, b):
        return clip(a + (a - b) // 2 if a >= b else a - (b - a) // 2)
    pred = {
        3: lambda L, T, TL, TR: TR, 4: lambda L, T, TL, TR: TL,
        5: lambda L, T, TL, TR: avg(avg(L, TR), T), 8: lambda L, T, TL, TR: avg(TL, T),
        9: lambda L, T, TL, TR: avg(T, TR), 10: lambda L, T, TL, TR: avg(avg(L, TL), avg(T, TR)),
        12: lambda L, T, TL, TR: clip(L + T - TL), 13: lambda L, T, TL, TR: half(avg(L, T), TL),
    }
    modes = [8, 9, 10, 3, 4, 12, 13, 5]
    rnd = random.Random(seed)
    a = np.zeros((h, w), np.int32)
    for y in range(h):
        for x in range(w):
            if y == 0 or x == 0 or x == w - 1:
                a[y, x] = rnd.randrange(256)
                continue
            v = pred[modes[(x // tile + (y // tile) * (w // tile)) % len(modes)]](a[y, x - 1], a[y - 1, x], a[y - 1, x - 1], a[y - 1, x + 1])
            if rnd.random() < 0.3:
                v = clip(v + rnd.choice((-40, -9, 5, 33)))
            a[y, x] = v
    return Image.fromarray(np.stack([a, (a * 3) & 255, 255 - a], -1).astype(np.uint8), 'RGB')

def quadrants(size, seed):
    """Four regions with unrelated statistics: meta prefix codes."""
    rnd = random.Random(seed)
    a = np.zeros((size, size, 3), np.uint8)
    hs = size // 2
    for y in range(size):
        for x in range(size):
            q = (x // hs) + 2 * (y // hs)
            if q == 0:
                a[y, x] = (rnd.randrange(0, 40), rnd.randrange(200, 256), rnd.randrange(0, 8))
            elif q == 1:
                a[y, x] = (rnd.randrange(200, 256), rnd.randrange(0, 16), rnd.randrange(100, 140))
            elif q == 2:
                a[y, x] = ((x * 3 + y * 5) % 256, (x * 7) % 256, (y * 9) % 256)
            else:
                a[y, x] = (rnd.randrange(0, 256) & 0xf0, 128, 0)
    return Image.fromarray(a, 'RGB')

def stripes(w, h):
    """Flat, horizontal and vertical stripes, a gradient: every 16x16 mode."""
    a = np.zeros((h, w, 3), np.uint8)
    for y in range(h):
        for x in range(w):
            r = y // 16
            if r == 0:
                c = (90, 140, 200)
            elif r == 1:
                c = ((y * 37) % 256, (y * 11) % 256, 60)
            elif r in (2, 3):
                c = ((x * 37) % 256, 80, (x * 23) % 256)
            else:
                c = (90, 140, 200) if x < w // 2 else (min(255, x * 2), y * 3, 100)
            a[y, x] = c
    return Image.fromarray(a, 'RGB')

def filter_alpha(a, method):
    """Forward WebP alpha filter (the decoder's unfilter reverses it)."""
    h, w = a.shape
    a = a.astype(np.int32)
    out = np.zeros_like(a)
    for y in range(h):
        for x in range(w):
            if y == 0 and x == 0:
                pred = 0
            elif y == 0:
                pred = a[y, x - 1]
            elif x == 0:
                pred = a[y - 1, x]
            elif method == 1:
                pred = a[y, x - 1]
            elif method == 2:
                pred = a[y - 1, x]
            else:
                pred = min(255, max(0, a[y, x - 1] + a[y - 1, x] - a[y - 1, x - 1]))
            out[y, x] = (a[y, x] - pred) & 255
    return out.astype(np.uint8)

def lossless_alpha_payload(plane):
    """A VP8L stream for an alpha plane: green carries the value, and the
    5-byte VP8L header is dropped as the ALPH chunk wants."""
    rgb = np.stack([np.zeros_like(plane), plane, np.zeros_like(plane)], axis=-1)
    data = encode(Image.fromarray(rgb, 'RGB'), config(lossless=True, quality=100, method=6, exact=1))
    (tag, payload), = [c for c in chunks(data) if c[0] == b'VP8L']
    return payload[5:]

def lossy_with_alph(rgba, alph_header, alph_data, cfg):
    w, h = rgba.size
    data = encode(rgba.convert('RGB'), cfg)
    (tag, vp8), = [c for c in chunks(data) if c[0] == b'VP8 ']
    return riff(vp8x(w, h, 0x10) + chunk(b'ALPH', bytes([alph_header]) + alph_data) + chunk(b'VP8 ', vp8))

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/sp/f/5-Kielo-kaarme.jpg.webp'
    photo = Image.open(src).convert('RGB')
    rnd = random.Random(7)
    files = {}

    def crop(x, y, w, h):
        return photo.crop((x, y, x + w, y + h))

    def alpha_disc(img):
        w, h = img.size
        a = np.zeros((h, w), np.uint8)
        for y in range(h):
            for x in range(w):
                d = ((x - w / 2) ** 2 + (y - h / 2) ** 2) ** 0.5
                a[y, x] = max(0, min(255, int(255 - 12 * max(0, d - min(w, h) / 3))))
        rgba = img.convert('RGBA')
        rgba.putalpha(Image.fromarray(a, 'L'))
        return rgba

    # --- VP8L lossless ------------------------------------------------------
    files['ll_1x1.webp'] = encode(Image.new('RGBA', (1, 1), (200, 30, 90, 128)), config(True, 100, 6, exact=1))
    noise = Image.frombytes('RGBA', (17, 9), bytes(rnd.randrange(256) for _ in range(17 * 9 * 4)))
    files['ll_noise_17x9.webp'] = encode(noise, config(True, 100, 6, exact=1))
    files['ll_photo_40x30.webp'] = encode(crop(120, 200, 40, 30), config(True, 100, 6))
    files['ll_meta_32x32.webp'] = encode(quadrants(32, 3), config(True, 100, 4))
    files['ll_predictors_64x32.webp'] = encode(predictor_image(3, 64, 32, 16), config(True, 100, 6))
    files['ll_alpha_29x21.webp'] = encode(alpha_disc(crop(200, 100, 29, 21)), config(True, 90, 5))
    for n, (w, h) in ((2, (19, 7)), (4, (13, 5)), (11, (23, 11)), (40, (16, 16))):
        cols = [tuple(rnd.randrange(256) for _ in range(3)) + (255,) for _ in range(n)]
        im = Image.new('RGBA', (w, h))
        im.putdata([cols[rnd.randrange(n)] for y in range(h) for x in range(w)])
        # method 4: at method 6 the encoder finds these too small for a palette
        files['ll_pal%d_%dx%d.webp' % (n, w, h)] = encode(im, config(True, 100, 4, exact=1))
    grad = Image.new('RGB', (64, 64))
    grad.putdata([((x * 4) & 255, (y * 4) & 255, ((x + y) * 2) & 255) for y in range(64) for x in range(64)])
    files['ll_gradient_64x64.webp'] = encode(grad, config(True, 100, 6))

    # --- VP8 lossy -----------------------------------------------------------
    files['ly_1x1.webp'] = encode(Image.new('RGB', (1, 1), (10, 200, 40)), config(False, 75, 4))
    files['ly_odd_17x9.webp'] = encode(crop(120, 260, 17, 9), config(False, 80, 4))
    files['ly_photo_48x40.webp'] = encode(crop(150, 250, 48, 40), config(False, 70, 4, segments=4))
    files['ly_simple_filter_33x31.webp'] = encode(crop(60, 400, 33, 31), config(False, 40, 2, filter_type=0, filter_strength=60))
    files['ly_sharp_40x36.webp'] = encode(crop(180, 380, 40, 36), config(False, 30, 4, filter_sharpness=6, filter_strength=80, segments=4))
    files['ly_nofilter_24x20.webp'] = encode(crop(10, 10, 24, 20), config(False, 90, 3, filter_strength=0, segments=1))
    files['ly_q100_20x18.webp'] = encode(crop(250, 480, 20, 18), config(False, 100, 6))
    files['ly_i16_96x80.webp'] = encode(stripes(96, 80), config(False, 30, 4, segments=4, filter_strength=40))
    files['ly_vpx_skip_96x80.webp'] = vpx_keyframe(stripes(96, 80), '--token-parts=1', '--end-usage=q', '--cq-level=40')
    files['ly_vpx_parts8_37x45.webp'] = vpx_keyframe(crop(100, 200, 37, 45), '--token-parts=3', '--end-usage=q', '--cq-level=40')
    # lossy + ALPH as the encoder writes it (VP8L-compressed, encoder's filter choice)
    files['ly_alpha_33x17.webp'] = encode(alpha_disc(crop(90, 90, 33, 17)), config(False, 75, 4, alpha_filtering=2))
    # lossy + ALPH written by hand: every filter, raw and VP8L-compressed, pre-processing flag
    base = alpha_disc(crop(170, 330, 21, 13))
    a = np.asarray(base)[:, :, 3]
    for method in (0, 1, 2, 3):
        filt = a if method == 0 else filter_alpha(a, method)
        files['ly_alph_raw_f%d_21x13.webp' % method] = lossy_with_alph(base, (method << 2) | 0, filt.tobytes(), config(False, 75, 4))
        files['ly_alph_vp8l_f%d_21x13.webp' % method] = lossy_with_alph(base, (1 << 4) | (method << 2) | 1, lossless_alpha_payload(filt), config(False, 75, 4))

    # --- container ------------------------------------------------------------
    # VP8X with EXIF metadata beside a simple VP8 frame
    im = crop(400, 60, 15, 11)
    exif = Image.Exif(); exif[0x010e] = 'fixture'
    im.save(os.path.join(HERE, 'ly_exif_15x11.webp'), quality=70, exif=exif.tobytes())
    files['ly_exif_15x11.webp'] = open(os.path.join(HERE, 'ly_exif_15x11.webp'), 'rb').read()
    # animation: the decoder returns the first frame
    fr = [alpha_disc(crop(20 + 30 * i, 20, 24, 16)) for i in range(2)]
    p = os.path.join(HERE, 'anim_2f_24x16.webp')
    fr[0].save(p, save_all=True, append_images=fr[1:], duration=100, loop=0, lossless=True)
    files['anim_2f_24x16.webp'] = open(p, 'rb').read()

    lines = []
    total = 0
    for name in sorted(files):
        path = os.path.join(HERE, name)
        with open(path, 'wb') as f:
            f.write(files[name])
        total += len(files[name])
        im = Image.open(path)
        im.seek(0)
        rgba = im.convert('RGBA').tobytes()
        lines.append('%s %d %d %08x' % (name, im.size[0], im.size[1], zlib.adler32(rgba) & 0xffffffff))
    with open(os.path.join(HERE, 'fixtures.txt'), 'w') as f:
        f.write('# name width height adler32(RGBA from libwebp via Pillow)\n')
        f.write('\n'.join(lines) + '\n')
    print('\n'.join(lines))
    print('total bytes', total)

main()
