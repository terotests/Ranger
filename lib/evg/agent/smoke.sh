#!/usr/bin/env bash
#
# The four verbs, against the fixtures. Guards the CLI itself: EVGPatch has a
# suite, but nothing else would notice a verb that stopped parsing its flags,
# printed the compiler's chatter onto stdout, or quietly found nothing.
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../../.." && pwd)
cd "$root"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

fail() { echo "SMOKE FAIL: $1" >&2; exit 1; }

# outline: every node, and the truncation notice when there is more
out=$(npm run --silent agent -- outline lib/evg/agent/fixtures/card.evg.json)
echo "$out" | grep -q '0/0/k:title' || fail "outline lost the keyed path"
echo "$out" | grep -q 'Orders'      || fail "outline lost the text"
npm run --silent agent -- outline lib/evg/agent/fixtures/card.evg.json --depth=1 \
  | grep -q 'deeper nodes not shown' || fail "outline truncated in silence"

# query: JSON, and only the two cards
npm run --silent agent -- query lib/evg/agent/fixtures/card.evg.json .card \
  | grep -q '"count":2' || fail "query did not find both cards"

# measure: finds all four defects in the broken fixture, and none in the good one
found=$(npm run --silent agent -- measure lib/evg/agent/fixtures/broken.evg.json --width=600 --height=300)
echo "$found" | grep -q '"count":4' || fail "measure did not find the four defects: $found"
npm run --silent agent -- measure lib/evg/agent/fixtures/card.evg.json --width=600 --height=400 \
  | grep -q '"count":0' || fail "measure reported a defect in a sound document"

# the numbers, not just the verdict: an overlap says by how much, and a sound
# document still says how much room is left under its content
echo "$found" | grep -q 'overlap by 100×40' || fail "overlap did not carry the amount: $found"
npm run --silent agent -- measure lib/evg/agent/fixtures/card.evg.json --width=600 --height=400 \
  | grep -q '"bottomFree"' || fail "measure did not report the free space"

# a control somebody DREW. The fixture holds two switches that lay out the
# same: one made of boxes, one that says `role: switch`. The first is named
# with its path, the second is not — a document that declares what a node IS
# is the whole difference, and it is what a kit's control carries.
drawn=$(npm run --silent agent -- measure lib/evg/agent/fixtures/drawn.evg.json --width=390 --height=200)
echo "$drawn" | grep -q '"drawn"' || fail "measure did not notice a drawn switch: $drawn"
echo "$drawn" | grep -q '0/0/1: a pill with a knob' || fail "the drawn switch was not named by its path: $drawn"
echo "$drawn" | grep -q '0/1/0: a pill' && fail "a control that declares its role was reported as drawn: $drawn"
echo "$drawn" | grep -q '"count":0' || fail "a drawn control is not a layout defect and must not move count: $drawn"

# alignment: the defect every other check passes. A stack that shares no edge,
# and an overlay one padding to the right of the column it floats over.
cat > "$work/ragged.evg.json" <<'JSON'
{"evg":1,"root":{"tag":"div","props":{"display":"flex","width":"390px","height":"844px","padding-left":"16px","padding-right":"16px","gap":"8px"},"children":[
  {"tag":"div","props":{"width":"200px","height":"40px","margin-left":"20px"}},
  {"tag":"div","props":{"width":"200px","height":"40px","margin-left":"60px"}},
  {"tag":"div","props":{"width":"200px","height":"40px","margin-left":"4px"}}
]}}
JSON
ragged=$(npm run --silent agent -- measure "$work/ragged.evg.json")
echo "$ragged" | grep -q '"count":0' || fail "the ragged fixture should have no DEFECT: $ragged"
echo "$ragged" | grep -q 'share no edge' || fail "measure did not notice the ragged column: $ragged"

# the overlay case: the column is tidy, the bar floating over it is one padding
# to the right, and every other check passes it
cat > "$work/bar.evg.json" <<'JSON'
{"evg":1,"root":{"tag":"div","props":{"display":"flex","width":"390px","height":"844px","padding-left":"16px","padding-right":"16px","gap":"8px"},"children":[
  {"tag":"div","props":{"height":"40px"}},
  {"tag":"div","props":{"height":"40px"}},
  {"tag":"div","props":{"position":"absolute","left":"16px","bottom":"16px","width":"358px","height":"52px"}}
]}}
JSON
bar=$(npm run --silent agent -- measure "$work/bar.evg.json")
echo "$bar" | grep -q '"count":0' || fail "the overlay fixture should have no DEFECT: $bar"
echo "$bar" | grep -q 'one padding' \
  || fail "measure did not notice the overlay one padding off: $bar"
