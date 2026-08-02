import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { getGeneratedCppCode, getGeneratedRustCode } from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_JS = path.join(ROOT_DIR, "bin", "output.js");
const FIXTURES = "tests/fixtures";
const OUT = "tests/.output-ownership";
const GALLERY_OUT = "tests/.output-gallery-ownership";

const JPEG_SCALER =
  "gallery/pdf_writer/src/tools/jpeg_scaler.rgr";

/**
 * Compile a fixture with the -strict-ownership flag and return compiler stdout,
 * which contains the inferred per-parameter OwnershipKind summary.
 */
function inferOwnership(
  sourceFile: string,
  options?: { outDir?: string; outFile?: string; timeoutMs?: number }
): string {
  const outDir = options?.outDir ?? OUT;
  const outFile = options?.outFile ?? "ownership.js";
  const env = {
    ...process.env,
    RANGER_LIB: `./compiler/Lang.rgr;./lib/stdops.rgr`,
  };
  const cmd = `node "${OUTPUT_JS}" -es6 -strict-ownership "./${sourceFile}" -nodecli -d="${outDir}" -o="${outFile}"`;
  return execSync(cmd, {
    cwd: ROOT_DIR,
    env,
    encoding: "utf-8",
    timeout: options?.timeoutMs ?? 30000,
    stdio: ["pipe", "pipe", "pipe"],
  }).toString();
}

function countOwnershipFunctions(stdout: string): number {
  return (stdout.match(/ownership\[infer\] fn /g) ?? []).length;
}

describe("Ranger Compiler - ownership inference", () => {
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

describe("Ranger Compiler - ownership escape forms (PLAN_OWNERSHIP_SOUNDNESS 2-6)", () => {
  const out = inferOwnership(`${FIXTURES}/ownership_escape_forms.rgr`, {
    outFile: "escape_forms.js",
  });

  it("compiles cleanly with -strict-ownership", () => {
    expect(out).not.toContain("Compilation FAILED");
    expect(out).not.toContain("[FAIL]");
  });

  it("counts the short form of a member store (last = p)", () => {
    expect(out).toContain("fn shortStore:\n  param 'p' -> moved (this.last)");
  });

  it("counts a store through a local alias (def q p; this.last = q)", () => {
    expect(out).toContain("fn aliasStore:\n  param 'p' -> moved (this.last)");
  });

  it("counts a store behind unwrap (this.last = (unwrap maybe))", () => {
    expect(out).toContain("fn unwrapStore:\n  param 'p' -> moved (this.last)");
  });

  it("counts the value of a map set, not the key (set slots \"x\" p)", () => {
    expect(out).toContain("fn mapStore:\n  param 'p' -> moved (slots)");
  });

  it("propagates the callee summary through a method call (this.keep(p))", () => {
    expect(out).toContain("fn viaMethod:\n  param 'p' -> moved (call keep.p)");
  });

  it("propagates the callee summary through a static call", () => {
    expect(out).toContain("fn viaStatic:\n  param 'p' -> moved (call staticKeep.p)");
  });

  it("keeps a read-only parameter borrowed even when the function calls out", () => {
    expect(out).toContain("fn readAndCall:\n  param 'p' -> borrowed");
  });

  it("never marks a primitive argument as escaping through a call", () => {
    expect(out).not.toContain("param 'idx' -> unknown");
    expect(out).not.toContain("param 'idx' -> moved");
  });
});

describe("Ranger Compiler - borrowed const& call-site copy (PLAN_OWNERSHIP_SOUNDNESS 1)", () => {
  const result = getGeneratedCppCode(`${FIXTURES}/ownership_alias_call.rgr`);

  it("compiles the fixture to C++", () => {
    expect(result.success, `Compile failed: ${result.error}`).toBe(true);
  });

  it("keeps the borrowed parameter as const std::shared_ptr<T>&", () => {
    expect(result.code).toContain(
      "use( const std::shared_ptr<Node>& p )"
    );
  });

  it("wraps a member-field argument in a call-time copy", () => {
    // Binding the member itself would let the callee's reset() swap the
    // object under the reference (and a vector element case is a
    // use-after-free); the copy pins the call-time object.
    expect(result.code).toMatch(/use\(std::shared_ptr<Node>\(\(?h->item\)?\)\)/);
  });

  it("does not copy a stable local argument", () => {
    expect(result.code).toContain("use(orig)");
    expect(result.code).not.toContain("use(std::shared_ptr<Node>(orig))");
  });
});

describe("Ranger Compiler - Rust &T for proven-borrowed params (PLAN_RUST_OWNERSHIP 1)", () => {
  const result = getGeneratedRustCode(`${FIXTURES}/llvm_ownership_infer.rgr`);

  it("compiles the fixture to Rust", () => {
    expect(result.success, `Compile failed: ${result.error}`).toBe(true);
  });

  it("passes a borrowed object parameter as &T", () => {
    expect(result.code).toContain("fn sumValue(&mut self, a : &Node, b : &Node)");
  });

  it("takes &x at the call site instead of a whole-struct clone", () => {
    expect(result.code).toContain("sumValue(&root, &child)");
    expect(result.code).not.toContain("sumValue(root.clone(), child.clone())");
  });

  it("keeps a moved parameter owned", () => {
    expect(result.code).toContain("fn addToken(&mut self, mut t : Node)");
  });
});

describe("Ranger Compiler - ownership inference on gallery JPEG scaler", () => {
  const out = inferOwnership(JPEG_SCALER, {
    outDir: GALLERY_OUT,
    outFile: "jpeg_scaler.js",
    timeoutMs: 120000,
  });
  const fnCount = countOwnershipFunctions(out);

  it("compiles the full JPEG scaler stack (decoder, encoder, metadata)", () => {
    expect(out).not.toContain("Compilation FAILED");
    expect(out).not.toContain("[FAIL]");
    expect(
      fs.existsSync(path.join(ROOT_DIR, GALLERY_OUT, "jpeg_scaler.js"))
    ).toBe(true);
  });

  it("runs ownership inference across the whole module graph", () => {
    expect(fnCount).toBeGreaterThanOrEqual(80);
  });

  it("infers file-path parameters as borrowed in decodeJPEG", () => {
    expect(out).toContain("ownership[infer] fn decodeJPEG:");
    expect(out).toContain("param 'filePath' -> borrowed");
  });

  it("resolves every parameter — no unknowns, no warnings", () => {
    // blockIdx (an int) was reported unknown before the primitive filter and
    // the interprocedural fixpoint landed; a primitive can never carry
    // ownership, and every object parameter resolves through the callee
    // summaries in this program.
    expect(out).toContain("param 'blockIdx' -> borrowed");
    expect(out).not.toContain("-> unknown");
    expect(out).not.toContain("WARNING: ownership");
  });

  it("finds the buffer parameters the decoder stores into members", () => {
    expect(out).toContain("param 'buf' -> moved (this.data)");
    expect(out).toContain("param 'bytes' -> moved (this.data)");
  });
});
