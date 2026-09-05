/// <reference path="../../scripting/game.d.ts" />
//
// LittleCiv — turn-based civ demo with a large world + LPC units.
// Genre inspiration: Civilization / Freeciv. LPC art: Universal LPC (see assets/).
//
// Run: npm run engine:game-sdl:run:littleciv

import { soundEvent } from "game_helpers";

const COLS = 48;
const ROWS = 30;
const VIEW_COLS = 16;
const VIEW_ROWS = 10;
const TILE = 24;
const ORIGIN_X = 8;
const ORIGIN_Y = 34;
const MAX_CITIES = 6;
const MAX_UNITS = 12;
const TILE_SPRITES = VIEW_COLS * VIEW_ROWS;

const OWNER_PLAYER = 0;
const OWNER_AI = 1;
const KIND_SETTLER = 0;
const KIND_WARRIOR = 1;

const SIGHT_CITY = 2;
const SIGHT_SETTLER = 2;
const SIGHT_WARRIOR = 3;

// Slot bands so each unit id keeps a fixed LPC sheet path (sprites() is once).
// 0..2 player settler, 3..5 player warrior, 6..8 AI settler, 9..11 AI warrior.
const SLOT_P_SETTLER0 = 0;
const SLOT_P_WARRIOR0 = 3;
const SLOT_AI_SETTLER0 = 6;
const SLOT_AI_WARRIOR0 = 9;

function screens() {
  return ["splash", "play", "win", "lose"];
}

function nextSeed(seed) {
  return (seed * 1103515245 + 12345) % 2147483647;
}

function absVal(n) {
  if (n < 0) { return 0 - n; }
  return n;
}

function manh(c0, r0, c1, r1) {
  return absVal(c0 - c1) + absVal(r0 - r1);
}

function cheby(c0, r0, c1, r1) {
  const dc = absVal(c0 - c1);
  const dr = absVal(r0 - r1);
  if (dc > dr) { return dc; }
  return dr;
}

function buildWorld(seed) {
  const cells = [];
  let i = 0;
  while (i < COLS * ROWS) {
    cells.push("~");
    i = i + 1;
  }

  let s = seed;
  // A few landmass blobs so the map isn't a tiny island.
  const blobs = [
    { c: 10, r: 10, rad: 7 },
    { c: 14, r: 18, rad: 5 },
    { c: 36, r: 12, rad: 7 },
    { c: 32, r: 20, rad: 5 },
    { c: 24, r: 8, rad: 4 },
    { c: 22, r: 22, rad: 4 }
  ];
  let b = 0;
  while (b < blobs.length) {
    const bl = blobs[b];
    let r = 0;
    while (r < ROWS) {
      let c = 0;
      while (c < COLS) {
        const d = cheby(c, r, bl.c, bl.r);
        if (d <= bl.rad) {
          cells[r * COLS + c] = ".";
        }
        c = c + 1;
      }
      r = r + 1;
    }
    b = b + 1;
  }

  // Scatter forests / hills on land.
  i = 0;
  while (i < COLS * ROWS) {
    if (cells[i] == ".") {
      s = nextSeed(s);
      const roll = s % 100;
      if (roll < 18) { cells[i] = "f"; }
      if (roll >= 18) {
        if (roll < 28) { cells[i] = "h"; }
      }
    }
    i = i + 1;
  }

  // Soft ocean rim.
  let r = 0;
  while (r < ROWS) {
    let c = 0;
    while (c < COLS) {
      if (r == 0 || c == 0 || r == ROWS - 1 || c == COLS - 1) {
        cells[r * COLS + c] = "~";
      }
      c = c + 1;
    }
    r = r + 1;
  }

  const rows = [];
  r = 0;
  while (r < ROWS) {
    let line = "";
    let c = 0;
    while (c < COLS) {
      line = line + cells[r * COLS + c];
      c = c + 1;
    }
    rows.push(line);
    r = r + 1;
  }
  return rows;
}

const WORLD = buildWorld(424242);

function cellAt(col, row) {
  if (col < 0) { return "~"; }
  if (row < 0) { return "~"; }
  if (col >= COLS) { return "~"; }
  if (row >= ROWS) { return "~"; }
  return WORLD[row].substring(col, col + 1);
}

function isLand(col, row) {
  const c = cellAt(col, row);
  if (c == ".") { return 1; }
  if (c == "f") { return 1; }
  if (c == "h") { return 1; }
  return 0;
}

function canEnter(col, row) {
  return isLand(col, row);
}

function moveCost(col, row) {
  if (cellAt(col, row) == "h") { return 2; }
  return 1;
}

function terrainFrame(ch) {
  if (ch == "~") { return 0; }
  if (ch == ".") { return 1; }
  if (ch == "f") { return 2; }
  if (ch == "h") { return 3; }
  return 4;
}

function tileId(i) {
  return ("t" + i);
}

function unitId(i) {
  return ("u" + i);
}

function cityId(i) {
  return ("c" + i);
}

function cursorId() {
  return "cursor";
}

function aimId() {
  return "aim";
}

function selRingId() {
  return "selRing";
}

const SLIDE_MAX = 10;

// aim: -1 none, 0 up, 1 left, 2 down, 3 right (LPC face rows)
function aimDelta(aim) {
  if (aim == 0) { return { dc: 0, dr: -1 }; }
  if (aim == 1) { return { dc: -1, dr: 0 }; }
  if (aim == 2) { return { dc: 0, dr: 1 }; }
  if (aim == 3) { return { dc: 1, dr: 0 }; }
  return { dc: 0, dr: 0 };
}

function aimFromKeys(up, down, left, right) {
  if (up) { return 0; }
  if (left) { return 1; }
  if (down) { return 2; }
  if (right) { return 3; }
  return -1;
}

function tileCenterY(worldRow, camRow) {
  return ORIGIN_Y + (worldRow - camRow) * TILE + (TILE / 2);
}

function exploredIndex(col, row) {
  return row * COLS + col;
}

function isExplored(explored, col, row) {
  if (col < 0) { return 0; }
  if (row < 0) { return 0; }
  if (col >= COLS) { return 0; }
  if (row >= ROWS) { return 0; }
  if (explored[exploredIndex(col, row)] == 1) { return 1; }
  return 0;
}

function cloneExplored(explored) {
  const out = [];
  let i = 0;
  while (i < explored.length) {
    out.push(explored[i]);
    i = i + 1;
  }
  return out;
}

function blankExplored() {
  const out = [];
  let i = 0;
  while (i < COLS * ROWS) {
    out.push(0);
    i = i + 1;
  }
  return out;
}

function revealAround(explored, col, row, radius) {
  const out = cloneExplored(explored);
  let r = row - radius;
  while (r <= row + radius) {
    let c = col - radius;
    while (c <= col + radius) {
      if (c >= 0 && r >= 0 && c < COLS && r < ROWS) {
        if (cheby(col, row, c, r) <= radius) {
          out[exploredIndex(c, r)] = 1;
        }
      }
      c = c + 1;
    }
    r = r + 1;
  }
  return out;
}

function sightForUnit(kind) {
  if (kind == KIND_WARRIOR) { return SIGHT_WARRIOR; }
  return SIGHT_SETTLER;
}

