#!/usr/bin/env bash
# Compile the watch benchmark to JavaScript and to Kotlin.
#
#   bash gallery/watch_evg/bench/scripts/build-ranger.sh
#
# Two targets, one source, because the question is not "how fast is EVG in
# JavaScript" — it is how fast EVG is on the language a Wear OS app is written
# in. The JS build drives `watch-bench.mjs`; the Kotlin build is what
# `run-jvm.sh` compiles and times, and it is the same generated code
# `gallery/ui/android` and `gallery/pptx/android` put in their APKs.
#
# Neither output is checked in: both are compiler artefacts of WatchBench.rgr
# and the gallery/evg tree, and a stale copy is how a benchmark starts
# measuring last month's layout engine.
set -e
cd "$(dirname "$0")/../../../.."

BENCH=gallery/watch_evg/bench
PKG="fi.ranger.rgr"

if [ ! -f bin/output.js ]; then
  echo "bin/output.js is missing — build the compiler first (npm run compile)" >&2
  exit 1
fi

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
mkdir -p "$BENCH/bin" "$BENCH/generated"

echo "  JavaScript…"
node --max-old-space-size=8192 bin/output.js -es6 -nodemodule \
  "$BENCH/WatchBench.rgr" -d="./$BENCH/bin" -o=WatchBench.cjs > /dev/null

echo "  Kotlin…"
rm -f "$BENCH/generated/watch_bench.kt"
log=$(node --max-old-space-size=8192 bin/output.js -l=kotlin \
  "$BENCH/WatchBench.rgr" -nodecli -d="./$BENCH/generated" -o=watch_bench.kt 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A4 "\[FAIL\]" | head -40
  exit 1
fi

# Ranger writes Kotlin into the default package and Kotlin cannot import from
# it. The painter in gallery/evg/android names `fi.ranger.rgr.EVGDisplayList`,
# so every port puts its generated file in that package; this benchmark is a
# port like any other.
if ! head -1 "$BENCH/generated/watch_bench.kt" | grep -q "^package "; then
  printf 'package %s\n\n' "$PKG" | cat - "$BENCH/generated/watch_bench.kt" > "$BENCH/generated/.tmp.kt"
  mv "$BENCH/generated/.tmp.kt" "$BENCH/generated/watch_bench.kt"
fi

echo "  $BENCH/bin/WatchBench.cjs      ($(wc -l < "$BENCH/bin/WatchBench.cjs") lines)"
echo "  $BENCH/generated/watch_bench.kt  ($(wc -l < "$BENCH/generated/watch_bench.kt") lines, package $PKG)"
