#!/usr/bin/env bash
# Build the PPTX editor as WebAssembly, and assemble the page around it.
#
#   bash gallery/pptx/web/wasm/build.sh [--out DIR]
#
# THE ROUTE, AND WHY IT IS THIS ONE. Ranger has three paths that could reach
# WASM and only one of them carries a program this size today:
#
#   * Ranger -> LLVM -> WASM is freestanding: primitives and exported
#     functions, no strings, no maps, no objects. Not this program.
#   * Ranger -> Rust -> WASM is a build of its own now, beside this one, at
#     gallery/pptx/web/wasm-rust/. Same `pptx_web.rgr`, `rustc` instead of
#     em++, and a module with zero imports so there is no glue file. It runs
#     the same page and passes the same tests; see the README there.
#   * Ranger -> C++ -> Emscripten -> WASM compiles clean and has its bindings.
#     This.
#
# WHAT IS GENERATED AND WHAT IS WRITTEN. `pptx_web.cpp` comes out of the same
# `pptx_web.rgr` the JavaScript page is built from — one source, two backends.
# `bind.cpp` beside this script is the only hand-written C++, and it only says
# how values cross into the page. `wasm-host.mjs` presents that as the same
# object the JavaScript build exports, so `standalone.mjs` runs unchanged over
# either.
#
# WHY THE PAGE IS THE SAME PAGE. The point of this build is a comparison, and
# a comparison against a different page measures the page. Everything under
# gallery/pptx/web/standalone is copied in as-is; only the engine differs.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
WASM="$ROOT/gallery/pptx/web/wasm"
STAGE="$WASM/dist"
OUT=""
while [ $# -gt 0 ]; do
  case "$1" in
    --out) OUT="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 1 ;;
  esac
done

if ! command -v em++ >/dev/null 2>&1; then
  echo "error: em++ not on PATH — source the emsdk environment first:" >&2
  echo "         git clone https://github.com/emscripten-core/emsdk" >&2
  echo "         cd emsdk && ./emsdk install latest && ./emsdk activate latest" >&2
  echo "         source ./emsdk_env.sh" >&2
  exit 1
fi

cd "$ROOT"
mkdir -p "$STAGE" "$WASM/build"

# ---- 1. Ranger -> C++ ---------------------------------------------------
# The compiler prints `[FAIL]` and exits 0, so its log is read rather than its
# exit status, and a missing output file is itself an error. The previous
# build's .cpp is removed first: the checks below ask whether a file is there,
# and a stale one answers yes.
echo "==> 1/4  Ranger -> C++"
rm -f "$WASM/build/pptx_web.cpp"
log=$(RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr \
      node bin/output.js -l=cpp ./gallery/pptx/web/pptx_web.rgr \
      -d="gallery/pptx/web/wasm/build" -o=pptx_web.cpp -nodecli 2>&1) || true
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/pptx/web/pptx_web.rgr to C++" >&2
  exit 1
fi
if [ ! -s "$WASM/build/pptx_web.cpp" ]; then
  echo "the compiler reported no failure but wrote no pptx_web.cpp" >&2
  exit 1
fi
echo "    $(wc -l < "$WASM/build/pptx_web.cpp" | tr -d ' ') lines of C++"

