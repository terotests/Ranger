#!/usr/bin/env bash
# Regenerate the EVG showcase's charts page.
#
#   npm run vela:showcase
#
# Runs each showcase specification through the Vela runtime and writes
# gallery/evg/showcase/pages/charts.tsx — path data and labels, ready for the
# showcase build to render to PDF, PNG and HTML like any other page.
#
# The specs under tests/specs/showcase are the same charts as the parity specs
# at a size that fits a printed page; regenerate them with
# `node gallery/vela/tools/reference/compile_specs.mjs` (needs vega-lite).
set -e
cd "$(dirname "$0")/../../.."
ROOT="$(pwd)"
BIN=gallery/vela/bin
SPECS=gallery/vela/tests/specs/showcase
PAGE=gallery/evg/showcase/pages/charts.tsx

mkdir -p "$BIN"
log=$(RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr node bin/output.js -es6 \
  ./gallery/vela/tools/vela_evg.rgr -d="$BIN" -o=vela_evg.js -nodecli 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/vela/tools/vela_evg.rgr" >&2
  exit 1
fi

node "$BIN/vela_evg.js" "$PAGE" \
  "$SPECS/bar.vg.json"         "Pylväskaavio" \
  "$SPECS/bar_stacked.vg.json" "Pinottu pylväskaavio" \
  "$SPECS/line.vg.json"        "Viivakaavio" \
  "$SPECS/scatter.vg.json"     "Hajontakaavio" \
  "$SPECS/histogram.vg.json"   "Histogrammi" \
  "$SPECS/pie.vg.json"         "Ympyräkaavio"

echo "render it with:  npm run showcase"
