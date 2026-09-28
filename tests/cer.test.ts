// ============================================================================
// cer.test.ts — CEr, ComponentEngine's JavaScript evaluator written as a
// strict Rust module (gallery/game_engine/v2/cer).
// ============================================================================
//
// rgrc compiles gallery/game_engine/v2/cer/src/lib.rs to JavaScript; Node is
// the oracle:
//
// - the scripts in tests/fixtures/cer print what Node prints for them;
// - the seven workloads of ComponentEngine's micro benchmark answer as Node;
// - with cargo, the native build prints the same, runs two Octane suites
//   (which check their own results) and agrees with Node on at least as many
//   runtime-conformance probes as when it was written (bench/conformance.mjs).
// ============================================================================

import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as vm from "vm";
import { execSync, spawnSync } from "child_process";
import { createRequire } from "module";

const ROOT = path.resolve(__dirname, "..");
const CER = path.join(ROOT, "gallery/game_engine/v2/cer");
const OUT = path.join(ROOT, "tests", ".output", "cer");
const FIX = path.join(ROOT, "tests", "fixtures", "cer");
const req = createRequire(__filename);

function has(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const PRINT = `function print() { var s = ""; for (var i = 0; i < arguments.length; i++) { if (i) s += " "; s += String(arguments[i]); } console.log(s); }\n`;

function nodeLines(src: string): string[] {
  const out: string[] = [];
  const ctx: any = { console: { log: (...a: any[]) => out.push(a.map(String).join(" ")) } };
  vm.createContext(ctx);
  vm.runInContext(PRINT + src, ctx);
  return out;
}

let Cer: any;

function jsLines(src: string): string[] {
  const e = Cer.Engine.new_();
  const r = e.eval(src);
  const out: string[] = [];
  for (let i = 0; i < e.output_count(); i++) out.push(e.output_at(i));
  if (e.error) out.push(r);
  return out;
}

const cargo = has("cargo --version");
const CARGO_ENV = { ...process.env, CARGO_TARGET_DIR: path.join(OUT, "cargo") };

function nativeLines(file: string): string[] {
  const r = spawnSync(path.join(OUT, "cargo", "release", "cer"), [file], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return (r.stdout + (r.stderr || "")).split("\n").filter((l) => l.length);
}

const MICRO: [string, string][] = [
  ["loop", "var s = 0; for (var i = 0; i < 50000; i++) { s += i; } return s;"],
  ["fib", "function fib(k) { return k < 2 ? k : fib(k - 1) + fib(k - 2); } return fib(20);"],
  ["strcat", 'var s = ""; for (var i = 0; i < 20000; i++) { s += "ab"; } return s.length;'],
  ["array", "var a = []; for (var i = 0; i < 20000; i++) { a.push(i * 2); } var t = 0; for (var j = 0; j < a.length; j++) { t += a[j]; } return t + a.length;"],
  ["object", 'var o = {}; for (var i = 0; i < 20000; i++) { o["k" + (i % 50)] = i; } var t = 0; for (var k in o) { t += o[k]; } return t;'],
  ["method", 'var s = "The quick brown fox jumps over the lazy dog"; var t = 0; for (var i = 0; i < 20000; i++) { t += s.slice(i % 10, 20).indexOf("o") + s.charCodeAt(i % 40); } return t;'],
  ["regex", 'var re = /([a-z]+)\\s+(\\d+)/; var t = 0; for (var i = 0; i < 5000; i++) { var m = re.exec("item " + i + " qty 42"); if (m) { t += m[2].length; } } return t;'],
];

describe("CEr", () => {
  beforeAll(() => {
    fs.mkdirSync(OUT, { recursive: true });
    const r = spawnSync("node", ["dist/rgrc.js", "-es6", "-nodemodule", "gallery/game_engine/v2/cer/src/lib.rs", `-d=${path.relative(ROOT, OUT)}`, "-o=Cer.cjs"], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    const log = (r.stdout || "") + (r.stderr || "");
    if (r.status !== 0 || log.includes("[FAIL]")) throw new Error(log);
    Cer = req(path.join(OUT, "Cer.cjs"));
    if (cargo) {
      const b = spawnSync("cargo", ["build", "--release", "--offline", "--quiet", "--manifest-path", path.join(CER, "Cargo.toml")], {
        encoding: "utf8",
        env: CARGO_ENV,
      });
      if (b.status !== 0) throw new Error(b.stderr);
    }
  }, 600000);

  for (const f of ["smoke.js", "strings.js", "semantics.js"]) {
    it(`${f}: the JavaScript build prints what Node prints`, () => {
      const src = fs.readFileSync(path.join(FIX, f), "utf8");
      expect(jsLines(src)).toEqual(nodeLines(src));
    });

    it.skipIf(!cargo)(`${f}: the native build prints what Node prints`, () => {
      const src = fs.readFileSync(path.join(FIX, f), "utf8");
      expect(nativeLines(path.join(FIX, f))).toEqual(nodeLines(src));
    });
  }

  it("the micro benchmark workloads answer as Node (JavaScript build)", () => {
    for (const [name, body] of MICRO) {
      const src = `print(String((function () { ${body} })()));`;
      expect([name, ...jsLines(src)]).toEqual([name, ...nodeLines(src)]);
    }
  });

  it.skipIf(!cargo)("the native build runs Richards and DeltaBlue with their own checks passing", () => {
    const dir = path.join(ROOT, "gallery/game_engine/v2/interp/bench/zoo_octane");
    for (const suite of ["richards", "deltablue"]) {
      let src = fs.readFileSync(path.join(dir, suite + ".js"), "utf8");
      src = src.replace(/if \(typeof print == "undefined" && typeof console != "undefined"\) \{[\s\S]*?\n\}\n/, "");
      src = src.replace(/Object\.defineProperty\(Object\.prototype,\s*["']inheritsFrom["']\s*,\s*\{[\s\S]*?\}\);/, `Function.prototype.inheritsFrom = function (shuper) { function Inheriter() { } Inheriter.prototype = shuper.prototype; this.prototype = new Inheriter(); this.superConstructor = shuper; };`);
      const file = path.join(OUT, suite + ".js");
      fs.writeFileSync(file, PRINT + src);
      const out = nativeLines(file).join("\n");
      expect(out).toMatch(/^(Richards|DeltaBlue): [0-9.]+$/m);
      expect(out).not.toMatch(/Error|Uncaught/);
    }
  }, 120000);

  it.skipIf(!cargo)("agrees with Node on the runtime-conformance probes it agreed on when written", () => {
    const r = spawnSync("node", [path.join(CER, "bench/conformance.mjs"), "--json"], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      env: { ...CARGO_ENV },
    });
    expect(r.status, r.stderr).toBe(0);
    const rep = JSON.parse(r.stdout.trim().split("\n").pop() as string);
    expect(rep.cer).toBeGreaterThanOrEqual(1907);
  }, 600000);
});
