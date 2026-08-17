import { describe, it, expect } from "vitest";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The ES conformance corpus, run by the engine COMPILED TO EVERY TARGET.
 *
 * tests/runtime-conformance.test.ts runs the same 2138 probes against the engine
 * as a Node module and compares each answer against Node's. That proves the
 * semantics. It says nothing about whether they survive compilation, and until
 * this file the only cross-target gate the engine had was bench_main's seven
 * benchmark answers — seven numbers standing in for a JavaScript implementation.
 *
 * Two legs:
 *
 *   1. NODE AS ORACLE for the compiled es6 build (scripts/es-conformance-oracle.cjs).
 *      Every probe body is executed by Node and compared against what the
 *      compiled engine answered, with KNOWN_GAPS asserted in both directions
 *      exactly as the module-level suite does it.
 *
 *   2. EVERY OTHER TARGET against es6, probe by probe. A disagreement here is a
 *      conformance difference introduced by compilation, which is a class of bug
 *      nothing else in the repository looks for.
 *
 * It has already earned its keep. On its first run it found:
 *   - nine Intl differences on Go, all one root cause: intlPushAffix pushed into
 *     an array PARAMETER, and Go passes slices by value, so every currency
 *     symbol, percent sign and minus sign was dropped. Fixed.
 *   - a regex capture-group reset difference on Go, still open.
 *   - 26 Unicode differences on C++, still open.
 *   - two probes sharing a name with two different bodies (`iter-map`,
 *     `math-max-empty`), which the module-level suite silently collapsed into
 *     one because it keys results by name. Renamed.
 *
 * COMPILING THIS NEEDS A BIGGER STACK — but not because of the corpus. The
 * Ranger S-expression parser recurses and does not release a frame when a group
 * closes, so parse depth grows with the file: 70 for this corpus, 2117 for
 * ComponentEngine.rgr, which is already at the edge of V8's default stack. The
 * engine alone fails to compile roughly 2 runs in 5 without --stack-size.
 * ISSUES.md #70 has the measurements. Anything that compiles the engine wants
 * the flag, this suite included.
 */

const MAIN = "tests/native/es_conformance_main.rgr";
const OUT = path.join(ROOT, "tmp", "es-conformance");
const NODE_STACK = "--stack-size=60000";

type Target = {
  name: string;
  flag: string;
  ext: string;
  tool: string;
  build?: (f: string) => string[];
  run: (f: string) => string[];
};

const TARGETS: Target[] = [
  { name: "es6", flag: "-es6", ext: "js", tool: "node", run: (f) => [process.execPath, f] },
  { name: "go", flag: "-l=go", ext: "go", tool: "go",
    build: (f) => ["go", "build", "-o", f.replace(/\.go$/, ".bin"), f],
    run: (f) => [f.replace(/\.go$/, ".bin")] },
  { name: "cpp", flag: "-l=cpp", ext: "cpp", tool: "g++",
    build: (f) => ["g++", "-std=c++17", "-O1", "-o", f.replace(/\.cpp$/, ".bin"), f],
    run: (f) => [f.replace(/\.cpp$/, ".bin")] },
  { name: "rust", flag: "-l=rust", ext: "rs", tool: "rustc",
    build: (f) => ["rustc", "-O", "-o", f.replace(/\.rs$/, ".bin"), f],
    run: (f) => [f.replace(/\.rs$/, ".bin")] },
  { name: "python", flag: "-l=python", ext: "py", tool: "python3", run: (f) => ["python3", f] },
];

/**
 * Targets whose compiled engine is known to disagree with es6, with the count
 * of probes involved. Asserted in BOTH directions, the way KNOWN_GAPS is: a
 * target outside this list must match exactly, and one inside it must still
 * differ by exactly this many probes, so a fix breaks the suite until the
 * number is updated and the list cannot quietly rot.
 */
