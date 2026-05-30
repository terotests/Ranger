import { describe, it, expect } from "vitest";
import {
  compileAndRunKotlin,
  compileAndRunSwift,
  isKotlinAvailable,
  isSwiftAvailable,
} from "./helpers/compiler";

const NESTING = "tests/fixtures/process_nesting.rgr";
const PAGE_LIFECYCLE = "tests/fixtures/process_page_lifecycle.rgr";

const kotlinAvailable = isKotlinAvailable();
const swiftAvailable = isSwiftAvailable();

describe("Ranger @process — Kotlin and Swift", () => {
  describe.skipIf(!kotlinAvailable)("Kotlin", () => {
    it("compiles and runs process_nesting fixture", () => {
      const { compile, run } = compileAndRunKotlin(NESTING);
      expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("OK process nesting");
    });

    it("compiles and runs process_page_lifecycle fixture", () => {
      const { compile, run } = compileAndRunKotlin(PAGE_LIFECYCLE);
      expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("OK process page lifecycle");
      expect(run?.output).toContain("STOP TickChild A");
      expect(run?.output).toContain("STOP TimerProcess A");
      expect(run?.output).toContain("STOP UIPage A");
    });
  });

  describe.skipIf(!swiftAvailable)("Swift6", () => {
    it("compiles and runs process_nesting fixture", () => {
      const { compile, run } = compileAndRunSwift(NESTING);
      expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("OK process nesting");
    });

    it("compiles and runs process_page_lifecycle fixture", () => {
      const { compile, run } = compileAndRunSwift(PAGE_LIFECYCLE);
      expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("OK process page lifecycle");
      expect(run?.output).toContain("STOP TickChild A");
      expect(run?.output).toContain("STOP TimerProcess A");
      expect(run?.output).toContain("STOP UIPage A");
    });
  });
});
