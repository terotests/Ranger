#!/usr/bin/env bash
# Build the serverless book editor page.
#
#   npm run book:web                build into gallery/book/web/standalone/dist
#   npm run book:web -- --out DIR   build somewhere else
#
# The output is static: an HTML file, one compiled script, the WebGL renderer,
# four font files and three photographs. Anything that can serve files can
# serve it — there is no host process to run, and a pointer move is a function
# call rather than a round trip.
#
# The compiled script is gallery/book/web/book_web.rgr: BookApp behind a thin
# facade, with no `read_file` on any path the page takes. That is CHECKED here
# rather than assumed — the bundle is loaded with `require` undefined, which is
# what a browser looks like, and asked for its class. A stray file-system call
# at load time would compile fine and fail only when someone opened the page.
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"
WEB=gallery/book/web/standalone
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
rm -f "$OUT/book_web.js"
log=$(node bin/output.js -es6 gallery/book/web/book_web.rgr -d="$OUT" -o=book_web.js 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/book/web/book_web.rgr" >&2
  exit 1
fi
if [ ! -f "$OUT/book_web.js" ]; then
  echo "the compiler reported no failure but wrote no $OUT/book_web.js" >&2
  exit 1
fi

# Loadable by a browser? The EVG stack keeps its file-reading functions — they
# are simply never on this page's path — so the question is whether anything
# CALLS one while the script loads.
node --input-type=module -e "
  import fs from 'fs';
  globalThis.require = undefined;
  const src = fs.readFileSync('$OUT/book_web.js', 'utf8');
  const found = (0, eval)(src + '; typeof BookWeb');
  if (found !== 'function') {
    console.error('book_web.js does not define BookWeb when loaded without require()');
    process.exit(1);
  }
" || exit 1

# One classic script declaring its classes globally is fine on its own, but the
# page also loads the WebGL module; scoping keeps the two from colliding.
node --input-type=module -e "
  import fs from 'fs';
  const p = '$OUT/book_web.js';
  const src = fs.readFileSync(p, 'utf8');
  if (!src.startsWith('// scoped')) {
    fs.writeFileSync(p,
      '// scoped: the page loads this beside other scripts, so it publishes one name.\n'
      + '(function () {\n' + src + '\n;globalThis.BookWeb = BookWeb;\n})();\n');
  }
" || exit 1

cp "$WEB/index.html" "$OUT/index.html"
cp "$WEB/standalone.mjs" "$OUT/standalone.mjs"

mkdir -p "$OUT/gl" "$OUT/fonts" "$OUT/assets"
cp gallery/evg/gl/evg-webgl.js "$OUT/gl/evg-webgl.js"
for face in OpenSans-Regular OpenSans-Bold OpenSans-Italic OpenSans-BoldItalic; do
  cp "gallery/pdf_writer/assets/fonts/Open_Sans/$face.ttf" "$OUT/fonts/$face.ttf"
done
# The display faces. The sample book is typeset, not merely filled in: Cinzel
# for the title and the chapter openings, Josefin Sans for the captions and the
# folios. Measuring and painting both go through them, so they have to be here.
cp gallery/pdf_writer/assets/fonts/Cinzel/Cinzel-Regular.ttf "$OUT/fonts/Cinzel-Regular.ttf"
cp gallery/pdf_writer/assets/fonts/Cinzel/Cinzel-Bold.ttf "$OUT/fonts/Cinzel-Bold.ttf"
cp gallery/pdf_writer/assets/fonts/Josefin_Sans/JosefinSans-Regular.ttf "$OUT/fonts/JosefinSans-Regular.ttf"
cp gallery/pdf_writer/assets/fonts/Josefin_Sans/JosefinSans-Bold.ttf "$OUT/fonts/JosefinSans-Bold.ttf"
# The book's photographs. The page fetches them under the same paths the
# document names, so the display list's `src` is also the texture key.
for img in Example_scaled.jpg GPS_test.jpg Canon_40D_scaled.jpg; do
  cp "gallery/pdf_writer/assets/images/$img" "$OUT/assets/$img"
done
# An iPhoto library index, in miniature. The page can open an album the reader
# drops on it; shipping one means the selftest can drive that path, and means
# there is something to try without owning a Mac.
mkdir -p "$OUT/fixtures"
cp gallery/book/fixtures/AlbumData.xml "$OUT/fixtures/AlbumData.xml"

# --- the build stamp ---------------------------------------------------------
# A rebuilt page a browser will not fetch is indistinguishable from a page that
# was never fixed. Nothing here carries a cache header, so every file the page
# loads gets `?v=<hash of the build>` — the URL changes only when the bytes do
# — and the same stamp is printed in the header, so "which build am I looking
# at" is a thing you read rather than guess.
STAMP=$(node -e "
  const fs = require('fs'), crypto = require('crypto');
  const h = crypto.createHash('sha1');
  for (const f of ['$OUT/book_web.js', '$OUT/standalone.mjs', '$OUT/gl/evg-webgl.js']) h.update(fs.readFileSync(f));
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

printf '  %s\n' "$OUT/index.html" "$OUT/book_web.js" "$OUT/standalone.mjs"
echo "build $STAMP"
echo "open it with:  python3 -m http.server -d $OUT 8000"
