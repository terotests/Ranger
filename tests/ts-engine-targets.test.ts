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
 * nothing else reaches. Every target here has to be accepted by the Ranger
 * compiler and written out in full. Where a toolchain for the target exists on
 * the machine the file is built and run as well, and its answers are compared
 * against the ones Node gives for the same JavaScript.
 *
 * When kotlinc / java are on PATH the Kotlin jar is built and the answers are
 * checked against Node as well.
 */
const ENGINE = "gallery/game_engine/v2/interp/bench/native/bench_main.rgr";
const OUT = path.join(ROOT, "tests", ".output-ts-engine");

const EXT: Record<string, string> = {
  go: "go",
  kotlin: "kt",
  swift6: "swift",
  python: "py",
  csharp: "cs",
  dart: "dart",
};

// Kept identical to bench_main.rgr's caseBody, which is itself kept identical
// to bench/bench.cjs. Answers are what Node produces for the same source.
const CASES: Array<[string, string]> = [
  ["loop", "1249975000"],
  ["fib", "6765"],
  ["strcat", "40000"],
  ["array", "400000000"],
  ["object", "998725"],
  ["method", "2021500"],
  ["regex", "18890"],
];

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

/** Run every workload through a built binary and compare against Node's answer. */
function expectMatchesJavaScript(cmd: string, pre: string[] = []) {
  for (const [name, want] of CASES) {
    const out = execFileSync(cmd, [...pre, name, "1"], { encoding: "utf8" });
    expect(out.trim(), `${name}`).toBe(`${name} reps=1 answer=${want}`);
  }
}

describe("TS engine -> Go / Kotlin / Swift / Python / C# / Dart", () => {
  for (const target of ["go", "kotlin", "swift6", "python", "csharp", "dart"]) {
    it(`compiles the whole engine to ${target}`, () => {
      const { out, file } = compileEngine(target);
      expect(out, `Ranger rejected the engine on ${target}:\n${out}`).not.toMatch(
        /\[FAIL\]/
      );
      expect(fs.existsSync(file)).toBe(true);
      // A truncated write is the failure mode a "no errors" check misses: the
      // engine is 20k lines or more on every target.
      expect(fs.readFileSync(file, "utf8").split("\n").length).toBeGreaterThan(
        20000
      );
    }, 300000);
  }

  it.skipIf(!hasTool("go"))("the Go build runs and answers like JavaScript", () => {
    const { file } = compileEngine("go");
    const dir = path.dirname(file);
    execFileSync("go", ["build", "-o", "engine_bench", path.basename(file)], {
      cwd: dir,
      encoding: "utf8",
      env: {
        ...process.env,
        GOCACHE: process.env.GOCACHE || path.join(os.tmpdir(), "go-build-ranger"),
      },
    });
    expectMatchesJavaScript(path.join(dir, "engine_bench"));
  }, 600000);

  it.skipIf(!hasTool("python3"))(
    "the Python build runs and answers like JavaScript",
    () => {
      const { file } = compileEngine("python");
      expectMatchesJavaScript("python3", [file]);
    },
    900000
  );

  it.skipIf(!hasTool("mcs") || !hasTool("mono"))(
    "the C# build runs and answers like JavaScript",
    () => {
      const { file } = compileEngine("csharp");
      const dir = path.dirname(file);
      const exe = path.join(dir, "engine_bench.exe");
      execFileSync("mcs", [`-out:${exe}`, file], { encoding: "utf8" });
      expectMatchesJavaScript("mono", [exe]);
    },
    900000
  );

  it.skipIf(!hasTool("dart"))(
    "the Dart build runs and answers like JavaScript",
    () => {
      const { file } = compileEngine("dart");
      expectMatchesJavaScript("dart", ["run", file]);
    },
    900000
  );

  it.skipIf(!hasTool("swiftc"))(
    "the Swift 6 build runs and answers like JavaScript",
    () => {
      const { file } = compileEngine("swift6");
      const dir = path.dirname(file);
      const bin = path.join(dir, "engine_bench");
      execFileSync("swiftc", ["-O", file, "-o", bin], {
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      });
      expectMatchesJavaScript(bin);
    },
    900000
  );

  it.skipIf(!hasTool("kotlinc") || !hasTool("java"))(
    "the Kotlin build runs and answers like JavaScript",
    () => {
      const { file } = compileEngine("kotlin");
      const dir = path.dirname(file);
      const jar = path.join(dir, "engine_bench.jar");
      execFileSync(
        "kotlinc",
        [file, "-include-runtime", "-d", jar],
        {
          encoding: "utf8",
          maxBuffer: 64 * 1024 * 1024,
        }
      );
      expectMatchesJavaScript("java", ["-jar", jar]);
    },
    900000
  );
});
