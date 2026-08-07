#!/usr/bin/env python3
"""Compare Ranger ComponentEngine vs QuickJS / Duktape / Node on Octane Richards.

Measures binary size, fixed-work Richards throughput, peak RSS, and (where the
engine finishes) full adaptive Octane scores.

Native C++/Rust builds leak under the full adaptive harness (cycle retention
with shared_ptr/Rc), so those targets use a short fixed-iteration driver.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

ROOT = Path("/workspace")
BENCH = ROOT / "gallery/game_engine/v2/interp/bench/zoo_octane"
BINROOT = ROOT / "gallery/game_engine/v2/interp/bin"
QJS = Path("/tmp/js-engines/qjs")
DUK = Path("/tmp/js-engines/duk")
OUT = BENCH / "compare_results"
ART = Path("/opt/cursor/artifacts")

N_FIXED = 20
N_TINY = 5
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


def prepare_engine_src(src: str) -> str:
    s = re.sub(
        r'if \(typeof print == "undefined" && typeof console != "undefined"\) \{[\s\S]*?\n\}\n',
        "/*print*/\n",
        src,
    )
    s = re.sub(
        r'Object\.defineProperty\(Object\.prototype,\s*["\']inheritsFrom["\']\s*,\s*\{[\s\S]*?\}\);',
        """Function.prototype.inheritsFrom = function (shuper) {
  function Inheriter() { }
  Inheriter.prototype = shuper.prototype;
  this.prototype = new Inheriter();
  this.superConstructor = shuper;
};""",
        s,
    )
    return PRELUDE + s


def strip_runsuites(src: str) -> str:
    return re.sub(
        r"BenchmarkSuite\.config\.doWarmup = undefined;\n"
        r"BenchmarkSuite\.config\.doDeterministic = undefined;\n\n"
        r"BenchmarkSuite\.RunSuites\([\s\S]*?\);",
        "",
        src,
    )


def fixed_driver(n: int) -> str:
    return f"""
