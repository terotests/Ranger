/// <reference path="../../scripting/game.d.ts" />
//
// Pac-Man — jaettu logiikka (ylos3/invaders-tyyli).
// Kentät: level_*.tsx + index/level2/level3 → pushGame.

import { soundEvent } from "game_helpers";

interface LevelPos {
  col: i32;
  row: i32;
}

interface LevelConfig {
  id: string;
  label: string;
  nextLevel: string;
  tile: i32;
  pace: f64;
  maze: string[];
  tunnelRows: i32[];
  ghostStarts: LevelPos[];
  scatterTargets: LevelPos[];
}

const VIEW_W = 480;
const VIEW_H = 270;
const POWER_MS = 6000;
const SCATTER_MS = 7000;
const CHASE_MS = 20000;
const HURT_MS = 1500;
const DEATH_MS = 1200;
const LEVEL_LOAD_MS = 1600;

const MODE_SCATTER = 0;
const MODE_CHASE = 1;

const PAC_SHEET = "assets/pac.png";
const GHOST_SHEETS = [
  "assets/ghost_red.png",
  "assets/ghost_pink.png",
  "assets/ghost_cyan.png",
  "assets/ghost_orange.png"
];
const SCARED_SHEET = "assets/ghost_scared.png";
const EYES_SHEET = "assets/ghost_eyes.png";

let activeLevel: LevelConfig = null;

export function gameScreens() {
  return ["splash", "play", "gameOver"];
}

export function setLevelConfig(cfg: LevelConfig) {
  activeLevel = {
    id: cfg.id,
    label: cfg.label,
    nextLevel: cfg.nextLevel,
    tile: cfg.tile,
    pace: cfg.pace,
    maze: cfg.maze,
    tunnelRows: cfg.tunnelRows,
    ghostStarts: cfg.ghostStarts,
    scatterTargets: cfg.scatterTargets
  };
}

function cfg(): LevelConfig {
  return activeLevel;
}

function TILE(): i32 {
  return cfg().tile;
}

function ROWS(): i32 {
  return cfg().maze.length;
}

function COLS(): i32 {
  return cfg().maze[0].length;
}

function ORIGIN_X(): i32 {
  return (VIEW_W - COLS() * TILE()) / 2;
}

function ORIGIN_Y(): i32 {
  return (VIEW_H - ROWS() * TILE()) / 2 + 4;
}

function STEP_MS(): f64 {
  return 110.0 * cfg().pace;
}

function GHOST_STEP_MS(): f64 {
  return 200.0 * cfg().pace;
}

function cellAt(col, row) {
  return cfg().maze[row].substring(col, col + 1);
}

function isTunnelRow(row) {
  const rows = cfg().tunnelRows;
  let i = 0;
  while (i < rows.length) {
    if (rows[i] == row) {
      return 1;
    }
    i = i + 1;
  }
  return 0;
}

function wrapCol(col, row) {
  if (isTunnelRow(row) == 1) {
    if (col < 0) {
      return COLS() - 1;
    }
    if (col >= COLS()) {
      return 0;
    }
  }
  return col;
}

function isWall(col, row) {
  if (row < 0) {
    return 1;
  }
  if (row >= ROWS()) {
    return 1;
  }
  if (isTunnelRow(row) == 1) {
    if (col < 0) {
      return 0;
    }
    if (col >= COLS()) {
      return 0;
    }
  } else {
    if (col < 0) {
      return 1;
    }
    if (col >= COLS()) {
      return 1;
    }
  }
  if (cellAt(col, row) == "#") {
    return 1;
  }
  return 0;
}

function canWalk(col, row) {
  if (isWall(col, row) == 0) {
    return 1;
  }
  return 0;
}

function tileLeft(col) {
  return ORIGIN_X() + col * TILE();
}

function tileTop(row) {
  return ORIGIN_Y() + row * TILE();
}

function tileX(col) {
  return tileLeft(col) + (TILE() / 2);
}

function tileY(row) {
  return tileTop(row) + (TILE() / 2);
}

export function paintLevelBg() {
  bgClear(12, 16, 32);
  let row = 0;
  while (row < ROWS()) {
    let col = 0;
    while (col < COLS()) {
      if (cellAt(col, row) == "#") {
        bgFillRect(tileLeft(col), tileTop(row), TILE(), TILE(), 32, 56, 190);
      }
      col = col + 1;
    }
    row = row + 1;
  }
}

