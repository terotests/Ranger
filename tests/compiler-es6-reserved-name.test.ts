import { describe, it, expect } from "vitest";
import { compileAndRun, compileRanger } from "./helpers/compiler";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const FIXTURE = "tests/fixtures/es6_reserved_name.rgr";

describe("ES6 static sfn name (Bun Function.name)", () => {
  it("emits Object.defineProperty for static sfn name", () => {
    const result = compileRanger(FIXTURE, "es6");
    expect(
      result.success,
      `Compile failed: ${result.error || result.output}`
    ).toBe(true);

    const outputJS = path.join(
      ROOT_DIR,
      "tests",
      ".output",
      "es6_reserved_name.js"
    );
    expect(fs.existsSync(outputJS), `Missing ${outputJS}`).toBe(true);
    const code = fs.readFileSync(outputJS, "utf8");
    expect(code).toContain('Object.defineProperty(NameProbe, "name"');
    expect(code).toContain("writable: true, configurable: true");
    expect(code).not.toMatch(/NameProbe\.name\s*=\s*function/);
  });

  it("compiles and runs NameProbe.name under Node", () => {
    const { compile, run } = compileAndRun(FIXTURE);
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("OK");
    expect(run?.output).toContain("OTHER");
  });
});
