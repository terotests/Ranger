#!/usr/bin/env bash
# Build the Ranger engine hosts into gallery/ranger_engine/bin/.
#
#   rg_api.js    the engine as a Node module (tests and the benchmark use it)
#   rg_run.js    the command line: `node bin/rg_run.js program.rgr -report`
#   rg_dump.js   the development dumper for the analyzed tree
#   rg_vm.js     VM + JIT only, with no compiler linked in — the number that
#                answers "how small is the runtime half?"
#
# With no arguments it builds all four. Name targets (api, run, dump, vm) to
# build only those -- the test suite asks for `api vm`, which is half the wait.
#
# Run from the repository root.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WANTED="${*:-api run dump vm}"
wants() {
  case " $WANTED " in
    *" $1 "*) return 0 ;;
    *) return 1 ;;
  esac
}

OUT="gallery/ranger_engine/bin"
mkdir -p "$OUT"
export RANGER_LIB="./compiler/Lang.rgr:./lib/stdops.rgr"
RGRC="node --max-old-space-size=8192 bin/output.js"

# The compiler reports failure on stdout and still exits 0, so a build that
# silently kept yesterday's output is a real hazard: check the text.
build() {
  local label="$1"; shift
  echo "building $label"
  local log
  if ! log="$("$@" 2>&1)" || grep -q "\[FAIL\]" <<< "$log"; then
    echo "$log" >&2
    echo "engine build failed: $label" >&2
    exit 1
  fi
}

if wants api; then
  build "rg_api.js  (engine as a Node module)" $RGRC -es6 -nodemodule gallery/ranger_engine/tools/rg_api.rgr -d="./$OUT" -o=rg_api.js
fi

if wants run; then
  build "rg_run.js  (command line)" $RGRC -es6 -nodecli gallery/ranger_engine/tools/rg_run.rgr -d="./$OUT" -o=rg_run.js
fi

if wants dump; then
  build "rg_dump.js (analyzed-tree dumper)" $RGRC -es6 -nodecli gallery/ranger_engine/tools/rg_dump.rgr -d="./$OUT" -o=rg_dump.js
fi

if wants vm; then
  build "rg_vm.js   (VM + JIT, no compiler)" $RGRC -es6 -nodemodule gallery/ranger_engine/tools/rg_vm_only.rgr -d="./$OUT" -o=rg_vm.js
fi

echo ""
for f in rg_vm.js rg_api.js rg_run.js rg_dump.js; do
  if [ -f "$OUT/$f" ]; then
    printf '  %-12s %8s bytes\n' "$f" "$(wc -c < "$OUT/$f")"
  fi
done