var __N = {n};
var __t0 = new Date();
for (var __i = 0; __i < __N; __i++) runRichards();
var __ms = new Date() - __t0;
print("FIXED_RICHARDS_MS: " + __ms);
print("FIXED_RICHARDS_N: " + __N);
print("FIXED_RICHARDS_US_PER: " + ((__ms * 1000) / __N));
print("RichardsApprox: " + (100 * (35302 / ((__ms * 1000) / __N))));
"""


def run_cmd(cmd, cwd="/workspace", timeout=300):
    out_f = tempfile.NamedTemporaryFile(delete=False)
    err_f = tempfile.NamedTemporaryFile(delete=False)
    out_f.close()
    err_f.close()
    t0 = time.perf_counter()
    pid = os.fork()
    if pid == 0:
        try:
            os.chdir(cwd)
            fd1 = os.open(out_f.name, os.O_WRONLY | os.O_TRUNC)
            fd2 = os.open(err_f.name, os.O_WRONLY | os.O_TRUNC)
            os.dup2(fd1, 1)
            os.dup2(fd2, 2)
            os.close(fd1)
            os.close(fd2)
            os.execvp(cmd[0], cmd)
        except Exception as e:
            import sys

            sys.stderr.write(str(e))
            os._exit(127)
    peak = 0
    while True:
        wpid, status, ru = os.wait4(pid, os.WNOHANG)
        try:
            with open(f"/proc/{pid}/status") as f:
                for line in f:
                    if line.startswith("VmRSS:"):
                        peak = max(peak, int(line.split()[1]))
                        break
        except Exception:
            pass
        if wpid != 0:
            break
        if time.perf_counter() - t0 > timeout:
            try:
                os.kill(pid, 9)
            except Exception:
                pass
            wpid, status, ru = os.wait4(pid, 0)
            break
        time.sleep(0.02)
    elapsed = time.perf_counter() - t0
    if os.WIFEXITED(status):
        rc = os.WEXITSTATUS(status)
    elif os.WIFSIGNALED(status):
        rc = -os.WTERMSIG(status)
    else:
        rc = -1
    out = Path(out_f.name).read_text(errors="replace")
    err = Path(err_f.name).read_text(errors="replace")
    Path(out_f.name).unlink(missing_ok=True)
    Path(err_f.name).unlink(missing_ok=True)
    return {
        "rc": rc,
        "elapsed_s": elapsed,
        "peak_rss_kb": peak,
        "maxrss_kb": ru.ru_maxrss,
        "out": out,
        "err": err,
    }


def parse_fixed(text: str) -> dict:
    d = {}
    for line in text.splitlines():
        line = line.strip().replace("[tsx] ", "")
        m = re.match(
            r"(FIXED_RICHARDS_MS|FIXED_RICHARDS_N|FIXED_RICHARDS_US_PER|RichardsApprox): ([0-9.eE+-]+)",
            line,
        )
        if m:
            d[m.group(1)] = float(m.group(2))
    return d


def parse_scores(text: str) -> dict:
    scores = {}
    for line in text.splitlines():
        line = line.strip().replace("[tsx] ", "")
        m = re.match(r"^([A-Za-z0-9]+): ([0-9.eE+-]+)$", line)
        if m:
            scores[m.group(1)] = float(m.group(2))
            continue
        m = re.match(r"^([A-Za-z0-9]+): (.+)$", line)
        if m and any(
            x in m.group(2)
            for x in ("Error", "Wrong", "Alert", "FAIL", "checksum", "incorrect", "not found")
        ):
            scores[m.group(1)] = None
            scores[m.group(1) + "_error"] = m.group(2)
    return scores


def sizes(p: Path) -> dict:
    p = Path(p)
    info = {"on_disk": p.stat().st_size, "path": str(p)}
    if p.suffix != ".cjs" and os.access(p, os.X_OK):
        sp = Path("/tmp") / (p.name + ".szstrip")
        subprocess.run(
            ["strip", "-o", str(sp), str(p)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if sp.exists():
            info["stripped"] = sp.stat().st_size
        r = subprocess.run(["size", "-A", str(p)], capture_output=True, text=True)
        for line in r.stdout.splitlines():
            parts = line.split()
            if len(parts) >= 2 and parts[0] in (".text", ".rodata"):
                info[parts[0]] = int(parts[1])
    return info


def main() -> None:
    OUT.mkdir(exist_ok=True)
    ART.mkdir(parents=True, exist_ok=True)
    prep = Path(tempfile.mkdtemp(prefix="fixed-richards-"))
    print("prep dir", prep, flush=True)

    raw = (BENCH / "richards.js").read_text()
    body = strip_runsuites(raw)
    (prep / "richards_host.js").write_text(body + fixed_driver(N_FIXED))
    (prep / "richards_eng.js").write_text(prepare_engine_src(body + fixed_driver(N_FIXED)))
    (prep / "richards_tiny.js").write_text(prepare_engine_src(body + fixed_driver(N_TINY)))

    es6_script = f"""
