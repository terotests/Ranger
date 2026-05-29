import { describe, it, expect } from "vitest";
import { compileAndRun, compileAndRunKotlin, isKotlinAvailable } from "./helpers/compiler";

const FIXTURE = "tests/fixtures/process_modal_dialog_timer.rgr";

const kotlinAvailable = isKotlinAvailable();

function expectModalTimerOutput(out: string) {
  expect(out).toContain("OK process modal dialog timer");
  expect(out).toContain("START UIPage");
  expect(out).toContain("START ModalDialog");
  expect(out).toContain("START DialogTimer");
  expect(out).toContain("modal: timer done, closing");
  expect(out).toContain("page: all modal cycles complete");
  expect(out).toContain("STOP DialogTimer");
  expect(out).toContain("STOP ModalDialog");
  expect(out).toContain("STOP UIPage");
  const timerStop = out.indexOf("STOP DialogTimer");
  const modalStop = out.indexOf("STOP ModalDialog");
  expect(timerStop).toBeGreaterThan(-1);
  expect(modalStop).toBeGreaterThan(timerStop);
}

describe("Ranger @process — modal dialog timer", () => {
  it("should run modal timer cycles and stop children in order (JS)", () => {
    const { compile, run } = compileAndRun(FIXTURE);

    expect(compile.success, `Compile failed: ${compile.error || compile.output}`).toBe(
      true
    );
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    const out = run?.output ?? "";
    expectModalTimerOutput(out);
    expect(out).toContain("page: opened modal cycle=0");
    expect(out).toContain("page: opened modal cycle=1");
    expect(out).toContain("page: opened modal cycle=2");
    expect(out).toContain("live now  modal=0 timer=0");
  });

  describe.skipIf(!kotlinAvailable)("Kotlin", () => {
    it("compiles and runs modal dialog timer fixture", () => {
      const { compile, run } = compileAndRunKotlin(FIXTURE);
      expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expectModalTimerOutput(run?.output ?? "");
    });
  });
});
