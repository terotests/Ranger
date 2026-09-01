// The output formatter (PLAN_FORMAT.md) and the reserved-word tables it
// depends on (ISSUES.md #76).
//
// Two things are checked here, and they are checked differently on purpose.
//
// The PARENTHESES are checked by text, because the whole point of the change
// is what the reader sees: a doc comment is never reformatted by any tool, so
// what Ranger writes is what ships. Every text assertion is paired with a run
// of the same program, because dropping a parenthesis that was load-bearing is
// a silent behaviour change and only execution catches it.
//
// The RESERVED WORDS are checked by handing the output to the target's own
// parser. A keyword emitted verbatim gives a file that compiles as far as
// Ranger is concerned and that the target cannot read -- which is exactly how
// `def go:boolean true` went unnoticed in gallery/vela for so long.
import { describe, it, expect, beforeAll } from "vitest";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "tests", ".output-format");

function compile(src: string, lang: string, ext: string, name: string,
                 extra: string[] = []): string {
  fs.mkdirSync(OUT, { recursive: true });
  const file = `${name}.${ext}`;
  const target = path.join(OUT, file);
  if (fs.existsSync(target)) fs.rmSync(target);
  const flags = lang === "es6" ? ["-es6"] : ["-l=" + lang];
  execFileSync(process.execPath, [
    "--max-old-space-size=8192", "bin/output.js", ...flags, src,
    "-d=" + path.relative(ROOT, OUT).replace(/\\/g, "/"),
    "-o=" + file, "-nodecli", ...extra,
  ], {
    cwd: ROOT,
    env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
    encoding: "utf-8",
  });
  expect(fs.existsSync(target), `compiler wrote no ${file}`).toBe(true);
  return fs.readFileSync(target, "utf-8");
}

