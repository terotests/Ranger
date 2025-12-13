#![allow(unused_parens)]
#![allow(unused_mut)]
#![allow(unused_variables)]
#![allow(non_snake_case)]
#![allow(dead_code)]

#[derive(Clone)]
struct ChessPiece { 
  symbol : String, 
}
impl ChessPiece { 
  
  pub fn new(s : String) ->  ChessPiece {
    let mut me = ChessPiece { 
      symbol:"".to_string(), 
    };
    me.symbol = s;
    return me;
  }
  pub fn Empty() -> ChessPiece {
    return ChessPiece::new(" ".to_string()).clone();
  }
}
#[derive(Clone)]
struct ChessBoard { 
  board : Vec<ChessPiece>, 
}
impl ChessBoard { 
  
  pub fn new() ->  ChessBoard {
    let mut me = ChessBoard { 
      board: Vec::new(), 
    };
    me.init();
    return me;
  }
  fn init(&mut self, ) -> () {
    self.board.push(ChessPiece::Empty());
  }
}
#[derive(Clone)]
struct TwoClassesTest { 
}
impl TwoClassesTest { 
  
  pub fn new() ->  TwoClassesTest {
    let mut me = TwoClassesTest { 
    };
    return me;
  }
}
fn main() {
  /** unused:  let mut b : ChessBoard = ChessBoard::new();   **/ 
  println!( "{}", "Done".to_string() );
}
