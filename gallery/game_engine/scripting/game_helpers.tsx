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

/** Build a playVoice event for a predefined vocal effect (game_vocal_fx.rgr):
 *  laugh, giggle, chuckle, sigh, gasp, cough, cheer, boo, hmm, huh, yawn. */
export function voiceEvent(id) {
  return { kind: "playVoice", id: id };
}

/** Start music from a registered score id (resources kind: music). */
export function musicEvent(id, loop?) {
  const amount = loop === false ? 0 : 1;
  return { kind: "playMusic", id: id, amount: amount };
}

/** Prepend a global transpose line (semitones; e.g. -2 = two half-steps down). */
export function transposeScore(scoreText, semitones) {
  if (semitones == null || semitones === 0) {
    return scoreText;
  }
  return "transpose " + semitones + "\n" + scoreText;
}

/** Start music from inline soundscore text. Optional `transpose` shifts all pitches. */
export function musicScoreEvent(scoreText, loop?, transpose?) {
  const amount = loop === false ? 0 : 1;
  let text = scoreText;
  if (transpose != null && transpose !== 0) {
    text = transposeScore(scoreText, transpose);
  }
  return { kind: "playMusic", id: "inline", text: text, amount: amount };
}

/** Stop the current soundscore playback. */
export function stopMusicEvent() {
  return { kind: "stopMusic", id: "" };
}

/** Built-in particle burst presets (GPU overlay or SoftCanvas circles). */
export function particleEvent(id, x, y, amount?) {
  const n = amount == null ? 0 : amount;
  return { kind: "particles", id: id, x: x, y: y, amount: n };
}

/** Gamepad rumble. pad: 0..7 or -1 for all; strength 0..65535. */
export function rumbleEvent(pad, low, high, ms) {
  let p = pad;
  if (p == null) {
    p = -1;
  }
  let lo = low;
  if (lo == null) {
    lo = 24000;
  }
  let hi = high;
  if (hi == null) {
    hi = lo;
  }
  let dur = ms;
  if (dur == null) {
    dur = 120;
  }
  return { kind: "rumble", pad: p, low: lo, high: hi, ms: dur };
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
