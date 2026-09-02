#!/usr/bin/env bash
# Everything the APK needs, then the APK.
#
#   bash gallery/ui/android/scripts/build-app.sh [debug|release]
#
# Needs an Android SDK (`ANDROID_HOME` or `ANDROID_SDK_ROOT`) and a JDK 17.
# Gradle downloads the Android plugin and the Kotlin compiler on the first run.
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"
AND="$ROOT/gallery/ui/android"
VARIANT="${1:-debug}"

if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
  echo "ANDROID_HOME / ANDROID_SDK_ROOT is not set — the Android SDK is required to build the APK." >&2
  echo "The port itself can be checked without one: bash gallery/ui/android/scripts/verify-desktop.sh" >&2
  exit 1
fi

bash "$AND/scripts/build-ranger.sh"
bash "$AND/scripts/prepare-assets.sh"

cd "$AND"
case "$VARIANT" in
  debug)   ./gradlew --no-daemon assembleDebug ;;
  release) ./gradlew --no-daemon assembleRelease ;;
  *) echo "unknown variant: $VARIANT (debug|release)" >&2; exit 1 ;;
esac

find "$AND/app/build/outputs/apk" -name '*.apk' -print