function revealFromSide(explored, units, cities, owner) {
  let out = explored;
  let i = 0;
  while (i < cities.length) {
    const c = cities[i];
    if (c.alive == 1 && c.owner == owner) {
      out = revealAround(out, c.col, c.row, SIGHT_CITY);
    }
    i = i + 1;
  }
  i = 0;
  while (i < units.length) {
    const u = units[i];
    if (u.alive == 1 && u.owner == owner) {
      out = revealAround(out, u.col, u.row, sightForUnit(u.kind));
    }
    i = i + 1;
  }
  return out;
}

function inSightOfPlayer(col, row, units, cities) {
  let i = 0;
  while (i < cities.length) {
    const c = cities[i];
    if (c.alive == 1 && c.owner == OWNER_PLAYER) {
      if (cheby(col, row, c.col, c.row) <= SIGHT_CITY) { return 1; }
    }
    i = i + 1;
  }
  i = 0;
  while (i < units.length) {
    const u = units[i];
    if (u.alive == 1 && u.owner == OWNER_PLAYER) {
      if (cheby(col, row, u.col, u.row) <= sightForUnit(u.kind)) { return 1; }
    }
    i = i + 1;
  }
  return 0;
}

function computeCam(focusCol, focusRow) {
  let camCol = focusCol - 8;
  let camRow = focusRow - 5;
  if (camCol < 0) { camCol = 0; }
  if (camRow < 0) { camRow = 0; }
  if (camCol > COLS - VIEW_COLS) { camCol = COLS - VIEW_COLS; }
  if (camRow > ROWS - VIEW_ROWS) { camRow = ROWS - VIEW_ROWS; }
  return { camCol: camCol, camRow: camRow };
}

function screenX(worldCol, camCol) {
  return ORIGIN_X + (worldCol - camCol) * TILE + (TILE / 2);
}

// LPC feet sit inside the tile (not on the grid line under it).
function screenFeetY(worldRow, camRow) {
  return ORIGIN_Y + (worldRow - camRow) * TILE + TILE - 6;
}

function tileTopY(worldRow, camRow) {
  return ORIGIN_Y + (worldRow - camRow) * TILE;
}

function inView(worldCol, worldRow, camCol, camRow) {
  if (worldCol < camCol) { return 0; }
  if (worldRow < camRow) { return 0; }
  if (worldCol >= camCol + VIEW_COLS) { return 0; }
  if (worldRow >= camRow + VIEW_ROWS) { return 0; }
  return 1;
}

function resources() {
  return [{ kind: "image", id: "chrome", path: "assets/chrome.png" }];
}

function backgroundImage() {
  return "chrome";
}

function tileSheet(id) {
  return {
    id: id,
    kind: "sheet",
    path: "assets/tiles.png",
    frameW: TILE,
    frameH: TILE,
    cols: 6,
    rows: 1,
    scale: 100,
    p0: 4,
    p1: 0
  };
}

function pieceSheet(id, p0, p1) {
  return {
    id: id,
    kind: "sheet",
    path: "assets/pieces.png",
    frameW: 32,
    frameH: 32,
    cols: 4,
    rows: 2,
    scale: 56,
    p0: p0,
    p1: p1
  };
}

function lpcSheet(id, path) {
  return {
    id: id,
    kind: "sheet",
    path: path,
    frameW: 64,
    frameH: 64,
    cols: 9,
    rows: 4,
    // ~32px tall so LPC detail reads on the 24px tile grid.
    scale: 50,
    feetTrim: 12,
    jumpFrame: 0,
    p0: 0,
    p1: 2
  };
}

function sprites() {
  const list = [];
  let i = 0;
  while (i < TILE_SPRITES) {
    list.push(tileSheet(tileId(i)));
    i = i + 1;
  }
  list.push(pieceSheet(cursorId(), 2, 1));
  i = 0;
  while (i < MAX_CITIES) {
    list.push(pieceSheet(cityId(i), 0, 0));
    i = i + 1;
  }
  // Fixed LPC path per slot band.
  i = 0;
  while (i < 3) {
    list.push(lpcSheet(unitId(SLOT_P_SETTLER0 + i), "assets/settler_p.png"));
    i = i + 1;
  }
  i = 0;
  while (i < 3) {
    list.push(lpcSheet(unitId(SLOT_P_WARRIOR0 + i), "assets/warrior_p.png"));
    i = i + 1;
  }
  i = 0;
  while (i < 3) {
    list.push(lpcSheet(unitId(SLOT_AI_SETTLER0 + i), "assets/settler_ai.png"));
    i = i + 1;
  }
  i = 0;
  while (i < 3) {
    list.push(lpcSheet(unitId(SLOT_AI_WARRIOR0 + i), "assets/warrior_ai.png"));
    i = i + 1;
  }
  // Draw order: highlights last so the yellow aim tile stays visible on top.
  list.push({ id: selRingId(), kind: "rect", w: TILE - 4, h: TILE - 4, r: 255, g: 255, b: 180 });
  list.push({ id: aimId(), kind: "rect", w: TILE - 2, h: TILE - 2, r: 255, g: 220, b: 40 });
  return list;
}

function emptyUnit() {
  return {
    alive: 0, owner: 0, kind: 0, col: 0, row: 0,
    moves: 0, maxMoves: 0, hp: 0, face: 2, frame: 0
  };
}

function emptyCity() {
  return {
    alive: 0, owner: 0, col: 0, row: 0,
    size: 1, food: 0, prod: 0, nameN: 0
  };
}

function makeUnit(owner, kind, col, row) {
  let maxMoves = 1;
  let hp = 1;
  if (kind == KIND_WARRIOR) {
    maxMoves = 2;
    hp = 2;
  }
  return {
    alive: 1, owner: owner, kind: kind, col: col, row: row,
    moves: maxMoves, maxMoves: maxMoves, hp: hp, face: 2, frame: 0
  };
}

function makeCity(owner, col, row, nameN) {
  return {
    alive: 1, owner: owner, col: col, row: row,
    size: 1, food: 0, prod: 0, nameN: nameN
  };
}

function cityName(owner, nameN) {
  if (owner == OWNER_PLAYER) {
    if (nameN == 0) { return "Helsinki"; }
    if (nameN == 1) { return "Turku"; }
    if (nameN == 2) { return "Tampere"; }
    return ("Town " + nameN);
  }
  if (nameN == 0) { return "Novgorod"; }
  if (nameN == 1) { return "Kiev"; }
  if (nameN == 2) { return "Minsk"; }
  return ("Camp " + nameN);
}

function cloneUnits(units) {
  const out = [];
  let i = 0;
  while (i < units.length) {
    const u = units[i];
    out.push({
      alive: u.alive, owner: u.owner, kind: u.kind,
      col: u.col, row: u.row, moves: u.moves, maxMoves: u.maxMoves,
      hp: u.hp, face: u.face, frame: u.frame
    });
    i = i + 1;
  }
  return out;
}

function cloneCities(cities) {
  const out = [];
  let i = 0;
  while (i < cities.length) {
    const c = cities[i];
    out.push({
      alive: c.alive, owner: c.owner, col: c.col, row: c.row,
      size: c.size, food: c.food, prod: c.prod, nameN: c.nameN
    });
    i = i + 1;
  }
  return out;
}

function countAlive(list) {
  let n = 0;
  let i = 0;
  while (i < list.length) {
    if (list[i].alive == 1) { n = n + 1; }
    i = i + 1;
  }
  return n;
}

