#!/usr/bin/env bash
# Run a set of .js files through rangerjs, QuickJS and Node and diff the output.
#
#   bash gallery/game_engine/v2/interp/cli/compare-qjs.sh                 # run the bundled cases
#   bash gallery/game_engine/v2/interp/cli/compare-qjs.sh a.js b.js       # run specific files
#   ENGINES="rangerjs qjs" bash .../compare-qjs.sh                        # skip node
#   TIME=1 bash .../compare-qjs.sh                                        # also print wall-clock per engine
#
# Node is the oracle: a case only counts as a mismatch when rangerjs and node
# disagree. qjs is reported alongside because it is the other small embeddable
# engine and it is useful to see which of the two a difference follows.
set -u
cd "$(dirname "$0")/../../../../.."
ROOT="$(pwd)"

RANGERJS="${RANGERJS:-$ROOT/gallery/game_engine/v2/interp/bin/cpp/rangerjs}"
QJS="${QJS:-qjs}"
NODE="${NODE:-node}"
ENGINES="${ENGINES:-rangerjs qjs node}"
CASES_DIR="$ROOT/gallery/game_engine/v2/interp/cli/cases"

if [ ! -x "$RANGERJS" ]; then
  echo "rangerjs not built: $RANGERJS" >&2
  echo "build it with: bash gallery/game_engine/v2/interp/cli/build-rangerjs.sh" >&2
  exit 1
fi

if [ "$#" -gt 0 ]; then
  FILES=("$@")
else
  FILES=()
  for f in "$CASES_DIR"/*.js; do
    [ -e "$f" ] && FILES+=("$f")
  done
fi
if [ "${#FILES[@]}" -eq 0 ]; then
  echo "no cases to run" >&2
  exit 1
fi

run_engine() {
  # $1 engine, $2 file -> stdout+stderr on fd 1, exit code in RUN_RC
  case "$1" in
    rangerjs) "$RANGERJS" "$2" 2>&1 ;;
    qjs)      "$QJS" --script "$2" 2>&1 ;;
    node)     "$NODE" "$2" 2>&1 ;;
  esac
}

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

PASS=0
FAIL=0
SKIP=0
FAILED_CASES=""

for f in "${FILES[@]}"; do
  name="$(basename "$f")"
  printf '== %s\n' "$name"
  for e in $ENGINES; do
    command -v "$e" >/dev/null 2>&1 || [ "$e" = "rangerjs" ] || { printf '   %-9s (not installed)\n' "$e"; continue; }
    start=$(date +%s%N)
    run_engine "$e" "$f" > "$TMP/$e.out" 2>&1
    rc=$?
    end=$(date +%s%N)
    ms=$(( (end - start) / 1000000 ))
    echo "$rc" > "$TMP/$e.rc"
    if [ "${TIME:-0}" = "1" ]; then
      printf '   %-9s rc=%s %sms\n' "$e" "$rc" "$ms"
    fi
  done

  if [ ! -f "$TMP/node.out" ]; then
    printf '   SKIP (no node oracle)\n'
    SKIP=$((SKIP + 1))
    continue
  fi
  if diff -q "$TMP/rangerjs.out" "$TMP/node.out" >/dev/null 2>&1; then
    printf '   MATCH rangerjs == node\n'
    PASS=$((PASS + 1))
  else
    printf '   DIFF  rangerjs != node\n'
    diff -u "$TMP/node.out" "$TMP/rangerjs.out" | sed 's/^/     /' | head -40
    FAIL=$((FAIL + 1))
    FAILED_CASES="$FAILED_CASES $name"
  fi
  if [ -f "$TMP/qjs.out" ]; then
    if diff -q "$TMP/qjs.out" "$TMP/node.out" >/dev/null 2>&1; then
      printf '   (qjs == node)\n'
    else
      printf '   (qjs != node -- the case itself is engine-sensitive)\n'
    fi
  fi
  rm -f "$TMP"/*.out "$TMP"/*.rc
done

echo
echo "match: $PASS   diff: $FAIL   skipped: $SKIP"
[ -n "$FAILED_CASES" ] && echo "failing:$FAILED_CASES"
[ "$FAIL" -eq 0 ]
