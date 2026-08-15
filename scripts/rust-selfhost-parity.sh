#!/usr/bin/env bash
# The full self-host check for Rust: build the compiler as a Rust binary, have
# THAT binary compile the compiler's own sources, and compare the result with
# what the JavaScript build produces from the same input. They must match byte
# for byte -- the two renderings of the same compiler have to agree on every
# character they emit.
#
# Usage: bash scripts/rust-selfhost-parity.sh
set -u
cd "$(dirname "$0")/.."
mkdir -p tmp/selfhost-rust

echo "[1/4] generating the Rust rendering"
RANGER_LIB=./compiler/Lang.rgr node bin/output.js -l=rust ./compiler/ng_Compiler.rgr \
  -d=./tmp/selfhost-rust -o=ranger_compiler.rs -nodecli > tmp/selfhost-rust/gen.log 2>&1
if [ ! -f tmp/selfhost-rust/ranger_compiler.rs ]; then
  echo "GENERATION FAILED"; tail -30 tmp/selfhost-rust/gen.log; exit 1
fi

echo "[2/4] building it"
rustc -O --edition 2021 tmp/selfhost-rust/ranger_compiler.rs \
  -o tmp/selfhost-rust/ranger_rust > tmp/selfhost-rust/rustc.log 2>&1
if [ ! -x tmp/selfhost-rust/ranger_rust ]; then
  echo "BUILD FAILED"
  grep -E "^error" tmp/selfhost-rust/rustc.log | grep -v "^error: aborting due to" | head -20
  exit 1
fi
cp ./compiler/Lang.rgr ./tmp/selfhost-rust/Lang.rgr
cp ./lib/stdops.rgr ./tmp/selfhost-rust/stdops.rgr
mkdir -p ./tmp/selfhost-rust/lib && cp ./lib/*.rgr ./tmp/selfhost-rust/lib/

echo "[3/4] the Rust binary compiles the compiler"
mkdir -p tmp/rust-selfcompile
RANGER_LIB="./compiler/Lang.rgr:./lib/stdops.rgr" ./tmp/selfhost-rust/ranger_rust \
  -l=es6 ./compiler/ng_Compiler.rgr -d=./tmp/rust-selfcompile -o=out.js -nodecli \
  > tmp/rust-selfcompile/run.log 2>&1
if [ ! -f tmp/rust-selfcompile/out.js ]; then
  echo "SELF-COMPILE FAILED"; tail -20 tmp/rust-selfcompile/run.log; exit 1
fi

echo "[4/4] comparing with the JavaScript build"
mkdir -p tmp/js-selfcompile
RANGER_LIB=./compiler/Lang.rgr node bin/output.js -l=es6 ./compiler/ng_Compiler.rgr \
  -d=./tmp/js-selfcompile -o=out.js -nodecli > /dev/null 2>&1
if cmp -s tmp/js-selfcompile/out.js tmp/rust-selfcompile/out.js; then
  echo "OK: byte-identical"
  exit 0
fi
echo "MISMATCH: the two builds disagree"
diff tmp/js-selfcompile/out.js tmp/rust-selfcompile/out.js | head -20
exit 1
