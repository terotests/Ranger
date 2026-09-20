/**
 * What does a string index mean on each target?
 *
 * Ranger has one `string` and one `charAt`, and they mean three different
 * things: a UTF-16 code unit, a Unicode code point, or a UTF-8 byte. Every
 * target is internally consistent; the targets disagree with each other.
 * docs/plans/PLAN_STRING_INDEXING.md is the plan for fixing that, and this
 * file is its Stage 0 — the measurement everything later is compared against.
 *
 * These are CHARACTERISATION tests. They assert what each target does today,
 * so that the day a writer changes its unit the diff says exactly which one
 * moved and to what. They are not assertions that the current behaviour is
 * right: the two `it.fails` cases at the bottom state what right would be,
 * and pass only for as long as it is still broken.
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

const FIXTURE = "tests/fixtures/string_units.rgr";

/** One target's answer to the questions the fixture asks. */
interface Units {
  bmpLen: number;
  bmpCodes: string;
  astralLen: number;
  astralCodes: string;
  roundtrip: string;
  /** `to_chars` — the portable view, which must agree everywhere. */
  bmpChars: number;
  bmpCharCodes: string;
  astralChars: number;
  astralCharCodes: string;
}

function parse(stdout: string): Units {
  const line = (k: string) => {
    const m = stdout.match(new RegExp(`^${k} (.*)$`, "m"));
    if (!m) throw new Error(`no "${k}" line in:\n${stdout}`);
    return m[1].trim();
  };
  return {
    bmpLen: Number(line("bmp len")),
    bmpCodes: line("bmp code"),
    astralLen: Number(line("astral len")),
    astralCodes: line("astral code"),
    roundtrip: line("roundtrip"),
    bmpChars: Number(line("bmp chars")),
    bmpCharCodes: line("bmp charcodes"),
    astralChars: Number(line("astral chars")),
    astralCharCodes: line("astral charcodes"),
  };
}

/** The three models, as measured. */
const UTF16 = {
  bmpLen: 3,
  bmpCodes: "97 8212 98",
  astralLen: 4,
  astralCodes: "97 55357 56832 98",
};
const CODEPOINT = {
  bmpLen: 3,
  bmpCodes: "97 8212 98",
  astralLen: 3,
  astralCodes: "97 128512 98",
};
const UTF8_BYTE = {
  bmpLen: 5,
  bmpCodes: "97 226 128 148 98",
  astralLen: 6,
  astralCodes: "97 240 159 152 128 98",
};

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

/** Cached so each target is compiled and run once for the whole file. */
const measured = new Map<string, Units>();
function measure(target: string): Units | null {
  const t = runners[target];
  if (!t.available()) return null;
  if (!measured.has(target)) {
    const r = t.run();
    expect(r.ok, `${target} did not run:\n${r.stdout}`).toBe(true);
    measured.set(target, parse(r.stdout));
  }
  return measured.get(target)!;
}

describe("a string index means one of three things", () => {
  const cases: Array<[string, typeof UTF16]> = [
    ["javascript", UTF16],
    ["kotlin", UTF16],
    ["python", CODEPOINT],
    // Rust and Go used to be code points. PLAN_STRING_INDEXING stage 4 made
    // them the UTF-8 byte their string is actually made of: that is the unit
    // either one indexes in O(1), and it is the unit their own `indexOf`
    // always answered in.
    ["go", UTF8_BYTE],
    ["rust", UTF8_BYTE],
  ];

  for (const [target, model] of cases) {
    const name =
      model === UTF16
        ? "UTF-16 code units"
        : model === UTF8_BYTE
          ? "UTF-8 bytes"
          : "Unicode code points";
    it(`${target} indexes ${name}`, (ctx) => {
      const u = measure(target);
      if (!u) return ctx.skip();
      expect(u.bmpLen).toBe(model.bmpLen);
      expect(u.bmpCodes).toBe(model.bmpCodes);
      expect(u.astralLen).toBe(model.astralLen);
      expect(u.astralCodes).toBe(model.astralCodes);
    });
  }

  // C++ and PHP index UTF-8 bytes too, and have no compileAndRun helper
  // here; the byte model is measured above by Rust and Go and by
  // gallery/friendly.
  it("records the byte model's shape", () => {
    expect(UTF8_BYTE.bmpLen).toBe(5);
    expect(UTF8_BYTE.astralCodes.split(" ").length).toBe(6);
  });

  it("every target is at least self-consistent", (ctx) => {
    // A scan that walks one index at a time and glues the pieces back
    // together has to reproduce the input, or `strlen` and `substring` are
    // counting different things on that target.
    const seen = Object.keys(runners)
      .map((t) => [t, measure(t)] as const)
      .filter(([, u]) => u !== null);
    if (seen.length === 0) return ctx.skip();
    for (const [target, u] of seen) {
      expect(u!.roundtrip, `${target} scan and slice disagree`).toBe("yes");
    }
  });
});

describe("to_chars means one thing everywhere", () => {
  // The point of the operator: `charAt` is the target's own unit and the
  // targets disagree above, while these four numbers are the same on all of
  // them — including above the Basic Multilingual Plane, where the UTF-16
  // targets see an emoji as two units and the UTF-8 ones as four bytes.
  const CHARS = {
    bmpChars: 3,
    bmpCharCodes: "97 8212 98",
    astralChars: 3,
    astralCharCodes: "97 128512 98",
  };

  for (const target of Object.keys(runners)) {
    it(`${target} reads code points`, (ctx) => {
      const u = measure(target);
      if (!u) return ctx.skip();
      expect(u.bmpChars).toBe(CHARS.bmpChars);
      expect(u.bmpCharCodes).toBe(CHARS.bmpCharCodes);
      expect(u.astralChars).toBe(CHARS.astralChars);
      expect(u.astralCharCodes).toBe(CHARS.astralCharCodes);
    });
  }

  it("and every target that ran agrees, where charAt does not", (ctx) => {
    const seen = Object.keys(runners)
      .map((t) => measure(t))
      .filter((u): u is Units => u !== null);
    if (seen.length < 2) return ctx.skip();
    expect(new Set(seen.map((u) => u.astralCharCodes)).size).toBe(1);
    // ...while the raw index still gives three different answers, which is
    // what the `it.fails` below records.
    expect(new Set(seen.map((u) => u.astralLen)).size).toBeGreaterThan(1);
  });
});

describe("what it should mean (still broken)", () => {
  it.fails("every target agrees on how long a string is", (ctx) => {
    const seen = Object.keys(runners)
      .map((t) => measure(t))
      .filter((u): u is Units => u !== null);
    if (seen.length < 2) return ctx.skip();
    const lens = new Set(seen.map((u) => u.astralLen));
    // Today: 4 on the UTF-16 targets, 3 on the code-point ones, 6 on the
    // byte ones. When this test starts failing, the unit has been unified
    // and it should be promoted to a plain `it`.
    expect(lens.size).toBe(1);
  });

  it.fails("charAt returns a number on C#", (ctx) => {
    const u = measure("csharp");
    if (!u) return ctx.skip();
    // `charAt` is declared `:int`, but the C# template yields a `char` and
    // `to_string` binds the char overload, so this prints "a ? b" where
    // every other target prints "97 8212 98". A separate defect from the
    // unit question, found by this fixture.
    expect(u.bmpCodes).toBe("97 8212 98");
  });
});
