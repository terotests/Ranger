/// <reference path="../../scripting/game.d.ts" />
//
// Scripted Pong for the Ranger GameRunner.
//
// playerSlots in state controls SDL input mapping (default 1 = vs CPU).
// Switches to 2 when a second human takes the right paddle.
//
// Controls:
//   1 player (vs CPU) — W/S or gamepad for left paddle
//   Join as P2       — press arrow up/down once (right paddle; CPU stops)
//   2 players        — P1 W/S, P2 arrows or gamepad
//
// Coordinates are in pixels of a 480x270 buffer. Motion is time-based (uses dt),
// so it is framerate-independent.

import { soundEvent } from "../../scripting/game_helpers";

function sprites() {
  return [
    { id: "ball", kind: "circle", rad: 6, r: 245, g: 245, b: 130 },
    { id: "p1", kind: "rect", w: 10, h: 56, r: 120, g: 220, b: 160 },
    { id: "p2", kind: "rect", w: 10, h: 56, r: 220, g: 140, b: 120 }
  ];
}

function initState() {
  return {
    showNet: 1,
    playerSlots: 1,
    entities: {
      ball: { x: 240, y: 135 },
      p1: { x: 18, y: 135 },
      p2: { x: 462, y: 135 }
    },
    vx: 0.16,
    vy: 0.10,
    score1: 0,
    score2: 0,
    p2Human: 0
  };
}

function readPlayerInput(props, index) {
  const input = props.input;
  let up = false;
  let down = false;
  if (index == 0) {
    up = props.up;
    down = props.down;
  }
  if (input) {
    if (input.players[index]) {
      up = input.players[index].up;
      down = input.players[index].down;
    }
  }
  return { up: up, down: down };
}

function p2WantsHuman(p2up, p2down) {
  if (p2up || p2down) {
    return 1;
  }
  return 0;
}

function tryLeftPaddleBounce(prevBx, bx, by, p1y, vx) {
  const paddleL = 18;
  const paddleR = 28;
  const half = 34;
  if (vx >= 0) {
    return { bx: bx, vx: vx, hit: false };
  }
  if (by <= p1y - half) {
    return { bx: bx, vx: vx, hit: false };
  }
  if (by >= p1y + half) {
    return { bx: bx, vx: vx, hit: false };
  }
  if (prevBx > paddleR) {
    if (bx <= paddleR) {
      return { bx: paddleR, vx: 0 - vx, hit: true };
    }
  }
  if (bx <= paddleR) {
    if (bx >= paddleL) {
      if (prevBx >= bx) {
        return { bx: paddleR, vx: 0 - vx, hit: true };
      }
    }
  }
  return { bx: bx, vx: vx, hit: false };
}

function tryRightPaddleBounce(prevBx, bx, by, p2y, vx) {
  const paddleL = 462;
  const paddleR = 472;
  const half = 34;
  if (vx <= 0) {
    return { bx: bx, vx: vx, hit: false };
  }
  if (by <= p2y - half) {
    return { bx: bx, vx: vx, hit: false };
  }
  if (by >= p2y + half) {
    return { bx: bx, vx: vx, hit: false };
  }
  if (prevBx < paddleL) {
    if (bx >= paddleL) {
      return { bx: paddleL, vx: 0 - vx, hit: true };
    }
  }
  if (bx >= paddleL) {
    if (bx <= paddleR) {
      if (prevBx <= bx) {
        return { bx: paddleL, vx: 0 - vx, hit: true };
      }
    }
  }
  return { bx: bx, vx: vx, hit: false };
}

function update(props) {
  const s = props.state;
  const dt = props.dt;
  const events = [];
  const p1 = readPlayerInput(props, 0);
  const p2 = readPlayerInput(props, 1);

  let p2Human = s.p2Human;
  if (p2Human == 0) {
    p2Human = p2WantsHuman(p2.up, p2.down);
  }

  let playerSlots = 1;
  if (p2Human == 1) {
    playerSlots = 2;
  }

  // Solo vs CPU: one gamepad on the P2 mapping slot steers the left paddle
  // until a second player takes the right side (playerSlots becomes 2).
  let p1up = p1.up;
  let p1down = p1.down;
  if (playerSlots == 1) {
    if ((p1up == false) && (p1down == false)) {
      if (p2.up) { p1up = true; }
      if (p2.down) { p1down = true; }
    }
  }

  let bx = s.entities.ball.x + s.vx * dt;
  let by = s.entities.ball.y + s.vy * dt;
  const prevBx = s.entities.ball.x;
  let vx = s.vx;
  let vy = s.vy;
  let s1 = s.score1;
  let s2 = s.score2;

  if (by < 6) { by = 6; vy = 0 - vy; events.push(soundEvent("wall")); }
  if (by > 264) { by = 264; vy = 0 - vy; events.push(soundEvent("wall")); }

  let p1y = s.entities.p1.y;
  if (p1up) { p1y = p1y - dt * 0.30; }
  if (p1down) { p1y = p1y + dt * 0.30; }
  if (p1y < 28) { p1y = 28; }
  if (p1y > 242) { p1y = 242; }

  let p2y = s.entities.p2.y;
  if (p2Human == 1) {
    if (p2.up) { p2y = p2y - dt * 0.30; }
    if (p2.down) { p2y = p2y + dt * 0.30; }
  } else {
    if (p2y < by) { p2y = p2y + dt * 0.22; }
    if (p2y > by) { p2y = p2y - dt * 0.22; }
  }
  if (p2y < 28) { p2y = 28; }
  if (p2y > 242) { p2y = 242; }

  const leftHit = tryLeftPaddleBounce(prevBx, bx, by, p1y, vx);
  bx = leftHit.bx;
  vx = leftHit.vx;
  if (leftHit.hit) {
    events.push(soundEvent("bounce"));
  }

  const rightHit = tryRightPaddleBounce(prevBx, bx, by, p2y, vx);
  bx = rightHit.bx;
  vx = rightHit.vx;
  if (rightHit.hit) {
    events.push(soundEvent("bounce"));
  }

  if (bx < 0) { s2 = s2 + 1; bx = 240; by = 135; vx = 0.16; events.push(soundEvent("lose")); }
  if (bx > 480) { s1 = s1 + 1; bx = 240; by = 135; vx = 0 - 0.16; events.push(soundEvent("lose")); }

  return {
    showNet: 1,
    playerSlots: playerSlots,
    entities: {
      ball: { x: bx, y: by },
      p1: { x: 18, y: p1y },
      p2: { x: 462, y: p2y }
    },
    vx: vx,
    vy: vy,
    score1: s1,
    score2: s2,
    p2Human: p2Human,
    events: events
  };
}
