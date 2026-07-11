#!/usr/bin/env bash
# Times a native (C++) Ranger benchmark. Runs at two iteration counts and
# subtracts, so fixed startup/parse cost is removed and we report the marginal
# per-iteration time.
#
# Usage:
#   run_cpp_bench.sh [BIN] [LOW_ITERS] [HIGH_ITERS] [REPS]
#
# Examples:
#   run_cpp_bench.sh tmp/bench-cpp/bench 100 600 3   # level_init bench
#   run_cpp_bench.sh tmp/bg-bench/bench 10 60 3      # bg_fill bench
set -euo pipefail
BIN="${1:-tmp/bench-cpp/bench}"
LOW="${2:-100}"
HIGH="${3:-600}"
REPS="${4:-3}"

ns() { date +%s%N; }

time_run() {
  local iters="$1" best=0 r
  for ((r=0; r<REPS; r++)); do
    local t0 t1 d
    t0=$(ns)
    "$BIN" "$iters" >/dev/null
    t1=$(ns)
    d=$(( t1 - t0 ))
    if [[ $best -eq 0 || $d -lt $best ]]; then best=$d; fi
  done
  echo "$best"
}

lo=$(time_run "$LOW")
hi=$(time_run "$HIGH")

# marginal ms per iteration = (hi - lo) / (HIGH - LOW)
per=$(awk -v hi="$hi" -v lo="$lo" -v H="$HIGH" -v L="$LOW" 'BEGIN{printf "%.4f", (hi-lo)/1e6/(H-L)}')
loms=$(awk -v x="$lo" 'BEGIN{printf "%.2f", x/1e6}')
hims=$(awk -v x="$hi" 'BEGIN{printf "%.2f", x/1e6}')

echo "low  ($LOW iters)  best = ${loms} ms"
echo "high ($HIGH iters) best = ${hims} ms"
echo "per iteration (marginal) = ${per} ms"
