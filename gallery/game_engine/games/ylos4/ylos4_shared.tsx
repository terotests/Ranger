/// <reference path="../../scripting/game.d.ts" />
/// <reference path="../../scripting/game_native_types.ts" />
//
// Ylos 4 — viidakko-platformeri + yhteenlaskupulmat.
// Hyppää oikeaan vastaukseen → timantti ilmestyy (supervoima / kuolemattomuus).
// Jaetut tasot loadGame/pushGame-latauksella. LPC spritesheets.
//
// Split pane: left=P1 girl, right=P2 boy (paneIndex); WASD / arrows + Space + B
// Dual (480px): P1 WASD, P2 arrows + Start to join
//
// Type annotations use the native numeric aliases (i32 / f64, see
// game_native_types.ts) so the TS -> Ranger emitter produces precisely-typed
// structs (and the C++ backend can pick narrow storage where marked).

import { soundEvent, voiceEvent, particleEvent, rumbleEvent, musicScoreEvent, stopMusicEvent } from "../../scripting/game_helpers";

interface LevelColor {
  r: i32;
  g: i32;
  b: i32;
}

interface LevelPlatColors {
  body: LevelColor;
  top: LevelColor;
  bottom: LevelColor;
}

interface LevelPlatformDef {
  x: f64;
  y: f64;
  w: f64;
  h: i32;
}

interface LevelMovingPlatDef {
  x: f64;
  y: f64;
  w: f64;
  h: i32;
  min: f64;
  max: f64;
  dir: i32;
}

interface LevelEnemyDef {
  x: f64;
  y: f64;
  dir: i32;
  min: f64;
  max: f64;
}

interface LevelPickupDef {
  x: f64;
  y: f64;
}

interface LevelDiamondDef {
  x: f64;
  y: f64;
  respawn: boolean;
  // -1 = always visible; >=0 = appears only after that math puzzle is solved.
  puzzle: i32;
}

interface MathAnswerDef {
  x: f64;
  y: f64;
  w: f64;
  h: i32;
  value: i32;
}

interface MathPuzzleDef {
  a: i32;
  b: i32;
  // Prompt paint origin (world coords, BASE_W space for x).
  qx: f64;
  qy: f64;
  answers: MathAnswerDef[];
  correct: i32;
}

interface LevelConfig {
  id: string;
  label: string;
  worldH: i32;
  platColors: LevelPlatColors;
  bgKind: string;
  movingPlatSpeed: f64;
  enemySpeed: f64;
  music: string;
  nextLevel: string;
  isFinal: boolean;
  platforms: LevelPlatformDef[];
  movingPlatforms: LevelMovingPlatDef[];
  enemyDefs: LevelEnemyDef[];
  fruitDefs: LevelPickupDef[];
  diamondDefs: LevelDiamondDef[];
  mathPuzzles: MathPuzzleDef[];
}

let activeLevel: LevelConfig = null;

function copyPlatforms(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const p = src[i];
    out.push({ x: p.x, y: p.y, w: p.w, h: p.h });
    i = i + 1;
  }
  return out;
}

function copyMoving(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const p = src[i];
    out.push({
      x: p.x,
      y: p.y,
      w: p.w,
      h: p.h,
      min: p.min,
      max: p.max,
      dir: p.dir
    });
    i = i + 1;
  }
  return out;
}

function copyEnemies(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const e = src[i];
    out.push({ x: e.x, y: e.y, dir: e.dir, min: e.min, max: e.max });
    i = i + 1;
  }
  return out;
}

function copyPickups(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const p = src[i];
    out.push({ x: p.x, y: p.y });
    i = i + 1;
  }
  return out;
}

function copyDiamonds(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const d = src[i];
    let puzzle: i32 = -1;
    if (d.puzzle != null) {
      puzzle = d.puzzle;
    }
    out.push({ x: d.x, y: d.y, respawn: d.respawn, puzzle: puzzle });
    i = i + 1;
  }
  return out;
}

function copyMathAnswers(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const a = src[i];
    out.push({ x: a.x, y: a.y, w: a.w, h: a.h, value: a.value });
    i = i + 1;
  }
  return out;
}

function nextPuzzleSeed(s: i32) {
  return (s * 75 + 74) % 65537;
}

// Fisher–Yates so the correct value is not always the middle pad.
function shuffleMathAnswers(src, seed: i32) {
  const out = copyMathAnswers(src);
  let s = seed;
  let i = out.length - 1;
  while (i > 0) {
    s = nextPuzzleSeed(s);
    const j = s % (i + 1);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
    i = i - 1;
  }
  return out;
}

function copyMathPuzzles(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const p = src[i];
    const seed = p.a * 31 + p.b * 17 + i * 97 + 11;
    out.push({
      a: p.a,
      b: p.b,
      qx: p.qx,
      qy: p.qy,
      answers: shuffleMathAnswers(p.answers, seed),
      correct: p.correct
    });
    i = i + 1;
  }
  return out;
}

export function setLevelConfig(cfg: LevelConfig) {
  // Copy into a fresh object owned by this module.
  activeLevel = {
    id: cfg.id,
    label: cfg.label,
    worldH: cfg.worldH,
    platColors: {
      body: {
        r: cfg.platColors.body.r,
        g: cfg.platColors.body.g,
        b: cfg.platColors.body.b
      },
      top: {
        r: cfg.platColors.top.r,
        g: cfg.platColors.top.g,
        b: cfg.platColors.top.b
      },
      bottom: {
        r: cfg.platColors.bottom.r,
        g: cfg.platColors.bottom.g,
        b: cfg.platColors.bottom.b
      }
    },
    bgKind: cfg.bgKind,
    movingPlatSpeed: cfg.movingPlatSpeed,
    enemySpeed: cfg.enemySpeed,
    music: cfg.music,
    nextLevel: cfg.nextLevel,
    isFinal: cfg.isFinal,
    platforms: copyPlatforms(cfg.platforms),
    movingPlatforms: copyMoving(cfg.movingPlatforms),
    enemyDefs: copyEnemies(cfg.enemyDefs),
    fruitDefs: copyPickups(cfg.fruitDefs),
    diamondDefs: copyDiamonds(cfg.diamondDefs),
    mathPuzzles: copyMathPuzzles(cfg.mathPuzzles)
  };
}

function cfg(): LevelConfig {
  return activeLevel;
}

// --- Core game structs (annotated so the native emitter unifies their types) ---

interface Player {
  x: f64;
  y: f64;
  vx: f64;
  vy: f64;
  face: i32;
  grounded: i32;
  anim: i32;
  animTick: i32;
  jumpHold: i32;
  airJump: i32;
  jumpBoostMs: i32;
  superMs: i32;
  done: i32;
  finishMs: i32;
  finishPulseMs: i32;
  celebrateBursts: i32;
}

interface Platform {
  x: f64;
  y: f64;
  w: f64;
  h: i32;
}

interface MovingPlatform extends Platform {
  prevX: f64;
  minX: f64;
  maxX: f64;
  dir: i32;
}

interface Enemy {
  x: f64;
  y: f64;
  dir: i32;
  min: f64;
  max: f64;
  alive: i32;
  tick: i32;
  anim: i32;
  row: i32;
}

interface Bullet {
  active: i32;
  x: f64;
  y: f64;
  vx: f64;
  owner: i32;
}

interface Collectible {
  taken: i32;
}

interface MergedPlatform extends Platform {
  vx: f64;
  prevX: f64;
}

interface Color {
  r: i32;
  g: i32;
  b: i32;
}

interface UpdatePlayerResult {
  pl: Player;
  fireCd: f64;
  events: GameEvent[];
}

interface ApplyEnemyHitsResult {
  pl: Player;
  died: i32;
}

interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  action: boolean;
  shoot: boolean;
}

interface GameSnapshot {
  p1: Player;
  p2: Player;
  enemies: Enemy[];
  fruits: Collectible[];
  diamonds: Collectible[];
  bullets: Bullet[];
  movingPlatforms: MovingPlatform[];
  playerSlots?: i32;
}

const BASE_W = 480;
const VIEW_H = 270;
const MAX_ENEMIES = 24;
const MAX_FRUITS = 14;
const MAX_DIAMONDS = 8;
const MAX_PUZZLES = 6;
const MAX_ANSWERS = 3;
const MAX_ANSWER_DIGITS = 2;
const MAX_BULLETS = 4;
const MAX_MOVING_PLATFORMS = 16;
// puzzleSolved: 0 = not yet solved, 1 = correct landed (diamond revealed).
// Answer pads always stay — wrong landings do not remove them (kid-friendly).
const PUZZLE_OPEN = 0;
const PUZZLE_SOLVED = 1;
const PLAT_EDGE_H = 4;
const LEVEL_LOAD_MS = 1800;
const JUMP_MIN_V = 0.28;
const JUMP_MAX_V = 0.38;
const JUMP_SUPER_MAX_V = 0.52;
const JUMP_HOLD_LIFT = 0.00062;
const JUMP_CUT = 0.42;
const JUMP_HOLD_MAX_MS = 400;
const JUMP_HOLD_MAX_SUPER_MS = 700;
const BULLET_SPEED = 0.42;
const SUPER_MS = 8000;
const SUPER_WARN_MS = 2500;
const SUPER_BLINK_MS = 200;
const CELEBRATE_INTERVAL = 520;
const FINISH_PARTICLE_MS = 2000;
const FINISH_CELEBRATE_MS = 3000;
const FINISH_WALK_MS = 4500;
const FINISH_PHASE_DONE = FINISH_CELEBRATE_MS + FINISH_WALK_MS;

const GRAV = 0.00045;
const MOVE = 0.22;
const P1_SHEET = "assets/p1_walk.png";
const P2_SHEET = "assets/p2_walk.png";
const P1_SUPER_SHEET = "assets/p1_super.png";
const P2_SUPER_SHEET = "assets/p2_super.png";
const ENEMY_SHEET = "assets/enemy_walk.png";
const ENEMY_WALK_FRAMES = 9;
// P1 = girl (left), P2 = boy (right), enemies = LPC skeleton.
// Regenerate sprites: npm run engine:ylos4:assets

const P1_START_X = 120;
const P2_START_X = 360;

function platBody(): Color {
  const c = cfg().platColors.body;
  return { r: c.r, g: c.g, b: c.b };
}

function platTop(): Color {
  const c = cfg().platColors.top;
  return { r: c.r, g: c.g, b: c.b };
}

function platBottom(): Color {
  const c = cfg().platColors.bottom;
  return { r: c.r, g: c.g, b: c.b };
}

function levelWorldH(): i32 {
  return cfg().worldH;
}

function levelMovingPlatSpeed(): f64 {
  return cfg().movingPlatSpeed;
}

function levelEnemySpeed(): f64 {
  return cfg().enemySpeed;
}

function goalPlatformDef(): LevelPlatformDef {
  const plats = cfg().platforms;
  return plats[plats.length - 1];
}

const DIAMOND_A = [
  "..XX..",
  ".XXXX.",
  "XXXXXX",
  ".XXXX.",
  "..XX.."
];

function worldW() {
  return bgWidth;
}

function isSplitPane() {
  return paneIndex >= 0;
}

function isDualMode() {
  if (isSplitPane()) {
    return false;
  }
  return worldW() > 300;
}

