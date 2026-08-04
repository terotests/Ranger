import { describe, it, expect } from "vitest";
import { getGeneratedRustCode } from "./helpers/compiler";

const FIXTURES_DIR = "tests/fixtures";

describe("Rust Code Generation", () => {
  describe("Method receivers and signature shape", () => {
    const result = getGeneratedRustCode(`${FIXTURES_DIR}/rust_receivers.rgr`);

    it("gives a read-only method &self", () => {
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("fn reading(&self) -> i64");
    });

    it("keeps &self for a collection read like itemAt", () => {
      // itemAt is a has_call on the member vector; a read operator on a
      // plain collection must not count as a mutation of self
      expect(result.code).toContain("fn firstLabel(&self) -> String");
    });

    it("gives a field-assigning method &mut self", () => {
      expect(result.code).toContain("fn bump(&mut self, amount : i64)");
    });

    it("detects mutation through push into a member collection", () => {
      // push never appears as an `=` node; without the operator check this
      // method would take &self and rustc would reject the push. The string
      // parameter itself is read-only from the caller's view, so it borrows
      // (&String) and the push stores a clone.
      expect(result.code).toContain("fn tag(&mut self, s : &String)");
    });

    it("emits no unit return type and no trailing comma", () => {
      expect(result.code).not.toContain("-> ()");
      expect(result.code).not.toContain("&mut self, )");
      expect(result.code).not.toContain("&self, )");
    });

    it("omits the Weak import when no weak field exists", () => {
      expect(result.code).not.toContain("use std::rc::Weak;");
    });
  });

  describe("String formatting and index shape", () => {
    const result = getGeneratedRustCode(`${FIXTURES_DIR}/rust_format.rgr`);

    it("inlines literals into the println! format string", () => {
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain('println!("numbers {}"');
      expect(result.code).toContain('println!("first name {}"');
    });

    it("flattens a string chain into one format!", () => {
      expect(result.code).toContain('format!("rows: {} first: {}"');
    });

    it("emits no join or concat chains", () => {
      expect(result.code).not.toContain('.join("")');
      expect(result.code).not.toContain(".concat()");
    });

    it("indexes with a bare integer literal, no usize cast", () => {
      expect(result.code).toContain("[0]");
      expect(result.code).not.toContain("[0 as usize]");
      expect(result.code).not.toContain("[(0) as usize]");
    });

    it("does not clone a Copy element read", () => {
      // firstCount reads an i64 out of a Vec<i64>; a clone there is
      // clippy's clone_on_copy
      expect(result.code).toContain("self.counts[0]");
      expect(result.code).not.toContain("self.counts[0].clone()");
    });

    it("makes a free fn main the crate entry", () => {
      // a file-level `fn main` lands on a class; without a crate main the
      // file failed with E0601
      expect(result.code).toMatch(/\nfn main\(\) \{/);
    });
  });

  describe("Compound assignment and tail expressions", () => {
    const result = getGeneratedRustCode(`${FIXTURES_DIR}/rust_receivers.rgr`);

    it("writes x = x + e as a compound assignment", () => {
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("self.total += amount;");
      expect(result.code).not.toContain("self.total = self.total + amount");
    });

    it("writes the last return as a tail expression", () => {
      // `return total` at the end of reading() is the tail `self.total`
      expect(result.code).toMatch(/fn reading\(&self\) -> i64 \{\s*\n\s*self\.total\s*\n\s*\}/);
    });

    it("ends the constructor with the struct value, not return me;", () => {
      expect(result.code).not.toContain("return me;");
    });
  });

  describe("Clippy-clean emission on the flagship program", () => {
    // The jpeg scaler reached zero clippy warnings; these greps pin the
    // shapes that used to produce the big warning classes.
    const result = getGeneratedRustCode(
      "gallery/pdf_writer/src/tools/jpeg_scaler.rgr"
    );

    it("compiles the scaler", () => {
      expect(result.success, `Failed: ${result.error}`).toBe(true);
    });

    it("has no doubled parens or literal casts", () => {
      expect(result.code).not.toContain("((0) as usize)");
      expect(result.code).not.toContain("[(0) as usize]");
      // a pair directly containing another complete pair is clippy's
      // double_parens: `((x))`
      expect(result.code).not.toMatch(/\(\([a-zA-Z0-9_. ]+\)\)/);
    });

    it("has no join/concat chains and no unit returns", () => {
      expect(result.code).not.toContain('.join("")');
      expect(result.code).not.toContain(".concat()");
      expect(result.code).not.toContain("-> ()");
      expect(result.code).not.toContain("&mut self, )");
    });

    it("compares booleans and strings idiomatically", () => {
      expect(result.code).not.toMatch(/== false\b/);
      expect(result.code).not.toContain('!= "".to_string()');
    });

    it("keeps the documented allows only", () => {
      expect(result.code).toContain("#![allow(clippy::manual_clamp)]");
      expect(result.code).toContain("#![allow(clippy::too_many_arguments)]");
      expect(result.code).not.toContain("#![allow(clippy::all)]");
    });
  });

  describe("Borrowed collection parameters as slices", () => {
    const result = getGeneratedRustCode(`${FIXTURES_DIR}/rust_slice_params.rgr`);

    it("passes a borrowed int array as &[i64]", () => {
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("data : &[i64]");
      expect(result.code).not.toContain("data : &Vec<i64>");
    });

    it("passes a borrowed buffer as &[u8]", () => {
      expect(result.code).toContain("buf : &[u8]");
    });
  });

  describe("Array/Vector Operations", () => {
    it("should generate Vec::new() for array initialization", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/array_push.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("Vec::new()");
    });

    it("should use .push() for vector append", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/array_push.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain(".push(");
    });

    it("should generate vector operations", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/local_array.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Compiler may unroll small loops - verify push operations
      expect(result.code).toContain(".push(");
    });
  });

  describe("String Operations", () => {
    it("should use proper string types", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/string_ops.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Rust uses String or &str
      expect(result.code).toMatch(/String|&str/);
    });

    it("should use .to_string() for string conversions", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/string_methods.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain(".to_string()");
    });

    it("should use format! or println! for string formatting", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/hello.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toMatch(/println!|print!/);
    });
  });

  describe("Type System", () => {
    it("should generate proper type annotations", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/math_ops.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Rust uses i64, f64, bool, etc.
      expect(result.code).toMatch(/i64|i32|f64|bool|String/);
    });

    it("should use let for variable declarations", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/array_push.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("let ");
    });

    it("should use mut for mutable variables", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/array_push.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("let mut");
    });
  });

  describe("Ownership and Borrowing", () => {
    it("should use proper string handling", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/two_classes.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Rust uses to_string() and clone() for string handling
      expect(result.code).toMatch(/to_string\(\)|\.clone\(\)/);
    });

    it("should use .clone() for explicit copies", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/two_classes.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // .clone() should appear for non-Copy types
      expect(result.code).toContain(".clone()");
    });
  });

  describe("Struct/Class Features", () => {
    it("should generate struct keyword", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/two_classes.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("struct ");
    });

    it("should use impl blocks for methods", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/two_classes.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("impl ");
    });

    it("should use fn keyword for functions", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/static_factory.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("fn ");
    });

    it("should use pub for public visibility", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/two_classes.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("pub ");
    });

    it("should use Self:: for static method calls", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/static_factory.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Static methods use Self:: or StructName::
      expect(result.code).toMatch(/Self::|::/);
    });
  });

  describe("Optional/Option Types", () => {
    it("should use Option<T> for nullable types", () => {
      const result = getGeneratedRustCode(
        `${FIXTURES_DIR}/optional_values.rgr`
      );
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("Option<");
    });

    it("should use None instead of null", () => {
      const result = getGeneratedRustCode(
        `${FIXTURES_DIR}/optional_values.rgr`
      );
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("None");
    });

    it("should use Some() for present values", () => {
      const result = getGeneratedRustCode(
        `${FIXTURES_DIR}/optional_values.rgr`
      );
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("Some(");
    });
  });

  describe("Control Flow", () => {
    it("should generate if/else blocks", () => {
      const result = getGeneratedRustCode(
        `${FIXTURES_DIR}/ternary_factory.rgr`
      );
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("if ");
      expect(result.code).toContain("else");
    });

    it("should generate while loops", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/while_loop.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("while ");
    });
  });

  describe("Polyfill Deduplication", () => {
    it("should not duplicate polyfills when features are used multiple times", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/polyfill_dedup.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);

      // Count occurrences of key polyfill elements - should appear only once
      const receiverCount = (result.code.match(/static R_KEY_RECEIVER:/g) || [])
        .length;
      expect(receiverCount).toBe(1);
    });
  });
});
