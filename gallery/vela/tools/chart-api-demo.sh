#!/usr/bin/env bash
# Build the chart API demo and draw its six charts.
#
#   npm run vela:chart              → gallery/vela/bin/chart-api/*.svg + *.vl.json
#
# Every chart in `tools/vela_chart.rgr` is written by CALLING the API — there is
# no specification text in that file — and each one is written out twice: the
# Vega-Lite the API built, and the SVG the runtime drew from it.
set -e
cd "$(dirname "$0")/../../.."
VELA=gallery/vela
export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr

log=$(node bin/output.js -es6 "$VELA/tools/vela_chart.rgr" -d="$VELA/bin" -o=vela_chart.js -nodecli 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  exit 1
fi

mkdir -p "$VELA/bin/chart-api"
node "$VELA/bin/vela_chart.js" "$VELA/bin/chart-api/"
