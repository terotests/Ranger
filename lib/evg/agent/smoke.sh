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
