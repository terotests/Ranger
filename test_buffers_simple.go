package main
import (
  "fmt"
  "strconv"
)

type GoNullable struct {
  value interface{}
  has_value bool
}

type Main struct { 
}

func CreateNew_Main() *Main {
  me := new(Main)
  return me;
}
func main() {
  fmt.Println( "=== int_buffer Test ===" )
  fmt.Println( "Test 1: Allocating int_buffer of 5 elements" )
  var buf []int64= make([]int64, int64(5));
  fmt.Println( "int_buffer length: " + (strconv.FormatInt((int64(len(buf))), 10)) )
  fmt.Println( "Test 2: Setting and getting int64 values" )
  buf[int64(0)] = int64(100)
  buf[int64(1)] = int64(200)
  buf[int64(2)] = int64(300)
  var val0 int64= buf[int64(0)];
  var val1 int64= buf[int64(1)];
  var val2 int64= buf[int64(2)];
  fmt.Println( ("Value 0: " + (strconv.FormatInt(val0, 10))) + " (expected 100)" )
  fmt.Println( ("Value 1: " + (strconv.FormatInt(val1, 10))) + " (expected 200)" )
  fmt.Println( ("Value 2: " + (strconv.FormatInt(val2, 10))) + " (expected 300)" )
  fmt.Println( "=== double_buffer Test ===" )
  fmt.Println( "Test 3: Allocating double_buffer of 3 elements" )
  var dbuf []float64= make([]float64, int64(3));
  fmt.Println( "double_buffer length: " + (strconv.FormatInt((int64(len(dbuf))), 10)) )
  fmt.Println( "Test 4: Setting and getting float64 values" )
  dbuf[int64(0)] = 3.14
  dbuf[int64(1)] = 2.71
  dbuf[int64(2)] = 1.41
  var d0 float64= dbuf[int64(0)];
  var d1 float64= dbuf[int64(1)];
  var d2 float64= dbuf[int64(2)];
  fmt.Println( "Double 0: " + (strconv.FormatFloat(d0,'f', 6, 64)) )
  fmt.Println( "Double 1: " + (strconv.FormatFloat(d1,'f', 6, 64)) )
  fmt.Println( "Double 2: " + (strconv.FormatFloat(d2,'f', 6, 64)) )
  fmt.Println( "=== All tests completed ===" )
}