function dirDelta(dir) {
  if (dir == 0) {
    return { dc: 0, dr: -1 };
  }
  if (dir == 1) {
    return { dc: 1, dr: 0 };
  }
  if (dir == 2) {
    return { dc: 0, dr: 1 };
  }
  return { dc: -1, dr: 0 };
}

function tryMove(col, row, dir) {
  const d = dirDelta(dir);
  let nc = col + d.dc;
  let nr = row + d.dr;
  nc = wrapCol(nc, nr);
  if (canWalk(nc, nr) == 1) {
    return { ok: 1, col: nc, row: nr };
  }
  return { ok: 0, col: col, row: row };
}

function lerpTile(col, row, frac, dir) {
  const cx = tileX(col);
  const cy = tileY(row);
  const d = dirDelta(dir);
  const nc = wrapCol(col + d.dc, row + d.dr);
  const nr = row + d.dr;
  const tx = tileX(nc);
  const ty = tileY(nr);
  const t = frac / 1000.0;
  return { x: cx + (tx - cx) * t, y: cy + (ty - cy) * t };
}

function canAdvance(col, row, dir) {
  return tryMove(col, row, dir).ok;
}

function lerpIfMoving(col, row, frac, dir) {
  if (canAdvance(col, row, dir) == 0) {
    return { x: tileX(col), y: tileY(row) };
  }
  return lerpTile(col, row, frac, dir);
}

function opposite(dir) {
  if (dir == 0) {
    return 2;
  }
  if (dir == 2) {
    return 0;
  }
  if (dir == 1) {
    return 3;
  }
  return 1;
}

function firstOpenDir(col, row) {
  let dir = 0;
  while (dir < 4) {
    if (tryMove(col, row, dir).ok == 1) {
      return dir;
    }
    dir = dir + 1;
  }
  return 0;
}

function absVal(n) {
  if (n < 0) {
    return 0 - n;
  }
  return n;
}

function dist(col, row, tc, tr) {
  return absVal(col - tc) + absVal(row - tr);
}

function dotId(i) {
  return "d" + i;
}

function powerId(i) {
  return "p" + i;
}

function ghostId(i) {
  return "g" + i;
}

function ghostScaredId(i) {
  return "gs" + i;
}

function ghostEyesId(i) {
  return "ge" + i;
}

function sheetSprite(id, path, cols, rows) {
  return {
    id: id,
    kind: "sheet",
    path: path,
    frameW: 16,
    frameH: 16,
    cols: cols,
    rows: rows,
    scale: 100,
    feetTrim: 8,
    jumpFrame: 0
  };
}

export function buildSprites() {
  const list = [];
  let dotIdx = 0;
  let powIdx = 0;
  let row = 0;
  while (row < ROWS()) {
    let col = 0;
    while (col < COLS()) {
      const ch = cellAt(col, row);
      if (ch == ".") {
        list.push({ id: dotId(dotIdx), kind: "circle", rad: 2, r: 255, g: 220, b: 120 });
        dotIdx = dotIdx + 1;
      }
      if (ch == "O") {
        list.push({ id: powerId(powIdx), kind: "circle", rad: 5, r: 255, g: 220, b: 160 });
        powIdx = powIdx + 1;
      }
      col = col + 1;
    }
    row = row + 1;
  }

  list.push(sheetSprite("pac", PAC_SHEET, 4, 4));
  let gi = 0;
  while (gi < 4) {
    list.push(sheetSprite(ghostId(gi), GHOST_SHEETS[gi], 2, 4));
    list.push(sheetSprite(ghostScaredId(gi), SCARED_SHEET, 2, 2));
    list.push(sheetSprite(ghostEyesId(gi), EYES_SHEET, 1, 4));
    gi = gi + 1;
  }
  return list;
}

function initDots() {
  const dots = [];
  let row = 0;
  while (row < ROWS()) {
    let col = 0;
    while (col < COLS()) {
      if (cellAt(col, row) == ".") {
        dots.push({ col: col, row: row, alive: 1 });
      }
      col = col + 1;
    }
    row = row + 1;
  }
  return dots;
}

function initPowers() {
  const powers = [];
  let row = 0;
  while (row < ROWS()) {
    let col = 0;
    while (col < COLS()) {
      if (cellAt(col, row) == "O") {
        powers.push({ col: col, row: row, alive: 1 });
      }
      col = col + 1;
    }
    row = row + 1;
  }
  return powers;
}

