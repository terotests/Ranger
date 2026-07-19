// ============================================================================
// ylos2 / "Pomppija" — the v1 split-screen climber as a v2 TSX guest.
// ============================================================================
// Authored against the REAL virtual packages (D-MODULES): domain objects come
// from `ranger:2d`, platform capabilities from the `ranger:core` runtime root.
// No ambient façade globals, no host concatenation — the loader evaluates this
// file only; everything else arrives through the imports below. The game is a
// class started with runtime.start(), driven by the host-owned tick.
//
// Faithful v1 pieces: full BASE_PLATFORMS / BASE_MOVING_PLATFORMS tables,
// GRAV / MOVE / JUMP_* constants (px/ms), variable-height jump, land-on-top
// collision, per-player camera scroll, goal → celebration, split-screen.
// Out of scope for this port: enemies, bullets, fruits/diamonds, super mode,
// LPC art.
// ============================================================================

import { runtime } from "ranger:core";
import * as TWO from "ranger:2d";

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

// v1 score verbatim (game_soundscore: duration:pitch tokens, newline headers).
// The previous one-liner stub dropped durations and three of four phrases, so
// the real parser heard nothing useful / a different tune.
const SUMMIT_MUSIC =
  "tempo 152\n" +
  "beats 4/4\n" +
  "\n" +
  "@melody piano\n" +
  "0.5:E4 0.5:G4 1:A4 1:G4 1:E4\n" +
  "0.5:D4 0.5:E4 1:G4 2:E4\n" +
  "0.5:E4 0.5:G4 1:A4 1:C5 1:B4\n" +
  "1:A4 1:G4 2:E4\n";

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

function overlapsX(px, pw, plat) {
  if (px + pw <= plat.x) { return false; }
  if (px >= plat.x + plat.w) { return false; }
  return true;
}

class Ylos2Game {
  layer = null;
  cam1 = null;
  cam2 = null;
  atlas = null;
  rIdle = 0;
  rWalk = 0;
  walkClip = 0;
  celebrateSfx = null;
  renderer = null;
  movingPlats = [];
  platformSprites = [];
  players = [];
  nowMs = 0;
  goalIndex = 16;
  summitMusicStarted = 0;

  makePlayer(slot, startX) {
    return {
      slot: slot,
      x: startX, y: 1830 - PLAYER_H, vx: 0, vy: 0,
      grounded: 1, facing: 1,
      jumpHoldMs: -1,
      jumpHeld: 0,
      lastGroundFeet: 1830,
      reachedGoal: 0,
      onMover: -1,
      sprite: null, anim: null
    };
  }

  init() {
    // split-screen through the surface capability (v1 splitScreen=auto)
    runtime.surface.setLayout("split-vertical");
    runtime.surface.pane(0).assignPlayer(0);
    runtime.surface.pane(1).assignPlayer(1);

    // the atlas comes from package data via the assets capability
    this.atlas = runtime.assets.loadSpriteAtlas("pkg://player.atlas");
    this.rIdle = this.atlas.regionIndex("idle");
    this.rWalk = this.atlas.regionIndex("walk");
    const rPlat = this.atlas.regionIndex("plat");
    this.walkClip = 0;   // first clip declared in player.atlas

    this.layer = new TWO.Layer2D();
    this.cam1 = new TWO.Camera2D();
    this.cam2 = new TWO.Camera2D();
    this.renderer = new TWO.Renderer2D();
    runtime.surface.attachRenderer(this.renderer);
    // clip ≠ source (D-LIFE): the source is created from an explicit clip
    const clip = runtime.audio.createClip();
    this.celebrateSfx = runtime.audio.createSource(clip);

    let i = 0;
    while (i < BASE_PLATFORMS.length) {
      const p = BASE_PLATFORMS[i];
      const s = new TWO.Sprite2D(this.atlas, rPlat);
      s.setPos(p.x + p.w / 2, p.y);
      this.layer.add(s);
      this.platformSprites.push(s);
      i = i + 1;
    }
    i = 0;
    while (i < BASE_MOVING_PLATFORMS.length) {
      const m = BASE_MOVING_PLATFORMS[i];
      const s = new TWO.Sprite2D(this.atlas, rPlat);
      s.setPos(m.x + m.w / 2, m.y);
      this.layer.add(s);
      this.movingPlats.push({
        x: m.x, y: m.y, w: m.w, h: m.h, min: m.min, max: m.max, dir: m.dir,
        vx: MOVING_PLAT_SPEED * m.dir, sprite: s
      });
      i = i + 1;
    }

    const p1 = this.makePlayer(0, 120);
    const p2 = this.makePlayer(1, 330);
    p1.sprite = new TWO.Sprite2D(this.atlas, this.rIdle);
    p2.sprite = new TWO.Sprite2D(this.atlas, this.rIdle);
    p1.anim = new TWO.AnimPlayer2D(p1.sprite, this.walkClip);
    p2.anim = new TWO.AnimPlayer2D(p2.sprite, this.walkClip);
    this.layer.add(p1.sprite);
    this.layer.add(p2.sprite);
    this.players = [p1, p2];

    runtime.log.info("ylos2-v2 init: platforms=" + (BASE_PLATFORMS.length + BASE_MOVING_PLATFORMS.length));
    return 1;
  }

