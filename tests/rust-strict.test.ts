// ============================================================================
// rust-strict.test.ts — `.rs` modules compiled by rgrc must print what their
// rustc build prints (PLAN_RUST_SYNTAX.md, D8 and stages R1–R4).
// ============================================================================
//
// Every tests/fixtures/rust_strict/<name>.rs is a Rust program with a `main`.
// <name>.expected holds its output, recorded from rustc. When rustc is on the
// PATH the test also rebuilds the program natively and checks the recording
// is still what rustc prints, so a stale .expected cannot hide a divergence.
//
// Each program is compiled with `rgrc` for es6, python, go, cpp, java7,
// kotlin, csharp (mcs + mono), dart, scala and php and run; a target whose
// toolchain is missing is skipped. The JVM targets run with
// -Dstdout.encoding=UTF-8 and mono with LANG=C.UTF-8, so non-ASCII output is
// written as UTF-8.
//
// tests/fixtures/rust_strict/errors/<name>.rs must be REFUSED by rgrc with
// the message in <name>.expected (a substring). tests/fixtures/rust_strict/
// borrow/<name>.rs are move and borrow errors: rustc rejects them as well.
//
// A fixture that starts with `use ranger::prelude::*` is built against the
// prelude crate runtime/rust/ranger, which cargo builds once.
//
// `UPDATE_EXPECTED=1` rewrites the .expected files from rustc.
// ============================================================================

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "tests", "fixtures", "rust_strict");
const OUT = path.join(ROOT, "tests", ".output", "rust-strict");

function has(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const HAS_RUSTC = has("rustc --version");
const HAS_CARGO = has("cargo --version");
const CRATE = path.join(ROOT, "runtime", "rust", "ranger");
const TOOLS: Record<string, boolean> = {
  es6: true,
  python: has("python3 --version"),
  go: has("go version"),
  cpp: has("g++ --version"),
  java7: has("javac -version") && has("java -version"),
  kotlin: has("kotlinc -version") && has("java -version"),
  csharp: has("mcs --version") && has("mono --version"),
  dart: has("dart --version"),
  scala: has("scalac -version") && has("scala -version"),
  php: has("php --version"),
};

function run(cmd: string, args: string[], cwd = ROOT, env?: NodeJS.ProcessEnv) {
  const r = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    env: env ?? process.env,
    timeout: 120000,
  });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

// A strict module that starts with `use ranger::prelude::*` builds against
// runtime/rust/ranger: the crate is built once with cargo and handed to rustc.
let preludeArgs: string[] | null = null;
function preludeFlags(file: string): string[] {
  if (!fs.readFileSync(file, "utf8").includes("use ranger::prelude")) return [];
  if (preludeArgs) return preludeArgs;
  const target = path.join(OUT, "cargo");
  const b = run("cargo", [
    "build",
    "--offline",
    "--quiet",
    "--manifest-path",
    path.join(CRATE, "Cargo.toml"),
    "--target-dir",
    target,
  ]);
  if (b.status !== 0) throw new Error(`cargo could not build the ranger crate:\n${b.stderr}`);
  const dbg = path.join(target, "debug");
  preludeArgs = ["--extern", `ranger=${path.join(dbg, "libranger.rlib")}`, "-L", `dependency=${path.join(dbg, "deps")}`];
  return preludeArgs;
}

function rustcOutput(file: string, name: string): string {
  const bin = path.join(OUT, `${name}.native`);
  const b = run("rustc", ["--edition", "2021", "-O", ...preludeFlags(file), "-o", bin, file]);
  if (b.status !== 0) {
    throw new Error(`rustc rejected ${file}:\n${b.stderr}`);
  }
  return run(bin, []).stdout;
}

const EXT: Record<string, string> = {
  es6: "js",
  python: "py",
  go: "go",
  cpp: "cpp",
  java7: "java",
  kotlin: "kt",
  csharp: "cs",
  dart: "dart",
  scala: "scala",
  php: "php",
};

const UTF8_JAVA = "-Dstdout.encoding=UTF-8";

