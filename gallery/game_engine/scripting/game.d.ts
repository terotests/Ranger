// ============================================================================
// TypeScript type definitions for Ranger GAME SCRIPTS
// ============================================================================
//
// Game screens can be authored as TypeScript/TSX and evaluated at runtime by
// the gallery ComponentEngine (see GAME_SCRIPTING.md). The runtime IGNORES type
// annotations, so these declarations exist purely for editor tooling
// (autocomplete + type-checking) while you write `*.game.tsx` scripts.
//
// Reference this file from a script with a triple-slash directive:
//   /// <reference path="./game.d.ts" />
//
// The host injects the `game`, `Buttons` and `screen` globals into the script
// namespace (via ComponentEngine.registerGlobal), so no import is required.
// ============================================================================

/** Abstract controller buttons delivered to the script (device-independent). */
export type GameButton = "up" | "down" | "action" | "quit";

/** Read-only game configuration / host info, injected as the `game` global. */
export interface Game {
  /** Window / screen title. */
  readonly title: string;
  /** Score at which the match ends (0 = unbounded). */
  readonly maxScore: number;
  /** Logical field width in cells. */
  readonly width: number;
  /** Logical field height in cells. */
  readonly height: number;
}

/** Read-only render-surface info, injected as the `screen` global. */
export interface Screen {
  /** Pixel width of the frame buffer. */
  readonly width: number;
  /** Pixel height of the frame buffer. */
  readonly height: number;
}

/**
 * The game state your script owns. Keep it JSON-like (numbers, strings,
 * booleans, arrays, plain objects) so it stays portable and deterministic
 * across every Ranger target. `screen` selects which screen is active.
 */
export interface GameState {
  screen: string;
  score: number;
  [key: string]: unknown;
}

/** Props object passed to every event handler (React-style single argument). */
export interface EventProps {
  /** Current game state. */
  state: GameState;
  /** The button for `onButton` events. */
  button?: GameButton;
  /** Delta-time (ticks) for `update`. */
  dt?: number;
}

/**
 * The event functions a game-screen script may define at the top level. All are
 * optional; the host calls the ones that exist. State transitions are pure:
 * return the NEW state (reducer style) rather than mutating in place.
 */
export interface GameScript {
  /** Return the initial state (called once at start). */
  initState?(): GameState;
  /** Handle a button event; return the next state. */
  onButton?(props: EventProps): GameState;
  /** Per-tick update; return the next state. */
  update?(props: EventProps): GameState;
  /** Render the current state to a UI tree (JSX -> EVG). */
  render?(props: EventProps): JSX.Element;
}

// --- Injected globals (available without importing) -------------------------

declare const game: Game;
declare const screen: Screen;
declare const Buttons: {
  readonly UP: "up";
  readonly DOWN: "down";
  readonly ACTION: "action";
  readonly QUIT: "quit";
};
