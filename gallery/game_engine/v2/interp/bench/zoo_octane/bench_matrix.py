#!/usr/bin/env python3
# Zoo.js / Octane matrix: score, wall time, peak RSS and binary size for
# every engine that can run the suites on this machine.
#
#   python3 bench_matrix.py                        # all engines, all suites
#   python3 bench_matrix.py --suites=richards,crypto --engines=qjs,duk,cpp
#   DUK=/path/to/duk python3 bench_matrix.py
#
# External engines (node / qjs / duk) run the RAW zoo suite files; the Ranger
# TS-engine targets (es6 / cpp / rust) run the same files through the exact
# preparation run.cjs applies (print prelude + inheritsFrom rewrite), so all
# engines execute the same benchmark bodies.
#
# Peak RSS is per-child via os.wait4 (ru_maxrss), so every cell is measured
# the same way, node's baseline included.
import os
import re
import resource
import shutil
import subprocess
import sys
import tempfile

DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(DIR, "..", "..", "..", "..", "..", ".."))
BIN = os.path.join(ROOT, "gallery", "game_engine", "v2", "interp", "bin")

ALL_SUITES = ["richards", "deltablue", "crypto", "raytrace",
              "earley-boyer", "regexp", "splay", "navier-stokes"]

PRELUDE = """
function print() {
  var s = "";
  for (var i = 0; i < arguments.length; i++) {
    if (i) s += " ";
    s += String(arguments[i]);
  }
  console.log(s);
}
"""

def prepare(src):
    s = re.sub(r'if \(typeof print == "undefined" && typeof console != "undefined"\) \{[\s\S]*?\n\}\n',
               "/* print provided by bench_matrix */\n", src)
    s = re.sub(r'Object\.defineProperty\(Object\.prototype,\s*["\']inheritsFrom["\']\s*,\s*\{[\s\S]*?\}\);',
               """Function.prototype.inheritsFrom = function (shuper) {
  function Inheriter() { }
  Inheriter.prototype = shuper.prototype;
  this.prototype = new Inheriter();
  this.superConstructor = shuper;
};""", s)
    return PRELUDE + s

NODE_DRIVER = ("const fs=require('fs'),vm=require('vm');"
               "global.print=(...a)=>console.log(a.join(' '));"
               "vm.runInThisContext(fs.readFileSync(process.argv[1],'utf8'));")

def run_measured(cmd, timeout):
    """Run cmd, return (status, out, wall_ms, peak_rss_kb)."""
    import time
    t0 = time.monotonic()
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    try:
        out, _ = proc.communicate(timeout=timeout)
        pid, status, ru = os.wait4(proc.pid, 0) if False else (proc.pid, proc.returncode, None)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.communicate()
        return ("TIMEOUT", "", (time.monotonic() - t0) * 1000, None)
    wall = (time.monotonic() - t0) * 1000
    # communicate() already reaped the child, so wait4 can't be used after it;
    # measure RSS via a re-run under a fork so rusage is per-child.
    return ("OK" if proc.returncode == 0 else f"exit {proc.returncode}", out.decode("utf8", "replace"), wall, None)

def run_with_rusage(cmd, timeout):
    """Fork so RUSAGE_CHILDREN covers exactly one child; returns dict."""
    import time
    r, w = os.pipe()
    pid = os.fork()
    if pid == 0:
        os.close(r)
        try:
            t0 = time.monotonic()
            p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
            try:
                out, _ = p.communicate(timeout=timeout)
                status = "OK" if p.returncode == 0 else "exit %d" % p.returncode
            except subprocess.TimeoutExpired:
                p.kill()
                p.communicate()
                out, status = b"", "TIMEOUT"
            wall = (time.monotonic() - t0) * 1000
            ru = resource.getrusage(resource.RUSAGE_CHILDREN)
            payload = repr((status, out.decode("utf8", "replace")[-8192:], wall, ru.ru_maxrss))
            os.write(w, payload.encode())
        finally:
            os.close(w)
            os._exit(0)
    os.close(w)
    chunks = []
    while True:
        b = os.read(r, 65536)
        if not b:
            break
        chunks.append(b)
    os.close(r)
    os.waitpid(pid, 0)
    import ast
    status, out, wall, rss = ast.literal_eval(b"".join(chunks).decode())
    return {"status": status, "out": out, "wall_ms": wall, "rss_kb": rss}

