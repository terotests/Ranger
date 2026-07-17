/// <reference path="../../scripting/game.d.ts" />
//
// LittleCiv — mini turn-based civilization demo (original code).
// Genre inspiration: Civilization / Freeciv. Not a Freeciv port.
//
// Run: npm run engine:game-sdl:run:littleciv
//      or launcher → LittleCiv

import { soundEvent } from "game_helpers";

const COLS = 16;
const ROWS = 10;
const TILE = 22;
const ORIGIN_X = 12;
const ORIGIN_Y = 36;
const MAX_UNITS = 12;
const MAX_CITIES = 6;

const OWNER_PLAYER = 0;
const OWNER_AI = 1;
const KIND_SETTLER = 0;
const KIND_WARRIOR = 1;

// ~ ocean  . plains  f forest  h hills  m mountain
const MAP = [
  "~~~~~~~~~~~~~~~~",
  "~...ff..........~",
  "~..ffhhf........~",
  "~...ff..........~",
  "~...............~",
  "~...............~",
  "~.........ff....~",
  "~........fhhff..~",
  "~.........ff....~",
  "~~~~~~~~~~~~~~~~"
];

function screens() {
  return ["splash", "play", "win", "lose"];
}

function cellAt(col, row) {
  if (col < 0) { return "~"; }
  if (row < 0) { return "~"; }
  if (col >= COLS) { return "~"; }
  if (row >= ROWS) { return "~"; }
  return MAP[row].substring(col, col + 1);
}

function isLand(col, row) {
  const c = cellAt(col, row);
  if (c == ".") { return 1; }
  if (c == "f") { return 1; }
  if (c == "h") { return 1; }
  return 0;
}

function canEnter(col, row) {
  const c = cellAt(col, row);
  if (c == ".") { return 1; }
  if (c == "f") { return 1; }
  if (c == "h") { return 1; }
  return 0;
}

function moveCost(col, row) {
  const c = cellAt(col, row);
  if (c == "h") { return 2; }
  if (c == "f") { return 1; }
  return 1;
}

function tileLeft(col) {
  return ORIGIN_X + col * TILE;
}

function tileTop(row) {
  return ORIGIN_Y + row * TILE;
}

function tileX(col) {
  return tileLeft(col) + (TILE / 2);
}

function tileY(row) {
  return tileTop(row) + (TILE / 2);
}

function terrainColor(ch) {
  if (ch == "~") { return { r: 28, g: 72, b: 118 }; }
  if (ch == "f") { return { r: 34, g: 98, b: 42 }; }
  if (ch == "h") { return { r: 120, g: 110, b: 70 }; }
  if (ch == "m") { return { r: 110, g: 110, b: 118 }; }
  return { r: 62, g: 140, b: 58 };
}

