; ASCII Chess Board Generator
; This program demonstrates Ranger language capabilities by rendering
; a chess board to the console using ASCII characters

class ChessPiece {
    def symbol:string ""
    def isWhite:boolean true
    
    Constructor (s:string white:boolean) {
        symbol = s
        isWhite = white
    }
    
    fn getSymbol:string () {
        return symbol
    }
    
    ; Static factory methods for creating pieces
    sfn King:ChessPiece (white:boolean) {
        return (new ChessPiece((? white "K" "k") white))
    }
    
    sfn Queen:ChessPiece (white:boolean) {
        return (new ChessPiece((? white "Q" "q") white))
    }
    
    sfn Rook:ChessPiece (white:boolean) {
        return (new ChessPiece((? white "R" "r") white))
    }
    
    sfn Bishop:ChessPiece (white:boolean) {
        return (new ChessPiece((? white "B" "b") white))
    }
    
    sfn Knight:ChessPiece (white:boolean) {
        return (new ChessPiece((? white "N" "n") white))
    }
    
    sfn Pawn:ChessPiece (white:boolean) {
        return (new ChessPiece((? white "P" "p") white))
    }
    
    sfn Empty:ChessPiece () {
        return (new ChessPiece(" " true))
    }
}

class ChessBoard {
    def board:[ChessPiece]
    def size:int 8
    
    Constructor () {
        this.initializeBoard()
    }
    
    fn initializeBoard:void () {
        ; Create empty board first (64 squares)
        def i 0
        while (i < 64) {
            push board (ChessPiece.Empty())
            i = i + 1
        }
        
        ; Set up black pieces (top of board)
        this.setPiece(0 0 (ChessPiece.Rook(false)))
        this.setPiece(1 0 (ChessPiece.Knight(false)))
        this.setPiece(2 0 (ChessPiece.Bishop(false)))
        this.setPiece(3 0 (ChessPiece.Queen(false)))
        this.setPiece(4 0 (ChessPiece.King(false)))
        this.setPiece(5 0 (ChessPiece.Bishop(false)))
        this.setPiece(6 0 (ChessPiece.Knight(false)))
        this.setPiece(7 0 (ChessPiece.Rook(false)))
        
        ; Black pawns
        def col 0
        while (col < 8) {
            this.setPiece(col 1 (ChessPiece.Pawn(false)))
            col = col + 1
        }
        
        ; White pawns
        col = 0
        while (col < 8) {
            this.setPiece(col 6 (ChessPiece.Pawn(true)))
            col = col + 1
        }
        
        ; Set up white pieces (bottom of board)
        this.setPiece(0 7 (ChessPiece.Rook(true)))
        this.setPiece(1 7 (ChessPiece.Knight(true)))
        this.setPiece(2 7 (ChessPiece.Bishop(true)))
        this.setPiece(3 7 (ChessPiece.Queen(true)))
        this.setPiece(4 7 (ChessPiece.King(true)))
        this.setPiece(5 7 (ChessPiece.Bishop(true)))
        this.setPiece(6 7 (ChessPiece.Knight(true)))
        this.setPiece(7 7 (ChessPiece.Rook(true)))
    }
    
    fn getIndex:int (col:int row:int) {
        return ((row * 8) + col)
    }
    
    fn setPiece:void (col:int row:int piece:ChessPiece) {
        def idx (this.getIndex(col row))
        set board idx piece
    }
    
    fn getPiece:ChessPiece (col:int row:int) {
        def idx (this.getIndex(col row))
        return (itemAt board idx)
    }
    
    fn isLightSquare:boolean (col:int row:int) {
        return (((col + row) % 2) == 0)
    }
    
    fn renderBoard:void () {
        print ""
        print "    ASCII Chess Board"
        print "    ================="
        print ""
        
        ; Top border with column letters
        print "    a   b   c   d   e   f   g   h"
        print "  +---+---+---+---+---+---+---+---+"
        
        def row 0
        while (row < 8) {
            def line ((8 - row) + " |")
            
            def col 0
            while (col < 8) {
                def piece (this.getPiece(col row))
                def pieceStr (piece.getSymbol())
                
                ; Add background indicator for light/dark squares
                if (this.isLightSquare(col row)) {
                    line = line + " " + pieceStr + " |"
                } {
                    line = line + "." + pieceStr + ".|"
                }
                
                col = col + 1
            }
            
            line = line + " " + (8 - row)
            print line
            print "  +---+---+---+---+---+---+---+---+"
            
            row = row + 1
        }
        
        print "    a   b   c   d   e   f   g   h"
        print ""
    }
    
    fn renderSimpleBoard:void () {
        print ""
        print "  Simple ASCII Chess Board"
        print ""
        print "  +-----------------+"
        
        def row 0
        while (row < 8) {
            def line ((8 - row) + " | ")
            
            def col 0
            while (col < 8) {
                def piece (this.getPiece(col row))
                line = line + (piece.getSymbol()) + " "
                col = col + 1
            }
            
            line = line + "|"
            print line
            
            row = row + 1
        }
        
        print "  +-----------------+"
        print "    a b c d e f g h"
        print ""
    }
    
    fn renderUnicodeBoard:void () {
        print ""
        print "  Unicode Chess Board (if supported)"
        print ""
        
        def row 0
        while (row < 8) {
            def line ((8 - row) + " ")
            
            def col 0
            while (col < 8) {
                def piece (this.getPiece(col row))
                def symbol (piece.getSymbol())
                
                ; Use unicode chess pieces if available
                def bg (? (this.isLightSquare(col row)) " " ".")
                line = line + bg + symbol
                
                col = col + 1
            }
            
            print line
            row = row + 1
        }
        
        print "  a b c d e f g h"
        print ""
    }
    
    ; Main entry point
    sfn m@(main):void () {
        print "====================================="
        print "  Ranger Chess Board Demo"
        print "  Generated using AI instructions"
        print "====================================="
        
        def chessBoard (new ChessBoard())
        
        ; Show the detailed board
        chessBoard.renderBoard()
        
        ; Show simple version
        chessBoard.renderSimpleBoard()
        
        print "Legend:"
        print "  K/k = King    Q/q = Queen"
        print "  R/r = Rook    B/b = Bishop"
        print "  N/n = Knight  P/p = Pawn"
        print "  Uppercase = White, Lowercase = Black"
        print "  . = Dark square background"
        print ""
        print "====================================="
    }
}

