// ============================================================================
// pinball — a physics pinball table (ranger:cannon + ranger:2d + audio).
// ============================================================================
// Top-down table: the ball is a cannon rigid body (gravity + integration); the
// guest reads its pose each frame, derives velocity from the position delta, and
// resolves the pinball-specific collisions (walls, pop bumpers, slingshots,
// flippers, drain) with setVelocity kicks. A DMD score display, colourful
// playfield, spinning targets and audio cues complete it. Flippers are the
// left/right inputs; a drained ball costs a ball and resets to the plunger lane.
//
// World is y-DOWN to match the screen (top = DMD/bumpers, bottom = flippers), so
// gravity is +Y (down the table).

import { runtime } from "ranger:core";
import * as TWO from "ranger:2d";
import * as CANNON from "ranger:cannon";

const W = 360;
const H = 620;
const BALL_R = 9;
const GRAV = 430;              // px/s^2 down the table
const WALL = 12;               // playfield inset
const WALL_BOUNCE = 0.82;
const FLIP_KICK = 540;         // pressed flipper launch speed
const FLIP_SOFT = 190;         // resting-flipper bounce
const BUMP_KICK = 400;
const SLING_KICK = 360;
const PLUNGE_X = W - 24;
const PLUNGE_Y = 90;
const DRAIN_Y = H - 12;
const VIEW_W = 480;
const VIEW_H = 270;

// pop bumpers (x, y, r, colour rgb)
const BUMPERS = [
  { x: 96, y: 150, r: 24, r0: 90, g0: 150, b0: 255 },
  { x: 180, y: 116, r: 24, r0: 255, g0: 90, b0: 120 },
  { x: 264, y: 150, r: 24, r0: 180, g0: 110, b0: 255 },
];
// slingshots (x, y) — triangular kickers above the flippers
const SLINGS = [
  { x: 88, y: 452, dir: 1 },
  { x: 272, y: 452, dir: -1 },
];
// bank targets (x, y, r, g, b) — the colourful rollover dots
const TARGETS = [
  { x: 150, y: 230, cr: 255, cg: 210, cb: 60 },
  { x: 180, y: 210, cr: 255, cg: 120, cb: 60 },
  { x: 210, y: 230, cr: 90, cg: 200, cb: 255 },
  { x: 120, y: 300, cr: 230, cg: 70, cb: 70 },
  { x: 240, y: 300, cr: 70, cg: 200, cb: 120 },
  { x: 180, y: 330, cr: 250, cg: 220, cb: 80 },
];

class PinballGame {
  layer = null;
  cam = null;
  renderer = null;
  world = null;
  ball = null;
  bx = 0; by = 0; lbx = 0; lby = 0;
  trail = [];
  score = 0;
  balls = 3;
  mult = 2;
  spinner = 0;         // spinner wheel angle
  flipL = 0; flipR = 0; // flipper raise animation (0..1)
  bumpFlash = [0, 0, 0];
  nowMs = 0;

  init() {
    runtime.surface.setLayout("single");
    this.layer = new TWO.Layer2D();
    this.cam = new TWO.Camera2D();
    this.renderer = new TWO.Renderer2D();
    runtime.surface.attachRenderer(this.renderer);

    this.world = new CANNON.World();
    this.world.setGravity(0, GRAV, 0);
    this.ball = this.world.addSphere(1, PLUNGE_X, PLUNGE_Y, 0, BALL_R);
    this.bx = PLUNGE_X; this.by = PLUNGE_Y; this.lbx = PLUNGE_X; this.lby = PLUNGE_Y;
    this.trail = [];
    return 1;
  }

  resetBall() {
    this.ball.setPosition(PLUNGE_X, PLUNGE_Y, 0);
    this.bx = PLUNGE_X; this.by = PLUNGE_Y; this.lbx = PLUNGE_X; this.lby = PLUNGE_Y;
    this.trail = [];
  }

  sfx(name) { runtime.audio.vocal.play(name); }

