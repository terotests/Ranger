#!/usr/bin/env bash
# Ranger Game Engine: cross-compile (or native-build on Pi) a Raspberry Pi 5
# aarch64 binary ready to copy onto a microSD card.
#
# Produces a small LLVM terminal Pong binary (~70 KB) with no runtime deps beyond
# libc, plus a self-contained runtime tree (games/, menu/, scripting/, lib/,
# compiler) for SDL/TSX launcher builds on the Pi. SDL builds need libsdl2 on
# the device — use gallery/game_engine/scripts/build-sdl.sh from the bundle root.
#
# Usage:
#   ./gallery/game_engine/scripts/build-raspberry.sh
#   npm run build:raspberry
#
# Cross-compile from x86_64 Linux (dev machine):
#   sudo apt-get install gcc-aarch64-linux-gnu clang
#
# On Raspberry Pi 5 (aarch64) the script detects the host and links natively.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SOURCE="$ROOT/gallery/game_engine/pong.rgr"
OUT_DIR="$ROOT/dist/raspberry-pi5"
LL_FILE="$OUT_DIR/pong.ll"
BIN_FILE="$OUT_DIR/pong"
RT_C="$ROOT/runtime/ranger_rt.c"
MEM_C="$ROOT/runtime/ranger_mem.c"
TARGET="aarch64-linux-gnu"
CROSS_PREFIX="aarch64-linux-gnu"

mkdir -p "$OUT_DIR"

if [[ ! -f "$ROOT/bin/output.js" ]]; then
  echo "==> Compiler not built — running npm run compile"
  (cd "$ROOT" && npm run compile --silent)
fi

# Rebuild compiler when LowIR target definitions change.
if [[ "$ROOT/compiler/ng_LowIRTarget.rgr" -nt "$ROOT/bin/output.js" ]]; then
  echo "==> Rebuilding Ranger compiler (target definitions changed)"
  (cd "$ROOT" && npm run compile --silent)
fi

HOST_ARCH="$(uname -m)"
HOST_OS="$(uname -s)"
CROSS=0
CC_ARGS=()

if [[ "$HOST_OS" == "Linux" && "$HOST_ARCH" == "aarch64" ]]; then
  echo "==> Host: Raspberry Pi / aarch64 Linux — native link"
  if ! command -v clang >/dev/null 2>&1; then
    echo "error: clang not found. On Pi: sudo apt-get install clang" >&2
    exit 1
  fi
  CC=(clang)
elif [[ "$HOST_OS" == "Linux" ]]; then
  echo "==> Host: $HOST_ARCH Linux — cross-compiling for $TARGET (Pi 5 / aarch64)"
  CROSS=1
  if ! command -v clang >/dev/null 2>&1; then
    echo "error: clang not found" >&2
    exit 1
  fi
  if ! command -v "${CROSS_PREFIX}-gcc" >/dev/null 2>&1; then
    echo "error: ${CROSS_PREFIX}-gcc not found." >&2
    echo "Install the cross toolchain:" >&2
    echo "  sudo apt-get install gcc-aarch64-linux-gnu g++-aarch64-linux-gnu" >&2
    exit 1
  fi
  SYSROOT="$("${CROSS_PREFIX}-gcc" -print-sysroot)"
  CC=(clang --target="$TARGET" --sysroot="$SYSROOT")
else
  echo "error: build:raspberry supports Linux hosts only (cross-compile or Pi native)." >&2
  echo "On macOS, build inside a Linux VM/CI, or copy the repo to the Pi and run there." >&2
  exit 1
fi

echo "==> 1/4 Ranger -> LLVM IR ($TARGET)"
cd "$ROOT"
RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr" node "$ROOT/bin/output.js" \
  -l=llvm "$SOURCE" \
  -nodecli \
  -d="dist/raspberry-pi5" \
  -o="pong.ll" \
  -target="$TARGET"

echo "==> 2/4 ${CC[*]} -> $BIN_FILE"
"${CC[@]}" "$LL_FILE" "$RT_C" "$MEM_C" -o "$BIN_FILE" -Wno-override-module

echo "==> 3/4 Sync runtime assets (games, menu, scripting, lib, compiler)"
bash "$ROOT/gallery/game_engine/scripts/sync-game-engine-runtime.sh" "$OUT_DIR"

echo "==> 4/4 Package deploy bundle"
chmod +x "$BIN_FILE"

cat > "$OUT_DIR/DEPLOY.md" <<'EOF'
# Ranger Game Engine — Raspberry Pi 5 deploy bundle

## Contents