function playerSlots() {
  if (isDualMode()) {
    return 2;
  }
  return 1;
}

function localPlayerSlot() {
  if (isSplitPane()) {
    if (paneIndex == 1) {
      return 2;
    }
    return 1;
  }
  return 1;
}

function localPlayerEntityId() {
  if (localPlayerSlot() == 2) {
    return "p2";
  }
  return "p1";
}

function localSuperEntityId() {
  if (localPlayerSlot() == 2) {
    return "p2s";
  }
  return "p1s";
}

function localStartX() {
  if (localPlayerSlot() == 2) {
    return P2_START_X;
  }
  return P1_START_X;
}

function localStartFace() {
  if (localPlayerSlot() == 2) {
    return -1;
  }
  return 1;
}

function hiddenEntity() {
  return { x: -40, y: -40, visible: 0, p0: 0, p1: 0, p2: 0 };
}

function scaleX(v: f64): f64 {
  return (v * worldW()) / BASE_W;
}

function scalePlatform(p): Platform {
  return {
    x: scaleX(p.x),
    y: p.y,
    w: scaleX(p.w),
    h: p.h
  };
}

function buildClimbPlatforms(): Platform[] {
  const out = [];
  let i = 0;
  while (i < cfg().platforms.length) {
    out.push(scalePlatform(cfg().platforms[i]));
    i = i + 1;
  }
  return out;
}

// Climb platforms + all answer pads (pads stay even after solve/wrong).
function buildPlatforms(): Platform[] {
  const out = buildClimbPlatforms();
  const puzzles = cfg().mathPuzzles;
  let pi = 0;
  while (pi < puzzles.length) {
    const answers = puzzles[pi].answers;
    let ai = 0;
    while (ai < answers.length) {
      const a = answers[ai];
      out.push(scalePlatform({ x: a.x, y: a.y, w: a.w, h: a.h }));
      ai = ai + 1;
    }
    pi = pi + 1;
  }
  return out;
}

function buildEnemyDefs() {
  const out = [];
  let i = 0;
  while (i < cfg().enemyDefs.length) {
    const d = cfg().enemyDefs[i];
    out.push({
      x: scaleX(d.x),
      y: d.y,
      dir: d.dir,
      min: scaleX(d.min),
      max: scaleX(d.max)
    });
    i = i + 1;
  }
  return out;
}

function buildFruitDefs() {
  const out = [];
  let i = 0;
  while (i < cfg().fruitDefs.length) {
    const d = cfg().fruitDefs[i];
    out.push({ x: scaleX(d.x), y: d.y });
    i = i + 1;
  }
  return out;
}

function buildDiamondDefs() {
  const out = [];
  let i = 0;
  while (i < cfg().diamondDefs.length) {
    const d = cfg().diamondDefs[i];
    let puzzle: i32 = -1;
    if (d.puzzle != null) {
      puzzle = d.puzzle;
    }
    out.push({ x: scaleX(d.x), y: d.y, puzzle: puzzle });
    i = i + 1;
  }
  return out;
}

function digitBits(d: i32) {
  if (d == 0) {
    return "111101101101111";
  }
  if (d == 1) {
    return "010110010010111";
  }
  if (d == 2) {
    return "111001111100111";
  }
  if (d == 3) {
    return "111001111001111";
  }
  if (d == 4) {
    return "101101111001001";
  }
  if (d == 5) {
    return "111100111001111";
  }
  if (d == 6) {
    return "111100111101111";
  }
  if (d == 7) {
    return "111001010010010";
  }
  if (d == 8) {
    return "111101111101111";
  }
  if (d == 9) {
    return "111101111001111";
  }
  return "000000000000000";
}

function bgDrawDigit(x: f64, y: f64, scale: i32, d: i32, r: i32, g: i32, b: i32) {
  const bits = digitBits(d);
  let row = 0;
  while (row < 5) {
    let col = 0;
    while (col < 3) {
      const idx = row * 3 + col;
      const ch = bits.substring(idx, idx + 1);
      if (ch == "1") {
        bgFillRect(x + col * scale, y + row * scale, scale, scale, r, g, b);
      }
      col = col + 1;
    }
    row = row + 1;
  }
}

function numberDigitCount(n: i32) {
  if (n < 10) {
    return 1;
  }
  if (n < 100) {
    return 2;
  }
  return 3;
}

function bgDrawNumber(x: f64, y: f64, scale: i32, n: i32, r: i32, g: i32, b: i32) {
  let v = n;
  if (v < 0) {
    v = 0;
  }
  const count = numberDigitCount(v);
  const step = scale * 3 + scale;
  let place = count - 1;
  while (place >= 0) {
    let div = 1;
    let p = 0;
    while (p < place) {
      div = div * 10;
      p = p + 1;
    }
    const digit = (v / div) | 0;
    const rem = digit % 10;
    bgDrawDigit(x + (count - 1 - place) * step, y, scale, rem, r, g, b);
    place = place - 1;
  }
}

function bgDrawPlus(x: f64, y: f64, scale: i32, r: i32, g: i32, b: i32) {
  const mid = scale * 2;
  bgFillRect(x + scale, y, scale, scale * 5, r, g, b);
  bgFillRect(x, y + mid, scale * 3, scale, r, g, b);
}

function bgDrawEq(x: f64, y: f64, scale: i32, r: i32, g: i32, b: i32) {
  bgFillRect(x, y + scale, scale * 3, scale, r, g, b);
  bgFillRect(x, y + scale * 3, scale * 3, scale, r, g, b);
}

function bgDrawQuestion(x: f64, y: f64, scale: i32, r: i32, g: i32, b: i32) {
  bgFillRect(x + scale, y, scale, scale, r, g, b);
  bgFillRect(x, y, scale, scale * 2, r, g, b);
  bgFillRect(x + scale * 2, y, scale, scale * 2, r, g, b);
  bgFillRect(x + scale * 2, y + scale * 2, scale, scale, r, g, b);
  bgFillRect(x + scale, y + scale * 3, scale, scale, r, g, b);
  bgFillRect(x + scale, y + scale * 4, scale, scale, r, g, b);
}

function paintMathPrompt(p: MathPuzzleDef) {
  const sc = 3;
  const gap = sc + 2;
  let x = scaleX(p.qx);
  const y = p.qy;
  const inkR = 255;
  const inkG = 244;
  const inkB = 140;
  bgDrawNumber(x, y, sc, p.a, inkR, inkG, inkB);
  x = x + numberDigitCount(p.a) * (sc * 3 + sc) + gap;
  bgDrawPlus(x, y, sc, inkR, inkG, inkB);
  x = x + sc * 3 + gap;
  bgDrawNumber(x, y, sc, p.b, inkR, inkG, inkB);
  x = x + numberDigitCount(p.b) * (sc * 3 + sc) + gap;
  bgDrawEq(x, y, sc, inkR, inkG, inkB);
  x = x + sc * 3 + gap;
  bgDrawQuestion(x, y, sc, 255, 200, 90);
}

function paintMathPuzzles() {
  // Only the prompt is baked into the static bg. Answer pads + digits are
  // sprites so they can vanish on a wrong (or correct) landing.
  const puzzles = cfg().mathPuzzles;
  let i = 0;
  while (i < puzzles.length) {
    paintMathPrompt(puzzles[i]);
    i = i + 1;
  }
}

function digitFrame(d: i32) {
  const bits = digitBits(d);
  const rows = [];
  let row = 0;
  while (row < 5) {
    let line = "";
    let col = 0;
    while (col < 3) {
      const idx = row * 3 + col;
      const ch = bits.substring(idx, idx + 1);
      if (ch == "1") {
        line = line + "X";
      } else {
        line = line + ".";
      }
      col = col + 1;
    }
    rows.push(line);
    row = row + 1;
  }
  return rows;
}

function answerDigitSprite(id: string, d: i32) {
  return {
    id: id,
    kind: "bitmap",
    px: 3,
    br: 240,
    bg: 255,
    bb: 250,
    er: 255,
    eg: 255,
    eb: 255,
    frames: [digitFrame(d)]
  };
}

function answerPadSprites(pi: i32, ai: i32, w: f64, h: i32) {
  const bodyH = h - PLAT_EDGE_H * 2;
  const prefix = "ap" + pi + "_" + ai;
  return [
    movingPlatformLayerSprite(prefix + "t", w, PLAT_EDGE_H, platTop().r, platTop().g, platTop().b),
    movingPlatformLayerSprite(prefix + "m", w, bodyH, platBody().r, platBody().g, platBody().b),
    movingPlatformLayerSprite(prefix + "b", w, PLAT_EDGE_H, platBottom().r, platBottom().g, platBottom().b)
  ];
}

function nthDigit(value: i32, placeFromLeft: i32, digitCount: i32) {
  let div = 1;
  let p = 0;
  while (p < digitCount - 1 - placeFromLeft) {
    div = div * 10;
    p = p + 1;
  }
  return ((value / div) | 0) % 10;
}

function inactiveMovingPlatform(): MovingPlatform {
  return {
    x: -40,
    prevX: -40,
    y: -40,
    w: 1,
    h: 1,
    minX: -40,
    maxX: -40,
    dir: 1
  };
}

function makeMovingPlatforms(): MovingPlatform[] {
  const out = [];
  const defs = cfg().movingPlatforms;
  let i = 0;
  while (i < defs.length) {
    const d = defs[i];
    const x = scaleX(d.x);
    out.push({
      x: x,
      prevX: x,
      y: d.y,
      w: scaleX(d.w),
      h: d.h,
      minX: scaleX(d.min),
      maxX: scaleX(d.max),
      dir: d.dir
    });
    i = i + 1;
  }
  while (i < MAX_MOVING_PLATFORMS) {
    out.push(inactiveMovingPlatform());
    i = i + 1;
  }
  return out;
}

function copyMovingPlatformsList(src: MovingPlatform[]): MovingPlatform[] {
  const out = [];
  let i = 0;
  while (i < MAX_MOVING_PLATFORMS) {
    const mp = src[i];
    if (mp) {
      out.push({
        x: mp.x,
        prevX: mp.prevX != null ? mp.prevX : mp.x,
        y: mp.y,
        w: mp.w,
        h: mp.h,
        minX: mp.minX,
        maxX: mp.maxX,
        dir: mp.dir
      });
    } else {
      out.push(inactiveMovingPlatform());
    }
    i = i + 1;
  }
  return out;
}

function copyMovingPlatforms(s: GameSnapshot): MovingPlatform[] {
  const out = [];
  let i = 0;
  while (i < MAX_MOVING_PLATFORMS) {
    if (s.movingPlatforms) {
      if (s.movingPlatforms[i]) {
        const mp = s.movingPlatforms[i];
        out.push({
          x: mp.x,
          prevX: mp.prevX != null ? mp.prevX : mp.x,
          y: mp.y,
          w: mp.w,
          h: mp.h,
          minX: mp.minX,
          maxX: mp.maxX,
          dir: mp.dir
        });
      } else {
        out.push(makeMovingPlatforms()[i]);
      }
    } else {
      out.push(makeMovingPlatforms()[i]);
    }
    i = i + 1;
  }
  return out;
}

function platformsOverlap(a: Platform, b: Platform) {
  if (a.x + a.w <= b.x) {
    return false;
  }
  if (b.x + b.w <= a.x) {
    return false;
  }
  if (a.y + a.h <= b.y) {
    return false;
  }
  if (b.y + b.h <= a.y) {
    return false;
  }
  return true;
}

