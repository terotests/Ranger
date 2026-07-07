import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

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
 * which (in Phase A) contains the inferred per-parameter OwnershipKind summary.
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

  it("flags interprocedural escape as unresolved (Phase B)", () => {
    expect(out).toContain("ownership[infer] fn decodeACRefineBlock:");
    expect(out).toContain("param 'blockIdx' -> unknown");
    expect(out).toContain(
      "WARNING: ownership of 'blockIdx' could not be determined"
    );
  });
});
