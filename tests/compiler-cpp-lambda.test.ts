import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  compileAndRun,
  compileRanger,
  getGeneratedCppCode,
} from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const FIXTURE = "tests/fixtures/lambda_callback.rgr";

function has(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

describe("Ranger Compiler - C++ lambdas", () => {
  it("generates std::function parameters and C++ lambda captures", () => {
    const result = getGeneratedCppCode(FIXTURE);

    expect(result.success, `Compile failed: ${result.error}`).toBe(true);
    expect(result.code).toContain("#include  <functional>");
    expect(result.code).toContain("std::function<void(double, double, double)>");
    expect(result.code).toContain("std::function<bool(double)>");
    expect(result.code).toMatch(/\[&\]\(double x, double y, double z\) mutable \{/);
    expect(result.code).toMatch(/\[&\]\(double v\) mutable \{/);
    expect(result.code).toMatch(
      /std::function<double\(double\)> doubler = \[&\]\(double x\) mutable \{/
    );
  });

  it("runs lambda callback fixture on ES6 (Node)", () => {
    const { compile, run } = compileAndRun(FIXTURE);

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);

    const out = run?.output || "";
    expect(out).toContain("count=2");
    expect(out).toContain("sum=21");
    expect(out).toContain("filteredSum=9");
    expect(out).toContain("double3=6");
    expect(out).toContain("lambda-callback done");
  });

  const gppAvailable = has("g++ --version");
  const cppIt = gppAvailable ? it : it.skip;

  cppIt("compiles and runs lambda callback fixture as native C++ (g++)", () => {
    const outDir = path.join(ROOT, "tests", ".output-cpp-lambda");
    fs.mkdirSync(outDir, { recursive: true });

    const compile = compileRanger(FIXTURE, "cpp", outDir);
    expect(
      compile.success,
      `C++ codegen failed: ${compile.error || compile.output}`
    ).toBe(true);

    const cpp = path.join(outDir, "lambda_callback.cpp");
    fs.copyFileSync(
      path.join(ROOT, "gallery/invaders/variant.hpp"),
      path.join(outDir, "variant.hpp")
    );

    const bin = path.join(outDir, "lambda_callback");
    execSync(`g++ -std=c++17 "${cpp}" -o "${bin}"`, {
      cwd: outDir,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 120000,
    });

    const output = execSync(`"${bin}"`, {
      cwd: ROOT,
      encoding: "utf-8",
      timeout: 30000,
    });

    expect(output).toContain("count=2");
    expect(output).toContain("sum=21");
    expect(output).toContain("filteredSum=9");
    expect(output).toContain("double3=6");
    expect(output).toContain("lambda-callback done");
  });
});
