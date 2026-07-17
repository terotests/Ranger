// cannon_stack — PoC for the upgraded Cannon engine, driven through the real
// TSX bridge (game_cannon_physics.rgr). Three balls dropped in a column settle
// into a stable stack on the floor — the SPOOK solver holds it; the old arcade
// clamp collapsed it.
/// <reference path="../../scripting/game.d.ts" />

const BALL_R = 14;

function config() {
  return {
    world: { width: 480, height: 270 },
    physics: { enabled: true, cannon: true, gravityY: 300, restitution: 0.05, debug: true },
  };
}

function sprites() {
  return [
    { id: "b0", kind: "circle", rad: BALL_R, r: 120, g: 200, b: 255 },
    { id: "b1", kind: "circle", rad: BALL_R, r: 255, g: 200, b: 120 },
    { id: "b2", kind: "circle", rad: BALL_R, r: 200, g: 255, b: 140 },
  ];
}

function entities() {
  return [
    { id: "b0", sprite: "b0", position: { x: 240, y: 60 },  physics: { radius: BALL_R, mass: 1, stable: true } },
    { id: "b1", sprite: "b1", position: { x: 240, y: 110 }, physics: { radius: BALL_R, mass: 1, stable: true } },
    { id: "b2", sprite: "b2", position: { x: 240, y: 160 }, physics: { radius: BALL_R, mass: 1, stable: true } },
  ];
}

function initState() {
  return { entities: {} };
}

function update(props) {
  return props.state;
}
