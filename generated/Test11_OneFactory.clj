; Test 11: Two classes - one static factory only

class ChessPiece11 {
    def symbol:string ""
    
    Constructor (s:string) {
        symbol = s
    }
    
    sfn Empty:ChessPiece11 () {
        return (new ChessPiece11(" "))
    }
}

class ChessBoard11 {
    def board:[ChessPiece11]
    
    Constructor () {
        this.init()
    }
    
    fn init:void () {
        def i 0
        while (i < 8) {
            push board (ChessPiece11.Empty())
            i = i + 1
        }
    }
}

class Test11 {
    sfn m@(main):void () {
        def b (new ChessBoard11())
        print "Done"
    }
}
