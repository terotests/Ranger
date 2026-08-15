#!/usr/bin/env bash
# Build the Ranger engine hosts into gallery/ranger_engine/bin/.
#
#   rg_api.js    the engine as a Node module (tests and the benchmark use it)
#   rg_run.js    the command line: `node bin/rg_run.js program.rgr -report`
#   rg_dump.js   the development dumper for the analyzed tree
#   rg_vm.js     VM + JIT only, with no compiler linked in — the number that
#                answers "how small is the runtime half?"
#   rg_build.js  Ranger source -> .rgb bytecode (has the compiler in it)
#   rg_cli.js    the runtime CLI on Node: runs a .rgb, no compiler
#   rangercli    the same CLI as a native binary, via the C++ target and g++
#
# With no arguments it builds everything except `native`, which needs a C++
# compiler. Name targets (api, run, dump, vm, build, cli, native) to build only
# those -- the test suite asks for `api vm build cli`.
#
# Run from the repository root.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WANTED="${*:-api run dump vm build cli}"
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

if wants build; then
  build "rg_build.js (source -> bytecode)" $RGRC -es6 -nodecli gallery/ranger_engine/tools/rg_build.rgr -d="./$OUT" -o=rg_build.js
fi

if wants cli; then
  build "rg_cli.js   (bytecode runner on Node)" $RGRC -es6 -nodecli gallery/ranger_engine/tools/rg_cli.rgr -d="./$OUT" -o=rg_cli.js
fi

if wants native; then
  if ! command -v g++ > /dev/null; then
    echo "native build needs g++ on PATH" >&2
    exit 1
  fi
  build "rangercli.cpp (C++ source for the runtime)" $RGRC -l=cpp gallery/ranger_engine/tools/rg_cli.rgr -d="./$OUT" -o=rangercli.cpp
  echo "building rangercli (g++ -O2)"
  g++ -std=c++17 -O2 -o "$OUT/rangercli" "$OUT/rangercli.cpp"
fi

echo ""
for f in rg_vm.js rg_api.js rg_run.js rg_dump.js rg_build.js rg_cli.js rangercli; do
  if [ -f "$OUT/$f" ]; then
    printf '  %-12s %8s bytes\n' "$f" "$(wc -c < "$OUT/$f")"
  fi
done
