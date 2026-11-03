import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { compileRanger, getGeneratedCppCode } from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const FIXTURE = "tests/fixtures/cpp_this_operator_name.rgr";

function has(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

// this.indexOf(...) where indexOf is also an operator reaches the writer as
// (call this indexOf ...); its receiver was written as shared_from_this(),
// which throws bad_weak_ptr inside a constructor.
describe("Ranger Compiler - C++ this.<operator name>() calls", () => {
  it("calls the method through this, not shared_from_this()", () => {
    const result = getGeneratedCppCode(FIXTURE);
    expect(result.success, `Compile failed: ${result.error}`).toBe(true);
    expect(result.code).toContain("this->indexOf(n)");
    expect(result.code).not.toContain("shared_from_this()->indexOf");
  });

  const cppIt = has("g++ --version") ? it : it.skip;
  cppIt("runs from the constructor as native C++ (g++)", () => {
    const outDir = path.join(ROOT, "tests", ".output-cpp-this-opname");
    fs.mkdirSync(outDir, { recursive: true });
    const compile = compileRanger(FIXTURE, "cpp", outDir);
    expect(compile.success, `C++ codegen failed: ${compile.error || compile.output}`).toBe(true);
    const cpp = path.join(outDir, "cpp_this_operator_name.cpp");
    const bin = path.join(outDir, "cpp_this_operator_name");
    execSync(`g++ -std=c++17 "${cpp}" -o "${bin}"`, { cwd: outDir, stdio: ["pipe", "pipe", "pipe"], timeout: 120000 });
    const output = execSync(`"${bin}"`, { cwd: ROOT, encoding: "utf-8", timeout: 30000 });
    expect(output).toContain("count=2");
    expect(output).toContain("find=1");
  });
});
