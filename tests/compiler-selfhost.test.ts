import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  compileRanger,
  compileAndRun,
  compileRangerToDart,
  compileAndRunDart,
  compileAndRunPython,
  compileAndRunCSharp,
  compileAndRunGo,
  compileAndRunKotlin,
  isCSharpAvailable,
  isDartAvailable,
  isGoAvailable,
  isKotlinAvailable,
} from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

function has(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

// The compiler is written in Ranger and compiles itself, but until now only the
// JavaScript output of that was exercised. Compiling the compiler for C++ is a
// different question, and the answer used to be 441 errors: JSON.rgr had no C++
// template for any operator, so every `@serialize` class stopped the build, and
// `pathname` in VirtualCompiler.rgr was declared for es6 only.
//
// This is the gate for that. It is deliberately the WHOLE compiler rather than
// a small fixture, because the gaps it found were in the parts of the language
// only a big program reaches.
describe("self-hosting: the compiler compiles for C++", () => {
  const OUT = path.join(ROOT, "tests", ".output-selfhost-cpp");

  it("generates C++ from the compiler's own sources", () => {
    fs.mkdirSync(OUT, { recursive: true });

    const result = compileRanger("compiler/ng_Compiler.rgr", "cpp", OUT);
    expect(
      result.success,
      `C++ codegen failed: ${result.error || result.output}`
    ).toBe(true);

    const generated = path.join(OUT, "ng_Compiler.cpp");
    expect(fs.existsSync(generated), `missing ${generated}`).toBe(true);

    const code = fs.readFileSync(generated, "utf-8");
    // The JSON runtime the @serialize classes need
    expect(code).toContain("rg_json_new_obj");
    expect(code).toContain("typedef std::shared_ptr<rg_json_obj_t> rg_json_obj");
    // A systemclass reaches the output under its C++ name, not the Ranger one
    expect(code).not.toContain("std::shared_ptr<JSONDataObject>");
    // sha256 is inline, so a C++ build needs no downloaded header
    expect(code).not.toContain("picosha2");
  }, 300000);

  // ~7 s on top of the codegen above, and it is the step that catches a
  // template that produces syntactically wrong C++ — the kind of defect the
  // string-only assertions above cannot see.
  const gppAvailable = has("g++ --version");
  const gppIt = gppAvailable ? it : it.skip;

  gppIt("the generated C++ passes a g++ syntax check", () => {
    const generated = path.join(OUT, "ng_Compiler.cpp");
    expect(
      fs.existsSync(generated),
      "run the codegen test first — no ng_Compiler.cpp"
    ).toBe(true);

    execSync(`g++ -std=c++17 -fsyntax-only "${generated}"`, {
      cwd: OUT,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 600000,
    });
  }, 900000);
});

// Dart reached the same place from 482 errors. JSON.rgr had no dart template
// either, and after that the target's own gaps showed: a lambda with statements
// in it came out as the JavaScript arrow form (`=>` takes one EXPRESSION in
// Dart), an optional in the middle of a path had no `!`, a local holding a
// lambda was declared with an empty type, and every library search path
// collapsed to "./" because `normalize` fell through to the `*` fallback.
describe("self-hosting: the compiler compiles for Dart", () => {
  const OUT = path.join(ROOT, "tests", ".output-selfhost-dart");

  it("generates Dart from the compiler's own sources", () => {
    fs.mkdirSync(OUT, { recursive: true });

    const result = compileRangerToDart("compiler/ng_Compiler.rgr", OUT, [], {
      timeoutMs: 300000,
    });
    expect(
      result.success,
      `Dart codegen failed: ${result.error || result.output}`
    ).toBe(true);

    const generated = path.join(OUT, "ng_Compiler.dart");
    expect(fs.existsSync(generated), `missing ${generated}`).toBe(true);

    const code = fs.readFileSync(generated, "utf-8");
    // the JSON shapes Dart already has in the language
    expect(code).toContain("Map<String, dynamic>");
    expect(code).toContain("jsonEncode");
    // a systemclass reaches the output under its Dart name, so the Ranger name
    // is never a declared type (it still appears inside string literals — the
    // @serialize writer emits Ranger source)
    expect(code).not.toMatch(/^\s*JSONDataObject[?]?\s+\w+/m);
    // a lambda with a body is `(a, b) { … }`, not the JavaScript arrow form
    // (`dart analyze` below is the real gate for that; a plain string search
    // would also hit the writers that EMIT JavaScript as string literals)
    expect(code).toContain(", (item, index) { ");
  }, 300000);

  const dartAvailable = isDartAvailable();
  const dartIt = dartAvailable ? it : it.skip;

  // ~25 s, and it is the step that catches a template producing Dart the
  // analyzer rejects — which the string assertions above cannot see.
  dartIt("the generated Dart passes `dart analyze`", () => {
    const generated = path.join(OUT, "ng_Compiler.dart");
    expect(
      fs.existsSync(generated),
      "run the codegen test first — no ng_Compiler.dart"
    ).toBe(true);

    // `dart analyze` exits non-zero on an error and prints the list, so the
    // message is worth keeping when it fails.
    try {
      execSync(`dart analyze --no-fatal-warnings "${generated}"`, {
        cwd: OUT,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 600000,
      });
    } catch (err: unknown) {
      const e = err as { stdout?: string };
      const errors = (e.stdout || "")
        .split("\n")
        .filter((l) => l.trim().startsWith("error"));
      expect(errors, errors.slice(0, 10).join("\n")).toHaveLength(0);
    }
  }, 900000);
});

// Python was the third, from 72 errors — the JSON templates were already
// there. Its own gaps: Python has no multi-statement lambda at all (a lambda
// with a body becomes a named nested def hoisted above the statement, with
// `nonlocal` for what it assigns), the module-level entry point ran before the
// operator helper classes were defined, a `switch` over an ENUM fell through to
// a C `switch`, and a body whose only statement was elided was left with no
// suite.
describe("self-hosting: the compiler compiles for Python", () => {
  const OUT = path.join(ROOT, "tests", ".output-selfhost-python");

  it("generates Python from the compiler's own sources", () => {
    fs.mkdirSync(OUT, { recursive: true });

    const result = compileRanger("compiler/ng_Compiler.rgr", "python", OUT);
    expect(
      result.success,
      `Python codegen failed: ${result.error || result.output}`
    ).toBe(true);

    const generated = path.join(OUT, "ng_Compiler.py");
    expect(fs.existsSync(generated), `missing ${generated}`).toBe(true);

    const code = fs.readFileSync(generated, "utf-8");
    // a lambda with a body is a hoisted def, never a `lambda` that runs off
    // the end of the line
    expect(code).toContain("def __rg_lambda_");
    expect(code).toContain("nonlocal ");
    // the entry point is last, after the operator helper classes
    expect(code.trimEnd().endsWith("main()")).toBe(true);
  }, 300000);

  // py_compile is the parser, which is what the lambda, switch and empty-suite
  // defects all broke.
  it("the generated Python compiles", () => {
    const generated = path.join(OUT, "ng_Compiler.py");
    expect(
      fs.existsSync(generated),
      "run the codegen test first — no ng_Compiler.py"
    ).toBe(true);

    execSync(`python3 -m py_compile "${generated}"`, {
      cwd: OUT,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 300000,
    });
  }, 600000);
});

// C# started at 499, all of it downstream of JSON.rgr having no `csharp`
// template. The two that mattered came later, and neither was an error: C#
// gives a subclass field that redeclares a parent's field a SECOND storage slot,
// and a subclass method that redeclares a parent's method without `override` is
// a second method — so `langWriter.writeClass(...)`, called through the base
// type, ran the generic placeholder and the compiler emitted
// `class X { /* static main */ }` for every target while reporting success.
describe("self-hosting: the compiler compiles for C#", () => {
  const OUT = path.join(ROOT, "tests", ".output-selfhost-csharp");

  it("generates C# from the compiler's own sources", () => {
    fs.mkdirSync(OUT, { recursive: true });

    const result = compileRanger("compiler/ng_Compiler.rgr", "csharp", OUT);
    expect(
      result.success,
      `C# codegen failed: ${result.error || result.output}`
    ).toBe(true);

    const generated = path.join(OUT, "ng_Compiler.cs");
    expect(fs.existsSync(generated), `missing ${generated}`).toBe(true);

    const code = fs.readFileSync(generated, "utf-8");
    // the JSON runtime the @serialize classes need, under its C# name
    expect(code).toContain("static class RgJson");
    expect(code).not.toMatch(/\bJSONDataObject\s+\w+\s*[=;]/);
    // the writers override rather than hide, or every call through
    // RangerGenericClassWriter runs the base method
    expect(code).toMatch(/public override void writeClass\(/);
    expect(code).toMatch(/public virtual void writeClass\(/);
    // a nested collection reaches the output as a C# type, not "[string]"
    expect(code).not.toContain(",[string]>");
    // the file operators are implemented rather than stubbed out — a compiler
    // that writes nothing and reports success is worse than one that errors
    expect(code).not.toContain("write_file not implemented");
    expect(code).toContain("static class RgFiles");
  }, 300000);

  // The C# compiler is the step that catches a template producing
  // syntactically or semantically wrong C#. Mono's mcs is enough: nothing here
  // needs a language version past 7.
  const mcsAvailable = has("mcs --version");
  const mcsIt = mcsAvailable ? it : it.skip;

  mcsIt("the generated C# builds", () => {
    const generated = path.join(OUT, "ng_Compiler.cs");
    expect(
      fs.existsSync(generated),
      "run the codegen test first — no ng_Compiler.cs"
    ).toBe(true);

    execSync(`mcs -langversion:latest -out:ng_Compiler.exe "${generated}"`, {
      cwd: OUT,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 600000,
    });
  }, 900000);
});

// Go reported zero compiler errors before any of this work and still would not
// build. Two of the defects it exposed were not about Go's type system at all:
// an optional is a *GoNullable BOX, and `def wr (file.getWriter())` made the
// local ALIAS the box the CodeFile owns — so `wr = contentFork` further down
// replaced the file's writer and every tag slice (the imports, the polyfills,
// the entry point) was dropped from the output; and `findClass` unwraps without
// a guard, which is `undefined` on JavaScript and a panic on Go.
describe("self-hosting: the compiler compiles for Go", () => {
  const OUT = path.join(ROOT, "tests", ".output-selfhost-go");

  it("generates Go from the compiler's own sources", () => {
    fs.mkdirSync(OUT, { recursive: true });

    const result = compileRanger("compiler/ng_Compiler.rgr", "go", OUT);
    expect(
      result.success,
      `Go codegen failed: ${result.error || result.output}`
    ).toBe(true);

    const generated = path.join(OUT, "ng_Compiler.go");
    expect(fs.existsSync(generated), `missing ${generated}`).toBe(true);

    const code = fs.readFileSync(generated, "utf-8");
    // a nested collection reaches the output as a Go type, not "[string]" —
    // which also kept it out of the generated helper's NAME
    expect(code).not.toContain("*[string]");
    expect(code).not.toMatch(/func r_has_key_\w*_\[/);
    // a union over primitives is interface{} on Go: there is no tag struct to
    // read a .tag from, so `case` narrows with a type assertion
    expect(code).not.toContain("interface{}_tag_");
    // the path operators are real rather than the "./" fallback
    expect(code).toContain("func r_path_normalize(");
    expect(code).toContain("func r_install_directory(");
  }, 300000);

  // `go build` is the step that matters: Go rejects an unread local and an
  // unused import outright, so a template that drops its argument is an error
  // here and only a warning (or nothing) everywhere else.
  const goAvailable = isGoAvailable();
  const goIt = goAvailable ? it : it.skip;

  goIt("the generated Go builds", () => {
    const generated = path.join(OUT, "ng_Compiler.go");
    expect(
      fs.existsSync(generated),
      "run the codegen test first — no ng_Compiler.go"
    ).toBe(true);

    fs.writeFileSync(path.join(OUT, "go.mod"), "module rangerc\n\ngo 1.21\n");
    execSync(`go build -o ng_Compiler_bin "${generated}"`, {
      cwd: OUT,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 900000,
    });
  }, 1200000);
});

// Kotlin started at 19 compiler errors and 3490 kotlinc errors. The one worth
// the trouble was a TYPO in a template: the `default` operator's Kotlin entry
// wrote `(block 2)` where the operator takes ONE argument, so every `else`
// branch came out with an empty body. In the compiler that is the flow parser's
// dispatch, whose default clears a `b_found` that starts true — the Kotlin build
// declared the whole tree already handled, analysed nothing, and reported
// success while writing the source back out as bare tokens.
describe("self-hosting: the compiler compiles for Kotlin", () => {
  const OUT = path.join(ROOT, "tests", ".output-selfhost-kotlin");

  it("generates Kotlin from the compiler's own sources", () => {
    fs.mkdirSync(OUT, { recursive: true });

    const result = compileRanger("compiler/ng_Compiler.rgr", "kotlin", OUT);
    expect(
      result.success,
      `Kotlin codegen failed: ${result.error || result.output}`
    ).toBe(true);

    const generated = path.join(OUT, "ng_Compiler.kt");
    expect(fs.existsSync(generated), `missing ${generated}`).toBe(true);

    const code = fs.readFileSync(generated, "utf-8");
    // an `else` branch carries its body. The flow parser's dispatch is the one
    // that mattered: its default clears a `b_found` that starts true, and with
    // an empty else the whole tree read as already handled.
    expect(code).toMatch(/else\s+->\s*\{\s*\n\s*b_found = false;/);
    // a lambda is an anonymous function, so `return` inside it is legal
    expect(code).toMatch(/fun\(item : \w+, index : \w+\)/);
    // a systemclass reaches the output under its Kotlin name. String LITERALS
    // are stripped first: the LLVM backend has to recognise the JSON
    // systemclasses by name, so it names them in quoted strings, and matching
    // the bare text failed on code that was perfectly correct.
    const codeNoStrings = code.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    expect(codeNoStrings).not.toContain("JSONValueUnion");
    // org.json is not on the classpath — the polyfill declares the classes
    expect(code).not.toContain("import org.json");
  }, 300000);

  // kotlinc is the gate. It needs a large heap for a 57k line file: the default
  // runs out and dies with an internal OutOfMemoryError rather than a
  // diagnostic.
  const kotlinAvailable = isKotlinAvailable();
  const kotlinIt = kotlinAvailable ? it : it.skip;

  kotlinIt("the generated Kotlin builds", () => {
    const generated = path.join(OUT, "ng_Compiler.kt");
    expect(
      fs.existsSync(generated),
      "run the codegen test first — no ng_Compiler.kt"
    ).toBe(true);

    execSync(
      `kotlinc -J-Xmx12g "${generated}" -include-runtime -d ng_Compiler.jar`,
      { cwd: OUT, stdio: ["pipe", "pipe", "pipe"], timeout: 2400000 }
    );
  }, 3000000);
});

// A lambda with a body, and one nested in another. Python has no
// multi-statement lambda, so this is the shape the hoisting has to preserve:
// the counters are assigned from inside the closure, which is what needs
// `nonlocal`, and the nested one has to land inside the enclosing def rather
// than beside it.
describe("a lambda with a body runs the same on every target", () => {
  const FIXTURE = "tests/fixtures/lambda_hoist.rgr";
  const EXPECTED = ["total=12", "seen=3", "names=n1,n2,n3", "lambda-hoist-ok"];

  it("runs on ES6", () => {
    const { compile, run } = compileAndRun(FIXTURE);
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    for (const line of EXPECTED) {
      expect(run?.output).toContain(line);
    }
  });

  it("runs on Python", () => {
    const { compile, run } = compileAndRunPython(FIXTURE);
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    for (const line of EXPECTED) {
      expect(run?.output).toContain(line);
    }
  });

  const dartAvailable2 = isDartAvailable();
  (dartAvailable2 ? it : it.skip)("runs on Dart", () => {
    const { compile, run } = compileAndRunDart(FIXTURE);
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    for (const line of EXPECTED) {
      expect(run?.output).toContain(line);
    }
  }, 120000);

  // The nested forEach in this fixture writes `item` and `index` twice, which
  // C# rejects: a lambda parameter may not reuse a name that is live in an
  // enclosing scope. 96 of the errors the generated compiler produced were this
  // one shape.
  (isCSharpAvailable() ? it : it.skip)("runs on C#", () => {
    const { compile, run } = compileAndRunCSharp(FIXTURE);
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    for (const line of EXPECTED) {
      expect(run?.output).toContain(line);
    }
  }, 120000);

  (isGoAvailable() ? it : it.skip)("runs on Go", () => {
    const { compile, run } = compileAndRunGo(FIXTURE);
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    for (const line of EXPECTED) {
      expect(run?.output).toContain(line);
    }
  }, 300000);

  // The lambdas here have bodies with statements, which is what the anonymous
  // function form is for, and a nested one that closes over the enclosing
  // counter.
  (isKotlinAvailable() ? it : it.skip)("runs on Kotlin", () => {
    const { compile, run } = compileAndRunKotlin(FIXTURE);
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    for (const line of EXPECTED) {
      expect(run?.output).toContain(line);
    }
  }, 600000);
});

// Every byte over 127 is negative in a signed C++ `char`. The Ranger parser
// skips a comment with `while (charAt s i) > 31`, so on C++ it stopped at the
// first byte of an em dash and read the rest of the comment as code — the
// compiler could not parse its own Lang.rgr. charAt and charcode now hand back
// an unsigned code unit on C++, which is what charCodeAt / ord / rune give
// everywhere else.
describe("C++ reads a non-ASCII byte as an unsigned code unit", () => {
  const FIXTURE = "tests/fixtures/utf8_scan.rgr";

  it("runs on ES6", () => {
    const { compile, run } = compileAndRun(FIXTURE);
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    const out = run?.output || "";
    // one UTF-16 code unit over 127
    expect(out).toContain("over=1");
    expect(out).toContain("first=122");
    expect(out).toContain("a—b");
    expect(out).toContain("utf8-scan-ok");
  });

  const gppAvailable = has("g++ --version");
  const gppIt = gppAvailable ? it : it.skip;

  gppIt("runs on C++", () => {
    const outDir = path.join(ROOT, "tests", ".output-cpp-utf8");
    fs.mkdirSync(outDir, { recursive: true });

    const compile = compileRanger(FIXTURE, "cpp", outDir);
    expect(
      compile.success,
      `C++ codegen failed: ${compile.error || compile.output}`
    ).toBe(true);

    const cpp = path.join(outDir, "utf8_scan.cpp");
    const bin = path.join(outDir, "utf8_scan");
    execSync(`g++ -std=c++17 "${cpp}" -o "${bin}"`, {
      cwd: outDir,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 120000,
    });

    const out = execSync(`"${bin}"`, {
      cwd: ROOT,
      encoding: "utf-8",
      timeout: 30000,
    });

    // three UTF-8 bytes over 127; the point is that it is not 0, which is what
    // a signed char gave before
    expect(out).toContain("over=3");
    expect(out).toContain("first=122");
    expect(out).toContain("a—b");
    expect(out).toContain("utf8-scan-ok");
  }, 300000);
});
