#!/usr/bin/env bash
# Build the Ranger engine hosts into gallery/ranger_engine/bin/.
#
#   rg_api.js    the engine as a Node module (tests and the benchmark use it)
#   rg_run.js    the command line: `node bin/rg_run.js program.rgr -report`
#   rg_dump.js   the development dumper for the analyzed tree
#   rg_vm.js     VM + JIT only, with no compiler linked in — the number that
#                answers "how small is the runtime half?"
#
# Run from the repository root.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

OUT="gallery/ranger_engine/bin"
mkdir -p "$OUT"
export RANGER_LIB="./compiler/Lang.rgr:./lib/stdops.rgr"
RGRC="node --max-old-space-size=8192 bin/output.js"

echo "building rg_api.js  (engine as a Node module)"
$RGRC -es6 -nodemodule gallery/ranger_engine/tools/rg_api.rgr -d="./$OUT" -o=rg_api.js > /dev/null

echo "building rg_run.js  (command line)"
$RGRC -es6 -nodecli gallery/ranger_engine/tools/rg_run.rgr -d="./$OUT" -o=rg_run.js > /dev/null

echo "building rg_dump.js (analyzed-tree dumper)"
$RGRC -es6 -nodecli gallery/ranger_engine/tools/rg_dump.rgr -d="./$OUT" -o=rg_dump.js > /dev/null

echo "building rg_vm.js   (VM + JIT, no compiler)"
$RGRC -es6 -nodemodule gallery/ranger_engine/tools/rg_vm_only.rgr -d="./$OUT" -o=rg_vm.js > /dev/null

echo ""
for f in rg_vm.js rg_api.js rg_run.js rg_dump.js; do
  printf '  %-12s %8s bytes\n' "$f" "$(wc -c < "$OUT/$f")"
done
