/// <reference path="./engine.d.ts" />
//
// Small runtime helpers for multi-screen game scripts.
// Import from game scripts: import { getScreen, activeScreen } from "./game_helpers";
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

/** Built-in particle burst presets (GPU overlay or SoftCanvas circles). */
export function particleEvent(id, x, y, amount?) {
  const n = amount == null ? 0 : amount;
  return { kind: "particles", id: id, x: x, y: y, amount: n };
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
