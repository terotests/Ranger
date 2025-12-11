; Test 12: Two factories

class ChessPiece12 {
    def symbol:string ""
    
    Constructor (s:string) {
        symbol = s
    }
    
    sfn Empty:ChessPiece12 () {
        return (new ChessPiece12(" "))
    }
    
    sfn King:ChessPiece12 () {
        return (new ChessPiece12("K"))
    }
}

class ChessBoard12 {
    def board:[ChessPiece12]
    
    Constructor () {
        this.init()
    }
    
    fn init:void () {
        def i 0
        while (i < 8) {
            push board (ChessPiece12.Empty())
            i = i + 1
        }
    }
}

class Test12 {
    sfn m@(main):void () {
        def b (new ChessBoard12())
        print "Done"
    }
}