function movingPlatformBox(x: f64, mp: MovingPlatform): Platform {
  return { x: x, y: mp.y, w: mp.w, h: mp.h };
}

function movingPlatformHitsOthers(mp: MovingPlatform, newX: f64, staticPlats: Platform[], movingPlats: MovingPlatform[], selfIndex: i32) {
  const box = movingPlatformBox(newX, mp);
  let i = 0;
  while (i < staticPlats.length) {
    if (platformsOverlap(box, staticPlats[i])) {
      return true;
    }
    i = i + 1;
  }
  i = 0;
  while (i < movingPlats.length) {
    if (i != selfIndex) {
      const other = movingPlats[i];
      if (other) {
        if (platformsOverlap(box, movingPlatformBox(other.x, other))) {
          return true;
        }
      }
    }
    i = i + 1;
  }
  return false;
}

function updateMovingPlatforms(platforms: MovingPlatform[], dt: f64, staticPlats: Platform[]) {
  let i = 0;
  while (i < platforms.length) {
    const mp = platforms[i];
    if (mp.y < 0) {
      i = i + 1;
      continue;
    }
    const prevX = mp.x;
    let x = mp.x + mp.dir * levelMovingPlatSpeed() * dt;
    let dir = mp.dir;
    if (x < mp.minX) {
      x = mp.minX;
      dir = 1;
    }
    if (x + mp.w > mp.maxX) {
      x = mp.maxX - mp.w;
      dir = -1;
    }
    if (movingPlatformHitsOthers(mp, x, staticPlats, platforms, i)) {
      dir = -dir;
      x = prevX;
    }
    platforms[i] = {
      x: x,
      prevX: prevX,
      y: mp.y,
      w: mp.w,
      h: mp.h,
      minX: mp.minX,
      maxX: mp.maxX,
      dir: dir
    };
    i = i + 1;
  }
  return platforms;
}

function staticPlatformCount(platforms: MergedPlatform[]) {
  let n = 0;
  let i = 0;
  while (i < platforms.length) {
    if (platforms[i].vx == 0) {
      n = n + 1;
    }
    i = i + 1;
  }
  return n;
}

function playerBodyTop(py) {
  return py - 34;
}

function playerOverlapsPlatform(px: f64, py: f64, pw: f64, p: MergedPlatform) {
  if (px + pw <= p.x) {
    return false;
  }
  if (px - pw >= p.x + p.w) {
    return false;
  }
  if (py <= p.y) {
    return false;
  }
  if (playerBodyTop(py) >= p.y + p.h) {
    return false;
  }
  return true;
}

function isStandingOnPlatform(px: f64, py: f64, pw: f64, p: MergedPlatform) {
  if (px + pw <= p.x) {
    return false;
  }
  if (px - pw >= p.x + p.w) {
    return false;
  }
  if (py < p.y - 2) {
    return false;
  }
  if (py > p.y + 6) {
    return false;
  }
  return true;
}

function applyMovingPlatformSidePush(px: f64, py: f64, pw: f64, grounded: i32, platforms: MergedPlatform[], staticCount: i32) {
  let x = px;
  let g = grounded;
  let i = staticCount;
  while (i < platforms.length) {
    const p = platforms[i];
    const dx = p.x - p.prevX;
    if (dx != 0) {
      if (playerOverlapsPlatform(x, py, pw, p)) {
        if (isStandingOnPlatform(x, py, pw, p) == false) {
          x = x + dx;
          g = 0;
        }
      }
    }
    i = i + 1;
  }
  return { x: x, grounded: g };
}

function mergePlatforms(staticPlats: Platform[], movingPlats: MovingPlatform[]): MergedPlatform[] {
  const out = [];
  let i = 0;
  while (i < staticPlats.length) {
    const p = staticPlats[i];
    out.push({ x: p.x, y: p.y, w: p.w, h: p.h, vx: 0, prevX: p.x });
    i = i + 1;
  }
  i = 0;
  while (i < movingPlats.length) {
    const mp = movingPlats[i];
    out.push({
      x: mp.x,
      prevX: mp.prevX,
      y: mp.y,
      w: mp.w,
      h: mp.h,
      vx: mp.dir * levelMovingPlatSpeed()
    });
    i = i + 1;
  }
  return out;
}

function stillOnMovingPlatform(px: f64, py: f64, pw: f64, platforms: MergedPlatform[], staticCount: i32) {
  let i = staticCount;
  while (i < platforms.length) {
    if (isStandingOnPlatform(px, py, pw, platforms[i])) {
      return 1;
    }
    i = i + 1;
  }
  return 0;
}

function jumpMaxV(superMs: i32) {
  if (superMs > 0) {
    return JUMP_SUPER_MAX_V;
  }
  return JUMP_MAX_V;
}

function jumpHoldMaxMs(superMs: i32) {
  if (superMs > 0) {
    return JUMP_HOLD_MAX_SUPER_MS;
  }
  return JUMP_HOLD_MAX_MS;
}

function floorY() {
  return cfg().platforms[0].y;
}

function goalPlatform(): Platform {
  return scalePlatform(goalPlatformDef());
}

function goalFeetY(): f64 {
  const gp = goalPlatform();
  return gp.y;
}

function goalTriggerY(): f64 {
  const gp = goalPlatform();
  return gp.y + 22;
}

function celebrateXFor(slot: i32): f64 {
  const gp = goalPlatform();
  if (slot == 2) {
    return gp.x + gp.w * 0.62;
  }
  return gp.x + gp.w * 0.38;
}

function celebrateYOffset(animTick) {
  const t = animTick / 200;
  return Math.sin(t) * 12 + Math.sin(t * 2.7) * 5;
}

function spawnFinishParticles(events, x, y) {
  events.push(particleEvent("celebrate", x, y - 32, 40));
  events.push(particleEvent("celebrate", x - 22, y - 16, 20));
  events.push(particleEvent("celebrate", x + 22, y - 16, 20));
  events.push(particleEvent("sparkle", x, y - 40, 18));
  events.push(particleEvent("burst", x - 24, y - 20, 12));
  events.push(particleEvent("burst", x + 24, y - 20, 12));
}

function spawnCelebratePulse(events: GameEvent[], pl: Player, burst: i32) {
  const phase = burst % 4;
  const hop = pl.finishMs < FINISH_CELEBRATE_MS ? celebrateYOffset(pl.animTick) : 0;
  const px = pl.x;
  const py = pl.y - hop;
  if (phase == 0) {
    events.push(particleEvent("celebrate", px, py - 30, 22));
    events.push(particleEvent("sparkle", px - 14, py - 18, 10));
    events.push(particleEvent("sparkle", px + 14, py - 18, 10));
  } else if (phase == 1) {
    events.push(particleEvent("burst", px - 18, py - 22, 14));
    events.push(particleEvent("burst", px + 18, py - 22, 14));
  } else if (phase == 2) {
    events.push(particleEvent("celebrate", px - 10, py - 26, 14));
    events.push(particleEvent("celebrate", px + 10, py - 26, 14));
  } else {
    events.push(particleEvent("sparkle", px, py - 34, 16));
    events.push(particleEvent("celebrate", px, py - 8, 12));
  }
}

function makePlayerOnFloor(x: f64, face: i32): Player {
  return {
    x: scaleX(x),
    y: floorY(),
    vx: 0,
    vy: 0,
    face: face,
    grounded: 1,
    anim: 0,
    animTick: 0,
    jumpHold: 0,
    airJump: 0,
    jumpBoostMs: 0,
    superMs: 0,
    done: 0,
    finishMs: 0,
    finishPulseMs: 0,
    celebrateBursts: 0
  };
}

export function levelHeight() {
  return cfg().worldH;
}

function clampByte(v: f64): i32 {
  if (v < 0) {
    return 0;
  }
  if (v > 255) {
    return 255;
  }
  return v;
}

function drawJungleGradient(kind: string) {
  // Wider bands: ~4x fewer interpreter fillRect calls on tall levels (~2k px).
  // Banding is soft enough under canopy/mist overlays not to read as stripes.
  const band = 16;
  let y = 0;
  while (y < bgHeight) {
    const t = y / bgHeight;
    let r = 12 + t * 38;
    let g = 42 + t * 95;
    let b = 36 + t * 48;
    if (kind == "jungle_mist") {
      r = 18 + t * 48;
      g = 58 + t * 100;
      b = 62 + t * 70;
    }
    if (kind == "jungle_temple") {
      r = 36 + t * 70;
      g = 48 + t * 90;
      b = 28 + t * 40;
    }
    let h = band;
    if (y + h > bgHeight) {
      h = bgHeight - y;
    }
    bgFillRect(0, y, bgWidth, h, clampByte(r), clampByte(g), clampByte(b));
    y = y + band;
  }
}

function drawCanopyBand(cy: i32, depth: i32) {
  let x = 0 - (depth % 40);
  while (x < bgWidth + 40) {
    const rad = 22 + (depth % 3) * 6;
    const g = 55 + depth * 8;
    bgFillCircle(x, cy, rad, 18, g, 28);
    bgFillCircle(x + 16, cy + 6, rad - 6, 14, g - 10, 24);
    // Slightly wider stride — fewer circles, still reads as dense canopy.
    x = x + 44 + (depth % 5) * 4;
  }
}

function drawTreeSilhouette(tx: f64, baseY: i32, h: i32, lush: i32) {
  bgFillRect(tx - 5, baseY - h, 10, h, 42, 28, 16);
  bgFillRect(tx - 3, baseY - h, 6, h, 58, 38, 22);
  bgFillCircle(tx, baseY - h - 4, 20 + lush, 28, 96, 40);
  bgFillCircle(tx - 16, baseY - h + 6, 14 + lush, 22, 82, 34);
  bgFillCircle(tx + 16, baseY - h + 6, 14 + lush, 22, 82, 34);
  bgFillCircle(tx - 4, baseY - h - 14, 12, 36, 110, 48);
  bgFillCircle(tx + 8, baseY - h - 10, 10, 30, 100, 44);
}

function drawHangingVine(vx: f64, topY: i32, len: i32) {
  bgFillRect(vx, topY, 3, len, 42, 118, 50);
  bgFillRect(vx + 1, topY + 4, 2, len - 8, 58, 140, 62);
  bgFillCircle(vx + 1, topY + len, 5, 70, 160, 72);
  bgFillCircle(vx - 3, topY + len * 0.45, 4, 62, 148, 68);
  bgFillCircle(vx + 5, topY + len * 0.7, 4, 62, 148, 68);
}

function drawMistBand(cy: i32) {
  bgFillRect(0, cy, bgWidth, 18, 150, 178, 160);
  bgFillRect(0, cy + 10, bgWidth, 22, 132, 162, 148);
  bgFillRect(scaleX(40), cy + 4, scaleX(120), 12, 168, 190, 172);
  bgFillRect(scaleX(280), cy + 14, scaleX(140), 10, 160, 184, 168);
}

function drawBush(bx: f64, by: i32) {
  bgFillCircle(bx, by, 10, 40, 110, 48);
  bgFillCircle(bx - 10, by + 3, 8, 32, 96, 40);
  bgFillCircle(bx + 10, by + 3, 8, 32, 96, 40);
}