function ownerColor(owner) {
  if (owner == OWNER_PLAYER) { return { r: 240, g: 210, b: 70 }; }
  return { r: 220, g: 80, b: 70 };
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

function createStaticBg() {
  bgClear(16, 22, 36);
  let row = 0;
  while (row < ROWS) {
    let col = 0;
    while (col < COLS) {
      const ch = cellAt(col, row);
      const pal = terrainColor(ch);
      bgFillRect(tileLeft(col), tileTop(row), TILE - 1, TILE - 1, pal.r, pal.g, pal.b);
      if (ch == "f") {
        bgFillRect(tileLeft(col) + 6, tileTop(row) + 4, 4, 10, 22, 70, 30);
        bgFillRect(tileLeft(col) + 12, tileTop(row) + 7, 4, 8, 28, 82, 36);
      }
      if (ch == "h") {
        bgFillRect(tileLeft(col) + 4, tileTop(row) + 10, 14, 4, 90, 82, 52);
        bgFillRect(tileLeft(col) + 7, tileTop(row) + 6, 8, 5, 100, 92, 60);
      }
      col = col + 1;
    }
    row = row + 1;
  }
}

function sprites() {
  const list = [];
  // Cursor under units so the selection ring does not hide the piece.
  list.push({ id: cursorId(), kind: "rect", w: 20, h: 20, r: 255, g: 255, b: 255 });
  let i = 0;
  while (i < MAX_CITIES) {
    list.push({ id: cityId(i), kind: "rect", w: 14, h: 14, r: 200, g: 180, b: 60 });
    i = i + 1;
  }
  i = 0;
  while (i < MAX_UNITS) {
    list.push({ id: unitId(i), kind: "circle", rad: 6, r: 240, g: 210, b: 70 });
    i = i + 1;
  }
  return list;
}

function emptyUnit() {
  return {
    alive: 0,
    owner: 0,
    kind: 0,
    col: 0,
    row: 0,
    moves: 0,
    maxMoves: 0,
    hp: 0
  };
}

function emptyCity() {
  return {
    alive: 0,
    owner: 0,
    col: 0,
    row: 0,
    size: 1,
    food: 0,
    prod: 0,
    nameN: 0
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
    alive: 1,
    owner: owner,
    kind: kind,
    col: col,
    row: row,
    moves: maxMoves,
    maxMoves: maxMoves,
    hp: hp
  };
}

function makeCity(owner, col, row, nameN) {
  return {
    alive: 1,
    owner: owner,
    col: col,
    row: row,
    size: 1,
    food: 0,
    prod: 0,
    nameN: nameN
  };
}

function cityName(owner, nameN) {
  if (owner == OWNER_PLAYER) {
    if (nameN == 0) { return "Helsinki"; }
    if (nameN == 1) { return "Turku"; }
    if (nameN == 2) { return "Tampere"; }
    return ("Kaupunki " + nameN);
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
      alive: u.alive,
      owner: u.owner,
      kind: u.kind,
      col: u.col,
      row: u.row,
      moves: u.moves,
      maxMoves: u.maxMoves,
      hp: u.hp
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
      alive: c.alive,
      owner: c.owner,
      col: c.col,
      row: c.row,
      size: c.size,
      food: c.food,
      prod: c.prod,
      nameN: c.nameN
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

function firstFreeSlot(list) {
  let i = 0;
  while (i < list.length) {
    if (list[i].alive == 0) { return i; }
    i = i + 1;
  }
  return -1;
}

function absVal(n) {
  if (n < 0) { return 0 - n; }
  return n;
}

function manh(c0, r0, c1, r1) {
  return absVal(c0 - c1) + absVal(r0 - r1);
}

function nextSeed(seed) {
  return (seed * 1103515245 + 12345) % 2147483647;
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
      if (d < bestD) {
        bestD = d;
        best = i;
      }
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
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    i = i + 1;
  }
  return best;
}

function spawnNear(units, cities, owner, kind, col, row) {
  const dirs = [
    { dc: 0, dr: 0 },
    { dc: 1, dr: 0 },
    { dc: -1, dr: 0 },
    { dc: 0, dr: 1 },
    { dc: 0, dr: -1 },
    { dc: 1, dr: 1 },
    { dc: -1, dr: 1 },
    { dc: 1, dr: -1 },
    { dc: -1, dr: -1 }
  ];
  const out = cloneUnits(units);
  const slot = firstFreeSlot(out);
  if (slot < 0) { return out; }
  let di = 0;
  while (di < dirs.length) {
    const nc = col + dirs[di].dc;
    const nr = row + dirs[di].dr;
    if (canEnter(nc, nr) == 1) {
      if (findUnitAt(out, nc, nr, -1) < 0) {
        if (findCityAt(cities, nc, nr) < 0 || (nc == col && nr == row)) {
          out[slot] = makeUnit(owner, kind, nc, nr);
          out[slot].moves = 0;
          return out;
        }
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
      // Auto-build: warrior at 6, settler at 12 when size >= 2.
      if (c.prod >= 12 && c.size >= 2) {
        const before = countAlive(outU);
        outU = spawnNear(outU, outC, owner, KIND_SETTLER, c.col, c.row);
        if (countAlive(outU) > before) {
          c.prod = 0;
          s = nextSeed(s);
        }
      } else {
        if (c.prod >= 6) {
          const before2 = countAlive(outU);
          outU = spawnNear(outU, outC, owner, KIND_WARRIOR, c.col, c.row);
          if (countAlive(outU) > before2) {
            c.prod = c.prod - 6;
            s = nextSeed(s);
          }
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
  const slot = firstFreeSlot(cities);
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
  // City defense bonus if defender sits on own city.
  const ci = findCityAt(outC, def.col, def.row);
  if (ci >= 0 && outC[ci].owner == def.owner) {
    defPower = defPower + 1 + outC[ci].size;
  }
  s = nextSeed(s);
  const roll = s % (atkPower + defPower);
  if (roll < atkPower) {
    // Attacker wins: occupy tile, maybe capture city.
    const tc = def.col;
    const tr = def.row;
    outU[defIndex].alive = 0;
    outU[atkIndex].col = tc;
    outU[atkIndex].row = tr;
    outU[atkIndex].moves = 0;
    outU[atkIndex].hp = atk.hp;
    if (ci >= 0 && outC[ci].owner != atk.owner) {
      outC[ci].owner = atk.owner;
      outC[ci].prod = 0;
    }
    return { units: outU, cities: outC, seed: s, won: 1 };
  }
  // Defender wins.
  outU[atkIndex].alive = 0;
  return { units: outU, cities: outC, seed: s, won: 0 };
}

function captureEmptyCity(units, cities, unitIndex) {
  const u = units[unitIndex];
  const ci = findCityAt(cities, u.col, u.row);
  if (ci < 0) { return cities; }
  if (cities[ci].owner == u.owner) { return cities; }
  // Empty enemy city (no defender left): capture on enter.
  if (findUnitAt(units, u.col, u.row, cities[ci].owner) >= 0) { return cities; }
  const outC = cloneCities(cities);
  outC[ci].owner = u.owner;
  outC[ci].prod = 0;
  return outC;
}

function tryMoveUnit(units, cities, unitIndex, dc, dr, seed) {
  const u = units[unitIndex];
  if (u.alive == 0) {
    return { ok: 0, units: units, cities: cities, seed: seed, fought: 0 };
  }
  if (u.moves <= 0) {
    return { ok: 0, units: units, cities: cities, seed: seed, fought: 0 };
  }
  const nc = u.col + dc;
  const nr = u.row + dr;
  if (canEnter(nc, nr) == 0) {
    return { ok: 0, units: units, cities: cities, seed: seed, fought: 0 };
  }
  const cost = moveCost(nc, nr);
  if (u.moves < cost) {
    return { ok: 0, units: units, cities: cities, seed: seed, fought: 0 };
  }
  const friend = findUnitAt(units, nc, nr, u.owner);
  if (friend >= 0) {
    return { ok: 0, units: units, cities: cities, seed: seed, fought: 0 };
  }
  const enemy = findEnemyUnitAt(units, nc, nr, u.owner);
  if (enemy >= 0) {
    if (u.kind == KIND_SETTLER) {
      return { ok: 0, units: units, cities: cities, seed: seed, fought: 0 };
    }
    const fight = resolveCombat(units, cities, unitIndex, enemy, seed);
    return {
      ok: 1,
      units: fight.units,
      cities: fight.cities,
      seed: fight.seed,
      fought: 1,
      won: fight.won
    };
  }
  const outU = cloneUnits(units);
  outU[unitIndex].col = nc;
  outU[unitIndex].row = nr;
  outU[unitIndex].moves = u.moves - cost;
  let outC = captureEmptyCity(outU, cities, unitIndex);
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
  // Fall back to any living unit of owner.
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
    { dc: 1, dr: 0 },
    { dc: -1, dr: 0 },
    { dc: 0, dr: 1 },
    { dc: 0, dr: -1 }
  ];
  let oi = 0;
  while (oi < opts.length) {
    const nc = u.col + opts[oi].dc;
    const nr = u.row + opts[oi].dr;
    if (canEnter(nc, nr) == 1) {
      const friend = findUnitAt(units, nc, nr, u.owner);
      if (friend < 0) {
        const d = manh(nc, nr, tc, tr);
        if (d < bestD) {
          bestD = d;
          bestDc = opts[oi].dc;
          bestDr = opts[oi].dr;
          improved = 1;
        }
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
  // Found city if settler is far from own cities.
  let i = 0;
  while (i < outU.length) {
    const u = outU[i];
    if (u.alive == 1 && u.owner == OWNER_AI && u.kind == KIND_SETTLER) {
      const own = nearestOwnCity(outC, u.col, u.row, OWNER_AI);
      let dist = 99;
      if (own >= 0) { dist = manh(u.col, u.row, outC[own].col, outC[own].row); }
      if (own < 0 || dist >= 3) {
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
  // Move units (a few steps each).
  i = 0;
  while (i < outU.length) {
    const u = outU[i];
    if (u.alive == 1 && u.owner == OWNER_AI && u.moves > 0) {
      let steps = 0;
      while (steps < 3 && outU[i].alive == 1 && outU[i].moves > 0) {
        let tc = 8;
        let tr = 5;
        if (outU[i].kind == KIND_SETTLER) {
          const own2 = nearestOwnCity(outC, outU[i].col, outU[i].row, OWNER_AI);
          if (own2 >= 0 && manh(outU[i].col, outU[i].row, outC[own2].col, outC[own2].row) < 3) {
            // Wander away from capital a bit.
            s = nextSeed(s);
            tc = 3 + (s % 10);
            s = nextSeed(s);
            tr = 2 + (s % 6);
          } else {
            tc = outU[i].col;
            tr = outU[i].row;
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

function buildEntities(units, cities, sel) {
  const entities = {};
  let i = 0;
  while (i < MAX_CITIES) {
    if (i < cities.length && cities[i].alive == 1) {
      const pal = ownerColor(cities[i].owner);
      entities[cityId(i)] = {
        x: tileX(cities[i].col),
        y: tileY(cities[i].row),
        r: pal.r,
        g: pal.g,
        b: pal.b,
        visible: 1
      };
    } else {
      entities[cityId(i)] = { x: -40, y: -40, visible: 0 };
    }
    i = i + 1;
  }
  i = 0;
  while (i < MAX_UNITS) {
    if (i < units.length && units[i].alive == 1) {
      const pal = ownerColor(units[i].owner);
      let rad = 5;
      if (units[i].kind == KIND_WARRIOR) { rad = 6; }
      entities[unitId(i)] = {
        x: tileX(units[i].col),
        y: tileY(units[i].row),
        r: pal.r,
        g: pal.g,
        b: pal.b,
        rad: rad,
        visible: 1
      };
    } else {
      entities[unitId(i)] = { x: -40, y: -40, visible: 0 };
    }
    i = i + 1;
  }
  if (sel >= 0 && sel < units.length && units[sel].alive == 1) {
    entities[cursorId()] = {
      x: tileX(units[sel].col),
      y: tileY(units[sel].row),
      r: 255,
      g: 255,
      b: 255,
      visible: 1
    };
  } else {
    entities[cursorId()] = { x: -40, y: -40, visible: 0 };
  }
  return entities;
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
  // Player starts west, AI east — classic two-civ opener.
  cities[0] = makeCity(OWNER_PLAYER, 3, 4, 0);
  cities[1] = makeCity(OWNER_AI, 12, 5, 0);
  units[0] = makeUnit(OWNER_PLAYER, KIND_SETTLER, 4, 4);
  units[1] = makeUnit(OWNER_PLAYER, KIND_WARRIOR, 3, 5);
  units[2] = makeUnit(OWNER_AI, KIND_SETTLER, 11, 5);
  units[3] = makeUnit(OWNER_AI, KIND_WARRIOR, 12, 4);
  const sel = 0;
  return {
    screen: "play",
    turn: 1,
    seed: 424242,
    units: units,
    cities: cities,
    sel: sel,
    nameN: 1,
    gold: 0,
    msg: "Move with arrows. Space founds a city.",
    msgT: 180,
    phase: "player",
    entities: buildEntities(units, cities, sel),
    pUp: 0,
    pDown: 0,
    pLeft: 0,
    pRight: 0,
    pAct: 0,
    pSel: 0,
    pStart: 0,
    pB: 0,
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
    sel: play.sel,
    nameN: play.nameN,
    gold: 0,
    msg: "",
    msgT: 0,
    phase: "player",
    entities: buildEntities(play.units, play.cities, -1),
    pUp: 0,
    pDown: 0,
    pLeft: 0,
    pRight: 0,
    pAct: 0,
    pSel: 0,
    pStart: 0,
    pB: 0,
    events: []
  };
}

function readPad(props) {
  const inp = props.input;
  if (inp && inp.players && inp.players[0]) {
    return inp.players[0];
  }
  return {
    up: props.up,
    down: props.down,
    left: props.left,
    right: props.right,
    action: props.action,
    select: false,
    start: false,
    a: false,
    b: false
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
  return unitLabel(u) + "  moves " + u.moves + "/" + u.maxMoves + "  @ " + terrain;
}

function checkWinner(cities) {
  const p = countOwnerCities(cities, OWNER_PLAYER);
  const a = countOwnerCities(cities, OWNER_AI);
  if (a <= 0 && p > 0) { return "win"; }
  if (p <= 0 && a > 0) { return "lose"; }
  return "";
}

function endPlayerTurn(state) {
  let units = state.units;
  let cities = state.cities;
  let seed = state.seed;
  let nameN = state.nameN;
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
  const turn = state.turn + 1;
  let sel = firstMovableUnit(units, OWNER_PLAYER, 0);
  let screen = "play";
  const outcome = checkWinner(cities);
  if (outcome == "win") { screen = "win"; }
  if (outcome == "lose") { screen = "lose"; }
  return {
    screen: screen,
    turn: turn,
    seed: seed,
    units: units,
    cities: cities,
    sel: sel,
    nameN: nameN,
    gold: gold,
    msg: "Turn " + turn,
    msgT: 90,
    phase: "player",
    entities: buildEntities(units, cities, sel),
    events: [soundEvent("blip")]
  };
}

function update(props) {
  const s = props.state;
  const pad = readPad(props);

  const up = pad.up && !s.pUp;
  const down = pad.down && !s.pDown;
  const left = pad.left && !s.pLeft;
  const right = pad.right && !s.pRight;
  const act = pad.action && !s.pAct;
  const selBtn = (pad.select || pad.a) && !s.pSel;
  const startBtn = (pad.start || pad.b) && !s.pStart;
  // End-turn also via Down when the selected unit has no moves (idle shortcut).
  let endDown = 0;
  if (down) {
    if (s.sel < 0) {
      endDown = 1;
    } else {
      if (s.sel < s.units.length) {
        const su = s.units[s.sel];
        if (su.alive == 0 || su.moves <= 0) { endDown = 1; }
      }
    }
  }

  let pUp = 0; if (pad.up) { pUp = 1; }
  let pDown = 0; if (pad.down) { pDown = 1; }
  let pLeft = 0; if (pad.left) { pLeft = 1; }
  let pRight = 0; if (pad.right) { pRight = 1; }
  let pAct = 0; if (pad.action) { pAct = 1; }
  let pSel = 0; if (pad.select || pad.a) { pSel = 1; }
  let pStart = 0; if (pad.start || pad.b) { pStart = 1; }

  if (s.screen == "splash") {
    if (act || startBtn) {
      const play = initPlayState();
      return {
        screen: "play",
        turn: play.turn,
        seed: play.seed,
        units: play.units,
        cities: play.cities,
        sel: play.sel,
        nameN: play.nameN,
        gold: 0,
        msg: play.msg,
        msgT: play.msgT,
        phase: "player",
        entities: play.entities,
        pUp: pUp,
        pDown: pDown,
        pLeft: pLeft,
        pRight: pRight,
        pAct: pAct,
        pSel: pSel,
        pStart: pStart,
        pB: 0,
        events: [soundEvent("win")]
      };
    }
    return {
      screen: "splash",
      turn: s.turn,
      seed: s.seed,
      units: s.units,
      cities: s.cities,
      sel: s.sel,
      nameN: s.nameN,
      gold: s.gold,
      msg: s.msg,
      msgT: s.msgT,
      phase: s.phase,
      entities: s.entities,
      pUp: pUp,
      pDown: pDown,
      pLeft: pLeft,
      pRight: pRight,
      pAct: pAct,
      pSel: pSel,
      pStart: pStart,
      pB: 0,
      events: []
    };
  }

  if (s.screen == "win" || s.screen == "lose") {
    if (act || startBtn) {
      const play = initPlayState();
      return {
        screen: "splash",
        turn: play.turn,
        seed: play.seed,
        units: play.units,
        cities: play.cities,
        sel: -1,
        nameN: play.nameN,
        gold: 0,
        msg: "",
        msgT: 0,
        phase: "player",
        entities: buildEntities(play.units, play.cities, -1),
        pUp: pUp,
        pDown: pDown,
        pLeft: pLeft,
        pRight: pRight,
        pAct: pAct,
        pSel: pSel,
        pStart: pStart,
        pB: 0,
        events: []
      };
    }
    return {
      screen: s.screen,
      turn: s.turn,
      seed: s.seed,
      units: s.units,
      cities: s.cities,
      sel: s.sel,
      nameN: s.nameN,
      gold: s.gold,
      msg: s.msg,
      msgT: s.msgT,
      phase: s.phase,
      entities: s.entities,
      pUp: pUp,
      pDown: pDown,
      pLeft: pLeft,
      pRight: pRight,
      pAct: pAct,
      pSel: pSel,
      pStart: pStart,
      pB: 0,
      events: []
    };
  }

  // ---- play ----
  let units = s.units;
  let cities = s.cities;
  let sel = s.sel;
  let seed = s.seed;
  let nameN = s.nameN;
  let gold = s.gold;
  let msg = s.msg;
  let msgT = s.msgT;
  if (msgT > 0) { msgT = msgT - 1; }
  let events = [];
  let screen = "play";

  if (startBtn || endDown) {
    const ended = endPlayerTurn({
      turn: s.turn,
      seed: seed,
      units: units,
      cities: cities,
      sel: sel,
      nameN: nameN,
      gold: gold
    });
    return {
      screen: ended.screen,
      turn: ended.turn,
      seed: ended.seed,
      units: ended.units,
      cities: ended.cities,
      sel: ended.sel,
      nameN: ended.nameN,
      gold: ended.gold,
      msg: ended.msg,
      msgT: ended.msgT,
      phase: "player",
      entities: ended.entities,
      pUp: pUp,
      pDown: pDown,
      pLeft: pLeft,
      pRight: pRight,
      pAct: pAct,
      pSel: pSel,
      pStart: pStart,
      pB: 0,
      events: ended.events
    };
  }

  if (selBtn) {
    const next = firstMovableUnit(units, OWNER_PLAYER, sel + 1);
    if (next >= 0) { sel = next; }
  }

  if (act) {
    if (sel >= 0 && sel < units.length && units[sel].alive == 1) {
      const u = units[sel];
      if (u.kind == KIND_SETTLER) {
        const founded = tryFoundCity(units, cities, sel, nameN);
        if (founded.ok == 1) {
          units = founded.units;
          cities = founded.cities;
          nameN = founded.nameN;
          msg = "Founded " + cityName(OWNER_PLAYER, nameN - 1);
          msgT = 120;
          events = [soundEvent("win")];
          sel = firstMovableUnit(units, OWNER_PLAYER, sel);
        } else {
          // Skip / fortify: spend remaining moves.
          const outU = cloneUnits(units);
          outU[sel].moves = 0;
          units = outU;
          sel = firstMovableUnit(units, OWNER_PLAYER, sel + 1);
          msg = "Unit skipped";
          msgT = 60;
        }
      } else {
        const outU = cloneUnits(units);
        outU[sel].moves = 0;
        units = outU;
        sel = firstMovableUnit(units, OWNER_PLAYER, sel + 1);
        msg = "Unit fortified";
        msgT = 60;
      }
    }
  }

  let dc = 0;
  let dr = 0;
  if (left) { dc = -1; }
  if (right) { dc = 1; }
  if (up) { dr = -1; }
  // Down moves south only when the unit still has moves (else end-turn above).
  if (down && endDown == 0) { dr = 1; }

  if ((dc != 0 || dr != 0) && sel >= 0 && sel < units.length) {
    const moved = tryMoveUnit(units, cities, sel, dc, dr, seed);
    if (moved.ok == 1) {
      units = moved.units;
      cities = moved.cities;
      seed = moved.seed;
      if (moved.fought == 1) {
        if (moved.won == 1) {
          msg = "Victory!";
          events = [soundEvent("bounce")];
        } else {
          msg = "Unit lost!";
          events = [soundEvent("lose")];
          sel = firstMovableUnit(units, OWNER_PLAYER, 0);
        }
        msgT = 100;
      } else {
        events = [soundEvent("blip")];
      }
      const outcome = checkWinner(cities);
      if (outcome == "win") { screen = "win"; }
      if (outcome == "lose") { screen = "lose"; }
      if (sel >= 0 && sel < units.length) {
        if (units[sel].alive == 1 && units[sel].moves <= 0) {
          const nsel = firstMovableUnit(units, OWNER_PLAYER, sel + 1);
          if (nsel >= 0) { sel = nsel; }
        }
      }
    }
  }

  return {
    screen: screen,
    turn: s.turn,
    seed: seed,
    units: units,
    cities: cities,
    sel: sel,
    nameN: nameN,
    gold: gold,
    msg: msg,
    msgT: msgT,
    phase: "player",
    entities: buildEntities(units, cities, sel),
    pUp: pUp,
    pDown: pDown,
    pLeft: pLeft,
    pRight: pRight,
    pAct: pAct,
    pSel: pSel,
    pStart: pStart,
    pB: 0,
    events: events
  };
}

function citySummary(cities, owner) {
  let n = 0;
  let size = 0;
  let i = 0;
  while (i < cities.length) {
    if (cities[i].alive == 1 && cities[i].owner == owner) {
      n = n + 1;
      size = size + cities[i].size;
    }
    i = i + 1;
  }
  return { n: n, size: size };
}

function hud(props) {
  const s = props.state;

  if (s.screen == "splash") {
    return (
      <View width="100%" height="100%" flexDirection="column" justifyContent="center" alignItems="center">
        <Label color="#f0d246" fontSize="42px">LittleCiv</Label>
        <Label color="#9ec4e8" fontSize="14px">Found cities. Train warriors. Claim the map.</Label>
        <Label color="#6a8aaa" fontSize="12px">Inspired by Freeciv / Civilization — original mini demo</Label>
        <Label color="#ffe98a" fontSize="16px">Space = start</Label>
      </View>
    );
  }

  if (s.screen == "win") {
    return (
      <View width="100%" height="100%" flexDirection="column" justifyContent="center" alignItems="center">
        <Label color="#7CFF9B" fontSize="40px">Victory</Label>
        <Label color="#ffffff" fontSize="16px">Rival civilization defeated on turn {s.turn}</Label>
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
  let tip = "A = cycle unit   B/Start = end turn   Space = found/skip";
  if (s.msgT > 0) { tip = s.msg; }

  let cityLine = "";
  let i = 0;
  while (i < s.cities.length) {
    const c = s.cities[i];
    if (c.alive == 1) {
      if (cityLine != "") { cityLine = cityLine + "  ·  "; }
      cityLine = cityLine + cityName(c.owner, c.nameN) + " (" + c.size + ")";
    }
    i = i + 1;
  }

  return (
    <View width="100%" height="100%" flexDirection="column" justifyContent="space-between" padding="6px">
      <View flexDirection="column">
        <View flexDirection="row" justifyContent="space-between" width="100%">
          <Label color="#f0d246" fontSize="14px">LittleCiv</Label>
          <Label color="#9ec4e8" fontSize="12px">Turn {s.turn}  Gold {s.gold}  Cities {mine.n}/{theirs.n}</Label>
        </View>
        <Label color="#c8d6e8" fontSize="11px">{line}</Label>
        <Label color="#8aa4c0" fontSize="10px">{cityLine}</Label>
      </View>
      <Label color="#ffe98a" fontSize="11px">{tip}</Label>
    </View>
  );
}
