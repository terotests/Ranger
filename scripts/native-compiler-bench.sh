#!/usr/bin/env bash
# Time the native (C++) compiler against the Node build on the same source.
#
# Both compile the same file to the same target with the same library, from the
# same working directory; the numbers are wall clock over N runs, best and mean.
# The default source is the compiler itself — the largest Ranger program in the
# repository, and the only one big enough for the difference to be about the
# compiler rather than about process startup.
#
# Usage:
#   scripts/native-compiler-bench.sh [options]
#
# Options:
#   --bin PATH       native binary (default: tmp/native/*/rangerc, else
#                    tmp/selfhost/rangerc)
#   --source FILE    Ranger source to compile (default: compiler/ng_Compiler.rgr)
#   --target FLAG    compiler target flag (default: -es6)
#   --runs N         runs per compiler (default: 3)
#   --also-go        include tmp/selfhost-go/rangerc if it exists
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BIN=""
SOURCE="./compiler/ng_Compiler.rgr"
TARGET="-es6"
RUNS=3
ALSO_GO=0

while [ $# -gt 0 ]; do
  case "$1" in
    --bin) BIN="$2"; shift ;;
    --source) SOURCE="$2"; shift ;;
    --target) TARGET="$2"; shift ;;
    --runs) RUNS="$2"; shift ;;
    --also-go) ALSO_GO=1 ;;
    --help|-h) sed -n '2,22p' "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

if [ -z "$BIN" ]; then
  for cand in tmp/native/*/rangerc tmp/selfhost/rangerc; do
    if [ -x "$cand" ]; then BIN="$cand"; break; fi
  done
fi
if [ -z "$BIN" ] || [ ! -x "$BIN" ]; then
  echo "no native binary found — run 'npm run native:build' first" >&2
  exit 1
fi

export RANGER_LIB="./compiler/Lang.rgr:./lib/stdops.rgr"
BENCH_DIR="$ROOT/tmp/bench"
mkdir -p "$BENCH_DIR"

# Milliseconds since the epoch. BSD date has no %N, so fall back to python3.
if [ "$(date +%N 2>/dev/null)" = "%N" ] || [ -z "$(date +%N 2>/dev/null)" ]; then
  now_ms() { python3 -c 'import time; print(int(time.time()*1000))'; }
else
  now_ms() { echo $(( $(date +%s%N) / 1000000 )); }
fi

# Prints "<best_ms> <mean_ms>" for RUNS invocations of "$@".
time_runs() {
  local best="" total=0 i start end ms
  for i in $(seq 1 "$RUNS"); do
    start=$(now_ms)
    "$@" >/dev/null 2>&1
    end=$(now_ms)
    ms=$(( end - start ))
    total=$(( total + ms ))
    if [ -z "$best" ] || [ "$ms" -lt "$best" ]; then best=$ms; fi
  done
  echo "$best $(( total / RUNS ))"
}

echo "source:  $SOURCE"
echo "target:  $TARGET"
echo "runs:    $RUNS"
echo "native:  $BIN"
echo

printf '%-24s %10s %10s %8s\n' "compiler" "best (ms)" "mean (ms)" "vs node"

read -r NODE_BEST NODE_MEAN <<<"$(time_runs node --max-old-space-size=8192 bin/output.js \
  "$TARGET" "$SOURCE" -nodecli -d="$BENCH_DIR/node" -o=output.js)"
printf '%-24s %10s %10s %8s\n' "node bin/output.js" "$NODE_BEST" "$NODE_MEAN" "1.00x"

read -r CPP_BEST CPP_MEAN <<<"$(time_runs "$BIN" \
  "$TARGET" "$SOURCE" -nodecli -d="$BENCH_DIR/cpp" -o=output.js)"
printf '%-24s %10s %10s %7sx\n' "native (C++)" "$CPP_BEST" "$CPP_MEAN" \
  "$(awk -v a="$NODE_MEAN" -v b="$CPP_MEAN" 'BEGIN{printf "%.2f", a/b}')"

if [ "$ALSO_GO" = "1" ] && [ -x tmp/selfhost-go/rangerc ]; then
  read -r GO_BEST GO_MEAN <<<"$(time_runs tmp/selfhost-go/rangerc \
    "$TARGET" "$SOURCE" -nodecli -d="$BENCH_DIR/go" -o=output.js)"
  printf '%-24s %10s %10s %7sx\n' "native (Go)" "$GO_BEST" "$GO_MEAN" \
    "$(awk -v a="$NODE_MEAN" -v b="$GO_MEAN" 'BEGIN{printf "%.2f", a/b}')"
fi

echo
if [ -f "$BENCH_DIR/node/output.js" ] && [ -f "$BENCH_DIR/cpp/output.js" ]; then
  if diff -q <(tr -d '\r' <"$BENCH_DIR/node/output.js") \
             <(tr -d '\r' <"$BENCH_DIR/cpp/output.js") >/dev/null; then
    echo "output: native and Node wrote identical files"
  else
    echo "output: native and Node DIFFER — $(diff <(tr -d '\r' <"$BENCH_DIR/node/output.js") \
      <(tr -d '\r' <"$BENCH_DIR/cpp/output.js") | grep -c '^[<>]') line(s)"
  fi
fi