function drawTempleTop(flagX: f64) {
  bgFillRect(flagX - 58, 110, 116, 14, 150, 118, 58);
  bgFillRect(flagX - 46, 92, 92, 18, 188, 154, 72);
  bgFillRect(flagX - 30, 72, 60, 20, 210, 178, 88);
  bgFillRect(flagX - 14, 52, 28, 20, 230, 200, 110);
  bgFillRect(flagX - 6, 36, 12, 16, 255, 220, 90);
  bgFillRect(flagX + 10, 40, 4, 28, 200, 160, 70);
  bgFillRect(flagX + 14, 40, 18, 10, 255, 90, 70);
}

function drawDistantTrees(kind: string) {
  let row = 0;
  while (row < 5) {
    const base = 280 + row * 320;
    if (base < bgHeight - 80) {
      drawTreeSilhouette(scaleX(40 + row * 18), base, 90 + row * 8, row % 3);
      drawTreeSilhouette(scaleX(160 + (row % 2) * 30), base - 40, 110, 2);
      drawTreeSilhouette(scaleX(300 - row * 10), base + 20, 95, 1);
      drawTreeSilhouette(scaleX(420), base - 10, 120, 3);
      if (kind != "jungle_temple") {
        drawBush(scaleX(90), base - 8);
        drawBush(scaleX(250), base + 6);
        drawBush(scaleX(380), base - 4);
      }
    }
    row = row + 1;
  }
}

function createStaticBgForLevel() {
  // Answer pads are dynamic sprites — only climb platforms go into the static bg.
  const platforms = buildClimbPlatforms();
  const kind = cfg().bgKind;
  drawJungleGradient(kind);

  drawCanopyBand(36, 0);
  drawCanopyBand(70, 1);
  drawCanopyBand(108, 2);
  drawDistantTrees(kind);

  if (kind == "jungle_floor") {
    drawHangingVine(scaleX(90), 90, 140);
    drawHangingVine(scaleX(190), 70, 110);
    drawHangingVine(scaleX(310), 100, 160);
    drawHangingVine(scaleX(400), 80, 120);
  }
  if (kind == "jungle_mist") {
    drawMistBand(420);
    drawMistBand(820);
    drawMistBand(1220);
    drawMistBand(1620);
    drawHangingVine(scaleX(70), 50, 170);
    drawHangingVine(scaleX(240), 90, 140);
    drawHangingVine(scaleX(390), 60, 180);
  }
  if (kind == "jungle_temple") {
    drawMistBand(560);
    drawMistBand(1100);
    drawMistBand(1680);
    drawTempleTop(scaleX(240));
    drawHangingVine(scaleX(100), 120, 90);
    drawHangingVine(scaleX(360), 130, 100);
  }

  // Ground trees near the start floor so the opening shot feels lush.
  drawTreeSilhouette(scaleX(55), bgHeight - 20, 160, 3);
  drawTreeSilhouette(scaleX(150), bgHeight - 20, 130, 2);
  drawTreeSilhouette(scaleX(330), bgHeight - 20, 150, 3);
  drawTreeSilhouette(scaleX(430), bgHeight - 20, 140, 1);
  drawBush(scaleX(100), bgHeight - 28);
  drawBush(scaleX(280), bgHeight - 24);
  drawBush(scaleX(400), bgHeight - 30);

  let i = 0;
  while (i < platforms.length) {
    const p = platforms[i];
    bgFillRect(p.x, p.y, p.w, p.h, platBody().r, platBody().g, platBody().b);
    bgFillRect(p.x, p.y, p.w, PLAT_EDGE_H, platTop().r, platTop().g, platTop().b);
    bgFillRect(
      p.x,
      p.y + p.h - PLAT_EDGE_H,
      p.w,
      PLAT_EDGE_H,
      platBottom().r,
      platBottom().g,
      platBottom().b
    );
    // Moss highlight so platforms read clearly on the jungle bg.
    if (p.w > 8) {
      bgFillRect(p.x + 2, p.y + 1, p.w - 4, 2, 160, 220, 90);
    }
    i = i + 1;
  }
  paintMathPuzzles();
}

export function paintLevelBg() {
  createStaticBgForLevel();
}

function movingPlatformLayerSprite(id: string, w: f64, h: f64, r: i32, g: i32, b: i32) {
  let rw: i32 = w | 0;
  if (rw < 12) {
    rw = 12;
  }
  let rh: i32 = h | 0;
  if (rh < 1) {
    rh = 1;
  }
  return {
    id: id,
    kind: "rect",
    w: rw,
    h: rh,
    r: r,
    g: g,
    b: b
  };
}

function movingPlatformSprites(mpi, w, h) {
  const bodyH = h - PLAT_EDGE_H * 2;
  return [
    movingPlatformLayerSprite("mp" + mpi + "t", w, PLAT_EDGE_H, platTop().r, platTop().g, platTop().b),
    movingPlatformLayerSprite("mp" + mpi + "m", w, bodyH, platBody().r, platBody().g, platBody().b),
    movingPlatformLayerSprite("mp" + mpi + "b", w, PLAT_EDGE_H, platBottom().r, platBottom().g, platBottom().b)
  ];
}

function placeMovingPlatformEntities(entities, mpi: i32, mp: MovingPlatform, cam: f64) {
  const cx = mp.x + mp.w / 2;
  const screenY = mp.y - cam;
  const midH = mp.h - PLAT_EDGE_H * 2;
  entities["mp" + mpi + "t"] = {
    x: cx,
    y: screenY + PLAT_EDGE_H / 2.0,
    visible: 1,
    r: platTop().r,
    g: platTop().g,
    b: platTop().b
  };
  entities["mp" + mpi + "m"] = {
    x: cx,
    y: screenY + PLAT_EDGE_H + midH / 2.0,
    visible: 1,
    r: platBody().r,
    g: platBody().g,
    b: platBody().b
  };
  entities["mp" + mpi + "b"] = {
    x: cx,
    y: screenY + mp.h - PLAT_EDGE_H / 2.0,
    visible: 1,
    r: platBottom().r,
    g: platBottom().g,
    b: platBottom().b
  };
}

function hideMovingPlatformEntities(entities, mpi) {
  entities["mp" + mpi + "t"] = hiddenEntity();
  entities["mp" + mpi + "m"] = hiddenEntity();
  entities["mp" + mpi + "b"] = hiddenEntity();
}

function hideAnswerPadEntities(entities, pi: i32, ai: i32) {
  const prefix = "ap" + pi + "_" + ai;
  entities[prefix + "t"] = hiddenEntity();
  entities[prefix + "m"] = hiddenEntity();
  entities[prefix + "b"] = hiddenEntity();
  let di = 0;
  while (di < MAX_ANSWER_DIGITS) {
    entities["ad" + pi + "_" + ai + "_" + di] = hiddenEntity();
    di = di + 1;
  }
}

function placeAnswerPadEntities(entities, pi: i32, ai: i32, ans: MathAnswerDef, cam: f64) {
  const plat = scalePlatform({ x: ans.x, y: ans.y, w: ans.w, h: ans.h });
  const cx = plat.x + plat.w / 2;
  const screenY = plat.y - cam;
  const midH = plat.h - PLAT_EDGE_H * 2;
  const prefix = "ap" + pi + "_" + ai;
  entities[prefix + "t"] = {
    x: cx,
    y: screenY + PLAT_EDGE_H / 2.0,
    visible: 1,
    r: platTop().r,
    g: platTop().g,
    b: platTop().b
  };
  entities[prefix + "m"] = {
    x: cx,
    y: screenY + PLAT_EDGE_H + midH / 2.0,
    visible: 1,
    r: platBody().r,
    g: platBody().g,
    b: platBody().b
  };
  entities[prefix + "b"] = {
    x: cx,
    y: screenY + plat.h - PLAT_EDGE_H / 2.0,
    visible: 1,
    r: platBottom().r,
    g: platBottom().g,
    b: platBottom().b
  };
  const sc = 3;
  const step = sc * 3 + sc;
  const count = numberDigitCount(ans.value);
  const numW = count * step - sc;
  const baseX = cx - numW * 0.5 + (sc * 3) * 0.5;
  const digitY = plat.y - 14 - cam;
  let di = 0;
  while (di < MAX_ANSWER_DIGITS) {
    const id = "ad" + pi + "_" + ai + "_" + di;
    if (di < count) {
      entities[id] = {
        x: baseX + di * step,
        y: digitY,
        visible: 1,
        p0: 0
      };
    } else {
      entities[id] = hiddenEntity();
    }
    di = di + 1;
  }
}

function playerSheetSprite(id, path) {
  return {
    id: id,
    kind: "sheet",
    path: path,
    frameW: 64,
    frameH: 64,
    cols: 9,
    rows: 4,
    scale: 72,
    feetTrim: 10,
    jumpFrame: 3
  };
}

function superSheetSprite(id, path) {
  return {
    id: id,
    kind: "sheet",
    path: path,
    frameW: 64,
    frameH: 64,
    cols: 9,
    rows: 4,
    scale: 72,
    feetTrim: 10,
    jumpFrame: 3
  };
}

function rumbleForOwner(owner: i32, ms: i32, strength: i32) {
  let pad = 0;
  if (owner == 2) {
    pad = 1;
  }
  let v = 24000;
  if (strength != null) {
    v = strength;
  }
  let dur = 120;
  if (ms != null) {
    dur = ms;
  }
  return rumbleEvent(pad, v, v, dur);
}

function enemySprite(id) {
  return {
    id: id,
    kind: "sheet",
    path: ENEMY_SHEET,
    frameW: 64,
    frameH: 64,
    cols: 9,
    rows: 4,
    scale: 60,
    feetTrim: 10,
    jumpFrame: 0
  };
}

function diamondSprite(id) {
  return {
    id: id,
    kind: "bitmap",
    px: 3,
    br: 120,
    bg: 240,
    bb: 255,
    er: 255,
    eg: 255,
    eb: 255,
    frames: [DIAMOND_A]
  };
}

export function buildSprites() {
  const list = [];
  let e = 0;
  while (e < MAX_ENEMIES) {
    list.push(enemySprite("e" + e));
    e = e + 1;
  }
  let f = 0;
  while (f < MAX_FRUITS) {
    list.push({ id: "f" + f, kind: "circle", rad: 6, r: 255, g: 170, b: 40 });
    f = f + 1;
  }
  let d = 0;
  while (d < MAX_DIAMONDS) {
    list.push(diamondSprite("d" + d));
    d = d + 1;
  }
  let b = 0;
  while (b < MAX_BULLETS) {
    list.push({ id: "b" + b, kind: "rect", w: 6, h: 4, r: 255, g: 240, b: 120 });
    b = b + 1;
  }
  const movingDefs = cfg().movingPlatforms;
  let mpi = 0;
  while (mpi < movingDefs.length) {
    const def = movingDefs[mpi];
    const layers = movingPlatformSprites(mpi, scaleX(def.w), def.h);
    list.push(layers[0]);
    list.push(layers[1]);
    list.push(layers[2]);
    mpi = mpi + 1;
  }
  // Answer pads + digits (hidden when puzzle solved/failed).
  const puzzles = cfg().mathPuzzles;
  let pi = 0;
  while (pi < MAX_PUZZLES) {
    let ai = 0;
    while (ai < MAX_ANSWERS) {
      let aw: f64 = 100;
      let ah: i32 = 14;
      let av: i32 = 0;
      if (pi < puzzles.length) {
        if (ai < puzzles[pi].answers.length) {
          const ans = puzzles[pi].answers[ai];
          aw = scaleX(ans.w);
          ah = ans.h;
          av = ans.value;
        }
      }
      const layers = answerPadSprites(pi, ai, aw, ah);
      list.push(layers[0]);
      list.push(layers[1]);
      list.push(layers[2]);
      let di = 0;
      while (di < MAX_ANSWER_DIGITS) {
        const count = numberDigitCount(av);
        let dig: i32 = 0;
        if (di < count) {
          dig = nthDigit(av, di, count);
        }
        list.push(answerDigitSprite("ad" + pi + "_" + ai + "_" + di, dig));
        di = di + 1;
      }
      ai = ai + 1;
    }
    pi = pi + 1;
  }
  // Draw players last so they appear above enemies / pickups.
  list.push(playerSheetSprite("p1", P1_SHEET));
  list.push(playerSheetSprite("p2", P2_SHEET));
  list.push(superSheetSprite("p1s", P1_SUPER_SHEET));
  list.push(superSheetSprite("p2s", P2_SUPER_SHEET));
  return list;
}

