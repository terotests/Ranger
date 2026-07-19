// ============================================================================
// ylos2 / "Pomppija" — the v1 split-screen climber, recreated as a v2 TSX guest.
// ============================================================================
// Ported from games/ylos2/index.tsx onto the ranger2d.tsx façade (ranger:2d +
// ranger:core through the ONE registry bridge). The game is ordinary TSX: it
// creates retained sprites once (live-object model — no reconcile), reads its
// players' logical actions from ranger:core input, mutates host state through
// stable handles every update, and drives split-screen panes + vocal/music
// facades exactly as the v1 must-pass gate demands.
//
// Faithful pieces from v1: world size, the FULL BASE_PLATFORMS and
// BASE_MOVING_PLATFORMS tables, GRAV / MOVE / JUMP_* constants (px/ms units),
// the variable-height jump (min/max/hold-lift/cut), land-on-top-only
// collision, per-player camera scroll, goal platform → celebration.
// Out of scope for this port (documented per games/README policy): enemies,
// bullets, fruits/diamonds, super mode, LPC art (regions stand in).
// ============================================================================

const BASE_W = 480;
const WORLD_H = 1890;
const GRAV = 0.00045;          // px/ms^2
const MOVE = 0.22;             // px/ms
const JUMP_MIN_V = 0.28;
const JUMP_MAX_V = 0.38;
const JUMP_HOLD_LIFT = 0.00062;
const JUMP_CUT = 0.42;
const JUMP_HOLD_MAX_MS = 400;
const MOVING_PLAT_SPEED = 0.06;
const PLAYER_W = 26;
const PLAYER_H = 44;

const SUMMIT_MUSIC = "tempo 152 beats 4/4 @melody piano E4 G4 A4 G4 E4";

// v1 level tables, verbatim.
const BASE_PLATFORMS = [
  { x: 0, y: 1830, w: 480, h: 60 },
  { x: 30, y: 1700, w: 190, h: 14 },
  { x: 170, y: 1590, w: 100, h: 14 },
  { x: 310, y: 1480, w: 90, h: 14 },
  { x: 50, y: 1370, w: 110, h: 14 },
  { x: 260, y: 1260, w: 100, h: 14 },
  { x: 120, y: 1150, w: 90, h: 14 },
  { x: 300, y: 1040, w: 100, h: 14 },
  { x: 40, y: 930, w: 120, h: 14 },
  { x: 220, y: 820, w: 110, h: 14 },
  { x: 80, y: 710, w: 100, h: 14 },
  { x: 280, y: 600, w: 120, h: 14 },
  { x: 140, y: 490, w: 100, h: 14 },
  { x: 320, y: 380, w: 90, h: 14 },
  { x: 60, y: 270, w: 110, h: 14 },
  { x: 40, y: 220, w: 95, h: 12 },
  { x: 200, y: 160, w: 180, h: 20 }
];
const BASE_MOVING_PLATFORMS = [
  { x: 50, y: 980, w: 100, h: 14, min: 35, max: 310, dir: 1 },
  { x: 220, y: 880, w: 90, h: 14, min: 70, max: 340, dir: -1 },
  { x: 60, y: 780, w: 110, h: 14, min: 40, max: 300, dir: 1 },
  { x: 250, y: 680, w: 85, h: 14, min: 90, max: 350, dir: -1 },
  { x: 45, y: 560, w: 100, h: 14, min: 30, max: 290, dir: 1 },
  { x: 230, y: 460, w: 95, h: 14, min: 80, max: 330, dir: -1 },
  { x: 70, y: 350, w: 90, h: 14, min: 50, max: 280, dir: 1 },
  { x: 210, y: 220, w: 110, h: 14, min: 60, max: 320, dir: -1 }
];

// ---- retained scene state (created once in init, mutated per frame) --------
let layer = null;
let cam1 = null;
let cam2 = null;
let atlas = null;
let rIdle = 0;
let rWalk = 0;
let walkClip = 0;
let celebrateSfx = null;
let movingPlats = [];      // { x,y,w,h,min,max,dir, sprite }
let platformSprites = [];
let players = [];          // per slot: state + sprite + anim player
let nowMs = 0;
let goalIndex = 16;        // the topmost BASE_PLATFORMS entry

function makePlayer(slot, startX) {
  return {
    slot: slot,
    x: startX, y: 1830 - PLAYER_H, vx: 0, vy: 0,
    grounded: 1, facing: 1,
    jumpHoldMs: -1,        // -1 = not in a hold; >=0 = ms of boost used
    lastGroundFeet: 1830,  // feet height at last grounded frame (autopilot target lock)
    reachedGoal: 0,
    sprite: null, anim: null
  };
}

