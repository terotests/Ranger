import { describe, it, expect } from "vitest";
import {
  compileAndRun,
  compileRanger,
} from "./helpers/compiler";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

describe("Recursive import resolution (Issue #61)", () => {
  it("should resolve nested imports when importing across directories", () => {
    const source = "tests/fixtures/imports/cross_dir_lexer.rgr";
    const result = compileRanger(source, "es6");

    expect(
      result.success,
      `Compile failed: ${result.error || result.output}`
    ).toBe(true);
    expect(result.output).not.toContain("Could not import file");
  });

  it("should compile and run a cross-directory import chain", () => {
    const { compile, run } = compileAndRun(
      "tests/fixtures/imports/cross_dir_lexer.rgr"
    );

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("recursive-import-ok");
  });
});

describe("LF line endings (Issue #12)", () => {
  const lfFixture = "tests/fixtures/lf_math_ops.rgr";

  it("should keep LF-only sources on disk", () => {
    const bytes = fs.readFileSync(path.join(ROOT_DIR, lfFixture));
    expect(bytes.includes(Buffer.from("\r\n"))).toBe(false);
    expect(bytes.includes(Buffer.from("\n"))).toBe(true);
  });

  it("should compile LF-only sources with correct operator spacing", () => {
    const result = compileRanger(lfFixture, "es6");
    expect(result.success, `Compile failed: ${result.error}`).toBe(true);

    const outputJS = path.join(
      ROOT_DIR,
      "tests",
      ".output",
      "lf_math_ops.js"
    );
    expect(fs.existsSync(outputJS), `Missing ${outputJS}`).toBe(true);
    const code = fs.readFileSync(outputJS, "utf8");
    expect(code).toMatch(/a \* b/);
    expect(code).not.toMatch(/\*ab/);
    expect(code).not.toMatch(/while\s*</);
  });

  it("should run LF-only math_ops fixture", () => {
    const { compile, run } = compileAndRun(lfFixture);
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("Prod:");
  });
});

describe("Type-name diagnostics (Track 3.3)", () => {
  it("should report type names instead of enum integers on assignment mismatch", () => {
    const source = `
class TypeDiagTest {
    sfn m@(main):void () {
        def x:string (42)
    }
}
`;
    const tmpDir = path.join(ROOT_DIR, "tests", ".output");
    const tmpFile = path.join(tmpDir, "type_diag_tmp.rgr");
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(tmpFile, source, "utf8");

    const relPath = path.relative(ROOT_DIR, tmpFile).replace(/\\/g, "/");
    const result = compileRanger(`./${relPath}`, "es6");

    try {
      fs.unlinkSync(tmpFile);
    } catch {
      // ignore cleanup errors
    }

    expect(result.success).toBe(false);
    const combined = `${result.output}\n${result.error ?? ""}`;
    expect(combined).not.toMatch(/Types were \d+ vs \d+/);
    expect(combined).toMatch(/Types were .* vs .*/);
  });
});
