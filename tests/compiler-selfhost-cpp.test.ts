import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { compileRanger, compileAndRun } from "./helpers/compiler";

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