function findStart() {
  let row = 0;
  while (row < ROWS()) {
    let col = 0;
    while (col < COLS()) {
      if (cellAt(col, row) == "S") {
        return { col: col, row: row };
      }
      col = col + 1;
    }
    row = row + 1;
  }
  return { col: (COLS() / 2) | 0, row: (ROWS() / 2) | 0 };
}

function initGhosts(spawns) {
  const ghosts = [];
  let i = 0;
  while (i < 4) {
    ghosts.push({
      col: spawns[i].col,
      row: spawns[i].row,
      dir: 3,
      frac: 0,
      eyes: 0
    });
    i = i + 1;
  }
  return ghosts;
}

function hiddenPose() {
  return { x: -40, y: -40, visible: 0, p0: 0, p1: 0, p2: 0 };
}

function placeDots(entities, dots, powers) {
  let i = 0;
  while (i < dots.length) {
    if (dots[i].alive == 1) {
      entities[dotId(i)] = { x: tileX(dots[i].col), y: tileY(dots[i].row) };
    } else {
      entities[dotId(i)] = { x: -40, y: -40, visible: 0 };
    }
    i = i + 1;
  }
  i = 0;
  while (i < powers.length) {
    if (powers[i].alive == 1) {
      entities[powerId(i)] = { x: tileX(powers[i].col), y: tileY(powers[i].row) };
    } else {
      entities[powerId(i)] = { x: -40, y: -40, visible: 0 };
    }
    i = i + 1;
  }
}

function pacMouth(frameSeed, moving) {
  if (moving == 0) {
    return 0;
  }
  return 1 + (frameSeed % 3);
}

function placePacDeath(entities, col, row, frac, dir, frameSeed) {
  const pos = lerpIfMoving(col, row, frac, dir);
  if ((frameSeed % 8) < 4) {
    entities.pac = hiddenPose();
    return;
  }
  entities.pac = {
    x: pos.x,
    y: pos.y,
    p0: 3,
    p1: dir,
    p2: 0,
    visible: 1
  };
}

function placePac(entities, col, row, frac, dir, frameSeed, moving, blink) {
  if (blink == 1) {
    entities.pac = hiddenPose();
    return;
  }
  const pos = lerpIfMoving(col, row, frac, dir);
  entities.pac = {
    x: pos.x,
    y: pos.y,
    p0: pacMouth(frameSeed, moving),
    p1: dir,
    p2: 0,
    visible: 1
  };
}

function placeGhosts(entities, ghosts, powered, frameSeed) {
  let i = 0;
  while (i < 4) {
    const g = ghosts[i];
    const pos = lerpIfMoving(g.col, g.row, g.frac, g.dir);
    const wobble = (frameSeed / 4) % 2;
    entities[ghostId(i)] = hiddenPose();
    entities[ghostScaredId(i)] = hiddenPose();
    entities[ghostEyesId(i)] = hiddenPose();
    if (g.eyes == 1) {
      entities[ghostEyesId(i)] = {
        x: pos.x,
        y: pos.y,
        p0: 0,
        p1: g.dir,
        p2: 0,
        visible: 1
      };
    } else if (powered > 0) {
      entities[ghostScaredId(i)] = {
        x: pos.x,
        y: pos.y,
        p0: wobble,
        p1: (frameSeed / 8) % 2,
        p2: 0,
        visible: 1
      };
    } else {
      entities[ghostId(i)] = {
        x: pos.x,
        y: pos.y,
        p0: wobble,
        p1: g.dir,
        p2: 0,
        visible: 1
      };
    }
    i = i + 1;
  }
}

function initPlayEntities(start, dots, powers, ghosts) {
  const entities = {};
  placeDots(entities, dots, powers);
  placePac(entities, start.col, start.row, 0, 0, 0, 0, 0);
  placeGhosts(entities, ghosts, 0, 0);
  return entities;
}

function readSaved(data, key, fallback) {
  const v = data[key];
  if (v == null) {
    return fallback;
  }
  return v;
}

function initSplashState() {
  const start = findStart();
  const dots = initDots();
  const powers = initPowers();
  const ghosts = initGhosts(cfg().ghostStarts);
  return {
    showNet: 0,
    entities: initPlayEntities(start, dots, powers, ghosts),
    score1: 0,
    score2: 0
  };
}

