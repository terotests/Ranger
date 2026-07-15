#!/usr/bin/env bash
# Deploy Ranger game-engine launcher to a Raspberry Pi over SSH.
#
# Usage:
#   bash gallery/game_engine/scripts/deploy-pi.sh pelit
#   bash gallery/game_engine/scripts/deploy-pi.sh 192.168.1.3
#   bash gallery/game_engine/scripts/deploy-pi.sh tero@192.168.1.3
#   RANGER_AUDIO_DEVICE=plughw:0,0 bash gallery/game_engine/scripts/deploy-pi.sh pelit
#
# Deploys TSX games and WASM games (e.g. autopeli_wasm/logic.wasm). Uses committed
# logic.wasm by default — no Rust required on the deploy machine. Optional local
# rebuild: RANGER_WASM_BUILD=1 bash gallery/game_engine/scripts/deploy-pi.sh pelit
#
# On the Pi, compiles game_sdl (SDL2 + GLES2 + wasm3) and wires ~/start.sh autostart.
#
# Fast game-only sync (no C++ rebuild): sync-pi-games.sh
#
# USB camera (pose game input): the deploy checks for a capture-capable camera on
# the Pi (/dev/video*, v4l2). By default a missing camera is only a warning and
# the deploy continues; set RANGER_REQUIRE_CAMERA=1 to make it a hard gate.
#
# Autostart on boot (pelit host — enabled by default):
#   ~/initservice.sh  — wires lxsession / labwc / crontab -> ~/start.sh
#   ~/start.sh        — launch game (manual or from autostart)
#
# Copies the local repo (excl. node_modules/tmp), installs deps on the Pi,
# runs npm install + compile + engine:game-sdl build (-O3).

set -euo pipefail

TARGET="${1:?usage: deploy-pi.sh [user@]host}"
if [[ "$TARGET" != *@* ]]; then
  TARGET="tero@${TARGET}"
fi

REMOTE_USER="${TARGET%%@*}"
HOST_SHORT="${TARGET#*@}"

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
REMOTE_DIR="ranger"
AUDIO_DEV="${RANGER_AUDIO_DEVICE:-plughw:1,0}"
CXX_OPT="${CXX_OPT:--O3}"
GE_GAMES="$ROOT/gallery/game_engine/games"

if [[ -z "${RANGER_PI_AUTOSTART:-}" ]]; then
  if [[ "$HOST_SHORT" == "pelit" ]]; then
    RANGER_PI_AUTOSTART=1
  else
    RANGER_PI_AUTOSTART=0
  fi
fi

if [[ "$RANGER_PI_AUTOSTART" == "1" ]]; then
  TOTAL_STEPS=6
else
  TOTAL_STEPS=5
fi

wasm32_ready() {
  command -v rustup >/dev/null 2>&1 \
    && rustup target list --installed 2>/dev/null | grep -q '^wasm32-unknown-unknown'
}

build_wasm_modules() {
  if [[ "${RANGER_WASM_BUILD:-0}" != "1" ]]; then
    echo "    skip (using committed logic.wasm; RANGER_WASM_BUILD=1 to rebuild)"
    return 0
  fi
  if ! wasm32_ready; then
    echo "    RANGER_WASM_BUILD=1 but wasm32-unknown-unknown is not installed." >&2
    echo "    rustup target add wasm32-unknown-unknown" >&2
    return 1
  fi
  echo "    engine:wasm:build:rust-autopeli"
  (cd "$ROOT" && npm run engine:wasm:build:rust-autopeli)
  echo "    engine:wasm:build:rust-pong"
  (cd "$ROOT" && npm run engine:wasm:build:rust-pong)
}

verify_wasm_artifacts() {
  local missing=0
  for wasm in \
    "$GE_GAMES/autopeli_wasm/logic.wasm" \
    "$GE_GAMES/rust_pong/logic.wasm"; do
    if [[ ! -f "$wasm" ]]; then
      echo "error: missing WASM artifact: $wasm" >&2
      echo "  Install Rust + wasm32 target, or run:" >&2
      echo "  npm run engine:wasm:build:rust-autopeli" >&2
      missing=1
    fi
  done
  if [[ "$missing" != "0" ]]; then
    exit 1
  fi
}

