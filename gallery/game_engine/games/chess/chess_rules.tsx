/// <reference path="../../scripting/game.d.ts" />
//
// Chess rules: board, legal moves, check / mate / stalemate,
// castling, en passant, and queen promotion.
//
// Piece codes: 0 empty; 1..6 white P N B R Q K; -1..-6 black.

export const EMPTY = 0;
export const W_PAWN = 1;
export const W_KNIGHT = 2;
export const W_BISHOP = 3;
export const W_ROOK = 4;
export const W_QUEEN = 5;
export const W_KING = 6;
export const B_PAWN = -1;
export const B_KNIGHT = -2;
export const B_BISHOP = -3;
export const B_ROOK = -4;
export const B_QUEEN = -5;
export const B_KING = -6;

export function absPiece(p) {
  if (p < 0) {
    return 0 - p;
  }
  return p;
}

export function pieceColor(p) {
  if (p > 0) {
    return 1;
  }
  if (p < 0) {
    return -1;
  }
  return 0;
}

// Keep board indices as integers — `/` is real division in the TSX interpreter
// (use Math.floor; there is no `idiv` in game scripts).
export function sq(col, row) {
  return Math.floor(row) * 8 + Math.floor(col);
}

export function sqCol(s) {
  return Math.floor(s) % 8;
}

export function sqRow(s) {
  return Math.floor(Math.floor(s) / 8);
}

export function cloneBoard(board) {
  const out = [];
  let i = 0;
  while (i < 64) {
    out.push(board[i]);
    i = i + 1;
  }
  return out;
}

export function startBoard() {
  return [
    B_ROOK, B_KNIGHT, B_BISHOP, B_QUEEN, B_KING, B_BISHOP, B_KNIGHT, B_ROOK,
    B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN,
    W_ROOK, W_KNIGHT, W_BISHOP, W_QUEEN, W_KING, W_BISHOP, W_KNIGHT, W_ROOK
  ];
}

export function pieceValue(p) {
  const k = absPiece(p);
  if (k == 1) { return 100; }
  if (k == 2) { return 320; }
  if (k == 3) { return 330; }
  if (k == 4) { return 500; }
  if (k == 5) { return 900; }
  if (k == 6) { return 20000; }
  return 0;
}

export function sheetCol(p) {
  const k = absPiece(p);
  if (k <= 0) { return 0; }
  return k - 1;
}

export function sheetRow(p) {
  if (p < 0) { return 1; }
  return 0;
}

function onBoard(col, row) {
  if (col < 0) { return 0; }
  if (row < 0) { return 0; }
  if (col > 7) { return 0; }
  if (row > 7) { return 0; }
  return 1;
}

function addMove(moves, srcSq, to, flags) {
  moves.push({ from: srcSq, to: to, flags: flags });
}

function slide(board, moves, srcSq, color, dcol, drow) {
  let col = sqCol(srcSq) + dcol;
  let row = sqRow(srcSq) + drow;
  while (onBoard(col, row) == 1) {
    const t = sq(col, row);
    const dest = board[t];
    if (dest == 0) {
      addMove(moves, srcSq, t, 0);
    } else {
      if (pieceColor(dest) != color) {
        addMove(moves, srcSq, t, 1);
      }
      return;
    }
    col = col + dcol;
    row = row + drow;
  }
}

