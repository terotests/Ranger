#!/usr/bin/env bash
# For each test file that fails with the current compiler, run the same file
# against a copy of a previous bin/output.js and say whether it failed there
# too.
#
#   bash scripts/suite_baseline_diff.sh <baseline-compiler.js> <matrix.tsv>
#
# "It looks unrelated" is not evidence. This is what makes "pre-existing" a
# checked claim rather than an impression.
set -u
cd "$(dirname "$0")/.."
BASE="${1:?usage: suite_baseline_diff.sh <baseline-compiler.js> <matrix.tsv>}"
TSV="${2:-tmp/suite-matrix.tsv}"
CUR=tmp/.compiler-under-test.js
cp bin/output.js "$CUR"
restore() { cp "$CUR" bin/output.js; }
trap restore EXIT

mine=0; theirs=0
while IFS=$'\t' read -r file verdict _; do
  [ "$verdict" = FAIL ] || continue
  cp "$BASE" bin/output.js
  if timeout 900 npx vitest run --config tests/vitest.config.ts "$file" \
       > "tmp/baseline-$file.log" 2>&1; then
    printf '  %-44s PASSES on the baseline -- THIS CHANGE BROKE IT\n' "$file"
    mine=$((mine+1))
  else
    printf '  %-44s fails on the baseline too -- pre-existing\n' "$file"
    theirs=$((theirs+1))
  fi
  restore
done < "$TSV"
echo
echo "regressions=$mine pre-existing=$theirs"
[ $mine -eq 0 ]
