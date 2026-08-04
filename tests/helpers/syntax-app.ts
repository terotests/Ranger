/**
 * Helpers for tests/syntax-app.test.ts.
 *
 * The syntax app in tests/syntax_app/ is one Ranger program that uses as much
 * of compiler/Lang.rgr and of the language as can be written portably. These
 * helpers compile it -- and each of its sections on its own -- to every target
 * the CLI accepts, and run the result wherever the toolchain of the target is
 * installed.
 *
 * Nothing here knows what the answer should be. The test owns the baseline.
 */
import { execFileSync, execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, "..", "..");
export const APP_DIR = path.join(ROOT_DIR, "tests", "syntax_app");
export const GAPS_DIR = path.join(APP_DIR, "gaps");
export const OUT_DIR = path.join(ROOT_DIR, "tests", ".output-syntax-app");

const COMPILER = path.join(ROOT_DIR, "bin", "output.js");
const RANGER_LIB = "./compiler/Lang.rgr;./lib/stdops.rgr";

/** How a target is compiled, and how -- if at all -- its output is run. */
export interface Target {
  /** Identifier used in the report and in the baseline. */
  id: string;
  /** Name a reader recognises. */
  label: string;
  /** Flags handed to bin/output.js. */
  flags: string[];
  /** Extension of the generated file. */
  ext: string;
  /** Command that builds and runs the generated file, when one exists. */
  runner?: Runner;
}

export interface Runner {
  /** Name of the tool the runner needs on PATH. */
  tool: string;
  /** Builds and runs the file, and gives what the program printed. */
  run: (file: string, workDir: string) => string;
}

export interface CompileOutcome {
  ok: boolean;
  /** Distinct operator names the compiler could not match, sorted. */
  unmatched: string[];
  /** Every [FAIL] line, for the message of a failing assertion. */
  errors: string[];
  outputFile?: string;
}

export interface RunOutcome {
  ok: boolean;
  output: string;
  error?: string;
}

/** Status of one unit on one target, as the baseline records it. */
export type Status =
  | "ok" // compiled, ran, output matched
  | "compiled" // compiled; no toolchain here, or the unit is not run
  | "output-differs" // compiled and ran, but printed something else
  | "run-error" // compiled, and the target toolchain or the program failed
  | "compile-error"; // the Ranger compiler rejected it

function shellQuote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function hasTool(tool: string): boolean {
  try {
    execSync(`command -v ${tool}`, { stdio: "ignore", shell: "/bin/sh" });
    return true;
  } catch {
    return false;
  }
}

const toolCache = new Map<string, boolean>();

export function toolAvailable(tool: string): boolean {
  if (!toolCache.has(tool)) {
    toolCache.set(tool, hasTool(tool));
  }
  return toolCache.get(tool) as boolean;
}

function exec(cmd: string, cwd: string, timeout = 120000): string {
  return execSync(cmd, {
    cwd,
    encoding: "utf-8",
    timeout,
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env },
  });
}

/**
 * Java needs the name of the class that holds `main`, and the generated file
 * is not always named after it.
 */
