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

/** Abstract per-player controller snapshot (keyboard or gamepad). */
interface PlayerButtons {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  action: boolean;
  quit: boolean;
  a: boolean;
  b: boolean;
  x: boolean;
  y: boolean;
  start: boolean;
  select: boolean;
}

/** Multi-player input delivered to update() each frame. */
interface InputState {
  /** Active player slots (length = playerCount). */
  players: PlayerButtons[];
  /** How many local player slots the host mapped this frame (from state.playerSlots). */
  playerCount: number;
  /** Connected SDL GameController count. */
  padCount: number;
  /** 1 when gamepad i is connected (same length as players). */
  connected: number[];
}

/** @deprecated Use PlayerButtons — kept as alias for the injected `Buttons` global. */
type Buttons = PlayerButtons;

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
type SpriteKind = "rect" | "circle" | "wedge" | "ghost" | "bitmap" | "sheet" | "trap";

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
  /** sheet: relative PNG path from game folder. */
  path?: string;
  /** sheet: frame width in pixels (default 64). */
  frameW?: number;
  /** sheet: frame height in pixels (default 64). */
  frameH?: number;
  /** sheet: columns per row (default 9 for LPC walk). */
  cols?: number;
  /** sheet: direction rows (default 4 for LPC walk). */
  rows?: number;
  /** sheet: draw scale percent of frame size (default 50). */
  scale?: number;
  /** sheet: column index used when p2 jump flag is set. */
  jumpFrame?: number;
}

/** Per-frame entity pose written by update() into state.entities[id]. */
interface EntityPose {
  x: number;
  y: number;
  visible?: number;
  active?: number;
  r?: number;
  g?: number;
  b?: number;
  rad?: number;
  /** bitmap: animation frame (p0). wedge: facing. ghost: dir. sheet: frame col. */
  p0?: number;
  /** sheet: direction row (LPC: 0=up 1=left 2=down 3=right). */
  p1?: number;
  /** sheet: non-zero selects jumpFrame column while airborne. */
  p2?: number;
  /** Alias for p0 in world-mode entity definitions. */
  frame?: number;
  /** Visual / physics rotation in degrees (Cannon sandbox, rolling balls). */
  angle?: number;
  /**
   * sheet: live draw scale percent (100 = 1:1). Applied each frame in
   * syncPose → drawSheet; use for pseudo-3D depth without pre-baked sizes.
   */
  scale?: number;
  /**
   * rect/trap: live width/height in pixels. Applied each frame in syncPose so
   * pseudo-3D road bands can grow nearer the camera without gaps.
   */
  w?: number;
  h?: number;
  /**
   * trap: bottom edge width lives in p0, bottom center X in p1.
   * Top edge is (x ± w/2) at y; bottom is (p1 ± p0/2) at y+h
   * (SoftCanvas.fillTrapezoid).
   */
}

/** World-space spawn definition returned from entities(). */
interface EntityDef {
  id: string;
  /** sprites()[].id — defaults to id when omitted. */
  sprite?: string;
  position: { x: number; y: number };
  tags?: string[];
  visible?: number;
  frame?: number;
  /** Cannon bridge spawn (when config().physics.cannon is true). */
  physics?: CannonEntityPhysics;
}

/** Offset sphere collider on a Cannon body (local X/Y from pivot, degrees at runtime). */
interface CannonCollider {
  radius?: number;
  offsetX?: number;
  offsetY?: number;
}

/** Per-entity Cannon body options (declared in entities()). */
interface CannonEntityPhysics {
  radius?: number;
  mass?: number;
  vx?: number;
  vy?: number;
  spin?: number;
  angle?: number;
  restitution?: number;
  /** Static peg / wall (prefer isStatic — avoid `static` key in TSX, parser keyword). */
  isStatic?: boolean;
  /** @deprecated Use isStatic — `static` is a TS keyword and breaks the parser. */
  static?: boolean;
  /** Kinematic body (pivot + angle driven from cannonControl.kinematics). */
  isKinematic?: boolean;
  type?: "dynamic" | "static" | "kinematic";
  /** One or more sphere colliders; default is single sphere at `radius`. */
  colliders?: CannonCollider[];
  /** Points credited when a dynamic body first touches this entity. */
  score?: number;
  /** Keep sprite upright — no physics rotation. */
  stable?: boolean;
  /** Inertia multiplier (>1 = harder to spin). Ignored when stable. */
  inertiaScale?: number;
  /** Visual roll amount 0..1 (0 = upright). Default 1 unless stable. */
  roll?: number;
}