# Verify a REAL camera on the Pi (over SSH). A Pi 5 exposes many /dev/video*
# nodes for hardware codecs and the ISP (rpi-hevc-dec, pispbe, bcm2835-codec,
# rpivid, unicam, ...) that all report "Video Capture" capability but are NOT
# cameras. So capability alone is a false positive — key on the bus/driver: a
# USB webcam is uvcvideo / bus_info usb-*. Needs v4l-utils (apt). Returns non-zero
# if no such device is present.
check_usb_camera() {
  ssh "$TARGET" 'bash -s' <<'CAMEOF'
set -uo pipefail
if ! command -v v4l2-ctl >/dev/null 2>&1; then
  echo "    v4l-utils missing — cannot verify a camera"; exit 5
fi
vids=$(ls /dev/video* 2>/dev/null || true)
if [[ -z "$vids" ]]; then
  echo "    no /dev/video* devices — is the USB camera plugged in?"
  echo "    try: lsusb ; dmesg | grep -i -E 'camera|uvc|video' | tail"
  exit 3
fi
lsusb 2>/dev/null | grep -iE 'cam|webcam|uvc' | sed 's/^/      usb: /' || true
found=0; skipped=""
for dev in $vids; do
  all=$(v4l2-ctl -d "$dev" --all 2>/dev/null || true)
  echo "$all" | grep -qi 'Video Capture' || continue          # capture-capable only
  driver=$(echo "$all" | grep -m1 -i 'Driver name' | sed 's/.*: *//')
  bus=$(echo "$all"    | grep -m1 -i 'Bus info'    | sed 's/.*: *//')
  card=$(echo "$all"   | grep -m1 -i 'Card type'   | sed 's/.*: *//')
  # a real camera: UVC webcam (usb) — not a platform codec/ISP block
  is_cam=0
  [[ "$driver" == uvcvideo ]] && is_cam=1
  [[ "$bus" == usb* || "$bus" == *usb* ]] && is_cam=1
  if [[ "$is_cam" == "1" ]]; then
    found=1
    echo "    camera: $dev  ${card:-?}  [driver=$driver bus=$bus]"
    v4l2-ctl -d "$dev" --list-formats-ext 2>/dev/null \
      | grep -E 'Pixel Format|Size: Discrete' | head -4 | sed 's/^[[:space:]]*/        /' || true
  else
    skipped="$skipped $dev($driver)"
  fi
done
if [[ "$found" == "0" ]]; then
  echo "    no camera found — only platform codec/ISP capture nodes:${skipped:- none}"
  echo "    plug in a USB webcam (shows as driver=uvcvideo, bus=usb-*)."
  exit 4
fi
exit 0
CAMEOF
}

echo "==> 1/$TOTAL_STEPS Test SSH: $TARGET"
ssh -o ConnectTimeout=10 -o BatchMode=yes "$TARGET" 'echo ok; uname -m'

echo "==> 2/$TOTAL_STEPS Install Pi packages (clang, SDL2, GLES2, alsa-utils, x11-utils, node, npm)"
ssh "$TARGET" 'sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq git clang pkg-config libsdl2-dev libgles2-mesa-dev alsa-utils x11-utils nodejs npm v4l-utils'

echo "==> Check USB camera (pose game input)"
if check_usb_camera; then
  echo "    camera OK"
else
  if [[ "${RANGER_REQUIRE_CAMERA:-0}" == "1" ]]; then
    echo "    No usable USB camera found on the Pi. The pose game needs one." >&2
    echo "    Plug in the camera and re-run, or drop RANGER_REQUIRE_CAMERA to continue." >&2
    exit 1
  else
    echo "    no usable camera — continuing anyway (warning only)." >&2
    echo "    the pose game needs one; plug in a USB webcam later, or set" >&2
    echo "    RANGER_REQUIRE_CAMERA=1 to make this a hard deploy gate." >&2
  fi
fi