SCORE_RE = re.compile(r'^(?:\[tsx\]\s*)?([A-Za-z0-9]+): ([0-9.]+(?:e[+-][0-9]+)?)$')
ERR_RE = re.compile(r'^(?:\[tsx\]\s*)?([A-Za-z0-9]+): (.+)$')

def parse_scores(out):
    scores, errors = {}, {}
    for line in out.splitlines():
        line = line.strip()
        m = SCORE_RE.match(line)
        if m:
            scores[m.group(1)] = float(m.group(2))
            continue
        e = ERR_RE.match(line)
        if e and e.group(1) not in scores:
            errors[e.group(1)] = e.group(2)[:80]
    return scores, errors

def main():
    suites = ALL_SUITES
    engines = None
    timeout = 600
    for a in sys.argv[1:]:
        if a.startswith("--suites="):
            suites = a.split("=", 1)[1].split(",")
        elif a.startswith("--engines="):
            engines = a.split("=", 1)[1].split(",")
        elif a.startswith("--timeout="):
            timeout = int(a.split("=", 1)[1])

    duk = os.environ.get("DUK") or shutil.which("duk")
    qjs = shutil.which("qjs")
    node = shutil.which("node")

    prep_dir = tempfile.mkdtemp(prefix="zoo-matrix-")
    for s in suites:
        with open(os.path.join(DIR, s + ".js")) as f:
            raw = f.read()
        with open(os.path.join(prep_dir, s + ".js"), "w") as f:
            f.write(prepare(raw))

    defs = {}
    if node:
        defs["node"] = lambda s: [node, "-e", NODE_DRIVER, os.path.join(DIR, s + ".js")]
    if qjs:
        defs["qjs"] = lambda s: [qjs, os.path.join(DIR, s + ".js")]
    if duk:
        defs["duk"] = lambda s: [duk, os.path.join(DIR, s + ".js")]
    defs["es6"] = lambda s: [node, os.path.join(DIR, "es6_runner.cjs"), prep_dir, s + ".js"]
    for t in ("cpp", "rust"):
        b = os.path.join(BIN, t, "octane_runner")
        if os.path.exists(b):
            defs[t] = (lambda bb: lambda s: [bb, prep_dir, s + ".js"])(b)

    if engines:
        defs = {k: v for k, v in defs.items() if k in engines}

    results = {}
    for eng, mk in defs.items():
        results[eng] = {}
        for s in suites:
            sys.stderr.write(f"{eng:5s} {s} ... ")
            sys.stderr.flush()
            r = run_with_rusage(mk(s), timeout)
            scores, errors = parse_scores(r["out"])
            r["scores"], r["errors"] = scores, errors
            results[eng][s] = r
            main_score = None
            for k, v in scores.items():
                main_score = v if main_score is None else main_score
            sys.stderr.write(f"{r['status']} score={main_score} wall={r['wall_ms']:.0f}ms rss={r['rss_kb']}KB\n")

    import json
    out_path = os.path.join(DIR, "matrix-results.json")
    merged = {}
    if os.path.exists(out_path):
        try:
            with open(out_path) as f:
                merged = json.load(f)
        except Exception:
            merged = {}
    for eng, rows in results.items():
        merged.setdefault(eng, {}).update(rows)
    with open(out_path, "w") as f:
        json.dump(merged, f, indent=1)
    print("wrote", out_path)

if __name__ == "__main__":
    main()
