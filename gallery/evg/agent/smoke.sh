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
out=$(npm run --silent agent -- outline gallery/evg/agent/fixtures/card.evg.json)
echo "$out" | grep -q '0/0/k:title' || fail "outline lost the keyed path"
echo "$out" | grep -q 'Orders'      || fail "outline lost the text"
npm run --silent agent -- outline gallery/evg/agent/fixtures/card.evg.json --depth=1 \
  | grep -q 'deeper nodes not shown' || fail "outline truncated in silence"

# query: JSON, and only the two cards
npm run --silent agent -- query gallery/evg/agent/fixtures/card.evg.json .card \
  | grep -q '"count":2' || fail "query did not find both cards"

# measure: finds all four defects in the broken fixture, and none in the good one
found=$(npm run --silent agent -- measure gallery/evg/agent/fixtures/broken.evg.json --width=600 --height=300)
echo "$found" | grep -q '"count":4' || fail "measure did not find the four defects: $found"
npm run --silent agent -- measure gallery/evg/agent/fixtures/card.evg.json --width=600 --height=400 \
  | grep -q '"count":0' || fail "measure reported a defect in a sound document"

# patch: applies, writes, and the inverse puts it back
cp gallery/evg/agent/fixtures/card.evg.json "$work/doc.json"
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
cp gallery/evg/agent/fixtures/card.evg.json "$work/orig.json"
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

echo "ALL PASS — outline, query, measure, patch, undo, rejection"
