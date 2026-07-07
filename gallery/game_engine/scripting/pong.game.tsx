/// <reference path="./game.d.ts" />
//
// Scripted Pong for the Ranger GameRunner.
//
// The runtime is retained-mode:
//   * sprites()   - runs ONCE, defines the on-screen objects (ball + paddles).
//                   The runner creates a GameEntity per sprite; their shapes are
//                   never rebuilt, only moved.
//   * initState() - the initial game state (entity positions + velocity + score).
//   * update()    - runs each frame with { time, dt, up, down, state } and
//                   returns the NEXT state (pure reducer). The runner applies
//                   state.entities[id] = {x,y} to the retained sprites.
//
// Coordinates are in pixels of a 480x270 buffer. Motion is time-based (uses dt),
// so it is framerate-independent.

function sprites() {
  return [
    { id: "ball", kind: "circle", rad: 6, r: 245, g: 245, b: 130 },
    { id: "p1", kind: "rect", w: 10, h: 56, r: 120, g: 220, b: 160 },
    { id: "p2", kind: "rect", w: 10, h: 56, r: 220, g: 140, b: 120 }
  ];
}

function initState() {
  return {
    entities: {
      ball: { x: 240, y: 135 },
      p1: { x: 18, y: 135 },
      p2: { x: 462, y: 135 }
    },
    vx: 0.16,
    vy: 0.10,
    score1: 0,
    score2: 0
  };
}

function update(props) {
  const s = props.state;
  const dt = props.dt;

  let bx = s.entities.ball.x + s.vx * dt;
  let by = s.entities.ball.y + s.vy * dt;
  let vx = s.vx;
  let vy = s.vy;
  let s1 = s.score1;
  let s2 = s.score2;

  // top / bottom walls
  if (by < 6) { by = 6; vy = 0 - vy; }
  if (by > 264) { by = 264; vy = 0 - vy; }

  // player paddle (left) driven by input
  let p1y = s.entities.p1.y;
  if (props.up) { p1y = p1y - dt * 0.30; }
  if (props.down) { p1y = p1y + dt * 0.30; }
  if (p1y < 28) { p1y = 28; }
  if (p1y > 242) { p1y = 242; }

  // cpu paddle (right) tracks the ball
  let p2y = s.entities.p2.y;
  if (p2y < by) { p2y = p2y + dt * 0.22; }
  if (p2y > by) { p2y = p2y - dt * 0.22; }
  if (p2y < 28) { p2y = 28; }
  if (p2y > 242) { p2y = 242; }

  // paddle bounces
  if (bx < 24) {
    if (by > p1y - 34) {
      if (by < p1y + 34) { bx = 24; vx = 0 - vx; }
    }
  }
  if (bx > 456) {
    if (by > p2y - 34) {
      if (by < p2y + 34) { bx = 456; vx = 0 - vx; }
    }
  }

  // scoring + serve
  if (bx < 0) { s2 = s2 + 1; bx = 240; by = 135; vx = 0.16; }
  if (bx > 480) { s1 = s1 + 1; bx = 240; by = 135; vx = 0 - 0.16; }

  return {
    entities: {
      ball: { x: bx, y: by },
      p1: { x: 18, y: p1y },
      p2: { x: 462, y: p2y }
    },
    vx: vx,
    vy: vy,
    score1: s1,
    score2: s2
  };
}
