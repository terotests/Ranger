#!/usr/bin/env bash
# Does the deck editor still compile as C++?
#
#   npm run pptx:cpp:check
#
# WHY THIS EXISTS. `pptx_web.rgr` is built two ways: to JavaScript for /pptx/
# and, through C++ and Emscripten, to WebAssembly for /pptx-wasm/. Only the
# JavaScript one is compiled by the test suites, and the C++ one was compiled
# nowhere until the Pages deploy — which runs AFTER a pull request is merged.
#
# So a change that JavaScript accepts and C++ does not passed every check,
# merged, and turned the site deploy red: a class with a FIELD and a static
# FUNCTION of the same name is two symbols in JavaScript (`this.outlineKind`
# and `PptxApp.outlineKind`) and one redefinition in C++. Six errors, none of
# them reachable before the merge, and the published site kept serving the
# build before it.
#
# This is that check, ~30 seconds of it: generate the C++ and ask a compiler
# whether it is C++. No Emscripten — the errors that class of mistake produces
# are the front end's, and any C++17 compiler reports them. The WASM build
# itself, the parity run against the JavaScript engine and the page around it
# stay in the deploy, where the toolchain is.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
BUILD="$ROOT/gallery/pptx/web/wasm/build"

cxx="${CXX:-}"
if [ -z "$cxx" ]; then
  for candidate in g++ clang++; do
    if command -v "$candidate" >/dev/null 2>&1; then
      cxx="$candidate"
      break
    fi
  done
fi
if [ -z "$cxx" ]; then
  echo "error: no C++ compiler found (tried \$CXX, g++, clang++)" >&2
  exit 1
fi

cd "$ROOT"
mkdir -p "$BUILD"

# The compiler prints `[FAIL]` and exits 0, so its log is read rather than its
# status, and the previous build's output is removed first — the check below
# asks whether the file is there, and a stale one answers yes.
echo "==> Ranger -> C++"
rm -f "$BUILD/pptx_web.cpp"
log=$(RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr \
      node bin/output.js -l=cpp ./gallery/pptx/web/pptx_web.rgr \
      -d="gallery/pptx/web/wasm/build" -o=pptx_web.cpp -nodecli 2>&1) || true
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/pptx/web/pptx_web.rgr to C++" >&2
  exit 1
fi
if [ ! -s "$BUILD/pptx_web.cpp" ]; then
  echo "the compiler reported no failure but wrote no pptx_web.cpp" >&2
  exit 1
fi
echo "    $(wc -l < "$BUILD/pptx_web.cpp" | tr -d ' ') lines of C++"

echo "==> is it C++? ($cxx -std=c++17 -fsyntax-only)"
( cd "$BUILD" && "$cxx" -std=c++17 -fsyntax-only pptx_web.cpp )
echo "    yes"
