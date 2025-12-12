; Test 9: Multiple static factory methods in one class

class ChessPiece9 {
    def symbol:string ""
    def isWhite:boolean true
    
    Constructor (s:string white:boolean) {
        symbol = s
        isWhite = white
    }
    
    sfn King:ChessPiece9 (white:boolean) {
        return (new ChessPiece9((? white "K" "k") white))
    }
    
    sfn Queen:ChessPiece9 (white:boolean) {
        return (new ChessPiece9((? white "Q" "q") white))
    }
    
    sfn Rook:ChessPiece9 (white:boolean) {
        return (new ChessPiece9((? white "R" "r") white))
    }
    
    sfn Bishop:ChessPiece9 (white:boolean) {
        return (new ChessPiece9((? white "B" "b") white))
    }
    
    sfn Knight:ChessPiece9 (white:boolean) {
        return (new ChessPiece9((? white "N" "n") white))
    }
    
    sfn Pawn:ChessPiece9 (white:boolean) {
        return (new ChessPiece9((? white "P" "p") white))
    }
    
    sfn Empty:ChessPiece9 () {
        return (new ChessPiece9(" " true))
    }
}

class Test9 {
    sfn m@(main):void () {
        def king (ChessPiece9.King(true))
        def queen (ChessPiece9.Queen(false))
        print king.symbol
        print queen.symbol
        print "Done"
    }
}
