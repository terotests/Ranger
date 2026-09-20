#!/usr/bin/env bash
# Build the Rust rendering of the compiler and make it compile the compiler.
#
#   bash scripts/rust-selfhost-run.sh
#
# This is the bar the C++ and Go self-hosts are already held to, and the one
# `rust-selfhost-check.sh` does not reach: that script type-checks and stops.
# For years the Rust rendering type-checked with zero errors and aborted on
# the first file it was given -- a `RefCell` double borrow, which rustc cannot
# see because it is a run-time check. docs/plans/PLAN_RUST_REENTRANCY.md.
#
# The test is not "it ran": it is that the output is BYTE-IDENTICAL to what
# the node-hosted compiler writes for the same input. Two compilers that agree
# to the byte are the same compiler.
set -uo pipefail
cd "$(dirname "$0")/.."
OUT=tmp/selfhost-rust
mkdir -p "$OUT" tmp/rust-selfhost-out

echo "==> generating"
bash scripts/rust-selfhost-check.sh > "$OUT/errcount.txt" 2>&1
errs="$(tail -1 "$OUT/errcount.txt" | tr -d '[:space:]')"
if [ "$errs" != "0" ]; then
  echo "FAIL: $errs rustc errors"; grep -E "^error" "$OUT/rustc.log" | head -20; exit 1
fi

echo "==> building (rustc -O, a few minutes)"
if ! rustc -O --edition 2021 "$OUT/ranger_compiler.rs" -o "$OUT/ranger_rust" 2> "$OUT/build.log"; then
  echo "FAIL: build"; grep -E "^error" "$OUT/build.log" | head -20; exit 1
fi
cp ./compiler/Lang.rgr "$OUT/Lang.rgr"
cp ./lib/stdops.rgr "$OUT/stdops.rgr"
mkdir -p "$OUT/lib" && cp ./lib/*.rgr "$OUT/lib/" 2>/dev/null || true

echo "==> the Rust compiler compiles the compiler"
if ! "./$OUT/ranger_rust" -l=es6 ./compiler/Compiler.rgr -nodecli \
     -d=./tmp/rust-selfhost-out -o=output.js > "$OUT/run.log" 2>&1; then
  echo "FAIL: run"; tail -20 "$OUT/run.log"; exit 1
fi
if grep -q "panicked" "$OUT/run.log"; then
  echo "FAIL: panicked"; grep -m1 -A3 "panicked" "$OUT/run.log"; exit 1
fi

echo "==> and answers what the node host answers"
if ! diff -q ./tmp/rust-selfhost-out/output.js ./bin/output.js > /dev/null; then
  echo "FAIL: output differs from bin/output.js"
  diff ./tmp/rust-selfhost-out/output.js ./bin/output.js | head -20
  exit 1
fi
echo "OK: byte-identical to the node-hosted compiler's own output"