| Path | Description |
|------|-------------|
| `pong` | Terminal Pong (ANSI on HDMI console). aarch64 ELF, dynamically linked. |
| `gallery/game_engine/games/` | TSX game scripts (launcher scans `*/index.tsx`). |
| `gallery/game_engine/menu/` | Launcher menu (`index.tsx`). |
| `gallery/game_engine/scripting/` | Shared TSX helpers, types, and image assets. |
| `gallery/game_engine/*.rgr` | Engine modules for on-device SDL/native rebuilds. |
| `lib/` | Ranger standard library (`stdops.rgr`, …) for on-device compiles. |
| `compiler/Lang.rgr`, `bin/output.js` | Minimal Ranger compiler bundle. |
| `runtime/ranger_rt.c`, `runtime/ranger_mem.c` | C runtime for native/SDL links. |
| `gallery/invaders/variant.hpp` | C++ helper header for SDL builds. |
| `ranger-game.service.example` | Example systemd unit for autostart on boot. |

## Copy to microSD

From your dev machine (after `npm run build:raspberry`):

```bash
# Replace PI_HOST with the Pi's hostname or IP (or mount the boot/root partition).
# Copy the whole bundle so games/menu/lib paths resolve.
scp -r dist/raspberry-pi5 pi@PI_HOST:/home/pi/ranger-game
```

Or mount the microSD root partition and copy directly:

```bash
sudo cp -a dist/raspberry-pi5 /mnt/rootfs/home/pi/ranger-game
sudo chmod +x /mnt/rootfs/home/pi/ranger-game/pong
```

## Run on the Pi

**Console / HDMI (tty1):** log in on the physical console or SSH without X11.
Run from the bundle root so relative paths match:

```bash
cd ~/ranger-game
./pong
```

Controls: W/S move paddle, Q quit, D toggle debug HUD.

**systemd autostart (optional):**

```bash
sudo cp ranger-game.service.example /etc/systemd/system/ranger-game.service
# Edit ExecStart path if needed, then:
sudo systemctl daemon-reload
sudo systemctl enable --now ranger-game.service
journalctl -u ranger-game -f    # stdout/stderr logs
```

## Build on the Pi instead of cross-compile

If you prefer building on-device (no cross toolchain needed), copy this bundle
(or clone the full repo) and run from the bundle root:

```bash
cd ~/ranger-game
# Rebuild terminal Pong (needs Node.js):
node bin/output.js -l=llvm gallery/game_engine/pong.rgr -nodecli \
  -d=. -o=pong.ll -target=aarch64-linux-gnu
clang pong.ll runtime/ranger_rt.c runtime/ranger_mem.c -o pong -Wno-override-module
```

SDL window builds need `libsdl2-dev` on the Pi:

```bash
sudo apt-get install libsdl2-dev clang
./gallery/game_engine/scripts/build-sdl.sh          # SDL Pong window
./gallery/game_engine/scripts/build-game-sdl.sh     # TSX game launcher
./tmp/game-sdl/game_sdl                             # menu (from repo root layout)
```

The bundle includes `games/`, `menu/`, `scripting/`, and `lib/` so the
launcher default paths (`gallery/game_engine/games`, etc.) work when CWD is the
bundle root. For a full repo checkout with `npm run engine:*`, clone the repo and
`npm install` instead.

## Requirements on Pi

- Raspberry Pi OS 64-bit (aarch64) — Pi 5 default
- No extra libraries for the terminal binary (libc only)
EOF

cat > "$OUT_DIR/ranger-game.service.example" <<'EOF'
[Unit]
Description=Ranger Game Engine (terminal Pong)
After=local-fs.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/ranger-game
ExecStart=/home/pi/ranger-game/pong
Restart=on-failure
RestartSec=3
StandardOutput=journal
StandardError=journal
# TTY needed for keyboard input on the HDMI console:
StandardInput=tty
TTYPath=/dev/tty1
TTYReset=yes
TTYVHangup=yes

[Install]
WantedBy=multi-user.target
EOF

echo ""
file "$BIN_FILE"
ls -lh "$BIN_FILE"
echo ""
echo "Ready: $BIN_FILE"
echo "Deploy docs: $OUT_DIR/DEPLOY.md"
if [[ "$CROSS" -eq 1 ]]; then
  echo ""
  echo "Cross-compiled on $HOST_ARCH — copy dist/raspberry-pi5/ to the Pi microSD or scp pong to the device."
else
  echo ""
  echo "Native aarch64 build — run $BIN_FILE on this Pi."
fi