function countOwnerCities(cities, owner) {
  let n = 0;
  let i = 0;
  while (i < cities.length) {
    if (cities[i].alive == 1 && cities[i].owner == owner) { n = n + 1; }
    i = i + 1;
  }
  return n;
}

function findUnitAt(units, col, row, ownerOrNeg) {
  let i = 0;
  while (i < units.length) {
    const u = units[i];
    if (u.alive == 1 && u.col == col && u.row == row) {
      if (ownerOrNeg < 0) { return i; }
      if (u.owner == ownerOrNeg) { return i; }
    }
    i = i + 1;
  }
  return -1;
}

function findEnemyUnitAt(units, col, row, myOwner) {
  let i = 0;
  while (i < units.length) {
    const u = units[i];
    if (u.alive == 1 && u.col == col && u.row == row && u.owner != myOwner) {
      return i;
    }
    i = i + 1;
  }
  return -1;
}

function findCityAt(cities, col, row) {
  let i = 0;
  while (i < cities.length) {
    const c = cities[i];
    if (c.alive == 1 && c.col == col && c.row == row) { return i; }
    i = i + 1;
  }
  return -1;
}

function slotBand(owner, kind) {
  if (owner == OWNER_PLAYER) {
    if (kind == KIND_SETTLER) { return { lo: SLOT_P_SETTLER0, hi: SLOT_P_SETTLER0 + 3 }; }
    return { lo: SLOT_P_WARRIOR0, hi: SLOT_P_WARRIOR0 + 3 };
  }
  if (kind == KIND_SETTLER) { return { lo: SLOT_AI_SETTLER0, hi: SLOT_AI_SETTLER0 + 3 }; }
  return { lo: SLOT_AI_WARRIOR0, hi: SLOT_AI_WARRIOR0 + 3 };
}

function firstFreeSlotFor(units, owner, kind) {
  const band = slotBand(owner, kind);
  let i = band.lo;
  while (i < band.hi) {
    if (units[i].alive == 0) { return i; }
    i = i + 1;
  }
  return -1;
}

function firstFreeCitySlot(cities) {
  let i = 0;
  while (i < cities.length) {
    if (cities[i].alive == 0) { return i; }
    i = i + 1;
  }
  return -1;
}

function refreshMoves(units, owner) {
  const out = cloneUnits(units);
  let i = 0;
  while (i < out.length) {
    if (out[i].alive == 1 && out[i].owner == owner) {
      out[i].moves = out[i].maxMoves;
    }
    i = i + 1;
  }
  return out;
}

function nearestEnemyCity(cities, col, row, myOwner) {
  let best = -1;
  let bestD = 9999;
  let i = 0;
  while (i < cities.length) {
    const c = cities[i];
    if (c.alive == 1 && c.owner != myOwner) {
      const d = manh(col, row, c.col, c.row);
      if (d < bestD) { bestD = d; best = i; }
    }
    i = i + 1;
  }
  return best;
}

function nearestOwnCity(cities, col, row, owner) {
  let best = -1;
  let bestD = 9999;
  let i = 0;
  while (i < cities.length) {
    const c = cities[i];
    if (c.alive == 1 && c.owner == owner) {
      const d = manh(col, row, c.col, c.row);
      if (d < bestD) { bestD = d; best = i; }
    }
    i = i + 1;
  }
  return best;
}

function spawnNear(units, cities, owner, kind, col, row) {
  const dirs = [
    { dc: 0, dr: 0 }, { dc: 1, dr: 0 }, { dc: -1, dr: 0 },
    { dc: 0, dr: 1 }, { dc: 0, dr: -1 }, { dc: 1, dr: 1 },
    { dc: -1, dr: 1 }, { dc: 1, dr: -1 }, { dc: -1, dr: -1 }
  ];
  const out = cloneUnits(units);
  const slot = firstFreeSlotFor(out, owner, kind);
  if (slot < 0) { return out; }
  let di = 0;
  while (di < dirs.length) {
    const nc = col + dirs[di].dc;
    const nr = row + dirs[di].dr;
    if (canEnter(nc, nr) == 1) {
      if (findUnitAt(out, nc, nr, -1) < 0) {
        out[slot] = makeUnit(owner, kind, nc, nr);
        out[slot].moves = 0;
        return out;
      }
    }
    di = di + 1;
  }
  return out;
}

function growCities(cities, units, owner, seed) {
  let outC = cloneCities(cities);
  let outU = cloneUnits(units);
  let s = seed;
  let i = 0;
  while (i < outC.length) {
    const c = outC[i];
    if (c.alive == 1 && c.owner == owner) {
      const tile = cellAt(c.col, c.row);
      let foodGain = 2;
      let prodGain = 1;
      if (tile == "f") { foodGain = 3; }
      if (tile == "h") { prodGain = 2; }
      c.food = c.food + foodGain;
      c.prod = c.prod + prodGain + c.size;
      if (c.food >= 8 + c.size * 2) {
        c.food = 0;
        if (c.size < 5) { c.size = c.size + 1; }
      }
      if (c.prod >= 12 && c.size >= 2) {
        const before = countAlive(outU);
        outU = spawnNear(outU, outC, owner, KIND_SETTLER, c.col, c.row);
        if (countAlive(outU) > before) { c.prod = 0; s = nextSeed(s); }
      } else {
        if (c.prod >= 6) {
          const before2 = countAlive(outU);
          outU = spawnNear(outU, outC, owner, KIND_WARRIOR, c.col, c.row);
          if (countAlive(outU) > before2) { c.prod = c.prod - 6; s = nextSeed(s); }
        }
      }
      outC[i] = c;
    }
    i = i + 1;
  }
  return { cities: outC, units: outU, seed: s };
}

function tryFoundCity(units, cities, unitIndex, nextNameN) {
  const u = units[unitIndex];
  if (u.alive == 0) { return { ok: 0, units: units, cities: cities, nameN: nextNameN }; }
  if (u.kind != KIND_SETTLER) { return { ok: 0, units: units, cities: cities, nameN: nextNameN }; }
  if (isLand(u.col, u.row) == 0) { return { ok: 0, units: units, cities: cities, nameN: nextNameN }; }
  if (findCityAt(cities, u.col, u.row) >= 0) {
    return { ok: 0, units: units, cities: cities, nameN: nextNameN };
  }
  const slot = firstFreeCitySlot(cities);
  if (slot < 0) { return { ok: 0, units: units, cities: cities, nameN: nextNameN }; }
  const outU = cloneUnits(units);
  const outC = cloneCities(cities);
  outC[slot] = makeCity(u.owner, u.col, u.row, nextNameN);
  outU[unitIndex].alive = 0;
  return { ok: 1, units: outU, cities: outC, nameN: nextNameN + 1 };
}

