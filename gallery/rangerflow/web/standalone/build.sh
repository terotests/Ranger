#!/usr/bin/env bash
# Build the serverless RangerFlow page.
#
#   npm run rangerflow:web                build into web/standalone/dist
#   npm run rangerflow:web -- --out DIR   build somewhere else
#
# The output is static: an HTML file, one compiled script, the shared WebGL
# renderer, three font files and a schema. Anything that can serve files can
# serve it — there is no host process.
#
# The compiled script is web/rangerflow_web.rgr: the editor behind a facade,
# with no `read_file` on any path the page takes. That is CHECKED here rather
# than assumed — the bundle is loaded with `require` undefined, which is what a
# browser looks like, and asked for its class.
set -e
cd "$(dirname "$0")/../../../.."
WEB=gallery/rangerflow/web/standalone
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
rm -f "$OUT/rangerflow_web.js"
log=$(node bin/output.js -es6 gallery/rangerflow/web/rangerflow_web.rgr -d="$OUT" -o=rangerflow_web.js 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/rangerflow/web/rangerflow_web.rgr" >&2
  exit 1
fi
if [ ! -f "$OUT/rangerflow_web.js" ]; then
  echo "the compiler reported no failure but wrote no $OUT/rangerflow_web.js" >&2
  exit 1
fi

node --input-type=module -e "
  import fs from 'fs';
  globalThis.require = undefined;
  const src = fs.readFileSync('$OUT/rangerflow_web.js', 'utf8');
  const found = (0, eval)(src + '; typeof RangerFlowWeb');
  if (found !== 'function') {
    console.error('rangerflow_web.js does not define RangerFlowWeb when loaded without require()');
    process.exit(1);
  }
" || exit 1

# One classic script declaring its classes globally is fine on its own, but the
# page also loads the WebGL module; scoping keeps the two from colliding.
node --input-type=module -e "
  import fs from 'fs';
  const p = '$OUT/rangerflow_web.js';
  const src = fs.readFileSync(p, 'utf8');
  if (!src.startsWith('// scoped')) {
    fs.writeFileSync(p,
      '// scoped: the page loads this beside other scripts, so it publishes one name.\n'
      + '(function () {\n' + src + '\n;globalThis.RangerFlowWeb = RangerFlowWeb;\n})();\n');
  }
" || exit 1

cp "$WEB/index.html" "$OUT/index.html"
cp "$WEB/standalone.mjs" "$OUT/standalone.mjs"
mkdir -p "$OUT/gl" "$OUT/fonts"
cp gallery/evg/gl/evg-webgl.js "$OUT/gl/evg-webgl.js"
FONT_SRC=gallery/pdf_writer/assets/fonts/Noto_Sans
cp "$FONT_SRC/NotoSans-Regular.ttf" "$OUT/fonts/NotoSans-Regular.ttf"
cp "$FONT_SRC/NotoSans-Bold.ttf" "$OUT/fonts/NotoSans-Bold.ttf"
cp "$FONT_SRC/NotoSans-Italic.ttf" "$OUT/fonts/NotoSans-Italic.ttf"
cp gallery/rangerflow/fixtures/ecommerce.sql "$OUT/ecommerce.sql"

# --- the build stamp ---------------------------------------------------------
# Nothing in this output carries a cache header and `python3 -m http.server`
# sends none, so every file the page loads gets `?v=<hash of the build>` — the
# URL changes only when the bytes do — and the same stamp is printed in the
# page's footer, so "which build am I looking at" is read rather than guessed.
STAMP=$(node -e "
  const fs = require('fs'), crypto = require('crypto');
  const h = crypto.createHash('sha1');
  for (const f of ['$OUT/rangerflow_web.js', '$OUT/standalone.mjs', '$OUT/gl/evg-webgl.js']) {
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

printf '  %s\n' "$OUT/index.html" "$OUT/rangerflow_web.js" "$OUT/standalone.mjs"
echo "build $STAMP"
echo "open it with:  python3 -m http.server -d $OUT 8080"
