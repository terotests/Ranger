#!/usr/bin/env bash
# Compile jpeg_scaler.rgr to C++ / Rust / Go / Node and time it against
# ImageMagick, GraphicsMagick, libvips, and ffmpeg (whichever are installed).
#
# Usage (from repo root):
#   ./gallery/pdf_writer/bench/jpeg_scaler_bench.sh
#   SKIP_BUILD=1 ./gallery/pdf_writer/bench/jpeg_scaler_bench.sh   # reuse binaries
#
# Needs: node, g++, rustc, go (for Ranger targets);
#        hyperfine (preferred) or date +%s%N;
#        convert / gm / vips / ffmpeg for native comparison.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"

SRC="gallery/pdf_writer/src/tools/jpeg_scaler.rgr"
EXAMPLE="gallery/pdf_writer/assets/images/Example.jpg"
GPS="gallery/pdf_writer/assets/images/GPS_test.jpg"
OUT_DIR="tmp/jpeg-bench"
BIN="$OUT_DIR/bin"
IMG="$OUT_DIR/images"
RUN="$OUT_DIR/out"
RESULTS="$OUT_DIR/results"
export RANGER_LIB="${RANGER_LIB:-./compiler/Lang.rgr}"

mkdir -p "$BIN/cpp" "$BIN/rust" "$BIN/go" "$BIN/es6" "$IMG" "$RUN" "$RESULTS"
cp -f gallery/pdf_writer/bin/variant.hpp "$BIN/cpp/variant.hpp"

have() { command -v "$1" >/dev/null 2>&1; }

compile_ranger() {
  local lang="$1" dest="$2" out="$3"
  node bin/output.js -l="$lang" "$SRC" -d="$dest" -o="$out" -nodecli
}

if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  echo "==> Ranger compile (es6, cpp, rust, go)"
  compile_ranger es6  "$BIN/es6"  jpeg_scaler.js
  compile_ranger cpp  "$BIN/cpp"  jpeg_scaler.cpp
  compile_ranger rust "$BIN/rust" jpeg_scaler.rs
  compile_ranger go   "$BIN/go"   jpeg_scaler.go

  echo "==> Native build (-O3 / rustc -O / go build)"
  g++ -std=c++17 -O3 -pthread "$BIN/cpp/jpeg_scaler.cpp" -o "$BIN/cpp/jpeg_scaler"
  rustc --edition 2021 -O "$BIN/rust/jpeg_scaler.rs" -o "$BIN/rust/jpeg_scaler"
  ( cd "$BIN/go" && go build -o jpeg_scaler jpeg_scaler.go )
fi

CPP="$BIN/cpp/jpeg_scaler"
RUST="$BIN/rust/jpeg_scaler"
GO="$BIN/go/jpeg_scaler"
NODE_CMD=(node "$BIN/es6/jpeg_scaler.js")

if have convert; then
  convert -size 1920x1080 plasma:fractal -quality 90 "$IMG/plasma_1080.jpg"
  convert -size 4000x3000 plasma:fractal -quality 90 "$IMG/plasma_4k.jpg"
fi

echo "==> Machine"
echo "date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "cpu: $(grep -m1 'model name' /proc/cpuinfo | cut -d: -f2 | xargs)"
echo "nproc: $(nproc)"
echo "node: $(node --version)"
echo "g++: $(g++ --version | head -1)"
echo "rustc: $(rustc --version)"
have go && echo "go: $(go version)"
have convert && convert -version | head -1
have gm && gm version | head -1
have vips && echo "vips: $(vips --version)"
have ffmpeg && ffmpeg -version | head -1
echo

# Collect commands that exist. Each entry is name<TAB>command string.
cmds_for() {
  local width="$1" input="$2"
  local stem
  stem="$(basename "$input" .jpg)_w${width}"
  printf 'ranger-cpp\t%s -width %s %s %s/cpp_%s.jpg\n' "$CPP" "$width" "$input" "$RUN" "$stem"
  printf 'ranger-rust\t%s -width %s %s %s/rust_%s.jpg\n' "$RUST" "$width" "$input" "$RUN" "$stem"
  printf 'ranger-go\t%s -width %s %s %s/go_%s.jpg\n' "$GO" "$width" "$input" "$RUN" "$stem"
  printf 'ranger-node\t%s %s -width %s %s %s/node_%s.jpg\n' "${NODE_CMD[0]}" "${NODE_CMD[1]}" "$width" "$input" "$RUN" "$stem"
  if have convert; then
    printf 'imagemagick\tconvert %s -resize %sx -quality 85 %s/im_%s.jpg\n' "$input" "$width" "$RUN" "$stem"
  fi
  if have gm; then
    printf 'graphicsmagick\tgm convert %s -resize %sx -quality 85 %s/gm_%s.jpg\n' "$input" "$width" "$RUN" "$stem"
  fi
  if have vips; then
    printf 'libvips\tvips thumbnail %s %s/vips_%s.jpg %s\n' "$input" "$RUN" "$stem" "$width"
  fi
  if have ffmpeg; then
    printf 'ffmpeg\tffmpeg -y -hide_banner -loglevel error -i %s -vf scale=%s:-1 -q:v 5 %s/ff_%s.jpg\n' "$input" "$width" "$RUN" "$stem"
  fi
}

run_hyperfine() {
  local name="$1" runs="$2" warmup="$3" width="$4" input="$5"
  local args=()
  while IFS=$'\t' read -r label cmd; do
    [[ -n "$label" ]] || continue
    args+=(--command-name "$label" "$cmd")
  done < <(cmds_for "$width" "$input")
  echo "========== $name =========="
  hyperfine --warmup "$warmup" --runs "$runs" \
    --export-markdown "$RESULTS/${name}.md" \
    --export-json "$RESULTS/${name}.json" \
    "${args[@]}"
  echo
}

if have hyperfine; then
  run_hyperfine example_600 20 3 600 "$EXAMPLE"
  run_hyperfine example_2400 8 1 2400 "$EXAMPLE"
  run_hyperfine gps_400 15 2 400 "$GPS"
  if [[ -f "$IMG/plasma_1080.jpg" ]]; then
    run_hyperfine plasma_1080_800 12 2 800 "$IMG/plasma_1080.jpg"
  fi
  if [[ -f "$IMG/plasma_4k.jpg" ]]; then
    run_hyperfine plasma_4k_800 8 1 800 "$IMG/plasma_4k.jpg"
  fi
  echo "==> Markdown tables in $RESULTS/"
  for f in "$RESULTS"/*.md; do
    echo
    echo "----- $(basename "$f") -----"
    cat "$f"
  done
else
  echo "hyperfine not found; install it for the full suite (apt install hyperfine)."
  echo "Smoke timing Example.jpg -> width 600 (one run each):"
  for pair in "cpp:$CPP" "rust:$RUST" "go:$GO"; do
    name="${pair%%:*}"
    bin="${pair#*:}"
    t0=$(date +%s%N)
    "$bin" -width 600 "$EXAMPLE" "$RUN/smoke_${name}.jpg" >/dev/null
    t1=$(date +%s%N)
    awk -v n="$name" -v t0="$t0" -v t1="$t1" 'BEGIN{printf "%-8s %.1f ms\n", n, (t1-t0)/1e6}'
  done
fi
