#!/usr/bin/env bash
# Put the demo's stylesheet where the APK can find it.
#
#   bash gallery/ui/android/scripts/prepare-assets.sh
#
# One file, and it is the demo's own: `gallery/ui/demo/dashboard.css` is what
# the browser page, the screenshot runner and the gates style the tree from, so
# the app is styled from the same text rather than from a copy of it that
# drifts. It is copied rather than referenced because an Android asset directory
# is packaged whole and a source tree five directories away is not one. The copy
# is build output and is not checked in.
set -e
cd "$(dirname "$0")/../../../.."

AND=gallery/ui/android
ASSETS="$AND/app/src/main/assets"
CSS=gallery/ui/demo/dashboard.css

if [ ! -f "$CSS" ]; then
  echo "missing $CSS" >&2
  exit 1
fi

mkdir -p "$ASSETS"
cp "$CSS" "$ASSETS/dashboard.css"
printf '  %s\n' "$ASSETS/dashboard.css"