function resolveCombat(units, cities, atkIndex, defIndex, seed) {
  const outU = cloneUnits(units);
  const outC = cloneCities(cities);
  let s = nextSeed(seed);
  const atk = outU[atkIndex];
  const def = outU[defIndex];
  let atkPower = 1 + atk.hp;
  let defPower = 1 + def.hp;
  if (atk.kind == KIND_WARRIOR) { atkPower = atkPower + 2; }
  if (def.kind == KIND_WARRIOR) { defPower = defPower + 2; }
  const ci = findCityAt(outC, def.col, def.row);
  if (ci >= 0 && outC[ci].owner == def.owner) {
    defPower = defPower + 1 + outC[ci].size;
  }
  s = nextSeed(s);
  const roll = s % (atkPower + defPower);
  if (roll < atkPower) {
    const tc = def.col;
    const tr = def.row;
    outU[defIndex].alive = 0;
    outU[atkIndex].col = tc;
    outU[atkIndex].row = tr;
    outU[atkIndex].moves = 0;
    if (ci >= 0 && outC[ci].owner != atk.owner) {
      outC[ci].owner = atk.owner;
      outC[ci].prod = 0;
    }
    return { units: outU, cities: outC, seed: s, won: 1 };
  }
  outU[atkIndex].alive = 0;
  return { units: outU, cities: outC, seed: s, won: 0 };
}

function captureEmptyCity(units, cities, unitIndex) {
  const u = units[unitIndex];
  const ci = findCityAt(cities, u.col, u.row);
  if (ci < 0) { return cities; }
  if (cities[ci].owner == u.owner) { return cities; }
  if (findUnitAt(units, u.col, u.row, cities[ci].owner) >= 0) { return cities; }
  const outC = cloneCities(cities);
  outC[ci].owner = u.owner;
  outC[ci].prod = 0;
  return outC;
}

function faceFromDelta(dc, dr) {
  if (dr < 0) { return 0; }
  if (dc > 0) { return 3; }
  if (dr > 0) { return 2; }
  return 1;
}

function tryMoveUnit(units, cities, unitIndex, dc, dr, seed) {
  const u = units[unitIndex];
  if (u.alive == 0 || u.moves <= 0) {
    return { ok: 0, units: units, cities: cities, seed: seed, fought: 0, won: 0 };
  }
  const nc = u.col + dc;
  const nr = u.row + dr;
  if (canEnter(nc, nr) == 0) {
    return { ok: 0, units: units, cities: cities, seed: seed, fought: 0, won: 0 };
  }
  const cost = moveCost(nc, nr);
  if (u.moves < cost) {
    return { ok: 0, units: units, cities: cities, seed: seed, fought: 0, won: 0 };
  }
  if (findUnitAt(units, nc, nr, u.owner) >= 0) {
    return { ok: 0, units: units, cities: cities, seed: seed, fought: 0, won: 0 };
  }
  const enemy = findEnemyUnitAt(units, nc, nr, u.owner);
  if (enemy >= 0) {
    if (u.kind == KIND_SETTLER) {
      return { ok: 0, units: units, cities: cities, seed: seed, fought: 0, won: 0 };
    }
    const fight = resolveCombat(units, cities, unitIndex, enemy, seed);
    const outU = fight.units;
    if (outU[unitIndex].alive == 1) {
      outU[unitIndex].face = faceFromDelta(dc, dr);
      outU[unitIndex].frame = (outU[unitIndex].frame + 1) % 9;
    }
    return {
      ok: 1, units: outU, cities: fight.cities, seed: fight.seed,
      fought: 1, won: fight.won
    };
  }
  const outU = cloneUnits(units);
  outU[unitIndex].col = nc;
  outU[unitIndex].row = nr;
  outU[unitIndex].moves = u.moves - cost;
  outU[unitIndex].face = faceFromDelta(dc, dr);
  outU[unitIndex].frame = (u.frame + 1) % 9;
  const outC = captureEmptyCity(outU, cities, unitIndex);
  return { ok: 1, units: outU, cities: outC, seed: seed, fought: 0, won: 0 };
}

function firstMovableUnit(units, owner, startAt) {
  const n = units.length;
  let i = 0;
  while (i < n) {
    const idx = (startAt + i) % n;
    const u = units[idx];
    if (u.alive == 1 && u.owner == owner && u.moves > 0) { return idx; }
    i = i + 1;
  }
  i = 0;
  while (i < n) {
    const idx2 = (startAt + i) % n;
    const u2 = units[idx2];
    if (u2.alive == 1 && u2.owner == owner) { return idx2; }
    i = i + 1;
  }
  return -1;
}

function stepToward(units, cities, unitIndex, tc, tr, seed) {
  const u = units[unitIndex];
  let bestDc = 0;
  let bestDr = 0;
  let bestD = manh(u.col, u.row, tc, tr);
  let improved = 0;
  const opts = [
    { dc: 1, dr: 0 }, { dc: -1, dr: 0 }, { dc: 0, dr: 1 }, { dc: 0, dr: -1 }
  ];
  let oi = 0;
  while (oi < opts.length) {
    const nc = u.col + opts[oi].dc;
    const nr = u.row + opts[oi].dr;
    if (canEnter(nc, nr) == 1 && findUnitAt(units, nc, nr, u.owner) < 0) {
      const d = manh(nc, nr, tc, tr);
      if (d < bestD) {
        bestD = d;
        bestDc = opts[oi].dc;
        bestDr = opts[oi].dr;
        improved = 1;
      }
    }
    oi = oi + 1;
  }
  if (improved == 0) {
    return { units: units, cities: cities, seed: seed };
  }
  const moved = tryMoveUnit(units, cities, unitIndex, bestDc, bestDr, seed);
  if (moved.ok == 1) {
    return { units: moved.units, cities: moved.cities, seed: moved.seed };
  }
  return { units: units, cities: cities, seed: seed };
}

function runAiTurn(units, cities, seed, nameN) {
  let outU = refreshMoves(units, OWNER_AI);
  let outC = cities;
  let s = seed;
  let n = nameN;
  let i = 0;
  while (i < outU.length) {
    const u = outU[i];
    if (u.alive == 1 && u.owner == OWNER_AI && u.kind == KIND_SETTLER) {
      const own = nearestOwnCity(outC, u.col, u.row, OWNER_AI);
      let dist = 99;
      if (own >= 0) { dist = manh(u.col, u.row, outC[own].col, outC[own].row); }
      if (own < 0 || dist >= 4) {
        if (isLand(u.col, u.row) == 1 && findCityAt(outC, u.col, u.row) < 0) {
          const founded = tryFoundCity(outU, outC, i, n);
          if (founded.ok == 1) {
            outU = founded.units;
            outC = founded.cities;
            n = founded.nameN;
          }
        }
      }
    }
    i = i + 1;
  }
  i = 0;
  while (i < outU.length) {
    if (outU[i].alive == 1 && outU[i].owner == OWNER_AI && outU[i].moves > 0) {
      let steps = 0;
      while (steps < 3 && outU[i].alive == 1 && outU[i].moves > 0) {
        let tc = outU[i].col;
        let tr = outU[i].row;
        if (outU[i].kind == KIND_SETTLER) {
          const own2 = nearestOwnCity(outC, outU[i].col, outU[i].row, OWNER_AI);
          if (own2 >= 0 && manh(outU[i].col, outU[i].row, outC[own2].col, outC[own2].row) < 4) {
            s = nextSeed(s); tc = 8 + (s % 30);
            s = nextSeed(s); tr = 6 + (s % 16);
          }
        } else {
          const target = nearestEnemyCity(outC, outU[i].col, outU[i].row, OWNER_AI);
          if (target >= 0) {
            tc = outC[target].col;
            tr = outC[target].row;
          }
        }
        const stepped = stepToward(outU, outC, i, tc, tr, s);
        outU = stepped.units;
        outC = stepped.cities;
        s = stepped.seed;
        steps = steps + 1;
      }
    }
    i = i + 1;
  }
  const grown = growCities(outC, outU, OWNER_AI, s);
  return { units: grown.units, cities: grown.cities, seed: grown.seed, nameN: n };
}

