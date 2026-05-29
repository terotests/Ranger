import { describe, it, expect } from "vitest";
import {
  compileAndRunKotlin,
  isKotlinAvailable,
  compileRanger,
} from "./helpers/compiler";
import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

const FIXTURE = "tests/fixtures/process_nesting.rgr";
const SWIFT_OUT = path.join("tests", ".output-swift", "process_nesting.swift");
const SWIFT_BIN = path.join("tests", ".output-swift", "process_nesting");

function isSwiftAvailable(): boolean {
  try {
    execSync("swiftc -version", { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

function compileAndRunSwift(sourceFile: string): {
  compile: { success: boolean; error?: string };
  run?: { success: boolean; output: string; error?: string };
} {
  const result = compileRanger(sourceFile, "swift6", path.join("tests", ".output-swift"));
  if (!result.success) {
    return { compile: { success: false, error: result.error } };
  }
  if (!fs.existsSync(SWIFT_OUT)) {
    return {
      compile: { success: false, error: `Missing ${SWIFT_OUT}` },
    };
  }
  try {
    execSync(`swiftc "${SWIFT_OUT}" -parse-as-library -o "${SWIFT_BIN}"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const output = execSync(`"${SWIFT_BIN}"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return {
      compile: { success: true },
      run: { success: true, output: output.trim() },
    };
  } catch (err: unknown) {
    const e = err as { stderr?: string; stdout?: string; message?: string };
    return {
      compile: { success: true },
      run: {
        success: false,
        output: e.stdout || "",
        error: e.stderr || e.message,
      },
    };
  }
}

const kotlinAvailable = isKotlinAvailable();
const swiftAvailable = isSwiftAvailable();

describe("Ranger @process — Kotlin and Swift", () => {
  describe.skipIf(!kotlinAvailable)("Kotlin", () => {
    it("compiles and runs process_nesting fixture", () => {
      const { compile, run } = compileAndRunKotlin(FIXTURE);
      expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("OK process nesting");
    });
  });

  describe.skipIf(!swiftAvailable)("Swift6", () => {
    it("compiles and runs process_nesting fixture", () => {
      const { compile, run } = compileAndRunSwift(FIXTURE);
      expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("OK process nesting");
    });
  });
});