function makeEnemies(): Enemy[] {
  const defs = buildEnemyDefs();
  const out = [];
  let i = 0;
  while (i < MAX_ENEMIES) {
    const d = defs[i];
    if (d) {
      out.push({
        x: d.x,
        y: d.y,
        dir: d.dir,
        min: d.min,
        max: d.max,
        alive: 1,
        tick: 0,
        anim: 0,
        row: d.dir > 0 ? 3 : 1
      });
    } else {
      out.push({
        x: -40,
        y: -40,
        dir: 1,
        min: 0,
        max: 0,
        alive: 0,
        tick: 0,
        anim: 0,
        row: 3
      });
    }
    i = i + 1;
  }
  return out;
}

function makeFruits(): Collectible[] {
  const out = [];
  let i = 0;
  while (i < MAX_FRUITS) {
    out.push({ taken: 0 });
    i = i + 1;
  }
  return out;
}

function makeDiamonds(): Collectible[] {
  const out = [];
  let i = 0;
  while (i < MAX_DIAMONDS) {
    const def = cfg().diamondDefs[i];
    let taken: i32 = 1;
    if (def) {
      let puzzle: i32 = -1;
      if (def.puzzle != null) {
        puzzle = def.puzzle;
      }
      // Free diamonds start visible; puzzle rewards stay hidden until solved.
      if (puzzle < 0) {
        taken = 0;
      } else {
        taken = 1;
      }
    }
    out.push({ taken: taken });
    i = i + 1;
  }
  return out;
}

function makePuzzleSolved(): i32[] {
  const out = [];
  let i = 0;
  while (i < MAX_PUZZLES) {
    out.push(0);
    i = i + 1;
  }
  return out;
}

function standingOnAnswer(pl: Player, pw: f64, ans: MathAnswerDef) {
  if (pl.grounded == 0) {
    return false;
  }
  if (pl.done == 1) {
    return false;
  }
  const plat = scalePlatform({ x: ans.x, y: ans.y, w: ans.w, h: ans.h });
  return isStandingOnPlatform(pl.x, pl.y, pw, {
    x: plat.x,
    y: plat.y,
    w: plat.w,
    h: plat.h,
    vx: 0,
    prevX: plat.x
  });
}

function revealPuzzleDiamonds(diamonds: Collectible[], puzzleIndex: i32, events: GameEvent[]) {
  const defs = cfg().diamondDefs;
  const out = [];
  let i = 0;
  while (i < MAX_DIAMONDS) {
    let taken = diamonds[i].taken;
    const def = defs[i];
    if (def) {
      let puzzle: i32 = -1;
      if (def.puzzle != null) {
        puzzle = def.puzzle;
      }
      if (puzzle == puzzleIndex) {
        if (taken == 1) {
          taken = 0;
          const dx = scaleX(def.x);
          const dy = def.y;
          events.push(particleEvent("sparkle", dx, dy, 36));
          events.push(particleEvent("celebrate", dx, dy - 12, 24));
          events.push(particleEvent("burst", dx - 10, dy, 14));
          events.push(particleEvent("burst", dx + 10, dy, 14));
        }
      }
    }
    out.push({ taken: taken });
    i = i + 1;
  }
  return out;
}

function copyPuzzleSolved(prev: i32[]) {
  const out = [];
  let i = 0;
  while (i < MAX_PUZZLES) {
    let v = 0;
    if (prev) {
      if (prev[i] != null) {
        v = prev[i];
      }
    }
    out.push(v);
    i = i + 1;
  }
  return out;
}

function markPuzzleStatus(prev: i32[], index: i32, status: i32) {
  const out = [];
  let i = 0;
  while (i < MAX_PUZZLES) {
    if (i == index) {
      out.push(status);
    } else {
      let v = PUZZLE_OPEN;
      if (prev) {
        if (prev[i] != null) {
          v = prev[i];
        }
      }
      out.push(v);
    }
    i = i + 1;
  }
  return out;
}

function tickMathPuzzles(
  p1: Player,
  p2: Player,
  dual: boolean,
  puzzleSolved: i32[],
  diamonds: Collectible[],
  events: GameEvent[]
) {
  const puzzles = cfg().mathPuzzles;
  const pw = 10;
  let status = copyPuzzleSolved(puzzleSolved);
  let outDiamonds = diamonds;
  let pi = 0;
  while (pi < puzzles.length) {
    if (pi < MAX_PUZZLES) {
      if (status[pi] == PUZZLE_OPEN) {
        const puzzle = puzzles[pi];
        let ai = 0;
        while (ai < puzzle.answers.length) {
          const ans = puzzle.answers[ai];
          let hit = standingOnAnswer(p1, pw, ans);
          if (dual) {
            if (standingOnAnswer(p2, pw, ans)) {
              hit = true;
            }
          }
          if (hit) {
            if (ans.value == puzzle.correct) {
              // Pads stay put; only mark solved so the diamond appears once.
              status = markPuzzleStatus(status, pi, PUZZLE_SOLVED);
              const midX = scaleX(ans.x + ans.w * 0.5);
              events.push(soundEvent("win"));
              events.push(particleEvent("celebrate", midX, ans.y - 8, 40));
              events.push(particleEvent("sparkle", midX, ans.y - 20, 22));
              events.push(particleEvent("burst", midX - 16, ans.y - 10, 16));
              events.push(particleEvent("burst", midX + 16, ans.y - 10, 16));
              outDiamonds = revealPuzzleDiamonds(outDiamonds, pi, events);
            }
            // Wrong pad: keep trying — no penalty, pads remain.
          }
          ai = ai + 1;
        }
      }
    }
    pi = pi + 1;
  }
  return { puzzleSolved: status, diamonds: outDiamonds };
}

function respawnMarkedDiamonds(prev: Collectible[]): Collectible[] {
  const out = [];
  let i = 0;
  while (i < MAX_DIAMONDS) {
    const def = cfg().diamondDefs[i];
    let taken = 0;
    if (prev) {
      const item = prev[i];
      if (item) {
        taken = item.taken;
      }
    }
    if (def) {
      if (def.respawn && taken == 1) {
        taken = 0;
      }
    } else {
      taken = 1;
    }
    out.push({ taken: taken });
    i = i + 1;
  }
  return out;
}

function makeRestartDiamonds(prev: Collectible[]): Collectible[] {
  return respawnMarkedDiamonds(prev);
}

function makeBullets(): Bullet[] {
  const out = [];
  let i = 0;
  while (i < MAX_BULLETS) {
    out.push({ active: 0, x: 0, y: 0, vx: 0, owner: 0 });
    i = i + 1;
  }
  return out;
}

function tryStartSummitMusic(summitMusicStarted, events) {
  if (summitMusicStarted == 1) {
    return 1;
  }
  events.push(musicScoreEvent(cfg().music, false));
  return 1;
}

function readSavedScore(data, key, fallback) {
  const v = data[key];
  if (v == null) {
    return fallback;
  }
  return v;
}

export function makeInitState() {
  const data = loadGameData();
  const savedScore1 = readSavedScore(data, "score1", 0);
  const savedScore2 = readSavedScore(data, "score2", 0);
  const slots = playerSlots();
  const cameraY = levelWorldH() - VIEW_H;
  const p1 = makePlayerOnFloor(localStartX(), localStartFace());
  const p2 = makePlayerOnFloor(P2_START_X, -1);
  const enemies = makeEnemies();
  const fruits = makeFruits();
  const diamonds = makeDiamonds();
  const puzzleSolved = makePuzzleSolved();
  const bullets = makeBullets();
  const movingPlatforms = makeMovingPlatforms();
  const entities = placeEntities(
    {
      p1: p1,
      p2: p2,
      enemies: enemies,
      fruits: fruits,
      diamonds: diamonds,
      bullets: bullets,
      movingPlatforms: movingPlatforms
    },
    cameraY,
    slots,
    puzzleSolved
  );
  return {
    // ---- Platform keys: the Ranger engine reads these out of the returned
    //      state. (Full list: gallery/game_engine/README.md.)
    entities: entities,   // { id: { x, y } } -> positions the retained sprites()
    cameraY: cameraY,     // scrolls the createStaticBg() background
    score1: savedScore1,
    score2: savedScore2,
    playerSlots: slots,   // player count (dual / split-screen)
    showNet: 0,           // center divider (0 = off)
    // ---- Internal keys: this game's own working memory. The engine stores the
    //      state object unchanged and hands it back to the next update(), but
    //      never reads or interprets these — they exist only for our own logic.
    p1: p1,
    p2: p2,
    enemies: enemies,
    fruits: fruits,
    diamonds: diamonds,
    puzzleSolved: puzzleSolved,
    bullets: bullets,
    movingPlatforms: movingPlatforms,
    fireCd1: 0,
    fireCd2: 0,
    summitMusicStarted: 0,
    levelLoadQueued: 0,
    celebrateMs: -1
  };
}

function readPlayer(props, index: i32): PlayerInput {
  const input = props.input;
  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let action = false;
  let wantShoot = false;
  if (index == 0) {
    up = props.up;
    left = props.left;
    right = props.right;
    action = props.action;
  }
  if (input) {
    if (input.players[index]) {
      const p = input.players[index];
      up = p.up;
      down = p.down;
      left = p.left;
      right = p.right;
      action = p.action;
      if (p.b) {
        wantShoot = true;
      }
      if (p.x) {
        wantShoot = true;
      }
    }
  }
  return { up: up, down: down, left: left, right: right, action: action, shoot: wantShoot };
}

function clampX(x) {
  if (x < 14) {
    return 14;
  }
  if (x > worldW() - 14) {
    return worldW() - 14;
  }
  return x;
}