function focusFromSel(units, cities, sel) {
  if (sel >= 0 && sel < units.length && units[sel].alive == 1) {
    return { col: units[sel].col, row: units[sel].row };
  }
  let i = 0;
  while (i < cities.length) {
    if (cities[i].alive == 1 && cities[i].owner == OWNER_PLAYER) {
      return { col: cities[i].col, row: cities[i].row };
    }
    i = i + 1;
  }
  return { col: 10, row: 10 };
}

function buildEntities(units, cities, sel, explored, camCol, camRow, aim, slide) {
  const entities = {};

  let i = 0;
  while (i < TILE_SPRITES) {
    const vc = i % VIEW_COLS;
    let vr = 0;
    let rest = i - vc;
    while (rest >= VIEW_COLS) {
      rest = rest - VIEW_COLS;
      vr = vr + 1;
    }
    const wc = camCol + vc;
    const wr = camRow + vr;
    const frame = terrainFrame(cellAt(wc, wr));
    // Sheet sprites are feet-anchored: feet at tile bottom → art fills the cell.
    entities[tileId(i)] = {
      x: ORIGIN_X + vc * TILE + (TILE / 2),
      y: ORIGIN_Y + vr * TILE + TILE,
      p0: frame,
      p1: 0,
      visible: 1
    };
    i = i + 1;
  }

  i = 0;
  while (i < MAX_CITIES) {
    if (i < cities.length && cities[i].alive == 1) {
      const c = cities[i];
      if (inView(c.col, c.row, camCol, camRow) == 1) {
        let p0 = 0;
        if (c.owner == OWNER_AI) { p0 = 1; }
        entities[cityId(i)] = {
          x: screenX(c.col, camCol),
          y: screenFeetY(c.row, camRow),
          p0: p0,
          p1: 0,
          visible: 1
        };
      } else {
        entities[cityId(i)] = { x: -40, y: -40, visible: 0 };
      }
    } else {
      entities[cityId(i)] = { x: -40, y: -40, visible: 0 };
    }
    i = i + 1;
  }

  i = 0;
  while (i < MAX_UNITS) {
    if (i < units.length && units[i].alive == 1) {
      const u = units[i];
      if (inView(u.col, u.row, camCol, camRow) == 1) {
        let ux = screenX(u.col, camCol);
        let uy = screenFeetY(u.row, camRow);
        // Slide lerp while moving into the aimed tile.
        if (slide && slide.on == 1 && slide.unit == i) {
          const x0 = screenX(slide.fc, camCol);
          const y0 = screenFeetY(slide.fr, camRow);
          const x1 = screenX(slide.tc, camCol);
          const y1 = screenFeetY(slide.tr, camRow);
          const t = slide.t / SLIDE_MAX;
          ux = x0 + (x1 - x0) * t;
          uy = y0 + (y1 - y0) * t;
        }
        entities[unitId(i)] = {
          x: ux,
          y: uy,
          p0: u.frame,
          p1: u.face,
          visible: 1
        };
      } else {
        entities[unitId(i)] = { x: -40, y: -40, visible: 0 };
      }
    } else {
      entities[unitId(i)] = { x: -40, y: -40, visible: 0 };
    }
    i = i + 1;
  }

  // Selection ring (bright rect) + sheet cursor + aim marker on target tile.
  entities[selRingId()] = { x: -40, y: -40, visible: 0 };
  entities[cursorId()] = { x: -40, y: -40, visible: 0 };
  entities[aimId()] = { x: -40, y: -40, visible: 0 };

  if (sel >= 0 && sel < units.length && units[sel].alive == 1) {
    const u = units[sel];
    let sc = u.col;
    let sr = u.row;
    if (slide && slide.on == 1 && slide.unit == sel) {
      // Keep ring on destination while sliding.
      sc = slide.tc;
      sr = slide.tr;
    }
    if (inView(u.col, u.row, camCol, camRow) == 1 || (slide && slide.on == 1)) {
      entities[selRingId()] = {
        x: screenX(u.col, camCol),
        y: tileCenterY(u.row, camRow),
        visible: 1
      };
      if (slide && slide.on == 1 && slide.unit == sel) {
        const x0 = screenX(slide.fc, camCol);
        const y0 = tileCenterY(slide.fr, camRow);
        const x1 = screenX(slide.tc, camCol);
        const y1 = tileCenterY(slide.tr, camRow);
        const t = slide.t / SLIDE_MAX;
        entities[selRingId()] = {
          x: x0 + (x1 - x0) * t,
          y: y0 + (y1 - y0) * t,
          visible: 1
        };
      }
      entities[cursorId()] = {
        x: entities[selRingId()].x,
        y: screenFeetY(u.row, camRow),
        p0: 2,
        p1: 1,
        visible: 1
      };
    }
    // Destination tile: full yellow square (always when aiming).
    if (aim >= 0 && !(slide && slide.on == 1)) {
      const d = aimDelta(aim);
      const ac = u.col + d.dc;
      const ar = u.row + d.dr;
      if (inView(ac, ar, camCol, camRow) == 1) {
        entities[aimId()] = {
          x: screenX(ac, camCol),
          y: tileCenterY(ar, camRow),
          r: 255,
          g: 220,
          b: 40,
          visible: 1
        };
      }
    }
    // While sliding, keep the destination highlighted.
    if (slide && slide.on == 1 && slide.unit == sel) {
      if (inView(slide.tc, slide.tr, camCol, camRow) == 1) {
        entities[aimId()] = {
          x: screenX(slide.tc, camCol),
          y: tileCenterY(slide.tr, camRow),
          r: 255,
          g: 220,
          b: 40,
          visible: 1
        };
      }
    }
  }
  return entities;
}

function findStartLand(cx, cy) {
  let rad = 0;
  while (rad < 12) {
    let r = cy - rad;
    while (r <= cy + rad) {
      let c = cx - rad;
      while (c <= cx + rad) {
        if (isLand(c, r) == 1) { return { col: c, row: r }; }
        c = c + 1;
      }
      r = r + 1;
    }
    rad = rad + 1;
  }
  return { col: cx, row: cy };
}

