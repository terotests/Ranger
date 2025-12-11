; Test 15: Without toString (same as Test14 but no toString)

class ChessPiece15 {
    def symbol:string ""
    
    Constructor (s:string) {
        symbol = s
    }
    
    sfn Empty:ChessPiece15 () {
        return (new ChessPiece15(" "))
    }
    
    sfn King:ChessPiece15 () {
        return (new ChessPiece15("K"))
    }
}

class ChessBoard15 {
    def board:[ChessPiece15]
    
    Constructor () {
        this.init()
    }
    
    fn init:void () {
        def i 0
        while (i < 8) {
            push board (ChessPiece15.Empty())
            i = i + 1
        }
    }
}

class Test15 {
    sfn m@(main):void () {
        def b (new ChessBoard15())
        print "Done"
    }
}