if npm run --silent agent -- measure lib/evg/agent/fixtures/card.evg.json | grep -q '"align"'; then
  fail "a tidy document must not report alignment noise"
fi

# --boxes: where each node really is, and how far the next one starts
boxes=$(npm run --silent agent -- measure lib/evg/agent/fixtures/card.evg.json --boxes --at=0)
echo "$boxes" | grep -q '"gapNext"' || fail "--boxes did not report a distance: $boxes"
echo "$boxes" | grep -q '"x":' || fail "--boxes did not report positions"
if npm run --silent agent -- measure lib/evg/agent/fixtures/card.evg.json | grep -q '"boxes"'; then
  fail "boxes should cost nothing unless asked for"
fi

# patch: applies, writes, and the inverse puts it back
cp lib/evg/agent/fixtures/card.evg.json "$work/doc.json"
cat > "$work/ops.json" <<'JSON'
{"ops":[
  {"op":"set-text","at":"0/0/k:title","value":"Invoices"},
  {"op":"set-prop","at":"0/0","prop":"border-width","value":"1px"}
]}
JSON
npm run --silent agent -- patch "$work/doc.json" "$work/ops.json" | grep -q '"applied":2' \
  || fail "patch did not apply"
npm run --silent agent -- outline "$work/doc.json" | grep -q 'Invoices' || fail "the edit did not land"

# patch answers with the layout it produced, without being asked: an agent that
# patches and stops has changed a picture it cannot see
cat > "$work/tint.json" <<'JSON'
{"ops":[
  {"op":"set-prop","at":"0/0","prop":"background-color","value":"rgb(255,251,235)"}
]}
JSON
cp lib/evg/agent/fixtures/broken.evg.json "$work/broken.json"
told=$(npm run --silent agent -- patch "$work/broken.json" "$work/tint.json")
echo "$told" | grep -q '"layout"' || fail "patch did not report the layout: $told"
echo "$told" | grep -q 'overlap by' \
  || fail "patch did not name the defect in the document it just wrote: $told"
echo "$told" | grep -q '"count":4' \
  || fail "patch's layout count is not the measure's: $told"

cat > "$work/undo.json" <<'JSON'
{"ops":[
  {"op":"set-prop","at":"0/0","prop":"border-width","value":""},
  {"op":"set-text","at":"0/0/k:title","value":"Orders"}
]}
JSON
npm run --silent agent -- patch "$work/doc.json" "$work/undo.json" > /dev/null
npm run --silent agent -- outline "$work/doc.json" > "$work/after.txt"
cp lib/evg/agent/fixtures/card.evg.json "$work/orig.json"
npm run --silent agent -- outline "$work/orig.json" > "$work/before.txt"
diff -q "$work/before.txt" "$work/after.txt" > /dev/null || fail "the inverse did not restore the document"

# an op that lands on the tag default: applied, absent from the file, and SAID
# so. EVG divs are flex-direction: column, so setting column on one removes the
# line rather than adding it, and an agent that only re-reads the file decides
# the tool dropped its edit.
cat > "$work/dflt.json" <<'JSON'
{"ops":[
  {"op":"set-prop","at":"0/0","prop":"flex-direction","value":"column"}
]}
JSON
said=$(npm run --silent agent -- patch "$work/doc.json" "$work/dflt.json")
echo "$said" | grep -q '"atDefault"' || fail "patch did not report the default-valued op: $said"
echo "$said" | grep -q '"prop":"flex-direction"' || fail "atDefault did not name the property"
if npm run --silent agent -- outline "$work/doc.json" | grep -q 'flex-direction=column'; then
  fail "a default should not be written — the note is what carries it"
fi
cat > "$work/back.json" <<'JSON'
{"ops":[
  {"op":"set-prop","at":"0/0","prop":"flex-direction","value":"row"}
]}
JSON
if npm run --silent agent -- patch "$work/doc.json" "$work/back.json" | grep -q '"atDefault"'; then
  fail "a value that is not the default must not be reported as one"
fi
npm run --silent agent -- outline "$work/doc.json" | grep -q 'flex-direction=row' \
  || fail "a non-default flex-direction did not survive the write"
cp lib/evg/agent/fixtures/card.evg.json "$work/doc.json"

# a rejected op leaves the document alone
cat > "$work/bad.json" <<'JSON'
{"ops":[
  {"op":"set-prop","at":"0/0","prop":"border-width","value":"2px"},
  {"op":"set-prop","at":"0/0","prop":"aspect-ratio","value":"16/9"}
]}
JSON
npm run --silent agent -- patch "$work/doc.json" "$work/bad.json" | grep -q '"ok":false' \
  || fail "an unknown property was accepted"
