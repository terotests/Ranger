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
import { pickAiMove, uciOf } from "./chess_ai";

const TILE = 28;
const ORIGIN_X = 128;
const ORIGIN_Y = 22;
const MAX_PIECES = 32;
const MAX_MARKS = 28;

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
  list.push({ id: "cursor", kind: "rect", w: TILE - 2, h: TILE - 2, r: 255, g: 230, b: 80 });
  list.push({ id: "sel", kind: "rect", w: TILE - 2, h: TILE - 2, r: 80, g: 200, b: 255 });
  list.push({ id: "lastFrom", kind: "rect", w: TILE - 2, h: TILE - 2, r: 200, g: 180, b: 60 });
  list.push({ id: "lastTo", kind: "rect", w: TILE - 2, h: TILE - 2, r: 200, g: 180, b: 60 });
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
      frameW: 28,
      frameH: 28,
      cols: 6,
      rows: 2,
      scale: 100,
      feetTrim: 1,
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

  if (s.lastFrom >= 0) {
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
  if (s.lastTo >= 0) {
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

function playerCanAct(s) {
  if (s.status == "mate") { return 0; }
  if (s.status == "stalemate") { return 0; }
  if (s.mode == "cpu" && s.turn < 0) { return 0; }
  return 1;
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
    if (wait < 18) {
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
    const ai = pickAiMove(s.board, s.turn, s.ep, s.rights, s.history, s.seed);
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
            selSq = target;
            ev = [{ kind: "playSound", id: "blip" }];
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
            // Re-select if own piece
            const p = board[target];
            let pc = 0;
            if (p > 0) { pc = 1; }
            if (p < 0) { pc = -1; }
            if (pc == turn) {
              selSq = target;
            } else {
              selSq = -1;
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

  return (
    <View width="100%" height="100%" flexDirection="row">
      <View width="120px" height="100%" flexDirection="column" justifyContent="center" alignItems="flex-start" padding="8px">
        <Label color="#f2e6c8" fontSize="18px">Shakki</Label>
        <Label color="#c8ddb0" fontSize="12px">{modeLabel}</Label>
        <Label color="#e6c35c" fontSize="14px">{s.msg}</Label>
        <Label color="#a8c4a0" fontSize="12px">Kohdistin {side}</Label>
        <Label color="#8aab88" fontSize="12px">Space = valitse</Label>
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
