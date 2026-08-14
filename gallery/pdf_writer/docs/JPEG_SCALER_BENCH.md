# jpeg_scaler — C++ / Rust / Node vs native tools

Timed decode → scale → encode of `gallery/pdf_writer/src/tools/jpeg_scaler.rgr` compiled to C++, Rust, Go, and Node.js, against ImageMagick, GraphicsMagick, libvips, and ffmpeg.

Re-run:

```bash
./gallery/pdf_writer/bench/jpeg_scaler_bench.sh
```

Ranger C++ / Rust / Go / Node wrote **byte-identical** JPEGs on the Example.jpg → 600px case (`180280` bytes, `md5 2d08fcfb09cdf3627ab41a8e44905762`). Native tools write different (usually smaller) files; they are a wall-clock comparison, not a quality match.

## Machine (2026-08-14)

| | |
| --- | --- |
| CPU | 4× Intel Xeon (cloud VM, 1 thread/core) |
| OS | Linux 6.12 x86_64 |
| Ranger | v3.3.1 (`bin/output.js`) |
| C++ | `g++ 13.3.0 -std=c++17 -O3 -pthread` |
| Rust | `rustc 1.83.0 --edition 2021 -O` |
| Go | `go 1.22.2` (default `go build`) |
| Node | v22.14.0 |
| ImageMagick | 6.9.12-98 Q16 (`convert in.jpg -resize WIDTHx -quality 85 out.jpg`) |
| GraphicsMagick | 1.3.42 Q16 (same geometry / quality) |
| libvips | 8.15.1 (`vips thumbnail in.jpg out.jpg WIDTH`) |
| ffmpeg | 6.1.1 (`-vf scale=WIDTH:-1 -q:v 5`) |
| timer | hyperfine 1.18.0 |

`-O3` matters: the same C++ source on Example.jpg → 600px is **47.9 ms** at `-O3` and **353.5 ms** at `-O0` (7.4×). Docs that timed `g++ -std=c++17` without `-O3` are not comparable.

## Results (mean ± σ)

Times are milliseconds. Relative speed is versus the fastest tool in that row.

### Example.jpg 300×300 progressive → width 600 (20 runs)

The documented conformance case (byte-identical Ranger output).

| Command | Mean [ms] | Min | Max | Relative |
|:---|---:|---:|---:|---:|
| ranger-cpp | 47.9 ± 0.4 | 47.5 | 49.0 | 3.95× |
| ranger-rust | 43.1 ± 0.2 | 42.6 | 43.6 | 3.55× |
| ranger-go | 74.0 ± 0.6 | 73.1 | 75.6 | 6.09× |
| ranger-node | 210.6 ± 3.4 | 205.1 | 216.7 | 17.33× |
| **imagemagick** | **12.2 ± 0.3** | 11.8 | 12.7 | 1.00× |
| graphicsmagick | 13.1 ± 0.2 | 12.7 | 13.4 | 1.08× |
| libvips | 31.0 ± 0.7 | 29.4 | 32.4 | 2.55× |
| ffmpeg | 39.8 ± 0.4 | 39.1 | 40.9 | 3.27× |

### Example.jpg 300×300 → width 2400 (8 runs)

Encode-heavy upscale (2400×2400 output). Ranger cannot skip decode work; native encoders (libjpeg-turbo) dominate.

| Command | Mean [ms] | Min | Max | Relative |
|:---|---:|---:|---:|---:|
| ranger-cpp | 610.7 ± 1.4 | 608.9 | 613.2 | 9.17× |
| ranger-rust | 534.6 ± 7.8 | 529.0 | 552.5 | 8.03× |
| ranger-go | 857.0 ± 7.1 | 848.4 | 869.1 | 12.87× |
| ranger-node | 2253.9 ± 47.5 | 2181.6 | 2312.1 | 33.85× |
| imagemagick | 81.8 ± 1.3 | 79.9 | 83.7 | 1.23× |
| **graphicsmagick** | **66.6 ± 0.6** | 65.8 | 67.6 | 1.00× |
| libvips | 75.2 ± 1.2 | 73.3 | 76.7 | 1.13× |
| ffmpeg | 80.3 ± 1.3 | 79.1 | 82.5 | 1.21× |

### GPS_test.jpg 640×480 baseline → width 400 (15 runs)

Small camera JPEG, downscale.

| Command | Mean [ms] | Min | Max | Relative |
|:---|---:|---:|---:|---:|
| ranger-cpp | 33.6 ± 0.2 | 33.3 | 34.1 | 2.93× |
| ranger-rust | 31.3 ± 0.7 | 30.6 | 33.3 | 2.73× |
| ranger-go | 49.6 ± 0.8 | 48.3 | 51.5 | 4.32× |
| ranger-node | 157.9 ± 2.0 | 155.0 | 161.2 | 13.77× |
| **imagemagick** | **11.5 ± 0.6** | 11.0 | 13.2 | 1.00× |
| graphicsmagick | 12.7 ± 0.4 | 12.2 | 13.4 | 1.11× |
| libvips | 30.6 ± 0.6 | 29.9 | 32.2 | 2.67× |
| ffmpeg | 39.9 ± 0.6 | 38.7 | 40.9 | 3.48× |

