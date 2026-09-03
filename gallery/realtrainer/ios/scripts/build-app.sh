#!/usr/bin/env bash
# Build the RealTrainer demo for Apple hardware, without Xcode.
#
#   bash gallery/realtrainer/ios/scripts/build-app.sh [options]
#   bash gallery/realtrainer/ios/scripts/build-app.sh --run
#   bash gallery/realtrainer/ios/scripts/build-app.sh --target=ios-device --run
#   bash gallery/realtrainer/ios/scripts/build-app.sh --check
#
# The build itself is `gallery/ui/ios/ranger/build_ios.rgr` — one driver for
# every Apple port in the gallery, told which app to build. This script only
# picks the app.
set -e
cd "$(dirname "$0")/../../../.."

bash gallery/ui/ios/scripts/build-driver.sh
exec node tmp/ui-ios/build_ios.js --app=realtrainer "$@"
