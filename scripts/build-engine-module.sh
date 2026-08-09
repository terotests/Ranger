#!/usr/bin/env bash
# Build the interpreter realm (ComponentEngine) into a CommonJS module so the
# runtime-conformance suite can execute guest scripts through the real
# evaluator. Output is a build artifact and is not committed.
set -e
cd "$(dirname "$0")/.."
OUT_DIR=gallery/game_engine/v2/interp/bin
mkdir -p "$OUT_DIR"
# The compiler exits 0 even when compilation fails, so `set -e` does not catch
# it and the previous run's engine_module.cjs survives -- every test and
# benchmark downstream then measures the OLD engine and reports success.
RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr node bin/output.js -es6 -nodemodule \
  ./gallery/game_engine/v2/interp/tools/engine_module.rgr \
  -d="$OUT_DIR" -o=engine_module.cjs 2>&1 | tee /tmp/rgr_mod_$$.log
if grep -q "Compilation FAILED" /tmp/rgr_mod_$$.log; then
  rm -f /tmp/rgr_mod_$$.log
  echo "Ranger -> es6 FAILED; $OUT_DIR/engine_module.cjs is stale" >&2
  exit 1
fi
rm -f /tmp/rgr_mod_$$.log