function initPlayState(score, lives) {
  const start = findStart();
  const startDir = firstOpenDir(start.col, start.row);
  const dots = initDots();
  const powers = initPowers();
  const ghosts = initGhosts(cfg().ghostStarts);
  return {
    showNet: 0,
    entities: initPlayEntities(start, dots, powers, ghosts),
    pacCol: start.col,
    pacRow: start.row,
    pacDir: startDir,
    nextDir: startDir,
    pacFrac: 0,
    ghostCd: 0,
    frameSeed: 0,
    globalMode: MODE_SCATTER,
    modeTimer: SCATTER_MS,
    dots: dots,
    powers: powers,
    ghosts: ghosts,
    score: score,
    lives: lives,
    powered: 0,
    powerLeft: 0,
    hurtTimer: 0,
    deathTimer: 0,
    deathPacCol: start.col,
    deathPacRow: start.row,
    deathPacFrac: 0,
    deathPacDir: startDir,
    levelCleared: 0,
    celebrateMs: 0,
    loadQueued: 0,
    score1: score,
    score2: lives
  };
}

export function makeInitState() {
  const data = loadGameData();
  const score = readSaved(data, "score1", 0);
  const lives = readSaved(data, "score2", 3);
  let startLives = lives;
  if (startLives <= 0) {
    startLives = 3;
  }
  // Fresh launch (no saved score) starts at splash; mid-campaign levels skip it.
  const skipSplash = score > 0 ? 1 : 0;
  if (skipSplash == 1) {
    return {
      screen: "play",
      screens: {
        splash: initSplashState(),
        play: initPlayState(score, startLives)
      }
    };
  }
  return {
    screen: "splash",
    screens: {
      splash: initSplashState(),
      play: initPlayState(0, 3)
    }
  };
}

function readInputDir(props, prev) {
  let dir = prev;
  if (props.up) {
    dir = 0;
  }
  if (props.right) {
    dir = 1;
  }
  if (props.down) {
    dir = 2;
  }
  if (props.left) {
    dir = 3;
  }
  return dir;
}

function tryTurn(col, row, curDir, wantDir) {
  const t = tryMove(col, row, wantDir);
  if (t.ok == 1) {
    return wantDir;
  }
  return curDir;
}

function eatAt(col, row, dots, powers) {
  let score = 0;
  let powered = 0;
  let eatenDot = -1;
  let eatenPow = -1;
  let i = 0;
  while (i < dots.length) {
    const d = dots[i];
    if (d.alive == 1) {
      if (d.col == col) {
        if (d.row == row) {
          d.alive = 0;
          score = score + 10;
          eatenDot = i;
        }
      }
    }
    i = i + 1;
  }
  i = 0;
  while (i < powers.length) {
    const p = powers[i];
    if (p.alive == 1) {
      if (p.col == col) {
        if (p.row == row) {
          p.alive = 0;
          score = score + 50;
          powered = 1;
          eatenPow = i;
        }
      }
    }
    i = i + 1;
  }
  return { score: score, powered: powered, eatenDot: eatenDot, eatenPow: eatenPow };
}

function listDirs(g, forbidReverse) {
  const opts = [];
  let dir = 0;
  while (dir < 4) {
    let skip = 0;
    if (forbidReverse == 1) {
      if (dir == opposite(g.dir)) {
        skip = 1;
      }
    }
    if (skip == 0) {
      const mv = tryMove(g.col, g.row, dir);
      if (mv.ok == 1) {
        opts.push(dir);
      }
    }
    dir = dir + 1;
  }
  return opts;
}

function chaseTarget(gi, gCol, gRow, pacCol, pacRow, pacDir) {
  const d = dirDelta(pacDir);
  if (gi == 0) {
    return { col: pacCol, row: pacRow };
  }
  if (gi == 1) {
    return { col: pacCol + d.dc * 4, row: pacRow + d.dr * 4 };
  }
  if (gi == 2) {
    return { col: pacCol + d.dc * 2, row: pacRow + d.dr * 2 };
  }
  if (dist(gCol, gRow, pacCol, pacRow) > 8) {
    return cfg().scatterTargets[gi];
  }
  return { col: pacCol, row: pacRow };
}