### plasma 1920×1080 → width 800 (12 runs)

Synthetic HD baseline JPEG (~659 KB), downscale to 800×450.

| Command | Mean [ms] | Min | Max | Relative |
|:---|---:|---:|---:|---:|
| ranger-cpp | 153.8 ± 3.0 | 152.4 | 163.0 | 4.58× |
| ranger-rust | 154.1 ± 1.2 | 152.9 | 156.4 | 4.59× |
| ranger-go | 233.1 ± 0.6 | 232.2 | 234.0 | 6.94× |
| ranger-node | 717.0 ± 10.6 | 702.6 | 738.4 | 21.34× |
| imagemagick | 38.5 ± 2.8 | 37.1 | 47.3 | 1.15× |
| **graphicsmagick** | **33.6 ± 0.3** | 33.2 | 34.1 | 1.00× |
| libvips | 43.1 ± 0.7 | 42.1 | 44.5 | 1.28× |
| ffmpeg | 59.9 ± 0.8 | 59.0 | 62.1 | 1.78× |

### plasma 4000×3000 → width 800 (8 runs)

Synthetic 4K baseline JPEG (~3.2 MB), downscale to 800×600. libvips pulls ahead here because `vips thumbnail` can shrink-on-load (decode at reduced DCT resolution). Ranger always full-decodes, then resamples.

| Command | Mean [ms] | Min | Max | Relative |
|:---|---:|---:|---:|---:|
| ranger-cpp | 643.2 ± 4.3 | 637.8 | 649.5 | 8.16× |
| ranger-rust | 686.7 ± 5.3 | 678.7 | 692.1 | 8.71× |
| ranger-go | 975.3 ± 2.3 | 971.4 | 978.7 | 12.37× |
| ranger-node | 3130.0 ± 46.2 | 3039.7 | 3177.3 | 39.71× |
| imagemagick | 167.4 ± 2.4 | 165.5 | 172.1 | 2.12× |
| graphicsmagick | 135.7 ± 1.1 | 134.4 | 137.7 | 1.72× |
| **libvips** | **78.8 ± 1.5** | 76.5 | 81.2 | 1.00× |
| ffmpeg | 135.6 ± 1.8 | 132.3 | 138.8 | 1.72× |

## What this says about Ranger

Among the generated targets, on this machine:

| | Typical order |
| --- | --- |
| Fastest Ranger | **Rust**, then **C++** (within ~10% except 4K, where C++ is slightly ahead) |
| Next | **Go**, about 1.5× the C++/Rust time |
| Slowest Ranger | **Node.js**, about 4–5× C++/Rust (7–8× on the 4K downscale) |

Against a native JPEG stack (libjpeg-turbo + SIMD):

- Small jobs (Example → 600, GPS → 400): C++/Rust are **~3–4×** ImageMagick. Rust even beats ffmpeg on the 600px upscale (43 ms vs 40 ms is close; ffmpeg wins by a little).
- HD downscale (1080p → 800): C++/Rust are **~4.5×** GraphicsMagick / **~4×** ImageMagick.
- 4K downscale: C++ is **~4×** ImageMagick and **~8×** libvips (shrink-on-load).
- Large upscale (300 → 2400): encode-bound; C++/Rust are **~8–9×** GraphicsMagick.

That is a portable software codec generated from one `.rgr` file, not a libjpeg binding. ImageMagick / vips / ffmpeg call SIMD IDCT, Huffman, and (when shrinking) reduced-resolution decode. Ranger does none of those. The interesting number is that **optimized C++ and Rust land in the same tens-to-hundreds of milliseconds as ffmpeg on small images**, and stay within a small integer factor of ImageMagick on HD.

Node.js is the odd one out: same algorithm, but ~4–5× the native Ranger binaries, with much higher user+system time (GC / JS typed-array traffic in the pixel loops).

## Output size (not timed, but visible)

On the 4K → 800 run the Ranger encoder wrote **461 KB**; ImageMagick `-quality 85` wrote **111 KB**. The codecs are not interchangeable on file size. Timing compares “CLI job finished”, not bits per pixel.

## LLVM

The `-l=llvm` binary is still **not** in this comparison. Scan decode hangs and can grow past 1 GB; see [JPEG_SCALER_LLVM.md](./JPEG_SCALER_LLVM.md). Use `-l=cpp` / `-l=rust` / `-l=go` / `-l=es6` for a working native or Node CLI.
