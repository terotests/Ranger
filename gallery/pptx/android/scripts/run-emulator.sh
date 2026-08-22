#!/usr/bin/env bash
# Build the viewer, put it on an emulator (starting one if none is running),
# and open it.
#
#   npm run pptx:android:run
#   npm run pptx:android:run -- --avd Pixel_Tablet_API_34
#   npm run pptx:android:run -- --deck gallery/pptx/fixtures/09-kitchen.pptx
#   npm run pptx:android:run -- --logcat
#   npm run pptx:android:run -- --no-build          # reinstall what is already built
#
# A physical device works too: whatever `adb devices` already lists online is
# what gets used, and no emulator is started. `--avd` picks which image to boot
# when nothing is running yet — close the running one first if you want a
# different image than the one already up.
#
# Needs an Android SDK. This script does not go looking for one beyond the usual
# places — if `ANDROID_HOME` or `ANDROID_SDK_ROOT` is set, that wins.
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"
AND="$ROOT/gallery/pptx/android"

APP_ID=fi.ranger.pptx
ACTIVITY="$APP_ID/.MainActivity"

AVD=""
DECK=""
LOGCAT=0
BUILD=1
VARIANT=debug

while [ $# -gt 0 ]; do
  case "$1" in
    --avd)     AVD="$2"; shift 2 ;;
    --deck)    DECK="$2"; shift 2 ;;
    --logcat)  LOGCAT=1; shift ;;
    --no-build) BUILD=0; shift ;;
    --release) VARIANT=release; shift ;;
    -h|--help) sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown argument: $1 (try --help)" >&2; exit 1 ;;
  esac
done

# --- find the SDK ------------------------------------------------------------
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [ -z "$SDK" ]; then
  for guess in "$HOME/Library/Android/sdk" "$HOME/Android/Sdk" "$HOME/android-sdk" /usr/lib/android-sdk; do
    if [ -d "$guess" ]; then SDK="$guess"; break; fi
  done
fi
if [ -z "$SDK" ] || [ ! -d "$SDK" ]; then
  cat >&2 <<'MSG'
No Android SDK found.

Set ANDROID_HOME (or ANDROID_SDK_ROOT) to it, e.g.

    export ANDROID_HOME="$HOME/Library/Android/sdk"     # macOS, Android Studio
    export ANDROID_HOME="$HOME/Android/Sdk"             # Linux, Android Studio

The port itself can be checked without an SDK:

    npm run pptx:android:verify      # render fixture decks through the painter
    npm run pptx:android:typecheck   # type-check the three Android-only files
MSG
  exit 1
fi
export ANDROID_HOME="$SDK"
export ANDROID_SDK_ROOT="$SDK"

ADB="$SDK/platform-tools/adb"
EMULATOR="$SDK/emulator/emulator"
# Fall back to whatever is on PATH, and do it in a form `set -e` survives: a
# bare `a && b && c` that fails at `a` is a failed command and would end the
# script here rather than at the check below, which has something useful to say.
if [ ! -x "$ADB" ]; then ADB="$(command -v adb || true)"; fi
if [ ! -x "$EMULATOR" ]; then EMULATOR="$(command -v emulator || true)"; fi
if [ ! -x "$ADB" ]; then
  echo "adb not found under $SDK/platform-tools — install 'Android SDK Platform-Tools'" >&2
  exit 1
fi

# --- build -------------------------------------------------------------------
if [ "$BUILD" = "1" ]; then
  bash "$AND/scripts/build-ranger.sh"
  if [ -n "$DECK" ]; then
    bash "$AND/scripts/prepare-assets.sh" "$DECK"
  else
    bash "$AND/scripts/prepare-assets.sh"
  fi
  # `${VARIANT^}` would be shorter and does not exist in the bash macOS ships.
  case "$VARIANT" in
    debug)   TASK=assembleDebug ;;
    release) TASK=assembleRelease ;;
  esac
  ( cd "$AND" && ./gradlew --no-daemon "$TASK" )