/** Per-frame kinematic pose (entity id → pose). */
interface CannonKinematicPose {
  angle?: number;
  omega?: number;
}

/** Body-body or body-boundary contact (from physics bridge). */
interface CollisionEvent {
  kind: "collision";
  /** Dynamic body id (mover). */
  id: string;
  /** Other entity id (peg, flipper, wall marker, …). */
  target: string;
  impact?: number;
  x?: number;
  y?: number;
  nx?: number;
  ny?: number;
  /** Copied from target entity `physics.score` when set. */
  amount?: number;
}

/** Per-frame physics input: continuous controls + one-shot impulses. */
interface PhysicsStepInput {
  /** Per-body arcade controls (steer −1..1, throttle/brake 0..1). */
  controls?: Record<string, PhysicsControl>;
  /**
   * One-shot velocity deltas applied once per step.
   * linear x/y: px/s added to vx/vy; angular: deg/s added to angularVel.
   */
  impulses?: PhysicsImpulse[];
}

interface PhysicsControl {
  steer?: number;
  throttle?: number;
  brake?: number;
  grip?: number;
}

interface PhysicsImpulse {
  body: string;
  linear?: { x?: number; y?: number };
  angular?: number;
}

/** Neutral contact from physics step (app maps to its own events). */
interface PhysicsContact {
  /** Stable pair id, e.g. "p1|L5280". */
  id?: string;
  /** "begin" on first frame of touch; "persist" while still touching. */
  phase?: "begin" | "persist";
  bodyA: string;
  bodyB: string;
  /** Relative speed along contact normal (approximate impact strength). */
  normalImpulse: number;
  x?: number;
  y?: number;
  /** Normal from bodyA toward bodyB. */
  nx?: number;
  ny?: number;
}

/** Four-wheel vehicle block on a physics body (game_physics). */
interface PhysicsVehicleConfig {
  chassis?: { w?: number; h?: number };
  mass?: number;
  inertia?: number;
  wheelInertia?: number;
  maxSpeed?: number;
  accel?: number;
  brake?: number;
  drag?: number;
  steerRate?: number;
  steerAngle?: number;
  lateralGrip?: number;
  maxLateralForce?: number;
  grip?: number;
  slipThreshold?: number;
  slipSpin?: number;
  angularDamping?: number;
  angularStop?: number;
  restitution?: number;
  spinOnWall?: number;
  wheels?: PhysicsVehicleWheel[];
}

interface PhysicsVehicleWheel {
  offsetX?: number;
  offsetY?: number;
  w?: number;
  h?: number;
  drive?: number;
  grip?: number;
  steer?: boolean;
}

/** Runtime input for game_cannon_physics.rgr (written from update()). */
interface CannonControl {
  /** Per-entity kinematic angle (deg) + angular velocity (rad/s). */
  kinematics?: Record<string, CannonKinematicPose>;
  /** Held launch key (S / Down) — bridge edge-detects internally. */
  launchDown?: boolean;
  /** One-shot from TSX (optional); bridge also uses launchDown edges. */
  launchPulse?: boolean;
  /** @deprecated Use launchDown — kept for older scripts. */
  downHeld?: boolean;
  launchSpeedMin?: number;
  launchSpeedMax?: number;
}

/** Engine-managed camera (world → screen). */
interface CameraConfig {
  follow?: string;
  mode?: "vertical" | "horizontal" | "both" | "none";
  offsetX?: number;
  offsetY?: number;
  /** 0 = snap, 0.12 = smooth follow per frame. */
  smoothing?: number;
  bounds?: { x: number; y: number; w: number; h: number };
}

