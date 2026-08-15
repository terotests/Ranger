#!/usr/bin/env bash
# Generate the Rust rendering of the compiler's own sources and type-check it.
# Usage: bash scripts/rust-selfhost-check.sh
set -u
cd "$(dirname "$0")/.."
mkdir -p tmp/selfhost-rust
RANGER_LIB=./compiler/Lang.rgr node bin/output.js -l=rust ./compiler/ng_Compiler.rgr \
  -d=./tmp/selfhost-rust -o=ranger_compiler.rs -nodecli > tmp/selfhost-rust/gen.log 2>&1
if [ ! -f tmp/selfhost-rust/ranger_compiler.rs ]; then
  echo "GENERATION FAILED"; tail -30 tmp/selfhost-rust/gen.log; exit 1
fi
rustc --edition 2021 --emit=metadata --crate-type bin \
  -o /dev/null tmp/selfhost-rust/ranger_compiler.rs > tmp/selfhost-rust/rustc.log 2>&1
# the trailing "aborting due to N previous errors" line is a summary, not an error
grep -E "^error" tmp/selfhost-rust/rustc.log | grep -vc "^error: aborting due to"
