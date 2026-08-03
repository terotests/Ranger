#!/usr/bin/env bash
# Rebuild the ts_parser CommonJS module used by benchmark/compliance/conformance tooling.
set -e
cd "$(dirname "$0")/.."
RANGER_LIB=./compiler/Lang.rgr node bin/output.js -es6 -nodemodule \
  ./gallery/ts_parser/ts_parser_main.rgr \
  -d=./gallery/ts_parser/benchmark -o=ts_parser_module.cjs
