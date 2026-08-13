#!/usr/bin/env bash
# Measure peak RSS of rangerjs against QuickJS and Node on small, deliberately
# simple programs built from the coding patterns the Ranger compiler uses.
#
#   bash gallery/game_engine/v2/interp/cli/mem-probe.sh                # all cases
#   bash .../mem-probe.sh 05_tree_parent_cycle.js                      # one case
#   SCALES="100 500 2000" bash .../mem-probe.sh                        # custom N
#
# Each case has an `__N__` placeholder for its iteration count. The interesting
# number is not peak RSS at one N -- engines differ in baseline footprint -- but
# the SLOPE: bytes gained per extra iteration. A case whose data does not
# survive the loop should have a slope near zero on every engine. A non-zero
# slope where node and qjs are flat is a leak in rangerjs.
set -u
cd "$(dirname "$0")/../../../../.."
ROOT="$(pwd)"

RANGERJS="${RANGERJS:-$ROOT/gallery/game_engine/v2/interp/bin/cpp/rangerjs}"
QJS="${QJS:-qjs}"
NODE="${NODE:-node}"
ENGINES="${ENGINES:-rangerjs qjs node}"
SCALES="${SCALES:-100 400 1600}"
CASES_DIR="$ROOT/gallery/game_engine/v2/interp/cli/memcases"

if [ ! -x "$RANGERJS" ]; then
  echo "rangerjs not built: $RANGERJS" >&2
  echo "build it with: bash gallery/game_engine/v2/interp/cli/build-rangerjs.sh" >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Peak RSS in KB of a command, sampled from /proc. The child is short-lived, so
# the sampler polls tightly; `wait` still reports the real exit status.
peak_rss_kb() {
  "$@" > "$TMP/run.out" 2>&1 &
  local p=$! peak=0 r
  while kill -0 "$p" 2>/dev/null; do
    r=$(awk '/VmHWM/{print $2}' "/proc/$p/status" 2>/dev/null || true)
    [ -n "$r" ] && [ "$r" -gt "$peak" ] && peak=$r
    sleep 0.02
  done
  wait "$p"
  RUN_RC=$?
  echo "$peak"
}

if [ "$#" -gt 0 ]; then
  FILES=("$@")
else
  FILES=()
  for f in "$CASES_DIR"/*.js; do [ -e "$f" ] && FILES+=("$(basename "$f")"); done
fi

for name in "${FILES[@]}"; do
  src="$CASES_DIR/$name"
  [ -f "$src" ] || src="$name"
  echo "== $name"
  printf '   %-9s' "N"
  for n in $SCALES; do printf '%12s' "$n"; done
  printf '%14s\n' "B/iter"

  for e in $ENGINES; do
    if [ "$e" != "rangerjs" ] && ! command -v "$e" >/dev/null 2>&1; then continue; fi
    printf '   %-9s' "$e"
    firstN=""; firstKB=""; lastN=""; lastKB=""
    for n in $SCALES; do
      sed "s/__N__/$n/" "$src" > "$TMP/case.js"
      case "$e" in
        rangerjs) kb=$(peak_rss_kb "$RANGERJS" "$TMP/case.js") ;;
        qjs)      kb=$(peak_rss_kb "$QJS" --script "$TMP/case.js") ;;
        node)     kb=$(peak_rss_kb "$NODE" "$TMP/case.js") ;;
      esac
      if [ "${RUN_RC:-0}" -ne 0 ]; then
        printf '%12s' "ERR"
        continue
      fi
      printf '%11s%s' "$((kb / 1024))" "M"
      [ -z "$firstN" ] && { firstN=$n; firstKB=$kb; }
      lastN=$n; lastKB=$kb
    done
    if [ -n "$firstN" ] && [ "$lastN" != "$firstN" ]; then
      printf '%14s\n' "$(( (lastKB - firstKB) * 1024 / (lastN - firstN) ))"
    else
      printf '%14s\n' "-"
    fi
  done
  # The last engine's output doubles as a correctness check: a case that
  # silently produced the wrong answer would make its memory number meaningless.
  echo "   out: $(head -1 "$TMP/run.out")"
done