  update(props) {
    const dt = props.dtMs;
    this.nowMs = this.nowMs + dt;
    const dts = dt / 1000;
    if (dts <= 0) { return 1; }

    const pad = runtime.input.player(0);
    const lpr = pad.isDown("left");
    const rpr = pad.isDown("right");
    this.flipL = lpr ? 1 : Math.max(0, this.flipL - dt / 90);
    this.flipR = rpr ? 1 : Math.max(0, this.flipR - dt / 90);

    // pose + derived velocity
    this.bx = this.ball.posX();
    this.by = this.ball.posY();
    let vx = (this.bx - this.lbx) / dts;
    let vy = (this.by - this.lby) / dts;
    this.lbx = this.bx; this.lby = this.by;

    // ---- collisions -------------------------------------------------------
    // walls (reflect)
    if (this.bx < WALL + BALL_R && vx < 0) { vx = -vx * WALL_BOUNCE; this.sfx("wall"); }
    if (this.bx > W - WALL - BALL_R && vx > 0) { vx = -vx * WALL_BOUNCE; this.sfx("wall"); }
    if (this.by < WALL + BALL_R && vy < 0) { vy = -vy * WALL_BOUNCE; }

    // pop bumpers (radial kick)
    let bi = 0;
    while (bi < BUMPERS.length) {
      const bp = BUMPERS[bi];
      const dx = this.bx - bp.x;
      const dy = this.by - bp.y;
      const rr = bp.r + BALL_R;
      if (dx * dx + dy * dy < rr * rr) {
        const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
        vx = (dx / d) * BUMP_KICK;
        vy = (dy / d) * BUMP_KICK;
        this.score = this.score + 100 * this.mult;
        this.bumpFlash[bi] = 160;
        this.sfx("bounce");
      }
      if (this.bumpFlash[bi] > 0) { this.bumpFlash[bi] = this.bumpFlash[bi] - dt; }
      bi = bi + 1;
    }

    // slingshots (kick up-and-in when the ball rolls onto them)
    let si = 0;
    while (si < SLINGS.length) {
      const sl = SLINGS[si];
      const dx = this.bx - sl.x;
      const dy = this.by - sl.y;
      if (dx * dx + dy * dy < 30 * 30 && vy > 0) {
        vx = sl.dir * SLING_KICK * 0.6;
        vy = -SLING_KICK;
        this.score = this.score + 50 * this.mult;
        this.sfx("brick");
      }
      si = si + 1;
    }

    // spinner (left) — spin + score while the ball is over it
    const sdx = this.bx - 66;
    const sdy = this.by - 300;
    if (sdx * sdx + sdy * sdy < 42 * 42) {
      this.spinner = this.spinner + dt * 0.02;
      this.score = this.score + 5;
    }

    // targets (score + light up on contact)
    let ti = 0;
    while (ti < TARGETS.length) {
      const tg = TARGETS[ti];
      const dx = this.bx - tg.x;
      const dy = this.by - tg.y;
      if (dx * dx + dy * dy < 16 * 16) {
        this.score = this.score + 20 * this.mult;
      }
      ti = ti + 1;
    }

    // flippers — two zones just above the drain
    if (this.by > 512 && this.by < 588 && vy > -60) {
      if (this.bx > 60 && this.bx < 176) {
        vy = lpr ? -FLIP_KICK : -FLIP_SOFT;
        vx = 150;
        if (lpr) { this.sfx("bounce"); }
      } else if (this.bx > 184 && this.bx < 300) {
        vy = rpr ? -FLIP_KICK : -FLIP_SOFT;
        vx = -150;
        if (rpr) { this.sfx("bounce"); }
      }
    }

    // drain
    if (this.by > DRAIN_Y) {
      this.balls = this.balls - 1;
      this.sfx("lose");
      if (this.balls <= 0) { this.balls = 3; this.score = 0; }
      this.resetBall();
      vx = 0; vy = 0;
    }

    // apply + integrate (keep the ball on the z=0 plane)
    this.ball.setVelocity(vx, vy, 0);
    this.world.step(dts);

    // motion trail (drop the oldest by rebuild — avoids Array.shift)
    this.trail.push({ x: this.bx, y: this.by });
    if (this.trail.length > 8) {
      const kept = [];
      let z = 1;
      while (z < this.trail.length) { kept.push(this.trail[z]); z = z + 1; }
      this.trail = kept;
    }

    this.draw();
    return 1;
  }