function landOnPlatforms(pl: Player, pw: f64, dt: f64, platforms: MergedPlatform[], staticCount: i32) {
  let grounded = 0;
  let ny = pl.y;
  let nvy = pl.vy;
  let carryVx: f64 = 0;
  if (pl.vy >= 0) {
    let i = 0;
    while (i < platforms.length) {
      const p = platforms[i];
      const moving = i >= staticCount;
      if (pl.x + pw > p.x) {
        if (pl.x - pw < p.x + p.w) {
          const feet = pl.y;
          const prevFeet = feet - pl.vy * dt;
          if (feet >= p.y) {
            if (prevFeet <= p.y + 4) {
              if (moving) {
                if (isStandingOnPlatform(pl.x, pl.y, pw, p) == false) {
                  i = i + 1;
                  continue;
                }
              }
              if (grounded == 0 || p.y < ny) {
                ny = p.y;
                nvy = 0;
                grounded = 1;
                carryVx = p.vx;
              }
            }
          }
        }
      }
      i = i + 1;
    }
  }
  return { y: ny, vy: nvy, grounded: grounded, carryVx: carryVx };
}

function enemyCollisionKind(px, py, pvy, ex, ey) {
  const dx = px - ex;
  const dy = py - ey;
  if (dx < -18) {
    return "none";
  }
  if (dx > 18) {
    return "none";
  }
  if (dy < -16) {
    return "none";
  }
  if (dy > 16) {
    return "none";
  }
  if (pvy > 0) {
    if (py < ey + 16) {
      return "stomp";
    }
  }
  return "hurt";
}

function stompBounce(pl: Player, ey: f64): Player {
  return {
    x: pl.x,
    y: ey - 2,
    vx: pl.vx,
    vy: 0 - JUMP_MAX_V * 0.55,
    face: pl.face,
    grounded: 0,
    anim: 1,
    animTick: pl.animTick,
    jumpHold: pl.jumpHold,
    airJump: 1,
    jumpBoostMs: 0,
    superMs: pl.superMs,
    done: pl.done,
    finishMs: pl.finishMs,
    finishPulseMs: pl.finishPulseMs,
    celebrateBursts: pl.celebrateBursts
  };
}

function applyEnemyHits(pl: Player, owner: i32, enemies: Enemy[], events: GameEvent[]): ApplyEnemyHitsResult {
  let out = pl;
  let died = 0;
  let ei = 0;
  while (ei < MAX_ENEMIES) {
    const e = enemies[ei];
    if (e.alive == 1) {
      const kind = enemyCollisionKind(out.x, out.y, out.vy, e.x, e.y);
      if (kind == "stomp") {
        enemies[ei].alive = 0;
        out = stompBounce(out, e.y);
        events.push(soundEvent("brick"));
        events.push(soundEvent("bounce"));
        events.push(voiceEvent("chuckle"));
        events.push(rumbleForOwner(owner, 90, 18000));
      } else {
        if (kind == "hurt") {
          if (out.superMs > 0) {
            enemies[ei].alive = 0;
            events.push(soundEvent("brick"));
            events.push(particleEvent("sparkle", e.x, e.y, 10));
            events.push(rumbleForOwner(owner, 60, 12000));
          } else {
            out = respawnPlayer(owner);
            died = 1;
            events.push(soundEvent("lose"));
            events.push(voiceEvent("gasp"));
            events.push(rumbleForOwner(owner, 280, 40000));
          }
        }
      }
    }
    ei = ei + 1;
  }
  return { pl: out, died: died };
}

function hitPickup(px, py, fx, fy) {
  const dx = px - fx;
  const dy = py - fy;
  if (dx * dx + dy * dy > 18 * 18) {
    return false;
  }
  return true;
}

function spawnBullet(bullets: Bullet[], x: f64, y: f64, face: i32, owner: i32) {
  let i = 0;
  while (i < MAX_BULLETS) {
    if (bullets[i].active == 0) {
      bullets[i] = {
        active: 1,
        x: x,
        y: y,
        vx: (face | 0) * BULLET_SPEED,
        owner: owner
      };
      return true;
    }
    i = i + 1;
  }
  return false;
}

function sheetFrameForPlayer(pl: Player, moving: i32) {
  let frame = 0;
  if (pl.grounded == 1) {
    if (moving != 0) {
      frame = Math.floor(pl.animTick / 70) % 9;
    }
  } else {
    frame = 3;
  }
  let row = 2;
  if (pl.face > 0) {
    row = 3;
  } else {
    if (pl.face < 0) {
      row = 1;
    }
  }
  const jump = pl.grounded == 1 ? 0 : 1;
  return { p0: frame, p1: row, p2: jump };
}

function updatePlayer(pl: Player, inp: PlayerInput, dt: f64, bullets: Bullet[], owner: i32, fireCd: f64, platforms: MergedPlatform[]): UpdatePlayerResult {
  const events = [];
  let face = pl.face;
  let vx: f64 = 0;
  if (inp.left) {
    vx = 0 - MOVE;
    face = -1;
  }
  if (inp.right) {
    vx = MOVE;
    face = 1;
  }
  let superMs: f64 = pl.superMs;
  if (superMs > 0) {
    superMs = superMs - dt;
    if (superMs < 0) {
      superMs = 0;
    }
  }
  const plSuper: i32 = superMs | 0;
  let vy = pl.vy + GRAV * dt;
  let airJump = pl.airJump;
  let jumpBoostMs: f64 = pl.jumpBoostMs;
  if (pl.grounded == 1) {
    airJump = 0;
    jumpBoostMs = 0;
  }

  const wantJump = inp.up || inp.action;
  let jumped = 0;
  if (pl.grounded == 1) {
    if (wantJump) {
      if (pl.jumpHold == 0) {
        vy = 0 - JUMP_MIN_V;
        airJump = 1;
        jumpBoostMs = 0;
        jumped = 1;
        events.push(soundEvent("bounce"));
      }
    }
  } else if (airJump == 1) {
    if (vy < 0) {
      const maxV = jumpMaxV(plSuper);
      const holdMax = jumpHoldMaxMs(plSuper);
      if (wantJump) {
        if (jumpBoostMs < holdMax) {
          vy = vy - JUMP_HOLD_LIFT * dt;
          jumpBoostMs = jumpBoostMs + dt;
          if (vy < 0 - maxV) {
            vy = 0 - maxV;
          }
        }
      } else if (pl.jumpHold == 1) {
        if (jumpBoostMs > 0) {
          vy = vy * JUMP_CUT;
          jumpBoostMs = 0;
        }
      }
    }
  }

  const pw = 8;
  const staticCount = staticPlatformCount(platforms);
  let x = pl.x + vx * dt;
  const side = applyMovingPlatformSidePush(x, pl.y, pw, pl.grounded, platforms, staticCount);
  x = side.x;
  const knockedOff = pl.grounded == 1 && side.grounded == 0 ? 1 : 0;
  x = clampX(x);

  const fallVy = vy;
  let y = pl.y + vy * dt;
  const land = landOnPlatforms({ x: x, y: y, vy: vy }, pw, dt, platforms, staticCount);
  y = land.y;
  vy = land.vy;
  let grounded = land.grounded;
  if (knockedOff == 1) {
    grounded = 0;
  }
  let anim = grounded != 0 ? 0 : 1;
  if (grounded != 0) {
    airJump = 0;
    jumpBoostMs = 0;
    if (land.carryVx != 0) {
      x = x + land.carryVx * dt;
      if (stillOnMovingPlatform(x, y, pw, platforms, staticCount) == 0) {
        grounded = 0;
        anim = 1;
      }
    }
    x = clampX(x);
    if (pl.grounded == 0) {
      if (fallVy > 0.12) {
        events.push(soundEvent("wall"));
      }
    }
  }

  let jumpHold = wantJump ? 1 : 0;

  let animTick = pl.animTick + dt;
  if (vx == 0) {
    animTick = pl.animTick;
  }

  let cd = fireCd;
  if (cd > 0) {
    cd = cd - dt;
  }
  if (inp.shoot) {
    if (cd <= 0) {
      if (spawnBullet(bullets, x + face * 10, y - 4, face, owner)) {
        cd = 220;
        events.push(soundEvent("blip"));
      }
    }
  }

  return {
    pl: {
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      face: face,
      grounded: grounded,
      anim: anim,
      animTick: animTick | 0,
      jumpHold: jumpHold,
      airJump: airJump,
      jumpBoostMs: jumpBoostMs | 0,
      superMs: superMs | 0,
      done: pl.done,
      finishMs: pl.finishMs,
      finishPulseMs: pl.finishPulseMs,
      celebrateBursts: pl.celebrateBursts
    },
    fireCd: cd,
    events: events
  };
}

function updateEnemies(enemies: Enemy[], dt: f64) {
  let i = 0;
  while (i < MAX_ENEMIES) {
    const e = enemies[i];
    if (e.alive == 1) {
      let x = e.x + e.dir * dt * levelEnemySpeed();
      let dir = e.dir;
      if (x < e.min) {
        x = e.min;
        dir = 1;
      }
      if (x > e.max) {
        x = e.max;
        dir = -1;
      }
      let tick = e.tick + dt;
      let anim = Math.floor(tick / 110) % ENEMY_WALK_FRAMES;
      let row = 3;
      if (dir < 0) {
        row = 1;
      }
      enemies[i] = {
        x: x,
        y: e.y,
        dir: dir,
        min: e.min,
        max: e.max,
        alive: 1,
        tick: tick,
        anim: anim,
        row: row
      };
    }
    i = i + 1;
  }
}

function bulletHitsEnemy(bx, by, ex, ey) {
  const dx = bx - ex;
  const dy = by - ey;
  if (dx < -16) {
    return false;
  }
  if (dx > 16) {
    return false;
  }
  if (dy < -14) {
    return false;
  }
  if (dy > 14) {
    return false;
  }
  return true;
}

function updateBullets(bullets: Bullet[], enemies: Enemy[], dt: f64) {
  const events = [];
  let i = 0;
  while (i < MAX_BULLETS) {
    const b = bullets[i];
    if (b.active == 1) {
      let x = b.x + b.vx * dt;
      let y = b.y;
      let active = 1;
      if (x < 0) {
        active = 0;
      }
      if (x > worldW()) {
        active = 0;
      }
      let e = 0;
      while (e < MAX_ENEMIES) {
        if (enemies[e].alive == 1) {
          if (bulletHitsEnemy(x, y, enemies[e].x, enemies[e].y)) {
            enemies[e].alive = 0;
            active = 0;
            events.push(soundEvent("brick"));
            events.push(rumbleForOwner(b.owner, 70, 14000));
          }
        }
        e = e + 1;
      }
      bullets[i] = { active: active, x: x, y: y, vx: b.vx, owner: b.owner };
    }
    i = i + 1;
  }
  return events;
}

function respawnPlayer(which: i32) {
  if (isSplitPane()) {
    return makePlayerOnFloor(localStartX(), localStartFace());
  }
  if (which == 1) {
    return makePlayerOnFloor(P1_START_X, 1);
  }
  return makePlayerOnFloor(P2_START_X, -1);
}

function computeCamera(p1: Player, p2: Player, dual: boolean): f64 {
  let lead: f64 = levelWorldH();
  if (p1.done == 0) {
    if (p1.y < lead) {
      lead = p1.y;
    }
  }
  if (dual) {
    if (p2.done == 0) {
      if (p2.y < lead) {
        lead = p2.y;
      }
    }
  }
  if (lead >= levelWorldH()) {
    lead = goalFeetY();
  }
  let cam = lead - 120;
  if (cam < 0) {
    cam = 0;
  }
  const maxCam = levelWorldH() - VIEW_H;
  if (cam > maxCam) {
    cam = maxCam;
  }
  return cam;
}

