import { describe, it, expect } from "vitest";
import {
  compileAndRun,
  compileAndRunKotlin,
  compileAndRunSwift,
  isKotlinAvailable,
  isSwiftAvailable,
} from "./helpers/compiler";

const FIXTURE = "tests/fixtures/process_page_lifecycle.rgr";

const kotlinAvailable = isKotlinAvailable();
const swiftAvailable = isSwiftAvailable();

function expectLifecycleOutput(out: string) {
  expect(out).toContain("OK process page lifecycle");
  expect(out).toContain("STOP TickChild A");
  expect(out).toContain("STOP TimerProcess A");
  expect(out).toContain("STOP UIPage A");
  const tickPos = out.indexOf("STOP TickChild A");
  const timerPos = out.indexOf("STOP TimerProcess A");
  const pagePos = out.indexOf("STOP UIPage A");
  expect(tickPos).toBeGreaterThan(-1);
  expect(timerPos).toBeGreaterThan(tickPos);
  expect(pagePos).toBeGreaterThan(timerPos);
}

describe("Ranger @process lifecycle — page switch", () => {
  it("should stop children before page when switching (JS)", () => {
    const { compile, run } = compileAndRun(FIXTURE);

    expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(
      true
    );
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    const out = run?.output ?? "";
    expectLifecycleOutput(out);
    expect(out).toContain("boot page B");
    expect(out).toContain("counts after B");
    expect(out).toContain("UIPage=1");
    expect(out).toContain("counts after screen stop");
    expect(out).toContain("UIPage=0");
  });

  describe.skipIf(!kotlinAvailable)("Kotlin", () => {
    it("compiles and runs page lifecycle fixture", () => {
      const { compile, run } = compileAndRunKotlin(FIXTURE);
      expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expectLifecycleOutput(run?.output ?? "");
    });
  });

  describe.skipIf(!swiftAvailable)("Swift6", () => {
    it("compiles and runs page lifecycle fixture", () => {
      const { compile, run } = compileAndRunSwift(FIXTURE);
      expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expectLifecycleOutput(run?.output ?? "");
    });
  });
});
