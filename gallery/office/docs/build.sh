#!/usr/bin/env bash
# Build the Office API reference.
#
#   bash gallery/office/docs/build.sh [--out DIR]
#
# Deliberately NOT part of `npm run docs:generate`. That builds the Ranger
# language documentation, which is MIT; this reference is generated from the
# facades under gallery/ and quotes their comments, which are AGPL. Keeping the
# two builds apart is what keeps the two licences apart — see the banner in
# tools/render-reference.mjs.
#
# The default output is gallery/office/docs/dist. The Pages workflow passes
# --out so the reference lands at /office/reference/, beside the playground it
# documents.
set -e
cd "$(dirname "$0")/../../.."
HOME_DIR=gallery/office/docs
OUT="$HOME_DIR/dist"
while [ $# -gt 0 ]; do
  case "$1" in
    --out) OUT="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 1 ;;
  esac
done

node "$HOME_DIR/tools/extract-api.mjs"
node "$HOME_DIR/tools/render-reference.mjs" --out "$OUT"
# Last, so a gap between the page and the npm package stops the build rather
# than publishing a reference to methods a reader cannot call.
node "$HOME_DIR/tools/check-api-coverage.mjs"

# A page with no reference on it looks exactly like a page whose generator
# silently found no classes, and both look fine until someone opens them.
test -s "$OUT/index.html"
for id in $(node -e "
  const r = require('./$HOME_DIR/api-sources.json');
  process.stdout.write(r.apis.map(a => a.id).join(' '));
"); do
  test -s "$OUT/$id/index.html"
  grep -q "AGPL-3.0-or-later" "$OUT/$id/index.html"
done
echo "  reference in $OUT"