function initPlayState() {
  const units = [];
  const cities = [];
  let i = 0;
  while (i < MAX_UNITS) {
    units.push(emptyUnit());
    i = i + 1;
  }
  i = 0;
  while (i < MAX_CITIES) {
    cities.push(emptyCity());
    i = i + 1;
  }

  const pStart = findStartLand(10, 12);
  const aStart = findStartLand(36, 14);
  cities[0] = makeCity(OWNER_PLAYER, pStart.col, pStart.row, 0);
  cities[1] = makeCity(OWNER_AI, aStart.col, aStart.row, 0);

  let ps = findStartLand(pStart.col + 1, pStart.row);
  if (ps.col == pStart.col && ps.row == pStart.row) {
    ps = findStartLand(pStart.col, pStart.row + 1);
  }
  let pw = findStartLand(pStart.col, pStart.row + 1);
  let as_ = findStartLand(aStart.col - 1, aStart.row);
  let aw = findStartLand(aStart.col, aStart.row - 1);

  units[SLOT_P_SETTLER0] = makeUnit(OWNER_PLAYER, KIND_SETTLER, ps.col, ps.row);
  units[SLOT_P_WARRIOR0] = makeUnit(OWNER_PLAYER, KIND_WARRIOR, pw.col, pw.row);
  units[SLOT_AI_SETTLER0] = makeUnit(OWNER_AI, KIND_SETTLER, as_.col, as_.row);
  units[SLOT_AI_WARRIOR0] = makeUnit(OWNER_AI, KIND_WARRIOR, aw.col, aw.row);

  let explored = blankExplored();
  explored = revealFromSide(explored, units, cities, OWNER_PLAYER);

  const sel = SLOT_P_SETTLER0;
  const aim = -1;
  const slide = emptySlide();
  const cam = withCam(units, cities, sel, explored, aim, slide);

  return {
    screen: "play",
    turn: 1,
    seed: 424242,
    units: units,
    cities: cities,
    explored: explored,
    camCol: cam.camCol,
    camRow: cam.camRow,
    sel: sel,
    aim: aim,
    slide: slide,
    nameN: 1,
    gold: 0,
    msg: "Arrows aim · Space moves · Select founds city",
    msgT: 240,
    help: 1,
    phase: "player",
    entities: cam.entities,
    pUp: 0, pDown: 0, pLeft: 0, pRight: 0, pAct: 0, pSel: 0, pStart: 0, pB: 0,
    events: []
  };
}

function initState() {
  const play = initPlayState();
  return {
    screen: "splash",
    turn: play.turn,
    seed: play.seed,
    units: play.units,
    cities: play.cities,
    explored: play.explored,
    camCol: play.camCol,
    camRow: play.camRow,
    sel: -1,
    aim: -1,
    slide: emptySlide(),
    nameN: play.nameN,
    gold: 0,
    msg: "",
    msgT: 0,
    help: 1,
    phase: "player",
    entities: play.entities,
    pUp: 0, pDown: 0, pLeft: 0, pRight: 0, pAct: 0, pSel: 0, pStart: 0, pB: 0,
    events: []
  };
}

function readPad(props) {
  const inp = props.input;
  if (inp && inp.players && inp.players[0]) {
    return inp.players[0];
  }
  return {
    up: props.up, down: props.down, left: props.left, right: props.right,
    action: props.action, select: false, start: false, a: false, b: false
  };
}

function unitLabel(u) {
  if (u.kind == KIND_SETTLER) { return "Settler"; }
  return "Warrior";
}

function statusLine(state) {
  if (state.sel < 0 || state.sel >= state.units.length) {
    return "No unit selected";
  }
  const u = state.units[state.sel];
  if (u.alive == 0) { return "No unit selected"; }
  const tile = cellAt(u.col, u.row);
  let terrain = "plains";
  if (tile == "f") { terrain = "forest"; }
  if (tile == "h") { terrain = "hills"; }
  if (tile == "~") { terrain = "ocean"; }
  return unitLabel(u) + "  moves " + u.moves + "/" + u.maxMoves + "  @ " + terrain +
    "  (" + u.col + "," + u.row + ")";
}

function checkWinner(cities) {
  const p = countOwnerCities(cities, OWNER_PLAYER);
  const a = countOwnerCities(cities, OWNER_AI);
  if (a <= 0 && p > 0) { return "win"; }
  if (p <= 0 && a > 0) { return "lose"; }
  return "";
}

function emptySlide() {
  return { on: 0, t: 0, unit: -1, fc: 0, fr: 0, tc: 0, tr: 0 };
}

function withCam(units, cities, sel, explored, aim, slide) {
  let focusCol = 10;
  let focusRow = 10;
  if (slide && slide.on == 1) {
    focusCol = slide.tc;
    focusRow = slide.tr;
  } else {
    const focus = focusFromSel(units, cities, sel);
    focusCol = focus.col;
    focusRow = focus.row;
  }
  const cam = computeCam(focusCol, focusRow);
  return {
    camCol: cam.camCol,
    camRow: cam.camRow,
    entities: buildEntities(units, cities, sel, explored, cam.camCol, cam.camRow, aim, slide)
  };
}

function endPlayerTurn(state) {
  let units = state.units;
  let cities = state.cities;
  let seed = state.seed;
  let nameN = state.nameN;
  let explored = state.explored;
  const grown = growCities(cities, units, OWNER_PLAYER, seed);
  cities = grown.cities;
  units = grown.units;
  seed = grown.seed;
  const gold = state.gold + countOwnerCities(cities, OWNER_PLAYER);
  const ai = runAiTurn(units, cities, seed, nameN);
  units = ai.units;
  cities = ai.cities;
  seed = ai.seed;
  nameN = ai.nameN;
  units = refreshMoves(units, OWNER_PLAYER);
  explored = revealFromSide(explored, units, cities, OWNER_PLAYER);
  const turn = state.turn + 1;
  let sel = firstMovableUnit(units, OWNER_PLAYER, 0);
  let screen = "play";
  const outcome = checkWinner(cities);
  if (outcome == "win") { screen = "win"; }
  if (outcome == "lose") { screen = "lose"; }
  const aim = -1;
  const slide = emptySlide();
  const cam = withCam(units, cities, sel, explored, aim, slide);
  return {
    screen: screen,
    turn: turn,
    seed: seed,
    units: units,
    cities: cities,
    explored: explored,
    camCol: cam.camCol,
    camRow: cam.camRow,
    sel: sel,
    aim: aim,
    slide: slide,
    nameN: nameN,
    gold: gold,
    msg: "Turn " + turn + " — arrows aim, Space moves",
    msgT: 100,
    help: state.help,
    phase: "player",
    entities: cam.entities,
    events: [soundEvent("blip")]
  };
}

function edgeState(s, pad) {
  let pUp = 0; if (pad.up) { pUp = 1; }
  let pDown = 0; if (pad.down) { pDown = 1; }
  let pLeft = 0; if (pad.left) { pLeft = 1; }
  let pRight = 0; if (pad.right) { pRight = 1; }
  let pAct = 0; if (pad.action) { pAct = 1; }
  let pSel = 0; if (pad.select) { pSel = 1; }
  let pStart = 0; if (pad.start || pad.b) { pStart = 1; }
  return {
    pUp: pUp, pDown: pDown, pLeft: pLeft, pRight: pRight,
    pAct: pAct, pSel: pSel, pStart: pStart, pB: 0
  };
}

function packState(base, edges, events) {
  return {
    screen: base.screen,
    turn: base.turn,
    seed: base.seed,
    units: base.units,
    cities: base.cities,
    explored: base.explored,
    camCol: base.camCol,
    camRow: base.camRow,
    sel: base.sel,
    aim: base.aim,
    slide: base.slide,
    nameN: base.nameN,
    gold: base.gold,
    msg: base.msg,
    msgT: base.msgT,
    help: base.help,
    phase: base.phase,
    entities: base.entities,
    pUp: edges.pUp, pDown: edges.pDown, pLeft: edges.pLeft, pRight: edges.pRight,
    pAct: edges.pAct, pSel: edges.pSel, pStart: edges.pStart, pB: 0,
    events: events
  };
}

