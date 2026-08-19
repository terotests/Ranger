#!/usr/bin/env bash
# Build the serverless DOCX viewer page.
#
#   npm run docx_viewer:web                build into gallery/docx_viewer/web/standalone/dist
#   npm run docx_viewer:web -- --out DIR   build somewhere else
#
# The output is static: an HTML file, one compiled script, the WebGL renderer,
# four font files and a workbook. Anything that can serve files can serve it —
# there is no host process to run.
#
# The compiled script is gallery/docx_viewer/web/docx_web.rgr: GridApp with a
# thin facade and no `read_file` on any path the page takes. That is CHECKED
# here rather than assumed — the bundle is loaded with `require` undefined,
# which is what a browser looks like, and asked for its class. A stray
# file-system call at load time would compile fine and fail only when someone
# opened the page.
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"
WEB=gallery/docx_viewer/web/standalone
OUT="$WEB/dist"

while [ $# -gt 0 ]; do
  case "$1" in
    --out) OUT="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 1 ;;
  esac
done

export RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr
mkdir -p "$OUT"

log=$(node bin/output.js -es6 gallery/docx_viewer/web/docx_web.rgr -d="$OUT" -o=docx_web.js 2>&1)
if echo "$log" | grep -q "Compilation FAILED"; then
  echo "$log" | grep -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile gallery/docx_viewer/web/docx_web.rgr" >&2
  exit 1
fi
if [ ! -f "$OUT/docx_web.js" ]; then
  echo "the compiler reported no failure but wrote no $OUT/docx_web.js" >&2
  exit 1
fi

# Loadable by a browser? The bundle keeps the EVG stack's file-reading
# functions — they are simply never the path this page takes — so the question
# is whether anything CALLS one while the script loads.
node --input-type=module -e "
  import fs from 'fs';
  globalThis.require = undefined;
  const src = fs.readFileSync('$OUT/docx_web.js', 'utf8');
  const found = (0, eval)(src + '; typeof DocxWeb');
  if (found !== 'function') {
    console.error('docx_web.js does not define DocxWeb when loaded without require()');
    process.exit(1);
  }
" || exit 1

# One classic script declaring its classes globally is fine on its own, but the
# page also loads the WebGL module; scoping keeps the two from colliding if a
# second bundle is ever added beside it.
node --input-type=module -e "
  import fs from 'fs';
  const p = '$OUT/docx_web.js';
  const src = fs.readFileSync(p, 'utf8');
  if (!src.startsWith('// scoped')) {
    fs.writeFileSync(p,
      '// scoped: the page loads this beside other scripts, so it publishes one name.\n'
      + '(function () {\n' + src + '\n;globalThis.DocxWeb = DocxWeb;\n})();\n');
  }
" || exit 1

cp "$WEB/index.html" "$OUT/index.html"
cp "$WEB/standalone.mjs" "$OUT/standalone.mjs"

mkdir -p "$OUT/gl" "$OUT/fonts"
cp gallery/evg/gl/evg-webgl.js "$OUT/gl/evg-webgl.js"
for face in OpenSans-Regular OpenSans-Bold OpenSans-Italic OpenSans-BoldItalic; do
  cp "gallery/pdf_writer/assets/fonts/Open_Sans/$face.ttf" "$OUT/fonts/$face.ttf"
done
# A deck to open on load. The page reads it with fetch and hands the bytes to
# the viewer, exactly as it does with a file the user picks.
cp gallery/docx_viewer/fixtures/20-business-report.docx "$OUT/document.docx"

# A chart on the clipboard, so the page's self test can paste one and prove it
# stays a chart here. This is a real copy out of the spreadsheet — the same
# string a Ctrl+C puts on the system clipboard — captured once at build time.
node --input-type=module -e "
  import fs from 'fs';
  import path from 'path';
  const mod = path.resolve('gallery/datagrid/bin/grid_app_module.cjs');
  if (!fs.existsSync(mod)) process.exit(0);
  const require = (await import('node:module')).createRequire(import.meta.url);
  const { GridApp } = require(mod);
  const app = new GridApp();
  app.init(path.resolve('gallery/pdf_writer/assets/fonts'));
  app.model.growTo(6, 3);
  const rows = [['Month','Widgets','Gadgets'],['Jan','120','80'],['Feb','150','95'],['Mar','90','130']];
  rows.forEach((r, y) => r.forEach((v, x) => app.model.setCell(y, x, v)));
  app.sheetView.markDirty();
  app.sheetView.rebuild();
  app.grid.updateVisible(app.model);
  app.sel.anchor.row = 0; app.sel.anchor.col = 0;
  app.sel.active.row = 3; app.sel.active.col = 2;
  app.openChartDialog(0);
  app.chartDialog.setInputValue(311, 'Units by month');
  app.applyChartDialog();
  const panel = app.view.chartLayer.panelAt(0);
  if (app.copyChart(panel.chart.id) > 0) {
    fs.writeFileSync('$OUT/chart-clip.html', app.clipboardHtml);
  }
" 2>/dev/null || true

printf '  %s\n' "$OUT/index.html" "$OUT/docx_web.js" "$OUT/standalone.mjs"
echo "open it with:  python3 -m http.server -d $OUT 8000"
