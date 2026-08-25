#!/usr/bin/env bash
# Build the PPTX editor as WebAssembly through Rust, and assemble the page
# around it.
#
#   bash gallery/pptx/web/wasm-rust/build.sh [--out DIR]
#
# THE ROUTE. This is the third way the same `pptx_web.rgr` reaches a browser:
#
#   * Ranger -> JavaScript                      gallery/pptx/web/standalone
#   * Ranger -> C++ -> Emscripten -> WASM       gallery/pptx/web/wasm
#   * Ranger -> Rust -> WASM                    here
#
# WHAT IT NEEDS. `rustup target add wasm32-unknown-unknown`, and nothing else.
# No SDK to source, no glue file to ship: rustc emits a module with no imports
# at all, so `host.mjs` instantiates it directly.
#
# WHAT IS GENERATED AND WHAT IS WRITTEN. `pptx_web.rs` comes out of the same
# `pptx_web.rgr` the other two pages are built from. `bind.rs` beside this
# script is the only hand-written Rust, and it only says how values cross into
# the page; it is APPENDED to the generated file rather than including it,
# because a Rust crate has one root and the generated file is it.
# `host.mjs` presents the module as the same object the JavaScript build
# exports, so `standalone.mjs` runs unchanged over either.
#
# WHY THE PAGE IS THE SAME PAGE. The point of this build is a comparison, and
# a comparison against a different page measures the page. Everything under
# gallery/pptx/web/standalone is copied in as-is; only the engine differs.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
HERE="$ROOT/gallery/pptx/web/wasm-rust"
STAGE="$HERE/dist"
OUT=""
while [ $# -gt 0 ]; do
  case "$1" in
    --out) OUT="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 1 ;;
  esac
done

if ! command -v rustc >/dev/null 2>&1; then
  echo "error: rustc not on PATH — install Rust from https://rustup.rs" >&2
  exit 1
fi
if ! rustc --print target-libdir --target wasm32-unknown-unknown >/dev/null 2>&1; then
  echo "error: the wasm32 target is not installed — run:" >&2
  echo "         rustup target add wasm32-unknown-unknown" >&2
  exit 1
fi

cd "$ROOT"
mkdir -p "$STAGE" "$HERE/build"

# ---- 1. Ranger -> Rust --------------------------------------------------
# The compiler prints `[FAIL]` and exits 0, so its log is read rather than its
# exit status, and a missing output file is itself an error. The previous
# build's .rs is removed first: the checks below ask whether a file is there,
# and a stale one answers yes.
echo "==> 1/4  Ranger -> Rust"
rm -f "$HERE/build/pptx_web.rs"
log=$(RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr \
      node bin/output.js -l=rust ./gallery/pptx/web/pptx_web.rgr \
      -d="gallery/pptx/web/wasm-rust/build" -o=pptx_web.rs -nodecli 2>&1) || true
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/pptx/web/pptx_web.rgr to Rust" >&2
  exit 1
fi
if [ ! -s "$HERE/build/pptx_web.rs" ]; then
  echo "the compiler reported no failure but wrote no pptx_web.rs" >&2
  exit 1
fi
echo "    $(wc -l < "$HERE/build/pptx_web.rs" | tr -d ' ') lines of Rust"

# ---- 2. Rust -> WASM ----------------------------------------------------
# -O rather than -Os for the same reason the C++ build takes -O3: this build
# exists to be measured against the JavaScript one on speed. The size is
# reported at the end either way.
#
# `panic=abort` because there is nothing to unwind INTO — a panic in a
# WebAssembly module reaches the page as a trap whatever this says, and the
# landing pads cost size for a recovery that cannot happen.
#
# The bindings are appended, not `include!`d: `pptx_web.rs` opens with the
# crate-level `#![allow(...)]` the generated code needs, and an inner
# attribute is only legal at the start of the file it is in.
echo "==> 2/4  Rust -> WebAssembly"
cat "$HERE/build/pptx_web.rs" "$HERE/bind.rs" > "$HERE/build/pptx_wasm.rs"
rm -f "$STAGE/pptx_wasm.wasm"
rustc --edition 2021 -O -C panic=abort \
  --target wasm32-unknown-unknown --crate-type=cdylib \
  "$HERE/build/pptx_wasm.rs" -o "$STAGE/pptx_wasm.wasm"