function update(props) {
  const s = props.state;
  const pad = readPad(props);
  const edges = edgeState(s, pad);

  const up = pad.up && !s.pUp;
  const down = pad.down && !s.pDown;
  const left = pad.left && !s.pLeft;
  const right = pad.right && !s.pRight;
  const act = pad.action && !s.pAct;
  const selBtn = pad.select && !s.pSel;
  const startBtn = (pad.start || pad.b) && !s.pStart;

  if (s.screen == "splash") {
    if (act || startBtn) {
      const play = initPlayState();
      return packState({
        screen: "play",
        turn: play.turn, seed: play.seed, units: play.units, cities: play.cities,
        explored: play.explored, camCol: play.camCol, camRow: play.camRow,
        sel: play.sel, aim: play.aim, slide: play.slide, nameN: play.nameN,
        gold: 0, msg: play.msg, msgT: play.msgT, help: 1, phase: "player",
        entities: play.entities
      }, edges, [soundEvent("win")]);
    }
    return packState({
      screen: "splash",
      turn: s.turn, seed: s.seed, units: s.units, cities: s.cities,
      explored: s.explored, camCol: s.camCol, camRow: s.camRow,
      sel: s.sel, aim: s.aim, slide: s.slide, nameN: s.nameN,
      gold: s.gold, msg: s.msg, msgT: s.msgT, help: s.help, phase: s.phase,
      entities: s.entities
    }, edges, []);
  }

  if (s.screen == "win" || s.screen == "lose") {
    if (act || startBtn) {
      const play = initPlayState();
      return packState({
        screen: "splash",
        turn: play.turn, seed: play.seed, units: play.units, cities: play.cities,
        explored: play.explored, camCol: play.camCol, camRow: play.camRow,
        sel: -1, aim: -1, slide: emptySlide(), nameN: play.nameN,
        gold: 0, msg: "", msgT: 0, help: 1, phase: "player",
        entities: play.entities
      }, edges, []);
    }
    return packState({
      screen: s.screen,
      turn: s.turn, seed: s.seed, units: s.units, cities: s.cities,
      explored: s.explored, camCol: s.camCol, camRow: s.camRow,
      sel: s.sel, aim: s.aim, slide: s.slide, nameN: s.nameN,
      gold: s.gold, msg: s.msg, msgT: s.msgT, help: s.help, phase: s.phase,
      entities: s.entities
    }, edges, []);
  }

  let units = s.units;
  let cities = s.cities;
  let explored = s.explored;
  let sel = s.sel;
  let aim = s.aim;
  let slide = s.slide;
  if (!slide) { slide = emptySlide(); }
  let seed = s.seed;
  let nameN = s.nameN;
  let gold = s.gold;
  let msg = s.msg;
  let msgT = s.msgT;
  let help = s.help;
  if (msgT > 0) { msgT = msgT - 1; }
  let events = [];
  let screen = "play";

  // --- slide animation in progress ---
  if (slide.on == 1) {
    slide = {
      on: 1, t: slide.t + 1, unit: slide.unit,
      fc: slide.fc, fr: slide.fr, tc: slide.tc, tr: slide.tr
    };
    if (slide.t >= SLIDE_MAX) {
      const dc = slide.tc - slide.fc;
      const dr = slide.tr - slide.fr;
      const movedUnit = slide.unit;
      const moved = tryMoveUnit(units, cities, movedUnit, dc, dr, seed);
      const moveAim = faceFromDelta(dc, dr);
      slide = emptySlide();
      if (moved.ok == 1) {
        units = moved.units;
        cities = moved.cities;
        seed = moved.seed;
        explored = revealFromSide(explored, units, cities, OWNER_PLAYER);
        if (moved.fought == 1) {
          if (moved.won == 1) {
            msg = "Victory!";
            events = [soundEvent("bounce")];
          } else {
            msg = "Unit lost!";
            events = [soundEvent("lose")];
            sel = firstMovableUnit(units, OWNER_PLAYER, 0);
          }
          aim = -1;
          msgT = 100;
        } else {
          events = [soundEvent("blip")];
          if (movedUnit >= 0 && movedUnit < units.length) {
            const uAfter = units[movedUnit];
            if (uAfter.alive == 1 && uAfter.moves > 0) {
              aim = moveAim;
              msg = "Moved — Space again or re-aim";
            } else {
              aim = -1;
              msg = "Moved — no moves left";
            }
          } else {
            aim = -1;
            msg = "Moved";
          }
          msgT = 40;
        }
        const outcome = checkWinner(cities);
        if (outcome == "win") { screen = "win"; }
        if (outcome == "lose") { screen = "lose"; }
      } else {
        aim = -1;
      }
    }
    const camS = withCam(units, cities, sel, explored, aim, slide);
    return packState({
      screen: screen, turn: s.turn, seed: seed, units: units, cities: cities,
      explored: explored, camCol: camS.camCol, camRow: camS.camRow,
      sel: sel, aim: aim, slide: slide, nameN: nameN, gold: gold,
      msg: msg, msgT: msgT, help: help, phase: "player", entities: camS.entities
    }, edges, events);
  }

  // End turn: Start / B (not Down — Down aims south).
  if (startBtn) {
    const ended = endPlayerTurn({
      turn: s.turn, seed: seed, units: units, cities: cities,
      explored: explored, sel: sel, nameN: nameN, gold: gold, help: help
    });
    return packState({
      screen: ended.screen, turn: ended.turn, seed: ended.seed,
      units: ended.units, cities: ended.cities, explored: ended.explored,
      camCol: ended.camCol, camRow: ended.camRow, sel: ended.sel,
      aim: ended.aim, slide: ended.slide, nameN: ended.nameN, gold: ended.gold,
      msg: ended.msg, msgT: ended.msgT, help: ended.help, phase: "player",
      entities: ended.entities
    }, edges, ended.events);
  }

  // Cycle units: Select (and Up when no moves left).
  let idleUnit = 0;
  if (sel < 0) {
    idleUnit = 1;
  } else {
    if (sel < units.length) {
      const su = units[sel];
      if (su.alive == 0 || su.moves <= 0) { idleUnit = 1; }
    }
  }
  if (selBtn || (up && idleUnit == 1)) {
    const next = firstMovableUnit(units, OWNER_PLAYER, sel + 1);
    if (next >= 0) {
      sel = next;
      aim = -1;
      msg = "Selected " + unitLabel(units[sel]);
      msgT = 60;
    }
  }

  // Arrows aim (held keys — works right after a slide without re-tapping).
  let aimUpKey = 0;
  if (idleUnit == 0) { aimUpKey = pad.up; }
  const keyed = aimFromKeys(aimUpKey, pad.down, pad.left, pad.right);
  if (keyed >= 0 && sel >= 0 && sel < units.length && units[sel].alive == 1) {
    if (units[sel].moves > 0) {
      aim = keyed;
      const outU = cloneUnits(units);
      outU[sel].face = aim;
      units = outU;
      const d = aimDelta(aim);
      const tc = units[sel].col + d.dc;
      const tr = units[sel].row + d.dr;
      if (canEnter(tc, tr) == 1) {
        msg = "Aim set — Space to move";
      } else {
        msg = "Blocked that way";
      }
      msgT = 50;
    }
  }

  // Space: move along aim (slide), or found/skip when no aim / no moves.
  if (act && sel >= 0 && sel < units.length && units[sel].alive == 1) {
    const u = units[sel];
    if (u.moves > 0 && aim >= 0) {
      const d = aimDelta(aim);
      const tc = u.col + d.dc;
      const tr = u.row + d.dr;
      // Validate before starting slide (same rules as tryMoveUnit preamble).
      let canGo = 0;
      if (canEnter(tc, tr) == 1 && u.moves >= moveCost(tc, tr)) {
        if (findUnitAt(units, tc, tr, u.owner) < 0) {
          const enemy = findEnemyUnitAt(units, tc, tr, u.owner);
          if (enemy < 0 || u.kind == KIND_WARRIOR) { canGo = 1; }
        }
      }
      if (canGo == 1) {
        slide = {
          on: 1, t: 0, unit: sel,
          fc: u.col, fr: u.row, tc: tc, tr: tr
        };
        help = 0;
        msg = "Moving…";
        msgT = 20;
      } else {
        msg = "Cannot move there — re-aim";
        msgT = 70;
      }
    } else {
      // No aim / no moves: settler founds, otherwise skip/fortify.
      if (u.kind == KIND_SETTLER) {
        const founded = tryFoundCity(units, cities, sel, nameN);
        if (founded.ok == 1) {
          units = founded.units;
          cities = founded.cities;
          nameN = founded.nameN;
          explored = revealFromSide(explored, units, cities, OWNER_PLAYER);
          msg = "Founded " + cityName(OWNER_PLAYER, nameN - 1);
          msgT = 120;
          events = [soundEvent("win")];
          sel = firstMovableUnit(units, OWNER_PLAYER, sel);
          aim = -1;
        } else {
          if (aim < 0 && u.moves > 0) {
            msg = "Aim with arrows, then Space";
            msgT = 90;
          } else {
            const outU = cloneUnits(units);
            outU[sel].moves = 0;
            units = outU;
            sel = firstMovableUnit(units, OWNER_PLAYER, sel + 1);
            aim = -1;
            msg = "Unit skipped";
            msgT = 60;
          }
        }
      } else {
        if (aim < 0 && u.moves > 0) {
          msg = "Aim with arrows, then Space";
          msgT = 90;
        } else {
          const outU = cloneUnits(units);
          outU[sel].moves = 0;
          units = outU;
          sel = firstMovableUnit(units, OWNER_PLAYER, sel + 1);
          aim = -1;
          msg = "Unit fortified";
          msgT = 60;
        }
      }
    }
  }

  const cam = withCam(units, cities, sel, explored, aim, slide);
  return packState({
    screen: screen, turn: s.turn, seed: seed, units: units, cities: cities,
    explored: explored, camCol: cam.camCol, camRow: cam.camRow,
    sel: sel, aim: aim, slide: slide, nameN: nameN, gold: gold,
    msg: msg, msgT: msgT, help: help, phase: "player", entities: cam.entities
  }, edges, events);
}

