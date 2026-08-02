import { describe, it, expect, beforeAll } from "vitest";
import { compileAndRunPython, isPythonAvailable } from "./helpers/compiler";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use relative paths from project root for fixtures
const FIXTURES_DIR = "tests/fixtures";

// Check if Python is available before running tests
const pythonAvailable = isPythonAvailable();

describe.skipIf(!pythonAvailable)("Ranger Compiler - Python Target", () => {
  beforeAll(() => {
    if (!pythonAvailable) {
      console.log("Python is not available, skipping Python tests");
    }
  });

  // These operators had no python template at all: M_PI, fabs, tan, random
  // (both variants), wait, file_exists, dir_exists and create_dir. They are
  // run rather than only compiled, because the python backend can emit code
  // that compiles and is not valid Python -- see the lambda note in
  // PLAN_OPERATORS.md.
  describe("Math, random and filesystem operators", () => {
    it("should compile and run the operators that had no python template", () => {
      const { compile, run } = compileAndRunPython(
        `${FIXTURES_DIR}/python_stdlib_ops.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("pi>3:y");
      expect(run?.output).toContain("fabs:1.5");
      expect(run?.output).toContain("rand_range:y");
      expect(run?.output).toContain("randint:3");
      expect(run?.output).toContain("dir_exists:y");
      expect(run?.output).toContain("file_missing:n");
    });
  });

  describe("Array Operations", () => {
    it("should compile and run array push", () => {
      const { compile, run } = compileAndRunPython(
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
      const { compile, run } = compileAndRunPython(
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
      const { compile, run } = compileAndRunPython(
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
      const { compile, run } = compileAndRunPython(
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
      const { compile, run } = compileAndRunPython(
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
      const { compile, run } = compileAndRunPython(
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

  describe("Multi-Class Interaction", () => {
    it("should compile and run two classes with static factory", () => {
      const { compile, run } = compileAndRunPython(
        `${FIXTURES_DIR}/two_classes.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Done");
    });

    it("should compile and run many factories", () => {
      const { compile, run } = compileAndRunPython(
        `${FIXTURES_DIR}/many_factories.rgr`
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
      const { compile, run } = compileAndRunPython(
        `${FIXTURES_DIR}/while_loop.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Count:");
      expect(run?.output).toContain("Done");
    });
  });

  describe("Class Features", () => {
    it.skip("should compile and run inheritance (skip: super().__init__() needs args)", () => {
      const { compile, run } = compileAndRunPython(
        `${FIXTURES_DIR}/inheritance.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Buddy");
      expect(run?.output).toContain("Woof!");
      expect(run?.output).toContain("Done");
    });
  });

  describe("Data Structures", () => {
    it("should compile and run hash map operations", () => {
      const { compile, run } = compileAndRunPython(
        `${FIXTURES_DIR}/hash_map.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Alice score:");
      expect(run?.output).toContain("Done");
    });
  });

  describe("String Operations", () => {
    it("should compile and run string operations", () => {
      const { compile, run } = compileAndRunPython(
        `${FIXTURES_DIR}/string_ops.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Length:");
      expect(run?.output).toContain("Hello");
      expect(run?.output).toContain("Done");
    });

    it("should compile and run string methods (startsWith, endsWith, contains, replace)", () => {
      const { compile, run } = compileAndRunPython(
        `${FIXTURES_DIR}/string_methods.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("true");
      expect(run?.output).toContain("Done");
    });
  });

  describe("Math Operations", () => {
    it("should compile and run math operations", () => {
      const { compile, run } = compileAndRunPython(
        `${FIXTURES_DIR}/math_ops.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Sum: 13");
      expect(run?.output).toContain("Prod: 30");
      expect(run?.output).toContain("Done");
    });
  });

  describe("Optional Values", () => {
    it("should compile and run optional value handling", () => {
      const { compile, run } = compileAndRunPython(
        `${FIXTURES_DIR}/optional_values.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Alice");
      expect(run?.output).toContain("Done");
    });
  });
});
