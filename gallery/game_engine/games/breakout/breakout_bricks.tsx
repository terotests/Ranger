/// <reference path="./game.d.ts" />
//
// Shared Breakout brick layout + sprite helpers.
// Imported by breakout.game.tsx to demonstrate relative `import` support.

export const COLS = 10;
export const ROWS = 5;
export const BRICK_COUNT = COLS * ROWS;
export const BRICK_W = 40;
export const BRICK_H = 12;
export const BRICK_GAP = 4;
export const BRICK_TOP = 52;
export const BRICK_LEFT = 40;

export const BRICK_COLORS: RgbColor[] = [
  { r: 220, g: 80, b: 90 },
  { r: 255, g: 150, b: 60 },
  { r: 255, g: 220, b: 80 },
  { r: 120, g: 220, b: 140 },
  { r: 90, g: 170, b: 255 }
];

export function brickId(i: number): string {
  return "b" + i;
}

export function brickCol(i: number): number {
  return i % COLS;
}

export function brickRow(i: number): number {
  return (i - brickCol(i)) / COLS;
}

export function brickX(i: number): number {
  const c = brickCol(i);
  return BRICK_LEFT + c * (BRICK_W + BRICK_GAP);
}

export function brickY(i: number): number {
  const r = brickRow(i);
  return BRICK_TOP + r * (BRICK_H + BRICK_GAP);
}

export function buildBrickSprites(): SpriteDef[] {
  const list: SpriteDef[] = [];
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

export function makeAlive(): number[] {
  const alive: number[] = [];
  let i = 0;
  while (i < BRICK_COUNT) {
    alive.push(1);
    i = i + 1;
  }
  return alive;
}

export function countAlive(alive: number[]): number {
  let n = 0;
  let i = 0;
  while (i < alive.length) {
    if (alive[i] == 1) {
      n = n + 1;
    }
    i = i + 1;
  }
  return n;
}

export function hitBrick(bx: number, by: number, i: number): number {
  const x = brickX(i);
  const y = brickY(i);
  if (bx < x - 4) {
    return 0;
  }
  if (bx > x + BRICK_W + 4) {
    return 0;
  }
  if (by < y - 4) {
    return 0;
  }
  if (by > y + BRICK_H + 4) {
    return 0;
  }
  return 1;
}

export function placeBricks(
  entities: Record<string, EntityPose>,
  alive: number[]
): void {
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
