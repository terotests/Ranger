/**
 * EvalValue Unit Tests
 *
 * Tests the EvalValue runtime value system for the component evaluator.
 * Run with: npm run test:evalvalue (from project root)
 */

import { describe, it, expect } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { EvalValue } = require("../bin/eval_value_module.cjs");

describe("EvalValue Constructors", () => {
  it("creates null value", () => {
    const val = EvalValue.null();
    expect(val.isNull()).toBe(true);
    expect(val.isNumber()).toBe(false);
    expect(val.isString()).toBe(false);
  });

  it("creates number value", () => {
    const val = EvalValue.number(42.0);
    expect(val.isNumber()).toBe(true);
    expect(val.numberValue).toBe(42.0);
  });

  it("creates number from int", () => {
    const val = EvalValue.fromInt(100);
    expect(val.isNumber()).toBe(true);
    expect(val.numberValue).toBe(100.0);
  });

  it("creates string value", () => {
    const val = EvalValue.string("hello");
    expect(val.isString()).toBe(true);
    expect(val.stringValue).toBe("hello");
  });

  it("creates boolean true", () => {
    const val = EvalValue.boolean(true);
    expect(val.isBoolean()).toBe(true);
    expect(val.boolValue).toBe(true);
  });

  it("creates boolean false", () => {
    const val = EvalValue.boolean(false);
    expect(val.isBoolean()).toBe(true);
    expect(val.boolValue).toBe(false);
  });
});

describe("EvalValue toString", () => {
  it("null toString returns 'null'", () => {
    const val = EvalValue.null();
    expect(val.toString()).toBe("null");
  });

  it("integer number toString returns without decimals", () => {
    const val = EvalValue.number(42.0);
    expect(val.toString()).toBe("42");
  });

  it("decimal number toString preserves decimals", () => {
    const val = EvalValue.number(3.14);
    expect(val.toString()).toContain("3.14");
  });

  it("string toString returns the string", () => {
    const val = EvalValue.string("hello");
    expect(val.toString()).toBe("hello");
  });

  it("true toString returns 'true'", () => {
    const val = EvalValue.boolean(true);
    expect(val.toString()).toBe("true");
  });

  it("false toString returns 'false'", () => {
    const val = EvalValue.boolean(false);
    expect(val.toString()).toBe("false");
  });
});

describe("EvalValue toBool", () => {
  it("null is falsy", () => {
    const val = EvalValue.null();
    expect(val.toBool()).toBe(false);
  });

  it("zero is falsy", () => {
    const val = EvalValue.number(0.0);
    expect(val.toBool()).toBe(false);
  });

  it("non-zero is truthy", () => {
    const val = EvalValue.number(42.0);
    expect(val.toBool()).toBe(true);
  });

  it("negative number is truthy", () => {
    const val = EvalValue.number(-1.0);
    expect(val.toBool()).toBe(true);
  });

  it("empty string is falsy", () => {
    const val = EvalValue.string("");
    expect(val.toBool()).toBe(false);
  });

  it("non-empty string is truthy", () => {
    const val = EvalValue.string("hello");
    expect(val.toBool()).toBe(true);
  });

  it("true is truthy", () => {
    const val = EvalValue.boolean(true);
    expect(val.toBool()).toBe(true);
  });

  it("false is falsy", () => {
    const val = EvalValue.boolean(false);
    expect(val.toBool()).toBe(false);
  });
});

describe("EvalValue Arrays", () => {
  it("creates array value", () => {
    const items = [
      EvalValue.number(1.0),
      EvalValue.number(2.0),
      EvalValue.number(3.0),
    ];
    const arr = EvalValue.array(items);
    expect(arr.isArray()).toBe(true);
  });

  it("arrays are truthy", () => {
    const arr = EvalValue.array([]);
    expect(arr.toBool()).toBe(true);
  });

  it("getIndex returns correct element", () => {
    const items = [
      EvalValue.number(10.0),
      EvalValue.number(20.0),
      EvalValue.number(30.0),
    ];
    const arr = EvalValue.array(items);
    expect(arr.getIndex(0).numberValue).toBe(10.0);
    expect(arr.getIndex(1).numberValue).toBe(20.0);
    expect(arr.getIndex(2).numberValue).toBe(30.0);
  });

  it("getIndex out of bounds returns null", () => {
    const arr = EvalValue.array([EvalValue.number(1.0)]);
    expect(arr.getIndex(10).isNull()).toBe(true);
    expect(arr.getIndex(-1).isNull()).toBe(true);
  });

  it("getMember length returns array length", () => {
    const items = [
      EvalValue.number(1.0),
      EvalValue.number(2.0),
      EvalValue.number(3.0),
    ];
    const arr = EvalValue.array(items);
    const len = arr.getMember("length");
    expect(len.numberValue).toBe(3.0);
  });

  it("array toString formats correctly", () => {
    const items = [
      EvalValue.number(1.0),
      EvalValue.number(2.0),
      EvalValue.number(3.0),
    ];
    const arr = EvalValue.array(items);
    expect(arr.toString()).toBe("[1, 2, 3]");
  });
});

