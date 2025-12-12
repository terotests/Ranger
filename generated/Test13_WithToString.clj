; Test 13: Two factories + toString + isWhite

class ChessPiece13 {
    def symbol:string ""
    def isWhite:boolean true
    
    Constructor (s:string white:boolean) {
        symbol = s
        isWhite = white
    }
    
    fn toString:string () {
        return symbol
    }
    
    sfn Empty:ChessPiece13 () {
        return (new ChessPiece13(" " true))
    }
    
    sfn King:ChessPiece13 (white:boolean) {
        return (new ChessPiece13((? white "K" "k") white))
    }
}

class ChessBoard13 {
    def board:[ChessPiece13]
    
    Constructor () {
        this.init()
    }
    
    fn init:void () {
        def i 0
        while (i < 8) {
            push board (ChessPiece13.Empty())
            i = i + 1
        }
    }
}

class Test13 {
    sfn m@(main):void () {
        def b (new ChessBoard13())
        print "Done"
    }
}
