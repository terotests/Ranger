#!/usr/bin/env node
class ChessPiece  {
  constructor(s, white) {
    this.symbol = "";
    this.isWhite = true;
    this.symbol = s;
    this.isWhite = white;
  }
  getSymbol () {
    return this.symbol;
  };
}
ChessPiece.King = function(white) {
  return new ChessPiece(white ? "K" : "k", white);
};
ChessPiece.Queen = function(white) {
  return new ChessPiece(white ? "Q" : "q", white);
};
ChessPiece.Rook = function(white) {
  return new ChessPiece(white ? "R" : "r", white);
};
ChessPiece.Bishop = function(white) {
  return new ChessPiece(white ? "B" : "b", white);
};
ChessPiece.Knight = function(white) {
  return new ChessPiece(white ? "N" : "n", white);
};
ChessPiece.Pawn = function(white) {
  return new ChessPiece(white ? "P" : "p", white);
};
ChessPiece.Empty = function() {
  return new ChessPiece(" ", true);
};
class ChessBoard  {
  constructor() {
    this.board = [];
    this.size = 8;     /** note: unused */
    this.initializeBoard();
  }
  initializeBoard () {
    let i = 0;
    while (i < 64) {
      this.board.push(ChessPiece.Empty());
      i = i + 1;
    };
    this.setPiece(0, 0, ChessPiece.Rook(false));
    this.setPiece(1, 0, ChessPiece.Knight(false));
    this.setPiece(2, 0, ChessPiece.Bishop(false));
    this.setPiece(3, 0, ChessPiece.Queen(false));
    this.setPiece(4, 0, ChessPiece.King(false));
    this.setPiece(5, 0, ChessPiece.Bishop(false));
    this.setPiece(6, 0, ChessPiece.Knight(false));
    this.setPiece(7, 0, ChessPiece.Rook(false));
    let col = 0;
    while (col < 8) {
      this.setPiece(col, 1, ChessPiece.Pawn(false));
      col = col + 1;
    };
    col = 0;
    while (col < 8) {
      this.setPiece(col, 6, ChessPiece.Pawn(true));
      col = col + 1;
    };
    this.setPiece(0, 7, ChessPiece.Rook(true));
    this.setPiece(1, 7, ChessPiece.Knight(true));
    this.setPiece(2, 7, ChessPiece.Bishop(true));
    this.setPiece(3, 7, ChessPiece.Queen(true));
    this.setPiece(4, 7, ChessPiece.King(true));
    this.setPiece(5, 7, ChessPiece.Bishop(true));
    this.setPiece(6, 7, ChessPiece.Knight(true));
    this.setPiece(7, 7, ChessPiece.Rook(true));
  };
  getIndex (col, row) {
    return (row * 8) + col;
  };
  setPiece (col, row, piece) {
    const idx = this.getIndex(col, row);
    this.board[idx] = piece;
  };
  getPiece (col, row) {
    const idx = this.getIndex(col, row);
    return this.board[idx];
  };
  isLightSquare (col, row) {
    return ((col + row) % 2) == 0;
  };
  renderBoard () {
    console.log("");
    console.log("    ASCII Chess Board");
    console.log("    =================");
    console.log("");
    console.log("    a   b   c   d   e   f   g   h");
    console.log("  +---+---+---+---+---+---+---+---+");
    let row = 0;
    while (row < 8) {
      let line = (8 - row) + " |";
      let col = 0;
      while (col < 8) {
        const piece = this.getPiece(col, row);
        const pieceStr = piece.getSymbol();
        if ( this.isLightSquare(col, row) ) {
          line = ((line + " ") + pieceStr) + " |";
        } else {
          line = ((line + ".") + pieceStr) + ".|";
        }
        col = col + 1;
      };
      line = (line + " ") + (8 - row);
      console.log(line);
      console.log("  +---+---+---+---+---+---+---+---+");
      row = row + 1;
    };
    console.log("    a   b   c   d   e   f   g   h");
    console.log("");
  };
  renderSimpleBoard () {
    console.log("");
    console.log("  Simple ASCII Chess Board");
    console.log("");
    console.log("  +-----------------+");
    let row = 0;
    while (row < 8) {
      let line = (8 - row) + " | ";
      let col = 0;
      while (col < 8) {
        const piece = this.getPiece(col, row);
        line = (line + piece.getSymbol()) + " ";
        col = col + 1;
      };
      line = line + "|";
      console.log(line);
      row = row + 1;
    };
    console.log("  +-----------------+");
    console.log("    a b c d e f g h");
    console.log("");
  };
  renderUnicodeBoard () {
    console.log("");
    console.log("  Unicode Chess Board (if supported)");
    console.log("");
    let row = 0;
    while (row < 8) {
      let line = (8 - row) + " ";
      let col = 0;
      while (col < 8) {
        const piece = this.getPiece(col, row);
        const symbol = piece.getSymbol();
        const bg = this.isLightSquare(col, row) ? " " : ".";
        line = (line + bg) + symbol;
        col = col + 1;
      };
      console.log(line);
      row = row + 1;
    };
    console.log("  a b c d e f g h");
    console.log("");
  };
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  console.log("=====================================");
  console.log("  Ranger Chess Board Demo");
  console.log("  Generated using AI instructions");
  console.log("=====================================");
  const chessBoard = new ChessBoard();
  chessBoard.renderBoard();
  chessBoard.renderSimpleBoard();
  console.log("Legend:");
  console.log("  K/k = King    Q/q = Queen");
  console.log("  R/r = Rook    B/b = Bishop");
  console.log("  N/n = Knight  P/p = Pawn");
  console.log("  Uppercase = White, Lowercase = Black");
  console.log("  . = Dark square background");
  console.log("");
  console.log("=====================================");
}
__js_main();
