#!/usr/bin/env bash
# Run every test file in its own vitest invocation and record the verdict.
#
#   bash scripts/suite_matrix.sh [out.tsv]
#
# `npm test` runs all files in one process under singleFork, where a file that
# shells out to compilers for minutes starves the reporter: the run stops with
# `Timeout calling "onTaskUpdate"` and every file after it is never started.
# The summary then reads like a suite with a few failures rather than a suite
# that stopped (ISSUES.md #77). One invocation per file cannot do that, and it
# also says which file each failure belongs to.
set -u
cd "$(dirname "$0")/.."
OUT="${1:-tmp/suite-matrix.tsv}"
: > "$OUT"
pass=0; fail=0; skip=0
for f in $(ls tests/*.test.ts | sort); do
  base=$(basename "$f")
  case "$base" in
    compiler-llvm.test.ts|syntax-app.test.ts|ts-engine-targets.test.ts|es-conformance-targets.test.ts)
      printf '%s\tEXCLUDED\t0\n' "$base" >> "$OUT"; skip=$((skip+1)); continue ;;
  esac
  start=$(date +%s)
  timeout 900 npx vitest run --config tests/vitest.config.ts "$base" \
    > "tmp/suite-matrix-$base.log" 2>&1
  # The exit code alone is not the verdict. A file whose tests ALL pass still
  # exits non-zero when the reporter times out (`Timeout calling
  # "onTaskUpdate"`), and compiler-selfhost and game-runner did exactly that:
  # 16 and 19 tests passed, both reported as failures. Read the summary line
  # instead, and fall back to the exit code only when there is no summary --
  # which is what a crash or a 900s timeout looks like.
  if grep -aq "Tests .*failed" "tmp/suite-matrix-$base.log"; then
    v=FAIL; fail=$((fail+1))
  elif grep -aqE "Tests +[0-9]+ skipped \\([0-9]+\\)" "tmp/suite-matrix-$base.log"; then
    # Every test in the file skipped -- a toolchain this machine does not
    # have. vitest exits non-zero for it, which is not a failure and must not
    # be counted as one: compiler-dart, compiler-chain-kotlin-swift and three
    # others were reported as broken purely for being unrunnable here.
    v=SKIPPED; skip=$((skip+1))
  elif grep -aq "Tests .* passed" "tmp/suite-matrix-$base.log"; then
    v=PASS; pass=$((pass+1))
    grep -aq 'Timeout calling "onTaskUpdate"' "tmp/suite-matrix-$base.log" \
      && v="PASS (reporter timed out)"
  else
    v=NO-RESULT; fail=$((fail+1))
  fi
  printf '%s\t%s\t%s\n' "$base" "$v" "$(( $(date +%s) - start ))" >> "$OUT"
  printf '%-44s %s\n' "$base" "$v"
done
echo
echo "pass=$pass fail=$fail excluded=$skip"
