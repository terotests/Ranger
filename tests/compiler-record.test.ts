import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { compileAndRun, compileRanger } from "./helpers/compiler";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT_DIR, "tests", ".output-record");

describe("record types (Track 2.1)", () => {
  const positionalFixture = "tests/fixtures/record_basic.rgr";
  const keywordFixture = "tests/fixtures/record_keyword.rgr";

  it("should compile a record with auto-generated constructor", () => {
    const result = compileRanger(positionalFixture, "es6");
    expect(
      result.success,
      `Compile failed: ${result.error || result.output}`
    ).toBe(true);
    expect(result.output).not.toContain("Not enough arguments");
  });

  it("should run positional record construction", () => {
    const { compile, run } = compileAndRun(positionalFixture);
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("3");
    expect(run?.output).toContain("4");
    expect(run?.output).toContain("Done");
  });

  it("should run keyword record construction (new Point xpos 3 ypos 4)", () => {
    const { compile, run } = compileAndRun(keywordFixture);
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("3");
    expect(run?.output).toContain("4");
    expect(run?.output).toContain("Done");
  });
});

/**
 * The compiler builds the constructor of a record from its fields, and the
 * signature holds a keyword marker next to each value parameter:
 *
 *   Constructor (xpos@(keyword) xpos:int ypos@(keyword) ypos:int)
 *
 * A target language without keyword arguments must drop the marker. When it
 * does not, the marker reaches the signature as a parameter with a name and no
 * type — `pub fn new(xpos : , xpos : i64, …)` on Rust,
 * `Point::Point( xpos , int xpos , … )` on C++ — and the output does not
 * compile. These tests hold the shape of the signature per target.
 */
describe("record constructor signatures per target", () => {
  const fixture = "tests/fixtures/record_basic.rgr";

  const cases: Array<{
    lang: string;
    file: string;
    /** The signature that the target must write. */
    expected: RegExp;
  }> = [
    { lang: "cpp", file: "record_basic.cpp", expected: /Point\(\s*int xpos\s*,\s*int ypos\s*\)/ },
    { lang: "rust", file: "record_basic.rs", expected: /pub fn new\(xpos : i64, ypos : i64\)/ },
    { lang: "swift6", file: "record_basic.swift", expected: /init\(xpos : Int, ypos : Int\s*\)/ },
    { lang: "go", file: "record_basic.go", expected: /func CreateNew_Point\(xpos int64, ypos int64\)/ },
    { lang: "python", file: "record_basic.py", expected: /def __init__\(self, xpos, ypos\)/ },
    { lang: "kotlin", file: "record_basic.kt", expected: /class Point\(\s*xpos : Int, ypos : Int\s*\)/ },
  ];

  for (const c of cases) {
    it(`writes a two-parameter Point constructor for ${c.lang}`, () => {
      const result = compileRanger(fixture, c.lang, OUT_DIR);
      expect(
        result.success,
        `Compile failed: ${result.error || result.output}`
      ).toBe(true);

      const written = path.join(OUT_DIR, c.file);
      expect(fs.existsSync(written), `missing ${written}`).toBe(true);
      const code = fs.readFileSync(written, "utf-8");

      expect(code).toMatch(c.expected);
      // The keyword marker leaves a parameter without a type behind it.
      expect(code).not.toMatch(/xpos\s*:\s*,/);
      expect(code).not.toMatch(/xpos\s*\(\)\s*,/);
    });
  }

  it("calls the constructor with one argument per field", () => {
    const result = compileRanger(fixture, "rust", OUT_DIR);
    expect(result.success).toBe(true);
    const code = fs.readFileSync(path.join(OUT_DIR, "record_basic.rs"), "utf-8");
    expect(code).toContain("Point::new(3, 4)");
  });
});
