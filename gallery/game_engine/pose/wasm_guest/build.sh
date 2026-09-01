#!/usr/bin/env bash
# Build the pose wasm3 guest: assembly/index.ts -> pose_guest.wasm (committed, so
# the Pi doesn't need node/asc — same pattern as the autopeli logic.wasm).
#
#   bash gallery/game_engine/pose/wasm_guest/build.sh
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -d node_modules/assemblyscript ]]; then
  echo "==> npm install (assemblyscript)"
  npm install --no-audit --no-fund
fi

# --disable bulk-memory: asc >=0.27 emits memory.fill/copy for StaticArray zeroing,
# which the embedded wasm3 (runtime/wasm3) does not implement ("no operation found
# for opcode"). Disabling lowers those to plain loops that wasm3 runs.
echo "==> asc build (wasm3-compatible)"
./node_modules/.bin/asc assembly/index.ts \
  --outFile pose_guest.wasm --runtime minimal --use abort= --optimize --disable bulk-memory

echo "==> wrote pose_guest.wasm ($(wc -c < pose_guest.wasm) bytes)"
