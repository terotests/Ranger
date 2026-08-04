import { describe, it, expect } from "vitest";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

/**
 * The TypeScript engine of gallery/game_engine, compiled to the targets that
 * are not C++ or Rust.
 *
 * bench_main.rgr pulls in the whole interpreter -- ComponentEngine, EvalValue,
 * the regex engine, the TS lexer and parser, JSXToEVG, DateTime -- so it is the
 * largest single program in the repository and the one that finds target gaps
 * nothing else reaches. Every case here is the same shape: the Ranger compiler
 * must accept the program and write a complete file. Where a toolchain for the
 * target exists on the machine the file is built and run as well, and its
 * answer is compared against the one Node gives for the same JavaScript.
 */
const ENGINE = "gallery/game_engine/v2/interp/bench/native/bench_main.rgr";
const OUT = path.join(ROOT, "tests", ".output-ts-engine");

const EXT: Record<string, string> = {
  go: "go",
  kotlin: "kt",
  swift6: "swift",
};

function compileEngine(target: string): { out: string; file: string } {
  const dir = path.join(OUT, target);
  fs.mkdirSync(dir, { recursive: true });
  const file = `engine_bench.${EXT[target]}`;
  const rel = path.relative(ROOT, dir).replace(/\\/g, "/");
  const out = execFileSync(
    process.execPath,
    [
      "bin/output.js",
      `-l=${target}`,
      ENGINE,
      `-d=${rel}`,
      `-o=${file}`,
      "-nodecli",
      "-native-fast-alloc",
    ],
    {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
      maxBuffer: 64 * 1024 * 1024,
    }
  );
  return { out, file: path.join(dir, file) };
}

function hasTool(name: string): boolean {
  try {
    execFileSync(process.platform === "win32" ? "where" : "which", [name], {
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

describe("TS engine -> Go / Kotlin / Swift", () => {
  for (const target of ["go", "kotlin", "swift6"]) {
    it(`compiles the whole engine to ${target}`, () => {
      const { out, file } = compileEngine(target);
      expect(out, `Ranger rejected the engine on ${target}:\n${out}`).not.toMatch(
        /\[FAIL\]/
      );
      expect(fs.existsSync(file)).toBe(true);
      // A truncated write is the failure mode a "no errors" check misses: the
      // engine is ~30k lines on every target.
      expect(fs.readFileSync(file, "utf8").split("\n").length).toBeGreaterThan(
        20000
      );
    }, 300000);
  }

  it.skipIf(!hasTool("go"))("the Go build runs and answers like JavaScript", () => {
    const { file } = compileEngine("go");
    const dir = path.dirname(file);
    const bin = path.join(dir, "engine_bench");
    execFileSync("go", ["build", "-o", "engine_bench", path.basename(file)], {
      cwd: dir,
      encoding: "utf8",
      env: { ...process.env, GOCACHE: process.env.GOCACHE || path.join(os.tmpdir(), "go-build-ranger") },
    });

    // Kept identical to bench_main.rgr's caseBody.
    const cases: Array<[string, string]> = [
      ["loop", "1249975000"],
      ["fib", "6765"],
      ["strcat", "40000"],
      ["array", "400000000"],
      ["object", "998725"],
      ["method", "2021500"],
      ["regex", "18890"],
    ];
    for (const [name, want] of cases) {
      const out = execFileSync(bin, [name, "1"], { encoding: "utf8" });
      expect(out.trim(), `${name} on the Go build`).toBe(
        `${name} reps=1 answer=${want}`
      );
    }
  }, 600000);
});
