; Test 14: Just add toString method (no isWhite, no ternary)

class ChessPiece14 {
    def symbol:string ""
    
    Constructor (s:string) {
        symbol = s
    }
    
    fn toString:string () {
        return symbol
    }
    
    sfn Empty:ChessPiece14 () {
        return (new ChessPiece14(" "))
    }
    
    sfn King:ChessPiece14 () {
        return (new ChessPiece14("K"))
    }
}

class ChessBoard14 {
    def board:[ChessPiece14]
    
    Constructor () {
        this.init()
    }
    
    fn init:void () {
        def i 0
        while (i < 8) {
            push board (ChessPiece14.Empty())
            i = i + 1
        }
    }
}

class Test14 {
    sfn m@(main):void () {
        def b (new ChessBoard14())
        print "Done"
    }
}
