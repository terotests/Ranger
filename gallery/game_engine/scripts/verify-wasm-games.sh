#!/usr/bin/env bash
# Verify every launcher game module referenced by a games/*/game.info actually
# exists and is well-formed.
#
# Why: the launcher reads game.info to decide how to run a game (engine=wasm |
# ui | streaming | as, render=3d | sprites, module=<file>). A game whose
# module is MISSING or PARTIAL still "deploys successfully" via rsync, but at
# launch the wasm runner fails to load it and abortWasmLoad() bounces straight
# back to the menu — the game just "doesn't start". This check turns that into
# a loud, early deploy failure instead of a silent runtime bounce.
#
# Runs anywhere (local dev box or on the Pi over ssh) against a games dir:
#   bash verify-wasm-games.sh gallery/game_engine/games
#   bash verify-wasm-games.sh ~/ranger/gallery/game_engine/games
#
# Exit codes: 0 = all referenced modules OK, 1 = one or more missing/invalid,
# 2 = usage / games dir not found.

set -uo pipefail

GAMES_DIR="${1:?usage: verify-wasm-games.sh <games-dir>}"

if [[ ! -d "$GAMES_DIR" ]]; then
  echo "verify-wasm-games: games dir not found: $GAMES_DIR" >&2
  exit 2
fi

# Minimum plausible size for a real compiled .wasm module. A truncated / empty
# logic.wasm is the exact failure this guards against.
WASM_MIN_BYTES="${WASM_MIN_BYTES:-512}"

fail=0
checked=0

# 0 if the file begins with the WebAssembly magic bytes 0x00 61 73 6d ("\0asm").
is_wasm() {
  local f="$1" magic
  [[ -f "$f" ]] || return 1
  magic=$(head -c 4 "$f" 2>/dev/null | od -An -tx1 2>/dev/null | tr -d ' \n')
  [[ "$magic" == "0061736d" ]]
}

# Read a "key=value" field from game.info (first match; strip CR for CRLF files).
info_field() {
  sed -n "s/^$1=//p" "$2" 2>/dev/null | head -1 | tr -d '\r'
}

echo "verify-wasm-games: scanning $GAMES_DIR"
while IFS= read -r info; do
  dir=$(dirname "$info")
  name=$(basename "$dir")
  engine=$(info_field engine "$info")
  module=$(info_field module "$info")
  render=$(info_field render "$info")

  # A game.info with no module= line is a plain .tsx game (index.tsx) — nothing
  # to verify here.
  [[ -z "$module" ]] && continue

  path="$dir/$module"
  checked=$((checked + 1))
  meta="engine=${engine:-?}${render:+ render=$render}"

  if [[ ! -f "$path" ]]; then
    echo "  MISSING  $name: $module ($meta)"
    fail=1
    continue
  fi

  size=$(wc -c < "$path" | tr -d ' ')

  case "$module" in
    *.wasm)
      if ! is_wasm "$path"; then
        echo "  BADWASM  $name: $module — missing \\0asm magic (size=$size, $meta)"
        fail=1
      elif [[ "$size" -lt "$WASM_MIN_BYTES" ]]; then
        echo "  TINY     $name: $module — only $size bytes (< $WASM_MIN_BYTES, likely truncated, $meta)"
        fail=1
      else
        echo "  OK       $name: $module ($size bytes, $meta)"
      fi
      ;;
    *)
      # engine=as / interpreted .as source, or any other referenced module:
      # verify it is at least present and non-empty.
      if [[ "$size" -le 0 ]]; then
        echo "  EMPTY    $name: $module (0 bytes, $meta)"
        fail=1
      else
        echo "  OK       $name: $module ($size bytes, $meta)"
      fi
      ;;
  esac
done < <(find "$GAMES_DIR" -maxdepth 2 -name game.info | sort)

echo "verify-wasm-games: checked $checked module(s) under $GAMES_DIR"
if [[ "$fail" != "0" ]]; then
  echo "verify-wasm-games: FAILED — fix the module(s) above before deploying" >&2
  exit 1
fi
echo "verify-wasm-games: all referenced modules OK"
exit 0
