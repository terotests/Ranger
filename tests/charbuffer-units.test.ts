/**
 * A charbuffer is UTF-8 bytes, on every target.
 *
 * `to_charbuffer` is the explicit conversion: unlike `charAt` on a `string`,
 * the cost is one the program asked for by name, so it is the place where a
 * single portable unit can be promised. It used to be whatever each host's
 * string happened to be made of — UTF-16 units on JavaScript, Kotlin and
 * Dart, code points on Python, bytes everywhere else, and on Scala a
 * `toByte` cast that truncated anything above U+00FF.
 *
 * Unlike tests/string-units.test.ts, which characterises a disagreement,
 * this file asserts an agreement: every target must give the same answer.
 * docs/plans/PLAN_STRING_INDEXING.md §2.3.
 *
 * A target without a toolchain on this machine is skipped rather than
 * guessed at.
 */
import { describe, it, expect } from "vitest";
import {
  compileAndRun,
  compileAndRunPython,
  compileAndRunGo,
  compileAndRunRust,
  compileAndRunKotlin,
  compileAndRunCSharp,
  isPythonAvailable,
  isGoAvailable,
  isRustAvailable,
  isKotlinAvailable,
  isCSharpAvailable,
} from "./helpers/compiler";

const FIXTURE = "tests/fixtures/charbuffer_units.rgr";

/** "a—b" is U+2014 EM DASH: one code point, one UTF-16 unit, three UTF-8 bytes. */
const EXPECTED = {
  len: 5,
  codes: "97 226 128 148 98",
  roundtrip: "yes",
  head: "a",
};

interface Buf {
  len: number;
  codes: string;
  roundtrip: string;
  head: string;
}

function parse(stdout: string): Buf {
  const line = (k: string) => {
    const m = stdout.match(new RegExp(`^${k} (.*)$`, "m"));
    if (!m) throw new Error(`no "${k}" line in:\n${stdout}`);
    return m[1].trim();
  };
  return {
    len: Number(line("len")),
    codes: line("code"),
    roundtrip: line("roundtrip"),
    head: line("head"),
  };
}

type Runner = () => { ok: boolean; stdout: string };

const runners: Record<string, { available: () => boolean; run: Runner }> = {
  javascript: {
    available: () => true,
    run: () => {
      const r = compileAndRun(FIXTURE);
      return { ok: !!r.run?.success, stdout: r.run?.output ?? "" };
    },
  },
  python: {
    available: isPythonAvailable,
    run: () => {
      const r = compileAndRunPython(FIXTURE);
      return { ok: !!r.run?.success, stdout: r.run?.output ?? "" };
    },
  },
  go: {
    available: isGoAvailable,
    run: () => {
      const r = compileAndRunGo(FIXTURE);
      return { ok: !!r.run?.success, stdout: r.run?.output ?? "" };
    },
  },
  rust: {
    available: isRustAvailable,
    run: () => {
      const r = compileAndRunRust(FIXTURE);
      return { ok: !!r.run?.success, stdout: r.run?.output ?? "" };
    },
  },
  kotlin: {
    available: isKotlinAvailable,
    run: () => {
      const r = compileAndRunKotlin(FIXTURE);
      return { ok: !!r.run?.success, stdout: r.run?.output ?? "" };
    },
  },
  csharp: {
    available: isCSharpAvailable,
    run: () => {
      const r = compileAndRunCSharp(FIXTURE);
      return { ok: !!r.run?.success, stdout: r.run?.output ?? "" };
    },
  },
};

const measured = new Map<string, Buf>();
function measure(target: string): Buf | null {
  const t = runners[target];
  if (!t.available()) return null;
  if (!measured.has(target)) {
    const r = t.run();
    expect(r.ok, `${target} did not run:\n${r.stdout}`).toBe(true);
    measured.set(target, parse(r.stdout));
  }
  return measured.get(target)!;
}

describe("a charbuffer is UTF-8 bytes", () => {
  for (const target of Object.keys(runners)) {
    it(`${target} counts bytes`, (ctx) => {
      const b = measure(target);
      if (!b) return ctx.skip();
      expect(b.len).toBe(EXPECTED.len);
      expect(b.codes).toBe(EXPECTED.codes);
      // A scan over the bytes and a decode of them have to agree, or
      // `length` and `to_string` are counting different things.
      expect(b.roundtrip).toBe(EXPECTED.roundtrip);
      // A slice on an ASCII boundary is the ASCII character.
      expect(b.head).toBe(EXPECTED.head);
    });
  }

  it("every target that ran gave the same answer", (ctx) => {
    const seen = Object.keys(runners)
      .map((t) => measure(t))
      .filter((b): b is Buf => b !== null);
    if (seen.length < 2) return ctx.skip();
    expect(new Set(seen.map((b) => b.len)).size).toBe(1);
    expect(new Set(seen.map((b) => b.codes)).size).toBe(1);
  });
});