function pickGhostDir(g, gi, pacCol, pacRow, pacDir, globalMode, powered) {
  const opts = listDirs(g, 1);
  if (opts.length == 0) {
    const rev = listDirs(g, 0);
    if (rev.length == 0) {
      return g.dir;
    }
    return rev[0];
  }
  if (powered > 0) {
    let best = opts[0];
    let bestDist = -1;
    let i = 0;
    while (i < opts.length) {
      const mv = tryMove(g.col, g.row, opts[i]);
      const dd = dist(mv.col, mv.row, pacCol, pacRow);
      if (dd > bestDist) {
        bestDist = dd;
        best = opts[i];
      }
      i = i + 1;
    }
    return best;
  }
  let target = cfg().scatterTargets[gi];
  if (globalMode == MODE_CHASE) {
    target = chaseTarget(gi, g.col, g.row, pacCol, pacRow, pacDir);
  }
  let best2 = opts[0];
  let bestD = 9999;
  let j = 0;
  while (j < opts.length) {
    const mv2 = tryMove(g.col, g.row, opts[j]);
    const dd2 = dist(mv2.col, mv2.row, target.col, target.row);
    if (dd2 < bestD) {
      bestD = dd2;
      best2 = opts[j];
    }
    j = j + 1;
  }
  return best2;
}

function stepGhostGrid(g, gi, pacCol, pacRow, pacDir, globalMode, powered) {
  const starts = cfg().ghostStarts;
  if (g.eyes == 1) {
    const sp = starts[gi];
    const dir = pickGhostDir(g, gi, sp.col, sp.row, 1, MODE_CHASE, 0);
    const mv = tryMove(g.col, g.row, dir);
    if (mv.ok == 1) {
      g.col = mv.col;
      g.row = mv.row;
      g.dir = dir;
    } else {
      return g;
    }
    if (g.col == sp.col) {
      if (g.row == sp.row) {
        g.eyes = 0;
      }
    }
    return g;
  }
  const dir = pickGhostDir(g, gi, pacCol, pacRow, pacDir, globalMode, powered);
  const mv2 = tryMove(g.col, g.row, dir);
  if (mv2.ok == 1) {
    g.col = mv2.col;
    g.row = mv2.row;
    g.dir = dir;
  }
  return g;
}

function hitGhostAt(pacCol, pacRow, ghosts) {
  let found = -1;
  let i = 0;
  while (i < 4) {
    if (found < 0) {
      const g = ghosts[i];
      if (g.eyes != 1) {
        if (g.col == pacCol) {
          if (g.row == pacRow) {
            found = i;
          }
        }
        if (found < 0) {
          let dc = g.col - pacCol;
          let dr = g.row - pacRow;
          if (dc < 0) {
            dc = 0 - dc;
          }
          if (dr < 0) {
            dr = 0 - dr;
          }
          if ((dc + dr) <= 1) {
            found = i;
          }
        }
      }
    }
    i = i + 1;
  }
  return found;
}

function applyGhostTouch(gh, powered, ghosts, score, lives, pacCol, pacRow, pacFrac, pacDir, events) {
  if (powered > 0) {
    ghosts[gh].eyes = 1;
    ghosts[gh].frac = 0;
    events.push(soundEvent("bounce"));
    return {
      score: score + 200,
      lives: lives,
      powered: powered,
      deathTimer: 0,
      deathPacCol: pacCol,
      deathPacRow: pacRow,
      deathPacFrac: pacFrac,
      deathPacDir: pacDir,
      hit: 1
    };
  }
  events.push(soundEvent("lose"));
  return {
    score: score,
    lives: lives - 1,
    powered: powered,
    deathTimer: DEATH_MS,
    deathPacCol: pacCol,
    deathPacRow: pacRow,
    deathPacFrac: pacFrac,
    deathPacDir: pacDir,
    hit: 1
  };
}

function countAliveDots(dots) {
  let n = 0;
  let i = 0;
  while (i < dots.length) {
    if (dots[i].alive == 1) {
      n = n + 1;
    }
    i = i + 1;
  }
  return n;
}

function goToGameOver(play, won) {
  return {
    screen: "gameOver",
    screens: {
      play: play,
      gameOver: {
        score: play.score,
        won: won,
        lives: play.lives
      }
    }
  };
}

function resetAfterHurt(play) {
  const start = findStart();
  const startDir = firstOpenDir(start.col, start.row);
  play.pacCol = start.col;
  play.pacRow = start.row;
  play.pacDir = startDir;
  play.nextDir = startDir;
  play.pacFrac = 0;
  play.ghosts = initGhosts(cfg().ghostStarts);
  play.powered = 0;
  play.powerLeft = 0;
  play.hurtTimer = HURT_MS;
  play.deathTimer = 0;
  play.globalMode = MODE_SCATTER;
  play.modeTimer = SCATTER_MS;
}

