#!/usr/bin/env python3
# Render matrix-results.json as the markdown tables COMPARE/RESULTS use.
import json
import os
import sys

DIR = os.path.dirname(os.path.abspath(__file__))
SUITES = ["richards", "deltablue", "crypto", "raytrace",
          "earley-boyer", "regexp", "splay", "navier-stokes"]
ENGINES = ["node", "qjs", "duk", "es6", "cpp", "rust"]
LABEL = {"node": "Node (V8)", "qjs": "QuickJS", "duk": "Duktape",
         "es6": "Ranger es6", "cpp": "Ranger C++ -O3", "rust": "Ranger Rust -O3"}

def main():
    with open(os.path.join(DIR, "matrix-results.json")) as f:
        rows = json.load(f)

    def cell(eng, s):
        r = rows.get(eng, {}).get(s)
        if not r:
            return ("—", "—", "—")
        if r["status"] == "TIMEOUT":
            return ("TIMEOUT", f"{r['wall_ms']/1000:.0f}s", rss(r))
        scores = r.get("scores") or {}
        if scores:
            v = list(scores.values())[0]
            v = f"{v:g}"
        else:
            errs = r.get("errors") or {}
            v = "FAIL" if errs else r["status"]
        return (v, f"{r['wall_ms']/1000:.1f}s", rss(r))

    def rss(r):
        kb = r.get("rss_kb")
        return f"{kb/1024:.0f} MB" if kb else "—"

    print("### Octane score (higher is better)\n")
    print("| Suite | " + " | ".join(LABEL[e] for e in ENGINES) + " |")
    print("| --- |" + " ---: |" * len(ENGINES))
    for s in SUITES:
        print(f"| {s} | " + " | ".join(cell(e, s)[0] for e in ENGINES) + " |")

    print("\n### Wall time of the run (suite driver included)\n")
    print("| Suite | " + " | ".join(LABEL[e] for e in ENGINES) + " |")
    print("| --- |" + " ---: |" * len(ENGINES))
    for s in SUITES:
        print(f"| {s} | " + " | ".join(cell(e, s)[1] for e in ENGINES) + " |")

    print("\n### Peak RSS (per-child ru_maxrss; ~10 MB floor from the spawn wrapper)\n")
    print("| Suite | " + " | ".join(LABEL[e] for e in ENGINES) + " |")
    print("| --- |" + " ---: |" * len(ENGINES))
    for s in SUITES:
        print(f"| {s} | " + " | ".join(cell(e, s)[2] for e in ENGINES) + " |")

    print("\n### Errors recorded\n")
    for e in ENGINES:
        for s in SUITES:
            r = rows.get(e, {}).get(s)
            if r and r.get("errors"):
                for k, v in r["errors"].items():
                    print(f"- {LABEL[e]} / {s}: `{k}: {v}`")

if __name__ == "__main__":
    main()