function genPseudo(board, srcSq, ep) {
  const moves = [];
  const p = board[srcSq];
  if (p == 0) {
    return moves;
  }
  const color = pieceColor(p);
  const kind = absPiece(p);
  const col = sqCol(srcSq);
  const row = sqRow(srcSq);

  if (kind == 1) {
    const dir = 0 - color;
    let sr = 1;
    if (color > 0) {
      sr = 6;
    } else {
      sr = 1;
    }
    const r1 = row + dir;
    if (onBoard(col, r1) == 1) {
      const t1 = sq(col, r1);
      if (board[t1] == 0) {
        let fl = 0;
        if (r1 == 0) { fl = 2; }
        if (r1 == 7) { fl = 2; }
        addMove(moves, srcSq, t1, fl);
        if (row == sr) {
          const r2 = row + dir + dir;
          const t2 = sq(col, r2);
          if (board[t2] == 0) {
            addMove(moves, srcSq, t2, 4);
          }
        }
      }
    }
    let dc = -1;
    while (dc <= 1) {
      if (dc != 0) {
        const c2 = col + dc;
        const r2 = row + dir;
        if (onBoard(c2, r2) == 1) {
          const t = sq(c2, r2);
          const dest = board[t];
          if (dest != 0) {
            if (pieceColor(dest) != color) {
              let fl = 1;
              if (r2 == 0) { fl = 3; }
              if (r2 == 7) { fl = 3; }
              addMove(moves, srcSq, t, fl);
            }
          } else {
            if (ep == t) {
              addMove(moves, srcSq, t, 5);
            }
          }
        }
      }
      dc = dc + 1;
    }
    return moves;
  }

  if (kind == 2) {
    const kn = [
      1, 2, 1, -2, -1, 2, -1, -2,
      2, 1, 2, -1, -2, 1, -2, -1
    ];
    let i = 0;
    while (i < 16) {
      const c2 = col + kn[i];
      const r2 = row + kn[i + 1];
      if (onBoard(c2, r2) == 1) {
        const t = sq(c2, r2);
        const dest = board[t];
        if (dest == 0) {
          addMove(moves, srcSq, t, 0);
        } else {
          if (pieceColor(dest) != color) {
            addMove(moves, srcSq, t, 1);
          }
        }
      }
      i = i + 2;
    }
    return moves;
  }

  if (kind == 3) {
    slide(board, moves, srcSq, color, 1, 1);
    slide(board, moves, srcSq, color, 1, -1);
    slide(board, moves, srcSq, color, -1, 1);
    slide(board, moves, srcSq, color, -1, -1);
    return moves;
  }

  if (kind == 4) {
    slide(board, moves, srcSq, color, 1, 0);
    slide(board, moves, srcSq, color, -1, 0);
    slide(board, moves, srcSq, color, 0, 1);
    slide(board, moves, srcSq, color, 0, -1);
    return moves;
  }

  if (kind == 5) {
    slide(board, moves, srcSq, color, 1, 0);
    slide(board, moves, srcSq, color, -1, 0);
    slide(board, moves, srcSq, color, 0, 1);
    slide(board, moves, srcSq, color, 0, -1);
    slide(board, moves, srcSq, color, 1, 1);
    slide(board, moves, srcSq, color, 1, -1);
    slide(board, moves, srcSq, color, -1, 1);
    slide(board, moves, srcSq, color, -1, -1);
    return moves;
  }

  if (kind == 6) {
    let dr = -1;
    while (dr <= 1) {
      let dc = -1;
      while (dc <= 1) {
        if (dc != 0 || dr != 0) {
          const c2 = col + dc;
          const r2 = row + dr;
          if (onBoard(c2, r2) == 1) {
            const t = sq(c2, r2);
            const dest = board[t];
            if (dest == 0) {
              addMove(moves, srcSq, t, 0);
            } else {
              if (pieceColor(dest) != color) {
                addMove(moves, srcSq, t, 1);
              }
            }
          }
        }
        dc = dc + 1;
      }
      dr = dr + 1;
    }
  }
  return moves;
}

export function findKing(board, color) {
  const want = color * 6;
  let i = 0;
  while (i < 64) {
    if (board[i] == want) {
      return i;
    }
    i = i + 1;
  }
  return -1;
}

export function isSquareAttacked(board, target, byColor) {
  const tcol = sqCol(target);
  const trow = sqRow(target);
  let srcSq = 0;
  while (srcSq < 64) {
    const p = board[srcSq];
    if (pieceColor(p) == byColor) {
      const kind = absPiece(p);
      // Pawns attack diagonally only (not their forward push).
      if (kind == 1) {
        const dir = 0 - byColor;
        const fcol = sqCol(srcSq);
        const frow = sqRow(srcSq);
        if (frow + dir == trow) {
          if (fcol - 1 == tcol || fcol + 1 == tcol) {
            return 1;
          }
        }
      } else {
        const pseudo = genPseudo(board, srcSq, -1);
        let i = 0;
        while (i < pseudo.length) {
          if (pseudo[i].to == target) {
            return 1;
          }
          i = i + 1;
        }
      }
    }
    srcSq = srcSq + 1;
  }
  return 0;
}

export function inCheck(board, color) {
  const k = findKing(board, color);
  if (k < 0) {
    return 1;
  }
  return isSquareAttacked(board, k, 0 - color);
}

function addCastling(board, moves, color, rights) {
  let row = 0;
  if (color > 0) {
    row = 7;
  }
  const kingFrom = sq(4, row);
  if (board[kingFrom] != color * 6) {
    return;
  }
  const enemy = 0 - color;
  if (inCheck(board, color) == 1) {
    return;
  }
  // King side
  let canK = 0;
  if (color > 0) {
    if ((rights & 1) != 0) { canK = 1; }
  } else {
    if ((rights & 4) != 0) { canK = 1; }
  }
  if (canK == 1) {
    if (board[sq(5, row)] == 0 && board[sq(6, row)] == 0) {
      if (isSquareAttacked(board, sq(5, row), enemy) == 0) {
        if (isSquareAttacked(board, sq(6, row), enemy) == 0) {
          addMove(moves, kingFrom, sq(6, row), 6);
        }
      }
    }
  }
  // Queen side
  let canQ = 0;
  if (color > 0) {
    if ((rights & 2) != 0) { canQ = 1; }
  } else {
    if ((rights & 8) != 0) { canQ = 1; }
  }
  if (canQ == 1) {
    if (board[sq(3, row)] == 0 && board[sq(2, row)] == 0 && board[sq(1, row)] == 0) {
      if (isSquareAttacked(board, sq(3, row), enemy) == 0) {
        if (isSquareAttacked(board, sq(2, row), enemy) == 0) {
          addMove(moves, kingFrom, sq(2, row), 7);
        }
      }
    }
  }
}