function updateSplash(s, props) {
  if (props.action) {
    resetGameData();
    return {
      screen: "play",
      screens: {
        splash: s.screens.splash,
        play: initPlayState(0, 3)
      },
      events: [soundEvent("blip")]
    };
  }
  return s;
}

function clearLevelState(play, score, lives, entities, events) {
  return {
    screen: "play",
    screens: {
      play: {
        showNet: 0,
        entities: entities,
        pacCol: play.pacCol,
        pacRow: play.pacRow,
        pacDir: play.pacDir,
        nextDir: play.nextDir,
        pacFrac: play.pacFrac,
        ghostCd: 0,
        frameSeed: play.frameSeed,
        globalMode: play.globalMode,
        modeTimer: play.modeTimer,
        dots: play.dots,
        powers: play.powers,
        ghosts: play.ghosts,
        score: score,
        lives: lives,
        powered: play.powered,
        powerLeft: play.powerLeft,
        hurtTimer: play.hurtTimer,
        deathTimer: play.deathTimer,
        deathPacCol: play.deathPacCol,
        deathPacRow: play.deathPacRow,
        deathPacFrac: play.deathPacFrac,
        deathPacDir: play.deathPacDir,
        levelCleared: 1,
        celebrateMs: LEVEL_LOAD_MS,
        loadQueued: 0,
        score1: score,
        score2: lives
      }
    },
    events: events
  };
}

function updateLevelCleared(s, props) {
  const play = s.screens.play;
  let celebrateMs = play.celebrateMs - props.dt;
  let loadQueued = play.loadQueued;
  const events = [];
  if (celebrateMs <= 0) {
    celebrateMs = 0;
    if (loadQueued == 0) {
      saveGameData({ score1: play.score, score2: play.lives });
      if (cfg().nextLevel == "") {
        loadGame("win.tsx");
      } else {
        pushGame(cfg().nextLevel);
      }
      loadQueued = 1;
    }
  }
  return {
    screen: "play",
    screens: {
      play: {
        showNet: 0,
        entities: play.entities,
        pacCol: play.pacCol,
        pacRow: play.pacRow,
        pacDir: play.pacDir,
        nextDir: play.nextDir,
        pacFrac: play.pacFrac,
        ghostCd: 0,
        frameSeed: play.frameSeed + 1,
        globalMode: play.globalMode,
        modeTimer: play.modeTimer,
        dots: play.dots,
        powers: play.powers,
        ghosts: play.ghosts,
        score: play.score,
        lives: play.lives,
        powered: play.powered,
        powerLeft: play.powerLeft,
        hurtTimer: play.hurtTimer,
        deathTimer: play.deathTimer,
        deathPacCol: play.deathPacCol,
        deathPacRow: play.deathPacRow,
        deathPacFrac: play.deathPacFrac,
        deathPacDir: play.deathPacDir,
        levelCleared: 1,
        celebrateMs: celebrateMs,
        loadQueued: loadQueued,
        score1: play.score,
        score2: play.lives
      }
    },
    events: events
  };
}

