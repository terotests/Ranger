#!/usr/bin/env bash
# Build the dashboard demo for Apple hardware, without Xcode.
#
#   bash gallery/ui/ios/scripts/build-app.sh [options]
#   bash gallery/ui/ios/scripts/build-app.sh --run
#   bash gallery/ui/ios/scripts/build-app.sh --target=watchos-simulator --run
#   bash gallery/ui/ios/scripts/build-app.sh --check
#   bash gallery/ui/ios/scripts/build-app.sh --dry-run
#
# This script does almost nothing: it compiles the DRIVER and then runs it. The
# build itself — the Ranger compile, the SDK lookup, Info.plist, swiftc,
# codesign, simctl — is `ranger/build_ios.rgr`, which is a Ranger program.
#
# `--dry-run` and `--check` work on any machine. Everything else needs a Mac
# with Xcode or the Command Line Tools installed.
set -e
cd "$(dirname "$0")/../../../.."

bash gallery/ui/ios/scripts/build-driver.sh
exec node tmp/ui-ios/build_ios.js "$@"
