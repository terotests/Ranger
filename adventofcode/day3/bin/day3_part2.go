package main
import (
  "strconv"
  "fmt"
  "strings"
)

type GoNullable struct { 
  value interface{}
  has_value bool
}

func r_has_key_int64_GridRow( a map[int64]*GridRow, key int64 ) bool { 
  _, ok := a[key]
  return ok

}
func r_get_int64_GridRow( a map[int64]*GridRow, key int64 ) *GoNullable  { 
  res := new(GoNullable)
  v, ok := a[key]
  if ok { 
    res.has_value = true
    res.value = v
    return res
  }
  res.has_value = false
  return res
}
func r_has_key_int64_int64( a map[int64]int64, key int64 ) bool { 
  _, ok := a[key]
  return ok

}
func r_get_int64_int64( a map[int64]int64, key int64 ) *GoNullable  { 
  res := new(GoNullable)
  v, ok := a[key]
  if ok { 
    res.has_value = true
    res.value = v
    return res
  }
  res.has_value = false
  return res
}
type GridRow struct { 
  values map[int64]int64 `json:"values"` 
}

func CreateNew_GridRow() *GridRow {
  me := new(GridRow)
  me.values = make(map[int64]int64)
  return me;
}
type Grid struct { 
  cols map[int64]*GridRow `json:"cols"` 
  minx int64 `json:"minx"` 
  maxx int64 `json:"maxx"` 
  miny int64 `json:"miny"` 
  maxy int64 `json:"maxy"` 
  turtle_limit int64 `json:"turtle_limit"` 
  first_largest int64 `json:"first_largest"` 
}

func CreateNew_Grid() *Grid {
  me := new(Grid)
  me.cols = make(map[int64]*GridRow)
  me.minx = int64(0)
  me.maxx = int64(0)
  me.miny = int64(0)
  me.maxy = int64(0)
  me.turtle_limit = int64(0)
  me.first_largest = int64(0)
  return me;
}
func (this *Grid) getValue (x int64, y int64) int64 {
  if  r_has_key_int64_GridRow(this.cols, y) {
    var col *GoNullable = new(GoNullable); 
    col = r_get_int64_GridRow(this.cols, y);
    if  r_has_key_int64_int64(col.value.(*GridRow).values, x) {
      return (r_get_int64_int64(col.value.(*GridRow).values, x)).value.(int64)
    }
  }
  return int64(0)
}
func (this *Grid) setValue (x int64, y int64, value int64) () {
  if  (value > this.turtle_limit) && (this.first_largest == int64(0)) {
    this.first_largest = value; 
  }
  if  r_has_key_int64_GridRow(this.cols, y) {
    var col *GoNullable = new(GoNullable); 
    col = r_get_int64_GridRow(this.cols, y);
    col.value.(*GridRow).values[x] = value;
  } else {
    var newCol *GridRow= CreateNew_GridRow();
    this.cols[y] = newCol;
    newCol.values[x] = value;
  }
  if  x < this.minx {
    this.minx = x; 
  }
  if  x > this.maxx {
    this.maxx = x; 
  }
  if  y < this.miny {
    this.miny = y; 
  }
  if  y > this.maxy {
    this.maxy = y; 
  }
}
func (this *Grid) getAdjacentSum (x int64, y int64) int64 {
  var v func(int64, int64) int64= func (dx int64, dy int64) int64 {
    return (this).getValue((x + dx), (y + dy))
  };
  return ((((((v(int64(-1), int64(-1)) + v(int64(-1), int64(0))) + v(int64(-1), int64(1))) + v(int64(0), int64(-1))) + v(int64(0), int64(1))) + v(int64(1), int64(-1))) + v(int64(1), int64(0))) + v(int64(1), int64(1))
}
func (this *Grid) printGrid () () {
  var xx int64= this.minx;
  var yy int64= this.miny;
  for yy <= this.maxy {
    xx = this.minx; 
    var row []int64 = make([]int64, 0);
    for xx <= this.maxx {
      row = append(row,(this).getValue(xx, yy)); 
      xx = xx + int64(1); 
    }
    fmt.Println( strings.Join(operatorsOf_static_map_2(row, func (item int64, index int64) string {
      return strconv.FormatInt(item, 10)
    }), " ") )
    yy = yy + int64(1); 
  }
}
type day_three_part_two struct { 
}

func CreateNew_day_three_part_two() *day_three_part_two {
  me := new(day_three_part_two)
  return me;
}
func day_three_part_two_static_distance(data int64) int64 {
  var myGrid *Grid= CreateNew_Grid();
  myGrid.turtle_limit = data; 
  myGrid.setValue(int64(0), int64(0), int64(1));
  var i int64= int64(0);
  var j int64= int64(0);
  var moveTurtle func(int64, int64, int64) ()= func (dx int64, dy int64, steps int64) () {
    var cnt int64= steps;
    for cnt > int64(0) {
      i = i + dx; 
      j = j + dy; 
      var sum int64= myGrid.getAdjacentSum(i, j);
      myGrid.setValue(i, j, sum);
      cnt = cnt - int64(1); 
    }
  };
  var step int64= int64(2);
  for myGrid.first_largest == int64(0) {
    moveTurtle(int64(1), int64(0), int64(1));
    moveTurtle(int64(0), int64(-1), step - int64(1));
    moveTurtle(int64(-1), int64(0), step);
    moveTurtle(int64(0), int64(1), step);
    moveTurtle(int64(1), int64(0), step);
    step = step + int64(2); 
  }
  myGrid.printGrid();
  fmt.Println( strings.Join([]string{ "the first largest was ",strconv.FormatInt(myGrid.first_largest, 10) }, "") )
  return myGrid.turtle_limit
}
func main() {
  day_three_part_two_static_distance(int64(289326));
}
type operatorsOf struct { 
}

func CreateNew_operatorsOf() *operatorsOf {
  me := new(operatorsOf)
  return me;
}
func operatorsOf_static_map_2(__self []int64, cb func(int64, int64) string) []string {
  /** unused:  __len*/
  var res []string = make([]string, 0);
  var i int64 = 0;  
  for ; i < int64(len(__self)) ; i++ {
    it := __self[i];
    res = append(res,cb(it, i)); 
  }
  return res
}
