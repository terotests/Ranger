#!/usr/bin/env bash
# Build the serverless markdown page.
#
#   npm run markdown:web              build into gallery/markdown/web/standalone/dist
#   npm run markdown:web -- --out DIR build somewhere else
#
# The output is static: an HTML file, one compiled script, the WebGL renderer,
# six font files and three documents. Anything that can serve files can serve
# it — there is no host process, and a keystroke is a function call rather
# than a round trip.
#
# The compiled script is gallery/markdown/web/markdown_web.rgr: the parser,
# the layout, the diagram reader and the PDF writer behind one facade, with no
# `read_file` on any path the page takes. That is CHECKED here rather than
# assumed — the bundle is loaded with `require` undefined, which is what a
# browser looks like, and asked for its class. A stray file-system call at
# load time would compile fine and fail only when somebody opened the page.
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"
WEB=gallery/markdown/web/standalone
OUT="$WEB/dist"

while [ $# -gt 0 ]; do
  case "$1" in
    --out) OUT="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 1 ;;
  esac
done

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr

# The compiler resolves `-d=` against its working directory, so an ABSOLUTE
# output directory — which is what the Pages workflow passes — lands inside
# the repository instead of where it was asked for, and the build then fails
# saying it wrote nothing. Compile into a fixed staging directory and copy.
STAGE=$WEB/dist
mkdir -p "$STAGE" "$OUT"

