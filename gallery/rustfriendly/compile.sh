#!/usr/bin/env bash
# Compile every study in src/ to Rust, rustc it, and run the binary; then check
# that every file in attempts/ is still REFUSED, with the error it declares.
# The compiler exits 0 even on [FAIL]; this script treats that as failure.
#
# An attempts/ file names its expectation on a line of its own:
#   ; EXPECT-ERROR: <substring the compiler must print>
# A form the target cannot express has to be a compile error naming the
# limitation — never a binary that panics, and never Rust that does not exist.
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

# --- the attempts: each must FAIL, with the error it declares -----------------
for src in "$HERE"/attempts/*.rgr; do
  name="$(basename "$src" .rgr)"
  want="$(sed -n 's/^; *EXPECT-ERROR: *//p' "$src" | head -1)"
  echo "==> attempt $name"
  if [[ -z "$want" ]]; then
    echo "    no '; EXPECT-ERROR:' line in $src"
    fail=1
    continue
  fi
  log="$OUT/attempt_${name}.compile.log"
  set +e
  node "$COMPILER" -l=rust -strict-ownership "$src" -d="$BIN_DIR" -o="attempt_${name}.rs" -nodecli >"$log" 2>&1
  set -e
  if ! grep -E '\[FAIL\]|Compilation FAILED' "$log" >/dev/null; then
    echo "    compiled, but this form is not supposed to be expressible — see $log"
    fail=1
    continue
  fi
  if ! grep -F "$want" "$log" >/dev/null; then
    echo "    failed, but not with the declared error: $want"
    echo "    see $log"
    fail=1
    continue
  fi
  echo "    refused: $want"
done

if [[ "$fail" -ne 0 ]]; then
  echo "one or more studies failed"
  exit 1
fi
echo "all studies compiled and ran; all attempts refused"