echo "==> 3/$TOTAL_STEPS Verify WASM artifacts (optional RANGER_WASM_BUILD=1 rebuild)"
build_wasm_modules
verify_wasm_artifacts

echo "==> 4/$TOTAL_STEPS Rsync repo -> ~/$REMOTE_DIR (incl. logic.wasm + runtime/wasm3)"
ssh "$TARGET" "mkdir -p ~/$REMOTE_DIR"
rsync -az --delete \
  --exclude node_modules \
  --exclude tmp \
  --exclude dist \
  --exclude .git/objects \
  --exclude 'gallery/game_engine/pose/native_bench/build' \
  --exclude 'gallery/game_engine/pose/mediapipe_poc/assets/models' \
  "$ROOT/" "$TARGET:~/$REMOTE_DIR/"

echo "==> 5/$TOTAL_STEPS Build game launcher on Pi (CXX_OPT=$CXX_OPT, wasm3 embedded)"
ssh "$TARGET" "cd ~/$REMOTE_DIR && npm install && npm run compile && CXX_OPT=$CXX_OPT npm run engine:game-sdl"

echo "==> Write ~/start.sh + ~/initservice.sh (RANGER_AUDIO_DEVICE=$AUDIO_DEV)"
ssh "$TARGET" "cat > ~/start.sh" <<'STARTEOF'
#!/usr/bin/env bash
set -euo pipefail

LOG="$HOME/ranger-game.log"
if [[ ! -t 1 ]]; then
  exec 9>"$HOME/.ranger-game.lock"
  if ! flock -n 9; then
    exit 0
  fi
  exec >>"$LOG" 2>&1
  echo "=== $(date -Is) start.sh ==="
fi

cd "$HOME/ranger"

export DISPLAY="${DISPLAY:-:0}"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export RANGER_AUDIO_DEVICE="${RANGER_AUDIO_DEVICE:-AUDIO_PLACEHOLDER}"

wait_x() {
  if xdpyinfo >/dev/null 2>&1; then
    return 0
  fi
  # poll fast (0.2s) so the game launches as soon as X is up; ~120s total
  local i=0
  while [[ $i -lt 600 ]]; do
    if [[ -S /tmp/.X11-unix/X0 ]]; then
      export DISPLAY=:0
      if xdpyinfo -display :0 >/dev/null 2>&1; then
        return 0
      fi
    fi
    sleep 0.2
    i=$((i + 1))
  done
  echo "start.sh: X display :0 not ready after $((i / 5))s" >&2
  return 1
}

wait_x || export DISPLAY=:0

wait_audio() {
  local dev="$1"
  local i=0
  while [[ $i -lt 20 ]]; do
    if aplay -D "$dev" --dump-hw-params /dev/null 2>/dev/null; then
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  echo "start.sh: audio $dev not ready yet, starting anyway" >&2
}

wait_audio "$RANGER_AUDIO_DEVICE"

BIN="$HOME/ranger/tmp/game-sdl/game_sdl"
if [[ ! -x "$BIN" ]]; then
  echo "start.sh: missing $BIN — run deploy or: cd ~/ranger && npm run engine:game-sdl" >&2
  exit 1
fi

exec "$BIN" --fullscreen "$@"
STARTEOF
ssh "$TARGET" "cat > ~/initservice.sh" <<'INITEOF'
#!/usr/bin/env bash
# One-shot setup: wire Pi autostart hooks -> ~/start.sh
# Re-run after deploy or when autostart breaks: ~/initservice.sh
set -euo pipefail

START="$HOME/start.sh"
# No fixed boot delay: start.sh itself waits for X (wait_x) and audio
# (wait_audio), and flock prevents duplicate launches. Launching immediately
# gets the console up as soon as the session is ready instead of sleep N late.
CRON_BOOT="@reboot $START"

echo "==> Ranger autostart setup"
echo "    game launcher: $START"

if [[ ! -x "$START" ]]; then
  echo "error: $START missing — run deploy-pi.sh first" >&2
  exit 1
fi

mkdir -p "$HOME/.config/autostart" "$HOME/.config/lxsession/LXDE-pi" "$HOME/.config/labwc"