# A previous build's bundle must not survive this one: the checks below ask
# whether a bundle is present and loadable, and a stale file answers yes.
rm -f "$STAGE/markdown_web.js"
log=$(node bin/output.js -es6 gallery/markdown/web/markdown_web.rgr -d="$STAGE" -o=markdown_web.js 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/markdown/web/markdown_web.rgr" >&2
  exit 1
fi
if [ ! -f "$STAGE/markdown_web.js" ]; then
  echo "the compiler reported no failure but wrote no $STAGE/markdown_web.js" >&2
  exit 1
fi

# Loadable by a browser? The PDF writer and the font manager keep their
# file-reading functions — they are simply never on this page's path — so the
# question is whether anything CALLS one while the script loads.
node --input-type=module -e "
  import fs from 'fs';
  globalThis.require = undefined;
  const src = fs.readFileSync('$STAGE/markdown_web.js', 'utf8');
  const found = (0, eval)(src + '; typeof MarkdownWeb');
  if (found !== 'function') {
    console.error('markdown_web.js does not define MarkdownWeb when loaded without require()');
    process.exit(1);
  }
" || exit 1

# One classic script declaring its classes globally is fine on its own, but the
# page also loads the WebGL module; scoping keeps the two from colliding.
node --input-type=module -e "
  import fs from 'fs';
  const p = '$STAGE/markdown_web.js';
  const src = fs.readFileSync(p, 'utf8');
  if (!src.startsWith('// scoped')) {
    fs.writeFileSync(p,
      '// scoped: the page loads this beside other scripts, so it publishes one name.\n'
      + '(function () {\n' + src + '\n;globalThis.MarkdownWeb = MarkdownWeb;\n})();\n');
  }
" || exit 1

if [ "$(cd "$OUT" && pwd)" != "$(cd "$STAGE" && pwd)" ]; then
  cp "$STAGE/markdown_web.js" "$OUT/markdown_web.js"
fi

cp "$WEB/index.html" "$OUT/index.html"
cp "$WEB/standalone.mjs" "$OUT/standalone.mjs"

mkdir -p "$OUT/gl" "$OUT/fonts" "$OUT/samples" "$OUT/host"
cp gallery/evg/gl/evg-webgl.js "$OUT/gl/evg-webgl.js"
# The other two editors' browser halves — the SAME files the pptx and docx
# pages load. The PPTX and DOCX tabs are those editors, so what a press or a
# keystroke means there is their module's business, not this page's.
cp gallery/pptx/web/host/pptx-host.mjs "$OUT/host/pptx-host.mjs"
cp gallery/docx_viewer/web/host/docx-host.mjs "$OUT/host/docx-host.mjs"
# The 187 preset shape geometries, for the deck; without them every shape
# nobody typed in comes out as a rectangle.
cp gallery/office/geom/assets/presets.txt "$OUT/presets.txt"

# The faces, under the names the LAYOUT asks for. The variant is part of the
# family name rather than a weight flag, because that is the one spelling the
# TTF measurer, the PDF font manager and a browser `FontFace` all resolve the
# same way — see standalone.mjs.
for face in OpenSans-Regular OpenSans-Bold OpenSans-Italic OpenSans-BoldItalic; do
  cp "gallery/pdf_writer/assets/fonts/Open_Sans/$face.ttf" "$OUT/fonts/$face.ttf"
done
for face in NotoSans-Regular NotoSans-Bold; do
  cp "gallery/pdf_writer/assets/fonts/Noto_Sans/$face.ttf" "$OUT/fonts/$face.ttf"
done

# Something to open. The repository's own README is in here on purpose: it is
# the corpus this parser is tested against, and a page that renders it is a
# page that has met nested lists inside block quotes, tables with inline code,
# and fences containing fences.
cp gallery/markdown/fixtures/mermaid.md "$OUT/samples/mermaid.md"
cp gallery/markdown/fixtures/diagrams.md "$OUT/samples/diagrams.md"
cp gallery/markdown/fixtures/picture.md "$OUT/samples/picture.md"
cp gallery/markdown/fixtures/logo.png "$OUT/samples/logo.png"
cp gallery/markdown/fixtures/deck.md "$OUT/samples/deck.md"
mkdir -p "$OUT/themes"
cp gallery/markdown/fixtures/themes/corporate.css "$OUT/themes/corporate.css"
cp gallery/markdown/fixtures/themes/editorial.css "$OUT/themes/editorial.css"
cp gallery/markdown/fixtures/sample.md "$OUT/samples/sample.md"
cp README.md "$OUT/samples/README.md"

# --- the build stamp ---------------------------------------------------------
# A rebuilt page a browser will not fetch is indistinguishable from a page that
# was never fixed. Nothing here carries a cache header, so every file the page
# loads gets `?v=<hash of the build>` — the URL changes only when the bytes do
# — and the same stamp is printed in the header, so "which build am I looking
# at" is a thing you read rather than guess.
STAMP=$(node -e "
  const fs = require('fs'), crypto = require('crypto');
  const h = crypto.createHash('sha1');
  for (const f of ['$OUT/markdown_web.js', '$OUT/standalone.mjs', '$OUT/gl/evg-webgl.js', '$OUT/host/pptx-host.mjs', '$OUT/host/docx-host.mjs']) h.update(fs.readFileSync(f));
  process.stdout.write(h.digest('hex').slice(0, 10));
")
node -e "
  const fs = require('fs');
  const stamp = '$STAMP';
  fs.writeFileSync('$OUT/index.html',
    fs.readFileSync('$OUT/index.html', 'utf8').split('__BUILD__').join(stamp));
  fs.writeFileSync('$OUT/standalone.mjs',
    fs.readFileSync('$OUT/standalone.mjs', 'utf8')
      .replace('./gl/evg-webgl.js', './gl/evg-webgl.js?v=' + stamp)
      .replace('./host/pptx-host.mjs', './host/pptx-host.mjs?v=' + stamp)
      .replace('./host/docx-host.mjs', './host/docx-host.mjs?v=' + stamp));
" || exit 1
if grep -q "__BUILD__" "$OUT/index.html"; then
  echo "the build stamp was not written into $OUT/index.html" >&2
  exit 1
fi

printf '  %s\n' "$OUT/index.html" "$OUT/markdown_web.js" "$OUT/standalone.mjs"
echo "build $STAMP"
echo "open it with:  python3 -m http.server -d $OUT 8008"
