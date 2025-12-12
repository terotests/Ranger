; Test 10: Full ChessPiece class + ChessBoard with array

class ChessPiece10 {
    def symbol:string ""
    def isWhite:boolean true
    
    Constructor (s:string white:boolean) {
        symbol = s
        isWhite = white
    }
    
    fn toString:string () {
        return symbol
    }
    
    sfn King:ChessPiece10 (white:boolean) {
        return (new ChessPiece10((? white "K" "k") white))
    }
    
    sfn Queen:ChessPiece10 (white:boolean) {
        return (new ChessPiece10((? white "Q" "q") white))
    }
    
    sfn Rook:ChessPiece10 (white:boolean) {
        return (new ChessPiece10((? white "R" "r") white))
    }
    
    sfn Bishop:ChessPiece10 (white:boolean) {
        return (new ChessPiece10((? white "B" "b") white))
    }
    
    sfn Knight:ChessPiece10 (white:boolean) {
        return (new ChessPiece10((? white "N" "n") white))
    }
    
    sfn Pawn:ChessPiece10 (white:boolean) {
        return (new ChessPiece10((? white "P" "p") white))
    }
    
    sfn Empty:ChessPiece10 () {
        return (new ChessPiece10(" " true))
    }
}

class ChessBoard10 {
    def board:[ChessPiece10]
    
    Constructor () {
        this.init()
    }
    
    fn init:void () {
        def i 0
        while (i < 8) {
            push board (ChessPiece10.Empty())
            i = i + 1
        }
    }
}

class Test10 {
    sfn m@(main):void () {
        def b (new ChessBoard10())
        print "Done"
    }
}
