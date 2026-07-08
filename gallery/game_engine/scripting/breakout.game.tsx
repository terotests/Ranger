/// <reference path="./game.d.ts" />
//
// Breakout - multi-screen GameRunner example (play + gameOver).
//
// Screen model (like HTML pages):
//   * initState() returns { screen, screens: { play: {...} } }
//   * sprites({ screen }) defines retained objects per screen (lazy on first visit)
//   * update() returns next state; changing screen freezes the old one in memory
//   * hud() renders JSX per active screen
//
// Controls: Left/Right or A/D move paddle. Space = action (restart on game over).
//
// Run:
//   npm run engine:game-sdl:run -- gallery/game_engine/scripting/breakout.game.tsx

const COLS = 10;
const ROWS = 5;
const BRICK_COUNT = COLS * ROWS;
const BRICK_W = 40;
const BRICK_H = 12;
const BRICK_GAP = 4;
const BRICK_TOP = 52;
const BRICK_LEFT = 40;

const BRICK_COLORS = [
  { r: 220, g: 80, b: 90 },
  { r: 255, g: 150, b: 60 },
  { r: 255, g: 220, b: 80 },
  { r: 120, g: 220, b: 140 },
  { r: 90, g: 170, b: 255 }
];

function screens() {
  return ["play", "gameOver"];
}

function brickId(i) {
  return ("b" + i);
}

function brickCol(i) {
  return i % COLS;
}

function brickRow(i) {
  return (i - brickCol(i)) / COLS;
}

function brickX(i) {
  const c = brickCol(i);
  return BRICK_LEFT + c * (BRICK_W + BRICK_GAP);
}

function brickY(i) {
  const r = brickRow(i);
  return BRICK_TOP + r * (BRICK_H + BRICK_GAP);
}

function buildBrickSprites() {
  const list = [];
  let i = 0;
  while (i < BRICK_COUNT) {
    const row = brickRow(i);
    const pal = BRICK_COLORS[row % BRICK_COLORS.length];
    list.push({
      id: brickId(i),
      kind: "rect",
      w: BRICK_W,
      h: BRICK_H,
      r: pal.r,
      g: pal.g,
      b: pal.b
    });
    i = i + 1;
  }
  return list;
}

function sprites(props) {
  if (props.screen == "play") {
    const list = buildBrickSprites();
    list.push({ id: "paddle", kind: "rect", w: 64, h: 10, r: 120, g: 220, b: 255 });
    list.push({ id: "ball", kind: "circle", rad: 5, r: 245, g: 245, b: 130 });
    return list;
  }
  return [];
}

function makeAlive() {
  const alive = [];
  let i = 0;
  while (i < BRICK_COUNT) {
    alive.push(1);
    i = i + 1;
  }
  return alive;
}

function initEntities() {
  const entities = {};
  entities.paddle = { x: 240, y: 248 };
  entities.ball = { x: 240, y: 220 };
  let i = 0;
  while (i < BRICK_COUNT) {
    entities[brickId(i)] = { x: brickX(i), y: brickY(i) };
    i = i + 1;
  }
  return entities;
}

function initPlayState() {
  return {
    layout: "breakout",
    showNet: 0,
    entities: initEntities(),
    px: 240,
    py: 248,
    bx: 240,
    by: 220,
    vx: 0.18,
    vy: 0.14,
    alive: makeAlive(),
    score: 0,
    lives: 3,
    score1: 0,
    score2: 3
  };
}

function initState() {
  return {
    screen: "play",
    screens: {
      play: initPlayState()
    }
  };
}

function countAlive(alive) {
  let n = 0;
  let i = 0;
  while (i < alive.length) {
    if (alive[i] == 1) { n = n + 1; }
    i = i + 1;
  }
  return n;
}

function resetBall(px, py) {
  return { bx: px, by: py - 24, vx: 0.18, vy: 0.14 };
}

function placeBricks(entities, alive) {
  let i = 0;
  while (i < BRICK_COUNT) {
    const id = brickId(i);
    if (alive[i] == 0) {
      entities[id] = { x: -40, y: -40, visible: 0 };
    } else {
      entities[id] = { x: brickX(i), y: brickY(i) };
    }
    i = i + 1;
  }
}

