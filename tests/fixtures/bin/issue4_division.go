package main
import (
  "strconv"
  "fmt"
)

type GoNullable struct {
  value interface{}
  has_value bool
}

type MathTest struct { 
}

func CreateNew_MathTest() *MathTest {
  me := new(MathTest)
  return me;
}
func main() {
  var a int64= int64(10);
  var b int64= int64(3);
  var result float64= float64(a) / float64(b);
  fmt.Println( strconv.FormatFloat(result,'f', 6, 64) )
  var x int64= int64(7);
  var y int64= int64(2);
  var ratio float64= float64(x) / float64(y);
  fmt.Println( strconv.FormatFloat(ratio,'f', 6, 64) )
}
