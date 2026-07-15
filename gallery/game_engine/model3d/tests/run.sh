#!/usr/bin/env bash
# Compile the model3d test suites to ES6 and run them under Node.
# Grep-able: prints "ALL PASS" per suite on success. Run from the repo root.
set -e

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"
# The compiler resolves -d relative to the cwd, so use a repo-relative out dir.
OUT=".model3d_test_out"
mkdir -p "$OUT"
trap 'rm -rf "$OUT"' EXIT
RGRC="node bin/output.js -es6"

run_suite() {
  local name="$1"
  local src="gallery/game_engine/model3d/tests/${name}.rgr"
  echo "### ${name}"
  $RGRC "$src" -d="$OUT" -o="${name}.js" >/dev/null 2>&1
  node "$OUT/${name}.js" | grep -E "PASS |FAIL |ALL PASS|SOME FAILED|passed="
  echo
}

run_suite Model3dTest
run_suite TextureDecodeTest
run_suite MeshBridgeTest

echo "done."
