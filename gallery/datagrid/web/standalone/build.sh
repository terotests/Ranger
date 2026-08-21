#!/usr/bin/env bash
# Build the serverless DataGrid page.
#
#   npm run datagrid:web                build into gallery/datagrid/web/standalone/dist
#   npm run datagrid:web -- --out DIR   build somewhere else
#
# The output is static: an HTML file, one compiled script, the WebGL renderer,
# four font files and a workbook. Anything that can serve files can serve it —
# there is no host process to run.
#
# The compiled script is gallery/datagrid/web/datagrid_web.rgr: GridApp with a
# thin facade and no `read_file` on any path the page takes. That is CHECKED
# here rather than assumed — the bundle is loaded with `require` undefined,
# which is what a browser looks like, and asked for its class. A stray
# file-system call at load time would compile fine and fail only when someone
# opened the page.
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"
WEB=gallery/datagrid/web/standalone
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
rm -f "$OUT/datagrid_web.js"
log=$(node bin/output.js -es6 gallery/datagrid/web/datagrid_web.rgr -d="$OUT" -o=datagrid_web.js 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/datagrid/web/datagrid_web.rgr" >&2
  exit 1
fi
if [ ! -f "$OUT/datagrid_web.js" ]; then
  echo "the compiler reported no failure but wrote no $OUT/datagrid_web.js" >&2
  exit 1
fi

# Loadable by a browser? The bundle keeps the EVG stack's file-reading
# functions — they are simply never the path this page takes — so the question
# is whether anything CALLS one while the script loads.
node --input-type=module -e "
  import fs from 'fs';
  globalThis.require = undefined;
  const src = fs.readFileSync('$OUT/datagrid_web.js', 'utf8');
  const found = (0, eval)(src + '; typeof DataGridWeb');
  if (found !== 'function') {
    console.error('datagrid_web.js does not define DataGridWeb when loaded without require()');
    process.exit(1);
  }
" || exit 1

# One classic script declaring its classes globally is fine on its own, but the
# page also loads the WebGL module; scoping keeps the two from colliding if a
# second bundle is ever added beside it.
node --input-type=module -e "
  import fs from 'fs';
  const p = '$OUT/datagrid_web.js';
  const src = fs.readFileSync(p, 'utf8');
  if (!src.startsWith('// scoped')) {
    fs.writeFileSync(p,
      '// scoped: the page loads this beside other scripts, so it publishes one name.\n'
      + '(function () {\n' + src + '\n;globalThis.DataGridWeb = DataGridWeb;\n})();\n');
  }
" || exit 1

cp "$WEB/index.html" "$OUT/index.html"
cp "$WEB/standalone.mjs" "$OUT/standalone.mjs"

mkdir -p "$OUT/gl" "$OUT/fonts"
cp gallery/evg/gl/evg-webgl.js "$OUT/gl/evg-webgl.js"
# The accessibility mirror: the app's own a11y tree, as DOM over the canvas.
cp gallery/evg/gl/evg-a11y.js "$OUT/gl/evg-a11y.js"
# Web Crypto decrypt for password-protected .xlsx (OLE / Agile encryption).
mkdir -p "$OUT/ooxml-encryption"
cp -a gallery/datagrid/src/xlsx/vendor/ooxml-encryption/dist "$OUT/ooxml-encryption/"
cp gallery/datagrid/src/xlsx/vendor/ooxml-encryption/LICENSE "$OUT/ooxml-encryption/LICENSE" 2>/dev/null || true
FONT_SRC=gallery/pdf_writer/assets/fonts
cp "$FONT_SRC/Open_Sans/OpenSans-Regular.ttf" "$OUT/fonts/OpenSans-Regular.ttf"
cp "$FONT_SRC/Open_Sans/OpenSans-Bold.ttf" "$OUT/fonts/OpenSans-Bold.ttf"
cp "$FONT_SRC/Open_Sans/OpenSans-Italic.ttf" "$OUT/fonts/OpenSans-Italic.ttf"
cp "$FONT_SRC/Open_Sans/OpenSans-BoldItalic.ttf" "$OUT/fonts/OpenSans-BoldItalic.ttf"
cp "$FONT_SRC/Noto_Sans/NotoSans-Regular.ttf" "$OUT/fonts/NotoSans-Regular.ttf"
cp "$FONT_SRC/Noto_Sans/NotoSans-Bold.ttf" "$OUT/fonts/NotoSans-Bold.ttf"
cp "$FONT_SRC/Noto_Sans/NotoSans-Italic.ttf" "$OUT/fonts/NotoSans-Italic.ttf"
cp "$FONT_SRC/Noto_Sans/NotoSans-BoldItalic.ttf" "$OUT/fonts/NotoSans-BoldItalic.ttf"
cp "$FONT_SRC/Helvetica/Helvetica.ttf" "$OUT/fonts/Helvetica.ttf"
cp "$FONT_SRC/Droid_Serif/DroidSerif.ttf" "$OUT/fonts/DroidSerif.ttf"
cp "$FONT_SRC/Droid_Serif/DroidSerif-Bold.ttf" "$OUT/fonts/DroidSerif-Bold.ttf"
cp "$FONT_SRC/Droid_Serif/DroidSerif-Italic.ttf" "$OUT/fonts/DroidSerif-Italic.ttf"
cp "$FONT_SRC/Droid_Serif/DroidSerif-BoldItalic.ttf" "$OUT/fonts/DroidSerif-BoldItalic.ttf"
cp "$FONT_SRC/Josefin_Sans/JosefinSans-Regular.ttf" "$OUT/fonts/JosefinSans-Regular.ttf"
cp "$FONT_SRC/Josefin_Sans/JosefinSans-Bold.ttf" "$OUT/fonts/JosefinSans-Bold.ttf"
cp "$FONT_SRC/Josefin_Sans/JosefinSans-Italic.ttf" "$OUT/fonts/JosefinSans-Italic.ttf"
cp "$FONT_SRC/Josefin_Sans/JosefinSans-BoldItalic.ttf" "$OUT/fonts/JosefinSans-BoldItalic.ttf"
# A workbook to open on load. The page reads it with fetch and hands the bytes
# to the app, exactly as it does with a file the user picks.
cp gallery/datagrid/fixtures/business-workbook.xlsx "$OUT/business-workbook.xlsx"

# --- the build stamp ---------------------------------------------------------
# A rebuilt page that a browser will not fetch is indistinguishable from a page
# that was never fixed, and that is exactly what happens here: nothing in this
# output carries a cache header, `python3 -m http.server` sends none, and a
# two-megabyte script tag with no version on it is the kind of thing a browser
# holds on to. So every file the page loads gets `?v=<hash of the build>` — the
# URL changes only when the bytes do — and the same stamp is printed in the
# page's own status bar, so "which build am I looking at" is a thing you read
# rather than a thing you guess.
STAMP=$(node -e "
  const fs = require('fs'), crypto = require('crypto');
  const h = crypto.createHash('sha1');
  for (const f of ['$OUT/datagrid_web.js', '$OUT/standalone.mjs', '$OUT/gl/evg-webgl.js', '$OUT/gl/evg-a11y.js']) {
    h.update(fs.readFileSync(f));
  }
  process.stdout.write(h.digest('hex').slice(0, 10));
")
node -e "
  const fs = require('fs');
  const stamp = '$STAMP';
  const html = fs.readFileSync('$OUT/index.html', 'utf8').split('__BUILD__').join(stamp);
  fs.writeFileSync('$OUT/index.html', html);
  // standalone.mjs imports the renderer itself, so that one needs the query
  // written into the module rather than onto a tag.
  const mjs = fs.readFileSync('$OUT/standalone.mjs', 'utf8')
    .replace('./gl/evg-webgl.js', './gl/evg-webgl.js?v=' + stamp)
    .replace('./gl/evg-a11y.js', './gl/evg-a11y.js?v=' + stamp);
  fs.writeFileSync('$OUT/standalone.mjs', mjs);
" || exit 1
if grep -q "__BUILD__" "$OUT/index.html"; then
  echo "the build stamp was not written into $OUT/index.html" >&2
  exit 1
fi

printf '  %s\n' "$OUT/index.html" "$OUT/datagrid_web.js" "$OUT/standalone.mjs"
echo "build $STAMP"
echo "open it with:  python3 -m http.server -d $OUT 8000"