  // ---- rendering ----------------------------------------------------------
  draw() {
    const r = this.renderer;
    // fit the tall table into the pane by height; centre it
    const zoom = VIEW_H / H;
    this.cam.set(W / 2, H / 2, zoom, 0);

    r.beginBackground();
    // cabinet surround (fills the pane margins beside the portrait table)
    r.fillRect(-400, -200, 1200, 1200, 12, 8, 40);
    // side cabinet art panels
    r.fillRect(-140, 0, 130, H, 40, 20, 90);
    r.fillRect(W + 10, 0, 130, H, 40, 20, 90);
    let a = 0;
    while (a < 8) {
      const ay = 40 + a * 74;
      r.fillRect(-120, ay, 90, 44, 200, 60, 90);
      r.fillRect(W + 30, ay, 90, 44, 60, 90, 200);
      a = a + 1;
    }

    // playfield
    r.fillRect(0, 0, W, H, 26, 30, 96);
    r.fillRect(WALL, WALL, W - 2 * WALL, H - 2 * WALL, 40, 46, 130);

    // decorative arrows (centre, pointing up the table)
    this.drawArrow(180, 300, 255, 70, 60);
    this.drawArrow(120, 430, 250, 210, 70);
    this.drawArrow(240, 430, 250, 210, 70);

    // spinner wheel (left) — colourful pie approximated with wedges
    this.drawSpinner(66, 300, 40);

    // bank targets
    let ti = 0;
    while (ti < TARGETS.length) {
      const tg = TARGETS[ti];
      r.fillCircle(tg.x, tg.y, 9, tg.cr, tg.cg, tg.cb);
      r.fillCircle(tg.x, tg.y, 4, 255, 255, 255);
      ti = ti + 1;
    }

    // slingshots (triangular blue kickers)
    let si = 0;
    while (si < SLINGS.length) {
      const sl = SLINGS[si];
      this.drawSling(sl.x, sl.y, sl.dir);
      si = si + 1;
    }

    // pop bumpers (concentric caps, flash on hit)
    let bi = 0;
    while (bi < BUMPERS.length) {
      const bp = BUMPERS[bi];
      const hot = this.bumpFlash[bi] > 0 ? 1 : 0;
      r.fillCircle(bp.x, bp.y, bp.r + 4, 240, 240, 255);
      if (hot == 1) {
        r.fillCircle(bp.x, bp.y, bp.r, 255, 255, 200);
      } else {
        r.fillCircle(bp.x, bp.y, bp.r, bp.r0, bp.g0, bp.b0);
      }
      r.fillCircle(bp.x, bp.y, bp.r - 9, 255, 255, 255);
      bi = bi + 1;
    }

    // flippers
    this.drawFlipper(118, 560, 1, this.flipL);
    this.drawFlipper(242, 560, -1, this.flipR);

    // ball trail + ball
    let k = 0;
    while (k < this.trail.length) {
      const tp = this.trail[k];
      const f = k / this.trail.length;
      r.fillCircle(tp.x, tp.y, BALL_R * (0.4 + f * 0.5), 120 + f * 80, 130 + f * 80, 150 + f * 90);
      k = k + 1;
    }
    r.fillCircle(this.bx, this.by, BALL_R, 210, 220, 235);
    r.fillCircle(this.bx - 3, this.by - 3, BALL_R * 0.5, 255, 255, 255);

    r.render(this.layer, this.cam, 0);

    // DMD score display (screen-space overlay)
    r.beginOverlay();
    r.overlayRect(0.30, 0.02, 0.40, 0.10, 30, 8, 8, 0);
    this.drawNumber(this.score, 0.66, 0.035, 0.012, 0.02, 255, 170, 20);
    // BALL indicator + multiplier
    this.drawNumber(this.balls, 0.34, 0.035, 0.010, 0.016, 255, 170, 20);
  }

  drawArrow(cx, cy, cr, cg, cb) {
    const r = this.renderer;
    r.fillRect(cx - 8, cy - 30, 16, 44, cr, cg, cb);
    r.fillRect(cx - 18, cy - 44, 36, 8, cr, cg, cb);
    r.fillRect(cx - 12, cy - 52, 24, 8, cr, cg, cb);
    r.fillRect(cx - 6, cy - 60, 12, 8, cr, cg, cb);
  }

