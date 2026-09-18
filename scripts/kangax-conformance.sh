#!/usr/bin/env bash
# The kangax compat-table suites -- the ones behind zoo.js.org's ES6 / ES2016+ /
# ESIntl columns -- run through ComponentEngine.
#
#   npm run jsengine:kangax                 # the ES6 column
#   ERAS="es2016 es2017 .. es2025" npm run jsengine:kangax
#   ERAS=intl npm run jsengine:kangax
#
# The test files are not vendored: they come from ivankra/javascript-zoo, which
# extracts each compat-table subtest into a standalone script. The checkout is
# cached under .cache/javascript-zoo and reused; point ZOO at your own checkout
# to skip the clone entirely.
#
# A file that HANGS the engine would otherwise end the run, so each process is
# given a time budget and restarted: the runner records the file it is about to
# run and counts an unfinished one as a failure. That is also how a real
# runaway is found -- it shows up in the report instead of as a wedged suite.
set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

ZOO="${ZOO:-$ROOT/.cache/javascript-zoo}"
ERAS="${ERAS:-es6}"
RUNNER="$ROOT/gallery/game_engine/v2/interp/bench/kangax/run.cjs"
ENGINE_MODULE="$ROOT/gallery/game_engine/v2/interp/bin/engine_module.cjs"

if [ ! -x "$(command -v node)" ]; then
  echo "node is required" >&2
  exit 1
fi

if [ ! -f "$ENGINE_MODULE" ]; then
  echo "no engine module at $ENGINE_MODULE -- run 'npm run jsengine:build' first" >&2
  exit 1
fi

if [ ! -d "$ZOO/conformance/compat-table" ]; then
  echo "== fetching javascript-zoo into $ZOO"
  mkdir -p "$(dirname "$ZOO")"
  git clone --depth 1 https://github.com/ivankra/javascript-zoo.git "$ZOO"
fi

STATE="$(mktemp -d)"
trap 'rm -rf "$STATE"' EXIT
JSONL="$STATE/results.jsonl"

STATUS=1
for _ in $(seq 1 40); do
  if JSONL="$JSONL" ERAS="$ERAS" timeout 600 node --max-old-space-size=3000 "$RUNNER" "$ZOO" >"$STATE/out" 2>/dev/null; then
    STATUS=0
    break
  fi
  echo "-- a test did not finish; restarting past it"
done

cat "$STATE/out"
exit "$STATUS"