function showSuperSprite(pl: Player) {
  if (pl.superMs <= 0) {
    return false;
  }
  if (pl.superMs > SUPER_WARN_MS) {
    return true;
  }
  const phase = (pl.superMs / SUPER_BLINK_MS) | 0;
  if (phase % 2 == 1) {
    return true;
  }
  return false;
}

function placePlayerEntity(entities, id, superId, pl: Player, cam, moving) {
  const sheet = sheetFrameForPlayer(pl, moving);
  const superOn = showSuperSprite(pl) ? 1 : 0;
  if (superOn == 1) {
    entities[id] = { x: -40, y: -40, visible: 0, p0: 0, p1: 0, p2: 0 };
    entities[superId] = {
      x: pl.x,
      y: pl.y - cam,
      p0: sheet.p0,
      p1: sheet.p1,
      p2: sheet.p2,
      visible: 1
    };
  } else {
    entities[superId] = { x: -40, y: -40, visible: 0, p0: 0, p1: 0, p2: 0 };
    entities[id] = {
      x: pl.x,
      y: pl.y - cam,
      p0: sheet.p0,
      p1: sheet.p1,
      p2: sheet.p2,
      visible: 1
    };
  }
}

function placeEntities(s: GameSnapshot, cam: f64, slots: i32, puzzleStatus: i32[]) {
  const fruitDefs = buildFruitDefs();
  const diamondDefs = buildDiamondDefs();
  const entities = {};
  const p1Moving = finishPlayerMoving(s.p1) == 1 ? 1 : (s.p1.vx != 0 ? 1 : 0);
  if (slots == 2) {
    placePlayerEntity(entities, "p1", "p1s", s.p1, cam, p1Moving);
    const p2Moving = finishPlayerMoving(s.p2) == 1 ? 1 : (s.p2.vx != 0 ? 1 : 0);
    placePlayerEntity(entities, "p2", "p2s", s.p2, cam, p2Moving);
  } else if (isSplitPane()) {
    entities.p1 = hiddenEntity();
    entities.p2 = hiddenEntity();
    entities.p1s = hiddenEntity();
    entities.p2s = hiddenEntity();
    placePlayerEntity(
      entities,
      localPlayerEntityId(),
      localSuperEntityId(),
      s.p1,
      cam,
      p1Moving
    );
  } else {
    placePlayerEntity(entities, "p1", "p1s", s.p1, cam, p1Moving);
    entities.p2 = hiddenEntity();
    entities.p2s = hiddenEntity();
  }
  let e = 0;
  while (e < MAX_ENEMIES) {
    const en = s.enemies[e];
    if (en.alive == 1) {
      entities["e" + e] = {
        x: en.x,
        y: en.y - cam,
        p0: en.anim,
        p1: en.row,
        visible: 1
      };
    } else {
      entities["e" + e] = { x: -40, y: -40, visible: 0, p0: 0 };
    }
    e = e + 1;
  }
  let f = 0;
  while (f < MAX_FRUITS) {
    const fd = fruitDefs[f];
    if (s.fruits[f].taken == 0 && fd) {
      entities["f" + f] = { x: fd.x, y: fd.y - cam, visible: 1 };
    } else {
      entities["f" + f] = { x: -40, y: -40, visible: 0 };
    }
    f = f + 1;
  }
  let d = 0;
  while (d < MAX_DIAMONDS) {
    const dd = diamondDefs[d];
    if (s.diamonds[d].taken == 0 && dd) {
      entities["d" + d] = { x: dd.x, y: dd.y - cam, visible: 1, p0: 0 };
    } else {
      entities["d" + d] = { x: -40, y: -40, visible: 0, p0: 0 };
    }
    d = d + 1;
  }
  let b = 0;
  while (b < MAX_BULLETS) {
    const bl = s.bullets[b];
    if (bl.active == 1) {
      entities["b" + b] = { x: bl.x, y: bl.y - cam, visible: 1 };
    } else {
      entities["b" + b] = { x: -40, y: -40, visible: 0 };
    }
    b = b + 1;
  }
  let mpi = 0;
  while (mpi < MAX_MOVING_PLATFORMS) {
    const mp = s.movingPlatforms[mpi];
    if (mp.y < 0) {
      hideMovingPlatformEntities(entities, mpi);
    } else {
      placeMovingPlatformEntities(entities, mpi, mp, cam);
    }
    mpi = mpi + 1;
  }
  const puzzles = cfg().mathPuzzles;
  let pi = 0;
  while (pi < MAX_PUZZLES) {
    let ai = 0;
    while (ai < MAX_ANSWERS) {
      if (pi < puzzles.length) {
        if (ai < puzzles[pi].answers.length) {
          placeAnswerPadEntities(entities, pi, ai, puzzles[pi].answers[ai], cam);
        } else {
          hideAnswerPadEntities(entities, pi, ai);
        }
      } else {
        hideAnswerPadEntities(entities, pi, ai);
      }
      ai = ai + 1;
    }
    pi = pi + 1;
  }
  return entities;
}

function pushEvents(dest: GameEvent[], src: GameEvent[]) {
  let i = 0;
  while (i < src.length) {
    dest.push(src[i]);
    i = i + 1;
  }
}

function tickGoalWalk(pl: Player, dt: f64) {
  const gp = goalPlatform();
  const minX = gp.x + 18;
  const maxX = gp.x + gp.w - 18;
  let x = pl.x;
  let face = pl.face;
  if (face == 0) {
    face = 1;
  }
  const speed = MOVE * 0.9;
  x = x + (face | 0) * speed * dt;
  if (x < minX) {
    x = minX;
    face = 1;
  }
  if (x > maxX) {
    x = maxX;
    face = -1;
  }
  return { x: x, face: face };
}

function finishPlayerMoving(pl: Player) {
  if (pl.done == 0) {
    return 0;
  }
  if (pl.finishMs < FINISH_PHASE_DONE) {
    return 1;
  }
  return 0;
}

function playerVictoryReady(pl: Player) {
  return pl.done == 1 && pl.finishMs >= FINISH_PHASE_DONE;
}

// Level is cleared as soon as the required player(s) touch the goal — do not
// wait for the long finish walk (FINISH_PHASE_DONE). Invaders uses the same
// "clear → short celebrate → pushGame" pattern.
function levelCleared(slots: i32, p1: Player, p2: Player) {
  if (slots == 1) {
    return p1.done == 1;
  }
  if (p1.done == 0) {
    return false;
  }
  if (p2.done == 0) {
    return false;
  }
  return true;
}

function showVictoryBanner(s: GameSnapshot) {
  if (s.playerSlots == 1) {
    return playerVictoryReady(s.p1);
  }
  if (s.p1.done == 0 || s.p2.done == 0) {
    return false;
  }
  return playerVictoryReady(s.p1) && playerVictoryReady(s.p2);
}

function wantsRestart(props, dual: boolean) {
  const inp0 = readPlayer(props, 0);
  if (inp0.action || inp0.shoot) {
    return true;
  }
  if (dual) {
    const inp1 = readPlayer(props, 1);
    if (inp1.action || inp1.shoot) {
      return true;
    }
  }
  return false;
}

function checkFinish(pl: Player, slot: i32, events: GameEvent[]) {
  if (pl.done == 1) {
    return pl;
  }
  if (pl.y <= goalTriggerY()) {
    const feetY = goalFeetY();
    const cx = celebrateXFor(slot);
    const next: Player = {
      x: cx,
      y: feetY,
      vx: 0,
      vy: 0,
      face: slot == 2 ? -1 : 1,
      grounded: 1,
      anim: 0,
      animTick: pl.animTick,
      jumpHold: 0,
      airJump: 0,
      jumpBoostMs: 0,
      superMs: pl.superMs,
      done: 1,
      finishMs: 0,
      finishPulseMs: 0,
      celebrateBursts: 0
    };
    events.push(soundEvent("celebrate"));
    events.push(rumbleForOwner(slot, 220, 32000));
    spawnFinishParticles(events, cx, feetY);
    return next;
  }
  return pl;
}

function tickFinishPlayer(pl: Player, dt: f64, events: GameEvent[]): Player {
  if (pl.done != 1) {
    return pl;
  }
  const finishMs = pl.finishMs + dt;
  let finishPulseMs: f64 = pl.finishPulseMs;
  let bursts = pl.celebrateBursts;

  if (finishMs <= FINISH_PARTICLE_MS) {
    finishPulseMs = finishPulseMs + dt;
    if (finishPulseMs >= CELEBRATE_INTERVAL) {
      finishPulseMs = 0;
      bursts = bursts + 1;
      spawnCelebratePulse(events, pl, bursts);
    }
  } else {
    finishPulseMs = 0;
  }

  const feetY = goalFeetY();
  let x = pl.x;
  let face = pl.face;
  let y = feetY;
  const animTick = pl.animTick + dt;

  if (finishMs < FINISH_CELEBRATE_MS) {
    y = feetY - celebrateYOffset(animTick);
  } else if (finishMs < FINISH_PHASE_DONE) {
    const walk = tickGoalWalk(pl, dt);
    x = walk.x;
    face = walk.face;
    y = feetY;
  }

  return {
    x: x,
    y: y,
    vx: 0,
    vy: 0,
    face: face,
    grounded: 1,
    anim: 0,
    animTick: animTick,
    jumpHold: 0,
    airJump: 0,
    jumpBoostMs: 0,
    superMs: pl.superMs,
    done: 1,
    finishMs: finishMs,
    finishPulseMs: finishPulseMs,
    celebrateBursts: bursts
  };
}

export function playHud(props) {
  const s = props.state;
  const slots = playerSlots();
  const cleared = levelCleared(slots, s.p1, s.p2);
  const victory = showVictoryBanner(s);
  const localSlot = localPlayerSlot();
  let msg = "Ylos 4 — Laske ja hyppää oikeaan vastaukseen!";
  if (cleared == 0) {
    if (isSplitPane()) {
      if (paneIndex == 0) {
        msg = "Vasen — tyttö (P1). Pääse maaliin!";
      } else {
        msg = "Oikea — poika (P2). Pääse maaliin!";
      }
    } else if (slots == 2) {
      msg = msg + " Ensimmäinen maaliin juhlii — toinen jatkaa!";
    } else {
      msg = cfg().label + " — oikea vastaus → timantti!";
    }
    if (s.p1.done == 1) {
      if (isSplitPane()) {
        msg = localSlot == 2 ? "P2 MAALISSA!" : "P1 MAALISSA!";
      } else {
        msg = "P1 MAALISSA!";
      }
    }
    if (slots == 2) {
      if (s.p2.done == 1) {
        if (s.p1.done == 1) {
          msg = "MOLEMMAT MAALISSA!";
        } else {
          msg = "P2 MAALISSA!";
        }
      }
    }
  }
  let scoreLine = "Hedelmät: " + s.score1;
  if (slots == 2) {
    scoreLine = "Hedelmät P1:" + s.score1 + "  P2:" + s.score2;
  }
  let superLine = "";
  if (s.p1.superMs > 0) {
    if (isSplitPane()) {
      superLine = localSlot == 2 ? "P2 SUPER!" : "P1 SUPER!";
    } else {
      superLine = "P1 SUPER!";
    }
  }
  if (slots == 2) {
    if (s.p2.superMs > 0) {
      if (superLine.length > 0) {
        superLine = superLine + "  ";
      }
      superLine = superLine + "P2 SUPER!";
    }
  }
  let victoryLine = "";
  if (cleared == 1) {
    if (cfg().nextLevel == "") {
      victoryLine = "Viidakko valloittettu!";
      if (victory == 1) {
        msg = "Paina Space — pelaa uudelleen";
      } else {
        msg = "Juhli huipulla…";
      }
    } else {
      victoryLine = "Taso selvitetty!";
      msg = "Seuraava taso latautuu…";
    }
  }
  return (
    <View flexDirection="column" padding="4px" background="#0b1020cc">
      <Label text={victoryLine} color="#ffe866" fontSize="18px" />
      <Label text={msg} color="#e8f0ff" fontSize="11px" />
      <Label text={scoreLine} color="#ffd080" fontSize="10px" />
      <Label text={superLine} color="#80e8ff" fontSize="10px" />
    </View>
  );
}

