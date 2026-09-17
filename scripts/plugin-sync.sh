#!/usr/bin/env bash
#
# plugin-sync.sh — keep the distributed plugin's skills identical to the ones
# this repository uses itself.
#
# There are two audiences for the same text. A Claude session working IN this
# repository reads `.claude/skills/`; a session anywhere else installs the
# plugin and reads `plugins/ranger/skills/`. Two copies edited by hand drift,
# and the drift is invisible — the version you are not reading is the one that
# is wrong.
#
# So `.claude/skills/` is the source, this copies it, and `--check` fails when
# they differ. Skills that belong only to the plugin (ranger-start, example)
# are left alone.
#
#   scripts/plugin-sync.sh           copy
#   scripts/plugin-sync.sh --check   compare, exit 1 on a difference
set -u
cd "$(dirname "$0")/.."

shared="ranger-lang evg-edit rave"
src=.claude/skills
dst=plugins/ranger/skills
mode=${1-copy}

fail=0
for name in $shared; do
  if [ ! -f "$src/$name/SKILL.md" ]; then
    echo "plugin-sync: $src/$name/SKILL.md is missing" >&2
    fail=1
    continue
  fi
  if [ "$mode" = "--check" ]; then
    if ! diff -q "$src/$name/SKILL.md" "$dst/$name/SKILL.md" >/dev/null 2>&1; then
      echo "plugin-sync: $name differs between $src and $dst" >&2
      diff -u "$src/$name/SKILL.md" "$dst/$name/SKILL.md" | head -20 >&2
      fail=1
    fi
  else
    mkdir -p "$dst/$name"
    cp -R "$src/$name/." "$dst/$name/"
    echo "plugin-sync: $name"
  fi
done

if [ $fail -ne 0 ]; then
  if [ "$mode" = "--check" ]; then
    echo "plugin-sync: run scripts/plugin-sync.sh to update the plugin" >&2
  fi
  exit 1
fi
if [ "$mode" = "--check" ]; then
  echo "plugin-sync: the plugin's skills match .claude/skills"
fi
