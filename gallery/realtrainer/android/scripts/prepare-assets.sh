#!/usr/bin/env bash
# Put the five texts the page opens from where the APK can find them.
#
#   bash gallery/realtrainer/android/scripts/prepare-assets.sh
#
# The stylesheet, the session's COMPACT, the two state machines and the
# reference seed — the same five texts the browser bundle embeds and the iOS
# build copies in as resources. They are copied rather than referenced because
# an Android asset directory is packaged whole and a source tree four
# directories away is not one. The copies are build output and not checked in.
set -e
cd "$(dirname "$0")/../../../.."

AND=gallery/realtrainer/android
ASSETS="$AND/app/src/main/assets"
RT=gallery/realtrainer

mkdir -p "$ASSETS"
for pair in \
  "$RT/web/realtrainer.css:realtrainer.css" \
  "$RT/fixtures/session.compact:session.compact" \
  "$RT/fixtures/machines/planDialog.machine.json:planDialog.machine.json" \
  "$RT/fixtures/machines/chat.machine.json:chat.machine.json" \
  "$RT/fixtures/reference/seed.json:seed.json"
do
  src="${pair%%:*}"
  dst="${pair##*:}"
  if [ ! -f "$src" ]; then
    echo "missing $src" >&2
    exit 1
  fi
  cp "$src" "$ASSETS/$dst"
  printf '  %s\n' "$ASSETS/$dst"
done
