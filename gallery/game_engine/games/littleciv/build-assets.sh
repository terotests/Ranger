#!/usr/bin/env bash
# Regenerate LittleCiv PNG assets (map / tiles / pieces / launcher icon).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
python3 "$ROOT/tools/gen_assets.py"
echo "LittleCiv assets written under $ROOT/assets/"
