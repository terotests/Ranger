#!/usr/bin/env bash
# ==============================================================================
# run_trace_cli_smoke.sh — build evg-trace for every target and check they agree
# ==============================================================================
#
# The point of compiling one tracer to four runtimes is that it is one tracer.
# This asserts that: the same input through the Node, Python, C++ and Rust
# builds has to come out byte for byte the same SVG. A target-specific
# difference in integer division, string formatting or float printing shows up
# here as a differing file rather than as a picture somebody notices months
# later.
#
#   npm run evg:trace:cli:smoke
#
# Python, C++ and Rust are skipped (not failed) when their toolchain is absent.
set -u
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
OUT=".evg_trace_out/cli"
mkdir -p "$OUT"
SAMPLE="gallery/evg/web/tracer/sample.png"
ARGS=(--preset broken)
status=0
export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr

compile () { # lang outfile
  node bin/output.js "-l=$1" gallery/evg/tools/evg_trace_cli.rgr \
    -d=gallery/evg/bin "-o=$2" -nodecli >"$OUT/compile_$1.log" 2>&1
  if grep -q '\[FAIL\]' "$OUT/compile_$1.log"; then
    echo "  COMPILE FAIL ($1)"; grep -m 10 '\[FAIL\]' "$OUT/compile_$1.log"; return 1
  fi
}

echo "### evg-trace (node)"
if ! compile es6 evg_trace_cli.js; then exit 1; fi
node gallery/evg/bin/evg_trace_cli.js "$SAMPLE" "$OUT/node.svg" "${ARGS[@]}" | sed 's/^/  /'
[ -s "$OUT/node.svg" ] || { echo "  no output"; exit 1; }

echo
echo "### evg-trace (python)"
if command -v python3 >/dev/null 2>&1; then
  if compile python evg_trace_cli.py; then
    python3 gallery/evg/bin/evg_trace_cli.py "$SAMPLE" "$OUT/python.svg" "${ARGS[@]}" | sed 's/^/  /'
    if cmp -s "$OUT/node.svg" "$OUT/python.svg"; then
      echo "  identical to the node build"
    else
      echo "  DIFFERS from the node build"; status=1
    fi
  else status=1; fi
else
  echo "  skip (no python3)"
fi

echo
echo "### evg-trace (c++)"
if command -v g++ >/dev/null 2>&1; then
  if compile cpp evg_trace_cli.cpp; then
    if g++ -O2 -std=c++17 -o gallery/evg/bin/evg_trace_cli \
         gallery/evg/bin/evg_trace_cli.cpp 2>"$OUT/gxx.log"; then
      ./gallery/evg/bin/evg_trace_cli "$SAMPLE" "$OUT/cpp.svg" "${ARGS[@]}" | sed 's/^/  /'
      if cmp -s "$OUT/node.svg" "$OUT/cpp.svg"; then
        echo "  identical to the node build"
      else
        echo "  DIFFERS from the node build"; status=1
      fi
    else
      echo "  g++ FAILED"; tail -20 "$OUT/gxx.log"; status=1
    fi
  else status=1; fi
else
  echo "  skip (no g++)"
fi

echo
echo "### evg-trace (rust)"
if command -v rustc >/dev/null 2>&1; then
  if compile rust evg_trace_cli.rs; then
    if rustc --edition 2021 -O -o gallery/evg/bin/evg_trace_cli_rust \
         gallery/evg/bin/evg_trace_cli.rs 2>"$OUT/rustc.log"; then
      ./gallery/evg/bin/evg_trace_cli_rust "$SAMPLE" "$OUT/rust.svg" "${ARGS[@]}" | sed 's/^/  /'
      if cmp -s "$OUT/node.svg" "$OUT/rust.svg"; then
        echo "  identical to the node build"
      else
        echo "  DIFFERS from the node build"; status=1
      fi
    else
      echo "  rustc FAILED"; grep -m 20 -E "^error" "$OUT/rustc.log"; status=1
    fi
  else status=1; fi
else
  echo "  skip (no rustc)"
fi

echo
echo "### argument order"
# The two paths have to be accepted wherever they fall among the options.
# `in.png --colorCount 4 out.svg` reading --colorCount as the output path is
# what this is here to stop coming back.
for form in "SRC --colorCount 4 DST" "SRC DST --colorCount 4" "--colorCount 4 SRC DST" "SRC DST --colorCount=4"; do
  args=${form//SRC/$SAMPLE}
  out="$OUT/order.svg"
  args=${args//DST/$out}
  rm -f "$out"
  if ! node gallery/evg/bin/evg_trace_cli.js $args >/dev/null 2>&1 || [ ! -s "$out" ]; then
    echo "  FAILED: $form"; status=1; continue
  fi
  if [ -n "${orderRef:-}" ]; then
    cmp -s "$orderRef" "$out" || { echo "  DIFFERS: $form"; status=1; }
  else
    orderRef="$OUT/order_ref.svg"; cp "$out" "$orderRef"
  fi
done
[ "$status" -eq 0 ] && echo "  every order gives the same file"

echo "### bad input"
if node gallery/evg/bin/evg_trace_cli.js "$OUT/no-such-file.png" "$OUT/x.svg" 2>&1 | grep -q "no such file"; then
  echo "  a missing input is one line, not a stack trace"
else
  echo "  a missing input did not report cleanly"; status=1
fi

echo
if [ "$status" -eq 0 ]; then
  echo "evg-trace CLI ALL GREEN"
else
  echo "evg-trace CLI FAILED"
fi
exit "$status"