  tryStartSummitMusic() {
    if (this.summitMusicStarted == 1) { return; }
    this.summitMusicStarted = 1;
    runtime.audio.music.play(SUMMIT_MUSIC);
  }

  markGoal(pl) {
    if (pl.reachedGoal == 1) { return; }
    pl.reachedGoal = 1;
    this.celebrateSfx.playOneShot();
    runtime.audio.vocal.play("cheer");
    this.tryStartSummitMusic();
  }

  updateMovers(dt) {
    let i = 0;
    while (i < this.movingPlats.length) {
      const m = this.movingPlats[i];
      // v1 clamps the *right edge* to max (x + w <= max), not the left edge.
      m.x = m.x + MOVING_PLAT_SPEED * m.dir * dt;
      if (m.x < m.min) { m.x = m.min; m.dir = 1; }
      if (m.x + m.w > m.max) { m.x = m.max - m.w; m.dir = -1; }
      m.vx = MOVING_PLAT_SPEED * m.dir;
      m.sprite.setPos(m.x + m.w / 2, m.y);
      i = i + 1;
    }
  }

  updatePlayer(pl, dt) {
    const pad = runtime.input.player(pl.slot);
    const left = pad.isDown("left");
    const right = pad.isDown("right");
    const jump = pad.isDown("jump");

    pl.vx = 0;
    if (left) { pl.vx = 0 - MOVE; pl.facing = -1; }
    if (right) { pl.vx = MOVE; pl.facing = 1; }
    pl.x = pl.x + pl.vx * dt;
    if (pl.x < 0) { pl.x = 0; }
    if (pl.x > BASE_W - PLAYER_W) { pl.x = BASE_W - PLAYER_W; }

    pl.vy = pl.vy + GRAV * dt;

    // v1 edge-triggers grounded jumps (hold does not auto-rejump on land).
    if (jump) {
      if (pl.grounded == 1) {
        if (pl.jumpHeld == 0) {
          pl.vy = 0 - JUMP_MIN_V;
          pl.grounded = 0;
          pl.onMover = -1;
          pl.jumpHoldMs = 0;
        }
      } else if (pl.jumpHoldMs >= 0 && pl.jumpHoldMs < JUMP_HOLD_MAX_MS && pl.vy < 0) {
        pl.vy = pl.vy - JUMP_HOLD_LIFT * dt;
        if (pl.vy < 0 - JUMP_MAX_V) { pl.vy = 0 - JUMP_MAX_V; }
        pl.jumpHoldMs = pl.jumpHoldMs + dt;
      }
    } else {
      if (pl.jumpHoldMs > 0 && pl.vy < 0) { pl.vy = pl.vy * JUMP_CUT; }
      pl.jumpHoldMs = -1;
    }
    pl.jumpHeld = jump ? 1 : 0;

    const prevFeet = pl.y + PLAYER_H;
    let newY = pl.y + pl.vy * dt;
    const newFeet = newY + PLAYER_H;
    pl.grounded = 0;
    pl.onMover = -1;
    // Landing slack matches v1 (prevFeet <= plat.y + 4).
    if (pl.vy >= 0) {
      let i = 0;
      while (i < BASE_PLATFORMS.length) {
        const p = BASE_PLATFORMS[i];
        if (overlapsX(pl.x, PLAYER_W, p)) {
          if (prevFeet <= p.y + 4 && newFeet >= p.y) {
            newY = p.y - PLAYER_H;
            pl.vy = 0;
            pl.grounded = 1;
            pl.lastGroundFeet = p.y;
            if (i == this.goalIndex) { this.markGoal(pl); }
          }
        }
        i = i + 1;
      }
      let k = 0;
      while (k < this.movingPlats.length) {
        const m = this.movingPlats[k];
        if (overlapsX(pl.x, PLAYER_W, m)) {
          if (prevFeet <= m.y + 4 && newFeet >= m.y) {
            newY = m.y - PLAYER_H;
            pl.vy = 0;
            pl.grounded = 1;
            pl.onMover = k;
            pl.lastGroundFeet = m.y;
          }
        }
        k = k + 1;
      }
    }
    pl.y = newY;

    // Ride moving platforms (v1 carryVx).
    if (pl.grounded == 1 && pl.onMover >= 0) {
      const m = this.movingPlats[pl.onMover];
      pl.x = pl.x + m.vx * dt;
      if (pl.x < 0) { pl.x = 0; }
      if (pl.x > BASE_W - PLAYER_W) { pl.x = BASE_W - PLAYER_W; }
      if (!overlapsX(pl.x, PLAYER_W, m)) {
        pl.grounded = 0;
        pl.onMover = -1;
      }
    }

    // v1 also finishes by proximity (feet near goal), not only by landing.
    if (pl.reachedGoal == 0) {
      if (pl.y + PLAYER_H <= BASE_PLATFORMS[this.goalIndex].y + 22) {
        this.markGoal(pl);
      }
    }

    if (pl.y > WORLD_H) { pl.y = 1830 - PLAYER_H; pl.vy = 0; }

    pl.sprite.setPos(pl.x + PLAYER_W / 2, pl.y + PLAYER_H / 2);
    if (pl.vx != 0) {
      pl.sprite.setRegion(pl.anim.frameAt(this.nowMs / 1000));
    } else {
      pl.sprite.setRegion(this.rIdle);
    }
  }

