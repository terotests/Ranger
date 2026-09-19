#!/usr/bin/env bash
# Compile every study in src/ to Rust, rustc it, and run the binary.
# The compiler exits 0 even on [FAIL]; this script treats that as failure.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HERE="$ROOT/gallery/rustfriendly"
OUT="$HERE/generated"
BIN_DIR="${TMPDIR:-/tmp}/rustfriendly-bin"
mkdir -p "$OUT" "$BIN_DIR"

export RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr"
COMPILER="$ROOT/bin/output.js"

if [[ ! -f "$COMPILER" ]]; then
  echo "missing $COMPILER — run npm run compile first" >&2
  exit 1
fi

fail=0
for src in "$HERE"/src/*.rgr; do
  name="$(basename "$src" .rgr)"
  log="$OUT/${name}.compile.log"
  echo "==> $name"
  set +e
  node "$COMPILER" -l=rust -strict-ownership "$src" -d="$OUT" -o="${name}.rs" -nodecli >"$log" 2>&1
  set -e
  if grep -E '\[FAIL\]|Compilation FAILED' "$log" >/dev/null; then
    echo "    Ranger compile FAILED — see $log"
    fail=1
    continue
  fi
  if [[ ! -f "$OUT/${name}.rs" ]]; then
    echo "    no $OUT/${name}.rs written"
    fail=1
    continue
  fi
  if ! rustc --edition 2021 -O "$OUT/${name}.rs" -o "$BIN_DIR/$name" 2>"$OUT/${name}.rustc.log"; then
    echo "    rustc FAILED — see $OUT/${name}.rustc.log"
    fail=1
    continue
  fi
  echo "    rustc ok"
  if ! "$BIN_DIR/$name" | tee "$OUT/${name}.out"; then
    echo "    run FAILED"
    fail=1
  fi
done

if [[ "$fail" -ne 0 ]]; then
  echo "one or more studies failed"
  exit 1
fi
echo "all studies compiled and ran"
