#!/usr/bin/env bash
# Rebuild the Rust rendering of the compiler as a DEBUG binary and run it over a
# small program. Debug keeps the panic locations, which is what the RefCell
# re-entrancy work needs; scripts/rust-selfhost-check.sh is the -O path.
#
# Usage: bash scripts/rust-selfhost-run.sh [file.rgr]
set -u
cd "$(dirname "$0")/.."
SRC="${1:-tests/rust_run/hello.rgr}"
mkdir -p tmp/selfhost-rust tmp/selfhost-rust/out

RANGER_LIB=./compiler/Lang.rgr node bin/output.js -l=rust ./compiler/ng_Compiler.rgr \
  -d=./tmp/selfhost-rust -o=ranger_compiler.rs -nodecli > tmp/selfhost-rust/gen.log 2>&1
if [ ! -f tmp/selfhost-rust/ranger_compiler.rs ]; then
  echo "GENERATION FAILED"; tail -30 tmp/selfhost-rust/gen.log; exit 1
fi

rustc --edition 2021 -C debuginfo=2 tmp/selfhost-rust/ranger_compiler.rs \
  -o tmp/selfhost-rust/ranger_dbg > tmp/selfhost-rust/rustc.log 2>&1
if [ ! -x tmp/selfhost-rust/ranger_dbg ]; then
  echo "BUILD FAILED"
  grep -E "^error" tmp/selfhost-rust/rustc.log | grep -v "^error: aborting due to" | head -20
  exit 1
fi

RUST_BACKTRACE=1 RANGER_LIB="./compiler/Lang.rgr:./lib/stdops.rgr" \
  ./tmp/selfhost-rust/ranger_dbg -l=es6 "$SRC" \
    -d=./tmp/selfhost-rust/out -o=out.js -nodecli 2>&1 | tail -40
