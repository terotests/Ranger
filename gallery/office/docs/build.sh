#!/usr/bin/env bash
# Generate the Office reference pages (Starlight Markdown from the facades).
#
#   bash gallery/office/docs/build.sh
#
# Deliberately NOT part of `npm run docs:generate`. That builds the Ranger
# language documentation, which is MIT; this documentation is generated from
# the facades under gallery/ and quotes their comments, which are AGPL.
#
# The Starlight site itself is a second step:
#   npm --prefix gallery/office/docs/site run build
# The Pages workflow copies that build to /office/reference/.
set -e
cd "$(dirname "$0")/../../.."
HOME_DIR=gallery/office/docs

node "$HOME_DIR/tools/extract-api.mjs"
node "$HOME_DIR/tools/render-starlight.mjs"
# Last, so a gap between the page and the npm package stops the build rather
# than publishing a reference to methods a reader cannot call.
node "$HOME_DIR/tools/check-api-coverage.mjs"

# A page with no reference on it looks exactly like a page whose generator
# silently found no classes, and both look fine until someone opens them.
for page in $(node -e "
  const r = require('./$HOME_DIR/api-sources.json');
  process.stdout.write(r.apis.map(a => a.page || a.id).join(' '));
"); do
  test -s "$HOME_DIR/site/src/content/docs/$page.md"
  grep -q "AGPL-3.0-or-later" "$HOME_DIR/site/src/content/docs/$page.md"
done
echo "  starlight pages in $HOME_DIR/site/src/content/docs"
