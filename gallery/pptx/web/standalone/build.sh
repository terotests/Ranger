#!/usr/bin/env bash
# Build the serverless PPTX viewer page.
#
#   npm run pptx:web                build into gallery/pptx/web/standalone/dist
#   npm run pptx:web -- --out DIR   build somewhere else
#
# The output is static: an HTML file, one compiled script, the WebGL renderer,
# four font files and a workbook. Anything that can serve files can serve it —
# there is no host process to run.
#
# The compiled script is gallery/pptx/web/pptx_web.rgr: GridApp with a
# thin facade and no `read_file` on any path the page takes. That is CHECKED
# here rather than assumed — the bundle is loaded with `require` undefined,
# which is what a browser looks like, and asked for its class. A stray
# file-system call at load time would compile fine and fail only when someone
# opened the page.
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"
WEB=gallery/pptx/web/standalone
OUT="$WEB/dist"

while [ $# -gt 0 ]; do
  case "$1" in
    --out) OUT="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 1 ;;
  esac
done

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
mkdir -p "$OUT"

# A previous build's bundle must not survive this one: the checks below ask
# whether a bundle is present and loadable, and a stale file answers yes.
rm -f "$OUT/pptx_web.js"
log=$(node bin/output.js -es6 gallery/pptx/web/pptx_web.rgr -d="$OUT" -o=pptx_web.js 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/pptx/web/pptx_web.rgr" >&2
  exit 1
fi
if [ ! -f "$OUT/pptx_web.js" ]; then
  echo "the compiler reported no failure but wrote no $OUT/pptx_web.js" >&2
  exit 1
fi

# Loadable by a browser? The bundle keeps the EVG stack's file-reading
# functions — they are simply never the path this page takes — so the question
# is whether anything CALLS one while the script loads.
node --input-type=module -e "
  import fs from 'fs';
  globalThis.require = undefined;
  const src = fs.readFileSync('$OUT/pptx_web.js', 'utf8');
  const found = (0, eval)(src + '; typeof PptxWeb');
  if (found !== 'function') {
    console.error('pptx_web.js does not define PptxWeb when loaded without require()');
    process.exit(1);
  }
" || exit 1

# One classic script declaring its classes globally is fine on its own, but the
# page also loads the WebGL module; scoping keeps the two from colliding if a
# second bundle is ever added beside it.
node --input-type=module -e "
  import fs from 'fs';
  const p = '$OUT/pptx_web.js';
  const src = fs.readFileSync(p, 'utf8');
  if (!src.startsWith('// scoped')) {
    fs.writeFileSync(p,
      '// scoped: the page loads this beside other scripts, so it publishes one name.\n'
      + '(function () {\n' + src + '\n;globalThis.PptxWeb = PptxWeb;\n})();\n');
  }
" || exit 1

cp "$WEB/index.html" "$OUT/index.html"
cp "$WEB/standalone.mjs" "$OUT/standalone.mjs"

mkdir -p "$OUT/gl" "$OUT/fonts"
cp gallery/evg/gl/evg-webgl.js "$OUT/gl/evg-webgl.js"
for face in OpenSans-Regular OpenSans-Bold OpenSans-Italic OpenSans-BoldItalic; do
  cp "gallery/pdf_writer/assets/fonts/Open_Sans/$face.ttf" "$OUT/fonts/$face.ttf"
done
# The 187 preset geometries, as data. The page fetches this and hands it to
# the viewer the way it hands over the fonts: without it a browser build falls
# back to the hand-written table, so every shape the specification defines and
# nobody typed in comes out as a rectangle.
cp gallery/office/geom/assets/presets.txt "$OUT/presets.txt"

# A deck to open on load. The page reads it with fetch and hands the bytes to
# the viewer, exactly as it does with a file the user picks.
cp gallery/pptx/fixtures/20-business-deck.pptx "$OUT/deck.pptx"

# --- the build stamp ---------------------------------------------------------
# A rebuilt page that a browser will not fetch is indistinguishable from a page
# that was never fixed. Nothing in this output carries a cache header and
# `python3 -m http.server` sends none, so every file the page loads gets
# `?v=<hash of the build>` — the URL changes only when the bytes do — and the
# same stamp is printed in the page's status bar, so "which build am I looking
# at" is a thing you read rather than a thing you guess.
STAMP=$(node -e "
  const fs = require('fs'), crypto = require('crypto');
  const h = crypto.createHash('sha1');
  for (const f of ['$OUT/pptx_web.js', '$OUT/standalone.mjs', '$OUT/gl/evg-webgl.js']) h.update(fs.readFileSync(f));
  process.stdout.write(h.digest('hex').slice(0, 10));
")
node -e "
  const fs = require('fs');
  const stamp = '$STAMP';
  fs.writeFileSync('$OUT/index.html',
    fs.readFileSync('$OUT/index.html', 'utf8').split('__BUILD__').join(stamp));
  fs.writeFileSync('$OUT/standalone.mjs',
    fs.readFileSync('$OUT/standalone.mjs', 'utf8')
      .replace('./gl/evg-webgl.js', './gl/evg-webgl.js?v=' + stamp));
" || exit 1
if grep -q "__BUILD__" "$OUT/index.html"; then
  echo "the build stamp was not written into $OUT/index.html" >&2
  exit 1
fi

printf '  %s\n' "$OUT/index.html" "$OUT/pptx_web.js" "$OUT/standalone.mjs"
echo "build $STAMP"
echo "open it with:  python3 -m http.server -d $OUT 8000"
