#!/usr/bin/env bash
# Build the .pptx API playground: write a deck in the browser, see it in the
# editor beside the code.
#
#   npm run pptx:playground
#   npm run pptx:playground -- --out DIR
set -e
cd "$(dirname "$0")/../../../.."
WEB=gallery/pptx/web/playground
OUT="$WEB/dist"
while [ $# -gt 0 ]; do
  case "$1" in
    --out) OUT="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 1 ;;
  esac
done
export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
mkdir -p "$OUT/gl" "$OUT/fonts"

# The compiler resolves -d from the REPOSITORY ROOT even when it is given an
# absolute path — it strips the leading slash and writes under ./ — so a build
# into $GITHUB_WORKSPACE/_site lands in ./home/... instead and the script then
# reports no bundle. Compile into a staging directory inside the tree and copy
# out, which is what gallery/vela/web/build.sh does for the same reason.
STAGE="$WEB/.stage"
mkdir -p "$STAGE"
rm -f "$STAGE/pptx_playground.js"
log=$(node bin/output.js -es6 "$WEB/pptx_playground.rgr" -d="$STAGE" -o=pptx_playground.js 2>&1)
# The compiler can print [FAIL] and still exit 0.
if echo "$log" | grep -q "\[FAIL\]"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile $WEB/pptx_playground.rgr" >&2
  exit 1
fi
[ -f "$STAGE/pptx_playground.js" ] || { echo "no bundle written" >&2; exit 1; }

# Loadable by a browser? The bundle keeps the file-reading functions — they are
# simply never on the page's path — so the question is whether anything CALLS
# one while the script loads.
node --input-type=module -e "
  import fs from 'fs';
  globalThis.require = undefined;
  const src = fs.readFileSync('$STAGE/pptx_playground.js', 'utf8');
  const names = (0, eval)(src + '; [typeof PptxPlayground, typeof PptxApi, typeof PptxRenderer, typeof PptxVega, typeof PptxWeb].join(\",\")');
  if (names !== 'function,function,function,function,function') {
    console.error('the bundle does not define all five classes: ' + names);
    process.exit(1);
  }
" || exit 1

# One classic script beside others: publish the names the page uses.
node --input-type=module -e "
  import fs from 'fs';
  const p = '$STAGE/pptx_playground.js';
  const src = fs.readFileSync(p, 'utf8');
  if (!src.startsWith('// scoped')) {
    fs.writeFileSync(p,
      '// scoped: the page loads this beside other scripts, so it publishes named globals.\n'
      + '(function () {\n' + src
      + '\n;globalThis.PptxPlayground = PptxPlayground;'
      + '\n;globalThis.PptxApi = PptxApi;'
      + '\n;globalThis.PptxRenderer = PptxRenderer;'
      + '\n;globalThis.PptxVega = PptxVega;'
      + '\n;globalThis.PptxWeb = PptxWeb;\n})();\n');
  }
" || exit 1

cp "$STAGE/pptx_playground.js" "$OUT/pptx_playground.js"
cp "$WEB/index.html" "$OUT/index.html"
cp "$WEB/playground.mjs" "$OUT/playground.mjs"
cp gallery/evg/gl/evg-webgl.js "$OUT/gl/evg-webgl.js"
for face in Open_Sans/OpenSans-Regular Open_Sans/OpenSans-Bold Open_Sans/OpenSans-Italic \
            Open_Sans/OpenSans-BoldItalic Noto_Emoji/NotoEmoji-Regular Noto_Sans/NotoSans-Regular \
            El_Messiri/ElMessiri-Regular El_Messiri/ElMessiri-Bold; do
  cp "gallery/pdf_writer/assets/fonts/$face.ttf" "$OUT/fonts/$(basename "$face").ttf"
done
cp gallery/office/geom/assets/presets.txt "$OUT/presets.txt"

STAMP=$(node -e "
  const fs=require('fs'),c=require('crypto');const h=c.createHash('sha1');
  for (const f of ['$STAGE/pptx_playground.js','$OUT/playground.mjs','$OUT/gl/evg-webgl.js']) h.update(fs.readFileSync(f));
  process.stdout.write(h.digest('hex').slice(0,10));
")
node -e "
  const fs=require('fs');
  fs.writeFileSync('$OUT/index.html', fs.readFileSync('$OUT/index.html','utf8').split('__BUILD__').join('$STAMP'));
"
printf '  %s\n' "$OUT/index.html" "$OUT/pptx_playground.js"
echo "build $STAMP"
