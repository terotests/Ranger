import { describe, it, expect } from "vitest";
import {
  compileAndRunKotlin,
  compileAndRunSwift,
  compileRanger,
  isKotlinAvailable,
  isSwiftAvailable,
} from "./helpers/compiler";

const FIXTURES = "tests/fixtures";
const OUT_KT = "tests/.output-chain-kt";
const OUT_SWIFT = "tests/.output-chain-swift";

const kotlinAvailable = isKotlinAvailable();
const swiftAvailable = isSwiftAvailable();

type RunCase = {
  fixture: string;
  /** Single-line trimmed stdout */
  output?: string;
  /** Multi-line trimmed stdout */
  lines?: string[];
  /** Substrings that must appear in output */
  contains?: string[];
};

const RUN_CASES: RunCase[] = [
  { fixture: "chain_fluent_builder", output: "6" },
  { fixture: "chain_local_var", output: "30" },
  { fixture: "chain_return_int", output: "6" },
  { fixture: "chain_var_continue", output: "3" },
  {
    fixture: "chain_polymorphic_add",
    lines: ["3", "Hello"],
  },
  {
    fixture: "chain_new_method",
    contains: ["hello", "world"],
  },
];

function assertRunCase(run: { output?: string; error?: string } | undefined, c: RunCase) {
  expect(run?.success, run?.error).toBe(true);
  const text = run?.output?.trim() ?? "";
  if (c.output !== undefined) {
    expect(text).toBe(c.output);
  }
  if (c.lines !== undefined) {
    expect(text.split("\n")).toEqual(c.lines);
  }
  if (c.contains !== undefined) {
    for (const part of c.contains) {
      expect(text).toContain(part);
    }
  }
}

describe("Ranger Compiler - method call chaining (Kotlin)", () => {
  describe.skipIf(!kotlinAvailable)("runtime", () => {
    for (const c of RUN_CASES) {
      it(`runs ${c.fixture}`, () => {
        const { compile, run } = compileAndRunKotlin(
          `${FIXTURES}/${c.fixture}.rgr`
        );
        expect(compile.success, compile.error || compile.output).toBe(true);
        assertRunCase(run, c);
      });
    }

    it("rejects chain_return_type_mismatch at compile time", () => {
      const result = compileRanger(
        `${FIXTURES}/chain_return_type_mismatch.rgr`,
        "kotlin",
        OUT_KT
      );
      expect(result.success, "expected Kotlin compile failure").toBe(false);
      expect(result.output + (result.error || "")).toMatch(
        /invalid return value type/i
      );
    });
  });
});

describe("Ranger Compiler - method call chaining (Swift6)", () => {
  describe.skipIf(!swiftAvailable)("runtime", () => {
    for (const c of RUN_CASES) {
      it(`runs ${c.fixture}`, () => {
        const { compile, run } = compileAndRunSwift(
          `${FIXTURES}/${c.fixture}.rgr`
        );
        expect(compile.success, compile.error || compile.output).toBe(true);
        assertRunCase(run, c);
      });
    }

    it("rejects chain_return_type_mismatch at compile time", () => {
      const result = compileRanger(
        `${FIXTURES}/chain_return_type_mismatch.rgr`,
        "swift6",
        OUT_SWIFT
      );
      expect(result.success, "expected Swift compile failure").toBe(false);
      expect(result.output + (result.error || "")).toMatch(
        /invalid return value type/i
      );
    });
  });
});