function hitBrick(bx, by, i) {
  const x = brickX(i);
  const y = brickY(i);
  if (bx < x - 4) { return 0; }
  if (bx > x + BRICK_W + 4) { return 0; }
  if (by < y - 4) { return 0; }
  if (by > y + BRICK_H + 4) { return 0; }
  return 1;
}

function goToGameOver(s, play, won) {
  return {
    screen: "gameOver",
    screens: {
      play: play,
      gameOver: {
        layout: "breakout",
        score: play.score,
        won: won,
        lives: play.lives
      }
    }
  };
}

function updatePlay(s, props) {
  const play = s.screens.play;
  const dt = props.dt;
  let px = play.px;
  let py = play.py;
  let bx = play.bx;
  let by = play.by;
  let vx = play.vx;
  let vy = play.vy;
  let score = play.score;
  let lives = play.lives;
  const alive = play.alive;

  if (props.left || props.up) { px = px - dt * 0.34; }
  if (props.right || props.down) { px = px + dt * 0.34; }
  if (px < 40) { px = 40; }
  if (px > 440) { px = 440; }

  bx = bx + vx * dt;
  by = by + vy * dt;

  if (by < 8) { by = 8; vy = 0 - vy; }
  if (bx < 6) { bx = 6; vx = 0 - vx; }
  if (bx > 474) { bx = 474; vx = 0 - vx; }

  if (by > py - 14) {
    if (bx > px - 36) {
      if (bx < px + 36) {
        by = py - 14;
        vy = 0 - vy;
        const hit = (bx - px) / 36.0;
        vx = vx + hit * 0.06;
      }
    }
  }

  if (by > 270) {
    lives = lives - 1;
    const reset = resetBall(px, py);
    bx = reset.bx;
    by = reset.by;
    vx = reset.vx;
    vy = reset.vy;
    if (lives <= 0) {
      const frozen = {
        layout: "breakout",
        entities: play.entities,
        px: px,
        py: py,
        bx: bx,
        by: by,
        vx: vx,
        vy: vy,
        alive: alive,
        score: score,
        lives: 0,
        score1: score,
        score2: 0
      };
      return goToGameOver(s, frozen, 0);
    }
  }

  let i = 0;
  while (i < BRICK_COUNT) {
    if (alive[i] == 1) {
      if (hitBrick(bx, by, i) == 1) {
        alive[i] = 0;
        vy = 0 - vy;
        score = score + 10;
      }
    }
    i = i + 1;
  }

  if (countAlive(alive) == 0) {
    const frozen = {
      layout: "breakout",
      entities: play.entities,
      px: px,
      py: py,
      bx: bx,
      by: by,
      vx: vx,
      vy: vy,
      alive: alive,
      score: score,
      lives: lives,
      score1: score,
      score2: lives
    };
    return goToGameOver(s, frozen, 1);
  }

  const entities = {};
  entities.paddle = { x: px, y: py };
  entities.ball = { x: bx, y: by };
  placeBricks(entities, alive);

  const nextPlay = {
    layout: "breakout",
    entities: entities,
    px: px,
    py: py,
    bx: bx,
    by: by,
    vx: vx,
    vy: vy,
    alive: alive,
    score: score,
    lives: lives,
    score1: score,
    score2: lives
  };

  return {
    screen: "play",
    screens: {
      play: nextPlay
    }
  };
}

function updateGameOver(s, props) {
  if (props.action) {
    return {
      screen: "play",
      screens: {
        gameOver: s.screens.gameOver,
        play: initPlayState()
      }
    };
  }
  return s;
}

function update(props) {
  const s = props.state;
  const sc = s.screen;
  if (sc == "play") {
    return updatePlay(s, props);
  }
  if (sc == "gameOver") {
    return updateGameOver(s, props);
  }
  return s;
}

function hud(props) {
  const s = props.state;
  const sc = s.screen;
  if (sc == "gameOver") {
    const go = s.screens.gameOver;
    let title = "PELI OHI!!";
    if (go.won == 1) {
      title = "YOU WIN";
    }
    return (
      <View flexDirection="row" padding="20px">
        <Label color="#8fd3ff">{title} HOT RELOAD {go.score}</Label>
      </View>
    );
  }
  const play = s.screens.play;
  return (
    <View flexDirection="column" padding="6px">
      <Label color="#ffffff" padding="2px">SCORE {play.score}</Label>
      <Label color="#ff8899" padding="2px">LIVES {play.lives}</Label>
    </View>
  );
}
