; Simple ASCII Chess Board Generator
; A minimal version to test Ranger compilation

class ChessBoard {
    
    sfn m@(main):void () {
        print "====================================="
        print "  Ranger Chess Board Demo"
        print "  Generated using AI instructions"
        print "====================================="
        print ""
        
        ; Draw simple chess board
        print "    a   b   c   d   e   f   g   h"
        print "  +---+---+---+---+---+---+---+---+"
        print "8 | r | n | b | q | k | b | n | r | 8"
        print "  +---+---+---+---+---+---+---+---+"
        print "7 | p | p | p | p | p | p | p | p | 7"
        print "  +---+---+---+---+---+---+---+---+"
        print "6 |   |   |   |   |   |   |   |   | 6"
        print "  +---+---+---+---+---+---+---+---+"
        print "5 |   |   |   |   |   |   |   |   | 5"
        print "  +---+---+---+---+---+---+---+---+"
        print "4 |   |   |   |   |   |   |   |   | 4"
        print "  +---+---+---+---+---+---+---+---+"
        print "3 |   |   |   |   |   |   |   |   | 3"
        print "  +---+---+---+---+---+---+---+---+"
        print "2 | P | P | P | P | P | P | P | P | 2"
        print "  +---+---+---+---+---+---+---+---+"
        print "1 | R | N | B | Q | K | B | N | R | 1"
        print "  +---+---+---+---+---+---+---+---+"
        print "    a   b   c   d   e   f   g   h"
        print ""
        print "Legend:"
        print "  K/k = King    Q/q = Queen"
        print "  R/r = Rook    B/b = Bishop"
        print "  N/n = Knight  P/p = Pawn"
        print "  Uppercase = White, Lowercase = Black"
        print ""
        print "====================================="
    }
}
