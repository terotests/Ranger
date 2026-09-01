#!/usr/bin/env python3
"""Measure Ranger's output against each ecosystem's own formatter.

    python3 scripts/fmt_measure.py [--src FILE] [--out DIR] [--json FILE]
                                  [--only LANGS] [--format none|ranger]
    python3 scripts/fmt_measure.py --self-check

For every target it compiles the sample, runs that ecosystem's formatter, and
reports three numbers:

  changed lines   how much the formatter had to move. The verification
                  criterion of PLAN_FORMAT.md 7 is that this reaches zero.
  longest line    before and after, so wrapping work is visible separately
                  from indentation churn.
  redundant ()    parenthesised call receivers that did not need parens,
                  counted with comments and strings stripped -- a formatter
                  never touches a comment, so counting them makes the number
                  wrong (that mistake is recorded in PLAN_FORMAT.md 2).

A formatter that cannot PARSE the file is reported as such and never as a
zero-line diff. gofmt exits 2 on unparseable input having changed nothing,
which is indistinguishable from success if only the diff is counted. A
formatter that is not INSTALLED is likewise reported as such, with the paren
count still shown -- that number is measured on Ranger's own output and needs
no formatter.

`--format` passes -format= through to the compiler, so the before and after of
a formatting change can be measured from one compiler rather than two.

`--self-check` checks the paren counter against known cases. It has been wrong
once already: a regex anchored on an identifier head read `((a.b()).c()).d()`
as one redundant pair rather than two, because a parenthesised group is also a
legal head of a postfix expression. Run it before believing any number here.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# lang: (ranger -l= value, extension, extra compiler flags, formatter argv
#        producing formatted text on stdout, name of the tool)
TARGETS = [
    ("es6",        "js",   ["-es6"], ["npx", "--no-install", "prettier", "--stdin-filepath", "x.js"], "prettier"),
    ("go",         "go",   [],       ["gofmt"],                                                       "gofmt"),
    ("rust",       "rs",   [],       ["rustfmt", "--emit", "stdout", "--edition", "2018", "--quiet"],  "rustfmt"),
    ("cpp",        "cpp",  [],       ["clang-format", "--style=LLVM", "--assume-filename=x.cpp"],      "clang-format"),
    ("python",     "py",   [],       ["black", "-q", "-"],                                            "black"),
    ("dart",       "dart", [],       ["dart", "format", "--output=show", "--set-exit-if-changed"],     "dart format"),
    ("kotlin",     "kt",   [],       ["ktlint", "--stdin", "-F"],                                       "ktlint"),
    ("csharp",     "cs",   [],       ["dotnet", "format"],                                             "dotnet format"),
    ("swift6",     "swift",[],       ["swift-format"],                                                 "swift-format"),
]

LINE_COMMENT = {
    "js": "//", "go": "//", "rs": "//", "cpp": "//", "dart": "//", "py": "#",
    "kt": "//", "cs": "//", "swift": "//",
}


def strip_noise(text, ext):
    """Remove comments and string bodies. What is left is code the formatter
    is actually free to change, which is the only thing worth counting."""
    out = []
    i, n = 0, len(text)
    lc = LINE_COMMENT[ext]
    while i < n:
        c = text[i]
        if c in "\"'" or (ext == "py" and c == '"'):
            q = c
            out.append(q)
            i += 1
            while i < n and text[i] != q:
                if text[i] == "\\":
                    i += 1
                i += 1
            i += 1
            out.append(q)
            continue
        if text.startswith(lc, i):
            while i < n and text[i] != "\n":
                i += 1
            continue
        if ext != "py" and text.startswith("/*", i):
            j = text.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        out.append(c)
        i += 1
    return "".join(out)


# Is this text a postfix expression -- a name, a parenthesised group, and any
# chain of `.name`, `::name`, `->name`, `(args)` and `[index]` after it?
#
# A regex was tried first and undercounted: `((a.b()).c()).d()` has TWO
# redundant pairs, and a pattern anchored on an identifier head only ever saw
# the inner one. A parenthesised group is a primary expression, so it is a
# legal head -- which is exactly why the pair around it is redundant. Whether
# the group's OWN parens are needed is a separate question, asked when its own
# `)` comes up.
IDENT = re.compile(r"[A-Za-z_$][\w$]*")


def _match_bracket(s, i):
    """Index just past the group starting at s[i], or -1."""
    close = {"(": ")", "[": "]"}[s[i]]
    depth = 0
    while i < len(s):
        c = s[i]
        if c in "\"'":
            q, i = c, i + 1
            while i < len(s) and s[i] != q:
                i += 2 if s[i] == "\\" else 1
            if i >= len(s):
                return -1
        elif c in "([":
            depth += 1
        elif c in ")]":
            depth -= 1
            if depth == 0:
                return i + 1 if c == close else -1
        i += 1
    return -1


def is_postfix_expression(s):
    s = s.strip()
    if not s:
        return False
    if s[0] == "(":
        i = _match_bracket(s, 0)
        if i < 0:
            return False
    else:
        m = IDENT.match(s)
        if not m:
            return False
        i = m.end()
    while i < len(s):
        if s[i] in "([":
            j = _match_bracket(s, i)
            if j < 0:
                return False
            i = j
            continue
        for op in ("->", "::", "."):
            if s.startswith(op, i):
                m = IDENT.match(s, i + len(op))
                if not m:
                    return False
                i = m.end()
                break
        else:
            return False
    return True


def count_redundant_receiver_parens(code):
    """`(x).m()`, `(x)->m()` and every pair in `((a.b()).c()).d()` -- a paren
    group whose content is a postfix expression and which is immediately
    followed by a member access."""
    total = 0
    stack = []
    for i, c in enumerate(code):
        if c == "(":
            stack.append(i)
        elif c == ")" and stack:
            start = stack.pop()
            nxt = i + 1
            while nxt < len(code) and code[nxt] in " \t":
                nxt += 1
            arrow = code.startswith("->", nxt)
            if nxt < len(code) and (code[nxt] == "." or arrow):
                # not a decimal point: `(1).0` is not a receiver in any target
                if (not arrow) and nxt + 1 < len(code) and code[nxt + 1].isdigit():
                    continue
                if is_postfix_expression(code[start + 1:i]):
                    total += 1
    return total


def longest_line(text):
    return max((len(l) for l in text.splitlines()), default=0)


def changed_lines(a, b):
    import difflib
    n = 0
    for line in difflib.unified_diff(a.splitlines(), b.splitlines(), n=0, lineterm=""):
        if (line.startswith("+") and not line.startswith("+++")) or \
           (line.startswith("-") and not line.startswith("---")):
            n += 1
    return n


def compile_target(src, lang, ext, flags, outdir, fmt=None):
    name = "sample." + ext
    os.makedirs(os.path.join(ROOT, outdir), exist_ok=True)
    env = dict(os.environ)
    env["RANGER_LIB"] = "./compiler/Lang.rgr:./lib/stdops.rgr"
    cmd = ["node", "--max-old-space-size=8192", "bin/output.js", "-l=" + lang,
           src, "-d=" + outdir, "-o=" + name, "-nodecli"] + flags
    if fmt:
        cmd.append("-format=" + fmt)
    r = subprocess.run(cmd, cwd=ROOT, env=env, capture_output=True, text=True)
    path = os.path.join(ROOT, outdir, name)
    if r.returncode != 0 or not os.path.exists(path):
        return None, (r.stdout + r.stderr).strip().splitlines()[-3:]
    return path, None


def run_formatter(argv, path, tool):
    if shutil.which(argv[0]) is None and argv[0] != "npx":
        return None, "%s not installed" % tool
    with open(path, encoding="utf-8") as f:
        text = f.read()
    try:
        r = subprocess.run(argv, input=text, capture_output=True, text=True,
                           cwd="/tmp", timeout=300)
    except Exception as e:                                   # noqa: BLE001
        return None, str(e)
    if r.returncode != 0 and not r.stdout.strip():
        first = (r.stderr.strip().splitlines() or ["exit %d" % r.returncode])[0]
        return None, "DOES NOT PARSE: " + first
    return r.stdout, None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="gallery/vela/src/VlChart.rgr")
    ap.add_argument("--out", default="tmp/fmt-measure")
    ap.add_argument("--json", default=None)
    ap.add_argument("--self-check", action="store_true",
                    help="check the paren counter against known cases and exit")
    ap.add_argument("--only", default=None, help="comma-separated target langs")
    ap.add_argument("--format", default=None,
                    help="pass -format=VALUE to the compiler (none | ranger)")
    args = ap.parse_args()

    if args.self_check:
        cases = [("(a).m()", 1), ("a.m()", 0), ("((a.b()).c()).d()", 2),
                 ("(a+b).m()", 0), ("(x)->y", 1), ("x->y", 0),
                 ("(1).toString()", 0), ("(a)[0]", 0), ('(f(")(")).m()', 1),
                 ("(a as T).m()", 0), ("(new X()).m()", 0),
                 ("(this).find(id)", 1), ("(xs[i]).get()", 1),
                 ("(((a).b()).c()).d()", 3), ("((a+b).c()).d()", 1)]
        bad = [(t, e, count_redundant_receiver_parens(t)) for t, e in cases
               if count_redundant_receiver_parens(t) != e]
        for t, e, g in bad:
            print("  %-24s expected %d, got %d" % (t, e, g))
        print("counter self-check: %s" % ("all pass" if not bad else "FAILED"))
        return 1 if bad else 0

    only = set(args.only.split(",")) if args.only else None
    rows = []
    for lang, ext, flags, fargv, tool in TARGETS:
        if only and lang not in only:
            continue
        outdir = os.path.join(args.out, lang)
        path, err = compile_target(args.src, lang, ext, flags, outdir, args.format)
        if path is None:
            rows.append(dict(target=lang, tool=tool, status="compile failed",
                             detail=" / ".join(err or [])))
            continue
        before = open(path, encoding="utf-8").read()
        parens_before = count_redundant_receiver_parens(strip_noise(before, ext))
        after, ferr = run_formatter(fargv, path, tool)
        row = dict(target=lang, tool=tool, lines=len(before.splitlines()),
                   longest_before=longest_line(before),
                   parens_before=parens_before)
        if after is None:
            # The paren count is still meaningful: it is measured on Ranger's
            # own output and needs no formatter. Only the "changed" column
            # depends on one, so report the rest rather than a blank row.
            row.update(status=ferr)
        else:
            row.update(status="ok", changed=changed_lines(before, after),
                       longest_after=longest_line(after),
                       parens_after=count_redundant_receiver_parens(
                           strip_noise(after, ext)))
        rows.append(row)

    w = "%-11s %-13s %-9s %-13s %-11s %s"
    print()
    print(w % ("target", "formatter", "lines", "changed", "longest", "redundant ()"))
    print("-" * 78)
    for r in rows:
        if r["status"] != "ok":
            print(w % (r["target"], r["tool"], r.get("lines", "-"),
                       r["status"][:13],
                       "%s" % r.get("longest_before", "-"),
                       "%s -> ?" % r.get("parens_before", "-")))
            continue
        print(w % (r["target"], r["tool"], r["lines"],
                   "%d" % r["changed"],
                   "%d -> %d" % (r["longest_before"], r["longest_after"]),
                   "%d -> %d" % (r["parens_before"], r["parens_after"])))
    print()
    bad = [r for r in rows if r["status"] not in ("ok",) and "not installed" not in r["status"]]
    for r in bad:
        print("  %s: %s" % (r["target"], r.get("detail") or r["status"]))
    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump(rows, f, indent=2)
        print("wrote " + args.json)
    return 0


if __name__ == "__main__":
    sys.exit(main())
