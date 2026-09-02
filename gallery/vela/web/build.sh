#!/usr/bin/env bash
# Build the paste-a-specification page.
#
#   npm run vela:web            build into gallery/vela/web/dist
#   npm run vela:web -- --out D build somewhere else (the Pages job does this)
#
# The page is one HTML file and one compiled script. The script is
# tools/vela_web.rgr — the runtime, the Vega-Lite compiler and the SVG renderer
# with no `read_file` anywhere in them, which is what makes the output free of
# `require` and therefore loadable by a browser. That is checked here rather
# than assumed: a stray file-system call would compile fine and fail only when
# someone opened the page.
set -e
cd "$(dirname "$0")/../../.."
ROOT="$(pwd)"
WEB=gallery/vela/web
OUT="$WEB/dist"

while [ $# -gt 0 ]; do
  case "$1" in
    --out) OUT="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 1 ;;
  esac
done

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr

# The compiler resolves -d= against the repository root even when it is given
# an absolute path, so it always writes here and the copy below is what
# honours --out. Finding that out the hard way is why the script now checks
# that the file it is about to publish exists.
STAGE=$WEB/dist
mkdir -p "$STAGE" "$OUT"

for tool in vela_web vela_targets; do
  log=$(node bin/output.js -es6 "gallery/vela/tools/$tool.rgr" -d="$STAGE" -o="$tool.js" 2>&1)
  if echo "$log" | grep -q "Compilation FAILED"; then
    echo "$log" | grep -A3 "\[FAIL\]" | head -40
    echo "FAILED to compile gallery/vela/tools/$tool.rgr" >&2
    exit 1
  fi
  if [ ! -f "$STAGE/$tool.js" ]; then
    echo "the compiler reported no failure but wrote no $STAGE/$tool.js" >&2
    echo "$log" | tail -5 >&2
    exit 1
  fi
done

# A browser has no `require`, and a file-system call compiles fine and fails
# only when somebody opens the page. So the bundles are LOADED here, with
# `require` undefined, and asked for the classes the page uses — which is a
# stricter check than grepping, and a truer one: the EVG stack keeps its
# file-reading functions, and they are simply never the path a browser takes.
node --input-type=module -e "
  import fs from 'fs';
  globalThis.require = undefined;
  for (const [file, cls] of [['vela_web.js','VelaWeb'], ['vela_targets.js','VelaTargets']]) {
    const src = fs.readFileSync('$STAGE/' + file, 'utf8');
    const found = (0, eval)(src + '; typeof ' + cls);
    if (found !== 'function') {
      console.error(file + ' does not define ' + cls + ' when loaded without require()');
      process.exit(1);
    }
  }
" || exit 1

# Both bundles carry the whole of Vela — the same VlJson, the same runtime —
# because each was compiled from its own entry point. Two classic scripts
# declaring the same class in one page is a redeclaration error, and the page
# dies before it draws anything. So each is given its own scope and publishes
# only the one class the page asks for. Done after the check above, which wants
# the bundle as the compiler wrote it.
node --input-type=module -e "
  import fs from 'fs';
  for (const [file, cls] of [['vela_web.js','VelaWeb'], ['vela_targets.js','VelaTargets']]) {
    const p = '$STAGE/' + file;
    const src = fs.readFileSync(p, 'utf8');
    if (src.startsWith('// scoped')) continue;
    fs.writeFileSync(p,
      '// scoped: both bundles declare the same classes, so neither may be global.\n'
      + '(function () {\n' + src + '\n;globalThis.' + cls + ' = ' + cls + ';\n})();\n');
  }
" || exit 1

# ---- the chart API, built by each platform's own tool ---------------------
# -apidoc -apipackage writes the package each ecosystem expects, and this runs
# THAT ECOSYSTEM'S OWN TOOL over it: documentation.js, pdoc, Dokka. It is the
# test PLAN_API_DOCS.md 7.3 sets -- the target's own tool reads Ranger's output
# with no Ranger plugin -- so the published site is the evidence rather than a
# claim about it.
#
# Each language is independently optional: a tool that is not installed is
# reported on the index page and its api.json / api.md still go up. Pass
# --require in CI, where a silently missing toolchain would publish a smaller
# site than intended and nobody would notice.
node "$WEB/build-api-docs.mjs" --out "$OUT/api" || {
  echo "FAILED to build the chart API pages" >&2
  exit 1
}
test -s "$OUT/api/index.html" || {
  echo "the API build reported no failure but wrote no $OUT/api/index.html" >&2
  exit 1
}

cp "$WEB/index.html" "$OUT/index.html"
# The GPU viewer, and the faces it draws text with. Both are fetched by the
# page at run time, so both have to sit beside it.
mkdir -p "$OUT/gl/fonts"
cp gallery/evg/gl/evg-webgl.js "$OUT/gl/evg-webgl.js"
for face in NotoSans-Regular NotoSans-Bold; do
  cp "gallery/pdf_writer/assets/fonts/Noto_Sans/$face.ttf" "$OUT/gl/fonts/$face.ttf"
done
# The stand-in data sets, under the names the published examples ask for.
mkdir -p "$OUT/data"
cp "$WEB"/data/* "$OUT/data/"
if [ "$(cd "$OUT" && pwd)" != "$(cd "$STAGE" && pwd)" ]; then
  cp "$STAGE/vela_web.js" "$OUT/vela_web.js"
  cp "$STAGE/vela_targets.js" "$OUT/vela_targets.js"
fi
printf '  %s\n' "$OUT/index.html" "$OUT/vela_web.js" "$OUT/vela_targets.js" "$OUT/gl/evg-webgl.js"
echo "open it with:  python3 -m http.server -d $OUT"
