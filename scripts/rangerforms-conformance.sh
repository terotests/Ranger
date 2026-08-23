#!/usr/bin/env bash
# The same questionnaire engine, from the same source, on every target.
#
#   npm run rangerforms:conformance
#
# Compiles gallery/rangerforms/bench/Conformance.rgr to each language, builds
# and runs it, and diffs every output against the ES6 one. The corpus is
# compiled in (see CorpusData.rgr), so the program has no inputs but its own
# source and cannot diverge for any reason except the one being measured.
#
# A target whose toolchain is not installed is REPORTED AS SKIPPED, never
# quietly dropped: "identical on the four targets that ran" is a result and
# "identical" on its own would not be.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
OUT="$ROOT/gallery/rangerforms/bin/conformance"
SRC="gallery/rangerforms/bench/Conformance.rgr"
export RANGER_LIB="./compiler/Lang.rgr:./lib/stdops.rgr"
mkdir -p "$OUT"

rm -f "$OUT"/*.log "$OUT"/*.txt "$OUT"/*.err
node scripts/rangerforms-corpus.mjs >/dev/null

declare -a NAMES=() STATES=() NOTES=()
record() { NAMES+=("$1"); STATES+=("$2"); NOTES+=("$3"); }

compile() { # lang outfile extra…
  local lang="$1"; shift
  local out="$1"; shift
  node bin/output.js -l="$lang" "$SRC" -d="gallery/rangerforms/bin/conformance" -o="$out" "$@" \
    >"$OUT/$lang.compile.log" 2>&1
}

# --- ES6, the reference ------------------------------------------------------
echo "==> es6"
if compile es6 Conformance.js -nodecli && node "$OUT/Conformance.js" >"$OUT/es6.txt" 2>"$OUT/es6.err"; then
  record es6 ran "$(wc -l <"$OUT/es6.txt" | tr -d ' ') lines"
else
  echo "the reference target failed; see $OUT/es6.compile.log $OUT/es6.err" >&2
  tail -20 "$OUT/es6.compile.log" "$OUT/es6.err" 2>/dev/null >&2
  exit 2
fi

run_target() { # name compile-cmd run-cmd
  local name="$1" tool="$2"
  if ! command -v "$tool" >/dev/null 2>&1; then
    record "$name" skipped "$tool is not installed"
    return
  fi
  echo "==> $name"
  if ! "build_$name"; then
    local first
    first=$(grep -am1 '^error' "$OUT/$name.build.log" 2>/dev/null || true)
    [ -z "$first" ] && first="see $OUT/$name.build.log"
    record "$name" "BUILD FAILED" "$first"
    return
  fi
  if ! "run_$name" >"$OUT/$name.txt" 2>"$OUT/$name.err"; then
    record "$name" "RAN BUT FAILED" "see $OUT/$name.err"
    return
  fi
  if diff -q "$OUT/es6.txt" "$OUT/$name.txt" >/dev/null; then
    record "$name" identical "byte for byte with es6"
  else
    local n
    n=$(diff "$OUT/es6.txt" "$OUT/$name.txt" | grep -c '^[<>]')
    record "$name" "DIFFERS" "$n lines; diff $OUT/es6.txt $OUT/$name.txt"
  fi
}

# --- python ------------------------------------------------------------------
build_python() { compile python Conformance.py >>"$OUT/python.build.log" 2>&1; }
run_python() { python3 "$OUT/Conformance.py"; }

# --- go ----------------------------------------------------------------------
build_go() {
  { compile go Conformance.go \
      && (cd "$OUT" && go mod init rangerforms_conformance >/dev/null 2>&1; go build -o conformance_go Conformance.go); } \
      >>"$OUT/go.build.log" 2>&1
}
run_go() { "$OUT/conformance_go"; }

# --- c++ ---------------------------------------------------------------------
build_cpp() {
  { compile cpp Conformance.cpp \
      && g++ -std=c++17 -O1 -o "$OUT/conformance_cpp" "$OUT/Conformance.cpp"; } \
      >>"$OUT/cpp.build.log" 2>&1
}
run_cpp() { "$OUT/conformance_cpp"; }

# --- rust --------------------------------------------------------------------
build_rust() {
  { compile rust Conformance.rs \
      && rustc --edition 2021 -A warnings -O -o "$OUT/conformance_rust" "$OUT/Conformance.rs"; } \
      >>"$OUT/rust.build.log" 2>&1
}
run_rust() { "$OUT/conformance_rust"; }

run_target python python3
run_target go go
run_target cpp g++
run_target rust rustc

# --- the table ---------------------------------------------------------------
echo
echo "RangerForms — the same engine, from the same source, on every target"
echo
identical=0; differing=0; skipped=0; broken=0
for i in "${!NAMES[@]}"; do
  printf "  %-8s %-16s %s\n" "${NAMES[$i]}" "${STATES[$i]}" "${NOTES[$i]}"
  case "${STATES[$i]}" in
    identical) identical=$((identical+1)) ;;
    ran)       identical=$((identical+1)) ;;
    skipped)   skipped=$((skipped+1)) ;;
    DIFFERS)   differing=$((differing+1)) ;;
    *)         broken=$((broken+1)) ;;
  esac
done
echo
echo "  identical  $identical of $((identical+differing+broken)) that ran"
[ "$differing" -gt 0 ] && echo "  DIFFERING  $differing"
[ "$broken" -gt 0 ] && echo "  broken     $broken"
[ "$skipped" -gt 0 ] && echo "  skipped    $skipped  (no toolchain here; not counted as agreement)"
echo
[ "$differing" -eq 0 ] && [ "$broken" -eq 0 ]
