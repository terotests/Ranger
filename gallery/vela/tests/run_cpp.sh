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
for tool in vela_scene vela_commands vela_evg vela_compile vela_svg vela_chart; do
  log=$(node --max-old-space-size=8192 bin/output.js -l=cpp "$VELA/tools/$tool.rgr" \
    -d="$OUT" -o="$tool.cpp" -nodecli 2>&1)
  if ! echo "$log" | grep -q "\[OK\]"; then
    echo "$log" | grep -A3 "\[FAIL\]" | head -40
    echo "FAILED to compile $tool.rgr to C++" >&2
    exit 1
  fi
  printf '  %-14s %s lines\n' "$tool.cpp" "$(wc -l < "$OUT/$tool.cpp" | tr -d ' ')"
done
# The chart API's own suite, which is a test rather than a tool: it builds
# specifications by calling the API, compiles them and runs them. Natively,
# that is the API, the Vega-Lite compiler and the runtime with no JavaScript
# anywhere underneath any of them.
log=$(node --max-old-space-size=8192 bin/output.js -l=cpp "$VELA/tests/chart_test.rgr" \
  -d="$OUT" -o="chart_test.cpp" -nodecli 2>&1)
if ! echo "$log" | grep -q "\[OK\]"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile chart_test.rgr to C++" >&2
  exit 1
fi
printf '  %-14s %s lines\n' "chart_test.cpp" "$(wc -l < "$OUT/chart_test.cpp" | tr -d ' ')"

say "build with $CXX"
for tool in vela_scene vela_commands vela_evg vela_compile vela_svg vela_chart chart_test; do
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

# The drawing itself, from the native binary. This is the one that reaches
# furthest down: an SVG document is path data and text placement, so a
# difference in how a target does floating point or counts a string shows up
# here as a different picture rather than as a different number in a scene.
say "the same SVG, from the native binary"
drawn=0
for spec in $(find $VELA/tests/specs -name '*.vg.json' | sort); do
  key=$(echo "$spec" | sed "s|$VELA/tests/specs/||; s|/|_|g; s|\.vg\.json||")
  node "$VELA/bin/vela_svg.js" "$spec" > "$OUT/$key.js.svg" 2>&1
  "$OUT/vela_svg" "$spec" > "$OUT/$key.cpp.svg" 2>&1
  if diff -q "$OUT/$key.js.svg" "$OUT/$key.cpp.svg" > /dev/null; then
    drawn=$((drawn + 1))
  else
    echo "  DIFF $spec"; diff "$OUT/$key.js.svg" "$OUT/$key.cpp.svg" | head -10; status=1
  fi
done
[ $status -eq 0 ] && echo "  $drawn drawings, byte for byte"

# The compiler, from the native binary: a Vega-Lite source in, and the same
# Vega specification out as the JavaScript build wrote.
say "and the compiler, natively"
compiled=0
for src in $VELA/tests/specs/*.vl.json; do
  name=$(basename "$src" .vl.json)
  node "$VELA/bin/vela_compile.js" "$src" > "$OUT/$name.vl.js.json" 2>&1
  "$OUT/vela_compile" "$src" > "$OUT/$name.vl.cpp.json" 2>&1
  if diff -q "$OUT/$name.vl.js.json" "$OUT/$name.vl.cpp.json" > /dev/null; then
    compiled=$((compiled + 1))
  else
    echo "  DIFF $name"; diff "$OUT/$name.vl.js.json" "$OUT/$name.vl.cpp.json" | head -6; status=1
  fi
done
[ $status -eq 0 ] && echo "  $compiled sources compiled identically"

# The chart API, natively: the same checks against the same hand-written
# specifications, and the same charts drawn to the same SVG. An API that builds
# a specification is portable in a way a JavaScript charting library is not,
# and this is where that claim is either true or not.
say "the chart api, from the native binary"
node "$VELA/bin/chart_test.js" > "$OUT/chart_test.js.txt" 2>&1
"$OUT/chart_test" > "$OUT/chart_test.cpp.txt" 2>&1
if diff -q "$OUT/chart_test.js.txt" "$OUT/chart_test.cpp.txt" > /dev/null; then
  echo "  ok   $(tail -1 "$OUT/chart_test.cpp.txt")"
else
  echo "  DIFF chart_test"; diff "$OUT/chart_test.js.txt" "$OUT/chart_test.cpp.txt" | head -10; status=1
fi
if ! grep -q "chart api tests passed" "$OUT/chart_test.cpp.txt"; then
  tail -5 "$OUT/chart_test.cpp.txt"; status=1
fi

say "and the charts it draws, byte for byte"
mkdir -p "$OUT/chart-api-js" "$OUT/chart-api-cpp"
node "$VELA/bin/vela_chart.js" "$OUT/chart-api-js/" > /dev/null
"$OUT/vela_chart" "$OUT/chart-api-cpp/" > /dev/null
apiCharts=0
for f in "$OUT/chart-api-js"/*; do
  name=$(basename "$f")
  if diff -q "$f" "$OUT/chart-api-cpp/$name" > /dev/null; then
    apiCharts=$((apiCharts + 1))
  else
    echo "  DIFF $name"; diff "$f" "$OUT/chart-api-cpp/$name" | head -6; status=1
  fi
done
[ $status -eq 0 ] && echo "  $apiCharts files, identical to the JavaScript build"

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
