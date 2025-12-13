import { describe, it, expect, beforeAll } from "vitest";
import { compileAndRun, compileRanger } from "./helpers/compiler";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use relative paths from project root for fixtures
const FIXTURES_DIR = "tests/fixtures";

describe("Ranger Compiler - Basic Features", () => {
  describe("Array Operations", () => {
    it("should compile and run array push", () => {
      const { compile, run } = compileAndRun(`${FIXTURES_DIR}/array_push.rgr`);

      expect(compile.success).toBe(true);
      expect(run?.success).toBe(true);
      expect(run?.output).toContain("Done");
    });

    it("should compile and run local array with iteration", () => {
      const { compile, run } = compileAndRun(`${FIXTURES_DIR}/local_array.rgr`);

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("hello");
      expect(run?.output).toContain("world");
    });

    it("should compile and run class-level array property", () => {
      const { compile, run } = compileAndRun(`${FIXTURES_DIR}/class_array.rgr`);

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
      const { compile, run } = compileAndRun(
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
      const { compile, run } = compileAndRun(
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
      const { compile, run } = compileAndRun(`${FIXTURES_DIR}/forward_ref.rgr`);

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
      const { compile, run } = compileAndRun(`${FIXTURES_DIR}/two_classes.rgr`);

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Done");
    });

    it("should compile and run class with many static factories", () => {
      const { compile, run } = compileAndRun(
        `${FIXTURES_DIR}/many_factories.rgr`
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

  describe("Control Flow", () => {
    it("should compile and run while loop with array init", () => {
      const { compile, run } = compileAndRun(`${FIXTURES_DIR}/while_loop.rgr`);

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Count: 5");
      expect(run?.output).toContain("Done");
    });
  });

  describe("Inheritance", () => {
    it("should compile and run classes with inheritance", () => {
      const { compile, run } = compileAndRun(`${FIXTURES_DIR}/inheritance.rgr`);

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Buddy");
      expect(run?.output).toContain("Woof!");
      expect(run?.output).toContain("Whiskers");
      expect(run?.output).toContain("Meow!");
      expect(run?.output).toContain("Done");
    });
  });

  describe("Data Structures", () => {
    it("should compile and run hash map operations", () => {
      const { compile, run } = compileAndRun(`${FIXTURES_DIR}/hash_map.rgr`);

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Alice score: 100");
      expect(run?.output).toContain("Bob exists");
      expect(run?.output).toContain("Done");
    });
  });

  describe("String Operations", () => {
    it("should compile and run string operations", () => {
      const { compile, run } = compileAndRun(`${FIXTURES_DIR}/string_ops.rgr`);

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Length: 11");
      expect(run?.output).toContain("Hello");
      expect(run?.output).toContain("Done");
    });

    it("should compile and run startsWith, endsWith, contains, replace", () => {
      const { compile, run } = compileAndRun(
        `${FIXTURES_DIR}/string_methods.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("startsWith Hello: true");
      expect(run?.output).toContain("startsWith World: false");
      expect(run?.output).toContain("endsWith World: true");
      expect(run?.output).toContain("endsWith Hello: false");
      expect(run?.output).toContain("contains 'lo Wo': true");
      expect(run?.output).toContain("contains xyz: false");
      expect(run?.output).toContain("Hello Ranger");
      expect(run?.output).toContain("test endsWith st: true");
      expect(run?.output).toContain("Done");
    });
  });

  describe("Math Operations", () => {
    it("should compile and run math operations", () => {
      const { compile, run } = compileAndRun(`${FIXTURES_DIR}/math_ops.rgr`);

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Sum: 13");
      expect(run?.output).toContain("Diff: 7");
      expect(run?.output).toContain("Prod: 30");
      expect(run?.output).toContain("a is greater");
      expect(run?.output).toContain("Done");
    });
  });

  describe("Optional Values", () => {
    it("should compile and run optional value handling", () => {
      const { compile, run } = compileAndRun(
        `${FIXTURES_DIR}/optional_values.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Alice");
      expect(run?.output).toContain("default");
      expect(run?.output).toContain("Done");
    });
  });
});