function updatePlay(s, props) {
  const play = s.screens.play;
  if (play.levelCleared == 1) {
    return updateLevelCleared(s, props);
  }

  const events = [];
  const dt = props.dt;
  let nextDir = readInputDir(props, play.nextDir);
  let pacCol = play.pacCol;
  let pacRow = play.pacRow;
  let pacDir = play.pacDir;
  let pacFrac = play.pacFrac;
  let score = play.score;
  let lives = play.lives;
  let powered = play.powered;
  let powerLeft = play.powerLeft;
  let frameSeed = play.frameSeed + 1;
  let globalMode = play.globalMode;
  let modeTimer = play.modeTimer - dt;
  let hurtTimer = play.hurtTimer;
  let deathTimer = play.deathTimer;
  let deathPacCol = play.deathPacCol;
  let deathPacRow = play.deathPacRow;
  let deathPacFrac = play.deathPacFrac;
  let deathPacDir = play.deathPacDir;
  const dots = play.dots;
  const powers = play.powers;
  const ghosts = play.ghosts;
  let moving = 0;
  let blink = 0;
  const eatenDots = [];
  const eatenPowers = [];

  if (deathTimer > 0) {
    deathTimer = deathTimer - dt;
    if (deathTimer <= 0) {
      if (lives <= 0) {
        play.score = score;
        play.lives = 0;
        play.score1 = score;
        play.score2 = 0;
        const over = goToGameOver(play, 0);
        return {
          screen: over.screen,
          screens: over.screens,
          events: events
        };
      }
      resetAfterHurt(play);
      pacCol = play.pacCol;
      pacRow = play.pacRow;
      pacDir = play.pacDir;
      nextDir = play.nextDir;
      pacFrac = play.pacFrac;
      hurtTimer = play.hurtTimer;
      powered = 0;
      powerLeft = 0;
      globalMode = play.globalMode;
      modeTimer = play.modeTimer;
      deathTimer = 0;
    }
  } else if (hurtTimer > 0) {
    hurtTimer = hurtTimer - dt;
    if ((frameSeed % 8) < 4) {
      blink = 1;
    }
  } else {
    if (powered > 0) {
      powerLeft = powerLeft - dt;
      if (powerLeft <= 0) {
        powered = 0;
        powerLeft = 0;
      }
    } else {
      if (modeTimer <= 0) {
        if (globalMode == MODE_SCATTER) {
          globalMode = MODE_CHASE;
          modeTimer = CHASE_MS;
        } else {
          globalMode = MODE_SCATTER;
          modeTimer = SCATTER_MS;
        }
      }
    }

    let hitGh = -1;

    if (pacFrac < 80) {
      pacDir = tryTurn(pacCol, pacRow, pacDir, nextDir);
    }
    pacFrac = pacFrac + ((1000 * dt) / STEP_MS());
    while (pacFrac >= 1000 && hitGh < 0) {
      pacDir = tryTurn(pacCol, pacRow, pacDir, nextDir);
      const mv = tryMove(pacCol, pacRow, pacDir);
      if (mv.ok == 1) {
        pacCol = mv.col;
        pacRow = mv.row;
        pacFrac = pacFrac - 1000;
        moving = 1;
        const eat = eatAt(pacCol, pacRow, dots, powers);
        score = score + eat.score;
        if (eat.eatenDot >= 0) {
          eatenDots.push(eat.eatenDot);
        }
        if (eat.eatenPow >= 0) {
          eatenPowers.push(eat.eatenPow);
        }
        if (eat.powered == 1) {
          powered = 1;
          powerLeft = POWER_MS;
          events.push(soundEvent("brick"));
        } else if (eat.score > 0) {
          events.push(soundEvent("blip"));
        }
        hitGh = hitGhostAt(pacCol, pacRow, ghosts);
      } else {
        pacFrac = 0;
      }
    }

    if (hitGh < 0) {
      let gi = 0;
      while (gi < 4 && hitGh < 0) {
        ghosts[gi].frac = ghosts[gi].frac + ((1000 * dt) / GHOST_STEP_MS());
        while (ghosts[gi].frac >= 1000 && hitGh < 0) {
          const beforeCol = ghosts[gi].col;
          const beforeRow = ghosts[gi].row;
          ghosts[gi] = stepGhostGrid(ghosts[gi], gi, pacCol, pacRow, pacDir, globalMode, powered);
          if (ghosts[gi].col == beforeCol) {
            if (ghosts[gi].row == beforeRow) {
              ghosts[gi].frac = 0;
            } else {
              ghosts[gi].frac = ghosts[gi].frac - 1000;
            }
          } else {
            ghosts[gi].frac = ghosts[gi].frac - 1000;
          }
          hitGh = hitGhostAt(pacCol, pacRow, ghosts);
        }
        gi = gi + 1;
      }
    }

    if (hitGh < 0) {
      hitGh = hitGhostAt(pacCol, pacRow, ghosts);
    }

    if (hitGh >= 0) {
      const touch = applyGhostTouch(hitGh, powered, ghosts, score, lives, pacCol, pacRow, pacFrac, pacDir, events);
      score = touch.score;
      lives = touch.lives;
      deathTimer = touch.deathTimer;
      deathPacCol = touch.deathPacCol;
      deathPacRow = touch.deathPacRow;
      deathPacFrac = touch.deathPacFrac;
      deathPacDir = touch.deathPacDir;
    }
  }

  if (deathTimer <= 0) {
    if (countAliveDots(dots) == 0) {
      events.push(soundEvent("win"));
      const entitiesWin = {};
      placePac(entitiesWin, pacCol, pacRow, pacFrac, pacDir, frameSeed, 0, 0);
      placeGhosts(entitiesWin, ghosts, powered, frameSeed);
      return clearLevelState(play, score, lives, entitiesWin, events);
    }
  }

  const entities = {};
  let hd = 0;
  while (hd < eatenDots.length) {
    entities[dotId(eatenDots[hd])] = { x: -40, y: -40, visible: 0 };
    hd = hd + 1;
  }
  let hp = 0;
  while (hp < eatenPowers.length) {
    entities[powerId(eatenPowers[hp])] = { x: -40, y: -40, visible: 0 };
    hp = hp + 1;
  }
  if (deathTimer > 0) {
    placePacDeath(entities, deathPacCol, deathPacRow, deathPacFrac, deathPacDir, frameSeed);
  } else {
    placePac(entities, pacCol, pacRow, pacFrac, pacDir, frameSeed, moving, blink);
  }
  placeGhosts(entities, ghosts, powered, frameSeed);

  return {
    screen: "play",
    screens: {
      play: {
        showNet: 0,
        entities: entities,
        pacCol: pacCol,
        pacRow: pacRow,
        pacDir: pacDir,
        nextDir: nextDir,
        pacFrac: pacFrac,
        ghostCd: 0,
        frameSeed: frameSeed,
        globalMode: globalMode,
        modeTimer: modeTimer,
        dots: dots,
        powers: powers,
        ghosts: ghosts,
        score: score,
        lives: lives,
        powered: powered,
        powerLeft: powerLeft,
        hurtTimer: hurtTimer,
        deathTimer: deathTimer,
        deathPacCol: deathPacCol,
        deathPacRow: deathPacRow,
        deathPacFrac: deathPacFrac,
        deathPacDir: deathPacDir,
        levelCleared: 0,
        celebrateMs: 0,
        loadQueued: 0,
        score1: score,
        score2: lives
      }
    },
    events: events
  };
}