  updateCameras() {
    const p1 = this.players[0];
    const p2 = this.players[1];
    this.cam1.set(p1.x + PLAYER_W / 2, p1.y + PLAYER_H / 2, 1, 0);
    this.cam2.set(p2.x + PLAYER_W / 2, p2.y + PLAYER_H / 2, 1, 0);
  }

  update(props) {
    const dt = props.dtMs;
    this.nowMs = this.nowMs + dt;
    this.updateMovers(dt);
    this.updatePlayer(this.players[0], dt);
    this.updatePlayer(this.players[1], dt);
    this.updateCameras();
    // the game owns its render calls (one per pane, split-screen)
    this.renderer.render(this.layer, this.cam1, 0);
    this.renderer.render(this.layer, this.cam2, 1);
    return 1;
  }

  // attract-mode target: the closest platform above the last grounded height
  // (locked at launch — re-picking mid-flight causes a limit cycle)
  nextTargetAbove(pl) {
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
    while (k < this.movingPlats.length) {
      const m = this.movingPlats[k];
      if (m.y < feet - 4 && m.y > bestY) { bestY = m.y; best = m; }
      k = k + 1;
    }
    return best;
  }
}

const __game = new Ylos2Game();
runtime.start(__game);

// ---- attract mode (game feature): suggest input as bits left=1 right=2 jump=4
// Jump must be pulsed: grounded jumps are edge-triggered (v1 jumpHold), so a
// held jump bit across landing would never leave the ground again.
function autopilotBits(slot) {
  const pl = __game.players[slot];
  const target = __game.nextTargetAbove(pl);
  if (target == null) { return 0; }
  let bits = 0;
  if (pl.grounded == 1) {
    bits = 4;
  } else if (pl.vy < 0) {
    bits = 4;
  }
  const cx = pl.x + PLAYER_W / 2;
  const inSpan = cx > target.x + 6 && cx < target.x + target.w - 6;
  if (!inSpan) {
    if (cx < target.x + target.w / 2) { bits = bits + 2; } else { bits = bits + 1; }
  }
  return bits;
}
