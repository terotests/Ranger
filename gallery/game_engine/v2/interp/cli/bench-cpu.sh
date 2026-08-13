#!/usr/bin/env bash
# Wall-clock comparison of rangerjs against QuickJS and Node.
#
#   bash gallery/game_engine/v2/interp/cli/bench-cpu.sh            # all cases
#   bash .../bench-cpu.sh 02_loop_arith.js                         # one case
#   REPS=5 bash .../bench-cpu.sh                                   # more samples
#   ENGINES="rangerjs qjs" bash .../bench-cpu.sh                   # skip node
#
# Reports the MINIMUM of REPS runs, not the mean: the minimum is the run least
# disturbed by scheduling, and a benchmark that got unlucky is noise rather
# than information.
#
# 00_startup.js is the baseline every other case also pays -- process start,
# engine construction, parsing a trivial script. It is subtracted to give the
# "net" column, so a fast case is not reported as slow because the engine takes
# longer to boot.
#
# Each case prints a checksum. The runner compares them across engines and
# refuses to report a timing for a case where the engines disagree on the
# answer, because then they are not doing the same work.
set -u
cd "$(dirname "$0")/../../../../.."
ROOT="$(pwd)"
RANGERJS="${RANGERJS:-$ROOT/gallery/game_engine/v2/interp/bin/cpp/rangerjs}"
RANGERJS_ARGS="${RANGERJS_ARGS:-}"
QJS="${QJS:-qjs}"
NODE="${NODE:-node}"
ENGINES="${ENGINES:-rangerjs qjs node}"
REPS="${REPS:-3}"
DIR="$ROOT/gallery/game_engine/v2/interp/cli/bench"
TIMEOUT="${TIMEOUT:-600}"

# Output goes to a file rather than a variable: best() calls this in a command
# substitution, so anything assigned here would not survive the subshell.
OUTFILE="$(mktemp)"
trap 'rm -f "$OUTFILE"' EXIT
run_one() {  # engine file -> ms on stdout, program output left in $OUTFILE
  local e="$1" f="$2" s ms
  s=$(date +%s%N)
  case "$e" in
    rangerjs) timeout "$TIMEOUT" "$RANGERJS" $RANGERJS_ARGS "$f" > "$OUTFILE" 2>&1 ;;
    qjs)      timeout "$TIMEOUT" "$QJS" --script "$f" > "$OUTFILE" 2>&1 ;;
    node)     timeout "$TIMEOUT" "$NODE" "$f" > "$OUTFILE" 2>&1 ;;
  esac
  ms=$(( ($(date +%s%N) - s) / 1000000 ))
  echo "$ms"
}

best() {  # engine file -> min ms over REPS
  local e="$1" f="$2" i m lo=""
  for i in $(seq 1 "$REPS"); do
    m=$(run_one "$e" "$f")
    [ -z "$lo" ] && lo=$m
    [ "$m" -lt "$lo" ] && lo=$m
  done
  echo "$lo"
}

if [ "$#" -gt 0 ]; then FILES=("$@"); else
  FILES=(); for f in "$DIR"/*.js; do [ -e "$f" ] && FILES+=("$(basename "$f")"); done
fi

# Startup baseline per engine.
declare -A BASE
for e in $ENGINES; do
  if [ "$e" != "rangerjs" ] && ! command -v "$e" >/dev/null 2>&1; then continue; fi
  BASE[$e]=$(best "$e" "$DIR/00_startup.js")
done
printf 'startup baseline (subtracted below):'
for e in $ENGINES; do [ -n "${BASE[$e]:-}" ] && printf '  %s %sms' "$e" "${BASE[$e]}"; done
echo; echo

printf '%-20s %10s %10s %10s %12s %10s\n' "case" "rangerjs" "qjs" "node" "rjs/qjs" "rjs/node"
for name in "${FILES[@]}"; do
  [ "$name" = "00_startup.js" ] && continue
  f="$DIR/$name"; [ -f "$f" ] || f="$name"
  unset T O; declare -A T; declare -A O
  ok=1
  for e in $ENGINES; do
    [ -z "${BASE[$e]:-}" ] && continue
    T[$e]=$(best "$e" "$f"); O[$e]="$(head -1 "$OUTFILE")"
  done
  # every engine must agree on the checksum, or the timing compares nothing
  ref=""; for e in $ENGINES; do
    [ -z "${BASE[$e]:-}" ] && continue
    [ -z "$ref" ] && ref="${O[$e]}"
    [ "${O[$e]}" != "$ref" ] && ok=0
  done
  # Two statements on purpose: `local e="$1" v=$((...${T[$e]}...))` expands $e
  # BEFORE assigning it, so it silently read the enclosing loop variable and
  # every engine reported the same time.
  net() {
    local e="$1"
    local v
    v=$(( ${T[$e]} - ${BASE[$e]} ))
    [ "$v" -lt 1 ] && v=1
    echo "$v"
  }
  if [ "$ok" -eq 0 ]; then
    printf '%-20s %10s   (engines disagree on the result -- not comparable)\n' "${name%.js}" ""
    for e in $ENGINES; do [ -n "${BASE[$e]:-}" ] && printf '        %-9s %s\n' "$e" "$(echo "${O[$e]}" | head -1)"; done
    continue
  fi
  rj=$(net rangerjs); q=$(net qjs 2>/dev/null || echo 0); nd=$(net node 2>/dev/null || echo 0)
  printf '%-20s %9sms %9sms %9sms %11sx %9sx\n' "${name%.js}" "$rj" "$q" "$nd" \
    "$(python3 -c "print(round($rj/max($q,1),1))")" "$(python3 -c "print(round($rj/max($nd,1),1))")"
done
