/// <reference path="../../scripting/game.d.ts" />
//
// physics_race — host physics demo: engine drives motion, rotation, collisions.
// Split-screen: one shared physics world, per-pane camera (p1 / p2).
//

const VIEW_W = 480;
const VIEW_H = 270;
const WORLD_H = 3600;
const ROAD_W = 220;

function config() {
  return {
    world: { width: VIEW_W, height: WORLD_H },
    physics: { enabled: true, sharedWorld: true, fixedStep: 16.666 }
  };
}

function sprites() {
  return [
    { id: "car", kind: "rect", w: 18, h: 28, r: 70, g: 170, b: 255 },
    { id: "car2", kind: "rect", w: 18, h: 28, r: 255, g: 120, b: 90 },
    { id: "cone", kind: "circle", rad: 8, r: 255, g: 160, b: 40 }
  ];
}

function entities() {
  return [
    {
      id: "p1",
      sprite: "car",
      position: { x: VIEW_W / 2 - 30, y: WORLD_H - 120 },
      angle: 0,
      collision: { w: 18, h: 28 }
    },
    {
      id: "p2",
      sprite: "car2",
      position: { x: VIEW_W / 2 + 30, y: WORLD_H - 120 },
      angle: 0,
      collision: { w: 18, h: 28 }
    },
    { id: "c0", sprite: "cone", position: { x: 180, y: WORLD_H - 420 } },
    { id: "c1", sprite: "cone", position: { x: 300, y: WORLD_H - 780 } },
    { id: "c2", sprite: "cone", position: { x: 200, y: WORLD_H - 1140 } }
  ];
}

function camera() {
  if (paneIndex === 1) {
    return {
      follow: "p2",
      mode: "vertical",
      offsetY: -60,
      smoothing: 0.14,
      bounds: { x: 0, y: 0, w: VIEW_W, h: WORLD_H }
    };
  }
  return {
    follow: "p1",
    mode: "vertical",
    offsetY: -60,
    smoothing: 0.14,
    bounds: { x: 0, y: 0, w: VIEW_W, h: WORLD_H }
  };
}

function staticLevelHeight() {
  return WORLD_H;
}

function roadCenterX(progress) {
  const mid = VIEW_W / 2;
  return mid + Math.sin(progress * 0.0018) * 90 + Math.sin(progress * 0.0007 + 1.1) * 40;
}

function createStaticBg() {
  bgClear(28, 48, 32);
  let y = 0;
  while (y < WORLD_H) {
    const cx = roadCenterX(WORLD_H - y);
    const left = cx - ROAD_W / 2;
    const right = cx + ROAD_W / 2;
    bgFillRect(0, y, left, 8, 18, 32, 22);
    bgFillRect(left, y, ROAD_W, 8, 52, 58, 64);
    bgFillRect(right, y, VIEW_W - right, 8, 18, 32, 22);
    if (y % 80 === 0) {
      bgFillRect(cx - 2, y, 4, 24, 240, 220, 80);
    }
    y = y + 8;
  }
}

function physicsBounds() {
  const bounds = [];
  const step = 120;
  let y = 0;
  while (y < WORLD_H) {
    const cx = roadCenterX(y);
    const left = cx - ROAD_W / 2;
    const right = cx + ROAD_W / 2;
    const y2 = y + step;
    const cx2 = roadCenterX(y2);
    const left2 = cx2 - ROAD_W / 2;
    const right2 = cx2 + ROAD_W / 2;
    bounds.push({
      kind: "segment",
      id: "left-" + y,
      x1: left,
      y1: y,
      x2: left2,
      y2: y2,
      restitution: 0.25,
      spinOnHit: 260
    });
    bounds.push({
      kind: "segment",
      id: "right-" + y,
      x1: right,
      y1: y,
      x2: right2,
      y2: y2,
      restitution: 0.25,
      spinOnHit: 260
    });
    y = y + step;
  }
  bounds.push({
    kind: "rect",
    id: "world",
    x: 0,
    y: 0,
    w: VIEW_W,
    h: WORLD_H,
    restitution: 0.2,
    spinOnHit: 300
  });
  return bounds;
}

function initState() {
  return {
    score: 0,
    playerSlots: 2,
    hits: 0
  };
}

function driveInput(btn) {
  let steer = 0;
  let throttle = 0;
  let brake = 0;
  let turnLeft = 0;
  let turnRight = 0;
  if (btn.left) {
    steer = -1;
    turnLeft = 130;
  }
  if (btn.right) {
    steer = 1;
    turnRight = 130;
  }
  if (btn.up) {
    throttle = 1;
  }
  if (btn.down) {
    brake = 1;
  }
  return { steer: steer, throttle: throttle, brake: brake, turnLeft: turnLeft, turnRight: turnRight };
}

function update(props) {
  const s = props.state;
  const inp = props.input;
  const events = [];
  let hits = s.hits;
  let score = s.score;

  const p1Btn =
    inp && inp.players && inp.players[0]
      ? inp.players[0]
      : {
          up: props.up,
          down: props.down,
          left: props.left,
          right: props.right
        };
  const p2Btn =
    inp && inp.players && inp.players[1]
      ? inp.players[1]
      : { up: false, down: false, left: false, right: false };

  const physicsInput = {
    p1: driveInput(p1Btn),
    p2: driveInput(p2Btn)
  };

  const prevEvents = s.events;
  if (prevEvents) {
    let ei = 0;
    while (ei < prevEvents.length) {
      const ev = prevEvents[ei];
      if (ev.kind === "collision") {
        hits = hits + 1;
        events.push({ kind: "playSound", id: "wall" });
        if (ev.impact > 120) {
          events.push({
            kind: "particles",
            id: "sparkle",
            x: ev.x,
            y: ev.y,
            amount: 8
          });
        }
      }
      ei = ei + 1;
    }
  }

  const we = s.worldEntities;
  if (we && we.p1 && we.p1.y < 120) {
    score = score + 1000;
  }

  return {
    score: score,
    playerSlots: 2,
    hits: hits,
    physicsInput: physicsInput,
    events: events
  };
}

function hud(props) {
  const s = props.state;
  const we = s.worldEntities;
  let spd = 0;
  if (we && we.p1 && we.p1.speed != null) {
    spd = we.p1.speed;
  }
  return (
    <View flexDirection="row" padding="6px" width="100%">
      <Label color="#8fd3ff">SPD </Label>
      <Label color="#ffffff">{Math.round(spd)}</Label>
      <Label color="#6a7a9a">  hits={s.hits}</Label>
      <Label color="#ffd080">  Y={we && we.p1 ? we.p1.y : 0}</Label>
    </View>
  );
}
