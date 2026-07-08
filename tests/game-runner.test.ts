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

  it("runs the scripted invaders game and scores kills", () => {
    const { compile, run } = compileAndRun(
      "gallery/game_engine/scripting/invaders_runner_demo.rgr"
    );

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);

    const out = run?.output || "";
    expect(out).toContain("frames=600");
    expect(out).toContain("invaders-runner done");

    const score = out.match(/score=(\d+),(\d+)/);
    expect(score, `no score in output: ${out}`).toBeTruthy();
    expect(parseInt(score![1], 10)).toBeGreaterThan(0);

    const entities = out.match(/entities=(\d+)/);
    expect(entities, `no entity count in output: ${out}`).toBeTruthy();
    expect(parseInt(entities![1], 10)).toBe(17);
  });

  it("runs the scripted breakout game with JSX HUD and screen transitions", () => {
    const { compile, run } = compileAndRun(
      "gallery/game_engine/scripting/breakout_runner_demo.rgr"
    );

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);

    const out = run?.output || "";
    expect(out).toContain("frames=900");
    expect(out).toContain("breakout-runner done");
    expect(out).toContain("screen=gameOver");

    const score = out.match(/score=(\d+),(\d+)/);
    expect(score, `no score in output: ${out}`).toBeTruthy();

    const entities = out.match(/entities=(\d+)/);
    expect(entities, `no entity count in output: ${out}`).toBeTruthy();
    expect(parseInt(entities![1], 10)).toBe(52);
  });

  it("runs the scripted pacman game and eats dots", () => {
    const { compile, run } = compileAndRun(
      "gallery/game_engine/scripting/pacman_runner_demo.rgr"
    );

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);

    const out = run?.output || "";
    expect(out).toContain("frames=420");
    expect(out).toContain("pacman-runner done");

    const score = out.match(/score=(\d+),(\d+)/);
    expect(score, `no score in output: ${out}`).toBeTruthy();
    expect(parseInt(score![1], 10)).toBeGreaterThan(0);

    const pac = out.match(/pac=(-?\d+),(-?\d+)/);
    expect(pac, `no pac position in output: ${out}`).toBeTruthy();
    expect(parseInt(pac![1], 10)).toBeGreaterThan(0);
  });
});
