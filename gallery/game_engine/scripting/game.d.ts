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
type GameButton = "up" | "down" | "action" | "quit";

/** Read-only game configuration / host info, injected as the `game` global. */
interface Game {
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
interface Screen {
  /** Pixel width of the frame buffer. */
  readonly width: number;
  /** Pixel height of the frame buffer. */
  readonly height: number;
}

/** Retained sprite kinds understood by game_sprite.rgr / GameRunner. */
type SpriteKind = "rect" | "circle" | "wedge" | "ghost" | "bitmap";

/** Static sprite definition returned from sprites(). */
interface SpriteDef {
  id: string;
  kind: SpriteKind;
  w?: number;
  h?: number;
  rad?: number;
  r?: number;
  g?: number;
  b?: number;
  /** wedge/ghost runtime params in defs; bitmap uses frames. */
  p0?: number;
  p1?: number;
  p2?: number;
  /** bitmap: pixel size (default 3). */
  px?: number;
  br?: number;
  bg?: number;
  bb?: number;
  er?: number;
  eg?: number;
  eb?: number;
  /** bitmap: animated frame set — array of row-string arrays. */
  frames?: string[][];
}

/** Per-frame entity pose written by update() into state.entities[id]. */
interface EntityPose {
  x: number;
  y: number;
  visible?: number;
  r?: number;
  g?: number;
  b?: number;
  rad?: number;
  /** bitmap: animation frame (p0). wedge: facing. ghost: dir. */
  p0?: number;
  p1?: number;
  p2?: number;
}

/**
 * The game state your script owns. Keep it JSON-like (numbers, strings,
 * booleans, arrays, plain objects) so it stays portable and deterministic
 * across every Ranger target. `screen` selects which screen is active.
 */
interface GameState {
  screen?: string;
  score?: number;
  /** 0 hides Pong-style centre net (GameRunner). */
  showNet?: number;
  /** Entity poses keyed by sprites()[].id */
  entities?: Record<string, EntityPose>;
  /** Per-screen sub-state when using the multi-screen model. */
  screens?: Record<string, unknown>;
}

/**
 * Multi-screen root state: `screen` selects the active page and each page
 * keeps its own frozen sub-state under `screens[name]`.
 */
interface MultiScreenState<
  TScreen extends string,
  TScreens extends Record<TScreen, unknown>
> {
  screen: TScreen;
  screens: TScreens;
}

/** RGB colour triple used by retained sprites and HUD. */
interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/** Breakout play-screen sub-state (paddle, ball, bricks). */
interface BreakoutPlayScreen {
  layout: "breakout";
  showNet?: number;
  entities: Record<string, EntityPose>;
  px: number;
  py: number;
  bx: number;
  by: number;
  vx: number;
  vy: number;
  alive: number[];
  score: number;
  lives: number;
  score1: number;
  score2: number;
}

/** Breakout game-over screen sub-state. */
interface BreakoutGameOverScreen {
  layout: "breakout";
  score: number;
  won: number;
  lives: number;
}

/** Full Breakout multi-screen state. */
type BreakoutScreens = {
  play: BreakoutPlayScreen;
  gameOver?: BreakoutGameOverScreen;
};

type BreakoutState = {
  screen: "play" | "gameOver";
  screens: BreakoutScreens;
};

/** Screen update helper: receives full state + per-frame props, returns next state. */
type ScreenUpdateFn<TState extends GameState = GameState> = (
  s: TState,
  props: EventProps
) => TState;

/** Props object passed to every event handler (React-style single argument). */
interface EventProps {
  /** Current game state. */
  state: GameState;
  /** Active screen name (multi-screen games). */
  screen?: string;
  /** The button for `onButton` events. */
  button?: GameButton;
  /** Space / ACTION button (restart, confirm, fire). */
  action?: boolean;
  /** Delta-time (ticks) for `update`. */
  dt?: number;
  /** Milliseconds since game start (monotonic wall clock from host). */
  time?: number;
  /** Directional input (GameRunner / SDL host). */
  up?: boolean;
  down?: boolean;
  left?: boolean;
  right?: boolean;
}

/**
 * The event functions a game-screen script may define at the top level. All are
 * optional; the host calls the ones that exist. State transitions are pure:
 * return the NEW state (reducer style) rather than mutating in place.
 */
interface GameScript {
  /** Return the initial state (called once at start). */
  initState?(): GameState;
  /** Handle a button event; return the next state. */
  onButton?(props: EventProps): GameState;
  /** Per-tick update; return the next state. */
  update?(props: EventProps): GameState;
  /** Render the current state to a UI tree (JSX -> EVG). */
  render?(props: EventProps): JSX.Element;
  /** Retained-mode: define sprites once (GameRunner). */
  sprites?(props: { screen: string }): SpriteDef[];
  /** Optional list of named screens (documentation / tooling). */
  screens?(): string[];
  /** Retained-mode: JSX HUD overlay each frame (GameRunner). View background is transparent by default. */
  hud?(props: EventProps): JSX.Element;
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

// Minimal JSX surface for HUD overlays (View / Label used by game_hud.rgr).
declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    View: Record<string, unknown>;
    Label: Record<string, unknown>;
    [elemName: string]: Record<string, unknown>;
  }
}

/** EVG layout primitive (injected by ComponentEngine JSX expansion). */
declare function View(props: Record<string, unknown>): JSX.Element;
/** EVG text primitive. */
declare function Label(props: Record<string, unknown>): JSX.Element;
