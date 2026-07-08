/// <reference path="./game.d.ts" />
//
// Host-bridge demo for the TS -> Ranger -> native pipeline.
//
// Exercises the engine bridge additions that are shared by BOTH the TS runtime
// (ComponentEngine + GameRunner) and the static-compiled path (emitter +
// NativeGameRunner):
//
//   * resources()  - declare engine resources once (image / sound / animated
//                    sprite). The host registers them into its resource tables.
//   * state.events - update() emits transient events each frame; the host drains
//                    them (play sound, spawn, custom). Reducer-friendly: events
//                    are plain data, so the identical contract works statically.
//   * custom scalar state fields (t) - routed to the generic numbers map.
//
// Run (native):  npm run engine:game-sdl:run  (see runner)
//
// This is a demo game; it is not wired to any existing runner by default.

function resources() {
  return [
    { kind: "image", id: "bg", path: "space.png" },
    { kind: "sound", id: "blip", path: "blip.wav" },
    { kind: "sprite", id: "star", px: 2, frameCount: 3 }
  ];
}

function sprites() {
  return [
    { id: "dot", kind: "circle", rad: 6, r: 255, g: 220, b: 80 }
  ];
}

function initState() {
  return {
    entities: {
      dot: { x: 20, y: 120 }
    },
    t: 0,
    score1: 0
  };
}

function update(props) {
  const s = props.state;
  const dt = props.dt;
  let t = s.t + 1;
  let x = 20 + t * 2;
  return {
    entities: {
      dot: { x: x, y: 120 }
    },
    t: t,
    score1: 0,
    events: [
      { kind: "tick", id: "dot", amount: 1 },
      { kind: "playSound", id: "blip" }
    ]
  };
}
