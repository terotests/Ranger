#!/usr/bin/env bash
# Build the serverless Fig viewer.
#
#   npm run figma:web                -> gallery/figma/web/standalone/dist
#   npm run figma:web -- --out DIR
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"
WEB=gallery/figma/web/standalone
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
rm -f "$STAGE/fig_web.js"

log=$(node bin/output.js -es6 gallery/figma/web/fig_web.rgr -d="$STAGE" -o=fig_web.js 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/figma/web/fig_web.rgr" >&2
  exit 1
fi
if [ ! -f "$STAGE/fig_web.js" ]; then
  echo "the compiler reported no failure but wrote no $STAGE/fig_web.js" >&2
  exit 1
fi

node --input-type=module -e "
  import fs from 'fs';
  globalThis.require = undefined;
  const src = fs.readFileSync('$STAGE/fig_web.js', 'utf8');
  const found = (0, eval)(src + '; typeof FigWeb');
  if (found !== 'function') {
    console.error('fig_web.js does not define FigWeb when loaded without require()');
    process.exit(1);
  }
" || exit 1

node --input-type=module -e "
  import fs from 'fs';
  const p = '$STAGE/fig_web.js';
  const src = fs.readFileSync(p, 'utf8');
  if (!src.startsWith('// scoped')) {
    fs.writeFileSync(p,
      '// scoped: the page loads this beside other scripts, so it publishes one name.\\n'
      + '(function () {\\n' + src + '\\n;globalThis.FigWeb = FigWeb;\\n})();\\n');
  }
" || exit 1

if [ "$(cd "$OUT" && pwd)" != "$(cd "$STAGE" && pwd)" ]; then
  mkdir -p "$OUT"
  cp "$STAGE/fig_web.js" "$OUT/fig_web.js"
fi

cp "$WEB/index.html" "$OUT/index.html"
cp "$WEB/standalone.mjs" "$OUT/standalone.mjs"
cp "$WEB/zstd.mjs" "$OUT/zstd.mjs"
cp "$WEB/openfig-compare.mjs" "$OUT/openfig-compare.mjs"
mkdir -p "$OUT/vendor" "$OUT/gl" "$OUT/fonts"
cp gallery/figma/web/vendor/fzstd.mjs "$OUT/vendor/fzstd.mjs"
cp gallery/figma/web/vendor/LICENSE-fzstd "$OUT/vendor/LICENSE-fzstd"
cp gallery/evg/gl/evg-webgl.js "$OUT/gl/evg-webgl.js"
for face in OpenSans-Regular OpenSans-Bold OpenSans-Italic OpenSans-BoldItalic; do
  cp "gallery/pdf_writer/assets/fonts/Open_Sans/$face.ttf" "$OUT/fonts/$face.ttf"
done

STAMP=$(node -e "
  const fs = require('fs'), crypto = require('crypto');
  const h = crypto.createHash('sha1');
  for (const f of ['$OUT/fig_web.js', '$OUT/standalone.mjs', '$OUT/gl/evg-webgl.js', '$OUT/vendor/fzstd.mjs']) h.update(fs.readFileSync(f));
  process.stdout.write(h.digest('hex').slice(0, 10));
")
node -e "
  const fs = require('fs');
  const stamp = '$STAMP';
  fs.writeFileSync('$OUT/index.html',
    fs.readFileSync('$OUT/index.html', 'utf8').split('__BUILD__').join(stamp));
" || exit 1
if grep -q "__BUILD__" "$OUT/index.html"; then
  echo "the build stamp was not written into $OUT/index.html" >&2
  exit 1
fi

printf '  %s\n' "$OUT/index.html" "$OUT/fig_web.js" "$OUT/standalone.mjs"
echo "build $STAMP"
echo "open it with:  python3 -m http.server -d $OUT 8010"
