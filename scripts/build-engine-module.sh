#!/usr/bin/env bash
# Build the interpreter realm (ComponentEngine) into a CommonJS module so the
# runtime-conformance suite can execute guest scripts through the real
# evaluator. Output is a build artifact and is not committed.
set -e
cd "$(dirname "$0")/.."
OUT_DIR=gallery/game_engine/v2/interp/bin
mkdir -p "$OUT_DIR"
RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr node bin/output.js -es6 -nodemodule \
  ./gallery/game_engine/v2/interp/tools/engine_module.rgr \
  -d="$OUT_DIR" -o=engine_module.cjs