export function legalMovesFrom(board, srcSq, color, ep, rights) {
  const out = [];
  if (pieceColor(board[srcSq]) != color) {
    return out;
  }
  const pseudo = genPseudo(board, srcSq, ep);
  let i = 0;
  while (i < pseudo.length) {
    const m = pseudo[i];
    const next = applyMoveRaw(board, m, color, ep);
    if (inCheck(next.board, color) == 0) {
      out.push(m);
    }
    i = i + 1;
  }
  if (absPiece(board[srcSq]) == 6) {
    const castle = [];
    addCastling(board, castle, color, rights);
    i = 0;
    while (i < castle.length) {
      const m = castle[i];
      const next = applyMoveRaw(board, m, color, ep);
      if (inCheck(next.board, color) == 0) {
        out.push(m);
      }
      i = i + 1;
    }
  }
  return out;
}

export function allLegalMoves(board, color, ep, rights) {
  const out = [];
  let srcSq = 0;
  while (srcSq < 64) {
    if (pieceColor(board[srcSq]) == color) {
      const ms = legalMovesFrom(board, srcSq, color, ep, rights);
      let i = 0;
      while (i < ms.length) {
        out.push(ms[i]);
        i = i + 1;
      }
    }
    srcSq = srcSq + 1;
  }
  return out;
}

// flags: 0 quiet, 1 capture, 2 promote, 3 promote+capture,
//        4 double pawn, 5 en passant, 6 castle K, 7 castle Q
export function applyMoveRaw(board, move, color, ep) {
  const b = cloneBoard(board);
  const srcSq = move.from;
  const to = move.to;
  const flags = move.flags;
  const p = b[srcSq];
  b[srcSq] = 0;
  b[to] = p;

  if (flags == 5) {
    // En passant capture: remove pawn behind target.
    const dir = color;
    const cap = to + dir * 8;
    b[cap] = 0;
  }
  if (flags == 2 || flags == 3) {
    b[to] = color * 5;
  }
  if (flags == 6) {
    const row = sqRow(srcSq);
    b[sq(7, row)] = 0;
    b[sq(5, row)] = color * 4;
  }
  if (flags == 7) {
    const row = sqRow(srcSq);
    b[sq(0, row)] = 0;
    b[sq(3, row)] = color * 4;
  }

  let newEp = -1;
  if (flags == 4) {
    newEp = Math.floor((srcSq + to) / 2);
  }

  return { board: b, ep: newEp };
}

export function updateRights(rights, move, boardBefore) {
  let r = rights;
  const srcSq = move.from;
  const to = move.to;
  const p = boardBefore[srcSq];
  if (p == W_KING) { r = r & (15 - 1 - 2); }
  if (p == B_KING) { r = r & (15 - 4 - 8); }
  if (p == W_ROOK && srcSq == 63) { r = r & (15 - 1); }
  if (p == W_ROOK && srcSq == 56) { r = r & (15 - 2); }
  if (p == B_ROOK && srcSq == 7) { r = r & (15 - 4); }
  if (p == B_ROOK && srcSq == 0) { r = r & (15 - 8); }
  if (to == 63) { r = r & (15 - 1); }
  if (to == 56) { r = r & (15 - 2); }
  if (to == 7) { r = r & (15 - 4); }
  if (to == 0) { r = r & (15 - 8); }
  return r;
}

export function applyFullMove(board, move, color, ep, rights) {
  const raw = applyMoveRaw(board, move, color, ep);
  const nr = updateRights(rights, move, board);
  return {
    board: raw.board,
    ep: raw.ep,
    rights: nr,
    color: 0 - color
  };
}

export function materialScore(board) {
  let s = 0;
  let i = 0;
  while (i < 64) {
    const p = board[i];
    if (p > 0) {
      s = s + pieceValue(p);
    }
    if (p < 0) {
      s = s - pieceValue(p);
    }
    i = i + 1;
  }
  return s;
}

export function gameStatus(board, color, ep, rights) {
  const moves = allLegalMoves(board, color, ep, rights);
  const check = inCheck(board, color);
  if (moves.length == 0) {
    if (check == 1) {
      return "mate";
    }
    return "stalemate";
  }
  if (check == 1) {
    return "check";
  }
  return "ok";
}

export function moveToUci(move) {
  const files = "abcdefgh";
  const fc = files.substring(sqCol(move.from), sqCol(move.from) + 1);
  const fr = "" + (8 - sqRow(move.from));
  const tc = files.substring(sqCol(move.to), sqCol(move.to) + 1);
  const tr = "" + (8 - sqRow(move.to));
  return fc + fr + tc + tr;
}

export function findMoveByUci(moves, uci) {
  let i = 0;
  while (i < moves.length) {
    if (moveToUci(moves[i]) == uci) {
      return moves[i];
    }
    i = i + 1;
  }
  return null;
}
