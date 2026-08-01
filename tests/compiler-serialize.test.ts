import { describe, it, expect } from "vitest";
import { compileAndRun, compileRanger } from "./helpers/compiler";

const FIXTURES = "tests/fixtures/serialize";

describe("@serialize(true) code generation", () => {
  it("round trips primitives, nested objects, object arrays and object hashes", () => {
    const { compile, run } = compileAndRun(
      `${FIXTURES}/serialize_roundtrip.rgr`
    );

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("title=parent");
    expect(run?.output).toContain("tags=a");
    expect(run?.output).toContain("one=solo");
    expect(run?.output).toContain("kid=first:7");
    expect(run?.output).toContain("hash=hashed");
    expect(run?.output).toContain("serialize-roundtrip-ok");
  });

  it("serializes mutually referencing classes that can not be sorted", () => {
    const { compile, run } = compileAndRun(`${FIXTURES}/serialize_cyclic.rgr`);

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("serialize-cyclic-ok");
  });

  it("accepts an element type that implements toDictionary / fromDictionary by hand", () => {
    const { compile, run } = compileAndRun(`${FIXTURES}/serialize_manual.rgr`);

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("kid=manual");
    expect(run?.output).toContain("serialize-manual-ok");
  });

  it("generates the serializer once when a file is reached by two import spellings", () => {
    const { compile, run } = compileAndRun(
      `${FIXTURES}/serialize_dup_import.rgr`
    );

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(compile.output).not.toContain(
      "method with the same name and parameter signature declared earlier"
    );
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("serialize-dup-import-ok");
  });
});

describe("@serialize(true) across target backends", () => {
  // The generated toDictionary / fromDictionary lean on JSON.rgr operators
  // (getValue, keys) and on the union-narrowing `case` in stdlib.rgr. An
  // operator missing a template for one target makes the annotation fail on
  // that target only, which is invisible to an ES6-only test. Swift 6 was
  // broken this way while ES6 and Kotlin were fine.
  // java7 is left out because it emits one file per class, which the shared
  // compileRanger helper cannot locate -- not a backend limitation.
  // kotlin is left out because a hash field in a @serialize class does not
  // compile there yet: the `keys` operator for JSONDataObject has no kotlin
  // template. Same defect class as the Swift 6 gaps below, still open.
  const targets = ["es6", "swift3", "swift6", "go"];

  for (const target of targets) {
    it(`compiles a serialized class with object arrays for ${target}`, () => {
      const result = compileRanger(
        `${FIXTURES}/serialize_roundtrip.rgr`,
        target
      );
      expect(
        result.success,
        `Compile failed for ${target}: ${result.error || result.output}`
      ).toBe(true);
    });
  }

  it("narrows a JSON union with `case` on every target", () => {
    for (const target of targets) {
      const result = compileRanger(`${FIXTURES}/serialize_union_case.rgr`, target);
      expect(
        result.success,
        `Union case failed for ${target}: ${result.error || result.output}`
      ).toBe(true);
    }
  });
});

describe("@serialize(true) diagnostics for non serializable types", () => {
  // Without the check the generator emits item.toDictionary() anyway and the
  // compile fails inside "extension <Class>" instead of at the declaration.
  const expectDeclarationError = (
    fixture: string,
    expectedMessage: string
  ): void => {
    const result = compileRanger(`${FIXTURES}/${fixture}`, "es6");
    const output = `${result.output}${result.error || ""}`;

    expect(result.success, `Expected ${fixture} to fail to compile`).toBe(
      false
    );
    expect(output).toContain(expectedMessage);
    expect(output).not.toContain("Could not match argument types for push");
    expect(output).not.toContain("Could not match argument types for case");
  };

  it("reports an array element type that is not @serialize(true)", () => {
    expectDeclarationError(
      "serialize_missing_array.rgr",
      "ArrayHolder.kids: [PlainChild] can not be serialized - class PlainChild is not @serialize(true)"
    );
  });

  it("reports a hash value type that is not @serialize(true)", () => {
    expectDeclarationError(
      "serialize_missing_hash.rgr",
      "HashHolder.byName: [string:PlainChild] can not be serialized - class PlainChild is not @serialize(true)"
    );
  });

  it("reports a property type that is not @serialize(true)", () => {
    expectDeclarationError(
      "serialize_missing_field.rgr",
      "FieldHolder.one: PlainChild can not be serialized - class PlainChild is not @serialize(true)"
    );
  });
});
