#!/usr/bin/env bash
# Build the paste-a-specification page.
#
#   npm run vela:web            build into gallery/vela/web/dist
#   npm run vela:web -- --out D build somewhere else (the Pages job does this)
#
# The page is one HTML file and one compiled script. The script is
# tools/vela_web.rgr — the runtime, the Vega-Lite compiler and the SVG renderer
# with no `read_file` anywhere in them, which is what makes the output free of
# `require` and therefore loadable by a browser. That is checked here rather
# than assumed: a stray file-system call would compile fine and fail only when
# someone opened the page.
set -e
cd "$(dirname "$0")/../../.."
ROOT="$(pwd)"
WEB=gallery/vela/web
OUT="$WEB/dist"

while [ $# -gt 0 ]; do
  case "$1" in
    --out) OUT="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 1 ;;
  esac
done

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr

# The compiler resolves -d= against the repository root even when it is given
# an absolute path, so it always writes here and the copy below is what
# honours --out. Finding that out the hard way is why the script now checks
# that the file it is about to publish exists.
STAGE=$WEB/dist
mkdir -p "$STAGE" "$OUT"

log=$(node bin/output.js -es6 gallery/vela/tools/vela_web.rgr -d="$STAGE" -o=vela_web.js 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/vela/tools/vela_web.rgr" >&2
  exit 1
fi
if [ ! -f "$STAGE/vela_web.js" ]; then
  echo "the compiler reported no failure but wrote no $STAGE/vela_web.js" >&2
  echo "$log" | tail -5 >&2
  exit 1
fi

if grep -q "require(" "$STAGE/vela_web.js"; then
  echo "vela_web.js calls require() — something in it reached for the file system," >&2
  echo "and a browser has none. Look for read_file / write_file / shell_arg." >&2
  grep -n "require(" "$STAGE/vela_web.js" | head -5 >&2
  exit 1
fi

cp "$WEB/index.html" "$OUT/index.html"
if [ "$(cd "$OUT" && pwd)" != "$(cd "$STAGE" && pwd)" ]; then
  cp "$STAGE/vela_web.js" "$OUT/vela_web.js"
fi
printf '  %s\n' "$OUT/index.html" "$OUT/vela_web.js"
echo "open it with:  python3 -m http.server -d $OUT"
