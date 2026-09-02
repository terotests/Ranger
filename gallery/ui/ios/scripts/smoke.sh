#!/usr/bin/env bash
# The iOS build driver, run for real, on a machine that is not a Mac.
#
#   bash gallery/ui/ios/scripts/smoke.sh
#   npm run ui:ios:smoke
#
# `--dry-run` checks the PLAN: which program, with which arguments, in which
# order. It cannot check the code that runs -- the directories the driver makes,
# the Info.plist it writes, the profile it decodes, the order the results come
# back in. That code went untested until someone ran the real thing on a Mac and
# it died on `mkdir` for a directory that already existed.
#
# So this puts a stand-in Apple toolchain on PATH. It is not a simulation of
# Xcode: `swiftc` writes five bytes and calls it a Mach-O. It is a stand-in for
# every tool the driver shells out to, so that everything AROUND those tools is
# exercised. Twice, because the second run is where the interesting bugs are.
set -e
cd "$(dirname "$0")/../../../.."
ROOT="$(pwd)"

FAKE="$ROOT/gallery/ui/ios/scripts/faketoolchain"
WORK="$ROOT/tmp/ui-ios/smoke"
rm -rf "$WORK"
mkdir -p "$WORK/home/Library/MobileDevice/Provisioning Profiles"
printf 'not-a-real-profile' > "$WORK/home/Library/MobileDevice/Provisioning Profiles/abcd-1234.mobileprovision"

bash gallery/ui/ios/scripts/build-driver.sh

fail=0
say() { printf '  %s\n' "$1"; }
expect() {
  # expect "<what>" "<needle>" "<haystack>"
  if printf '%s' "$3" | grep -qF -- "$2"; then
    say "ok   $1"
  else
    say "FAIL $1  (looked for: $2)"
    fail=1
  fi
}
refute() {
  if printf '%s' "$3" | grep -qF -- "$2"; then
    say "FAIL $1  (should not hold: $2)"
    fail=1
  else
    say "ok   $1"
  fi
}
drive() { PATH="$FAKE:$PATH" HOME="$WORK/home" node tmp/ui-ios/build_ios.js "$@" 2>&1; }

rm -rf tmp/ui-ios/build

echo "the iOS build driver, against a stand-in toolchain"

echo "-- a device, end to end --"
out="$(drive --target=ios-device --run --no-ranger)"
expect "the connected device is found"      "Teron iPhone"                  "$out"
refute "and the paired-but-absent one is not" "Vanha iPad"                  "$out"
expect "the identity is found in the keychain" "Apple Development: Tero"    "$out"
expect "the profile is found on the machine" "iOS Team Provisioning Profile" "$out"
expect "and its expiry is reported"          "expires"                      "$out"
expect "the bundle is built"                 "* built"                      "$out"
expect "installed"                           "* installed"                  "$out"
expect "and launched"                        "* launched"                   "$out"

echo "-- what it actually wrote --"
APP=tmp/ui-ios/build/ios-device/RangerDashboard.app
for f in Info.plist PkgInfo RangerDashboard dashboard.css embedded.mobileprovision; do
  if [ -e "$APP/$f" ]; then say "ok   the bundle holds $f"; else say "FAIL the bundle has no $f"; fail=1; fi
done
plist="$(cat "$APP/Info.plist")"
expect "the plist names the executable"      "<string>RangerDashboard</string>" "$plist"
expect "and the bundle id"                   "fi.ranger.dashboard"              "$plist"
expect "and is for iPhone and iPad"          "<integer>2</integer>"             "$plist"

echo "-- the second run, which is where mkdir used to die --"
out2="$(drive --target=ios-device --run --no-ranger)"
expect "it runs again over its own output"   "* launched"                       "$out2"
refute "with no EEXIST"                      "EEXIST"                           "$out2"

echo "-- --no-build reuses what is there --"
out3="$(drive --target=ios-device --run --no-build)"
expect "it says so"                          "* reusing"                        "$out3"
refute "and does not compile"                "pretend swiftc"                   "$out3"

echo "-- a phone that is not plugged in is said BEFORE swiftc --"
out4="$(drive --target=ios-device --run --no-ranger --device=NoSuchPhone || true)"
expect "it names what it could not find"     "no connected device matches"      "$out4"
refute "and nothing was compiled"            "pretend swiftc"                   "$out4"

echo "-- no profile on the machine --"
out5="$(HOME="$WORK/empty" PATH="$FAKE:$PATH" node tmp/ui-ios/build_ios.js --target=ios-device --run --no-ranger 2>&1 || true)"
expect "it says which app it looked for"     "covers fi.ranger.dashboard"       "$out5"
expect "and what to do about it"             "open Xcode"                       "$out5"

echo "-- the simulator, end to end --"
out6="$(drive --run --no-ranger)"
expect "a booted simulator is preferred"     "iPhone 15 Pro"                    "$out6"
expect "installed"                           "* installed"                      "$out6"
expect "and launched"                        "* launched"                       "$out6"
out7="$(drive --run --no-build --device='iPad Pro')"
expect "a named simulator beats a booted one" "iPad Pro"                        "$out7"

echo "-- the watch --"
out8="$(drive --target=watchos-simulator --run --no-ranger)"
expect "a watch simulator is found"          "Apple Watch Series 9"             "$out8"
expect "and the watch app is launched"       "fi.ranger.dashboard.watch"        "$out8"

echo
if [ "$fail" = "0" ]; then
  echo "the driver builds, signs, installs and launches -- twice, and without a Mac"
else
  echo "smoke test FAILED" >&2
  exit 1
fi
