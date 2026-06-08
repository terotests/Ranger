import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_JS = path.join(ROOT_DIR, "bin", "output.js");
const FIXTURES = "tests/fixtures";
const OUT = "tests/.output-ownership";

/**
 * Compile a fixture with the -strict-ownership flag and return compiler stdout,
 * which (in Phase A) contains the inferred per-parameter OwnershipKind summary.
 */
function inferOwnership(sourceFile: string): string {
  const env = {
    ...process.env,
    RANGER_LIB: `./compiler/Lang.rgr;./lib/stdops.rgr`,
  };
  const cmd = `node "${OUTPUT_JS}" -es6 -strict-ownership "./${sourceFile}" -nodecli -d="${OUT}" -o="ownership.js"`;
  return execSync(cmd, {
    cwd: ROOT_DIR,
    env,
    encoding: "utf-8",
    timeout: 30000,
    stdio: ["pipe", "pipe", "pipe"],
  }).toString();
}

describe("Ranger Compiler - ownership inference (Phase A)", () => {
  const out = inferOwnership(`${FIXTURES}/llvm_ownership_infer.rgr`);

  it("compiles cleanly with -strict-ownership", () => {
    expect(out).not.toContain("Compilation FAILED");
    expect(out).not.toContain("[FAIL]");
  });

  it("infers ownership transfer for field store (parent.left = child)", () => {
    expect(out).toContain("param 'child' -> moved (parent.left)");
  });

  it("infers the owner object itself is only borrowed", () => {
    expect(out).toContain("param 'parent' -> borrowed");
  });

  it("infers ownership transfer for push into a member collection (push tokens t)", () => {
    expect(out).toContain("param 't' -> moved (tokens)");
  });

  it("treats primitive parameters as borrowed, never moved", () => {
    expect(out).toContain("param 'v' -> borrowed");
    expect(out).not.toContain("param 'v' -> moved");
  });

  it("treats read-only object parameters as borrowed", () => {
    expect(out).toContain("param 'a' -> borrowed");
    expect(out).toContain("param 'b' -> borrowed");
  });
});
