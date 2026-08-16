#!/usr/bin/env bash
# Is the chart the same chart when nothing underneath it is JavaScript?
#
#   bash gallery/vela/tests/run_cpp.sh        compile to C++, build, compare
#
# Vela's whole claim is that a Vega runtime written in Ranger is a runtime for
# every Ranger target — that the JavaScript here is the host of the toolchain
# and not part of the answer. The parity harness cannot say that, because both
# sides of its comparison run in node. This can: it compiles the three CLIs to
# C++, builds them with the system compiler, and requires the binaries to
# produce the committed goldens BYTE FOR BYTE.
#
# It found a real defect the first time it was run. `formatNumber` scaled a
# fraction by 10^maxDecimals into an `int`, and twelve significant digits of a
# two-digit number needs 10^10 — which fits a JavaScript number and overflows a
# 32-bit int. A box plot's hinge printed as "54.0705032704" instead of "54.5",
# in C++ only. Every coordinate in the scene was already right; only the label
# was wrong, which is exactly the kind of thing a JS-only suite cannot see.
#
# g++ is optional. Without it the step says so and exits 0, the way the parity
# harness does when the reference is not installed — a silent skip reads as a
# pass.
set -e
cd "$(dirname "$0")/../../.."
VELA=gallery/vela
OUT=tmp/vela-cpp
export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr

say() { printf '\n\033[1m== %s\033[0m\n' "$1"; }

CXX="${CXX:-g++}"
if ! command -v "$CXX" >/dev/null 2>&1; then
  echo "$CXX is not installed — the C++ target was not checked."
  exit 0
fi

mkdir -p "$OUT"
status=0

say "compile to C++"
for tool in vela_scene vela_commands vela_evg; do
  log=$(node --max-old-space-size=8192 bin/output.js -l=cpp "$VELA/tools/$tool.rgr" \
    -d="$OUT" -o="$tool.cpp" -nodecli 2>&1)
  if ! echo "$log" | grep -q "\[OK\]"; then
    echo "$log" | grep -A3 "\[FAIL\]" | head -40
    echo "FAILED to compile $tool.rgr to C++" >&2
    exit 1
  fi
  printf '  %-14s %s lines\n' "$tool.cpp" "$(wc -l < "$OUT/$tool.cpp" | tr -d ' ')"
done

say "build with $CXX"
for tool in vela_scene vela_commands vela_evg; do
  if "$CXX" -std=c++17 -O1 -o "$OUT/$tool" "$OUT/$tool.cpp" 2> "$OUT/$tool.log"; then
    echo "  ok   $tool"
  else
    echo "  FAIL $tool"; head -20 "$OUT/$tool.log"; status=1
  fi
done
[ $status -eq 0 ] || exit $status

say "the same goldens, from the native binaries"
specs=0
for spec in $VELA/tests/specs/*.vg.json; do
  name=$(basename "$spec" .vg.json)
  specs=$((specs + 1))
  "$OUT/vela_scene" "$spec" > "$OUT/$name.scene.json"
  "$OUT/vela_commands" "$spec" > "$OUT/$name.commands.txt"
  for pair in "$VELA/tests/golden/$name.scene.json:$OUT/$name.scene.json" \
              "$VELA/tests/golden/$name.commands.txt:$OUT/$name.commands.txt"; do
    want="${pair%%:*}"; got="${pair##*:}"
    if ! diff -q "$want" "$got" > /dev/null; then
      echo "  DIFF $want"; diff "$want" "$got" | head -10; status=1
    fi
  done
done
[ $status -eq 0 ] && echo "  $specs scenes and $specs command lists, identical to the JavaScript build"

# The subdirectories have no goldens of their own — they are the showcase's own
# copies — so those are compared against what the JS build says right now.
say "js and c++ agree on every spec, goldens or not"
both=0
for spec in $(find $VELA/tests/specs -name '*.vg.json' | sort); do
  key=$(echo "$spec" | sed "s|$VELA/tests/specs/||; s|/|_|g; s|\.vg\.json||")
  node "$VELA/bin/vela_scene.js" "$spec" > "$OUT/$key.js.json" 2>&1
  "$OUT/vela_scene" "$spec" > "$OUT/$key.cpp.json" 2>&1
  if diff -q "$OUT/$key.js.json" "$OUT/$key.cpp.json" > /dev/null; then
    both=$((both + 1))
  else
    echo "  DIFF $spec"; diff "$OUT/$key.js.json" "$OUT/$key.cpp.json" | head -10; status=1
  fi
done
[ $status -eq 0 ] && echo "  $both specs, byte for byte"

# A time zone is a rule with arithmetic in it — negative offsets, floor
# division, a summer window that wraps the new year — which is exactly the kind
# of thing that differs between a language with one number type and a language
# with several.
say "and in a time zone that is not utc"
zones=0
for zone in Europe/Helsinki America/New_York Australia/Sydney Asia/Kolkata; do
  for spec in $(grep -l '"time"' $VELA/tests/specs/*.vg.json $VELA/tests/specs/*/*.vg.json 2>/dev/null); do
    key=$(echo "$spec" | sed "s|$VELA/tests/specs/||; s|/|_|g; s|\.vg\.json||")
    tag=$(echo "$zone" | tr '/' '_')
    node "$VELA/bin/vela_scene.js" "$spec" "--zone=$zone" > "$OUT/$key.$tag.js.json" 2>&1
    "$OUT/vela_scene" "$spec" "--zone=$zone" > "$OUT/$key.$tag.cpp.json" 2>&1
    if diff -q "$OUT/$key.$tag.js.json" "$OUT/$key.$tag.cpp.json" > /dev/null; then
      zones=$((zones + 1))
    else
      echo "  DIFF $spec in $zone"; diff "$OUT/$key.$tag.js.json" "$OUT/$key.$tag.cpp.json" | head -6; status=1
    fi
  done
done
[ $status -eq 0 ] && echo "  $zones dated scenes in four zones, identical"

# And the end of the pipeline: a whole showcase page, drawn by the native
# binary, must be the file that is committed.
say "a showcase page, written by the native binary"
S=$VELA/tests/specs/showcase
"$OUT/vela_evg" "$OUT/charts.tsx" --title=Kaaviot \
  "$S/bar.vg.json"         "Pylväskaavio" \
  "$S/bar_stacked.vg.json" "Pinottu pylväskaavio" \
  "$S/line.vg.json"        "Viivakaavio" \
  "$S/scatter.vg.json"     "Hajontakaavio" \
  "$S/histogram.vg.json"   "Histogrammi" \
  "$S/pie.vg.json"         "Ympyräkaavio" > /dev/null
if diff -q gallery/evg/showcase/pages/charts.tsx "$OUT/charts.tsx" > /dev/null; then
  echo "  ok   pages/charts.tsx, identical to the committed page"
else
  echo "  DIFF pages/charts.tsx"; diff gallery/evg/showcase/pages/charts.tsx "$OUT/charts.tsx" | head -10; status=1
fi

exit $status
