import { describe, it, expect } from "vitest";
import { compileAndRun } from "./helpers/compiler";

/**
 * Game scripting layer: the ComponentEngine can have globals injected into its
 * evaluation namespace and can drive a loaded TS game script by calling its
 * event functions. game_script_demo.rgr exercises the full path on Node:
 *   - registerGlobal("game", ...) injects a `game` object,
 *   - the script reads game.title and defines initState()/onButton(),
 *   - callFunction() runs them, and a return inside an if propagates the value.
 */
describe("Game scripting - namespace injection + event dispatch", () => {
  it("injects globals and drives a script reducer", () => {
    const { compile, run } = compileAndRun(
      "gallery/game_engine/scripting/game_script_demo.rgr"
    );

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);

    const out = run?.output || "";
    // injected `game.title` was read by the script
    expect(out).toContain("title=Ranger Pong");
    // initState()
    expect(out).toContain("screen0=menu");
    // onButton({state, button:"action"}) -> return inside if propagates
    expect(out).toContain("screen1=play");
    expect(out).toContain("score1=1");
  });
});
