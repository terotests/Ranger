/// <reference path="../../scripting/game.d.ts" />
/// <reference path="./breakout.d.ts" />
//
// Breakout - multi-screen GameRunner example (play + gameOver).
//
// Screen model (like HTML pages):
//   * initState() returns { screen, screens: { play: {...} } }
//   * sprites({ screen }) defines retained objects per screen (lazy on first visit)
//   * update() returns next state; changing screen freezes the old one in memory
//   * hud() renders JSX per active screen
//
// Controls: Left/Right or A/D move paddle (keyboard or gamepad). Space = restart.
//
// Run:
//   npm run engine:game-sdl:launcher → Breakout

import {
  BRICK_COUNT,
  BRICK_W,
  brickId,
  brickX,
  brickY,
  buildBrickSprites,
  countAlive,
  hitBrick,
  makeAlive,
  placeBricks
} from "./breakout_bricks";
import { getScreen, soundEvent } from "game_helpers";

function screens(): string[] {
  return ["play", "gameOver"];
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

function initEntities(): Record<string, EntityPose> {
  const entities: Record<string, EntityPose> = {};
  entities.paddle = { x: 240, y: 248 };
  entities.ball = { x: 240, y: 220 };
  let i = 0;
  while (i < BRICK_COUNT) {
    entities[brickId(i)] = { x: brickX(i), y: brickY(i) };
    i = i + 1;
  }
  return entities;
}

function initPlayState(): BreakoutPlayScreen {
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

function initState(): BreakoutState {
  return {
    screen: "play",
    screens: {
      play: initPlayState()
    }
  };
}

function resetBall(px: number, py: number): { bx: number; by: number; vx: number; vy: number } {
  return { bx: px, by: py - 24, vx: 0.18, vy: 0.14 };
}

function goToGameOver(
  s: BreakoutState,
  play: BreakoutPlayScreen,
  won: number
): BreakoutState {
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

function updatePlay(s: BreakoutState, props: EventProps): BreakoutState {
  const play = getScreen(s, "play");
  const events: GameEvent[] = [];
  const dt = props.dt as number;
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

  if (by < 8) { by = 8; vy = 0 - vy; events.push(soundEvent("wall")); }
  if (bx < 6) { bx = 6; vx = 0 - vx; events.push(soundEvent("wall")); }
  if (bx > 474) { bx = 474; vx = 0 - vx; events.push(soundEvent("wall")); }

  if (by > py - 14) {
    if (bx > px - 36) {
      if (bx < px + 36) {
        by = py - 14;
        vy = 0 - vy;
        const hit = (bx - px) / 36.0;
        vx = vx + hit * 0.06;
        events.push(soundEvent("bounce"));
      }
    }
  }

  if (by > 270) {
    lives = lives - 1;
    events.push(soundEvent("lose"));
    const reset = resetBall(px, py);
    bx = reset.bx;
    by = reset.by;
    vx = reset.vx;
    vy = reset.vy;
    if (lives <= 0) {
      const frozen: BreakoutPlayScreen = {
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
      const over = goToGameOver(s, frozen, 0);
      return {
        screen: over.screen,
        screens: over.screens,
        events: events
      };
    }
  }

  let i = 0;
  while (i < BRICK_COUNT) {
    if (alive[i] == 1) {
      if (hitBrick(bx, by, i) == 1) {
        alive[i] = 0;
        vy = 0 - vy;
        score = score + 10;
        events.push(soundEvent("brick"));
      }
    }
    i = i + 1;
  }

  if (countAlive(alive) == 0) {
    const frozen: BreakoutPlayScreen = {
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
    const over = goToGameOver(s, frozen, 1);
    events.push(soundEvent("win"));
    return {
      screen: over.screen,
      screens: over.screens,
      events: events
    };
  }

  const entities: Record<string, EntityPose> = {};
  entities.paddle = { x: px, y: py };
  entities.ball = { x: bx, y: by };
  placeBricks(entities, alive);

  const nextPlay: BreakoutPlayScreen = {
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
    },
    events: events
  };
}

function updateGameOver(s, props) {
  if (props.action) {
    return {
      screen: "play",
      screens: {
        gameOver: getScreen(s, "gameOver"),
        play: initPlayState()
      }
    };
  }
  return s;
}

function update(props) {
  const s = props.state;
  if (s.screen == "play") {
    return updatePlay(s, props);
  }
  if (s.screen == "gameOver") {
    return updateGameOver(s, props);
  }
  return s;
}

function hud(props) {
  const s = props.state;
  if (s.screen == "gameOver") {
    const go = s.screens.gameOver;
    return (
      <View flexDirection="column" padding="8px" width="100%" align="center">
        <Label color="#8fd3ff">PISTEET {go.score}</Label>
        <Label color="#8fd3ff">PAINA SPACE</Label>
      </View>
    );
  }
  const play = s.screens.play;
  return (
    <View flexDirection="row" padding="8px" width="100%" justifyContent="space-between">
      <Label color="#ff22ff">SCORE</Label>
      <Label color="#ffffff">{play.score}</Label>
      <Label color="#ff8899">LIVES {play.lives}</Label>
    </View>
  );
}