# ---- 2. C++ -> WASM -----------------------------------------------------
# -O3 rather than -Os: this build exists to be measured against the JavaScript
# one on speed, and -Os costs about a fifth of the frame to save a tenth of the
# download. The size is reported at the end either way.
#
# -fwasm-exceptions is not optional either, and this is the flag that cost the
# most to find. Emscripten compiles with exceptions OFF by default, and the
# Ranger C++ runtime's `to_int(string)` is built on `std::stoll` inside a
# `try { … } catch (...) {}` — the catch is how a string that is not a number
# answers nothing instead of throwing, which is what it does on every other
# target. With exceptions off that catch is inert, so `25-table.pptx` opened
# fine natively and aborted in WebAssembly with an empty `Aborted()`. Native
# WASM exception handling costs less than the JavaScript-based emulation and
# every browser this page targets has it.
#
# EXPORTED_RUNTIME_METHODS is not optional here. Emscripten stopped putting
# HEAP32/HEAPU8 on the module unless they are asked for, and the frame crosses
# as typed-array VIEWS onto exactly those — without this flag the page loads,
# gets a WebGL context, and then dies on `Cannot read properties of undefined
# (reading 'buffer')` the first time it asks for a slide.
echo "==> 2/4  C++ -> WebAssembly"
cp "$WASM/bind.cpp" "$WASM/build/bind.cpp"
rm -f "$STAGE/pptx_wasm.mjs" "$STAGE/pptx_wasm.wasm"
( cd "$WASM/build" && em++ -std=c++17 -O3 bind.cpp -o "$STAGE/pptx_wasm.mjs" \
    --bind \
    -s MODULARIZE=1 -s EXPORT_ES6=1 -s EXPORT_NAME=createPptx \
    -s ALLOW_MEMORY_GROWTH=1 -s INITIAL_MEMORY=64MB \
    -s ENVIRONMENT=web,worker,node -s ASSERTIONS=0 \
    -s EXPORTED_RUNTIME_METHODS=HEAPU8,HEAP32 \
    -fwasm-exceptions )
test -s "$STAGE/pptx_wasm.wasm" || { echo "em++ wrote no .wasm" >&2; exit 1; }

# ---- 3. The page --------------------------------------------------------
# Byte-for-byte the standalone page, minus its JavaScript engine. Its build
# script has already staged fonts, shaders, presets and the sample deck there;
# if it has not been run, run it — the two pages must not drift.
echo "==> 3/4  the page"
SRC="$ROOT/gallery/pptx/web/standalone/dist"
if [ ! -s "$SRC/index.html" ]; then
  bash "$ROOT/gallery/pptx/web/standalone/build.sh" >/dev/null
fi
# `sample.odp` is in this list for the same reason `deck.pptx` is: the page is
# the SAME standalone.mjs on both URLs, so a file missing here is a button
# that 404s on one engine and works on the other — a difference between the
# two builds that has nothing to do with either engine.
for item in fonts gl host presets.txt deck.pptx sample.odp standalone.mjs; do
  rm -rf "${STAGE:?}/$item"
  cp -r "$SRC/$item" "$STAGE/$item"
done
cp "$WASM/wasm-host.mjs" "$STAGE/wasm-host.mjs"
cp "$WASM/index.html" "$STAGE/index.html"

# The same cache-busting the JavaScript page uses, for the same reason: nothing
# here carries a cache header, so every file the page loads gets `?v=<hash of
# the build>` and the stamp is printed in the status bar. A page that looks
# unfixed is usually a page the browser kept from last time.
STAMP=$(node -e "
  const fs = require('fs'), crypto = require('crypto');
  const h = crypto.createHash('sha1');
  for (const f of ['$STAGE/pptx_wasm.wasm', '$STAGE/pptx_wasm.mjs', '$STAGE/wasm-host.mjs', '$STAGE/standalone.mjs', '$STAGE/host/pptx-host.mjs', '$STAGE/gl/evg-webgl.js']) h.update(fs.readFileSync(f));
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
w_raw=$(( $(wc -c < "$STAGE/pptx_wasm.wasm") + $(wc -c < "$STAGE/pptx_wasm.mjs") ))
w_gz=$(( $(gz "$STAGE/pptx_wasm.wasm") + $(gz "$STAGE/pptx_wasm.mjs") ))
printf "    wasm engine   %-10s raw   %-10s gzipped\n" "$(kb $w_raw)" "$(kb $w_gz)"
if [ -s "$SRC/pptx_web.js" ]; then
  j_raw=$(wc -c < "$SRC/pptx_web.js")
  j_gz=$(gz "$SRC/pptx_web.js")
  printf "    js engine     %-10s raw   %-10s gzipped\n" "$(kb $j_raw)" "$(kb $j_gz)"
  printf "    ratio         %s.%sx gzipped\n" "$(( w_gz / j_gz ))" "$(( (w_gz * 10 / j_gz) % 10 ))"
fi

echo
echo "  $STAGE"
echo "open it with:  python3 -m http.server -d $STAGE 8004"

if [ -n "$OUT" ]; then
  mkdir -p "$OUT"
  cp -r "$STAGE/." "$OUT/"
  echo "copied to $OUT"
fi
