#!/usr/bin/env bash
# Regenerate the EVG showcase's two generated chart pages.
#
#   npm run vela:showcase
#
# Runs each specification through the Vela runtime and writes
# gallery/evg/showcase/pages/charts.tsx and pages/plots.tsx — path data and
# labels, ready for the showcase build to render to PDF, PNG and HTML like any
# other page.
#
#   charts  the six chart types most people mean by "a chart"
#   plots   the rest, and the features only some charts have: a size legend
#           whose rows are all different heights, a stroke legend, a log axis,
#           two marks in one plot, and a text mark
#   more    the chart types the runtime learned most recently, which are also
#           the ones that exercise the most of it: a colour ramp with a
#           gradient key, a series that is a faceted group, a stack centred on
#           a common line, a calendar on an axis
#
# The specs under tests/specs/showcase and tests/specs/plots are the same charts
# as the parity specs at a size that fits a printed page; regenerate them with
# `node gallery/vela/tools/reference/compile_specs.mjs` (needs vega-lite).
set -e
cd "$(dirname "$0")/../../.."
ROOT="$(pwd)"
BIN=gallery/vela/bin
SPECS=gallery/vela/tests/specs/showcase
PLOTS=gallery/vela/tests/specs/plots
MORE=gallery/vela/tests/specs/more
PAGE=gallery/evg/showcase/pages/charts.tsx
PLOTS_PAGE=gallery/evg/showcase/pages/plots.tsx
MORE_PAGE=gallery/evg/showcase/pages/more.tsx

mkdir -p "$BIN"
log=$(RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr node bin/output.js -es6 \
  ./gallery/vela/tools/vela_evg.rgr -d="$BIN" -o=vela_evg.js -nodecli 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/vela/tools/vela_evg.rgr" >&2
  exit 1
fi

node "$BIN/vela_evg.js" "$PAGE" --title=Kaaviot \
  "$SPECS/bar.vg.json"         "Pylväskaavio" \
  "$SPECS/bar_stacked.vg.json" "Pinottu pylväskaavio" \
  "$SPECS/line.vg.json"        "Viivakaavio" \
  "$SPECS/scatter.vg.json"     "Hajontakaavio" \
  "$SPECS/histogram.vg.json"   "Histogrammi" \
  "$SPECS/pie.vg.json"         "Ympyräkaavio"

node "$BIN/vela_evg.js" "$PLOTS_PAGE" --title=Kaaviotyypit --compact \
  "$PLOTS/bar_grouped.vg.json"     "Ryhmitelty pylväskaavio" \
  "$PLOTS/area.vg.json"            "Aluekaavio" \
  "$PLOTS/bubble.vg.json"          "Kuplakaavio · kokoselite" \
  "$PLOTS/scatter_colored.vg.json" "Hajonta · väriselite" \
  "$PLOTS/scatter_log.vg.json"     "Logaritminen asteikko" \
  "$PLOTS/layered.vg.json"         "Kerrostetut merkit" \
  "$PLOTS/text_labels.vg.json"     "Tekstimerkit" \
  "$PLOTS/tick.vg.json"            "Viivamerkit"

node "$BIN/vela_evg.js" "$MORE_PAGE" --title=Lisää --compact \
  "$MORE/heatmap.vg.json"        "Lämpökartta · liukuväri" \
  "$MORE/boxplot.vg.json"        "Laatikkojana" \
  "$MORE/line_coloured.vg.json"  "Monisarjainen viiva" \
  "$MORE/streamgraph.vg.json"    "Virtakaavio" \
  "$MORE/line_temporal.vg.json"  "Aika-akseli" \
  "$MORE/donut.vg.json"          "Donitsi" \
  "$MORE/bar_normalized.vg.json" "Normalisoitu pino" \
  "$MORE/bar_labelled.vg.json"   "Arvot pylväiden päällä"

echo "render them with:  npm run showcase"
