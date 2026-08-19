# jpeg_scaler - LLVM / native build status

**Last updated:** 2026-08-17

## It works

The **LLVM / native** build of `jpeg_scaler` decodes, scales and re-encodes real
JPEGs, and its output is **byte-identical to the JavaScript build**. The warning
that used to head this page - that it hung in scan decode and allocated over
1 GB - no longer applies.

```bash
./scripts/compile-jpeg-scaler-llvm.sh
cd tmp/jpeg-native
cp ../../gallery/pdf_writer/assets/images/Example.jpg .
./jpeg_scaler -width 200 Example.jpg out.jpg
```

Checked on `Example.jpg` (progressive, 300x300), `Example_scaled.jpg` and
`GPS_test.jpg`, each at `-width`, `-height` and `-scale`: **9 of 9 outputs
byte-identical** to `gallery/pdf_writer/bin/jpeg_scaler.js` on the same input.

| | native (clang -O2) | JavaScript |
|---|---|---|
| `GPS_test.jpg -scale 0.5` | **119 ms** | 230 ms |
| peak RSS | **34 MB** | - |

34 MB, not the 1 GB the old note warned about.

## What fixed it

Nothing in `jpeg_scaler.rgr`. The decode never ran to completion because the
program did not compile for LLVM at all: `buffer_fill` had no `llvm` template in
`Lang.rgr` and no lowering, so the build stopped at *"Could not match argument
types for buffer_fill"*. `ranger_buffer_fill` in `runtime/ranger_buffer.c` plus a
`lowerBufferFill` beside the existing `lowerIntBufferFill` closed that.

The rest came from the LLVM target's own hardening, none of it specific to JPEG:
the entry point now runs on a large stack, `[boolean]` and `[char]` arrays are no
longer released as objects, a map whose values are arrays owns what it holds, and
the `for` loop re-reads its array's length each iteration instead of caching it
once. Any one of those could produce the "hangs and allocates without bound"
symptom this page used to describe.

## What works today (LLVM pipeline)

| Stage | Status |
|-------|--------|
| Ranger -> LLVM IR (`jpeg_scaler.ll`) | **OK** |
| clang link (`ranger_rt.c`, `ranger_buffer.c`, `ranger_mem.c`, `ranger_json.c`) | **OK** |
| `@main(argc, argv)` + CLI args (`ranger_cli_init`) | **OK** |
| EXIF metadata parse (`JPEGMetadataParser`) | **OK** |
| JPEG type detection (baseline vs progressive) | **OK** |
| Marker parse + Huffman table load | **OK** |
| Full decode -> scale -> encode -> output file | **OK** - byte-identical to ES6 |

## Compiler / runtime work completed (2026-06-08)

These changes live in the Ranger **compiler** and **runtime**, not in
`jpeg_scaler.rgr` itself:

### LLVM backend (`compiler/`)

- Buffer types (`buffer`, `int_buffer`, `double_buffer`) and operators
- Mixed `int` / `double` arithmetic, bitwise ops, `strfromcode`, `substring`, `str2int` / `str2double`
- UTF-8 string literal byte lengths and escaping in IR
- `[int]` / ptr-array field init, `RtPtrArray_set`, collection `set` / `push` / `at`
- Chained receivers (`huffman.dcTable0.resetArrays()`)
- `@main` only from root source file (no duplicate `main` from imports)
- Empty struct types for field-less classes (e.g. `JPEGScaler`)
- `f64` / `double` in extern declares and calls
- SSA temp prefix `%.` to avoid clashes with user names like `v11`

### Runtime (`runtime/`)

- `ranger_buffer.c` - byte/int buffer helpers, and `ranger_buffer_fill`
- `ranger_rt.c` - `ranger_substring`, `ranger_str2double`, `ranger_str2int`, string helpers

### Inline IR runtime (`compiler/ng_LowIRRuntime.rgr`)

- `RtArray_set`, `RtPtrArray_new` / `get` / `len` / `push` / `set` emitted into `.ll`

## Known remaining issues (native build)

1. **No automated LLVM test.** `npm run test:llvm` does not cover `jpeg_scaler`
   end to end; the comparison above was run by hand.
2. **Memory is not reclaimed during the run.** The LLVM target's refcounting
   frees very little, so anything long-running grows. 34 MB for one 300x300
   image is fine; a batch loop over thousands has not been tried.

## How to build

```bash
./scripts/compile-jpeg-scaler-llvm.sh
```

Output: `tmp/jpeg-native/jpeg_scaler`.

## The other targets

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

See [JPEG_SCALER_BENCH.md](./JPEG_SCALER_BENCH.md) for timings and
[JPEG_PLAN.md](./JPEG_PLAN.md) for decoder/encoder feature status.
