#!/usr/bin/env bash
# Put the four faces and one deck where the APK can find them.
#
#   bash gallery/pptx/android/scripts/prepare-assets.sh [deck.pptx]
#
# The files already exist in this repository; they are copied rather than
# referenced because an Android asset directory is packaged whole and a source
# tree eight directories away is not one. The copies are build output and are
# not checked in.
set -e
cd "$(dirname "$0")/../../../.."

AND=gallery/pptx/android
ASSETS="$AND/app/src/main/assets"
FONTS=gallery/pdf_writer/assets/fonts/Open_Sans
DECK="${1:-gallery/pptx/fixtures/20-business-deck.pptx}"

if [ ! -f "$DECK" ]; then
  echo "no such deck: $DECK" >&2
  exit 1
fi

mkdir -p "$ASSETS/fonts" "$ASSETS/decks"
for face in OpenSans-Regular OpenSans-Bold OpenSans-Italic OpenSans-BoldItalic; do
  cp "$FONTS/$face.ttf" "$ASSETS/fonts/$face.ttf"
done
cp "$DECK" "$ASSETS/decks/sample.pptx"

printf '  %s\n' "$ASSETS/fonts/"*.ttf "$ASSETS/decks/sample.pptx"
