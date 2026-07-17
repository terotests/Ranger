/// <reference path="../../scripting/game.d.ts" />
//
// Chess — two-player or vs computer. PNG piece sprites, painted board on a
// felt backdrop, legal-move highlights, known openings then simple heuristics.
//
// Controls: arrows move the cursor, Space selects / moves, B/Select cancels.
//
// Run: npm run engine:game-sdl:run:chess
//      or launcher → Chess

import {
  applyFullMove,
  cloneBoard,
  gameStatus,
  legalMovesFrom,
  sheetCol,
  sheetRow,
  sq,
  sqCol,
  sqRow,
  startBoard
} from "./chess_rules";
import { AI_MAX_THINK_FRAMES, pickAiMove, pickAnyMove, uciOf } from "./chess_ai";

const TILE = 28;
const ORIGIN_X = 128;
const ORIGIN_Y = 22;
const MAX_PIECES = 32;
const MAX_MARKS = 28;
const AI_PAUSE_FRAMES = 8;

function resources() {
  return [
    { kind: "image", id: "bg", path: "assets/board_bg.png" }
  ];
}

function backgroundImage() {
  return "bg";
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

function pieceId(i) {
  return ("pc" + i);
}

function markId(i) {
  return ("mk" + i);
}

function sprites() {
  const list = [];
  // Draw order = sprites() order. Last-move must sit under cursor/selection,
  // otherwise a muted lastTo square hides the bright yellow cursor (e.g. when
  // targeting the square the opponent just moved to).
  list.push({ id: "lastFrom", kind: "rect", w: TILE - 2, h: TILE - 2, r: 200, g: 180, b: 60 });
  list.push({ id: "lastTo", kind: "rect", w: TILE - 2, h: TILE - 2, r: 200, g: 180, b: 60 });
  list.push({ id: "sel", kind: "rect", w: TILE - 2, h: TILE - 2, r: 80, g: 200, b: 255 });
  list.push({ id: "cursor", kind: "rect", w: TILE - 2, h: TILE - 2, r: 255, g: 230, b: 80 });
  let i = 0;
  while (i < MAX_MARKS) {
    list.push({ id: markId(i), kind: "circle", rad: 5, r: 70, g: 220, b: 120 });
    i = i + 1;
  }
  i = 0;
  while (i < MAX_PIECES) {
    list.push({
      id: pieceId(i),
      kind: "sheet",
      path: "assets/pieces.png",
      frameW: 16,
      frameH: 16,
      cols: 6,
      rows: 2,
      // 16px SpicyGame pixels → ~28px on the board (TILE).
      scale: 175,
      feetTrim: 0,
      jumpFrame: 0
    });
    i = i + 1;
  }
  return list;
}

function emptyHistory() {
  return [];
}

function initPlay(mode) {
  return {
    screen: "play",
    mode: mode,
    board: startBoard(),
    turn: 1,
    ep: -1,
    rights: 15,
    cursorCol: 4,
    cursorRow: 6,
    selSq: -1,
    status: "ok",
    history: emptyHistory(),
    lastFrom: -1,
    lastTo: -1,
    seed: 424242,
    aiWait: 0,
    msg: "Valkoisen vuoro",
    score1: 0,
    score2: 0,
    showNet: 0,
    pUp: 0,
    pDown: 0,
    pLeft: 0,
    pRight: 0,
    pAct: 0,
    pB: 0
  };
}

function initState() {
  return {
    screen: "menu",
    mode: "cpu",
    sel: 0,
    board: startBoard(),
    turn: 1,
    ep: -1,
    rights: 15,
    cursorCol: 4,
    cursorRow: 6,
    selSq: -1,
    status: "ok",
    history: emptyHistory(),
    lastFrom: -1,
    lastTo: -1,
    seed: 424242,
    aiWait: 0,
    msg: "Shakki",
    score1: 0,
    score2: 0,
    showNet: 0,
    entities: {},
    pUp: 0,
    pDown: 0,
    pLeft: 0,
    pRight: 0,
    pAct: 0,
    pB: 0
  };
}

function statusMessage(status, turn) {
  if (status == "mate") {
    if (turn > 0) {
      return "Shakkimatti — musta voittaa";
    }
    return "Shakkimatti — valkoinen voittaa";
  }
  if (status == "stalemate") {
    return "Patt — tasapeli";
  }
  if (status == "check") {
    if (turn > 0) {
      return "Shakki — valkoinen";
    }
    return "Shakki — musta";
  }
  if (turn > 0) {
    return "Valkoisen vuoro";
  }
  return "Mustan vuoro";
}

function buildEntities(s) {
  const entities = {};
  const curVis = 1;
  entities.cursor = {
    x: tileX(s.cursorCol),
    y: tileY(s.cursorRow),
    visible: curVis,
    r: 255,
    g: 230,
    b: 80
  };

  if (s.selSq >= 0) {
    entities.sel = {
      x: tileX(sqCol(s.selSq)),
      y: tileY(sqRow(s.selSq)),
      visible: 1,
      r: 80,
      g: 200,
      b: 255
    };
  } else {
    entities.sel = { x: -40, y: -40, visible: 0 };
  }

  // Hide last-move tint on the square under the cursor (or selection) so the
  // bright yellow / cyan highlight always reads clearly.
  const curSq = sq(s.cursorCol, s.cursorRow);
  if (s.lastFrom >= 0 && s.lastFrom != curSq && s.lastFrom != s.selSq) {
    entities.lastFrom = {
      x: tileX(sqCol(s.lastFrom)),
      y: tileY(sqRow(s.lastFrom)),
      visible: 1,
      r: 200,
      g: 170,
      b: 50
    };
  } else {
    entities.lastFrom = { x: -40, y: -40, visible: 0 };
  }
  if (s.lastTo >= 0 && s.lastTo != curSq && s.lastTo != s.selSq) {
    entities.lastTo = {
      x: tileX(sqCol(s.lastTo)),
      y: tileY(sqRow(s.lastTo)),
      visible: 1,
      r: 220,
      g: 190,
      b: 60
    };
  } else {
    entities.lastTo = { x: -40, y: -40, visible: 0 };
  }

  // Legal-move markers
  let marks = [];
  if (s.selSq >= 0 && s.status != "mate" && s.status != "stalemate") {
    marks = legalMovesFrom(s.board, s.selSq, s.turn, s.ep, s.rights);
  }
  let mi = 0;
  while (mi < MAX_MARKS) {
    if (mi < marks.length) {
      const m = marks[mi];
      let rad = 5;
      let r = 70;
      let g = 220;
      let b = 120;
      if (m.flags == 1 || m.flags == 3 || m.flags == 5) {
        rad = 7;
        r = 240;
        g = 90;
        b = 70;
      }
      entities[markId(mi)] = {
        x: tileX(sqCol(m.to)),
        y: tileY(sqRow(m.to)),
        visible: 1,
        rad: rad,
        r: r,
        g: g,
        b: b
      };
    } else {
      entities[markId(mi)] = { x: -40, y: -40, visible: 0 };
    }
    mi = mi + 1;
  }

  // Pieces — feet near bottom of square
  let pi = 0;
  let sqi = 0;
  while (sqi < 64) {
    const p = s.board[sqi];
    if (p != 0 && pi < MAX_PIECES) {
      const c = sqCol(sqi);
      const r = sqRow(sqi);
      entities[pieceId(pi)] = {
        x: tileX(c),
        y: tileTop(r) + TILE - 2,
        visible: 1,
        p0: sheetCol(p),
        p1: sheetRow(p),
        p2: 0
      };
      pi = pi + 1;
    }
    sqi = sqi + 1;
  }
  while (pi < MAX_PIECES) {
    entities[pieceId(pi)] = { x: -40, y: -40, visible: 0, p0: 0, p1: 0, p2: 0 };
    pi = pi + 1;
  }
  return entities;
}

function cloneHistory(h) {
  const out = [];
  let i = 0;
  while (i < h.length) {
    out.push(h[i]);
    i = i + 1;
  }
  return out;
}

function doMove(s, move) {
  const next = applyFullMove(s.board, move, s.turn, s.ep, s.rights);
  const hist = cloneHistory(s.history);
  hist.push(uciOf(move));
  const st = gameStatus(next.board, next.color, next.ep, next.rights);
  let score1 = s.score1;
  let score2 = s.score2;
  if (st == "mate") {
    if (next.color > 0) {
      score2 = score2 + 1;
    } else {
      score1 = score1 + 1;
    }
  }
  return {
    screen: "play",
    mode: s.mode,
    board: next.board,
    turn: next.color,
    ep: next.ep,
    rights: next.rights,
    cursorCol: s.cursorCol,
    cursorRow: s.cursorRow,
    selSq: -1,
    status: st,
    history: hist,
    lastFrom: move.from,
    lastTo: move.to,
    seed: s.seed,
    aiWait: 0,
    msg: statusMessage(st, next.color),
    score1: score1,
    score2: score2,
    showNet: 0,
    pUp: s.pUp,
    pDown: s.pDown,
    pLeft: s.pLeft,
    pRight: s.pRight,
    pAct: s.pAct,
    pB: s.pB
  };
}

function findLegalTo(s, toSq) {
  if (s.selSq < 0) {
    return null;
  }
  const moves = legalMovesFrom(s.board, s.selSq, s.turn, s.ep, s.rights);
  let i = 0;
  while (i < moves.length) {
    if (moves[i].to == toSq) {
      return moves[i];
    }
    i = i + 1;
  }
  return null;
}

// Pieces of `turn` that can legally capture/move to `toSq`.
function findCapturersOf(board, turn, ep, rights, toSq) {
  const out = [];
  let srcSq = 0;
  while (srcSq < 64) {
    const p = board[srcSq];
    if (p != 0) {
      let pc = 0;
      if (p > 0) { pc = 1; }
      if (p < 0) { pc = -1; }
      if (pc == turn) {
        const moves = legalMovesFrom(board, srcSq, turn, ep, rights);
        let i = 0;
        while (i < moves.length) {
          if (moves[i].to == toSq) {
            out.push(moves[i]);
          }
          i = i + 1;
        }
      }
    }
    srcSq = srcSq + 1;
  }
  return out;
}

function playerCanAct(s) {
  if (s.status == "mate") { return 0; }
  if (s.status == "stalemate") { return 0; }
  if (s.mode == "cpu" && s.turn < 0) { return 0; }
  return 1;
}

// Allowed cursor squares while a piece is selected: origin + legal destinations.
function collectMoveTargets(board, selSq, turn, ep, rights) {
  const out = [];
  out.push({ c: sqCol(selSq), r: sqRow(selSq) });
  const moves = legalMovesFrom(board, selSq, turn, ep, rights);
  let i = 0;
  while (i < moves.length) {
    out.push({ c: sqCol(moves[i].to), r: sqRow(moves[i].to) });
    i = i + 1;
  }
  return out;
}

// Step cursor among targets in a direction; wraps to the far side if needed.
function stepAmongTargets(targets, col, row, dcol, drow) {
  let bestC = col;
  let bestR = row;
  let bestKey = 999999;
  let found = 0;
  let i = 0;
  while (i < targets.length) {
    const tc = targets[i].c;
    const tr = targets[i].r;
    if (tc != col || tr != row) {
      const dc = tc - col;
      const dr = tr - row;
      let ok = 0;
      if (dcol == 1 && dc > 0) { ok = 1; }
      if (dcol == 0 - 1 && dc < 0) { ok = 1; }
      if (drow == 1 && dr > 0) { ok = 1; }
      if (drow == 0 - 1 && dr < 0) { ok = 1; }
      if (ok == 1) {
        let primary = 0;
        let secondary = 0;
        if (dcol != 0) {
          primary = dc * dcol;
          secondary = dr;
          if (secondary < 0) { secondary = 0 - secondary; }
        } else {
          primary = dr * drow;
          secondary = dc;
          if (secondary < 0) { secondary = 0 - secondary; }
        }
        const key = primary * 100 + secondary;
        if (found == 0 || key < bestKey) {
          bestKey = key;
          bestC = tc;
          bestR = tr;
          found = 1;
        }
      }
    }
    i = i + 1;
  }
  if (found == 1) {
    return { c: bestC, r: bestR };
  }
  // Wrap: pick the extreme target in the travel direction.
  if (targets.length == 0) {
    return { c: col, r: row };
  }
  let wrapC = targets[0].c;
  let wrapR = targets[0].r;
  i = 1;
  while (i < targets.length) {
    const tc = targets[i].c;
    const tr = targets[i].r;
    if (dcol == 1) {
      if (tc < wrapC || (tc == wrapC && tr < wrapR)) {
        wrapC = tc;
        wrapR = tr;
      }
    }
    if (dcol == 0 - 1) {
      if (tc > wrapC || (tc == wrapC && tr > wrapR)) {
        wrapC = tc;
        wrapR = tr;
      }
    }
    if (drow == 1) {
      if (tr < wrapR || (tr == wrapR && tc < wrapC)) {
        wrapC = tc;
        wrapR = tr;
      }
    }
    if (drow == 0 - 1) {
      if (tr > wrapR || (tr == wrapR && tc > wrapC)) {
        wrapC = tc;
        wrapR = tr;
      }
    }
    i = i + 1;
  }
  return { c: wrapC, r: wrapR };
}

function update(props) {
  const s = props.state;

  const up = props.up && !s.pUp;
  const down = props.down && !s.pDown;
  const left = props.left && !s.pLeft;
  const right = props.right && !s.pRight;
  const act = props.action && !s.pAct;

  let bEdge = 0;
  let bHeld = 0;
  if (props.input) {
    if (props.input.players) {
      if (props.input.players.length > 0) {
        const p0 = props.input.players[0];
        if (p0.b) { bHeld = 1; }
        if (p0.select) { bHeld = 1; }
      }
    }
  }
  if (bHeld == 1 && s.pB == 0) {
    bEdge = 1;
  }

  let pUp = 0; if (props.up) { pUp = 1; }
  let pDown = 0; if (props.down) { pDown = 1; }
  let pLeft = 0; if (props.left) { pLeft = 1; }
  let pRight = 0; if (props.right) { pRight = 1; }
  let pAct = 0; if (props.action) { pAct = 1; }

  let ev = [];

  if (s.screen == "menu") {
    let sel = s.sel;
    if (up || down) {
      if (sel == 0) { sel = 1; } else { sel = 0; }
    }
    if (left || right) {
      if (sel == 0) { sel = 1; } else { sel = 0; }
    }
    if (act) {
      let mode = "cpu";
      if (sel == 1) { mode = "pvp"; }
      const play = initPlay(mode);
      play.pUp = pUp;
      play.pDown = pDown;
      play.pLeft = pLeft;
      play.pRight = pRight;
      play.pAct = pAct;
      play.pB = bHeld;
      play.entities = buildEntities(play);
      play.events = [{ kind: "playSound", id: "blip" }];
      return play;
    }
    return {
      screen: "menu",
      mode: s.mode,
      sel: sel,
      board: s.board,
      turn: s.turn,
      ep: s.ep,
      rights: s.rights,
      cursorCol: s.cursorCol,
      cursorRow: s.cursorRow,
      selSq: s.selSq,
      status: s.status,
      history: s.history,
      lastFrom: s.lastFrom,
      lastTo: s.lastTo,
      seed: s.seed,
      aiWait: 0,
      msg: s.msg,
      score1: s.score1,
      score2: s.score2,
      showNet: 0,
      entities: {},
      pUp: pUp,
      pDown: pDown,
      pLeft: pLeft,
      pRight: pRight,
      pAct: pAct,
      pB: bHeld,
      events: ev
    };
  }

  // End screen — Space returns to menu
  if (s.status == "mate" || s.status == "stalemate") {
    if (act) {
      const st = initState();
      st.pUp = pUp;
      st.pDown = pDown;
      st.pLeft = pLeft;
      st.pRight = pRight;
      st.pAct = pAct;
      st.pB = bHeld;
      return st;
    }
    const hold = {
      screen: "play",
      mode: s.mode,
      board: cloneBoard(s.board),
      turn: s.turn,
      ep: s.ep,
      rights: s.rights,
      cursorCol: s.cursorCol,
      cursorRow: s.cursorRow,
      selSq: -1,
      status: s.status,
      history: cloneHistory(s.history),
      lastFrom: s.lastFrom,
      lastTo: s.lastTo,
      seed: s.seed,
      aiWait: 0,
      msg: s.msg,
      score1: s.score1,
      score2: s.score2,
      showNet: 0,
      pUp: pUp,
      pDown: pDown,
      pLeft: pLeft,
      pRight: pRight,
      pAct: pAct,
      pB: bHeld
    };
    hold.entities = buildEntities(hold);
    hold.events = ev;
    return hold;
  }

  // AI turn (black when mode == cpu)
  if (s.mode == "cpu" && s.turn < 0) {
    let wait = s.aiWait + 1;
    if (wait < AI_PAUSE_FRAMES) {
      const thinking = {
        screen: "play",
        mode: s.mode,
        board: cloneBoard(s.board),
        turn: s.turn,
        ep: s.ep,
        rights: s.rights,
        cursorCol: s.cursorCol,
        cursorRow: s.cursorRow,
        selSq: -1,
        status: s.status,
        history: cloneHistory(s.history),
        lastFrom: s.lastFrom,
        lastTo: s.lastTo,
        seed: s.seed,
        aiWait: wait,
        msg: "Tietokone miettii…",
        score1: s.score1,
        score2: s.score2,
        showNet: 0,
        pUp: pUp,
        pDown: pDown,
        pLeft: pLeft,
        pRight: pRight,
        pAct: pAct,
        pB: bHeld
      };
      thinking.entities = buildEntities(thinking);
      thinking.events = ev;
      return thinking;
    }
    let ai = pickAiMove(s.board, s.turn, s.ep, s.rights, s.history, s.seed);
    // Hard cap: never leave the "thinking" screen stuck — pick any legal move.
    if (ai.move == null && wait >= AI_MAX_THINK_FRAMES) {
      ai = pickAnyMove(s.board, s.turn, s.ep, s.rights, s.seed + wait);
    }
    if (ai.move != null) {
      const moved = doMove(s, ai.move);
      moved.seed = ai.seed;
      moved.pUp = pUp;
      moved.pDown = pDown;
      moved.pLeft = pLeft;
      moved.pRight = pRight;
      moved.pAct = pAct;
      moved.pB = bHeld;
      moved.entities = buildEntities(moved);
      moved.events = [{ kind: "playSound", id: "blip" }];
      return moved;
    }
    // Still no move (should be rare) — keep a short think state, then force.
    const stall = {
      screen: "play",
      mode: s.mode,
      board: cloneBoard(s.board),
      turn: s.turn,
      ep: s.ep,
      rights: s.rights,
      cursorCol: s.cursorCol,
      cursorRow: s.cursorRow,
      selSq: -1,
      status: s.status,
      history: cloneHistory(s.history),
      lastFrom: s.lastFrom,
      lastTo: s.lastTo,
      seed: s.seed,
      aiWait: wait,
      msg: "Tietokone miettii…",
      score1: s.score1,
      score2: s.score2,
      showNet: 0,
      pUp: pUp,
      pDown: pDown,
      pLeft: pLeft,
      pRight: pRight,
      pAct: pAct,
      pB: bHeld
    };
    stall.entities = buildEntities(stall);
    stall.events = ev;
    return stall;
  }

  let cursorCol = s.cursorCol;
  let cursorRow = s.cursorRow;
  let selSq = s.selSq;
  let board = cloneBoard(s.board);
  let turn = s.turn;
  let ep = s.ep;
  let rights = s.rights;
  let history = cloneHistory(s.history);
  let lastFrom = s.lastFrom;
  let lastTo = s.lastTo;
  let status = s.status;
  let msg = s.msg;
  let score1 = s.score1;
  let score2 = s.score2;
  let seed = s.seed;

  if (playerCanAct(s) == 1) {
    if (selSq >= 0) {
      // After selecting a piece, arrows jump only among legal targets (+ origin).
      const targets = collectMoveTargets(board, selSq, turn, ep, rights);
      if (up) {
        const n = stepAmongTargets(targets, cursorCol, cursorRow, 0, 0 - 1);
        cursorCol = n.c;
        cursorRow = n.r;
      }
      if (down) {
        const n = stepAmongTargets(targets, cursorCol, cursorRow, 0, 1);
        cursorCol = n.c;
        cursorRow = n.r;
      }
      if (left) {
        const n = stepAmongTargets(targets, cursorCol, cursorRow, 0 - 1, 0);
        cursorCol = n.c;
        cursorRow = n.r;
      }
      if (right) {
        const n = stepAmongTargets(targets, cursorCol, cursorRow, 1, 0);
        cursorCol = n.c;
        cursorRow = n.r;
      }
    } else {
      if (up) {
        cursorRow = cursorRow - 1;
        if (cursorRow < 0) { cursorRow = 7; }
      }
      if (down) {
        cursorRow = cursorRow + 1;
        if (cursorRow > 7) { cursorRow = 0; }
      }
      if (left) {
        cursorCol = cursorCol - 1;
        if (cursorCol < 0) { cursorCol = 7; }
      }
      if (right) {
        cursorCol = cursorCol + 1;
        if (cursorCol > 7) { cursorCol = 0; }
      }
    }
    if (bEdge == 1) {
      selSq = -1;
    }
    if (act) {
      const target = sq(cursorCol, cursorRow);
      if (selSq < 0) {
        const p = board[target];
        if (p != 0) {
          // pieceColor inline
          let pc = 0;
          if (p > 0) { pc = 1; }
          if (p < 0) { pc = -1; }
          if (pc == turn) {
            // Only select pieces that have at least one legal move.
            const ownMoves = legalMovesFrom(board, target, turn, ep, rights);
            if (ownMoves.length > 0) {
              selSq = target;
              cursorCol = sqCol(target);
              cursorRow = sqRow(target);
              ev = [{ kind: "playSound", id: "blip" }];
            }
          } else {
            // Space on enemy: capture with the first legal capturer.
            // (Pick a specific own piece first if you want a different taker.)
            const caps = findCapturersOf(board, turn, ep, rights, target);
            if (caps.length > 0) {
              const moved = doMove({
                screen: "play",
                mode: s.mode,
                board: board,
                turn: turn,
                ep: ep,
                rights: rights,
                cursorCol: cursorCol,
                cursorRow: cursorRow,
                selSq: caps[0].from,
                status: status,
                history: history,
                lastFrom: lastFrom,
                lastTo: lastTo,
                seed: seed,
                aiWait: 0,
                msg: msg,
                score1: score1,
                score2: score2,
                showNet: 0,
                pUp: pUp,
                pDown: pDown,
                pLeft: pLeft,
                pRight: pRight,
                pAct: pAct,
                pB: bHeld
              }, caps[0]);
              moved.entities = buildEntities(moved);
              moved.events = [{ kind: "playSound", id: "blip" }];
              return moved;
            }
          }
        }
      } else {
        if (selSq == target) {
          selSq = -1;
        } else {
          const tmp = {
            board: board,
            turn: turn,
            ep: ep,
            rights: rights,
            selSq: selSq,
            status: status
          };
          const mv = findLegalTo(tmp, target);
          if (mv != null) {
            const moved = doMove({
              screen: "play",
              mode: s.mode,
              board: board,
              turn: turn,
              ep: ep,
              rights: rights,
              cursorCol: cursorCol,
              cursorRow: cursorRow,
              selSq: selSq,
              status: status,
              history: history,
              lastFrom: lastFrom,
              lastTo: lastTo,
              seed: seed,
              aiWait: 0,
              msg: msg,
              score1: score1,
              score2: score2,
              showNet: 0,
              pUp: pUp,
              pDown: pDown,
              pLeft: pLeft,
              pRight: pRight,
              pAct: pAct,
              pB: bHeld
            }, mv);
            moved.entities = buildEntities(moved);
            moved.events = [{ kind: "playSound", id: "blip" }];
            return moved;
          } else {
            // Selected piece cannot go here — try any capturer, or re-select.
            const p = board[target];
            let pc = 0;
            if (p > 0) { pc = 1; }
            if (p < 0) { pc = -1; }
            if (pc == turn) {
              const ownMoves = legalMovesFrom(board, target, turn, ep, rights);
              if (ownMoves.length > 0) {
                selSq = target;
              }
            } else {
              if (p != 0 && pc != turn) {
                const caps = findCapturersOf(board, turn, ep, rights, target);
                if (caps.length > 0) {
                  const moved = doMove({
                    screen: "play",
                    mode: s.mode,
                    board: board,
                    turn: turn,
                    ep: ep,
                    rights: rights,
                    cursorCol: cursorCol,
                    cursorRow: cursorRow,
                    selSq: caps[0].from,
                    status: status,
                    history: history,
                    lastFrom: lastFrom,
                    lastTo: lastTo,
                    seed: seed,
                    aiWait: 0,
                    msg: msg,
                    score1: score1,
                    score2: score2,
                    showNet: 0,
                    pUp: pUp,
                    pDown: pDown,
                    pLeft: pLeft,
                    pRight: pRight,
                    pAct: pAct,
                    pB: bHeld
                  }, caps[0]);
                  moved.entities = buildEntities(moved);
                  moved.events = [{ kind: "playSound", id: "blip" }];
                  return moved;
                }
                selSq = -1;
              } else {
                selSq = -1;
              }
            }
          }
        }
      }
    }
  }

  const out = {
    screen: "play",
    mode: s.mode,
    board: board,
    turn: turn,
    ep: ep,
    rights: rights,
    cursorCol: cursorCol,
    cursorRow: cursorRow,
    selSq: selSq,
    status: status,
    history: history,
    lastFrom: lastFrom,
    lastTo: lastTo,
    seed: seed,
    aiWait: 0,
    msg: msg,
    score1: score1,
    score2: score2,
    showNet: 0,
    pUp: pUp,
    pDown: pDown,
    pLeft: pLeft,
    pRight: pRight,
    pAct: pAct,
    pB: bHeld,
    events: ev
  };
  out.entities = buildEntities(out);
  return out;
}

function fileLabel(col) {
  const files = "abcdefgh";
  return files.substring(col, col + 1);
}

function hud(props) {
  const s = props.state;

  if (s.screen == "menu") {
    let c0 = "#8aab88";
    let c1 = "#8aab88";
    let b0 = "#1a3328";
    let b1 = "#1a3328";
    if (s.sel == 0) {
      c0 = "#1a2418";
      b0 = "#e6c35c";
    } else {
      c1 = "#1a2418";
      b1 = "#e6c35c";
    }
    return (
      <View width="100%" height="100%" flexDirection="column" justifyContent="center" alignItems="center">
        <Label color="#f2e6c8" fontSize="48px">SHAKKI</Label>
        <Label color="#9cbf9a" fontSize="14px">Nuolet + Space — valitse tila</Label>
        <View width="320px" flexDirection="column" alignItems="center" margin="12px">
          <View backgroundColor={b0} width="260px" height="40px" margin="6px" flexDirection="column" alignItems="center" justifyContent="center">
            <Label color={c0} fontSize="22px">vs Tietokone</Label>
          </View>
          <View backgroundColor={b1} width="260px" height="40px" margin="6px" flexDirection="column" alignItems="center" justifyContent="center">
            <Label color={c1} fontSize="22px">Kaksinpeli</Label>
          </View>
        </View>
      </View>
    );
  }

  const side = fileLabel(s.cursorCol) + (8 - s.cursorRow);
  let modeLabel = "2P";
  if (s.mode == "cpu") {
    modeLabel = "CPU";
  }
  let endHint = "";
  if (s.status == "mate" || s.status == "stalemate") {
    endHint = "Space = valikko";
  }
  let moveHint = "Space = valitse";
  if (s.selSq >= 0) {
    moveHint = "Nuolet = lailliset";
  }

  return (
    <View width="100%" height="100%" flexDirection="row">
      <View width="120px" height="100%" flexDirection="column" justifyContent="center" alignItems="flex-start" padding="8px">
        <Label color="#f2e6c8" fontSize="18px">Shakki</Label>
        <Label color="#c8ddb0" fontSize="12px">{modeLabel}</Label>
        <Label color="#e6c35c" fontSize="14px">{s.msg}</Label>
        <Label color="#a8c4a0" fontSize="12px">Kohdistin {side}</Label>
        <Label color="#8aab88" fontSize="12px">{moveHint}</Label>
        <Label color="#6f8f6c" fontSize="12px">{endHint}</Label>
      </View>
      <View width="240px" height="100%" />
      <View width="120px" height="100%" flexDirection="column" justifyContent="center" alignItems="flex-end" padding="8px">
        <Label color="#f2e6c8" fontSize="14px">Siirrot {s.history.length}</Label>
        <Label color="#d8c49a" fontSize="12px">Vaalea {s.score1}</Label>
        <Label color="#9aa0b0" fontSize="12px">Tumma {s.score2}</Label>
      </View>
    </View>
  );
}