function have(tool: string, args: string[] = ["--version"]): boolean {
  try {
    execFileSync(tool, args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const CHAINS = "tests/fixtures/format_chains.rgr";
const KEYWORDS = "tests/fixtures/format_keywords.rgr";

const HAS_GO = have("go", ["version"]);
const HAS_PY = have("python3");
const HAS_GXX = have("g++", ["--version"]);

describe("output formatter: call-receiver parentheses", () => {
  let formatted = "";
  let unformatted = "";

  beforeAll(() => {
    formatted = compile(CHAINS, "es6", "js", "chains_on");
    unformatted = compile(CHAINS, "es6", "js", "chains_off", ["-format=none"]);
  }, 120000);

  it("writes a chain as a chain", () => {
    expect(formatted).toContain(`r1.name("north").add("a").add("b");`);
  });

  it("leaves no parenthesised receiver behind on a chain", () => {
    // `(r).count()` and `((a.b()).c()).d()` are the two shapes this removes.
    expect(formatted).not.toMatch(/\([A-Za-z_$][A-Za-z0-9_$]*\)\./);
    expect(formatted).not.toContain("((");
  });

  it("-format=none still emits exactly what it used to", () => {
    // The escape hatch has to be worth having: this is the old output, and
    // scripts/fmt_parity.sh checks the same thing across eleven targets.
    expect(unformatted).toContain(`((r1.name("north")).add("a")).add("b");`);
    expect(unformatted).toContain("const c = (r).count();");
  });

  it("keeps the parentheses a receiver actually needs", () => {
    // The predicate is a whitelist of shapes proven not to need the pair, not
    // a blanket strip. `new NBox2()` is not a postfix expression, so it keeps
    // them even with the formatter on.
    const src = path.join(OUT, "needs_parens.rgr");
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(src, [
      "class NBox2 {",
      "  def v:int 5",
      "  fn get:int () {",
      "    return v",
      "  }",
      "}",
      "class N2Main {",
      "  sfn main:void () {",
      "    def r:int ((new NBox2()).get())",
      '    print ("" + r)',
      "  }",
      "}",
      "",
    ].join("\n"));
    const js = compile(src, "es6", "js", "needs_parens");
    expect(js).toContain("(new NBox2()).get()");
    expect(
      execFileSync(process.execPath, [path.join(OUT, "needs_parens.js")],
                   { encoding: "utf-8" }).trim()
    ).toBe("5");
  }, 120000);

  it("does not change what the program does", () => {
    const run = (name: string) =>
      execFileSync(process.execPath, [path.join(OUT, name)],
                   { encoding: "utf-8" }).trim();
    expect(run("chains_on.js")).toBe(run("chains_off.js"));
    expect(run("chains_on.js")).toBe("3");
  });

  it.runIf(HAS_PY)("drops them on Python too, and the program still runs", () => {
    const on = compile(CHAINS, "python", "py", "chains_on");
    expect(on).not.toMatch(/\([A-Za-z_$][A-Za-z0-9_$]*\)\./);
    expect(
      execFileSync("python3", [path.join(OUT, "chains_on.py")],
                   { encoding: "utf-8" }).trim()
    ).toBe("3");
  }, 120000);

  it.runIf(HAS_GO)("drops them on Go too, and the program still runs", () => {
    const on = compile(CHAINS, "go", "go", "chains_on");
    expect(on).not.toMatch(/\([A-Za-z_$][A-Za-z0-9_$]*\)\./);
    expect(
      execFileSync("go", ["run", "chains_on.go"],
                   { cwd: OUT, encoding: "utf-8" }).trim()
    ).toBe("3");
  }, 240000);

  it.runIf(HAS_GXX)("drops them on C++ too, and the program still runs", () => {
    // C++ reaches its receiver through `->`, so it needs its own pattern.
    const on = compile(CHAINS, "cpp", "cpp", "chains_on");
    expect(on).not.toMatch(/\([A-Za-z_$][A-Za-z0-9_$]*\)->/);
    const bin = path.join(OUT, "chains_on.bin");
    execFileSync("g++", ["-std=c++17", "-O0", "-o", bin,
                         path.join(OUT, "chains_on.cpp")]);
    expect(execFileSync(bin, { encoding: "utf-8" }).trim()).toBe("3");
  }, 240000);
});

describe("reserved words: the target's own parser reads the output", () => {
  // A name that is a keyword of the target has to be renamed or the generated
  // file does not parse. scripts/reserved_probe.py asks this question of every
  // keyword of every checkable target; these are the regression cases.
  it("JavaScript", () => {
    const js = compile(KEYWORDS, "es6", "js", "kw");
    expect(js).not.toMatch(/\b(const|let|var)\s+(class|new|case|switch|const|var|interface)\s*=/);
    execFileSync(process.execPath, ["--check", path.join(OUT, "kw.js")]);
    expect(
      execFileSync(process.execPath, [path.join(OUT, "kw.js")],
                   { encoding: "utf-8" }).trim()
    ).toBe("8 v 3");
  }, 120000);

  it.runIf(HAS_GO)("Go", () => {
    compile(KEYWORDS, "go", "go", "kw");
    // gofmt -e exits non-zero on a file it cannot parse. This is the check
    // that was missing: `var go bool = true` compiled "successfully" for as
    // long as it existed.
    execFileSync("gofmt", ["-e", path.join(OUT, "kw.go")], { stdio: "ignore" });
    expect(
      execFileSync("go", ["run", "kw.go"], { cwd: OUT, encoding: "utf-8" }).trim()
    ).toBe("8 v 3");
  }, 240000);

  it.runIf(HAS_PY)("Python", () => {
    compile(KEYWORDS, "python", "py", "kw");
    expect(
      execFileSync("python3", [path.join(OUT, "kw.py")],
                   { encoding: "utf-8" }).trim()
    ).toBe("8 v 3");
  }, 120000);

  it.runIf(HAS_GXX)("C++", () => {
    compile(KEYWORDS, "cpp", "cpp", "kw");
    const bin = path.join(OUT, "kw.bin");
    execFileSync("g++", ["-std=c++17", "-O0", "-o", bin, path.join(OUT, "kw.cpp")]);
    expect(execFileSync(bin, { encoding: "utf-8" }).trim()).toBe("8 v 3");
  }, 240000);
});
