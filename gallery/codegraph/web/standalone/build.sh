#!/usr/bin/env bash
# Build the serverless CodeGraph page (VirtualCompiler + examples in the tab).
#
#   npm run codegraph:web                build into web/standalone/dist
#   npm run codegraph:web -- --out DIR   build somewhere else
set -e
cd "$(dirname "$0")/../../../.."
WEB=gallery/codegraph/web/standalone
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

rm -f "$STAGE/codegraph_web.js"
# Do not pass -client: it injects RangerAppService and currently corrupts the
# next operator class line in ES6 output (classRangerAppServiceclass operatorsOf).
log=$(node bin/output.js -es6 gallery/codegraph/web/codegraph_web.rgr -d="$STAGE" -o=codegraph_web.js 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/codegraph/web/codegraph_web.rgr" >&2
  exit 1
fi
if [ ! -f "$STAGE/codegraph_web.js" ]; then
  echo "the compiler reported no failure but wrote no $STAGE/codegraph_web.js" >&2
  exit 1
fi
if grep -q "classRangerAppServiceclass" "$STAGE/codegraph_web.js"; then
  echo "Invalid browser bundle (client-service class merge bug)." >&2
  exit 1
fi
if ! grep -q "VirtualCompiler" "$STAGE/codegraph_web.js"; then
  echo "codegraph_web.js does not contain VirtualCompiler" >&2
  exit 1
fi

# Load-time must not need a real Node filesystem; runtime analyze uses the shim.
node --input-type=module -e "
  import fs from 'fs';
  const shim = fs.readFileSync('$WEB/node-shim.js', 'utf8');
  (0, eval)(shim);
  const src = fs.readFileSync('$STAGE/codegraph_web.js', 'utf8');
  const found = (0, eval)(src + '; typeof CodeGraphWeb');
  if (found !== 'function') {
    console.error('codegraph_web.js does not define CodeGraphWeb with the node shim');
    process.exit(1);
  }
" || exit 1

node --input-type=module -e "
  import fs from 'fs';
  const p = '$STAGE/codegraph_web.js';
  const src = fs.readFileSync(p, 'utf8');
  if (!src.startsWith('// scoped')) {
    fs.writeFileSync(p,
      '// scoped: the page loads this beside other scripts, so it publishes one name.\n'
      + '(function () {\n' + src + '\n;globalThis.CodeGraphWeb = CodeGraphWeb;\n})();\n');
  }
" || exit 1

if [ "$(cd "$OUT" && pwd)" != "$(cd "$STAGE" && pwd)" ]; then
  cp "$STAGE/codegraph_web.js" "$OUT/codegraph_web.js"
fi

cp "$WEB/index.html" "$OUT/index.html"
cp "$WEB/standalone.mjs" "$OUT/standalone.mjs"
cp "$WEB/node-shim.js" "$OUT/node-shim.js"
mkdir -p "$OUT/gl" "$OUT/fonts" "$OUT/evg" "$OUT/examples"
cp gallery/evg/gl/evg-webgl.js "$OUT/gl/evg-webgl.js"
cp gallery/evg/gl/evg-view.js "$OUT/gl/evg-view.js"
cp gallery/evg/web/tools/assets-client.mjs "$OUT/evg/assets-client.mjs"
cp gallery/codegraph/fixtures/*.rgr "$OUT/examples/"
FONT_SRC=gallery/pdf_writer/assets/fonts/Noto_Sans
cp "$FONT_SRC/NotoSans-Regular.ttf" "$OUT/fonts/NotoSans-Regular.ttf"
cp "$FONT_SRC/NotoSans-Bold.ttf" "$OUT/fonts/NotoSans-Bold.ttf"
cp "$FONT_SRC/NotoSans-Italic.ttf" "$OUT/fonts/NotoSans-Italic.ttf"

node "$WEB/build-compile-env.mjs" "$OUT/compileEnv.json"

STAMP=$(node -e "
  const fs = require('fs'), crypto = require('crypto');
  const h = crypto.createHash('sha1');
  for (const f of ['$OUT/codegraph_web.js', '$OUT/standalone.mjs', '$OUT/node-shim.js', '$OUT/gl/evg-webgl.js', '$OUT/gl/evg-view.js']) {
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
    .replace('./gl/evg-webgl.js', './gl/evg-webgl.js?v=' + stamp)
    .replace('./gl/evg-view.js', './gl/evg-view.js?v=' + stamp);
  fs.writeFileSync('$OUT/standalone.mjs', mjs);
" || exit 1

# The VirtualCompiler bundle is megabytes; minifying it is slow and the
# playground ships its compiler unminified for the same reason.
BYTES=$(wc -c < "$OUT/codegraph_web.js" | tr -d ' ')
if [ "$BYTES" -lt 2000000 ]; then
  node gallery/evg/web/tools/minify.mjs --file "$OUT/codegraph_web.js" --keep CodeGraphWeb || exit 1
else
  echo "  skip minify ($BYTES bytes — VirtualCompiler bundle)"
fi

node gallery/evg/web/tools/inline-assets.mjs \
  --html "$OUT/index.html" \
  --preload-stamped "standalone.mjs,gl/evg-webgl.js,gl/evg-view.js" \
  --preload "evg/assets-client.mjs,compileEnv.json,examples/calls.rgr" \
  --stamp "$STAMP" || exit 1

if grep -q "__BUILD__" "$OUT/index.html"; then
  echo "the build stamp was not written into $OUT/index.html" >&2
  exit 1
fi

node "$WEB/vc-node.mjs" "$OUT" || exit 1

printf '  %s\n' "$OUT/index.html" "$OUT/codegraph_web.js" "$OUT/standalone.mjs" "$OUT/compileEnv.json"
echo "build $STAMP"
echo "open it with:  python3 -m http.server -d $OUT 8081"
