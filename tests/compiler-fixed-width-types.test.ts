import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { compileAndRun, compileRanger } from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const FIXTURE = "tests/fixtures/fixed_width_types_smoke.rgr";

function has(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

describe("Ranger fixed-width numeric types (u8/u16/u32/i32/f32)", () => {
  it("compiles and runs on the ES6 target", () => {
    const { compile, run } = compileAndRun(FIXTURE);
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("OK fixed-width types");
  });

  const gpp = has("g++ --version");
  const cppIt = gpp ? it : it.skip;

  cppIt("emits fixed-width C++ storage types and runs", () => {
    const outDir = path.join(ROOT, "tests/.output-fixedwidth-cpp");
    fs.mkdirSync(outDir, { recursive: true });
    const compile = compileRanger(FIXTURE, "cpp", outDir);
    expect(
      compile.success,
      `C++ codegen failed: ${compile.error || compile.output}`
    ).toBe(true);

    const cpp = path.join(outDir, "fixed_width_types_smoke.cpp");
    const src = fs.readFileSync(cpp, "utf8");
    expect(src).toMatch(/uint8_t\s+a/);
    expect(src).toMatch(/uint16_t\s+b/);
    expect(src).toMatch(/uint32_t\s+c/);
    expect(src).toMatch(/int32_t\s+d/);
    expect(src).toContain("std::vector<uint8_t>");

    fs.copyFileSync(
      path.join(ROOT, "gallery/invaders/variant.hpp"),
      path.join(outDir, "variant.hpp")
    );

    const bin = path.join(outDir, "fixed_width_types_smoke");
    execSync(`g++ -std=c++17 -pthread "${cpp}" -o "${bin}"`, {
      cwd: outDir,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 120000,
    });
    const output = execSync(`"${bin}"`, {
      cwd: ROOT,
      encoding: "utf-8",
      timeout: 30000,
    });
    expect(output).toContain("OK fixed-width types");
  });
});
