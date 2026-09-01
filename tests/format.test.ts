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
const LONGCHAIN = "tests/fixtures/format_longchain.rgr";
const STRESS = "tests/fixtures/format_stress.rgr";
const PRECEDENCE = "tests/fixtures/format_precedence.rgr";
const STRESS_OUT = "105 aa/bb/cc/dd/eeeeeeeeeeee/ffffffffffff/gggggggggggg";

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

describe("output formatter: operator precedence (phase 2)", () => {
  // The Ranger tree is fully parenthesised by construction, so a pair in the
  // OUTPUT is needed only where the target would re-associate differently.
  // The rule drops a pair only when the operand binds STRICTLY tighter, which
  // is why it cannot change what a program means -- and why r2 and r3 below
  // keep theirs. Every case is executed, not just read.
  const PREC_OUT = "14 20 3 1 1 18 4";

  it("drops a pair around an operand that binds tighter", () => {
    const js = compile(PRECEDENCE, "es6", "js", "prec");
    expect(js).toContain("const r1 = a + b * c;");
    expect(js).toContain("const r6 = a * b + b * c;");
  }, 120000);

  it("KEEPS the pair when the operand binds looser -- it is load-bearing", () => {
    const js = compile(PRECEDENCE, "es6", "js", "prec");
    expect(js).toContain("const r2 = (a + b) * c;");
  }, 120000);

  it("keeps the pair at equal precedence rather than reasoning about associativity", () => {
    const js = compile(PRECEDENCE, "es6", "js", "prec");
    expect(js).toContain("const r3 = a - (b - c);");
  }, 120000);

  it("knows relational binds tighter than equality", () => {
    const js = compile(PRECEDENCE, "es6", "js", "prec");
    expect(js).toContain("b2i((a < b && b < c))");
    expect(js).toContain("b2i((a == b || b != c))");
  }, 120000);

  it("drops a pair around something already atomic", () => {
    // `(to_double a)` has no entry in the binding-power table, and its
    // emitted form is just `a`. A pair around a postfix expression is never
    // required, whatever sits outside it.
    const js = compile(PRECEDENCE, "es6", "js", "prec");
    expect(js).toContain("const r7 = d * 2.0;");
  }, 120000);

  it("removes the stacked pair PLAN_FORMAT.md 4.2 named", () => {
    // `joined + ((this.arr[k])).asString()` was the worked example: a receiver
    // wrap and an expression wrap on the same operand.
    const js = compile(CHAINS, "es6", "js", "chains_on");
    expect(js).not.toMatch(/\(\(this\.\w+\[\w+\]\)\)/);
  }, 120000);

  it("does not change the answer", () => {
    compile(PRECEDENCE, "es6", "js", "prec");
    compile(PRECEDENCE, "es6", "js", "prec_off", ["-format=none"]);
    const run = (n: string) =>
      execFileSync(process.execPath, [path.join(OUT, n)],
                   { encoding: "utf-8" }).trim();
    expect(run("prec.js")).toBe(PREC_OUT);
    expect(run("prec_off.js")).toBe(PREC_OUT);
  }, 120000);

  it.runIf(HAS_GO)("the same answer on Go", () => {
    compile(PRECEDENCE, "go", "go", "prec");
    execFileSync("gofmt", ["-e", path.join(OUT, "prec.go")], { stdio: "ignore" });
    expect(
      execFileSync("go", ["run", "prec.go"], { cwd: OUT, encoding: "utf-8" }).trim()
    ).toBe(PREC_OUT);
  }, 240000);

  it.runIf(HAS_PY)("the same answer on Python", () => {
    compile(PRECEDENCE, "python", "py", "prec");
    expect(
      execFileSync("python3", [path.join(OUT, "prec.py")],
                   { encoding: "utf-8" }).trim()
    ).toBe(PREC_OUT);
  }, 120000);

  it.runIf(HAS_GXX)("the same answer built with g++", () => {
    compile(PRECEDENCE, "cpp", "cpp", "prec");
    const bin = path.join(OUT, "prec.bin");
    execFileSync("g++", ["-std=c++17", "-O0", "-o", bin, path.join(OUT, "prec.cpp")]);
    expect(execFileSync(bin, { encoding: "utf-8" }).trim()).toBe(PREC_OUT);
  }, 240000);
});

