#!/usr/bin/env bash
# Build Vela and run its tests.
#
#   bash gallery/vela/tests/run.sh            build, unit tests, goldens, parity
#   UPDATE_GOLDEN=1 bash …/run.sh             rewrite the golden files
#
# The parity step needs the reference implementation (`npm install --no-save
# vega vega-lite`). Without it that step reports that nothing was compared and
# the run still succeeds — the unit tests and goldens stand on their own.
set -e
cd "$(dirname "$0")/../../.."
ROOT="$(pwd)"
VELA=gallery/vela
BIN=$VELA/bin
export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr

say() { printf '\n\033[1m== %s\033[0m\n' "$1"; }

# The compiler exits 0 even when compilation fails, so the log is checked.
compile() {
  local src="$1" out="$2"
  local log
  log=$(node bin/output.js -es6 "$src" -d="$BIN" -o="$out" -nodecli 2>&1)
  if echo "$log" | grep -q "Compilation FAILED"; then
    echo "$log" | grep -A3 "\[FAIL\]" | head -40
    echo "FAILED to compile $src" >&2
    exit 1
  fi
}

mkdir -p "$BIN"

say "compile"
compile $VELA/tests/json_test.rgr json_test.js
compile $VELA/tests/expr_test.rgr expr_test.js
compile $VELA/tests/scale_test.rgr scale_test.js
compile $VELA/tests/flow_test.rgr flow_test.js
compile $VELA/tests/regex_test.rgr regex_test.js
compile $VELA/tools/vela_scene.rgr vela_scene.js
compile $VELA/tools/vela_commands.rgr vela_commands.js
compile $VELA/tools/vela_compile.rgr vela_compile.js
compile $VELA/tools/vela_svg.rgr vela_svg.js
echo "ok"

status=0

say "unit tests"
for t in json_test expr_test scale_test flow_test regex_test; do
  out=$(node "$BIN/$t.js")
  echo "$out" | tail -1
  if echo "$out" | grep -q "FAIL"; then status=1; fi
done

say "golden scenes and commands"
for spec in $VELA/tests/specs/*.vg.json; do   # showcase/ is a subdirectory and is skipped
  name=$(basename "$spec" .vg.json)
  scene="$VELA/tests/golden/$name.scene.json"
  cmds="$VELA/tests/golden/$name.commands.txt"
  node "$BIN/vela_scene.js" "$spec" > "$BIN/$name.scene.json"
  node "$BIN/vela_commands.js" "$spec" > "$BIN/$name.commands.txt"
  for pair in "$scene:$BIN/$name.scene.json" "$cmds:$BIN/$name.commands.txt"; do
    want="${pair%%:*}"; got="${pair##*:}"
    if [ -n "$UPDATE_GOLDEN" ]; then
      cp "$got" "$want"
    elif [ ! -f "$want" ]; then
      echo "  MISSING golden $want (run with UPDATE_GOLDEN=1)"; status=1
    elif ! diff -q "$want" "$got" > /dev/null; then
      echo "  DIFF $want"; diff "$want" "$got" | head -10; status=1
    fi
  done
done
if [ -n "$UPDATE_GOLDEN" ]; then
  echo "goldens rewritten"
else
  echo "$(ls $VELA/tests/specs/*.vg.json | wc -l | tr -d ' ') specs checked against goldens"
fi

# The dataflow, against every chart rather than against the one its unit test
# builds, and down BOTH of its paths: change `width` to the value it already
# has, which dirties every scale and re-encodes every mark, and then change a
# signal nothing reads, which dirties nothing and keeps every mark from the last
# encode. Both have to answer the golden. A recomputation that is not repeatable
# — anything accumulated and not cleared — shows up in the first; a reused mark
# that the layout failed to re-place shows up in the second.
say "the same scene, recomputed incrementally"
reflowed=0
for spec in $VELA/tests/specs/*.vg.json; do
  name=$(basename "$spec" .vg.json)
  node "$BIN/vela_scene.js" "$spec" --reflow > "$BIN/$name.reflow.json"
  if diff -q "$VELA/tests/golden/$name.scene.json" "$BIN/$name.reflow.json" > /dev/null; then
    reflowed=$((reflowed + 1))
  else
    echo "  DIFF $name"; diff "$VELA/tests/golden/$name.scene.json" "$BIN/$name.reflow.json" | head -8; status=1
  fi
done
echo "$reflowed specs reflow to the same scene"

say "parity against the reference implementation"
node $VELA/tools/reference/parity.mjs || status=1

# The scene says `shape: diamond`; it takes a renderer to say what a diamond
# looks like. This runs both renderers and compares the ink.
say "the drawing, against the reference renderer"
node $VELA/tools/reference/render.mjs || status=1

say "the Vega-Lite compiler, drawn against the official one"
node $VELA/tools/reference/compiler.mjs || status=1

say "a time axis, in eight time zones"
node $VELA/tools/reference/zones.mjs || status=1

exit $status