function init() {
  // split-screen: side-by-side panes, one logical player each (v1 splitScreen=auto)
  surfaceSetLayout(2);
  surfacePanePlayer(0, 0);
  surfacePanePlayer(1, 1);

  const tex = new Texture2D(256, 256);
  atlas = new SpriteAtlas(tex);
  rIdle = atlas.addRegion("idle", 0, 0, 32, 48);
  rWalk = atlas.addRegion("walk", 32, 0, 32, 48);
  const rPlat = atlas.addRegion("plat", 64, 0, 32, 8);
  walkClip = atlas.addClip("walk", [rIdle, rWalk], [120, 120]);

  layer = new Layer2D();
  cam1 = new Camera2D();
  cam2 = new Camera2D();
  celebrateSfx = new AudioSource();

  // retained platform sprites (created ONCE; movers mutate position later)
  let i = 0;
  while (i < BASE_PLATFORMS.length) {
    const p = BASE_PLATFORMS[i];
    const s = new Sprite2D(atlas, rPlat);
    s.setPos(p.x + p.w / 2, p.y);
    layer.add(s);
    platformSprites.push(s);
    i = i + 1;
  }
  i = 0;
  while (i < BASE_MOVING_PLATFORMS.length) {
    const m = BASE_MOVING_PLATFORMS[i];
    const s = new Sprite2D(atlas, rPlat);
    s.setPos(m.x + m.w / 2, m.y);
    layer.add(s);
    movingPlats.push({ x: m.x, y: m.y, w: m.w, h: m.h, min: m.min, max: m.max, dir: m.dir, sprite: s });
    i = i + 1;
  }

  // P1 girl left, P2 boy right (v1 start slots)
  const p1 = makePlayer(0, 120);
  const p2 = makePlayer(1, 330);
  p1.sprite = new Sprite2D(atlas, rIdle);
  p2.sprite = new Sprite2D(atlas, rIdle);
  p1.anim = new AnimPlayer2D(p1.sprite, walkClip);
  p2.anim = new AnimPlayer2D(p2.sprite, walkClip);
  layer.add(p1.sprite);
  layer.add(p2.sprite);
  players = [p1, p2];

  log("ylos2-v2 init: platforms=" + (BASE_PLATFORMS.length + BASE_MOVING_PLATFORMS.length));
  return 1;
}

// ---- v1 physics core -------------------------------------------------------
function overlapsX(px, pw, plat) {
  if (px + pw <= plat.x) { return false; }
  if (px >= plat.x + plat.w) { return false; }
  return true;
}

function updateMovers(dt) {
  let i = 0;
  while (i < movingPlats.length) {
    const m = movingPlats[i];
    m.x = m.x + MOVING_PLAT_SPEED * m.dir * dt;
    if (m.x < m.min) { m.x = m.min; m.dir = 1; }
    if (m.x > m.max) { m.x = m.max; m.dir = -1; }
    m.sprite.setPos(m.x + m.w / 2, m.y);
    i = i + 1;
  }
}

