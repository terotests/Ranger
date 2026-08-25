#!/usr/bin/env bash
#
# Compile a Ranger test and run it — and FAIL when the compile fails.
#
# WHY THIS EXISTS. The compiler prints `[FAIL]` and `Compilation FAILED` and
# then exits 0. Written the obvious way,
#
#     node bin/output.js … -o=Suite.js && node ./bin/Suite.js
#
# the `&&` is satisfied by that zero, the previous run's `Suite.js` is still on
# disk, and node runs THAT. The suite prints ALL PASS — of code that no longer
# compiles. This is not hypothetical: a broken `sfn` in PptxGeomTest reported a
# green run in this repository, and it was caught only because a section header
# that should have been in the output was missing.
#
# So: the bundle is deleted first, the compiler's log is read for the failure
# it will not put in its exit status, and the absence of an output file is
# itself an error. The web builds have guarded this for a while; the suites
# had not.
#
#   scripts/rgr-suite.sh <source.rgr> <outdir> <output.js> [args…]
set -u

src=$1; outdir=$2; out=$3; shift 3

: "${RANGER_LIB:=./compiler/Lang.rgr:./lib/stdops.rgr}"
export RANGER_LIB

mkdir -p "$outdir"
rm -f "$outdir/$out"

log=$(node bin/output.js -es6 "$src" -d="$outdir" -o="$out" -nodecli 2>&1)
status=$?
if [ $status -ne 0 ] || echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -B1 -A3 "\[FAIL\]" | head -60
  echo "FAILED to compile $src" >&2
  exit 1
fi
if [ ! -f "$outdir/$out" ]; then
  echo "$log" | tail -20
  echo "the compiler reported no failure but wrote no $outdir/$out" >&2
  exit 1
fi

exec node "$outdir/$out" "$@"
