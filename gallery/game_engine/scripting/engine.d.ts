// ============================================================================
// Ranger game engine — generic TypeScript types (all games)
// ============================================================================
//
// Reference from game scripts:
//   /// <reference path="./engine.d.ts" />
//
// Or use game.d.ts which includes this file plus small runtime helpers.
// Per-game screen/state types belong in a sibling *.d.ts (see breakout.d.ts).
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

/**
 * Read-only render-surface info, injected as the `screen` global.
 * Not the same as `state.screen` (active screen name in multi-screen games).
 */
interface Framebuffer {
  /** Pixel width of the frame buffer. */
  readonly width: number;
  /** Pixel height of the frame buffer. */
  readonly height: number;
}

/** @deprecated Use `Framebuffer` — kept as alias for the injected `screen` global. */
type Screen = Framebuffer;

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

/** RGB colour triple used by retained sprites and HUD. */
interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Base per-screen sub-state. Extend in your game for each named screen
 * (play, menu, gameOver, …).
 */
interface ScreenState {
  layout?: string;
  entities?: Record<string, EntityPose>;
  showNet?: number;
  score1?: number;
  score2?: number;
}

/**
 * Minimal shared game state. Keep values JSON-like (numbers, strings,
 * booleans, arrays, plain objects) for portability across Ranger targets.
 */
interface GameState {
  score?: number;
  /** 0 hides Pong-style centre net (GameRunner). */
  showNet?: number;
  /** Entity poses keyed by sprites()[].id (single-screen / flat model). */
  entities?: Record<string, EntityPose>;
  /** Active screen name when using the multi-screen model. */
  screen?: string;
  /** Per-screen frozen sub-state (multi-screen model). */
  screens?: object;
  /** Transient per-frame events drained by the host (sounds, spawn, …). */
  events?: GameEvent[];
}

/** Built-in synthetic sound ids (no file resources required). */
type BuiltinSoundId =
  | "blip"
  | "brick"
  | "bounce"
  | "wall"
  | "lose"
  | "win";

/** Transient event emitted from update() and drained by GameHost each frame. */
interface GameEvent {
  kind: string;
  id: string;
  x?: number;
  y?: number;
  amount?: number;
}

/** Convenience type for playSound events using built-in synth ids. */
interface PlaySoundEvent extends GameEvent {
  kind: "playSound";
  id: BuiltinSoundId | string;
}

/**
 * Single-screen retained-mode state (Pong, Invaders, Pac-Man).
 * Entity poses live at the root under `entities`.
 */
interface RetainedGameState extends GameState {
  entities: Record<string, EntityPose>;
  score1?: number;
  score2?: number;
}

/**
 * Multi-screen root state: `screen` selects the active page; each page keeps
 * its own sub-state under `screens[name]`. Use `getScreen(state, name)` for
 * typed access (see game_helpers.tsx).
 */
interface MultiScreenState<
  TActive extends string = string,
  TScreens extends object = Record<string, ScreenState>
> extends GameState {
  screen: TActive;
  screens: TScreens;
}

/** Props object passed to every event handler (React-style single argument). */
interface EventProps {
  /** Current game state. Narrow with a per-game type in your handlers. */
  state: GameState;
  /** Active screen name (multi-screen games). Same as state.screen when set. */
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

/** Event props with a concrete game state type (use in per-game scripts). */
interface TypedEventProps<TState extends GameState = GameState>
  extends Omit<EventProps, "state"> {
  state: TState;
}

/** Screen update helper: receives full state + per-frame props, returns next state. */
type ScreenUpdateFn<TState extends GameState = GameState> = (
  s: TState,
  props: EventProps
) => TState;

/**
 * The event functions a game-screen script may define at the top level. All are
 * optional; the host calls the ones that exist. State transitions are pure:
 * return the NEW state (reducer style) rather than mutating in place.
 */
interface GameScript<TState extends GameState = GameState> {
  /** Return the initial state (called once at start). */
  initState?(): TState;
  /** Handle a button event; return the next state. */
  onButton?(props: TypedEventProps<TState>): TState;
  /** Per-tick update; return the next state. */
  update?(props: TypedEventProps<TState>): TState;
  /** Render the current state to a UI tree (JSX -> EVG). */
  render?(props: TypedEventProps<TState>): JSX.Element;
  /** Retained-mode: define sprites once (GameRunner). */
  sprites?(props: { screen: string }): SpriteDef[];
  /** Optional list of named screens (documentation / tooling). */
  screens?(): string[];
  /** Retained-mode: JSX HUD overlay each frame (GameRunner). */
  hud?(props: TypedEventProps<TState>): JSX.Element;
}

// --- Injected globals (available without importing) -------------------------

declare const game: Game;
/** Framebuffer dimensions — not the active game screen name. */
declare const screen: Framebuffer;
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
