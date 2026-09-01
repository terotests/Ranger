#!/usr/bin/env bash
# Does -format=none still emit what the compiler emitted BEFORE the formatter
# existed? Byte for byte, on every target, for a program the formatter should
# have nothing to say about and one it should.
#
#   bash scripts/fmt_parity.sh <baseline-compiler.js> [source.rgr ...]
#
# The baseline is a copy of bin/output.js from before the change. Both
# compilers read the same sources -- including compiler/Lang.rgr, so a
# reserved-word change already applies to BOTH sides and this check isolates
# the writer change alone. It is the check that caught a Swift visibility
# regression the test suite missed during the documentation work.
set -u
cd "$(dirname "$0")/.."
BASE="${1:?usage: fmt_parity.sh <baseline-compiler.js> [sources...]}"
shift
SRCS=("$@")
if [ ${#SRCS[@]} -eq 0 ]; then
  SRCS=(gallery/invaders/invaders.rgr gallery/vela/src/VlChart.rgr)
fi
export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
OUT=tmp/fmt-parity
rm -rf "$OUT"; mkdir -p "$OUT"

declare -A EXT=( [es6]=js [go]=go [rust]=rs [cpp]=cpp [python]=py [dart]=dart
                 [kotlin]=kt [swift6]=swift [csharp]=cs [java7]=java [php]=php
                 [scala]=scala )
fail=0
for src in "${SRCS[@]}"; do
  name=$(basename "$src" .rgr)
  for lang in es6 go rust cpp python dart kotlin swift6 csharp java7 php scala; do
    ext=${EXT[$lang]}
    flags=""; [ "$lang" = es6 ] && flags="-es6"
    node --max-old-space-size=8192 bin/output.js -l=$lang $flags "$src" \
        -d=$OUT -o="${name}_new.$ext" -nodecli -format=none >/dev/null 2>&1
    node --max-old-space-size=8192 "$BASE" -l=$lang $flags "$src" \
        -d=$OUT -o="${name}_old.$ext" -nodecli >/dev/null 2>&1
    a="$OUT/${name}_old.$ext"; b="$OUT/${name}_new.$ext"
    if [ ! -f "$a" ] && [ ! -f "$b" ]; then
      printf '  %-12s %-22s both fail to compile (unchanged)\n' "$lang" "$name"
    elif [ ! -f "$a" ] || [ ! -f "$b" ]; then
      printf '  %-12s %-22s ONE SIDE FAILED TO COMPILE\n' "$lang" "$name"; fail=1
    elif cmp -s "$a" "$b"; then
      printf '  %-12s %-22s identical\n' "$lang" "$name"
    else
      n=$(diff "$a" "$b" | grep -c '^[<>]')
      printf '  %-12s %-22s DIFFERS (%s changed lines)\n' "$lang" "$name" "$n"; fail=1
    fi
  done
done
# Python's output is EXPECTED to differ from a baseline taken before the
# method-rename fix: `fn str` is declared as `_str` on Python, and the chained
# call site used to write the original name, so `r.str(...)` called a method
# that did not exist. That is a bug fix and it applies whatever -format says.
# Every other target must still be byte-identical.
if [ $fail -eq 0 ]; then
  echo "-format=none is byte-for-byte identical to the baseline"
elif [ "$fail" = 1 ]; then
  echo
  echo "A target that DIFFERS is only acceptable when the difference is a"
  echo "deliberate codegen fix, named here. Anything else is a regression in"
  echo "the -format=none escape hatch, which is supposed to be exactly what"
  echo "the previous compiler emitted."
fi
exit $fail