function citySummary(cities, owner) {
  let n = 0;
  let i = 0;
  while (i < cities.length) {
    if (cities[i].alive == 1 && cities[i].owner == owner) { n = n + 1; }
    i = i + 1;
  }
  return n;
}

function hud(props) {
  const s = props.state;

  if (s.screen == "splash") {
    return (
      <View width="100%" height="100%" flexDirection="column" justifyContent="center" alignItems="center" backgroundColor="#101828cc">
        <Label color="#f0d246" fontSize="42px">LittleCiv</Label>
        <Label color="#9ec4e8" fontSize="14px">How to play</Label>
        <Label color="#ffffff" fontSize="16px">Arrows = aim (yellow tile)</Label>
        <Label color="#ffffff" fontSize="16px">Space = move there</Label>
        <Label color="#d0d8e8" fontSize="14px">Select = next unit / found city</Label>
        <Label color="#d0d8e8" fontSize="14px">B / Start = end turn</Label>
        <Label color="#ffe98a" fontSize="20px">Press Space to begin</Label>
      </View>
    );
  }

  if (s.screen == "win") {
    return (
      <View width="100%" height="100%" flexDirection="column" justifyContent="center" alignItems="center">
        <Label color="#7CFF9B" fontSize="40px">Victory</Label>
        <Label color="#ffffff" fontSize="16px">Rival defeated on turn {s.turn}</Label>
        <Label color="#ffe98a" fontSize="14px">Space = menu</Label>
      </View>
    );
  }

  if (s.screen == "lose") {
    return (
      <View width="100%" height="100%" flexDirection="column" justifyContent="center" alignItems="center">
        <Label color="#ff8899" fontSize="40px">Defeat</Label>
        <Label color="#ffffff" fontSize="16px">Your last city has fallen</Label>
        <Label color="#ffe98a" fontSize="14px">Space = menu</Label>
      </View>
    );
  }

  const mine = citySummary(s.cities, OWNER_PLAYER);
  const theirs = citySummary(s.cities, OWNER_AI);
  const line = statusLine(s);
  let tip = "Arrows aim · Space move · Select found/cycle · B end turn";
  if (s.help == 1) {
    tip = "Yellow tile = where you will move · Space to go";
  }
  if (s.msgT > 0) { tip = s.msg; }

  let aimLine = "";
  if (s.aim == 0) { aimLine = "Aim: UP  (yellow tile)"; }
  if (s.aim == 1) { aimLine = "Aim: LEFT  (yellow tile)"; }
  if (s.aim == 2) { aimLine = "Aim: DOWN  (yellow tile)"; }
  if (s.aim == 3) { aimLine = "Aim: RIGHT  (yellow tile)"; }
  if (s.aim < 0) { aimLine = "Aim: —  press an arrow first"; }
  if (s.slide && s.slide.on == 1) { aimLine = "Moving…"; }

  let cityLine = "";
  let i = 0;
  while (i < s.cities.length) {
    const c = s.cities[i];
    if (c.alive == 1) {
      let known = 0;
      if (c.owner == OWNER_PLAYER) { known = 1; }
      if (c.owner != OWNER_PLAYER) {
        if (inSightOfPlayer(c.col, c.row, s.units, s.cities) == 1) { known = 1; }
      }
      if (known == 1) {
        if (cityLine != "") { cityLine = cityLine + "  ·  "; }
        cityLine = cityLine + cityName(c.owner, c.nameN) + " (" + c.size + ")";
      }
    }
    i = i + 1;
  }

  return (
    <View width="100%" height="100%" flexDirection="column" justifyContent="space-between" padding="4px">
      <View flexDirection="column">
        <View flexDirection="row" justifyContent="space-between" width="100%">
          <Label color="#f0d246" fontSize="13px">LittleCiv</Label>
          <Label color="#9ec4e8" fontSize="11px">Turn {s.turn}  Gold {s.gold}  Cities {mine}/{theirs}</Label>
        </View>
        <Label color="#c8d6e8" fontSize="10px">{line}</Label>
        <Label color="#7CFF9B" fontSize="11px">{aimLine}</Label>
        <Label color="#8aa4c0" fontSize="10px">{cityLine}</Label>
      </View>
      <Label color="#ffe98a" fontSize="10px">{tip}</Label>
    </View>
  );
}