const fs = require("fs");
const {{ ComponentEngine, EvalValue }} = require({json.dumps(str(BINROOT / "engine_module.cjs"))});
const prepared = fs.readFileSync({json.dumps(str(prep / "richards_eng.js"))}, "utf8");
const e = new ComponentEngine();
e.quiet = true; e.liveClock = true; e.maxLoopIterations = 1e9;
const oLog = console.log;
console.log = (...a) => oLog(a.map(String).join(" "));
e.loadScript(prepared + "\\nfunction __zoo_done__() {{ return 'done'; }}\\n");
e.callFunction("__zoo_done__", EvalValue.null());
"""
    (prep / "es6_run.cjs").write_text(es6_script)

    results = {
        "n_fixed": N_FIXED,
        "n_tiny": N_TINY,
        "host": {
            "cpu": next(
                (
                    l.split(":", 1)[1].strip()
                    for l in Path("/proc/cpuinfo").read_text().splitlines()
                    if l.startswith("model name")
                ),
                "?",
            ),
            "node": subprocess.check_output(["node", "--version"], text=True).strip(),
            "g++": subprocess.check_output(["g++", "--version"], text=True).splitlines()[0],
            "rustc": subprocess.check_output(["rustc", "--version"], text=True).strip(),
            "qjs": "QuickJS 2024-01-13 (-O2 -flto, stripped)",
            "duk": "Duktape 2.7.0 (gcc -O3 + print/console)",
            "ranger_commit": subprocess.check_output(
                ["git", "rev-parse", "--short", "HEAD"], text=True
            ).strip(),
            "ranger_cpp_flags": "g++ -O3 -march=native -std=c++17",
            "ranger_rust_flags": "rustc -C opt-level=3 -C target-cpu=native -C codegen-units=1",
        },
        "binaries": {
            "qjs": sizes(QJS),
            "duk": sizes(DUK),
            "duk_stripped": sizes(Path("/tmp/js-engines/duk-stripped")),
            "ranger_cpp": sizes(BINROOT / "cpp" / "octane_runner"),
            "ranger_rust": sizes(BINROOT / "rust" / "octane_runner")
            if (BINROOT / "rust" / "octane_runner").exists()
            else None,
            "ranger_es6_module": sizes(BINROOT / "engine_module.cjs"),
        },
        "runs": {},
        "full_octane": {},
        "full_octane_ranger_es6": {},
        "tiny_n5": {},
        "zoo_published": {
            "QuickJS Richards": 787,
            "Duktape Richards": 381,
            "QuickJS binary": "1.1M",
            "Duktape binary": "691K",
            "V8 Richards (amd64)": 37102,
        },
    }

    print("=== BINARY SIZES ===", flush=True)
    for k, info in results["binaries"].items():
        if not info:
            print(f"{k}: MISSING", flush=True)
            continue
        print(
            f"{k:22} disk={info['on_disk']:,} stripped={info.get('stripped', '-')} "
            f"text={info.get('.text', '-')} rodata={info.get('.rodata', '-')}",
            flush=True,
        )

    targets = [
        ("node", ["node", str(prep / "richards_host.js")]),
        ("qjs", [str(QJS), str(prep / "richards_host.js")]),
        ("duk", [str(DUK), str(prep / "richards_host.js")]),
        ("ranger_es6", ["node", str(prep / "es6_run.cjs")]),
    ]
    # Prefer tiny N for native first to guarantee a completing sample, then try N_FIXED.
    print(f"\n=== TINY FIXED RICHARDS N={N_TINY} (cpp/rust) ===", flush=True)
    for name, target in [("ranger_cpp", "cpp"), ("ranger_rust", "rust")]:
        binp = BINROOT / target / "octane_runner"
        if not binp.exists():
            print(f"  {name}: SKIP missing binary", flush=True)
            continue
        print(f"  {name}...", flush=True)
        r = run_cmd([str(binp), str(prep), "richards_tiny.js"], timeout=120)
        parsed = parse_fixed(r["out"] + "\n" + r["err"])
        results["tiny_n5"][name] = {
            "rc": r["rc"],
            "wall_s": round(r["elapsed_s"], 3),
            "peak_rss_kb": r["peak_rss_kb"],
            "maxrss_kb": r["maxrss_kb"],
            "metrics": parsed,
            "tail": (r["out"] + r["err"])[-400:],
        }
        print(
            f"    {parsed} rss={r['peak_rss_kb']}KB wall={r['elapsed_s']:.1f}s rc={r['rc']}",
            flush=True,
        )

    print(f"\n=== FIXED RICHARDS N={N_FIXED} ===", flush=True)
    # Include native only if tiny succeeded with metrics
    for name, target in [("ranger_cpp", "cpp"), ("ranger_rust", "rust")]:
        if results["tiny_n5"].get(name, {}).get("metrics"):
            targets.append(
                (name, [str(BINROOT / target / "octane_runner"), str(prep), "richards_eng.js"])
            )
    for name, cmd in targets:
        print(f"  {name}...", flush=True)
        timeout = 180 if name.startswith("ranger_") else 60
        r = run_cmd(cmd, timeout=timeout)
        parsed = parse_fixed(r["out"] + "\n" + r["err"])
        results["runs"][name] = {
            "rc": r["rc"],
            "wall_s": round(r["elapsed_s"], 3),
            "peak_rss_kb": r["peak_rss_kb"],
            "maxrss_kb": r["maxrss_kb"],
            "metrics": parsed,
            "tail": (r["out"] + r["err"])[-800:],
        }
        print(
            f"    rc={r['rc']} wall={r['elapsed_s']:.2f}s peak_rss={r['peak_rss_kb']}KB "
            f"metrics={parsed}",
            flush=True,
        )

    print("\n=== FULL ADAPTIVE OCTANE (node/qjs/duk) ===", flush=True)
    for suite in ["richards", "deltablue", "regexp"]:
        results["full_octane"][suite] = {}
        for name, binp in [("node", "node"), ("qjs", str(QJS)), ("duk", str(DUK))]:
            cmd = (
                ["node", str(BENCH / f"{suite}.js")]
                if name == "node"
                else [binp, str(BENCH / f"{suite}.js")]
            )
            r = run_cmd(cmd, timeout=60)
            scores = parse_scores(r["out"] + "\n" + r["err"])
            results["full_octane"][suite][name] = {
                "scores": scores,
                "wall_s": round(r["elapsed_s"], 3),
                "peak_rss_kb": r["peak_rss_kb"],
                "maxrss_kb": r["maxrss_kb"],
                "rc": r["rc"],
            }
            print(f"  {suite}/{name}: {scores} rss={r['peak_rss_kb']}KB", flush=True)

    print("\n=== FULL ADAPTIVE OCTANE (ranger_es6) ===", flush=True)
    for suite in ["richards", "deltablue", "regexp"]:
        prepared = prepare_engine_src((BENCH / f"{suite}.js").read_text())
        (prep / f"{suite}_full.js").write_text(prepared)
        script = f"""