fi

APK="$AND/app/build/outputs/apk/$VARIANT/app-$VARIANT.apk"
if [ ! -f "$APK" ]; then
  # A release build without a signing config lands on -unsigned.
  APK=$(find "$AND/app/build/outputs/apk/$VARIANT" -name '*.apk' 2>/dev/null | head -1 || true)
fi
if [ -z "$APK" ] || [ ! -f "$APK" ]; then
  echo "no APK under $AND/app/build/outputs/apk/$VARIANT — run without --no-build" >&2
  exit 1
fi

# --- a device to put it on ---------------------------------------------------
"$ADB" start-server >/dev/null 2>&1 || true

online() {
  "$ADB" devices | awk 'NR>1 && $2 == "device" { print $1 }' | head -1
}

# Every later adb call names the device. Without `-s`, a second emulator or a
# plugged-in phone turns `adb install` into "more than one device/emulator",
# which is a confusing way to be told there is nothing wrong.
adbx() {
  if [ -n "$DEVICE" ]; then
    "$ADB" -s "$DEVICE" "$@"
  else
    "$ADB" "$@"
  fi
}

DEVICE="$(online || true)"

if [ -n "$DEVICE" ]; then
  echo "using the device already running: $DEVICE"
  if [ -n "$AVD" ]; then
    echo "  (--avd $AVD ignored — close that one first if you meant a different image)"
  fi
else
  if [ ! -x "$EMULATOR" ]; then
    echo "no device is connected and the emulator is not installed under $SDK/emulator" >&2
    echo "install an AVD in Android Studio, or plug in a device with USB debugging on" >&2
    exit 1
  fi
  if [ -z "$AVD" ]; then
    AVD="$("$EMULATOR" -list-avds | head -1)"
  fi
  if [ -z "$AVD" ]; then
    echo "no AVD exists — create one in Android Studio (a tablet profile suits this app)" >&2
    exit 1
  fi
  echo "starting emulator $AVD"
  # Detached, and its output kept out of the way: the emulator is chatty and
  # this script's own progress is what matters here.
  "$EMULATOR" -avd "$AVD" -netdelay none -netspeed full >/dev/null 2>&1 &
  "$ADB" wait-for-device
  DEVICE="$(online || true)"
  printf 'waiting for it to finish booting'
  # `wait-for-device` returns as soon as adb can talk to it, which is a long
  # way before the launcher exists; installing then fails against a package
  # manager that is not running yet.
  tries=0
  while [ "$(adbx shell getprop sys.boot_completed 2>/dev/null | tr -d '\r\n')" != "1" ]; do
    tries=$((tries + 1))
    if [ "$tries" -gt 150 ]; then
      echo
      echo "the emulator did not finish booting in five minutes" >&2
      exit 1
    fi
    printf '.'
    sleep 2
    if [ -z "$DEVICE" ]; then DEVICE="$(online || true)"; fi
  done
  echo
fi

echo "installing $(basename "$APK") on ${DEVICE:-the running device}"
adbx install -r "$APK"

# A cold start, so a reinstall does not resume the previous instance holding the
# previous deck.
adbx shell am force-stop "$APP_ID" >/dev/null 2>&1 || true
adbx shell am start -n "$ACTIVITY"

echo
echo "running: $ACTIVITY"
echo "  screenshot:  adb exec-out screencap -p > shot.png"
echo "  logs:        adb logcat --pid=\$(adb shell pidof -s $APP_ID)"

if [ "$LOGCAT" = "1" ]; then
  echo
  PID="$(adbx shell pidof -s "$APP_ID" | tr -d '\r\n')"
  if [ -n "$PID" ]; then
    adbx logcat --pid="$PID"
  else
    # `pidof` is missing on some images and the app may still be starting.
    adbx logcat
  fi
fi