/** Optional game + physics configuration. */
interface GameConfig {
  width?: number;
  height?: number;
  world?: { width: number; height: number };
  physics?: {
    enabled?: boolean;
    cannon?: boolean;
    gravity?: number;
    gravityY?: number;
    restitution?: number;
    fixedStep?: number;
  };
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
  /**
   * World-space entity poses (world-mode). The engine applies camera offset
   * when rendering. Use with entities() spawn list — no manual placeEntities().
   */
  worldEntities?: Record<string, EntityPose>;
  /** Horizontal scroll offset (written by engine camera when enabled). */
  cameraX?: number;
  /** Active screen name when using the multi-screen model. */
  screen?: string;
  /** Per-screen frozen sub-state (multi-screen model). */
  screens?: object;
  /** Transient per-frame events drained by the host (sounds, spawn, …). */
  events?: GameEvent[];
  /** Cannon contacts since last update(); read in update() then clear. */
  collisionEvents?: CollisionEvent[];
  /** Neutral body-body contacts from game_physics bridge (read in update()). */
  physicsContacts?: PhysicsContact[];
  /** Per-frame physics input written from update(); drained by host each step. */
  physics?: PhysicsStepInput;
  /** Active background: resources() image id or relative PNG/JPEG path. */
  background?: string;
  /** Vertical scroll offset for static level backgrounds (pixels). */
  cameraY?: number;
  /**
   * Local player slots for SDL input mapping (1–8). Default 1 when unset.
   * Set in initState or change from an in-game menu; host reads each frame.
   */
  playerSlots?: number;
  /** Cannon bridge runtime (kinematics, launch — see CannonControl). */
  cannonControl?: CannonControl;
}

/** Built-in synthetic sound ids (no file resources required). */
type BuiltinSoundId =
  | "blip"
  | "brick"
  | "bounce"
  | "wall"
  | "lose"
  | "win"
  | "celebrate";

/** Score instrument voices (see game_soundscore.rgr). */
type ScoreInstrumentId =
  | "piano"
  | "violin"
  | "square"
  | "sine"
  | "triangle"
  | "drums";

/** Particle burst presets understood by game_particles.rgr. */
type ParticlePresetId = "burst" | "sparkle" | "fruit" | "celebrate";

/**
 * Predefined vocal effects (game_vocal_fx.rgr). The first four map to real
 * Voicebox paralinguistic tags ([laugh]/[sigh]/[gasp]/[cough]); the rest are
 * engine-only extensions rendered by the built-in vocal synth. A pre-rendered
 * Voicebox WAV registered as a `voice` resource overrides the synth per id.
 * See https://github.com/jamiepine/voicebox
 */
type VoiceEffectId =
  | "laugh"
  | "giggle"
  | "chuckle"
  | "sigh"
  | "gasp"
  | "cough"
  | "cheer"
  | "boo"
  | "hmm"
  | "huh"
  | "yawn";

/** Transient event emitted from update() and drained by GameHost each frame. */
interface GameEvent {
  kind: string;
  id: string;
  x?: number;
  y?: number;
  amount?: number;
  /** Inline soundscore text for playMusic events. */
  text?: string;
}

/** Engine resource declared once in resources(). */
interface ResourceDef {
  kind: "image" | "sound" | "sprite" | "collision" | "music" | "voice";
  id: string;
  path?: string;
  px?: number;
  frameCount?: number;
  w?: number;
  h?: number;
}

/** Convenience type for playSound events using built-in synth ids. */
interface PlaySoundEvent extends GameEvent {
  kind: "playSound";
  id: BuiltinSoundId | string;
}

/** Play a predefined vocal effect (laugh / sigh / gasp / cough / ...). */
interface PlayVoiceEvent extends GameEvent {
  kind: "playVoice";
  id: VoiceEffectId | string;
}

/** Start multi-voice music from a registered score id or inline text. */
interface PlayMusicEvent extends GameEvent {
  kind: "playMusic";
  id: string;
  text?: string;
  /** 0 = play once, 1 (default) = loop. */
  amount?: number;
}

/** Stop the current soundscore playback. */
interface StopMusicEvent extends GameEvent {
  kind: "stopMusic";
}