cat > "$HOME/.config/autostart/ranger-game.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Ranger Game
Comment=Ranger SDL game launcher
Exec=/bin/bash -c "$START"
Terminal=false
X-GNOME-Autostart-enabled=true
EOF

grep -v 'ranger-game\|start\.sh' "$HOME/.config/lxsession/LXDE-pi/autostart" 2>/dev/null > /tmp/lxas.tmp || true
echo "@/bin/bash -c \"$START\"" >> /tmp/lxas.tmp
mv /tmp/lxas.tmp "$HOME/.config/lxsession/LXDE-pi/autostart"

grep -v 'ranger-game\|start\.sh' "$HOME/.config/labwc/autostart" 2>/dev/null > /tmp/labas.tmp || true
echo "/bin/bash -c \"$START\" &" >> /tmp/labas.tmp
mv /tmp/labas.tmp "$HOME/.config/labwc/autostart"

( crontab -l 2>/dev/null | grep -v 'start\.sh\|ranger-game' || true
  echo "$CRON_BOOT"
) | crontab -

rm -f "$HOME/ranger-autostart.sh"
systemctl --user disable --now ranger-game.service 2>/dev/null || true
rm -f "$HOME/.config/systemd/user/ranger-game.service"
systemctl --user daemon-reload 2>/dev/null || true
sudo systemctl disable --now ranger-game.service 2>/dev/null || true
sudo rm -f /etc/systemd/system/ranger-game.service
sudo systemctl daemon-reload 2>/dev/null || true

echo "==> Done"
echo "    desktop:  ~/.config/autostart/ranger-game.desktop"
echo "    lxsession: ~/.config/lxsession/LXDE-pi/autostart"
echo "    labwc:    ~/.config/labwc/autostart"
echo "    crontab:  crontab -l"
echo "    log:      ~/ranger-game.log"
echo ""
echo "Reboot to test autostart, or launch manually: $START"
INITEOF
ssh "$TARGET" "sed -i 's|AUDIO_PLACEHOLDER|$AUDIO_DEV|g' ~/start.sh && chmod +x ~/start.sh ~/initservice.sh && ln -sf ../start.sh ~/$REMOTE_DIR/start.sh"

if [[ "$RANGER_PI_AUTOSTART" == "1" ]]; then
  echo "==> 6/$TOTAL_STEPS Run ~/initservice.sh (configure autostart)"
  ssh "$TARGET" '~/initservice.sh'
fi

# Opt-in: build + run the native pose probes on the Pi (heavy: pulls a tensorflow
# checkout + builds TFLite the first time). See gallery/game_engine/pose/.
if [[ "${RANGER_POSE_BENCH:-0}" == "1" ]]; then
  echo "==> Pose native probe (RANGER_POSE_BENCH=1)"
  ssh "$TARGET" 'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq cmake build-essential unzip curl'
  ssh "$TARGET" "POSE_THREADS='${POSE_THREADS:-2}' bash ~/$REMOTE_DIR/gallery/game_engine/pose/build-pose-native-pi.sh"
fi

echo ""
echo "Done. On the Pi:"
echo "  ~/start.sh       — launch game launcher (TSX + WASM)"
echo "  ~/initservice.sh — (re)configure boot autostart"
echo ""
echo "WASM games in launcher menu (e.g. Rust Autopeli):"
echo "  ~/ranger/gallery/game_engine/games/autopeli_wasm/logic.wasm"
echo "  host binary: ~/ranger/tmp/game-sdl/game_sdl (wasm3 interpreter embedded)"
echo ""
if [[ "$RANGER_PI_AUTOSTART" == "1" ]]; then
  echo "Autostart configured. Log: tail -f ~/ranger-game.log"
fi
echo ""
echo "Audio device: RANGER_AUDIO_DEVICE=$AUDIO_DEV"
echo "  aplay -l && speaker-test -D plughw:N,0 -c 2 -t wav"
echo "  RANGER_AUDIO_DEVICE=plughw:0,0 bash gallery/game_engine/scripts/deploy-pi.sh pelit"
