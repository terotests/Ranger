/// <reference path="../../scripting/game.d.ts" />
//
// Lightweight chess AI: known openings for the first few plies, then a
// cheap 1-ply heuristic (material + center + captures). No deep look-ahead —
// the TSX interpreter cannot afford per-reply legal-move generation.

import {
  allLegalMoves,
  applyFullMove,
  findMoveByUci,
  inCheck,
  materialScore,
  moveToUci,
  pieceColor,
  absPiece,
  sqCol,
  sqRow
} from "./chess_rules";

// Each line is a list of UCI half-moves from the starting position.
const OPENINGS = [
  ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"],
  ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4"],
  ["e2e4", "e7e5", "g1f3", "g8f6"],
  ["e2e4", "c7c5", "g1f3", "d7d6", "d2d4"],
  ["d2d4", "d7d5", "c2c4", "e7e6"],
  ["d2d4", "g8f6", "c2c4", "e7e6"],
  ["g1f3", "d7d5", "d2d4", "g8f6"],
  ["e2e4", "e7e6", "d2d4", "d7d5"]
];

// Soft cap: if scoring somehow stalls, force a pick after this many think frames.
export const AI_MAX_THINK_FRAMES = 36;

function nextSeed(seed) {
  return (seed * 1103515245 + 12345) % 2147483647;
}

function centerBonus(sq) {
  const c = sqCol(sq);
  const r = sqRow(sq);
  let b = 0;
  if (c >= 2 && c <= 5) { b = b + 4; }
  if (r >= 2 && r <= 5) { b = b + 4; }
  if (c >= 3 && c <= 4 && r >= 3 && r <= 4) { b = b + 8; }
  return b;
}

function pieceSquare(p, sq) {
  const k = absPiece(p);
  let s = centerBonus(sq);
  const r = sqRow(sq);
  if (k == 1) {
    if (p > 0) {
      s = s + (6 - r) * 3;
    } else {
      s = s + (r - 1) * 3;
    }
  }
  if (k == 2 || k == 3) {
    s = s + 6;
  }
  return s;
}

function evaluate(board, color) {
  let mat = materialScore(board);
  if (color < 0) {
    mat = 0 - mat;
  }
  let pos = 0;
  let i = 0;
  while (i < 64) {
    const p = board[i];
    if (p != 0) {
      const ps = pieceSquare(p, i);
      if (pieceColor(p) == color) {
        pos = pos + ps;
      } else {
        pos = pos - ps;
      }
    }
    i = i + 1;
  }
  return mat + pos;
}

function scoreMove(board, move, color, ep, rights) {
  const before = evaluate(board, color);
  const next = applyFullMove(board, move, color, ep, rights);
  let score = evaluate(next.board, color) - before;

  // Captures / specials (cheap flags — no reply search).
  if (move.flags == 1 || move.flags == 3 || move.flags == 5) {
    score = score + 35;
  }
  if (move.flags == 2 || move.flags == 3) {
    score = score + 80;
  }
  if (move.flags == 6 || move.flags == 7) {
    score = score + 40;
  }
  if (inCheck(next.board, next.color) == 1) {
    score = score + 25;
  }

  const fromR = sqRow(move.from);
  const p = board[move.from];
  const k = absPiece(p);
  if (k == 2 || k == 3) {
    if (color > 0 && fromR == 7) { score = score + 12; }
    if (color < 0 && fromR == 0) { score = score + 12; }
  }

  // Cheap MVV-ish: prefer capturing higher value with lower value.
  if (move.flags == 1 || move.flags == 3) {
    const victim = board[move.to];
    score = score + pieceValueAbs(victim) - (pieceValueAbs(p) / 10);
  }
  return score;
}

function pieceValueAbs(p) {
  const k = absPiece(p);
  if (k == 1) { return 100; }
  if (k == 2) { return 320; }
  if (k == 3) { return 330; }
  if (k == 4) { return 500; }
  if (k == 5) { return 900; }
  if (k == 6) { return 20000; }
  return 0;
}

export function pickOpeningMove(board, color, ep, rights, history, seed) {
  const moves = allLegalMoves(board, color, ep, rights);
  if (moves.length == 0) {
    return { move: null, seed: seed };
  }
  const cands = [];
  let oi = 0;
  while (oi < OPENINGS.length) {
    const line = OPENINGS[oi];
    if (history.length < line.length) {
      let match = 1;
      let hi = 0;
      while (hi < history.length) {
        if (history[hi] != line[hi]) {
          match = 0;
        }
        hi = hi + 1;
      }
      if (match == 1) {
        const uci = line[history.length];
        const m = findMoveByUci(moves, uci);
        if (m != null) {
          cands.push(m);
        }
      }
    }
    oi = oi + 1;
  }
  if (cands.length > 0) {
    const s2 = nextSeed(seed);
    const pick = cands[s2 % cands.length];
    return { move: pick, seed: s2 };
  }
  return { move: null, seed: seed };
}

export function pickAiMove(board, color, ep, rights, history, seed) {
  const open = pickOpeningMove(board, color, ep, rights, history, seed);
  if (open.move != null) {
    return open;
  }
  const moves = allLegalMoves(board, color, ep, rights);
  if (moves.length == 0) {
    return { move: null, seed: seed };
  }
  let bestScore = -999999;
  let bests = [];
  let i = 0;
  while (i < moves.length) {
    const sc = scoreMove(board, moves[i], color, ep, rights);
    if (sc > bestScore) {
      bestScore = sc;
      bests = [moves[i]];
    } else {
      if (sc == bestScore) {
        bests.push(moves[i]);
      }
    }
    i = i + 1;
  }
  let s2 = nextSeed(seed + bestScore + moves.length);
  const pick = bests[s2 % bests.length];
  return { move: pick, seed: s2 };
}

/** Last-resort: any legal move, for AI think-time caps. */
export function pickAnyMove(board, color, ep, rights, seed) {
  const moves = allLegalMoves(board, color, ep, rights);
  if (moves.length == 0) {
    return { move: null, seed: seed };
  }
  const s2 = nextSeed(seed);
  return { move: moves[s2 % moves.length], seed: s2 };
}

export function uciOf(move) {
  return moveToUci(move);
}