function updateGameOver(s, props) {
  if (props.action) {
    resetGameData();
    return {
      screen: "splash",
      screens: {
        gameOver: s.screens.gameOver,
        splash: initSplashState(),
        play: initPlayState(0, 3)
      }
    };
  }
  return s;
}

export function runUpdate(props) {
  const s = props.state;
  const sc = s.screen;
  if (sc == "splash") {
    return updateSplash(s, props);
  }
  if (sc == "play") {
    return updatePlay(s, props);
  }
  if (sc == "gameOver") {
    return updateGameOver(s, props);
  }
  return s;
}

function modeLabel(mode, powered) {
  if (powered > 0) {
    return "FRIGHT";
  }
  if (mode == MODE_CHASE) {
    return "CHASE";
  }
  return "SCATTER";
}

function hudScreen(props) {
  if (props.screen) {
    return props.screen;
  }
  return props.state.screen;
}

export function playHud(props) {
  const sc = hudScreen(props);

  if (sc == "splash") {
    return (
      <View width="100%" height="100%" flexDirection="column" justifyContent="center" align="center">
        <Label color="#fff060">PAC-MAN</Label>
        <Label color="#8fd3ff">{cfg().label}</Label>
        <Label color="#ffffff">PRESS SPACE TO START</Label>
      </View>
    );
  }

  const s = props.state;

  if (sc == "gameOver") {
    const go = s.screens.gameOver;
    let title = "GAME OVER";
    if (go.won == 1) {
      title = "YOU WIN";
    }
    return (
      <View flexDirection="row" padding="8px">
        <Label color="#8fd3ff">{title}</Label>
        <Label flex="1" />
        <Label color="#ffffff">SCORE {go.score}</Label>
        <Label flex="1" />
        <Label color="#ff8899">SPACE RESTART</Label>
      </View>
    );
  }

  const play = s.screens.play;
  const tag = modeLabel(play.globalMode, play.powered);
  let hurtLabel = "";
  if (play.levelCleared == 1) {
    hurtLabel = " CLEAR";
  } else if (play.deathTimer > 0) {
    hurtLabel = " DEAD";
  } else if (play.hurtTimer > 0) {
    hurtLabel = " OUCH";
  }
  return (
    <View flexDirection="row" padding="6px">
      <Label color="#fff060">{cfg().label}</Label>
      <Label flex="1" />
      <Label color="#aaaaaa">{tag}{hurtLabel}</Label>
      <Label flex="1" />
      <Label color="#ffffff">SCORE</Label>
      <Label color="#8fd3ff">{play.score}</Label>
      <Label flex="1" />
      <Label color="#ff8899">LIVES</Label>
      <Label color="#ff8899">{play.lives}</Label>
    </View>
  );
}