npm run --silent agent -- outline "$work/doc.json" > "$work/unchanged.txt"
diff -q "$work/before.txt" "$work/unchanged.txt" > /dev/null \
  || fail "a rejected batch still changed the document"

# a bitmap, through the tracer and into the document. The picture must arrive
# as vector the document can hold, and the palette must be countable — an agent
# that cannot see the photograph has to be able to theme a screen from it.
if [ ! -f lib/evg/bin/evg_image_tool.js ]; then
  echo "building evg_image_tool…"
  npm run --silent agent:image > "$work/image-build.log" 2>&1 \
    || { tail -20 "$work/image-build.log"; fail "could not build evg_image_tool"; }
fi
cp lib/evg/web/tracer/sample.png "$work/shot.png"
traced=$(cd "$work" && node "$root/lib/evg/bin/evg_image_tool.js" shot.png --out=shot --width=180)
echo "$traced" | grep -q '"colors"' || fail "the tracer reported no palette: $traced"
echo "$traced" | grep -q '"share"' || fail "the palette has no shares: $traced"
[ -f "$work/shot.svg" ] || fail "no traced SVG"
[ -f "$work/shot.ops.json" ] || fail "no ops file to insert the picture with"
cp lib/evg/agent/fixtures/card.evg.json "$work/pic.json"
npm run --silent agent -- patch "$work/pic.json" "$work/shot.ops.json" | grep -q '"ok":true' \
  || fail "the traced picture would not apply"
npm run --silent agent -- outline "$work/pic.json" | grep -q '^0/0 *svg' \
  || fail "the picture is not in the document as an svg node"

# a two-stop gradient, which EVG spells two ways and the painters used to know
# only one of: `gradient-from` / `gradient-to` is what the display list, the GPU
# backend and the Figma importer all speak, and it drew on the GPU and nowhere
# else. A flat render means the pair is being ignored again.
npm run --silent agent:render -- lib/evg/agent/fixtures/gradient.evg.json "$work/grad.png" -w 400 -h 260 > /dev/null 2>&1
[ -f "$work/grad.png" ] || fail "the gradient fixture did not render"
distinct=$(node -e '
const fs=require("fs"),zlib=require("zlib");
const d=fs.readFileSync(process.argv[1]);
// walk the IDAT chunks, inflate, and count distinct colours on one scanline
let i=8,idat=[];
while(i<d.length){const len=d.readUInt32BE(i);const t=d.toString("latin1",i+4,i+8);
if(t==="IDAT")idat.push(d.subarray(i+8,i+8+len));i+=12+len;}
const raw=zlib.inflateSync(Buffer.concat(idat));
const w=d.readUInt32BE(16), stride=w*4+1, row=60;
const seen=new Set();
for(let x=30;x<170;x++){const o=row*stride+1+x*4;seen.add(raw[o]+","+raw[o+1]+","+raw[o+2]);}
console.log(seen.size);
' "$work/grad.png")
[ "$distinct" -gt 20 ] || fail "the gradient rendered as $distinct colour(s) across its width — a flat fill, not a gradient"
echo "  gradient       $distinct distinct colours across the band"

# a diagram, which is a different shape of document: everything absolutely
# positioned, every shape a path whose box is 0x0 and whose geometry is in `d`
if [ -f gallery/rangerflow/bin/rangerflow_demo.js ]; then
  npm run --silent rangerflow:mermaid > /dev/null 2>&1 || fail "the mermaid demo did not run"
  diagram=gallery/rangerflow/out/rangerflow-mermaid.evg.json
  [ -f "$diagram" ] || fail "the mermaid demo wrote no editable document"
  npm run --silent agent -- measure "$diagram" | grep -q '"count":0' \
    || fail "measure found a defect in a diagram RangerFlow laid out itself"
  cp "$diagram" "$work/d.json"
  cat > "$work/dops.json" <<'JSON'
{"ops":[{"op":"set-prop","at":"0/51","prop":"d","value":"M 1650 354 L 1732 354 L 1750 390 L 1668 390 Z"}]}
JSON
  npm run --silent agent -- patch "$work/d.json" "$work/dops.json" | grep -q '"applied":1' \
    || fail "could not edit a path in a diagram"
  npm run --silent agent -- measure "$work/d.json" | grep -q "past the page width" \
    || fail "a shape moved off the page was not reported — path bounds are not being read"
  echo "  diagram        measured, edited, and the off-page shape reported"
else
  echo "  diagram        skipped (rangerflow demo not built)"
fi

echo "ALL PASS — outline, query, measure, patch, undo, rejection"