function compileAndRun(file: string, name: string, target: string) {
  const dir = path.join(OUT, name, target);
  fs.mkdirSync(dir, { recursive: true });
  const outName = `${name}.${EXT[target]}`;
  const c = run("node", [
    "dist/rgrc.js",
    `-l=${target}`,
    path.relative(ROOT, file),
    `-d=${path.relative(ROOT, dir)}`,
    `-o=${outName}`,
  ]);
  const log = c.stdout + c.stderr;
  if (log.includes("[FAIL]") || c.status !== 0) {
    return { ok: false, out: log };
  }
  const prog = path.join(dir, outName);
  if (target === "es6") return { ok: true, out: run("node", [prog]).stdout };
  if (target === "python") return { ok: true, out: run("python3", [prog]).stdout };
  if (target === "go") return { ok: true, out: run("go", ["run", outName], dir).stdout };
  if (target === "php") return { ok: true, out: run("php", [prog]).stdout };
  if (target === "dart") {
    const d = run("dart", ["run", prog], dir);
    if (d.stderr.includes("Error: ")) return { ok: false, out: d.stderr };
    return { ok: true, out: d.stdout };
  }
  if (target === "java7") {
    // one .java file per class; the entry point is the one with `main`
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".java"));
    const j = run("javac", ["-nowarn", "-d", dir, ...files], dir);
    if (j.status !== 0) return { ok: false, out: j.stderr };
    const main = files.find((f) => fs.readFileSync(path.join(dir, f), "utf8").includes("static void main"));
    if (!main) return { ok: false, out: "no class with main" };
    return { ok: true, out: run("java", [UTF8_JAVA, "-cp", dir, main.replace(/\.java$/, "")], dir).stdout };
  }
  if (target === "kotlin") {
    const jar = path.join(dir, `${name}.jar`);
    const k = run("kotlinc", [prog, "-include-runtime", "-d", jar], dir);
    if (!fs.existsSync(jar)) return { ok: false, out: k.stderr };
    return { ok: true, out: run("java", [UTF8_JAVA, "-jar", jar], dir).stdout };
  }
  if (target === "csharp") {
    const exe = path.join(dir, `${name}.exe`);
    const m = run("mcs", [`-out:${exe}`, prog], dir);
    if (m.status !== 0) return { ok: false, out: m.stdout + m.stderr };
    return { ok: true, out: run("mono", [exe], dir, { ...process.env, LANG: "C.UTF-8" }).stdout };
  }
  if (target === "scala") {
    const s = run("scalac", ["-nowarn", "-d", dir, prog], dir);
    if (s.status !== 0) return { ok: false, out: s.stdout + s.stderr };
    const obj = /^object (\w+) extends App/m.exec(fs.readFileSync(prog, "utf8"));
    if (!obj) return { ok: false, out: "no application object" };
    return {
      ok: true,
      out: run("scala", ["-cp", dir, obj[1]], dir, { ...process.env, JAVA_OPTS: UTF8_JAVA }).stdout,
    };
  }
  const bin = path.join(dir, name);
  const g = run("g++", ["-std=c++17", "-O1", "-o", bin, prog]);
  if (g.status !== 0) return { ok: false, out: g.stderr };
  return { ok: true, out: run(bin, []).stdout };
}

const programs = fs.existsSync(DIR)
  ? fs.readdirSync(DIR).filter((f) => f.endsWith(".rs")).sort()
  : [];

describe("Rust-syntax modules: output equals rustc's", () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of programs) {
    const name = f.replace(/\.rs$/, "");
    const file = path.join(DIR, f);
    const expectedFile = path.join(DIR, `${name}.expected`);

    const needsCargo = fs.readFileSync(file, "utf8").includes("use ranger::prelude");
    it.skipIf(!HAS_RUSTC || (needsCargo && !HAS_CARGO))(`${name}: the recorded output is rustc's`, () => {
      const native = rustcOutput(file, name);
      if (process.env.UPDATE_EXPECTED) fs.writeFileSync(expectedFile, native);
      expect(native).toBe(fs.readFileSync(expectedFile, "utf8"));
    }, 120000);

    for (const target of Object.keys(EXT)) {
      it.skipIf(!TOOLS[target])(`${name} on ${target}`, () => {
        const expected = fs.readFileSync(expectedFile, "utf8");
        const r = compileAndRun(file, name, target);
        expect(r.ok, r.out).toBe(true);
        expect(r.out).toBe(expected);
      }, 180000);
    }
  }
});

function refusedSuite(title: string, sub: string, rustcRejects: boolean) {
  const dir = path.join(DIR, sub);
  const cases = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith(".rs")).sort()
    : [];
  describe(title, () => {
    for (const f of cases) {
      const name = f.replace(/\.rs$/, "");
      const file = path.join(dir, f);
      if (rustcRejects) {
        it.skipIf(!HAS_RUSTC)(`${name}: rustc rejects it too`, () => {
          const bin = path.join(OUT, sub, `${name}.native`);
          fs.mkdirSync(path.dirname(bin), { recursive: true });
          const b = run("rustc", ["--edition", "2021", ...preludeFlags(file), "-o", bin, file]);
          expect(b.status, b.stderr).not.toBe(0);
        }, 120000);
      }
      it(`${name} is refused with its message`, () => {
        const out = path.join(OUT, sub);
        fs.mkdirSync(out, { recursive: true });
        const c = run("node", [
          "dist/rgrc.js",
          "-l=es6",
          path.relative(ROOT, file),
          `-d=${path.relative(ROOT, out)}`,
          `-o=${name}.js`,
        ]);
        const log = c.stdout + c.stderr;
        const want = fs.readFileSync(path.join(dir, `${name}.expected`), "utf8").trim();
        expect(log).toContain(want);
        expect(fs.existsSync(path.join(out, `${name}.js`))).toBe(false);
      });
    }
  });
}

refusedSuite("Rust-syntax modules: refused constructs", "errors", false);
// R3: programs rustc's borrow checker rejects are refused by the lowering too
refusedSuite("Rust-syntax modules: move and borrow errors", "borrow", true);

describe("the ranger prelude crate", () => {
  it.skipIf(!HAS_RUSTC)("ops.rs and RustPreludeOps.rgr are what Lang.rgr generates", () => {
    const r = run("node", ["scripts/gen-rust-prelude-ops.js", "--check"]);
    expect(r.status, r.stdout + r.stderr).toBe(0);
  }, 120000);

  it.skipIf(!HAS_CARGO)("its own tests pass (cargo test)", () => {
    const r = run("cargo", [
      "test",
      "--offline",
      "--quiet",
      "--manifest-path",
      path.join(CRATE, "Cargo.toml"),
      "--target-dir",
      path.join(OUT, "cargo"),
    ]);
    expect(r.status, r.stdout + r.stderr).toBe(0);
  }, 300000);
});
