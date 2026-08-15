#!/usr/bin/env python3
# ==============================================================================
# check_boundaries.py — static gate for v2 abstraction / import isolation.
# ==============================================================================
# Run after the unit/contract suites (from tests/run.sh). Cheap filesystem
# scan — does not compile Ranger. Exit 0 only when:
#
#   1. No .rgr files live under games/ (games are TSX-only).
#   2. Every Import "…" that resolves OUTSIDE v2/ is either a sanctioned
#      shared root (SHARED_ROOTS) or listed in boundary_import_allowlist.txt
#      (shrink the list; do not grow it).
#   3. Live-core .rgr files contain no game-title identifiers (discovered
#      from games/*/game.info folder names + classic forbidden titles).
#
# Live core = runtime host modules render registry bridge interp imaging audio
# evg scripting web menu + top-level framebuffer/rgba — excluding **/tests/**,
# **/guests/**, and *_test.rgr.
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

# Roots outside v2/ that v2 is MEANT to depend on.
#
# gallery/evg/ is the single EVG layout engine. v2 used to carry its own copy;
# it drifted about 200 lines ahead of the other one, and the two disagreeing
# was a source of real bugs, so the fork was deleted on purpose and everything
# now compiles against one set of files (see gallery/evg/
# PLAN_CSS_LAYOUT_AND_FONTS.md §11.1 "One engine, one location").
#
# That makes these Imports the intended shape rather than staged debt, which is
# what the allowlist is for — the allowlist says "shrink this", and there is
# nothing here to shrink. Anything genuinely temporary still belongs there.
SHARED_ROOTS = (
    os.path.join(REPO_ROOT, "gallery", "evg"),
)

# Classic titles that must stay out of core even when not present under games/.
CLASSIC_TITLES = (
    "autopeli",
    "pong",
    "pacman",
    "invaders",
    "breakout",
    "chess",
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
    "web/",
    "menu/",
    "framebuffer.rgr",
    "rgba_fast_blit.rgr",
)

# Paths under live prefixes that are allowed to mention game names.
GAME_NAME_EXCLUDE_SUFFIXES = (
    "/tests/",
    "_test.rgr",
    "/guests/",
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


def discover_game_titles() -> list[str]:
    """Folder names under games/ that have game.info, plus classic titles.

    Also keeps a ylos\\w* family match so ylos3d (no game.info today) and
    comment forms like ylos2_screenshot stay gated.
    """
    names: set[str] = set(CLASSIC_TITLES)
    games = os.path.join(V2_ROOT, "games")
    if os.path.isdir(games):
        for entry in sorted(os.listdir(games)):
            gdir = os.path.join(games, entry)
            if not os.path.isdir(gdir):
                continue
            if os.path.isfile(os.path.join(gdir, "game.info")):
                names.add(entry)
    # Always gate the ylos* family (folder names + legacy spellings).
    alts = sorted(re.escape(n) for n in names)
    alts.append(r"ylos\w*")
    return alts


def build_game_name_re() -> re.Pattern[str]:
    alts = discover_game_titles()
    # Longer alternatives first so ylos3d_wasm wins over ylos3d over ylos.
    alts.sort(key=lambda s: (-len(s.replace("\\", "")), s))
    return re.compile(
        r"(?i)(?<![A-Za-z0-9_])(" + "|".join(alts) + r")(?![A-Za-z0-9_])"
    )


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


def is_shared_root(path: str) -> bool:
    """True for a dependency v2 is meant to have (see SHARED_ROOTS)."""
    ap = os.path.abspath(path)
    for root in SHARED_ROOTS:
        if ap == root or ap.startswith(root + os.sep):
            return True
    return False


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
                if is_inside_v2(abs_p) or is_shared_root(abs_p):
                    continue
                key = f"{rel}:{imp}"
                found.add(key)
    new_violations = sorted(found - allowlist)
    stale = sorted(allowlist - found)
    return new_violations, stale


def check_game_names_in_live_core(game_name_re: re.Pattern[str]) -> list[str]:
    hits: list[str] = []
    for fp in iter_rgr_files():
        rel = rel_v2(fp)
        if not is_live_core(rel):
            continue
        with open(fp, encoding="utf-8", errors="replace") as fh:
            for lineno, line in enumerate(fh, 1):
                # Flag comments too — naming a title in core is the smell.
                if game_name_re.search(line):
                    hits.append(f"{rel}:{lineno}: {line.rstrip()}")
    return hits


def main() -> int:
    allowlist = load_allowlist()
    game_name_re = build_game_name_re()
    failed = 0

    print("### boundary gate (static)")
    print("  v2 root: gallery/game_engine/v2")
    print(f"  titles: {len(discover_game_titles())} patterns (games/*/game.info + classics)")

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

    name_hits = check_game_names_in_live_core(game_name_re)
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
