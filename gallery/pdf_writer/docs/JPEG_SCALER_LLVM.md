# jpeg_scaler — LLVM / native build status

**Last updated:** 2026-06-08

## Warning

The **LLVM / native** build of `jpeg_scaler` is **experimental and not usable** for real images today.

- Do **not** run it on full JPEG files except for brief smoke tests.
- It may **hang** during scan-data decode (infinite or very long loop).
- It may allocate **over 1 GB of memory** and keep growing.
- Use the **JavaScript** or **Go** builds for production scaling instead (`npm run jpegscaler:compile:go`, or ES6 under `gallery/pdf_writer/bin/`).

The Ranger **ES6 and Go** targets of the same `jpeg_scaler.rgr` source are the supported paths.

## What works today (LLVM pipeline)

| Stage | Status |
|-------|--------|
| Ranger ? LLVM IR (`jpeg_scaler.ll`) | **OK** — compiles cleanly |
| clang link (`ranger_rt.c`, `ranger_buffer.c`, `ranger_mem.c`) | **OK** |
| `@main(argc, argv)` + CLI args (`ranger_cli_init`) | **OK** — usage text and argument parsing work |
| EXIF metadata parse (`JPEGMetadataParser`) | **OK** — orientation printed |
| JPEG type detection (baseline vs progressive) | **OK** |
| Marker parse + Huffman table load | **OK** — reaches “Decoding N bytes of scan data…” |
| Full decode ? scale ? encode ? output file | **FAIL** — hangs / runaway memory in scan decode |

## Compiler / runtime work completed (2026-06-08)

These changes live in the Ranger **compiler** and **runtime**, not in `jpeg_scaler.rgr` itself:

### LLVM backend (`compiler/`)

- Buffer types (`buffer`, `int_buffer`, `double_buffer`) and operators
- Mixed `int` / `double` arithmetic, bitwise ops, `strfromcode`, `substring`, `str2int` / `str2double`
- UTF-8 string literal byte lengths and escaping in IR
- `[int]` / ptr-array field init, `RtPtrArray_set`, collection `set` / `push` / `at`
- Chained receivers (`huffman.dcTable0.resetArrays()`)
- `@main` only from root source file (no duplicate `main` from imports)
- Empty struct types for field-less classes (e.g. `JPEGScaler`)
- `f64` ? `double` in extern declares and calls
- SSA temp prefix `%.` to avoid clashes with user names like `v11`

### Runtime (`runtime/`)

- `ranger_buffer.c` — byte/int buffer helpers
- `ranger_rt.c` — `ranger_substring`, `ranger_str2double`, `ranger_str2int`, string helpers

### Inline IR runtime (`compiler/ng_LowIRRuntime.rgr`)

- `RtArray_set`, `RtPtrArray_new` / `get` / `len` / `push` / `set` emitted into `.ll`

## Known remaining issues (native build)

1. **Scan decode loop** — After Huffman tables are loaded, decode enters MCU/block processing and does not finish on real files; memory grows without bound (observed **> 1 GB**).
2. **Likely causes (not fully isolated)** — Mismatch or bug in LLVM lowering of tight decode loops, `[int]` / ptr-array `push` in hot paths, or `BitReader` bit extraction; needs targeted debugging (ASan + symbols, compare IR path vs ES6).
3. **No automated LLVM test** — `npm run test:llvm` does not cover `jpeg_scaler` end-to-end.

## How to build (developers only)

```bash
./scripts/compile-jpeg-scaler-llvm.sh
```

Output: `tmp/jpeg-native/jpeg_scaler` and `tmp/jpeg-native/WARNING.txt`.

**Do not distribute this binary.** The script prints a warning and does not run the program by default.

## Supported alternatives

```bash
# C++ / Rust / Go (working native CLIs)
npm run jpegscaler:build:cpp
npm run jpegscaler:build:rust
npm run jpegscaler:build:go

# JavaScript
npm run jpegscaler:compile

# Wall-clock vs ImageMagick / vips / ffmpeg
npm run jpegscaler:bench
```

See [JPEG_SCALER_BENCH.md](./JPEG_SCALER_BENCH.md) for timings and [JPEG_PLAN.md](./JPEG_PLAN.md) for decoder/encoder feature status.
