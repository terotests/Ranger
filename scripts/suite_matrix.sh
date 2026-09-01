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
  if timeout 900 npx vitest run --config tests/vitest.config.ts "$base" \
       > "tmp/suite-matrix-$base.log" 2>&1; then
    v=PASS; pass=$((pass+1))
  else
    v=FAIL; fail=$((fail+1))
  fi
  printf '%s\t%s\t%s\n' "$base" "$v" "$(( $(date +%s) - start ))" >> "$OUT"
  printf '%-44s %s\n' "$base" "$v"
done
echo
echo "pass=$pass fail=$fail excluded=$skip"
