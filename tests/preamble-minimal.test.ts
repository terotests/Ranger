import { describe, it, expect } from "vitest";
import { getGeneratedRustCode, getGeneratedCppCode } from "./helpers/compiler";

const FIXTURES_DIR = "tests/fixtures";

// The preamble both native targets put at the top of a file — allow
// attributes, std imports, downcast/identity traits, the insertion-ordered map,
// the character-counting string searches — used to be written ahead of the
// first class, before there was a body to consult, so every program got all of
// it. A hello world arrived under 139 lines of Rust prelude and 142 of C++.
//
// It is written from `finalizeFile` now, once the whole program is in the
// writer, so each piece is emitted only when the body names it. These tests are
// the floor and the ceiling of that: nothing in a program that uses nothing, and
// the helper still there in a program that does.
describe("the file preamble carries only what the program uses", () => {
  describe("Rust: hello world", () => {
    const result = getGeneratedRustCode(`${FIXTURES_DIR}/hello.rgr`);

    it("compiles", () => {
      expect(result.success, `Failed: ${result.error}`).toBe(true);
    });

    it("has no downcast or identity machinery", () => {
      expect(result.code).not.toContain("RgAnyRef");
      expect(result.code).not.toContain("rg_downcast");
      expect(result.code).not.toContain("RgIdentical");
    });

    it("has no hasher and no ordered map", () => {
      expect(result.code).not.toContain("FxHasher");
      expect(result.code).not.toContain("RgOrderedMap");
      expect(result.code).not.toContain("type HashMap");
    });

    it("has no character-counting string searches", () => {
      expect(result.code).not.toContain("fn rg_index_of");
      expect(result.code).not.toContain("fn rg_last_index_of");
    });

    it("imports neither Rc nor RefCell", () => {
      expect(result.code).not.toContain("use std::rc::Rc;");
      expect(result.code).not.toContain("use std::cell::RefCell;");
    });

    it("keeps only the one allow attribute no output escapes", () => {
      // every class carries a generated `new` the program may never call
      expect(result.code).toContain("#![allow(dead_code)]");
      expect(result.code).not.toContain("#![allow(unused_parens)]");
      expect(result.code).not.toContain("#![allow(unused_mut)]");
      expect(result.code).not.toContain("#![allow(unused_variables)]");
      expect(result.code).not.toContain("#![allow(non_snake_case)]");
      expect(result.code).not.toContain("clippy::");
    });

    it("still prints", () => {
      expect(result.code).toContain('println!("Hello World");');
    });
  });

  describe("Rust: a program that does use the helpers", () => {
    it("brings the ordered map back for a hash", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/hash_map.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("type HashMap<K, V> = RgOrderedMap<K, V>;");
      expect(result.code).toContain("struct FxHasher");
    });

    it("brings the identity trait back for `identical`", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/identical_op.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("pub trait RgIdentical");
      expect(result.code).toContain("use std::rc::Rc;");
    });

    it("brings the string searches back for indexOf", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/string_ops.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("fn rg_index_of(");
    });

    it("still writes the enum a closed family lowers to", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/shape_value.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("pub enum union_Value {");
    });
  });

  describe("C++: hello world", () => {
    const result = getGeneratedCppCode(`${FIXTURES_DIR}/hello.rgr`);

    it("compiles", () => {
      expect(result.success, `Failed: ${result.error}`).toBe(true);
    });

    it("has no union typedef and no optional-union wrapper", () => {
      expect(result.code).not.toContain("r_optional_union");
      expect(result.code).not.toContain("r_union_");
      expect(result.code).not.toContain("<variant>");
    });

    it("has no hasher, no ordered map and no forwarding reference", () => {
      expect(result.code).not.toContain("rg_hash_bytes");
      expect(result.code).not.toContain("rg_ordered_map");
      expect(result.code).not.toContain("rg_arg_ref");
    });

    it("drops the headers those helpers needed", () => {
      expect(result.code).not.toContain("<string_view>");
      expect(result.code).not.toContain("<cstring>");
      expect(result.code).not.toContain("<type_traits>");
    });

    it("still prints", () => {
      expect(result.code).toContain('std::cout << std::string("Hello World")');
    });
  });

  describe("C++: a program that does use the helpers", () => {
    it("brings the ordered map back for a hash", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/hash_map.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("class rg_ordered_map");
      expect(result.code).toContain("rg_hash_bytes");
    });

    it("still writes the variant a closed family lowers to", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/shape_value.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("typedef std::variant<");
      expect(result.code).toContain("r_union_Value");
    });
  });
});