test -s "$STAGE/pptx_wasm.wasm" || { echo "rustc wrote no .wasm" >&2; exit 1; }

# ---- 3. The page --------------------------------------------------------
# Byte-for-byte the standalone page, minus its JavaScript engine. Its build
# script has already staged fonts, shaders, presets and the sample deck there;
# if it has not been run, run it — the pages must not drift.
echo "==> 3/4  the page"
SRC="$ROOT/gallery/pptx/web/standalone/dist"
if [ ! -s "$SRC/index.html" ]; then
  bash "$ROOT/gallery/pptx/web/standalone/build.sh" >/dev/null
fi
for item in fonts gl host presets.txt deck.pptx sample.odp standalone.mjs; do
  rm -rf "${STAGE:?}/$item"
  cp -r "$SRC/$item" "$STAGE/$item"
done
cp "$HERE/host.mjs" "$STAGE/host.mjs"
cp "$HERE/index.html" "$STAGE/index.html"

# The same cache-busting the other two pages use, for the same reason: nothing
# here carries a cache header, so every file the page loads gets `?v=<hash of
# the build>` and the stamp is printed in the status bar. A page that looks
# unfixed is usually a page the browser kept from last time.
STAMP=$(node -e "
  const fs = require('fs'), crypto = require('crypto');
  const h = crypto.createHash('sha1');
  for (const f of ['$STAGE/pptx_wasm.wasm', '$STAGE/host.mjs', '$STAGE/standalone.mjs', '$STAGE/host/pptx-host.mjs', '$STAGE/gl/evg-webgl.js']) h.update(fs.readFileSync(f));
  process.stdout.write(h.digest('hex').slice(0, 10));
")
node -e "
  const fs = require('fs');
  const stamp = '$STAMP';
  fs.writeFileSync('$STAGE/index.html',
    fs.readFileSync('$STAGE/index.html', 'utf8').split('__BUILD__').join(stamp));
  fs.writeFileSync('$STAGE/standalone.mjs',
    fs.readFileSync('$STAGE/standalone.mjs', 'utf8')
      .replace('./gl/evg-webgl.js', './gl/evg-webgl.js?v=' + stamp));
" || exit 1
if grep -q "__BUILD__" "$STAGE/index.html"; then
  echo "the build stamp was not written into $STAGE/index.html" >&2
  exit 1
fi
echo "    build $STAMP"

# ---- 4. What it costs ---------------------------------------------------
echo "==> 4/4  size"
gz() { gzip -9 -c "$1" | wc -c | tr -d ' '; }
kb() { echo "$(( ($1 + 512) / 1024 )) KB"; }
w_raw=$(( $(wc -c < "$STAGE/pptx_wasm.wasm") + $(wc -c < "$STAGE/host.mjs") ))
w_gz=$(( $(gz "$STAGE/pptx_wasm.wasm") + $(gz "$STAGE/host.mjs") ))
printf "    wasm engine   %-10s raw   %-10s gzipped\n" "$(kb $w_raw)" "$(kb $w_gz)"
if [ -s "$SRC/pptx_web.js" ]; then
  j_raw=$(wc -c < "$SRC/pptx_web.js")
  j_gz=$(gz "$SRC/pptx_web.js")
  printf "    js engine     %-10s raw   %-10s gzipped\n" "$(kb $j_raw)" "$(kb $j_gz)"
  printf "    ratio         %s.%sx gzipped\n" "$(( w_gz / j_gz ))" "$(( (w_gz * 10 / j_gz) % 10 ))"
fi

echo
echo "  $STAGE"
echo "open it with:  python3 -m http.server -d $STAGE 8005"

if [ -n "$OUT" ]; then
  mkdir -p "$OUT"
  cp -r "$STAGE/." "$OUT/"
  echo "copied to $OUT"
fi