const KNOWN_TARGET_GAPS: Record<string, number> = {
  // re-capture-reset-per-repetition: a capture group inside a quantified group
  // is not reset per repetition, so /(z)((a+)?(b+)?(c))*/ on "zaacbbbcac"
  // reports group 4 as "bbb" where the spec (and Node) say undefined.
  go: 1,
  // 26 Unicode probes: String.fromCharCode double-encodes (é comes back as Ã©),
  // JSON round-trips of non-ASCII answer undefined, regex replace/split mangle
  // multi-byte input, and U+2028/U+2029 do not terminate a comment. C++ is the
  // only byte-model target and is not on the engine's gated path
  // (npm run test:tsengine covers go/kotlin/python/csharp/dart/swift6).
  cpp: 26,
};

function hasTool(name: string): boolean {
  try {
    execFileSync(process.platform === "win32" ? "where" : "which", [name], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function compile(t: Target): string {
  fs.mkdirSync(OUT, { recursive: true });
  const rel = path.relative(ROOT, OUT).replace(/\\/g, "/");
  const file = `es_conformance.${t.ext}`;
  execFileSync(
    process.execPath,
    [NODE_STACK, "--max-old-space-size=8192", "bin/output.js", t.flag, MAIN,
     `-d=${rel}`, `-o=${file}`, "-nodecli", "-native-fast-alloc"],
    {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
      maxBuffer: 256 * 1024 * 1024,
    }
  );
  return path.join(OUT, file);
}

/** Probe lines only. The engine also prints parser diagnostics for probes it
 *  cannot parse, and those belong to no single probe. */
function probeLines(out: string): string[] {
  return out.split("\n").filter((l) => /^[a-z0-9][a-z0-9-]*=/.test(l));
}

function run(t: Target, file: string): string[] {
  if (t.build) {
    const cmd = t.build(file);
    execFileSync(cmd[0], cmd.slice(1), { cwd: OUT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  }
  const cmd = t.run(file);
  return probeLines(
    execFileSync(cmd[0], [...cmd.slice(1), "all"], {
      cwd: OUT,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      timeout: 30 * 60 * 1000,
    })
  );
}

describe("ES conformance, compiled", () => {
  const es6 = TARGETS[0];
  const es6File = compile(es6);
  const baseline = run(es6, es6File);

  it("the compiled es6 engine answers every probe", () => {
    expect(baseline.length).toBeGreaterThan(2000);
  });

  it("agrees with Node except on the documented KNOWN_GAPS", () => {
    fs.writeFileSync(path.join(OUT, "es6.txt"), baseline.join("\n") + "\n");
    // Exits non-zero on any unexpected difference or missing probe, and prints
    // each one. Expectations come from running the probe body in Node.
    const out = execFileSync(
      process.execPath,
      ["scripts/es-conformance-oracle.cjs", path.join(OUT, "es6.txt")],
      { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
    );
    expect(out).toMatch(/missing\s+0/);
    expect(out).not.toMatch(/UNEXPECTED DIFFERENCES/);
  });

  for (const t of TARGETS.slice(1)) {
    describe(t.name, () => {
      if (!hasTool(t.tool)) {
        it.skip(`matches es6 (${t.tool} not on PATH)`, () => {});
        return;
      }

      it("matches es6 on every probe it does not have a known gap for", () => {
        const got = run(t, compile(t));
        expect(got.length, "probe count differs from es6").toBe(baseline.length);

        const differing: string[] = [];
        for (let i = 0; i < baseline.length; i++) {
          if (baseline[i] !== got[i]) differing.push(`${baseline[i]}\n      ${t.name}: ${got[i]}`);
        }
        const allowed = KNOWN_TARGET_GAPS[t.name] ?? 0;
        expect(
          differing.length,
          differing.length > allowed
            ? `new conformance differences on ${t.name}:\n      ${differing.slice(0, 20).join("\n      ")}`
            : `${t.name} has FEWER differences than KNOWN_TARGET_GAPS says — update the count`
        ).toBe(allowed);
      });
    });
  }
});
