import { describe, it, expect } from "vitest";
import { compileAndRun } from "./helpers/compiler";

describe("Native game script path (TS -> Ranger PoC)", () => {
  it("native Pong matches interpreter ball position after 180 frames", () => {
    const { compile, run } = compileAndRun(
      "gallery/game_engine/scripting/pong_native_runner.rgr"
    );

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);

    const out = run?.output || "";
    expect(out).toContain("ball=212,105");
    expect(out).toContain("score=0,0");
    expect(out).toContain("pong-native-runner done");
  });
});
