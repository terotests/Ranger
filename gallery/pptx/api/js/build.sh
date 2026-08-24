#!/usr/bin/env bash
# Build the JavaScript package for the .pptx API.
#
#   npm run pptx:api:build
#
# Three bundles, and the split is the point. `pptx_api.cjs` is the headless
# document API — a ZIP reader, an XML parser, the model and the writer.
# `pptx_api_render.cjs` adds the canvas, the font manager, the image decoders
# and the PDF writer, and is several times the size. `pptx_api_chart.cjs` adds
# Vela: a Vega and Vega-Lite compiler, its expression language and its scales.
# In Ranger an import is not lazy, so the only way for a caller who rewrites
# template text to not also carry a rasterizer or a chart compiler is for the
# three never to be compiled together.
set -e
cd "$(dirname "$0")/../../../.."
OUT=gallery/pptx/api/js/dist
export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
mkdir -p "$OUT"

build() {
  local src="$1" out="$2"
  rm -f "$OUT/$out"
  log=$(node bin/output.js -es6 -nodemodule "$src" -d="$OUT" -o="$out" 2>&1)
  # The compiler can print [FAIL] and still exit 0, so the log is what decides.
  if echo "$log" | grep -q "\[FAIL\]"; then
    echo "$log" | grep -A3 "\[FAIL\]" | head -40
    echo "FAILED to compile $src" >&2
    exit 1
  fi
  if [ ! -f "$OUT/$out" ]; then
    echo "the compiler reported no failure but wrote no $OUT/$out" >&2
    exit 1
  fi
  printf '  %-24s %s\n' "$out" "$(wc -c < "$OUT/$out" | tr -d ' ') bytes"
}

build gallery/pptx/api/PptxApi.rgr pptx_api.cjs
build gallery/pptx/api/PptxRenderApi.rgr pptx_api_render.cjs
build gallery/pptx/api/PptxChartApi.rgr pptx_api_chart.cjs

# Loadable? A bundle that throws while being required is a bundle that fails
# for the first person to install it rather than in this build.
node -e "
  const a = require('./$OUT/pptx_api.cjs');
  if (typeof a.PptxApi !== 'function') throw new Error('pptx_api.cjs defines no PptxApi');
  const b = require('./$OUT/pptx_api_render.cjs');
  if (typeof b.PptxRenderer !== 'function') throw new Error('pptx_api_render.cjs defines no PptxRenderer');
  const c = require('./$OUT/pptx_api_chart.cjs');
  if (typeof c.PptxVega !== 'function') throw new Error('pptx_api_chart.cjs defines no PptxVega');
  console.log('  all three bundles load');
"