describe("output formatter: long chains and argument lists (phase 3)", () => {
  // PLAN_FORMAT.md S5: a chain stays on one line while it fits, and once it
  // does not, EVERY link goes onto its own line. Never some and not others.
  // Each text assertion is paired with a run, because inserting a newline is
  // only whitespace in a language whose parser agrees that it is.
  const EXPECTED = "6 first-argument-value|second-argument-value|" +
    "third-argument-value|fourth-argument-value|fifth";

  it("breaks every link of a chain that does not fit", () => {
    const js = compile(LONGCHAIN, "es6", "js", "lc");
    expect(js).toContain('r.str("region", "North")\n');
    expect(js).toMatch(/\n\s+\.str\("category", "Hardware"\)/);
    expect(js).toMatch(/\n\s+\.num\("units", 3100\.0\);/);
    // all-or-nothing: no link may be left sharing a line with another
    expect(js).not.toMatch(/\)\.\w+\([^)]*\)\.\w+\(/);
    expect(
      execFileSync(process.execPath, [path.join(OUT, "lc.js")],
                   { encoding: "utf-8" }).trim()
    ).toBe(EXPECTED);
  }, 120000);

  it("expands an argument list that does not fit, one argument per line", () => {
    const js = compile(LONGCHAIN, "es6", "js", "lc");
    expect(js).toMatch(/wide\(\n\s+"first-argument-value",\n\s+"second-argument-value",/);
  }, 120000);

  it("-format=none leaves both on one line", () => {
    const js = compile(LONGCHAIN, "es6", "js", "lc_off", ["-format=none"]);
    expect(js).toMatch(/\.num\("margin", 0\.42\)\)\.num\("units", 3100\.0\);/);
    expect(
      execFileSync(process.execPath, [path.join(OUT, "lc_off.js")],
                   { encoding: "utf-8" }).trim()
    ).toBe(EXPECTED);
  }, 120000);

  it("-width= raises the threshold, so nothing breaks", () => {
    const js = compile(LONGCHAIN, "es6", "js", "lc_wide", ["-width=400"]);
    expect(js).not.toMatch(/\n\s+\.str\("category"/);
    expect(
      execFileSync(process.execPath, [path.join(OUT, "lc_wide.js")],
                   { encoding: "utf-8" }).trim()
    ).toBe(EXPECTED);
  }, 120000);

  it.runIf(HAS_GO)("keeps the dot on the previous line for Go, which the parser requires", () => {
    // Go inserts a semicolon after a line ending in `)`, so a chain broken
    // BEFORE the dot does not parse. Go is the one target that breaks after.
    const go = compile(LONGCHAIN, "go", "go", "lc");
    expect(go).toMatch(/\.\n\s+str\("category", "Hardware"\)\./);
    expect(go).not.toMatch(/\n\s+\.str\(/);
    // and an expanded argument list needs its trailing comma there
    expect(go).toMatch(/"fifth",\n\s*\)/);
    execFileSync("gofmt", ["-e", path.join(OUT, "lc.go")], { stdio: "ignore" });
    expect(
      execFileSync("go", ["run", "lc.go"], { cwd: OUT, encoding: "utf-8" }).trim()
    ).toBe(EXPECTED);
  }, 240000);

  it.runIf(HAS_GXX)("breaks a C++ chain at -> and still compiles", () => {
    const cpp = compile(LONGCHAIN, "cpp", "cpp", "lc");
    expect(cpp).toMatch(/\n\s+->str\(/);
    const bin = path.join(OUT, "lc.bin");
    execFileSync("g++", ["-std=c++17", "-O0", "-o", bin, path.join(OUT, "lc.cpp")]);
    expect(execFileSync(bin, { encoding: "utf-8" }).trim()).toBe(EXPECTED);
  }, 240000);

  it("survives arguments that contain the characters it scans for", () => {
    // A text rule fails on text. These arguments hold `a.b().c()`, `))((`,
    // `x,y,z`, an escaped quote and `http://x//y` -- a chain link, unbalanced
    // brackets, separators, a quote and a comment marker, all inside strings.
    const js = compile(STRESS, "es6", "js", "stress");
    expect(js).toMatch(/r\.put\("dot", "a\.b\(\)\.c\(\)"\)\n/);
    expect(js).toMatch(/\n\s+\.put\("slash", "http:\/\/x\/\/y"\);/);
    // a chain inside an `if` condition is at depth > 0 and must be left alone
    expect(js).toMatch(/if \( r\.put\("k", "v"\)\.size\(\) > 0 \)/);
    // the inner call keeps its own arguments on one line; only the outer
    // list expands
    expect(js).toMatch(/SMain\.join3\(\n\s+SMain\.join3\("aa", "bb", "cc", "dd"\),/);
    expect(
      execFileSync(process.execPath, [path.join(OUT, "stress.js")],
                   { encoding: "utf-8" }).trim()
    ).toBe(STRESS_OUT);
  }, 120000);

  it.runIf(HAS_GO)("the same, run on Go", () => {
    compile(STRESS, "go", "go", "stress");
    execFileSync("gofmt", ["-e", path.join(OUT, "stress.go")], { stdio: "ignore" });
    expect(
      execFileSync("go", ["run", "stress.go"], { cwd: OUT, encoding: "utf-8" }).trim()
    ).toBe(STRESS_OUT);
  }, 240000);

  it.runIf(HAS_GXX)("the same, built with g++", () => {
    compile(STRESS, "cpp", "cpp", "stress");
    const bin = path.join(OUT, "stress.bin");
    execFileSync("g++", ["-std=c++17", "-O0", "-o", bin, path.join(OUT, "stress.cpp")]);
    expect(execFileSync(bin, { encoding: "utf-8" }).trim()).toBe(STRESS_OUT);
  }, 240000);

  it.runIf(HAS_PY)("the same, run on Python, which the formatter never touches", () => {
    compile(STRESS, "python", "py", "stress");
    expect(
      execFileSync("python3", [path.join(OUT, "stress.py")],
                   { encoding: "utf-8" }).trim()
    ).toBe(STRESS_OUT);
  }, 120000);

  it("never reformats a comment", () => {
    // PLAN_FORMAT.md S1 is about what a doc comment shows the reader.
    // Breaking one here would be the same mistake from the other side.
    const js = compile(CHAINS, "es6", "js", "chains_on");
    for (const line of js.split("\n")) {
      const t = line.trim();
      if (t.startsWith("*") || t.startsWith("//") || t.startsWith("/*")) {
        expect(t).not.toMatch(/^\.\w/);
      }
    }
  }, 120000);
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