/** One-shot particle burst (world x/y; host subtracts cameraY). */
interface ParticleEvent extends GameEvent {
  kind: "particles";
  id: ParticlePresetId | string;
  x: number;
  y: number;
  amount?: number;
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

/** Abstract controller button id for onButton handlers. */
type GameButton = "up" | "down" | "action" | "quit";

/** Props object passed to every event handler (React-style single argument). */
interface EventProps {
  /** Current game state. Narrow with a per-game type in your handlers. */
  state: GameState;
  /** Active screen name (multi-screen games). Same as state.screen when set. */
  screen?: string;
  /** The button for `onButton` events. */
  button?: GameButton;
  /** Multi-player input snapshot (SDL host). */
  input?: InputState;
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
  /** Retained-mode: declare engine resources once (images, sounds, …). */
  resources?(): ResourceDef[];
  /** Retained-mode: select initial background (resources() id or path). */
  backgroundImage?(): string;
  /**
   * Retained-mode: world height in pixels for the static level buffer.
   * Defaults to screen height when omitted.
   */
  staticLevelHeight?(): number;
  /**
   * Retained-mode init hook: draw the level once into an off-screen buffer.
   * Use bgClear / bgFillRect / bgFillCircle (native) plus bgWidth / bgHeight globals.
   * The engine blits the visible slice each frame using state.cameraY.
   */
  createStaticBg?(): void;
  /**
   * Optional fallback when state.playerSlots is unset. Prefer setting
   * playerSlots in initState / update (or an in-game menu).
   */
  playerCount?(props: TypedEventProps<GameState>): number;
  /**
   * World-mode: unified entity spawn list (world coordinates). When present,
   * the engine seeds state.worldEntities and applies camera offset at render.
   * Legacy games keep using sprites() + state.entities (screen space).
   */
  entities?(): EntityDef[];
  /** Engine-managed camera for world-mode games. */
  camera?(): CameraConfig;
  /** Optional physics / world configuration (fixed timestep, bounds). */
  config?(): GameConfig;
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

/** Debug logging in TSX scripts (prints to host stdout as `[tsx] ...`). */
declare const console: {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
};

/** Replace the current game screen (fresh init, clears navigation stack). */
declare function loadGame(screenPath: string): void;
/** Push current screen and open another (returns via popGame). */
declare function pushGame(screenPath: string): void;
/** Pop back to the previous screen, or exit to menu when stack is empty. */
declare function popGame(): void;

/** Load persistent JSON from gamedata.json in the game folder. */
declare function loadGameData(): Record<string, unknown>;
/** Save persistent JSON to gamedata.json in the game folder. */
declare function saveGameData(data: Record<string, unknown>): void;
/** Delete gamedata.json in the game folder. */
declare function resetGameData(): void;

// --- Voicebox vocal effects (native ABI; requires GameVocalFxBridge wired) --
// Alternatively emit { kind: "playVoice", id } from update() — no bridge needed.
/** Play a predefined vocal effect by id (laugh / sigh / gasp / cough / ...). */
declare function voice(id: VoiceEffectId | string): void;
declare function laugh(): void;
declare function giggle(): void;
declare function chuckle(): void;
declare function sigh(): void;
declare function gasp(): void;
declare function cough(): void;
declare function cheer(): void;
declare function boo(): void;
declare function hmm(): void;
declare function huh(): void;
declare function yawn(): void;

/** Static level buffer width (pixels), set during createStaticBg init. */
declare const bgWidth: number;
/** Static level buffer height (pixels), set during createStaticBg init. */
declare const bgHeight: number;

/** Split-screen pane index (-1=full screen, 0=left, 1=right); injected by host. */
declare const paneIndex: number;

/** Host session data — survives hot-reload scene resets within one runner. */
declare const session: {
  musicId: string;
};

/** Opposite pane's car in split-screen mode (updated each frame by the host). */
declare const peerCar: {
  active: number;
  x?: number;
  y?: number;
  steer?: number;
  finishTick?: number;
};

/** Draw an opaque rect into the static level buffer (world coordinates). */
declare function bgFillRect(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  g: number,
  b: number
): void;
/** Fill the static level buffer with a solid colour. */
declare function bgClear(r: number, g: number, b: number): void;
/** Draw a filled circle into the static level buffer. */
declare function bgFillCircle(
  cx: number,
  cy: number,
  rad: number,
  r: number,
  g: number,
  b: number
): void;
