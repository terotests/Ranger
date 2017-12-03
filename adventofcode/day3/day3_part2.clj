

class GridRow {
  def values:[int:int]
}

class Grid {
  def cols:[int:GridRow]
  def minx 0
  def maxx 0
  def miny 0
  def maxy 0
  def turtle_limit 0 
  def first_largest 0
  fn getValue:int (x:int y:int) {
    if( has cols y ) {
      def col (get cols y)
      if( has col.values x ) {
        return (unwrap (get col.values x))
      }  
    }
    return 0
  }
  fn setValue (x:int y:int value:int) {
    if( value > turtle_limit && first_largest == 0) {
      first_largest = value
    }
    if( has cols y ) {
      def col (get cols y)
      set col.values x value
    } {
      def newCol (new GridRow)
      set cols y newCol
      set newCol.values x value
    }
    if( x < minx ) {
      minx = x
    }
    if( x > maxx ) {
      maxx = x
    }
    if( y < miny ) {
      miny = y
    }
    if( y > maxy ) {
      maxy = y
    }
  }
  fn getAdjacentSum:int (x:int y:int) {
    def v (fn:int (dx:int dy:int) {
      return (this.getValue( (x + dx) (y + dy)))
    })
    return ( (v(-1 -1)) + (v(-1 0)) + (v(-1 1)) + (v(0 -1)) + (v(0 1)) + (v(1 -1)) + (v(1 0)) + (v(1 1)) )
  }
  fn printGrid () {
    def xx minx
    def yy miny
    while( yy <= maxy ) {
      xx = minx
      def row:[int]
      while( xx <= maxx ) {
        push row (this.getValue( xx yy ))
        xx = xx + 1
      }
      print ( join (map row {
        return (to_string item)
      } _:[string]) " " )
      yy = yy + 1
    }
  }
}

class day_three_part_two {
  
  static fn distance:int ( data: int ) {

    def myGrid (new Grid)
    myGrid.turtle_limit = data
    myGrid.setValue( 0 0 1)
    
    ; current position
    def i 0
    def j 0
    def moveTurtle (fn (dx:int dy:int steps:int) {
      def cnt steps
      while( cnt > 0 ) {
        i = i + dx
        j = j + dy
        def sum (myGrid.getAdjacentSum( i j))
        myGrid.setValue( i j sum)
        cnt = cnt - 1
      }
    })

    def step 2
    while( myGrid.first_largest == 0 ) {
      moveTurtle( 1 0 1)
      moveTurtle( 0 -1 (step - 1))
      moveTurtle( -1 0 step)
      moveTurtle( 0 1 step)
      moveTurtle( 1 0 step)
      step = step + 2
    }
    myGrid.printGrid()
    print "the first largest was " + myGrid.first_largest
    return myGrid.turtle_limit
  }

  static fn main() {
    day_three_part_two.distance( 289326 )
  }
}