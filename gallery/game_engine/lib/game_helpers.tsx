/// <reference path="../scripting/engine.d.ts" />
//
// Shared runtime helpers for game scripts. Import with a bare module name:
//   import { soundEvent } from "game_helpers";
// or a relative path from the game folder:
//   import { soundEvent } from "../../lib/game_helpers";
//

/** Active screen name (`state.screen`). */
export function activeScreen<TActive extends string>(
  state: { screen: TActive }
): TActive {
  return state.screen;
}

/** Typed access to a named screen's frozen sub-state (`state.screens[name]`). */
export function getScreen<
  TScreens extends object,
  K extends keyof TScreens & string
>(state: { screens: TScreens }, name: K): TScreens[K] {
  return state.screens[name];
}

/** True when `state.screen` equals `name` (narrows in TypeScript). */
export function isActiveScreen<TActive extends string>(
  state: { screen: string },
  name: TActive
): state is { screen: TActive } {
  return state.screen === name;
}

/** Build a playSound event for a built-in synthetic sound id. */
export function soundEvent(id) {
  return { kind: "playSound", id: id };
}

/** Start music from a registered score id (resources kind: music). */
export function musicEvent(id, loop?) {
  const amount = loop === false ? 0 : 1;
  return { kind: "playMusic", id: id, amount: amount };
}

/** Start music from inline soundscore text. */
export function musicScoreEvent(scoreText, loop?) {
  const amount = loop === false ? 0 : 1;
  return { kind: "playMusic", id: "inline", text: scoreText, amount: amount };
}

/** Stop the current soundscore playback. */
export function stopMusicEvent() {
  return { kind: "stopMusic", id: "" };
}

/** Clamp local player slots to the engine maximum (1–8). */
export function clampPlayerSlots(n: number): number {
  if (n < 1) {
    return 1;
  }
  if (n > 8) {
    return 8;
  }
  return n;
}
