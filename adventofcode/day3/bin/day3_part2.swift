func ==(l: GridRow, r: GridRow) -> Bool {
  return l === r
}
class GridRow : Equatable  { 
  var values : [Int:Int] = [Int:Int]()
}
func ==(l: Grid, r: Grid) -> Bool {
  return l === r
}
class Grid : Equatable  { 
  var cols : [Int:GridRow] = [Int:GridRow]()
  var minx : Int = 0
  var maxx : Int = 0
  var miny : Int = 0
  var maxy : Int = 0
  var turtle_limit : Int = 0
  var first_largest : Int = 0
  func getValue(x : Int, y : Int) -> Int {
    if ( self.cols[y] != nil ) {
      let col : GridRow? = self.cols[y]
      if ( col!.values[x] != nil ) {
        return (col!.values[x])!;
      }
    }
    return 0;
  }
  func setValue(x : Int, y : Int, value : Int) -> Void {
    if ( (value > self.turtle_limit) && (self.first_largest == 0) ) {
      self.first_largest = value;
    }
    if ( self.cols[y] != nil ) {
      let col : GridRow? = self.cols[y]
      col!.values[x] = value;
    } else {
      let newCol : GridRow = GridRow()
      self.cols[y] = newCol;
      newCol.values[x] = value;
    }
    if ( x < self.minx ) {
      self.minx = x;
    }
    if ( x > self.maxx ) {
      self.maxx = x;
    }
    if ( y < self.miny ) {
      self.miny = y;
    }
    if ( y > self.maxy ) {
      self.maxy = y;
    }
  }
  func getAdjacentSum(x : Int, y : Int) -> Int {
    let v : (( _ : Int,  _ : Int) -> Int) = ({ (dx, dy) ->  Int in 
      return (self).getValue(x : (x + dx), y : (y + dy));
      // captured var x
      // captured var y
    })
    return ((((((v(-1, -1) + v(-1, 0)) + v(-1, 1)) + v(0, -1)) + v(0, 1)) + v(1, -1)) + v(1, 0)) + v(1, 1);
  }
  func printGrid() -> Void {
    var xx : Int = self.minx
    var yy : Int = self.miny
    while (yy <= self.maxy) {
      xx = self.minx;
      var row : [Int] = [Int]()
      while (xx <= self.maxx) {
        row.append((self).getValue(x : xx, y : yy))
        xx = xx + 1;
      }
      print(operatorsOf.map_2(__self : row, cb : ({ (item, index) ->  String in 
        return String(item);
      })).joined(separator:" "))
      yy = yy + 1;
    }
  }
}
func ==(l: day_three_part_two, r: day_three_part_two) -> Bool {
  return l === r
}
class day_three_part_two : Equatable  { 
  class func distance(data : Int) -> Int {
    let myGrid : Grid = Grid()
    myGrid.turtle_limit = data;
    myGrid.setValue(x : 0, y : 0, value : 1)
    var i : Int = 0
    var j : Int = 0
    let moveTurtle : (( _ : Int,  _ : Int,  _ : Int) -> Void) = ({ (dx, dy, steps) ->  Void in 
      var cnt : Int = steps
      while (cnt > 0) {
        i = i + dx;
        j = j + dy;
        let sum : Int = myGrid.getAdjacentSum(x : i, y : j)
        myGrid.setValue(x : i, y : j, value : sum)
        cnt = cnt - 1;
      }
      // captured var i
      // captured var j
      // captured var myGrid
    })
    var step : Int = 2
    while (myGrid.first_largest == 0) {
      moveTurtle(1, 0, 1);
      moveTurtle(0, -1, step - 1);
      moveTurtle(-1, 0, step);
      moveTurtle(0, 1, step);
      moveTurtle(1, 0, step);
      step = step + 2;
    }
    myGrid.printGrid()
    print("the first largest was " + String(myGrid.first_largest))
    return myGrid.turtle_limit;
  }
}
func ==(l: operatorsOf, r: operatorsOf) -> Bool {
  return l === r
}
class operatorsOf : Equatable  { 
  class func map_2(__self : [Int], cb :   @escaping  (( _ : Int,  _ : Int) -> String)) -> [String] {
    /** unused:  let __len : Int = __self.count   **/ 
    var res : [String] = [String]()
    for ( i , it ) in __self.enumerated() {
      res.append(cb(it, i))
    }
    return res;
  }
}
func __main__swift() {
  _ = day_three_part_two.distance(data : 289326)
}
// call the main function
__main__swift()
