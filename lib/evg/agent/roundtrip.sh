#!/usr/bin/env bash
#
# Every showcase page, through the editable format and back to a picture.
#
# WHY THIS AND NOT ONLY THE CONVERTER'S OWN AUDIT. `evg_json_tool` checks three
# things — a tag it cannot name, a field the patchable set has no room for, and
# whether the two trees lay out and DRAW the same. All three were written after
# a comparison like this one found a loss they had missed:
#
#   grid-row      the deck's subgrid placement, so captions sat on the paragraph
#   svgSource     every imported graphic, on a page whose boxes were all correct
#   emoji-color   the tint on three rows of monochrome emoji, which then
#                 fell back to the text colour — same glyphs, same places
#
# Each of those taught the audit a new question. None of them was the LAST such
# question, so the guard that matters is the one that asks nothing and compares
# everything: render the original, render the conversion, and require the two
# PNGs to be identical byte for byte.
#
#   npm run agent:roundtrip
set -uo pipefail

root=$(cd "$(dirname "$0")/../../.." && pwd)
cd "$root"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

PAGES=lib/evg/showcase/pages
THEMES=lib/evg/showcase/themes
PNG=gallery/pdf_writer/bin/evg_png_tool.js
JSON=gallery/pdf_writer/bin/evg_json_tool.js

for tool in evg_png_tool evg_json_tool; do
  if [ ! -f "gallery/pdf_writer/bin/$tool.js" ]; then
    echo "building $tool…"
    RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr \
      node bin/output.js -es6 "./gallery/pdf_writer/src/tools/$tool.rgr" \
      -d=./gallery/pdf_writer/bin -o="$tool.js" -nodecli > "$work/build.log" 2>&1 \
      || { tail -20 "$work/build.log"; echo "FAILED to build $tool" >&2; exit 1; }
  fi
done

same=0; differ=0; failed=0
for src in "$PAGES"/*.tsx; do
  name=$(basename "$src" .tsx)
  css=(-css "$THEMES/showcase.css")
  [ -f "$THEMES/$name-default.css" ] && css=(-css "$THEMES/$name-default.css" "${css[@]}")

  if ! node "$JSON" "$src" "$PAGES/$name.roundtrip.evg.json" "${css[@]}" -theme editorial > "$work/$name.convert.log" 2>&1; then
    printf "  %-14s convert FAILED\n" "$name"; failed=$((failed+1)); continue
  fi
  node "$PNG" "$src" "$work/$name.orig.png" "${css[@]}" -theme editorial > /dev/null 2>&1
  node "$PNG" "$PAGES/$name.roundtrip.evg.json" "$work/$name.conv.png" > /dev/null 2>&1
  rm -f "$PAGES/$name.roundtrip.evg.json"

  if [ ! -f "$work/$name.conv.png" ]; then
    printf "  %-14s render FAILED\n" "$name"; failed=$((failed+1)); continue
  fi
  if cmp -s "$work/$name.orig.png" "$work/$name.conv.png"; then
    printf "  %-14s identical\n" "$name"; same=$((same+1))
  else
    printf "  %-14s DIFFERS — the conversion lost something\n" "$name"
    grep -E "^  [0-9]|the same boxes|draws" "$work/$name.convert.log" | head -4 | sed 's/^/      /'
    differ=$((differ+1))
  fi
done

echo ""
echo "identical = $same  differing = $differ  failed = $failed"
if [ "$differ" != "0" ] || [ "$failed" != "0" ]; then
  echo "FAILURES" >&2
  exit 1
fi
echo "ALL PASS — every showcase page survives the editable format"