  drawSpinner(cx, cy, rad) {
    const r = this.renderer;
    r.fillCircle(cx, cy, rad + 3, 235, 235, 245);
    // eight wedges as rotating coloured dots around the hub (approximated pie)
    const cols = [[230, 60, 60], [240, 150, 40], [245, 220, 60], [80, 200, 90], [70, 170, 230], [90, 90, 210], [200, 80, 200], [240, 120, 160]];
    let i = 0;
    while (i < 8) {
      const ang = this.spinner + (i / 8) * 6.28318;
      const px = cx + Math.cos(ang) * (rad * 0.55);
      const py = cy + Math.sin(ang) * (rad * 0.55);
      const c = cols[i];
      r.fillCircle(px, py, rad * 0.34, c[0], c[1], c[2]);
      i = i + 1;
    }
    r.fillCircle(cx, cy, rad * 0.28, 20, 20, 30);
  }

  drawSling(cx, cy, dir) {
    const r = this.renderer;
    // a filled triangle, approximated by stacked rects (widening toward the base)
    let i = 0;
    while (i < 7) {
      const w = 6 + i * 6;
      const x = dir > 0 ? cx : cx - w;
      r.fillRect(x, cy - 24 + i * 7, w, 7, 70, 150, 240);
      i = i + 1;
    }
    r.fillCircle(cx, cy - 6, 5, 255, 240, 120);
  }

  drawFlipper(px, py, dir, raise) {
    const r = this.renderer;
    // flipper points inward-down at rest, swings up when pressed (raise 0..1)
    const restAng = dir > 0 ? 0.5 : (3.14159 - 0.5);
    const upAng = dir > 0 ? -0.5 : (3.14159 + 0.5);
    const ang = restAng + (upAng - restAng) * raise;
    const len = 52;
    let s = 0;
    while (s <= 10) {
      const f = s / 10;
      const x = px + Math.cos(ang) * len * f;
      const y = py + Math.sin(ang) * len * f;
      r.fillCircle(x, y, 8 - f * 3, 235, 70, 70);
      s = s + 1;
    }
    r.fillCircle(px, py, 7, 255, 255, 255);
  }

  // DMD-style numerals (7-seg-ish 3x5 grid) in normalised overlay coords
  drawNumber(value, nx, ny, cw, ch, cr, cg, cb) {
    const digits = [];
    let v = value;
    if (v <= 0) { digits.push(0); }
    while (v > 0) { digits.push(v % 10); v = Math.floor(v / 10); }
    let k = digits.length - 1;
    let col = 0;
    while (k >= 0) {
      this.drawDigit(digits[k], nx + col * (4 * cw), ny, cw, ch, cr, cg, cb);
      col = col + 1;
      k = k - 1;
    }
  }
  drawDigit(dgt, nx, ny, cw, ch, cr, cg, cb) {
    const g = DIGITS[dgt];
    let ry = 0;
    while (ry < 5) {
      const line = g[ry];
      let cx = 0;
      while (cx < 3) {
        if (line.charAt(cx) == "X") {
          this.renderer.overlayRect(nx + cx * cw, ny + ry * ch, cw * 0.92, ch * 0.92, cr, cg, cb, 0);
        }
        cx = cx + 1;
      }
      ry = ry + 1;
    }
  }
}

const DIGITS = [
  ["XXX", "X.X", "X.X", "X.X", "XXX"],
  [".X.", "XX.", ".X.", ".X.", "XXX"],
  ["XXX", "..X", "XXX", "X..", "XXX"],
  ["XXX", "..X", "XXX", "..X", "XXX"],
  ["X.X", "X.X", "XXX", "..X", "..X"],
  ["XXX", "X..", "XXX", "..X", "XXX"],
  ["XXX", "X..", "XXX", "X.X", "XXX"],
  ["XXX", "..X", "..X", "..X", "..X"],
  ["XXX", "X.X", "XXX", "X.X", "XXX"],
  ["XXX", "X.X", "XXX", "..X", "XXX"],
];

const __game = new PinballGame();
runtime.start(__game);
