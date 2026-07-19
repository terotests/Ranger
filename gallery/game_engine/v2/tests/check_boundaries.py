#!/usr/bin/env python3
# ==============================================================================
# check_boundaries.py — static gate for v2 abstraction / import isolation.
# ==============================================================================
# Run after the unit/contract suites (from tests/run.sh). Cheap filesystem
# scan — does not compile Ranger. Exit 0 only when:
#
#   1. No .rgr files live under games/ (games are TSX-only).
#   2. Every Import "…" that resolves OUTSIDE v2/ is listed in
#      boundary_import_allowlist.txt (shrink the list; do not grow it).
#   3. Live-core .rgr files contain no game-title identifiers (ylos*, autopeli,
#      pong, pacman, invaders, breakout, chess as whole words).
#
# Live core = runtime host modules render registry bridge interp imaging audio
# evg + top-level framebuffer/rgba — excluding **/tests/** and *_test.rgr.
# menu/ is excluded from (3) until the hardcoded catalog is data-driven.
# ==============================================================================
from __future__ import annotations

import os
import re
import sys

V2_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
# v2/ → game_engine/ → gallery/ → repo root
REPO_ROOT = os.path.abspath(os.path.join(V2_ROOT, "..", "..", ".."))
ALLOWLIST_PATH = os.path.join(os.path.dirname(__file__), "boundary_import_allowlist.txt")

IMPORT_RE = re.compile(r'Import\s+"([^"]+)"')
# Title names that must not appear in generic core .rgr (AGENTS.md).
GAME_NAME_RE = re.compile(
    r"(?i)(?<![A-Za-z0-9_])(ylos\d*|autopeli|\bpong\b|pacman|invaders|breakout|\bchess\b)(?![A-Za-z0-9_])"
)

LIVE_PREFIXES = (
    "runtime/",
    "host/",
    "modules/",
    "render/",
    "registry/",
    "bridge/",
    "interp/",
    "imaging/",
    "audio/",
    "evg/",
    "scripting/",
    "framebuffer.rgr",
    "rgba_fast_blit.rgr",
)

# Paths under live prefixes that are allowed to mention game names (none today).
GAME_NAME_EXCLUDE_SUFFIXES = (
    "/tests/",
    "_test.rgr",
)


def rel_v2(path: str) -> str:
    return os.path.relpath(path, V2_ROOT).replace("\\", "/")


def load_allowlist() -> set[str]:
    entries: set[str] = set()
    if not os.path.isfile(ALLOWLIST_PATH):
        return entries
    with open(ALLOWLIST_PATH, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            entries.add(line)
    return entries


def resolve_import(from_file: str, import_path: str) -> str:
    if import_path.startswith("gallery/"):
        return os.path.normpath(os.path.join(REPO_ROOT, import_path))
    return os.path.normpath(os.path.join(os.path.dirname(from_file), import_path))


def is_inside_v2(abs_path: str) -> bool:
    return abs_path == V2_ROOT or abs_path.startswith(V2_ROOT + os.sep)


def is_live_core(rel: str) -> bool:
    if any(rel.startswith(p) or rel == p for p in LIVE_PREFIXES):
        if any(s in rel for s in GAME_NAME_EXCLUDE_SUFFIXES):
            return False
        return True
    return False


def iter_rgr_files():
    for dirpath, _, files in os.walk(V2_ROOT):
        for name in files:
            if name.endswith(".rgr"):
                yield os.path.join(dirpath, name)


def check_no_rgr_in_games() -> list[str]:
    games = os.path.join(V2_ROOT, "games")
    bad: list[str] = []
    if not os.path.isdir(games):
        return bad
    for dirpath, _, files in os.walk(games):
        for name in files:
            if name.endswith(".rgr"):
                bad.append(rel_v2(os.path.join(dirpath, name)))
    return bad


def check_out_of_v2_imports(allowlist: set[str]) -> tuple[list[str], list[str]]:
    """Returns (new_violations, stale_allowlist_entries)."""
    found: set[str] = set()
    for fp in iter_rgr_files():
        rel = rel_v2(fp)
        with open(fp, encoding="utf-8", errors="replace") as fh:
            for lineno, line in enumerate(fh, 1):
                m = IMPORT_RE.search(line)
                if not m:
                    continue
                imp = m.group(1)
                abs_p = resolve_import(fp, imp)
                if is_inside_v2(abs_p):
                    continue
                key = f"{rel}:{imp}"
                found.add(key)
    new_violations = sorted(found - allowlist)
    stale = sorted(allowlist - found)
    # Format new with a hint path for the banner
    detailed = []
    for key in new_violations:
        detailed.append(key)
    return detailed, stale


def check_game_names_in_live_core() -> list[str]:
    hits: list[str] = []
    for fp in iter_rgr_files():
        rel = rel_v2(fp)
        if not is_live_core(rel):
            continue
        with open(fp, encoding="utf-8", errors="replace") as fh:
            for lineno, line in enumerate(fh, 1):
                # skip pure comment noise? still flag — comments naming a title
                # in core are the smell we want. Allow "game" as generic word.
                if GAME_NAME_RE.search(line):
                    hits.append(f"{rel}:{lineno}: {line.rstrip()}")
    return hits


def main() -> int:
    allowlist = load_allowlist()
    failed = 0

    print("### boundary gate (static)")
    print("  v2 root: gallery/game_engine/v2")

    games_rgr = check_no_rgr_in_games()
    if games_rgr:
        failed += 1
        print("  FAIL games/ must not contain .rgr (TSX-only packages):")
        for p in games_rgr:
            print(f"    - {p}")
    else:
        print("  PASS no .rgr under games/")

    new_imps, stale = check_out_of_v2_imports(allowlist)
    if new_imps:
        failed += 1
        print("  FAIL Import resolves outside v2/ (not in allowlist):")
        for p in new_imps:
            print(f"    - {p}")
        print("    fix the Import, or (staged debt only) add to")
        print("    tests/boundary_import_allowlist.txt and shrink later")
    else:
        print(f"  PASS out-of-v2 Imports ({len(allowlist)} allowlisted, 0 new)")

    if stale:
        # Soft: allowlist entries that disappeared are OK (progress) but print
        # so authors remove them from the file.
        print(f"  NOTE {len(stale)} allowlist entr(y/ies) no longer present — remove from allowlist:")
        for p in stale[:12]:
            print(f"    - {p}")
        if len(stale) > 12:
            print(f"    … and {len(stale) - 12} more")

    name_hits = check_game_names_in_live_core()
    if name_hits:
        failed += 1
        print("  FAIL game title identifier in live-core .rgr:")
        for h in name_hits[:20]:
            print(f"    - {h}")
        if len(name_hits) > 20:
            print(f"    … and {len(name_hits) - 20} more")
    else:
        print("  PASS no game-title identifiers in live-core .rgr")

    if failed:
        print("  SOME FAILED — boundary gate")
        return 1
    print("  ALL PASS — boundary gate")
    return 0


if __name__ == "__main__":
    sys.exit(main())