function javaMainClass(file: string): string {
  const src = fs.readFileSync(file, "utf8");
  const withMain = /(?:public\s+)?class\s+(\w+)[^{]*\{[\s\S]*?public\s+static\s+void\s+main\s*\(/.exec(
    src
  );
  if (withMain) {
    return withMain[1];
  }
  return path.basename(file, ".java");
}

const RUNNERS: Record<string, Runner> = {
  node: {
    tool: "node",
    run: (file, cwd) => exec(`node ${shellQuote(file)}`, cwd),
  },
  tsc: {
    tool: "tsc",
    run: (file, cwd) => {
      const buildDir = path.join(cwd, "tsbuild");
      fs.mkdirSync(buildDir, { recursive: true });
      // The TypeScript of the repository, not whichever one is first on PATH:
      // a newer global tsc refuses a file argument while a tsconfig.json is in
      // scope (TS5112), and the result of the target would then depend on the
      // machine rather than on the generated code.
      const local = path.join(ROOT_DIR, "node_modules", ".bin", "tsc");
      const tsc = fs.existsSync(local) ? shellQuote(local) : "tsc";
      exec(
        `${tsc} --target es2020 --module commonjs --skipLibCheck --outDir ${shellQuote(
          buildDir
        )} ${shellQuote(file)}`,
        cwd
      );
      const js = path.join(buildDir, path.basename(file).replace(/\.ts$/, ".js"));
      return exec(`node ${shellQuote(js)}`, cwd);
    },
  },
  go: {
    tool: "go",
    run: (file, cwd) => {
      const exe = file.replace(/\.go$/, ".bin");
      exec(`go build -o ${shellQuote(exe)} ${shellQuote(file)}`, cwd);
      return exec(shellQuote(exe), cwd);
    },
  },
  python: {
    tool: "python3",
    run: (file, cwd) => exec(`python3 ${shellQuote(file)}`, cwd),
  },
  rust: {
    tool: "rustc",
    run: (file, cwd) => {
      const exe = file.replace(/\.rs$/, ".bin");
      exec(`rustc ${shellQuote(file)} -o ${shellQuote(exe)}`, cwd);
      return exec(shellQuote(exe), cwd);
    },
  },
  cpp: {
    tool: "g++",
    run: (file, cwd) => {
      const exe = file.replace(/\.cpp$/, ".bin");
      exec(`g++ -std=c++17 -O0 ${shellQuote(file)} -o ${shellQuote(exe)}`, cwd);
      return exec(shellQuote(exe), cwd);
    },
  },
  java: {
    tool: "javac",
    // The Java target writes one file per class, so the whole directory is
    // compiled and the class that holds main is looked up among them.
    run: (file, cwd) => {
      const classDir = path.join(cwd, "classes");
      fs.mkdirSync(classDir, { recursive: true });
      const sources = fs
        .readdirSync(cwd)
        .filter((f) => f.endsWith(".java"))
        .map((f) => shellQuote(path.join(cwd, f)));
      exec(`javac -d ${shellQuote(classDir)} ${sources.join(" ")}`, cwd);
      const withMain = fs
        .readdirSync(cwd)
        .filter((f) => f.endsWith(".java"))
        .map((f) => path.join(cwd, f))
        .find((f) => /public\s+static\s+void\s+main\s*\(/.test(fs.readFileSync(f, "utf8")));
      const mainClass = withMain ? javaMainClass(withMain) : javaMainClass(file);
      return exec(`java -cp ${shellQuote(classDir)} ${mainClass}`, cwd);
    },
  },
  php: {
    tool: "php",
    run: (file, cwd) => exec(`php ${shellQuote(file)}`, cwd),
  },
  llvm: {
    tool: "lli",
    run: (file, cwd) => exec(`lli ${shellQuote(file)}`, cwd),
  },
};

/**
 * Every target bin/output.js accepts, plus TypeScript, which is the ES6 target
 * with the -typescript flag rather than a language of its own.
 *
 * The order is the order of the report: the targets the README calls primary
 * first, then the ones it calls unmaintained, then LLVM.
 */
export const TARGETS: Target[] = [
  { id: "es6", label: "JavaScript (ES6)", flags: ["-es6"], ext: "js", runner: RUNNERS.node },
  { id: "typescript", label: "TypeScript", flags: ["-es6", "-typescript"], ext: "ts", runner: RUNNERS.tsc },
  { id: "go", label: "Go", flags: ["-l=go"], ext: "go", runner: RUNNERS.go },
  { id: "python", label: "Python 3", flags: ["-l=python"], ext: "py", runner: RUNNERS.python },
  { id: "rust", label: "Rust", flags: ["-l=rust"], ext: "rs", runner: RUNNERS.rust },
  { id: "cpp", label: "C++14", flags: ["-l=cpp"], ext: "cpp", runner: RUNNERS.cpp },
  { id: "kotlin", label: "Kotlin", flags: ["-l=kotlin"], ext: "kt" },
  { id: "swift6", label: "Swift 6", flags: ["-l=swift6"], ext: "swift" },
  { id: "swift3", label: "Swift 3", flags: ["-l=swift3"], ext: "swift" },
  { id: "java7", label: "Java 7", flags: ["-l=java7"], ext: "java", runner: RUNNERS.java },
  { id: "csharp", label: "C#", flags: ["-l=csharp"], ext: "cs" },
  { id: "scala", label: "Scala", flags: ["-l=scala"], ext: "scala" },
  { id: "php", label: "PHP", flags: ["-l=php"], ext: "php", runner: RUNNERS.php },
  { id: "llvm", label: "LLVM IR", flags: ["-l=llvm"], ext: "ll", runner: RUNNERS.llvm },
];

/** One compilable program of the app. */
export interface Unit {
  /** Identifier in the report and in the baseline. */
  id: string;
  /** Path of the entry file, relative to the repository root. */
  source: string;
  /** Extra flags the unit needs. */
  flags?: string[];
  /** File holding the output the program has to print, when it is run. */
  expected?: string;
  /** Why the unit is compiled but never run. */
  compileOnly?: string;
}

export const UNITS: Unit[] = [
  {
    id: "app",
    source: "tests/syntax_app/syntax_app.rgr",
    expected: "tests/syntax_app/expected_output.txt",
  },
  ...[
    "numeric",
    "bitwise",
    "strings",
    "arrays",
    "maps",
    "optionals",
    "control",
    "oop",
    "lambdas",
    "buffers",
    "operators",
    "stdlib",
  ].map((name) => ({
    id: `section:${name}`,
    source: `tests/syntax_app/drv_${name}.rgr`,
    expected: `tests/syntax_app/expected_${name}.txt`,
  })),
  {
    id: "narrow",
    source: "tests/syntax_app/drv_narrow.rgr",
    expected: "tests/syntax_app/expected_narrow.txt",
  },
  {
    id: "hostops",
    source: "tests/syntax_app/drv_hostops.rgr",
    flags: ["-sxopt=on"],
    compileOnly:
      "reads the file system, the environment, the clock and the terminal",
  },
  {
    id: "http",
    source: "tests/syntax_app/sx_http.rgr",
    compileOnly: "starts a server and would not return",
  },
  {
    id: "process",
    source: "tests/syntax_app/sx_process.rgr",
    expected: "tests/syntax_app/expected_process.txt",
  },
];

function unmatchedOperators(output: string): string[] {
  const names = new Set<string>();
  for (const line of output.split(/\r?\n/)) {
    const m = /\[FAIL\] Could not match argument types for (.*)$/.exec(line);
    if (m) {
      names.add(m[1].trim() || "<unnamed>");
    }
  }
  return [...names].sort();
}

export function compile(unit: Unit, target: Target): CompileOutcome {
  const outDir = path.join(OUT_DIR, target.id, unit.id.replace(/[^\w]/g, "_"));
  fs.mkdirSync(outDir, { recursive: true });

  const outputName = `${path.basename(unit.source, ".rgr")}.${target.ext}`;
  const relOut = path.relative(ROOT_DIR, outDir).replace(/\\/g, "/");
  const args = [
    COMPILER,
    ...target.flags,
    ...(unit.flags ?? []),
    `./${unit.source}`,
    "-nodecli",
    `-d=${relOut}`,
    `-o=${outputName}`,
  ];

  let stdout = "";
  try {
    stdout = execFileSync("node", args, {
      cwd: ROOT_DIR,
      encoding: "utf-8",
      timeout: 120000,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, RANGER_LIB },
    });
  } catch (err: any) {
    stdout = `${err.stdout ?? ""}${err.stderr ?? ""}`;
  }

  const errors = stdout
    .split(/\r?\n/)
    .filter((l) => l.includes("[FAIL]"))
    .map((l) => l.trim());

  // Most targets write the file that -o names. The Java target writes one file
  // per class and ignores -o, so any file with the extension of the target
  // counts, and the one holding main is preferred as the entry point.
  let outputFile = path.join(outDir, outputName);
  if (!fs.existsSync(outputFile)) {
    const produced = fs
      .readdirSync(outDir)
      .filter((f) => f.endsWith(`.${target.ext}`))
      .map((f) => path.join(outDir, f));
    const withMain = produced.find((f) =>
      /public\s+static\s+void\s+main\s*\(/.test(fs.readFileSync(f, "utf8"))
    );
    outputFile = withMain ?? produced[0] ?? outputFile;
  }
  const ok =
    stdout.includes("[OK] Compilation successful") && fs.existsSync(outputFile);

  return {
    ok,
    unmatched: unmatchedOperators(stdout),
    errors,
    outputFile: ok ? outputFile : undefined,
  };
}

export function runGenerated(target: Target, file: string): RunOutcome {
  if (!target.runner) {
    return { ok: false, output: "", error: "no runner for this target" };
  }
  try {
    const output = target.runner.run(file, path.dirname(file));
    return { ok: true, output };
  } catch (err: any) {
    const combined = `${err.stdout ?? ""}${err.stderr ?? ""}` || err.message;
    return { ok: false, output: err.stdout ?? "", error: String(combined).slice(0, 4000) };
  }
}

/**
 * Trailing whitespace and the line ending differ between the targets and say
 * nothing about the language, so they are removed before the comparison.
 */
export function normalise(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .join("\n")
    .trimEnd();
}

export function statusOf(
  unit: Unit,
  target: Target,
  compiled: CompileOutcome
): { status: Status; detail?: string } {
  if (!compiled.ok) {
    return {
      status: "compile-error",
      detail: compiled.unmatched.length
        ? `no template for: ${compiled.unmatched.join(" ")}`
        : compiled.errors[0],
    };
  }
  if (unit.compileOnly || !unit.expected || !target.runner) {
    return { status: "compiled" };
  }
  if (!toolAvailable(target.runner.tool)) {
    return { status: "compiled", detail: `${target.runner.tool} not installed` };
  }

  const run = runGenerated(target, compiled.outputFile as string);
  if (!run.ok) {
    return { status: "run-error", detail: run.error };
  }
  const expected = normalise(
    fs.readFileSync(path.join(ROOT_DIR, unit.expected), "utf8")
  );
  const actual = normalise(run.output);
  if (actual !== expected) {
    return { status: "output-differs", detail: firstDifference(expected, actual) };
  }
  return { status: "ok" };
}

export function firstDifference(expected: string, actual: string): string {
  const e = expected.split("\n");
  const a = actual.split("\n");
  const max = Math.max(e.length, a.length);
  for (let i = 0; i < max; i++) {
    if (e[i] !== a[i]) {
      return `line ${i + 1}: expected ${JSON.stringify(
        e[i] ?? "<missing>"
      )}, got ${JSON.stringify(a[i] ?? "<missing>")}`;
    }
  }
  return "no line differs";
}

/** Renders the matrix as a markdown table, for the report the test writes. */
export function renderMatrix(
  rows: Record<string, Record<string, Status>>,
  targets: Target[]
): string {
  const head = `| unit | ${targets.map((t) => t.id).join(" | ")} |`;
  const rule = `| --- | ${targets.map(() => "---").join(" | ")} |`;
  const symbol: Record<Status, string> = {
    ok: "ok",
    compiled: "c",
    "output-differs": "diff",
    "run-error": "run",
    "compile-error": "-",
  };
  const body = Object.keys(rows).map(
    (unit) =>
      `| ${unit} | ${targets
        .map((t) => symbol[rows[unit][t.id]] ?? "?")
        .join(" | ")} |`
  );
  return [head, rule, ...body].join("\n");
}

export function tempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}