describe("EvalValue Objects", () => {
  it("creates object value", () => {
    const keys = ["name", "age"];
    const values = [EvalValue.string("Alice"), EvalValue.number(30.0)];
    const obj = EvalValue.object(keys, values);
    expect(obj.isObject()).toBe(true);
  });

  it("objects are truthy", () => {
    const obj = EvalValue.object([], []);
    expect(obj.toBool()).toBe(true);
  });

  it("getMember returns correct value", () => {
    const keys = ["name", "age"];
    const values = [EvalValue.string("Alice"), EvalValue.number(30.0)];
    const obj = EvalValue.object(keys, values);

    expect(obj.getMember("name").stringValue).toBe("Alice");
    expect(obj.getMember("age").numberValue).toBe(30.0);
  });

  it("getMember unknown key returns null", () => {
    const obj = EvalValue.object(["a"], [EvalValue.number(1.0)]);
    expect(obj.getMember("unknown").isNull()).toBe(true);
  });
});

describe("EvalValue String Properties", () => {
  it("getMember length returns string length", () => {
    const str = EvalValue.string("hello");
    expect(str.getMember("length").numberValue).toBe(5.0);
  });

  it("getIndex returns character at index", () => {
    const str = EvalValue.string("hello");
    expect(str.getIndex(0).stringValue).toBe("h");
    expect(str.getIndex(4).stringValue).toBe("o");
  });

  it("getIndex out of bounds returns null", () => {
    const str = EvalValue.string("hi");
    expect(str.getIndex(10).isNull()).toBe(true);
  });
});

describe("EvalValue Equality", () => {
  it("numbers equal", () => {
    const a = EvalValue.number(42.0);
    const b = EvalValue.number(42.0);
    expect(a.equals(b)).toBe(true);
  });

  it("numbers not equal", () => {
    const a = EvalValue.number(42.0);
    const b = EvalValue.number(99.0);
    expect(a.equals(b)).toBe(false);
  });

  it("strings equal", () => {
    const a = EvalValue.string("test");
    const b = EvalValue.string("test");
    expect(a.equals(b)).toBe(true);
  });

  it("strings not equal", () => {
    const a = EvalValue.string("test");
    const b = EvalValue.string("other");
    expect(a.equals(b)).toBe(false);
  });

  it("booleans equal", () => {
    const a = EvalValue.boolean(true);
    const b = EvalValue.boolean(true);
    expect(a.equals(b)).toBe(true);
  });

  it("booleans not equal", () => {
    const a = EvalValue.boolean(true);
    const b = EvalValue.boolean(false);
    expect(a.equals(b)).toBe(false);
  });

  it("null equals null", () => {
    const a = EvalValue.null();
    const b = EvalValue.null();
    expect(a.equals(b)).toBe(true);
  });

  it("different types not equal", () => {
    const num = EvalValue.number(42.0);
    const str = EvalValue.string("42");
    expect(num.equals(str)).toBe(false);
  });
});

describe("EvalValue Type Coercion", () => {
  it("boolean true toNumber returns 1", () => {
    const val = EvalValue.boolean(true);
    expect(val.toNumber()).toBe(1.0);
  });

  it("boolean false toNumber returns 0", () => {
    const val = EvalValue.boolean(false);
    expect(val.toNumber()).toBe(0.0);
  });

  it("null toNumber returns 0", () => {
    const val = EvalValue.null();
    expect(val.toNumber()).toBe(0.0);
  });
});
