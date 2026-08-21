#!/usr/bin/env bash
# Build the serverless code-editor page.
#
#   npm run datagrid:editor:web              → gallery/datagrid/web/editor/dist
#   npm run datagrid:editor:web -- --out DIR
#
# The output is static: an HTML file, one compiled script, the WebGL renderer
# and two font files. There is no host process — the editor IS the page.
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"
WEB=gallery/datagrid/web/editor
OUT="$WEB/dist"

while [ $# -gt 0 ]; do
  case "$1" in
    --out) OUT="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 1 ;;
  esac
done

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
mkdir -p "$OUT"

# A previous build's bundle must not survive this one: the check below asks
# whether a bundle is loadable, and a stale file answers yes.
rm -f "$OUT/code_editor_web.js"
log=$(node bin/output.js -es6 gallery/datagrid/web/code_editor_web.rgr -d="$OUT" -o=code_editor_web.js 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/datagrid/web/code_editor_web.rgr" >&2
  exit 1
fi
if [ ! -f "$OUT/code_editor_web.js" ]; then
  echo "the compiler reported no failure but wrote no $OUT/code_editor_web.js" >&2
  exit 1
fi

# Loadable by a browser? The bundle keeps the EVG stack's file-reading
# functions — they are simply never the path this page takes — so the question
# is whether anything CALLS one while the script loads.
node --input-type=module -e "
  import fs from 'fs';
  globalThis.require = undefined;
  const src = fs.readFileSync('$OUT/code_editor_web.js', 'utf8');
  const found = (0, eval)(src + '; typeof CodeEditorWeb');
  if (found !== 'function') {
    console.error('code_editor_web.js does not define CodeEditorWeb without require()');
    process.exit(1);
  }
" || exit 1

node --input-type=module -e "
  import fs from 'fs';
  const p = '$OUT/code_editor_web.js';
  const src = fs.readFileSync(p, 'utf8');
  if (!src.startsWith('// scoped')) {
    fs.writeFileSync(p,
      '// scoped: the page loads this beside other scripts, so it publishes one name.\n'
      + '(function () {\n' + src + '\n;globalThis.CodeEditorWeb = CodeEditorWeb;\n})();\n');
  }
" || exit 1

cp "$WEB/index.html" "$OUT/index.html"
cp "$WEB/editor.mjs" "$OUT/editor.mjs"
mkdir -p "$OUT/gl" "$OUT/fonts"
cp gallery/evg/gl/evg-webgl.js "$OUT/gl/evg-webgl.js"
FONT_SRC=gallery/pdf_writer/assets/fonts
cp "$FONT_SRC/Open_Sans/OpenSans-Regular.ttf" "$OUT/fonts/OpenSans-Regular.ttf"
cp "$FONT_SRC/Open_Sans/OpenSans-Bold.ttf" "$OUT/fonts/OpenSans-Bold.ttf"

printf '  %s\n' "$OUT/index.html" "$OUT/code_editor_web.js" "$OUT/editor.mjs"
echo "open it with:  python3 -m http.server -d $OUT 8001"
