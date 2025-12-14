import { describe, it, expect, beforeAll } from "vitest";
import {
  compileAndRunKotlin,
  isKotlinAvailable,
  compileRangerToKotlin,
} from "./helpers/compiler";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_DIR = "tests/fixtures";
const KOTLIN_OUTPUT_DIR = path.join(__dirname, ".output-kotlin");

// Check if Kotlin is available before running tests
const kotlinAvailable = isKotlinAvailable();

describe.skipIf(!kotlinAvailable)("Ranger Compiler - Kotlin Target", () => {
  beforeAll(() => {
    if (!kotlinAvailable) {
      console.log("Kotlin is not available, skipping Kotlin tests");
    }
    // Ensure output directory exists
    if (!fs.existsSync(KOTLIN_OUTPUT_DIR)) {
      fs.mkdirSync(KOTLIN_OUTPUT_DIR, { recursive: true });
    }
  });

  describe("Array Operations", () => {
    it("should compile and run array push", () => {
      const { compile, run } = compileAndRunKotlin(
        `${FIXTURES_DIR}/array_push.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Done");
    });

    it("should compile and run local array with iteration", () => {
      const { compile, run } = compileAndRunKotlin(
        `${FIXTURES_DIR}/local_array.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("hello");
      expect(run?.output).toContain("world");
    });

    it("should compile and run class-level array property", () => {
      const { compile, run } = compileAndRunKotlin(
        `${FIXTURES_DIR}/class_array.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Done");
    });
  });

  describe("Static Factory Methods", () => {
    it("should compile and run static factory method", () => {
      const { compile, run } = compileAndRunKotlin(
        `${FIXTURES_DIR}/static_factory.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("test");
      expect(run?.output).toContain("Done");
    });

    it("should compile and run static factory with ternary operator", () => {
      const { compile, run } = compileAndRunKotlin(
        `${FIXTURES_DIR}/ternary_factory.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("K");
      expect(run?.output).toContain("q");
      expect(run?.output).toContain("Done");
    });
  });

  describe("Constructor Features", () => {
    it("should support forward reference in constructor", () => {
      const { compile, run } = compileAndRunKotlin(
        `${FIXTURES_DIR}/forward_ref.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Done");
    });
  });

  describe("String Operations", () => {
    it("should compile and run string operations", () => {
      const { compile, run } = compileAndRunKotlin(
        `${FIXTURES_DIR}/string_ops.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Done");
    });
  });

  describe("Control Flow", () => {
    it("should compile and run while loop", () => {
      const { compile, run } = compileAndRunKotlin(
        `${FIXTURES_DIR}/while_loop.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Done");
    });
  });

  describe("Math Operations", () => {
    it("should compile and run math operations", () => {
      const { compile, run } = compileAndRunKotlin(
        `${FIXTURES_DIR}/math_ops.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Done");
    });
  });

  describe("Hash Map Operations", () => {
    it("should compile and run hash map operations", () => {
      const { compile, run } = compileAndRunKotlin(
        `${FIXTURES_DIR}/hash_map.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Done");
    });
  });

  describe("Optional Values", () => {
    it("should compile and run optional value handling", () => {
      const { compile, run } = compileAndRunKotlin(
        `${FIXTURES_DIR}/optional_values.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Done");
    });
  });

  describe("Two Classes", () => {
    it("should compile and run program with two classes", () => {
      const { compile, run } = compileAndRunKotlin(
        `${FIXTURES_DIR}/two_classes.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Done");
    });
  });

  describe("Inheritance", () => {
    it("should compile and run inheritance example", () => {
      const { compile, run } = compileAndRunKotlin(
        `${FIXTURES_DIR}/inheritance.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Done");
    });
  });
});

// Tests that only check Ranger->Kotlin compilation (don't require kotlinc)
describe("Ranger to Kotlin Compilation", () => {
  it("should compile array_push.rgr to valid Kotlin syntax", () => {
    const result = compileRangerToKotlin(`${FIXTURES_DIR}/array_push.rgr`);
    expect(result.success, `Compile failed: ${result.error}`).toBe(true);
  });

  it("should compile string_ops.rgr to valid Kotlin syntax", () => {
    const result = compileRangerToKotlin(`${FIXTURES_DIR}/string_ops.rgr`);
    expect(result.success, `Compile failed: ${result.error}`).toBe(true);
  });

  it("should compile static_factory.rgr to valid Kotlin syntax", () => {
    const result = compileRangerToKotlin(`${FIXTURES_DIR}/static_factory.rgr`);
    expect(result.success, `Compile failed: ${result.error}`).toBe(true);
  });
});
