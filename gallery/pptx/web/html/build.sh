#!/usr/bin/env bash
# Build the DOM-painted PPTX viewer.
#
#   npm run pptx:html               build into gallery/pptx/web/html/dist
#   npm run pptx:html -- --out DIR  build somewhere else
#   npm run pptx:html:serve         build and serve it on :8006
#
# The output is static and identical in shape to the WebGL page's, minus the
# renderer: an HTML file, one compiled script, `evg-html.js`, the fonts, the
# preset geometries and a deck. Anything that can serve files can serve it.
#
# The engine is the SAME gallery/pptx/web/pptx_web.rgr the standalone viewer
# compiles — there is no second engine and no flag on the first one. That is
# the claim the page makes, so it is built from the same source here rather
# than copied from the other build's output, where a stale file would hide a
# compile error.
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"
WEB=gallery/pptx/web/html
OUT="$WEB/dist"

while [ $# -gt 0 ]; do
  case "$1" in
    --out) OUT="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 1 ;;
  esac
done

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr

STAGE=$WEB/dist
mkdir -p "$STAGE" "$OUT"

# A previous build's bundle must not survive this one: the check below asks
# whether a bundle is loadable, and a stale file answers yes.
rm -f "$STAGE/pptx_web.js"
log=$(node bin/output.js -es6 gallery/pptx/web/pptx_web.rgr -d="$STAGE" -o=pptx_web.js 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/pptx/web/pptx_web.rgr" >&2
  exit 1
fi
if [ ! -f "$STAGE/pptx_web.js" ]; then
  echo "the compiler reported no failure but wrote no $STAGE/pptx_web.js" >&2
  exit 1
fi

# Loadable by a browser? The bundle keeps the EVG stack's file-reading
# functions — they are simply never the path this page takes — so the question
# is whether anything CALLS one while the script loads.
node --input-type=module -e "
  import fs from 'fs';
  globalThis.require = undefined;
  const src = fs.readFileSync('$STAGE/pptx_web.js', 'utf8');
  const found = (0, eval)(src + '; typeof PptxWeb');
  if (found !== 'function') {
    console.error('pptx_web.js does not define PptxWeb when loaded without require()');
    process.exit(1);
  }
" || exit 1

node --input-type=module -e "
  import fs from 'fs';
  const p = '$STAGE/pptx_web.js';
  const src = fs.readFileSync(p, 'utf8');
  if (!src.startsWith('// scoped')) {
    fs.writeFileSync(p,
      '// scoped: the page loads this beside other scripts, so it publishes one name.\n'
      + '(function () {\n' + src + '\n;globalThis.PptxWeb = PptxWeb;\n})();\n');
  }
" || exit 1

if [ "$(cd "$OUT" && pwd)" != "$(cd "$STAGE" && pwd)" ]; then
  cp "$STAGE/pptx_web.js" "$OUT/pptx_web.js"
fi

cp "$WEB/index.html" "$OUT/index.html"
cp "$WEB/html.mjs" "$OUT/html.mjs"

# The pointer, the keyboard and the picture cache, shared verbatim with the
# WebGL page and the API playground.
mkdir -p "$OUT/host"
cp gallery/pptx/web/host/pptx-host.mjs "$OUT/host/pptx-host.mjs"

# The painter. It lives beside the WebGL one in gallery/evg because it is not
# this page's — any EVG app can import it.
mkdir -p "$OUT/html" "$OUT/fonts"
cp gallery/evg/html/evg-html.js "$OUT/html/evg-html.js"

for face in OpenSans-Regular OpenSans-Bold OpenSans-Italic OpenSans-BoldItalic; do
  cp "gallery/pdf_writer/assets/fonts/Open_Sans/$face.ttf" "$OUT/fonts/$face.ttf"
done
for face in Noto_Emoji/NotoEmoji-Regular Noto_Sans/NotoSans-Regular El_Messiri/ElMessiri-Regular El_Messiri/ElMessiri-Bold; do
  cp "gallery/pdf_writer/assets/fonts/$face.ttf" "$OUT/fonts/$(basename "$face").ttf"
done

cp gallery/office/geom/assets/presets.txt "$OUT/presets.txt"
cp gallery/pptx/fixtures/20-business-deck.pptx "$OUT/deck.pptx"
cp gallery/odp/fixtures/20-business-deck.odp "$OUT/sample.odp"

# --- the build stamp ---------------------------------------------------------
STAMP=$(node -e "
  const fs = require('fs'), crypto = require('crypto');
  const h = crypto.createHash('sha1');
  for (const f of ['$OUT/pptx_web.js', '$OUT/html.mjs', '$OUT/host/pptx-host.mjs', '$OUT/html/evg-html.js']) h.update(fs.readFileSync(f));
  process.stdout.write(h.digest('hex').slice(0, 10));
")
node -e "
  const fs = require('fs');
  const stamp = '$STAMP';
  fs.writeFileSync('$OUT/index.html',
    fs.readFileSync('$OUT/index.html', 'utf8').split('__BUILD__').join(stamp));
  fs.writeFileSync('$OUT/html.mjs',
    fs.readFileSync('$OUT/html.mjs', 'utf8')
      .replace('./html/evg-html.js', './html/evg-html.js?v=' + stamp));
" || exit 1
if grep -q "__BUILD__" "$OUT/index.html"; then
  echo "the build stamp was not written into $OUT/index.html" >&2
  exit 1
fi

printf '  %s\n' "$OUT/index.html" "$OUT/pptx_web.js" "$OUT/html.mjs" "$OUT/html/evg-html.js"
echo "build $STAMP"
echo "open it with:  python3 -m http.server -d $OUT 8006"
