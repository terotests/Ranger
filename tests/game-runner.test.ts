import { describe, it, expect } from "vitest";
import { compileAndRun } from "./helpers/compiler";

/**
 * Retained-mode game runner: a TS game script (pong.game.tsx) defines sprites
 * once and returns per-frame state; GameRunner applies the positions to the
 * retained entities and renders them (plus scores as text) into the RGBA
 * SoftCanvas. This drives the scripted Pong for a fixed number of time-based
 * frames on Node and checks the ball actually moved.
 */
describe("Game runner - scripted Pong", () => {
  it("runs the scripted pong game and moves entities over time", () => {
    const { compile, run } = compileAndRun(
      "gallery/game_engine/scripting/pong_runner_demo.rgr"
    );

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);

    const out = run?.output || "";
    expect(out).toContain("frames=180");
    expect(out).toContain("pong-runner done");

    const m = out.match(/ball=(-?\d+),(-?\d+)/);
    expect(m, `no ball position in output: ${out}`).toBeTruthy();
    const bx = parseInt(m![1], 10);
    const by = parseInt(m![2], 10);

    // ball stayed on the 480x270 field and moved from its initial (240,135)
    expect(bx).toBeGreaterThan(0);
    expect(bx).toBeLessThan(480);
    expect(by).toBeGreaterThan(0);
    expect(by).toBeLessThan(270);
    expect(`${bx},${by}`).not.toBe("240,135");
  });
});
