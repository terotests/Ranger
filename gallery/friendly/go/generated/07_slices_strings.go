package main
import (
  "fmt"
  "strconv"
)
type TextTools struct { 
}

func CreateNew_TextTools() *TextTools {
  me := new(TextTools)
  return me;
}
func (this *TextTools) greet (name string) string {
  return "hello " + name
}
func (this *TextTools) total (xs []int64) int64 {
  var acc int64= int64(0);
  var i int64 = 0;  
  for ; i < int64(len(xs)) ; i++ {
    v := xs[i];
    acc = acc + v; 
  }
  return acc
}
func (this *TextTools) firstChar (s string) string {
  if  int64(len([]rune(s))) == int64(0) {
    return ""
  }
  return string([]rune(s)[int64(0):int64(1)])
}
func (this *TextTools) twice (xs []int64) int64 {
  return this.total(xs) + this.total(xs)
}
type SliceMain struct { 
}

func CreateNew_SliceMain() *SliceMain {
  me := new(SliceMain)
  return me;
}
func main() {
  var t *TextTools= CreateNew_TextTools(); _ = t
  fmt.Println( t.greet("ada") )
  var xs []int64= []int64 {int64(1), int64(2), int64(3)};
  fmt.Println( "twice " + strconv.FormatInt(t.twice(xs), 10) )
  fmt.Println( "first " + t.firstChar("grace") )
}
