import { describe, it, expect, beforeAll } from "vitest";
import {
  isRustAvailable,
  compileRangerToRust,
  expectRustOutput,
  getGeneratedRustCode,
} from "./helpers/compiler";

const rustAvailable = isRustAvailable();

describe.skipIf(!rustAvailable)("Ranger Compiler - Rust Target", () => {
  beforeAll(() => {
    if (!rustAvailable) {
      console.log("Rust is not available, skipping Rust tests");
    }
  });

  describe("Array Operations", () => {
    it("should compile array_push.rgr to valid Rust", () => {
      const result = compileRangerToRust("tests/fixtures/array_push.rgr");
      expect(result.success).toBe(true);
    });

    it("should run array_push and produce correct output", () => {
      expectRustOutput("tests/fixtures/array_push.rgr", "Done");
    });

    it("should compile local_array.rgr to valid Rust", () => {
      const result = compileRangerToRust("tests/fixtures/local_array.rgr");
      expect(result.success).toBe(true);
    });

    it("should run local_array and produce correct output", () => {
      expectRustOutput("tests/fixtures/local_array.rgr", ["hello", "world"]);
    });
  });

  describe("Math Operations", () => {
    it("should compile math_ops.rgr to valid Rust", () => {
      const result = compileRangerToRust("tests/fixtures/math_ops.rgr");
      expect(result.success).toBe(true);
    });

    // Note: Runtime test may fail due to integer division type mismatch (f64 vs i64)
  });

  describe("Class Features", () => {
    it("should compile two_classes.rgr to valid Rust", () => {
      const result = compileRangerToRust("tests/fixtures/two_classes.rgr");
      expect(result.success).toBe(true);
    });

    it("should compile while_loop.rgr to valid Rust", () => {
      const result = compileRangerToRust("tests/fixtures/while_loop.rgr");
      expect(result.success).toBe(true);
    });
  });

  describe("Nested self method calls", () => {
    // `this.dist(… (itemAt pal (this.nearest(…))) …)` borrows self twice in one
    // expression. The inner call was only ever looked for at the argument's own
    // head, so an index hid it and the generated Rust was E0499.
    it("should compile a self call nested inside an index expression", () => {
      const result = compileRangerToRust(
        "tests/fixtures/rust_nested_self_call.rgr"
      );
      expect(result.success).toBe(true);
    });

    it("should hoist the nested call and keep the same result as the other targets", () => {
      expectRustOutput("tests/fixtures/rust_nested_self_call.rgr", "-25 10 3");
    });

    // …but a self call in a loop BODY belongs to the closure the body becomes:
    // hoisted out, its `let` lands where the loop variable does not exist.
    it("should leave a self call inside a loop body in place", () => {
      const result = getGeneratedRustCode(
        "tests/fixtures/rust_nested_self_call.rgr"
      );
      expect(result.success).toBe(true);
      const hoistedLoopVar = /let mut _tmp_\d+ = self\.nearest\(x\b/;
      expect(result.code).not.toMatch(hoistedLoopVar);
    });
  });

  describe("Names the Rust preamble could shadow", () => {
    // `use std::cell::Cell` was in the preamble of every generated program, so
    // a program declaring its own `Cell` collided with it and every later
    // mention resolved to the std type. The class here is also a subclass
    // carrying a scalar its root lacks, which is the shape that gets an
    // interior cell — so the std type still has to be reachable, spelled out.
    it("should compile a program that declares its own class named Cell", () => {
      const result = compileRangerToRust(
        "tests/fixtures/rust_class_named_cell.rgr"
      );
      expect(result.success).toBe(true);
    });

    it("should run it and agree with the other targets", () => {
      expectRustOutput("tests/fixtures/rust_class_named_cell.rgr", [
        "cell 7",
        "plain 0",
        "done",
      ]);
    });

    it("should not import Cell, and should spell the std type in full", () => {
      const result = getGeneratedRustCode(
        "tests/fixtures/rust_class_named_cell.rgr"
      );
      expect(result.success).toBe(true);
      expect(result.code).not.toContain("use std::cell::Cell;");
      expect(result.code).toContain("std::cell::Cell<");
    });
  });

  describe("Polyfill Deduplication", () => {
    it("should not duplicate polyfills when on_keypress is used multiple times", () => {
      const result = getGeneratedRustCode("tests/fixtures/polyfill_dedup.rgr");
      expect(result.success).toBe(true);

      // Count occurrences of key polyfill elements
      // These should appear exactly once even with multiple on_keypress calls
      const code = result.code;

      // Count R_KEY_RECEIVER static definitions - this is unique to the polyfill
      // Note: r_setup_raw_mode and r_read_key have TWO definitions each (one for #[cfg(windows)] and one for #[cfg(unix)])
      const receiverCount = (code.match(/static R_KEY_RECEIVER:/g) || [])
        .length;
      expect(receiverCount).toBe(1);
    });

    it("should compile polyfill_dedup.rgr to valid Rust", () => {
      const result = compileRangerToRust("tests/fixtures/polyfill_dedup.rgr");
      expect(result.success).toBe(true);
    });
  });
});
