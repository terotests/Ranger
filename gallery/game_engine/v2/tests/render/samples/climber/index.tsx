// ============================================================================
// climber — a MINIMAL rendering sample (tests/render/samples), TSX guest.
// ============================================================================
// A focused subset of the ylos2 structure for testing the SAMPLING renderer:
// sky (presenter clear), a ground band, platforms with real WIDTH, two textured
// player characters on a split screen, and a floating pickup. It authors against
// the same real virtual packages a shipped game does (ranger:core + ranger:2d),
// starts through runtime.start(), and is driven by the host-owned tick — nothing
// game-specific lives in the host. Original placeholder art (scene.rgtx); the
// point is that the backend samples real texels, not the art itself.
//
// Small on purpose: a ~120x96 pane rasterises fast and gives a small reference
// frame the render test can assert pixel-exactly.
// ============================================================================

import { runtime } from "ranger:core";
import * as TWO from "ranger:2d";

const WORLD_W = 120;

// world layout (y grows downward, like ylos2)
const GROUND_Y = 196;
const PLAT_A = { x: 30, y: 150, w: 44 };
const PLAT_B = { x: 90, y: 120, w: 44 };
const PLAT_C = { x: 60, y: 175, w: 52 };

// draw order (painter): background band < platforms < pickups/players
const Z_GROUND = 0;
const Z_PLAT = 1;
const Z_GEM = 2;
const Z_PLAYER = 3;

// original 3x5 numeral glyphs for the HUD (X = lit cell)
const HUD_DIGITS = [
  ["XXX", "X.X", "X.X", "X.X", "XXX"],
  [".X.", "XX.", ".X.", ".X.", "XXX"],
  ["XXX", "..X", "XXX", "X..", "XXX"],
  ["XXX", "..X", "XXX", "..X", "XXX"],
  ["X.X", "X.X", "XXX", "..X", "..X"],
  ["XXX", "X..", "XXX", "..X", "XXX"],
  ["XXX", "X..", "XXX", "X.X", "XXX"],
  ["XXX", "..X", "..X", "..X", "..X"],
  ["XXX", "X.X", "XXX", "X.X", "XXX"],
  ["XXX", "X.X", "XXX", "..X", "XXX"]
];

class Player {
  x = 0;
  y = 0;
  sprite = null;
  anim = null;
  facing = 1;
}

class ClimberGame {
  init() {
    this.atlas = runtime.assets.loadSpriteAtlas("pkg://scene.atlas");
    this.rGround = this.atlas.regionIndex("ground");
    this.rPlat = this.atlas.regionIndex("plat");
    this.rGem = this.atlas.regionIndex("gem");
    this.rIdle = this.atlas.regionIndex("idle");

    this.layer = new TWO.Layer2D();

    // split screen: one pane per player (structural parity with v1)
    runtime.surface.setLayout("split-vertical");
    runtime.surface.pane(0).assignPlayer(0);
    runtime.surface.pane(1).assignPlayer(1);

    // ground band — one region stretched across the whole world width
    this.ground = new TWO.Sprite2D(this.atlas, this.rGround);
    this.ground.setPos(WORLD_W / 2, GROUND_Y);
    this.ground.setSize(WORLD_W + 8, 16);
    this.ground.setZ(Z_GROUND);
    this.layer.add(this.ground);

    // platforms — one region each, stretched to the platform's width
    this.platSprites = [];
    const plats = [PLAT_A, PLAT_B, PLAT_C];
    for (let i = 0; i < plats.length; i = i + 1) {
      const p = plats[i];
      const s = new TWO.Sprite2D(this.atlas, this.rPlat);
      s.setPos(p.x, p.y);
      s.setSize(p.w, 8);
      s.setZ(Z_PLAT);
      this.layer.add(s);
      this.platSprites.push(s);
    }

    // a floating pickup between the players
    this.gem = new TWO.Sprite2D(this.atlas, this.rGem);
    this.gem.setPos(60, 108);
    this.gem.setSize(10, 10);
    this.gem.setZ(Z_GEM);
    this.layer.add(this.gem);

    // two players, each standing on a platform, facing inward
    this.players = [];
    const p1 = new Player();
    p1.x = PLAT_A.x; p1.y = PLAT_A.y - 8; p1.facing = 1;
    const p2 = new Player();
    p2.x = PLAT_B.x; p2.y = PLAT_B.y - 8; p2.facing = -1;
    const starts = [p1, p2];
    for (let i = 0; i < starts.length; i = i + 1) {
      const pl = starts[i];
      pl.sprite = new TWO.Sprite2D(this.atlas, this.rIdle);
      pl.sprite.setPos(pl.x, pl.y);
      pl.sprite.setSize(12, 16);
      pl.sprite.setZ(Z_PLAYER);
      pl.sprite.setFlipX(pl.facing < 0);
      pl.anim = new TWO.AnimPlayer2D(pl.sprite, 0);
      this.layer.add(pl.sprite);
      this.players.push(pl);
    }

    // one camera per pane, each biased toward its player
    this.cam0 = new TWO.Camera2D();
    this.cam0.set(45, 150, 1, 0);
    this.cam1 = new TWO.Camera2D();
    this.cam1.set(75, 150, 1, 0);

    this.renderer = new TWO.Renderer2D();
    runtime.surface.attachRenderer(this.renderer);

    this.nowMs = 0;
    return 1;
  }

  // ---- HUD (screen-space overlay): a tiny 3x5 numeral font ------------------
  // Original glyphs; drawn from overlay rects in normalised pane coords (the
  // v2 equivalent of v1's engine HUD numbers), one per pane.
  drawDigit(dgt, nx, ny, cw, ch, pane) {
    const g = HUD_DIGITS[dgt];
    let ry = 0;
    while (ry < 5) {
      const line = g[ry];
      let cx = 0;
      while (cx < 3) {
        if (line.charAt(cx) == "X") {
          this.renderer.overlayRect(nx + cx * cw, ny + ry * ch, cw, ch, 235, 235, 235, pane);
        }
        cx = cx + 1;
      }
      ry = ry + 1;
    }
  }
  drawNumber(value, nx, ny, cw, ch, pane) {
    const digits = [];
    let v = value;
    if (v <= 0) { digits.push(0); }
    while (v > 0) { digits.push(v % 10); v = Math.floor(v / 10); }
    let k = digits.length - 1;
    let col = 0;
    while (k >= 0) {
      this.drawDigit(digits[k], nx + col * (4 * cw), ny, cw, ch, pane);
      col = col + 1;
      k = k - 1;
    }
  }

  update(props) {
    this.nowMs = this.nowMs + props.dtMs;
    // animate the walk clip (idle<->walk) so motion is real host state
    for (let i = 0; i < this.players.length; i = i + 1) {
      const pl = this.players[i];
      const frame = pl.anim.frameAt(this.nowMs / 1000);
      pl.sprite.setRegion(frame);
    }
    // frame pipeline step 6: the game binds each pane's view
    this.renderer.render(this.layer, this.cam0, 0);
    this.renderer.render(this.layer, this.cam1, 1);
    // HUD overlay (screen space): a score number near the bottom of each pane
    this.renderer.beginOverlay();
    this.drawNumber(12, 0.42, 0.86, 0.02, 0.024, 0);
    this.drawNumber(12, 0.42, 0.86, 0.02, 0.024, 1);
    return 1;
  }
}

const __game = new ClimberGame();
runtime.start(__game);