const fs = require("fs");
const {{ ComponentEngine, EvalValue }} = require({json.dumps(str(BINROOT / "engine_module.cjs"))});
const prepared = fs.readFileSync({json.dumps(str(prep / f"{suite}_full.js"))}, "utf8");
const e = new ComponentEngine();
e.quiet = true; e.liveClock = true; e.maxLoopIterations = 1e9;
const oLog = console.log;
console.log = (...a) => oLog(a.map(String).join(" "));
try {{
  e.loadScript(prepared + "\\nfunction __zoo_done__() {{ return 'done'; }}\\n");
  e.callFunction("__zoo_done__", EvalValue.null());
}} catch (ex) {{ console.log("ENGINE_ERROR: " + ex); }}
"""
        (prep / f"es6_{suite}_full.cjs").write_text(script)
        r = run_cmd(["node", str(prep / f"es6_{suite}_full.cjs")], timeout=180)
        scores = parse_scores(r["out"] + "\n" + r["err"])
        results["full_octane_ranger_es6"][suite] = {
            "scores": scores,
            "wall_s": round(r["elapsed_s"], 3),
            "peak_rss_kb": r["peak_rss_kb"],
            "maxrss_kb": r["maxrss_kb"],
            "rc": r["rc"],
            "tail": (r["out"] + r["err"])[-400:],
        }
        print(
            f"  {suite}: {scores} rss={r['peak_rss_kb']}KB wall={r['elapsed_s']:.1f}s",
            flush=True,
        )

    path = OUT / "fixed_compare.json"
    path.write_text(json.dumps(results, indent=2))
    shutil.copy(path, ART / "engine_zoo_compare.json")
    print("\nWROTE", path, flush=True)


if __name__ == "__main__":
    main()
