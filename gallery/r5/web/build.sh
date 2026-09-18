#!/usr/bin/env bash
# Build the r5 page — the markdown editor and viewer as one Ranger app.
#
#   npm run r5:web              build into gallery/r5/web/dist
#   npm run r5:web -- --out DIR build somewhere else
#
# The output is static: an HTML file, one compiled script, the EVG stylesheet
# the app's chrome is drawn from, the WebGL painter and the accessibility
# mirror, the two editors' host modules, six font files and the sample
# documents. Anything that can serve files can serve it.
#
# The compiled script is gallery/r5/src/R5App.rgr: the chrome, the code
# editor and the whole markdown module (`gallery/markdown/web/markdown_web.rgr`
# — parser, layout, diagrams, the slide and Word editors, the PDF writer)
# behind one class. It is CHECKED here to load with `require` undefined,
# which is what a browser looks like.
set -e
cd "$(dirname "$0")/../../.."
ROOT="$(pwd)"
WEB=gallery/r5/web
OUT="$WEB/dist"

while [ $# -gt 0 ]; do
  case "$1" in
    --out) OUT="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 1 ;;
  esac
done

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr

# The compiler resolves `-d=` against its working directory, so compile into
# a fixed staging directory and copy.
STAGE=$WEB/dist
mkdir -p "$STAGE" "$OUT"

rm -f "$STAGE/r5_app.js"
log=$(node bin/output.js -es6 gallery/r5/src/R5App.rgr -d="$STAGE" -o=r5_app.js 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/r5/src/R5App.rgr" >&2
  exit 1
fi
if [ ! -f "$STAGE/r5_app.js" ]; then
  echo "the compiler reported no failure but wrote no $STAGE/r5_app.js" >&2
  exit 1
fi

node --input-type=module -e "
  import fs from 'fs';
  globalThis.require = undefined;
  const src = fs.readFileSync('$STAGE/r5_app.js', 'utf8');
  const found = (0, eval)(src + '; typeof R5App');
  if (found !== 'function') {
    console.error('r5_app.js does not define R5App when loaded without require()');
    process.exit(1);
  }
" || exit 1

# One classic script declaring its classes globally is fine on its own, but
# the page also loads ES modules; scoping keeps the two from colliding.
node --input-type=module -e "
  import fs from 'fs';
  const p = '$STAGE/r5_app.js';
  const src = fs.readFileSync(p, 'utf8');
  if (!src.startsWith('// scoped')) {
    fs.writeFileSync(p,
      '// scoped: the page loads this beside other scripts, so it publishes one name.\n'
      + '(function () {\n' + src + '\n;globalThis.R5App = R5App;\n})();\n');
  }
" || exit 1

if [ "$(cd "$OUT" && pwd)" != "$(cd "$STAGE" && pwd)" ]; then
  cp "$STAGE/r5_app.js" "$OUT/r5_app.js"
fi

cp "$WEB/index.html" "$OUT/index.html"
cp "$WEB/main.js" "$OUT/main.js"
cp "$WEB/r5.css" "$OUT/r5.css"

mkdir -p "$OUT/gl" "$OUT/fonts" "$OUT/samples" "$OUT/host" "$OUT/themes"
cp lib/evg/gl/evg-webgl.js "$OUT/gl/evg-webgl.js"
cp lib/evg/gl/evg-a11y.js "$OUT/gl/evg-a11y.js"
# The other two editors' browser halves — the SAME files the pptx and docx
# pages load. The Slides and Word views are those editors.
cp gallery/pptx/web/host/pptx-host.mjs "$OUT/host/pptx-host.mjs"
cp gallery/docx_viewer/web/host/docx-host.mjs "$OUT/host/docx-host.mjs"
cp gallery/office/geom/assets/presets.txt "$OUT/presets.txt"

for face in OpenSans-Regular OpenSans-Bold OpenSans-Italic OpenSans-BoldItalic; do
  cp "gallery/pdf_writer/assets/fonts/Open_Sans/$face.ttf" "$OUT/fonts/$face.ttf"
done
for face in NotoSans-Regular NotoSans-Bold; do
  cp "gallery/pdf_writer/assets/fonts/Noto_Sans/$face.ttf" "$OUT/fonts/$face.ttf"
done

cp gallery/markdown/fixtures/mermaid.md "$OUT/samples/mermaid.md"
cp gallery/markdown/fixtures/diagrams.md "$OUT/samples/diagrams.md"
cp gallery/markdown/fixtures/picture.md "$OUT/samples/picture.md"
cp gallery/markdown/fixtures/logo.png "$OUT/samples/logo.png"
cp gallery/markdown/fixtures/deck.md "$OUT/samples/deck.md"
cp gallery/markdown/fixtures/sample.md "$OUT/samples/sample.md"
cp README.md "$OUT/samples/README.md"
cp gallery/markdown/fixtures/themes/corporate.css "$OUT/themes/corporate.css"
cp gallery/markdown/fixtures/themes/editorial.css "$OUT/themes/editorial.css"

# --- the build stamp ---------------------------------------------------------
# Nothing here carries a cache header, so every file the page loads gets
# `?v=<hash of the build>` — the URL changes only when the bytes do — and the
# same stamp shows in the menu, so "which build am I looking at" is a thing
# you read rather than guess.
STAMP=$(node -e "
  const fs = require('fs'), crypto = require('crypto');
  const h = crypto.createHash('sha1');
  for (const f of ['$OUT/r5_app.js', '$OUT/main.js', '$OUT/r5.css', '$OUT/gl/evg-webgl.js', '$OUT/gl/evg-a11y.js', '$OUT/host/pptx-host.mjs', '$OUT/host/docx-host.mjs']) h.update(fs.readFileSync(f));
  process.stdout.write(h.digest('hex').slice(0, 10));
")
node -e "
  const fs = require('fs');
  const stamp = '$STAMP';
  fs.writeFileSync('$OUT/index.html',
    fs.readFileSync('$OUT/index.html', 'utf8').split('__BUILD__').join(stamp));
  fs.writeFileSync('$OUT/main.js',
    fs.readFileSync('$OUT/main.js', 'utf8')
      .replace('./gl/evg-webgl.js', './gl/evg-webgl.js?v=' + stamp)
      .replace('./gl/evg-a11y.js', './gl/evg-a11y.js?v=' + stamp)
      .replace('./host/pptx-host.mjs', './host/pptx-host.mjs?v=' + stamp)
      .replace('./host/docx-host.mjs', './host/docx-host.mjs?v=' + stamp)
      .replace('\"./r5.css\"', '\"./r5.css?v=' + stamp + '\"'));
" || exit 1
if grep -q "__BUILD__" "$OUT/index.html"; then
  echo "the build stamp was not written into $OUT/index.html" >&2
  exit 1
fi

printf '  %s\n' "$OUT/index.html" "$OUT/r5_app.js" "$OUT/main.js"
echo "build $STAMP"
echo "open it with:  python3 -m http.server -d $OUT 8009"
