#!/usr/bin/env bash
# Compile the shared studies in src/ to one target, or to all of them.
# Usage: bash gallery/friendly/compile.sh [all|rust|go|python|cpp|swift]
# The Ranger compiler exits 0 even on [FAIL]; this script treats that as failure.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
SRC="$HERE/src"
COMPILER="$ROOT/bin/output.js"
export RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr"

if [[ ! -f "$COMPILER" ]]; then
  echo "missing $COMPILER — run npm run compile first" >&2
  exit 1
fi

target="${1:-all}"

compile_one() {
  local lang="$1"
  local ext="$2"
  local ranger_lang="$3"
  local out="$HERE/$lang/generated"
  local bin="${TMPDIR:-/tmp}/friendly-$lang-bin"
  mkdir -p "$out" "$bin"
  local fail=0
  echo "======== $lang ========"
  local src
  for src in "$SRC"/*.rgr; do
    local name
    name="$(basename "$src" .rgr)"
    local log="$out/${name}.compile.log"
    echo "==> $name"
    set +e
    extra=()
    if [[ "$lang" == "rust" ]]; then
      extra+=(-strict-ownership)
    fi
    node "$COMPILER" -l="$ranger_lang" "${extra[@]}" "$src" -d="$out" -o="${name}${ext}" -nodecli >"$log" 2>&1
    set -e
    if grep -E '\[FAIL\]|Compilation FAILED' "$log" >/dev/null; then
      echo "    Ranger compile FAILED — see $log"
      fail=1
      continue
    fi
    if [[ ! -f "$out/${name}${ext}" ]]; then
      echo "    no $out/${name}${ext} written"
      fail=1
      continue
    fi
    case "$lang" in
      rust)
        if ! rustc --edition 2021 -O "$out/${name}.rs" -o "$bin/$name" 2>"$out/${name}.build.log"; then
          echo "    rustc FAILED — see $out/${name}.build.log"
          fail=1
          continue
        fi
        echo "    rustc ok"
        if ! "$bin/$name" | tee "$out/${name}.out"; then
          echo "    run FAILED"
          fail=1
        fi
        ;;
      go)
        if ! go build -o "$bin/$name" "$out/${name}.go" 2>"$out/${name}.build.log"; then
          echo "    go build FAILED — see $out/${name}.build.log"
          fail=1
          continue
        fi
        echo "    go build ok"
        if ! "$bin/$name" | tee "$out/${name}.out"; then
          echo "    run FAILED"
          fail=1
        fi
        ;;
      python)
        if ! python3 "$out/${name}.py" >"$out/${name}.out" 2>"$out/${name}.build.log"; then
          echo "    python FAILED — see $out/${name}.build.log"
          cat "$out/${name}.build.log" >&2
          fail=1
          continue
        fi
        echo "    python ok"
        cat "$out/${name}.out"
        ;;
      cpp)
        if ! g++ -std=c++17 -O1 "$out/${name}.cpp" -o "$bin/$name" 2>"$out/${name}.build.log"; then
          echo "    g++ FAILED — see $out/${name}.build.log"
          fail=1
          continue
        fi
        echo "    g++ ok"
        if ! "$bin/$name" | tee "$out/${name}.out"; then
          echo "    run FAILED"
          fail=1
        fi
        ;;
      swift)
        if ! command -v swiftc >/dev/null 2>&1; then
          echo "    swiftc not on PATH — writer output only"
          continue
        fi
        if ! swiftc -O "$out/${name}.swift" -o "$bin/$name" 2>"$out/${name}.build.log"; then
          echo "    swiftc FAILED — see $out/${name}.build.log"
          fail=1
          continue
        fi
        echo "    swiftc ok"
        if ! "$bin/$name" | tee "$out/${name}.out"; then
          echo "    run FAILED"
          fail=1
        fi
        ;;
    esac
  done
  if [[ "$fail" -ne 0 ]]; then
    echo "$lang: one or more studies failed"
    return 1
  fi
  echo "$lang: all studies compiled"
  return 0
}

overall=0
run_target() {
  case "$1" in
    rust) compile_one rust .rs rust || overall=1 ;;
    go) compile_one go .go go || overall=1 ;;
    python) compile_one python .py python || overall=1 ;;
    cpp) compile_one cpp .cpp cpp || overall=1 ;;
    swift) compile_one swift .swift swift6 || overall=1 ;;
    *) echo "unknown target $1" >&2; overall=1 ;;
  esac
}

if [[ "$target" == "all" ]]; then
  for t in rust go python cpp swift; do
    run_target "$t"
  done
else
  run_target "$target"
fi

if [[ "$overall" -ne 0 ]]; then
  echo "one or more targets failed"
  exit 1
fi
echo "done"
