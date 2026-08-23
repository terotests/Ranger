#!/usr/bin/env bash
# Build the serverless RangerDBViewer page.
#
#   npm run rangerdbviewer:web                build into web/standalone/dist
#   npm run rangerdbviewer:web -- --out DIR   build somewhere else
#
# The output is static: an HTML file, one compiled script, the shared WebGL
# renderer and four font files. Anything that can serve files can serve it —
# there is no host process, and there is no database server either. The engine
# in the page is RangerDB, which is written in Ranger and therefore compiles
# into the bundle along with the viewer above it.
#
# The compiled script is web/rangerdbviewer_web.rgr: the frame behind a facade,
# with no `read_file` on any path the page takes. That is CHECKED here rather
# than assumed — the bundle is loaded with `require` undefined, which is what a
# browser looks like, and asked for its class. A stray file-system call at load
# time would compile fine and fail only when somebody opened the page.
set -e
cd "$(dirname "$0")/../../../.."
WEB=gallery/rangerdbviewer/web/standalone
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
rm -f "$OUT/rangerdbviewer_web.js"
log=$(node bin/output.js -es6 gallery/rangerdbviewer/web/rangerdbviewer_web.rgr -d="$OUT" -o=rangerdbviewer_web.js 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/rangerdbviewer/web/rangerdbviewer_web.rgr" >&2
  exit 1
fi
if [ ! -f "$OUT/rangerdbviewer_web.js" ]; then
  echo "the compiler reported no failure but wrote no $OUT/rangerdbviewer_web.js" >&2
  exit 1
fi

# Loadable by a browser? The bundle keeps the EVG stack's file-reading
# functions — they are simply never the path this page takes — so the question
# is whether anything CALLS one while the script loads.
node --input-type=module -e "
  import fs from 'fs';
  globalThis.require = undefined;
  const src = fs.readFileSync('$OUT/rangerdbviewer_web.js', 'utf8');
  const found = (0, eval)(src + '; typeof RangerDbViewerWeb');
  if (found !== 'function') {
    console.error('rangerdbviewer_web.js does not define RangerDbViewerWeb when loaded without require()');
    process.exit(1);
  }
" || exit 1

# …and RUNNABLE by one. The database engine is in the bundle, so a page that
# loads and then throws on its first frame is a real risk: the host-SQL bridge
# reaches for `require` the moment anything asks whether SQLite is installed.
# This opens the demo, draws a frame and presses the SQLite button, which is
# the one that would explode.
node --input-type=module -e "
  import fs from 'fs';
  globalThis.require = undefined;
  const src = fs.readFileSync('$OUT/rangerdbviewer_web.js', 'utf8');
  const Cls = (0, eval)(src + '; RangerDbViewerWeb');
  const w = new Cls();
  w.start(1200, 800);
  if ((w.tableCount() | 0) < 5) {
    console.error('the in-tab database opened with ' + w.tableCount() + ' tables');
    process.exit(1);
  }
  if (JSON.parse(w.scene()).list.cmds.length < 50) {
    console.error('the first frame drew almost nothing');
    process.exit(1);
  }
  w.run('engine.sqlite', '');
  if (!w.note().length) {
    console.error('pressing SQLite in a page said nothing about needing a host');
    process.exit(1);
  }
" || exit 1

# One classic script declaring its classes globally is fine on its own, but the
# page also loads the WebGL module; scoping keeps the two from colliding.
node --input-type=module -e "
  import fs from 'fs';
  const p = '$OUT/rangerdbviewer_web.js';
  const src = fs.readFileSync(p, 'utf8');
  if (!src.startsWith('// scoped')) {
    fs.writeFileSync(p,
      '// scoped: the page loads this beside other scripts, so it publishes one name.\n'
      + '(function () {\n' + src + '\n;globalThis.RangerDbViewerWeb = RangerDbViewerWeb;\n})();\n');
  }
" || exit 1

cp "$WEB/index.html" "$OUT/index.html"
cp "$WEB/standalone.mjs" "$OUT/standalone.mjs"
cp "$WEB/selftest.mjs" "$OUT/selftest.mjs"

mkdir -p "$OUT/gl" "$OUT/fonts"
cp gallery/evg/gl/evg-webgl.js "$OUT/gl/evg-webgl.js"
for face in OpenSans-Regular OpenSans-Bold OpenSans-Italic OpenSans-BoldItalic; do
  cp "gallery/pdf_writer/assets/fonts/Open_Sans/$face.ttf" "$OUT/fonts/$face.ttf"
done

# --- the build stamp ---------------------------------------------------------
# A rebuilt page that a browser will not fetch is indistinguishable from a page
# that was never fixed. Nothing in this output carries a cache header and
# `python3 -m http.server` sends none, so every file the page loads gets
# `?v=<hash of the build>` — the URL changes only when the bytes do — and the
# same stamp is printed in the page's footer.
STAMP=$(node -e "
  const fs = require('fs'), crypto = require('crypto');
  const h = crypto.createHash('sha1');
  for (const f of ['$OUT/rangerdbviewer_web.js', '$OUT/standalone.mjs', '$OUT/gl/evg-webgl.js']) {
    h.update(fs.readFileSync(f));
  }
  process.stdout.write(h.digest('hex').slice(0, 10));
")
node -e "
  const fs = require('fs');
  const stamp = '$STAMP';
  const html = fs.readFileSync('$OUT/index.html', 'utf8').split('__BUILD__').join(stamp);
  fs.writeFileSync('$OUT/index.html', html);
  const mjs = fs.readFileSync('$OUT/standalone.mjs', 'utf8')
    .replace('./gl/evg-webgl.js', './gl/evg-webgl.js?v=' + stamp);
  fs.writeFileSync('$OUT/standalone.mjs', mjs);
" || exit 1
if grep -q "__BUILD__" "$OUT/index.html"; then
  echo "the build stamp was not written into $OUT/index.html" >&2
  exit 1
fi

printf '  %s\n' "$OUT/index.html" "$OUT/rangerdbviewer_web.js" "$OUT/standalone.mjs"
echo "build $STAMP"
echo "open it with:  python3 -m http.server -d $OUT 8080"
