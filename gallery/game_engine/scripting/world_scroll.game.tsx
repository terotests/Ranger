/// <reference path="./game.d.ts" />
//
// world_scroll.game.tsx — Phase 1 demo: entities(), camera(), worldEntities.
// No placeEntities(); the engine applies camera offset and culling.
//

const WORLD_H = 810;
const VIEW_W = 480;
const VIEW_H = 270;

function config() {
  return {
    world: { width: VIEW_W, height: WORLD_H },
    physics: { fixedStep: 16.666 }
  };
}

function sprites() {
  return [
    { id: "hero", kind: "circle", rad: 10, r: 120, g: 220, b: 160 },
    { id: "gem", kind: "rect", w: 12, h: 12, r: 255, g: 210, b: 80 }
  ];
}

function entities() {
  return [
    {
      id: "player",
      sprite: "hero",
      position: { x: 240, y: WORLD_H - 80 },
      tags: ["player"]
    },
    { id: "g0", sprite: "gem", position: { x: 120, y: WORLD_H - 200 } },
    { id: "g1", sprite: "gem", position: { x: 360, y: WORLD_H - 360 } },
    { id: "g2", sprite: "gem", position: { x: 200, y: WORLD_H - 520 } },
    { id: "g3", sprite: "gem", position: { x: 300, y: WORLD_H - 680 } }
  ];
}

function camera() {
  return {
    follow: "player",
    mode: "vertical",
    offsetY: -40,
    smoothing: 0.18,
    bounds: { x: 0, y: 0, w: VIEW_W, h: WORLD_H }
  };
}

function staticLevelHeight() {
  return WORLD_H;
}

function createStaticBg() {
  bgClear(24, 32, 58);
  let y = 40;
  while (y < WORLD_H) {
    const shade = y % 80 === 0 ? 48 : 36;
    bgFillRect(0, y, VIEW_W, 40, shade, shade + 8, shade + 20);
    y = y + 40;
  }
}

function initState() {
  return {
    score: 0,
    playerSlots: 1,
    vy: 0
  };
}

function update(props) {
  const s = props.state;
  const dt = props.dt;
  const we = s.worldEntities;
  const p = we.player;
  let px = p.x;
  let py = p.y;
  let vy = s.vy + 0.00045 * dt;
  py = py + vy * dt;

  if (props.left) {
    px = px - dt * 0.22;
  }
  if (props.right) {
    px = px + dt * 0.22;
  }
  if (px < 20) {
    px = 20;
  }
  if (px > VIEW_W - 20) {
    px = VIEW_W - 20;
  }

  const floorY = WORLD_H - 60;
  if (py >= floorY) {
    py = floorY;
    vy = 0;
    if (props.action) {
      vy = -0.38;
    }
  }

  const nextWe = {};
  const keys = ["player", "g0", "g1", "g2", "g3"];
  let ki = 0;
  while (ki < keys.length) {
    const id = keys[ki];
    const src = we[id];
    let nx = src.x;
    let ny = src.y;
    let vis = src.visible == null ? 1 : src.visible;
    if (id === "player") {
      nx = px;
      ny = py;
    }
    nextWe[id] = { x: nx, y: ny, visible: vis };
    ki = ki + 1;
  }

  let score = s.score;
  const collectR = 18;
  let gi = 0;
  while (gi < 4) {
    const gid = "g" + gi;
    const g = nextWe[gid];
    if (g.visible !== 0) {
      const dx = px - g.x;
      const dy = py - g.y;
      if (dx * dx + dy * dy < collectR * collectR) {
        nextWe[gid] = { x: g.x, y: g.y, visible: 0 };
        score = score + 100;
      }
    }
    gi = gi + 1;
  }

  return {
    score: score,
    playerSlots: 1,
    vy: vy,
    worldEntities: nextWe
  };
}

function hud(props) {
  const s = props.state;
  return (
    <View flexDirection="row" padding="6px" width="100%">
      <Label color="#8fd3ff">GEMS </Label>
      <Label color="#ffffff">{s.score / 100}</Label>
      <Label color="#6a7a9a">  camY={s.cameraY}</Label>
    </View>
  );
}
