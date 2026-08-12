#!/usr/bin/env bash
# Build the interpreter PLUS the EVG host adapter into one CommonJS module, so
# a test can drive source -> EvElement -> EVGElement in one process. The
# interpreter alone is built by build-engine-module.sh, and that separation is
# what keeps the standalone claim tested. Output is a build artifact.
set -e
cd "$(dirname "$0")/.."
OUT_DIR=gallery/game_engine/v2/interp/bin
mkdir -p "$OUT_DIR"
# The compiler exits 0 even when compilation fails, so `set -e` does not catch
# it and the previous run's engine_module.cjs survives -- every test and
# benchmark downstream then measures the OLD engine and reports success.
RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr node --stack-size=8000 bin/output.js -es6 -nodemodule \
  ./gallery/game_engine/v2/interp/tools/engine_evg_module.rgr \
  -d="$OUT_DIR" -o=engine_evg_module.cjs 2>&1 | tee /tmp/rgr_evg_mod_$$.log
if grep -q "Compilation FAILED" /tmp/rgr_evg_mod_$$.log; then
  rm -f /tmp/rgr_evg_mod_$$.log
  echo "Ranger -> es6 FAILED; $OUT_DIR/engine_evg_module.cjs is stale" >&2
  exit 1
fi
rm -f /tmp/rgr_evg_mod_$$.log
