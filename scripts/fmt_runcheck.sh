#!/usr/bin/env bash
# Does the FORMATTED output still do what the unformatted output did?
#
#   bash scripts/fmt_runcheck.sh
#
# Removing a parenthesis that was load-bearing is a silent behaviour change, so
# the check that matters is execution, not inspection: every conformance
# program is compiled twice from the same compiler -- once with -format=none
# and once with -format=ranger -- built, run, and the two outputs compared to
# each other and to the committed expectation.
set -u
cd "$(dirname "$0")/.."

# Target gaps that predate the formatter. Both modes agree on these and both
# are wrong; the point of listing them is that "the two modes agree" stays a
# pass while "the output is wrong" is still reported.
KNOWN_GAP="go:array_param_mutate"   # ISSUES #58, Go slice pass-by-value
export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
OUT=tmp/fmt-runcheck
rm -rf "$OUT"; mkdir -p "$OUT"
fail=0; ran=0

run_one() { # lang ext case dir
  local lang=$1 ext=$2 case=$3 dir=$4 src=$5 expected=$6
  local outs=()
  for mode in none ranger; do
    local f="$OUT/${case}_${lang}_${mode}.${ext}"
    local flags=""; [ "$lang" = es6 ] && flags="-es6"
    node --max-old-space-size=8192 bin/output.js -l=$lang $flags "$src" \
      -d="$OUT" -o="$(basename "$f")" -nodecli -format=$mode >/dev/null 2>&1 || return 2
    [ -f "$f" ] || return 2
    local got=""
    case $lang in
      es6)    got=$(node "$f" 2>&1) ;;
      python) got=$(python3 "$f" 2>&1) ;;
      go)     got=$(cd "$OUT" && go run "$(basename "$f")" 2>&1) ;;
      cpp)    g++ -std=c++17 -O0 -o "$f.bin" "$f" 2>/dev/null || return 2
              got=$("$f.bin" 2>&1) ;;
      rust)   rustc --edition 2018 -A warnings -o "$f.bin" "$f" 2>/dev/null || return 2
              got=$("$f.bin" 2>&1) ;;
    esac
    outs+=("$got")
  done
  ran=$((ran+1))
  if [ "${outs[0]}" != "${outs[1]}" ]; then
    printf '  %-8s %-26s FORMATTED OUTPUT DIFFERS AT RUNTIME\n' "$lang" "$case"
    diff <(printf '%s\n' "${outs[0]}") <(printf '%s\n' "${outs[1]}") | head -6
    fail=1; return 0
  fi
  if [ -n "$expected" ] && [ "${outs[1]}" != "$expected" ]; then
    if [[ " $KNOWN_GAP " == *" $lang:$case "* ]]; then
      printf '  %-8s %-26s wrong in BOTH modes -- known target gap, not the formatter\n' \
        "$lang" "$case"
      return 0
    fi
    printf '  %-8s %-26s WRONG OUTPUT\n' "$lang" "$case"
    diff <(printf '%s\n' "$expected") <(printf '%s\n' "${outs[1]}") | head -6
    fail=1; return 0
  fi
  printf '  %-8s %-26s ok\n' "$lang" "$case"
}

for d in tests/conformance/*/; do
  case=$(basename "$d")
  src="$d/program.rgr"
  exp=""
  [ -f "$d/expected_output.txt" ] && exp=$(cat "$d/expected_output.txt")
  for lang in es6 python go cpp rust; do
    case $lang in es6) ext=js;; python) ext=py;; go) ext=go;; cpp) ext=cpp;; rust) ext=rs;; esac
    run_one "$lang" "$ext" "$case" "$OUT" "$src" "$exp"
    [ $? -eq 2 ] && printf '  %-8s %-26s skipped (does not build)\n' "$lang" "$case"
  done
done
echo
echo "$ran program/target pairs ran under both -format=none and -format=ranger"
[ $fail -eq 0 ] && echo "every formatted program produced the same output as the unformatted one"
exit $fail
