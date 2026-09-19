; Test 8: Two classes - minimal ChessPiece and ChessBoard

class ChessPiece8 {
    def symbol:string ""
    
    Constructor (s:string) {
        symbol = s
    }
    
    sfn Empty:ChessPiece8 () {
        return (new ChessPiece8(" "))
    }
}

class ChessBoard8 {
    def board:[ChessPiece8]
    
    Constructor () {
        this.init()
    }
    
    fn init:void () {
        push board (ChessPiece8.Empty())
    }
}

class Test8 {
    sfn m@(main):void () {
        def b (new ChessBoard8())
        print "Done"
    }
}
