#!/usr/bin/env python3
"""Which target keywords does Ranger emit verbatim, producing output that the
target cannot parse?

    python3 scripts/reserved_probe.py go
    python3 scripts/reserved_probe.py go rust swift6 --verbose

For every keyword of the target language it compiles a one-variable Ranger
program that names a local after that keyword and asks the target's own parser
whether the result is a program. A name that Ranger itself cannot spell (`if`,
`return`, `class`) is reported separately from one that Ranger spells fine and
the target then rejects -- only the second kind is a defect.

This exists because the reserved_words table in compiler/Lang.rgr was filled in
as errors were hit rather than from any language's keyword list, and the Go
block had 2 of 25 entries (ISSUES.md #76).
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

KEYWORDS = {
    "go": """break case chan const continue default defer else fallthrough for
        func go goto if import interface map package range return select struct
        switch type var""".split(),
    "rust": """as async await box break const continue crate dyn else enum extern
        false fn for if impl in let loop match mod move mut pub ref return self
        static struct super trait true type unsafe use where while yield try
        macro union""".split(),
    "swift6": """associatedtype borrowing class consuming deinit enum extension
        fileprivate func import init inout internal let nonisolated open operator
        private precedencegroup protocol public rethrows static struct subscript
        typealias var where while guard defer do else fallthrough for in repeat
        return switch case break continue default throw catch throws try as is
        any some await async self super nil true false""".split(),
    "kotlin": """as break class continue do else false for fun if in interface is
        null object package return super this throw true try typealias typeof val
        var when while by catch constructor delegate dynamic field file finally
        get import init param property receiver set setparam value where""".split(),
    "es6": """await break case catch class const continue debugger default delete
        do else enum export extends false finally for function if implements
        import in instanceof interface let new null package private protected
        public return static super switch this throw true try typeof var void
        while with yield""".split(),
    "python": """False None True and as assert async await break class continue
        def del elif else except finally for from global if import in is lambda
        nonlocal not or pass raise return try while with yield match case
        type""".split(),
    "cpp": """alignas alignof and and_eq asm auto bitand bitor bool break case
        catch char class compl concept const consteval constexpr constinit
        const_cast continue co_await co_return co_yield decltype default delete
        do double dynamic_cast else enum explicit export extern false float for
        friend goto if inline int long mutable namespace new noexcept not not_eq
        nullptr operator or or_eq private protected public register
        reinterpret_cast requires return short signed sizeof static
        static_assert static_cast struct switch template this thread_local throw
        true try typedef typeid typename union unsigned using virtual void
        volatile wchar_t while xor xor_eq""".split(),
    "csharp": """abstract as base bool break byte case catch char checked class
        const continue decimal default delegate do double else enum event
        explicit extern false finally fixed float for foreach goto if implicit in
        int interface internal is lock long namespace new null object operator
        out override params private protected public readonly ref return sbyte
        sealed short sizeof stackalloc static string struct switch this throw
        true try typeof uint ulong unchecked unsafe ushort using virtual void
        volatile while""".split(),
    "dart": """abstract as assert async await break case catch class const
        continue covariant default deferred do dynamic else enum export extends
        extension external factory false final finally for get hide if implements
        import in interface is late library mixin new null on operator part
        required rethrow return sealed set show static super switch sync this
        throw true try typedef var void when while with yield""".split(),
}

# How to ask the target whether the emitted file is a program at all. A target
# whose parser is not installed is reported as UNCHECKED, never as a pass -- a
# silent skip reads as "no collisions" and that is how the Go block stayed at 2
# entries for so long.
PARSE_CHECK = {
    "go":     ("go",    ["gofmt", "-e"]),
    "rust":   ("rs",    ["rustfmt", "--emit", "stdout", "--edition", "2018", "--quiet"]),
    "es6":    ("js",    ["node", "--check", "-"]),
    "python": ("py",    ["python3", "-c",
                         "import sys;compile(sys.stdin.read(),'p','exec')"]),
    "cpp":    ("cpp",   ["g++", "-fsyntax-only", "-std=c++17", "-x", "c++", "-"]),
    "dart":   ("dart",  ["dart", "format", "--output=none"]),
    "swift6": ("swift", ["swiftc", "-parse", "-"]),
    "kotlin": ("kt",    None),
    "csharp": ("cs",    None),
}

PROGRAM = """class ProbeT {
  fn run:int (%(kw)s:int) {
    def %(kw)s2:int %(kw)s
    %(kw)s2 = %(kw)s2 + 1
    return %(kw)s2
  }
}
class ProbeMain {
  sfn main:void () {
    def t:ProbeT (new ProbeT())
    def r:int (t.run(1))
    print ("" + r)
  }
}
"""


def probe(lang, kw, workdir):
    ext, checker = PARSE_CHECK[lang]
    src = os.path.join(workdir, "probe.rgr")
    with open(src, "w", encoding="utf-8") as f:
        f.write(PROGRAM % {"kw": kw})
    env = dict(os.environ)
    env["RANGER_LIB"] = "./compiler/Lang.rgr:./lib/stdops.rgr"
    rel = os.path.relpath(src, ROOT)
    out = os.path.relpath(workdir, ROOT)
    # The previous keyword's output is still sitting there. Without this a
    # compile that FAILED leaves the last file in place and reads as a pass.
    stale = os.path.join(workdir, "probe." + ext)
    if os.path.exists(stale):
        os.remove(stale)
    r = subprocess.run(
        ["node", "bin/output.js", "-l=" + lang, rel, "-d=" + out,
         "-o=probe." + ext, "-nodecli"],
        cwd=ROOT, env=env, capture_output=True, text=True)
    path = os.path.join(workdir, "probe." + ext)
    if r.returncode != 0 or not os.path.exists(path):
        return "ranger-rejects", ""
    if checker is None or shutil.which(checker[0]) is None:
        return "unchecked", ""
    text = open(path, encoding="utf-8").read()
    c = subprocess.run(checker, input=text, capture_output=True, text=True,
                       cwd="/tmp", timeout=120)
    if c.returncode != 0 and not c.stdout.strip():
        msg = (c.stderr.strip().splitlines() or ["exit %d" % c.returncode])[0]
        return "BROKEN", msg
    return "ok", ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("langs", nargs="+")
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()
    rc = 0
    for lang in args.langs:
        if lang not in KEYWORDS:
            print("no keyword list for " + lang)
            continue
        broken, unspellable, fine, unchecked = [], [], [], []
        with tempfile.TemporaryDirectory(dir=os.path.join(ROOT, "tmp")) as wd:
            for kw in sorted(set(KEYWORDS[lang])):
                status, msg = probe(lang, kw, wd)
                if status == "BROKEN":
                    broken.append((kw, msg))
                elif status == "ranger-rejects":
                    unspellable.append(kw)
                elif status == "unchecked":
                    unchecked.append(kw)
                else:
                    fine.append(kw)
        print("\n== %s ==" % lang)
        print("  emitted verbatim, target REJECTS the file (%d): %s"
              % (len(broken), " ".join(k for k, _ in broken) or "-"))
        print("  not spellable in Ranger        (%d): %s"
              % (len(unspellable), " ".join(unspellable) or "-"))
        print("  fine                           (%d)" % len(fine))
        if unchecked:
            print("  UNCHECKED, no parser installed (%d) -- this target was NOT"
                  " verified" % len(unchecked))
        if args.verbose:
            for k, m in broken:
                print("      %-14s %s" % (k, m))
        if broken:
            rc = 1
    return rc


if __name__ == "__main__":
    sys.exit(main())
