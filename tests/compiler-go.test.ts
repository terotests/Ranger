import { describe, it, expect, beforeAll } from "vitest";
import { compileAndRunGo, isGoAvailable } from "./helpers/compiler";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use relative paths from project root for fixtures
const FIXTURES_DIR = "tests/fixtures";

// Check if Go is available before running tests
const goAvailable = isGoAvailable();

describe.skipIf(!goAvailable)("Ranger Compiler - Go Target", () => {
  beforeAll(() => {
    if (!goAvailable) {
      console.log("Go is not available, skipping Go tests");
    }
  });

  describe("Array Operations", () => {
    it("should compile and run array push", () => {
      const { compile, run } = compileAndRunGo(`${FIXTURES_DIR}/array_push.clj`);

      expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Done");
    });

    it("should compile and run local array with iteration", () => {
      const { compile, run } = compileAndRunGo(`${FIXTURES_DIR}/local_array.clj`);

      expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("hello");
      expect(run?.output).toContain("world");
    });

    it("should compile and run class-level array property", () => {
      const { compile, run } = compileAndRunGo(`${FIXTURES_DIR}/class_array.clj`);

      expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Done");
    });
  });

  describe("Static Factory Methods", () => {
    it("should compile and run static factory method", () => {
      const { compile, run } = compileAndRunGo(`${FIXTURES_DIR}/static_factory.clj`);

      expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("test");
      expect(run?.output).toContain("Done");
    });

    it("should compile and run static factory with ternary operator", () => {
      const { compile, run } = compileAndRunGo(`${FIXTURES_DIR}/ternary_factory.clj`);

      expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("K");
      expect(run?.output).toContain("q");
      expect(run?.output).toContain("Done");
    });
  });

  describe("Constructor Features", () => {
    it("should support forward reference in constructor", () => {
      const { compile, run } = compileAndRunGo(`${FIXTURES_DIR}/forward_ref.clj`);

      expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Done");
    });
  });

  describe("Multi-Class Interaction", () => {
    it("should compile and run two classes with static factory", () => {
      const { compile, run } = compileAndRunGo(`${FIXTURES_DIR}/two_classes.clj`);

      expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Done");
    });

    it("should compile and run many factories", () => {
      const { compile, run } = compileAndRunGo(`${FIXTURES_DIR}/many_factories.clj`);

      expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Done");
    });
  });

  describe("Control Flow", () => {
    it("should compile and run while loop", () => {
      const { compile, run } = compileAndRunGo(`${FIXTURES_DIR}/while_loop.clj`);

      expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Count:");
      expect(run?.output).toContain("Done");
    });
  });

  describe("Class Features", () => {
    it("should compile and run inheritance", () => {
      const { compile, run } = compileAndRunGo(`${FIXTURES_DIR}/inheritance.clj`);

      expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Buddy");
      expect(run?.output).toContain("Woof!");
      expect(run?.output).toContain("Done");
    });
  });

  describe("Data Structures", () => {
    it("should compile and run hash map operations", () => {
      const { compile, run } = compileAndRunGo(`${FIXTURES_DIR}/hash_map.clj`);

      expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Alice score:");
      expect(run?.output).toContain("Done");
    });
  });

  describe("String Operations", () => {
    it("should compile and run string operations", () => {
      const { compile, run } = compileAndRunGo(`${FIXTURES_DIR}/string_ops.clj`);

      expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Length:");
      expect(run?.output).toContain("Hello");
      expect(run?.output).toContain("Done");
    });

    it("should compile and run string methods (startsWith, endsWith, contains, replace)", () => {
      const { compile, run } = compileAndRunGo(`${FIXTURES_DIR}/string_methods.clj`);

      expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("true");
      expect(run?.output).toContain("Done");
    });
  });

  describe("Math Operations", () => {
    it.skip("should compile and run math operations (skip: Go type conversion issue)", () => {
      const { compile, run } = compileAndRunGo(`${FIXTURES_DIR}/math_ops.clj`);

      expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("15");
      expect(run?.output).toContain("50");
      expect(run?.output).toContain("Done");
    });
  });

  describe("Optional Values", () => {
    it("should compile and run optional value handling", () => {
      const { compile, run } = compileAndRunGo(`${FIXTURES_DIR}/optional_values.clj`);

      expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Alice");
      expect(run?.output).toContain("Done");
    });
  });
});
