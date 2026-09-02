#!/usr/bin/env python3
"""Run each ecosystem's own formatter over Ranger's output. PLAN_FORMAT.md
phase 4.

    python3 scripts/fmt_native.py <file-or-directory> ...
    python3 scripts/fmt_native.py bin/ --check
    python3 scripts/fmt_native.py tmp/out --strict

    npm run format:native -- <paths>

WHY THIS IS A SCRIPT AND NOT A COMPILER FLAG
--------------------------------------------
The plan drew phase 4 as `-format=native`. It is not, and cannot honestly be,
a flag: Ranger has no subprocess primitive. Giving the compiler one would mean
implementing process execution for eleven targets and putting "run an arbitrary
program off PATH" inside a compiler that is itself compiled to C++, Go, Rust
and the rest. That is a large capability to add for a cosmetic pass.

Outside the compiler it needs none of that, and it lands where the user asked
for it: a step you run, or do not.

WHAT IT GUARANTEES
------------------
Nothing it does is required. A formatter that is not installed is REPORTED and
skipped, never fatal. A formatter that fails leaves the file exactly as Ranger
wrote it -- each tool writes to a temporary first and the original is replaced
only on success, so a crashing formatter cannot truncate your output. The
default exit code is 0 even when every tool is missing.

`--strict` makes CI fail on a missing or failing tool, which is the plan's
"records which tools were present rather than silently skipping": a silent skip
is what makes a formatting gate meaningless.

`--check` changes nothing on disk and reports which files a tool would rewrite.
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile

# ext: (tool argv reading stdin and writing stdout, human name)
# Every one of these is a stdin->stdout filter, so nothing here edits a file in
# place and a tool that dies mid-write cannot leave a half-written source file.
FORMATTERS = {
    ".js":    (["prettier", "--stdin-filepath", "x.js"],            "prettier"),
    ".mjs":   (["prettier", "--stdin-filepath", "x.mjs"],           "prettier"),
    ".cjs":   (["prettier", "--stdin-filepath", "x.cjs"],           "prettier"),
    ".ts":    (["prettier", "--stdin-filepath", "x.ts"],            "prettier"),
    ".go":    (["gofmt"],                                           "gofmt"),
    ".rs":    (["rustfmt", "--emit", "stdout", "--edition", "2018",
                "--quiet"],                                         "rustfmt"),
    ".cpp":   (["clang-format", "--assume-filename=x.cpp"],         "clang-format"),
    ".hpp":   (["clang-format", "--assume-filename=x.hpp"],         "clang-format"),
    ".h":     (["clang-format", "--assume-filename=x.h"],           "clang-format"),
    ".py":    (["black", "-q", "-"],                                "black"),
    ".dart":  (["dart", "format", "--output=show"],                 "dart format"),
    ".kt":    (["ktlint", "--stdin", "-F"],                         "ktlint"),
    ".swift": (["swift-format"],                                    "swift-format"),
}

# prettier is normally reached through npx rather than installed on PATH.
NPX_FALLBACK = {"prettier"}


def resolve(argv, tool):
    if shutil.which(argv[0]):
        return argv
    if tool in NPX_FALLBACK and shutil.which("npx"):
        probe = subprocess.run(["npx", "--no-install", argv[0], "--version"],
                               capture_output=True, text=True)
        if probe.returncode == 0:
            return ["npx", "--no-install"] + argv
    return None


def collect(paths):
    out = []
    for p in paths:
        if os.path.isfile(p):
            out.append(p)
        elif os.path.isdir(p):
            for root, _dirs, files in os.walk(p):
                for f in sorted(files):
                    if os.path.splitext(f)[1] in FORMATTERS:
                        out.append(os.path.join(root, f))
        else:
            print("  not found: %s" % p)
    return [f for f in out if os.path.splitext(f)[1] in FORMATTERS]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="+")
    ap.add_argument("--check", action="store_true",
                    help="change nothing; report which files would be rewritten")
    ap.add_argument("--strict", action="store_true",
                    help="exit non-zero if any formatter is missing or fails")
    args = ap.parse_args()

    files = collect(args.paths)
    if not files:
        print("no source files with a known formatter")
        return 0

    missing, failed, changed, clean = {}, [], [], 0
    for path in files:
        ext = os.path.splitext(path)[1]
        argv, tool = FORMATTERS[ext]
        resolved = resolve(argv, tool)
        if resolved is None:
            missing.setdefault(tool, 0)
            missing[tool] += 1
            continue
        with open(path, encoding="utf-8") as fh:
            before = fh.read()
        try:
            r = subprocess.run(resolved, input=before, capture_output=True,
                               text=True, timeout=300, cwd=tempfile.gettempdir())
        except Exception as e:                                   # noqa: BLE001
            failed.append((path, tool, str(e)))
            continue
        # A tool that cannot parse the file has nothing useful to say about it,
        # and its stdout is not the file. Leave the file alone and report.
        if r.returncode != 0 or not r.stdout.strip():
            first = (r.stderr.strip().splitlines() or
                     ["exit %d" % r.returncode])[0]
            failed.append((path, tool, first))
            continue
        if r.stdout == before:
            clean += 1
            continue
        changed.append((path, tool))
        if not args.check:
            # written whole, then moved into place: a formatter that dies
            # mid-write cannot leave a truncated source file behind
            d = os.path.dirname(os.path.abspath(path))
            fd, tmp = tempfile.mkstemp(dir=d, suffix=ext)
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                fh.write(r.stdout)
            os.replace(tmp, path)

    verb = "would reformat" if args.check else "reformatted"
    print()
    print("  %-16s %d" % ("already clean:", clean))
    print("  %-16s %d" % (verb + ":", len(changed)))
    for path, tool in changed[:20]:
        print("      %-52s %s" % (path, tool))
    if len(changed) > 20:
        print("      ... and %d more" % (len(changed) - 20))
    if missing:
        print("  %-16s %s" % ("not installed:", ", ".join(
            "%s (%d file%s)" % (t, n, "" if n == 1 else "s")
            for t, n in sorted(missing.items()))))
        print("      those files were left exactly as Ranger wrote them")
    if failed:
        print("  %-16s %d" % ("tool failed:", len(failed)))
        for path, tool, why in failed[:10]:
            print("      %-40s %s: %s" % (path, tool, why))
        print("      those files were left exactly as Ranger wrote them")
    print()

    if args.strict and (missing or failed):
        print("--strict: a formatter was missing or failed")
        return 1
    if args.check and changed:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