function updatePlayer(pl, dt) {
  const left = inputIsDown(pl.slot, "left");
  const right = inputIsDown(pl.slot, "right");
  const jump = inputIsDown(pl.slot, "jump");

  // horizontal (v1 MOVE px/ms)
  pl.vx = 0;
  if (left) { pl.vx = 0 - MOVE; pl.facing = -1; }
  if (right) { pl.vx = MOVE; pl.facing = 1; }
  pl.x = pl.x + pl.vx * dt;
  if (pl.x < 0) { pl.x = 0; }
  if (pl.x > BASE_W - PLAYER_W) { pl.x = BASE_W - PLAYER_W; }

  // gravity
  pl.vy = pl.vy + GRAV * dt;

  // variable-height jump (v1 min/max/hold-lift/cut)
  if (jump) {
    if (pl.grounded == 1) {
      pl.vy = 0 - JUMP_MIN_V;
      pl.grounded = 0;
      pl.jumpHoldMs = 0;
    } else if (pl.jumpHoldMs >= 0 && pl.jumpHoldMs < JUMP_HOLD_MAX_MS && pl.vy < 0) {
      pl.vy = pl.vy - JUMP_HOLD_LIFT * dt;
      if (pl.vy < 0 - JUMP_MAX_V) { pl.vy = 0 - JUMP_MAX_V; }
      pl.jumpHoldMs = pl.jumpHoldMs + dt;
    }
  } else {
    if (pl.jumpHoldMs >= 0 && pl.vy < 0) { pl.vy = pl.vy * JUMP_CUT; }
    pl.jumpHoldMs = -1;
  }

  // vertical integrate + land-on-top-only (v1 rule)
  const prevFeet = pl.y + PLAYER_H;
  let newY = pl.y + pl.vy * dt;
  const newFeet = newY + PLAYER_H;
  pl.grounded = 0;
  if (pl.vy >= 0) {
    let i = 0;
    while (i < BASE_PLATFORMS.length) {
      const p = BASE_PLATFORMS[i];
      if (overlapsX(pl.x, PLAYER_W, p)) {
        if (prevFeet <= p.y + 1 && newFeet >= p.y) {
          newY = p.y - PLAYER_H;
          pl.vy = 0;
          pl.grounded = 1;
          pl.lastGroundFeet = p.y;
          if (i == goalIndex && pl.reachedGoal == 0) {
            pl.reachedGoal = 1;
            celebrateSfx.playOneShot();
            vocal("cheer");
            musicPlay(SUMMIT_MUSIC);
          }
        }
      }
      i = i + 1;
    }
    let k = 0;
    while (k < movingPlats.length) {
      const m = movingPlats[k];
      if (overlapsX(pl.x, PLAYER_W, m)) {
        if (prevFeet <= m.y + 1 && newFeet >= m.y) {
          newY = m.y - PLAYER_H;
          pl.vy = 0;
          pl.grounded = 1;
          pl.lastGroundFeet = m.y;
        }
      }
      k = k + 1;
    }
  }
  pl.y = newY;
  if (pl.y > WORLD_H) { pl.y = 1830 - PLAYER_H; pl.vy = 0; }  // fell off: respawn

  // retained sprite writes (stable handle — never recreated)
  pl.sprite.setPos(pl.x + PLAYER_W / 2, pl.y + PLAYER_H / 2);
  if (pl.vx != 0) {
    pl.sprite.setRegion(pl.anim.frameAt(nowMs / 1000));
  } else {
    pl.sprite.setRegion(rIdle);
  }
}

function updateCameras() {
  const p1 = players[0];
  const p2 = players[1];
  cam1.set(p1.x + PLAYER_W / 2, p1.y + PLAYER_H / 2, 1, 0);
  cam2.set(p2.x + PLAYER_W / 2, p2.y + PLAYER_H / 2, 1, 0);
}

function update(props) {
  const dt = props.dtMs;
  nowMs = nowMs + dt;
  updateMovers(dt);
  updatePlayer(players[0], dt);
  updatePlayer(players[1], dt);
  updateCameras();
  return 1;
}

// ---- attract-mode autopilot (v1-style demo mode) ---------------------------
// Suggests this slot's input as bits (left=1, right=2, jump=4). The HOST feeds
// the suggestion back through the real ranger:core input path; the game itself
// still only reads logical actions in updatePlayer.
function nextTargetAbove(pl) {
  // Target is LOCKED to the last grounded height: re-picking from live altitude
  // mid-flight flips the target upward and steers the player off the platform
  // it was about to land on (observed limit-cycle bug).
  const feet = pl.lastGroundFeet;
  let best = null;
  let bestY = -100000;
  let i = 0;
  while (i < BASE_PLATFORMS.length) {
    const p = BASE_PLATFORMS[i];
    if (p.y < feet - 4 && p.y > bestY) { bestY = p.y; best = p; }
    i = i + 1;
  }
  let k = 0;
  while (k < movingPlats.length) {
    const m = movingPlats[k];
    if (m.y < feet - 4 && m.y > bestY) { bestY = m.y; best = m; }
    k = k + 1;
  }
  return best;
}

function autopilotBits(slot) {
  const pl = players[slot];
  const target = nextTargetAbove(pl);
  if (target == null) { return 0; }
  let bits = 4;  // jump is always held: grounded → launch (players jump WHILE
                 // moving, covering horizontal gaps); airborne → hold boost
  const cx = pl.x + PLAYER_W / 2;
  const inSpan = cx > target.x + 6 && cx < target.x + target.w - 6;
  if (!inSpan) {
    if (cx < target.x + target.w / 2) { bits = bits + 2; } else { bits = bits + 1; }
  }
  return bits;
}

// ---- runner accessors (numbers only) ---------------------------------------
function getLayerId() { return layer.id; }
function getCameraId(slot) { if (slot == 0) { return cam1.id; } return cam2.id; }
function playerY(slot) { return players[slot].y; }
function playerX(slot) { return players[slot].x; }
function reachedGoal(slot) { return players[slot].reachedGoal; }
function playerSpriteId(slot) { return players[slot].sprite.id; }
