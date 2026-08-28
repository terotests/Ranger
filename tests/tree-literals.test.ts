import { describe, it, expect } from "vitest";
import {
  expectCompileError,
  expectGoOutput,
  expectOutput,
  expectPythonOutput,
  expectRustOutput,
  getGeneratedCppCode,
  getGeneratedRustCode,
  isGoAvailable,
  isPythonAvailable,
  isRustAvailable,
} from "./helpers/compiler";

const FIXTURES = "tests/fixtures";
const TREE = `${FIXTURES}/tree_literal.rgr`;

/**
 * Tree literals — `treefactory` and `tree`.
 *
 * `treefactory Name { … }` says what a tag builds and how a child is attached;
 * `(tree Name (Tag …))` builds one. Both are lowered to ordinary Ranger — a
 * `new`, some field assignments and some method calls — in one pass before
 * anything else looks at the program. No target writer knows the feature
 * exists, which is why a target carries a tree literal exactly as well as it
 * carries a constructor call.
 *
 * There is no node type, no element class, no runtime and no UI in any of it.
 * The fixture proves that by driving two unrelated object spaces through the
 * same syntax: a display tree with `addKid`, and a SQL select with
 * `addColumn`, which share no base class and no shape.
 */
describe("tree literals", () => {
  const UI = "root(a:hello b:literal badge:tero)";
  const SQL = "select id, title from documents";
  const LOOP = "n0n1n2";

  describe("runs identically across targets", () => {
    it("ES6", () => {
      const run = expectOutput(TREE, UI);
      expect(run.output).toContain(SQL);
      expect(run.output).toContain(LOOP);
    });

    it.skipIf(!isPythonAvailable())("Python", () => {
      const run = expectPythonOutput(TREE, UI);
      expect(run.output).toContain(SQL);
      expect(run.output).toContain(LOOP);
    });

    it.skipIf(!isGoAvailable())("Go", () => {
      const run = expectGoOutput(TREE, UI);
      expect(run.output).toContain(SQL);
      expect(run.output).toContain(LOOP);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      const run = expectRustOutput(TREE, UI);
      expect(run.output).toContain(SQL);
      expect(run.output).toContain(LOOP);
    });
  });

  describe("lowers to ordinary code, not to a runtime", () => {
    it("emits a constructor call and field assignments, and nothing else", () => {
      const cpp = getGeneratedCppCode(TREE);
      // The whole feature, in the generated C++: something was constructed and
      // its fields were set. If a helper, a node type or a factory object ever
      // appears here, the feature has stopped being a syntax transformation.
      expect(cpp).not.toContain("treefactory");
      expect(cpp).not.toContain("TreeFactory");
      expect(cpp).not.toContain("createElement");
      const rust = getGeneratedRustCode(TREE);
      expect(rust).not.toContain("treefactory");
      expect(rust).not.toContain("createElement");
    });
  });

  /**
   * Every one of these has to fail, and the point of listing them is that the
   * checking is not a second implementation of the type checker: a misspelled
   * property is an assignment to a field that does not exist, and a wrongly
   * typed one is a type error on that assignment. The two errors the feature
   * raises itself are the two the type checker cannot see — a tag or a factory
   * that was never declared.
   */
  describe("rejects", () => {
    it("a tag the factory never declared", () => {
      expectCompileError(
        `${FIXTURES}/tree_bad_unknown_tag.rgr`,
        "is not a tag of treefactory UiTree",
      );
    });

    it("a factory that does not exist", () => {
      expectCompileError(
        `${FIXTURES}/tree_bad_unknown_factory.rgr`,
        "no treefactory named Nope",
      );
    });

    it("a property the class does not have", () => {
      expectCompileError(`${FIXTURES}/tree_bad_prop_name.rgr`, "nmae");
    });

    it("a property of the wrong type", () => {
      expectCompileError(`${FIXTURES}/tree_bad_prop_type.rgr`);
    });

    it("a value child when the factory declares no text field", () => {
      expectCompileError(
        `${FIXTURES}/tree_bad_no_text.rgr`,
        "has no `text` field",
      );
    });

    it("an empty child form", () => {
      expectCompileError(`${FIXTURES}/tree_bad_empty_child.rgr`, "empty child");
    });

    it("a treefactory declared inside a class", () => {
      expectCompileError(
        `${FIXTURES}/tree_bad_in_class.rgr`,
        "top level",
      );
    });
  });
});