export function runUpdate(props) {
  const s = props.state;
  const dt = props.dt;
  const slots = playerSlots();
  const events = [];
  let puzzleStatus = s.puzzleSolved;
  if (puzzleStatus == null) {
    puzzleStatus = makePuzzleSolved();
  }
  const staticPlatforms = buildPlatforms();
  const fruitDefs = buildFruitDefs();
  const diamondDefs = buildDiamondDefs();
  const dual = slots == 2;
  const owner = localPlayerSlot();

  const bullets = [];
  let bi = 0;
  while (bi < MAX_BULLETS) {
    bullets.push(s.bullets[bi]);
    bi = bi + 1;
  }

  let p1 = s.p1;
  let p2 = s.p2;
  let fireCd1 = s.fireCd1;
  let fireCd2 = s.fireCd2;
  let summitMusicStarted: f64 = s.summitMusicStarted;
  if (summitMusicStarted == 0) {
    summitMusicStarted = 0.0;
  }

  if (p1.done == 1) {
    p1 = tickFinishPlayer(p1, dt, events);
  }
  if (dual) {
    if (p2.done == 1) {
      p2 = tickFinishPlayer(p2, dt, events);
    }
  }

  // Invaders-style: once the goal is reached, celebrate briefly then pushGame.
  if (levelCleared(slots, p1, p2)) {
    let levelLoadQueued = s.levelLoadQueued;
    if (levelLoadQueued == null) {
      levelLoadQueued = 0;
    }
    let celebrateMs = s.celebrateMs;
    if (celebrateMs == null || celebrateMs < 0) {
      celebrateMs = LEVEL_LOAD_MS;
    }
    if (levelLoadQueued == 0) {
      // Prefer nextLevel string (Invaders-style) over boolean isFinal — more
      // reliable across the TSX evaluator than truthiness of `false`.
      if (cfg().nextLevel == "") {
        if (showVictoryBanner({ playerSlots: slots, p1: p1, p2: p2 })) {
          if (wantsRestart(props, dual)) {
            resetGameData();
            loadGame("index.tsx");
            return s;
          }
        }
      } else {
        celebrateMs = celebrateMs - dt;
        if (celebrateMs <= 0) {
          celebrateMs = 0;
          saveGameData({ score1: s.score1, score2: s.score2 });
          pushGame(cfg().nextLevel);
          levelLoadQueued = 1;
        }
      }
    }
    const cameraY = computeCamera(p1, p2, dual);
    const entities = placeEntities(
      {
        p1: p1,
        p2: p2,
        enemies: s.enemies,
        fruits: s.fruits,
        diamonds: s.diamonds,
        bullets: s.bullets,
        movingPlatforms: s.movingPlatforms
      },
      cameraY,
      slots,
      puzzleStatus
    );
    return {
      showNet: 0,
      playerSlots: slots,
      cameraY: cameraY,
      entities: entities,
      p1: p1,
      p2: p2,
      enemies: s.enemies,
      fruits: s.fruits,
      diamonds: s.diamonds,
      puzzleSolved: puzzleStatus,
      bullets: s.bullets,
      movingPlatforms: s.movingPlatforms,
      score1: s.score1,
      score2: s.score2,
      fireCd1: fireCd1,
      fireCd2: fireCd2,
      summitMusicStarted: s.summitMusicStarted,
      levelLoadQueued: levelLoadQueued,
      celebrateMs: celebrateMs,
      events: events
    };
  }

  const movingPlatforms = copyMovingPlatformsList(s.movingPlatforms);
  updateMovingPlatforms(movingPlatforms, dt, staticPlatforms);
  const platforms = mergePlatforms(staticPlatforms, movingPlatforms);

  if (p1.done == 0) {
    const inp1 = readPlayer(props, 0);
    const u1 = updatePlayer(p1, inp1, dt, bullets, owner, fireCd1, platforms);
    p1 = u1.pl;
    fireCd1 = u1.fireCd;
    pushEvents(events, u1.events);
  }

  if (dual) {
    if (p2.done == 0) {
      const inp2 = readPlayer(props, 1);
      const u2 = updatePlayer(p2, inp2, dt, bullets, 2, fireCd2, platforms);
      p2 = u2.pl;
      fireCd2 = u2.fireCd;
      pushEvents(events, u2.events);
    }
  }

  const enemies = [];
  let ei = 0;
  while (ei < MAX_ENEMIES) {
    enemies.push(s.enemies[ei]);
    ei = ei + 1;
  }
  updateEnemies(enemies, dt);
  const bulletEvents = updateBullets(bullets, enemies, dt);
  pushEvents(events, bulletEvents);

  let score1 = s.score1;
  let score2 = s.score2;
  const fruits = [];
  let fi = 0;
  while (fi < MAX_FRUITS) {
    fruits.push(s.fruits[fi]);
    fi = fi + 1;
  }
  let diamonds = [];
  let di = 0;
  while (di < MAX_DIAMONDS) {
    diamonds.push(s.diamonds[di]);
    di = di + 1;
  }

  if (p1.done == 0) {
    const hit1 = applyEnemyHits(p1, owner, enemies, events);
    p1 = hit1.pl;
    if (hit1.died == 1) {
      diamonds = respawnMarkedDiamonds(diamonds);
    }
  }
  if (dual) {
    if (p2.done == 0) {
      const hit2 = applyEnemyHits(p2, 2, enemies, events);
      p2 = hit2.pl;
      if (hit2.died == 1) {
        diamonds = respawnMarkedDiamonds(diamonds);
      }
    }
  }

  const puzzleTick = tickMathPuzzles(p1, p2, dual, s.puzzleSolved, diamonds, events);
  const puzzleSolved = puzzleTick.puzzleSolved;
  diamonds = puzzleTick.diamonds;

  let fj = 0;
  while (fj < MAX_FRUITS) {
    const fd = fruitDefs[fj];
    if (fd && fruits[fj].taken == 0) {
      if (p1.done == 0) {
        if (hitPickup(p1.x, p1.y, fd.x, fd.y)) {
          fruits[fj] = { taken: 1 };
          score1 = score1 + 1;
          events.push(soundEvent("blip"));
          events.push(soundEvent("win"));
          events.push(particleEvent("fruit", fd.x, fd.y, 22));
          events.push(rumbleForOwner(owner, 50, 10000));
        }
      }
      if (dual) {
        if (p2.done == 0) {
          if (hitPickup(p2.x, p2.y, fd.x, fd.y)) {
            fruits[fj] = { taken: 1 };
            score2 = score2 + 1;
            events.push(soundEvent("blip"));
            events.push(soundEvent("win"));
            events.push(particleEvent("fruit", fd.x, fd.y, 22));
            events.push(rumbleForOwner(2, 50, 10000));
          }
        }
      }
    }
    fj = fj + 1;
  }

  let dk = 0;
  while (dk < MAX_DIAMONDS) {
    const dd = diamondDefs[dk];
    if (dd && diamonds[dk].taken == 0) {
      if (p1.done == 0) {
        if (hitPickup(p1.x, p1.y, dd.x, dd.y)) {
          diamonds[dk] = { taken: 1 };
          p1 = {
            x: p1.x,
            y: p1.y,
            vx: p1.vx,
            vy: p1.vy,
            face: p1.face,
            grounded: p1.grounded,
            anim: p1.anim,
            animTick: p1.animTick,
            jumpHold: p1.jumpHold,
            airJump: p1.airJump,
            jumpBoostMs: p1.jumpBoostMs,
            superMs: SUPER_MS,
            done: p1.done,
            finishMs: p1.finishMs,
            finishPulseMs: p1.finishPulseMs,
            celebrateBursts: p1.celebrateBursts
          };
          events.push(soundEvent("win"));
          events.push(particleEvent("sparkle", dd.x, dd.y, 28));
          events.push(rumbleForOwner(owner, 160, 28000));
        }
      }
      if (dual) {
        if (p2.done == 0) {
          if (hitPickup(p2.x, p2.y, dd.x, dd.y)) {
            diamonds[dk] = { taken: 1 };
            p2 = {
              x: p2.x,
              y: p2.y,
              vx: p2.vx,
              vy: p2.vy,
              face: p2.face,
              grounded: p2.grounded,
              anim: p2.anim,
              animTick: p2.animTick,
              jumpHold: p2.jumpHold,
              airJump: p2.airJump,
              jumpBoostMs: p2.jumpBoostMs,
              superMs: SUPER_MS,
              done: p2.done,
              finishMs: p2.finishMs,
              finishPulseMs: p2.finishPulseMs,
              celebrateBursts: p2.celebrateBursts
            };
            events.push(soundEvent("win"));
            events.push(particleEvent("sparkle", dd.x, dd.y, 28));
            events.push(rumbleForOwner(2, 160, 28000));
          }
        }
      }
    }
    dk = dk + 1;
  }

  if (p1.done == 0) {
    p1 = checkFinish(p1, owner, events);
    if (p1.done == 1) {
      summitMusicStarted = tryStartSummitMusic(summitMusicStarted, events);
    }
  }
  if (dual) {
    if (p2.done == 0) {
      p2 = checkFinish(p2, 2, events);
      if (p2.done == 1) {
        summitMusicStarted = tryStartSummitMusic(summitMusicStarted, events);
      }
    }
  }

  const cameraY = computeCamera(p1, p2, dual);
  const entities = placeEntities(
    {
      p1: p1,
      p2: p2,
      enemies: enemies,
      fruits: fruits,
      diamonds: diamonds,
      bullets: bullets,
      movingPlatforms: movingPlatforms
    },
    cameraY,
    slots,
    puzzleSolved
  );

  return {
    showNet: 0,
    playerSlots: slots,
    cameraY: cameraY,
    entities: entities,
    p1: p1,
    p2: p2,
    enemies: enemies,
    fruits: fruits,
    diamonds: diamonds,
    puzzleSolved: puzzleSolved,
    bullets: bullets,
    movingPlatforms: movingPlatforms,
    score1: score1,
    score2: score2,
    fireCd1: fireCd1,
    fireCd2: fireCd2,
    summitMusicStarted: summitMusicStarted,
    levelLoadQueued: s.levelLoadQueued != null ? s.levelLoadQueued : 0,
    celebrateMs: s.celebrateMs != null ? s.celebrateMs : -1,
    events: events
  };
}
